import { command } from "./client";
import { bearer } from "../auth/store";
import type { Staff } from "./staff";

/** Category keys that feed each camper field (must match the backend). */
export const CAMPER_CATEGORY_KEYS = {
  transportation: "transporte",
  bed: "cama",
  allergies: "alergias",
  drugAllergies: "alergia-medicamentos",
  healthIssues: "condicao-cronica",
} as const;

export interface Camper {
  id: string;
  name: string;
  /** true when the server sent a NAME-ONLY record (bus helper roll call): no health, contacts or notes */
  redacted?: boolean;
  /** true when the server sent a CARE record (room caretaker / helper): health and notes, but no guardian / emergency / documents */
  contactsHidden?: boolean;
  /** "YYYY-MM-DD" or null */
  birthDate: string | null;
  /** "F" | "M" | null */
  sex: CamperSex | null;
  cpf: string;
  rg: string;
  school: string;
  schoolGrade: string;
  /** church the kid attends */
  church: string;
  /** who invited the kid */
  invitedBy: string;
  /** staff id of the team member responsible for the kid (a caretaker of the kid's room); null = orphan */
  caretakerId: string | null;
  /** token printed on the QR badge */
  qrToken: string;
  /** id in the registration system */
  externalId: string;
  team: string | null;
  transportation: string | null;
  /** category option id (cima / baixo) */
  bed: string | null;
  bedroom: string | null;
  /** kilograms (one decimal) or null */
  weightKg: number | null;
  allergies: string[];
  drugAllergies: string[];
  healthIssues: string[];
  medicines: string;
  foodRestrictions: string;
  healthNotes: string;
  generalNotes: string;
  /** who the kid would like to share the room with */
  bedroomPreference: string;
  insurance: string;
  insuranceCard: string;
  emergencyContact: string;
  guardianName: string;
  guardianPhone: string | null;
  guardianCpf: string;
  guardianEmail: string;
  /** set once the kid arrived at the church and the parent confirmed the registration data */
  checkin: CamperCheckin | null;
  /** set once the kid boarded the bus (roll call inside the vehicle) */
  busCheckin: CamperCheckin | null;
  createdAt: string;
  updatedAt: string;
}

export type CamperSex = "F" | "M";

export interface CamperCheckin {
  at: string;
  byUserId: string;
  byName: string;
  byRole: string;
}

export type CamperInput = Omit<Camper, "id" | "checkin" | "busCheckin" | "createdAt" | "updatedAt">;

export interface CamperDetail {
  camper: Camper;
  bedroom: { id: string; name: string; group: "girls" | "boys" | "staff" } | null;
  /** the team member responsible for the kid (null = orphan, or not visible to the viewer) */
  caretaker: Staff | null;
  /** staff sleeping in the same room (caretakers and helpers) */
  caretakers: Staff[];
  roommates: Camper[];
}

const json = (token: string) => ({ ...bearer(token), "content-type": "application/json" });

export async function createCamper(token: string, input: CamperInput): Promise<Camper> {
  const res = await command<{ camper: Camper }>("/api/campers", { method: "POST", headers: json(token), body: JSON.stringify(input) }, ["campers", "bedrooms"]);
  return res.camper;
}

export async function updateCamper(token: string, id: string, patch: Partial<CamperInput>): Promise<Camper> {
  const res = await command<{ camper: Camper }>(`/api/campers/${id}`, { method: "PUT", headers: json(token), body: JSON.stringify(patch) }, ["campers", "bedrooms"]);
  return res.camper;
}

/** Moves the kid to another room and (optionally) under a caretaker of that room. `caretakerId` null = orphan. */
export async function moveCamper(token: string, id: string, bedroom: string | null, caretakerId: string | null): Promise<Camper> {
  return updateCamper(token, id, { bedroom, caretakerId });
}

export async function deleteCamper(token: string, id: string): Promise<void> {
  await command(`/api/campers/${id}`, { method: "DELETE", headers: bearer(token) }, ["campers", "bedrooms"]);
}

export type CheckinKind = "church" | "bus";
const checkinPath = (id: string, kind: CheckinKind) => `/api/campers/${id}/checkin${kind === "bus" ? "/bus" : ""}`;

/** The kid arrived (church: parent confirmed the data at the gate; bus: boarded). */
export async function checkinCamper(token: string, id: string, kind: CheckinKind = "church"): Promise<Camper> {
  const res = await command<{ camper: Camper }>(checkinPath(id, kind), { method: "POST", headers: bearer(token) }, ["campers"]);
  return res.camper;
}

export async function undoCheckinCamper(token: string, id: string, kind: CheckinKind = "church"): Promise<Camper> {
  const res = await command<{ camper: Camper }>(checkinPath(id, kind), { method: "DELETE", headers: bearer(token) }, ["campers"]);
  return res.camper;
}

/** age in whole years at `at` (defaults to today) */
export function ageOf(birthDate: string | null, at = new Date()): number | null {
  if (!birthDate) return null;
  const [y, m, d] = birthDate.split("-").map(Number);
  let age = at.getFullYear() - y;
  if (at.getMonth() + 1 < m || (at.getMonth() + 1 === m && at.getDate() < d)) age--;
  return age >= 0 && age < 120 ? age : null;
}
