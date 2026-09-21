import { useEffect } from "react";
import scenariosRaw from "./shellScenarios.json";
import fixturesRaw from "./domainFixtures.json";
import pageFixturesRaw from "./pageFixtures.json";
import { seedForDev, setConnection } from "../store";
import { saveAuth } from "../auth/store";
import type { LoggedUser } from "../roles";
import { DEFAULT_CHECKIN_LOCATION, type CheckinReminder, type CheckinWindow, type ForeignLookupOffender, type ParentContact, type Settings, type SmsRedirect } from "../api/settings";
import type { CampEvent, ScheduleRole, EventAssignment } from "../api/schedule";
import type { Camper } from "../api/campers";
import type { Staff } from "../api/staff";
import type { Bedroom } from "../api/bedrooms";
import type { Team } from "../api/teams";
import type { Transport } from "../api/transports";
import type { Category } from "../api/categories";
import type { PrepSection } from "../api/preparation";
import type { Instruction } from "../api/instructions";
import type { Occurrence } from "../api/occurrences";
import type { MedicationDose } from "../api/medications";
import type { ScoreEntry } from "../api/scores";
import type { GalleryPhoto } from "../api/gallery";
import Dashboard from "../pages/Dashboard";

interface DomainFixtures {
  teams: Team[];
  bedrooms: Bedroom[];
  transports: Transport[];
  campers: Camper[];
  staff: Staff[];
}

const fixtures = fixturesRaw as unknown as DomainFixtures;

interface PageFixtureEvent {
  id: string;
  day: 0 | 1 | 2;
  title: string;
  emoji: string;
  startTime: string;
  endTime: string | null;
  notes: string;
  roles: string[];
  visibleToParents: boolean;
  assignments: EventAssignment[];
  createdAt: string;
  updatedAt: string;
}

interface PageFixtures {
  categories: Category[];
  roles: ScheduleRole[];
  events: PageFixtureEvent[];
  preparation: PrepSection[];
  instructions: Instruction[];
  occurrences: Occurrence[];
  medications: MedicationDose[];
  scores: ScoreEntry[];
  gallery: GalleryPhoto[];
}

const pageFixtures = pageFixturesRaw as unknown as PageFixtures;

type CampKind = "before" | "camp" | "during" | "none";

interface ScenarioSettingsPatch {
  kidsRoomsDraft?: boolean;
  scoreDraft?: boolean;
  wizardMode?: boolean;
  galleryPublished?: boolean;
  superAdmin?: boolean;
  checkinTestMode?: boolean;
  checkinHelpers?: string[];
  organizers?: string[];
  gameOrganizers?: string[];
  scoreHelpers?: string[];
  medicalStaff?: string[];
  vestHelpers?: string[];
  photographers?: string[];
  busHelpers?: { staffId: string; vehicleId: string }[];
  parentContacts?: ParentContact[];
  checkinWindow?: CheckinWindow;
  busReturnWindow?: CheckinWindow;
  staffAccessWindow?: CheckinWindow;
  parentAccessWindow?: CheckinWindow;
  checkinReminder?: CheckinReminder;
  smsRedirect?: SmsRedirect;
  foreignLookupOffenders?: ForeignLookupOffender[];
}

interface ShellScenario {
  user: LoggedUser;
  camp: CampKind;
  /** overrides the camp kind's default day-0 offset (today + this many days) */
  dayZeroOffset?: number;
  settings: ScenarioSettingsPatch;
  route: string;
}

const scenarios = (scenariosRaw as unknown as { scenarios: Record<string, ShellScenario> }).scenarios;

function emptySettings(): Settings {
  const emptyWindow = () => ({ from: null, until: null, open: false });
  return {
    checkinLocations: [DEFAULT_CHECKIN_LOCATION],
    parentWindow: emptyWindow(),
    notifications: {
      bedroomChanges: false,
      roleChanges: false,
      checkinConfirmation: false,
      contentChanges: false,
      parentContentChanges: false,
      enrolments: false,
      staffChanges: false,
      occurrences: false,
      checkinReminder: false,
      parentEdits: false,
      busCheckin: false,
      parentWelcome: false,
      birthdays: false,
      photoPublishes: false,
    },
    checkinWindow: emptyWindow(),
    busReturnWindow: emptyWindow(),
    checkinHelpers: { staffIds: [] },
    busHelpers: { helpers: [] },
    organizers: { staffIds: [] },
    gameOrganizers: { staffIds: [] },
    scoreHelpers: { staffIds: [] },
    medicalStaff: { staffIds: [] },
    vestHelpers: { staffIds: [] },
    photographers: { staffIds: [] },
    parentContacts: [],
    staffAccessWindow: emptyWindow(),
    parentAccessWindow: emptyWindow(),
    checkinTestMode: false,
    kidsRoomsDraft: false,
    scoreDraft: false,
    wizardMode: false,
    galleryPublished: false,
    checkinReminder: { at: null, sentAt: null },
    smsRedirect: { enabled: false, staffPhone: null, parentPhone: null },
    smsEnabled: false,
    mailEnabled: false,
    superAdmin: false,
    updatedAt: null,
  };
}

