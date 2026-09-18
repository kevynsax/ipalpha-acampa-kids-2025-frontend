import type { ReactNode } from "react";

interface RadioProps {
  checked: boolean;
  onChange: () => void;
  /** text (or icon + text) shown beside the dot */
  label: ReactNode;
  /** an extra control that belongs to this option (an input, a hint) — rendered after the label, outside the button */
  extra?: ReactNode;
  disabled?: boolean;
}

/**
 * One radio option, drawn in the house style (same idiom as `Toggle`): a
 * ring that fills forest-green when picked + a bold label. It is a button,
 * not a native input, so it looks the same on every browser; use it inside a
 * `<RadioGroup>` so screen readers get the group semantics.
 */
export function Radio({ checked, onChange, label, extra, disabled }: RadioProps) {
  return (
    <div className={`radio-row ${checked ? "radio-row--on" : ""} ${disabled ? "radio-row--disabled" : ""}`}>
      <button type="button" role="radio" aria-checked={checked} className="radio" disabled={disabled} onClick={() => !checked && onChange()}>
        <span className="radio__ring" aria-hidden="true">
          <span className="radio__dot" />
        </span>
        <span className="radio__label">{label}</span>
      </button>
      {extra}
    </div>
  );
}

interface RadioGroupProps {
  /** what the group is about, for screen readers */
  label: string;
  children: ReactNode;
  className?: string;
}

/** Wraps a few `<Radio>` so assistive tech knows they are one choice. */
export function RadioGroup({ label, children, className = "" }: RadioGroupProps) {
  return (
    <div className={`radio-group ${className}`} role="radiogroup" aria-label={label}>
      {children}
    </div>
  );
}
