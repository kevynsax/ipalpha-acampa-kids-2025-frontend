import { useConfirm } from "../../components/ConfirmDialog";
import { useMemo, useState } from "react";
import {
  createEvent,
  createRole,
  deleteEvent,
  deleteRole,
  updateEvent,
  updateRole,
  type CampEvent,
  type CampEventInput,
  type ScheduleRole,
  type ScheduleRoleInput,
} from "../../api/schedule";
import AutoRoleBadge, { positionsMeta } from "../../components/AutoRoleBadge";
import ParentIcon from "../../components/ParentIcon";
import { speakDay } from "../../dates";
import { useCollection, useCollectionOrEmpty } from "../../store";
import DetailStack, { detailUrl, rememberTitle, viaCrumbs, type DetailRef } from "./DetailStack";
import EventDetail from "./EventDetail";
import { goBack, useRoute } from "../../router";
import Breadcrumbs from "../../components/Breadcrumbs";
import EventForm from "./EventForm";
import RoleForm from "./RoleForm";
import RichHtml from "../../components/RichHtml";
import { ICONS } from "../../icons";

interface SchedulePageProps {
  token: string;
}

type SubTab = "events" | "roles";
/**
 * URL → what to show:
 *   /schedule                      events timeline      /schedule/roles           roles catalogue
 *   /schedule/events/new?date=…    new event            /schedule/roles/new       new role
 *   /schedule/events/:id           event detail         /schedule/roles/:id       role detail (stack)
 *   /schedule/events/:id/edit      edit event           /schedule/roles/:id/edit  edit role
 * The escala (who does what) is edited on the event detail page itself.
 * Detail pages opened from an event carry `?via=…` (see DetailStack).
 */
type Mode =
  | { kind: "view" }
  | { kind: "create-event"; date?: string }
  | { kind: "edit-event"; id: string }
  | { kind: "event"; id: string }
  | { kind: "stack"; root: DetailRef }
  | { kind: "create-role" }
  | { kind: "edit-role"; id: string };
function modeOf(segments: string[], params: URLSearchParams): { sub: SubTab; mode: Mode } {
  const [, area, id, action] = segments;
  if (area === "roles") {
    if (!id) return { sub: "roles", mode: { kind: "view" } };
    if (id === "new") return { sub: "roles", mode: { kind: "create-role" } };
    if (action === "edit") return { sub: "roles", mode: { kind: "edit-role", id } };
    return { sub: "roles", mode: { kind: "stack", root: { kind: "role", id } } };
  }
  if (area === "staff" && id) return { sub: "events", mode: { kind: "stack", root: { kind: "staff", id } } };
  if (area === "events" && id) {
    if (id === "new") return { sub: "events", mode: { kind: "create-event", date: params.get("date") ?? undefined } };
    if (action === "edit") return { sub: "events", mode: { kind: "edit-event", id } };
    return { sub: "events", mode: { kind: "event", id } };
  }
  return { sub: "events", mode: { kind: "view" } };
}

/**
 * Admin-only: the camp programme. Two sub-tabs — the timeline of events
 * (grouped by date) and the catalogue of roles staff can fulfil, each with
 * WYSIWYG instructions.
 */
