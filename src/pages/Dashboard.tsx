import { useEffect, useRef, useState, type CSSProperties } from "react";
import { TabOverrideContext, type TabKey } from "../dashTab";
import { useCampTiming, type CampPhase } from "../campPhase";
import { useRoute, useScrollTopOnRoute } from "../router";
import Logo from "../components/Logo";
import { logout } from "../auth/store";
import { roleMeta, type LoggedUser, type Role } from "../roles";
import { ICONS } from "../icons";
import SyncStatus from "../components/SyncStatus";
import EmergencyScanFab from "../components/EmergencyScanFab";
import InstallBanner from "../components/InstallBanner";
import BedroomsPage from "./admin/BedroomsPage";
import CampersPage from "./admin/CampersPage";
import CategoriesPage from "./admin/CategoriesPage";
import TransportsPage from "./admin/TransportsPage";
import CheckinSettingsPage from "./admin/CheckinSettingsPage";
import GeneralSettingsPage from "./admin/GeneralSettingsPage";
import AboutPage from "./admin/AboutPage";
import AdminCheckinPage from "./admin/AdminCheckinPage";
import MedicalStaffPage from "./admin/MedicalStaffPage";
import OrganizersPage from "./admin/OrganizersPage";
import SchedulePage from "./admin/SchedulePage";
import NotificationsPage from "./admin/NotificationsPage";
import ParentContactsPage from "./admin/ParentContactsPage";
import PreparationAdminPage from "./admin/PreparationAdminPage";
import PreparationPage from "./PreparationPage";
import InstructionsPage from "./InstructionsPage";
import InstructionsAdminPage from "./admin/InstructionsAdminPage";
import StaffPage from "./admin/StaffPage";
import BusCheckinPage from "./BusCheckinPage";
import BusTripsPage from "./BusTripsPage";
import CheckinPage from "./CheckinPage";
import HomePage from "./HomePage";
import MySchedulePage from "./MySchedulePage";
import OccurrencesPage from "./OccurrencesPage";
import MedicationsPage from "./MedicationsPage";
import StaffCheckinPage from "./StaffCheckinPage";
import VestPage from "./VestPage";
import VestHelpersPage from "./admin/VestHelpersPage";
import PhotographersPage from "./admin/PhotographersPage";
import TeamsPage from "./admin/TeamsPage";
import GameOrganizersPage from "./admin/GameOrganizersPage";
import TrialsPage from "./admin/TrialsPage";
import CleanupPage from "./admin/CleanupPage";
import ScoreboardPage from "./ScoreboardPage";
import GalleryPage from "./GalleryPage";
import { useCheckinHelper, type HelperAccess } from "../hooks/useCheckinHelper";
import { useParentWindow } from "../hooks/useParentWindow";
import { useCampWindow } from "../hooks/useCampWindow";
import { useCollection } from "../store";
import ParentHomePage from "./parent/ParentHomePage";
import ParentPreparationPage from "./parent/ParentPreparationPage";
import ParentSchedulePage from "./parent/ParentSchedulePage";
import ParentProfile from "./parent/ParentProfile";
import { PAGE_FOOTER_ID } from "../components/PageFooter";

interface DashboardProps {
  user: LoggedUser;
  token: string;
  onLoggedOut: () => void;
  /** switches the session to another profile the same person holds (parent ⇄ equipe) */
  onSwitchRole: (role: Role) => Promise<void>;
}

/** "profile" is not a tab: it opens when the user clicks their own name in the header. */
type View = TabKey | "profile" | "badge" | SettingsKey;

/** Admin settings live behind the ⚙️ button; each one is its own URL (#/categories, #/settings). */
type SettingsKey = "general" | "trials" | "categories" | "cleanup" | "transports" | "teams" | "preparation" | "instructions-admin" | "checkin-settings" | "organizers" | "game-organizers" | "medical" | "vests-settings" | "photographers" | "contacts" | "notifications" | "about";
/** `adminOnly`: an ORGANIZER (Settings → Organizadores) gets every other page — these four stay with the real admin. */
const SETTINGS: readonly { key: SettingsKey; label: string; emoji?: string; icon?: string; adminOnly?: boolean }[] = [
  { key: "general", label: "Geral", emoji: "⚙️" },
  { key: "preparation", label: "Preparação", emoji: "🎒" },
  { key: "instructions-admin", label: "Instruções", emoji: "📖" },
  { key: "checkin-settings", label: "Check-in", emoji: "✅" },
  { key: "organizers", label: "Organizadores", icon: ICONS.organizer, adminOnly: true },
  { key: "game-organizers", label: "Jogos", emoji: "🏆" },
  { key: "photographers", label: "Fotógrafos", icon: ICONS.camera },
  { key: "medical", label: "Equipe médica", icon: roleMeta("health_staff").icon },
  { key: "vests-settings", label: "Coletes", emoji: "🦺" },
  { key: "contacts", label: "Important contacts", emoji: "📞" },
  { key: "notifications", label: "Notificações", icon: ICONS.notifications, adminOnly: true },
  { key: "transports", label: "Transporte", icon: ICONS.transport, adminOnly: true },
  { key: "teams", label: "Times", emoji: "🚩" },
  { key: "trials", label: "Testes", emoji: "🚧" },
  { key: "categories", label: "Categorias", emoji: "🗂️", adminOnly: true },
  { key: "cleanup", label: "Limpeza", icon: ICONS.cleanup, adminOnly: true },
  { key: "about", label: "Sobre", emoji: "ℹ️", adminOnly: true },
] as const;

