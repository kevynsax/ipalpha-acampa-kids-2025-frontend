import { useEffect, useState } from "react";
import Breadcrumbs from "../../components/Breadcrumbs";
import HealthAlerts from "../../components/HealthAlerts";
import InstructionsDialog from "../../components/InstructionsDialog";
import KidIcon, { AdultIcon } from "../../components/KidIcon";
import { adultSexOf, kidSexOf } from "../../icons";
import { GROUP_META, bedroomLabel } from "../../api/bedrooms";
import { formatEventDate, unassignStaff } from "../../api/schedule";
import AssignRoleDialog from "./AssignRoleDialog";
import { useConfirm } from "../../components/ConfirmDialog";
import { ROOM_ROLE_META, type Staff, type StaffScheduleItem } from "../../api/staff";
import MoveStaffDialog from "./MoveStaffDialog";
import CamperCard from "../../components/CamperCard";
import WhatsAppButton from "../../components/WhatsAppButton";
import { loadAuth } from "../../auth/store";
import { useLabelOf, useStaffDetail } from "../../store/derive";
import { formatBrazilPhoneClient } from "../../phoneFormat";
import { staffGreeting, whatsappLink } from "../../whatsapp";
import type { DetailNav } from "./DetailStack";

/** ISO instant → "12/09 07:42" */
function fmtStamp(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
}

/**
 * Who stamped it, as the sentence reads: "por Ana" (recorded by Ana),
 * "para Ana" (the vest was returned TO Ana), or "pelo próprio celular" when
 * the person did it themself (self check-in).
 */
