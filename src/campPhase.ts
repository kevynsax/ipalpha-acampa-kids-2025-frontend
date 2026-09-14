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
  /** true while the camp is happening: from the first event's day until the END of the last event (its start when it has no end) — the scoreboard / give-away are only shown then */
  during: boolean;
  /** epoch ms at which the camp is over (null without a programme) — mirrors the server's `campPeriod().endsAt` */
  endsAt: number | null;
}

/** "YYYY-MM-DD" + "HH:mm" → local epoch ms */
function at(date: string, time: string): number {
  const [h, m] = time.split(":").map(Number);
  return dayStart(date) + (h * 60 + m) * 60_000;
}

export interface LastEvent {
  date: string;
  startTime: string;
  endTime: string | null;
}

/** `last`: the programme's last event — the camp ends at its `endTime`, or its `startTime` when it has none. */
export function campTiming(firstDate: string | null, now = new Date(), synced = true, last: LastEvent | null = null): CampTiming {
  if (!firstDate) return { phase: "unknown", synced, firstDate: null, daysToGo: null, during: false, endsAt: null };
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const daysToGo = Math.round((dayStart(firstDate) - today) / DAY_MS);
  const endsAt = last ? at(last.date, last.endTime ?? last.startTime) : dayStart(firstDate) + DAY_MS;
  const during = daysToGo <= 0 && now.getTime() < endsAt;
  return { phase: daysToGo > PREP_DAYS ? "before" : "camp", synced, firstDate, daysToGo, during, endsAt };
}

const MAX_TIMEOUT = 2 ** 31 - 1;

/** Live camp timing from the programme in the store (re-checked every hour so midnight flips it, and at the instant the camp ends). */
export function useCampTiming(): CampTiming {
  const events = useCollection("events");
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 3600_000);
    return () => clearInterval(t);
  }, []);
  const timing = useMemo(() => {
    const sorted = events && events.length ? events.slice().sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime)) : [];
    const last = sorted[sorted.length - 1];
    return campTiming(sorted[0]?.date ?? null, new Date(), events !== null, last ? { date: last.date, startTime: last.startTime, endTime: last.endTime } : null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events, tick]);
  // wake up right after the camp ends so `during` flips without waiting for the hourly tick
  useEffect(() => {
    if (!timing.during || timing.endsAt === null) return;
    const t = setTimeout(() => setTick((n) => n + 1), Math.min(timing.endsAt - Date.now() + 700, MAX_TIMEOUT));
    return () => clearTimeout(t);
  }, [timing.during, timing.endsAt]);
  return timing;
}
