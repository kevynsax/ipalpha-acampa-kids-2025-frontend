import { useEffect, useMemo, useRef, useState } from "react";
import { addAdmin, listAdmins, removeAdmin, type AdminAccount, type AdminsInfo } from "../api/admins";
import { createBedroom } from "../api/bedrooms";
import { createTransport, type TransportInput } from "../api/transports";
import { createEvent, createRole } from "../api/schedule";
import { createInstruction } from "../api/instructions";
import { createPrepSection } from "../api/preparation";
import { fetchSeeds, type SeedBus, type SeedDocs, type Seeds } from "../api/seeds";
import { loadSampleCamp, type SampleLoad } from "../api/wizard";
import { applySampleSchedule } from "./sampleSchedule";
import { sampleSchedulePlan } from "./sampleScheduleDates";
import { mapsLink, updateSettings, type NotificationSettings } from "../api/settings";
import PhoneInput from "../components/PhoneInput";
import SpotMap from "../components/SpotMap";
import Toggle from "../components/Toggle";
import AccessWindowCard from "../pages/admin/AccessWindowCard";
import BusAssignPage from "../pages/admin/BusAssignPage";
import CheckinSettingsPage from "../pages/admin/CheckinSettingsPage";
import RoomAssignPage from "../pages/admin/RoomAssignPage";
import BedroomsPage from "../pages/admin/BedroomsPage";
import CamperImportPage from "../pages/admin/CamperImportPage";
import SmsRedirectCard from "../pages/admin/SmsRedirectCard";
import StaffImportPage from "../pages/admin/StaffImportPage";
import StaffListEditor from "../pages/admin/StaffListEditor";
import { useRoute } from "../router";
import { useCollection, useCollectionOrEmpty, useHydrated } from "../store";
import { ICONS } from "../icons";
import type { LoggedUser } from "../roles";
import { toE164 } from "../phone";
import { formatBrazilPhoneClient } from "../phoneFormat";
import { whatsappLink } from "../whatsapp";
import { CAMP_SPOT_RADIUS_M, type KnownPlace, type KnownPlaceRoom } from "./places";
import { DAY_LABELS, type TemplateEvent, type TemplateRole } from "./scheduleTemplate";
import { defaultSeeds } from "./defaults";
import RoomsEditor from "./RoomsEditor";
import { recalledWizardPlace, rememberWizardPlace, setWizardDismissed, type WizardPlaceChoice } from "./state";

/**
 * 🏕️ Assistente de configuração — the guided setup that takes a freshly
 * cleaned (or brand-new) camp from zero to ready: invite the admin, import
 * the team and the kids, pick the known camp site (rooms + address), prefill
 * the programme, write the first documents, set the important windows and
 * lists, then organize rooms and buses.
 *
 * Every step reuses the SAME components the app's own sections use (the
 * import pages, the access-window cards, the check-in settings page, the
 * room / bus boards), so the wizard keeps working as those screens evolve.
 * Steps can be skipped and revisited — the stepper on top jumps anywhere.
 */

type StepId = "intro" | "admins" | "staff" | "campers" | "venue" | "schedule" | "docs" | "config" | "rooms" | "buses" | "done";

interface StepMeta {
  id: StepId;
  label: string;
  emoji?: string;
  icon?: string;
}

const STEPS: readonly StepMeta[] = [
  { id: "intro", label: "Boas-vindas", emoji: "🏕️" },
  { id: "admins", label: "Admins", emoji: "🔑" },
  { id: "staff", label: "Equipe", icon: ICONS.staffPair },
  { id: "campers", label: "Acampantes", icon: ICONS.importCampers },
  { id: "venue", label: "Local", emoji: "📍" },
  { id: "schedule", label: "Programação", icon: ICONS.schedule },
  { id: "docs", label: "Documentos", emoji: "📖" },
  { id: "config", label: "Configurações", emoji: "⚙️" },
  { id: "rooms", label: "Quartos", icon: ICONS.roomAssign },
  { id: "buses", label: "Ônibus", icon: ICONS.transport },
  { id: "done", label: "Pronto", emoji: "🎉" },
] as const;

interface WizardPageProps {
  token: string;
  user: LoggedUser;
  /** leave the wizard (back to the app) */
  onExit: () => void;
}

