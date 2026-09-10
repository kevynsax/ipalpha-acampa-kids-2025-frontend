import { useEffect, useState } from "react";
import CampingLayout from "./components/CampingLayout";
import { clearAuth, loadAuth, saveAuth } from "./auth/store";
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
  delivery: "sms" | "mock";
}

export default function App() {
  const [step, setStep] = useState<Step>("phone");
  const [phoneMasked, setPhoneMasked] = useState("");
  const [otp, setOtp] = useState<OtpContext | null>(null);

  // restore an existing session (still within its 24h window)
  const [session, setSession] = useState<{ user: LoggedUser; token: string; tokenExpiresAt: string } | null>(
    null,
  );
  useEffect(() => {
    const stored = loadAuth();
    if (stored) {
      setSession({ user: stored.user, token: stored.token, tokenExpiresAt: stored.tokenExpiresAt });
      setStep("done");
    }
  }, []);

  function resetToLogin() {
    setSession(null);
    setStep("phone");
    setPhoneMasked("");
    setOtp(null);
  }

  // live data feed: one WebSocket for the whole session; the store keeps a
  // localStorage copy so the app keeps working when the connection drops
  const token = session?.token ?? null;
  useEffect(() => {
    if (!token) return;
    connectRealtime(token, {
      onUnauthorized: () => {
        // session revoked / expired on the server → back to the login
        clearAuth();
        clearStore();
        resetToLogin();
      },
    });
    return () => disconnectRealtime();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  if (step === "done" && session) {
    return (
      <Dashboard
        user={session.user}
        token={session.token}
        tokenExpiresAt={session.tokenExpiresAt}
        onLoggedOut={() => {
          clearStore();
          resetToLogin();
        }}
      />
    );
  }

  let content: JSX.Element;
  if (step === "otp" && otp) {
    content = (
      <OtpStep
        key={otp.phoneE164}
        phoneE164={otp.phoneE164}
        phoneMasked={formatBrazilPhoneClient(otp.phoneE164)}
        expiresAt={otp.expiresAt}
        delivery={otp.delivery}
        onExpiryChange={(iso) => setOtp({ ...otp, expiresAt: iso })}
        onVerified={({ token, tokenExpiresAt, user }) => {
          saveAuth({ token, tokenExpiresAt, user });
          setSession({ user, token, tokenExpiresAt });
          setStep("done");
        }}
        onBack={() => setStep("phone")}
      />
    );
  } else {
    content = (
      <PhoneStep
        phone={phoneMasked}
        onPhoneChange={setPhoneMasked}
        onSent={({ phoneE164, expiresAt, delivery }) => {
          setOtp({ phoneE164, expiresAt, delivery });
          setStep("otp");
        }}
      />
    );
  }

  return <CampingLayout>{content}</CampingLayout>;
}
