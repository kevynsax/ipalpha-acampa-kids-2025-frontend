import { command } from "./client";
import { bearer } from "../auth/store";

export interface ScheduleRole {
  id: string;
  name: string;
  emoji: string;
  /** sanitized HTML from the WYSIWYG editor */
  instructions: string;
  /** sanitized HTML: what to bring / wear / prepare BEFORE the camp for this role (Preparação page) */
  preparation: string;
  /** applies to every active staff member of the event — no per-person assignment */
  forEveryone: boolean;
  /** the assignment carries a per-person detail (team, base, shift…) */
  hasDetail: boolean;
  /**
   * The detail is NOT typed per person: it IS the person's team
   * (`Staff.team`). Only staff WITH a team can be scaled into the role, and
   * the chip is the team (name + colour) read live from the staff record —
   * moving somebody between teams re-labels every event at once.
   */
  detailFromTeam: boolean;
  /** placeholder shown in the detail input */
  detailPlaceholder: string;
  createdAt: string;
  updatedAt: string;
}

export interface ScheduleRoleInput {
  name: string;
  emoji: string;
  instructions: string;
  preparation: string;
  forEveryone: boolean;
  hasDetail: boolean;
  detailFromTeam: boolean;
  detailPlaceholder: string;
}

/** A staff member scaled into one of the event's roles. `detail` = team / base / colour / shift.
 *  Both stay EMPTY for a `detailFromTeam` role — use `roleDetailOf` to read the label. */
export interface EventAssignment {
  staffId: string;
  roleId: string;
  detail: string;
  /** "#rrggbb" tint for the detail chip (team colour), "" = default */
  detailColor: string;
}

/**
 * The detail label of one assignment, from the only place that knows it:
 * the person's team for a `detailFromTeam` role, the stored value otherwise.
 * Mirrors `backend/src/services/schedule.ts#assignmentDetail`.
 */
export function roleDetailOf(
  role: Pick<ScheduleRole, "detailFromTeam"> | undefined | null,
  assignment: Pick<EventAssignment, "detail" | "detailColor"> | undefined | null,
  teamOfStaff: { name: string; color: string } | undefined | null,
): { detail: string; detailColor: string } {
  if (role?.detailFromTeam) return teamOfStaff ? { detail: teamOfStaff.name, detailColor: teamOfStaff.color } : { detail: "", detailColor: "" };
  return { detail: assignment?.detail ?? "", detailColor: assignment?.detailColor ?? "" };
}

/** Cores sugeridas para o detalhe de cada pessoa (time, base, cor). */
export const DETAIL_COLORS = [
  { name: "Verde", hex: "#0f9a8a" },
  { name: "Laranja", hex: "#f2843b" },
  { name: "Amarelo", hex: "#f4c430" },
  { name: "Vermelho", hex: "#e8503a" },
  { name: "Azul", hex: "#3b6ff2" },
  { name: "Roxo", hex: "#7d3bf2" },
  { name: "Rosa", hex: "#e0519b" },
  { name: "Cinza", hex: "#444b52" },
] as const;

export interface CampEvent {
  id: string;
  /** "YYYY-MM-DD" */
  date: string;
  title: string;
  emoji: string;
  startTime: string;
  endTime: string | null;
  notes: string;
  /** ids of the roles staff fulfil in this event */
  roles: string[];
  /** parents see this event on their programme (the team always does) */
  visibleToParents: boolean;
  assignments: EventAssignment[];
  createdAt: string;
  updatedAt: string;
}

export interface CampEventInput {
  date: string;
  title: string;
  emoji: string;
  startTime: string;
  endTime: string | null;
  notes: string;
  roles: string[];
  visibleToParents: boolean;
}

/** Programme day → spoken pt-BR (`speakDay`). Prefer importing from `../dates` in new code. */
export { speakDay as formatEventDate } from "../dates";

const json = (token: string) => ({ ...bearer(token), "content-type": "application/json" });

// ── roles ───────────────────────────────────────────────────────────────────

export interface RoleEventUsage {
  eventId: string;
  date: string;
  startTime: string;
  endTime: string | null;
  title: string;
  emoji: string;
  /** who does this role in the event (for "everyone" roles: everyone not doing something else) */
  people: { staffId: string; name: string; detail: string }[];
}

export interface RoleDetail {
  role: ScheduleRole;
  events: RoleEventUsage[];
}

export async function createRole(token: string, input: ScheduleRoleInput): Promise<ScheduleRole> {
  const res = await command<{ role: ScheduleRole }>("/api/schedule/roles", {
    method: "POST",
    headers: json(token),
    body: JSON.stringify(input),
  }, ["roles", "events"]);
  return res.role;
}

export async function updateRole(token: string, id: string, patch: Partial<ScheduleRoleInput>): Promise<ScheduleRole> {
  const res = await command<{ role: ScheduleRole }>(`/api/schedule/roles/${id}`, {
    method: "PUT",
    headers: json(token),
    body: JSON.stringify(patch),
  }, ["roles", "events"]);
  return res.role;
}

export async function deleteRole(token: string, id: string): Promise<void> {
  await command(`/api/schedule/roles/${id}`, { method: "DELETE", headers: bearer(token) }, ["roles", "events"]);
}

// ── events ──────────────────────────────────────────────────────────────────

export async function createEvent(token: string, input: CampEventInput): Promise<CampEvent> {
  const res = await command<{ event: CampEvent }>("/api/schedule/events", {
    method: "POST",
    headers: json(token),
    body: JSON.stringify(input),
  }, ["roles", "events"]);
  return res.event;
}

export async function updateEvent(token: string, id: string, patch: Partial<CampEventInput>): Promise<CampEvent> {
  const res = await command<{ event: CampEvent }>(`/api/schedule/events/${id}`, {
    method: "PUT",
    headers: json(token),
    body: JSON.stringify(patch),
  }, ["roles", "events"]);
  return res.event;
}

export async function setAssignments(token: string, eventId: string, assignments: EventAssignment[]): Promise<CampEvent> {
  const res = await command<{ event: CampEvent }>(`/api/schedule/events/${eventId}/assignments`, {
    method: "PUT",
    headers: json(token),
    body: JSON.stringify({ assignments }),
  }, ["roles", "events"]);
  return res.event;
}

/** Sets one person's role in an event (replacing any previous one). */
export async function assignStaff(token: string, eventId: string, staffId: string, roleId: string, detail = "", detailColor = ""): Promise<CampEvent> {
  const res = await command<{ event: CampEvent }>(`/api/schedule/events/${eventId}/assignments/${staffId}`, {
    method: "PUT",
    headers: json(token),
    body: JSON.stringify({ roleId, detail, detailColor }),
  }, ["roles", "events"]);
  return res.event;
}

export async function unassignStaff(token: string, eventId: string, staffId: string): Promise<CampEvent> {
  const res = await command<{ event: CampEvent }>(`/api/schedule/events/${eventId}/assignments/${staffId}`, {
    method: "DELETE",
    headers: bearer(token),
  }, ["roles", "events"]);
  return res.event;
}

export async function deleteEvent(token: string, id: string): Promise<void> {
  await command(`/api/schedule/events/${id}`, { method: "DELETE", headers: bearer(token) }, ["roles", "events"]);
}
