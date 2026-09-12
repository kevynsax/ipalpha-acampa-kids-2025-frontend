import { useEffect, useRef, useState } from "react";
import { requestSnapshot } from "../store/realtime";
import { patchCollection, useCollection } from "../store";

const MAX_TIMEOUT = 2 ** 31 - 1;

export interface ParentAccess {
  /** the parents' window (check-in start → end of the last event) is open right now: contacts are shown */
  open: boolean;
  /** the kids' CHECK-IN window is open right now: the QR dialog pops up */
  checkin: boolean;
  /** ISO of the parents' window start (null = no programme yet) */
  opensAt: string | null;
  closesAt: string | null;
}

const NONE: ParentAccess = { open: false, checkin: false, opensAt: null, closesAt: null };

/**
 * Is the PARENT inside the window in which they may see the team's contacts
 * (important contacts, caretaker, room staff)? Mirrors the server
 * (`services/camp.ts#parentWindow`): from the kids' check-in start to the
 * end of the last event. Re-evaluates itself at the next edge and asks the
 * server for a fresh snapshot there. When the window CLOSES the staff
 * records are purged from localStorage at once — the server would stop
 * sending them anyway, but the phone may be offline at that moment and
 * nothing may linger.
 */
export function useParentWindow(enabled: boolean): ParentAccess {
  const settings = useCollection("settings");
  const [, tick] = useState(0);
  const now = Date.now();
  const at = (iso: string | null | undefined) => (iso ? new Date(iso).getTime() : null);
  const from = at(settings?.parentWindow?.from);
  const until = at(settings?.parentWindow?.until);
  const open = from !== null && until !== null && from <= now && now < until;
  const cFrom = at(settings?.checkinWindow.from);
  const cUntil = at(settings?.checkinWindow.until);
  const checkin = !!settings?.checkinTestMode || (cFrom !== null && cUntil !== null && cFrom <= now && now < cUntil);

  // wake up at the next edge (parents' or check-in window)
  const edge = [from, until, cFrom, cUntil].filter((t): t is number => t !== null && t > now).sort((a, b) => a - b)[0] ?? null;
  useEffect(() => {
    if (!enabled || edge === null) return;
    const t = setTimeout(() => {
      tick((n) => n + 1);
      requestSnapshot();
    }, Math.min(edge - Date.now() + 700, MAX_TIMEOUT));
    return () => clearTimeout(t);
  }, [enabled, edge, open, checkin]);

  // open → closed: the contacts must not stay on the phone
  const wasOpen = useRef(false);
  useEffect(() => {
    if (!enabled) return;
    if (wasOpen.current && !open) patchCollection("staff", () => []);
    wasOpen.current = open;
  }, [enabled, open]);

  // outside the window nothing about the team may sit in localStorage, even from a stale snapshot
  useEffect(() => {
    if (enabled && settings && !open) patchCollection("staff", (list) => (list.length ? [] : list));
  }, [enabled, settings, open]);

  return enabled ? { open, checkin, opensAt: settings?.parentWindow?.from ?? null, closesAt: settings?.parentWindow?.until ?? null } : NONE;
}
