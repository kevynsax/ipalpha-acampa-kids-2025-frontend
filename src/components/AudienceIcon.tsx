import { AUDIENCE_META, type CategoryAudience } from "../api/categories";

/** Icon for a category audience. */
export default function AudienceIcon({ audience }: { audience: CategoryAudience }) {
  const m = AUDIENCE_META[audience];
  if (!m.icon) return null;
  return <img className="audience-icon" src={m.icon} alt="" aria-hidden="true" />;
}
