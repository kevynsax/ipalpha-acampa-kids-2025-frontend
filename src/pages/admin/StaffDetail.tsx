import { useEffect, useState } from "react";
import Breadcrumbs from "../../components/Breadcrumbs";
import HealthAlerts from "../../components/HealthAlerts";
import InstructionsDialog from "../../components/InstructionsDialog";
import KidIcon, { AdultIcon } from "../../components/KidIcon";
import { ICONS, adultSexOf, kidSexOf } from "../../icons";
import BedroomTag from "../../components/BedroomTag";
import { useCampTiming } from "../../campPhase";
import { unassignStaff } from "../../api/schedule";
import { speakDay, speakStamp } from "../../dates";
import AssignRoleDialog from "./AssignRoleDialog";
import { useConfirm } from "../../components/ConfirmDialog";
import {
  ROOM_ROLE_META,
  type Staff,
  type StaffScheduleItem,
} from "../../api/staff";
import MoveStaffDialog from "./MoveStaffDialog";
import StaffFieldDialog, { type StaffQuickField } from "./StaffFieldDialog";
import CamperCard from "../../components/CamperCard";
import GuardianWhatsApp from "../../components/GuardianWhatsApp";
import RoomRoleIcon from "../../components/RoomRoleIcon";
import TeamTag from "../../components/TeamTag";
import WhatsAppButton from "../../components/WhatsAppButton";
import { loadAuth } from "../../auth/store";
import { useLabelOf, useStaffDetail } from "../../store/derive";
import TransportTag from "../../components/TransportTag";
import { formatBrazilPhoneClient } from "../../phoneFormat";
import { staffGreeting, whatsappLink } from "../../whatsapp";
import type { DetailNav } from "./DetailStack";


/**
 * Who stamped it, as the sentence reads: "por Ana" (recorded by Ana),
 * "para Ana" (the vest was returned TO Ana), or "pelo próprio celular" when
 * the person did it themself (self check-in).
 */
function stampBy(
  c: { byName: string },
  self: string,
  prep: "por" | "para" = "por",
): string {
  if (!c.byName) return "";
  return c.byName === self
    ? "pelo próprio celular"
    : `${prep} ${c.byName.split(" ")[0]}`;
}

interface StaffDetailProps {
  token: string;
  staffId: string;
  nav: DetailNav;
  /** absent = read-only (organizers, or opened from the programme): no pencil */
  onEdit?: (member: Staff) => void;
  onOpenStaff?: (staffId: string) => void;
  onOpenCamper?: (camperId: string) => void;
  onOpenBedroom?: (bedroomId: string) => void;
  onOpenRole?: (roleId: string) => void;
  onOpenEvent?: (eventId: string) => void;
}

