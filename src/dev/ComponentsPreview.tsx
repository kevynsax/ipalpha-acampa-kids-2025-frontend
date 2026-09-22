import { useEffect, useRef, useState, type ReactNode } from "react";
import fixturesRaw from "./domainFixtures.json";
import { seedForDev } from "../store";
import { saveAuth } from "../auth/store";
import { ROLE_LIST, type LoggedUser } from "../roles";
import { ICONS, kidFaceSrc } from "../icons";
import type { Camper } from "../api/campers";
import { ROOM_ROLE_META, type RoomRole, type SelfCheckinBlock, type SelfCheckinStatus, type Staff } from "../api/staff";
import type { Team } from "../api/teams";
import type { Bedroom } from "../api/bedrooms";
import { BUS_COLORS, type Transport } from "../api/transports";
import type { MedicationDose } from "../api/medications";
import { CATEGORY_AUDIENCES } from "../api/categories";
import type { CampEvent } from "../api/schedule";
import type { MyKid } from "../store/derive";

import KidIcon from "../components/KidIcon";
import GroupIcon from "../components/GroupIcon";
import StaffIcon from "../components/StaffIcon";
import CamperIcon from "../components/CamperIcon";
import ParentIcon from "../components/ParentIcon";
import RoomRoleIcon from "../components/RoomRoleIcon";
import AudienceIcon from "../components/AudienceIcon";
import BedIcon from "../components/BedIcon";
import BunkIcon from "../components/BunkIcon";
import AutoRoleBadge from "../components/AutoRoleBadge";
import NoPillIcon from "../components/NoPillIcon";
import BusLogo from "../components/BusLogo";
import CarLogo from "../components/CarLogo";
import TeamTag from "../components/TeamTag";
import BedroomTag from "../components/BedroomTag";
import TransportTag from "../components/TransportTag";
import TransportMark from "../components/TransportMark";
import HealthFilter, { CAMPER_HEALTH_KEYS, hasHealth, type HealthKey } from "../components/HealthFilter";
import { PrepAudiencePicker, type PrepAudience } from "../components/AudiencePicker";
import ParentKidTabs from "../components/ParentKidTabs";
import { AssignmentCamperChip } from "../components/AssignmentChips";
import CamperCard from "../components/CamperCard";
import StaffMiniCard from "../components/StaffMiniCard";
import HealthAlerts, { healthLines } from "../components/HealthAlerts";
import MedicationChecklist from "../components/MedicationChecklist";
import MedicationsEditor from "../components/MedicationsEditor";
import SelfCheckinCard from "../components/SelfCheckinCard";
import SpotMap from "../components/SpotMap";
import CamperQr from "../components/CamperQr";
import WhatsAppButton from "../components/WhatsAppButton";
import GuardianWhatsApp from "../components/GuardianWhatsApp";
import QrScannerDialog from "../components/QrScannerDialog";
import { staffGreeting, whatsappLink } from "../whatsapp";

interface DomainFixtures {
  loggedUser: LoggedUser;
  teams: Team[];
  bedrooms: Bedroom[];
  transports: Transport[];
  campers: Camper[];
  staff: Staff[];
  doses: MedicationDose[];
  selfCheckin: SelfCheckinStatus;
  myKids: MyKid[];
}

const fixtures = fixturesRaw as unknown as DomainFixtures;

const camperById = new Map(fixtures.campers.map((c) => [c.id, c]));
const staffById = new Map(fixtures.staff.map((s) => [s.id, s]));
const bedroomById = new Map(fixtures.bedrooms.map((b) => [b.id, b]));
const transportById = new Map(fixtures.transports.map((t) => [t.id, t]));
const teamById = new Map(fixtures.teams.map((t) => [t.id, t]));

const camper = (id: string): Camper => camperById.get(id)!;
const staff = (id: string): Staff => staffById.get(id)!;

const MEDS_NOW = new Date("2026-09-18T14:05:00-03:00").getTime();

const DEV_EVENTS: CampEvent[] = [
  {
    id: "ev-dev-1",
    date: "2026-09-18",
    title: "Saída para o acampamento",
    emoji: "🚌",
    startTime: "00:01",
    endTime: null,
    notes: "",
    roles: [],
    visibleToParents: true,
    assignments: [],
    createdAt: "2026-08-01T12:00:00-03:00",
    updatedAt: "2026-08-01T12:00:00-03:00",
  },
];

