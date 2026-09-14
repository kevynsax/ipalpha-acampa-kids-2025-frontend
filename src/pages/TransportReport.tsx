import { useEffect, useMemo, useState } from "react";
import { bedroomLabel } from "../api/bedrooms";
import { ageOf, checkinCamper, undoCheckinCamper, type Camper } from "../api/campers";
import { checkinStaff, undoCheckinStaff, type Staff } from "../api/staff";
import { useConfirm } from "../components/ConfirmDialog";
import { UndoGlyph } from "../components/Glyph";
import Breadcrumbs from "../components/Breadcrumbs";
import CamperIcon from "../components/CamperIcon";
import StaffIcon from "../components/StaffIcon";
import BusLogo from "../components/BusLogo";
import CarLogo from "../components/CarLogo";
import WhatsAppButton from "../components/WhatsAppButton";
import { formatBrazilPhoneClient } from "../phoneFormat";
import { useCollection, useCollectionOrEmpty } from "../store";
import { staffGreeting, whatsappLink } from "../whatsapp";
import { speakTime } from "../dates";

interface TransportReportProps {
  /** admin token — enables tap-to-check for CAR passengers straight from the report */
  token?: string;
  onBack: () => void;
  /** merged admin check-in landing page, when this report is nested below Igreja */
  onHome?: () => void;
  /** when set, staff tags navigate to the person (admins only — the staff pages are theirs) */
  onOpenStaff?: (staffId: string) => void;
  /** when set, kid names navigate to the kid */
  onOpenCamper?: (camperId: string) => void;
  /** the logged-in person — signs the WhatsApp greeting to the guardian */
  myName?: string;
}

/** Below this share of arrived kids the vehicle only shows its progress bar — the list is still too long to be useful. */
const SHOW_LIST_AT = 0.8;

/** Every team member must be at the church by this time on the first day (local time). */
const STAFF_DEADLINE = new Date(2026, 8, 11, 17, 30); // 11/09/2026 17:30
const STAFF_DEADLINE_LABEL = "17:30";

interface Vehicle {
  id: string;
  label: string;
  kind: "bus" | "car";
  color: string | null;
  number: string | null;
  kids: Camper[];
  arrived: Camper[];
  missing: Camper[];
  staff: Staff[];
}

/**
 * Arrival day, per vehicle: progress bar of kids that already checked in, the
 * missing kids once most of them are there, and the staff going in it.
 */
