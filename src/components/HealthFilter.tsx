import type { ReactNode } from "react";
import type { HealthLike } from "./HealthAlerts";
import NoPillIcon from "./NoPillIcon";

export type HealthKey = "healthIssues" | "allergies" | "drugAllergies" | "medicines" | "foodRestrictions";

const FILTERS: { key: HealthKey; icon: ReactNode; label: string; title: string }[] = [
  { key: "healthIssues", icon: "⚠️", label: "Condição", title: "Com condição de saúde" },
  { key: "allergies", icon: "🤮", label: "Alergia", title: "Com alergias" },
  { key: "drugAllergies", icon: <NoPillIcon />, label: "Não pode tomar", title: "Com alergia a medicamentos" },
  { key: "medicines", icon: "💊", label: "Medicação", title: "Toma medicação diária" },
  { key: "foodRestrictions", icon: "🍽️", label: "Alimentação", title: "Com restrição alimentar" },
];

export function hasHealth(p: HealthLike, key: HealthKey): boolean {
  const v = p[key];
  return Array.isArray(v) ? v.length > 0 : !!v;
}

/** true when the person matches EVERY selected key (empty selection = everyone) */
export function matchesHealth(p: HealthLike, selected: Set<HealthKey>): boolean {
  for (const k of selected) if (!hasHealth(p, k)) return false;
  return true;
}

interface HealthFilterProps {
  value: Set<HealthKey>;
  onChange: (next: Set<HealthKey>) => void;
  /** how many people have each thing — shown on the chips */
  counts?: Partial<Record<HealthKey, number>>;
}

/** Toggle chips: "⚠️ Condição · 🤮 Alergia · 🚫💊 · 💊 · 🍽️". Several can be on at once (AND). */
export default function HealthFilter({ value, onChange, counts }: HealthFilterProps) {
  const toggle = (k: HealthKey) => {
    const next = new Set(value);
    if (next.has(k)) next.delete(k);
    else next.add(k);
    onChange(next);
  };
  return (
    <div className="health-filter" role="group" aria-label="Filtrar por saúde">
      {FILTERS.map((f) => {
        const on = value.has(f.key);
        const n = counts?.[f.key];
        return (
          <button
            key={f.key}
            type="button"
            className={`chip-toggle chip-toggle--small ${on ? "chip-toggle--on" : ""}`}
            aria-pressed={on}
            title={f.title}
            disabled={n === 0 && !on}
            onClick={() => toggle(f.key)}
          >
            <span aria-hidden="true">{f.icon}</span> {f.label}
            {n !== undefined && <span className="cat-tab__count">{n}</span>}
          </button>
        );
      })}
    </div>
  );
}
