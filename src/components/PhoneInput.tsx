import { useRef, type RefObject } from "react";
import { CloseGlyph } from "./Glyph";
import { useI18n } from "../i18n";
import { digitsOnly, maskBrazilPhone } from "../phone";

interface PhoneInputProps {
  value: string; // masked, e.g. (11) 98123-4567
  onChange: (masked: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
  /** lets screens like the import review focus the input when the step changes */
  inputRef?: RefObject<HTMLInputElement | null>;
  /** X inside the field that clears the number */
  onClear?: () => void;
}

/** Brazilian mobile input: user types DDD + number (+55 is added on submit). */
export default function PhoneInput({ value, onChange, disabled, autoFocus, inputRef, onClear }: PhoneInputProps) {
  const { tx } = useI18n();
  const ref = useRef<HTMLInputElement>(null);
  const showClear = !!onClear && !!value && !disabled;

  return (
    <div
      className={`phone-field${disabled ? " phone-field--disabled" : ""}${showClear ? " phone-field--suffix" : ""}`}
      onClick={() => ref.current?.focus()}
    >
      <input
        ref={(node) => {
          ref.current = node;
          if (inputRef) inputRef.current = node;
        }}
        type="tel"
        inputMode="numeric"
        autoComplete="tel-national"
        placeholder="(11) 98123-4567"
        value={value}
        disabled={disabled}
        autoFocus={autoFocus}
        onChange={(e) => onChange(maskBrazilPhone(e.target.value))}
        onFocus={(e) => e.currentTarget.select()}
        aria-label={tx("Celular com DDD")}
      />
      {showClear && (
        <button
          type="button"
          className="phone-field__clear"
          title={tx("Limpar")}
          aria-label={tx("Limpar")}
          onMouseDown={(e) => e.preventDefault()}
          onClick={(e) => {
            e.stopPropagation();
            onClear();
          }}
        >
          <CloseGlyph size={16} />
        </button>
      )}
    </div>
  );
}

export { digitsOnly };
