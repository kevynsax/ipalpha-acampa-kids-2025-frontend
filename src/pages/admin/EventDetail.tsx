import { useMemo, useState } from "react";
import { assignStaff, isForWholeTeam, peopleInRole, unassignStaff, updateEvent, updateRole, roleDetailOf, DETAIL_COLORS, type CampEvent, type ScheduleRole, type ScheduleRoleInput } from "../../api/schedule";
import { positionsMeta } from "../../components/AutoRoleBadge";
import { contrastText } from "../../api/teams";
import { useTeamOf } from "../../store/derive";
import { speakDay } from "../../dates";
import type { Staff } from "../../api/staff";
import Breadcrumbs, { type Crumb } from "../../components/Breadcrumbs";
import { useConfirm } from "../../components/ConfirmDialog";
import RichTextBox from "../../components/RichTextBox";
import Dialog from "../../components/Dialog";
import ParentIcon from "../../components/ParentIcon";
import Toggle from "../../components/Toggle";
import { ICONS } from "../../icons";
import AddRoleDialog from "./AddRoleDialog";
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
}

/**
 * One event: when, notes and every role with the people doing it. The escala
 * is edited right here — "Adicionar +" on a role picks someone, "×" on a person
 * removes them. Automatic roles are not escaladas: they fall on the whole team
 * or on one position (Líderes / Auxiliares) of the event — their card lists who
 * that is right now.
 */
