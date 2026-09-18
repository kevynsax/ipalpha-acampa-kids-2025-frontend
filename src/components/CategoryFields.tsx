import { useState, type ReactNode } from "react";
import { BEDROOM_GROUPS, GROUP_META, type Bedroom, type BedroomGroup } from "../api/bedrooms";
import type { Category, CategoryOption } from "../api/categories";
import type { Team } from "../api/teams";
import { transportShortLabel, type Transport } from "../api/transports";
import { useI18n } from "../i18n";
import { useCollectionOrEmpty } from "../store";
import BusLogo from "./BusLogo";
import CarLogo from "./CarLogo";
import NoPillIcon from "./NoPillIcon";
import { teamTagStyle } from "./TeamTag";
import { ICONS } from "../icons";
import BedIcon from "./BedIcon";

/** the drug-allergy category is drawn with the "must not take" icon everywhere, whatever emoji the admin typed */
function categoryIcon(cat: Category | undefined) {
  if (cat?.key === "alergia-medicamentos") return <NoPillIcon />;
  return cat?.emoji ?? "🏷️";
}

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
  const { tx } = useI18n();
  const options = pickable(cat, value);
  return (
    <label className="cat-field cat-field--grow">
      <span className="cat-field__label">
        {categoryIcon(cat)} {label}
      </span>
      <select className="cat-input" value={value ?? ""} disabled={disabled || !cat} onChange={(e) => onChange(e.target.value || null)}>
        <option value="">{cat ? tx("Não definido") : tx("Categoria não cadastrada")}</option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
            {!o.active ? tx(" (inativo)") : ""}
          </option>
        ))}
      </select>
    </label>
  );
}