seedForDev({
  campers: fixtures.campers,
  staff: fixtures.staff,
  bedrooms: fixtures.bedrooms,
  teams: fixtures.teams,
  transports: fixtures.transports,
  medications: fixtures.doses,
  events: DEV_EVENTS,
});

saveAuth({
  token: "dev-token",
  tokenExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  user: fixtures.loggedUser,
  camp: { id: "dev-camp", label: "Acampa Kids 2026", year: 2026, active: true, archivedAt: null },
  camps: [],
});

const labelOf = (id: string | null | undefined): string | null => id ?? null;

function Sub({ label, column, children }: { label: string; column?: boolean; children: ReactNode }) {
  return (
    <div className="dev-sub">
      <p className="cat-field__label">{label}</p>
      <div className={column ? undefined : "chip-group"} style={column ? { display: "flex", flexDirection: "column", gap: 16, alignItems: "flex-start" } : undefined}>
        {children}
      </div>
    </div>
  );
}

function Small({ children }: { children: ReactNode }) {
  return (
    <span style={{ display: "inline-flex", transform: "scale(0.82)", transformOrigin: "left center" }}>{children}</span>
  );
}

function IconsSection() {
  return (
    <>
      <Sub label="KidIcon">
        <KidIcon sex="girl" />
        <KidIcon sex="boy" />
        <img className="audience-icon" src={kidFaceSrc("F")} alt="" aria-hidden="true" style={{ width: 18, height: 18 }} />
        <img className="audience-icon" src={kidFaceSrc("M")} alt="" aria-hidden="true" style={{ width: 18, height: 18 }} />
        <KidIcon sex="girl" group />
        <KidIcon sex="boy" group />
      </Sub>
      <Sub label="GroupIcon">
        <GroupIcon group="girls" />
        <GroupIcon group="boys" />
        <GroupIcon group="staff" />
      </Sub>
      <Sub label="StaffIcon / CamperIcon / ParentIcon">
        <StaffIcon />
        <CamperIcon />
        <ParentIcon />
      </Sub>
      <Sub label="RoomRoleIcon">
        <RoomRoleIcon role="caretaker" sex="F" />
        <RoomRoleIcon role="caretaker" sex="M" />
        <RoomRoleIcon role="helper" sex="F" />
        <RoomRoleIcon role="helper" sex="M" />
      </Sub>
      <Sub label="AudienceIcon">
        {CATEGORY_AUDIENCES.map((a) => (
          <AudienceIcon key={a} audience={a} />
        ))}
      </Sub>
      <Sub label="BedIcon / BunkIcon">
        <BedIcon />
        <BunkIcon />
      </Sub>
      <Sub label="AutoRoleBadge">
        <AutoRoleBadge role={{ forRoomRoles: ["caretaker"] }} />
        <AutoRoleBadge role={{ forRoomRoles: ["helper"] }} />
        <AutoRoleBadge role={{ forRoomRoles: ["caretaker", "helper"] }} />
      </Sub>
      <Sub label="NoPillIcon">
        <NoPillIcon />
      </Sub>
      <Sub label="BusLogo">
        {BUS_COLORS.map((c) => (
          <BusLogo key={c.hex} color={c.hex} number="1" title={c.name} />
        ))}
      </Sub>
      <Sub label="CarLogo">
        <CarLogo />
      </Sub>
    </>
  );
}

function TagsSection() {
  return (
    <>
      <Sub label="TeamTag">
        <TeamTag teamId="t1" />
        <TeamTag teamId="t2" />
        <TeamTag teamId="t3" />
        <TeamTag teamId={null} fallback="sem time" />
        <Small>
          <TeamTag teamId="t1" />
        </Small>
        <Small>
          <TeamTag teamId="t2" />
        </Small>
        <Small>
          <TeamTag teamId="t3" />
        </Small>
      </Sub>
      <Sub label="BedroomTag">
        <BedroomTag bedroom={bedroomById.get("r1")} />
        <BedroomTag bedroom={bedroomById.get("r2")} />
        <BedroomTag bedroom={bedroomById.get("r3")} />
        <BedroomTag bedroom={null} fallback="sem quarto" />
      </Sub>
      <Sub label="TransportTag">
        <TransportTag transportId="tr1" />
        <TransportTag transportId="tr2" />
        <TransportTag transportId={null} fallback="sem transporte" />
      </Sub>
      <Sub label="TransportMark">
        <TransportMark transport={transportById.get("tr1")!} />
        <TransportMark transport={transportById.get("tr2")!} />
      </Sub>
      <RoleChipDemo />
    </>
  );
}

