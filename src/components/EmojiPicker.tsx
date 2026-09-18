import { useEffect, useId, useRef, useState } from "react";
import { cleanEmojiInput } from "../emoji";

interface EmojiPickerProps {
  value: string;
  onChange: (emoji: string) => void;
  /** grid of suggestions shown in the popover */
  suggestions: string[];
  disabled?: boolean;
  /** AI is picking an icon — same pulse as other guessed fields */
  guessing?: boolean;
  label?: string;
}

/**
 * A button showing the current icon; clicking opens a popover with a grid of
 * suggestions plus a free input for any other emoji. Closes on outside click,
 * Escape, or after picking.
 */
export default function EmojiPicker({ value, onChange, suggestions, disabled, guessing, label = "Ícone" }: EmojiPickerProps) {
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState("");
  const [customError, setCustomError] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const popId = useId();

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 30);
    else {
      setCustom("");
      setCustomError(null);
    }
  }, [open]);

  function pick(e: string) {
    onChange(e);
    setOpen(false);
  }

  function commitCustom() {
    const v = cleanEmojiInput(custom);
    if (v) pick(v);
    else setCustomError("Cole só um emoji.");
  }

  return (
    <div className="emoji-pick" ref={rootRef}>
      <button
        type="button"
        className={`emoji-pick__btn ${open ? "emoji-pick__btn--open" : ""}${guessing ? " cat-input--busy" : ""}`}
        title={label}
        aria-label={`${label}: ${value}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={popId}
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="emoji-pick__value" aria-hidden="true">{value || "🏷️"}</span>
        <span className="emoji-pick__caret" aria-hidden="true">▾</span>
      </button>

      {open && (
        <div className="emoji-pick__pop" id={popId} role="dialog" aria-label={label}>
          <div className="emoji-pick__grid">
            {suggestions.map((e) => (
              <button
                key={e}
                type="button"
                className={`emoji-pick__item ${value === e ? "emoji-pick__item--active" : ""}`}
                onClick={() => pick(e)}
              >
                {e}
              </button>
            ))}
          </div>
          {/* not a <form>: the picker lives inside the page's form and nested forms are dropped by the browser */}
          <div className="emoji-pick__custom">
            <input
              ref={inputRef}
              className={`emoji-pick__input ${customError ? "emoji-pick__input--error" : ""}`}
              placeholder="outro…"
              value={custom}
              onChange={(e) => {
                setCustom(e.target.value);
                setCustomError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  e.stopPropagation();
                  commitCustom();
                }
              }}
              aria-label="Outro emoji"
              aria-invalid={!!customError}
            />
            <button type="button" className="emoji-pick__ok" disabled={!custom.trim()} onClick={commitCustom}>
              Usar
            </button>
          </div>
          {customError && <p className="cat-hint cat-hint--error emoji-pick__error">{customError}</p>}
        </div>
      )}
    </div>
  );
}
