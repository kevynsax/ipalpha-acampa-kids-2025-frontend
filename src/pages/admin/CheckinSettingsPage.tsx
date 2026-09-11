import { useEffect, useState } from "react";
import { DEFAULT_CHECKIN_LOCATION, mapsLink, updateSettings, type BusHelper, type CheckinLocation, type Settings } from "../../api/settings";
import { useCollection } from "../../store";
import { describeGeoError, readPosition } from "../../geo";
import BusHelpersEditor from "./BusHelpersEditor";
import StaffListEditor from "./StaffListEditor";
import CheckinTestTools from "./CheckinTestTools";

interface CheckinSettingsPageProps {
  token: string;
}

const RADIUS_MIN = 50;
const RADIUS_MAX = 5000;

/** ISO instant → value for <input type="datetime-local"> (device clock) */
function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** datetime-local value → ISO instant (device clock), or null when empty */
function fromLocalInput(v: string): string | null {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

/** compare instants at minute precision (datetime-local can't carry seconds) */
const sameMinute = (a: string | null, b: string | null) => (a ? Math.floor(new Date(a).getTime() / 60_000) : null) === (b ? Math.floor(new Date(b).getTime() / 60_000) : null);
const fmt = new Intl.DateTimeFormat("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
/**
 * Admin-only: everything about departure-day check-in, on one page.
 *
 *   1. the time WINDOW in which the team's helpers may act (church and bus
 *      share it) — outside it the server sends them nothing extra;
 *   2. who helps with the CHURCH check-in of the kids (they receive every
 *      camper, health included, to confirm with the parents);
 *   3. who helps with the BUS roll call: one list PER VEHICLE — the person
 *      stands at that vehicle's door (they need not ride in it) and only gets
 *      its kids, names only;
 *   4. the meeting point + radius for the team's own "Cheguei na igreja!".
 *
 * Each section saves on its own, so a change in one never touches the others.
 */
export default function CheckinSettingsPage({ token }: CheckinSettingsPageProps) {
  const settings = useCollection("settings");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  // section drafts
  const [from, setFrom] = useState("");
  const [until, setUntil] = useState("");
  const [church, setChurch] = useState<string[]>([]);
  const [bus, setBus] = useState<BusHelper[]>([]);
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [radius, setRadius] = useState(String(DEFAULT_CHECKIN_LOCATION.radiusM));
  const [locating, setLocating] = useState(false);

  function fill(s: Settings) {
    setFrom(toLocalInput(s.checkinWindow.from));
    setUntil(toLocalInput(s.checkinWindow.until));
    setChurch(s.checkinHelpers.staffIds);
    setBus(s.busHelpers.helpers);
    fillLocation(s.checkinLocation);
  }
  function fillLocation(loc: CheckinLocation) {
    setLat(String(loc.lat));
    setLng(String(loc.lng));
    setRadius(String(loc.radiusM));
  }

  useEffect(() => {
    if (settings) fill(settings);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings]);

  /** Saves the time/location forms and refreshes their drafts after success. */
  async function save(section: string, patch: Parameters<typeof updateSettings>[1]) {
    if (busy) return;
    setBusy(section);
    setError(null);
    setSaved(null);
    try {
      await updateSettings(token, patch);
      setSaved(section);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Algo deu errado.");
    } finally {
      setBusy(null);
    }
  }

  /** Staff lists save immediately when a person is added, removed or reassigned. */
  async function saveChurch(nextIds: string[]) {
    if (busy) return;
    const previous = church;
    setChurch(nextIds);
    setBusy("church");
    setError(null);
    try {
      await updateSettings(token, { checkinHelpers: { staffIds: nextIds } });
    } catch (err) {
      setChurch(previous);
      setError(err instanceof Error ? err.message : "Algo deu errado.");
    } finally {
      setBusy(null);
    }
  }

  async function saveBus(nextHelpers: BusHelper[]) {
    if (busy) return;
    const previous = bus;
    setBus(nextHelpers);
    setBusy("bus");
    setError(null);
    try {
      await updateSettings(token, { busHelpers: { helpers: nextHelpers } });
    } catch (err) {
      setBus(previous);
      setError(err instanceof Error ? err.message : "Algo deu errado.");
    } finally {
      setBusy(null);
    }
  }

  if (!settings && !error) {
    return (
      <div className="admin-page">
        <p className="opt-empty">Carregando configurações… ⚙️</p>
      </div>
    );
  }

  // ── window ──
  const fromIso = fromLocalInput(from);
  const untilIso = fromLocalInput(until);
  const orderOk = !fromIso || !untilIso || new Date(fromIso) < new Date(untilIso);
  const windowComplete = !!fromIso && !!untilIso;
  const windowDirty = !!settings && (!sameMinute(fromIso, settings.checkinWindow.from) || !sameMinute(untilIso, settings.checkinWindow.until));
  const now = Date.now();
  const openNow = windowComplete && orderOk && new Date(fromIso!).getTime() <= now && now < new Date(untilIso!).getTime();
  const testMode = !!settings?.checkinTestMode;

  // ── location ──
  const latN = Number(lat.replace(",", "."));
  const lngN = Number(lng.replace(",", "."));
  const radiusN = Number(radius);
  const latOk = lat.trim() !== "" && Number.isFinite(latN) && Math.abs(latN) <= 90;
  const lngOk = lng.trim() !== "" && Number.isFinite(lngN) && Math.abs(lngN) <= 180;
  const radiusOk = Number.isFinite(radiusN) && radiusN >= RADIUS_MIN && radiusN <= RADIUS_MAX;
  const locValid = latOk && lngOk && radiusOk;
  const locDirty =
    !!settings && (latN !== settings.checkinLocation.lat || lngN !== settings.checkinLocation.lng || Math.round(radiusN) !== settings.checkinLocation.radiusM);
  const preview = latOk && lngOk ? { lat: latN, lng: lngN } : null;

  async function useMyPosition() {
    setLocating(true);
    setError(null);
    try {
      const p = await readPosition();
      setLat(String(p.lat));
      setLng(String(p.lng));
    } catch (err) {
      setError(describeGeoError(err));
    } finally {
      setLocating(false);
    }
  }

  /** "-23.480536, -46.830779" pasted from Google Maps → fills both fields */
  function handleLatPaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const m = e.clipboardData.getData("text").match(/^\s*(-?\d+(?:[.,]\d+)?)\s*[,;\s]\s*(-?\d+(?:[.,]\d+)?)\s*$/);
    if (!m) return;
    e.preventDefault();
    setLat(m[1].replace(",", "."));
    setLng(m[2].replace(",", "."));
  }

  const ok = (section: string, text: string) => saved === section && <p className="message message--ok">✅ {text}</p>;

  return (
    <div className="admin-page">
      <header className="admin-head">
        <h1 className="admin-title">✅ Check-in</h1>
      </header>
      {error && <p className="message message--error">{error}</p>}

      {/* ── 1. window ── */}
      <form
        className="cat-form"
        onSubmit={(e) => {
          e.preventDefault();
          if (orderOk) void save("window", { checkinWindow: { from: fromIso, until: untilIso } });
        }}
      >
        <h2 className="cat-form__title">⏰ Janela de horário do check-in</h2>
        <p className="cat-hint">
          Vale para os ajudantes da igreja <strong>e</strong> do ônibus. Só dentro deste horário eles recebem os dados das crianças e
          conseguem fazer check-in; fora dele, nada é enviado para o celular deles.
        </p>
        <div className="cat-form__row staff-form__row">
          <label className="cat-field cat-field--grow">
            <span className="cat-field__label">Abre em</span>
            <input className="cat-input" type="datetime-local" value={from} disabled={!!busy} onChange={(e) => setFrom(e.target.value)} />
          </label>
          <label className="cat-field cat-field--grow">
            <span className="cat-field__label">Fecha em</span>
            <input className="cat-input" type="datetime-local" value={until} disabled={!!busy} onChange={(e) => setUntil(e.target.value)} />
          </label>
        </div>
        {testMode && <p className="cat-hint">🧪 Modo de teste ligado — igreja e ônibus estão liberados agora, independente da janela.</p>}
        {!orderOk ? (
          <p className="cat-hint cat-hint--error">O fim da janela precisa ser depois do início.</p>
        ) : windowComplete ? (
          <p className="cat-hint">
            {openNow
              ? `🟢 Aberta agora — fecha ${fmt.format(new Date(untilIso!))}`
              : new Date(fromIso!).getTime() > now
                ? `🕒 Abre ${fmt.format(new Date(fromIso!))} até ${fmt.format(new Date(untilIso!))}`
                : `⚫ Fechada — era ${fmt.format(new Date(fromIso!))} até ${fmt.format(new Date(untilIso!))}`}
            .
          </p>
        ) : null}
        {ok("window", openNow ? "Janela salva — está aberta agora." : "Janela salva.")}
        <div className="cat-form__actions">
          <button type="submit" className="button button--primary" disabled={!orderOk || !windowDirty || !!busy}>
            {busy === "window" ? "Salvando…" : "Salvar horário ⏰"}
          </button>
        </div>
      </form>

      {/* ── 2. church helpers ── */}
      <section className="cat-form">
        <StaffListEditor
          title="⛪ Ajudantes do check-in na igreja"
          hint={
            <>
              Durante a janela, veem <strong>todas as crianças</strong> (com os dados de saúde, para conferir com os pais)
            </>
          }
          value={church}
          onChange={(ids) => void saveChurch(ids)}
          disabled={!!busy}
          pickerTitle="Adicionar ajudante da igreja"
          empty="Ninguém escolhido. Só o admin faz o check-in na igreja."
        />
      </section>

      {/* ── 3. bus helpers ── */}
      <section className="cat-form">
        <BusHelpersEditor value={bus} onChange={(helpers) => void saveBus(helpers)} disabled={!!busy} />
      </section>

      {/* ── 4. location ── */}
      <form
        className="cat-form"
        onSubmit={(e) => {
          e.preventDefault();
          if (locValid) void save("location", { checkinLocation: { lat: latN, lng: lngN, radiusM: Math.round(radiusN) } });
        }}
      >
        <h2 className="cat-form__title">📍 Ponto de encontro da equipe</h2>
        <p className="cat-hint">
          Cada pessoa da equipe faz o <strong>próprio check-in</strong> pelo celular ao chegar na igreja, uma hora antes do primeiro evento —
          desde que esteja a até <strong>{radiusOk ? Math.round(radiusN) : "?"} m</strong> deste ponto.
        </p>
        <div className="cat-form__row staff-form__row">
          <label className="cat-field cat-field--grow">
            <span className="cat-field__label">Latitude</span>
            <input className="cat-input" inputMode="decimal" placeholder="-23.480536" value={lat} disabled={!!busy} onChange={(e) => setLat(e.target.value)} onPaste={handleLatPaste} />
          </label>
          <label className="cat-field cat-field--grow">
            <span className="cat-field__label">Longitude</span>
            <input className="cat-input" inputMode="decimal" placeholder="-46.830779" value={lng} disabled={!!busy} onChange={(e) => setLng(e.target.value)} />
          </label>
          <label className="cat-field" style={{ width: 160 }}>
            <span className="cat-field__label">Raio (metros)</span>
            <input className="cat-input" type="number" inputMode="numeric" min={RADIUS_MIN} max={RADIUS_MAX} step={10} value={radius} disabled={!!busy} onChange={(e) => setRadius(e.target.value)} />
          </label>
        </div>
        {(lat.trim() !== "" && !latOk) || (lng.trim() !== "" && !lngOk) ? (
          <p className="cat-hint cat-hint--error">Latitude entre -90 e 90, longitude entre -180 e 180.</p>
        ) : !radiusOk ? (
          <p className="cat-hint cat-hint--error">
            O raio precisa estar entre {RADIUS_MIN} e {RADIUS_MAX} metros.
          </p>
        ) : (
          <p className="cat-hint">
            Dica: no Google Maps, clique com o botão direito no local e copie as coordenadas — dá para colar as duas de uma vez no campo Latitude. O GPS
            erra algumas dezenas de metros; 200–500 m costuma ser um bom raio.
          </p>
        )}
        <div className="settings-tools">
          <button type="button" className="button button--secondary" disabled={!!busy || locating} onClick={useMyPosition}>
            {locating ? "Lendo o GPS…" : "📡 Usar minha localização atual"}
          </button>
          {preview && (
            <a className="button button--secondary" href={mapsLink(preview)} target="_blank" rel="noreferrer">
              🗺️ Ver no mapa
            </a>
          )}
          <button type="button" className="button button--secondary" disabled={!!busy} title="Igreja Presbiteriana em Alphaville" onClick={() => fillLocation(DEFAULT_CHECKIN_LOCATION)}>
            ↺ Padrão (IPAlpha Tambore)
          </button>
        </div>
        {ok("location", "Local salvo! A equipe já pode usar no dia da saída.")}
        <div className="cat-form__actions">
          <button type="submit" className="button button--primary" disabled={!locValid || !locDirty || !!busy}>
            {busy === "location" ? "Salvando…" : "Salvar local 📍"}
          </button>
        </div>
      </form>

      {/* ── 5. rehearsal tools (also on Geral) ── */}
      <CheckinTestTools token={token} />

      <p className="footer-note">
        🔒 Os ajudantes nunca veem os dados dos outros membros da equipe. Os check-ins que registram ficam no histórico com o nome deles.
      </p>
    </div>
  );
}
