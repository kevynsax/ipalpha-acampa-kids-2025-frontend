import { useEffect } from "react";
import Breadcrumbs from "../../components/Breadcrumbs";
import HealthAlerts from "../../components/HealthAlerts";
import CamperCard from "../../components/CamperCard";
import KidIcon from "../../components/KidIcon";
import PlayScene from "../../components/PlayScene";
import { kidSexOf } from "../../icons";
import { GROUP_META, bedroomLabel } from "../../api/bedrooms";
import { ageOf, type Camper } from "../../api/campers";
import ParentIcon from "../../components/ParentIcon";
import StaffIcon from "../../components/StaffIcon";
import StaffMiniCard from "../../components/StaffMiniCard";
import WhatsAppButton from "../../components/WhatsAppButton";
import { loadAuth } from "../../auth/store";
import { formatBrazilPhoneClient } from "../../phoneFormat";
import { staffGreeting, whatsappLink } from "../../whatsapp";
import { useCamperDetail, useLabelOf } from "../../store/derive";
import type { DetailNav } from "./DetailStack";

interface CamperDetailProps {
  token: string;
  camperId: string;
  nav: DetailNav;
  /** absent = read-only (medical team, or opened from another page): no pencil */
  onEdit?: (camper: Camper) => void;
  onOpenStaff?: (staffId: string) => void;
  onOpenCamper?: (camperId: string) => void;
  onOpenBedroom?: (bedroomId: string) => void;
}

