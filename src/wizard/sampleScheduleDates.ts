export interface SampleScheduleWindows {
  staffAccessWindow: { from: string; until: string };
  parentAccessWindow: { from: string; until: string };
  checkinWindow: { from: string; until: string };
  busReturnWindow: { from: string; until: string };
}

export interface SampleSchedulePlan extends SampleScheduleWindows {
  /** YYYY-MM-DD of the first camp day (tomorrow) */
  firstDay: string;
}

const pad = (n: number) => String(n).padStart(2, "0");

export const isoDay = (d: Date): string => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const at = (base: Date, hours: number, minutes: number): string => {
  const d = new Date(base);
  d.setHours(hours, minutes, 0, 0);
  return d.toISOString();
};

/**
 * Test-camp schedule anchored on today: the staff and parents windows open
 * right now, the first camp day is tomorrow, check-in runs 17:30–19:30 on
 * that day and the return-trip roll call 14:00–15:00 three days from now.
 * Everything derives from `now`, in the device clock.
 */
export function sampleSchedulePlan(now = new Date()): SampleSchedulePlan {
  const plus = (days: number): Date => {
    const d = new Date(now);
    d.setDate(d.getDate() + days);
    return d;
  };
  const tomorrow = plus(1);
  const checkout = plus(3);
  const campEnd = new Date(checkout);
  campEnd.setHours(23, 59, 0, 0);
  const window = { from: now.toISOString(), until: campEnd.toISOString() };
  return {
    firstDay: isoDay(tomorrow),
    staffAccessWindow: window,
    parentAccessWindow: window,
    checkinWindow: { from: at(tomorrow, 17, 30), until: at(tomorrow, 19, 30) },
    busReturnWindow: { from: at(checkout, 14, 0), until: at(checkout, 15, 0) },
  };
}

/** YYYY-MM-DD plus `days`, for mapping template days onto calendar dates. */
export function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + days);
  return isoDay(d);
}
