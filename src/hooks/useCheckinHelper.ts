import { useEffect, useRef, useState } from "react";
import type { Settings } from "../api/settings";
import { requestSnapshot } from "../store/realtime";
import { patchCollection, useCollection } from "../store";

const MAX_TIMEOUT = 2 ** 31 - 1;

export interface HelperAccess {
  /** church check-in helper, and the check-in window is open right now */
  church: boolean;
  /** bus roll-call helper, and the check-in window is open right now */
  bus: boolean;
  /** the vehicle (transportation option id) the admin linked this bus helper to; null when not a bus helper / both windows closed */
  busVehicle: string | null;
  /** which trip windows are open for this helper */
  busOutbound: boolean;
  busReturn: boolean;
  /** ORGANIZER (no window): the admin's tabs and settings (minus organizers / categories / notifications / about), on top of their own team tabs */
  organizer: boolean;
  /** game organizer (no window): edits the programme, sees the whole team and writes the scoreboard (Placar) */
  gameOrganizer: boolean;
  /** score helper (no window): bulk QR scan by event only; no per-team points, no zero, deletes only own scans */
  scoreHelper: boolean;
  /** medical team (no window): every camper, bedroom and vehicle, read-only, the whole time */
  medical: boolean;
  /** vest (colete) helper — until VEST_GRACE_DAYS after the camp: hands out / takes back the team vests; sees everyone as name + phone */
  vest: boolean;
  /** photographer (no window): uploads, edits and publishes the camp's photos */
  photographer: boolean;
}

const NONE: HelperAccess = { church: false, bus: false, busVehicle: null, busOutbound: false, busReturn: false, organizer: false, gameOrganizer: false, scoreHelper: false, medical: false, vest: false, photographer: false };

type Lists = Pick<Settings, "checkinWindow" | "busReturnWindow" | "checkinHelpers" | "busHelpers" | "organizers" | "gameOrganizers" | "scoreHelpers" | "medicalStaff" | "vestHelpers" | "photographers"> & Partial<Pick<Settings, "checkinTestMode">>;

/**
 * Is the logged-in team member a check-in helper (church and/or bus) inside
 * the admin's check-in window, an organizer, a game organizer and/or on the
 * medical team? Reads the
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
/** the vest helpers keep their tab this long after the camp ends (mirrors the server's VEST_GRACE_DAYS) */
export const VEST_GRACE_DAYS = 7;

export function useCheckinHelper(phone: string, enabled: boolean, campEndsAt: number | null = null): HelperAccess {
  const staff = useCollection("staff");
  const lists = useCollection("settings") as Lists | null;
  const [, tick] = useState(0);

  const me = staff?.find((s) => s.phone === phone) ?? null;
  const now = Date.now();
  const from = lists?.checkinWindow.from ? new Date(lists.checkinWindow.from).getTime() : null;
  const until = lists?.checkinWindow.until ? new Date(lists.checkinWindow.until).getTime() : null;
  const returnFrom = lists?.busReturnWindow?.from ? new Date(lists.busReturnWindow.from).getTime() : null;
  const returnUntil = lists?.busReturnWindow?.until ? new Date(lists.busReturnWindow.until).getTime() : null;
  const departureOpen = !!lists?.checkinTestMode || (from !== null && until !== null && from <= now && now < until);
  const returnOpen = !!lists?.checkinTestMode || (returnFrom !== null && returnUntil !== null && returnFrom <= now && now < returnUntil);
  const listed = (l: "checkinHelpers" | "organizers" | "gameOrganizers" | "scoreHelpers" | "medicalStaff" | "vestHelpers" | "photographers") => !!me && !!lists && !!lists[l] && lists[l].staffIds.includes(me.id);
  const church = departureOpen && listed("checkinHelpers");
  const linkedVehicle = me && lists ? (lists.busHelpers.helpers.find((h) => h.staffId === me.id)?.vehicleId ?? null) : null;
  const busOutbound = departureOpen && linkedVehicle !== null;
  const busReturn = returnOpen && linkedVehicle !== null;
  const busVehicle = busOutbound || busReturn ? linkedVehicle : null;
  const bus = busVehicle !== null;
  const gameOrganizer = listed("gameOrganizers");
  const scoreHelper = listed("scoreHelpers");
  const organizer = listed("organizers");
  const medical = listed("medicalStaff");
  const vestOpen = campEndsAt === null || now < campEndsAt + VEST_GRACE_DAYS * 24 * 60 * 60 * 1000;
  const vest = listed("vestHelpers") && vestOpen;
  const photographer = listed("photographers");
  const anyOpen = church || bus;
  const myBedroom = me?.bedroom ?? null;

  // wake up at the next window edge (only matters if the person is on some helper list)
  const onSomeList = listed("checkinHelpers") || linkedVehicle !== null;
  const edge = onSomeList ? ([from, until, returnFrom, returnUntil].filter((t): t is number => t !== null && t > now).sort((a, b) => a - b)[0] ?? null) : null;
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
    if (wasOpen.current && !anyOpen && !medical && !scoreHelper && !organizer) {
      patchCollection("campers", (list) => list.filter((k) => myBedroom !== null && k.bedroom === myBedroom));
      patchCollection("bedrooms", (list) => list.filter((b) => b.id === myBedroom));
    }
    wasOpen.current = anyOpen;
  }, [anyOpen, medical, scoreHelper, organizer, myBedroom]);

  return enabled ? { church, bus, busVehicle, busOutbound, busReturn, organizer, gameOrganizer, scoreHelper, medical, vest, photographer } : NONE;
}
