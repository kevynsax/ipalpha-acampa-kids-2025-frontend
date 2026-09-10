import { api } from "../api/client";
import type { LoggedUser } from "../roles";

const STORAGE_KEY = "acampa.auth";

export interface AuthState {
  token: string;
  tokenExpiresAt: string; // ISO
  user: LoggedUser;
}

/** Saves the session in the browser; it auto-clears after 24h (checked on load). */
export function saveAuth(state: AuthState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

/** Returns the stored session if it's still valid (not older than the expiry date). */
export function loadAuth(): AuthState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const state = JSON.parse(raw) as AuthState;
    if (!state.token || !state.tokenExpiresAt) return null;
    if (new Date(state.tokenExpiresAt) <= new Date()) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return state;
  } catch {
    return null;
  }
}

export function clearAuth(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function bearer(token: string): Record<string, string> {
  return { authorization: `Bearer ${token}` };
}

/** Validates the stored token against the backend (GET /api/auth/me). */
export async function validateAuth(token: string): Promise<LoggedUser | null> {
  try {
    const res = await api<{ user: LoggedUser }>("/api/auth/me", {
      headers: bearer(token),
    });
    return res.user;
  } catch {
    return null;
  }
}

export interface OtpRequestResult {
  success: boolean;
  phone: string;
  expiresAt: string;
  expireMinutes: number;
  delivery: "sms" | "mock";
}

export async function requestOtp(phoneE164: string): Promise<OtpRequestResult> {
  return api<OtpRequestResult>("/api/auth/otp/request", {
    method: "POST",
    body: JSON.stringify({ phone: phoneE164 }),
  });
}

export interface OtpVerifyResult {
  success: boolean;
  token: string;
  tokenExpiresAt: string;
  user: LoggedUser;
}

export async function verifyOtp(phoneE164: string, code: string): Promise<OtpVerifyResult> {
  return api<OtpVerifyResult>("/api/auth/otp/verify", {
    method: "POST",
    body: JSON.stringify({ phone: phoneE164, code }),
  });
}

export async function logout(token: string): Promise<void> {
  try {
    await api("/api/auth/logout", { method: "POST", headers: bearer(token) });
  } catch {
    // best effort — clear locally anyway
  }
  clearAuth();
}
