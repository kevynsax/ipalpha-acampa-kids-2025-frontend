import { useEffect, useRef, useState } from "react";

interface TimeInputProps {
  /** "HH:mm" (24h) or "" when empty */
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
  /** allow clearing to "" (an optional time). When false an empty field snaps back to the last value. */
  clearable?: boolean;
  "aria-label"?: string;
  id?: string;
  className?: string;
  onEnter?: () => void;
}

/**
 * A 24-hour time field: two number boxes (HH : mm) instead of the native
 * `<input type="time">`. The native input opens the browser's locale picker,
 * which on a 12-hour OS shows an AM/PM step — and that popup misbehaves inside
 * a modal `<dialog showModal()>` (its clicks land on the dialog backdrop, so
 * AM/PM never registers). This component has no AM/PM: the value is always a
 * plain 24-hour "HH:mm" string, whatever the device locale.
 */
export default function TimeInput({ value, onChange, disabled, required, clearable = false, onEnter, className = "", id, ...aria }: TimeInputProps) {
  const [h, m] = splitTime(value);
  const [hh, setHh] = useState(h);
  const [mm, setMm] = useState(m);
  const mmRef = useRef<HTMLInputElement>(null);

  // keep local boxes in sync when the value changes from outside
  useEffect(() => {
    const [nh, nm] = splitTime(value);
    setHh(nh);
    setMm(nm);
  }, [value]);

  const emit = (nh: string, nm: string) => {
    if (nh === "" && nm === "") {
      onChange(clearable ? "" : value);
      return;
    }
    const H = clamp(nh, 23);
    const M = clamp(nm, 59);
    onChange(`${pad(H)}:${pad(M)}`);
  };

  const onHh = (raw: string) => {
    const digits = raw.replace(/\D/g, "").slice(0, 2);
    setHh(digits);
    // a two-digit hour (or a lead digit ≥ 3, e.g. "5") jumps to minutes
    if (digits.length === 2 || (digits.length === 1 && Number(digits) > 2)) mmRef.current?.focus();
  };

  return (
    <span className={`time-input ${className}`.trim()}>
      <input
        {...aria}
        id={id}
        className="time-input__box"
        inputMode="numeric"
        type="text"
        placeholder="--"
        value={hh}
        maxLength={2}
        disabled={disabled}
        required={required}
        onChange={(e) => onHh(e.target.value)}
        onBlur={() => emit(hh, mm)}
        onKeyDown={(e) => e.key === "Enter" && onEnter?.()}
      />
      <span className="time-input__sep" aria-hidden="true">:</span>
      <input
        ref={mmRef}
        className="time-input__box"
        inputMode="numeric"
        type="text"
        placeholder="--"
        value={mm}
        maxLength={2}
        disabled={disabled}
        aria-label="minutos"
        onChange={(e) => setMm(e.target.value.replace(/\D/g, "").slice(0, 2))}
        onBlur={() => emit(hh, mm)}
        onKeyDown={(e) => e.key === "Enter" && onEnter?.()}
      />
    </span>
  );
}

function splitTime(v: string): [string, string] {
  const match = /^(\d{1,2}):(\d{1,2})$/.exec(v);
  return match ? [match[1], match[2]] : ["", ""];
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function clamp(raw: string, max: number): number {
  const n = Number(raw || "0");
  if (Number.isNaN(n)) return 0;
  return Math.min(Math.max(n, 0), max);
}
