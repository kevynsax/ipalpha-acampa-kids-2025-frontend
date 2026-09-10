import { useEffect, useMemo, useState } from "react";
import { formatEventDate, type CampEvent, type ScheduleRole } from "../api/schedule";
import InstructionsDialog from "../components/InstructionsDialog";
import type { LoggedUser } from "../roles";
import { useRoute } from "../router";
import { useCollection, useCollectionOrEmpty } from "../store";

interface MySchedulePageProps {
  user: LoggedUser;
}

type Filter = "mine" | "all";

/**
 * What one event means for the logged-in person. The server already trims
 * every event to the viewer's own roles (their explicit assignment, or the
 * event's default "for everyone" roles), so the client only has to read it.
 */
interface MyEvent {
  event: CampEvent;
  /** the role this person does here (null = the event has nothing for them) */
  role: ScheduleRole | null;
  /** per-person detail of the assignment (team, base, shift…) */
  detail: string;
  /** true when the role comes from a "for everyone" default rather than an assignment */
  implicit: boolean;
}

/** "HH:mm" of now, local time */
function clock(): { date: string; time: string } {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return { date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`, time: `${pad(d.getHours())}:${pad(d.getMinutes())}` };
}

/**
 * "Programação" for a team member — read-only. Two views: their own escala
 * (default) and the whole programme. In both, only THEIR roles are shown:
 * what other people do in an event is never displayed (nor sent). It is a
 * single list — no detail pages; the role's instructions open in a dialog.
 *
 *   /schedule          list (`?all=1` → whole programme)
 */
export default function MySchedulePage({ user }: MySchedulePageProps) {
  const storedEvents = useCollection("events");
  const roles = useCollectionOrEmpty("roles");
  const { params, navigate } = useRoute();
  const filter: Filter = params.get("all") ? "all" : "mine";
  const setFilter = (f: Filter) => navigate("/schedule", { query: { all: f === "all" ? "1" : undefined }, replace: true });
  const [instructionsFor, setInstructionsFor] = useState<MyEvent | null>(null);
  /** past events are collapsed by default so the first card is what's happening now */
  const [showPast, setShowPast] = useState(false);
  const first = user.name.split(" ")[0];

  const items = useMemo<MyEvent[] | null>(() => {
    if (!storedEvents) return null;
    const roleById = new Map(roles.map((r) => [r.id, r]));
    return storedEvents
      .map((e): MyEvent => {
        const mine = e.assignments[0];
        const role = mine ? (roleById.get(mine.roleId) ?? null) : (e.roles.map((id) => roleById.get(id)).find((r) => r?.forEveryone) ?? null);
        return { event: e, role, detail: mine?.detail ?? "", implicit: !mine && !!role };
      })
      .sort((a, b) => a.event.date.localeCompare(b.event.date) || a.event.startTime.localeCompare(b.event.startTime) || a.event.title.localeCompare(b.event.title, "pt-BR"));
  }, [storedEvents, roles]);

  // "agora" marker — re-evaluated every minute
  const [now, setNow] = useState(clock);
  useEffect(() => {
    const t = setInterval(() => setNow(clock()), 60_000);
    return () => clearInterval(t);
  }, []);

  if (!items) {
    return (
      <div className="admin-page">
        <p className="opt-empty">Sincronizando com o servidor… 🏕️</p>
      </div>
    );
  }

  // ── list ───────────────────────────────────────────────────────────────
  const mine = items.filter((i) => i.role);
  const visible = filter === "all" ? items : mine;
  /** the event happening right now (today, started, not yet ended — the next start counts as the end) */
  const current = (() => {
    const today = items.filter((i) => i.event.date === now.date);
    for (let k = 0; k < today.length; k++) {
      const e = today[k].event;
      const end = e.endTime ?? today[k + 1]?.event.startTime ?? "23:59";
      if (e.startTime <= now.time && now.time < end) return e.id;
    }
    return null;
  })();
  const isPast = (e: CampEvent) => e.id !== current && (e.date < now.date || (e.date === now.date && (e.endTime ?? e.startTime) < now.time));
  const pastCount = visible.filter((i) => isPast(i.event)).length;
  // collapse what already happened — unless everything is past (camp is over), then there's nothing to jump to
  const collapsePast = pastCount > 0 && pastCount < visible.length && !showPast;
  const shown = collapsePast ? visible.filter((i) => !isPast(i.event)) : visible;
  const days = [...new Set(shown.map((i) => i.event.date))];

  return (
    <div className="admin-page">
      <header className="admin-head">
        <h1 className="admin-title">Programação</h1>
      </header>
      <p className="admin-intro">
        {filter === "mine"
          ? mine.length > 0
            ? `Olá, ${first}! Aqui está a sua escala — o que você faz em cada momento do acampamento.`
            : `Olá, ${first}! Você ainda não tem nada na escala.`
          : "Toda a programação do acampamento. Onde tem algo para você fazer, aparece a sua função."}
      </p>

      <div className="staff-toolbar__filters" role="tablist" aria-label="Filtro da programação">
        {(
          [
            ["mine", "🙋 Minha escala", mine.length],
            ["all", "📅 Tudo", items.length],
          ] as [Filter, string, number][]
        ).map(([key, label, n]) => (
          <button key={key} type="button" role="tab" aria-selected={filter === key} className={`cat-tab ${filter === key ? "cat-tab--active" : ""}`} onClick={() => setFilter(key)}>
            {label}
            <span className="cat-tab__count">{n}</span>
          </button>
        ))}
      </div>

      {shown.length === 0 && (
        <div className="admin-empty">
          <span className="admin-empty__emoji">{filter === "mine" ? "🙋" : "📅"}</span>
          <p>{filter === "mine" ? "Nenhuma função na sua escala por enquanto. Veja a programação completa!" : "A programação ainda não foi publicada."}</p>
          {filter === "mine" && items.length > 0 && (
            <button type="button" className="button button--primary" onClick={() => setFilter("all")}>
              📅 Ver tudo
            </button>
          )}
        </div>
      )}

      {pastCount > 0 && pastCount < visible.length && (
        <button type="button" className={`past-toggle ${showPast ? "past-toggle--open" : ""}`} aria-expanded={showPast} onClick={() => setShowPast((v) => !v)}>
          <span className="past-toggle__icon" aria-hidden="true">
            {showPast ? "▾" : "▸"}
          </span>
          <span className="past-toggle__label">
            {showPast ? "Esconder o que já aconteceu" : `${pastCount} ${pastCount === 1 ? "item já aconteceu" : "itens já aconteceram"}`}
          </span>
          <span className="past-toggle__hint">{showPast ? "recolher" : "mostrar"}</span>
        </button>
      )}

      {days.map((d) => (
        <section key={d} className="day-group">
          <header className="room-group__head">
            <h2 className="room-group__title room-group__title--green">📆 {formatEventDate(d)}</h2>
            {d === now.date && <span className="room-group__stats">hoje</span>}
          </header>
          <ol className="timeline">
            {shown
              .filter((i) => i.event.date === d)
              .map((i) => {
                const e = i.event;
                const isNow = e.id === current;
                const past = isPast(e);
                return (
                  <li key={e.id} className={`timeline__item ${isNow ? "timeline__item--now" : ""} ${past ? "timeline__item--past" : ""}`}>
                    <div className="timeline__time">
                      <span className="timeline__start">{e.startTime}</span>
                      {e.endTime && <span className="timeline__end">{e.endTime}</span>}
                    </div>
                    <div className={`event-card ${!i.role ? "event-card--plain" : ""} ${isNow ? "event-card--now" : ""}`}>
                      <h3 className="event-card__title">
                        {isNow && <span className="event-card__now">agora</span>}
                        <span aria-hidden="true">{e.emoji}</span> {e.title}
                      </h3>
                      {e.notes && <p className="staff-card__meta">{e.notes}</p>}
                      {i.role && (
                        <div className="staff-card__tags my-role">
                          <span className={`staff-tag ${i.implicit ? "staff-tag--everyone" : ""}`} title={i.implicit ? "Função padrão de toda a equipe" : "Você está escalado(a) nesta função"}>
                            {i.role.emoji} {i.role.name}
                            {i.detail && <span className="staff-tag__n">{i.detail}</span>}
                          </span>
                          {i.role.instructions && (
                            <button type="button" className="link-btn" onClick={() => setInstructionsFor(i)}>
                              📝 instruções
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
          </ol>
        </section>
      ))}

      <InstructionsDialog
        role={instructionsFor?.role ?? null}
        context={instructionsFor ? `em ${instructionsFor.event.emoji} ${instructionsFor.event.title} · ${formatEventDate(instructionsFor.event.date, { weekday: "short" }).replace(".", "")} ${instructionsFor.event.startTime}` : undefined}
        onClose={() => setInstructionsFor(null)}
      />
    </div>
  );
}
