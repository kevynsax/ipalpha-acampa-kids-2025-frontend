import { useEffect, useRef, useState } from "react";
import { TabOverrideContext, type TabKey } from "../dashTab";
import { useCampTiming, type CampPhase } from "../campPhase";
import { useRoute, useScrollTopOnRoute } from "../router";
import Logo from "../components/Logo";
import { logout } from "../auth/store";
import { roleMeta, type LoggedUser, type Role } from "../roles";
import { ICONS } from "../icons";
import SyncStatus from "../components/SyncStatus";
import InstallBanner from "../components/InstallBanner";
import BedroomsPage from "./admin/BedroomsPage";
import CampersPage from "./admin/CampersPage";
import CategoriesPage from "./admin/CategoriesPage";
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
import CheckinPage from "./CheckinPage";
import HomePage from "./HomePage";
import MySchedulePage from "./MySchedulePage";
import OccurrencesPage from "./OccurrencesPage";
import StaffCheckinPage from "./StaffCheckinPage";
import { useCheckinHelper, type HelperAccess } from "../hooks/useCheckinHelper";
import { useCollection } from "../store";

interface DashboardProps {
  user: LoggedUser;
  token: string;
  tokenExpiresAt: string;
  onLoggedOut: () => void;
}

/** "profile" is not a tab: it opens when the user clicks their own name in the header. */
type View = TabKey | "profile" | SettingsKey;

/** Admin settings live behind the ⚙️ button; each one is its own URL (#/categories, #/settings). */
type SettingsKey = "general" | "categories" | "preparation" | "instructions-admin" | "checkin-settings" | "organizers" | "medical" | "contacts" | "notifications" | "about";
const SETTINGS: readonly { key: SettingsKey; label: string; emoji?: string; icon?: string }[] = [
  { key: "general", label: "Geral", emoji: "⚙️" },
  { key: "preparation", label: "Preparação", emoji: "🎒" },
  { key: "instructions-admin", label: "Instruções", emoji: "📖" },
  { key: "checkin-settings", label: "Check-in", emoji: "✅" },
  { key: "organizers", label: "Organizadores", icon: ICONS.organizer },
  { key: "medical", label: "Equipe médica", icon: roleMeta("health_staff").icon },
  { key: "contacts", label: "Important contacts", emoji: "📞" },
  { key: "notifications", label: "Notificações", emoji: "📲" },
  { key: "categories", label: "Categorias", emoji: "🗂️" },
  { key: "about", label: "Sobre", emoji: "ℹ️" },
] as const;
const isSettingsKey = (s: string | undefined): s is SettingsKey => SETTINGS.some((x) => x.key === s);

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
 * the admin's window for that roll call is open; an ORGANIZER gets the admin
 * "Programação" and a read-only "Equipe"; the MEDICAL team gets read-only
 * "Acampantes" and "Ônibus" with no window (see hooks/useCheckinHelper).
 */
function tabsFor(role: Role, phase: CampPhase, helper: HelperAccess, roomsDraft: boolean): Tab[] {
  const prep: Tab = { key: "prep", label: "Preparação", emoji: "🎒" };
  const home: Tab = { key: "home", label: "Início", emoji: "🏠" };
  // rooms still a draft (Settings → Geral): nobody knows their room yet, so Preparação IS the home
  const teamHome: Tab[] = roomsDraft ? [prep] : phase === "before" ? [prep, home] : [home, prep];
  switch (role) {
    case "admin":
      return [
        { key: "campers", label: "Acampantes", icon: ICONS.camper },
        { key: "staff", label: "Equipe", icon: roleMeta("staff").icon },
        { key: "bedrooms", label: "Quartos", emoji: "🛏️" },
        { key: "schedule", label: "Programação", emoji: "📅" },
        { key: "checkin", label: "Check-in", emoji: "✅" },
        { key: "occurrences", label: "Ocorrências", emoji: "📋" },
      ];
    // the team gets its room + a read-only programme; the KIDS' church roll call only as a helper inside the window
    case "staff":
    case "health_staff":
      return [
        ...teamHome,
        { key: "schedule", label: "Programação", emoji: "📅" },
        { key: "instructions", label: "Instruções", emoji: "📖" },
        ...(helper.medical ? [{ key: "campers" as const, label: "Acampantes", icon: ICONS.camper }] : []),
        ...(helper.organizer ? [{ key: "staff" as const, label: "Equipe", icon: roleMeta("staff").icon }] : []),
        ...(helper.church ? [{ key: "checkin" as const, label: "Check-in Igreja", emoji: "⛪" }] : []),
        // a bus helper rolls-call inside the window; the medical team just LOOKS at every vehicle, always
        ...(helper.bus || helper.medical ? [{ key: "bus" as const, label: helper.bus ? "Check-in Ônibus" : "Ônibus", emoji: "🚌" }] : []),
        ...(helper.medical ? [{ key: "occurrences" as const, label: "Ocorrências", emoji: "📋" }] : []),
      ];
    default:
      return [];
  }
}

