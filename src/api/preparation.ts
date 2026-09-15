import type { PrepAudience } from "../components/AudiencePicker";
import { command } from "./client";
import { bearer } from "../auth/store";

/** A block of the Preparação page ("O que levar", "Uniforme"…), written by the admin. */
export interface PrepSection {
  id: string;
  title: string;
  emoji: string;
  /** who it is posted to (at least one): parents, room caretakers, helpers */
  audiences: PrepAudience[];
  /** sanitized HTML (may include uploaded images) */
  content: string;
  order: number;
  /** PARENT sessions: this responsible already ticked the item (the team's ticks live on `staff.prepDone`) */
  done?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PrepSectionInput {
  title: string;
  emoji: string;
  /** who it is posted to (at least one): parents, room caretakers, helpers */
  audiences: PrepAudience[];
  content: string;
}

const json = (token: string) => ({ ...bearer(token), "content-type": "application/json" });

export async function createPrepSection(token: string, input: PrepSectionInput): Promise<PrepSection> {
  const res = await command<{ section: PrepSection }>("/api/preparation", { method: "POST", headers: json(token), body: JSON.stringify(input) }, ["preparation"]);
  return res.section;
}

export async function updatePrepSection(token: string, id: string, patch: Partial<PrepSectionInput>): Promise<PrepSection> {
  const res = await command<{ section: PrepSection }>(`/api/preparation/${id}`, { method: "PUT", headers: json(token), body: JSON.stringify(patch) }, ["preparation"]);
  return res.section;
}

export async function reorderPrepSections(token: string, ids: string[]): Promise<PrepSection[]> {
  const res = await command<{ sections: PrepSection[] }>("/api/preparation/reorder", { method: "PUT", headers: json(token), body: JSON.stringify({ ids }) }, ["preparation"]);
  return res.sections;
}

/** A PARENT ticks / unticks one item of their own Preparação checklist. */
export async function setMyPrepSectionDone(token: string, id: string, done: boolean): Promise<void> {
  await command(`/api/preparation/me/section:${id}`, { method: "PUT", headers: json(token), body: JSON.stringify({ done }) }, ["preparation"]);
}

export async function deletePrepSection(token: string, id: string): Promise<void> {
  await command(`/api/preparation/${id}`, { method: "DELETE", headers: bearer(token) }, ["preparation"]);
}