function stampBy(c: { byName: string }, self: string, prep: "por" | "para" = "por"): string {
  if (!c.byName) return "";
  return c.byName === self ? "pelo próprio celular" : `${prep} ${c.byName.split(" ")[0]}`;
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
export default function StaffDetail({ token, staffId, nav, onEdit, onOpenStaff, onOpenCamper, onOpenBedroom, onOpenRole, onOpenEvent }: StaffDetailProps) {
  // joined locally from the store — works offline and updates live (no reload needed after (un)assigning)
  const data = useStaffDetail(staffId);
  const [actionError, setError] = useState<string | null>(null);
  const error = data === undefined ? "Pessoa não encontrada." : actionError;
  /** the schedule item whose instructions are open in the dialog */
  const [instructionsFor, setInstructionsFor] = useState<StaffScheduleItem | null>(null);
  const [assignOpen, setAssignOpen] = useState(false);
  const [moveOpen, setMoveOpen] = useState(false);
  const confirm = useConfirm();
  const [busy, setBusy] = useState(false);
  const labelOf = useLabelOf();
  const myName = loadAuth()?.user.name ?? "";
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
          A pessoa volta para a função padrão do evento: <strong>{x.defaultRole.emoji} {x.defaultRole.name}</strong>.
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
        {error ? <p className="message message--error">{error}</p> : <p className="opt-empty">Sincronizando… 🏕️</p>}
      </div>
    );
  }

  const { staff: s, bedroom, schedule, campers, roommates } = data;
  const explicit = schedule.filter((x) => !x.implicit);
  const implicitCount = schedule.length - explicit.length;

  return (
    <div className="admin-page">
      <Breadcrumbs items={nav.crumbs} />
      <header className="admin-head">
        <h1 className="admin-title detail-title">
          <AdultIcon sex={adultSexOf(bedroom?.group)} size={40} />
          {s.name}
          {!s.active && <span className="staff-card__inactive">inativo</span>}
        </h1>
        {onEdit && (
          <button type="button" className="icon-btn icon-btn--lg" title="Editar" aria-label="Editar" onClick={() => onEdit(s)}>
            ✏️
          </button>
        )}
      </header>

      {/* ── info ── */}
      <section className="detail-card">
        <dl className="detail-grid">
          {!s.redacted && (
            <>
              <dt>Celular</dt>
              <dd>
                {s.phone ? (
                  <>
                    {formatBrazilPhoneClient(s.phone)}
                    <WhatsAppButton
                      className="wa-btn--sm"
                      href={whatsappLink(s.phone, staffGreeting({ toName: s.name, fromName: myName }))}
                      label={`Falar com ${s.name.split(" ")[0]} no WhatsApp`}
                    />
                  </>
                ) : (
                  <em className="staff-card__missing">sem celular</em>
                )}
              </dd>
            </>
          )}
          <dt>Time</dt>
          <dd>{labelOf(s.team) ?? "—"}</dd>
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
            {!s.redacted && bedroom && bedroom.group !== "staff" && (
              <span className="staff-tag" title={ROOM_ROLE_META[s.roomRole].hint}>
                {ROOM_ROLE_META[s.roomRole].emoji} {ROOM_ROLE_META[s.roomRole].label}
              </span>
            )}
            {onEdit && (
              <button type="button" className="icon-btn" title="Mudar de quarto" aria-label="Mudar de quarto" onClick={() => setMoveOpen(true)}>
                ✏️
              </button>
            )}
          </dd>
          <dt>Transporte</dt>
          <dd>{labelOf(s.transportation) ?? "—"}</dd>
          {!s.redacted && (
            <>
              <dt>Check-in</dt>
              <dd>{s.checkin ? `✅ ${fmtStamp(s.checkin.at)} · ${stampBy(s.checkin, s.name)}` : "Ainda não chegou"}</dd>
              <dt>Colete</dt>
              <dd>
                {!s.vest?.delivered && "📦 Ainda não recebeu"}
                {s.vest?.delivered && !s.vest.returned && `🦺 Entregue ${fmtStamp(s.vest.delivered.at)} · ${stampBy(s.vest.delivered, s.name)}`}
                {s.vest?.delivered && s.vest.returned && (
                  <>
                    ✅ Devolvido {fmtStamp(s.vest.returned.at)} · {stampBy(s.vest.returned, s.name, "para")}
                    <br />
                    <small>Entregue {fmtStamp(s.vest.delivered.at)} · {stampBy(s.vest.delivered, s.name)}</small>
                  </>
                )}
              </dd>
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
          <button type="button" className="button button--primary admin-head__new" onClick={() => setAssignOpen(true)}>
            + Vincular função
          </button>
        </div>
        {explicit.length === 0 && (
          <p className="opt-empty">
            Nenhuma função específica.
            {implicitCount > 0 && ` Nas outras atividades vale a função padrão da equipe (${implicitCount} eventos).`}
          </p>
        )}
        {explicit.length > 0 && (
          <ul className="escala-list">
            {explicit.map((x) => {
              const key = x.eventId;
              return (
                <li key={key} className="escala-item escala-item--removable">
                  <span className="escala-item__corner">
                    {x.role?.instructions && (
                      <button type="button" className="icon-btn escala-item__corner-btn" title="Ver instruções" aria-label={`Ver instruções de ${x.role.name}`} onClick={() => setInstructionsFor(x)}>
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
                    <span className="escala-item__date">{formatEventDate(x.date, { weekday: "short" }).replace(".", "")}</span>
                    {x.startTime}
                  </span>
                  <div className="escala-item__body">
                    <p className="escala-item__line">
                      {x.role && onOpenRole ? (
                        <button type="button" className="text-link" title={`Ver função ${x.role.name}`} onClick={() => onOpenRole(x.role!.id)}>
                          {x.role.emoji} {x.role.name}
                        </button>
                      ) : (
                        <strong>
                          {x.role?.emoji} {x.role?.name ?? "?"}
                        </strong>
                      )}
                      {x.detail && <span className="staff-tag__n">{x.detail}</span>}
                      <span className="escala-item__prep"> em </span>
                      {onOpenEvent ? (
                        <button type="button" className="text-link" title={`Ver evento ${x.title}`} onClick={() => onOpenEvent(x.eventId)}>
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
        {implicitCount > 0 && explicit.length > 0 && (
          <p className="cat-hint">Nos outros {implicitCount} eventos vale a função padrão da equipe (ex.: cuidar das crianças).</p>
        )}
      </section>

      <AssignRoleDialog token={token} entry={{ staff: s }} open={assignOpen} onClose={() => setAssignOpen(false)} onAssigned={reload} />
      {onEdit && <MoveStaffDialog token={token} open={moveOpen} member={s} onClose={() => setMoveOpen(false)} />}
      <InstructionsDialog
        role={instructionsFor?.role ?? null}
        context={instructionsFor ? `em ${instructionsFor.emoji} ${instructionsFor.title} · ${formatEventDate(instructionsFor.date, { weekday: "short" }).replace(".", "")} ${instructionsFor.startTime}` : undefined}
        onClose={() => setInstructionsFor(null)}
      />

      {/* ── kids ── */}
      <section className="detail-section">
        <h2 className="detail-h2">
          <KidIcon sex={kidSexOf(bedroom?.group)} group={!!kidSexOf(bedroom?.group)} size={26} /> {s.roomRole === "caretaker" ? "Crianças sob responsabilidade" : "Crianças do quarto"} <span className="cat-tab__count">{campers.length}</span>
        </h2>
        {!bedroom && <p className="opt-empty">Sem quarto definido — nenhuma criança vinculada.</p>}
        {bedroom && bedroom.group === "staff" && <p className="opt-empty">Quarto da equipe — sem crianças.</p>}
        {bedroom && bedroom.group !== "staff" && campers.length === 0 && <p className="opt-empty">Nenhuma criança neste quarto ainda.</p>}
        {campers.length > 0 && (
          <>
            <p className="admin-intro">
              Quarto <strong>{bedroom!.name}</strong> ({GROUP_META[bedroom!.group].label})
              {roommates.length > 0 && (
                <>
                  {" "}· junto com{" "}
                  {roommates.map((r, i) => (
                    <span key={r.id}>
                      {i > 0 && ", "}
                      {onOpenStaff ? (
                        <button type="button" className="link-btn" onClick={() => onOpenStaff(r.id)}>
                          {r.name.split(" ")[0]}
                        </button>
                      ) : (
                        <strong>{r.name.split(" ")[0]}</strong>
                      )}
                    </span>
                  ))}
                </>
              )}
            </p>
            <ul className="kid-list">
              {campers.map((k) => (
                <CamperCard key={k.id} camper={k} labelOf={labelOf} hideBedroom onOpen={onOpenCamper} />
              ))}
            </ul>
          </>
        )}
      </section>
    </div>
  );
}
