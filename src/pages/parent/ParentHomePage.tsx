import { useEffect, useState, type ReactNode } from "react";
import BedroomTag from "../../components/BedroomTag";
import { ageOf, type Camper } from "../../api/campers";
import { staffSex, type Staff } from "../../api/staff";
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
import { kidIconSex } from "../../icons";
import { useCollectionOrEmpty } from "../../store";
import { formatBrazilPhoneClient } from "../../phoneFormat";
import type { LoggedUser } from "../../roles";
import { useLabelOf, useParentHome, type MyKid } from "../../store/derive";
import { staffGreeting, whatsappLink } from "../../whatsapp";
import TransportTag from "../../components/TransportTag";
import AttentionEditDialog from "./AttentionEditDialog";
import CheckinQrDialog from "./CheckinQrDialog";
import { speakBirth, speakWhen } from "../../dates";
import { useI18n } from "../../i18n";

interface ParentHomePageProps {
  user: LoggedUser;
  token: string;
  access: ParentAccess;
}


function ContactBody({ staff: s, title }: { staff: Staff; title?: ReactNode }) {
  const { tx } = useI18n();
  return (
    <>
      {title && <p className="parent-contact__title">{title}</p>}
      <h3 className="staff-card__name">{s.name}</h3>
      <p className="staff-card__meta">{s.phone ? formatBrazilPhoneClient(s.phone) : <em className="staff-card__missing">{tx("sem celular")}</em>}</p>
    </>
  );
}

/** Compact chip: important contacts sit in one stretching row. */
function ImportantContact({ staff: s, title, from }: { staff: Staff; title?: ReactNode; from: string }) {
  const { tx } = useI18n();
  return (
    <li className="parent-chip">
      <div className="parent-chip__body">
        <ContactBody staff={s} title={title} />
      </div>
      {s.phone && <WhatsAppButton className="wa-btn--sm" href={whatsappLink(s.phone, staffGreeting({ toName: s.name, fromName: from }))} label={tx("Falar com {name} no WhatsApp", { name: s.name.split(" ")[0] })} />}
    </li>
  );
}

/** Full-width card for the kid's room team — same padding as the identity card. */
function TeamContact({ staff: s, title, from, about }: { staff: Staff; title?: ReactNode; from: string; about?: string }) {
  const { tx } = useI18n();
  return (
    <li className="parent-team-card">
      <div className="parent-team-card__body">
        <ContactBody staff={s} title={title} />
      </div>
      {s.phone && <WhatsAppButton href={whatsappLink(s.phone, staffGreeting({ toName: s.name, fromName: from, about }))} label={tx("Falar com {name} no WhatsApp", { name: s.name.split(" ")[0] })} />}
    </li>
  );
}

