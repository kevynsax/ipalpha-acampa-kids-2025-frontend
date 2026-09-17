import type { RefObject } from "react";
import { formatCpf } from "../cpf";

interface CpfInputProps {
  value: string;
  onChange: (masked: string) => void;
  disabled?: boolean;
  placeholder?: string;
  /** extra label for screen readers when the visible label is nearby */
  ariaLabel?: string;
  /** lets screens like the import review focus the input when the step changes */
  inputRef?: RefObject<HTMLInputElement | null>;
}

/** Brazilian CPF: 123.456.789-00 while typing. */
export default function CpfInput({ value, onChange, disabled, placeholder = "000.000.000-00", ariaLabel = "CPF", inputRef }: CpfInputProps) {
  return (
    <input
      ref={inputRef}
      className="cat-input"
      inputMode="numeric"
      autoComplete="off"
      placeholder={placeholder}
      value={value}
      maxLength={14}
      disabled={disabled}
      aria-label={ariaLabel}
      onChange={(e) => onChange(formatCpf(e.target.value))}
    />
  );
}
