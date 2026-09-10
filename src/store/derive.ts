import { useMemo } from "react";
import type { Bedroom, BedroomDetail } from "../api/bedrooms";
import type { Camper, CamperDetail } from "../api/campers";
import type { Category, CategoryAudience } from "../api/categories";
import type { CampEvent, RoleDetail, ScheduleRole } from "../api/schedule";
import type { Staff, StaffDetail, StaffScheduleItem } from "../api/staff";
import { useCollection, useCollectionOrEmpty } from "./index";

/**
 * The `/detail` REST endpoints join several collections on the server. Since
 * every collection is already on the device, the same joins are done here —
 * so detail pages open instantly and work with no connection.
 * Each function mirrors its backend counterpart in routes/*.ts.
 */

const byName = <T extends { name: string }>(a: T, b: T) => a.name.localeCompare(b.name, "pt-BR", { sensitivity: "base" });

/** `null` while the collections haven't arrived; `undefined` when the id doesn't exist. */
export function useCamperDetail(camperId: string): CamperDetail | null | undefined {
  const campers = useCollection("campers");
  const staff = useCollectionOrEmpty("staff");
  const bedrooms = useCollectionOrEmpty("bedrooms");
  return useMemo(() => {
    if (!campers) return null;
    const k = campers.find((x) => x.id === camperId);
    if (!k) return undefined;
    const room = k.bedroom ? bedrooms.find((b) => b.id === k.bedroom) : null;
    return {
      camper: k,
      bedroom: room ? { id: room.id, name: room.name, group: room.group } : null,
      caretakers: k.bedroom ? staff.filter((s) => s.bedroom === k.bedroom).sort(byName) : [],
      roommates: k.bedroom ? campers.filter((x) => x.bedroom === k.bedroom && x.id !== k.id).sort(byName) : [],
    };
  }, [campers, staff, bedrooms, camperId]);
}

export function useBedroomDetail(bedroomId: string): BedroomDetail | null | undefined {
  const bedrooms = useCollection("bedrooms");
  const campers = useCollectionOrEmpty("campers");
  const staff = useCollectionOrEmpty("staff");
  return useMemo(() => {
    if (!bedrooms) return null;
    const b = bedrooms.find((x) => x.id === bedroomId);
    if (!b) return undefined;
    const kids = campers.filter((k) => k.bedroom === b.id).sort(byName);
    const people = staff.filter((s) => s.bedroom === b.id).sort(byName);
    const occupied = kids.length + people.length;
    return {
      bedroom: { ...b, occupied, occupiedCampers: kids.length, occupiedStaff: people.length, available: b.capacity - occupied },
      campers: kids,
      staff: people,
    };
  }, [bedrooms, campers, staff, bedroomId]);
}

export function useStaffDetail(staffId: string): StaffDetail | null | undefined {
  const staff = useCollection("staff");
  const campers = useCollectionOrEmpty("campers");
  const bedrooms = useCollectionOrEmpty("bedrooms");
  const events = useCollectionOrEmpty("events");
  const roles = useCollectionOrEmpty("roles");
  return useMemo(() => {
    if (!staff) return null;
    const s = staff.find((x) => x.id === staffId);
    if (!s) return undefined;
    const roleById = new Map(roles.map((r) => [r.id, r]));
    const room = s.bedroom ? bedrooms.find((b) => b.id === s.bedroom) : null;

    const schedule: StaffScheduleItem[] = [];
    for (const e of events) {
      // explicit assignment wins; otherwise a "for everyone" role of the event applies (active members only)
      const a = e.assignments.find((x) => x.staffId === s.id);
      const everyone = !a && s.active ? e.roles.map((id) => roleById.get(id)).find((r) => r?.forEveryone) : undefined;
      const r = a ? roleById.get(a.roleId) : everyone;
      if (!a && !everyone) continue;
      const fallback = e.roles.map((id) => roleById.get(id)).find((x) => x?.forEveryone);
      schedule.push({
        eventId: e.id,
        date: e.date,
        startTime: e.startTime,
        endTime: e.endTime,
        title: e.title,
        emoji: e.emoji,
        role: r ? { id: r.id, name: r.name, emoji: r.emoji, instructions: r.instructions } : null,
        detail: a?.detail ?? "",
        implicit: !a,
        defaultRole: fallback ? { id: fallback.id, name: fallback.name, emoji: fallback.emoji } : null,
      });
    }
    schedule.sort((x, y) => x.date.localeCompare(y.date) || x.startTime.localeCompare(y.startTime) || x.title.localeCompare(y.title, "pt-BR"));

    return {
      staff: s,
      bedroom: room ? { id: room.id, name: room.name, group: room.group } : null,
      schedule,
      campers: s.bedroom ? campers.filter((k) => k.bedroom === s.bedroom).sort(byName) : [],
      roommates: s.bedroom ? staff.filter((x) => x.bedroom === s.bedroom && x.id !== s.id).sort(byName) : [],
    };
  }, [staff, campers, bedrooms, events, roles, staffId]);
}

export interface MyRoom {
  /** the logged-in person's staff record (matched by phone) */
  me: Staff;
  bedroom: Bedroom | null;
  /** kids sleeping in the room — the ones this person looks after */
  campers: Camper[];
  /** other team members in the same room */
  roommates: Staff[];
}

