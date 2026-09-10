import { applyServerData, setConnection, type Collections } from "./index";

/**
 * Keeps ONE WebSocket to the backend while the user is logged in.
 * Reconnects with backoff, so a phone that loses the camp Wi-Fi for a while
 * picks the live feed back up on its own. While disconnected the app keeps
 * showing what is in localStorage.
 */

const BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

function wsUrl(token: string): string {
  const u = new URL("/api/realtime", BASE);
  u.protocol = u.protocol === "https:" ? "wss:" : "ws:";
  u.searchParams.set("token", token);
  return u.toString();
}

type ServerMessage =
  | { type: "snapshot"; at: string; data: Partial<Collections> }
  | { type: "update"; at: string; data: Partial<Collections> }
  | { type: "ping"; at: string }
  | { type: "error"; code: string; message: string };

let socket: WebSocket | null = null;
let currentToken: string | null = null;
let retryTimer: ReturnType<typeof setTimeout> | null = null;
let attempts = 0;
let onUnauthorized: (() => void) | null = null;

function clearRetry() {
  if (retryTimer) clearTimeout(retryTimer);
  retryTimer = null;
}

function open() {
  if (!currentToken) return;
  clearRetry();
  setConnection("connecting");

  const ws = new WebSocket(wsUrl(currentToken));
  socket = ws;

  ws.onopen = () => {
    attempts = 0;
    setConnection("online");
  };

  ws.onmessage = (evt) => {
    let msg: ServerMessage;
    try {
      msg = JSON.parse(String(evt.data)) as ServerMessage;
    } catch {
      return;
    }
    if (msg.type === "snapshot" || msg.type === "update") applyServerData(msg.data, msg.at);
    else if (msg.type === "ping") ws.send("pong");
    else if (msg.type === "error" && msg.code === "UNAUTHORIZED") {
      currentToken = null;
      onUnauthorized?.();
    }
  };

  ws.onclose = (evt) => {
    if (socket === ws) socket = null;
    setConnection("offline");
    if (evt.code === 4401) {
      currentToken = null;
      onUnauthorized?.();
      return;
    }
    scheduleRetry();
  };

  ws.onerror = () => {
    // onclose follows; nothing else to do
  };
}

function scheduleRetry() {
  if (!currentToken || retryTimer) return;
  // 1s, 2s, 4s … capped at 15s
  const delay = Math.min(15_000, 1000 * 2 ** Math.min(attempts, 4));
  attempts++;
  retryTimer = setTimeout(() => {
    retryTimer = null;
    open();
  }, delay);
}

/** Start (or restart with a new token). */
export function connectRealtime(token: string, handlers: { onUnauthorized?: () => void } = {}): void {
  onUnauthorized = handlers.onUnauthorized ?? null;
  if (currentToken === token && socket) return;
  disconnectRealtime();
  currentToken = token;
  attempts = 0;
  open();
}

export function disconnectRealtime(): void {
  clearRetry();
  currentToken = null;
  if (socket) {
    const s = socket;
    socket = null;
    s.onclose = null;
    s.close();
  }
  setConnection("offline");
}

/** Ask the server for a fresh full snapshot (e.g. pull-to-refresh). */
export function requestSnapshot(): void {
  if (socket?.readyState === WebSocket.OPEN) socket.send("refresh");
  else if (currentToken && !socket) open();
}

// reconnect immediately when the device comes back online / the app returns to the foreground
if (typeof window !== "undefined") {
  window.addEventListener("online", () => {
    if (currentToken && !socket) {
      clearRetry();
      attempts = 0;
      open();
    }
  });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && currentToken && !socket) {
      clearRetry();
      attempts = 0;
      open();
    }
  });
}
