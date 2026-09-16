import type { Camper } from "./api/campers";
import type { RoomRole, Staff } from "./api/staff";

/**
 * The "Montar quartos" draft.
 *
 * Every change made on the board (kids and staff dragged between rooms, roles
 * swapped) lives ONLY in this device's memory + localStorage — nothing goes
 * to the server until Concluir. Leaving the page keeps the draft, so the
 * admin can come back later and continue where they stopped; "Descartar
 * alterações" throws it away.
 */
export interface RoomsDraft {
  /** kid id → their room + líder in the draft */
  campers: Record<string, { bedroom: string | null; caretakerId: string | null }>;
  /** team member id → their room + role in the draft */
  staff: Record<string, { bedroom: string | null; roomRole: RoomRole }>;
  /** ISO — when the draft was last touched */
  savedAt: string;
}

const KEY = "acampa.roomsDraft.v1";

export function emptyRoomsDraft(): RoomsDraft {
  return { campers: {}, staff: {}, savedAt: "" };
}

export function loadRoomsDraft(): RoomsDraft {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return emptyRoomsDraft();
    const d = JSON.parse(raw) as Partial<RoomsDraft>;
    const campers: RoomsDraft["campers"] = {};
    for (const [id, v] of Object.entries(d.campers ?? {})) {
      if (v && typeof v === "object") campers[id] = { bedroom: v.bedroom ?? null, caretakerId: v.caretakerId ?? null };
    }
    const staff: RoomsDraft["staff"] = {};
    for (const [id, v] of Object.entries(d.staff ?? {})) {
      if (v && typeof v === "object") staff[id] = { bedroom: v.bedroom ?? null, roomRole: v.roomRole === "caretaker" ? "caretaker" : "helper" };
    }
    return { campers, staff, savedAt: typeof d.savedAt === "string" ? d.savedAt : "" };
  } catch {
    return emptyRoomsDraft();
  }
}

export function saveRoomsDraft(d: RoomsDraft): void {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...d, savedAt: new Date().toISOString() }));
  } catch (err) {
    console.warn("rooms draft: could not persist", err);
  }
}

export function clearRoomsDraft(): void {
  localStorage.removeItem(KEY);
}

export function draftHasChanges(d: RoomsDraft): boolean {
  return Object.keys(d.campers).length > 0 || Object.keys(d.staff).length > 0;
}

/** the kid as the draft leaves them (the override on top of the server record) */
export function applyCamperDraft(k: Camper, d: RoomsDraft): Camper {
  const o = d.campers[k.id];
  return o ? { ...k, bedroom: o.bedroom, caretakerId: o.caretakerId } : k;
}

/** the team member as the draft leaves them */
export function applyStaffDraft(s: Staff, d: RoomsDraft): Staff {
  const o = d.staff[s.id];
  return o ? { ...s, bedroom: o.bedroom, roomRole: o.roomRole } : s;
}

export interface RoomsDelta {
  staff: { id: string; bedroom: string | null; roomRole: RoomRole }[];
  campers: { id: string; bedroom: string | null; caretakerId: string | null }[];
}

/** only the overrides that still differ from the server — what Concluir sends */
export function roomsDelta(d: RoomsDraft, campers: Camper[], staff: Staff[]): RoomsDelta {
  const out: RoomsDelta = { staff: [], campers: [] };
  for (const s of staff) {
    const o = d.staff[s.id];
    if (o && (o.bedroom !== s.bedroom || o.roomRole !== s.roomRole)) out.staff.push({ id: s.id, bedroom: o.bedroom, roomRole: o.roomRole });
  }
  for (const k of campers) {
    const o = d.campers[k.id];
    if (o && (o.bedroom !== k.bedroom || o.caretakerId !== k.caretakerId)) out.campers.push({ id: k.id, bedroom: o.bedroom, caretakerId: o.caretakerId });
  }
  return out;
}