/**
 * The room view for the logged-in team member: `null` while syncing,
 * `undefined` when no staff record carries this phone.
 */
export function useMyRoom(phone: string): MyRoom | null | undefined {
  const staff = useCollection("staff");
  const campers = useCollectionOrEmpty("campers");
  const bedrooms = useCollectionOrEmpty("bedrooms");
  return useMemo(() => {
    if (!staff) return null;
    const me = staff.find((s) => s.phone === phone);
    if (!me) return undefined;
    const bedroom = me.bedroom ? (bedrooms.find((b) => b.id === me.bedroom) ?? null) : null;
    return {
      me,
      bedroom,
      campers: me.bedroom ? campers.filter((k) => k.bedroom === me.bedroom).sort(byName) : [],
      roommates: me.bedroom ? staff.filter((s) => s.bedroom === me.bedroom && s.id !== me.id).sort(byName) : [],
    };
  }, [staff, campers, bedrooms, phone]);
}

export interface MyPrepRole {
  role: ScheduleRole;
  /** distinct assignment details across events ("Base 3", "Time Belém"…) */
  details: string[];
  /** how many events the person does this role in */
  eventCount: number;
  /** the moments the person does this role in, in programme order (with that event's detail) */
  events: { id: string; date: string; startTime: string; endTime: string | null; title: string; emoji: string; detail: string }[];
}

/**
 * The roles the logged-in person fulfils in ANY event (explicit assignment,
 * or a "for everyone" default), de-duplicated — what their Preparação page
 * lists. For non-admins the server already scoped the events to their own
 * roles, but the same computation works on the full data an admin receives.
 * `null` while syncing; empty when the phone isn't a staff member.
 */
export function useMyPrepRoles(phone: string): MyPrepRole[] | null {
  const staff = useCollection("staff");
  const events = useCollection("events");
  const roles = useCollectionOrEmpty("roles");
  return useMemo(() => {
    if (!staff || !events) return null;
    const me = staff.find((s) => s.phone === phone);
    if (!me) return [];
    const roleById = new Map(roles.map((r) => [r.id, r]));
    const acc = new Map<string, MyPrepRole>();
    const add = (r: ScheduleRole | undefined, detail: string, e: CampEvent) => {
      if (!r) return;
      const cur = acc.get(r.id) ?? { role: r, details: [], eventCount: 0, events: [] };
      cur.eventCount++;
      if (detail && !cur.details.includes(detail)) cur.details.push(detail);
      cur.events.push({ id: e.id, date: e.date, startTime: e.startTime, endTime: e.endTime, title: e.title, emoji: e.emoji, detail });
      acc.set(r.id, cur);
    };
    const ordered = [...events].sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime) || a.title.localeCompare(b.title, "pt-BR"));
    for (const e of ordered) {
      const a = e.assignments.find((x) => x.staffId === me.id);
      if (a) add(roleById.get(a.roleId), a.detail, e);
      else if (me.active) for (const id of e.roles) if (roleById.get(id)?.forEveryone) add(roleById.get(id), "", e);
    }
    return [...acc.values()].sort((x, y) => byName(x.role, y.role));
  }, [staff, events, roles, phone]);
}

export function useRoleDetail(roleId: string): RoleDetail | null | undefined {
  const roles = useCollection("roles");
  const events = useCollectionOrEmpty("events");
  const staff = useCollectionOrEmpty("staff");
  return useMemo(() => {
    if (!roles) return null;
    const r = roles.find((x) => x.id === roleId);
    if (!r) return undefined;
    const active = staff.filter((s) => s.active);
    const usedIn = events
      .filter((e) => e.roles.includes(r.id))
      .map((e) => {
        const people = r.forEveryone
          ? active.filter((s) => !e.assignments.some((a) => a.staffId === s.id)).map((s) => ({ staffId: s.id, name: s.name, detail: "" }))
          : e.assignments
              .filter((a) => a.roleId === r.id)
              .map((a) => ({ staffId: a.staffId, name: staff.find((s) => s.id === a.staffId)?.name ?? "?", detail: a.detail }))
              .sort(byName);
        return { eventId: e.id, date: e.date, startTime: e.startTime, endTime: e.endTime, title: e.title, emoji: e.emoji, people };
      });
    return { role: r, events: usedIn };
  }, [roles, events, staff, roleId]);
}

/** Categories that apply to `audience` (all when omitted) — same as GET /api/categories?audience=. */
export function useCategories(audience?: CategoryAudience): Category[] {
  const all = useCollectionOrEmpty("categories");
  return useMemo(() => (audience ? all.filter((c) => c.appliesTo.includes(audience)) : all), [all, audience]);
}

/** option id → label across every category. */
export function useLabelOf(): (id: string | null | undefined) => string | null {
  const all = useCollectionOrEmpty("categories");
  return useMemo(() => {
    const map = new Map<string, string>();
    for (const c of all) for (const o of c.options) map.set(o.id, o.label);
    return (id: string | null | undefined) => (id ? (map.get(id) ?? null) : null);
  }, [all]);
}
