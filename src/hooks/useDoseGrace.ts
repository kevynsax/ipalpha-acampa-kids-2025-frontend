import { useCallback, useEffect, useRef, useState } from "react";

/** how long a ticked row stays on screen offering "Desfazer" before it fades away */
export const DOSE_GRACE_MS = 5000;
/** fade-out + collapse of a row that is leaving (matches `meds-leave` in styles.css) */
export const DOSE_LEAVE_MS = 650;

/**
 * The life of a row that was just ticked: it stays put for a few seconds
 * showing "Dado agora · Desfazer", then fades out and collapses so the rows
 * below slide up.
 *
 * The dose itself is saved the moment it is ticked (never at the end of the
 * window): another phone must see it at once, or two people could give the
 * same medicine while the row is still on screen. So "Desfazer" is a real
 * delete, not a cancelled write — and the timers here only drive the UI.
 */
export function useDoseGrace() {
  /** ticked, still offering the undo */
  const [grace, setGrace] = useState<Set<string>>(new Set());
  /** playing the fade-out */
  const [leaving, setLeaving] = useState<Set<string>>(new Set());
  const timers = useRef(new Map<string, number[]>());

  const clearTimers = useCallback((key: string) => {
    for (const t of timers.current.get(key) ?? []) window.clearTimeout(t);
    timers.current.delete(key);
  }, []);

  /** drop the row from both sets at once (undo, or the fade finished) */
  const forget = useCallback(
    (key: string) => {
      clearTimers(key);
      setGrace((g) => {
        if (!g.has(key)) return g;
        const n = new Set(g);
        n.delete(key);
        return n;
      });
      setLeaving((l) => {
        if (!l.has(key)) return l;
        const n = new Set(l);
        n.delete(key);
        return n;
      });
    },
    [clearTimers],
  );

  /** the dose was saved: hold the row, then fade it */
  const start = useCallback(
    (key: string) => {
      clearTimers(key);
      setGrace((g) => new Set(g).add(key));
      setLeaving((l) => {
        if (!l.has(key)) return l;
        const n = new Set(l);
        n.delete(key);
        return n;
      });
      const fade = window.setTimeout(() => setLeaving((l) => new Set(l).add(key)), DOSE_GRACE_MS);
      const gone = window.setTimeout(() => forget(key), DOSE_GRACE_MS + DOSE_LEAVE_MS);
      timers.current.set(key, [fade, gone]);
    },
    [clearTimers, forget],
  );

  // leaving the page must not fire a timer into an unmounted component
  useEffect(() => {
    const running = timers.current;
    return () => {
      for (const list of running.values()) for (const t of list) window.clearTimeout(t);
      running.clear();
    };
  }, []);

  return { grace, leaving, start, forget };
}
