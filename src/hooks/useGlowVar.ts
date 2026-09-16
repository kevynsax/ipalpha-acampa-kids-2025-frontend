import { useEffect, type RefObject } from "react";

/**
 * Paints a 0–1 voice level onto `--lantern-glow` once per frame. The property
 * inherits, so one call lights everything inside the element — and nothing in
 * the conversation re-renders while someone is speaking.
 */
export function useGlowVar(
  target: RefObject<SVGElement | HTMLElement | null>,
  source: RefObject<{ level: number } | null> | undefined,
) {
  useEffect(() => {
    if (!source) return;
    let frame = 0;
    let painted = -1;
    const paint = () => {
      frame = requestAnimationFrame(paint);
      const level = Math.round(Math.min(1, Math.max(0, source.current?.level ?? 0)) * 20) / 20;
      if (level === painted) return;
      painted = level;
      target.current?.style.setProperty("--lantern-glow", String(level));
    };
    frame = requestAnimationFrame(paint);
    return () => cancelAnimationFrame(frame);
  }, [source, target]);
}