/** One kid: registration data, the team looking after them, the "Pontos de atenção" block and the QR code. */
function KidSection({ kid, token, user, showTeam }: { kid: MyKid; token: string; user: LoggedUser; showTeam: boolean }) {
  const { tx } = useI18n();
  const { camper: k, bedroom, caretaker, roomStaff } = kid;
  const labelOf = useLabelOf();
  const bedrooms = useCollectionOrEmpty("bedrooms");
  const [editing, setEditing] = useState(false);
  const age = ageOf(k.birthDate);
  const sex = kidIconSex(bedroom?.group, k.sex, k.probableGender);
  const first = k.name.split(" ")[0];
  const bedLabel = labelOf(k.bed);

  return (
    <section className="detail-section parent-kid">
      <header className="admin-head">
        <h2 className="admin-title detail-title">
          <KidIcon sex={sex} size={40} />
          <span className="parent-kid__identity">
            <span className="parent-kid__name">{k.name}</span>
            {age !== null && <span className="kid-card__age">{tx("{age} anos", { age })}</span>}
          </span>
          <span className="parent-kid__break" aria-hidden="true" />
          {k.checkin && <span className="parent-kid__status staff-tag staff-tag--here">{tx("✅ check-in feito")}</span>}
        </h2>
      </header>

      <div className="detail-card">
        <dl className="detail-grid">
          <dt>{tx("Nascimento")}</dt>
          <dd>{speakBirth(k.birthDate) ?? "—"}</dd>
          <dt>{tx("Time")}</dt>
          <dd>
            <TeamTag teamId={k.team} fallback="—" />
          </dd>
          <dt>{tx("Quarto")}</dt>
          <dd>
            {bedroom ? <BedroomTag bedroom={bedroom} /> : "—"}
            {bedLabel && <span className="staff-tag">{tx("Cama {bed}", { bed: bedLabel.toLowerCase() })}</span>}
          </dd>
          <dt>{tx("Transporte")}</dt>
          <dd>{k.transportation ? <TransportTag transportId={k.transportation} /> : "—"}</dd>
          <dt>{tx("Líder")}</dt>
          <dd>{showTeam ? (caretaker ? <><RoomRoleIcon role="caretaker" sex={staffSex(caretaker, bedrooms)} /> {caretaker.name}</> : "—") : <em className="staff-card__missing">{tx("disponível a partir do check-in")}</em>}</dd>
        </dl>
      </div>

      {showTeam && (
        <div className="detail-section">
          <h3 className="detail-h2">
            <StaffIcon size={24} /> {tx("Equipe que cuida de {name}", { name: first })}
          </h3>
          {!caretaker && roomStaff.length === 0 ? (
            <p className="opt-empty">{tx("A equipe do quarto ainda não foi definida.")}</p>
          ) : (
            <ul className="parent-team">
              {caretaker && <TeamContact staff={caretaker} title={<><RoomRoleIcon role="caretaker" sex={staffSex(caretaker, bedrooms)} /> {tx("Líder de {name}", { name: first })}</>} from={user.name} about={k.name} />}
              {roomStaff.map((s) => (
                <TeamContact key={s.id} staff={s} title={bedroom ? tx("Equipe do quarto {name}", { name: bedroom.name }) : tx("Equipe do quarto")} from={user.name} about={k.name} />
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="detail-section">
        <div className="detail-h2-row">
          <h3 className="detail-h2">{tx("⚠️ Pontos de atenção")}</h3>
          <button type="button" className="button button--edit" onClick={() => setEditing(true)}>
            <span className="pencil" aria-hidden="true">✏️</span> {tx("Editar")}
          </button>
        </div>
        <div className="detail-card">
          <dl className="detail-grid">
            <dt>{tx("Peso")}</dt>
            <dd>{k.weightKg != null ? tx("{weight} kg", { weight: String(k.weightKg).replace(".", ",") }) : "—"}</dd>
            <dt>{tx("Convênio")}</dt>
            <dd>
              {k.insurance || "—"}
              {k.insuranceCard && <span className="cat-hint">{tx("· carteirinha {n}", { n: k.insuranceCard })}</span>}
            </dd>
          </dl>
          <HealthAlerts person={k} labelOf={labelOf} boxed />
          {!k.allergies.length && !k.drugAllergies.length && !k.healthIssues.length && !k.medications.length && !k.foodRestrictions && !k.healthNotes && (
            <p className="cat-hint">{tx("Nenhuma alergia, condição ou medicação informada.")}</p>
          )}
          <p className="detail-note">📝 {k.generalNotes || <em className="staff-card__missing">{tx("sem observações")}</em>}</p>
        </div>
      </div>

      <div className="detail-section parent-qr">
        <h3 className="detail-h2">{tx("🎟️ QR code de {name}", { name: first })}</h3>
        <p className="admin-intro">{tx("Mostre à equipe na entrada do acampamento para o check-in.")}</p>
        <CamperQr camperId={k.id} name={k.name} />
      </div>

      {editing && <AttentionEditDialog token={token} open camper={k} onClose={() => setEditing(false)} />}
    </section>
  );
}

/**
 * "Início" for a PARENT: the important contacts — always, for as long as the
 * parent may use the app — then the selected kid: registration data, the team
 * looking after them (parents' window only), the editable "Pontos de atenção"
 * and the QR code. Before the check-in starts and after the last event the
 * ROOM TEAM is not sent by the server; the contacts are.
 */
export default function ParentHomePage({ user, token, access }: ParentHomePageProps) {
  const { tx } = useI18n();
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
        <p className="opt-empty">{tx("Sincronizando com o servidor… 🏕️")}</p>
      </div>
    );
  }

  if (data.kids.length === 0) {
    return (
      <div className="admin-page">
        <h1 className="admin-title">{tx("Olá, {name}! 👋", { name: first })}</h1>
        <p className="opt-empty">
          {tx("Não encontramos nenhuma criança inscrita com o seu celular.")}
          <br />
          {tx("Fale com a organização para ajustar o cadastro.")}
        </p>
      </div>
    );
  }

  const kids: Camper[] = data.kids.map((k) => k.camper);
  const selectedKid = data.kids.find((kid) => kid.camper.id === selectedKidId) ?? data.kids[0];
  const sex = kidIconSex(selectedKid.bedroom?.group, selectedKid.camper.sex, selectedKid.camper.probableGender);

  return (
    <div className="admin-page">
      <h1 className="admin-title">{tx("Olá, {name}! 👋", { name: first })}</h1>
      <p className="admin-intro">
        {access.open
          ? tx("O acampamento está rolando! Aqui estão os contatos e as informações das suas crianças.")
          : access.opensAt && new Date(access.opensAt).getTime() > Date.now()
            ? tx("A equipe do quarto aparece aqui a partir do check-in ({when}).", { when: speakWhen(access.opensAt, { long: true }) })
            : tx("O acampamento terminou. Obrigado por confiar em nós! 💚")}
      </p>

      <CheckinQrDialog kids={kids} active={access.checkin} />

      {/* the numbers to call — shown the whole time the parent has access, not only during the camp */}
      {data.contacts.length > 0 && (
        <section className="detail-section">
          <h2 className="detail-h2">📞 {tx("Contatos importantes")}</h2>
          <ul className="parent-contacts">
            {data.contacts.map((c) => (
              <ImportantContact key={c.id} staff={c.staff} title={c.title} from={user.name} />
            ))}
          </ul>
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
