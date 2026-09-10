import { type ClipboardEvent, type KeyboardEvent, useEffect, useRef } from "react";

interface OtpInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
  invalid?: boolean;
}

/** Row of playful OTP boxes: auto-advance, backspace, arrows and paste support. */
export default function OtpInput({
  length = 6,
  value,
  onChange,
  onComplete,
  disabled,
  autoFocus,
  invalid,
}: OtpInputProps) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const chars = Array.from({ length }, (_, i) => value[i] ?? "");

  useEffect(() => {
    if (autoFocus) refs.current[0]?.focus();
  }, [autoFocus]);

  function place(newChars: string, focusIndex: number) {
    const next = newChars.slice(0, length);
    onChange(next);
    refs.current[Math.min(focusIndex, length - 1)]?.focus();
    if (next.length === length) onComplete?.(next);
  }

  function handleInput(i: number, raw: string) {
    const typed = raw.replace(/\D/g, "");
    if (!typed) return;
    const arr = [...chars];
    for (let k = 0; k < typed.length && i + k < length; k++) {
      arr[i + k] = typed[k];
    }
    place(arr.join(""), i + typed.length);
  }

  function handleKeyDown(i: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace") {
      e.preventDefault();
      const arr = [...chars];
      if (arr[i]) {
        arr[i] = "";
        place(arr.join(""), i);
      } else if (i > 0) {
        arr[i - 1] = "";
        place(arr.join(""), i - 1);
      }
    } else if (e.key === "ArrowLeft" && i > 0) {
      e.preventDefault();
      refs.current[i - 1]?.focus();
    } else if (e.key === "ArrowRight" && i < length - 1) {
      e.preventDefault();
      refs.current[i + 1]?.focus();
    }
  }

  function handlePaste(e: ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "");
    if (pasted) {
      const arr = [...chars];
      for (let k = 0; k < pasted.length && k < length; k++) arr[k] = pasted[k];
      place(arr.join(""), Math.min(pasted.length, length - 1));
    }
  }

  return (
    <div className={`otp-boxes ${invalid ? "otp-boxes--invalid" : ""}`} onPaste={handlePaste}>
      {chars.map((char, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          type="text"
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          maxLength={length}
          value={char}
          disabled={disabled}
          aria-label={`Dígito ${i + 1} do código`}
          onChange={(e) => handleInput(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onFocus={(e) => e.currentTarget.select()}
        />
      ))}
    </div>
  );
}
