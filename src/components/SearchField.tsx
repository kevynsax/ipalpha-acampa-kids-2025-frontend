import type { KeyboardEventHandler, RefObject } from "react";
import { CloseGlyph, SearchGlyph } from "./Glyph";
import { useI18n } from "../i18n";

interface SearchFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  "aria-label": string;
  disabled?: boolean;
  autoFocus?: boolean;
  inputRef?: RefObject<HTMLInputElement | null>;
  onKeyDown?: KeyboardEventHandler<HTMLInputElement>;
  /** smaller field used in the room / team assignment pools */
  compact?: boolean;
}

/** Magnifying-glass search with a right-side X that clears the query. */
export default function SearchField({
  value,
  onChange,
  placeholder,
  "aria-label": ariaLabel,
  disabled,
  autoFocus,
  inputRef,
  onKeyDown,
  compact,
}: SearchFieldProps) {
  const { tx } = useI18n();
  const showClear = !!value && !disabled;
  const wrap = compact ? "assign-pool__search" : "staff-toolbar__search";
  const icon = compact ? "assign-pool__search-icon" : "staff-toolbar__search-icon";

  return (
    <label className={`${wrap}${showClear ? ` ${wrap}--clear` : ""}`}>
      <SearchGlyph className={icon} size={compact ? "1.1em" : "1.2em"} />
      <input
        ref={inputRef}
        className={compact ? undefined : "cat-input"}
        type="search"
        placeholder={placeholder}
        value={value}
        disabled={disabled}
        autoFocus={autoFocus}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        aria-label={ariaLabel}
      />
      {showClear && (
        <button
          type="button"
          className="search-field__clear"
          title={tx("Limpar busca")}
          aria-label={tx("Limpar busca")}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onChange("")}
        >
          <CloseGlyph size={compact ? 14 : 16} />
        </button>
      )}
    </label>
  );
}
