import { useEffect, useState } from "react";
import type { CheckinWindow } from "./api/settings";

/**
 * Where we are relative to the scoreboard SUSPENSE window (Settings → Jogos /
 * the Placar page): "off" while unset, "scheduled" before it starts, "on"
 * while the team sees the board with the totals hidden, "over" once it ended.
 */
export type SuspenseState = { kind: "off" } | { kind: "scheduled"; from: string; until: string } | { kind: "on"; from: string; until: string } | { kind: "over"; from: string; until: string };

export function suspenseState(w: Pick<CheckinWindow, "from" | "until"> | undefined, now = Date.now()): SuspenseState {
  if (!w?.from || !w.until) return { kind: "off" };
  const from = new Date(w.from).getTime();
  const until = new Date(w.until).getTime();
  if (now < from) return { kind: "scheduled", from: w.from, until: w.until };
  if (now < until) return { kind: "on", from: w.from, until: w.until };
  return { kind: "over", from: w.from, until: w.until };
}

const MAX_TIMEOUT = 2 ** 31 - 1;

/** Live suspense state: re-evaluated right after each edge of the window passes (device clock). */
export function useScoreSuspense(w: Pick<CheckinWindow, "from" | "until"> | undefined): SuspenseState {
  const [tick, setTick] = useState(0);
  const from = w?.from ?? null;
  const until = w?.until ?? null;
  useEffect(() => {
    if (!from || !until) return;
    const now = Date.now();
    const next = [new Date(from).getTime(), new Date(until).getTime()].filter((t) => t > now).sort((a, b) => a - b)[0];
    if (next === undefined) return;
    const t = setTimeout(() => setTick((n) => n + 1), Math.min(next - now + 500, MAX_TIMEOUT));
    return () => clearTimeout(t);
  }, [from, until, tick]);
  return suspenseState(w);
}
