import { useMemo, useState } from "react";
import { assignStaff, unassignStaff, updateRole, roleDetailOf, DETAIL_COLORS, type CampEvent, type ScheduleRole, type ScheduleRoleInput } from "../../api/schedule";
import { contrastText } from "../../api/teams";
import { useTeamOf } from "../../store/derive";
import { speakDay } from "../../dates";
import type { Staff } from "../../api/staff";
import Breadcrumbs, { type Crumb } from "../../components/Breadcrumbs";
import { useConfirm } from "../../components/ConfirmDialog";
import RichTextBox from "../../components/RichTextBox";
import Dialog from "../../components/Dialog";
import { ICONS } from "../../icons";
import AddRoleToEventDialog from "./AddRoleToEventDialog";
import AssignRoleDialog from "./AssignRoleDialog";
import RoleDocEditor, { type RoleDocField } from "./RoleDocEditor";
import RoleForm from "./RoleForm";

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
 * is edited right here — "Adicionar +" on a role picks someone, "×" on a person
 * removes them. Default ("toda a equipe") roles only show a count: everyone not
 * listed above is doing them.
 */
export default function EventDetail({ token, event: e, roles, staff, crumbs, onEdit, onOpenStaff, onOpenRole }: EventDetailProps) {
  /** role we're adding someone to */
  const [addTo, setAddTo] = useState<ScheduleRole | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  /** função being edited right here, in a dialog (the ✏️ in its corner) */
  const [editRole, setEditRole] = useState<ScheduleRole | null>(null);
  /** the "+" of the seção: pick an existing função or create one */
  const [addingRole, setAddingRole] = useState(false);
  /** writing one of a função's texts, with the AI assistant open */
  const [editDoc, setEditDoc] = useState<{ role: ScheduleRole; field: RoleDocField } | null>(null);
  const [savingRole, setSavingRole] = useState(false);
  /** per-person detail being typed (Base 1, Time Belém…) */
  const [editDetail, setEditDetail] = useState<{ role: ScheduleRole; staffId: string; value: string; color: string } | null>(null);
  const [savingDetail, setSavingDetail] = useState(false);
  const confirm = useConfirm();

  async function handleSaveDetail(ev: React.FormEvent) {
    ev.preventDefault();
    if (!editDetail) return;
    setSavingDetail(true);
    setError(null);
    try {
      await assignStaff(token, e.id, editDetail.staffId, editDetail.role.id, editDetail.value.trim(), editDetail.color);
      setEditDetail(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Algo deu errado.");
    } finally {
      setSavingDetail(false);
    }
  }

  async function handleSaveRole(input: ScheduleRoleInput) {
    if (!editRole) return;
    setSavingRole(true);
    try {
      await updateRole(token, editRole.id, input);
      setEditRole(null);
    } finally {
      setSavingRole(false);
    }
  }

  const roleById = useMemo(() => new Map(roles.map((r) => [r.id, r])), [roles]);
  const staffById = useMemo(() => new Map(staff.map((s) => [s.id, s])), [staff]);
  const teamOf = useTeamOf();

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
          {/* top-right of the section: vincula uma função (existente ou nova) a este evento */}
          <button
            type="button"
            className="icon-btn event-role__add"
            title="Adicionar função neste evento"
            aria-label="Adicionar função neste evento"
            onClick={() => setAddingRole(true)}
          >
            +
          </button>
        </div>

        {error && <p className="message message--error">{error}</p>}

        {eventRoles.length === 0 && (
          <p className="opt-empty">
            Este evento não tem funções.{" "}
            <button type="button" className="link-btn" onClick={() => setAddingRole(true)}>
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
                <button
                  type="button"
                  className="icon-btn icon-btn--bare event-role__edit"
                  title={`Editar a função ${r.name}`}
                  aria-label={`Editar a função ${r.name}`}
                  onClick={() => setEditRole(r)}
                >
                  <img className="pencil-icon" src={ICONS.pencil} alt="" aria-hidden="true" />
                </button>
              </div>
              {r.detailFromTeam && <p className="cat-hint">🏳️ O detalhe é o time de cada um — mude o time na ficha da pessoa.</p>}
              <div className="staff-card__tags">
                {people.map((a) => {
                  const s = staffById.get(a.staffId);
                  // a team-backed role reads its chip from the person's team, live
                  const { detail, detailColor } = roleDetailOf(r, a, teamOf(s?.team));
                  return (
                    <span key={a.staffId} className={`staff-tag staff-tag--soft staff-tag--person ${busy === a.staffId ? "staff-tag--busy" : ""}`}>
                      <button type="button" className="staff-tag__open" title={`Ver ${s?.name ?? ""}`} onClick={() => onOpenStaff(a.staffId)}>
                        {s?.name ?? "?"}
                      </button>
                      {/* the team detail is read-only here: it is changed on the person, in Equipe */}
                      {r.hasDetail && r.detailFromTeam && (
                        <span
                          className={`staff-tag__detail ${detail ? "staff-tag__detail--tinted" : "staff-tag__detail--empty"}`}
                          style={detailColor ? { background: detailColor, color: contrastText(detailColor) } : undefined}
                          title={detail ? `Time de ${s?.name ?? ""}` : `${s?.name ?? "Esta pessoa"} não tem time`}
                        >
                          {detail || <span aria-hidden="true">sem time</span>}
                        </span>
                      )}
                      {r.hasDetail && !r.detailFromTeam && (
                        <button
                          type="button"
                          className={`staff-tag__detail ${detail ? "" : "staff-tag__detail--empty"} ${detailColor ? "staff-tag__detail--tinted" : ""}`}
                          style={detailColor ? { background: detailColor, color: contrastText(detailColor) } : undefined}
                          title={detail ? `Mudar o detalhe de ${s?.name ?? ""}` : `Preencher o detalhe de ${s?.name ?? ""}`}
                          aria-label={detail ? `Mudar o detalhe de ${s?.name ?? ""}: ${detail}` : `Preencher o detalhe de ${s?.name ?? ""}`}
                          disabled={!!busy}
                          onClick={() => setEditDetail({ role: r, staffId: a.staffId, value: a.detail, color: a.detailColor ?? "" })}
                        >
                          {detail || <span aria-hidden="true">-----</span>}
                        </button>
                      )}
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
              <RoleDocs role={r} context={eventContext} onEditDoc={(field) => setEditDoc({ role: r, field })} />
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
              <button
                type="button"
                className="icon-btn icon-btn--bare event-role__edit"
                title={`Editar a função ${r.name}`}
                aria-label={`Editar a função ${r.name}`}
                onClick={() => setEditRole(r)}
              >
                <img className="pencil-icon" src={ICONS.pencil} alt="" aria-hidden="true" />
              </button>
            </div>
            <p className="cat-hint">
              👥 Todos os <strong>{everyoneCount}</strong> voluntários ativos que não têm função específica acima.
            </p>
            <RoleDocs role={r} context={eventContext} onEditDoc={(field) => setEditDoc({ role: r, field })} />
          </div>
        ))}
      </section>

      <AddRoleToEventDialog token={token} open={addingRole} event={e} roles={roles} onClose={() => setAddingRole(false)} />

      {editDoc && (
        <RoleDocEditor
          token={token}
          role={editDoc.role}
          field={editDoc.field}
          context={eventContext}
          onClose={() => setEditDoc(null)}
        />
      )}

      <AssignRoleDialog
        key={addTo?.id ?? "none"}
        token={token}
        open={!!addTo}
        entry={{ eventId: e.id, roleId: addTo?.id ?? "" }}
        onClose={() => setAddTo(null)}
        onAssigned={() => {}}
      />

      <Dialog
        open={!!editRole}
        onClose={() => !savingRole && setEditRole(null)}
        title={editRole ? `${editRole.emoji} ${editRole.name}` : ""}
        width={680}
        dismissible={false}
      >
        {editRole && (
          <RoleForm

            embedded
            hideDocs
            token={token}
            role={editRole}
            busy={savingRole}
            onSubmit={handleSaveRole}
            onCancel={() => setEditRole(null)}
          />
        )}
      </Dialog>

      <Dialog
        open={!!editDetail}
        onClose={() => !savingDetail && setEditDetail(null)}
        title={editDetail ? `${editDetail.role.emoji} ${editDetail.role.name}` : ""}
        width={460}
      >
        {editDetail && (
          <form className="cat-form cat-form--embedded" onSubmit={handleSaveDetail}>
            <h2 className="cat-form__title change-room__title">
              🏷️ Detalhe — {staffById.get(editDetail.staffId)?.name.split(" ")[0] ?? ""}
            </h2>
            <label className="cat-field">
              <span className="cat-field__label">Detalhe</span>
              <input
                className="cat-input"
                placeholder={editDetail.role.detailPlaceholder || "ex.: Base 3"}
                value={editDetail.value}
                maxLength={60}
                autoFocus
                disabled={savingDetail}
                onChange={(ev) => setEditDetail({ ...editDetail, value: ev.target.value })}
              />
            </label>
            <div className="cat-field">
              <span className="cat-field__label">Cor</span>
              <div className="swatch-group">
                <button
                  type="button"
                  className={`swatch swatch--none ${editDetail.color ? "" : "swatch--on"}`}
                  title="Sem cor"
                  aria-label="Sem cor"
                  aria-pressed={!editDetail.color}
                  disabled={savingDetail}
                  onClick={() => setEditDetail({ ...editDetail, color: "" })}
                >
                  ✕
                </button>
                {DETAIL_COLORS.map((c) => (
                  <button
                    key={c.hex}
                    type="button"
                    className={`swatch ${editDetail.color.toLowerCase() === c.hex ? "swatch--on" : ""}`}
                    style={{ background: c.hex }}
                    title={c.name}
                    aria-label={c.name}
                    aria-pressed={editDetail.color.toLowerCase() === c.hex}
                    disabled={savingDetail}
                    onClick={() => setEditDetail({ ...editDetail, color: c.hex })}
                  />
                ))}
                <label className="swatch swatch--custom" title="Cor personalizada">
                  <input
                    type="color"
                    value={editDetail.color || "#0f9a8a"}
                    disabled={savingDetail}
                    onChange={(ev) => setEditDetail({ ...editDetail, color: ev.target.value })}
                    aria-label="Cor personalizada"
                  />
                </label>
              </div>
            </div>
            <div className="cat-form__actions">
              <button type="button" className="button button--secondary" disabled={savingDetail} onClick={() => setEditDetail(null)}>
                Cancelar
              </button>
              <button type="submit" className="button button--primary" disabled={savingDetail}>
                {savingDetail ? "Salvando…" : "Salvar"}
              </button>
            </div>
          </form>
        )}
      </Dialog>
    </div>
  );
}

/**
 * What the team has to do in this função: what to bring/prepare beforehand and
 * the instructions for the day. Both are clamped to a scrollable box with a ⤢
 * to read the whole thing full screen.
 */
function RoleDocs({ role: r, context, onEditDoc }: { role: ScheduleRole; context: string; onEditDoc: (field: RoleDocField) => void }) {
  const title = `${r.emoji} ${r.name}`;
  return (
    <div className="event-role__docs">
      <RichTextBox
        label="🎒 Preparação (antes do acampamento)"
        html={r.preparation}
        title={title}
        context={context}
        emptyHint="Nada a preparar para esta função."
        onEdit={() => onEditDoc("preparation")}
      />
      <RichTextBox
        label="📝 Instruções para a equipe"
        html={r.instructions}
        title={title}
        context={context}
        emptyHint="Sem instruções ainda."
        onEdit={() => onEditDoc("instructions")}
      />
    </div>
  );
}
