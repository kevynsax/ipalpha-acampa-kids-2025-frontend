import { useEffect, useRef } from "react";
import { patchCollection, useCollection } from "../store";

/**
 * A room CARETAKER only sees the OTHER kids of their room (the ones under a
 * colleague's care) WHILE THE CAMP IS HAPPENING — mirrors the server's
 * `campActive` gate (services/scope.ts#camperVisibility, services/camp.ts).
 * The server stops sending those kids in its next snapshot once the camp is
 * over, but a phone that is offline at that instant would keep them in
 * localStorage. This hook purges them the moment the camp ends, so a
 * caretaker is left with only the kids under their own care (`caretakerId`).
 *
 * A HELPER has no camp gate (they get the room's kids the whole time), so
 * nothing is purged for them.
 *
 * @param enabled  the logged-in user is a team member (staff / health_staff)
 * @param phone    the logged-in user's phone (to find their staff record)
 * @param during   the camp is happening right now (campPhase#useCampTiming)
 */
export function useCampWindow(enabled: boolean, phone: string, during: boolean): void {
  const staff = useCollection("staff");
  const me = staff?.find((s) => s.phone === phone) ?? null;
  const isCaretaker = me?.roomRole === "caretaker";
  const myId = me?.id ?? null;

  // camp in progress → over: a caretaker keeps only their own kids
  const wasDuring = useRef(false);
  useEffect(() => {
    if (!enabled) return;
    if (wasDuring.current && !during && isCaretaker && myId !== null) {
      patchCollection("campers", (list) => list.filter((k) => k.caretakerId === myId));
    }
    wasDuring.current = during;
  }, [enabled, during, isCaretaker, myId]);

  // outside the camp nothing about the other kids may sit in localStorage,
  // even from a stale snapshot loaded while offline
  useEffect(() => {
    if (!enabled || during || !isCaretaker || myId === null) return;
    patchCollection("campers", (list) => {
      const own = list.filter((k) => k.caretakerId === myId);
      return own.length === list.length ? list : own;
    });
  }, [enabled, during, isCaretaker, myId]);
}