/** One volunteer: info, the specific functions they are linked to (with instructions) and the kids in their room. */
export default function StaffDetail({
  token,
  staffId,
  nav,
  onEdit,
  onOpenStaff,
  onOpenCamper,
  onOpenBedroom,
  onOpenRole,
  onOpenEvent,
}: StaffDetailProps) {
  // joined locally from the store — works offline and updates live (no reload needed after (un)assigning)
  const data = useStaffDetail(staffId);
  const [actionError, setError] = useState<string | null>(null);
  const error = data === undefined ? "Pessoa não encontrada." : actionError;
  /** the schedule item whose instructions are open in the dialog */
  const [instructionsFor, setInstructionsFor] =
    useState<StaffScheduleItem | null>(null);
  const [assignOpen, setAssignOpen] = useState(false);
  const [moveOpen, setMoveOpen] = useState(false);
  const [fieldOpen, setFieldOpen] = useState<StaffQuickField | null>(null);
  const confirm = useConfirm();
  const [busy, setBusy] = useState(false);
  const labelOf = useLabelOf();
  const myName = loadAuth()?.user.name ?? "";
  const { endsAt } = useCampTiming();
  /** the camp is over: an unreturned vest is a problem */
  const campOver = endsAt !== null && Date.now() >= endsAt;
  const [vestOpen, setVestOpen] = useState(false);
  const reload = () => {};
  const { setTitle } = nav;
  useEffect(() => {
    if (data) setTitle(data.staff.name.split(" ")[0]);
  }, [data, setTitle]);

  async function handleUnassign(x: StaffScheduleItem) {
    const ok = await confirm({
      emoji: "⛓️‍💥",
      title: `Desvincular ${x.role?.name ?? "esta função"} em "${x.title}"?`,
      message: x.defaultRole ? (
        <>
          A pessoa volta para a função padrão do evento:{" "}
          <strong>
            {x.defaultRole.emoji} {x.defaultRole.name}
          </strong>
          .
        </>
      ) : undefined,
      confirmLabel: "Desvincular",
      danger: true,
    });
    if (!ok) return;
    const eventId = x.eventId;
    setBusy(true);
    try {
      await unassignStaff(token, eventId, staffId);
      reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Algo deu errado.");
    } finally {
      setBusy(false);
    }
  }

  if (!data) {
    return (
      <div className="admin-page">
        <Breadcrumbs items={nav.crumbs} />
        {error ? (
          <p className="message message--error">{error}</p>
        ) : (
          <p className="opt-empty">Sincronizando… 🏕️</p>
        )}
      </div>
    );
  }

  const {
    staff: s,
    bedroom,
    schedule,
    campers,
    otherCampers,
    roommates,
  } = data;
  const explicit = schedule.filter((x) => !x.implicit);
  const firstName = s.name.split(" ")[0];
  const roommateById = new Map(roommates.map((r) => [r.id, r]));
  /** leaders (caretakers) of the OTHER kids of the room, with how many each one looks after */
  const otherLeaders = [
    ...otherCampers.reduce(
      (m, k) =>
        k.caretakerId
          ? m.set(k.caretakerId, (m.get(k.caretakerId) ?? 0) + 1)
          : m,
      new Map<string, number>(),
    ),
  ]
    .map(([id, n]) => ({ staff: roommateById.get(id), n }))
    .filter((x): x is { staff: Staff; n: number } => !!x.staff);
  const otherOrphans = otherCampers.filter(
    (k) => !k.caretakerId || !roommateById.has(k.caretakerId),
  ).length;
  const vestReturned = !!s.vest?.delivered && !!s.vest.returned;
  const vestLate = campOver && !vestReturned;

  /** "Cleves (auxiliar) está no mesmo quarto: 403 (Meninos)" — the colleagues and the room are links */
  const roomSentence = bedroom && (
    <p className="admin-intro">
      {roommates.length > 0 ? (
        <>
          {roommates.map((r, i) => (
            <span key={r.id}>
              {i > 0 && (i === roommates.length - 1 ? " e " : ", ")}
              {onOpenStaff ? (
                <button
                  type="button"
                  className="link-btn"
                  onClick={() => onOpenStaff(r.id)}
                >
                  {r.name.split(" ")[0]}
                </button>
              ) : (
                <strong>{r.name.split(" ")[0]}</strong>
              )}
              {bedroom.group !== "staff" && ` (${ROOM_ROLE_META[r.roomRole].label.toLowerCase()})`}
            </span>
          ))}{" "}
          {roommates.length === 1 ? "está" : "estão"} no mesmo quarto:
        </>
      ) : (
        <>
          <strong>{firstName}</strong> é a única pessoa da equipe no quarto:
        </>
      )}{" "}
      <BedroomTag bedroom={bedroom} onClick={onOpenBedroom ? () => onOpenBedroom(bedroom.id) : undefined} />
    </p>
  );

  return (
    <div className="admin-page">
      <Breadcrumbs items={nav.crumbs} />
      <header className="admin-head">
        <h1 className="admin-title detail-title">
          <AdultIcon sex={adultSexOf(bedroom?.group)} size={40} />
          {s.name}
          {s.admin && (
            <span className="staff-card__inactive" title="Admin do app">
              admin
            </span>
          )}
          {!s.active && <span className="staff-card__inactive">inativo</span>}
        </h1>
        {onEdit && (
          <button
            type="button"
            className="icon-btn icon-btn--lg"
            title="Editar"
            aria-label="Editar"
            onClick={() => onEdit(s)}
          >
            <span className="pencil" aria-hidden="true">
              ✏️
            </span>
          </button>
        )}
      </header>

      {/* ── info ── */}
      <section className="detail-card">
        <dl className="detail-grid">
          {/* whoever may see this person may see their phone */}
          <dt>Celular</dt>
          <dd>
            {s.phone ? (
              <>
                {formatBrazilPhoneClient(s.phone)}
                <WhatsAppButton
                  className="wa-btn--sm"
                  href={whatsappLink(
                    s.phone,
                    staffGreeting({ toName: s.name, fromName: myName }),
                  )}
                  label={`Falar com ${s.name.split(" ")[0]} no WhatsApp`}
                />
              </>
            ) : (
              <em className="staff-card__missing">sem celular</em>
            )}
          </dd>
          <dt>Time</dt>
          <dd>
            <TeamTag teamId={s.team} fallback="—" />
            {onEdit && (
              <button type="button" className="icon-btn icon-btn--bare" title="Trocar de time" aria-label="Trocar de time" onClick={() => setFieldOpen("team")}>
                <img className="pencil-icon" src={ICONS.pencil} alt="" aria-hidden="true" />
              </button>
            )}
          </dd>
          <dt>Quarto</dt>
          <dd>
            {bedroom ? (
              <BedroomTag bedroom={bedroom} onClick={onOpenBedroom ? () => onOpenBedroom(bedroom.id) : undefined} />
            ) : (
              "—"
            )}
            {onEdit && (
              <button
                type="button"
                className="icon-btn icon-btn--bare"
                title="Trocar de quarto"
                aria-label="Trocar de quarto"
                onClick={() => setMoveOpen(true)}
              >
                <img className="pencil-icon" src={ICONS.pencil} alt="" aria-hidden="true" />
              </button>
            )}
            {bedroom && bedroom.group !== "staff" && (
              <span
                className="staff-tag"
                title={ROOM_ROLE_META[s.roomRole].hint}
              >
                <RoomRoleIcon role={s.roomRole} /> {ROOM_ROLE_META[s.roomRole].label}
              </span>
            )}
          </dd>
          <dt>Transporte</dt>
          <dd>
            {s.transportation ? <TransportTag transportId={s.transportation} /> : "—"}
            {onEdit && (
              <button type="button" className="icon-btn icon-btn--bare" title="Trocar o transporte" aria-label="Trocar o transporte" onClick={() => setFieldOpen("transportation")}>
                <img className="pencil-icon" src={ICONS.pencil} alt="" aria-hidden="true" />
              </button>
            )}
          </dd>
          {!s.redacted && (
            <>
              <dt>Check-in</dt>
              <dd>
                {s.checkin
                  ? `✅ ${speakStamp(s.checkin.at)} · ${stampBy(s.checkin, s.name)}`
                  : "Ainda não chegou"}
              </dd>
              {s.vest?.delivered && (
                <>
                  <dt>Colete</dt>
                  <dd>
                    <span
                      className={
                        vestLate
                          ? "vest-status vest-status--late"
                          : "vest-status"
                      }
                    >
                      {vestReturned ? "Devolvido" : "Não devolvido"}
                    </span>
                    <button
                      type="button"
                      className={`icon-btn icon-btn--bare vest-toggle ${vestOpen ? "vest-toggle--open" : ""}`}
                      title={vestOpen ? "Ocultar detalhes" : "Ver detalhes"}
                      aria-label={
                        vestOpen
                          ? "Ocultar detalhes do colete"
                          : "Ver detalhes do colete"
                      }
                      aria-expanded={vestOpen}
                      onClick={() => setVestOpen((v) => !v)}
                    >
                      <span className="disclosure__arrow" aria-hidden="true">
                        ▶
                      </span>
                    </button>
                    {vestOpen && (
                      <small className="vest-details">
                        🦺 Entregue {speakStamp(s.vest.delivered.at)} ·{" "}
                        {stampBy(s.vest.delivered, s.name)}
                        {s.vest.returned && (
                          <>
                            <br />✅ Devolvido {speakStamp(s.vest.returned.at)} ·{" "}
                            {stampBy(s.vest.returned, s.name, "para")}
                          </>
                        )}
                      </small>
                    )}
                  </dd>
                </>
              )}
            </>
          )}
        </dl>
        <HealthAlerts person={s} labelOf={labelOf} boxed />
      </section>

      {/* ── functions (explicit assignments only) ── */}
      <section className="detail-section">
        <div className="detail-h2-row">
          <h2 className="detail-h2">
            🎯 Funções <span className="cat-tab__count">{explicit.length}</span>
          </h2>
          <button
            type="button"
            className="button button--primary admin-head__new"
            onClick={() => setAssignOpen(true)}
          >
            + Vincular função
          </button>
        </div>
        {explicit.length === 0 && (
          <p className="opt-empty">Nenhuma função específica.</p>
        )}
        {explicit.length > 0 && (
          <ul className="escala-list">
            {explicit.map((x) => {
              const key = x.eventId;
              return (
                <li key={key} className="escala-item escala-item--removable">
                  <span className="escala-item__corner">
                    {x.role?.instructions && (
                      <button
                        type="button"
                        className="icon-btn escala-item__corner-btn"
                        title="Ver instruções"
                        aria-label={`Ver instruções de ${x.role.name}`}
                        onClick={() => setInstructionsFor(x)}
                      >
                        📝
                      </button>
                    )}
                    <button
                      type="button"
                      className="icon-btn icon-btn--danger escala-item__corner-btn"
                      title="Desvincular função"
                      aria-label={`Desvincular ${x.role?.name ?? "função"} em ${x.title}`}
                      disabled={busy}
                      onClick={() => handleUnassign(x)}
                    >
                      ✕
                    </button>
                  </span>
                  <span className="escala-item__time">
                    <span className="escala-item__date">
                      {speakDay(x.date, "weekday")}
                    </span>
                    {x.startTime}
                  </span>
                  <div className="escala-item__body">
                    <p className="escala-item__line">
                      {x.role && onOpenRole ? (
                        <button
                          type="button"
                          className="text-link"
                          title={`Ver função ${x.role.name}`}
                          onClick={() => onOpenRole(x.role!.id)}
                        >
                          {x.role.emoji} {x.role.name}
                        </button>
                      ) : (
                        <strong>
                          {x.role?.emoji} {x.role?.name ?? "?"}
                        </strong>
                      )}
                      {x.detail && (
                        <span className="staff-tag__n">{x.detail}</span>
                      )}
                      <span className="escala-item__prep"> em </span>
                      {onOpenEvent ? (
                        <button
                          type="button"
                          className="text-link"
                          title={`Ver evento ${x.title}`}
                          onClick={() => onOpenEvent(x.eventId)}
                        >
                          <span aria-hidden="true">{x.emoji}</span> {x.title}
                        </button>
                      ) : (
                        <strong>
                          <span aria-hidden="true">{x.emoji}</span> {x.title}
                        </strong>
                      )}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <AssignRoleDialog
        token={token}
        entry={{ staff: s }}
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        onAssigned={reload}
      />
      {onEdit && (
        <MoveStaffDialog
          token={token}
          open={moveOpen}
          member={s}
          onClose={() => setMoveOpen(false)}
        />
      )}
      {onEdit && fieldOpen && <StaffFieldDialog token={token} open member={s} field={fieldOpen} onClose={() => setFieldOpen(null)} />}
      <InstructionsDialog
        role={instructionsFor?.role ?? null}
        context={
          instructionsFor
            ? `em ${instructionsFor.emoji} ${instructionsFor.title} · ${speakDay(instructionsFor.date, "weekday")} ${instructionsFor.startTime}`
            : undefined
        }
        onClose={() => setInstructionsFor(null)}
      />

      {/* ── kids ── */}
      <section className="detail-section">
        <h2 className="detail-h2">
          <KidIcon
            sex={kidSexOf(bedroom?.group)}
            group={!!kidSexOf(bedroom?.group)}
            size={26}
          />{" "}
          {s.roomRole === "caretaker"
            ? "Crianças sob responsabilidade"
            : "Crianças do quarto"}{" "}
          <span className="cat-tab__count">{campers.length}</span>
        </h2>
        {!bedroom && (
          <p className="opt-empty">
            Sem quarto definido — nenhuma criança vinculada.
          </p>
        )}
        {bedroom && bedroom.group === "staff" && (
          <p className="opt-empty">Quarto da equipe — sem crianças.</p>
        )}
        {bedroom && bedroom.group !== "staff" && campers.length === 0 && (
          <p className="opt-empty">Nenhuma criança neste quarto ainda.</p>
        )}
        {campers.length > 0 && (
          <>
            {roomSentence}
            <ul className="kid-list">
              {campers.map((k) => (
                <CamperCard
                  key={k.id}
                  camper={k}
                  labelOf={labelOf}
                  hideBedroom
                  onOpen={onOpenCamper}
                  corner={<GuardianWhatsApp camper={k} />}
                />
              ))}
            </ul>
          </>
        )}
      </section>

      {/* ── the other kids of the room (a caretaker only: the ones under a colleague's care) ── */}
      {s.roomRole === "caretaker" &&
        bedroom &&
        bedroom.group !== "staff" &&
        otherCampers.length > 0 && (
          <section className="detail-section">
            <h2 className="detail-h2">
              <KidIcon sex={kidSexOf(bedroom.group)} group size={26} /> Outras
              crianças do quarto{" "}
              <span className="cat-tab__count">{otherCampers.length}</span>
            </h2>
            <p className="admin-intro">
              {otherLeaders.length > 0 && (
                <>
                  {otherLeaders.length === 1 ? "Líder: " : "Líderes: "}
                  {otherLeaders.map(({ staff: r, n }, i) => (
                    <span key={r.id}>
                      {i > 0 && (i === otherLeaders.length - 1 ? " e " : ", ")}
                      {onOpenStaff ? (
                        <button
                          type="button"
                          className="link-btn"
                          onClick={() => onOpenStaff(r.id)}
                        >
                          {r.name.split(" ")[0]}
                        </button>
                      ) : (
                        <strong>{r.name.split(" ")[0]}</strong>
                      )}
                      {otherLeaders.length > 1 && ` (${n})`}
                    </span>
                  ))}
                  .
                </>
              )}
              {otherOrphans > 0 && (
                <span className="orphan-tag">
                  {otherLeaders.length > 0 ? " " : ""}⚠️ {otherOrphans} sem
                  líder
                </span>
              )}
            </p>
            <ul className="kid-list">
              {otherCampers.map((k) => (
                <CamperCard
                  key={k.id}
                  camper={k}
                  labelOf={labelOf}
                  hideBedroom
                  onOpen={onOpenCamper}
                  corner={<GuardianWhatsApp camper={k} />}
                />
              ))}
            </ul>
          </section>
        )}
    </div>
  );
}
