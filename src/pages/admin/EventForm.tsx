import { useState } from "react";
import EmojiPicker from "../../components/EmojiPicker";
import TimeInput from "../../components/TimeInput";
import type { CampEvent, CampEventInput } from "../../api/schedule";
import ParentIcon from "../../components/ParentIcon";
import Toggle from "../../components/Toggle";
import { useHideScanFab } from "../../scanFab";

const EMOJI_SUGGESTIONS = ["📅", "🌅", "🥐", "🍽️", "🍝", "🏊", "🎯", "🌙", "🎤", "🙏", "🎶", "🔥", "🎬", "🛏️", "🚌", "🎁"];

/** today as "YYYY-MM-DD" in local time */
function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

interface EventFormProps {
  event?: CampEvent;
  /** pre-fill the date when creating from a day header */
  defaultDate?: string;
  busy?: boolean;
  onSubmit: (input: CampEventInput) => Promise<void>;
  onCancel: () => void;
}

/** Create / edit an event: date, time window, title… The funções are linked
 *  on the event's own page afterwards — never here. */
export default function EventForm({ event, defaultDate, busy, onSubmit, onCancel }: EventFormProps) {
  // the "Ler crachá" FAB would sit on top of Salvar / Cancelar
  useHideScanFab();
  const editing = !!event;
  const [date, setDate] = useState(event?.date ?? defaultDate ?? todayIso());
  const [title, setTitle] = useState(event?.title ?? "");
  const [emoji, setEmoji] = useState(event?.emoji ?? "📅");
  const [startTime, setStartTime] = useState(event?.startTime ?? "08:00");
  const [endTime, setEndTime] = useState(event?.endTime ?? "");
  const [notes, setNotes] = useState(event?.notes ?? "");
  const [visibleToParents, setVisibleToParents] = useState(event?.visibleToParents ?? true);
  const [error, setError] = useState<string | null>(null);

  const timeOk = /^\d{2}:\d{2}$/.test(startTime) && (!endTime || endTime > startTime);
  const dateOk = /^\d{4}-\d{2}-\d{2}$/.test(date);
  const valid = title.trim().length > 0 && timeOk && dateOk;

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
        // funções are linked on the event page — an edit must not drop them
        roles: event?.roles ?? [],
        visibleToParents,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Algo deu errado.");
    }
  }

  return (
    <form className="cat-form cat-form--plain" onSubmit={handleSubmit}>
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
          <TimeInput value={startTime} disabled={busy} required onChange={setStartTime} aria-label="Hora de início" />
        </label>
        <label className="cat-field">
          <span className="cat-field__label">Fim (opcional)</span>
          <TimeInput value={endTime} disabled={busy} clearable onChange={setEndTime} aria-label="Hora de fim (opcional)" />
        </label>
      </div>
      {endTime && endTime <= startTime && <p className="cat-hint cat-hint--error">O fim precisa ser depois do início.</p>}

      <div className="cat-field opt-field">
        <div className="opt-field__head">
          <Toggle checked={visibleToParents} onChange={setVisibleToParents} disabled={busy} label={<><ParentIcon size={18} /> Pais veem</>} />
        </div>
        <p className="cat-hint">Aparece na programação dos pais. A equipe sempre vê.</p>
      </div>

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
