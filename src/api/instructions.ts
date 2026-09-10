import { api } from "./client";
import { applyServerData, remove, upsert } from "../store";
import { bearer } from "../auth/store";

/** A general instructions document for the whole camp ("Regras", "Plano de emergência"…), written by the admin. */
export interface Instruction {
  id: string;
  title: string;
  emoji: string;
  /** sanitized HTML (may include uploaded images) */
  content: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface InstructionInput {
  title: string;
  emoji: string;
  content: string;
}

const json = (token: string) => ({ ...bearer(token), "content-type": "application/json" });

export async function createInstruction(token: string, input: InstructionInput): Promise<Instruction> {
  const res = await api<{ instruction: Instruction }>("/api/instructions", { method: "POST", headers: json(token), body: JSON.stringify(input) });
  upsert("instructions", res.instruction);
  return res.instruction;
}

export async function updateInstruction(token: string, id: string, patch: Partial<InstructionInput>): Promise<Instruction> {
  const res = await api<{ instruction: Instruction }>(`/api/instructions/${id}`, { method: "PUT", headers: json(token), body: JSON.stringify(patch) });
  upsert("instructions", res.instruction);
  return res.instruction;
}

export async function reorderInstructions(token: string, ids: string[]): Promise<Instruction[]> {
  const res = await api<{ instructions: Instruction[] }>("/api/instructions/reorder", { method: "PUT", headers: json(token), body: JSON.stringify({ ids }) });
  applyServerData({ instructions: res.instructions }, new Date().toISOString());
  return res.instructions;
}

export async function deleteInstruction(token: string, id: string): Promise<void> {
  await api(`/api/instructions/${id}`, { method: "DELETE", headers: bearer(token) });
  remove("instructions", id);
}
