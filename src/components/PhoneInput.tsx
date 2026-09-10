import { useRef } from "react";
import { digitsOnly, maskBrazilPhone } from "../phone";

interface PhoneInputProps {
  value: string; // masked, e.g. (11) 98123-4567
  onChange: (masked: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
}

/** Brazilian mobile input: user types DDD + number (+55 is added on submit). */
export default function PhoneInput({ value, onChange, disabled, autoFocus }: PhoneInputProps) {
  const ref = useRef<HTMLInputElement>(null);

  return (
    <div
      className={`phone-field ${disabled ? "phone-field--disabled" : ""}`}
      onClick={() => ref.current?.focus()}
    >
      <input
        ref={ref}
        type="tel"
        inputMode="numeric"
        autoComplete="tel-national"
        placeholder="(11) 98123-4567"
        value={value}
        disabled={disabled}
        autoFocus={autoFocus}
        onChange={(e) => onChange(maskBrazilPhone(e.target.value))}
        onFocus={(e) => e.currentTarget.select()}
        aria-label="Celular com DDD"
      />
    </div>
  );
}

export { digitsOnly };
