import { useEffect, useState } from "react";
import { ROOM_ROLE_META } from "../../api/staff";
import AssignLeaderDialog from "./AssignLeaderDialog";
import ChangeRoomDialog from "./ChangeRoomDialog";
import CamperHistoryDialog from "./CamperHistoryDialog";
import CamperFieldDialog, { type CamperQuickField } from "./CamperFieldDialog";
import Breadcrumbs from "../../components/Breadcrumbs";
import HealthAlerts, { healthLines } from "../../components/HealthAlerts";
import HealthEditDialog from "../../components/HealthEditDialog";
import CamperCard from "../../components/CamperCard";
import KidIcon from "../../components/KidIcon";
import PlayScene from "../../components/PlayScene";
import { ICONS, kidIconSex } from "../../icons";
import BedroomTag from "../../components/BedroomTag";
import { ageOf, type Camper } from "../../api/campers";
import ParentIcon from "../../components/ParentIcon";
import GuardianWhatsApp from "../../components/GuardianWhatsApp";
import StaffIcon from "../../components/StaffIcon";
import StaffMiniCard from "../../components/StaffMiniCard";
import TeamTag from "../../components/TeamTag";
import WhatsAppButton from "../../components/WhatsAppButton";
import { loadAuth } from "../../auth/store";
import { formatCpf } from "../../cpf";
import { formatBrazilPhoneClient } from "../../phoneFormat";
import { staffGreeting, whatsappLink } from "../../whatsapp";
import { useCollectionOrEmpty } from "../../store";
import { useCamperDetail, useLabelOf } from "../../store/derive";
import TransportTag from "../../components/TransportTag";
import type { DetailNav } from "./DetailStack";
import { speakBirth } from "../../dates";
import { useI18n } from "../../i18n";

interface CamperDetailProps {
  token: string;
  camperId: string;
  nav: DetailNav;
  /**
   * Emergency QR lookup: the kid may be OUTSIDE the viewer's realtime store.
   * When set, this record is shown instead of looking the id up locally
   * (room / caretaker / roommates still join from the store when present).
   */
  camperOverride?: Camper;
  /** room from the lookup response (out-of-scope kids aren't in the bedrooms store) */
  bedroomOverride?: { id: string; name: string; group: "girls" | "boys" | "staff" } | null;
  /** caretaker from the lookup response (name only) */
  caretakerOverride?: { id: string; name: string } | null;
  /** absent = read-only (medical team, or opened from another page): no pencil, no room change */
  onEdit?: (camper: Camper) => void;
  /** the MEDICAL team (or admin) may edit the kid's health block in place — the 🩺 pencil */
  canEditHealth?: boolean;
  onOpenStaff?: (staffId: string) => void;
  onOpenCamper?: (camperId: string) => void;
  onOpenBedroom?: (bedroomId: string) => void;
}


