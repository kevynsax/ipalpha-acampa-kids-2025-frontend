import { api, command } from "./client";
import { bearer } from "../auth/store";

export type ImportField =
  | "name" | "birthDate" | "bed" | "bedroomPreference" | "team" | "transportation" | "bedroom" | "leader"
  | "cpf" | "guardianCpf" | "rg" | "school" | "schoolGrade" | "church" | "invitedBy" | "guardianName"
  | "guardianPhone" | "guardianEmail" | "emergencyContact" | "insurance" | "insuranceCard" | "weightKg"
  | "allergies" | "drugAllergies" | "healthIssues" | "neurodivergent" | "dailyMedication" | "foodRestrictions" | "healthNotes" | "generalNotes";

export interface ImportColumn {
  source: string;
  target: ImportField | null;
  confidence: number;
  samples: string[];
}

export type ImportReviewKind = "leader" | "date" | "guardianName" | "phone" | "cpf" | "email";

export interface ImportReviewItem {
  id: string;
  row: number;
  kind: ImportReviewKind;
  field: string;
  kidName: string;
  guardianName: string;
  birthDate: string;
  age: number | null;
  emergencyContact: string;
  original: string;
  value: string;
  skip: boolean;
  resolved: boolean;
  affectedRows?: number[];
  options?: { id: string; label: string }[];
}

export interface CamperImport {
  id: string;
  fileName: string;
  fileType: string;
  status: "needs_mapping" | "analyzing" | "panic" | "review" | "ready" | "importing" | "completed" | "error";
  dryRun: boolean;
  columns: ImportColumn[];
  dictionaries: { field: string; raw: string; normalized: string; value: unknown; label: string; draft: boolean; kind: string }[];
  reviews: ImportReviewItem[];
  preview: Record<string, unknown>[];
  skipped: Record<string, unknown>[];
  createdItems: { kind: string; id: string; label: string; draft: boolean }[];
  dateFunction: string;
  startedAt: string;
  finishedAt: string | null;
  error: string;
}

export async function listImportFields(token: string): Promise<{ key: ImportField; label: string }[]> {
  const res = await api<{ fields: { key: ImportField; label: string }[] }>("/api/camper-imports/fields", { headers: bearer(token) });
  return res.fields;
}

export async function analyzeCamperFile(token: string, file: File, mapping?: Record<string, string | null>): Promise<CamperImport> {
  const data = new FormData();
  data.append("file", file);
  if (mapping) data.append("mapping", JSON.stringify(mapping));
  const res = await api<{ import: CamperImport }>("/api/camper-imports/analyze", { method: "POST", headers: bearer(token), body: data });
  return res.import;
}

export async function createImportLeader(token: string, importId: string, reviewId: string, phone: string): Promise<{ staff: { id: string; name: string; phone: string }; import: CamperImport }> {
  return command<{ staff: { id: string; name: string; phone: string }; import: CamperImport }>(`/api/camper-imports/${importId}/leaders`, {
    method: "POST",
    headers: { ...bearer(token), "content-type": "application/json" },
    body: JSON.stringify({ reviewId, phone }),
  }, ["staff"]);
}

export async function applyCamperImport(token: string, importId: string, file: File, delta: Record<string, { value?: string; skip?: boolean }>): Promise<{ inserted: number; skipped: number; import: CamperImport }> {
  const data = new FormData();
  data.append("file", file);
  data.append("delta", JSON.stringify(delta));
  return command(`/api/camper-imports/${importId}/apply`, {
    method: "POST",
    headers: bearer(token),
    body: data,
  }, ["campers", "bedrooms", "staff", "teams", "transports", "categories"]);
}
