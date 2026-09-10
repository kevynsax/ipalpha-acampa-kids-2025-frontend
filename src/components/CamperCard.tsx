import type { ReactNode } from "react";
import { ageOf, type Camper } from "../api/campers";
import HealthAlerts from "./HealthAlerts";

interface CamperCardProps {
  camper: Camper;
  labelOf: (id: string | null | undefined) => string | null;
  /** hide the bedroom tag (when already in a room context) */
  hideBedroom?: boolean;
  bedroomLabel?: string | null;
  /** click → open the kid's page */
  onOpen?: (camperId: string) => void;
  /** pinned to the top-right corner (e.g. the WhatsApp button to the guardian) */
  corner?: ReactNode;
}

/** One kid: name, age, bed / team / transport tags + health alerts. Click navigates to the kid. */
export default function CamperCard({ camper: k, labelOf, hideBedroom, bedroomLabel, onOpen, corner }: CamperCardProps) {
  const age = ageOf(k.birthDate);

  const tags = [
    !hideBedroom && bedroomLabel,
    labelOf(k.bed) && `Cama ${labelOf(k.bed)!.toLowerCase()}`,
    labelOf(k.team),
    labelOf(k.transportation),
  ].filter(Boolean) as string[];


  const body = (
    <>
      <div className="kid-card__body">
        <h4 className="kid-card__name">
          {k.name}
          {age !== null && <span className="kid-card__age">{age} anos</span>}
        </h4>
        {tags.length > 0 && (
          <div className="staff-card__tags">
            {tags.map((t) => (
              <span key={t} className="staff-tag">
                {t}
              </span>
            ))}
          </div>
        )}
        <HealthAlerts person={k} labelOf={labelOf} />
      </div>
      {onOpen && <span className="kid-card__chevron" aria-hidden="true">›</span>}
    </>
  );

  return (
    <li className={`kid-card ${corner ? "kid-card--with-corner" : ""}`}>
      {corner && <div className="kid-card__corner">{corner}</div>}
      {onOpen ? (
        <button type="button" className="kid-card__main" title={`Ver ${k.name}`} onClick={() => onOpen(k.id)}>
          {body}
        </button>
      ) : (
        <div className="kid-card__main kid-card__main--static">{body}</div>
      )}
    </li>
  );
}
