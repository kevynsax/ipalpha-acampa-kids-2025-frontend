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
  /** optional variant class for a specific dialog */
  className?: string;
}

/** Native <dialog> modal: closes on Esc / backdrop click, traps focus. */
export default function Dialog({ open, onClose, title, children, width = 640, dismissible = true, fullscreenOnMobile = false, fullscreen = false, className = "" }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  // the close event fired by our OWN el.close() below is not the user closing
  // the dialog — without this, hiding one step of a multi-dialog flow (e.g.
  // escolher → criar função) would report it closed and tear the flow down
  const ownClose = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    else if (!open && el.open) {
      ownClose.current = true;
      el.close();
    }
  }, [open]);

  // Render at the document root. Besides avoiding clipping/stacking issues,
  // this keeps a form inside a dialog from becoming a nested form when the
  // component opening the dialog is itself rendered inside a <form>.
  // React still bubbles events up the component tree regardless of the portal,
  // so every handler below ignores events raised by a nested dialog.
  return createPortal(
    <dialog
      ref={ref}
      className={`dialog ${fullscreenOnMobile ? "dialog--full-mobile" : ""} ${fullscreen ? "dialog--full" : ""} ${className}`}
      style={{ maxWidth: width }}
      aria-label={title}
      onClose={(e) => {
        if (e.target !== ref.current) return;
        if (ownClose.current) {
          ownClose.current = false;
          return;
        }
        onClose();
      }}
      onCancel={(e) => {
        if (e.target !== ref.current) return;
        e.preventDefault();
        if (dismissible) onClose();
      }}
      onClick={(e) => {
        if (!dismissible || e.target !== ref.current) return;
        // ::backdrop clicks report the <dialog> as the target, but so does the
        // element's own box (a sheet that doesn't fill it, its padding…): only
        // a point OUTSIDE the panel is really "outside the dialog"
        const box = panel.current?.getBoundingClientRect();
        if (box && e.clientX >= box.left && e.clientX <= box.right && e.clientY >= box.top && e.clientY <= box.bottom) return;
        onClose();
      }}
    >
      {/* The portal detaches the DOM, but React events still travel the
          component tree: without this, submitting a form inside the dialog
          also submits a form the dialog is nested in. */}
      <div className="dialog__panel" ref={panel} onSubmit={(e) => e.stopPropagation()} onReset={(e) => e.stopPropagation()}>
        {open && children}
      </div>
    </dialog>,
    document.body,
  );
}