/** One kid: full registration info, the room + caretakers, and roommates. */
export default function CamperDetail({ token, camperId, nav, camperOverride, bedroomOverride, caretakerOverride, onEdit, canEditHealth, onOpenStaff, onOpenCamper, onOpenBedroom }: CamperDetailProps) {
  const { tx } = useI18n();
  const [moveOpen, setMoveOpen] = useState(false);
  const [leaderOpen, setLeaderOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [fieldOpen, setFieldOpen] = useState<CamperQuickField | null>(null);
  const [healthOpen, setHealthOpen] = useState(false);
  // joined locally from the store — works offline and updates live
  const data = useCamperDetail(camperId);
  const bedrooms = useCollectionOrEmpty("bedrooms");
  const staff = useCollectionOrEmpty("staff");
  const labelOf = useLabelOf();
  const myName = loadAuth()?.user.name ?? "";
  const { setTitle } = nav;

  // emergency lookup: the kid may not be in the local store at all
  const resolved = camperOverride
    ? (() => {
        const roomFromStore = camperOverride.bedroom ? bedrooms.find((b) => b.id === camperOverride.bedroom) : null;
        const room = bedroomOverride ?? (roomFromStore ? { id: roomFromStore.id, name: roomFromStore.name, group: roomFromStore.group } : null);
        const caretakerFromStore = camperOverride.caretakerId ? (staff.find((s) => s.id === camperOverride.caretakerId) ?? null) : null;
        const caretaker = caretakerOverride ?? caretakerFromStore;
        return {
          camper: camperOverride,
          bedroom: room,
          caretaker,
          caretakers: camperOverride.bedroom ? staff.filter((s) => s.bedroom === camperOverride.bedroom) : [],
          // roommates stay empty on an out-of-scope lookup — we only fetched this one kid
          roommates: data?.camper.id === camperOverride.id ? data.roommates : [],
        };
      })()
    : data;

  useEffect(() => {
    if (resolved) setTitle(resolved.camper.name.split(" ")[0]);
  }, [resolved, setTitle]);

  if (!resolved) {
    return (
      <div className="admin-page">
        <Breadcrumbs items={nav.crumbs} />
        {data === undefined && !camperOverride ? <p className="message message--error">{tx("Acampante não encontrado.")}</p> : <p className="opt-empty">{tx("Sincronizando… 🏕️")}</p>}
      </div>
    );
  }

  const { camper: k, bedroom, caretaker, caretakers, roommates } = resolved;
  const age = ageOf(k.birthDate);
  const sex = kidIconSex(bedroom?.group, k.sex, k.probableGender);
  const reviewing = k.aiReviewStatus === "pending" || k.aiReviewStatus === "processing";

  return (
    <div className="admin-page">
      <Breadcrumbs items={nav.crumbs} />
      <header className="admin-head">
        <h1 className="admin-title detail-title">
          <KidIcon sex={sex} size={40} />
          {k.name}
          {age !== null && <span className="kid-card__age">{tx("{age} anos", { age })}</span>}
        </h1>
        {onEdit && (
          <>
            {k.parentEditedAt && (
              <button type="button" className="icon-btn icon-btn--lg" title={tx("Histórico de alterações feitas pelos pais")} aria-label={tx("Histórico de alterações")} onClick={() => setHistoryOpen(true)}>
                🕓
              </button>
            )}
            <button type="button" className="icon-btn icon-btn--lg" title={tx("Editar")} aria-label={tx("Editar")} onClick={() => onEdit(k)}>
              <span className="pencil" aria-hidden="true">✏️</span>
            </button>
          </>
        )}
      </header>

      <section className="detail-card">
        <dl className="detail-grid">
          <dt>{tx("Líder")}</dt>
          <dd>
            {caretaker ? (
              onOpenStaff ? (
                <button type="button" className="link-btn" title={tx("Ver líder")} onClick={() => onOpenStaff(caretaker.id)}>
                  {caretaker.name}
                </button>
              ) : (
                caretaker.name
              )
            ) : k.caretakerId ? (
              "—"
            ) : (
              <span className="orphan-tag">⚠️ {tx("Sem líder")}</span>
            )}
            {onEdit && (
              <button type="button" className="icon-btn icon-btn--bare" title={caretaker ? tx("Trocar líder") : tx("Escolher líder")} aria-label={caretaker ? tx("Trocar líder") : tx("Escolher líder")} onClick={() => setLeaderOpen(true)}>
                <img className="pencil-icon" src={ICONS.pencil} alt="" aria-hidden="true" />
              </button>
            )}
          </dd>
          <dt>{tx("Nascimento")}</dt>
          <dd>{speakBirth(k.birthDate) ?? "—"}</dd>
          <dt>{tx("Peso")}</dt>
          <dd>{k.weightKg != null ? tx("{weight} kg", { weight: String(k.weightKg).replace(".", ",") }) : "—"}</dd>
          <dt>{tx("Time")}</dt>
          <dd>
            <TeamTag teamId={k.team} fallback="—" />
            {onEdit && (
              <button type="button" className="icon-btn icon-btn--bare" title={tx("Trocar de time")} aria-label={tx("Trocar de time")} onClick={() => setFieldOpen("team")}>
                <img className="pencil-icon" src={ICONS.pencil} alt="" aria-hidden="true" />
              </button>
            )}
          </dd>
          <dt>{tx("Quarto")}</dt>
          <dd>
            {bedroom ? (
              <BedroomTag bedroom={bedroom} onClick={onOpenBedroom ? () => onOpenBedroom(bedroom.id) : undefined} />
            ) : (
              "—"
            )}
            {onEdit && (
              <button type="button" className="icon-btn icon-btn--bare" title={tx("Trocar de quarto / líder")} aria-label={tx("Trocar de quarto ou líder")} onClick={() => setMoveOpen(true)}>
                <img className="pencil-icon" src={ICONS.pencil} alt="" aria-hidden="true" />
              </button>
            )}
            {labelOf(k.bed) && <span className="staff-tag">{tx("Cama {bed}", { bed: labelOf(k.bed)!.toLowerCase() })}</span>}
          </dd>
          <dt>{tx("Transporte")}</dt>
          <dd>
            {k.transportation ? <TransportTag transportId={k.transportation} /> : "—"}
            {onEdit && (
              <button type="button" className="icon-btn icon-btn--bare" title={tx("Trocar o transporte")} aria-label={tx("Trocar o transporte")} onClick={() => setFieldOpen("transportation")}>
                <img className="pencil-icon" src={ICONS.pencil} alt="" aria-hidden="true" />
              </button>
            )}
          </dd>
          {k.bedroomPreference && (
            <>
              <dt>{tx("Quer ficar com")}</dt>
              <dd>{k.bedroomPreference}</dd>
            </>
          )}
          {(k.school || k.schoolGrade) && (
            <>
              <dt>{tx("Escola")}</dt>
              <dd>{[k.school, k.schoolGrade].filter(Boolean).join(" · ")}</dd>
            </>
          )}
          {k.church && (
            <>
              <dt>{tx("Igreja")}</dt>
              <dd>{k.church}</dd>
            </>
          )}
          {k.invitedBy && (
            <>
              <dt>{tx("Convidado por")}</dt>
              <dd>{k.invitedBy}</dd>
            </>
          )}
          {(k.rg || k.cpf) && (
            <>
              <dt>{tx("Documentos")}</dt>
              <dd>{[k.rg && tx("RG {rg}", { rg: k.rg }), k.cpf && tx("CPF {cpf}", { cpf: formatCpf(k.cpf) })].filter(Boolean).join(" · ")}</dd>
            </>
          )}
        </dl>
        {canEditHealth ? (
          <div className="detail-health">
            <div className="detail-health__head">
              <h3 className="detail-health__title">{tx("🩺 Saúde")}</h3>
              <button type="button" className="icon-btn icon-btn--bare" title={tx("Editar saúde")} aria-label={tx("Editar saúde")} onClick={() => setHealthOpen(true)}>
                <img className="pencil-icon" src={ICONS.pencil} alt="" aria-hidden="true" />
              </button>
            </div>
            {healthLines(k, labelOf).length > 0 ? <HealthAlerts person={k} labelOf={labelOf} boxed /> : <p className="staff-card__alert staff-card__alert--soft">{tx("Nada de saúde declarado.")}</p>}
          </div>
        ) : (
          <HealthAlerts person={k} labelOf={labelOf} boxed />
        )}
        {(k.generalNotes || reviewing) && <p className={`detail-note ${reviewing ? "camper-ai-observation" : ""}`} title={reviewing ? tx("Este campo está sendo revisado pela IA") : undefined}>📝 {k.generalNotes || tx("Observações em revisão pela IA…")}</p>}
      </section>

      {/* a CARE record (room team) carries the guardian's name + phone only; the rest is admin / medical / check-in.
          An out-of-scope emergency lookup comes without any guardian data — no section then. */}
      {!k.redacted && (!k.contactsHidden || k.guardianName || k.guardianPhone) && (
        <section className="detail-section">
          <h2 className="detail-h2">
            <ParentIcon size={24} /> {tx("Pai ou Responsável")}
          </h2>
          <div className="detail-card">
            <dl className="detail-grid">
              <dt>{tx("Nome")}</dt>
              <dd>{k.guardianName || "—"}</dd>
              <dt>{tx("Telefone")}</dt>
              <dd>
                {k.guardianPhone ? (
                  <>
                    {formatBrazilPhoneClient(k.guardianPhone)}
                    <WhatsAppButton
                      className="wa-btn--sm"
                      href={whatsappLink(k.guardianPhone, staffGreeting({ toName: k.guardianName, fromName: myName, about: k.name }))}
                      label={k.guardianName.split(" ")[0] ? tx("Falar com {name} no WhatsApp", { name: k.guardianName.split(" ")[0] }) : tx("Falar com o responsável no WhatsApp")}
                    />
                  </>
                ) : (
                  <em className="staff-card__missing">{tx("não informado")}</em>
                )}
              </dd>
              {!k.contactsHidden && (
                <>
                  {k.guardianEmail && (
                    <>
                      <dt>{tx("E-mail")}</dt>
                      <dd>
                        <a href={`mailto:${k.guardianEmail}`}>{k.guardianEmail}</a>
                      </dd>
                    </>
                  )}
                  {k.guardianCpf && (
                    <>
                      <dt>{tx("CPF")}</dt>
                      <dd>{formatCpf(k.guardianCpf)}</dd>
                    </>
                  )}
                  <dt>{tx("Emergência")}</dt>
                  <dd>{k.emergencyContact || "—"}</dd>
                  <dt>{tx("Convênio")}</dt>
                  <dd>
                    {k.insurance || "—"}
                    {k.insuranceCard && <span className="cat-hint">· {k.insuranceCard}</span>}
                  </dd>
                </>
              )}
            </dl>
          </div>
        </section>
      )}

      <section className="detail-section">
        <h2 className="detail-h2">
          <StaffIcon size={24} /> {tx("Equipe no quarto")} <span className="cat-tab__count">{caretakers.length}</span>
        </h2>
        {!bedroom && <p className="opt-empty">{tx("Sem quarto definido.")}</p>}
        {bedroom && caretakers.length === 0 && <p className="opt-empty">⚠️ {tx("Ninguém da equipe no quarto {name}.", { name: bedroom.name })}</p>}
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
            <KidIcon sex={sex} group size={26} /> {tx("No mesmo quarto")} <BedroomTag bedroom={bedroom} /> <span className="cat-tab__count">{roommates.length}</span>
          </h2>
          {roommates.length === 0 ? (
            <p className="opt-empty">{tx("Sozinho(a) no quarto por enquanto.")}</p>
          ) : (
            <ul className="kid-list">
              {roommates.map((r) => (
                <CamperCard key={r.id} camper={r} labelOf={labelOf} hideBedroom onOpen={onOpenCamper} corner={<GuardianWhatsApp camper={r} />} />
              ))}
            </ul>
          )}
        </section>
      )}

      {onEdit && <ChangeRoomDialog token={token} open={moveOpen} camper={k} onClose={() => setMoveOpen(false)} />}
      {onEdit && <AssignLeaderDialog token={token} open={leaderOpen} camper={k} onClose={() => setLeaderOpen(false)} />}
      {onEdit && fieldOpen && <CamperFieldDialog token={token} open camper={k} field={fieldOpen} onClose={() => setFieldOpen(null)} />}
      {onEdit && <CamperHistoryDialog token={token} open={historyOpen} camperId={k.id} camperName={k.name} onClose={() => setHistoryOpen(false)} />}
      {canEditHealth && <HealthEditDialog token={token} open={healthOpen} camper={k} onClose={() => setHealthOpen(false)} />}
      <PlayScene sex={sex} />
    </div>
  );
}
