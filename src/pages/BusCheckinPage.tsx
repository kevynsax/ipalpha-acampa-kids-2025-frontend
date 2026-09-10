import { useMemo, useState } from "react";
import { bedroomLabel } from "../api/bedrooms";
import { ageOf, CAMPER_CATEGORY_KEYS, checkinCamper, undoCheckinCamper, type Camper } from "../api/campers";
import { useConfirm } from "../components/ConfirmDialog";
import Breadcrumbs from "../components/Breadcrumbs";
import QrScannerDialog from "../components/QrScannerDialog";
import { useRoute } from "../router";
import { useCollection, useCollectionOrEmpty } from "../store";
import { useLabelOf } from "../store/derive";

interface BusCheckinPageProps {
  token: string;
  /** a bus HELPER works the door of the ONE vehicle the admin linked them to: skip the picker and lock to it */
  onlyVehicleId?: string;
  /** medical team: browse every vehicle and who is (not yet) on board, but never tap a kid */
  readOnly?: boolean;
  /** route root; admins use /checkin/bus while helpers keep /bus */
  basePath?: string;
  /** when set, adds the merged Check-in landing page to the breadcrumb */
  checkinHomePath?: string;
}

/**
 * Roll call at the vehicle door: pick the vehicle (kept in the URL,
 * #/bus/:vehicleId), then tap each kid as they board. One tap = checked, tap
 * again = unchecked. A bus helper is locked to the vehicle the admin linked
 * them to (Settings → Check-in) — they stand at its door, they need not ride
 * in it. Read-only for the medical team (same screens, nothing to tap).
 */
