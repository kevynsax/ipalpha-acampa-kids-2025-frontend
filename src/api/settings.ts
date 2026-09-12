import { command } from "./client";
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
  /** an Instruções document / Preparação section was created or edited, or the instructions / preparation text of one of the person's roles changed */
  contentChanges: boolean;
  /** added to the team or to an admin list (organizer, helper, medical, parent contact) — SMS with the app link */
  enrolments: boolean;
  /** the person's OWN allocation changed: bedroom, team or vehicle (bus) */
  staffChanges: boolean;
  /** an occurrence was registered — every admin is texted */
  occurrences: boolean;
  /** at `checkinReminder.at` the whole team is reminded to do their check-in (nothing goes out while the date is unset) */
  checkinReminder: boolean;
}

/** One-shot reminder to the whole team to do their check-in. */
export interface CheckinReminder {
  /** ISO instant; null = no reminder */
  at: string | null;
  /** read-only: when it went out (null until then; reset whenever `at` changes) */
  sentAt: string | null;
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
  /** when ORDINARY team members (on no list) may use the app; both ends null = always */
  staffAccessWindow: CheckinWindow;
  /** test mode: church + bus check-in open for the helpers regardless of the window (team self check-in unaffected) */
  checkinTestMode: boolean;
  /** the kids' room allocation is still a draft: caretakers see no kids in their room and no room SMS goes out */
  kidsRoomsDraft: boolean;
  /** the "do your check-in" SMS to the whole team, scheduled for one instant */
  checkinReminder: CheckinReminder;
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
  staffAccessWindow?: { from: string | null; until: string | null };
  checkinTestMode?: boolean;
  kidsRoomsDraft?: boolean;
  checkinReminder?: { at: string | null };
}

/** Clears every check-in (kids' church + bus, team) and the audit log — for rehearsing the process. */
export async function resetCheckins(token: string): Promise<{ campers: number; staff: number }> {
  return command<{ campers: number; staff: number }>("/api/settings/checkin/reset", { method: "POST", headers: bearer(token) }, ["campers", "staff"]);
}

/** Writes go through REST; the canonical value arrives in the `settings` WebSocket collection. */
export async function updateSettings(token: string, patch: SettingsPatch): Promise<void> {
  await command<{ settings: Settings }>(
    "/api/settings",
    {
      method: "PUT",
      headers: { ...bearer(token), "content-type": "application/json" },
      body: JSON.stringify(patch),
    },
    ["settings"],
  );
}

/** Google Maps link for a point (used on the settings page to double-check the pin). */
export function mapsLink(loc: { lat: number; lng: number }): string {
  return `https://www.google.com/maps?q=${loc.lat},${loc.lng}`;
}