function fmtDate(iso: string | null): string | null {
  if (!iso) return null;
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

/** One kid: full registration info, the room + caretakers, and roommates. */
export default function CamperDetail({ camperId, nav, onEdit, onOpenStaff, onOpenCamper, onOpenBedroom }: CamperDetailProps) {
  // joined locally from the store — works offline and updates live
  const data = useCamperDetail(camperId);
  const error = data === undefined ? "Acampante não encontrado." : null;
  const labelOf = useLabelOf();
  const myName = loadAuth()?.user.name ?? "";
  const { setTitle } = nav;
  useEffect(() => {
    if (data) setTitle(data.camper.name.split(" ")[0]);
  }, [data, setTitle]);

  if (!data) {
    return (
      <div className="admin-page">
        <Breadcrumbs items={nav.crumbs} />
        {error ? <p className="message message--error">{error}</p> : <p className="opt-empty">Sincronizando… 🏕️</p>}
      </div>
    );
  }

  const { camper: k, bedroom, caretakers, roommates } = data;
  const age = ageOf(k.birthDate);
  const sex = k.sex === "F" ? "girl" : k.sex === "M" ? "boy" : kidSexOf(bedroom?.group);

  return (
    <div className="admin-page">
      <Breadcrumbs items={nav.crumbs} />
      <header className="admin-head">
        <h1 className="admin-title detail-title">
          <KidIcon sex={sex} size={40} />
          {k.name}
          {age !== null && <span className="kid-card__age">{age} anos</span>}
        </h1>
        {onEdit && (
          <button type="button" className="icon-btn icon-btn--lg" title="Editar" aria-label="Editar" onClick={() => onEdit(k)}>
            ✏️
          </button>
        )}
      </header>

      <section className="detail-card">
        <dl className="detail-grid">
          <dt>Nascimento</dt>
          <dd>{fmtDate(k.birthDate) ?? "—"}</dd>
          <dt>Peso</dt>
          <dd>{k.weightKg != null ? `${String(k.weightKg).replace(".", ",")} kg` : "—"}</dd>
          <dt>Time</dt>
          <dd>{labelOf(k.team) ?? "—"}</dd>
          <dt>Quarto</dt>
          <dd>
            {bedroom ? (
              onOpenBedroom ? (
                <button type="button" className="link-chip" title="Ver quarto" onClick={() => onOpenBedroom(bedroom.id)}>
                  🛏️ {bedroomLabel(bedroom)} ›
                </button>
              ) : (
                bedroomLabel(bedroom)
              )
            ) : (
              "—"
            )}
            {labelOf(k.bed) && <span className="staff-tag">Cama {labelOf(k.bed)!.toLowerCase()}</span>}
          </dd>
          <dt>Transporte</dt>
          <dd>{labelOf(k.transportation) ?? "—"}</dd>
          {k.bedroomPreference && (
            <>
              <dt>Quer ficar com</dt>
              <dd>{k.bedroomPreference}</dd>
            </>
          )}
          {k.caretaker && (
            <>
              <dt>Tio(a)</dt>
              <dd>{k.caretaker}</dd>
            </>
          )}
          {(k.school || k.schoolGrade) && (
            <>
              <dt>Escola</dt>
              <dd>{[k.school, k.schoolGrade].filter(Boolean).join(" · ")}</dd>
            </>
          )}
          {k.church && (
            <>
              <dt>Igreja</dt>
              <dd>{k.church}</dd>
            </>
          )}
          {k.invitedBy && (
            <>
              <dt>Convidado por</dt>
              <dd>{k.invitedBy}</dd>
            </>
          )}
          {(k.rg || k.cpf) && (
            <>
              <dt>Documentos</dt>
              <dd>{[k.rg && `RG ${k.rg}`, k.cpf && `CPF ${k.cpf}`].filter(Boolean).join(" · ")}</dd>
            </>
          )}
        </dl>
        <HealthAlerts person={k} labelOf={labelOf} boxed />
        {k.generalNotes && <p className="detail-note">📝 {k.generalNotes}</p>}
      </section>

      <section className="detail-section">
        <h2 className="detail-h2">
          <ParentIcon size={24} /> Pai ou Responsável
        </h2>
        <div className="detail-card">
          <dl className="detail-grid">
            <dt>Nome</dt>
            <dd>{k.guardianName || "—"}</dd>
            <dt>Telefone</dt>
            <dd>
              {k.guardianPhone ? (
                <>
                  {formatBrazilPhoneClient(k.guardianPhone)}
                  <WhatsAppButton
                    className="wa-btn--sm"
                    href={whatsappLink(k.guardianPhone, staffGreeting({ toName: k.guardianName, fromName: myName, about: k.name }))}
                    label={`Falar com ${k.guardianName.split(" ")[0] || "o responsável"} no WhatsApp`}
                  />
                </>
              ) : (
                <em className="staff-card__missing">não informado</em>
              )}
            </dd>
            {k.guardianEmail && (
              <>
                <dt>E-mail</dt>
                <dd>
                  <a href={`mailto:${k.guardianEmail}`}>{k.guardianEmail}</a>
                </dd>
              </>
            )}
            {k.guardianCpf && (
              <>
                <dt>CPF</dt>
                <dd>{k.guardianCpf}</dd>
              </>
            )}
            <dt>Emergência</dt>
            <dd>{k.emergencyContact || "—"}</dd>
            <dt>Convênio</dt>
            <dd>
              {k.insurance || "—"}
              {k.insuranceCard && <span className="cat-hint">· {k.insuranceCard}</span>}
            </dd>
          </dl>
        </div>
      </section>

      <section className="detail-section">
        <h2 className="detail-h2">
          <StaffIcon size={24} /> Responsáveis no quarto <span className="cat-tab__count">{caretakers.length}</span>
        </h2>
        {!bedroom && <p className="opt-empty">Sem quarto definido.</p>}
        {bedroom && caretakers.length === 0 && <p className="opt-empty">⚠️ Nenhum responsável da equipe no quarto {bedroom.name}.</p>}
        {caretakers.length > 0 && (
          <ul className="staff-list">
            {caretakers.map((s) => (
              <StaffMiniCard key={s.id} staff={s} labelOf={labelOf} onOpen={onOpenStaff} />
            ))}
          </ul>
        )}
      </section>

      {bedroom && (
        <section className="detail-section">
          <h2 className="detail-h2">
            <KidIcon sex={sex} group size={26} /> No mesmo quarto ({GROUP_META[bedroom.group].label} {bedroom.name}) <span className="cat-tab__count">{roommates.length}</span>
          </h2>
          {roommates.length === 0 ? (
            <p className="opt-empty">Sozinho(a) no quarto por enquanto.</p>
          ) : (
            <ul className="kid-list">
              {roommates.map((r) => (
                <CamperCard key={r.id} camper={r} labelOf={labelOf} hideBedroom onOpen={onOpenCamper} />
              ))}
            </ul>
          )}
        </section>
      )}

      <PlayScene sex={sex} />
    </div>
  );
}
