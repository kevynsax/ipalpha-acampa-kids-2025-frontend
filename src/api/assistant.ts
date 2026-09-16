import { ApiError, OFFLINE_MESSAGE, api } from "./client";
import { bearer } from "../auth/store";

const BASE = import.meta.env.VITE_API_URL || window.location.origin;
const TOOL_MARK = "\u241e";

export interface AssistantMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AssistantProgress {
  reply: string;
  lookups: string[];
}

export interface AssistantStatus {
  enabled: boolean;
  model: string;
  /** a GPT-Live key is configured, so the drawer can hold a spoken conversation */
  voice: boolean;
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

export function parseAssistantStream(raw: string): AssistantProgress {
  const lookups: string[] = [];
  let reply = "";
  for (const line of raw.split("\n")) {
    if (line.startsWith(TOOL_MARK)) lookups.push(line.slice(TOOL_MARK.length));
    else reply += `${reply ? "\n" : ""}${line}`;
  }
  return { reply: reply.trim(), lookups };
}

export async function assistantChat(
  token: string,
  messages: AssistantMessage[],
  onChunk: (progress: AssistantProgress) => void,
  signal?: AbortSignal,
): Promise<AssistantProgress> {
  let response: Response;
  try {
    response = await fetch(`${BASE}/api/assistant/chat`, {
      method: "POST",
      headers: { ...bearer(token), "content-type": "application/json" },
      body: JSON.stringify({ messages }),
      signal,
    });
  } catch (error) {
    if ((error as Error)?.name === "AbortError") throw error;
    throw new ApiError(0, "OFFLINE", OFFLINE_MESSAGE);
  }
  if (!response.ok) {
    const data = await response.json().catch(() => null) as { error?: { code?: string; message?: string } } | null;
    throw new ApiError(response.status, data?.error?.code ?? "AI_FAILED", data?.error?.message ?? "O assistente não respondeu.");
  }
  if (!response.body) return { reply: "", lookups: [] };
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let raw = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    raw += decoder.decode(value, { stream: true });
    onChunk(parseAssistantStream(raw));
  }
  return parseAssistantStream(raw);
}
