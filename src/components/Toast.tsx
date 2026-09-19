import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { CloseGlyph } from "./Glyph";

interface ToastProps {
  /** null = hidden */
  message: ReactNode | null;
  /** an optional action beside the message ("Desfazer") */
  action?: { label: ReactNode; onClick: () => void };
  onClose: () => void;
  /** ms before it goes away on its own; 0 = stays until closed. Default 45 s: long enough to read the result and change your mind. */
  timeoutMs?: number;
}

/**
 * A quiet floating message at the bottom of the screen, with an optional
 * action — the place to offer "Desfazer" right after something big happened.
 */
export default function Toast({ message, action, onClose, timeoutMs = 45_000 }: ToastProps) {
  // the timer runs from the moment the MESSAGE appears — a parent re-render (new onClose identity) must not restart it
  const close = useRef(onClose);
  close.current = onClose;
  /** bumps whenever a new message shows, so the countdown bar's CSS animation restarts */
  const [run, setRun] = useState(0);
  useEffect(() => {
    if (message === null || !timeoutMs) return;
    setRun((n) => n + 1);
    const t = window.setTimeout(() => close.current(), timeoutMs);
    return () => window.clearTimeout(t);
  }, [message, timeoutMs]);
  if (message === null) return null;
  return createPortal(
    <div className="toast" role="status" aria-live="polite">
      <span className="toast__text">
        {message}
        {/* the time left: a bar under the text that shrinks from the right until the toast goes */}
        {timeoutMs > 0 && <span key={run} className="toast__timer" style={{ "--toast-ms": `${timeoutMs}ms` } as CSSProperties} aria-hidden="true" />}
      </span>
      {action && (
        <button type="button" className="toast__action" onClick={action.onClick}>
          {action.label}
        </button>
      )}
      <button type="button" className="toast__close" title="Fechar" aria-label="Fechar" onClick={onClose}>
        <CloseGlyph size="1em" />
      </button>
    </div>,
    document.body,
  );
}
