import { useEffect, useRef, useState } from "react";
import { getSettings, type Settings } from "../api/settings";
import { requestSnapshot } from "../store/realtime";
import { patchCollection, useCollection, useConnection } from "../store";

const MAX_TIMEOUT = 2 ** 31 - 1;

export interface HelperAccess {
  /** church check-in helper, and the check-in window is open right now */
  church: boolean;
  /** bus roll-call helper, and the check-in window is open right now */
  bus: boolean;
  /** the vehicle (transportation option id) the admin linked this bus helper to; null when not a bus helper / window closed */
  busVehicle: string | null;
  /** programme organizer (no window): edits the schedule, sees the whole team */
  organizer: boolean;
  /** medical team (no window): every camper, bedroom and vehicle, read-only, the whole time */
  medical: boolean;
}

const NONE: HelperAccess = { church: false, bus: false, busVehicle: null, organizer: false, medical: false };

type Lists = Pick<Settings, "checkinWindow" | "checkinHelpers" | "busHelpers" | "organizers" | "medicalStaff">;

/**
 * Is the logged-in team member a check-in helper (church and/or bus) inside
 * the admin's check-in window, a programme organizer and/or on the medical
 * team? Reads the
 * settings (any role may), then re-evaluates on its own at the next window
 * edge and asks the server for a fresh snapshot there — so the roll-call tab
 * appears / disappears and the kids arrive / vanish without a reload. The
 * server enforces the same rules; this only drives the UI.
 *
 * When the window closes the extra data is also purged locally right away
 * (campers / bedrooms outside the person's own room), so nothing lingers in
 * localStorage on a phone that happens to be offline at that moment — the
 * server's next snapshot would do the same, but may be late.
 */
export function useCheckinHelper(token: string, phone: string, enabled: boolean): HelperAccess {
  const staff = useCollection("staff");
  const connection = useConnection();
  const [lists, setLists] = useState<Lists | null>(null);
  const [, tick] = useState(0);

  // (re)load the settings when we (re)connect — the admin may have changed them
  useEffect(() => {
    if (!enabled || connection !== "online") return;
    let alive = true;
    getSettings(token)
      .then((s) => alive && setLists(s))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [token, enabled, connection]);

  const me = staff?.find((s) => s.phone === phone) ?? null;
  const now = Date.now();
  const from = lists?.checkinWindow.from ? new Date(lists.checkinWindow.from).getTime() : null;
  const until = lists?.checkinWindow.until ? new Date(lists.checkinWindow.until).getTime() : null;
  const windowOpen = from !== null && until !== null && from <= now && now < until;
  const listed = (l: keyof Omit<Lists, "checkinWindow" | "busHelpers">) => !!me && !!lists && lists[l].staffIds.includes(me.id);
  const church = windowOpen && listed("checkinHelpers");
  const linkedVehicle = me && lists ? (lists.busHelpers.helpers.find((h) => h.staffId === me.id)?.vehicleId ?? null) : null;
  const busVehicle = windowOpen ? linkedVehicle : null;
  const bus = busVehicle !== null;
  const organizer = listed("organizers");
  const medical = listed("medicalStaff");
  const anyOpen = church || bus;
  const myBedroom = me?.bedroom ?? null;

  // wake up at the next window edge (only matters if the person is on some helper list)
  const onSomeList = listed("checkinHelpers") || linkedVehicle !== null;
  const edge = onSomeList ? ([from, until].filter((t): t is number => t !== null && t > now).sort((a, b) => a - b)[0] ?? null) : null;
  useEffect(() => {
    if (edge === null) return;
    const t = setTimeout(() => {
      tick((n) => n + 1);
      requestSnapshot();
    }, Math.min(edge - Date.now() + 700, MAX_TIMEOUT));
    return () => clearTimeout(t);
  }, [edge, church, bus]);

  // some window open → closed: drop everything beyond the person's own room, right now
  // (unless they are on the medical team — their access has no window)
  const wasOpen = useRef(false);
  useEffect(() => {
    if (wasOpen.current && !anyOpen && !medical) {
      patchCollection("campers", (list) => list.filter((k) => myBedroom !== null && k.bedroom === myBedroom));
      patchCollection("bedrooms", (list) => list.filter((b) => b.id === myBedroom));
    }
    wasOpen.current = anyOpen;
  }, [anyOpen, medical, myBedroom]);

  return enabled ? { church, bus, busVehicle, organizer, medical } : NONE;
}
