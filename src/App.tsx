import { useEffect, useState, type ReactElement } from "react";
import { ApiError } from "./api/client";
import CampingLayout from "./components/CampingLayout";
import StaffAccessDialog from "./components/StaffAccessDialog";
import Toast from "./components/Toast";
import { clearAuth, clearPendingOtp, loadAuth, loadPendingOtp, saveAuth, savePendingOtp, switchCamp, switchRole, validateAuth, type CampSummary } from "./auth/store";
import Dashboard from "./pages/Dashboard";
import RoleSwitchDialog from "./components/RoleSwitchDialog";
import OtpStep from "./pages/OtpStep";
import PhoneStep from "./pages/PhoneStep";
import { useI18n } from "./i18n";
import { formatBrazilPhoneClient } from "./phoneFormat";
import type { LoggedUser, Role } from "./roles";
import { navigate } from "./router";
import { clearStore } from "./store";
import { connectRealtime, disconnectRealtime } from "./store/realtime";

type Step = "phone" | "otp" | "done";

interface OtpContext {
  phoneE164: string;
  expiresAt: string;
  delivery: "sms" | "mock" | "redirect";
}

interface Session {
  user: LoggedUser;
  token: string;
  tokenExpiresAt: string;
  camp: CampSummary;
  camps: CampSummary[];
}