export default function EventDetail({ token, event: e, roles, staff, crumbs, onEdit, onOpenStaff }: EventDetailProps) {
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
  const [savingParents, setSavingParents] = useState(false);
  const confirm = useConfirm();
  const parentsSee = e.visibleToParents !== false;

  async function handleParentsVisible(next: boolean) {
    if (next === parentsSee) return;
    setSavingParents(true);
    setError(null);
    try {
      await updateEvent(token, e.id, { visibleToParents: next });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Algo deu errado.");
    } finally {
      setSavingParents(false);
    }
  }

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

  /** "em 🏊 Piscina · sábado 14:00" — shown under the title in the full-screen view */
  const eventContext = `em ${e.emoji} ${e.title} · ${speakDay(e.date, "weekday")} ${e.startTime}`;

  /** everyone a função reaches here — escalados by hand first, then those it falls on by posição */
  const whoDoes = (r: ScheduleRole) => peopleInRole(e, r, staff, roleById);

  /** tirar alguém da função é um clique só — é fácil de desfazer ("Adicionar +"), não pede confirmação */
  async function handleRemove(staffId: string) {
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

  async function handleUnplug(role: ScheduleRole) {
    const people = whoDoes(role).length;
    const ok = await confirm({
      emoji: "✕",
      title: `Tirar ${role.emoji} ${role.name} deste evento?`,
      message: people
        ? <>As {people} pessoa{people === 1 ? "" : "s"} que {people === 1 ? "faz" : "fazem"} esta função aqui saem dela neste evento. A função continua no catálogo.</>
        : <>A função sai deste evento. Ela continua no catálogo.</>,
      confirmLabel: "Tirar",
      danger: true,
    });
    if (!ok) return;
    setBusy(`role:${role.id}`);
    setError(null);
    try {
      await updateEvent(token, e.id, { roles: e.roles.filter((id) => id !== role.id) });
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
          <dt>Pais</dt>
          <dd>
            <Toggle checked={parentsSee} onChange={(v) => void handleParentsVisible(v)} disabled={savingParents} label={<><ParentIcon size={16} /> {parentsSee ? "veem" : "não veem"}</>} />
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

        {eventRoles.map((r) => {
          const people = whoDoes(r);
          /* escalados à mão: são os únicos citados nome por nome */
          const picked = people.filter((p) => p.via === "person");
          /* pela posição: vira um chip só, com a contagem — a lista de nomes seria o quarto inteiro */
          const byPosition = people.length - picked.length;
          const positions = positionsMeta(r.forRoomRoles);
          return (
            <div key={r.id} className={`detail-card event-role ${positions ? "event-role--default" : ""}`}>
              <div className="event-role__head">
                {positions && <span className="cat-field__label event-role__standard">Por posição</span>}
                <h3 className="event-role__name">
                  <span aria-hidden="true">{r.emoji}</span> {r.name}
                </h3>
                <span className="cat-tab__count event-role__count">{people.length}</span>
                <div className="event-role__actions">
                  <button
                    type="button"
                    className="icon-btn icon-btn--bare"
                    title={`Editar a função ${r.name}`}
                    aria-label={`Editar a função ${r.name}`}
                    onClick={() => setEditRole(r)}
                  >
                    <img className="pencil-icon" src={ICONS.pencil} alt="" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    className="icon-btn icon-btn--bare"
                    title={`Tirar ${r.name} deste evento`}
                    aria-label={`Tirar ${r.name} deste evento`}
                    disabled={!!busy}
                    onClick={() => void handleUnplug(r)}
                  >
                    <span className="event-role__x" aria-hidden="true">×</span>
                  </button>
                </div>
              </div>

              {r.detailFromTeam && <p className="cat-hint">🚩 O detalhe é o time de cada um — mude o time na ficha da pessoa.</p>}

              <div className="staff-card__tags">
                {/* quem pega pela posição entra como UM chip com a contagem, não nome por nome */}
                {positions && (
                  <span
                    className="staff-tag staff-tag--everyone"
                    title={`${byPosition} ${byPosition === 1 ? "pessoa" : "pessoas"}: ${positions.hint}, sem escalar uma por uma`}
                  >
                    <img className="audience-icon" src={positions.icon} alt="" aria-hidden="true" /> {positions.label}
                    <span className="staff-tag__n">{byPosition}</span>
                  </span>
                )}
                {picked.map(({ staff: s, assignment }) => {
                  // a team-backed role reads its chip from the person's team, live
                  const { detail, detailColor } = roleDetailOf(r, assignment, teamOf(s.team));
                  return (
                    <span
                      key={s.id}
                      className={`staff-tag staff-tag--soft staff-tag--person ${busy === s.id ? "staff-tag--busy" : ""}`}
                      title={`${s.name} foi escalado(a) à mão`}
                    >
                      <button type="button" className="staff-tag__open" title={`Ver ${s.name}`} onClick={() => onOpenStaff(s.id)}>
                        {s.name}
                      </button>
                      {/* the team detail is read-only here: it is changed on the person, in Equipe */}
                      {r.hasDetail && r.detailFromTeam && (
                        <span
                          className={`staff-tag__detail ${detail ? "staff-tag__detail--tinted" : "staff-tag__detail--empty"}`}
                          style={detailColor ? { background: detailColor, color: contrastText(detailColor) } : undefined}
                          title={detail ? `Time de ${s.name}` : `${s.name} não tem time`}
                        >
                          {detail || <span aria-hidden="true">sem time</span>}
                        </span>
                      )}
                      {r.hasDetail && !r.detailFromTeam && (
                        <button
                          type="button"
                          className={`staff-tag__detail ${detail ? "" : "staff-tag__detail--empty"} ${detailColor ? "staff-tag__detail--tinted" : ""}`}
                          style={detailColor ? { background: detailColor, color: contrastText(detailColor) } : undefined}
                          title={detail ? `Mudar o detalhe de ${s.name}` : `Preencher o detalhe de ${s.name}`}
                          aria-label={detail ? `Mudar o detalhe de ${s.name}: ${detail}` : `Preencher o detalhe de ${s.name}`}
                          disabled={!!busy}
                          onClick={() => setEditDetail({ role: r, staffId: s.id, value: assignment?.detail ?? "", color: assignment?.detailColor ?? "" })}
                        >
                          {detail || <span aria-hidden="true">-----</span>}
                        </button>
                      )}
                      <button
                        type="button"
                        className="staff-tag__x"
                        title={`Tirar ${s.name} de ${r.name}`}
                        aria-label={`Tirar ${s.name} de ${r.name}`}
                        disabled={!!busy}
                        onClick={() => handleRemove(s.id)}
                      >
                        ×
                      </button>
                    </span>
                  );
                })}
                {/* fecha a linha — mas "toda a equipe" já é todo mundo: não há quem acrescentar */}
                {!isForWholeTeam(r) && (
                  <button type="button" className="add-person-btn" title={`Escalar alguém como ${r.name}`} disabled={!!busy} onClick={() => setAddTo(r)}>
                    {people.length === 0 ? "Adicionar pessoa" : "Adicionar"} <span aria-hidden="true">+</span>
                  </button>
                )}
              </div>
              <RoleDocs role={r} context={eventContext} onEditDoc={(field) => setEditDoc({ role: r, field })} />
            </div>
          );
        })}
      </section>

      <AddRoleDialog
        token={token}
        open={addingRole}
        roles={roles}
        excludeIds={e.roles}
        where={`em ${e.emoji} ${e.title}`}
        onAdd={async (roleId) => {
          await updateEvent(token, e.id, { roles: [...e.roles, roleId] });
        }}
        onClose={() => setAddingRole(false)}
      />

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
        className="sheet-dialog role-sheet"
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
        label={<><img className="audience-icon" src={ICONS.preparation} alt="" aria-hidden="true" /> Preparação (antes do acampamento)</>}
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
