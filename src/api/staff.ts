import { api, command } from "./client";
import { bearer } from "../auth/store";
import { ICONS } from "../icons";

/** Category keys that feed each staff field (must match the backend). */
export const STAFF_CATEGORY_KEYS = {
  allergies: "alergias",
  drugAllergies: "alergia-medicamentos",
  healthIssues: "condicao-cronica",
} as const;

export interface Staff {
  id: string;
  name: string;
  /** "F" | "M" | null — from the room (meninas/meninos) or a GLM guess on the name; never shown on the form */
  sex: import("./campers").CamperSex | null;
  /** E.164, or null while the person hasn't registered a phone */
  phone: string | null;
  /** an ADMIN's own roster record: can't be deleted, deactivated or have the phone changed */
  admin?: boolean;
  active: boolean;
  team: string | null;
  /** Transport id (see api/transports.ts) — bus / car, not a category option */
  transportation: string | null;
  /** Bedroom id (see api/bedrooms.ts) — not a category option */
  bedroom: string | null;
  /** CARETAKER ("líder"): looks after specific kids; HELPER ("auxiliar"): only helps out in the room */
  roomRole: RoomRole;
  allergies: string[];
  drugAllergies: string[];
  foodRestrictions: string;
  healthIssues: string[];
  /** medicines the person takes, each with its schedule */
  medications: import("./campers").Medication[];
  /** free-text health/allergy remarks */
  healthNotes: string;
  /** set when the person arrived on departure day */
  checkin: import("./campers").CamperCheckin | null;
  /** the team vest (colete): handed out, then taken back */
  vest: VestStatus;
  /** Preparação items ticked as done: "section:<id>" | "role:<id>" */
  prepDone: string[];
  /** distinct kids scanned via the emergency QR outside this person's scope */
  foreignLookupCount?: number;
  /** names of those kids (newest last) — for the admin export / Geral card */
  foreignLookupNames?: string[];
  /**
   * true when the server sent a reduced record: the viewer is a colleague in
   * the same room (name + phone + room role + team) or a vest helper (name +
   * phone + vest) — not an admin nor the person themself (transport, health
   * and check-in are blank)
   */
  redacted?: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Vest (colete) check-out / check-in: `returned` is never set without `delivered`. */
export interface VestStatus {
  delivered: import("./campers").CamperCheckin | null;
  returned: import("./campers").CamperCheckin | null;
}

export type RoomRole = "caretaker" | "helper";
/** `icon` is the head-only paper-cut image (render it with <RoomRoleIcon>). */
export const ROOM_ROLE_META: Record<RoomRole, { label: string; plural: string; icon?: string; hint: string }> = {
  caretaker: { label: "Líder", plural: "Líderes", icon: ICONS.leaderFaceWoman, hint: "cuida de crianças específicas do quarto" },
  helper: { label: "Auxiliar", plural: "Auxiliares", icon: ICONS.helperFaceWoman, hint: "ajuda no quarto, sem crianças próprias" },
};

/**
 * An ADMIN's roster record exists only so they have a room, a transport and a
 * vest like everyone else — it is not a team profile: they never become a
 * líder, never receive kids and never join a time. Keep them out of every
 * líder / "who takes the kids" picker.
 */
export function canBeCaretaker(s: Pick<Staff, "admin">): boolean {
  return !s.admin;
}

/** Room rosters: leaders first, then assistants; alphabetical inside each role. */
export function compareRoomStaff(a: Pick<Staff, "name" | "roomRole">, b: Pick<Staff, "name" | "roomRole">): number {
  const roleOrder: Record<RoomRole, number> = { caretaker: 0, helper: 1 };
  return roleOrder[a.roomRole] - roleOrder[b.roomRole] || a.name.localeCompare(b.name, "pt-BR", { sensitivity: "base" });
}

export interface StaffInput {
  name: string;
  sex: import("./campers").CamperSex | null;
  phone: string | null;
  active: boolean;
  team: string | null;
  bedroom: string | null;
  roomRole: RoomRole;
  transportation: string | null;
  allergies: string[];
  drugAllergies: string[];
  foodRestrictions: string;
  healthIssues: string[];
  medications: import("./campers").Medication[];
  healthNotes: string;
}

/**
 * A team member's sex: girls/boys room wins, otherwise the stored GLM guess.
 */
export function staffSex(s: Pick<Staff, "bedroom" | "sex">, bedrooms: Pick<import("./bedrooms").Bedroom, "id" | "group">[]): import("./campers").CamperSex | null {
  const group = s.bedroom ? bedrooms.find((b) => b.id === s.bedroom)?.group : undefined;
  if (group === "girls") return "F";
  if (group === "boys") return "M";
  return s.sex ?? null;
}

const json = (token: string) => ({ ...bearer(token), "content-type": "application/json" });

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
  /** the OTHER kids of the room (a caretaker: those under someone else's care; a helper: none) */
  otherCampers: import("./campers").Camper[];
  /** other staff in the same bedroom */
  roommates: Staff[];
}