export default function WizardPage({ token, user, onExit }: WizardPageProps) {
  const { params, navigate } = useRoute();
  const asked = params.get("step") as StepId | null;
  const step: StepId = STEPS.some((s) => s.id === asked) ? (asked as StepId) : "intro";
  const index = STEPS.findIndex((s) => s.id === step);
  const go = (id: StepId) => navigate("/wizard", { query: { step: id } });
  const next = () => go(STEPS[Math.min(index + 1, STEPS.length - 1)].id);
  const prev = () => go(STEPS[Math.max(index - 1, 0)].id);

  // 🌱 what the wizard imports: the super admin's saved seeds (⚙️ → Sementes),
  // falling back to the app's built-in defaults when nothing was saved (or offline)
  const [seeds, setSeeds] = useState<Seeds | null>(null);
  useEffect(() => {
    let alive = true;
    fetchSeeds(token)
      .then((s) => alive && setSeeds(s))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [token]);
  const templates = useMemo(() => seeds ?? defaultSeeds(), [seeds]);

  // each step starts at the top of the wizard body
  useEffect(() => {
    for (const selector of [".dash-scroll", ".dash"]) {
      const scroller = document.querySelector(selector);
      if (scroller) scroller.scrollTop = 0;
    }
    window.scrollTo({ top: 0 });
  }, [step]);

  function close() {
    setWizardDismissed(true);
    onExit();
  }

  return (
    <div className="wizard">
      <header className="wizard__head">
        <div className="wizard__heading">
          <img className="wizard__icon" src={ICONS.wizard} alt="" aria-hidden="true" />
          <div>
            <h1 className="wizard__title">Assistente de configuração</h1>
            <p className="wizard__subtitle">
              Etapa {index + 1} de {STEPS.length} · {STEPS[index].label} — dá para pular etapas e voltar quando quiser.
            </p>
          </div>
        </div>
        <button type="button" className="wizard__close" onClick={close} title="Sair do assistente">
          ✕ Sair
        </button>
      </header>

      <nav className="wizard__steps" aria-label="Etapas">
        {STEPS.map((s, i) => (
          <button
            key={s.id}
            type="button"
            className={`wizard__step ${s.id === step ? "wizard__step--current" : ""} ${i < index ? "wizard__step--seen" : ""}`}
            aria-current={s.id === step ? "step" : undefined}
            onClick={() => go(s.id)}
          >
            <span className="wizard__step-mark" aria-hidden="true">
              {s.icon ? <img src={s.icon} alt="" /> : s.emoji}
            </span>
            <span className="wizard__step-label">{s.label}</span>
          </button>
        ))}
      </nav>

      <div className="wizard__body">
        {step === "intro" && <IntroStep token={token} onNext={next} onSkip={close} />}
        {step === "admins" && <AdminsStep token={token} user={user} />}
        {step === "staff" && (
          <StepShell
            title="Importar a equipe"
            hint="A IA reconhece a planilha (CSV ou Excel) e você confere as dúvidas antes de gravar. Celular e quarto podem ficar vazios."
          >
            <StaffImportPage token={token} onBack={next} />
          </StepShell>
        )}
        {step === "campers" && (
          <StepShell title="Importar os acampantes" hint="A IA compara as colunas e cruza quartos, líderes, transporte, times e saúde. Nada é gravado sem a sua revisão.">
            <CamperImportPage token={token} onDone={next} />
          </StepShell>
        )}
        {step === "venue" && <VenueStep token={token} places={templates.places} onNext={next} />}
        {step === "schedule" && <ScheduleStep token={token} roles={templates.roles} events={templates.events} />}
        {step === "docs" && <DocsStep token={token} docs={templates.docs} />}
        {step === "config" && <ConfigStep token={token} />}
        {step === "rooms" && <RoomsStep token={token} />}
        {step === "buses" && <BusesStep token={token} fleet={templates.fleet} />}
        {step === "done" && <DoneStep onExit={close} />}
      </div>

      {step !== "intro" && step !== "done" && (
        <footer className="wizard__foot">
          <button type="button" className="button button--secondary" disabled={index === 0} onClick={prev}>
            ‹ Voltar
          </button>
          <button type="button" className="button button--secondary" onClick={next}>
            Pular etapa
          </button>
          <button type="button" className="button button--primary" onClick={next}>
            Continuar ›
          </button>
        </footer>
      )}
    </div>
  );
}

// ── intro ───────────────────────────────────────────────────────────────────

function IntroStep({ token, onNext, onSkip }: { token: string; onNext: () => void; onSkip: () => void }) {
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState<(SampleLoad & { events: number }) | null>(null);
  const roles = useCollectionOrEmpty("roles");
  const events = useCollectionOrEmpty("events");

  async function loadSample() {
    if (testing || loaded) return;
    setTesting(true);
    setError(null);
    try {
      const r = await loadSampleCamp(token);
      const applied = await applySampleSchedule(token, sampleSchedulePlan(), { roles, events });
      setLoaded({ ...r, events: applied.events });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Algo deu errado.");
    } finally {
      setTesting(false);
    }
  }

  return (
    <section className="wizard-card wizard-card--intro">
      <div className="confetti" aria-hidden="true">🏕️ 🚌 🛏️ 📅 🎉</div>
      <h2 className="wizard-card__title">Vamos montar o acampamento! 🏕️</h2>
      <p className="admin-intro">
        O app está <strong>zerado</strong>, pronto para um novo acampamento. Em poucos passos ele fica inteiro — importando a equipe e as
        crianças, escolhendo o local conhecido, preenchendo a programação e ajustando as configurações importantes.
      </p>
      <ul className="wizard-list">
        <li>🔑 Convidar quem mais vai administrar (recebe o link por SMS ou WhatsApp)</li>
        <li>🧢 Importar a <strong>equipe</strong> e os <strong>acampantes</strong> das planilhas</li>
        <li>📍 Escolher o <strong>local</strong> — quartos, endereço e mapa já vêm preenchidos</li>
        <li>📅 Pré-visualizar a <strong>programação</strong> modelo e tirar o que não vale</li>
        <li>📖 Criar a primeira <strong>Preparação</strong> e a instrução com o <strong>endereço</strong></li>
        <li>⚙️ Janelas de acesso, check-in, organizadores e SMS</li>
        <li>🛏️ Organizar os <strong>quartos</strong> e os <strong>ônibus</strong> (4 já vêm prontos)</li>
      </ul>
      <p className="cat-hint">Dá para pular etapas, voltar e reabrir este assistente depois (Limpeza ou Perfil).</p>

      {error && <p className="message message--error">{error}</p>}
      {loaded ? (
        <div className="wizard-test">
          <p className="message message--ok">
            ✅ Camp de exemplo carregado: <strong>{loaded.campers} acampantes</strong>, <strong>{loaded.staff} pessoas na equipe</strong>,{" "}
            {loaded.bedrooms} quartos, {loaded.transports} veículos, {loaded.teams} times e {loaded.events} eventos — tudo <strong>fictício</strong>,
            {" "}com a programação e as janelas (equipe, pais, check-in e volta) valendo a partir de hoje. Continue o passo a passo ou vá direto
            explorar as abas.
          </p>
          <div className="cat-form__actions">
            <button type="button" className="button button--secondary" onClick={onSkip}>
              Explorar o app
            </button>
            <button type="button" className="button button--primary" onClick={onNext}>
              Continuar o assistente ›
            </button>
          </div>
        </div>
      ) : (
        <div className="wizard-test">
          <div className="wizard-test__head">
            <h3 className="cat-form__title">🧪 Testar o sistema</h3>
          </div>
          <p className="cat-hint">
            Carrega um acampamento de exemplo com 154 acampantes e 72 pessoas na equipe — baseado no acampamento real, mas{" "}
            <strong>fictício</strong>: nomes embaralhados dentro do mesmo gênero e celulares, CPFs, RGs e e-mails aleatórios. A programação e as
            janelas vêm ancoradas em hoje (primeiro dia amanhã). Só funciona com o app zerado.
          </p>
          <div className="cat-form__actions">
            <button type="button" className="button button--secondary" disabled={testing} onClick={() => void loadSample()}>
              {testing ? "Carregando… 🧪" : "Carregar dados de exemplo"}
            </button>
          </div>
        </div>
      )}

      {!loaded && (
        <div className="cat-form__actions">
          <button type="button" className="button button--secondary" onClick={onSkip}>
            Agora não
          </button>
          <button type="button" className="button button--primary" onClick={onNext}>
            Começar do zero 🚀
          </button>
        </div>
      )}
    </section>
  );
}

// ── admins (super user invites the admin) ──────────────────────────────────

function AdminsStep({ token, user }: { token: string; user: LoggedUser }) {
  const [info, setInfo] = useState<AdminsInfo | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [added, setAdded] = useState<AdminAccount | null>(null);
  const [smsSent, setSmsSent] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let alive = true;
    setError(null);
    listAdmins(token)
      .then((i) => alive && setInfo(i))
      .catch((e) => alive && setError(e instanceof Error ? e.message : "Não foi possível carregar os admins."));
    return () => {
      alive = false;
    };
  }, [token]);

  const link = info?.appUrl || window.location.origin;
  const e164 = toE164(phone);

  async function add() {
    if (busy || !name.trim() || !e164) return;
    setBusy(true);
    setError(null);
    setCopied(false);
    try {
      const r = await addAdmin(token, { name: name.trim(), phone: e164 });
      setAdded(r.admin);
      setSmsSent(r.smsSent);
      setName("");
      setPhone("");
      setInfo(await listAdmins(token));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Algo deu errado.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(a: AdminAccount) {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await removeAdmin(token, a.id);
      setInfo(await listAdmins(token));
      setAdded((kept) => (kept?.id === a.id ? null : kept));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Algo deu errado.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="wizard-card">
      <h2 className="wizard-card__title">🔑 Administradores</h2>
      <p className="admin-intro">
        Quem administra o app convida quem mais vai cuidar da configuração. A pessoa entra com o <strong>próprio celular</strong> (código por
        SMS) — mande o link para ela.
      </p>
      {error && <p className="message message--error">{error}</p>}

      {info && (
        <ul className="wizard-admins">
          {info.admins.map((a) => (
            <li key={a.id} className="wizard-admins__row">
              <span className="wizard-admins__name">
                {a.name} {a.id === user.id && <span className="cat-hint">(você)</span>}
                {a.superAdmin && <span className="cat-hint"> · admin da implantação</span>}
              </span>
              <span className="wizard-admins__phone">{formatBrazilPhoneClient(a.phone)}</span>
              {!a.superAdmin && a.id !== user.id && (
                <button type="button" className="helpers-tag__x" title="Remover acesso de admin" aria-label={`Remover ${a.name}`} disabled={busy} onClick={() => void remove(a)}>
                  ✕
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      <form
        className="cat-form"
        onSubmit={(e) => {
          e.preventDefault();
          void add();
        }}
      >
        <div className="cat-form__row staff-form__row">
          <label className="cat-field cat-field--grow">
            <span className="cat-field__label">Nome</span>
            <input className="cat-input" placeholder="Quem vai administrar" value={name} maxLength={80} disabled={busy} onChange={(e) => setName(e.target.value)} />
          </label>
          <label className="cat-field cat-field--grow">
            <span className="cat-field__label">Celular</span>
            <PhoneInput value={phone} onChange={setPhone} disabled={busy} />
          </label>
        </div>
        <div className="cat-form__actions">
          <button type="submit" className="button button--primary" disabled={busy || !name.trim() || !e164}>
            {busy ? "Adicionando…" : "Adicionar e enviar link"}
          </button>
        </div>
      </form>

      {added && (
        <div className="wizard-invite">
          <p className="message message--ok">
            ✅ <strong>{added.name}</strong> já é admin.{smsSent ? " O link já foi mandado por SMS —" : ""} Envie o link:
          </p>
          <div className="cat-form__actions">
            <a className="button button--secondary" href={whatsappLink(added.phone, `Olá! Você agora administra o Acampa Kids 🏕️ Entre com este celular: ${link}`)} target="_blank" rel="noreferrer">
              Mandar no WhatsApp
            </a>
            <button
              type="button"
              className="button button--secondary"
              onClick={() => {
                void navigator.clipboard?.writeText(link).then(() => setCopied(true));
              }}
            >
              {copied ? "✓ Copiado" : "Copiar link"}
            </button>
          </div>
          <p className="cat-hint">{link}</p>
        </div>
      )}
    </section>
  );
}

// ── venue (known camping places) ───────────────────────────────────────────

const spotDraft = (v: string) => v.replace(",", ".");

function VenueStep({ token, places, onNext }: { token: string; places: KnownPlace[]; onNext: () => void }) {
  const settings = useCollection("settings");
  const bedrooms = useCollectionOrEmpty("bedrooms");
  const recalled = useRef(recalledWizardPlace()).current;
  const [placeId, setPlaceId] = useState<string>(recalled?.id ?? places[0]?.id ?? "");
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [rooms, setRooms] = useState<KnownPlaceRoom[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [applied, setApplied] = useState(0);

  // fill from the catalog (or from what this device already chose)
  useEffect(() => {
    const place = places.find((p) => p.id === placeId);
    if (place) {
      setName(place.name);
      setAddress(recalled?.id === place.id ? recalled.address : place.address);
      setLat(place.lat != null ? String(place.lat) : "");
      setLng(place.lng != null ? String(place.lng) : "");
      setRooms(place.rooms.map((r) => ({ ...r })));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placeId, places]);

  const latN = Number(spotDraft(lat));
  const lngN = Number(spotDraft(lng));
  const coordsOk = !lat && !lng ? true : Number.isFinite(latN) && Math.abs(latN) <= 90 && Number.isFinite(lngN) && Math.abs(lngN) <= 180;
  const capacity = rooms.reduce((n, r) => n + r.bunkBeds * 2 + r.singleBeds, 0);
  /** rooms the camp doesn't have yet (matched by name + wing) */
  const existing = useMemo(() => new Set(bedrooms.map((b) => `${b.group}:${b.name.trim()}`)), [bedrooms]);
  const toCreate = rooms.filter((r) => r.name.trim() && !existing.has(`${r.group}:${r.name.trim()}`));

  async function apply() {
    if (busy || !coordsOk) return;
    setBusy(true);
    setError(null);
    try {
      let created = 0;
      for (const r of toCreate) {
        await createBedroom(token, { name: r.name.trim(), group: r.group, bunkBeds: r.bunkBeds, singleBeds: r.singleBeds, notes: "" });
        created++;
      }
      if (coordsOk && lat && lng) {
        const spot = { id: "acampamento", name: "Acampamento", lat: latN, lng: lngN, radiusM: CAMP_SPOT_RADIUS_M };
        const others = (settings?.checkinLocations ?? []).filter((l) => l.id !== spot.id);
        await updateSettings(token, { checkinLocations: [...others, spot] });
      }
      rememberWizardPlace({ id: placeId, name: name.trim() || "Acampamento", address: address.trim() });
      setApplied(created);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Algo deu errado.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="wizard-card">
      <h2 className="wizard-card__title">📍 O local do acampamento</h2>
      <p className="admin-intro">
        O assistente conhece os lugares que a igreja já usa — os <strong>quartos com as camas</strong>, o endereço e a localização vêm
        preenchidos. Confira, ajuste o que mudou e aplique.
      </p>

      <div className="big-options">
        {places.map((p) => (
          <button key={p.id} type="button" className={`big-option ${placeId === p.id ? "big-option--on" : ""}`} aria-pressed={placeId === p.id} disabled={busy} onClick={() => setPlaceId(p.id)}>
            <span className="big-option__emoji" aria-hidden="true">🏕️</span>
            <span className="big-option__label">{p.name}</span>
            <span className="big-option__hint">{p.rooms.length} quartos</span>
          </button>
        ))}
      </div>
      {places.find((p) => p.id === placeId)?.notes && <p className="cat-hint">{places.find((p) => p.id === placeId)!.notes}</p>}

      <div className="cat-form__row staff-form__row">
        <label className="cat-field cat-field--grow">
          <span className="cat-field__label">Nome do local</span>
          <input className="cat-input" value={name} maxLength={80} disabled={busy} onChange={(e) => setName(e.target.value)} />
        </label>
        <label className="cat-field cat-field--grow">
          <span className="cat-field__label">Endereço</span>
          <input className="cat-input" placeholder="Rua, número, cidade" value={address} maxLength={160} disabled={busy} onChange={(e) => setAddress(e.target.value)} />
        </label>
      </div>
      <div className="cat-form__row staff-form__row">
        <label className="cat-field cat-field--grow">
          <span className="cat-field__label">Latitude</span>
          <input className="cat-input" inputMode="decimal" placeholder="-23.480536" value={lat} disabled={busy} onChange={(e) => setLat(e.target.value)} />
        </label>
        <label className="cat-field cat-field--grow">
          <span className="cat-field__label">Longitude</span>
          <input className="cat-input" inputMode="decimal" placeholder="-46.830779" value={lng} disabled={busy} onChange={(e) => setLng(e.target.value)} />
        </label>
      </div>
      {!coordsOk && <p className="cat-hint cat-hint--error">Latitude entre -90 e 90, longitude entre -180 e 180.</p>}
      {lat && lng && coordsOk && (
        <SpotMap lat={latN} lng={lngN} radiusM={CAMP_SPOT_RADIUS_M} onMove={(p) => { setLat(String(p.lat)); setLng(String(p.lng)); }} />
      )}

      <div className="list-head">
        <h3 className="cat-form__title">
          Quartos {!capacity || <span className="cat-tab__count">{rooms.length} · {capacity} camas</span>}
        </h3>
      </div>
      <RoomsEditor rooms={rooms} onChange={setRooms} disabled={busy} />

      {error && <p className="message message--error">{error}</p>}
      {applied > 0 && <p className="message message--ok">✅ {applied} quarto(s) criado(s){lat && lng ? " e ponto do acampamento salvo" : ""}. Continue nos passos de Quartos para alocar as crianças.</p>}
      {applied === 0 && bedrooms.length > 0 && <p className="cat-hint">O acampamento já tem {bedrooms.length} quarto(s); só os novos nomes serão criados.</p>}
      <div className="cat-form__actions">
        <button type="button" className="button button--primary" disabled={busy || !coordsOk || (toCreate.length === 0 && !(lat && lng))} onClick={() => void apply()}>
          {busy ? "Aplicando…" : toCreate.length > 0 ? `Aplicar (${toCreate.length} quartos)` : "Salvar local"}
        </button>
        <button type="button" className="button button--secondary" onClick={onNext}>
          Continuar ›
        </button>
      </div>
    </section>
  );
}

// ── schedule prefill ───────────────────────────────────────────────────────

function isoDate(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function nextFriday(): string {
  const d = new Date();
  const delta = ((5 - d.getDay() + 7) % 7) || 7;
  d.setDate(d.getDate() + delta);
  return isoDate(d);
}

function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + days);
  return isoDate(d);
}

function ScheduleStep({ token, roles, events }: { token: string; roles: TemplateRole[]; events: TemplateEvent[] }) {
  const existingEvents = useCollectionOrEmpty("events");
  const existingRoles = useCollectionOrEmpty("roles");
  const [firstDay, setFirstDay] = useState(nextFriday);
  const [kept, setKept] = useState<Set<number>>(() => new Set(events.map((_, i) => i)));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [applied, setApplied] = useState(false);

  const roleByKey = useMemo(() => new Map(roles.map((r) => [r.key, r])), [roles]);
  const selected = events.filter((_, i) => kept.has(i));
  const roleKeys = useMemo(() => [...new Set(selected.flatMap((e) => e.roles))], [selected]);
  const norm = (s: string) => s.trim().toLocaleLowerCase("pt-BR").replace(/\s+/g, " ");
  const missingRoles = roleKeys.filter((k) => !existingRoles.some((r) => norm(r.name) === norm(roleByKey.get(k)?.name ?? k)));

  const toggle = (i: number) =>
    setKept((s) => {
      const n = new Set(s);
      if (n.has(i)) n.delete(i);
      else n.add(i);
      return n;
    });
  const toggleDay = (day: 1 | 2 | 3) =>
    setKept((s) => {
      const dayIdx = events.map((e, i) => [e, i] as const).filter(([e]) => e.day === day);
      const allOn = dayIdx.every(([, i]) => s.has(i));
      const n = new Set(s);
      for (const [, i] of dayIdx) if (allOn) n.delete(i);
      else n.add(i);
      return n;
    });

  async function apply() {
    if (busy || selected.length === 0) return;
    setBusy(true);
    setError(null);
    try {
      // funções first (events reference them); reuse an existing one with the same name
      const byName = new Map(existingRoles.map((r) => [norm(r.name), r.id]));
      const keyToId = new Map<string, string>();
      for (const key of roleKeys) {
        const t = roleByKey.get(key);
        if (!t) continue;
        const found = byName.get(norm(t.name));
        if (found) {
          keyToId.set(key, found);
          continue;
        }
        const created = await createRole(token, {
          name: t.name,
          emoji: t.emoji,
          instructions: "",
          preparation: "",
          forRoomRoles: t.forRoomRoles,
          hasDetail: !!t.hasDetail,
          detailFromTeam: !!t.detailFromTeam,
          detailPlaceholder: t.detailPlaceholder ?? "",
        });
        keyToId.set(key, created.id);
      }
      for (const ev of selected) {
        await createEvent(token, {
          date: addDays(firstDay, ev.day - 1),
          title: ev.title,
          emoji: ev.emoji,
          startTime: ev.start,
          endTime: ev.end,
          notes: ev.notes ?? "",
          roles: ev.roles.map((k) => keyToId.get(k)).filter((x): x is string => !!x),
          visibleToParents: ev.visibleToParents !== false,
        });
      }
      setApplied(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Algo deu errado.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="wizard-card">
      <h2 className="wizard-card__title">📅 Programação modelo</h2>
      <p className="admin-intro">
        A estrutura de um Acampa Kids (sexta à noite → domingo à tarde) já vem pronta, <strong>com as funções de cada evento</strong>. Tire o
        que não vale neste ano e importe — depois ajuste horários e escala em Programação.
      </p>

      <label className="cat-field wizard-firstday">
        <span className="cat-field__label">Primeiro dia (6ª-feira)</span>
        <input className="cat-input" type="date" value={firstDay} disabled={busy} onChange={(e) => setFirstDay(e.target.value)} />
      </label>

      {([1, 2, 3] as const).map((day) => {
        const rows = events.map((e, i) => [e, i] as const).filter(([e]) => e.day === day);
        const on = rows.filter(([, i]) => kept.has(i)).length;
        return (
          <div key={day} className="wizard-day">
            <div className="room-group__head">
              <h3 className="room-group__title room-group__title--green">
                📆 {DAY_LABELS[day]} <span className="cat-hint">{addDays(firstDay, day - 1).split("-").reverse().join("/")}</span>
              </h3>
              <span className="room-group__stats">{on}/{rows.length}</span>
              <button type="button" className="icon-btn" title={on === rows.length ? "Desmarcar o dia" : "Marcar o dia"} disabled={busy} onClick={() => toggleDay(day)}>
                {on === rows.length ? "−" : "+"}
              </button>
            </div>
            <ul className="wizard-schedule">
              {rows.map(([e, i]) => (
                <li key={i}>
                  <button type="button" className={`wizard-schedule__item ${kept.has(i) ? "wizard-schedule__item--on" : ""}`} aria-pressed={kept.has(i)} disabled={busy} onClick={() => toggle(i)} title={kept.has(i) ? "Tirar da importação" : "Voltar para a importação"}>
                    <span className="wizard-schedule__time">{e.start}</span>
                    <span className="wizard-schedule__title">
                      <span aria-hidden="true">{e.emoji}</span> {e.title}
                      {e.visibleToParents === false && <span className="cat-hint"> · só a equipe</span>}
                    </span>
                    <span className="wizard-schedule__roles">
                      {e.roles.map((k) => roleByKey.get(k)).filter(Boolean).map((r) => (
                        <span key={r!.key} className="staff-tag" title={`Função: ${r!.name}`}>
                          {r!.emoji}
                        </span>
                      ))}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        );
      })}

      {error && <p className="message message--error">{error}</p>}
      {applied && <p className="message message--ok">✅ Programação importada! Ajuste horários e escala na aba Programação.</p>}
      {!applied && existingEvents.length > 0 && <p className="message message--warn">Já existem {existingEvents.length} evento(s) — a importação acrescenta os marcados abaixo sem tocar nos outros.</p>}
      <div className="cat-form__actions">
        <span className="cat-hint wizard-schedule__count">
          {selected.length} evento(s) · {missingRoles.length} função(ões) nova(s) de {roleKeys.length}
        </span>
        <button type="button" className="button button--primary" disabled={busy || selected.length === 0} onClick={() => void apply()}>
          {busy ? "Importando…" : "Importar programação"}
        </button>
      </div>
    </section>
  );
}

// ── first preparation + address instruction ────────────────────────────────

const escapeHtml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function DocsStep({ token, docs }: { token: string; docs: SeedDocs }) {
  const instructions = useCollectionOrEmpty("instructions");
  const preparation = useCollectionOrEmpty("preparation");
  const settings = useCollection("settings");
  const recalled = useRef(recalledWizardPlace()).current;
  const campSpot = settings?.checkinLocations.find((l) => l.id === "acampamento");
  const [address, setAddress] = useState(recalled?.address ?? "");
  const [busy, setBusy] = useState<"prep" | "address" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [createdPrep, setCreatedPrep] = useState(false);
  const [createdAddress, setCreatedAddress] = useState(false);

  const hasAddressDoc = createdAddress || instructions.some((i) => /endere/i.test(i.title) || i.title.trim().toLocaleLowerCase() === docs.addressTitle.trim().toLocaleLowerCase());
  const hasPrep = createdPrep || preparation.length > 0;
  const maps = campSpot ? mapsLink(campSpot) : null;
  const where = address.trim() || (recalled ? `${recalled.name}${recalled.address ? ` — ${recalled.address}` : ""}` : "");

  async function createAddressDoc() {
    if (busy) return;
    setBusy("address");
    setError(null);
    try {
      const content = `<p><strong>${escapeHtml(recalled?.name ?? "Acampamento")}</strong>${where ? `<br>${escapeHtml(where)}` : ""}</p>${maps ? `<p><a href="${maps}">Ver no Google Maps</a></p>` : ""}`;
      await createInstruction(token, { title: docs.addressTitle, emoji: docs.addressEmoji, audience: "all", content });
      setCreatedAddress(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Algo deu errado.");
    } finally {
      setBusy(null);
    }
  }

  async function createFirstPrep() {
    if (busy) return;
    setBusy("prep");
    setError(null);
    try {
      await createPrepSection(token, { title: docs.prepTitle, emoji: docs.prepEmoji, audiences: ["parent", "caretaker", "helper"], content: docs.prepContent });
      setCreatedPrep(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Algo deu errado.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="wizard-card">
      <h2 className="wizard-card__title">📖 Primeiros documentos</h2>
      <p className="admin-intro">
        Dois textos que todo acampamento precisa: a <strong>Preparação</strong> “O que levar na mala” e a instrução com o{" "}
        <strong>endereço do local</strong>. Depois você edita os dois nas páginas de Preparação e Instruções.
      </p>
      {error && <p className="message message--error">{error}</p>}

      <section className="cat-form">
        <h3 className="cat-form__title">{docs.addressEmoji} Instrução com o endereço</h3>
        {hasAddressDoc ? (
          <p className="message message--ok">✅ Instrução de endereço criada — confira em ⚙️ → Instruções.</p>
        ) : (
          <>
            <label className="cat-field">
              <span className="cat-field__label">Endereço {recalled ? `(${recalled.name})` : ""}</span>
              <input className="cat-input" placeholder="Rua, número, cidade" value={address} maxLength={160} disabled={busy !== null} onChange={(e) => setAddress(e.target.value)} />
            </label>
            {maps && (
              <p className="cat-hint">
                Localização do passo anterior: <a href={maps} target="_blank" rel="noreferrer">ver no mapa</a>
              </p>
            )}
            <div className="cat-form__actions">
              <button type="button" className="button button--primary" disabled={busy !== null || !where} onClick={() => void createAddressDoc()}>
                {busy === "address" ? "Criando…" : "Criar instrução"}
              </button>
            </div>
          </>
        )}
      </section>

      <section className="cat-form">
        <h3 className="cat-form__title">{docs.prepEmoji} Primeira Preparação</h3>
        {hasPrep ? (
          <p className="message message--ok">✅ Já existe {preparation.length || 1} comunicação(ões) de Preparação.</p>
        ) : (
          <>
            <p className="cat-hint">“{docs.prepTitle}”, publicada para pais, líderes e auxiliares — liste roupas, roupa de cama, bíblia…</p>
            <div className="cat-form__actions">
              <button type="button" className="button button--primary" disabled={busy !== null} onClick={() => void createFirstPrep()}>
                {busy === "prep" ? "Criando…" : <>Criar “{docs.prepTitle}”</>}
              </button>
            </div>
          </>
        )}
      </section>
    </section>
  );
}

// ── the important configs ──────────────────────────────────────────────────

/** every SMS switch (they all start OFF on a fresh camp) */
const ALL_NOTIFICATION_KEYS: (keyof NotificationSettings)[] = [
  "bedroomChanges", "roleChanges", "checkinConfirmation", "contentChanges", "parentContentChanges", "staffChanges", "enrolments",
  "occurrences", "checkinReminder", "parentEdits", "busCheckin", "parentWelcome", "birthdays", "photoPublishes",
];

function NotificationsGateCard({ token }: { token: string }) {
  const settings = useCollection("settings");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const redirect = settings?.smsRedirect;
  const hasTestPhone = !!(redirect?.staffPhone || redirect?.parentPhone);
  const onCount = settings ? ALL_NOTIFICATION_KEYS.filter((k) => settings.notifications[k]).length : 0;

  async function setAll(value: boolean) {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await updateSettings(token, { notifications: Object.fromEntries(ALL_NOTIFICATION_KEYS.map((k) => [k, value])) });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Algo deu errado.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="cat-form">
      <div className="cat-form__head">
        <h2 className="cat-form__title">
          <img className="admin-title__icon" src={ICONS.notifications} alt="" aria-hidden="true" /> Notificações por SMS
        </h2>
        <Toggle
          checked={onCount === ALL_NOTIFICATION_KEYS.length}
          disabled={!settings || busy || (!hasTestPhone && onCount === 0)}
          label={onCount === ALL_NOTIFICATION_KEYS.length ? "Todas ligadas" : onCount > 0 ? `${onCount} ligadas` : "Todas desligadas"}
          onChange={(v) => void setAll(v)}
        />
      </div>
      <p className="cat-hint">
        As notificações só podem ficar ligadas quando o <strong>redirecionamento de SMS</strong> tem celular de teste preenchido — enquanto
        não tiver, tudo continua desligado (ninguém recebe SMS de mentira). Ligue-as aqui ou uma a uma em Notificações.
      </p>
      {hasTestPhone ? (
        onCount > 0 && onCount < ALL_NOTIFICATION_KEYS.length ? (
          <p className="message message--warn">{onCount} de {ALL_NOTIFICATION_KEYS.length} notificações ligadas.</p>
        ) : null
      ) : (
        <p className="message message--warn">
          Sem celular de teste: preencha o “Redirecionar SMS” acima para poder ligar as notificações com segurança.
        </p>
      )}
      {error && <p className="message message--error">{error}</p>}
    </section>
  );
}

function ConfigStep({ token }: { token: string }) {
  const settings = useCollection("settings");
  const [organizerIds, setOrganizerIds] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (settings) setOrganizerIds(settings.organizers.staffIds);
  }, [settings]);

  async function saveOrganizers(nextIds: string[]) {
    if (busy) return;
    const previous = organizerIds;
    setOrganizerIds(nextIds);
    setBusy(true);
    setError(null);
    try {
      await updateSettings(token, { organizers: { staffIds: nextIds } });
    } catch (err) {
      setOrganizerIds(previous);
      setError(err instanceof Error ? err.message : "Algo deu errado.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="wizard-config">
      <section className="wizard-card">
        <h2 className="wizard-card__title">⚙️ Configurações importantes</h2>
        <p className="admin-intro">
          As janelas de acesso e de check-in, quem organiza, e o redirecionamento de SMS para os testes. Cada card salva por si — nada precisa
          ser preenchido de uma vez.
        </p>
        {error && <p className="message message--error">{error}</p>}
      </section>

      <AccessWindowCard token={token} which="staffAccessWindow" />
      <AccessWindowCard token={token} which="parentAccessWindow" />

      {/* the check-in page of the app: janela do check-in, da volta, pontos de encontro e ajudantes */}
      <div className="wizard__page">
        <CheckinSettingsPage token={token} />
      </div>

      <section className="cat-form">
        <StaffListEditor
          title={<span><img className="audience-icon" src={ICONS.organizer} alt="" aria-hidden="true" /> Organizadores</span>}
          hint={<>Acesso de administração (acampantes, equipe, quartos, programação…) sem ser admin</>}
          value={organizerIds}
          onChange={(ids) => void saveOrganizers(ids)}
          disabled={busy}
          pickerTitle="Adicionar organizador"
          empty="Ninguém escolhido ainda. Só o admin administra o app."
        />
      </section>

      <SmsRedirectCard token={token} />
      <NotificationsGateCard token={token} />
    </div>
  );
}

// ── rooms ───────────────────────────────────────────────────────────────────

function RoomsStep({ token }: { token: string }) {
  const [sub, setSub] = useState<"list" | "assign">("assign");
  return (
    <section className="wizard-card wizard-card--full">
      <h2 className="wizard-card__title">🛏️ Organizar os quartos</h2>
      <p className="admin-intro">
        O quadro sugere grupos pelas preferências das crianças; arraste para os quartos e <strong>Concluir</strong> aplica tudo de uma vez.
      </p>
      <div className="staff-toolbar__filters" role="tablist" aria-label="Quartos">
        <button type="button" role="tab" aria-selected={sub === "assign"} className={`cat-tab ${sub === "assign" ? "cat-tab--active" : ""}`} onClick={() => setSub("assign")}>
          <img className="cat-tab__img" src={ICONS.roomAssign} alt="" aria-hidden="true" /> Montar
        </button>
        <button type="button" role="tab" aria-selected={sub === "list"} className={`cat-tab ${sub === "list" ? "cat-tab--active" : ""}`} onClick={() => setSub("list")}>
          <img className="cat-tab__img" src={ICONS.bed} alt="" aria-hidden="true" /> Quartos
        </button>
      </div>
      {sub === "assign" ? (
        <div className="wizard__page">
          <RoomAssignPage token={token} onBack={() => setSub("list")} />
        </div>
      ) : (
        <div className="wizard__page">
          <BedroomsPage token={token} />
        </div>
      )}
    </section>
  );
}

// ── buses (prefilled from the seeds) ───────────────────────────────────────

function BusesStep({ token, fleet }: { token: string; fleet: SeedBus[] }) {
  const transports = useCollectionOrEmpty("transports");
  const hydrated = useHydrated();
  const [seeding, setSeeding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const seeded = useRef(false);

  // a clean camp gets the seeded fleet on entering the step — once, and only after the sync
  useEffect(() => {
    if (seeded.current || !hydrated || seeding) return;
    if (transports.length > 0) {
      seeded.current = true;
      return;
    }
    seeded.current = true;
    setSeeding(true);
    setError(null);
    (async () => {
      try {
        for (const bus of fleet) {
          const input: TransportInput = { kind: "bus", number: bus.number, color: bus.color, capacity: bus.capacity };
          await createTransport(token, input);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Algo deu errado.");
      } finally {
        setSeeding(false);
      }
    })();
  }, [hydrated, transports.length, seeding, token, fleet]);

  return (
    <section className="wizard-card wizard-card--full">
      <h2 className="wizard-card__title">🚌 Organizar os ônibus</h2>
      <p className="admin-intro">
        {transports.length === 0 && seeding === false
          ? "A frota foi limpa — cadastre os ônibus (e os carros que trazem crianças) e arraste as turmas."
          : `${fleet.length} ônibus coloridos já vieram prontos (edite cores, números e lugares). Arraste a turma de cada líder para o ônibus dela.`}
      </p>
      {error && <p className="message message--error">{error}</p>}
      {seeding ? <p className="opt-empty">Criando os ônibus… 🚌</p> : <div className="wizard__page"><BusAssignPage token={token} /></div>}
    </section>
  );
}

// ── done ────────────────────────────────────────────────────────────────────

function DoneStep({ onExit }: { onExit: () => void }) {
  const staff = useCollectionOrEmpty("staff");
  const campers = useCollectionOrEmpty("campers");
  const bedrooms = useCollectionOrEmpty("bedrooms");
  const events = useCollectionOrEmpty("events");
  const roles = useCollectionOrEmpty("roles");
  const preparation = useCollectionOrEmpty("preparation");
  const instructions = useCollectionOrEmpty("instructions");
  const transports = useCollectionOrEmpty("transports");
  const settings = useCollection("settings");

  const team = staff.filter((s) => s.active && !s.admin).length;
  const placed = campers.filter((k) => k.transportation).length;
  const rows: { label: string; value: string; ok: boolean }[] = [
    { label: "Equipe importada", value: `${team} pessoa(s)`, ok: team > 0 },
    { label: "Acampantes importados", value: `${campers.length} criança(s)`, ok: campers.length > 0 },
    { label: "Quartos criados", value: `${bedrooms.length} quarto(s)`, ok: bedrooms.length > 0 },
    { label: "Programação", value: `${events.length} evento(s) · ${roles.length} função(ões)`, ok: events.length > 0 },
    { label: "Documentos", value: `${preparation.length} preparação(ões) · ${instructions.length} instrução(ões)`, ok: preparation.length > 0 && instructions.length > 0 },
    {
      label: "Janelas e listas",
      value: `${settings?.checkinWindow.from ? "check-in ✓" : "check-in —"} · ${settings?.organizers.staffIds.length ?? 0} organizador(es)`,
      ok: !!settings?.checkinWindow.from,
    },
    { label: "Ônibus", value: `${transports.length} veículo(s) · ${placed}/${campers.length} crianças alocadas`, ok: transports.length > 0 },
  ];

  return (
    <section className="wizard-card wizard-card--intro">
      <div className="confetti" aria-hidden="true">🎉 🏕️ ✨ 🌲 🎈</div>
      <h2 className="wizard-card__title">Tudo pronto! 🎉</h2>
      <p className="admin-intro">Como ficou o acampamento:</p>
      <ul className="wizard-summary">
        {rows.map((r) => (
          <li key={r.label} className={r.ok ? "wizard-summary__ok" : ""}>
            <span aria-hidden="true">{r.ok ? "✅" : "•"}</span> <strong>{r.label}:</strong> {r.value}
          </li>
        ))}
      </ul>
      <p className="cat-hint">
        O que faltou dá para fazer depois nas próprias abas — ou reabrir este assistente em Limpeza / Perfil.
      </p>
      <div className="cat-form__actions">
        <button type="button" className="button button--primary" onClick={onExit}>
          Concluir 🏕️
        </button>
      </div>
    </section>
  );
}

// ── shared shell ───────────────────────────────────────────────────────────

function StepShell({ title, hint, children }: { title: string; hint: string; children: React.ReactNode }) {
  return (
    <section className="wizard-card wizard-card--full">
      <h2 className="wizard-card__title">{title}</h2>
      <p className="admin-intro">{hint}</p>
      <div className="wizard__page">{children}</div>
    </section>
  );
}
