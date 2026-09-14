import { ROOM_ROLE_META, type RoomRole } from "../api/staff";

/** Icon for a room role: head-only paper-cut (Líder / Auxiliar); emoji fallback if missing. */
export default function RoomRoleIcon({ role, size }: { role: RoomRole; size?: number }) {
  const m = ROOM_ROLE_META[role];
  if (m.icon) return <img className="audience-icon" src={m.icon} alt="" aria-hidden="true" style={size ? { width: size, height: size } : undefined} />;
  return <span aria-hidden="true">{m.emoji}</span>;
}