function RoleChipDemo() {
  return (
    <>
      <Sub label="RoleChip">
        {ROLE_LIST.map((r) => (
          <span key={r.key} className={`role-chip role-chip--${r.color}`}>
            <img className="role-chip__icon" src={r.icon} alt="" aria-hidden="true" />
            {r.label}
          </span>
        ))}
      </Sub>
      <Sub label="RoleChip (small)">
        {ROLE_LIST.map((r) => (
          <span key={r.key} className={`role-chip role-chip--${r.color} role-chip--small`}>
            <img className="role-chip__icon" src={r.icon} alt="" aria-hidden="true" />
            {r.label}
          </span>
        ))}
      </Sub>
      <Sub label="RoleChip (bare)">
        {ROLE_LIST.map((r) => (
          <span key={r.key} className="role-chip role-chip--small role-chip--bare">
            <img className="role-chip__icon" src={r.icon} alt="" aria-hidden="true" />
            {r.label}
          </span>
        ))}
      </Sub>
      <Sub label="RoleChip (switch, Maria)">
        {ROLE_LIST.map((r) => (
          <button key={r.key} type="button" className={`role-chip role-chip--${r.color} role-chip--small role-chip--switch`}>
            <img className="role-chip__icon" src={r.icon} alt="" aria-hidden="true" /> Maria
          </button>
        ))}
      </Sub>
    </>
  );
}

function wingCounts(list: { bedroom: string | null }[]): { all: number; girls: number; boys: number } {
  let girls = 0;
  let boys = 0;
  for (const p of list) {
    const g = p.bedroom ? bedroomById.get(p.bedroom)?.group : null;
    if (g === "girls") girls++;
    else if (g === "boys") boys++;
  }
  return { all: list.length, girls, boys };
}

function WingFilterDemo({ counts, initial }: { counts: { all: number; girls: number; boys: number }; initial: "all" | "girls" | "boys" }) {
  const [wing, setWing] = useState(initial);
  return (
    <>
      {(["all", "girls", "boys"] as const).map((key) => (
        <button key={key} type="button" className={`chip-toggle chip-toggle--small ${wing === key ? "chip-toggle--on" : ""}`} aria-pressed={wing === key} onClick={() => setWing(key)}>
          {key !== "all" && <GroupIcon group={key} face />}
          {key === "all" ? "Todos" : key === "girls" ? "Meninas" : "Meninos"}
          <span className="cat-tab__count">{counts[key]}</span>
        </button>
      ))}
    </>
  );
}

function TeamFilterChipDemo({ initialId }: { initialId: string | null }) {
  const [id, setId] = useState<string | null>(initialId);
  const team = id ? teamById.get(id) : null;
  return (
    <button type="button" className={`chip-toggle chip-toggle--small ${id ? "chip-toggle--on" : ""}`} aria-pressed={!!id} onClick={() => setId(id ? null : "t1")}>
      🚩 {team ? team.name : "Todos os times"}
    </button>
  );
}

function FiltersSection() {
  const [health, setHealth] = useState<Set<HealthKey>>(new Set(["allergies"]));
  const [audiences, setAudiences] = useState<PrepAudience[]>(["parent", "caretaker"]);
  const [kidId, setKidId] = useState("c1");

  const healthCounts: Partial<Record<HealthKey, number>> = {};
  for (const key of CAMPER_HEALTH_KEYS) healthCounts[key] = fixtures.campers.filter((c) => hasHealth(c, key)).length;

  return (
    <>
      <Sub label="WingFilter">
        <WingFilterDemo counts={wingCounts(fixtures.campers)} initial="girls" />
      </Sub>
      <Sub label="WingFilter (staff)">
        <WingFilterDemo counts={wingCounts(fixtures.staff)} initial="all" />
      </Sub>
      <Sub label="HealthFilter">
        <HealthFilter keys={CAMPER_HEALTH_KEYS} value={health} onChange={setHealth} counts={healthCounts} />
      </Sub>
      <Sub label="TeamFilterChip">
        <TeamFilterChipDemo initialId="t1" />
        <TeamFilterChipDemo initialId={null} />
      </Sub>
      <Sub label="AudiencePicker" column>
        <PrepAudiencePicker value={audiences} onChange={setAudiences} />
      </Sub>
      <Sub label="ParentKidTabs">
        <ParentKidTabs kids={fixtures.myKids} selectedId={kidId} onSelect={setKidId} idPrefix="dev-parent-kid" panelId="dev-parent-kid-panel" />
      </Sub>
      <Sub label="AssignmentChips">
        <AssignmentCamperChip camper={camper("c1")} />
        <AssignmentCamperChip camper={camper("c3")} noPreference />
        <AssignmentCamperChip camper={camper("c6")} />
      </Sub>
    </>
  );
}

