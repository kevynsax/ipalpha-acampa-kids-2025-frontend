import { GROUP_META, type BedroomGroup } from "../api/bedrooms";

interface GroupIconProps {
  group: BedroomGroup;
  /** head only (girl with pigtails / boy in the cap) — for inline chips and tabs */
  face?: boolean;
  size?: number;
}

/** Icon for a bedroom wing. */
export default function GroupIcon({ group, face, size }: GroupIconProps) {
  const m = GROUP_META[group];
  const src = face ? (m.face ?? m.icon) : m.icon;
  if (!src) return null;
  const style = size ? { width: size, height: size } : undefined;
  return <img className="audience-icon" src={src} alt="" aria-hidden="true" style={style} />;
}
