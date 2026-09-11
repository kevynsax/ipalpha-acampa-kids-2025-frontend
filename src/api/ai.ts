import { ApiError, OFFLINE_MESSAGE, api } from "./client";
import { bearer } from "../auth/store";

const BASE = import.meta.env.VITE_API_URL || window.location.origin;

export type AiVendor = "anthropic" | "openai" | "xai" | "meta" | "zhipu";

export interface AiModel {
  id: string;
  label: string;
  /** company logo shown beside the name */
  vendor?: AiVendor;
}

export interface AiMessage {
  role: "user" | "assistant";
  content: string;
}

export async function listAiModels(token: string): Promise<{ enabled: boolean; models: AiModel[]; transcribe?: boolean }> {
  return api("/api/ai/models", { headers: bearer(token) });
}

/** Voice message recorded in the chat → Portuguese text (whisper on the server). */
export async function aiTranscribe(token: string, audio: Blob, signal?: AbortSignal): Promise<string> {
  const form = new FormData();
  form.append("file", audio, "voice");
  let res: Response;
  try {
    res = await fetch(`${BASE}/api/ai/transcribe`, { method: "POST", headers: bearer(token), body: form, signal });
  } catch (err) {
    if ((err as Error)?.name === "AbortError") throw err;
    throw new ApiError(0, "OFFLINE", OFFLINE_MESSAGE);
  }
  const data = (await res.json().catch(() => null)) as { text?: string; error?: { code?: string; message?: string } } | null;
  if (!res.ok) throw new ApiError(res.status, data?.error?.code ?? "AI_FAILED", data?.error?.message ?? "Não foi possível transcrever o áudio.");
  return data?.text ?? "";
}

export interface AiVendorUsage {
  vendor: AiVendor | string;
  calls: number;
  errors: number;
  promptTokens: number;
  completionTokens: number;
  lastAt: string | null;
  models: { model: string; calls: number; promptTokens: number; completionTokens: number }[];
}

/** admin only: AI calls and tokens per company */
export async function aiUsage(token: string): Promise<{ vendors: AiVendorUsage[] }> {
  return api("/api/ai/usage", { headers: bearer(token) });
}

/** What the editor is being used for (matches AI_CONTEXTS on the backend). */
export type AiContext = "instruction" | "preparation" | "role_instructions" | "role_preparation" | "occurrence" | "generic";

export interface AiEditRequest {
  model: string;
  context?: AiContext;
  /** document title (context only) */
  title?: string;
  /** current document HTML (relative image urls) */
  html: string;
  /** selected fragment HTML, when the user is editing only a part */
  selection?: string | null;
  messages: AiMessage[];
  /** pictures pasted into the chat (data urls) — go with the last user message */
  images?: string[];
}

/** Lines starting with this in the stream are status notes ("consultando programação"), not document text. */
const TOOL_MARK = "\u241e";

export interface AiProgress {
  /** document text received so far (status lines and pre-lookup chatter removed) */
  text: string;
  /** what the model looked up so far, in order */
  lookups: string[];
  /** live reasoning to show while pending (model chatter + lookup steps); never part of the document */
  thought: string[];
}

/**
 * Splits the raw stream into document text, lookup notes and live thought.
 * Anything the model wrote BEFORE a lookup ("vou conferir o horário…") is
 * thinking out loud: it goes to `thought` for live display and never to
 * `text`, so it can't leak into the document.
 */
export function parseAiStream(raw: string): AiProgress {
  const lookups: string[] = [];
  const thought: string[] = [];
  let text = "";
  for (const line of raw.split("\n")) {
    if (line.startsWith(TOOL_MARK)) {
      lookups.push(line.slice(TOOL_MARK.length));
      if (text.trim()) thought.push(text.trim().slice(0, 300));
      text = "";
    } else {
      text += (text ? "\n" : "") + line;
    }
  }
  return { text, lookups, thought };
}

/** Streams the model output; resolves with the full document text. */
export async function aiEdit(token: string, req: AiEditRequest, onChunk: (progress: AiProgress) => void, signal?: AbortSignal): Promise<AiProgress> {
  let res: Response;
  try {
    res = await fetch(`${BASE}/api/ai/edit`, {
      method: "POST",
      headers: { ...bearer(token), "content-type": "application/json" },
      body: JSON.stringify(req),
      signal,
    });
  } catch (err) {
    if ((err as Error)?.name === "AbortError") throw err;
    throw new ApiError(0, "OFFLINE", OFFLINE_MESSAGE);
  }
  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as { error?: { code?: string; message?: string } } | null;
    throw new ApiError(res.status, data?.error?.code ?? "AI_FAILED", data?.error?.message ?? "O assistente não respondeu.");
  }
  if (!res.body) return { text: "", lookups: [], thought: [] };
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let text = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    text += decoder.decode(value, { stream: true });
    onChunk(parseAiStream(text));
  }
  return parseAiStream(text);
}

export interface AiSuggestion {
  title?: string;
  emoji?: string;
}

/** Title / emoji suggestions for a document the assistant just wrote. Best-effort: may return {}. */
export async function aiSuggest(token: string, req: { html: string; context: AiContext; needTitle: boolean; needEmoji: boolean }): Promise<AiSuggestion> {
  return api("/api/ai/suggest", { method: "POST", headers: { ...bearer(token), "content-type": "application/json" }, body: JSON.stringify(req) });
}

/** Models sometimes wrap the answer in ```html fences even when told not to. */
export function stripCodeFences(text: string): string {
  return text
    .trim()
    .replace(/^```(?:html)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
}
