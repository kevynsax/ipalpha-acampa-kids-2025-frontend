import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Breadcrumbs from "../../components/Breadcrumbs";
import ChipTip from "../../components/ChipTip";
import Dialog from "../../components/Dialog";
import RoomRoleIcon from "../../components/RoomRoleIcon";
import { ageOf, type Camper, type CamperSex } from "../../api/campers";
import { staffSex, type Staff } from "../../api/staff";
import { applyRooms, BEDROOM_GROUPS, GROUP_META, previewRooms, type Bedroom, type BedroomGroup, type RoomsAppliedMessage } from "../../api/bedrooms";
import { applyCamperDraft, applyStaffDraft, clearRoomsDraft, draftHasChanges, emptyRoomsDraft, loadRoomsDraft, roomsDelta, saveRoomsDraft, type RoomsDraft } from "../../roomDraft";
import { buildUnits, matchAllPreferences, normName, type PrefMatch } from "../../roomGroups";
import { useCollection, useCollectionOrEmpty } from "../../store";
import { ICONS } from "../../icons";

interface RoomAssignPageProps {
  token: string;
  onBack: () => void;
}

/** which wing the board is focused on ("staff" = the team's own rooms) */
type WingFilter = "all" | CamperSex | "staff";

/** What a carried drag holds: one kid, a stuck-together group, or a staff member. */
interface DragUnit {
  kind: "kids" | "staff";
  ids: string[];
  /** room the unit currently sits in (null = the left "sem quarto" pool) */
  from: string | null;
}

const firstName = (name: string) => name.split(" ")[0];

/** how long the mouse must rest on a chip before its tooltip opens (taps are instant) */
const TIP_DELAY = 450;

/**
 * Room colours.
 *  • a líder alone in the room wears their own colour: pink (a woman / girls'
 *    wing) or green (a man / boys' wing), and their kids stay white;
 *  • a second líder in the same room takes the next colour, and from then on
 *    every kid wears the colour of whoever looks after them;
 *  • auxiliares are always violet.
 */
const CARETAKER_COLORS = ["green", "blue", "pink", "violet"] as const;
type CaretakerColor = (typeof CARETAKER_COLORS)[number];
const HELPER_COLOR: CaretakerColor = "violet";
/** the colours a room hands out, in order, starting from the wing's own one */
const COLORS_BY_WING: Record<BedroomGroup, readonly CaretakerColor[]> = {
  girls: ["pink", "blue", "violet", "green"],
  boys: ["green", "blue", "pink", "violet"],
  staff: ["green", "blue", "pink", "violet"],
};

/**
 * Admin: "Montar quartos" — a full page that suggests likely room groups from
 * the kids' bedroom preferences (names matched against the roster), then lets
 * the admin drag kids / groups / staff between rooms.
 *
 * Everything happens on a LOCAL DRAFT (memory + this device's localStorage —
 * see roomDraft.ts): leaving the page keeps the draft for later, "Descartar
 * alterações" throws it away, and only Concluir sends the whole delta to
 * POST /api/bedrooms/apply, which applies every room / role / líder change
 * at once and texts each person concerned with one SMS.
 */
