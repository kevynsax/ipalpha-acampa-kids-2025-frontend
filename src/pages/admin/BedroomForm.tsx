import { useState } from "react";
import { BEDROOM_GROUPS, GROUP_META, type Bedroom, type BedroomGroup, type BedroomInput } from "../../api/bedrooms";
import BunkIcon from "../../components/BunkIcon";
import GroupIcon from "../../components/GroupIcon";
import { ICONS } from "../../icons";
import { useHideScanFab } from "../../scanFab";

interface BedroomFormProps {
  bedroom?: Bedroom;
  /** pre-select a group when creating from a group header */
  defaultGroup?: BedroomGroup;
  busy?: boolean;
  onSubmit: (input: BedroomInput) => Promise<void>;
  onCancel: () => void;
}

const BEDS_MAX = 50;

/** Create / edit a bedroom: number, wing and bed layout (bunk + single). */
export default function BedroomForm({ bedroom, defaultGroup, busy, onSubmit, onCancel }: BedroomFormProps) {
  // the "Ler crachá" FAB would sit on top of Salvar / Cancelar
  useHideScanFab();
  const editing = !!bedroom;
  const [name, setName] = useState(bedroom?.name ?? "");
  const [group, setGroup] = useState<BedroomGroup>(bedroom?.group ?? defaultGroup ?? "girls");
  const [bunkBeds, setBunkBeds] = useState(bedroom?.bunkBeds ?? 2);
  const [singleBeds, setSingleBeds] = useState(bedroom?.singleBeds ?? 0);
  const [notes, setNotes] = useState(bedroom?.notes ?? "");
  const [error, setError] = useState<string | null>(null);

  const capacity = bunkBeds * 2 + singleBeds;
  const valid = name.trim().length > 0 && capacity > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;
    setError(null);
    try {
      await onSubmit({ name: name.trim(), group, bunkBeds, singleBeds, notes: notes.trim() });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Algo deu errado.");
    }
  }

  function renderCounter(label: React.ReactNode, aria: string, hint: string, value: number, set: (n: number) => void) {
    const clamp = (n: number) => Math.max(0, Math.min(BEDS_MAX, n));
    return (
      <div className="cat-field cat-field--grow">
        <span className="cat-field__label cat-field__label--icon">{label}</span>
        <div className="counter">
          <button type="button" className="counter__btn" disabled={busy || value <= 0} onClick={() => set(clamp(value - 1))}>
            −
          </button>
          <input
            className="counter__input"
            type="number"
            inputMode="numeric"
            min={0}
            max={BEDS_MAX}
            value={value}
            disabled={busy}
            onChange={(e) => set(clamp(Number(e.target.value) || 0))}
            aria-label={aria}
          />
          <button type="button" className="counter__btn" disabled={busy || value >= BEDS_MAX} onClick={() => set(clamp(value + 1))}>
            +
          </button>
        </div>
        <span className="cat-hint">{hint}</span>
      </div>
    );
  }

  return (
    <form className="cat-form cat-form--plain" onSubmit={handleSubmit}>
      <div className="cat-form__row staff-form__row">
        <label className="cat-field" style={{ width: 140 }}>
          <span className="cat-field__label">Número</span>
          <input
            className="cat-input"
            placeholder="ex.: 103"
            value={name}
            maxLength={30}
            autoFocus
            disabled={busy}
            onChange={(e) => setName(e.target.value)}
          />
        </label>

        <fieldset className="cat-fieldset cat-field--grow">
          <legend className="cat-field__label">Ala</legend>
          <div className="chip-group">
            {BEDROOM_GROUPS.map((g) => {
              const m = GROUP_META[g];
              const on = group === g;
              return (
                <button
                  key={g}
                  type="button"
                  className={`chip-toggle ${on ? "chip-toggle--on" : ""}`}
                  aria-pressed={on}
                  disabled={busy}
                  onClick={() => setGroup(g)}
                >
                  <GroupIcon group={g} /> {m.label}
                </button>
              );
            })}
          </div>
        </fieldset>
      </div>

      <div className="cat-form__row staff-form__row">
        {renderCounter(<><BunkIcon size={18} /> Beliches</>, "Beliches", "cada beliche dorme 2", bunkBeds, setBunkBeds)}
        {renderCounter(<><img className="audience-icon" src={ICONS.bed} alt="" aria-hidden="true" /> Camas de solteiro</>, "Camas de solteiro", "cada cama dorme 1", singleBeds, setSingleBeds)}
        <div className="cat-field capacity-box">
          <span className="cat-field__label">Capacidade</span>
          <span className="capacity-box__value">{capacity}</span>
          <span className="cat-hint">{capacity === 1 ? "pessoa" : "pessoas"}</span>
        </div>
      </div>
      {capacity === 0 && <p className="cat-hint cat-hint--error">O quarto precisa ter ao menos uma cama.</p>}

      <label className="cat-field">
        <span className="cat-field__label">Observações (opcional)</span>
        <input
          className="cat-input"
          placeholder="ex.: fica ao lado da enfermaria"
          value={notes}
          maxLength={300}
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
          {busy ? "Salvando…" : editing ? "Salvar" : "Criar quarto 🎉"}
        </button>
      </div>
    </form>
  );
}
