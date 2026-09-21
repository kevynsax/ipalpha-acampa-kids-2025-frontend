import { useEffect, useRef, useState } from "react";
import { aiGuessSex } from "../api/ai";
import type { CamperSex } from "../api/campers";

const DEBOUNCE_MS = 700;

interface Options {
  token: string;
  name: string;
  /** off when a girls/boys room already decides the sex */
  enabled?: boolean;
}

/**
 * Jev 1.13 guess of a kid's sex from the (Brazilian) first name.
 * Fires 700 ms after the user stops typing. Starting again cancels the
 * pending timer and any in-flight request. The last boy/girl stays up
 * until a new answer lands.
 */
export function useGuessCamperSex({ token, name, enabled = true }: Options): { sex: CamperSex | null; busy: boolean } {
  const [sex, setSex] = useState<CamperSex | null>(null);
  const [busy, setBusy] = useState(false);
  const abort = useRef<AbortController | null>(null);
  const seen = useRef("");

  useEffect(() => () => abort.current?.abort(), []);

  useEffect(() => {
    if (!enabled) {
      abort.current?.abort();
      abort.current = null;
      setBusy(false);
      return;
    }
    const trimmed = name.trim();
    if (trimmed.length < 2 || seen.current === trimmed) return;

    abort.current?.abort();
    abort.current = null;

    const timer = setTimeout(() => {
      const ctrl = new AbortController();
      abort.current = ctrl;
      seen.current = trimmed;
      setBusy(true);
      void aiGuessSex(token, trimmed, ctrl.signal)
        .then((r) => {
          if (!ctrl.signal.aborted && (r.sex === "F" || r.sex === "M")) setSex(r.sex);
        })
        .catch(() => {
          /* keep the last guess */
        })
        .finally(() => {
          if (abort.current === ctrl) {
            abort.current = null;
            setBusy(false);
          }
        });
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      abort.current?.abort();
      abort.current = null;
      setBusy(false);
    };
  }, [name, enabled, token]);

  return { sex, busy };
}
