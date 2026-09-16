import { isAutomatic, isForWholeTeam, type ScheduleRole } from "../api/schedule";
import { ROOM_ROLE_META, type RoomRole } from "../api/staff";
import { ICONS } from "../icons";

/**
 * How a função is linked to people. The ways ADD UP, so a função may show
 * more than one badge: the positions it falls on by itself (toda a equipe /
 * Líderes / Auxiliares) and, on an event, the people escalados by hand.
 */
export function positionsMeta(forRoomRoles: RoomRole[]): { label: string; icon: string; hint: string } | null {
  if (forRoomRoles.length === 0) return null;
  if (forRoomRoles.length >= 2) {
    return { label: "toda a equipe", icon: ICONS.staffPair, hint: "todos os voluntários ativos do evento" };
  }
  const m = ROOM_ROLE_META[forRoomRoles[0]];
  return { label: m.plural.toLowerCase(), icon: m.icon!, hint: `todo mundo que é ${m.label} no quarto` };
}

/** Badge for the positions a função falls on — nothing when it is only escalada by hand. */
export default function AutoRoleBadge({ role }: { role: Pick<ScheduleRole, "forRoomRoles"> }) {
  const m = positionsMeta(role.forRoomRoles);
  if (!m) return null;
  return (
    <span className="slot-item__badge slot-item__badge--everyone" title={m.hint}>
      <img className="audience-icon" src={m.icon} alt="" aria-hidden="true" /> {m.label}
    </span>
  );
}

/**
 * The whole link in one line, for lists: "toda a equipe", "os líderes + 2
 * escalados", "3 escalados". `picked` = how many people were added by hand.
 */
export function roleLinkLabel(role: Pick<ScheduleRole, "forRoomRoles">, picked: number): string {
  const positions = positionsMeta(role.forRoomRoles);
  const people = picked > 0 ? `${picked} escalado${picked === 1 ? "" : "s"}` : "";
  if (positions && people) return `${positions.label} + ${people}`;
  if (positions) return positions.label;
  return people || "ninguém ainda";
}

export { isAutomatic, isForWholeTeam };
