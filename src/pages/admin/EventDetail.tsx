import { useMemo, useState } from "react";
import { formatEventDate, unassignStaff, type CampEvent, type ScheduleRole } from "../../api/schedule";
import type { Staff } from "../../api/staff";
import Breadcrumbs, { type Crumb } from "../../components/Breadcrumbs";
import { useConfirm } from "../../components/ConfirmDialog";
import InstructionsDialog from "../../components/InstructionsDialog";
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
}

/**
 * One event: when, notes and every role with the people doing it. The escala
 * is edited right here — "+" on a role picks someone, "×" on a person removes
 * them. Default ("toda a equipe") roles only show a count: everyone not
 * listed above is doing them.
 */
export default function EventDetail({ token, event: e, roles, staff, crumbs, onEdit, onOpenStaff, onOpenRole }: EventDetailProps) {
  const [instructionsFor, setInstructionsFor] = useState<ScheduleRole | null>(null);
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
          ✏️
        </button>
      </header>

      <section className="detail-card">
        <dl className="detail-grid">
          <dt>Quando</dt>
          <dd>
            {formatEventDate(e.date)} · {e.startTime}
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
        <h2 className="detail-h2">
          🎯 Funções <span className="cat-tab__count">{eventRoles.length}</span>
        </h2>

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
                {r.instructions && (
                  <button type="button" className="link-btn" onClick={() => setInstructionsFor(r)}>
                    📝 instruções
                  </button>
                )}
                <button
                  type="button"
                  className="icon-btn event-role__add"
                  title={`Escalar alguém como ${r.name}`}
                  aria-label={`Escalar alguém como ${r.name}`}
                  disabled={!!busy}
                  onClick={() => setAddTo(r)}
                >
                  +
                </button>
              </div>
              {people.length === 0 ? (
                <p className="assign-role__empty">ninguém escalado</p>
              ) : (
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
                </div>
              )}
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
              {r.instructions && (
                <button type="button" className="link-btn" onClick={() => setInstructionsFor(r)}>
                  📝 instruções
                </button>
              )}
            </div>
            <p className="cat-hint">
              👥 Todos os <strong>{everyoneCount}</strong> voluntários ativos que não têm função específica acima.
            </p>
          </div>
        ))}
      </section>

      <InstructionsDialog role={instructionsFor} onClose={() => setInstructionsFor(null)} />
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