export default function App() {
  const { t, tx } = useI18n();
  const [step, setStep] = useState<Step>("phone");
  const [phoneMasked, setPhoneMasked] = useState("");
  const [otp, setOtp] = useState<OtpContext | null>(null);
  /** set when the server kicked the person out because the team's access window closed */
  const [evicted, setEvicted] = useState<ApiError | null>(null);
  /** CAMP_ARCHIVED / CAMP_FORBIDDEN messages from anywhere in the app (see api/client.ts) */
  const [campToast, setCampToast] = useState<string | null>(null);

  // restore an existing session (still within its 4-day window)
  const [session, setSession] = useState<Session | null>(null);
  /** just logged in holding more than one profile: ask which one before letting them in */
  const [choosingRole, setChoosingRole] = useState(false);
  useEffect(() => {
    const stored = loadAuth();
    if (!stored) {
      // an SMS was already sent and is still valid → go straight to the code step with the real expiry
      const pending = loadPendingOtp();
      if (pending) {
        setOtp(pending);
        setPhoneMasked(formatBrazilPhoneClient(pending.phoneE164));
        setStep("otp");
      }
      return;
    }
    // a session saved before camps existed has no `camp` yet — fill it in from the server
    if (stored.camp) {
      setSession({ user: stored.user, token: stored.token, tokenExpiresAt: stored.tokenExpiresAt, camp: stored.camp, camps: stored.camps ?? [] });
      setStep("done");
      return;
    }
    validateAuth(stored.token).then((res) => {
      if (!res) {
        resetToLogin();
        return;
      }
      const next = { token: stored.token, tokenExpiresAt: stored.tokenExpiresAt, user: res.user, camp: res.camp, camps: res.camps };
      saveAuth(next);
      setSession(next);
      setStep("done");
    });
  }, []);

  useEffect(() => {
    function onCampError(e: Event) {
      const detail = (e as CustomEvent<{ code: string; message: string }>).detail;
      if (!detail) return;
      if (detail.code === "CAMP_ARCHIVED") {
        setCampToast(detail.message || tx("Este ano está arquivado — só leitura."));
      } else if (detail.code === "CAMP_FORBIDDEN") {
        setCampToast(tx("Você não tem acesso a esse ano."));
        const activeId = session?.camps.find((c) => c.active)?.id;
        if (activeId && activeId !== session?.camp.id) void applyCamp(activeId);
      }
    }
    window.addEventListener("acampa:camp-error", onCampError);
    return () => window.removeEventListener("acampa:camp-error", onCampError);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  function resetToLogin() {
    setSession(null);
    setChoosingRole(false);
    setStep("phone");
    setPhoneMasked("");
    setOtp(null);
    clearPendingOtp();
  }

  // live data feed: one WebSocket for the whole session; the store keeps a
  // localStorage copy so the app keeps working when the connection drops
  const token = session?.token ?? null;
  useEffect(() => {
    if (!token) return;
    connectRealtime(token, {
      onUnauthorized: (reason) => {
        // session revoked / expired on the server → back to the login, nothing kept on the phone
        clearAuth();
        clearStore();
        resetToLogin();
        if (reason === "access-window-closed") {
          setEvicted(new ApiError(401, "STAFF_ACCESS_ENDED", "O acampamento acabou.", { audience: session?.user.activeRole === "parent" ? "parent" : "staff" }));
        }
      },
    });
    return () => disconnectRealtime();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  /** a new session for the SAME person: the old data belongs to the old scope, so it is wiped before the new socket brings its snapshot */
  async function applyRole(role: Role) {
    if (!session) return;
    const res = await switchRole(session.token, role);
    clearStore();
    const next = { token: res.token, tokenExpiresAt: res.tokenExpiresAt, user: res.user, camp: res.camp, camps: res.camps ?? session.camps };
    saveAuth(next);
    setSession(next);
    // the other profile has its own menu: the screen we were on (usually
    // #/profile, where the chip lives) means nothing there → drop the path and
    // let the dashboard land on the new profile's first tab. `replace` so Back
    // doesn't bounce into the previous role's page.
    navigate("/", { replace: true });
  }

  /** admin, or an organizer of the active camp: switches into another year — same wipe-and-reconnect dance as `applyRole` */
  async function applyCamp(campId: string) {
    if (!session) return;
    const res = await switchCamp(session.token, campId);
    clearStore();
    const next = { token: res.token, tokenExpiresAt: res.tokenExpiresAt, user: res.user, camp: res.camp, camps: res.camps ?? session.camps };
    saveAuth(next);
    setSession(next);
    navigate("/", { replace: true });
  }

  /**
   * Holds more than one profile: the choice comes BEFORE the app, over the
   * login scenery — never on top of a home page they didn't ask for.
   */
  if (step === "done" && session && choosingRole) {
    return (
      <>
        <VersionMark />
        <CampingLayout>
          <h1 className="camping-panel__title">{t("login.almostThere", { name: session.user.name.split(" ")[0] })}</h1>
        </CampingLayout>
        <RoleSwitchDialog
          open
          user={session.user}
          onClose={() => setChoosingRole(false)}
          onSwitch={async (role) => {
            await applyRole(role);
            setChoosingRole(false);
          }}
        />
        <Toast message={campToast} onClose={() => setCampToast(null)} />
      </>
    );
  }

  if (step === "done" && session) {
    return (
      <>
        <VersionMark />
        <Dashboard
          user={session.user}
          token={session.token}
          camp={session.camp}
          camps={session.camps}
          onLoggedOut={() => {
            clearStore();
            resetToLogin();
          }}
          onSwitchRole={applyRole}
          onSwitchCamp={applyCamp}
        />
        <Toast message={campToast} onClose={() => setCampToast(null)} />
      </>
    );
  }

  let content: ReactElement;
  if (step === "otp" && otp) {
    content = (
      <OtpStep
        key={otp.phoneE164}
        phoneE164={otp.phoneE164}
        phoneMasked={formatBrazilPhoneClient(otp.phoneE164)}
        expiresAt={otp.expiresAt}
        delivery={otp.delivery}
        onExpiryChange={(iso) => {
          const next = { ...otp, expiresAt: iso };
          savePendingOtp(next);
          setOtp(next);
        }}
        onVerified={({ token, tokenExpiresAt, user, camp, camps }) => {
          clearPendingOtp();
          const next = { token, tokenExpiresAt, user, camp, camps: camps ?? [] };
          saveAuth(next);
          setSession(next);
          // the login always lands on the highest-priority profile: let them
          // pick when they hold more than one (mãe que também é da equipe)
          setChoosingRole(user.roles.length > 1);
          setStep("done");
        }}
        onBack={() => {
          clearPendingOtp();
          setStep("phone");
        }}
      />
    );
  } else {
    content = (
      <PhoneStep
        phone={phoneMasked}
        onPhoneChange={setPhoneMasked}
        onSent={({ phoneE164, expiresAt, delivery }) => {
          savePendingOtp({ phoneE164, expiresAt, delivery });
          setOtp({ phoneE164, expiresAt, delivery });
          setStep("otp");
        }}
      />
    );
  }

  return (
    <>
      <VersionMark />
      <CampingLayout>{content}</CampingLayout>
      <StaffAccessDialog error={evicted} onClose={() => setEvicted(null)} />
      <Toast message={campToast} onClose={() => setCampToast(null)} />
    </>
  );
}

function VersionMark() {
  const { t } = useI18n();
  return <span className="version-mark" aria-label={t("common.version", { version: __APP_VERSION__ })}>v{__APP_VERSION__}</span>;
}
