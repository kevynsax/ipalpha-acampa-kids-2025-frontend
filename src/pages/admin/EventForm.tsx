import { useState } from "react";
import Dialog from "../../components/Dialog";
import EmojiPicker from "../../components/EmojiPicker";
import type { CampEvent, CampEventInput, ScheduleRole, ScheduleRoleInput } from "../../api/schedule";
import RoleForm from "./RoleForm";

const EMOJI_SUGGESTIONS = ["📅", "🌅", "🥐", "🍽️", "🍝", "🏊", "🎯", "🌙", "🎤", "🙏", "🎶", "🔥", "🎬", "🛏️", "🚌", "🎁"];

/** today as "YYYY-MM-DD" in local time */
function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

interface EventFormProps {
  token: string;
  event?: CampEvent;
  roles: ScheduleRole[];
  /** pre-fill the date when creating from a day header */
  defaultDate?: string;
  busy?: boolean;
  onSubmit: (input: CampEventInput) => Promise<void>;
  onCancel: () => void;
  /** creates a role on the spot (from the inline dialog); the new role is added to the event */
  onCreateRole: (input: ScheduleRoleInput) => Promise<ScheduleRole>;
}

/** Create / edit an event: date, time window, title and which roles it needs (roles can be created inline). */
export default function EventForm({ token, event, roles, defaultDate, busy, onSubmit, onCancel, onCreateRole }: EventFormProps) {
  const [roleDialog, setRoleDialog] = useState(false);
  const [creatingRole, setCreatingRole] = useState(false);
  const editing = !!event;
  const [date, setDate] = useState(event?.date ?? defaultDate ?? todayIso());
  const [title, setTitle] = useState(event?.title ?? "");
  const [emoji, setEmoji] = useState(event?.emoji ?? "📅");
  const [startTime, setStartTime] = useState(event?.startTime ?? "08:00");
  const [endTime, setEndTime] = useState(event?.endTime ?? "");
  const [notes, setNotes] = useState(event?.notes ?? "");
  const [roleIds, setRoleIds] = useState<string[]>(event?.roles ?? []);
  const [error, setError] = useState<string | null>(null);

  const timeOk = /^\d{2}:\d{2}$/.test(startTime) && (!endTime || endTime > startTime);
  const dateOk = /^\d{4}-\d{2}-\d{2}$/.test(date);
  const valid = title.trim().length > 0 && timeOk && dateOk;

  const byId = new Map(roles.map((r) => [r.id, r]));
  const chosen = roleIds.map((id) => byId.get(id)).filter((r): r is ScheduleRole => !!r);
  const available = roles.filter((r) => !roleIds.includes(r.id));

  function addRole(id: string) {
    if (!id || roleIds.includes(id)) return;
    setRoleIds((prev) => [...prev, id]);
  }
  function removeRole(id: string) {
    setRoleIds((prev) => prev.filter((x) => x !== id));
  }

  async function handleCreateRole(input: ScheduleRoleInput) {
    setCreatingRole(true);
    try {
      const created = await onCreateRole(input);
      setRoleIds((prev) => (prev.includes(created.id) ? prev : [...prev, created.id]));
      setRoleDialog(false);
    } finally {
      setCreatingRole(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;
    setError(null);
    try {
      await onSubmit({
        date,
        title: title.trim(),
        emoji: emoji.trim() || "📅",
        startTime,
        endTime: endTime || null,
        notes: notes.trim(),
        roles: roleIds,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Algo deu errado.");
    }
  }

  return (
    <form className="cat-form" onSubmit={handleSubmit}>
      <h2 className="cat-form__title">{editing ? "✏️ Editar evento" : "✨ Novo evento"}</h2>

      <div className="cat-form__row">
        <div className="cat-field cat-field--emoji">
          <span className="cat-field__label">Ícone</span>
          <EmojiPicker value={emoji} onChange={setEmoji} suggestions={EMOJI_SUGGESTIONS} disabled={busy} />
        </div>
        <label className="cat-field cat-field--grow">
          <span className="cat-field__label">Título</span>
          <input
            className="cat-input"
            placeholder="ex.: Piscina"
            value={title}
            maxLength={80}
            autoFocus
            disabled={busy}
            onChange={(e) => setTitle(e.target.value)}
          />
        </label>
      </div>

      <div className="cat-form__row staff-form__row">
        <label className="cat-field">
          <span className="cat-field__label">Data</span>
          <input className="cat-input" type="date" value={date} disabled={busy} required onChange={(e) => setDate(e.target.value)} />
        </label>
        <label className="cat-field">
          <span className="cat-field__label">Início</span>
          <input className="cat-input" type="time" value={startTime} disabled={busy} required onChange={(e) => setStartTime(e.target.value)} />
        </label>
        <label className="cat-field">
          <span className="cat-field__label">Fim (opcional)</span>
          <input className="cat-input" type="time" value={endTime} disabled={busy} onChange={(e) => setEndTime(e.target.value)} />
        </label>
      </div>
      {endTime && endTime <= startTime && <p className="cat-hint cat-hint--error">O fim precisa ser depois do início.</p>}

      <fieldset className="cat-fieldset">
        <legend className="cat-field__label">🎯 Funções neste evento</legend>
        <p className="cat-hint">Quais funções a equipe precisa cumprir neste evento.</p>

        {chosen.length === 0 && <p className="opt-empty">Nenhuma função ainda — escolha abaixo ou crie uma nova.</p>}
        <ul className="slot-list">
          {chosen.map((role) => (
            <li key={role.id} className={`slot-item ${role.forEveryone ? "slot-item--everyone" : ""}`}>
              <span className="slot-item__emoji" aria-hidden="true">{role.emoji}</span>
              <span className="slot-item__name">
                {role.name}
                {role.forEveryone && <span className="slot-item__badge slot-item__badge--everyone">👥 toda a equipe</span>}
              </span>
              <button
                type="button"
                className="icon-btn icon-btn--danger slot-item__remove"
                title="Remover função"
                disabled={busy}
                onClick={() => removeRole(role.id)}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>

        <div className="slot-add">
          {available.length > 0 ? (
            <select className="cat-input" value="" disabled={busy} onChange={(e) => addRole(e.target.value)} aria-label="Adicionar função existente">
              <option value="">+ Adicionar função existente…</option>
              {available.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.emoji} {r.name}
                  {r.forEveryone ? " (toda a equipe)" : ""}
                </option>
              ))}
            </select>
          ) : (
            <p className="cat-hint slot-add__hint">{roles.length > 0 ? "Todas as funções já estão neste evento." : "Nenhuma função cadastrada ainda."}</p>
          )}
          <button type="button" className="button button--secondary slot-add__new" disabled={busy} onClick={() => setRoleDialog(true)}>
            ✨ Nova função
          </button>
        </div>
      </fieldset>

      <Dialog open={roleDialog} onClose={() => !creatingRole && setRoleDialog(false)} title="Nova função" width={680} dismissible={false}>
        <RoleForm embedded token={token} busy={creatingRole} onSubmit={handleCreateRole} onCancel={() => setRoleDialog(false)} />
      </Dialog>

      <label className="cat-field">
        <span className="cat-field__label">Observações (opcional)</span>
        <input
          className="cat-input"
          placeholder="ex.: levar apito e prancheta"
          value={notes}
          maxLength={500}
          disabled={busy}
          onChange={(e) => setNotes(e.target.value)}
        />
      </label>

      {error && <p className="message message--error">{error}</p>}

      <div className="cat-form__actions">
        <button type="button" className="button button--secondary" onClick={onCancel} disabled={busy}>
          Cancelar
        </button>
        <button type="submit" className="button button--primary" disabled={!valid || busy}>
          {busy ? "Salvando…" : editing ? "Salvar" : "Criar evento 🎉"}
        </button>
      </div>
    </form>
  );
}
