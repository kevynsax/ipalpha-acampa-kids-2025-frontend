import { useMemo, useState } from "react";
import BedroomTag from "../components/BedroomTag";
import { ageOf, checkinCamper, undoCheckinCamper, type Camper } from "../api/campers";
import { useConfirm } from "../components/ConfirmDialog";
import Breadcrumbs from "../components/Breadcrumbs";
import QrScannerDialog from "../components/QrScannerDialog";
import ScanFab from "../components/ScanFab";
import BusLogo from "../components/BusLogo";
import CarLogo from "../components/CarLogo";
import TeamTag from "../components/TeamTag";
import { camperIdFromQr } from "../print/camperLabels";
import { useRoute } from "../router";
import { otherTrip } from "../hooks/useDefaultBusTrip";
import { useCollection, useCollectionOrEmpty } from "../store";
import { useLabelOf } from "../store/derive";
import { UndoGlyph } from "../components/Glyph";
import { ICONS } from "../icons";

interface BusCheckinPageProps {
  token: string;
  /** a bus HELPER works the door of the ONE vehicle the admin linked them to: skip the picker and lock to it */
  onlyVehicleId?: string;
  /** medical team: browse every vehicle and who is (not yet) on board, but never tap a kid */
  readOnly?: boolean;
  /** route root; admins use /checkin/bus while helpers keep /bus */
  basePath?: string;
  /** which trip this roll call records */
  trip?: "outbound" | "return";
  /** when set, adds the merged Check-in landing page to the breadcrumb */
  checkinHomePath?: string;
  /** may this person open the OTHER journey? (helpers only see the trips whose window is open) */
  otherTripAvailable?: boolean;
}

/**
 * Roll call at the vehicle door: pick the vehicle (kept in the URL,
 * #/bus/:vehicleId), then tap each kid as they board. One tap = checked, tap
 * again = unchecked. A bus helper is locked to the vehicle the admin linked
 * them to (Settings → Check-in) — they stand at its door, they need not ride
 * in it. Read-only for the medical team (same screens, nothing to tap).
 */
