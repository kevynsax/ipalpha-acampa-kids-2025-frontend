import { api } from "../api/client";
import type { LoggedUser } from "../roles";

const STORAGE_KEY = "acampa.auth";

export interface AuthState {
  token: string;
  tokenExpiresAt: string; // ISO
  user: LoggedUser;
}

/** Saves the session in the browser; it auto-clears after the token expiry (checked on load). */
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

const OTP_STORAGE_KEY = "acampa.otp";

export interface PendingOtp {
  phoneE164: string;
  expiresAt: string; // ISO — when the SMS code stops being valid
  delivery: "sms" | "mock" | "redirect";
}

/** Remembers the SMS that was sent so leaving the browser and coming back keeps the real expiry. */
export function savePendingOtp(state: PendingOtp): void {
  localStorage.setItem(OTP_STORAGE_KEY, JSON.stringify(state));
}

/** Returns the pending SMS code context if it hasn't expired yet. */
export function loadPendingOtp(): PendingOtp | null {
  try {
    const raw = localStorage.getItem(OTP_STORAGE_KEY);
    if (!raw) return null;

    const state = JSON.parse(raw) as PendingOtp;
    if (!state.phoneE164 || !state.expiresAt) return null;
    if (new Date(state.expiresAt) <= new Date()) {
      localStorage.removeItem(OTP_STORAGE_KEY);
      return null;
    }
    return state;
  } catch {
    return null;
  }
}

export function clearPendingOtp(): void {
  localStorage.removeItem(OTP_STORAGE_KEY);
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
  delivery: "sms" | "mock" | "redirect";
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

/**
 * Switches the session to another profile the SAME person holds (parent ⇄
 * team): the server revokes this session and issues a new token. No SMS.
 */
export async function switchRole(token: string, role: LoggedUser["activeRole"]): Promise<OtpVerifyResult> {
  return api<OtpVerifyResult>("/api/auth/role", {
    method: "POST",
    headers: bearer(token),
    body: JSON.stringify({ role }),
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
