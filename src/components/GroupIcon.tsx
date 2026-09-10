import { GROUP_META, type BedroomGroup } from "../api/bedrooms";

/** Icon for a bedroom wing: paper-cut image when available, emoji otherwise. */
export default function GroupIcon({ group }: { group: BedroomGroup }) {
  const m = GROUP_META[group];
  if (m.icon) return <img className="audience-icon" src={m.icon} alt="" aria-hidden="true" />;
  return <span aria-hidden="true">{m.emoji}</span>;
}
