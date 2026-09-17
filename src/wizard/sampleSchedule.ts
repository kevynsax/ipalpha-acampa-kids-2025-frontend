import { createEvent, createRole, type CampEvent, type ScheduleRole } from "../api/schedule";
import { updateSettings } from "../api/settings";
import { TEMPLATE_EVENTS, TEMPLATE_ROLES } from "./scheduleTemplate";
import { addDays, type SampleSchedulePlan } from "./sampleScheduleDates";

const norm = (s: string) => s.trim().toLocaleLowerCase("pt-BR").replace(/\s+/g, " ");

/**
 * Stamps the sample schedule: access + check-in windows, then the template
 * roles (reusing same-name ones) and events on firstDay..+2. Events are only
 * created when the camp has none, so re-running never duplicates the programme.
 */
export async function applySampleSchedule(
  token: string,
  plan: SampleSchedulePlan,
  existing: { roles: Pick<ScheduleRole, "id" | "name">[]; events: Pick<CampEvent, "id">[] },
): Promise<{ roles: number; events: number }> {
  await updateSettings(token, {
    staffAccessWindow: plan.staffAccessWindow,
    parentAccessWindow: plan.parentAccessWindow,
    checkinWindow: plan.checkinWindow,
    busReturnWindow: plan.busReturnWindow,
  });
  const byName = new Map(existing.roles.map((r) => [norm(r.name), r.id]));
  const keyToId = new Map<string, string>();
  let roles = 0;
  for (const t of TEMPLATE_ROLES) {
    const found = byName.get(norm(t.name));
    if (found) {
      keyToId.set(t.key, found);
      continue;
    }
    const created = await createRole(token, {
      name: t.name,
      emoji: t.emoji,
      instructions: "",
      preparation: "",
      forRoomRoles: t.forRoomRoles,
      hasDetail: !!t.hasDetail,
      detailFromTeam: !!t.detailFromTeam,
      detailPlaceholder: t.detailPlaceholder ?? "",
    });
    keyToId.set(t.key, created.id);
    roles++;
  }
  let events = 0;
  if (existing.events.length === 0) {
    for (const ev of TEMPLATE_EVENTS) {
      await createEvent(token, {
        date: addDays(plan.firstDay, ev.day - 1),
        title: ev.title,
        emoji: ev.emoji,
        startTime: ev.start,
        endTime: ev.end,
        notes: ev.notes ?? "",
        roles: ev.roles.map((k) => keyToId.get(k)).filter((x): x is string => !!x),
        visibleToParents: ev.visibleToParents !== false,
      });
      events++;
    }
  }
  return { roles, events };
}