interface Tab {
  key: TabKey;
  label: string;
  /** paper-cut icon (same set as the login page) — takes precedence over emoji */
  icon?: string;
  emoji?: string;
}

/**
 * Which tabs each role gets, in order. First one is the default view.
 * For the team the order depends on the camp phase: while they are still
 * packing (more than 3 days before the first event) Preparação comes first;
 * from 3 days before onwards the room ("Início") takes the lead. "Instruções"
 * is the how-to of the person's own funções (always after the programme). A team
 * member listed as a helper gets "Check-in Igreja" / "Check-in Ônibus" while
 * the admin's window for that roll call is open; an ORGANIZER gets the whole
 * admin tab set on top of their own (the admin gets only the admin set); a GAME organizer gets the admin
 * "Programação" and a read-only "Equipe"; the MEDICAL team gets its own tab
 * set (`medicalTabs` — the kids, the occurrences and the medication
 * checklist, never the roll call); a VEST helper gets "Coletes";
 * everyone gets "Placar" while the camp is on, or while the admin's
 * "scoreboard draft" is on (read-only unless GAME organizer / score helper /
 * organizer / admin) — see hooks/useCheckinHelper and campPhase. The admin
 * (and organizers) open "Sorteio" from inside Acampantes / Equipe (not a tab).
 * "Fotos" only shows up for the TEAM once the album is published (`galleryOpen`):
 * before that there is nothing to see, so the tab would just be an empty page.
 */