export default function RoomAssignPage({ token, onBack }: RoomAssignPageProps) {
  const storedBedrooms = useCollection("bedrooms");
  const storedCampers = useCollectionOrEmpty("campers");
  const storedStaff = useCollectionOrEmpty("staff");
  const settings = useCollection("settings");

  const [wing, setWing] = useState<WingFilter>("all");
  /** filter the "sem quarto" pool by name (kids and staff) */
  const [search, setSearch] = useState("");
  /** cluster ids the admin dissolved ("desgrudar") — split into single kids */
  const [ungrouped, setUngrouped] = useState<Set<string>>(new Set());
  /** kids dragged out of their group on their own — they stop travelling with it */
  const [detached, setDetached] = useState<Set<string>>(new Set());
  /** kids the admin glued together by dropping one on another (this session only) */
  const [glued, setGlued] = useState<Map<string, string>>(new Map());
  /** kid id whose preference tooltip is open (hover on desktop, tap on mobile) */
  const [tip, setTip] = useState<string | null>(null);
  /** the kid the admin last tapped (their líder's whole crew lights up) */
  const [selected, setSelected] = useState<string | null>(null);
  /** a líder tapped in a shared room: every kid of that room lights up */
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  /** the líder tapped in the corner (their own kids get the strong colour) */
  const [selectedLead, setSelectedLead] = useState<string | null>(null);

  const [dragUnit, setDragUnit] = useState<DragUnit | null>(null);
  const [ghost, setGhost] = useState<{ x: number; y: number } | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  /** the Concluir summary dialog: what changes + who gets an SMS */
  const [confirmOpen, setConfirmOpen] = useState(false);
  /** the pending-adjustments dialog (banner tap, or Concluir with kids unplaced / without a líder) */
  const [pendOpen, setPendOpen] = useState(false);
  /** the SMS preview (who would be texted + the exact message), loaded when the dialog opens */
  const [preview, setPreview] = useState<{ messages: RoomsAppliedMessage[]; smsEnabled: boolean } | null>(null);
  /** whether the example messages are expanded in the dialog */
  const [showMessages, setShowMessages] = useState(false);
  /** the per-apply avisos toggle: on = send SMS (default), off = apply silently */
  const [notifyOn, setNotifyOn] = useState(true);
  /** Concluir is sending the delta to the server */
  const [submitting, setSubmitting] = useState(false);
  /** the local draft — every change stays on this device until Concluir */
  const [draft, setDraft] = useState<RoomsDraft>(() => loadRoomsDraft());

  const chipEls = useRef(new Map<string, HTMLElement>());
  const suppressClick = useRef(false);
  const pointerType = useRef("mouse");
  /** hover only opens the tooltip after a beat, so sweeping the mouse over the board stays quiet */
  const tipTimer = useRef<number | null>(null);

  function cancelTipTimer() {
    if (tipTimer.current !== null) {
      window.clearTimeout(tipTimer.current);
      tipTimer.current = null;
    }
  }

  /** mouse rested on a chip: open the tooltip only after TIP_DELAY */
  function hoverTip(kidId: string) {
    cancelTipTimer();
    if (!hasPreference(kidId)) return;
    tipTimer.current = window.setTimeout(() => {
      tipTimer.current = null;
      setTip(kidId);
    }, TIP_DELAY);
  }

  function leaveTip(kidId: string) {
    cancelTipTimer();
    setTip((t) => (t === kidId ? null : t));
  }

  // a pending hover must never fire after the board is gone
  useEffect(() => cancelTipTimer, []);

  // a tap anywhere that is not a kid chip drops the selection
  useEffect(() => {
    if (!selected && !selectedRoom) return;
    const onDown = (e: PointerEvent) => {
      const el = e.target as HTMLElement | null;
      if (el?.closest("[data-assign-kid]") || el?.closest("[data-assign-lead]")) return;
      setSelected(null);
      setSelectedRoom(null);
      setSelectedLead(null);
    };
    document.addEventListener("pointerdown", onDown, true);
    return () => document.removeEventListener("pointerdown", onDown, true);
  }, [selected, selectedRoom]);

  const bedrooms = useMemo(() => (storedBedrooms ? sortRooms(storedBedrooms) : null), [storedBedrooms]);
  /** the roster as the DRAFT leaves it — the board only ever shows this */
  const campers = useMemo(() => storedCampers.map((k) => applyCamperDraft(k, draft)), [storedCampers, draft]);
  const staff = useMemo(() => storedStaff.map((s) => applyStaffDraft(s, draft)), [storedStaff, draft]);
  const kids = useMemo(() => campers.slice().sort((a, b) => a.name.localeCompare(b.name, "pt-BR")), [campers]);
  /** who sleeps in each room as the draft leaves it (the store's counts are the server's) */
  const occupied = useMemo(() => {
    const m = new Map<string, number>();
    for (const k of campers) if (k.bedroom) m.set(k.bedroom, (m.get(k.bedroom) ?? 0) + 1);
    for (const s of staff) if (s.bedroom) m.set(s.bedroom, (m.get(s.bedroom) ?? 0) + 1);
    return m;
  }, [campers, staff]);
  const prefs = useMemo(() => matchAllPreferences(kids), [kids]);
  const units = useMemo(() => {
    const all = buildUnits(kids, prefs);
    const single = (k: Camper) => ({ id: k.id, members: [k] });
    // dissolved clusters → one unit per kid; kids dragged out on their own leave their cluster
    const base = all.flatMap((u) => {
      if (ungrouped.has(u.id)) return u.members.map(single);
      const stay = u.members.filter((k) => !detached.has(k.id));
      const left = u.members.filter((k) => detached.has(k.id)).map(single);
      if (!stay.length) return left;
      return [{ id: stay.reduce((min, k) => (k.id < min ? k.id : min), stay[0].id), members: stay }, ...left];
    });
    if (!glued.size) return base;
    // …then the glue the admin made by hand this session (drop a kid onto another)
    const keyOf = new Map<string, string>();
    for (const u of base) for (const m of u.members) keyOf.set(m.id, u.id);
    for (const [kidId, target] of glued) {
      const from = keyOf.get(kidId);
      const to = keyOf.get(target);
      if (!from || !to || from === to) continue;
      for (const [id, key] of keyOf) if (key === from) keyOf.set(id, to);
    }
    const merged = new Map<string, Camper[]>();
    for (const u of base) {
      for (const m of u.members) {
        const key = keyOf.get(m.id) ?? u.id;
        if (!merged.has(key)) merged.set(key, []);
        merged.get(key)!.push(m);
      }
    }
    return [...merged.values()].map((members) => ({
      id: members.reduce((min, k) => (k.id < min ? k.id : min), members[0].id),
      members: members.slice().sort((a, b) => a.name.localeCompare(b.name, "pt-BR")),
    }));
  }, [kids, prefs, ungrouped, detached, glued]);

  const poolKids = kids.filter((k) => !k.bedroom);
  const poolStaff = staff.filter((s) => !s.bedroom && s.active);
  /** the name-search box, normalised for accent-free matching */
  const nq = normName(search.trim());

  // kids placed in a room but with nobody responsible for them + kids still unplaced
  const noCaretaker = kids.filter((k) => k.bedroom && !k.caretakerId);
  const noRoom = kids.filter((k) => !k.bedroom);

  // anything discard would throw away: draft moves + session-only grouping gestures
  const hasChanges = draftHasChanges(draft) || ungrouped.size > 0 || detached.size > 0 || glued.size > 0;

  /**
   * The Concluir summary as PLAIN COUNTS: "5 crianças ganharam quarto, 10
   * trocaram de quarto, 2 da equipe…". Just what the delta does, grouped by
   * kind — the who-gets-SMS part comes from the server preview (see `preview`).
   */
  const summary = useMemo(() => {
    const beforeStaff = new Map(storedStaff.map((s) => [s.id, s]));
    const beforeCampers = new Map(storedCampers.map((k) => [k.id, k]));
    const delta = roomsDelta(draft, storedCampers, storedStaff);

    let kidsGotRoom = 0, kidsSwappedRoom = 0, kidsLeftRoom = 0, kidsLeadOnly = 0;
    for (const m of delta.campers) {
      const was = beforeCampers.get(m.id)!;
      if (was.bedroom !== m.bedroom) {
        if (!was.bedroom && m.bedroom) kidsGotRoom++;
        else if (was.bedroom && !m.bedroom) kidsLeftRoom++;
        else kidsSwappedRoom++;
      } else if (was.caretakerId !== m.caretakerId) kidsLeadOnly++;
    }
    let staffGotRoom = 0, staffSwappedRoom = 0, staffLeftRoom = 0, staffRoleOnly = 0;
    for (const m of delta.staff) {
      const was = beforeStaff.get(m.id)!;
      if (was.bedroom !== m.bedroom) {
        if (!was.bedroom && m.bedroom) staffGotRoom++;
        else if (was.bedroom && !m.bedroom) staffLeftRoom++;
        else staffSwappedRoom++;
      } else if (was.roomRole !== m.roomRole) staffRoleOnly++;
    }

    const kid = (num: number) => `${num} criança${num === 1 ? "" : "s"}`;
    const team = (num: number) => `${num} da equipe`;
    const lines: string[] = [];
    if (kidsGotRoom) lines.push(`${kid(kidsGotRoom)} ganh${kidsGotRoom === 1 ? "ou" : "aram"} quarto`);
    if (kidsSwappedRoom) lines.push(`${kid(kidsSwappedRoom)} trocaram de quarto`);
    if (kidsLeftRoom) lines.push(`${kid(kidsLeftRoom)} saíram do quarto`);
    if (kidsLeadOnly) lines.push(`${kid(kidsLeadOnly)} mudaram de líder`);
    if (staffGotRoom) lines.push(`${team(staffGotRoom)} ganh${staffGotRoom === 1 ? "ou" : "aram"} quarto`);
    if (staffSwappedRoom) lines.push(`${team(staffSwappedRoom)} trocaram de quarto`);
    if (staffLeftRoom) lines.push(`${team(staffLeftRoom)} saíram do quarto`);
    if (staffRoleOnly) lines.push(`${team(staffRoleOnly)} mudaram de função`);

    return { lines, total: delta.staff.length + delta.campers.length };
  }, [draft, storedCampers, storedStaff]);

  /** the scissors: break the group apart — every member goes back to being on their own */
  function ungroup(unitId: string, members: Camper[]) {
    setUngrouped((prev) => new Set(prev).add(unitId));
    setDetached((prev) => {
      const next = new Set(prev);
      for (const k of members) next.add(k.id);
      return next;
    });
    // hand-made glue must go too, otherwise the members would merge again on the next render
    setGlued((prev) => {
      if (!prev.size) return prev;
      const ids = new Set(members.map((k) => k.id));
      const next = new Map(prev);
      for (const [kidId, target] of prev) if (ids.has(kidId) || ids.has(target)) next.delete(kidId);
      return next;
    });
  }

  /** a kid dragged on their own leaves the group — the rest stay stuck together */
  function detach(kidId: string) {
    setDetached((prev) => (prev.has(kidId) ? prev : new Set(prev).add(kidId)));
  }

  /** change the draft — memory + this device's localStorage; nothing leaves until Concluir */
  function mutateDraft(fn: (d: RoomsDraft) => void) {
    setDraft((prev) => {
      const next: RoomsDraft = { campers: { ...prev.campers }, staff: { ...prev.staff }, savedAt: prev.savedAt };
      fn(next);
      saveRoomsDraft(next);
      return next;
    });
  }

  // ── who looks after whom: tap a kid to light up their líder and the rest of that líder's kids ──

  /** the kid the admin last tapped (their líder's whole crew lights up) */
  const selectedKid = selected ? campers.find((k) => k.id === selected) ?? null : null;
  /** líder of the selected kid — the one whose colour is "active" on the board */
  const selectedCaretakerId = selectedKid?.caretakerId ?? selectedLead;

  /**
   * Tap on a kid:
   *  • nothing selected (or a kid of another room / another líder) → select them,
   *    lighting up their líder and that líder's other kids;
   *  • a kid that already belongs to the selected líder → hand them to the room's
   *    OTHER líder (swap), so two taps move a kid between the two crews.
   * Rooms with a single líder do none of this. Draft only — nothing is sent.
   */
  function tapKid(k: Camper) {
    const roomCaretakers = k.bedroom ? caretakersOf(k.bedroom) : [];
    if (roomCaretakers.length < 2) return; // one líder in the room: nothing to choose

    const sameCrew = !!selectedCaretakerId && k.caretakerId === selectedCaretakerId && (selectedKid?.bedroom === k.bedroom || selectedRoom === k.bedroom);
    if (!sameCrew) {
      setTip(null);
      setSelectedRoom(null);
      setSelectedLead(null);
      setSelected(k.id);
      return;
    }

    // swap: give the kid to the next líder of the same room
    const i = roomCaretakers.findIndex((s) => s.id === k.caretakerId);
    const nextCaretaker = roomCaretakers[(i + 1) % roomCaretakers.length];
    setError(null);
    mutateDraft((d) => {
      d.campers[k.id] = { bedroom: k.bedroom, caretakerId: nextCaretaker.id };
    });
  }

  /**
   * Tap on a líder chip. In a room with two or more líderes this lights up every
   * kid of the room (theirs in the strong colour, the others in their own), so
   * the admin sees the whole split at once. Alone in the room there is nothing
   * to compare, so nothing happens.
   */
  function tapCaretaker(s: Staff, roomCaretakers: number) {
    if (!wasTap()) return;
    if (roomCaretakers < 2) return;
    setTip(null);
    setSelected(null);
    setSelectedRoom((cur) => (cur === s.bedroom ? null : s.bedroom));
    setSelectedLead((cur) => (cur === s.id && selectedRoom === s.bedroom ? null : s.id));
  }

  /** the líderes of a room, in a stable order (their colour index) */
  function caretakersOf(roomId: string): Staff[] {
    return staff.filter((s) => s.bedroom === roomId && s.roomRole === "caretaker");
  }

  // ── drag & drop (pointer events: mouse AND touch) ──

  function canDrop(unit: DragUnit, target: string): boolean {
    // grouping gestures on the left column (session only, nothing is saved)
    if (target.startsWith("kid:")) return unit.kind === "kids" && unit.ids.length === 1 && unit.from === null && target.slice(4) !== unit.ids[0];
    if (target.startsWith("unit:")) return unit.kind === "kids" && unit.from === null;
    if (target === "pool") return true; // from a room: unassign · from a group: detach
    // the líderes' corner of a room: only team members land there (and become líderes)
    const lead = target.startsWith("lead:");
    const roomId = target.slice(lead ? "lead:".length : "room:".length);
    // a kid dropped on the líderes' corner simply joins the room (they never become a líder)
    const room = bedrooms?.find((b) => b.id === roomId);
    if (!room) return false;
    // no capacity rule here on purpose: a room's beds are a comfortable size,
    // not a hard limit — the admin decides who sleeps where
    if (unit.kind === "kids") {
      if (room.group === "staff") return false;
      return unit.ids.every((id) => {
        const k = campers.find((c) => c.id === id);
        return !k?.sex || k.sex === (room.group === "girls" ? "F" : "M");
      });
    }
    return true;
  }

  async function drop(unit: DragUnit, target: string) {
    if (!canDrop(unit, target)) return;

    // ── left column: glue two kids together / pull one out of its group ──
    if (target.startsWith("kid:") || target.startsWith("unit:")) {
      const onto = target.startsWith("kid:") ? target.slice(4) : null;
      const key = onto ?? target.slice(5);
      for (const id of unit.ids) {
        if (id === onto) continue;
        setDetached((prev) => {
          if (!prev.has(id)) return prev;
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        setGlued((prev) => new Map(prev).set(id, key));
      }
      return;
    }
    if (target === "pool" && unit.from === null) {
      // dropped on the pool background: leave whatever group it was in
      for (const id of unit.ids) {
        setGlued((prev) => {
          if (!prev.has(id)) return prev;
          const next = new Map(prev);
          next.delete(id);
          return next;
        });
        detach(id);
      }
      return;
    }
    // "lead:<room>" = dropped on the líderes' corner → same room, but as a líder (staff only)
    const promote = target.startsWith("lead:") && unit.kind === "staff";
    const roomId = target === "pool" ? null : target.slice(target.startsWith("lead:") ? "lead:".length : "room:".length);
    const movingKids = unit.kind === "kids" ? unit.ids.map((id) => campers.find((k) => k.id === id)).filter((k): k is Camper => !!k && k.bedroom !== roomId) : [];
    // dragging a líder out of the corner into the room body hands their kids over and
    // leaves them as an auxiliar; onto another room it is a plain move
    // a team member dropped in the room body lands as an auxiliar; onto the corner, as a líder
    const movingStaff =
      unit.kind === "staff"
        ? unit.ids
            .map((id) => staff.find((s) => s.id === id))
            .filter((s): s is Staff => !!s && (s.bedroom !== roomId || (promote ? s.roomRole !== "caretaker" : s.roomRole === "caretaker")))
        : [];
    if (!movingKids.length && !movingStaff.length) return;

    setError(null);
    // a kid moved on their own has left their preference group behind
    if (unit.kind === "kids" && movingKids.length === 1) detach(movingKids[0].id);

    mutateDraft((d) => {
      for (const k of movingKids) {
        d.campers[k.id] = { bedroom: roomId, caretakerId: roomId ? pickCaretaker(roomId, k.caretakerId) : null };
      }
      for (const s of movingStaff) {
        // the room body lands them as an auxiliar; the corner, as a líder; the bench
        // (pool) puts them back to the role they came in with on the server, so a
        // helper-turned-líder (or a líder made auxiliar) reverts on the way out
        const original = storedStaff.find((x) => x.id === s.id)?.roomRole ?? s.roomRole;
        const role = promote ? "caretaker" : roomId ? "helper" : original;
        // their kids stay in the room they sleep in: a líder who leaves (or stops being one) leaves the kids behind
        if (s.roomRole === "caretaker" && (roomId !== s.bedroom || role !== "caretaker")) {
          for (const k of campers.filter((k) => k.caretakerId === s.id)) d.campers[k.id] = { bedroom: k.bedroom, caretakerId: null };
        }
        d.staff[s.id] = { bedroom: roomId, roomRole: role };
        // first líder of the room: every kid there without a líder becomes theirs
        if (
          promote &&
          roomId &&
          !staff.some((x) => x.id !== s.id && x.bedroom === roomId && x.roomRole === "caretaker")
        ) {
          for (const k of campers.filter((k) => k.bedroom === roomId && !k.caretakerId)) d.campers[k.id] = { bedroom: roomId, caretakerId: s.id };
        }
      }
    });
  }

  /** the caretaker a kid lands on: the one they already have (if still there), the room's single one, or none */
  function pickCaretaker(roomId: string, currentId: string | null): string | null {
    const caretakers = staff.filter((s) => s.bedroom === roomId && s.roomRole === "caretaker");
    if (currentId && caretakers.some((s) => s.id === currentId)) return currentId;
    if (caretakers.length === 1) return caretakers[0].id;
    return null;
  }

  function beginDrag(e: React.PointerEvent, unit: DragUnit) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    pointerType.current = e.pointerType;
    suppressClick.current = false; // fresh gesture: only a real drag suppresses the tap
    const startX = e.clientX;
    const startY = e.clientY;
    let active = false;

    const end = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", end);
      setDragUnit(null);
      setGhost(null);
      setHover(null);
      if (active) suppressClick.current = true; // a drag is not a tap → keep the tooltip closed
    };
    const move = (ev: PointerEvent) => {
      if (ev.pointerId !== e.pointerId) return;
      if (!active) {
        if (Math.hypot(ev.clientX - startX, ev.clientY - startY) < 8) return;
        active = true;
        setDragUnit(unit);
        cancelTipTimer();
        setTip(null); // the drag takes over from the tooltip
      }
      setGhost({ x: ev.clientX, y: ev.clientY });
      const el = document.elementFromPoint(ev.clientX, ev.clientY)?.closest("[data-assign-drop]");
      const t = el?.getAttribute("data-assign-drop") ?? null;
      setHover((prev) => (prev === t ? prev : t));
    };
    const up = (ev: PointerEvent) => {
      if (ev.pointerId !== e.pointerId) return;
      const target = active
        ? document.elementFromPoint(ev.clientX, ev.clientY)?.closest("[data-assign-drop]")?.getAttribute("data-assign-drop") ?? null
        : null;
      end();
      if (target) void drop(unit, target);
    };
    window.addEventListener("pointermove", move, { passive: false });
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", end);
  }

  // the tooltip opens on hover (desktop) or on a tap that didn't become a drag —
  // only for kids who actually asked to share the room with someone
  /**
   * True when the kid asked for someone nobody matched AND they ended up in no
   * group at all — a kid who is grouped already found their people, so there is
   * nothing left for the admin to chase.
   */
  function hasMissingPref(kidId: string): boolean {
    const unit = units.find((u) => u.members.some((m) => m.id === kidId));
    if (unit && unit.members.length > 1) return false;
    return (prefs.get(kidId) ?? []).some((p) => !p.camperId);
  }

  function hasPreference(kidId: string): boolean {
    return (prefs.get(kidId) ?? []).length > 0;
  }

  /** false when this click is just the end of a drag gesture */
  function wasTap(): boolean {
    if (suppressClick.current) {
      suppressClick.current = false;
      return false;
    }
    return true;
  }

  function chipClick(kidId: string) {
    if (!wasTap()) return;
    tapTip(kidId);
  }

  /** the tooltip half of a tap (mouse users already got it on hover) */
  function tapTip(kidId: string) {
    if (pointerType.current === "mouse") return;
    if (!hasPreference(kidId)) return;
    setTip((t) => (t === kidId ? null : kidId));
  }

  /** "Descartar alterações": wipe the draft (and every session gesture), staying on the board */
  function discard() {
    clearRoomsDraft();
    setDraft(emptyRoomsDraft());
    setUngrouped(new Set());
    setDetached(new Set());
    setGlued(new Map());
    setSelected(null);
    setSelectedRoom(null);
    setSelectedLead(null);
    setTip(null);
    setError(null);
  }

  /**
   * Concluir: open the summary dialog (what changes, pending items, who gets an
   * SMS). Pending kids don't block — the dialog warns and lets the admin apply
   * anyway. The real send happens from the dialog (applyNow). Loads the SMS
   * preview from the server so the recipient list / example texts are exact.
   */
  function concluir() {
    const delta = roomsDelta(draft, storedCampers, storedStaff);
    if (!delta.staff.length && !delta.campers.length) {
      clearRoomsDraft();
      onBack();
      return;
    }
    setError(null);
    setPreview(null);
    setShowMessages(false);
    setNotifyOn(true);
    setConfirmOpen(true);
    previewRooms(token, delta)
      .then((p) => {
        setPreview(p);
        setNotifyOn(p.messages.length > 0); // nobody to tell → the button is just "Salvar"
      })
      .catch(() => setPreview({ messages: [], smsEnabled: false }));
  }

  /** apply the whole delta in one shot (rooms, roles, líderes) and leave */
  async function applyNow() {
    const delta = roomsDelta(draft, storedCampers, storedStaff);
    if (!delta.staff.length && !delta.campers.length) {
      clearRoomsDraft();
      onBack();
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await applyRooms(token, delta, notifyOn && (preview?.messages.length ?? 0) > 0);
      clearRoomsDraft();
      onBack();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Algo deu errado.");
      setSubmitting(false);
    }
  }

  if (!bedrooms) {
    return (
      <div className="admin-page">
        <p className="opt-empty">Sincronizando com o servidor… 🏕️</p>
      </div>
    );
  }

  const wingRooms = (g: BedroomGroup) => bedrooms.filter((b) => b.group === g);
  // the team's own rooms are always part of the board (their wing, or "Todas")
  const roomsForWing: Bedroom[] =
    wing === "F" ? wingRooms("girls")
    : wing === "M" ? wingRooms("boys")
    : wing === "staff" ? wingRooms("staff")
    : bedrooms;
  // the name search also looks inside the rooms: if anyone there matches, show only
  // those rooms; with no match at all the board stays whole (search only filters the pool)
  const roomHasMatch = (b: Bedroom) =>
    campers.some((k) => k.bedroom === b.id && normName(k.name).includes(nq)) ||
    staff.some((s) => s.bedroom === b.id && normName(s.name).includes(nq));
  const roomMatches = nq ? roomsForWing.filter(roomHasMatch) : [];
  const roomsOnShow: Bedroom[] = roomMatches.length ? roomMatches : roomsForWing;

  const genderPoolCount = (g: CamperSex) => poolKids.filter((k) => k.sex === g).length;
  const hoverValid = hover && dragUnit ? canDrop(dragUnit, hover) : false;

  return (
    <div className="admin-page">
      <Breadcrumbs items={[{ label: "Quartos", onClick: onBack }, { label: "Montar" }]} />
      <header className="admin-head">
        <h1 className="admin-title">
          <img className="admin-title__icon" src={ICONS.roomAssign} alt="" aria-hidden="true" /> Montar quartos
        </h1>
        <div className="admin-head__actions">
          {hasChanges && (
            <button type="button" className="button button--warn admin-head__new" onClick={discard} disabled={submitting}>
              Descartar alterações
            </button>
          )}
          <button type="button" className="button button--primary admin-head__new" onClick={() => void concluir()} disabled={submitting}>
            {submitting ? "Aplicando…" : "Concluir"}
          </button>
        </div>
      </header>

      {(noCaretaker.length > 0 || noRoom.length > 0) && (
        <p className="message message--warn assign-warn">
          ⚠️ {noCaretaker.length > 0 && <>{noCaretaker.length} criança{noCaretaker.length !== 1 ? "s" : ""} sem líder</>}
          {noCaretaker.length > 0 && noRoom.length > 0 && " · "}
          {noRoom.length > 0 && <>{noRoom.length} sem quarto</>}
        </p>
      )}

      {error && <p className="message message--error">{error}</p>}

      <div className="assign-toolbar" role="group" aria-label="Filtros">
        {(
          [
            { key: "all" as const, label: "Todas", icon: null, count: poolKids.length + poolStaff.length },
            { key: "F" as const, label: "Meninas", icon: ICONS.girlFace, count: genderPoolCount("F") },
            { key: "M" as const, label: "Meninos", icon: ICONS.boyFace, count: genderPoolCount("M") },
            { key: "staff" as const, label: GROUP_META.staff.label, icon: GROUP_META.staff.icon ?? null, count: poolStaff.length },
          ] satisfies { key: WingFilter; label: string; icon: string | null; count: number }[]
        ).map((f) => (
          <button
            key={f.key}
            type="button"
            className={`chip-toggle chip-toggle--small ${wing === f.key ? "chip-toggle--on" : ""}`}
            aria-pressed={wing === f.key}
            onClick={() => setWing(f.key)}
          >
            {f.icon && <img className="chip-toggle__icon" src={f.icon} alt="" aria-hidden="true" />}
            {f.label}
            <span className="cat-tab__count">{f.count}</span>
          </button>
        ))}
      </div>

      {selectedKid && selectedCaretakerId && (
        <p className="message message--ok assign-linking">
          {(() => {
            const lead = staff.find((s) => s.id === selectedCaretakerId);
            return lead ? (
              <>
                <RoomRoleIcon role="caretaker" size={20} sex={staffSex(lead, bedrooms)} /> Crianças de <strong>{firstName(lead.name)}</strong> em destaque · toque numa delas para passar para {otherCaretakerName(caretakersOf(selectedKid.bedroom ?? ""), selectedCaretakerId)}.
              </>
            ) : null;
          })()}
          <button type="button" className="button button--secondary assign-linking__done" onClick={() => setSelected(null)}>
            Pronto
          </button>
        </p>
      )}

      <div className="assign-layout">
        {/* ── left: kids (and staff) still without a room, grouped by preference ── */}
        <section
          className={`assign-pool${hover === "pool" && dragUnit ? (hoverValid ? " assign-pool--over" : " assign-pool--bad") : ""}`}
          data-assign-drop="pool"
        >
          <header className="assign-pool__head">
            <h2 className="assign-pool__title">
              <img className="admin-title__icon" src={ICONS.roomAssign} alt="" aria-hidden="true" /> Sem quarto
              <span className="cat-tab__count">{(wing === "staff" ? 0 : poolKids.length) + poolStaff.length}</span>
            </h2>
            <p className="assign-pool__hint">
              {wing === "staff"
                ? "Arraste a equipe para os quartos da ala Equipe à direita."
                : "Arraste para um quarto à direita. Solte uma criança em cima de outra para grudá-las; para fora do grupo para separar."}
            </p>
            <input
              type="search"
              className="assign-pool__search"
              placeholder="Buscar por nome…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Buscar por nome"
            />
          </header>

          {(wing === "staff" || poolKids.length === 0) && poolStaff.length === 0 && <p className="opt-empty">Todo mundo tem quarto. 🎉</p>}

          <ul className="assign-pool__list">
            {wing !== "staff" && poolUnits(units, wing).map((u) => {
              const members = u.members.filter((k) => !k.bedroom && (wing === "all" || k.sex === wing) && (!nq || normName(k.name).includes(nq)));
              if (!members.length) return null;
              const group = members.length > 1;
              const ids = members.map((m) => m.id);
              const names = members.map((k) => firstName(k.name)).join(", ");
              return (
                <li key={u.id} className={`assign-unit${group ? " assign-unit--group" : ""}`} data-assign-drop={group ? `unit:${u.id}` : undefined}>
                  {/* the yellow card itself carries the whole group: drag it anywhere on the card */}
                  <div
                    className="assign-unit__chips"
                    onPointerDown={group ? (e) => beginDrag(e, { kind: "kids", ids, from: null }) : undefined}
                    role={group ? "button" : undefined}
                    tabIndex={group ? 0 : undefined}
                    aria-label={group ? `Grupo ${names}` : undefined}
                  >
                    {members.map((k) => (
                      <KidChip
                        key={k.id}
                        kid={k}
                        inGroup={group}
                        missing={hasMissingPref(k.id)}
                        noPref={!hasPreference(k.id)}
                        // dropping a kid onto this one glues the two together
                        dropId={`kid:${k.id}`}
                        onBeginDrag={(e) => {
                          if (group) e.stopPropagation(); // the chip drags alone, the card drags the group
                          beginDrag(e, { kind: "kids", ids: [k.id], from: null });
                        }}
                        onClick={() => chipClick(k.id)}
                        onHover={() => hoverTip(k.id)}
                        onLeave={() => leaveTip(k.id)}
                        registerEl={(el) => {
                          if (el) chipEls.current.set(k.id, el);
                          else chipEls.current.delete(k.id);
                        }}
                      />
                    ))}
                    {group && (
                      <button
                        type="button"
                        className="icon-btn icon-btn--bare assign-unit__ungroup"
                        title={`Desgrudar ${names}`}
                        aria-label={`Desgrudar ${names}`}
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={() => ungroup(u.id, members)}
                      >
                        ✂️
                      </button>
                    )}
                  </div>
                  <PrefRow members={members} prefs={prefs} />
                </li>
              );
            })}

          </ul>

          {poolStaff.filter((s) => !nq || normName(s.name).includes(nq)).length > 0 && (
            <ul className="assign-pool__staff">
              {poolStaff.filter((s) => !nq || normName(s.name).includes(nq)).map((s) => (
                <li key={s.id}>
                  <StaffChip staff={s} bedrooms={bedrooms} onBeginDrag={(e) => beginDrag(e, { kind: "staff", ids: [s.id], from: null })} />
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* ── right: the rooms, with everyone draggable between them ── */}
        <div className="assign-rooms">
          {BEDROOM_GROUPS.filter((g) => roomsOnShow.some((b) => b.group === g)).map((g) => {
            const m = GROUP_META[g];
            const rooms = roomsOnShow.filter((b) => b.group === g);
            const people = rooms.reduce((n, b) => n + (occupied.get(b.id) ?? 0), 0);
            return (
              <section key={g} className="room-group">
                <header className="room-group__head">
                  <h2 className={`room-group__title room-group__title--${m.color}`}>{m.label}</h2>
                  <span className="room-group__stats">
                    {rooms.length} {rooms.length === 1 ? "quarto" : "quartos"} · {people} {people === 1 ? "pessoa" : "pessoas"}
                  </span>
                </header>
                <div className="assign-room-grid">
                  {rooms.map((b) => {
                    const inRoom = campers.filter((k) => k.bedroom === b.id);
                    const staffIn = staff.filter((s) => s.bedroom === b.id);
                    // líderes get a colour each when the room has more than one, so every
                    // kid chip shows at a glance who looks after them
                    const caretakers = staffIn.filter((s) => s.roomRole === "caretaker");
                    const palette = COLORS_BY_WING[b.group];
                    /** a líder's colour: the wing's own one first, the next líder takes the following one */
                    const leadColor = (staffId: string | null) => {
                      const i = staffId ? caretakers.findIndex((s) => s.id === staffId) : -1;
                      return i < 0 ? null : palette[i % palette.length];
                    };
                    /** a kid's colour: white while the room has a single líder, their líder's colour once there are two */
                    const kidColor = (caretakerId: string | null) => (caretakers.length < 2 ? null : leadColor(caretakerId));
                    const helpers = staffIn.filter((s) => !caretakers.includes(s));
                    // the room body is the landing zone for kids and for auxiliares alike
                    // (a kid hovering the líderes' corner still lands in the body)
                    const bodyHover = !!dragUnit && (hover === `room:${b.id}` || (dragUnit.kind === "kids" && hover === `lead:${b.id}`));
                    // a team member is on the move: every room reveals its líderes' corner as a
                    // drop zone, so the small, out-of-the-way corner is easy to hit
                    const staffDrag = dragUnit?.kind === "staff";
                    const bodyClass = `${staffDrag ? " assign-room__body--zone" : ""}${bodyHover ? (hoverValid ? " assign-room__body--over" : " assign-room__body--bad") : ""}`;
                    return (
                      <div key={b.id} className={`assign-room${staffDrag ? " assign-room--zones" : ""}`}>
                        <header className="assign-room__head">
                          <span className="assign-room__name">{b.name}</span>
                          {/* líderes corner: drop a team member here to make them a líder of the room */}
                          <span
                            className={
                                // a kid can never become a líder: dragging one leaves this corner alone
                                `assign-room__staff${staffDrag && hover === `lead:${b.id}` ? (hoverValid ? " assign-room__staff--over" : " assign-room__staff--bad") : ""}` +
                                `${staffDrag ? " assign-room__staff--zone" : ""}`
                              }
                              data-assign-drop={`lead:${b.id}`}
                            >
                              {caretakers.map((s) => (
                                <StaffChip
                                  key={s.id}
                                  staff={s}
                                  bedrooms={bedrooms}
                                  color={leadColor(s.id)}
                                  active={!!selectedCaretakerId && s.id === selectedCaretakerId}
                                  onClick={() => tapCaretaker(s, caretakers.length)}
                                  onBeginDrag={(e) => beginDrag(e, { kind: "staff", ids: [s.id], from: b.id })}
                                />
                              ))}
                              {/* no líder yet: a placeholder holds a chip's worth of space, so the card keeps
                                  its size when one is dropped. Invisible at rest; shows the "líder" label to
                                  mark the drop zone while a team member is on the move. */}
                              {caretakers.length === 0 && (
                                <span className="assign-room__staff-ph" aria-hidden="true">{staffDrag ? "líder" : ""}</span>
                              )}
                            </span>
                        </header>
                        {inRoom.length === 0 && helpers.length === 0 ? (
                          <p className={`assign-room__empty${bodyClass}`} data-assign-drop={`room:${b.id}`}>
                            {b.group === "staff" ? "Arraste a equipe para cá" : "Arraste crianças para cá"}
                          </p>
                        ) : (
                          <div className={`assign-room__chips${bodyClass}`} data-assign-drop={`room:${b.id}`}>
                            {/* auxiliares are just another face in the room — listed with the kids */}
                            {helpers.map((s) => (
                                <StaffChip
                                  key={s.id}
                                  staff={s}
                                  bedrooms={bedrooms}
                                  color={HELPER_COLOR}
                                  onBeginDrag={(e) => beginDrag(e, { kind: "staff", ids: [s.id], from: b.id })}
                                />
                              ))}
                            {inRoom.map((k) => {
                              // kids of the same preference group travel together, here too
                              const mates = roomUnitIds(units, k, inRoom);
                              const group = mates.length > 1;
                              return (
                                <KidChip
                                  key={k.id}
                                  kid={k}
                                  inGroup={group}
                                  missing={hasMissingPref(k.id)}
                                  noPref={!hasPreference(k.id)}
                                  color={kidColor(k.caretakerId)}
                                  active={!!selectedCaretakerId && k.caretakerId === selectedCaretakerId}
                                  selected={selected === k.id || selectedRoom === b.id}
                                  onBeginDrag={(e) => beginDrag(e, { kind: "kids", ids: mates, from: b.id })}
                                  onClick={() => {
                                    if (!wasTap()) return; // the click that closes a drag is not a tap
                                    tapKid(k);
                                    tapTip(k.id);
                                  }}
                                  onHover={() => hoverTip(k.id)}
                                  onLeave={() => leaveTip(k.id)}
                                  registerEl={(el) => {
                                    if (el) chipEls.current.set(k.id, el);
                                    else chipEls.current.delete(k.id);
                                  }}
                                />
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      </div>

      {/* What the finger carries. Over the pool only the grabbed chip shows (the
          group is staying put); once it is over a room the whole group appears,
          because that is what the drop will move. */}
      {dragUnit && ghost && createPortal(
        (() => {
          const overRoom = !!hover && hover !== "pool";
          const carried = overRoom ? dragUnit.ids : dragUnit.ids.slice(0, 1);
          return (
            <div className="assign-ghost" style={{ left: ghost.x, top: ghost.y }} aria-hidden="true">
              {carried.slice(0, 3).map((id) => {
                const k = campers.find((c) => c.id === id);
                const s = staff.find((x) => x.id === id);
                return (
                  <span key={id} className={`assign-chip${s ? " assign-chip--staff" : ""}`}>
                    {s && <RoomRoleIcon role={s.roomRole} size={16} sex={staffSex(s, bedrooms)} />}
                    {(k ?? s)?.name.split(" ")[0]}
                    {k && <AgeTag kid={k} />}
                  </span>
                );
              })}
              {carried.length > 3 && <span className="assign-chip">+{carried.length - 3}</span>}
            </div>
          );
        })(),
        document.body,
      )}

      {/* the preference tooltip — one at a time, hover (desktop) or tap (mobile) */}
      {tip && chipEls.current.get(tip) && (
        <ChipTip anchor={chipEls.current.get(tip)!} onClose={() => setTip((t) => (t === tip ? null : t))}>
          <TipBody kid={kids.find((k) => k.id === tip)} prefs={prefs} kids={kids} bedrooms={bedrooms} />
        </ChipTip>
      )}

      <Dialog open={confirmOpen} onClose={() => (submitting ? undefined : setConfirmOpen(false))} title="Confirmar alterações" width={560}>
        <div className="cat-form cat-form--plain">
          <h2 className="cat-form__title">
            <img className="admin-title__icon" src={ICONS.roomAssign} alt="" aria-hidden="true" /> Resumo das alterações
          </h2>

          {(noCaretaker.length > 0 || noRoom.length > 0) && (
            <p className="message message--warn assign-summary-pending">
              ⚠️ Pendências:{" "}
              {noCaretaker.length > 0 && <>{noCaretaker.length} sem líder</>}
              {noCaretaker.length > 0 && noRoom.length > 0 && " · "}
              {noRoom.length > 0 && <>{noRoom.length} sem quarto</>}. Você pode aplicar assim mesmo.
            </p>
          )}

          {summary.lines.length > 0 ? (
            <ul className="assign-summary-list">
              {summary.lines.map((l, i) => (
                <li key={i}>{l}</li>
              ))}
            </ul>
          ) : (
            <p className="cat-hint">Nenhuma alteração para aplicar.</p>
          )}

          {/* who gets an SMS — only shown when there IS someone to tell (server preview) */}
          {preview === null ? (
            <p className="cat-hint">Verificando avisos…</p>
          ) : preview.messages.length > 0 ? (
            <div className="assign-notify-box">
              <label className="assign-notify-toggle">
                <input type="checkbox" checked={notifyOn} onChange={(e) => setNotifyOn(e.target.checked)} />
                <img className="assign-notify-toggle__icon" src={notifyOn ? ICONS.notifications : ICONS.notifyOff} alt="" aria-hidden="true" />
                <span>
                  {notifyOn
                    ? <>Avisar <strong>{preview.messages.length}</strong> por SMS</>
                    : <>Não avisar ninguém</>}
                </span>
              </label>
              {notifyOn && (
                <button type="button" className="link-btn assign-notify-examples" onClick={() => setShowMessages((v) => !v)}>
                  {showMessages ? "Ocultar exemplos" : "Ver exemplos de mensagem"}
                </button>
              )}
              {notifyOn && showMessages && (
                <ul className="assign-notify-list">
                  {preview.messages.slice(0, 5).map((m) => (
                    <li key={m.staffId}>
                      <span className="assign-notify-list__to">{firstName(m.name)}</span>
                      <span className="assign-notify-list__msg">{m.text}</span>
                    </li>
                  ))}
                  {preview.messages.length > 5 && <li className="assign-notify-list__more">+{preview.messages.length - 5} mensagem(ns)</li>}
                </ul>
              )}
            </div>
          ) : null}

          {error && <p className="message message--error">{error}</p>}

          <div className="cat-form__actions">
            <button type="button" className="button button--secondary" onClick={() => setConfirmOpen(false)} disabled={submitting}>
              Voltar
            </button>
            <button type="button" className="button button--primary" onClick={() => void applyNow()} disabled={submitting || preview === null}>
              {submitting ? "Aplicando…" : notifyOn && (preview?.messages.length ?? 0) > 0 ? "Aplicar e avisar" : "Salvar"}
            </button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}

// ── chips ──

interface KidChipProps {
  kid: Camper;
  inGroup: boolean;
  /** one of the names this kid asked for matched nobody → yellow border, whatever the colour */
  missing?: boolean;
  /** the kid asked for nobody at all → calm green border */
  noPref?: boolean;
  /** marks the chip as a drop target (gluing two kids into one group) */
  dropId?: string;
  /** líder colour of the room (null = no líder yet) */
  color?: CaretakerColor | null;
  /** this kid belongs to the líder whose crew is selected → strong colour */
  active?: boolean;
  /** the kid the admin actually tapped */
  selected?: boolean;
  onBeginDrag: (e: React.PointerEvent) => void;
  onClick: () => void;
  onHover: () => void;
  onLeave: () => void;
  registerEl: (el: HTMLElement | null) => void;
}

function AgeTag({ kid }: { kid: Camper }) {
  const age = ageOf(kid.birthDate);
  if (age === null) return null;
  return <span className="assign-chip__age">{age}</span>;
}

function KidChip({ kid, inGroup, missing, noPref, dropId, color, active, selected, onBeginDrag, onClick, onHover, onLeave, registerEl }: KidChipProps) {
  return (
    <button
      ref={registerEl}
      data-assign-kid={kid.id}
      data-assign-drop={dropId}
      type="button"
      className={
        `assign-chip${inGroup ? " assign-chip--grouped" : ""}` +
        `${color ? ` assign-chip--${color}${active ? "-on" : ""}` : ""}${selected ? " assign-chip--picked" : ""}` +
        `${missing ? " assign-chip--missing" : noPref ? " assign-chip--nopref" : ""}`
      }
      onPointerDown={onBeginDrag}
      onClick={onClick}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      aria-label={`${kid.name}${ageOf(kid.birthDate) !== null ? `, ${ageOf(kid.birthDate)} anos` : ""}${missing ? " — pediu alguém que não foi encontrado" : ""}`}
    >
      {firstName(kid.name)}
      <AgeTag kid={kid} />
    </button>
  );
}

function StaffChip({
  staff: s,
  bedrooms,
  color,
  active,
  onClick,
  onBeginDrag,
}: {
  staff: Staff;
  bedrooms: Bedroom[];
  color?: CaretakerColor | null;
  /** their crew is the selected one → strong colour */
  active?: boolean;
  /** líderes in a shared room: tapping selects the whole room */
  onClick?: () => void;
  onBeginDrag: (e: React.PointerEvent) => void;
}) {
  const role = s.roomRole === "caretaker" ? "líder" : "auxiliar";
  return (
    <button
      type="button"
      data-assign-lead={onClick ? s.id : undefined}
      className={`assign-chip assign-chip--staff${color ? ` assign-chip--${color}${active ? "-on" : ""}` : ""}`}
      onPointerDown={onBeginDrag}
      onClick={onClick}
      aria-label={`${s.name}, ${role}`}
    >
      <RoomRoleIcon role={s.roomRole} size={18} sex={staffSex(s, bedrooms)} />
      {s.name.split(" ")[0]}
    </button>
  );
}

/** the names a kid asked for, as small chips — the ones nobody matched stay red */
/** Only the requested names nobody matched — the ones the admin still has to chase.
    Matched preferences already found their person, so there is nothing to show. */
function PrefRow({ members, prefs }: { members: Camper[]; prefs: Map<string, PrefMatch[]> }) {
  const rows = members
    .map((k) => ({ kid: k, list: (prefs.get(k.id) ?? []).filter((p) => !p.camperId) }))
    .filter((r) => r.list.length > 0);
  if (!rows.length) return null;
  return (
    <div className="assign-unit__prefs">
      {rows.map(({ kid, list }) => (
        <span key={kid.id} className="assign-pref-line">
          {rows.length > 1 && <em className="assign-pref-line__owner">{firstName(kid.name)}:</em>}
          {list.map((p, i) => (
            <span key={`${p.raw}-${i}`} className="assign-pref assign-pref--missing">
              ✗ {p.raw}
            </span>
          ))}
        </span>
      ))}
    </div>
  );
}

function TipBody({ kid, prefs, kids, bedrooms }: { kid: Camper | undefined; prefs: Map<string, PrefMatch[]>; kids: Camper[]; bedrooms: Bedroom[] }) {
  if (!kid) return null;
  const list = prefs.get(kid.id) ?? [];
  return (
    <>
      <p className="chip-tip__title">{kid.name}</p>
      {list.length === 0 ? (
        <p>Sem preferência de quarto informada.</p>
      ) : (
        <p className="chip-tip__chips">
          <span className="chip-tip__lead">prefere dividir com:</span>
          {list.map((p, i) => {
            const target = p.camperId ? kids.find((k) => k.id === p.camperId) : undefined;
            const room = target?.bedroom ? bedrooms.find((b) => b.id === target.bedroom) : undefined;
            return (
              <span key={`${p.raw}-${i}`} className={`chip-tip__chip${p.camperId ? "" : " chip-tip__chip--missing"}`}>
                {p.raw}
                {room ? ` · ${room.name}` : p.camperId ? " · sem quarto" : " — ninguém com esse nome"}
              </span>
            );
          })}
        </p>
      )}
    </>
  );
}

/** the name shown on the swap hint: the next líder of the same room */
function otherCaretakerName(roomCaretakers: Staff[], currentId: string): string {
  if (roomCaretakers.length < 2) return "outro líder";
  const i = roomCaretakers.findIndex((s) => s.id === currentId);
  return firstName(roomCaretakers[(i + 1) % roomCaretakers.length].name);
}

/** the kid + every roommate of their preference group (dissolved groups give just the kid) */
function roomUnitIds(units: { id: string; members: Camper[] }[], kid: Camper, inRoom: Camper[]): string[] {
  const unit = units.find((u) => u.members.some((m) => m.id === kid.id));
  if (!unit || unit.members.length < 2) return [kid.id];
  const here = new Set(inRoom.map((k) => k.id));
  return unit.members.filter((m) => here.has(m.id)).map((m) => m.id);
}

/** pool units: groups first (biggest first), then single kids, both by name */
function poolUnits(units: { id: string; members: Camper[] }[], wing: WingFilter) {
  return units
    .map((u) => ({ unit: u, free: u.members.filter((k) => !k.bedroom && (wing === "all" || k.sex === wing)).length }))
    .filter((x) => x.free > 0)
    .sort((a, b) => Number(b.free > 1) - Number(a.free > 1) || b.free - a.free || a.unit.members[0].name.localeCompare(b.unit.members[0].name, "pt-BR"))
    .map((x) => x.unit);
}

function sortRooms(list: Bedroom[]): Bedroom[] {
  return list.slice().sort((a, b) => a.name.localeCompare(b.name, "pt-BR", { numeric: true }));
}