function CardsSection() {
  return (
    <>
      <Sub label="CamperCard" column>
        <ul className="kid-list">
          <CamperCard camper={camper("c1")} labelOf={labelOf} bedroom={bedroomById.get("r1")} />
          <CamperCard camper={camper("c3")} labelOf={labelOf} bedroom={null} />
          <CamperCard camper={camper("c4")} labelOf={labelOf} bedroom={bedroomById.get("r2")} />
        </ul>
      </Sub>
      <Sub label="StaffMiniCard" column>
        <ul className="staff-list">
          <StaffMiniCard staff={staff("s1")} />
          <StaffMiniCard staff={staff("s2")} />
          <StaffMiniCard staff={staff("s3")} />
        </ul>
      </Sub>
      <Sub label="HealthAlerts" column>
        <HealthAlerts person={camper("c1")} labelOf={labelOf} boxed />
        <HealthAlerts person={camper("c4")} labelOf={labelOf} boxed />
        {healthLines(camper("c3"), labelOf).length === 0 && <p className="staff-card__alert staff-card__alert--soft">Nada de saúde declarado.</p>}
      </Sub>
    </>
  );
}

function MedsSection() {
  return (
    <>
      <Sub label="MedicationChecklist (c1)" column>
        <MedicationChecklist token="dev-token" day="2026-09-18" now={MEDS_NOW} initialSearch="Ana Souza" />
      </Sub>
      <Sub label="MedicationChecklist (c4)" column>
        <MedicationChecklist token="dev-token" day="2026-09-18" now={MEDS_NOW} initialSearch="Davi Oliveira" />
      </Sub>
      <Sub label="MedicationsEditor (c4, view only)" column>
        <MedicationsEditor value={camper("c4").medications} onChange={() => {}} disabled />
      </Sub>
    </>
  );
}

const CHECKIN_BLOCKS: SelfCheckinBlock[] = ["NOT_LINKED", "INACTIVE", "NO_SCHEDULE", "NOT_TODAY", "NOT_YET", "ALREADY_CHECKED_IN"];
const CHECKIN_BLOCK_MESSAGES: Record<SelfCheckinBlock, string> = {
  NOT_LINKED: "Seu telefone não está vinculado a um cadastro da equipe.",
  INACTIVE: "Sua conta está inativa neste acampamento.",
  NO_SCHEDULE: "Não há programação cadastrada para hoje.",
  NOT_TODAY: "Hoje não é o dia da viagem.",
  NOT_YET: "O check-in abre 1 hora antes do primeiro evento.",
  ALREADY_CHECKED_IN: "Você já fez o check-in.",
};
const checkinTokenFor = (block: SelfCheckinBlock) => `dev-checkin-${block}`;
const CHECKIN_OK_TOKEN = "dev-checkin-ok";
const CHECKIN_BUSY_TOKEN = "dev-checkin-busy";
const CHECKIN_STATUS_BY_TOKEN: Record<string, SelfCheckinStatus> = {
  [CHECKIN_OK_TOKEN]: fixtures.selfCheckin,
  [CHECKIN_BUSY_TOKEN]: fixtures.selfCheckin,
};
for (const block of CHECKIN_BLOCKS) {
  CHECKIN_STATUS_BY_TOKEN[checkinTokenFor(block)] = { ...fixtures.selfCheckin, allowed: false, reason: { code: block, message: CHECKIN_BLOCK_MESSAGES[block] } };
}

const CHECKIN_USER: LoggedUser = { id: "u-dev-checkin", name: "Juliana Alves", phone: "+5511990001111", roles: ["staff"], activeRole: "staff" };

try {
  sessionStorage.setItem("acampa.selfcheck.dismissed", "2026-09-18");
} catch {
  /* private mode: the cards fall back to the popup, harmless in the gallery */
}

/**
 * Installed once, at module load — BEFORE any SelfCheckinCard mounts and
 * fires its own effects. Installing this from a React effect instead would
 * run too late: child effects (the card's own status fetch) fire before a
 * parent section's effect, so the very first request would already have hit
 * the real API and bounced with a 401.
 */
