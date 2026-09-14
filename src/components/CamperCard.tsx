import type { ReactNode } from "react";
import { ageOf, type Camper } from "../api/campers";
import HealthAlerts from "./HealthAlerts";
import TeamTag from "./TeamTag";
import TransportTag from "./TransportTag";

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

  const showBedroom = !hideBedroom && bedroomLabel;


  const body = (
    <>
      <div className="kid-card__body">
        <h4 className="kid-card__name">
          {k.name}
          {age !== null && <span className="kid-card__age">{age} anos</span>}
        </h4>
        {(showBedroom || k.team || k.transportation) && (
          <div className="staff-card__tags">
            {showBedroom && <span className="staff-tag">{bedroomLabel}</span>}
            <TeamTag teamId={k.team} />
            <TransportTag transportId={k.transportation} short />
          </div>
        )}
        <HealthAlerts person={k} labelOf={labelOf} />
      </div>
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
