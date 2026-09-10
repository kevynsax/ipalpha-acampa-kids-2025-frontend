import { BEDROOM_GROUPS, GROUP_META, type Bedroom, type BedroomGroup } from "../api/bedrooms";
import type { Category, CategoryOption } from "../api/categories";

/** Options shown in a picker: the active ones + whatever is currently selected (even if inactive). */
function pickable(cat: Category | undefined, selected: string[] | string | null): CategoryOption[] {
  if (!cat) return [];
  const sel = new Set(Array.isArray(selected) ? selected : selected ? [selected] : []);
  return cat.options.filter((o) => o.active || sel.has(o.id));
}

interface SingleProps {
  label: string;
  category: Category | undefined;
  value: string | null;
  onChange: (v: string | null) => void;
  disabled?: boolean;
}

/** Single-choice category → <select>. */
export function CategorySelect({ label, category: cat, value, onChange, disabled }: SingleProps) {
  const options = pickable(cat, value);
  return (
    <label className="cat-field cat-field--grow">
      <span className="cat-field__label">
        {cat?.emoji ?? "🏷️"} {label}
      </span>
      <select className="cat-input" value={value ?? ""} disabled={disabled || !cat} onChange={(e) => onChange(e.target.value || null)}>
        <option value="">{cat ? "Não definido" : "Categoria não cadastrada"}</option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
            {!o.active ? " (inativo)" : ""}
          </option>
        ))}
      </select>
    </label>
  );
}

interface MultiProps {
  label: string;
  category: Category | undefined;
  value: string[];
  onChange: (v: string[]) => void;
  disabled?: boolean;
}

/** Multi-choice category → toggle chips. */
export function CategoryChips({ label, category: cat, value, onChange, disabled }: MultiProps) {
  const options = pickable(cat, value);
  const toggle = (id: string) => onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id]);
  return (
    <fieldset className="cat-fieldset">
      <legend className="cat-field__label">
        {cat?.emoji ?? "🏷️"} {label}
      </legend>
      {!cat && <p className="cat-hint">Categoria não cadastrada.</p>}
      {cat && options.length === 0 && <p className="cat-hint">Nenhuma opção cadastrada.</p>}
      <div className="chip-group">
        {options.map((o) => {
          const on = value.includes(o.id);
          return (
            <button
              key={o.id}
              type="button"
              className={`chip-toggle chip-toggle--small ${on ? "chip-toggle--on" : ""}`}
              aria-pressed={on}
              disabled={disabled}
              onClick={() => toggle(o.id)}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

interface BedroomProps {
  bedrooms: Bedroom[];
  value: string | null;
  onChange: (v: string | null) => void;
  /** the person's current room (so a full room they're already in stays selectable) */
  current?: string | null;
  /** only offer rooms of these wings */
  groups?: readonly BedroomGroup[];
  disabled?: boolean;
}

/** Bedroom picker grouped by wing, showing free places. */
export function BedroomSelect({ bedrooms, value, onChange, current, groups = BEDROOM_GROUPS, disabled }: BedroomProps) {
  return (
    <label className="cat-field cat-field--grow">
      <span className="cat-field__label">🛏️ Quarto</span>
      <select className="cat-input" value={value ?? ""} disabled={disabled || bedrooms.length === 0} onChange={(e) => onChange(e.target.value || null)}>
        <option value="">{bedrooms.length ? "Sem quarto" : "Nenhum quarto cadastrado"}</option>
        {groups.map((g) => {
          const rooms = bedrooms.filter((b) => b.group === g);
          if (!rooms.length) return null;
          return (
            <optgroup key={g} label={`${GROUP_META[g].emoji} ${GROUP_META[g].label}`}>
              {rooms.map((b) => {
                const mine = b.id === current;
                const free = b.available + (mine ? 1 : 0);
                const full = free <= 0;
                return (
                  <option key={b.id} value={b.id} disabled={full && !mine}>
                    {b.name} · {full ? "lotado" : `${free} de ${b.capacity} livre${free > 1 ? "s" : ""}`}
                  </option>
                );
              })}
            </optgroup>
          );
        })}
      </select>
    </label>
  );
}
