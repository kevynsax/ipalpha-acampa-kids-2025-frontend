import { useEffect, useState, type ReactElement } from "react";
import { ApiError } from "./api/client";
import CampingLayout from "./components/CampingLayout";
import StaffAccessDialog from "./components/StaffAccessDialog";
import { clearAuth, clearPendingOtp, loadAuth, loadPendingOtp, saveAuth, savePendingOtp } from "./auth/store";
import Dashboard from "./pages/Dashboard";
import OtpStep from "./pages/OtpStep";
import PhoneStep from "./pages/PhoneStep";
import { formatBrazilPhoneClient } from "./phoneFormat";
import type { LoggedUser } from "./roles";
import { clearStore } from "./store";
import { connectRealtime, disconnectRealtime } from "./store/realtime";

type Step = "phone" | "otp" | "done";

interface OtpContext {
  phoneE164: string;
  expiresAt: string;
  delivery: "sms" | "mock" | "redirect";
}

export default function App() {
  const [step, setStep] = useState<Step>("phone");
  const [phoneMasked, setPhoneMasked] = useState("");
  const [otp, setOtp] = useState<OtpContext | null>(null);
  /** set when the server kicked the person out because the team's access window closed */
  const [evicted, setEvicted] = useState<ApiError | null>(null);

  // restore an existing session (still within its 24h window)
  const [session, setSession] = useState<{ user: LoggedUser; token: string; tokenExpiresAt: string } | null>(
    null,
  );
  useEffect(() => {
    const stored = loadAuth();
    if (stored) {
      setSession({ user: stored.user, token: stored.token, tokenExpiresAt: stored.tokenExpiresAt });
      setStep("done");
      return;
    }
    // an SMS was already sent and is still valid → go straight to the code step with the real expiry
    const pending = loadPendingOtp();
    if (pending) {
      setOtp(pending);
      setPhoneMasked(formatBrazilPhoneClient(pending.phoneE164));
      setStep("otp");
    }
  }, []);

  function resetToLogin() {
    setSession(null);
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

  if (step === "done" && session) {
    return (
      <>
        <VersionMark />
        <Dashboard
          user={session.user}
          token={session.token}
          tokenExpiresAt={session.tokenExpiresAt}
          onLoggedOut={() => {
            clearStore();
            resetToLogin();
          }}
        />
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
        onVerified={({ token, tokenExpiresAt, user }) => {
          clearPendingOtp();
          saveAuth({ token, tokenExpiresAt, user });
          setSession({ user, token, tokenExpiresAt });
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
    </>
  );
}

function VersionMark() {
  return <span className="version-mark" aria-label={`Versão ${__APP_VERSION__}`}>v{__APP_VERSION__}</span>;
}