export async function createStaff(token: string, input: StaffInput): Promise<Staff> {
  const res = await command<{ staff: Staff }>("/api/staff", {
    method: "POST",
    headers: json(token),
    body: JSON.stringify(input),
  }, ["staff", "bedrooms"]);
  return res.staff;
}

export async function updateStaff(token: string, id: string, patch: Partial<StaffInput>): Promise<Staff> {
  const res = await command<{ staff: Staff }>(`/api/staff/${id}`, {
    method: "PUT",
    headers: json(token),
    body: JSON.stringify(patch),
  }, ["staff", "bedrooms"]);
  return res.staff;
}

/** What to do with the kids under a caretaker's care when the caretaker changes room (see POST /api/staff/:id/move). */
export type MoveKids = "orphan" | "bring" | "assign" | "swap";
export interface MoveStaffInput {
  bedroom: string | null;
  kids: MoveKids;
  /** kids: "assign" — the member of the SAME room who takes the kids (a helper is promoted) */
  assignTo?: string;
  /** kids: "swap" — the member of the TARGET room who comes to this room and takes these kids */
  swapWith?: string;
}

export async function moveStaff(token: string, id: string, input: MoveStaffInput): Promise<Staff> {
  const res = await command<{ staff: Staff }>(`/api/staff/${id}/move`, { method: "POST", headers: json(token), body: JSON.stringify(input) }, ["staff", "bedrooms", "campers"]);
  return res.staff;
}

/** The team member arrived. */
export async function checkinStaff(token: string, id: string): Promise<Staff> {
  const res = await command<{ staff: Staff }>(`/api/staff/${id}/checkin`, { method: "POST", headers: bearer(token) }, ["staff"]);
  return res.staff;
}

export async function undoCheckinStaff(token: string, id: string): Promise<Staff> {
  const res = await command<{ staff: Staff }>(`/api/staff/${id}/checkin`, { method: "DELETE", headers: bearer(token) }, ["staff"]);
  return res.staff;
}

// ── vest (colete): admin or a listed vest helper ──

export type VestAction = "deliver" | "undo-deliver" | "return" | "undo-return";

/** Stamps / clears the vest delivery or return of one team member. */
export async function setStaffVest(token: string, id: string, action: VestAction): Promise<Staff> {
  const path = `/api/staff/${id}/vest/${action.endsWith("deliver") ? "delivery" : "return"}`;
  const method = action.startsWith("undo") ? "DELETE" : "POST";
  const res = await command<{ staff: Staff }>(path, { method, headers: bearer(token) }, ["staff"]);
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
  /** every meeting point — the phone shows the distance to the nearest one */
  locations: import("./settings").CheckinLocation[];
  staff: Staff | null;
}

export async function getSelfCheckinStatus(token: string): Promise<SelfCheckinStatus> {
  return api<SelfCheckinStatus>("/api/staff/me/checkin", { headers: bearer(token) });
}

/** Sends the device position; the server decides whether it is close enough. */
export async function selfCheckin(token: string, pos: { lat: number; lng: number; accuracyM?: number }): Promise<{ staff: Staff; distanceM: number; location: import("./settings").CheckinLocation }> {
  const res = await command<{ staff: Staff; distanceM: number; location: import("./settings").CheckinLocation }>("/api/staff/me/checkin", {
    method: "POST",
    headers: json(token),
    body: JSON.stringify(pos),
  }, ["staff"]);
  return res;
}

/** Ticks / unticks one item of the logged-in person's Preparação checklist. */
export async function setMyPrepDone(token: string, key: string, done: boolean): Promise<Staff> {
  const res = await command<{ staff: Staff }>(`/api/staff/me/prep/${key}`, { method: "PUT", headers: json(token), body: JSON.stringify({ done }) }, ["staff"]);
  return res.staff;
}

export async function deleteStaff(token: string, id: string): Promise<void> {
  await command(`/api/staff/${id}`, { method: "DELETE", headers: bearer(token) }, ["staff", "bedrooms", "events"]);
}
