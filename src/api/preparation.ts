import { api } from "./client";
import { applyServerData, remove, upsert } from "../store";
import { bearer } from "../auth/store";

/** A block of the Preparação page ("O que levar", "Uniforme"…), written by the admin. */
export interface PrepSection {
  id: string;
  title: string;
  emoji: string;
  /** sanitized HTML (may include uploaded images) */
  content: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface PrepSectionInput {
  title: string;
  emoji: string;
  content: string;
}

const json = (token: string) => ({ ...bearer(token), "content-type": "application/json" });

export async function createPrepSection(token: string, input: PrepSectionInput): Promise<PrepSection> {
  const res = await api<{ section: PrepSection }>("/api/preparation", { method: "POST", headers: json(token), body: JSON.stringify(input) });
  upsert("preparation", res.section);
  return res.section;
}

export async function updatePrepSection(token: string, id: string, patch: Partial<PrepSectionInput>): Promise<PrepSection> {
  const res = await api<{ section: PrepSection }>(`/api/preparation/${id}`, { method: "PUT", headers: json(token), body: JSON.stringify(patch) });
  upsert("preparation", res.section);
  return res.section;
}

export async function reorderPrepSections(token: string, ids: string[]): Promise<PrepSection[]> {
  const res = await api<{ sections: PrepSection[] }>("/api/preparation/reorder", { method: "PUT", headers: json(token), body: JSON.stringify({ ids }) });
  applyServerData({ preparation: res.sections }, new Date().toISOString());
  return res.sections;
}

export async function deletePrepSection(token: string, id: string): Promise<void> {
  await api(`/api/preparation/${id}`, { method: "DELETE", headers: bearer(token) });
  remove("preparation", id);
}