function tabsFor(role: Role, phase: CampPhase, helper: HelperAccess, roomsDraft: boolean, scoreOpen: boolean, galleryOpen: boolean): Tab[] {
  /** the scoreboard only exists while the camp is happening (first day → end of the last event) or in draft (rehearsal) mode */
  const scoreboard: Tab[] = scoreOpen ? [{ key: "scoreboard", label: "Placar", emoji: "🏆" }] : [];
  const prep: Tab = { key: "prep", label: "Preparação", emoji: "🎒" };
  const home: Tab = { key: "home", label: "Início", emoji: "🏠" };
  // rooms still a draft (Settings → Geral): nobody knows their room yet, so Preparação IS the home
  const teamHome: Tab[] = roomsDraft ? [prep] : phase === "before" ? [prep, home] : [home, prep];
  const adminTabs: Tab[] = [
    { key: "campers", label: "Acampantes", icon: ICONS.camper },
    { key: "staff", label: "Equipe", icon: roleMeta("staff").icon },
    { key: "bedrooms", label: "Quartos", emoji: "🛏️" },
    { key: "schedule", label: "Programação", icon: ICONS.schedule },
    { key: "checkin", label: "Check-in", emoji: "✅" },
    ...scoreboard,
    { key: "occurrences", label: "Ocorrências", emoji: "📋" },
    // what the medical team ticked as given (they own the page; the admin follows it)
    { key: "medications", label: "Medicações", icon: ICONS.medications },
    // the photo album closes the tab row (admin / organizer view)
    { key: "gallery", label: "Fotos", icon: ICONS.camera },
  ];
  /** an ORGANIZER: their own room / preparation / instructions followed by everything the admin has */
  const managerTabs: Tab[] = [...teamHome, { key: "instructions", label: "Instruções", emoji: "📖" }, ...adminTabs];
  /**
   * The MEDICAL team (Settings → Equipe médica), in the order they work in:
   * their room, every kid (read-only, health included), the occurrences they
   * write and the daily medication checklist — then the programme, their own
   * preparação / instruções and the album. NO ônibus tab and no Placar: the
   * roll call and the games are not their job. A medical person who is ALSO a
   * listed helper (church roll call, ônibus, coletes) keeps that tab.
   */
  const medicalTabs: Tab[] = [
    // rooms still a draft: nobody knows their room yet, so "Início" would be empty
    ...(roomsDraft ? [] : [home]),
    { key: "campers", label: "Acampantes", icon: ICONS.camper },
    { key: "occurrences", label: "Ocorrências", emoji: "📋" },
    { key: "medications", label: "Medicações", icon: ICONS.medications },
    { key: "schedule", label: "Programação", icon: ICONS.schedule },
    prep,
    { key: "instructions", label: "Instruções", emoji: "📖" },
    ...(helper.church ? [{ key: "checkin" as const, label: "Check-in Igreja", emoji: "⛪" }] : []),
    ...(helper.bus ? [{ key: "bus" as const, label: "Check-in Ônibus", icon: ICONS.transport }] : []),
    ...(helper.vest ? [{ key: "vests" as const, label: "Coletes", emoji: "🦺" }] : []),
    ...(galleryOpen ? [{ key: "gallery" as const, label: "Fotos", icon: ICONS.camera }] : []),
  ];
  switch (role) {
    // the admin only manages: no room / preparation / instructions of their own
    case "admin":
      return adminTabs;
    // the team gets its room + a read-only programme; the KIDS' church roll call only as a helper inside the window
    case "staff":
    case "health_staff":
      // an ORGANIZER: the admin's tabs on top of their own
      if (helper.organizer) return managerTabs;
      // the medical team has its own set: the kids and their medication, never the roll call
      if (helper.medical) return medicalTabs;
      return [
        ...teamHome,
        { key: "schedule", label: "Programação", icon: ICONS.schedule },
        { key: "instructions", label: "Instruções", emoji: "📖" },
        // the whole team follows the games (while the camp is on); only the game organizers write the points
        ...scoreboard,
        ...(helper.gameOrganizer ? [{ key: "staff" as const, label: "Equipe", icon: roleMeta("staff").icon }] : []),
        ...(helper.church ? [{ key: "checkin" as const, label: "Check-in Igreja", emoji: "⛪" }] : []),
        // a bus helper rolls-call inside the window
        ...(helper.bus ? [{ key: "bus" as const, label: "Check-in Ônibus", icon: ICONS.transport }] : []),
        ...(helper.vest ? [{ key: "vests" as const, label: "Coletes", emoji: "🦺" }] : []),
        // the photo album is always the LAST tab — and only once it is published
        // (the photographers see it from the start, to send and publish)
        ...(galleryOpen ? [{ key: "gallery" as const, label: "Fotos", icon: ICONS.camera }] : []),
      ];
    // parents: their kids (Início) + the programme — the photos close the tab row
    case "parent":
      return [home, { key: "schedule", label: "Programação", icon: ICONS.schedule }, prep, { key: "gallery", label: "Fotos", icon: ICONS.camera }];
    default:
      return [];
  }
}

/**
 * Logged-in shell: header with the user + a tab bar; each tab renders a page.
 * Clicking the user's name opens their profile (no tab). Roles without tabs
 * land on the profile.
 */
