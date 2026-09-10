import { bearer } from "../auth/store";
import { upsert } from "../store";
import { api } from "./client";

export interface OccurrencePerson {
  id: string;
  name: string;
}

export interface Occurrence {
  id: string;
  campers: OccurrencePerson[];
  staff: OccurrencePerson[];
  /** sanitized HTML, possibly containing uploaded images */
  description: string;
  createdBy: { id: string; name: string; role: string };
  createdAt: string;
}

export interface OccurrenceInput {
  camperIds: string[];
  staffIds: string[];
  description: string;
}

export async function createOccurrence(token: string, input: OccurrenceInput): Promise<Occurrence> {
  const response = await api<{ occurrence: Occurrence }>("/api/occurrences", {
    method: "POST",
    headers: { ...bearer(token), "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  upsert("occurrences", response.occurrence);
  return response.occurrence;
}
