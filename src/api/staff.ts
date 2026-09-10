import { api } from "./client";
import { remove, upsert } from "../store";
import { bearer } from "../auth/store";

/** Category keys that feed each staff field (must match the backend). */
export const STAFF_CATEGORY_KEYS = {
  team: "equipe",
  transportation: "transporte",
  allergies: "alergias",
  drugAllergies: "alergia-medicamentos",
  healthIssues: "condicao-cronica",
} as const;

export interface Staff {
  id: string;
  name: string;
  /** E.164, or null while the person hasn't registered a phone */
  phone: string | null;
  active: boolean;
  team: string | null;
  transportation: string | null;
  /** Bedroom id (see api/bedrooms.ts) — not a category option */
  bedroom: string | null;
  allergies: string[];
  drugAllergies: string[];
  foodRestrictions: string;
  healthIssues: string[];
  medicines: string;
  /** free-text health/allergy remarks */
  healthNotes: string;
  /** set when the person arrived on departure day */
  checkin: import("./campers").CamperCheckin | null;
  /** Preparação items ticked as done: "section:<id>" | "role:<id>" */
  prepDone: string[];
  /**
   * true when the server sent a NAME-ONLY record: the viewer is a colleague in
   * the same room, not an admin nor the person themself (phone, team, health
   * and check-in are all blank)
   */
  redacted?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StaffInput {
  name: string;
  phone: string | null;
  active: boolean;
  team: string | null;
  bedroom: string | null;
  transportation: string | null;
  allergies: string[];
  drugAllergies: string[];
  foodRestrictions: string;
  healthIssues: string[];
  medicines: string;
  healthNotes: string;
}

const json = (token: string) => ({ ...bearer(token), "content-type": "application/json" });

export async function listStaff(token: string): Promise<Staff[]> {
  const res = await api<{ staff: Staff[] }>("/api/staff", { headers: bearer(token) });
  return res.staff;
}

export interface StaffScheduleItem {
  eventId: string;
  date: string;
  startTime: string;
  endTime: string | null;
  title: string;
  emoji: string;
  role: { id: string; name: string; emoji: string; instructions: string } | null;
  detail: string;
  /** true when it comes from a "for everyone" role, not an explicit assignment */
  implicit: boolean;
  /** the event's "for everyone" role — what the person falls back to when unassigned (null = none) */
  defaultRole: { id: string; name: string; emoji: string } | null;
}

export interface StaffDetail {
  staff: Staff;
  bedroom: { id: string; name: string; group: "girls" | "boys" | "staff" } | null;
  schedule: StaffScheduleItem[];
  /** kids sleeping in this person's bedroom (their responsibility) */
  campers: import("./campers").Camper[];
  /** other staff in the same bedroom */
  roommates: Staff[];
}

export async function getStaffDetail(token: string, id: string): Promise<StaffDetail> {
  return api<StaffDetail>(`/api/staff/${id}/detail`, { headers: bearer(token) });
}

export async function createStaff(token: string, input: StaffInput): Promise<Staff> {
  const res = await api<{ staff: Staff }>("/api/staff", {
    method: "POST",
    headers: json(token),
    body: JSON.stringify(input),
  });
  upsert("staff", res.staff);
  return res.staff;
}

export async function updateStaff(token: string, id: string, patch: Partial<StaffInput>): Promise<Staff> {
  const res = await api<{ staff: Staff }>(`/api/staff/${id}`, {
    method: "PUT",
    headers: json(token),
    body: JSON.stringify(patch),
  });
  upsert("staff", res.staff);
  return res.staff;
}

/** The team member arrived. */
export async function checkinStaff(token: string, id: string): Promise<Staff> {
  const res = await api<{ staff: Staff }>(`/api/staff/${id}/checkin`, { method: "POST", headers: bearer(token) });
  upsert("staff", res.staff);
  return res.staff;
}

export async function undoCheckinStaff(token: string, id: string): Promise<Staff> {
  const res = await api<{ staff: Staff }>(`/api/staff/${id}/checkin`, { method: "DELETE", headers: bearer(token) });
  upsert("staff", res.staff);
  return res.staff;
}

// ── self check-in (the logged-in team member, on departure day, at the church) ──

export type SelfCheckinBlock = "NOT_LINKED" | "INACTIVE" | "NO_SCHEDULE" | "NOT_TODAY" | "NOT_YET" | "ALREADY_CHECKED_IN";

export interface SelfCheckinStatus {
  allowed: boolean;
  reason: { code: SelfCheckinBlock; message: string } | null;
  /** the departure day ("YYYY-MM-DD") — null when the programme is empty */
  date: string | null;
  /** ISO instant from which the check-in is accepted (1 h before the first event) — null when the programme is empty */
  opensAt: string | null;
  location: import("./settings").CheckinLocation;
  staff: Staff | null;
}

export async function getSelfCheckinStatus(token: string): Promise<SelfCheckinStatus> {
  return api<SelfCheckinStatus>("/api/staff/me/checkin", { headers: bearer(token) });
}

/** Sends the device position; the server decides whether it is close enough. */
export async function selfCheckin(token: string, pos: { lat: number; lng: number; accuracyM?: number }): Promise<{ staff: Staff; distanceM: number }> {
  const res = await api<{ staff: Staff; distanceM: number }>("/api/staff/me/checkin", {
    method: "POST",
    headers: json(token),
    body: JSON.stringify(pos),
  });
  upsert("staff", res.staff);
  return res;
}

/** Ticks / unticks one item of the logged-in person's Preparação checklist. */
export async function setMyPrepDone(token: string, key: string, done: boolean): Promise<Staff> {
  const res = await api<{ staff: Staff }>(`/api/staff/me/prep/${key}`, { method: "PUT", headers: json(token), body: JSON.stringify({ done }) });
  upsert("staff", res.staff);
  return res.staff;
}

export async function deleteStaff(token: string, id: string): Promise<void> {
  await api(`/api/staff/${id}`, { method: "DELETE", headers: bearer(token) });
  remove("staff", id);
}
