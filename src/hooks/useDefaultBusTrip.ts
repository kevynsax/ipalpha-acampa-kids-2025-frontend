import { useCollection } from "../store";
import type { Settings } from "../api/settings";

export type BusTrip = "outbound" | "return";

type Windows = Pick<Settings, "checkinWindow" | "busReturnWindow">;

const ms = (iso: string | null | undefined) => (iso ? new Date(iso).getTime() : null);

/** The other journey — for the "trocar viagem" button. */
export const otherTrip = (t: BusTrip): BusTrip => (t === "return" ? "outbound" : "return");

/**
 * Which bus roll call the app opens by default, so nobody has to pick a trip
 * at the vehicle door:
 *
 * 1. while the church check-in window is open, everyone is boarding to camp → ida;
 * 2. once the return window has STARTED (its check-in is the one running now) → volta;
 * 3. anything else (check-in already closed, camp under way) → ida.
 *
 * Always overridable from the screen itself.
 */
export function useDefaultBusTrip(): BusTrip {
  const settings = useCollection("settings") as Windows | null;
  const now = Date.now();
  const from = ms(settings?.checkinWindow?.from);
  const until = ms(settings?.checkinWindow?.until);
  if (from !== null && until !== null && from <= now && now < until) return "outbound";
  const returnFrom = ms(settings?.busReturnWindow?.from);
  if (returnFrom !== null && now >= returnFrom) return "return";
  return "outbound";
}

/**
 * Is the kids' CHURCH check-in window open right now? (the arrival door on
 * departure day). Lets a screen open on the church leg while it is running and
 * fall back to a bus leg afterwards — see pages/TransportReport.
 */
export function useChurchWindowOpen(): boolean {
  const settings = useCollection("settings") as Windows | null;
  const now = Date.now();
  const from = ms(settings?.checkinWindow?.from);
  const until = ms(settings?.checkinWindow?.until);
  return from !== null && until !== null && from <= now && now < until;
}
