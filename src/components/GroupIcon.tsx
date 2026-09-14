import { GROUP_META, type BedroomGroup } from "../api/bedrooms";

interface GroupIconProps {
  group: BedroomGroup;
  /** head only (girl with pigtails / boy in the cap) — for inline chips and tabs */
  face?: boolean;
  size?: number;
}

/** Icon for a bedroom wing: paper-cut image when available, emoji otherwise. */
export default function GroupIcon({ group, face, size }: GroupIconProps) {
  const m = GROUP_META[group];
  const src = face ? (m.face ?? m.icon) : m.icon;
  const style = size ? { width: size, height: size } : undefined;
  if (src) return <img className="audience-icon" src={src} alt="" aria-hidden="true" style={style} />;
  return <span aria-hidden="true">{m.emoji}</span>;
}