const FLAG_KEYS = ["kidsRoomsDraft", "scoreDraft", "wizardMode", "galleryPublished", "superAdmin", "checkinTestMode"] as const;
const STAFF_LIST_KEYS = ["checkinHelpers", "organizers", "gameOrganizers", "scoreHelpers", "medicalStaff", "vestHelpers", "photographers"] as const;
const WINDOW_KEYS = ["checkinWindow", "busReturnWindow", "staffAccessWindow", "parentAccessWindow"] as const;

function buildSettings(patch: ScenarioSettingsPatch): Settings {
  const settings = emptySettings();
  for (const key of FLAG_KEYS) {
    const value = patch[key];
    if (value !== undefined) settings[key] = value;
  }
  for (const key of STAFF_LIST_KEYS) {
    const value = patch[key];
    if (value !== undefined) settings[key] = { staffIds: value };
  }
  for (const key of WINDOW_KEYS) {
    const value = patch[key];
    if (value !== undefined) settings[key] = value;
  }
  if (patch.busHelpers !== undefined) settings.busHelpers = { helpers: patch.busHelpers };
  if (patch.parentContacts !== undefined) settings.parentContacts = patch.parentContacts;
  if (patch.checkinReminder !== undefined) settings.checkinReminder = patch.checkinReminder;
  if (patch.smsRedirect !== undefined) settings.smsRedirect = patch.smsRedirect;
  if (patch.foreignLookupOffenders !== undefined) settings.foreignLookupOffenders = patch.foreignLookupOffenders;
  return settings;
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function isoDate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function addDays(days: number): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + days);
  return d;
}

/** day 0 of the fixture's 3-day programme, per camp kind (mirrors Mocks/PageFixtures.swift). */
function baseOffset(camp: CampKind): number | null {
  switch (camp) {
    case "before":
      return 30;
    case "camp":
      return 2;
    case "during":
      return -1;
    case "none":
    default:
      return null;
  }
}

function dayZeroOffset(scenario: ShellScenario): number | null {
  return scenario.dayZeroOffset ?? baseOffset(scenario.camp);
}

function eventsFor(scenario: ShellScenario): CampEvent[] {
  const base = dayZeroOffset(scenario);
  if (base === null) return [];
  return pageFixtures.events.map((e) => ({
    id: e.id,
    date: isoDate(addDays(base + e.day)),
    title: e.title,
    emoji: e.emoji,
    startTime: e.startTime,
    endTime: e.endTime,
    notes: e.notes,
    roles: e.roles,
    visibleToParents: e.visibleToParents,
    assignments: e.assignments,
    createdAt: e.createdAt,
    updatedAt: e.updatedAt,
  }));
}

/**
 * `domainFixtures.json` can't bake in a birthday that lands on a camp day
 * (the camp's dates are relative to "today" at seed time, not at fixture
 * authoring time), so camper `c2`'s birthday is stamped onto camp day 1 here
 * instead — same rule on the iOS side (`ShellScenarios.seed`).
 */
function campersWithBirthdayOverride(scenario: ShellScenario) {
  const base = dayZeroOffset(scenario);
  if (base === null) return fixtures.campers;
  const day1 = addDays(base + 1);
  const birthDate = `${day1.getFullYear() - 9}-${pad(day1.getMonth() + 1)}-${pad(day1.getDate())}`;
  return fixtures.campers.map((c) => (c.id === "c2" ? { ...c, birthDate } : c));
}

function seedScenario(scenario: ShellScenario): void {
  seedForDev({
    campers: campersWithBirthdayOverride(scenario),
    staff: fixtures.staff,
    bedrooms: fixtures.bedrooms,
    teams: fixtures.teams,
    transports: fixtures.transports,
    categories: pageFixtures.categories,
    scores: pageFixtures.scores,
    roles: pageFixtures.roles,
    preparation: pageFixtures.preparation,
    instructions: pageFixtures.instructions,
    occurrences: pageFixtures.occurrences,
    medications: pageFixtures.medications,
    gallery: pageFixtures.gallery,
    settings: buildSettings(scenario.settings),
    events: eventsFor(scenario),
  });
  setConnection("online");
  saveAuth({
    token: "dev",
    tokenExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    user: scenario.user,
  });
}

declare global {
  interface Window {
    __acampaState?: string | null;
  }
}

const params = new URLSearchParams(location.search);
const shellKey = params.get("shell");
const scenario = shellKey ? scenarios[shellKey] : undefined;

window.__acampaState = params.get("state");

if (scenario) {
  seedScenario(scenario);
  if (!location.hash) location.hash = `#${scenario.route}`;
}

/** dev-only: `?shell=<key>` renders the real Dashboard against one of shellScenarios.json's fixtures, offline, so the iOS shell can be screenshot-compared against it */
export default function ShellPreview() {
  useEffect(() => {
    if (params.get("menu") !== "open") return;
    document.querySelector<HTMLButtonElement>(".dash-menu-toggle")?.click();
  }, []);

  if (!scenario) {
    return <p style={{ padding: 24 }}>Unknown shell scenario: {shellKey}</p>;
  }

  return <Dashboard user={scenario.user} token="dev" onLoggedOut={() => location.reload()} onSwitchRole={async () => {}} />;
}
