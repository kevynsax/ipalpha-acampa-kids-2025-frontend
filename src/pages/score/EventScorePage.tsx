import { useMemo, useState } from "react";
import { deleteScore, type ScoreEntry } from "../../api/scores";
import { speakDay } from "../../dates";
import { contrastText } from "../../api/teams";
import Breadcrumbs from "../../components/Breadcrumbs";
import { useConfirm } from "../../components/ConfirmDialog";
import { useCollectionOrEmpty } from "../../store";
import { canDeleteLine, fmtPoints, ScoreLogList, useEventMap, useTeamMap } from "./scoreLog";

interface Props {
  token: string;
  eventId: string;
  userId: string;
  canEdit: boolean;
  canScan: boolean;
  onBack: () => void;
  onTeam: (teamId: string) => void;
}

/**
 * Placar → Evento: everything the event produced on the scoreboard. Points
 * per kid, how many kids were read, the split per team (and who is still
 * missing), and every scan line with who read it and when.
 */
export default function EventScorePage({ token, eventId, userId, canEdit, canScan, onBack, onTeam }: Props) {
  const scores = useCollectionOrEmpty("scores");
  const teams = useCollectionOrEmpty("teams");
  const events = useCollectionOrEmpty("events");
  const campers = useCollectionOrEmpty("campers");
  const teamMap = useTeamMap(teams);
  const eventMap = useEventMap(events);
  const confirm = useConfirm();
  const event = eventMap.get(eventId);

  const [teamFilter, setTeamFilter] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const lines = useMemo(() => scores.filter((e) => e.eventId === eventId), [scores, eventId]);
  const scans = useMemo(() => lines.filter((e) => e.camperId), [lines]);
  const perKid = scans[0]?.points ?? 0;
  const total = useMemo(() => lines.reduce((s, e) => s + e.points, 0), [lines]);
  const scannedIds = useMemo(() => new Set(scans.map((s) => s.camperId as string)), [scans]);
  const readers = useMemo(() => {
    const m = new Map<string, number>();
    for (const s of scans) m.set(s.by.name || "—", (m.get(s.by.name || "—") ?? 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [scans]);

  const perTeam = useMemo(() => {
    return teams
      .slice()
      .sort((a, b) => a.order - b.order)
      .map((t) => {
        const kids = campers.filter((c) => c.team === t.id);
        const read = kids.filter((c) => scannedIds.has(c.id));
        const missing = kids.filter((c) => !scannedIds.has(c.id)).sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
        const pts = scans.filter((s) => s.teamId === t.id).reduce((sum, s) => sum + s.points, 0);
        return { team: t, kids: kids.length, read: read.length, missing, pts };
      });
  }, [teams, campers, scannedIds, scans]);

  const filtered = useMemo(() => (teamFilter ? lines.filter((e) => e.teamId === teamFilter) : lines), [lines, teamFilter]);

  async function remove(e: ScoreEntry) {
    if (!(await confirm({ title: "Apagar esta leitura?", message: `${e.camperName || "A criança"} volta para a lista de quem ainda não recebeu; ${fmtPoints(e.points)} sai do time.`, confirmLabel: "Apagar", danger: true, emoji: "🗑️" }))) return;
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

  const title = event ? `${event.emoji} ${event.title}` : "Evento removido";

  return (
    <div className="admin-page">
      <Breadcrumbs items={[{ label: "Placar", onClick: onBack }, { label: title }]} />
      <header className="admin-head">
        <h1 className="admin-title">{title}</h1>
      </header>
      {event && (
        <p className="admin-intro">
          {speakDay(event.date)} · {event.startTime}
          {event.endTime ? `–${event.endTime}` : ""}
        </p>
      )}

      <div className="stat-grid">
        <div className="stat-card stat-card--static">
          <span className="stat-card__emoji">🎯</span>
          <span className="stat-card__n">{scans.length}</span>
          <span className="stat-card__label">crachás lidos de {campers.length}</span>
        </div>
        <div className="stat-card stat-card--static">
          <span className="stat-card__emoji">⭐</span>
          <span className="stat-card__n">{perKid}</span>
          <span className="stat-card__label">ponto{perKid !== 1 ? "s" : ""} por criança</span>
        </div>
        <div className="stat-card stat-card--static">
          <span className="stat-card__emoji">🏆</span>
          <span className="stat-card__n">{fmtPoints(total)}</span>
          <span className="stat-card__label">no placar</span>
        </div>
      </div>

      {readers.length > 0 && (
        <p className="admin-intro">
          Lido por{" "}
          {readers.map(([name, n], i) => (
            <span key={name}>
              {i > 0 && ", "}
              <strong>{name}</strong> ({n})
            </span>
          ))}
          .
        </p>
      )}

      {error && <p className="message message--error">{error}</p>}

      <section className="score-section">
        <h2 className="score-section__title">🚩 Por time</h2>
        <ul className="score-events">
          {perTeam.map(({ team, kids, read, missing, pts }) => (
            <li key={team.id}>
              <div className={`score-event score-event--static ${teamFilter === team.id ? "score-event--on" : ""}`} style={{ borderLeftColor: team.color }}>
                <button type="button" className="score-event__name link-btn" style={{ color: team.color }} onClick={() => onTeam(team.id)}>
                  {team.name}
                </button>
                <small className="score-event__meta">
                  {read} de {kids} criança{kids !== 1 ? "s" : ""}
                  {missing.length > 0 && (
                    <>
                      {" "}
                      · faltam: <MissingNames names={missing.map((c) => c.name)} />
                    </>
                  )}
                </small>
                <span className="score-event__side">
                  <span className="score-event__pts" style={{ background: team.color, color: contrastText(team.color) }}>
                    {fmtPoints(pts)}
                  </span>
                  <button type="button" className="link-btn score-event__filter" aria-pressed={teamFilter === team.id} onClick={() => setTeamFilter(teamFilter === team.id ? "" : team.id)}>
                    {teamFilter === team.id ? "todas" : "só este"}
                  </button>
                </span>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="score-section">
        <h2 className="score-section__title">
          📜 Leituras{teamFilter ? ` · ${teamMap.get(teamFilter)?.name ?? ""}` : ""}
          {teamFilter && (
            <button type="button" className="link-btn score-section__clear" onClick={() => setTeamFilter("")}>
              ver todas
            </button>
          )}
        </h2>
        <ScoreLogList entries={filtered} teams={teamMap} events={eventMap} hideEvent onTeam={onTeam} canDelete={(e) => canDeleteLine(e, { canEdit, canScan, userId })} onDelete={remove} deletingId={deletingId} emptyText="Ninguém foi lido neste evento ainda." />
      </section>
    </div>
  );
}

/** "Ana, Bia, Caio e mais 4" — expandable */
function MissingNames({ names }: { names: string[] }) {
  const [open, setOpen] = useState(false);
  const first = (n: string) => n.split(" ")[0];
  if (open || names.length <= 3) return <>{names.map(first).join(", ")}</>;
  return (
    <>
      {names.slice(0, 3).map(first).join(", ")}{" "}
      <button type="button" className="link-btn" onClick={() => setOpen(true)}>
        e mais {names.length - 3}
      </button>
    </>
  );
}
