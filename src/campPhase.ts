import { useEffect, useMemo, useState } from "react";
import { useCollection } from "./store";

/**
 * Where we are relative to the camp, from the programme's first event:
 *
 *   "before"  → more than PREP_DAYS days before the first event: the team is
 *               still packing, so Preparação is the landing page and the room
 *               is a secondary tab.
 *   "camp"    → the last PREP_DAYS days before, during and after the camp: the
 *               room is the landing page and Preparação becomes a tab.
 *   "unknown" → no programme yet (behaves like "camp", i.e. room first).
 */
export type CampPhase = "before" | "camp" | "unknown";

/** how many days before the first event the app switches to "camp mode" */
export const PREP_DAYS = 3;

/** "YYYY-MM-DD" → local midnight epoch ms */
function dayStart(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).getTime();
}

const DAY_MS = 24 * 3600_000;

export interface CampTiming {
  phase: CampPhase;
  /** false until the programme has been received at least once (phase may still change) */
  synced: boolean;
  /** "YYYY-MM-DD" of the first event (null without a programme) */
  firstDate: string | null;
  /** whole days from today until the first event (negative once it started) */
  daysToGo: number | null;
  /** true on the camp days themselves: from the first event's day through the last event's day (the scoreboard is only shown then) */
  during: boolean;
}

export function campTiming(firstDate: string | null, now = new Date(), synced = true, lastDate: string | null = firstDate): CampTiming {
  if (!firstDate) return { phase: "unknown", synced, firstDate: null, daysToGo: null, during: false };
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const daysToGo = Math.round((dayStart(firstDate) - today) / DAY_MS);
  const during = daysToGo <= 0 && today <= dayStart(lastDate ?? firstDate);
  return { phase: daysToGo > PREP_DAYS ? "before" : "camp", synced, firstDate, daysToGo, during };
}

/** Live camp timing from the programme in the store (re-checked every hour so midnight flips it). */
export function useCampTiming(): CampTiming {
  const events = useCollection("events");
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 3600_000);
    return () => clearInterval(t);
  }, []);
  return useMemo(() => {
    const dates = events && events.length ? events.map((e) => e.date).sort() : [];
    return campTiming(dates[0] ?? null, new Date(), events !== null, dates[dates.length - 1] ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events, tick]);
}
