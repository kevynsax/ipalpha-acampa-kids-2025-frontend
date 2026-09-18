import { useState, type ReactNode } from "react";
import { blankMedication, type Medication } from "../api/campers";
import { useI18n } from "../i18n";
import { ICONS } from "../icons";
import Toggle from "./Toggle";
import TimeInput from "./TimeInput";

/** the camp's daily moments — one tap each; anything else goes in the custom time box */
export const MEDICATION_PRESETS: { time: string; label: string; emoji?: string; icon?: string }[] = [
  { time: "08:30", label: "Café", emoji: "🥐" },
  { time: "12:30", label: "Almoço", emoji: "🍽️" },
  { time: "16:30", label: "Lanche", emoji: "🍎" },
  { time: "19:00", label: "Jantar", emoji: "🌙" },
  { time: "22:00", label: "Dormir", icon: ICONS.bed },
];

function presetMark(p: { emoji?: string; icon?: string }): ReactNode {
  return p.icon ? <img className="audience-icon" src={p.icon} alt="" aria-hidden="true" /> : p.emoji;
}

/** "08:30" → "Café 08:30" when it is a preset, else just the time */
export function medicationTimeLabel(time: string): string {
  const p = MEDICATION_PRESETS.find((x) => x.time === time);
  return p ? `${p.label} ${time}` : time;
}

interface MedicationsEditorProps {
  value: Medication[];
  onChange: (next: Medication[]) => void;
  disabled?: boolean;
}

/**
 * The person's medicines, one card each: what + dose, WHEN (fixed times of the
 * day, or "quando necessário"), and a note. The times feed the medical
 * team's checklist, so a medicine with neither is flagged "a confirmar".
 */
export default function MedicationsEditor({ value, onChange, disabled }: MedicationsEditorProps) {
  const { tx } = useI18n();
  const update = (i: number, patch: Partial<Medication>) => onChange(value.map((m, j) => (j === i ? { ...m, ...patch } : m)));
  const remove = (i: number) => onChange(value.filter((_, j) => j !== i));
  const add = () => onChange([...value, blankMedication()]);

  return (
    <div className="meds">
      {value.map((m, i) => (
        <MedicationCard key={i} med={m} disabled={disabled} onChange={(patch) => update(i, patch)} onRemove={() => remove(i)} />
      ))}
      <button type="button" className="button button--secondary meds__add" disabled={disabled} onClick={add}>
        + {value.length ? tx("Outro medicamento") : tx("Adicionar medicamento")}
      </button>
    </div>
  );
}

function MedicationCard({ med: m, disabled, onChange, onRemove }: { med: Medication; disabled?: boolean; onChange: (p: Partial<Medication>) => void; onRemove: () => void }) {
  const { tx } = useI18n();
  const [custom, setCustom] = useState("");
  const toggleTime = (t: string) => onChange({ times: m.times.includes(t) ? m.times.filter((x) => x !== t) : [...m.times, t].sort() });
  const addCustom = () => {
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(custom)) return;
    if (!m.times.includes(custom)) onChange({ times: [...m.times, custom].sort() });
    setCustom("");
  };
  const extras = m.times.filter((t) => !MEDICATION_PRESETS.some((p) => p.time === t));
  const unscheduled = !m.asNeeded && m.times.length === 0;

  return (
    <div className="meds__card">
      <button type="button" className="icon-btn icon-btn--danger meds__remove" title={tx("Remover medicamento")} aria-label={tx("Remover medicamento")} disabled={disabled} onClick={onRemove}>
        🗑️
      </button>
      <div className="cat-form__row staff-form__row">
        <label className="cat-field cat-field--grow">
          <span className="cat-field__label">💊 {tx("Medicamento")}</span>
          <input className="cat-input" value={m.name} placeholder={tx("ex.: Ritalina")} maxLength={120} disabled={disabled} onChange={(e) => onChange({ name: e.target.value })} />
        </label>
        <label className="cat-field meds__dose">
          <span className="cat-field__label">{tx("Dose")}</span>
          <input className="cat-input" value={m.dose} placeholder={tx("ex.: 10mg, 1 comprimido")} maxLength={120} disabled={disabled} onChange={(e) => onChange({ dose: e.target.value })} />
        </label>
      </div>

      <fieldset className="cat-fieldset">
        <legend className="cat-field__label">{tx("Quando")}</legend>
        <div className="chip-group">
          {MEDICATION_PRESETS.map((p) => {
            const on = m.times.includes(p.time);
            return (
              <button key={p.time} type="button" className={`chip-toggle chip-toggle--small ${on ? "chip-toggle--on" : ""}`} aria-pressed={on} disabled={disabled || m.asNeeded} onClick={() => toggleTime(p.time)}>
                {presetMark(p)} {tx(p.label)} <span className="meds__chip-time">{p.time}</span>
              </button>
            );
          })}
          {extras.map((t) => (
            <button key={t} type="button" className="chip-toggle chip-toggle--small chip-toggle--on" aria-pressed="true" title={tx("Remover horário")} disabled={disabled || m.asNeeded} onClick={() => toggleTime(t)}>
              🕒 {t} ×
            </button>
          ))}
          <span className="meds__custom">
            <TimeInput
              className="meds__custom-input"
              value={custom}
              clearable
              disabled={disabled || m.asNeeded}
              aria-label={tx("Outro horário")}
              onChange={setCustom}
              onEnter={addCustom}
            />
            <button type="button" className="icon-btn" title={tx("Adicionar horário")} aria-label={tx("Adicionar horário")} disabled={disabled || m.asNeeded || !custom} onClick={addCustom}>
              +
            </button>
          </span>
        </div>
        <Toggle
          checked={m.asNeeded}
          onChange={(v) => onChange({ asNeeded: v, times: v ? [] : m.times })}
          disabled={disabled}
          label={
            <>
              {tx("Sem horário fixo")}
              <span className="meds__asneeded-extra"> {tx("(quando necessário)")}</span>
            </>
          }
        />
        {unscheduled && <p className="cat-hint cat-hint--error">{tx("Sem horário: a equipe médica vai precisar confirmar com os pais.")}</p>}
      </fieldset>

      <label className="cat-field cat-field--grow">
        <span className="cat-field__label">{tx("Como / observação")}</span>
        <input className="cat-input" value={m.notes} placeholder={tx("ex.: junto com o café, 1 gota em cada olho")} maxLength={300} disabled={disabled} onChange={(e) => onChange({ notes: e.target.value })} />
      </label>
    </div>
  );
}
