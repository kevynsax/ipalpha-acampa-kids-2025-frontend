import { BEDROOM_GROUPS, GROUP_META, type BedroomGroup } from "../api/bedrooms";
import { useI18n } from "../i18n";
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
  const { tx } = useI18n();
  const patch = (i: number, p: Partial<KnownPlaceRoom>) => onChange(rooms.map((r, j) => (j === i ? { ...r, ...p } : r)));
  return (
    <div className="wizard-rooms">
      {rooms.map((r, i) => (
        <div key={i} className="wizard-rooms__row">
          <label className="cat-field">
            <span className="cat-field__label">{tx("Quarto")}</span>
            <input className="cat-input" value={r.name} maxLength={40} disabled={disabled} onChange={(e) => patch(i, { name: e.target.value })} />
          </label>
          <label className="cat-field">
            <span className="cat-field__label">{tx("Ala")}</span>
            <select className="cat-input" value={r.group} disabled={disabled} onChange={(e) => patch(i, { group: e.target.value as BedroomGroup })}>
              {BEDROOM_GROUPS.map((g) => (
                <option key={g} value={g}>
                  {tx(GROUP_META[g].label)}
                </option>
              ))}
            </select>
          </label>
          <label className="cat-field wizard-rooms__n">
            <span className="cat-field__label">{tx("Beliches")}</span>
            <input
              className="cat-input"
              type="number"
              min={0}
              max={30}
              inputMode="numeric"
              value={r.bunkBeds ?? ""}
              disabled={disabled}
              onChange={(e) => {
                const raw = e.target.value;
                patch(i, { bunkBeds: raw === "" ? null : Math.max(0, Number(raw) || 0) });
              }}
            />
          </label>
          <label className="cat-field wizard-rooms__n">
            <span className="cat-field__label">{tx("Solteiras")}</span>
            <input
              className="cat-input"
              type="number"
              min={0}
              max={30}
              inputMode="numeric"
              value={r.singleBeds ?? ""}
              disabled={disabled}
              onChange={(e) => {
                const raw = e.target.value;
                patch(i, { singleBeds: raw === "" ? null : Math.max(0, Number(raw) || 0) });
              }}
            />
          </label>
          <button
            type="button"
            className="helpers-tag__x wizard-rooms__x"
            title={tx("Remover quarto")}
            aria-label={tx("Remover quarto")}
            disabled={disabled}
            onClick={() => onChange(rooms.filter((_, j) => j !== i))}
          >
            ✕
          </button>
        </div>
      ))}
      <button type="button" className="button button--secondary list-head__add" disabled={disabled} onClick={() => onChange([...rooms, { name: "", group: "girls", bunkBeds: 2, singleBeds: 0 }])}>
        {tx("➕ Quarto")}
      </button>
    </div>
  );
}
