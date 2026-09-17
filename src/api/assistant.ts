import { api } from "./client";
import { bearer } from "../auth/store";

export interface AssistantStatus {
  /** a GPT-Live key is configured, so the drawer can hold a spoken conversation */
  enabled: boolean;
  voiceModel: string;
}

export async function assistantStatus(token: string): Promise<AssistantStatus> {
  return api("/api/assistant/status", { headers: bearer(token) });
}

/** Trades this browser's WebRTC offer for the GPT-Live answer; the key stays on the server. */
export async function assistantLiveSession(token: string, sdp: string): Promise<{ sessionId: string; sdp: string }> {
  return api("/api/assistant/live", { method: "POST", headers: bearer(token), body: JSON.stringify({ sdp }) });
}

/** Runs one read-only MongoDB tool the voice session asked for. */
export async function assistantTool(token: string, name: string, args: string): Promise<{ output: string }> {
  return api("/api/assistant/tool", { method: "POST", headers: bearer(token), body: JSON.stringify({ name, arguments: args }) });
}
