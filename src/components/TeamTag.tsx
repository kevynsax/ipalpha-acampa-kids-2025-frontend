import type { CSSProperties } from "react";
import { type Team } from "../api/teams";
import { useTeamOf } from "../store/derive";

/**
 * Inline style painting a `.staff-tag` in the team's colour. The fill is the
 * colour softened towards white (so a vivid red / bright team doesn't pop),
 * with the full colour kept on the border + text for identity.
 */
export function teamTagStyle(t: Team): CSSProperties {
  return {
    background: `color-mix(in srgb, ${t.color} 22%, #fffdf8)`,
    borderColor: t.color,
    color: `color-mix(in srgb, ${t.color} 55%, #183d36)`,
  };
}

interface TeamTagProps {
  /** the team id on the record (null / unknown → nothing, or `fallback`) */
  teamId: string | null | undefined;
  /** shown when there is no team (default: nothing) */
  fallback?: string | null;
  title?: string;
  className?: string;
}

/**
 * A `.staff-tag` chip with the team's name, painted in the team's colour —
 * the ONE way a team is shown wherever a person's tags are listed.
 */
export default function TeamTag({ teamId, fallback = null, title = "Time", className = "" }: TeamTagProps) {
  const team = useTeamOf()(teamId);
  if (!team) {
    return fallback ? (
      <span className={`staff-tag ${className}`} title={title}>
        <em className="staff-card__missing">{fallback}</em>
      </span>
    ) : null;
  }
  return (
    <span className={`staff-tag staff-tag--team ${className}`} title={title} style={teamTagStyle(team)}>
      {team.name}
    </span>
  );
}
