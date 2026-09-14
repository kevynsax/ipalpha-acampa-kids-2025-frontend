import { useMemo, useState } from "react";
import { deleteScore, type ScoreEntry } from "../../api/scores";
import Breadcrumbs from "../../components/Breadcrumbs";
import { useConfirm } from "../../components/ConfirmDialog";
import { useCollectionOrEmpty } from "../../store";
import { canDeleteLine, eventLabel, fmtPoints, KIND_META, lineKind, normalize, ScoreLogList, useEventMap, useTeamMap, type KindFilter, type LineKind } from "./scoreLog";

interface Props {
  token: string;
  userId: string;
  canEdit: boolean;
  canScan: boolean;
  onBack: () => void;
  onTeam: (teamId: string) => void;
  onEvent: (eventId: string) => void;
}

const KINDS: LineKind[] = ["scan", "add", "remove", "reset"];

/**
 * Placar → Histórico: the whole ledger, newest first, grouped by day. Every
 * line says what happened (scan / given / taken / reset), for which team,
 * in which event, the note, who did it and when. Filters narrow it down by
 * kind, team, event, person or free text.
 */
export default function ScoreHistoryPage({ token, userId, canEdit, canScan, onBack, onTeam, onEvent }: Props) {
  const scores = useCollectionOrEmpty("scores");
  const teams = useCollectionOrEmpty("teams");
  const events = useCollectionOrEmpty("events");
  const teamMap = useTeamMap(teams);
  const eventMap = useEventMap(events);
  const confirm = useConfirm();

  const [kind, setKind] = useState<KindFilter>("all");
  const [teamId, setTeamId] = useState("");
  const [eventId, setEventId] = useState("");
  const [byId, setById] = useState("");
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const people = useMemo(() => {
    const m = new Map<string, string>();
    for (const e of scores) if (e.by.id && !m.has(e.by.id)) m.set(e.by.id, e.by.name);
    return [...m.entries()].sort((a, b) => a[1].localeCompare(b[1], "pt-BR"));
  }, [scores]);
  const eventsWithScans = useMemo(() => {
    const ids = new Set(scores.map((e) => e.eventId).filter(Boolean));
    return events.filter((e) => ids.has(e.id)).sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));
  }, [scores, events]);

  const counts = useMemo(() => {
    const c: Record<KindFilter, number> = { all: scores.length, scan: 0, add: 0, remove: 0, reset: 0 };
    for (const e of scores) c[lineKind(e)] += 1;
    return c;
  }, [scores]);

  const filtered = useMemo(() => {
    const q = normalize(search.trim());
    return scores.filter((e) => {
      if (kind !== "all" && lineKind(e) !== kind) return false;
      if (teamId && e.teamId !== teamId) return false;
      if (eventId && e.eventId !== eventId) return false;
      if (byId && e.by.id !== byId) return false;
      if (q) {
        const ev = e.eventId ? eventMap.get(e.eventId) : undefined;
        const hay = normalize([e.camperName, e.note, e.by.name, teamMap.get(e.teamId)?.name ?? "", ev?.title ?? ""].join(" "));
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [scores, kind, teamId, eventId, byId, search, eventMap, teamMap]);
  const net = useMemo(() => filtered.reduce((s, e) => s + e.points, 0), [filtered]);
  const filtering = kind !== "all" || !!teamId || !!eventId || !!byId || !!search.trim();

  async function remove(e: ScoreEntry) {
    const team = teamMap.get(e.teamId)?.name ?? "o time";
    const who = e.camperName ? `${e.camperName} (${team})` : team;
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

  return (
    <div className="admin-page">
      <Breadcrumbs items={[{ label: "Placar", onClick: onBack }, { label: "Histórico" }]} />
      <header className="admin-head">
        <h1 className="admin-title">📜 Histórico do placar</h1>
      </header>
      <p className="admin-intro">Cada ponto do placar vem de um lançamento: quem lançou, para qual time, por qual evento e por quê. Nada é apagado ao zerar — só ao apagar uma linha.</p>

      <div className="cat-tabs" role="tablist" aria-label="Tipo de lançamento">
        <button type="button" role="tab" className={`cat-tab ${kind === "all" ? "cat-tab--active" : ""}`} aria-selected={kind === "all"} onClick={() => setKind("all")}>
          Tudo <span className="cat-tab__count">{counts.all}</span>
        </button>
        {KINDS.map((k) => (
          <button key={k} type="button" role="tab" className={`cat-tab ${kind === k ? "cat-tab--active" : ""}`} aria-selected={kind === k} onClick={() => setKind(k)}>
            <span className="cat-tab__emoji">{KIND_META[k].emoji}</span> {KIND_META[k].plural} <span className="cat-tab__count">{counts[k]}</span>
          </button>
        ))}
      </div>

      <div className="score-filters">
        <select className="cat-input" value={teamId} onChange={(e) => setTeamId(e.target.value)} aria-label="Time">
          <option value="">Todos os times</option>
          {teams.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        <select className="cat-input" value={eventId} onChange={(e) => setEventId(e.target.value)} aria-label="Evento">
          <option value="">Todos os eventos</option>
          {eventsWithScans.map((e) => (
            <option key={e.id} value={e.id}>
              {eventLabel(e)}
            </option>
          ))}
        </select>
        <select className="cat-input" value={byId} onChange={(e) => setById(e.target.value)} aria-label="Lançado por">
          <option value="">Qualquer pessoa</option>
          {people.map(([id, name]) => (
            <option key={id} value={id}>
              {name}
            </option>
          ))}
        </select>
        <input className="cat-input" type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar criança, observação, pessoa…" aria-label="Buscar" />
      </div>

      <p className="scan-points__summary" aria-live="polite">
        <strong>{filtered.length}</strong> lançamento{filtered.length !== 1 ? "s" : ""} · saldo <strong className={net < 0 ? "score-neg" : "score-pos"}>{fmtPoints(net)}</strong>
        {filtering && (
          <>
            {" "}
            ·{" "}
            <button
              type="button"
              className="link-btn"
              onClick={() => {
                setKind("all");
                setTeamId("");
                setEventId("");
                setById("");
                setSearch("");
              }}
            >
              Limpar filtros
            </button>
          </>
        )}
      </p>

      {error && <p className="message message--error">{error}</p>}

      <ScoreLogList
        entries={filtered}
        teams={teamMap}
        events={eventMap}
        onTeam={onTeam}
        onEvent={onEvent}
        canDelete={(e) => canDeleteLine(e, { canEdit, canScan, userId })}
        onDelete={remove}
        deletingId={deletingId}
        emptyText={filtering ? "Nenhum lançamento com esses filtros." : "Ainda não há lançamentos no placar."}
      />
    </div>
  );
}
