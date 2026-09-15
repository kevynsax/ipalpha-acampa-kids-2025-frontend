import { useEffect, useState, type ReactNode } from "react";
import BedroomTag from "../../components/BedroomTag";
import { ageOf, type Camper } from "../../api/campers";
import type { Staff } from "../../api/staff";
import CamperQr from "../../components/CamperQr";
import HealthAlerts from "../../components/HealthAlerts";
import KidIcon from "../../components/KidIcon";
import ParentKidTabs from "../../components/ParentKidTabs";
import PlayScene from "../../components/PlayScene";
import StaffIcon from "../../components/StaffIcon";
import RoomRoleIcon from "../../components/RoomRoleIcon";
import TeamTag from "../../components/TeamTag";
import WhatsAppButton from "../../components/WhatsAppButton";
import type { ParentAccess } from "../../hooks/useParentWindow";
import { kidSexOf } from "../../icons";
import { formatBrazilPhoneClient } from "../../phoneFormat";
import type { LoggedUser } from "../../roles";
import { useLabelOf, useParentHome, type MyKid } from "../../store/derive";
import { staffGreeting, whatsappLink } from "../../whatsapp";
import TransportTag from "../../components/TransportTag";
import AttentionEditDialog from "./AttentionEditDialog";
import CheckinQrDialog from "./CheckinQrDialog";
import { speakBirth, speakWhen } from "../../dates";

interface ParentHomePageProps {
  user: LoggedUser;
  token: string;
  access: ParentAccess;
}


function ContactBody({ staff: s, title }: { staff: Staff; title?: ReactNode }) {
  return (
    <>
      {title && <p className="parent-contact__title">{title}</p>}
      <h3 className="staff-card__name">{s.name}</h3>
      <p className="staff-card__meta">{s.phone ? formatBrazilPhoneClient(s.phone) : <em className="staff-card__missing">sem celular</em>}</p>
    </>
  );
}

/** Compact chip: important contacts sit in one stretching row. */
function ImportantContact({ staff: s, title, from }: { staff: Staff; title?: ReactNode; from: string }) {
  return (
    <li className="parent-chip">
      <div className="parent-chip__body">
        <ContactBody staff={s} title={title} />
      </div>
      {s.phone && <WhatsAppButton className="wa-btn--sm" href={whatsappLink(s.phone, staffGreeting({ toName: s.name, fromName: from }))} label={`Falar com ${s.name.split(" ")[0]} no WhatsApp`} />}
    </li>
  );
}

/** Full-width card for the kid's room team — same padding as the identity card. */
function TeamContact({ staff: s, title, from, about }: { staff: Staff; title?: ReactNode; from: string; about?: string }) {
  return (
    <li className="parent-team-card">
      <div className="parent-team-card__body">
        <ContactBody staff={s} title={title} />
      </div>
      {s.phone && <WhatsAppButton href={whatsappLink(s.phone, staffGreeting({ toName: s.name, fromName: from, about }))} label={`Falar com ${s.name.split(" ")[0]} no WhatsApp`} />}
    </li>
  );
}

