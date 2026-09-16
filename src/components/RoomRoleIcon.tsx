import { ICONS, type AdultSex } from "../icons";
import type { RoomRole } from "../api/staff";

/** Icon for a room role: head-only paper-cut (Líder / Auxiliar). */
export default function RoomRoleIcon({
  role,
  size,
  /** omit / null = assume woman until a kids' wing says otherwise */
  sex,
}: {
  role: RoomRole;
  size?: number;
  sex?: AdultSex | "F" | "M" | null;
}) {
  const man = sex === "man" || sex === "M";
  const src =
    role === "caretaker"
      ? man
        ? ICONS.leaderFace
        : ICONS.leaderFaceWoman
      : man
        ? ICONS.helperFace
        : ICONS.helperFaceWoman;
  return <img className="audience-icon" src={src} alt="" aria-hidden="true" style={size ? { width: size, height: size } : undefined} />;
}
