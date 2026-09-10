import { api } from "./client";
import { bearer } from "../auth/store";

/** Where the team must be to check themselves in on departure day. */
export interface CheckinLocation {
  lat: number;
  lng: number;
  /** metres around the point that still count as "at the church" */
  radiusM: number;
}

/** Which changes are texted (SMS) to the team members concerned. */
export interface NotificationSettings {
  /** a kid enters / leaves the person's bedroom */
  bedroomChanges: boolean;
  /** the person's role in an event changes (assigned, reassigned, removed, event moved / deleted) */
  roleChanges: boolean;
  /** the person's church check-in was recorded (by themselves or by the admin roll call) */
  checkinConfirmation: boolean;
}

/** The time window in which the check-in helpers (church AND bus) may act. */
export interface CheckinWindow {
  /** ISO instants; null = not set (window never opens) */
  from: string | null;
  until: string | null;
  /** read-only: is the window open right now (server clock)? */
  open: boolean;
}

/** A list of team members (check-in helpers, organizers, medical team). */
export interface StaffList {
  staffIds: string[];
}

/** One bus helper at the door of one vehicle (`transporte` option id) — independent from the person's own `transportation` */
export interface BusHelper {
  staffId: string;
  vehicleId: string;
}

export interface BusHelperList {
  helpers: BusHelper[];
}

/** A staff member and the purpose shown beside them on the future parent contacts screen. */
export interface ParentContact {
  id: string;
  title: string;
  staffId: string;
}

export interface Settings {
  checkinLocation: CheckinLocation;
  notifications: NotificationSettings;
  checkinWindow: CheckinWindow;
  /** church check-in helpers: inside the window they receive every camper (health included) */
  checkinHelpers: StaffList;
  /** bus helpers: each linked to ONE vehicle; inside the window they receive the kids of that vehicle, names only (`Camper.redacted`) */
  busHelpers: BusHelperList;
  /** programme organizers (no window): write the schedule, see the whole team; never write staff */
  organizers: StaffList;
  /** medical team (no window): every camper in full, every bedroom and vehicle, the whole time — read-only */
  medicalStaff: StaffList;
  /** ordered staff contacts that will be shared with parents */
  parentContacts: ParentContact[];
  /** false when the server has no SMS provider configured (texts are only logged) */
  smsEnabled: boolean;
  updatedAt: string | null;
}

/** Igreja Presbiteriana em Alphaville (same default as the backend). */
export const DEFAULT_CHECKIN_LOCATION: CheckinLocation = {
  lat: -23.48053637134259,
  lng: -46.83077891444747,
  radiusM: 300,
};

export async function getSettings(token: string): Promise<Settings> {
  const res = await api<{ settings: Settings }>("/api/settings", { headers: bearer(token) });
  return res.settings;
}

export interface SettingsPatch {
  checkinLocation?: CheckinLocation;
  /** partial: only the keys sent are changed */
  notifications?: Partial<NotificationSettings>;
  checkinWindow?: { from: string | null; until: string | null };
  checkinHelpers?: StaffList;
  busHelpers?: BusHelperList;
  organizers?: StaffList;
  medicalStaff?: StaffList;
  parentContacts?: ParentContact[];
}

export async function updateSettings(token: string, patch: SettingsPatch): Promise<Settings> {
  const res = await api<{ settings: Settings }>("/api/settings", {
    method: "PUT",
    headers: { ...bearer(token), "content-type": "application/json" },
    body: JSON.stringify(patch),
  });
  return res.settings;
}

/** Google Maps link for a point (used on the settings page to double-check the pin). */
export function mapsLink(loc: { lat: number; lng: number }): string {
  return `https://www.google.com/maps?q=${loc.lat},${loc.lng}`;
}
