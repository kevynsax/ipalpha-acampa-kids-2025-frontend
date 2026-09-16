import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

interface ChipTipProps {
  /** element the tip points at (the chip) */
  anchor: HTMLElement;
  onClose: () => void;
  children: ReactNode;
}

interface Placement {
  left: number;
  top: number;
  below: boolean;
}

/**
 * Custom tooltip that also works on touch: opened by hover (desktop) or a tap
 * on the chip (mobile), closed by tapping elsewhere, scrolling or Esc.
 * Rendered in a portal so no overflow/stacking context can clip it, clamped
 * to the viewport, with an arrow pointing at the chip.
 */
export default function ChipTip({ anchor, onClose, children }: ChipTipProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<Placement | null>(null);

  useLayoutEffect(() => {
    const r = anchor.getBoundingClientRect();
    const w = Math.min(320, window.innerWidth - 16);
    const left = Math.min(Math.max(8 + w / 2, r.left + r.width / 2), window.innerWidth - 8 - w / 2);
    const h = ref.current?.offsetHeight ?? 90;
    const below = r.top < h + 24;
    setPos({ left, top: below ? r.bottom + 10 : r.top - 10, below });
  }, [anchor]);

  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      // taps on the tip itself (or on its anchor, which re-toggles) are fine
      if (ref.current?.contains(e.target as Node) || anchor.contains(e.target as Node)) return;
      onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("scroll", onClose, true);
    window.addEventListener("resize", onClose);
    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("scroll", onClose, true);
      window.removeEventListener("resize", onClose);
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("keydown", onKey);
    };
  }, [anchor, onClose]);

  return createPortal(
    <div ref={ref} className={`chip-tip${pos?.below ? " chip-tip--below" : ""}`} style={pos ? { left: pos.left, top: pos.top } : undefined} role="tooltip">
      <span className="chip-tip__arrow" aria-hidden="true" />
      {children}
    </div>,
    document.body,
  );
}