/** Single-choice category → one row of chips acting as radios (tap the selected one again to clear). */
export function CategoryRadio({ label, category: cat, value, onChange, disabled }: SingleProps) {
  const { tx } = useI18n();
  const options = pickable(cat, value);
  return (
    <fieldset className="cat-fieldset" role="radiogroup">
      <legend className="cat-field__label">
        {categoryIcon(cat)} {label}
      </legend>
      {!cat && <p className="cat-hint">{tx("Categoria não cadastrada.")}</p>}
      {cat && options.length === 0 && <p className="cat-hint">{tx("Nenhuma opção cadastrada.")}</p>}
      <div className="chip-group">
        {options.map((o) => {
          const on = value === o.id;
          return (
            <button key={o.id} type="button" role="radio" aria-checked={on} className={`chip-toggle chip-toggle--small ${on ? "chip-toggle--on" : ""}`} disabled={disabled} onClick={() => onChange(on ? null : o.id)}>
              {o.label}
              {!o.active ? tx(" (inativo)") : ""}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

interface TeamProps {
  value: string | null;
  onChange: (v: string | null) => void;
  disabled?: boolean;
  label?: string;
  /** omit the legend (the parent already titled the dialog) */
  hideLabel?: boolean;
}

/**
 * The chips always sit under something that already says TIME (the 🚩 legend, or
 * the "Trocar de time" dialog title), so the word every name starts with —
 * "Time Belém" — is noise on the chip: show just "Belém". Only the label is
 * trimmed; the team's real name is never touched.
 */
function chipName(name: string): string {
  return name.replace(/^times?\s+/i, "").trim() || name;
}

/** Team (Configurações → Times) → coloured chips, all visible at once. */
export function TeamSelect({ value, onChange, disabled, label = "Time", hideLabel }: TeamProps) {
  const { tx } = useI18n();
  const teams: Team[] = useCollectionOrEmpty("teams");
  return (
    <fieldset className="cat-fieldset" role="radiogroup">
      {!hideLabel && <legend className="cat-field__label">🚩 {tx(label)}</legend>}
      {teams.length === 0 && <p className="cat-hint">{tx("Nenhum time cadastrado.")}</p>}
      <div className="team-filter__list" role="presentation">
        <button
          type="button"
          role="radio"
          aria-checked={value === null}
          className={`chip-toggle chip-toggle--small ${value === null ? "chip-toggle--on" : ""}`}
          disabled={disabled || teams.length === 0}
          onClick={() => onChange(null)}
        >
          {tx("Não definido")}
        </button>
        {teams.map((t) => {
          const on = value === t.id;
          return (
            <button
              key={t.id}
              type="button"
              role="radio"
              aria-checked={on}
              className={`chip-toggle chip-toggle--small team-filter__chip ${on ? "chip-toggle--on" : ""}`}
              style={on ? { ...teamTagStyle(t), borderColor: t.color } : { borderColor: t.color }}
              disabled={disabled}
              onClick={() => onChange(on ? null : t.id)}
            >
              {!on && <span className="score-swatch" style={{ background: t.color }} aria-hidden="true" />}
              {chipName(t.name)}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

interface TransportProps {
  value: string | null;
  onChange: (v: string | null) => void;
  disabled?: boolean;
  label?: string;
  /** omit the legend (the parent already titled the dialog) */
  hideLabel?: boolean;
  /** when set, rendered as the fieldset heading with "Outros" on the right */
  title?: ReactNode;
  /**
   * Who is filling the form. A KID almost always comes on a bus, so cars sit
   * behind the "Outros" link; a TEAM member driving their own car is perfectly
   * normal, so cars are listed straight away.
   */
  audience?: "camper" | "staff";
}

/**
 * Transport (Configurações → Transporte) → chips, all buses visible at once so
 * the choice is one tap and each shows its coloured bus logo. For a camper the
 * cars are hidden behind an "Outros" link in the corner (opened automatically
 * when a car is already selected), since most kids come on a bus; for the team
 * every vehicle is listed — going by car is just as usual as the bus.
 */
export function TransportSelect({ value, onChange, disabled, label = "Transporte", hideLabel, title, audience = "camper" }: TransportProps) {
  const { tx } = useI18n();
  const transports: Transport[] = useCollectionOrEmpty("transports");
  const buses = transports.filter((t) => t.kind === "bus");
  const cars = transports.filter((t) => t.kind === "car");
  const selectedIsCar = cars.some((c) => c.id === value);
  const [showCars, setShowCars] = useState(selectedIsCar);
  const carsOpen = audience === "staff" || showCars || selectedIsCar;
  const others =
    cars.length > 0 && !carsOpen ? (
      <button type="button" className="link-btn cat-field__link" disabled={disabled} onClick={() => setShowCars(true)}>
        {tx("Outros")}
      </button>
    ) : null;

  const chip = (t: Transport) => {
    const on = value === t.id;
    return (
      <button
        key={t.id}
        type="button"
        role="radio"
        aria-checked={on}
        className={`chip-toggle chip-toggle--small transport-chip ${on ? "chip-toggle--on" : ""}`}
        disabled={disabled}
        onClick={() => onChange(on ? null : t.id)}
      >
        {t.kind === "bus" ? <BusLogo color={t.color ?? "#0f9a8a"} number={t.number} size={22} /> : <CarLogo size={22} />}
        {/* every vehicle is side by side here: the coloured logo already tells them apart */}
        {transportShortLabel(t)}
      </button>
    );
  };

  const heading = hideLabel && !title ? null : (
    <legend className={title ? "cat-form__title change-room__title" : "cat-field__label cat-field__label--split"}>
      {title ?? (
        <span className="cat-field__label--icon">
          <img className="admin-title__icon" src={ICONS.transport} alt="" aria-hidden="true" /> {tx(label)}
        </span>
      )}
      {others}
    </legend>
  );

  return (
    <fieldset className="cat-fieldset" role="radiogroup">
      {heading}
      {transports.length === 0 && <p className="cat-hint">{tx("Nenhum transporte cadastrado.")}</p>}
      <div className="team-filter__list" role="presentation">
        <button
          type="button"
          role="radio"
          aria-checked={value === null}
          className={`chip-toggle chip-toggle--small ${value === null ? "chip-toggle--on" : ""}`}
          disabled={disabled || transports.length === 0}
          onClick={() => onChange(null)}
        >
          {tx("Não definido")}
        </button>
        {buses.map(chip)}
        {carsOpen && cars.map(chip)}
      </div>
    </fieldset>
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
  const { tx } = useI18n();
  const options = pickable(cat, value);
  const toggle = (id: string) => onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id]);
  return (
    <fieldset className="cat-fieldset">
      <legend className="cat-field__label">
        {categoryIcon(cat)} {label}
      </legend>
      {!cat && <p className="cat-hint">{tx("Categoria não cadastrada.")}</p>}
      {cat && options.length === 0 && <p className="cat-hint">{tx("Nenhuma opção cadastrada.")}</p>}
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
  /** keep full rooms selectable (moving staff may be swapping places with someone there) */
  allowFull?: boolean;
  disabled?: boolean;
}

/** Bedroom picker grouped by wing, showing free places. */
export function BedroomSelect({ bedrooms, value, onChange, current, groups = BEDROOM_GROUPS, allowFull, disabled }: BedroomProps) {
  const { tx } = useI18n();
  const picked = bedrooms.find((b) => b.id === value);
  const only = groups.length === 1 ? groups[0] : undefined;
  const wing = picked?.group ?? only;
  return (
    <label className="cat-field cat-field--grow">
      <span className="cat-field__label cat-field__label--icon"><BedIcon size={16} group={wing} /> {tx("Quarto")}</span>
      <select className="cat-input" value={value ?? ""} disabled={disabled || bedrooms.length === 0} onChange={(e) => onChange(e.target.value || null)}>
        <option value="">{bedrooms.length ? tx("Sem quarto") : tx("Nenhum quarto cadastrado")}</option>
        {groups.map((g) => {
          const rooms = bedrooms.filter((b) => b.group === g);
          if (!rooms.length) return null;
          return (
            <optgroup key={g} label={tx(GROUP_META[g].label)}>
              {rooms.map((b) => {
                const mine = b.id === current;
                const free = b.available + (mine ? 1 : 0);
                const full = free <= 0;
                return (
                  <option key={b.id} value={b.id} disabled={full && !mine && !allowFull}>
                    {b.name} · {full ? tx("lotado") : free > 1 ? tx("{free} de {capacity} livres", { free, capacity: b.capacity }) : tx("{free} de {capacity} livre", { free, capacity: b.capacity })}
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
