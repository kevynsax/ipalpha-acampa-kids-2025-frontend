import { useEffect, useState } from "react";
import { type RoleEventUsage, type ScheduleRole } from "../../api/schedule";
import { speakDay } from "../../dates";
import { useRoleDetail } from "../../store/derive";
import { positionsMeta } from "../../components/AutoRoleBadge";
import { isForWholeTeam } from "../../api/schedule";
import Breadcrumbs from "../../components/Breadcrumbs";
import RichHtml from "../../components/RichHtml";
import StaffIcon from "../../components/StaffIcon";
import { ICONS } from "../../icons";
import AssignRoleDialog from "./AssignRoleDialog";
import type { DetailNav } from "./DetailStack";

interface RoleDetailProps {
  token: string;
  roleId: string;
  nav: DetailNav;
  onEdit: (role: ScheduleRole) => void;
  onOpenStaff?: (staffId: string) => void;
  onOpenEvent?: (eventId: string) => void;
}

/** One função: instructions + every event where it's used and who does it there. "+" adds someone to the role in that event. */
export default function RoleDetail({ token, roleId, nav, onEdit, onOpenStaff, onOpenEvent }: RoleDetailProps) {
  // joined locally from the store — works offline and updates live (no reload needed after assigning)
  const data = useRoleDetail(roleId);
  const error = data === undefined ? "Função não encontrada." : null;
  const [addTo, setAddTo] = useState<RoleEventUsage | null>(null);

  const { setTitle } = nav;
  useEffect(() => {
    if (data) setTitle(`${data.role.emoji} ${data.role.name}`);
  }, [data, setTitle]);

  if (!data) {
    return (
      <div className="admin-page">
        <Breadcrumbs items={nav.crumbs} />
        {error ? <p className="message message--error">{error}</p> : <p className="opt-empty">Sincronizando… 🏕️</p>}
      </div>
    );
  }

  const { role: r, events: usage } = data;
  const days = [...new Set(usage.map((e) => e.date))].sort();
  const totalPeople = new Set(usage.flatMap((e) => e.people.map((p) => p.staffId))).size;

  return (
    <div className="admin-page">
      <Breadcrumbs items={nav.crumbs} />
      <header className="admin-head">
        <h1 className="admin-title detail-title">
          <span aria-hidden="true">{r.emoji}</span> {r.name}
        </h1>
        <button type="button" className="icon-btn icon-btn--lg" title="Editar função" aria-label="Editar função" onClick={() => onEdit(r)}>
          <span className="pencil" aria-hidden="true">✏️</span>
        </button>
      </header>

      <section className="detail-card">
        <span className="cat-field__label">📝 Instruções para a equipe</span>
        {r.instructions ? (
          <RichHtml html={r.instructions} />
        ) : (
          <p className="opt-empty">
            Sem instruções ainda.{" "}
            <button type="button" className="link-btn" onClick={() => onEdit(r)}>
              escrever
            </button>
          </p>
        )}
        <span className="cat-field__label"><img className="audience-icon" src={ICONS.preparation} alt="" aria-hidden="true" /> Preparação (antes do acampamento)</span>
        {r.preparation ? (
          <RichHtml html={r.preparation} />
        ) : (
          <p className="opt-empty">
            Nada a preparar para esta função.{" "}
            <button type="button" className="link-btn" onClick={() => onEdit(r)}>
              escrever
            </button>
          </p>
        )}
        <p className="cat-hint">
          {positionsMeta(r.forRoomRoles) ? (
            <>
              <img className="audience-icon" src={positionsMeta(r.forRoomRoles)!.icon} alt="" aria-hidden="true" /> Vai sozinha para{" "}
              <strong>{positionsMeta(r.forRoomRoles)!.label}</strong> nos eventos abaixo, exceto quem tiver outra função lá.
              {" Dá para acrescentar pessoas específicas em cada evento."}
            </>
          ) : (
            <>🎯 Só quem for escalado — pessoa por pessoa, em cada evento.</>
          )}
        </p>
      </section>

      <section className="detail-section">
        <h2 className="detail-h2">
          <img className="audience-icon" src={ICONS.schedule} alt="" aria-hidden="true" /> Onde é usada <span className="cat-tab__count">{usage.length}</span>
          {usage.length > 0 && (
            <span className="cat-hint">
              · <StaffIcon size={16} /> {totalPeople} pessoa{totalPeople !== 1 ? "s" : ""}
            </span>
          )}
        </h2>
        {usage.length === 0 && <p className="opt-empty">Esta função ainda não está em nenhum evento.</p>}
        {days.map((d) => (
          <div key={d} className="detail-day">
            <h3 className="detail-h3">{speakDay(d)}</h3>
            <ul className="escala-list">
              {usage
                .filter((e) => e.date === d)
                .map((e) => {
                  const positions = positionsMeta(r.forRoomRoles);
                  /* quem pega pela posição vira um chip com a contagem; só os escalados à mão são citados */
                  const picked = e.people.filter((p) => p.via === "person");
                  const byPosition = e.people.length - picked.length;
                  return (
                  <li key={e.eventId} className={`escala-item ${isForWholeTeam(r) ? "" : "escala-item--addable"}`}>
                    {/* "toda a equipe" já é todo mundo: não há quem acrescentar */}
                    {!isForWholeTeam(r) && (
                      <div className="escala-item__corner">
                        <button
                          type="button"
                          className="icon-btn escala-item__corner-btn escala-item__add"
                          title={`Escalar alguém como ${r.name} em ${e.title}`}
                          aria-label={`Escalar alguém como ${r.name} em ${e.title}`}
                          onClick={() => setAddTo(e)}
                        >
                          +
                        </button>
                      </div>
                    )}
                    <span className="escala-item__time">{e.startTime}</span>
                    <div className="escala-item__body">
                      <span className="escala-item__role">
                        {onOpenEvent ? (
                          <button type="button" className="text-link" title={`Ver evento ${e.title}`} onClick={() => onOpenEvent(e.eventId)}>
                            <span aria-hidden="true">{e.emoji}</span> {e.title}
                          </button>
                        ) : (
                          <span className="escala-item__event">
                            <span aria-hidden="true">{e.emoji}</span> {e.title}
                          </span>
                        )}
                        <span className="cat-hint">{e.people.length === 0 ? "ninguém ainda" : `${e.people.length} pessoa${e.people.length > 1 ? "s" : ""}`}</span>
                      </span>
                      {(positions || picked.length > 0) && (
                        <div className="staff-card__tags">
                          {positions && (
                            <span className="staff-tag staff-tag--everyone" title={`${byPosition} ${byPosition === 1 ? "pessoa" : "pessoas"}: ${positions.hint}, sem escalar uma por uma`}>
                              <img className="audience-icon" src={positions.icon} alt="" aria-hidden="true" /> {positions.label}
                              <span className="staff-tag__n">{byPosition}</span>
                            </span>
                          )}
                          {picked.map((p) =>
                            onOpenStaff ? (
                              <button key={p.staffId} type="button" className="staff-tag staff-tag--soft staff-tag--link" title={`${p.name} foi escalado(a) à mão — ver`} onClick={() => onOpenStaff(p.staffId)}>
                                {p.name}
                                {p.detail && <span className="staff-tag__n">{p.detail}</span>}
                              </button>
                            ) : (
                              <span key={p.staffId} className="staff-tag staff-tag--soft" title={`${p.name} foi escalado(a) à mão`}>
                                {p.name}
                                {p.detail && <span className="staff-tag__n">{p.detail}</span>}
                              </span>
                            ),
                          )}
                        </div>
                      )}
                    </div>
                  </li>
                  );
                })}
            </ul>
          </div>
        ))}
      </section>

      <AssignRoleDialog
        key={addTo?.eventId ?? "none"}
        token={token}
        open={!!addTo}
        entry={{ eventId: addTo?.eventId ?? "", roleId }}
        onClose={() => setAddTo(null)}
        onAssigned={() => {}}
      />
    </div>
  );
}
