import { useEffect, useState } from "react";

/**
 * Detects whether the app is running as an installed PWA (standalone window)
 * and captures Chrome/Android's `beforeinstallprompt` so we can offer a
 * one-tap install. iOS has no prompt API — there we show instructions.
 */

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;
const promptListeners = new Set<() => void>();

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
    promptListeners.forEach((l) => l());
  });
  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    promptListeners.forEach((l) => l());
  });
}

export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const nav = navigator as Navigator & { standalone?: boolean };
  return window.matchMedia("(display-mode: standalone)").matches || window.matchMedia("(display-mode: fullscreen)").matches || nav.standalone === true;
}

export function isMobile(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  // iPadOS 13+ reports itself as a Mac — check for touch
  const iPadOS = /Macintosh/.test(ua) && navigator.maxTouchPoints > 1;
  return /Android|iPhone|iPad|iPod|Mobile/i.test(ua) || iPadOS;
}

export type Platform = "ios" | "android" | "other";
export function platform(): Platform {
  if (typeof navigator === "undefined") return "other";
  const ua = navigator.userAgent;
  const iPadOS = /Macintosh/.test(ua) && navigator.maxTouchPoints > 1;
  if (/iPhone|iPad|iPod/.test(ua) || iPadOS) return "ios";
  if (/Android/.test(ua)) return "android";
  return "other";
}

/** iOS only installs from Safari — Chrome/Firefox on iPhone can't add to the home screen with a working PWA. */
export function isIosNonSafari(): boolean {
  if (platform() !== "ios") return false;
  return /CriOS|FxiOS|EdgiOS|OPiOS|DuckDuckGo/.test(navigator.userAgent);
}

export function useInstallPrompt() {
  const [, bump] = useState(0);
  useEffect(() => {
    const l = () => bump((n) => n + 1);
    promptListeners.add(l);
    return () => {
      promptListeners.delete(l);
    };
  }, []);

  const canPrompt = !!deferredPrompt;
  async function prompt(): Promise<"accepted" | "dismissed" | "unavailable"> {
    if (!deferredPrompt) return "unavailable";
    const p = deferredPrompt;
    await p.prompt();
    const { outcome } = await p.userChoice;
    if (outcome === "accepted") deferredPrompt = null;
    promptListeners.forEach((l) => l());
    return outcome;
  }
  return { canPrompt, prompt };
}

/** Re-checks standalone when the display mode changes (e.g. opened from the home screen later). */
export function useStandalone(): boolean {
  const [standalone, setStandalone] = useState(isStandalone);
  useEffect(() => {
    const mq = window.matchMedia("(display-mode: standalone)");
    const on = () => setStandalone(isStandalone());
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return standalone;
}
