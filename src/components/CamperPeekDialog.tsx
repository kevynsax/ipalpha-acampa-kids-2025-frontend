import Dialog from "./Dialog";
import BedroomTag from "./BedroomTag";
import GuardianWhatsApp from "./GuardianWhatsApp";
import HealthAlerts from "./HealthAlerts";
import KidIcon from "./KidIcon";
import { ageOf } from "../api/campers";
import { kidSexOf } from "../icons";
import { formatBrazilPhoneClient } from "../phoneFormat";
import { useCamperDetail, useLabelOf } from "../store/derive";

interface CamperPeekDialogProps {
  /** null = closed */
  camperId: string | null;
  /** shown while the record is still syncing */
  name?: string;
  onClose: () => void;
}

/**
 * The kid's HEALTH card in a popup, opened from the medication checklist.
 *
 * Deliberately NOT the whole record: someone ticking a dose wants the health
 * picture (what the kid can't take, what they have, weight for the dose, the
 * convênio) and a way to reach the guardian — not school, church, documents
 * or transport.
 */
export default function CamperPeekDialog({ camperId, name, onClose }: CamperPeekDialogProps) {
  const data = useCamperDetail(camperId ?? "");
  const labelOf = useLabelOf();
  const k = data?.camper;
  const age = k ? ageOf(k.birthDate) : null;
  const sex = k ? (k.sex === "F" ? "girl" : k.sex === "M" ? "boy" : kidSexOf(data?.bedroom?.group)) : "girl";

  return (
    <Dialog open={!!camperId} onClose={onClose} title={name ?? "Criança"} width={520}>
      <div className="cat-form cat-form--plain">
        <header className="kid-peek__head">
          <KidIcon sex={sex} size={40} />
          <h2 className="cat-form__title kid-peek__name">
            {k?.name ?? name ?? "Criança"}
            {age !== null && <span className="kid-card__age">{age} anos</span>}
          </h2>
          {k && <GuardianWhatsApp camper={k} className="" />}
        </header>

        {!k ? (
          <p className="opt-empty">Sincronizando… 🏕️</p>
        ) : (
          <>
            <div className="staff-card__tags">
              {data?.bedroom && <BedroomTag bedroom={data.bedroom} />}
              {labelOf(k.bed) && <span className="staff-tag">Cama {labelOf(k.bed)!.toLowerCase()}</span>}
              {k.weightKg != null && <span className="staff-tag">{String(k.weightKg).replace(".", ",")} kg</span>}
            </div>

            <HealthAlerts person={k} labelOf={labelOf} boxed />

            <dl className="detail-grid kid-peek__contacts">
              {k.guardianName && (
                <>
                  <dt>Responsável</dt>
                  <dd>
                    {k.guardianName}
                    {k.guardianPhone && <> · {formatBrazilPhoneClient(k.guardianPhone)}</>}
                  </dd>
                </>
              )}
              {k.emergencyContact && (
                <>
                  <dt>Emergência</dt>
                  <dd>{k.emergencyContact}</dd>
                </>
              )}
              <dt>Convênio</dt>
              <dd>
                {k.insurance || "—"}
                {k.insuranceCard && <span className="cat-hint">· {k.insuranceCard}</span>}
              </dd>
            </dl>
          </>
        )}

        <div className="cat-form__actions">
          <button type="button" className="button button--secondary" onClick={onClose}>
            Fechar
          </button>
        </div>
      </div>
    </Dialog>
  );
}