export default function BusCheckinPage({ token, onlyVehicleId, readOnly = false, basePath = "/bus", checkinHomePath }: BusCheckinPageProps) {
  const campers = useCollection("campers");
  const bedrooms = useCollectionOrEmpty("bedrooms");
  const categories = useCollectionOrEmpty("categories");
  const labelOf = useLabelOf();
  const confirm = useConfirm();
  const { segments, navigate } = useRoute();
  const vehicleSegment = basePath.split("/").filter(Boolean).length;
  const vehicleId = onlyVehicleId ?? segments[vehicleSegment] ?? null;
  const [search, setSearch] = useState("");
  const [pending, setPending] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scanBusy, setScanBusy] = useState(false);
  const [scanNotice, setScanNotice] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  const roomById = useMemo(() => new Map(bedrooms.map((b) => [b.id, b])), [bedrooms]);
  const transport = categories.find((c) => c.key === CAMPER_CATEGORY_KEYS.transportation);
  const vehicles = useMemo(() => (transport?.options ?? []).filter((o) => o.active).slice().sort((a, b) => a.order - b.order), [transport]);
  const vehicle = vehicleId ? vehicles.find((o) => o.id === vehicleId) ?? null : null;

  /** kids per vehicle (for the picker counts) */
  const countIn = useMemo(() => {
    const m = new Map<string, { total: number; boarded: number }>();
    for (const k of campers ?? []) {
      if (!k.transportation) continue;
      const c = m.get(k.transportation) ?? { total: 0, boarded: 0 };
      c.total++;
      if (k.busCheckin) c.boarded++;
      m.set(k.transportation, c);
    }
    return m;
  }, [campers]);

  const kids = useMemo(() => {
    if (!campers || !vehicle) return [];
    const q = normalize(search);
    return campers
      .filter((k) => k.transportation === vehicle.id)
      .filter((k) => !q || normalize(k.name).includes(q))
      // 1) ready to board  2) already on the bus  3) locked (no church check-in yet) — alphabetical within each
      .sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name, "pt-BR", { sensitivity: "base" }));
  }, [campers, vehicle, search]);

  const counts = vehicle ? countIn.get(vehicle.id) ?? { total: 0, boarded: 0 } : { total: 0, boarded: 0 };

  async function toggle(k: Camper) {
    if (readOnly || pending.has(k.id)) return;
    if (!k.busCheckin && !k.checkin) return; // must pass through the church first
    if (k.busCheckin && !(await confirm({ emoji: "↩️", title: `Tirar ${k.name.split(" ")[0]} do ônibus?`, message: "A criança voltará para a lista de quem ainda não embarcou.", confirmLabel: "Tirar", danger: true }))) return;
    setPending((p) => new Set(p).add(k.id));
    setError(null);
    try {
      if (k.busCheckin) await undoCheckinCamper(token, k.id, "bus");
      else await checkinCamper(token, k.id, "bus");
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
      if (camper.busCheckin) throw new Error(`${camper.name} já fez check-in no ônibus.`);
      if (!camper.checkin) throw new Error(`${camper.name} ainda não fez check-in na igreja.`);

      const updated = await checkinCamper(token, camper.id, "bus");
      setScannerOpen(false);
      setScanNotice({ kind: "ok", text: `✅ ${updated.name} entrou no ônibus.` });
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
          <h1 className="admin-title">🚌 Check-in no ônibus</h1>
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
          <h1 className="admin-title">{transport?.emoji ?? "🚌"} {readOnly ? "Ônibus" : "Check-in no ônibus"}</h1>
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
                    {o.label}
                  </span>
                  <span className="bus-picker__count">
                    {c.boarded}/{c.total} crianças
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
            { label: "Ônibus", onClick: () => navigate(basePath) },
            { label: vehicle.label },
          ]}
        />
      )}
      <header className="admin-head">
        <h1 className="admin-title">
          {transport?.emoji ?? "🚌"} {vehicle.label}
        </h1>
        <span className="checkin-progress" title="Crianças que já embarcaram">
          🚌 {counts.boarded}/{counts.total}
        </span>
      </header>

      <div className="vehicle__progress" role="progressbar" aria-valuemin={0} aria-valuemax={counts.total} aria-valuenow={counts.boarded} aria-label="Crianças que embarcaram">
        <span className="vehicle__bar" aria-hidden="true">
          <span className="vehicle__bar-fill" style={{ width: `${pct}%` }} />
        </span>
        <span className="vehicle__pct">{pct}%</span>
      </div>

      {error && <p className="message message--error">{error}</p>}
      {scanNotice && <p className={`message message--${scanNotice.kind}`}>{scanNotice.text}</p>}
      {readOnly ? (
        <p className="admin-intro">🔍 Só consulta — a chamada é feita pela organização e pelos ajudantes do ônibus.</p>
      ) : (
        <button
          type="button"
          className="button button--primary bus-scan-button"
          onClick={() => {
            setScanNotice(null);
            setScannerOpen(true);
          }}
        >
          📷 Ler QR da pulseira ou crachá
        </button>
      )}

      <input className="cat-input" type="search" placeholder="Buscar pelo nome…" value={search} onChange={(e) => setSearch(e.target.value)} />

      {counts.total === 0 && <p className="opt-empty">Nenhuma criança neste veículo.</p>}
      {counts.total > 0 && kids.length === 0 && <p className="opt-empty">Nenhum resultado. 🔍</p>}

      <ul className="bus-list">
        {kids.map((k) => {
          const on = !!k.busCheckin;
          const locked = !on && !k.checkin;
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
                    {k.name}
                    {age !== null && <span className="kid-card__age">{age} anos</span>}
                  </span>
                  <span className="bus-row__meta">
                    {room ? bedroomLabel(room) : "sem quarto"}
                    {labelOf(k.team) && ` · ${labelOf(k.team)}`}
                    {locked && <span className="staff-card__missing"> · sem check-in na igreja</span>}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <QrScannerDialog open={scannerOpen} busy={scanBusy} onScan={scanQr} onClose={() => setScannerOpen(false)} />
    </div>
  );
}

/** Accept only this app's camper-detail URL, as printed on the badge and bracelet. */
function camperIdFromQr(raw: string): string | null {
  const value = raw.trim();
  try {
    const url = new URL(value, location.href);
    if (url.origin !== location.origin || url.pathname !== location.pathname) return null;
    const match = url.hash.match(/^#\/campers\/([^/?#]+)\/?(?:\?.*)?$/);
    return match ? decodeURIComponent(match[1]) : null;
  } catch {
    return null;
  }
}

function rank(k: Camper): number {
  if (k.busCheckin) return 1;
  return k.checkin ? 0 : 2;
}

function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}
