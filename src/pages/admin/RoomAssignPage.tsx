import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Breadcrumbs from "../../components/Breadcrumbs";
import { PreferenceTipPortal, usePreferenceTip } from "../../components/PreferenceTip";
import DesktopBoardNotice from "../../components/DesktopBoardNotice";
import DistributeRoomsDialog from "./DistributeRoomsDialog";
import Toast from "../../components/Toast";
import type { DistributionPlan } from "../../roomDistribution";
import Dialog from "../../components/Dialog";
import RoomRoleIcon from "../../components/RoomRoleIcon";
import { AssignmentCamperChip, AssignmentStaffChip } from "../../components/AssignmentChips";
import PreferenceGroupCard from "../../components/PreferenceGroupCard";
import PreferenceStrategyControl, { usePreferenceStrategy } from "../../components/PreferenceStrategyControl";
import { SaveGlyph, SearchGlyph, UndoGlyph } from "../../components/Glyph";
import { ageOf, type Camper, type CamperSex } from "../../api/campers";
import { staffSex, type Staff } from "../../api/staff";
import { applyRooms, BEDROOM_GROUPS, GROUP_META, previewRooms, type Bedroom, type BedroomGroup, type RoomsAppliedMessage } from "../../api/bedrooms";
import { applyCamperDraft, applyStaffDraft, clearRoomsDraft, draftHasChanges, emptyRoomsDraft, loadRoomsDraft, roomsDelta, saveRoomsDraft, type RoomsDraft } from "../../roomDraft";
import { blobLimitHint, buildPreferenceUnits, matchAllPreferences, normName, type PrefMatch } from "../../roomGroups";
import { medianAgeFloor, shortPersonName } from "../../names";
import { useCollection, useCollectionOrEmpty } from "../../store";
import { ICONS } from "../../icons";
import { collatorLocale, useI18n } from "../../i18n";

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
  const { tx } = useI18n();
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
  /** the Distribuir dialog */
  const [distributeOpen, setDistributeOpen] = useState(false);
  /** kids the last Distribuir had to pull out of their preference group (shown with a mark until the next draft change to them) */
  const [splitKids, setSplitKids] = useState<Set<string>>(new Set());
  /** the draft as it was right before the last Distribuir — what "Desfazer" restores (null = nothing to undo) */
  const [undoDistribution, setUndoDistribution] = useState<{ draft: RoomsDraft; summary: string } | null>(null);

  /** admins + everyone on an admin list: they have another job, so Distribuir never puts them in a kids' room */
  const excludeStaffIds = useMemo(() => {
    const s = settings;
    if (!s) return new Set<string>();
    return new Set<string>([
      ...s.organizers.staffIds, ...s.gameOrganizers.staffIds, ...s.scoreHelpers.staffIds, ...s.medicalStaff.staffIds,
      ...s.vestHelpers.staffIds, ...s.photographers.staffIds, ...s.parentContacts.map((c) => c.staffId),
    ]);
  }, [settings]);
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
  const kids = useMemo(() => campers.slice().sort((a, b) => a.name.localeCompare(b.name, collatorLocale())), [campers]);
  /** who sleeps in each room as the draft leaves it (the store's counts are the server's) */
  const occupied = useMemo(() => {
    const m = new Map<string, number>();
    for (const k of campers) if (k.bedroom) m.set(k.bedroom, (m.get(k.bedroom) ?? 0) + 1);
    for (const s of staff) if (s.bedroom) m.set(s.bedroom, (m.get(s.bedroom) ?? 0) + 1);
    return m;
  }, [campers, staff]);
  const prefs = useMemo(() => matchAllPreferences(kids), [kids]);
  /** the shared "prefere dividir com" tooltip (hover / tap), same as Montar times */
  const tipCtl = usePreferenceTip(prefs);
  /** Smart | Strict | Loose + the Smart limit (this device, shared with Montar times) */
  const [grouping, setGrouping] = usePreferenceStrategy("rooms");
  const units = useMemo(() => buildPreferenceUnits(kids, prefs, { ungrouped, detached, glued }, bedrooms ?? [], grouping), [kids, prefs, ungrouped, detached, glued, bedrooms, grouping]);

  const poolKids = kids.filter((k) => !k.bedroom);
  const poolStaff = staff.filter((s) => !s.bedroom && s.active);
  /** the name-search box, normalised for accent-free matching */
  const nq = normName(search.trim());
  /** the name box also finds a kid by whoever they asked to share the room with ("Ana" finds the kid who wrote "Ana Souza") */
  const kidMatches = (k: Camper) => !nq || normName(k.name).includes(nq) || normName(k.bedroomPreference).includes(nq);

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

    const lines: string[] = [];
    if (kidsGotRoom) lines.push(kidsGotRoom === 1 ? tx("{n} criança ganhou quarto", { n: kidsGotRoom }) : tx("{n} crianças ganharam quarto", { n: kidsGotRoom }));
    if (kidsSwappedRoom) lines.push(kidsSwappedRoom === 1 ? tx("{n} criança trocaram de quarto", { n: kidsSwappedRoom }) : tx("{n} crianças trocaram de quarto", { n: kidsSwappedRoom }));
    if (kidsLeftRoom) lines.push(kidsLeftRoom === 1 ? tx("{n} criança saíram do quarto", { n: kidsLeftRoom }) : tx("{n} crianças saíram do quarto", { n: kidsLeftRoom }));
    if (kidsLeadOnly) lines.push(kidsLeadOnly === 1 ? tx("{n} criança mudaram de líder", { n: kidsLeadOnly }) : tx("{n} crianças mudaram de líder", { n: kidsLeadOnly }));
    if (staffGotRoom) lines.push(staffGotRoom === 1 ? tx("{n} da equipe ganhou quarto", { n: staffGotRoom }) : tx("{n} da equipe ganharam quarto", { n: staffGotRoom }));
    if (staffSwappedRoom) lines.push(tx("{n} da equipe trocaram de quarto", { n: staffSwappedRoom }));
    if (staffLeftRoom) lines.push(tx("{n} da equipe saíram do quarto", { n: staffLeftRoom }));
    if (staffRoleOnly) lines.push(tx("{n} da equipe mudaram de função", { n: staffRoleOnly }));

    return { lines, total: delta.staff.length + delta.campers.length };
  }, [draft, storedCampers, storedStaff, tx]);

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
    // the admin took over: the "pulled out by Distribuir" mark is no longer telling them anything
    if (movingKids.length && splitKids.size) setSplitKids((prev) => { const next = new Set(prev); for (const k of movingKids) next.delete(k.id); return next; });

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
    tipCtl.gestureStart(e.pointerType); // fresh gesture: only a real drag suppresses the tap
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
    };
    const move = (ev: PointerEvent) => {
      if (ev.pointerId !== e.pointerId) return;
      if (!active) {
        if (Math.hypot(ev.clientX - startX, ev.clientY - startY) < 8) return;
        active = true;
        setDragUnit(unit);
        tipCtl.gestureDragged(); // the drag takes over from the tooltip; the closing click is not a tap
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

  const wasTap = tipCtl.wasTap;
  const tapTip = tipCtl.tap;
  const hoverTip = tipCtl.hover;
  const leaveTip = tipCtl.leave;
  const setTip = tipCtl.setTip;

  function chipClick(kidId: string) {
    if (!wasTap()) return;
    tapTip(kidId);
  }

  /** "Descartar": wipe the draft (and every session gesture), staying on the board */
  /** Distribuir → the whole plan lands in the draft in one go; kids pulled out of their group get a mark */
  function applyDistribution(plan: DistributionPlan) {
    setError(null);
    // remember where we were, so one tap brings it all back
    const before: RoomsDraft = { campers: { ...draft.campers }, staff: { ...draft.staff }, savedAt: draft.savedAt };
    const n = plan.score;
    setUndoDistribution({ draft: before, summary: tx("Quartos distribuídos — {kept} grupo(s) inteiro(s){broken}{unplaced}.", { kept: plan.groups.length - n.brokenGroups, broken: n.brokenGroups ? tx(", {n} separado(s)", { n: n.brokenGroups }) : "", unplaced: n.unplaced ? tx(", {n} sem quarto", { n: n.unplaced }) : "" }) });
    mutateDraft((d) => {
      for (const [id, v] of Object.entries(plan.campers)) d.campers[id] = { bedroom: v.bedroom, caretakerId: v.caretakerId };
      for (const [id, v] of Object.entries(plan.staff)) d.staff[id] = { bedroom: v.bedroom, roomRole: v.roomRole };
    });
    setSplitKids(new Set(plan.groups.flatMap((g) => g.movedIds)));
    setSelected(null);
    setSelectedRoom(null);
    setSelectedLead(null);
    setDistributeOpen(false);
  }

  /** "Desfazer" on the toast: the draft goes back to the moment before Distribuir */
  function revertDistribution() {
    if (!undoDistribution) return;
    const back = undoDistribution.draft;
    setDraft(back);
    saveRoomsDraft(back);
    setSplitKids(new Set());
    setUndoDistribution(null);
  }

  function discard() {
    setUndoDistribution(null);
    setSplitKids(new Set());
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
      setError(e instanceof Error ? e.message : tx("Algo deu errado."));
      setSubmitting(false);
    }
  }

  if (!bedrooms) {
    return (
      <div className="admin-page">
        <p className="opt-empty">{tx("Sincronizando com o servidor… 🏕️")}</p>
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
    campers.some((k) => k.bedroom === b.id && kidMatches(k)) ||
    staff.some((s) => s.bedroom === b.id && normName(s.name).includes(nq));
  const roomMatches = nq ? roomsForWing.filter(roomHasMatch) : [];
  const roomsOnShow: Bedroom[] = roomMatches.length ? roomMatches : roomsForWing;

  const genderPoolCount = (g: CamperSex) => poolKids.filter((k) => (k.sex ?? k.probableGender) === g).length;
  const hoverValid = hover && dragUnit ? canDrop(dragUnit, hover) : false;

  return (
    <div className="admin-page">
      <DesktopBoardNotice what={tx("montar os quartos")} />
      <Breadcrumbs items={[{ label: tx("Quartos"), onClick: onBack }, { label: tx("Montar") }]} />
      <header className="admin-head">
        <h1 className="admin-title">
          <img className="admin-title__icon" src={ICONS.roomAssign} alt="" aria-hidden="true" /> {tx("Montar quartos")}
        </h1>
        <div className="admin-head__actions admin-head__actions--icons">
          <button type="button" className="button button--secondary admin-head__new" title={tx("Distribuir todo mundo nos quartos automaticamente")} onClick={() => setDistributeOpen(true)} disabled={submitting}>
            <img className="admin-head__action-icon" src={ICONS.teamDistribute} alt="" aria-hidden="true" /> <span className="admin-head__action-label">{tx("Distribuir")}</span>
          </button>
          {hasChanges && (
            <button type="button" className="button button--warn admin-head__new" onClick={discard} disabled={submitting}>
              <UndoGlyph /> <span className="admin-head__action-label">{tx("Descartar")}</span>
            </button>
          )}
          <button type="button" className="button button--primary admin-head__new" onClick={() => void concluir()} disabled={submitting}>
            <SaveGlyph /> <span className="admin-head__action-label">{submitting ? tx("Aplicando…") : tx("Salvar")}</span>
          </button>
        </div>
      </header>

      {error && <p className="message message--error">{error}</p>}

      <div className="assign-toolbar" role="group" aria-label={tx("Filtros")}>
        {(
          [
            { key: "all" as const, label: tx("Todas"), icon: null, count: poolKids.length + poolStaff.length },
            { key: "F" as const, label: tx("Meninas"), icon: ICONS.girlFace, count: genderPoolCount("F") },
            { key: "M" as const, label: tx("Meninos"), icon: ICONS.boyFace, count: genderPoolCount("M") },
            { key: "staff" as const, label: tx(GROUP_META.staff.label), icon: GROUP_META.staff.icon ?? null, count: poolStaff.length },
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
                <RoomRoleIcon role="caretaker" size={20} sex={staffSex(lead, bedrooms)} /> {tx("Crianças de")} <strong>{firstName(lead.name)}</strong> {tx("em destaque · toque numa delas para passar para {other}.", { other: otherCaretakerName(caretakersOf(selectedKid.bedroom ?? ""), selectedCaretakerId) ?? tx("outro líder") })}
              </>
            ) : null;
          })()}
          <button type="button" className="button button--secondary assign-linking__done" onClick={() => setSelected(null)}>
            {tx("Pronto")}
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
              <img className="admin-title__icon" src={ICONS.roomAssign} alt="" aria-hidden="true" /> {tx("Sem quarto")}
              <span className="cat-tab__count">{(wing === "staff" ? 0 : poolKids.length) + poolStaff.length}</span>
            </h2>
            <p className="assign-pool__hint">
              {wing === "staff"
                ? tx("Arraste a equipe para os quartos da ala Equipe à direita.")
                : tx("Arraste para um quarto à direita. Solte uma criança em cima de outra para grudá-las; para fora do grupo para separar.")}
            </p>
            <label className="assign-pool__search">
              <SearchGlyph className="assign-pool__search-icon" size="1.1em" />
              <input
                type="search"
                placeholder={tx("Buscar por nome ou preferência…")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label={tx("Buscar por nome ou preferência")}
              />
            </label>
          </header>

          {(wing === "staff" || poolKids.length === 0) && poolStaff.length === 0 && <p className="opt-empty">{tx("Todo mundo tem quarto. 🎉")}</p>}

          <ul className="assign-pool__list">
            {wing !== "staff" && poolUnits(units, wing).map((u) => {
              const members = u.members.filter((k) => !k.bedroom && (wing === "all" || (k.sex ?? k.probableGender) === wing) && kidMatches(k));
              if (!members.length) return null;
              const group = members.length > 1;
              const ids = members.map((m) => m.id);
              const names = members.map((k) => shortPersonName(k.name, campers)).join(", ");
              return (
                <li key={u.id} data-assign-drop={group ? `unit:${u.id}` : undefined}>
                  <PreferenceGroupCard
                    unit={{ id: u.id, members }}
                    prefs={prefs}
                    onGroupPointerDown={group ? (e) => beginDrag(e, { kind: "kids", ids, from: null }) : undefined}
                    action={group ? <button type="button" className="icon-btn icon-btn--bare preference-group__action" title={tx("Desgrudar {names}", { names })} aria-label={tx("Desgrudar {names}", { names })} onPointerDown={(e) => e.stopPropagation()} onClick={() => ungroup(u.id, members)}>✂️</button> : undefined}
                    renderCamper={(k, state) => <AssignmentCamperChip key={k.id} camper={k} peers={campers} {...state} data-assign-kid={k.id} data-assign-drop={`kid:${k.id}`} buttonRef={tipCtl.register(k.id)} onPointerDown={(e) => { if (group) e.stopPropagation(); beginDrag(e, { kind: "kids", ids: [k.id], from: null }); }} onClick={() => chipClick(k.id)} onMouseEnter={() => hoverTip(k.id)} onMouseLeave={() => leaveTip(k.id)} />}
                  />
                </li>
              );
            })}

          </ul>

          {poolStaff.filter((s) => !nq || normName(s.name).includes(nq)).length > 0 && (
            <ul className="assign-pool__staff">
              {poolStaff.filter((s) => !nq || normName(s.name).includes(nq)).map((s) => (
                <li key={s.id}>
                  <AssignmentStaffChip staff={s} bedrooms={bedrooms} onPointerDown={(e) => beginDrag(e, { kind: "staff", ids: [s.id], from: null })} />
                </li>
              ))}
            </ul>
          )}

          {wing !== "staff" && (
            <PreferenceStrategyControl value={grouping} onChange={setGrouping} medianHint={blobLimitHint(bedrooms)} />
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
                  <h2 className={`room-group__title room-group__title--${m.color}`}>{tx(m.label)}</h2>
                  <span className="room-group__stats">
                    {rooms.length === 1 ? tx("{n} quarto", { n: rooms.length }) : tx("{n} quartos", { n: rooms.length })} · {people === 1 ? tx("{n} pessoa", { n: people }) : tx("{n} pessoas", { n: people })}
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
                    // free beds as the DRAFT leaves the room (kids + staff); negative = overbooked
                    const used = occupied.get(b.id) ?? 0;
                    const free = b.capacity - used;
                    const medianAge = b.group === "staff" ? null : medianAgeFloor(inRoom);
                    const capacityStatus =
                      free < 0
                        ? tx("{used}/{capacity} · {extra} a mais que as {capacity} camas", { used, capacity: b.capacity, extra: -free })
                        : free === 0
                          ? tx("{used}/{capacity} · lotado", { used, capacity: b.capacity })
                          : free === 1
                            ? tx("{used}/{capacity} · {free} cama livre", { used, capacity: b.capacity, free })
                            : tx("{used}/{capacity} · {free} camas livres", { used, capacity: b.capacity, free });
                    return (
                      <div key={b.id} className={`assign-room${staffDrag ? " assign-room--zones" : ""}`}>
                        <header className="assign-room__head">
                          <span className="assign-room__name">
                            {b.name}
                            <span
                              className={`assign-room__free${free < 0 ? " assign-room__free--over" : free === 0 ? " assign-room__free--full" : ""}`}
                              title={capacityStatus}
                              aria-label={capacityStatus}
                            >
                              {free < 0 ? `+${-free}` : free}
                            </span>
                            {medianAge !== null && (
                              <span className="assign-room__age" title={tx("Idade mediana: {age} anos", { age: medianAge })}>
                                ~ {medianAge} {tx("Anos")}
                              </span>
                            )}
                          </span>
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
                                <AssignmentStaffChip
                                  key={s.id}
                                  staff={s}
                                  bedrooms={bedrooms}
                                  className={colorClass(leadColor(s.id), !!selectedCaretakerId && s.id === selectedCaretakerId)}
                                  data-assign-lead={s.id}
                                  onClick={() => tapCaretaker(s, caretakers.length)}
                                  onPointerDown={(e) => beginDrag(e, { kind: "staff", ids: [s.id], from: b.id })}
                                />
                              ))}
                              {/* no líder yet: a placeholder holds a chip's worth of space, so the card keeps
                                  its size when one is dropped. Invisible at rest; shows the "líder" label to
                                  mark the drop zone while a team member is on the move. */}
                              {caretakers.length === 0 && (
                                <span className="assign-room__staff-ph" aria-hidden="true">{staffDrag ? tx("líder") : ""}</span>
                              )}
                            </span>
                        </header>
                        {inRoom.length === 0 && helpers.length === 0 ? (
                          <p className={`assign-room__empty${bodyClass}`} data-assign-drop={`room:${b.id}`}>
                            {b.group === "staff" ? tx("Arraste a equipe para cá") : tx("Arraste crianças para cá")}
                          </p>
                        ) : (
                          <div className={`assign-room__chips${bodyClass}`} data-assign-drop={`room:${b.id}`}>
                            {/* auxiliares are just another face in the room — listed with the kids */}
                            {helpers.map((s) => (
                                <AssignmentStaffChip
                                  key={s.id}
                                  staff={s}
                                  bedrooms={bedrooms}
                                  className={colorClass(HELPER_COLOR, false)}
                                  onPointerDown={(e) => beginDrag(e, { kind: "staff", ids: [s.id], from: b.id })}
                                />
                              ))}
                            {inRoom.map((k) => {
                              // kids of the same preference group travel together, here too
                              const mates = roomUnitIds(units, k, inRoom);
                              const group = mates.length > 1;
                              return (
                                <AssignmentCamperChip
                                  key={k.id}
                                  camper={k}
                                  peers={campers}
                                  grouped={group}
                                  missing={hasMissingPref(k.id)}
                                  noPreference={!hasPreference(k.id)}
                                  className={`${colorClass(kidColor(k.caretakerId), !!selectedCaretakerId && k.caretakerId === selectedCaretakerId)}${selected === k.id || selectedRoom === b.id ? " assign-chip--picked" : ""}${splitKids.has(k.id) ? " assign-chip--split" : ""}`}
                                  data-assign-kid={k.id}
                                  buttonRef={tipCtl.register(k.id)}
                                  onPointerDown={(e) => beginDrag(e, { kind: "kids", ids: mates, from: b.id })}
                                  onClick={() => {
                                    if (!wasTap()) return; // the click that closes a drag is not a tap
                                    tapKid(k);
                                    tapTip(k.id);
                                  }}
                                  onMouseEnter={() => hoverTip(k.id)}
                                  onMouseLeave={() => leaveTip(k.id)}
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
                    {k ? shortPersonName(k.name, campers) : s?.name.split(" ")[0]}
                    {k && ageOf(k.birthDate) !== null && <span className="assign-chip__age">{ageOf(k.birthDate)}</span>}
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
      <PreferenceTipPortal tip={tipCtl.tip} anchor={tipCtl.anchor} onClose={tipCtl.close} onEnter={tipCtl.enterTip} onLeave={tipCtl.leaveTip} kids={kids} prefs={prefs} bedrooms={bedrooms} />

      <DistributeRoomsDialog open={distributeOpen} bedrooms={bedrooms} campers={campers} staff={staff} units={units} prefs={prefs} excludeStaffIds={excludeStaffIds} onApply={applyDistribution} onClose={() => setDistributeOpen(false)} />

      <Toast message={undoDistribution?.summary ?? null} action={undoDistribution ? { label: <><UndoGlyph /> {tx("Desfazer")}</>, onClick: revertDistribution } : undefined} onClose={() => setUndoDistribution(null)} />

      <Dialog open={confirmOpen} onClose={() => (submitting ? undefined : setConfirmOpen(false))} title={tx("Confirmar alterações")} width={560}>
        <div className="cat-form cat-form--plain">
          <h2 className="cat-form__title">
            <img className="admin-title__icon" src={ICONS.roomAssign} alt="" aria-hidden="true" /> {tx("Resumo das alterações")}
          </h2>

          {(noCaretaker.length > 0 || noRoom.length > 0) && (
            <p className="message message--warn assign-summary-pending">
              {tx("⚠️ Pendências: {details}. Você pode aplicar assim mesmo.", {
                details: [
                  noCaretaker.length > 0 ? tx("{n} sem líder", { n: noCaretaker.length }) : null,
                  noRoom.length > 0 ? tx("{n} sem quarto", { n: noRoom.length }) : null,
                ].filter(Boolean).join(tx(" · ")),
              })}
            </p>
          )}

          {summary.lines.length > 0 ? (
            <ul className="assign-summary-list">
              {summary.lines.map((l, i) => (
                <li key={i}>{l}</li>
              ))}
            </ul>
          ) : (
            <p className="cat-hint">{tx("Nenhuma alteração para aplicar.")}</p>
          )}

          {/* who gets an SMS — only shown when there IS someone to tell (server preview) */}
          {preview === null ? (
            <p className="cat-hint">{tx("Verificando avisos…")}</p>
          ) : preview.messages.length > 0 ? (
            <div className="assign-notify-box">
              <label className="assign-notify-toggle">
                <input type="checkbox" checked={notifyOn} onChange={(e) => setNotifyOn(e.target.checked)} />
                <img className="assign-notify-toggle__icon" src={notifyOn ? ICONS.notifications : ICONS.notifyOff} alt="" aria-hidden="true" />
                <span>
                  {notifyOn
                    ? tx("Avisar {n} por SMS", { n: preview.messages.length })
                    : tx("Não avisar ninguém")}
                </span>
              </label>
              {notifyOn && (
                <button type="button" className="link-btn assign-notify-examples" onClick={() => setShowMessages((v) => !v)}>
                  {showMessages ? tx("Ocultar exemplos") : tx("Ver exemplos de mensagem")}
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
                  {preview.messages.length > 5 && <li className="assign-notify-list__more">{tx("+{n} mensagem(ns)", { n: preview.messages.length - 5 })}</li>}
                </ul>
              )}
            </div>
          ) : null}

          {error && <p className="message message--error">{error}</p>}

          <div className="cat-form__actions">
            <button type="button" className="button button--secondary" onClick={() => setConfirmOpen(false)} disabled={submitting}>
              {tx("Voltar")}
            </button>
            <button type="button" className="button button--primary" onClick={() => void applyNow()} disabled={submitting || preview === null}>
              {submitting ? tx("Aplicando…") : notifyOn && (preview?.messages.length ?? 0) > 0 ? tx("Aplicar e avisar") : tx("Salvar")}
            </button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}

// ── chips ──

/** líder colour class of the room board: light while idle, strong when the crew is selected */
function colorClass(color: CaretakerColor | null, active: boolean): string {
  return color ? `assign-chip--${color}${active ? "-on" : ""}` : "";
}

/** the name shown on the swap hint: the next líder of the same room */
function otherCaretakerName(roomCaretakers: Staff[], currentId: string): string | null {
  if (roomCaretakers.length < 2) return null;
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
    .map((u) => ({ unit: u, free: u.members.filter((k) => !k.bedroom && (wing === "all" || (k.sex ?? k.probableGender) === wing)).length }))
    .filter((x) => x.free > 0)
    .sort((a, b) => Number(b.free > 1) - Number(a.free > 1) || b.free - a.free || a.unit.members[0].name.localeCompare(b.unit.members[0].name, collatorLocale()))
    .map((x) => x.unit);
}

function sortRooms(list: Bedroom[]): Bedroom[] {
  return list.slice().sort((a, b) => a.name.localeCompare(b.name, collatorLocale(), { numeric: true }));
}