export default function SchedulePage({ token }: SchedulePageProps) {
  // everything comes from the local store (localStorage + live WebSocket feed)
  const storedEvents = useCollection("events");
  const events = useMemo(() => (storedEvents ? sortEvents(storedEvents) : null), [storedEvents]);
  const storedRoles = useCollectionOrEmpty("roles");
  const roles = useMemo(() => sortRoles(storedRoles), [storedRoles]);
  const staff = useCollectionOrEmpty("staff");
  const { segments, params, navigate } = useRoute();
  const { sub, mode } = modeOf(segments, params);
  const setSub = (t: SubTab) => navigate(t === "events" ? "/schedule" : "/schedule/roles");
  const confirm = useConfirm();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openRole, setOpenRole] = useState<string | null>(null);

  const roleById = useMemo(() => new Map(roles.map((r) => [r.id, r])), [roles]);
  const usageByRole = useMemo(() => {
    const m = new Map<string, number>();
    for (const e of events ?? []) for (const id of e.roles) m.set(id, (m.get(id) ?? 0) + 1);
    return m;
  }, [events]);

  async function withBusy<T>(fn: () => Promise<T>): Promise<T> {
    setBusy(true);
    setError(null);
    try {
      return await fn();
    } finally {
      setBusy(false);
    }
  }

  // ── events ─────────────────────────────────────────────────────────────

  async function handleCreateEvent(input: CampEventInput) {
    const created = await withBusy(() => createEvent(token, input));
    navigate(`/schedule/events/${created.id}`, { replace: true });
  }
  async function handleEditEvent(input: CampEventInput) {
    if (mode.kind !== "edit-event") return;
    const updated = await withBusy(() => updateEvent(token, mode.id, input));
    navigate(`/schedule/events/${updated.id}`, { replace: true });
  }

  async function handleParentsVisible(e: CampEvent, next: boolean) {
    if (next === (e.visibleToParents !== false)) return;
    try {
      await updateEvent(token, e.id, { visibleToParents: next });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Algo deu errado.");
    }
  }

  async function handleDeleteEvent(e: CampEvent) {
    if (!(await confirm({ emoji: "🗑️", title: `Excluir "${e.title}"?`, message: `${speakDay(e.date, "compact")} ${e.startTime} · Isso não pode ser desfeito.`, confirmLabel: "Excluir", danger: true }))) return;
    try {
      await withBusy(() => deleteEvent(token, e.id));
      navigate("/schedule", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Algo deu errado.");
    }
  }

  // ── roles ──────────────────────────────────────────────────────────────

  async function handleCreateRole(input: ScheduleRoleInput) {
    await withBusy(() => createRole(token, input));
    navigate("/schedule/roles", { replace: true });
  }
  async function handleEditRole(input: ScheduleRoleInput) {
    if (mode.kind !== "edit-role") return;
    const updated = await withBusy(() => updateRole(token, mode.id, input));
    navigate(`/schedule/roles/${updated.id}`, { replace: true });
  }
  async function handleDeleteRole(r: ScheduleRole) {
    if (!(await confirm({ emoji: "🗑️", title: `Excluir a função "${r.name}"?`, message: "Isso não pode ser desfeito.", confirmLabel: "Excluir", danger: true }))) return;
    try {
      await withBusy(() => deleteRole(token, r.id));
      navigate("/schedule/roles", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Algo deu errado.");
    }
  }

  // ── render ─────────────────────────────────────────────────────────────

  if (!events) {
    return (
      <div className="admin-page">
        {error ? <p className="message message--error">{error}</p> : <p className="opt-empty">Sincronizando com o servidor… 🏕️</p>}
      </div>
    );
  }

  if (mode.kind === "event") {
    const ev = events.find((x) => x.id === mode.id);
    if (!ev) {
      return (
        <div className="admin-page">
          <p className="opt-empty">Evento não encontrado.</p>
          <button type="button" className="button button--secondary" onClick={() => navigate("/schedule", { replace: true })}>
            Ver programação
          </button>
        </div>
      );
    }
    // the event is a link in the detail chain like any other page (person → event → função …)
    const me: DetailRef = { kind: "event", id: ev.id };
    rememberTitle(me, `${ev.emoji} ${ev.title}`);
    const { via, crumbs } = viaCrumbs(params);
    const chain = [...via, me];
    return (
      <EventDetail
        token={token}
        event={ev}
        roles={roles}
        staff={staff}
        crumbs={[{ label: "Programação", onClick: () => navigate("/schedule") }, ...crumbs, { label: `${ev.emoji} ${ev.title}` }]}
        onEdit={() => navigate(`/schedule/events/${ev.id}/edit`)}
        onOpenStaff={(id) => navigate(detailUrl({ kind: "staff", id }, chain))}
      />
    );
  }
  if (mode.kind === "stack") {
    return (
      <DetailStack
        token={token}
        current={mode.root}
        rootCrumbs={[{ label: "Programação", onClick: () => navigate(sub === "roles" ? "/schedule/roles" : "/schedule") }]}
        onEditRole={(role) => navigate(`/schedule/roles/${role.id}/edit`)}
      />
    );
  }

  const days = [...new Set(events.map((e) => e.date))].sort();
  const inForm = mode.kind !== "view";
  const editingEvent = mode.kind === "edit-event" ? events.find((e) => e.id === mode.id) : undefined;
  const editingRole = mode.kind === "edit-role" ? roles.find((r) => r.id === mode.id) : undefined;
  /** Cancelar on a form → the previous screen (history), falling back to the list */
  const cancel = () => goBack(sub === "roles" ? "/schedule/roles" : "/schedule");

  return (
    <div className="admin-page">
      {inForm && (
        <Breadcrumbs
          items={[
            { label: "Programação", onClick: () => navigate(sub === "roles" ? "/schedule/roles" : "/schedule") },
            ...(mode.kind === "edit-event" && editingEvent ? [{ label: editingEvent.title, onClick: () => navigate(`/schedule/events/${editingEvent.id}`) }] : []),
            ...(mode.kind === "edit-role" && editingRole ? [{ label: editingRole.name, onClick: () => navigate(`/schedule/roles/${editingRole.id}`) }] : []),
            { label: mode.kind === "create-event" ? "Novo evento" : mode.kind === "create-role" ? "Nova função" : "Editar" },
          ]}
        />
      )}
      <header className="admin-head">
        <h1 className="admin-title">
          {mode.kind === "create-event" ? (
            <>
              <img className="admin-title__icon" src={ICONS.schedule} alt="" aria-hidden="true" /> Novo evento
            </>
          ) : mode.kind === "edit-event" ? (
            "✏️ Editar evento"
          ) : mode.kind === "create-role" ? (
            "🎯 Nova função"
          ) : mode.kind === "edit-role" ? (
            "✏️ Editar função"
          ) : (
            <>
              <img className="admin-title__icon" src={ICONS.schedule} alt="" aria-hidden="true" /> Programação
            </>
          )}
        </h1>
        {!inForm && (
          <button
            type="button"
            className="button button--primary admin-head__new"
            disabled={busy}
            onClick={() => navigate(sub === "events" ? "/schedule/events/new" : "/schedule/roles/new")}
          >
            {sub === "events" ? "+ Evento" : "+ Função"}
          </button>
        )}
        {mode.kind === "edit-event" && editingEvent && (
          <button
            type="button"
            className="icon-btn icon-btn--lg icon-btn--danger"
            title={`Excluir evento "${editingEvent.title}"`}
            aria-label={`Excluir evento "${editingEvent.title}"`}
            disabled={busy}
            onClick={() => handleDeleteEvent(editingEvent)}
          >
            🗑️
          </button>
        )}
        {mode.kind === "edit-role" && editingRole && (
          <button
            type="button"
            className="icon-btn icon-btn--lg icon-btn--danger"
            title={
              (usageByRole.get(editingRole.id) ?? 0) > 0
                ? `Remova esta função dos ${usageByRole.get(editingRole.id)} evento(s) antes de excluir`
                : `Excluir função "${editingRole.name}"`
            }
            aria-label={`Excluir função "${editingRole.name}"`}
            disabled={busy || (usageByRole.get(editingRole.id) ?? 0) > 0}
            onClick={() => handleDeleteRole(editingRole)}
          >
            🗑️
          </button>
        )}
      </header>

      {!inForm && (
        <div className="staff-toolbar__filters" role="tablist" aria-label="Programação">
          <button
            type="button"
            role="tab"
            aria-selected={sub === "events"}
            className={`cat-tab ${sub === "events" ? "cat-tab--active" : ""}`}
            onClick={() => setSub("events")}
          >
            <img className="cat-tab__img" src={ICONS.schedule} alt="" aria-hidden="true" /> Eventos
            <span className="cat-tab__count">{events.length}</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={sub === "roles"}
            className={`cat-tab ${sub === "roles" ? "cat-tab--active" : ""}`}
            onClick={() => setSub("roles")}
          >
            🎯 Funções
            <span className="cat-tab__count">{roles.length}</span>
          </button>
        </div>
      )}

      {error && <p className="message message--error">{error}</p>}

      {/* ── forms ── */}
      {mode.kind === "create-event" && (
        <EventForm key={mode.date ?? "any"} defaultDate={mode.date} busy={busy} onSubmit={handleCreateEvent} onCancel={cancel} />
      )}
      {mode.kind === "edit-event" && !editingEvent && <p className="opt-empty">Evento não encontrado.</p>}
      {mode.kind === "edit-event" && editingEvent && (
        <EventForm key={editingEvent.id} event={editingEvent} busy={busy} onSubmit={handleEditEvent} onCancel={cancel} />
      )}
      {mode.kind === "create-role" && <RoleForm token={token} busy={busy} onSubmit={handleCreateRole} onCancel={cancel} />}
      {mode.kind === "edit-role" && !editingRole && <p className="opt-empty">Função não encontrada.</p>}
      {mode.kind === "edit-role" && editingRole && (
        <RoleForm key={editingRole.id} token={token} role={editingRole} busy={busy} onSubmit={handleEditRole} onCancel={cancel} />
      )}

      {/* ── events timeline ── */}
      {!inForm && sub === "events" && events.length === 0 && (
        <div className="admin-empty">
          <img className="admin-empty__icon" src={ICONS.schedule} alt="" aria-hidden="true" />
          <p>Nenhum evento ainda. Monte a programação do acampamento!</p>
          <button type="button" className="button button--primary" onClick={() => navigate("/schedule/events/new")}>
            + Criar evento
          </button>
        </div>
      )}

      {!inForm && sub === "events" &&
        days.map((d) => (
          <section key={d} className="day-group">
            <header className="room-group__head">
              <h2 className="room-group__title room-group__title--green">📆 {speakDay(d)}</h2>
              <span className="room-group__stats" />
              <button type="button" className="icon-btn" title={`Novo evento em ${speakDay(d, "compact")}`} disabled={busy} onClick={() => navigate("/schedule/events/new", { query: { date: d } })}>
                +
              </button>
            </header>
            <ol className="timeline">
              {events
                .filter((e) => e.date === d)
                .map((e) => (
                  <li key={e.id} className="timeline__item">
                    <div className="timeline__time">
                      <span className="timeline__start">{e.startTime}</span>
                      {e.endTime && <span className="timeline__end">{e.endTime}</span>}
                    </div>
                    <div
                      className={`event-card event-card--clickable ${e.roles.length === 0 ? "event-card--plain" : ""}`}
                      role="link"
                      tabIndex={0}
                      title={`Ver evento ${e.title}`}
                      onClick={() => navigate(`/schedule/events/${e.id}`)}
                      onKeyDown={(ev) => {
                        if (ev.key === "Enter" || ev.key === " ") {
                          ev.preventDefault();
                          navigate(`/schedule/events/${e.id}`);
                        }
                      }}
                    >
                      <h3 className="event-card__title">
                        <span className="event-card__title-text"><span aria-hidden="true">{e.emoji}</span> {e.title}</span>
                        {/* pushed to the card's right edge — see .event-card__parents */}
                        <button
                          type="button"
                          className={`event-card__parents ${e.visibleToParents === false ? "event-card__parents--off" : ""}`}
                          title={e.visibleToParents === false ? "Só a equipe vê — clicar para os pais verem" : "Os pais veem — clicar para esconder"}
                          aria-pressed={e.visibleToParents !== false}
                          aria-label={e.visibleToParents === false ? "Os pais não veem este evento" : "Os pais veem este evento"}
                          onClick={(ev) => {
                            ev.stopPropagation();
                            void handleParentsVisible(e, e.visibleToParents === false);
                          }}
                        >
                          <ParentIcon size={16} />
                        </button>
                      </h3>
                      {e.notes && <p className="staff-card__meta">{e.notes}</p>}
                      {e.roles.length > 0 && (
                        <div className="staff-card__tags">
                          {e.roles.map((id) => {
                            const r = roleById.get(id);
                            if (!r) return null;
                            /* a role tag opens the role (via this event, so the breadcrumb leads back here) */
                            const openRole = (ev: React.MouseEvent) => {
                              ev.stopPropagation();
                              navigate(detailUrl({ kind: "role", id }, [{ kind: "event", id: e.id }]));
                            };
                            const who = positionsMeta(r.forRoomRoles);
                            /* escalados à mão neste evento — somam com quem pega pela posição */
                            const n = e.assignments.filter((a) => a.roleId === id).length;
                            if (who) {
                              return (
                                <button
                                  key={id}
                                  type="button"
                                  className="staff-tag staff-tag--everyone staff-tag--link"
                                  title={`${r.name}: vai sozinha para ${who.label}${n > 0 ? ` + ${n} escalado(s)` : ""} — ver função`}
                                  onClick={openRole}
                                >
                                  <img className="audience-icon" src={who.icon} alt="" aria-hidden="true" /> {r.emoji} {r.name}
                                  {n > 0 && <span className="staff-tag__n">+{n}</span>}
                                </button>
                              );
                            }
                            return (
                              <button key={id} type="button" className={`staff-tag staff-tag--link ${n === 0 ? "staff-tag--empty" : ""}`} title={n === 0 ? `${r.name}: ninguém escalado — ver função` : `${r.name}: ${n} escalado(s) — ver função`} onClick={openRole}>
                                {r.emoji} {r.name}
                                <span className="staff-tag__n">{n}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </li>
                ))}
            </ol>
          </section>
        ))}

      {/* ── roles catalogue ── */}
      {!inForm && sub === "roles" && roles.length === 0 && (
        <div className="admin-empty">
          <span className="admin-empty__emoji">🎯</span>
          <p>Nenhuma função ainda. Cadastre o que a equipe faz em cada evento — com instruções!</p>
          <button type="button" className="button button--primary" onClick={() => navigate("/schedule/roles/new")}>
            + Criar função
          </button>
        </div>
      )}

      {!inForm && sub === "roles" && roles.length > 0 && (
        <ul className="staff-list">
          {roles.map((r) => {
            const used = usageByRole.get(r.id) ?? 0;
            const open = openRole === r.id;
            return (
              <li key={r.id} className="staff-card staff-card--clickable role-card">
                <div
                  className="staff-card__body"
                  role="link"
                  tabIndex={0}
                  title={`Ver função ${r.name}`}
                  onClick={() => navigate(`/schedule/roles/${r.id}`)}
                  onKeyDown={(ev) => {
                    if (ev.key === "Enter" || ev.key === " ") {
                      ev.preventDefault();
                      navigate(`/schedule/roles/${r.id}`);
                    }
                  }}
                >
                  <h3 className="staff-card__name">
                    <span aria-hidden="true">{r.emoji}</span> {r.name}
                  </h3>
                  <p className="staff-card__meta">
                    <AutoRoleBadge role={r} />
                    {r.forRoomRoles.length > 0 && " · "}
                    {used === 0 ? "Não usada em nenhum evento" : `Usada em ${used} evento${used > 1 ? "s" : ""}`}
                    {" · "}
                    {r.instructions ? (
                      <button
                        type="button"
                        className="link-btn"
                        onClick={(ev) => {
                          ev.stopPropagation();
                          setOpenRole(open ? null : r.id);
                        }}
                      >
                        {open ? "ocultar instruções" : "ver instruções"}
                      </button>
                    ) : (
                      <span className="cat-hint--error">sem instruções</span>
                    )}
                  </p>
                  {open && r.instructions && (
                    <RichHtml html={r.instructions} onClick={(ev) => ev.stopPropagation()} />
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function sortEvents(list: CampEvent[]): CampEvent[] {
  return list.slice().sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime) || a.title.localeCompare(b.title, "pt-BR"));
}
function sortRoles(list: ScheduleRole[]): ScheduleRole[] {
  return list.slice().sort((a, b) => a.name.localeCompare(b.name, "pt-BR", { sensitivity: "base" }));
}
