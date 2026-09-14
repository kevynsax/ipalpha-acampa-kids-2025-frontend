import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  /** max width in px */
  width?: number;
  /** whether Escape and backdrop clicks may dismiss the dialog */
  dismissible?: boolean;
  /** on phones (≤ 560px) takes the whole screen instead of floating as a card */
  fullscreenOnMobile?: boolean;
  /** takes the whole screen on every size (long documents) */
  fullscreen?: boolean;
}

/** Native <dialog> modal: closes on Esc / backdrop click, traps focus. */
export default function Dialog({ open, onClose, title, children, width = 640, dismissible = true, fullscreenOnMobile = false, fullscreen = false }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    else if (!open && el.open) el.close();
  }, [open]);

  // Render at the document root. Besides avoiding clipping/stacking issues,
  // this keeps a form inside a dialog from becoming a nested form when the
  // component opening the dialog is itself rendered inside a <form>.
  // React still bubbles events up the component tree regardless of the portal,
  // so every handler below ignores events raised by a nested dialog.
  return createPortal(
    <dialog
      ref={ref}
      className={`dialog ${fullscreenOnMobile ? "dialog--full-mobile" : ""} ${fullscreen ? "dialog--full" : ""}`}
      style={{ maxWidth: width }}
      aria-label={title}
      onClose={(e) => {
        if (e.target === ref.current) onClose();
      }}
      onCancel={(e) => {
        if (e.target !== ref.current) return;
        e.preventDefault();
        if (dismissible) onClose();
      }}
      onClick={(e) => {
        // click on the backdrop (outside the panel) closes only when allowed
        if (dismissible && e.target === ref.current) onClose();
      }}
    >
      {/* The portal detaches the DOM, but React events still travel the
          component tree: without this, submitting a form inside the dialog
          also submits a form the dialog is nested in. */}
      <div className="dialog__panel" onSubmit={(e) => e.stopPropagation()} onReset={(e) => e.stopPropagation()}>
        {open && children}
      </div>
    </dialog>,
    document.body,
  );
}
