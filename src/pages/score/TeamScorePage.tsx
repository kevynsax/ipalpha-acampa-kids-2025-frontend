import { useMemo, useState } from "react";
import { deleteScore, resetScore, type ScoreEntry } from "../../api/scores";
import { contrastText } from "../../api/teams";
import Breadcrumbs from "../../components/Breadcrumbs";
import { useConfirm } from "../../components/ConfirmDialog";
import { useCollectionOrEmpty } from "../../store";
import { canDeleteLine, fmtPoints, KIND_META, lineKind, ScoreLogList, summarizeEvents, useEventMap, useTeamMap, type KindFilter, type LineKind } from "./scoreLog";

interface Props {
  token: string;
  teamId: string;
  userId: string;
  canEdit: boolean;
  canScan: boolean;
  onBack: () => void;
  onEvent: (eventId: string) => void;
}

const KINDS: LineKind[] = ["scan", "add", "remove", "reset"];

/**
 * Placar → Time: where this team's points came from. Total, a breakdown by
 * kind (scans / given / taken / resets), the events it scored in, and the
 * full timeline of its lines. Organizers may also zero the team here.
 */
export default function TeamScorePage({ token, teamId, userId, canEdit, canScan, onBack, onEvent }: Props) {
  const scores = useCollectionOrEmpty("scores");
  const teams = useCollectionOrEmpty("teams");
  const events = useCollectionOrEmpty("events");
  const campers = useCollectionOrEmpty("campers");
  const teamMap = useTeamMap(teams);
  const eventMap = useEventMap(events);
  const confirm = useConfirm();
  const team = teamMap.get(teamId);

  const [kind, setKind] = useState<KindFilter>("all");
  const [busy, setBusy] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mine = useMemo(() => scores.filter((e) => e.teamId === teamId), [scores, teamId]);
  const total = useMemo(() => mine.reduce((s, e) => s + e.points, 0), [mine]);
  const rank = useMemo(() => {
    const totals = new Map<string, number>();
    for (const e of scores) totals.set(e.teamId, (totals.get(e.teamId) ?? 0) + e.points);
    const ranked = teams.slice().sort((a, b) => (totals.get(b.id) ?? 0) - (totals.get(a.id) ?? 0) || a.order - b.order);
    return ranked.findIndex((t) => t.id === teamId) + 1;
  }, [scores, teams, teamId]);
  const byKind = useMemo(() => {
    const m: Record<LineKind, { n: number; pts: number }> = { scan: { n: 0, pts: 0 }, add: { n: 0, pts: 0 }, remove: { n: 0, pts: 0 }, reset: { n: 0, pts: 0 } };
    for (const e of mine) {
      const k = lineKind(e);
      m[k].n += 1;
      m[k].pts += e.points;
    }
    return m;
  }, [mine]);
  const eventRows = useMemo(() => summarizeEvents(mine, events), [mine, events]);
  const kidsInTeam = useMemo(() => campers.filter((c) => c.team === teamId).length, [campers, teamId]);
  const filtered = useMemo(() => (kind === "all" ? mine : mine.filter((e) => lineKind(e) === kind)), [mine, kind]);

  async function remove(e: ScoreEntry) {
    const who = e.camperName ? `${e.camperName}` : team?.name ?? "o time";
    if (!(await confirm({ title: "Apagar este lançamento?", message: `${fmtPoints(e.points)} para ${who} será desfeito. O placar muda na hora.`, confirmLabel: "Apagar", danger: true, emoji: "🗑️" }))) return;
    setDeletingId(e.id);
    setError(null);
    try {
      await deleteScore(token, e.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Algo deu errado.");
    } finally {
      setDeletingId(null);
    }
  }

  async function zero() {
    if (!team || busy) return;
    if (!(await confirm({ title: `Zerar ${team.name}?`, message: `Uma linha de ${fmtPoints(-total)} é escrita no histórico — nada é apagado e dá para desfazer apagando essa linha.`, confirmLabel: "Zerar", danger: true, emoji: "🧹" }))) return;
    setBusy(true);
    setError(null);
    try {
      await resetScore(token, team.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Algo deu errado.");
    } finally {
      setBusy(false);
    }
  }

  if (!team) {
    return (
      <div className="admin-page">
        <Breadcrumbs items={[{ label: "Placar", onClick: onBack }, { label: "Time" }]} />
        <p className="opt-empty">Time não encontrado.</p>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <Breadcrumbs items={[{ label: "Placar", onClick: onBack }, { label: team.name }]} />
      <header className="admin-head">
        <h1 className="admin-title">
          <span className="score-swatch" style={{ background: team.color }} aria-hidden="true" />
          {team.name}
        </h1>
        {canEdit && total !== 0 && (
          <button type="button" className="button button--secondary admin-head__new" disabled={busy} onClick={() => void zero()}>
            🧹 Zerar
          </button>
        )}
      </header>

      <div className="score-hero" style={{ background: team.color, color: contrastText(team.color) }}>
        <span className="score-hero__pts">{total}</span>
        <span className="score-hero__meta">
          {rank > 0 ? `${rank}º lugar` : ""} · {mine.length} lançamento{mine.length !== 1 ? "s" : ""} · {kidsInTeam} criança{kidsInTeam !== 1 ? "s" : ""}
        </span>
      </div>

      {error && <p className="message message--error">{error}</p>}

      <div className="stat-grid">
        {KINDS.map((k) => (
          <button key={k} type="button" className={`stat-card ${kind === k ? "stat-card--on" : ""}`} aria-pressed={kind === k} onClick={() => setKind(kind === k ? "all" : k)}>
            <span className="stat-card__emoji">{KIND_META[k].emoji}</span>
            <span className="stat-card__n">{fmtPoints(byKind[k].pts)}</span>
            <span className="stat-card__label">
              {KIND_META[k].plural} · {byKind[k].n}
            </span>
          </button>
        ))}
      </div>

      {eventRows.length > 0 && (
        <section className="score-section">
          <h2 className="score-section__title">🎯 Por evento</h2>
          <ul className="score-events">
            {eventRows.map((r) => (
              <li key={r.eventId}>
                <button type="button" className="score-event" onClick={() => onEvent(r.eventId)}>
                  <span className="score-event__name">{r.event ? `${r.event.emoji} ${r.event.title}` : "Evento removido"}</span>
                  <small className="score-event__meta">
                    {r.kids} de {kidsInTeam} criança{kidsInTeam !== 1 ? "s" : ""} · {r.perKid} pt{r.perKid !== 1 ? "s" : ""} cada
                  </small>
                  <span className="score-event__pts">{fmtPoints(r.total)}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="score-section">
        <h2 className="score-section__title">
          📜 Linha do tempo{kind !== "all" ? ` · ${KIND_META[kind].plural}` : ""}
          {kind !== "all" && (
            <button type="button" className="link-btn score-section__clear" onClick={() => setKind("all")}>
              ver tudo
            </button>
          )}
        </h2>
        <ScoreLogList entries={filtered} teams={teamMap} events={eventMap} hideTeam onEvent={onEvent} canDelete={(e) => canDeleteLine(e, { canEdit, canScan, userId })} onDelete={remove} deletingId={deletingId} emptyText="Este time ainda não tem lançamentos." />
      </section>
    </div>
  );
}
