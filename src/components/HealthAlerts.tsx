/**
 * The health lines of a person (kid or staff), one per kind, icon only — no
 * "Alergias:" prefix, the icon says it. The `title` keeps the wording for
 * screen readers / hover.
 *
 *   ⚠️ chronic conditions   🤮 allergies   🚫💊 drug allergies (must NOT take)
 *   💊 daily medicines      🍽️ food restrictions   🩺 extra medical notes
 */
import type { ReactNode } from "react";
import NoPillIcon from "./NoPillIcon";

export interface HealthLike {
  allergies: string[];
  drugAllergies: string[];
  healthIssues: string[];
  medicines: string;
  foodRestrictions: string;
  healthNotes: string;
  /** kids only (admin / medical view) */
  neurodivergent?: boolean;
}

interface HealthAlertsProps {
  person: HealthLike;
  labelOf: (id: string | null | undefined) => string | null;
  /** wrap in the `.detail-alerts` box (detail pages) instead of bare lines (cards) */
  boxed?: boolean;
}

export function healthLines(p: HealthLike, labelOf: HealthAlertsProps["labelOf"]) {
  const health = p.healthIssues.map(labelOf).filter(Boolean) as string[];
  const allergies = p.allergies.map(labelOf).filter(Boolean) as string[];
  const drugs = p.drugAllergies.map(labelOf).filter(Boolean) as string[];
  const lines: { icon: ReactNode; title: string; text: string; soft?: boolean }[] = [];
  if (health.length) lines.push({ icon: "⚠️", title: "Condição de saúde", text: health.join(", ") });
  if (p.neurodivergent) lines.push({ icon: "🧩", title: "Neurodivergente", text: "Neurodivergente" });
  if (allergies.length) lines.push({ icon: "🤮", title: "Alergias", text: allergies.join(", ") });
  if (drugs.length) lines.push({ icon: <NoPillIcon />, title: "Não pode tomar", text: drugs.join(", ") });
  if (p.medicines) lines.push({ icon: "💊", title: "Medicação", text: p.medicines });
  if (p.foodRestrictions) lines.push({ icon: "🍽️", title: "Alimentação", text: p.foodRestrictions });
  if (p.healthNotes) lines.push({ icon: "🩺", title: "Observações médicas", text: p.healthNotes, soft: true });
  return lines;
}

export default function HealthAlerts({ person, labelOf, boxed }: HealthAlertsProps) {
  const lines = healthLines(person, labelOf);
  if (lines.length === 0) return null;
  const items = lines.map((l) => (
    <p key={l.title} className={`staff-card__alert ${l.soft ? "staff-card__alert--soft" : ""}`} title={l.title}>
      <span className="staff-card__alert-icon" role="img" aria-label={l.title}>
        {l.icon}
      </span>{" "}
      {l.text}
    </p>
  ));
  return boxed ? <div className="detail-alerts">{items}</div> : <>{items}</>;
}
