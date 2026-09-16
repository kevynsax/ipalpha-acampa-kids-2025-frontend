import { BEDROOM_GROUPS, GROUP_META, type BedroomGroup } from "../api/bedrooms";
import type { KnownPlaceRoom } from "./places";

interface RoomsEditorProps {
  rooms: KnownPlaceRoom[];
  onChange: (rooms: KnownPlaceRoom[]) => void;
  disabled?: boolean;
}

/**
 * The editable room rows of a known place (name, wing, bunk beds, single
 * beds) — shared by the wizard's venue step and the super admin's
 * ⚙️ → Sementes page, so both stay in sync.
 */
export default function RoomsEditor({ rooms, onChange, disabled }: RoomsEditorProps) {
  const patch = (i: number, p: Partial<KnownPlaceRoom>) => onChange(rooms.map((r, j) => (j === i ? { ...r, ...p } : r)));
  return (
    <div className="wizard-rooms">
      {rooms.map((r, i) => (
        <div key={i} className="wizard-rooms__row">
          <label className="cat-field">
            <span className="cat-field__label">Quarto</span>
            <input className="cat-input" value={r.name} maxLength={40} disabled={disabled} onChange={(e) => patch(i, { name: e.target.value })} />
          </label>
          <label className="cat-field">
            <span className="cat-field__label">Ala</span>
            <select className="cat-input" value={r.group} disabled={disabled} onChange={(e) => patch(i, { group: e.target.value as BedroomGroup })}>
              {BEDROOM_GROUPS.map((g) => (
                <option key={g} value={g}>
                  {GROUP_META[g].label}
                </option>
              ))}
            </select>
          </label>
          <label className="cat-field wizard-rooms__n">
            <span className="cat-field__label">Beliches</span>
            <input
              className="cat-input"
              type="number"
              min={0}
              max={30}
              inputMode="numeric"
              value={r.bunkBeds}
              disabled={disabled}
              onChange={(e) => patch(i, { bunkBeds: Math.max(0, Number(e.target.value) || 0) })}
            />
          </label>
          <label className="cat-field wizard-rooms__n">
            <span className="cat-field__label">Solteiras</span>
            <input
              className="cat-input"
              type="number"
              min={0}
              max={30}
              inputMode="numeric"
              value={r.singleBeds}
              disabled={disabled}
              onChange={(e) => patch(i, { singleBeds: Math.max(0, Number(e.target.value) || 0) })}
            />
          </label>
          <button
            type="button"
            className="helpers-tag__x wizard-rooms__x"
            title="Remover quarto"
            aria-label="Remover quarto"
            disabled={disabled}
            onClick={() => onChange(rooms.filter((_, j) => j !== i))}
          >
            ✕
          </button>
        </div>
      ))}
      <button type="button" className="button button--secondary list-head__add" disabled={disabled} onClick={() => onChange([...rooms, { name: "", group: "girls", bunkBeds: 2, singleBeds: 0 }])}>
        ➕ Quarto
      </button>
    </div>
  );
}