const originalFetch = window.fetch.bind(window);
window.fetch = ((input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
  if (url.includes("/api/staff/me/checkin")) {
    const headers = init?.headers as Record<string, string> | undefined;
    const token = (headers?.authorization ?? "").replace(/^Bearer\s+/i, "");
    if (!init?.method || init.method === "GET") {
      const status = CHECKIN_STATUS_BY_TOKEN[token];
      if (status) return Promise.resolve(new Response(JSON.stringify(status), { status: 200, headers: { "content-type": "application/json" } }));
    }
    if (init?.method === "POST" && token === CHECKIN_BUSY_TOKEN) return new Promise<Response>(() => {});
  }
  return originalFetch(input, init);
}) as typeof window.fetch;

if ("geolocation" in navigator) {
  navigator.geolocation.getCurrentPosition = ((success: PositionCallback) => {
    success({
      coords: { latitude: -23.5505, longitude: -46.6333, accuracy: 12, altitude: null, altitudeAccuracy: null, heading: null, speed: null },
      timestamp: Date.now(),
    } as GeolocationPosition);
  }) as Geolocation["getCurrentPosition"];
}

function BusyCheckinCard() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const id = window.setTimeout(() => {
      ref.current?.querySelector<HTMLButtonElement>(".selfcheck__cta")?.click();
    }, 50);
    return () => window.clearTimeout(id);
  }, []);
  return (
    <div ref={ref}>
      <SelfCheckinCard token={CHECKIN_BUSY_TOKEN} user={CHECKIN_USER} />
    </div>
  );
}

function CheckinSection() {
  const spot = fixtures.selfCheckin.locations[0] ?? { id: "dev-spot", name: "Ponto de encontro", lat: -23.5505, lng: -46.6333, radiusM: 150 };
  return (
    <>
      <Sub label="SelfCheckinCard" column>
        {CHECKIN_BLOCKS.map((block) => (
          <SelfCheckinCard key={block} token={checkinTokenFor(block)} user={CHECKIN_USER} />
        ))}
        <SelfCheckinCard token={CHECKIN_OK_TOKEN} user={CHECKIN_USER} />
        <BusyCheckinCard />
      </Sub>
      <Sub label="SpotMap">
        <SpotMap lat={spot.lat} lng={spot.lng} radiusM={spot.radiusM} height={200} />
      </Sub>
    </>
  );
}

function QrScannerDemo() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className="button button--primary" onClick={() => setOpen(true)}>
        Abrir leitor
      </button>
      <QrScannerDialog open={open} onScan={() => setOpen(false)} onClose={() => setOpen(false)} />
    </>
  );
}

function PlatformSection() {
  const c1 = camper("c1");
  const href = whatsappLink(c1.guardianPhone ?? "", staffGreeting({ toName: c1.guardianName, fromName: fixtures.loggedUser.name, about: c1.name }));
  return (
    <>
      <Sub label="CamperQr">
        <CamperQr camperId="c1" name="Ana Souza" />
      </Sub>
      <Sub label="WhatsAppButton">
        <WhatsAppButton href={href} label={`Falar com ${c1.guardianName} no WhatsApp`} />
        <WhatsAppButton className="wa-btn--sm" href={href} label={`Falar com ${c1.guardianName} no WhatsApp`} />
      </Sub>
      <Sub label="GuardianWhatsApp">
        <GuardianWhatsApp camper={c1} />
      </Sub>
      <Sub label="QrScannerDialog">
        <QrScannerDemo />
      </Sub>
    </>
  );
}

const SECTION_DEFS: { key: string; title: string; render: () => ReactNode }[] = [
  { key: "domain-icons", title: "Ícones", render: IconsSection },
  { key: "domain-tags", title: "Tags", render: TagsSection },
  { key: "domain-filters", title: "Filtros", render: FiltersSection },
  { key: "domain-cards", title: "Cartões", render: CardsSection },
  { key: "domain-meds", title: "Medicações", render: MedsSection },
  { key: "domain-checkin", title: "Check-in da equipe", render: CheckinSection },
  { key: "domain-platform", title: "Plataforma", render: PlatformSection },
];

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="dev-section">
      <h1 className="admin-title">{title}</h1>
      {children}
    </section>
  );
}

export default function ComponentsPreview({ section }: { section: string }) {
  const defs = section === "all" ? SECTION_DEFS : SECTION_DEFS.filter((d) => d.key === section);
  return (
    <div className="dash">
      <div className="dash-body">
        <div className="admin-page">
          {defs.length === 0 ? (
            <p>Seção desconhecida: {section}</p>
          ) : (
            defs.map((d) => (
              <Section key={d.key} title={d.title}>
                {d.render()}
              </Section>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
