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
}

/** Native <dialog> modal: closes on Esc / backdrop click, traps focus. */
export default function Dialog({ open, onClose, title, children, width = 640, dismissible = true }: DialogProps) {
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
  return createPortal(
    <dialog
      ref={ref}
      className="dialog"
      style={{ maxWidth: width }}
      aria-label={title}
      onClose={onClose}
      onCancel={(e) => {
        e.preventDefault();
        if (dismissible) onClose();
      }}
      onClick={(e) => {
        // click on the backdrop (outside the panel) closes only when allowed
        if (dismissible && e.target === ref.current) onClose();
      }}
    >
      <div className="dialog__panel">{open && children}</div>
    </dialog>,
    document.body,
  );
}