export default function BusCheckinPage({ token, onlyVehicleId, readOnly = false, basePath = "/bus", trip = "outbound", checkinHomePath, otherTripAvailable = true }: BusCheckinPageProps) {
  const campers = useCollection("campers");
  const bedrooms = useCollectionOrEmpty("bedrooms");
  const transports = useCollectionOrEmpty("transports");
  const labelOf = useLabelOf();
  const confirm = useConfirm();
  const { segments, navigate } = useRoute();
  const vehicleSegment = basePath.split("/").filter(Boolean).length;
  const vehicleId = onlyVehicleId ?? segments[vehicleSegment] ?? null;
  const tripListPath = basePath.endsWith("/outbound") || basePath.endsWith("/return") ? basePath.replace(/\/(outbound|return)$/, "") : basePath;
  const [search, setSearch] = useState("");
  const [pending, setPending] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  // the door works by QR: the camera opens as soon as there is a vehicle to check in; close it to search by name
  const [scannerOpen, setScannerOpen] = useState(!readOnly);
  const [scanBusy, setScanBusy] = useState(false);
  const [scanNotice, setScanNotice] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const checkinKind = trip === "return" ? "bus_return" : "bus";
  const tripTitle = trip === "return" ? "Volta para a igreja" : "Ida para o acampamento";
  const tripShort = trip === "return" ? "volta" : "ida";
  /** the app lands on the journey that is happening now; this jumps to the other one when the guess is wrong */
  const swap = otherTripAvailable ? (
    <button
      type="button"
      className="button button--secondary trip-swap"
      title={`Ir para o check-in da ${trip === "return" ? "ida para o acampamento" : "volta para a igreja"}`}
      onClick={() => navigate(`${tripListPath}/${otherTrip(trip)}`)}
    >
      <span aria-hidden="true">→</span> {trip === "return" ? "🏕️ Ida" : "⛪ Volta"}
    </button>
  ) : null;

  const roomById = useMemo(() => new Map(bedrooms.map((b) => [b.id, b])), [bedrooms]);
  const vehicles = useMemo(() => transports.slice().sort((a, b) => a.order - b.order), [transports]);
  const vehicle = vehicleId ? vehicles.find((o) => o.id === vehicleId) ?? null : null;

  /** kids per vehicle (for the picker counts) */
  const countIn = useMemo(() => {
    const m = new Map<string, { total: number; boarded: number }>();
    for (const k of campers ?? []) {
      if (!k.transportation) continue;
      const c = m.get(k.transportation) ?? { total: 0, boarded: 0 };
      c.total++;
      if (trip === "return" ? k.busReturnCheckin : k.busCheckin) c.boarded++;
      m.set(k.transportation, c);
    }
    return m;
  }, [campers, trip]);

  const kids = useMemo(() => {
    if (!campers || !vehicle) return [];
    const q = normalize(search);
    return campers
      .filter((k) => k.transportation === vehicle.id)
      .filter((k) => !q || normalize(k.name).includes(q))
      // 1) ready to board  2) already on the bus  3) locked by a missing prerequisite
      .sort((a, b) => rank(a, trip) - rank(b, trip) || a.name.localeCompare(b.name, "pt-BR", { sensitivity: "base" }));
  }, [campers, vehicle, search, trip]);

  const counts = vehicle ? countIn.get(vehicle.id) ?? { total: 0, boarded: 0 } : { total: 0, boarded: 0 };

  async function toggle(k: Camper) {
    if (readOnly || pending.has(k.id)) return;
    const on = trip === "return" ? !!k.busReturnCheckin : !!k.busCheckin;
    const prerequisite = trip === "return" ? !!k.busCheckin : !!k.checkin;
    if (!on && !prerequisite) return;
    if (on && !(await confirm({ emoji: <UndoGlyph />, title: `Tirar ${k.name.split(" ")[0]} do ônibus?`, message: `A criança voltará para a lista da ${tripShort}.`, confirmLabel: "Tirar", danger: true }))) return;
    setPending((p) => new Set(p).add(k.id));
    setError(null);
    try {
      if (on) await undoCheckinCamper(token, k.id, checkinKind);
      else await checkinCamper(token, k.id, checkinKind);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Algo deu errado.");
    } finally {
      setPending((p) => {
        const n = new Set(p);
        n.delete(k.id);
        return n;
      });
    }
  }

  async function scanQr(raw: string) {
    if (!campers || !vehicle || scanBusy) return;
    setScanBusy(true);
    setScanNotice(null);
    try {
      const id = camperIdFromQr(raw);
      if (!id) throw new Error("Este QR code não é de uma pulseira ou crachá do Acampa Kids.");
      const camper = campers.find((k) => k.id === id);
      if (!camper) throw new Error("Esta criança não está disponível para o seu check-in.");
      if (camper.transportation !== vehicle.id) {
        const assigned = labelOf(camper.transportation);
        throw new Error(`${camper.name} não está neste veículo${assigned ? ` — está em ${assigned}` : ""}.`);
      }
      const already = trip === "return" ? camper.busReturnCheckin : camper.busCheckin;
      if (already) throw new Error(`${camper.name} já fez o check-in da ${tripShort}.`);
      if (trip === "return" && !camper.busCheckin) throw new Error(`${camper.name} não fez o check-in do ônibus na ida.`);
      if (trip === "outbound" && !camper.checkin) throw new Error(`${camper.name} ainda não fez check-in na igreja.`);

      const updated = await checkinCamper(token, camper.id, checkinKind);
      setScannerOpen(false);
      setScanNotice({ kind: "ok", text: `✅ ${updated.name} entrou no ônibus da ${tripShort}.` });
    } catch (e) {
      setScannerOpen(false);
      setScanNotice({ kind: "error", text: e instanceof Error ? e.message : "Não foi possível ler este QR code." });
    } finally {
      setScanBusy(false);
    }
  }

  if (!campers) {
    return (
      <div className="admin-page">
        {checkinHomePath && <Breadcrumbs items={[{ label: "Check-in", onClick: () => navigate(checkinHomePath) }, { label: "Ônibus" }]} />}
        <p className="opt-empty">Sincronizando com o servidor… 🏕️</p>
      </div>
    );
  }

  // a bus helper linked to a vehicle that no longer exists / was deactivated
  if (onlyVehicleId !== undefined && !vehicle) {
    return (
      <div className="admin-page">
        <header className="admin-head">
          <h1 className="admin-title">
            <img className="admin-title__icon" src={ICONS.transport} alt="" aria-hidden="true" />
            {tripTitle}
          </h1>
        </header>
        <p className="opt-empty">
          O veículo que você ficaria na porta não existe mais.
          <br />
          Fale com a organização para ajustar.
        </p>
      </div>
    );
  }

  // ── step 1: choose the vehicle ─────────────────────────────────────

  if (!vehicle) {
    return (
      <div className="admin-page">
        {checkinHomePath && <Breadcrumbs items={[{ label: "Check-in", onClick: () => navigate(checkinHomePath) }, { label: "Ônibus" }]} />}
        <header className="admin-head">
          <h1 className="admin-title">
            <img className="admin-title__icon" src={ICONS.transport} alt="" aria-hidden="true" />
            {readOnly ? tripTitle : `Check-in: ${tripTitle}`}
          </h1>
          {swap && <div className="admin-head__actions">{swap}</div>}
        </header>
        <p className="admin-intro">{readOnly ? "Quem vai em cada veículo e quem já embarcou." : "Na porta de qual veículo você está?"}</p>
        {vehicles.length === 0 && <p className="opt-empty">Nenhum transporte cadastrado.</p>}
        <ul className="bus-picker">
          {vehicles.map((o) => {
            const c = countIn.get(o.id) ?? { total: 0, boarded: 0 };
            const done = c.total > 0 && c.boarded === c.total;
            return (
              <li key={o.id}>
                <button type="button" className={`bus-picker__item ${done ? "bus-picker__item--done" : ""}`} onClick={() => navigate(`${basePath}/${o.id}`)}>
                  <span className="bus-picker__name">
                    {done && <span aria-hidden="true">✅ </span>}
                    {o.kind === "bus" ? <BusLogo color={o.color ?? "#0f9a8a"} number={o.number} size={26} /> : <CarLogo size={26} />}
                    {o.label}
                  </span>
                  <span className="bus-picker__foot">
                    <span className="bus-picker__count">
                      {c.boarded}/{c.total} crianças
                    </span>
                    <span className="bus-picker__bar" role="progressbar" aria-valuemin={0} aria-valuemax={c.total} aria-valuenow={c.boarded}>
                      <i style={{ width: `${c.total > 0 ? (c.boarded / c.total) * 100 : 0}%` }} />
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    );
  }

  // ── step 2: the roll call ──────────────────────────────────────────

  const pct = counts.total ? Math.round((counts.boarded / counts.total) * 100) : 0;

  return (
    <div className="admin-page">
      {onlyVehicleId === undefined && (
        <Breadcrumbs
          items={[
            ...(checkinHomePath ? [{ label: "Check-in", onClick: () => navigate(checkinHomePath) }] : []),
            { label: "Ônibus", onClick: () => navigate(tripListPath) },
            { label: trip === "return" ? "Volta" : "Ida", onClick: () => navigate(basePath) },
            { label: vehicle.label },
          ]}
        />
      )}
      <header className="admin-head">
        <h1 className="admin-title admin-title--with-logo">
          {vehicle.kind === "bus" ? <BusLogo color={vehicle.color ?? "#0f9a8a"} number={vehicle.number} size={30} /> : <CarLogo size={30} />}
          {vehicle.label} · {trip === "return" ? "Volta" : "Ida"}
        </h1>
        <div className="admin-head__actions">
          <span className="checkin-progress" title="Crianças que já embarcaram">
            <img className="admin-title__icon" src={ICONS.transport} alt="" aria-hidden="true" /> {counts.boarded}/{counts.total}
          </span>
          {swap}
        </div>
      </header>

      <div className="vehicle__progress" role="progressbar" aria-valuemin={0} aria-valuemax={counts.total} aria-valuenow={counts.boarded} aria-label="Crianças que embarcaram">
        <span className="vehicle__bar" aria-hidden="true">
          <span className="vehicle__bar-fill" style={{ width: `${pct}%` }} />
        </span>
        <span className="vehicle__pct">{pct}%</span>
      </div>

      {error && <p className="message message--error">{error}</p>}
      {scanNotice && <p className={`message message--${scanNotice.kind}`}>{scanNotice.text}</p>}
      {readOnly && <p className="admin-intro">🔍 Só consulta — a chamada é feita pela organização e pelos ajudantes do ônibus.</p>}

      <input className="cat-input" type="search" placeholder="Buscar pelo nome…" value={search} onChange={(e) => setSearch(e.target.value)} />

      {counts.total === 0 && <p className="opt-empty">Nenhuma criança neste veículo.</p>}
      {counts.total > 0 && kids.length === 0 && <p className="opt-empty">Nenhum resultado. 🔍</p>}

      <ul className="bus-list">
        {kids.map((k) => {
          const on = trip === "return" ? !!k.busReturnCheckin : !!k.busCheckin;
          const prerequisite = trip === "return" ? !!k.busCheckin : !!k.checkin;
          const locked = !on && !prerequisite;
          const busy = pending.has(k.id);
          const room = k.bedroom ? roomById.get(k.bedroom) : null;
          const age = ageOf(k.birthDate);
          return (
            <li key={k.id}>
              <button
                type="button"
                className={`bus-row ${on ? "bus-row--on" : ""} ${locked ? "bus-row--locked" : ""} ${readOnly ? "bus-row--readonly" : ""}`}
                disabled={busy || locked || readOnly}
                aria-pressed={on}
                title={readOnly ? undefined : locked ? "Precisa fazer o check-in na igreja primeiro" : undefined}
                onClick={() => toggle(k)}
              >
                <span className={`bus-row__check ${on ? "bus-row__check--on" : ""}`} aria-hidden="true">
                  {on ? "✓" : locked ? "🔒" : ""}
                </span>
                <span className="bus-row__body">
                  <span className="bus-row__name">
                    <span className={`strike ${on ? "strike--on" : ""}`}>{k.name}</span>
                    {age !== null && <span className="kid-card__age">{age} anos</span>}
                  </span>
                  <span className="bus-row__meta">
                    {room ? <BedroomTag bedroom={room} className="staff-tag--inline" /> : "sem quarto"}
                    {k.team && (
                      <>
                        {" · "}
                        <TeamTag teamId={k.team} className="staff-tag--inline" />
                      </>
                    )}
                    {locked && <span className="staff-card__missing"> · {trip === "return" ? "não embarcou na ida" : "sem check-in na igreja"}</span>}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {!readOnly && (
        <ScanFab
          label="Ler a pulseira ou o crachá"
          onClick={() => {
            setScanNotice(null);
            setScannerOpen(true);
          }}
        />
      )}
      <QrScannerDialog open={scannerOpen} busy={scanBusy} onScan={scanQr} onClose={() => setScannerOpen(false)} />
    </div>
  );
}

function rank(k: Camper, trip: "outbound" | "return"): number {
  const on = trip === "return" ? k.busReturnCheckin : k.busCheckin;
  const prerequisite = trip === "return" ? k.busCheckin : k.checkin;
  if (on) return 1;
  return prerequisite ? 0 : 2;
}

function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}
