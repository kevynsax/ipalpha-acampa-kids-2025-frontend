import { useMemo, useState } from "react";
import { unassignStaff, type CampEvent, type ScheduleRole } from "../../api/schedule";
import { speakDay } from "../../dates";
import type { Staff } from "../../api/staff";
import Breadcrumbs, { type Crumb } from "../../components/Breadcrumbs";
import { useConfirm } from "../../components/ConfirmDialog";
import RichTextBox from "../../components/RichTextBox";
import AssignRoleDialog from "./AssignRoleDialog";

interface EventDetailProps {
  token: string;
  event: CampEvent;
  roles: ScheduleRole[];
  staff: Staff[];
  crumbs: Crumb[];
  onEdit: () => void;
  onOpenStaff: (staffId: string) => void;
  onOpenRole: (roleId: string) => void;
  /** open the função editor (the ✏️ on its instructions / preparation) */
  onEditRole: (roleId: string) => void;
}

/**
 * One event: when, notes and every role with the people doing it. The escala
 * is edited right here — "Adicionar +" on a role picks someone, "×" on a person
 * removes them. Default ("toda a equipe") roles only show a count: everyone not
 * listed above is doing them.
 */
export default function EventDetail({ token, event: e, roles, staff, crumbs, onEdit, onOpenStaff, onOpenRole, onEditRole }: EventDetailProps) {
  /** role we're adding someone to */
  const [addTo, setAddTo] = useState<ScheduleRole | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const confirm = useConfirm();

  const roleById = useMemo(() => new Map(roles.map((r) => [r.id, r])), [roles]);
  const staffById = useMemo(() => new Map(staff.map((s) => [s.id, s])), [staff]);

  const eventRoles = e.roles.map((id) => roleById.get(id)).filter((r): r is ScheduleRole => !!r);
  const specific = eventRoles.filter((r) => !r.forEveryone);
  const defaults = eventRoles.filter((r) => r.forEveryone);

  /** "em 🏊 Piscina · sábado 14:00" — shown under the title in the full-screen view */
  const eventContext = `em ${e.emoji} ${e.title} · ${speakDay(e.date, "weekday")} ${e.startTime}`;

  const assignedIds = new Set(e.assignments.map((a) => a.staffId));
  /** how many fall under the default roles: active staff without a specific role here */
  const everyoneCount = staff.filter((s) => s.active && !assignedIds.has(s.id)).length;

  async function handleRemove(staffId: string, role: ScheduleRole) {
    const s = staffById.get(staffId);
    const fallback = defaults[0];
    const ok = await confirm({
      emoji: "⛓️‍💥",
      title: `Tirar ${s?.name.split(" ")[0] ?? "esta pessoa"} de ${role.emoji} ${role.name}?`,
      message: fallback ? (
        <>
          A pessoa volta para a função padrão do evento: <strong>{fallback.emoji} {fallback.name}</strong>.
        </>
      ) : undefined,
      confirmLabel: "Tirar",
      danger: true,
    });
    if (!ok) return;
    setBusy(staffId);
    setError(null);
    try {
      await unassignStaff(token, e.id, staffId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Algo deu errado.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="admin-page">
      <Breadcrumbs items={crumbs} />
      <header className="admin-head">
        <h1 className="admin-title detail-title">
          <span aria-hidden="true">{e.emoji}</span> {e.title}
        </h1>
        <button type="button" className="icon-btn icon-btn--lg" title="Editar evento" aria-label="Editar evento" onClick={onEdit}>
          <span className="pencil" aria-hidden="true">✏️</span>
        </button>
      </header>

      <section className="detail-card">
        <dl className="detail-grid">
          <dt>Quando</dt>
          <dd>
            {speakDay(e.date)} · {e.startTime}
            {e.endTime && `–${e.endTime}`}
          </dd>
          {e.notes && (
            <>
              <dt>Observações</dt>
              <dd>{e.notes}</dd>
            </>
          )}
        </dl>
      </section>

      <section className="detail-section">
        <div className="detail-h2-row">
          <h2 className="detail-h2">
            🎯 Funções <span className="cat-tab__count">{eventRoles.length}</span>
          </h2>
          {/* top-right of the section: vincula uma nova função a este evento */}
          <button
            type="button"
            className="icon-btn event-role__add"
            title="Adicionar função neste evento"
            aria-label="Adicionar função neste evento"
            onClick={onEdit}
          >
            +
          </button>
        </div>

        {error && <p className="message message--error">{error}</p>}

        {eventRoles.length === 0 && (
          <p className="opt-empty">
            Este evento não tem funções.{" "}
            <button type="button" className="link-btn" onClick={onEdit}>
              adicionar
            </button>
          </p>
        )}

        {specific.map((r) => {
          const people = e.assignments
            .filter((a) => a.roleId === r.id)
            .sort((a, b) => (staffById.get(a.staffId)?.name ?? "").localeCompare(staffById.get(b.staffId)?.name ?? "", "pt-BR"));
          return (
            <div key={r.id} className="detail-card event-role">
              <div className="event-role__head">
                <button type="button" className="event-role__name" title={`Ver função ${r.name}`} onClick={() => onOpenRole(r.id)}>
                  <span aria-hidden="true">{r.emoji}</span> {r.name} ›
                </button>
                <span className="cat-tab__count">{people.length}</span>
              </div>
              <div className="staff-card__tags">
                {people.map((a) => {
                  const s = staffById.get(a.staffId);
                  return (
                    <span key={a.staffId} className={`staff-tag staff-tag--soft staff-tag--person ${busy === a.staffId ? "staff-tag--busy" : ""}`}>
                      <button type="button" className="staff-tag__open" title={`Ver ${s?.name ?? ""}`} onClick={() => onOpenStaff(a.staffId)}>
                        {s?.name ?? "?"}
                        {a.detail && <span className="staff-tag__n">{a.detail}</span>}
                      </button>
                      <button
                        type="button"
                        className="staff-tag__x"
                        title={`Tirar ${s?.name ?? ""} de ${r.name}`}
                        aria-label={`Tirar ${s?.name ?? ""} de ${r.name}`}
                        disabled={!!busy}
                        onClick={() => handleRemove(a.staffId, r)}
                      >
                        ×
                      </button>
                    </span>
                  );
                })}
                {/* always closes the row of people */}
                <button type="button" className="add-person-btn" title={`Escalar alguém como ${r.name}`} disabled={!!busy} onClick={() => setAddTo(r)}>
                  {people.length === 0 ? "Adicionar pessoa" : "Adicionar"} <span aria-hidden="true">+</span>
                </button>
              </div>
              <RoleDocs role={r} context={eventContext} onEditRole={onEditRole} />
            </div>
          );
        })}

        {defaults.map((r) => (
          <div key={r.id} className="detail-card event-role event-role--default">
            <div className="event-role__head">
              <span className="cat-field__label">Padrão</span>
              <button type="button" className="event-role__name" title={`Ver função ${r.name}`} onClick={() => onOpenRole(r.id)}>
                <span aria-hidden="true">{r.emoji}</span> {r.name} ›
              </button>
              <span className="cat-tab__count">{everyoneCount}</span>
            </div>
            <p className="cat-hint">
              👥 Todos os <strong>{everyoneCount}</strong> voluntários ativos que não têm função específica acima.
            </p>
            <RoleDocs role={r} context={eventContext} onEditRole={onEditRole} />
          </div>
        ))}
      </section>

      <AssignRoleDialog
        key={addTo?.id ?? "none"}
        token={token}
        open={!!addTo}
        entry={{ eventId: e.id, roleId: addTo?.id ?? "" }}
        onClose={() => setAddTo(null)}
        onAssigned={() => {}}
      />
    </div>
  );
}

/**
 * What the team has to do in this função: what to bring/prepare beforehand and
 * the instructions for the day. Both are clamped to a scrollable box with a ⤢
 * to read the whole thing full screen.
 */
function RoleDocs({ role: r, context, onEditRole }: { role: ScheduleRole; context: string; onEditRole: (roleId: string) => void }) {
  const title = `${r.emoji} ${r.name}`;
  const edit = () => onEditRole(r.id);
  return (
    <div className="event-role__docs">
      <RichTextBox
        label="🎒 Preparação (antes do acampamento)"
        html={r.preparation}
        title={title}
        context={context}
        emptyHint="Nada a preparar para esta função."
        onEdit={edit}
      />
      <RichTextBox
        label="📝 Instruções para a equipe"
        html={r.instructions}
        title={title}
        context={context}
        emptyHint="Sem instruções ainda."
        onEdit={edit}
      />
    </div>
  );
}
