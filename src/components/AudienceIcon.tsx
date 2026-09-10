import { AUDIENCE_META, type CategoryAudience } from "../api/categories";

/** Icon for a category audience: paper-cut image when available, emoji otherwise. */
export default function AudienceIcon({ audience }: { audience: CategoryAudience }) {
  const m = AUDIENCE_META[audience];
  if (m.icon) return <img className="audience-icon" src={m.icon} alt="" aria-hidden="true" />;
  return <span aria-hidden="true">{m.emoji}</span>;
}