/** One kid: registration data, the team looking after them, the "Pontos de atenção" block and the QR code. */
function KidSection({ kid, token, user, showTeam }: { kid: MyKid; token: string; user: LoggedUser; showTeam: boolean }) {
  const { camper: k, bedroom, caretaker, roomStaff } = kid;
  const labelOf = useLabelOf();
  const [editing, setEditing] = useState(false);
  const age = ageOf(k.birthDate);
  const sex = k.sex === "F" ? "girl" : k.sex === "M" ? "boy" : kidSexOf(bedroom?.group);
  const first = k.name.split(" ")[0];

  return (
    <section className="detail-section parent-kid">
      <header className="admin-head">
        <h2 className="admin-title detail-title">
          <KidIcon sex={sex} size={40} />
          <span className="parent-kid__identity">
            <span className="parent-kid__name">{k.name}</span>
            {age !== null && <span className="kid-card__age">{age} anos</span>}
          </span>
          <span className="parent-kid__break" aria-hidden="true" />
          {k.checkin && <span className="parent-kid__status staff-tag staff-tag--here">✅ check-in feito</span>}
        </h2>
      </header>

      <div className="detail-card">
        <dl className="detail-grid">
          <dt>Nascimento</dt>
          <dd>{speakBirth(k.birthDate) ?? "—"}</dd>
          <dt>Time</dt>
          <dd>
            <TeamTag teamId={k.team} fallback="—" />
          </dd>
          <dt>Quarto</dt>
          <dd>
            {bedroom ? <BedroomTag bedroom={bedroom} /> : "—"}
            {labelOf(k.bed) && <span className="staff-tag">Cama {labelOf(k.bed)!.toLowerCase()}</span>}
          </dd>
          <dt>Transporte</dt>
          <dd>{k.transportation ? <TransportTag transportId={k.transportation} /> : "—"}</dd>
          <dt>Líder</dt>
          <dd>{showTeam ? (caretaker ? <><RoomRoleIcon role="caretaker" /> {caretaker.name}</> : "—") : <em className="staff-card__missing">disponível a partir do check-in</em>}</dd>
        </dl>
      </div>

      {showTeam && (
        <div className="detail-section">
          <h3 className="detail-h2">
            <StaffIcon size={24} /> Equipe que cuida de {first}
          </h3>
          {!caretaker && roomStaff.length === 0 ? (
            <p className="opt-empty">A equipe do quarto ainda não foi definida.</p>
          ) : (
            <ul className="parent-team">
              {caretaker && <TeamContact staff={caretaker} title={<><RoomRoleIcon role="caretaker" /> Líder de {first}</>} from={user.name} about={k.name} />}
              {roomStaff.map((s) => (
                <TeamContact key={s.id} staff={s} title={`Equipe do quarto${bedroom ? ` ${bedroom.name}` : ""}`} from={user.name} about={k.name} />
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="detail-section">
        <div className="detail-h2-row">
          <h3 className="detail-h2">⚠️ Pontos de atenção</h3>
          <button type="button" className="button button--edit" onClick={() => setEditing(true)}>
            <span className="pencil" aria-hidden="true">✏️</span> Editar
          </button>
        </div>
        <div className="detail-card">
          <dl className="detail-grid">
            <dt>Peso</dt>
            <dd>{k.weightKg != null ? `${String(k.weightKg).replace(".", ",")} kg` : "—"}</dd>
            <dt>Convênio</dt>
            <dd>
              {k.insurance || "—"}
              {k.insuranceCard && <span className="cat-hint">· carteirinha {k.insuranceCard}</span>}
            </dd>
          </dl>
          <HealthAlerts person={k} labelOf={labelOf} boxed />
          {!k.allergies.length && !k.drugAllergies.length && !k.healthIssues.length && !k.medications.length && !k.foodRestrictions && !k.healthNotes && (
            <p className="cat-hint">Nenhuma alergia, condição ou medicação informada.</p>
          )}
          <p className="detail-note">📝 {k.generalNotes || <em className="staff-card__missing">sem observações</em>}</p>
        </div>
      </div>

      <div className="detail-section parent-qr">
        <h3 className="detail-h2">🎟️ QR code de {first}</h3>
        <p className="admin-intro">Mostre à equipe na entrada do acampamento para o check-in.</p>
        <CamperQr camperId={k.id} name={k.name} />
      </div>

      {editing && <AttentionEditDialog token={token} open camper={k} onClose={() => setEditing(false)} />}
    </section>
  );
}

/**
 * "Início" for a PARENT: the important contacts (while the parents' window
 * is open), then the selected kid — registration data, the team looking after
 * them (window only), the editable "Pontos de atenção" and the QR code. Before
 * the check-in starts and after the last event only the kids' own data is
 * shown; the server does not even send the team then.
 */
export default function ParentHomePage({ user, token, access }: ParentHomePageProps) {
  const data = useParentHome();
  const first = user.name.split(" ")[0];
  const [selectedKidId, setSelectedKidId] = useState<string | null>(null);

  useEffect(() => {
    if (!data?.kids.length) return;
    if (!selectedKidId || !data.kids.some((kid) => kid.camper.id === selectedKidId)) {
      setSelectedKidId(data.kids[0].camper.id);
    }
  }, [data, selectedKidId]);

  if (data === null) {
    return (
      <div className="admin-page">
        <p className="opt-empty">Sincronizando com o servidor… 🏕️</p>
      </div>
    );
  }

  if (data.kids.length === 0) {
    return (
      <div className="admin-page">
        <h1 className="admin-title">Olá, {first}! 👋</h1>
        <p className="opt-empty">
          Não encontramos nenhuma criança inscrita com o seu celular.
          <br />
          Fale com a organização para ajustar o cadastro.
        </p>
      </div>
    );
  }

  const kids: Camper[] = data.kids.map((k) => k.camper);
  const selectedKid = data.kids.find((kid) => kid.camper.id === selectedKidId) ?? data.kids[0];
  const sex = kidSexOf(selectedKid.bedroom?.group);

  return (
    <div className="admin-page">
      <h1 className="admin-title">Olá, {first}! 👋</h1>
      <p className="admin-intro">
        {access.open
          ? "O acampamento está rolando! Aqui estão os contatos da equipe e as informações das suas crianças."
          : access.opensAt && new Date(access.opensAt).getTime() > Date.now()
            ? `Os contatos da equipe aparecem aqui a partir do check-in (${speakWhen(access.opensAt, { long: true })}).`
            : "O acampamento terminou. Obrigado por confiar em nós! 💚"}
      </p>

      <CheckinQrDialog kids={kids} active={access.checkin} />

      {access.open && (
        <section className="detail-section">
          <h2 className="detail-h2">📞 Contatos importantes</h2>
          {data.contacts.length === 0 ? (
            <p className="opt-empty">Nenhum contato divulgado ainda.</p>
          ) : (
            <ul className="parent-contacts">
              {data.contacts.map((c) => (
                <ImportantContact key={c.id} staff={c.staff} title={c.title} from={user.name} />
              ))}
            </ul>
          )}
        </section>
      )}

      <ParentKidTabs kids={data.kids} selectedId={selectedKid.camper.id} onSelect={setSelectedKidId} idPrefix="parent-kid-tab" panelId="parent-kid-panel" />

      <div
        id="parent-kid-panel"
        role={data.kids.length > 1 ? "tabpanel" : undefined}
        aria-labelledby={data.kids.length > 1 ? `parent-kid-tab-${selectedKid.camper.id}` : undefined}
        className="parent-kid-panel"
      >
        <KidSection key={selectedKid.camper.id} kid={selectedKid} token={token} user={user} showTeam={access.open} />
      </div>

      <PlayScene sex={sex} />
    </div>
  );
}