export default function Dashboard({ user, token, onLoggedOut, onSwitchRole }: DashboardProps) {
  const meta = roleMeta(user.activeRole);
  const { phase, synced, during, endsAt } = useCampTiming();
  const isTeam = user.activeRole === "staff" || user.activeRole === "health_staff";
  const isParent = user.activeRole === "parent";
  const helper = useCheckinHelper(user.phone, isTeam, endsAt);
  const parentAccess = useParentWindow(isParent);
  useCampWindow(isTeam, user.phone, during);
  const settings = useCollection("settings");
  const roomsDraft = !!settings?.kidsRoomsDraft;
  /** the scoreboard opens for everyone on the camp days; the "Placar em teste" switch opens it any day, but only for the admin, organizers, game organizers and score helpers */
  const scoreOpen = during || (!!settings?.scoreDraft && (user.activeRole === "admin" || helper.organizer || helper.gameOrganizer || helper.scoreHelper));
  /** the album shows up for the team once it is published; whoever manages it (organizer / photographer) always has the tab */
  const galleryOpen = !!settings?.galleryPublished || helper.organizer || helper.photographer;
  const tabs = tabsFor(user.activeRole, phase, helper, roomsDraft, scoreOpen, galleryOpen);
  /**
   * PHONES ONLY (the class it drives does nothing above 700px). Six tabs of
   * which two are Preparação + Instruções: the bottom bar merges them into a
   * single 🎒+📖 entry, so the row fits five. Tapping it opens whichever the camp
   * phase calls for (before → Preparação, during / after → Instruções); the
   * other one is one tap away, from that page's header.
   */
  const mergesPrep = tabs.length === 6 && tabs.some((t) => t.key === "prep") && tabs.some((t) => t.key === "instructions");
  /** the half of the pair the merged entry opens — and the half it hides */
  const mergedKey: TabKey = phase === "before" ? "prep" : "instructions";
  const mergedHiddenKey: TabKey = mergedKey === "prep" ? "instructions" : "prep";
  /** what the bottom bar actually shows, in order */
  const bottomTabs = mergesPrep ? tabs.filter((t) => t.key !== mergedHiddenKey) : tabs;
  /** phone bottom bar: an odd count centres Início; an even one has no middle, so it leads */
  const bottomHomeIndex = bottomTabs.length % 2 === 1 ? Math.floor(bottomTabs.length / 2) : 0;
  const bottomNavOrder = (key: TabKey) => {
    if (key === "home") return bottomHomeIndex;
    const others = bottomTabs.filter((tab) => tab.key !== "home");
    const index = others.findIndex((tab) => tab.key === key);
    return index < bottomHomeIndex ? index : index + 1;
  };
  const { path, segments, navigate } = useRoute();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  useScrollTopOnRoute(path);
  useEffect(() => setMobileMenuOpen(false), [path]);
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileMenuOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [mobileMenuOpen]);

  // the first URL segment is the tab: #/campers/…, #/staff/…, #/profile
  /** the admin, or a team member listed as ORGANIZER: the admin's pages and the ⚙️ settings (minus the admin-only ones) */
  const isAdmin = user.activeRole === "admin";
  const settingsAllowed = isAdmin || helper.organizer;
  /**
   * Phones: up to 5 menu entries (Perfil does NOT count — it lives in the app
   * bar as the person's name) become a bottom bar with an app bar above it;
   * anything bigger — or the ⚙️ roles, whose “Configurações” is one more entry
   * — keeps the hamburger drawer. Six tabs still fit when two of them are the
   * Preparação + Instruções pair, which shares one entry (`mergesPrep`).
   */
  const useMobileBottomNav = bottomTabs.length > 0 && bottomTabs.length <= 5 && !settingsAllowed;
  /** the settings pages this session may open */
  const settingsPages = SETTINGS.filter((s) => isAdmin || !s.adminOnly);
  const isSettingsKey = (s: string | undefined): s is SettingsKey => settingsPages.some((x) => x.key === s);
  const isView = (s: string | undefined): s is View => s === "profile" || (s === "badge" && !isParent && during) || (settingsAllowed && isSettingsKey(s)) || tabs.some((t) => t.key === s);
  const view: View = isView(segments[0]) ? segments[0] : tabs[0]?.key ?? "profile";
  /** the tab we auto-landed on BEFORE the programme had arrived (the phase, hence the default, may still change) */
  const provisionalLanding = useRef<string | null>(null);
  useEffect(() => {
    // no / unknown route → land on the first tab (replace so Back doesn't bounce here)
    if (!isView(segments[0])) {
      navigate(`/${view}`, { replace: true });
      provisionalLanding.current = synced ? null : view;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [segments[0], tabs.length, during]); // access windows closing bounce restricted pages home
  useEffect(() => {
    // the programme arrived after a provisional landing and the default tab changed → move there
    if (!synced || !provisionalLanding.current) return;
    const landed = provisionalLanding.current;
    provisionalLanding.current = null;
    const first = tabs[0]?.key;
    if (first && landed !== first && segments.length === 1 && segments[0] === landed) navigate(`/${first}`, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [synced]);

  const profileOpen = view === "profile";
  /** admin settings (sidebar layout) — never for the team, even if a tab key happens to look alike */
  const settingsOpen = settingsAllowed && isSettingsKey(view);
  /** pages that carry the yellow ScanFab (the scan IS the page's action): bulk points, church check-in, bus roll call (not the medical read-only view nor the per-vehicle report) */
  const reportOpen = segments[segments.length - 1] === "report";
  const hasOwnScanFab =
    (view === "scoreboard" && segments[1] === "bulk") ||
    (view === "checkin" && !reportOpen && (!settingsAllowed || segments[1] === "church" || (segments[1] === "bus" && segments.length === 3))) ||
    (view === "bus" && helper.bus && (segments.length > 1 || !(helper.busOutbound && helper.busReturn)));
  /** a nested detail (e.g. função opened from a camper) can ask another tab to look active */
  const [tabOverride, setTabOverride] = useState<TabKey | null>(null);
  const shownTab: View = !profileOpen && !settingsOpen && tabOverride ? tabOverride : view;
  const currentTab = tabs.find((tab) => tab.key === shownTab);
  const currentSetting = settingsOpen ? settingsPages.find((item) => item.key === view) : undefined;
  const currentView = profileOpen
    ? { label: "Perfil", icon: meta.icon, emoji: undefined }
    : currentSetting
      ? { label: currentSetting.label, icon: currentSetting.icon, emoji: currentSetting.emoji }
      : view === "badge"
        ? { label: "Ler crachá", icon: undefined, emoji: "🎟️" }
        : { label: currentTab?.label ?? "Acampa Kids", icon: currentTab?.icon, emoji: currentTab?.emoji };
  /** tab click → that tab's root list (a real history entry, so Back returns here) */
  function goTo(next: View) {
    setTabOverride(null);
    navigate(`/${next}`);
  }

  async function handleLogout() {
    if (loggingOut) return;
    setLoggingOut(true);
    await logout(token);
    onLoggedOut();
  }

  return (
    <div className={`dash ${useMobileBottomNav ? "dash--bottom-nav" : "dash--drawer-nav"}`}>
      <header className="dash-top">
        {tabs.length > 0 && !useMobileBottomNav && (
          <button
            type="button"
            className={`dash-iconbtn dash-menu-toggle ${mobileMenuOpen ? "dash-menu-toggle--open" : ""}`}
            title={mobileMenuOpen ? "Fechar menu" : "Abrir menu"}
            aria-label={mobileMenuOpen ? "Fechar menu" : "Abrir menu"}
            aria-expanded={mobileMenuOpen}
            aria-controls="dashboard-menu"
            onClick={() => setMobileMenuOpen((open) => !open)}
          >
            <span className="dash-menu-toggle__lines" aria-hidden="true"><i /><i /><i /></span>
          </button>
        )}

        <div className="dash-brand">
          <Logo size={48} />
          <span className="dash-brand__name">Acampa Kids</span>
        </div>

        <span className="dash-current-view" aria-live="polite">
          {currentView.icon ? (
            <img className="dash-current-view__icon" src={currentView.icon} alt="" aria-hidden="true" />
          ) : currentView.emoji ? (
            <span className="dash-current-view__emoji" aria-hidden="true">{currentView.emoji}</span>
          ) : null}
          <span className="dash-current-view__label">{currentView.label}</span>
        </span>

        <div className="dash-user">
          <SyncStatus />
          <button
            type="button"
            className={`role-chip dash-user__chip ${profileOpen ? "dash-user__chip--active" : ""}`}
            title={`Você entrou como ${meta.personLabel} — ver perfil`}
            aria-pressed={profileOpen}
            onClick={() => goTo("profile")}
          >
            <img className="role-chip__icon" src={meta.icon} alt="" aria-hidden="true" />
            {user.name.split(" ")[0]}
          </button>
          {settingsAllowed && (
            <button
              type="button"
              className={`dash-iconbtn dash-settings-btn ${settingsOpen ? "dash-iconbtn--active" : ""}`}
              title="Configurações: equipe, contatos, check-in e notificações"
              aria-label="Configurações"
              aria-pressed={settingsOpen}
              onClick={() => goTo(settingsPages[0].key)}
            >
              <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
                <path fill="currentColor" d="M19.4 13a7.6 7.6 0 0 0 .1-1 7.6 7.6 0 0 0-.1-1l2.1-1.6a.5.5 0 0 0 .1-.7l-2-3.4a.5.5 0 0 0-.6-.2l-2.5 1a7.3 7.3 0 0 0-1.7-1l-.4-2.6a.5.5 0 0 0-.5-.5h-4a.5.5 0 0 0-.5.5l-.4 2.6a7.3 7.3 0 0 0-1.7 1l-2.5-1a.5.5 0 0 0-.6.2l-2 3.4a.5.5 0 0 0 .1.7L4.6 11a7.6 7.6 0 0 0 0 2l-2.1 1.6a.5.5 0 0 0-.1.7l2 3.4c.1.2.4.3.6.2l2.5-1a7.3 7.3 0 0 0 1.7 1l.4 2.6c0 .3.2.5.5.5h4c.3 0 .5-.2.5-.5l.4-2.6a7.3 7.3 0 0 0 1.7-1l2.5 1c.2.1.5 0 .6-.2l2-3.4a.5.5 0 0 0-.1-.7L19.4 13ZM12 15.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7Z" />
              </svg>
            </button>
          )}
          {/* phones, drawer layout: the church logo (no label) closes the app bar */}
          <span className="dash-top-logo" aria-hidden="true"><Logo size={34} /></span>
        </div>
      </header>

      {tabs.length > 0 && (
      <nav id="dashboard-menu" className={`dash-tabs ${mobileMenuOpen ? "dash-tabs--open" : ""}`} role="tablist" aria-label="Seções">
        {tabs.map((t) => {
          /** the merged 🎒+📖 entry (phone bottom bar only) stands in for BOTH halves */
          const merged = mergesPrep && t.key === mergedKey;
          const active = t.key === shownTab;
          /** already on this tab's root list → clicking does nothing, so no hover either */
          const atRoot = active && segments.length === 1 && segments[0] === t.key;
          /**
           * The OTHER half is open: the merged entry looks active in its place.
           * A class, not `active` — on the desktop both tabs exist, and lighting
           * up two of them at once is exactly what this must not do.
           */
          const standsIn = merged && shownTab === mergedHiddenKey;
          /** the half the bottom bar hides: still rendered, hidden by CSS on phones */
          const spare = mergesPrep && t.key === mergedHiddenKey;
          return (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={active}
              className={`dash-tab ${active ? "dash-tab--active" : ""} ${atRoot ? "dash-tab--root" : ""} ${merged ? "dash-tab--merged" : ""} ${standsIn ? "dash-tab--merged-active" : ""} ${spare ? "dash-tab--merged-spare" : ""}`}
              aria-disabled={atRoot || undefined}
              style={{ "--mobile-nav-order": bottomNavOrder(t.key) } as CSSProperties}
              onClick={() => {
                setMobileMenuOpen(false);
                if (!atRoot) goTo(t.key);
              }}
            >
              {t.icon ? (
                <img className="dash-tab__icon" src={t.icon} alt="" aria-hidden="true" />
              ) : (
                <span className="dash-tab__emoji" aria-hidden="true">{t.emoji}</span>
              )}
              {/* 🎒+📖 — only the phone bottom bar shows this pair glyph */}
              {merged && (
                <span className="dash-tab__pair" aria-hidden="true">
                  <span>🎒</span>
                  <i>+</i>
                  <span>📖</span>
                </span>
              )}
              <span className="dash-tab__label">{t.label}</span>
              {merged && <span className="dash-tab__pair-label">Instruções</span>}
            </button>
          );
        })}
        <button
          type="button"
          role="tab"
          aria-selected={profileOpen}
          className={`dash-tab dash-menu-profile ${profileOpen ? "dash-tab--active dash-tab--root" : ""}`}
          style={{ "--mobile-nav-order": tabs.length } as CSSProperties}
          onClick={() => {
            setMobileMenuOpen(false);
            if (!profileOpen) goTo("profile");
          }}
        >
          <img className="dash-tab__icon" src={meta.icon} alt="" aria-hidden="true" />
          <span className="dash-tab__label">{user.name.split(" ")[0]}</span>
          <span className="dash-menu-profile__label">Perfil</span>
        </button>
        {/* phones: the ⚙️ leaves the app bar (the logo takes its place) and lives in the drawer */}
        {settingsAllowed && (
          <button
            type="button"
            role="tab"
            aria-selected={settingsOpen}
            className={`dash-tab dash-menu-settings ${settingsOpen ? "dash-tab--active dash-tab--root" : ""}`}
            onClick={() => {
              setMobileMenuOpen(false);
              if (!settingsOpen) goTo(settingsPages[0].key);
            }}
          >
            <span className="dash-tab__emoji" aria-hidden="true">⚙️</span>
            <span className="dash-tab__label">Configurações</span>
          </button>
        )}
      </nav>
      )}

      <InstallBanner parent={isParent} />

      <main className={`dash-body ${settingsOpen ? "dash-body--settings" : ""}`} role="tabpanel">
        {settingsOpen && (
          <nav className="settings-nav" aria-label="Configurações">
            <h2 className="settings-nav__title">⚙️ Configurações</h2>
            <ul className="settings-nav__list">
              {settingsPages.map((s) => {
                const active = s.key === view;
                return (
                  <li key={s.key}>
                    <button
                      type="button"
                      aria-current={active ? "page" : undefined}
                      // on phones the menu is a horizontal strip: keep the active item in view
                      ref={active ? (el) => el?.scrollIntoView({ block: "nearest", inline: "center" }) : undefined}
                      className={`settings-nav__item ${active ? "settings-nav__item--active" : ""}`}
                      onClick={() => !active && goTo(s.key)}
                    >
                      {s.icon ? (
                        <img className="settings-nav__icon" src={s.icon} alt="" aria-hidden="true" />
                      ) : (
                        <span className="settings-nav__emoji" aria-hidden="true">{s.emoji}</span>
                      )}
                      <span className="settings-nav__label">{s.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
        )}
        <TabOverrideContext.Provider value={setTabOverride}>
          {view === "badge" && <EmergencyScanFab token={token} page />}
          {view === "home" && (isParent ? <ParentHomePage user={user} token={token} access={parentAccess} /> : <HomePage user={user} token={token} medical={helper.medical} />)}
          {view === "prep" && (isParent ? <ParentPreparationPage user={user} token={token} /> : <PreparationPage user={user} token={token} pairedWith={mergesPrep ? () => goTo("instructions") : undefined} />)}
          {view === "preparation" && <PreparationAdminPage token={token} />}
          {view === "instructions-admin" && <InstructionsAdminPage token={token} />}
          {view === "instructions" && <InstructionsPage user={user} pairedWith={mergesPrep ? () => goTo("prep") : undefined} />}
          {view === "occurrences" && <OccurrencesPage token={token} audience={isAdmin ? "admin" : helper.organizer ? "organizer" : "medical"} />}
          {view === "medications" && <MedicationsPage token={token} />}
          {view === "campers" && <CampersPage token={token} readOnly={!settingsAllowed} />}
          {view === "staff" && <StaffPage token={token} readOnly={!settingsAllowed} />}
          {view === "bedrooms" && <BedroomsPage token={token} readOnly={!settingsAllowed} />}
          {view === "schedule" && (isParent ? <ParentSchedulePage /> : settingsAllowed || helper.gameOrganizer ? <SchedulePage token={token} /> : <MySchedulePage user={user} />)}
          {view === "categories" && <CategoriesPage token={token} />}
          {view === "transports" && <TransportsPage token={token} />}
          {view === "general" && <GeneralSettingsPage token={token} />}
          {view === "trials" && <TrialsPage token={token} isAdmin={isAdmin} />}
          {view === "cleanup" && <CleanupPage token={token} />}
          {view === "checkin-settings" && <CheckinSettingsPage token={token} />}
          {view === "organizers" && <OrganizersPage token={token} />}
          {view === "medical" && <MedicalStaffPage token={token} />}
          {view === "vests-settings" && <VestHelpersPage token={token} />}
          {view === "photographers" && <PhotographersPage token={token} />}
          {view === "teams" && <TeamsPage token={token} />}
          {view === "game-organizers" && <GameOrganizersPage token={token} />}
          {view === "scoreboard" && <ScoreboardPage token={token} userId={user.id} canEdit={settingsAllowed || helper.gameOrganizer} canScan={settingsAllowed || helper.gameOrganizer || helper.scoreHelper} />}
          {view === "gallery" && <GalleryPage token={token} canManage={settingsAllowed || helper.photographer} parentMode={isParent} />}
          {view === "contacts" && <ParentContactsPage token={token} />}
          {view === "notifications" && <NotificationsPage token={token} />}
          {view === "about" && <AboutPage token={token} />}
          {view === "checkin" && !settingsAllowed && <CheckinPage token={token} />}
          {view === "checkin" && settingsAllowed && segments.length === 1 && <AdminCheckinPage />}
          {view === "checkin" && settingsAllowed && segments[1] === "church" && <CheckinPage token={token} canOpenStaff adminMerged myName={user.name} />}
          {view === "checkin" && settingsAllowed && segments[1] === "bus" && segments.length === 2 && <BusTripsPage basePath="/checkin/bus" checkinHomePath="/checkin" />}
          {view === "checkin" && settingsAllowed && segments[1] === "bus" && segments[2] === "outbound" && <BusCheckinPage token={token} trip="outbound" basePath="/checkin/bus/outbound" checkinHomePath="/checkin" />}
          {view === "checkin" && settingsAllowed && segments[1] === "bus" && segments[2] === "return" && <BusCheckinPage token={token} trip="return" basePath="/checkin/bus/return" checkinHomePath="/checkin" />}
          {view === "checkin" && settingsAllowed && segments[1] === "staff" && <StaffCheckinPage token={token} checkinHomePath="/checkin" />}
          {view === "checkin" && settingsAllowed && segments[1] === "vests" && <VestPage token={token} myName={user.name} checkinHomePath="/checkin" />}
          {view === "vests" && <VestPage token={token} myName={user.name} />}
          {view === "bus" && segments.length === 1 && helper.bus && (
            helper.busOutbound && helper.busReturn
              ? <BusTripsPage outboundAvailable={helper.busOutbound} returnAvailable={helper.busReturn} />
              : <BusCheckinPage token={token} trip={helper.busReturn ? "return" : "outbound"} onlyVehicleId={helper.busVehicle ?? undefined} otherTripAvailable={false} />
          )}
          {view === "bus" && segments[1] === "outbound" && helper.busOutbound && <BusCheckinPage token={token} trip="outbound" onlyVehicleId={helper.busVehicle ?? undefined} otherTripAvailable={helper.busReturn} />}
          {view === "bus" && segments[1] === "return" && helper.busReturn && <BusCheckinPage token={token} trip="return" onlyVehicleId={helper.busVehicle ?? undefined} otherTripAvailable={helper.busOutbound} />}
          {view === "bus" && segments.length > 1 && helper.bus && ((segments[1] === "outbound" && !helper.busOutbound) || (segments[1] === "return" && !helper.busReturn)) && (
            <BusTripsPage outboundAvailable={helper.busOutbound} returnAvailable={helper.busReturn} />
          )}
          {view === "staffcheckin" && <StaffCheckinPage token={token} />}
          {view === "profile" && (isParent
            ? <ParentProfile user={user} onLogout={handleLogout} loggingOut={loggingOut} onSwitchRole={onSwitchRole} />
            : <ProfileView user={user} onLogout={handleLogout} loggingOut={loggingOut} onSwitchRole={onSwitchRole} />)}
        </TabOverrideContext.Provider>
      </main>

      {/* every page's closing note lands here (see PageFooter) */}
      <footer className="dash-foot" id={PAGE_FOOTER_ID} />

      {/* "Ler crachá" QR lookup — the team, WHILE THE CAMP IS ON (first day → end of the last event), on every page except the settings and the pages whose own yellow ScanFab performs their action */}
      {!isParent && during && view !== "badge" && !settingsOpen && !hasOwnScanFab && <EmergencyScanFab token={token} />}
    </div>
  );
}

function ProfileView({ user, onLogout, loggingOut, onSwitchRole }: { user: LoggedUser; onLogout: () => void; loggingOut: boolean; onSwitchRole: (role: Role) => Promise<void> }) {
  const meta = roleMeta(user.activeRole);
  const otherRoles = user.roles.filter((r) => r !== user.activeRole);
  const [switchingTo, setSwitchingTo] = useState<Role | null>(null);
  const [switchError, setSwitchError] = useState<string | null>(null);

  /** one tap on another profile enters it — there is nothing to confirm */
  async function enterAs(role: Role) {
    if (switchingTo) return;
    setSwitchingTo(role);
    setSwitchError(null);
    try {
      await onSwitchRole(role);
    } catch (err) {
      setSwitchError(err instanceof Error ? err.message : "Não foi possível trocar de perfil.");
      setSwitchingTo(null);
    }
  }

  return (
    <div className="screen screen--narrow">
      <div className="confetti" aria-hidden="true">🎉 🏕️ ✨ 🌲 🎈</div>

      <h1 className="title title--small">Boas-vindas, {user.name.split(" ")[0]}! 🎉</h1>
      <p className="subtitle">
        Você entrou como <strong>{meta.personLabel}</strong>
      </p>

      <div className="user-card">
        <div className="user-card__row">
          <span className="user-card__label">Nome</span>
          <span className="user-card__value">{user.name}</span>
        </div>
        <div className="user-card__row">
          <span className="user-card__label">Celular</span>
          <span className="user-card__value">{user.phone}</span>
        </div>
        <div className="user-card__row">
          <span className="user-card__label">Perfil</span>
          {/* the one they are already in: a plain label, nothing to tap */}
          <span className="role-chip role-chip--small role-chip--bare">
            <img className="role-chip__icon" src={meta.icon} alt="" aria-hidden="true" /> {meta.label}
          </span>
        </div>
        {otherRoles.length > 0 && (
          <div className="user-card__row">
            <span className="user-card__label">Outros perfis</span>
            <span className="user-card__roles">
              {otherRoles.map((r) => {
                const m = roleMeta(r);
                return (
                  <button
                    key={r}
                    type="button"
                    className={`role-chip role-chip--${m.color} role-chip--small role-chip--switch`}
                    disabled={!!switchingTo}
                    onClick={() => void enterAs(r)}
                    title={`Entrar como ${m.label}`}
                  >
                    <img className="role-chip__icon" src={m.icon} alt="" aria-hidden="true" /> {switchingTo === r ? "Entrando…" : m.label}
                  </button>
                );
              })}
            </span>
          </div>
        )}
      </div>

      {switchError && <p className="message message--error">{switchError}</p>}

      <div className="profile-actions">
        <button type="button" className="button button--danger profile-logout" onClick={onLogout} disabled={loggingOut}>
          {loggingOut ? "Saindo…" : "Sair do aplicativo"}
        </button>
      </div>
    </div>
  );
}
