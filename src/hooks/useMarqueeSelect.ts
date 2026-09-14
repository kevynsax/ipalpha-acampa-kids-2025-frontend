import { useCallback, useEffect, useRef, useState } from "react";

/** The rubber band in viewport coordinates (what the overlay draws). */
export interface MarqueeRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

interface Options {
  /** turns the whole behaviour off (viewers who may not manage the photos) */
  enabled: boolean;
  /** current selection — the hook only reports the next one */
  selected: Set<string>;
  onChange: (next: Set<string>) => void;
}

interface Result {
  /** put on the scroll container that holds the selectable items */
  containerRef: React.RefObject<HTMLDivElement | null>;
  /** spread on the same container */
  handlers: { onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => void };
  /** non-null while the user is dragging a band; draw it fixed-positioned */
  rect: MarqueeRect | null;
}

/** a drag shorter than this is a click, not a band */
const THRESHOLD = 6;

/**
 * Drag a rectangle across a grid to select the items it touches, Finder style.
 *
 * Items opt in with `data-select-id="<id>"`. Holding Shift or Meta/Ctrl adds to
 * the current selection instead of replacing it.
 *
 * A band may start anywhere inside the container, including on top of an item —
 * the item itself is usually a button, so ignoring buttons outright would mean
 * only the gaps between tiles could start a selection. Controls that sit
 * *outside* an item (section headers, toolbars) and anything marked
 * `data-no-marquee` are left alone, so those buttons keep working.
 */
export function useMarqueeSelect({ enabled, selected, onChange }: Options): Result {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [rect, setRect] = useState<MarqueeRect | null>(null);
  /** everything the drag needs, kept in a ref so the move handler is stable */
  const drag = useRef<{ x: number; y: number; additive: boolean; base: Set<string>; moved: boolean } | null>(null);

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      // left button / primary touch only, and never on an interactive child
      if (!enabled || e.button !== 0) return;
      const target = e.target as HTMLElement;
      if (target.closest("[data-no-marquee]")) return;
      if (target.closest("button, a, input, select, textarea")) {
        // a control that is (part of) an item still starts a band, but only
        // with a mouse or pen: on touch the same gesture is a scroll
        if (!target.closest("[data-select-id]") || e.pointerType === "touch") return;
      }

      drag.current = {
        x: e.clientX,
        y: e.clientY,
        additive: e.shiftKey || e.metaKey || e.ctrlKey,
        base: new Set(selected),
        moved: false,
      };
    },
    [enabled, selected],
  );

  // the move/up listeners live on the window: the pointer routinely leaves the
  // grid mid-drag (and may be released outside it)
  useEffect(() => {
    if (!enabled) return;

    const onMove = (e: PointerEvent) => {
      const d = drag.current;
      if (!d) return;
      const dx = e.clientX - d.x;
      const dy = e.clientY - d.y;
      if (!d.moved && Math.abs(dx) < THRESHOLD && Math.abs(dy) < THRESHOLD) return;
      // past the threshold this is a band, not a click
      if (!d.moved) d.moved = true;
      e.preventDefault();

      const band = {
        left: Math.min(e.clientX, d.x),
        top: Math.min(e.clientY, d.y),
        width: Math.abs(dx),
        height: Math.abs(dy),
      };
      setRect(band);

      const next = new Set(d.additive ? d.base : []);
      const nodes = containerRef.current?.querySelectorAll<HTMLElement>("[data-select-id]") ?? [];
      for (const node of nodes) {
        const b = node.getBoundingClientRect();
        const hit = b.left < band.left + band.width && b.right > band.left && b.top < band.top + band.height && b.bottom > band.top;
        if (hit) next.add(node.dataset.selectId!);
      }
      onChange(next);
    };

    const onUp = () => {
      const d = drag.current;
      drag.current = null;
      setRect(null);
      // a plain click (no band) falls through to the tile's own onClick
      if (!d?.moved) return;
      // releasing the band still fires a click on the tile underneath, which
      // would open the lightbox: swallow that one click
      window.addEventListener("click", (ev) => { ev.stopPropagation(); ev.preventDefault(); }, { capture: true, once: true });
    };

    window.addEventListener("pointermove", onMove, { passive: false });
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [enabled, onChange]);

  return { containerRef, handlers: { onPointerDown }, rect };
}
