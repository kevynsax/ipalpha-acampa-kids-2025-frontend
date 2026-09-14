import { bearer } from "../auth/store";
import { command } from "./client";

/**
 * The medical team's medication checklist. The PRESCRIPTION lives on the
 * camper (`Camper.medications`, written by the parents / admin); each record
 * here is ONE dose the team ticked as given.
 */
export interface MedicationDose {
  id: string;
  camperId: string;
  camperName: string;
  /** normalized medicine name — links the tick to the prescription */
  medKey: string;
  medName: string;
  dose: string;
  /** "YYYY-MM-DD" the dose belongs to */
  day: string;
  /** "HH:MM" of the prescribed moment, or "sos" (quando necessário) */
  slot: string;
  givenAt: string;
  by: { id: string; name: string };
  note: string;
}

/** "quando necessário" doses: no fixed time, may repeat in the same day */
export const SOS_SLOT = "sos";

/** Medicine name → the key the backend stores (must match models/medications.ts). */
export function medKeyOf(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export interface MedicationDoseInput {
  camperId: string;
  medName: string;
  /** "YYYY-MM-DD" — defaults to today (camp time zone) on the server */
  day?: string;
  slot: string;
  note?: string;
}

/** Ticks one dose. A scheduled slot already ticked returns the same record. */
export async function giveMedication(token: string, input: MedicationDoseInput): Promise<MedicationDose> {
  const res = await command<{ medication: MedicationDose }>(
    "/api/medications",
    { method: "POST", headers: { ...bearer(token), "content-type": "application/json" }, body: JSON.stringify(input) },
    ["medications"],
  );
  return res.medication;
}

/** Unticks one dose (a mistake). */
export async function undoMedication(token: string, id: string): Promise<void> {
  await command(`/api/medications/${id}`, { method: "DELETE", headers: bearer(token) }, ["medications"]);
}