export default function TransportReport({ token, onBack, onHome, onOpenStaff, onOpenCamper, myName = "" }: TransportReportProps) {
  const campers = useCollection("campers");
  const staff = useCollectionOrEmpty("staff");
  const transports = useCollectionOrEmpty("transports");
  const bedrooms = useCollectionOrEmpty("bedrooms");
  const confirm = useConfirm();
  /** vehicles where the user asked to see everyone, not only the missing */
  const [showAll, setShowAll] = useState<Set<string>>(new Set());
  /** in-flight check-in toggles (car passengers), so a row can't be double-tapped */
  const [pending, setPending] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  /** the church roll call handles bus kids; CAR kids/staff are checked in here instead */
  async function toggleCarCheckin(who: "camper" | "staff", id: string, name: string, on: boolean) {
    if (!token || pending.has(id)) return;
    if (on && !(await confirm({ emoji: <UndoGlyph />, title: `Desfazer o check-in de ${name.split(" ")[0]}?`, message: "A pessoa voltará para a lista de pendentes.", confirmLabel: "Desfazer", danger: true }))) return;
    setPending((p) => new Set(p).add(id));
    setError(null);
    try {
      if (who === "camper") on ? await undoCheckinCamper(token, id) : await checkinCamper(token, id);
      else on ? await undoCheckinStaff(token, id) : await checkinStaff(token, id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Algo deu errado.");
    } finally {
      setPending((p) => {
        const n = new Set(p);
        n.delete(id);
        return n;
      });
    }
  }
  /** re-render every 30s so the "late" colour kicks in on its own once 17:30 passes */
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);
  const pastDeadline = now >= STAFF_DEADLINE.getTime();

  const roomById = useMemo(() => new Map(bedrooms.map((b) => [b.id, b])), [bedrooms]);

  const vehicles = useMemo<Vehicle[]>(() => {
    const byName = <T extends { name: string }>(a: T, b: T) => a.name.localeCompare(b.name, "pt-BR", { sensitivity: "base" });
    const kidsIn = new Map<string, Camper[]>();
    const staffIn = new Map<string, Staff[]>();
    for (const k of campers ?? []) if (k.transportation) (kidsIn.get(k.transportation) ?? kidsIn.set(k.transportation, []).get(k.transportation)!).push(k);
    for (const s of staff) if (s.active && s.transportation) (staffIn.get(s.transportation) ?? staffIn.set(s.transportation, []).get(s.transportation)!).push(s);

    const known = transports.slice().sort((a, b) => a.order - b.order);
    const ids = [...known.map((o) => o.id), ...[...new Set([...kidsIn.keys(), ...staffIn.keys()])].filter((id) => !known.some((o) => o.id === id))];
    return ids
      .map((id) => {
        const kids = (kidsIn.get(id) ?? []).sort(byName);
        const v = known.find((o) => o.id === id);
        return {
          id,
          label: v?.label ?? `(${id})`,
          kind: v?.kind ?? "bus",
          color: v?.color ?? null,
          number: v?.number ?? null,
          kids,
          arrived: kids.filter((k) => k.checkin),
          missing: kids.filter((k) => !k.checkin),
          staff: (staffIn.get(id) ?? []).sort(byName),
        };
      })
      .filter((v) => v.kids.length + v.staff.length > 0 || known.some((o) => o.id === v.id));
  }, [campers, staff, transports]);

  const none = useMemo(
    () => ({ kids: (campers ?? []).filter((k) => !k.transportation), staff: staff.filter((s) => s.active && !s.transportation) }),
    [campers, staff],
  );

  function toggleAll(id: string) {
    setShowAll((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const crumbs = onHome
    ? [{ label: "Check-in", onClick: onHome }, { label: "Igreja", onClick: onBack }, { label: "Por veículo" }]
    : [{ label: "Check-in", onClick: onBack }, { label: "Por veículo" }];

  if (!campers) {
    return (
      <div className="admin-page">
        <Breadcrumbs items={crumbs} />
        <p className="opt-empty">Sincronizando com o servidor… 🏕️</p>
      </div>
    );
  }

  const totalKids = campers.length;
  const totalArrived = campers.filter((k) => k.checkin).length;

  return (
    <div className="admin-page">
      <Breadcrumbs items={crumbs} />
      <header className="admin-head">
        <h1 className="admin-title">🚌 Por veículo</h1>
        <span className="checkin-progress" title="Crianças que já chegaram">
          ✅ {totalArrived}/{totalKids}
        </span>
      </header>

      {error && <p className="message message--error">{error}</p>}
      {vehicles.length === 0 && <p className="opt-empty">Nenhum transporte cadastrado.</p>}

      {vehicles.map((v) => {
        const pct = v.kids.length ? v.arrived.length / v.kids.length : 1;
        const complete = v.kids.length > 0 && v.missing.length === 0;
        // cars are not on the bus roll call — list them so the admin can check them in here
        const canCheck = v.kind === "car" && !!token;
        const canList = v.kids.length > 0 && (v.kind === "car" || pct >= SHOW_LIST_AT);
        const all = showAll.has(v.id) || v.kind === "car";
        const listed = all ? v.kids : v.missing;
        return (
          <section key={v.id} className={`vehicle ${complete ? "vehicle--complete" : ""}`}>
            <header className="vehicle__head">
              <h2 className="vehicle__title">
                {complete && <span aria-hidden="true">✅ </span>}
                {v.kind === "bus" ? <BusLogo color={v.color ?? "#0f9a8a"} number={v.number} size={26} /> : <CarLogo size={26} />}
                {v.label}
              </h2>
              <span className="vehicle__counts">
                <span title="equipe">
                  <StaffIcon size={16} /> {v.staff.length}
                </span>
                <span title="crianças">
                  <CamperIcon size={16} /> {v.kids.length}
                </span>
              </span>
            </header>

            {v.kids.length > 0 ? (
              <div className="vehicle__progress" role="progressbar" aria-valuemin={0} aria-valuemax={v.kids.length} aria-valuenow={v.arrived.length} aria-label={`Crianças que chegaram em ${v.label}`}>
                <span className="vehicle__bar" aria-hidden="true">
                  <span className="vehicle__bar-fill" style={{ width: `${Math.round(pct * 100)}%` }} />
                </span>
                <span className="vehicle__pct">
                  <strong>{v.arrived.length}</strong>/{v.kids.length} crianças · {Math.round(pct * 100)}%
                </span>
              </div>
            ) : (
              <p className="vehicle__hint">Nenhuma criança neste veículo.</p>
            )}

            {canList && (
              <div className="vehicle__kids">
                <div className="vehicle__subhead">
                  <h3 className="vehicle__h3">
                    <CamperIcon size={18} /> {all ? "Todas as crianças" : complete ? "Todas chegaram! 🎉" : `Faltam ${v.missing.length}`}
                  </h3>
                  {v.kind !== "car" && !complete && (
                    <button type="button" className="staff-tag staff-tag--link staff-tag--soft" onClick={() => toggleAll(v.id)}>
                      {all ? "Só quem falta" : "Mostrar todos"}
                    </button>
                  )}
                </div>
                {canCheck && <p className="vehicle__hint">Vêm de carro — toque em quem já chegou para registrar o check-in.</p>}
                {listed.length > 0 && (
                  <ul className="vehicle__list">
                    {listed.map((k) => {
                      const room = k.bedroom ? roomById.get(k.bedroom) : null;
                      const age = ageOf(k.birthDate);
                      const busy = pending.has(k.id);
                      return (
                        <li key={k.id} className={`vehicle__person ${k.checkin ? "vehicle__person--ok" : ""}`}>
                          <span className="vehicle__person-name">
                            {canCheck ? (
                              <button
                                type="button"
                                className={`vehicle__check ${k.checkin ? "vehicle__check--on" : ""}`}
                                disabled={busy}
                                aria-pressed={!!k.checkin}
                                title={k.checkin ? `Chegou às ${speakTime(k.checkin.at)} — toque para desfazer` : "Marcar como chegou"}
                                onClick={() => toggleCarCheckin("camper", k.id, k.name, !!k.checkin)}
                              >
                                {k.checkin ? "✓" : ""}
                              </button>
                            ) : (
                              /* the "only missing" list needs no marker; "show all" tells arrived from missing */
                              (k.checkin || all) && <span aria-hidden="true">{k.checkin ? "✅" : "⏳"}</span>
                            )}
                            {onOpenCamper ? (
                              <button type="button" className="link-btn" onClick={() => onOpenCamper(k.id)}>
                                {k.name}
                              </button>
                            ) : (
                              k.name
                            )}
                            {age !== null && <span className="kid-card__age">{age} anos</span>}
                          </span>
                          <span className="vehicle__person-meta">
                            {room ? bedroomLabel(room) : "sem quarto"}
                            {k.guardianPhone && (
                              <WhatsAppButton
                                className="wa-btn--sm"
                                href={whatsappLink(k.guardianPhone, staffGreeting({ toName: k.guardianName, fromName: myName, about: k.name }))}
                                label={`Falar com ${k.guardianName.split(" ")[0] || "o responsável"} no WhatsApp · ${formatBrazilPhoneClient(k.guardianPhone)}`}
                              />
                            )}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            )}

            <div className="vehicle__staff">
              <h3 className="vehicle__h3">
                <StaffIcon size={18} /> Equipe{" "}
                <span className="cat-tab__count">
                  {v.staff.filter((s) => s.checkin).length}/{v.staff.length}
                </span>
              </h3>
              {v.staff.length === 0 ? (
                <p className="vehicle__hint vehicle__hint--warn">⚠️ Nenhum adulto neste veículo.</p>
              ) : (
                <div className="staff-card__tags">
                  {v.staff.map((s) => {
                    const here = !!s.checkin;
                    const late = !here && pastDeadline;
                    const cls = `staff-tag ${here ? "staff-tag--here" : late ? "staff-tag--late" : ""}`;
                    const hint = here ? `Chegou às ${speakTime(s.checkin!.at)}` : late ? `Ainda não chegou (deveria estar aqui às ${STAFF_DEADLINE_LABEL})` : "Ainda não chegou";
                    const phone = s.phone ? ` · ${formatBrazilPhoneClient(s.phone)}` : "";
                    // car: tap to check in / undo, right here (they are not on the church or bus roll call)
                    if (canCheck) {
                      return (
                        <button key={s.id} type="button" className={`${cls} staff-tag--link`} disabled={pending.has(s.id)} title={`${hint}${phone} — toque para ${here ? "desfazer" : "marcar chegada"}`} onClick={() => toggleCarCheckin("staff", s.id, s.name, here)}>
                          {here ? "✅ " : late ? "⚠️ " : "⏳ "}
                          {s.name}
                        </button>
                      );
                    }
                    return onOpenStaff ? (
                      <button key={s.id} type="button" className={`${cls} staff-tag--link`} title={`${hint}${phone} — ver ${s.name}`} onClick={() => onOpenStaff(s.id)}>
                        {here ? "✅ " : late ? "⚠️ " : ""}
                        {s.name} ›
                      </button>
                    ) : (
                      <span key={s.id} className={cls} title={`${hint}${phone}`}>
                        {here ? "✅ " : late ? "⚠️ " : ""}
                        {s.name}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        );
      })}

      {(none.kids.length > 0 || none.staff.length > 0) && (
        <section className="vehicle vehicle--none">
          <header className="vehicle__head">
            <h2 className="vehicle__title">⚠️ Sem transporte</h2>
            <span className="vehicle__counts">
              <span title="equipe">
                <StaffIcon size={16} /> {none.staff.length}
              </span>
              <span title="crianças">
                <CamperIcon size={16} /> {none.kids.length}
              </span>
            </span>
          </header>
          <ul className="vehicle__list">
            {none.kids.map((k) => (
              <li key={k.id} className={`vehicle__person ${k.checkin ? "vehicle__person--ok" : ""}`}>
                <span className="vehicle__person-name">
                  <CamperIcon size={16} /> {k.name}
                </span>
              </li>
            ))}
            {none.staff.map((s) => (
              <li key={s.id} className="vehicle__person">
                <span className="vehicle__person-name">
                  <StaffIcon size={16} /> {s.name}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