/**
 * Logged-in shell: header with the user + a tab bar; each tab renders a page.
 * Clicking the user's name opens their profile (no tab). Roles without tabs
 * land on the profile.
 */
export default function Dashboard({ user, token, tokenExpiresAt, onLoggedOut }: DashboardProps) {
  const meta = roleMeta(user.activeRole);
  const { phase, synced } = useCampTiming();
  const isTeam = user.activeRole === "staff" || user.activeRole === "health_staff";
  const helper = useCheckinHelper(user.phone, isTeam);
  const roomsDraft = !!useCollection("settings")?.kidsRoomsDraft;
  const tabs = tabsFor(user.activeRole, phase, helper, roomsDraft);
  const { path, segments, navigate } = useRoute();
  useScrollTopOnRoute(path);

  // the first URL segment is the tab: #/campers/…, #/staff/…, #/profile
  /** settings (categories, check-in spot) are reached from the ⚙️ button in the header, not a tab */
  const settingsAllowed = user.activeRole === "admin";
  const isView = (s: string | undefined): s is View => s === "profile" || (settingsAllowed && isSettingsKey(s)) || tabs.some((t) => t.key === s);
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
  }, [segments[0], tabs.length]); // tabs.length: a helper's window closing while on #/checkin bounces them home
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
  /** a nested detail (e.g. função opened from a camper) can ask another tab to look active */
  const [tabOverride, setTabOverride] = useState<TabKey | null>(null);
  const shownTab: View = !profileOpen && !settingsOpen && tabOverride ? tabOverride : view;
  /** tab click → that tab's root list (a real history entry, so Back returns here) */
  function goTo(next: View) {
    setTabOverride(null);
    navigate(`/${next}`);
  }

  async function handleLogout() {
    await logout(token);
    onLoggedOut();
  }

  return (
    <div className="dash">
      <header className="dash-top">
        <div className="dash-brand">
          <Logo size={48} />
          <span className="dash-brand__name">Acampa Kids</span>
        </div>

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
              className={`dash-iconbtn ${settingsOpen ? "dash-iconbtn--active" : ""}`}
              title="Configurações: equipe, contatos, check-in e notificações"
              aria-label="Configurações"
              aria-pressed={settingsOpen}
              onClick={() => goTo(SETTINGS[0].key)}
            >
              <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
                <path fill="currentColor" d="M19.4 13a7.6 7.6 0 0 0 .1-1 7.6 7.6 0 0 0-.1-1l2.1-1.6a.5.5 0 0 0 .1-.7l-2-3.4a.5.5 0 0 0-.6-.2l-2.5 1a7.3 7.3 0 0 0-1.7-1l-.4-2.6a.5.5 0 0 0-.5-.5h-4a.5.5 0 0 0-.5.5l-.4 2.6a7.3 7.3 0 0 0-1.7 1l-2.5-1a.5.5 0 0 0-.6.2l-2 3.4a.5.5 0 0 0 .1.7L4.6 11a7.6 7.6 0 0 0 0 2l-2.1 1.6a.5.5 0 0 0-.1.7l2 3.4c.1.2.4.3.6.2l2.5-1a7.3 7.3 0 0 0 1.7 1l.4 2.6c0 .3.2.5.5.5h4c.3 0 .5-.2.5-.5l.4-2.6a7.3 7.3 0 0 0 1.7-1l2.5 1c.2.1.5 0 .6-.2l2-3.4a.5.5 0 0 0-.1-.7L19.4 13ZM12 15.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7Z" />
              </svg>
            </button>
          )}
          <button type="button" className="dash-iconbtn dash-iconbtn--logout" title="Sair" aria-label="Sair" onClick={handleLogout}>
            <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
              <path fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" d="M10 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4M15 8l4 4-4 4M19 12H9" />
            </svg>
          </button>
        </div>
      </header>

      {tabs.length > 0 && (
      <nav className="dash-tabs" role="tablist" aria-label="Seções">
        {tabs.map((t) => {
          const active = t.key === shownTab;
          /** already on this tab's root list → clicking does nothing, so no hover either */
          const atRoot = active && segments.length === 1 && segments[0] === t.key;
          return (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={active}
              className={`dash-tab ${active ? "dash-tab--active" : ""} ${atRoot ? "dash-tab--root" : ""}`}
              aria-disabled={atRoot || undefined}
              onClick={() => !atRoot && goTo(t.key)}
            >
              {t.icon ? (
                <img className="dash-tab__icon" src={t.icon} alt="" aria-hidden="true" />
              ) : (
                <span className="dash-tab__emoji" aria-hidden="true">{t.emoji}</span>
              )}
              <span className="dash-tab__label">{t.label}</span>
            </button>
          );
        })}
      </nav>
      )}

      <InstallBanner />

      <main className={`dash-body ${settingsOpen ? "dash-body--settings" : ""}`} role="tabpanel">
        {settingsOpen && (
          <nav className="settings-nav" aria-label="Configurações">
            <h2 className="settings-nav__title">⚙️ Configurações</h2>
            <ul className="settings-nav__list">
              {SETTINGS.map((s) => {
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
          {view === "home" && <HomePage user={user} token={token} />}
          {view === "prep" && <PreparationPage user={user} token={token} />}
          {view === "preparation" && <PreparationAdminPage token={token} />}
          {view === "instructions-admin" && <InstructionsAdminPage token={token} />}
          {view === "instructions" && <InstructionsPage user={user} />}
          {view === "occurrences" && <OccurrencesPage token={token} user={user} />}
          {view === "campers" && <CampersPage token={token} readOnly={!settingsAllowed} />}
          {view === "staff" && <StaffPage token={token} readOnly={!settingsAllowed} />}
          {view === "bedrooms" && <BedroomsPage token={token} readOnly={!settingsAllowed} />}
          {view === "schedule" && (settingsAllowed || helper.organizer ? <SchedulePage token={token} /> : <MySchedulePage user={user} />)}
          {view === "categories" && <CategoriesPage token={token} />}
          {view === "general" && <GeneralSettingsPage token={token} />}
          {view === "checkin-settings" && <CheckinSettingsPage token={token} />}
          {view === "organizers" && <OrganizersPage token={token} />}
          {view === "medical" && <MedicalStaffPage token={token} />}
          {view === "contacts" && <ParentContactsPage token={token} />}
          {view === "notifications" && <NotificationsPage token={token} />}
          {view === "about" && <AboutPage token={token} />}
          {view === "checkin" && !settingsAllowed && <CheckinPage token={token} />}
          {view === "checkin" && settingsAllowed && segments.length === 1 && <AdminCheckinPage />}
          {view === "checkin" && settingsAllowed && segments[1] === "church" && <CheckinPage token={token} canOpenStaff adminMerged />}
          {view === "checkin" && settingsAllowed && segments[1] === "bus" && <BusCheckinPage token={token} basePath="/checkin/bus" checkinHomePath="/checkin" />}
          {view === "checkin" && settingsAllowed && segments[1] === "staff" && <StaffCheckinPage token={token} checkinHomePath="/checkin" />}
          {view === "bus" && (
            <BusCheckinPage token={token} onlyVehicleId={helper.busVehicle ?? undefined} readOnly={!helper.bus} />
          )}
          {view === "staffcheckin" && <StaffCheckinPage token={token} />}
          {view === "profile" && <ProfileView user={user} tokenExpiresAt={tokenExpiresAt} />}
        </TabOverrideContext.Provider>
      </main>
    </div>
  );
}

function ProfileView({ user, tokenExpiresAt }: { user: LoggedUser; tokenExpiresAt: string }) {
  const meta = roleMeta(user.activeRole);
  const otherRoles = user.roles.filter((r) => r !== user.activeRole);
  const formatted = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(
    new Date(tokenExpiresAt),
  );

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
          <span className={`role-chip role-chip--${meta.color} role-chip--small`}>
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
                  <span key={r} className={`role-chip role-chip--${m.color} role-chip--small`}>
                    <img className="role-chip__icon" src={m.icon} alt="" aria-hidden="true" /> {m.label}
                  </span>
                );
              })}
            </span>
          </div>
        )}
      </div>

      <p className="footer-note">🔑 Sua sessão fica aberta até {formatted} (24h).</p>
    </div>
  );
}
