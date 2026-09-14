import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError } from "../api/client";
import { requestOtp, verifyOtp } from "../auth/store";
import OtpInput from "../components/OtpInput";
import StaffAccessDialog, { isStaffAccessError } from "../components/StaffAccessDialog";
import type { LoggedUser } from "../roles";

interface OtpStepProps {
  phoneE164: string;
  phoneMasked: string;
  expiresAt: string;
  delivery: "sms" | "mock" | "redirect";
  onExpiryChange: (iso: string) => void;
  onVerified: (info: { token: string; tokenExpiresAt: string; user: LoggedUser }) => void;
  onBack: () => void;
}

function remaining(expiresAt: string): number {
  return Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
}

/** Always derived from the wall clock, so a backgrounded tab / reopened browser shows the real time left. */
function useCountdown(expiresAt: string): number {
  const [secondsLeft, setSecondsLeft] = useState(() => remaining(expiresAt));

  useEffect(() => {
    const tick = () => setSecondsLeft(remaining(expiresAt));
    tick();
    const id = setInterval(tick, 1000);
    const onVisible = () => {
      if (document.visibilityState === "visible") tick();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", tick);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", tick);
    };
  }, [expiresAt]);

  return secondsLeft;
}

/** Step 2 — 6-digit code, 5-min countdown, 3 attempts, resend. */
export default function OtpStep({
  phoneE164,
  phoneMasked,
  expiresAt,
  delivery,
  onExpiryChange,
  onVerified,
  onBack,
}: OtpStepProps) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attemptsLeft, setAttemptsLeft] = useState<number | null>(null);
  const [frozenMinutes, setFrozenMinutes] = useState<number | null>(null);
  const [resending, setResending] = useState(false);
  const [accessError, setAccessError] = useState<ApiError | null>(null);
  const submittedRef = useRef(false);

  const secondsLeft = useCountdown(expiresAt);
  const expired = secondsLeft <= 0;
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = String(secondsLeft % 60).padStart(2, "0");

  const submit = useCallback(
    async (value: string) => {
      if (submittedRef.current || value.length !== 6) return;
      submittedRef.current = true;
      setLoading(true);
      setError(null);

      try {
        const res = await verifyOtp(phoneE164, value);
        onVerified({ token: res.token, tokenExpiresAt: res.tokenExpiresAt, user: res.user });
      } catch (err) {
        if (isStaffAccessError(err)) {
          setAccessError(err);
          setCode("");
        } else if (err instanceof ApiError) {
          setError(err.message);
          if (err.code === "OTP_INVALID" && err.attemptsLeft != null) {
            setAttemptsLeft(err.attemptsLeft);
            setCode("");
          }
          if (err.code === "OTP_EXPIRED") setCode("");
          if (err.code === "ACCOUNT_FROZEN") {
            setFrozenMinutes(err.minutesLeft ?? 30);
            setCode("");
          }
        } else {
          setError("Algo deu errado. Tente novamente.");
        }
        // allow retrying after a failure
        setTimeout(() => {
          submittedRef.current = false;
        }, 400);
      } finally {
        setLoading(false);
      }
    },
    [phoneE164, onVerified],
  );

  async function handleResend() {
    setResending(true);
    setError(null);
    try {
      const res = await requestOtp(phoneE164);
      onExpiryChange(res.expiresAt);
      setCode("");
      setAttemptsLeft(null);
    } catch (err) {
      if (isStaffAccessError(err)) setAccessError(err);
      else setError(err instanceof Error ? err.message : "Não foi possível reenviar.");
    } finally {
      setResending(false);
    }
  }

  if (frozenMinutes != null) {
    return (
      <>
        <h1 className="camping-panel__title">Conta bloqueada</h1>
        <p className="panel-text">
          Foram 3 tentativas erradas, então a conta ficou bloqueada por segurança. Espere{" "}
          <strong>{frozenMinutes} minuto(s)</strong> e tente de novo.
        </p>
        <button type="button" className="button button--secondary" onClick={onBack}>
          Voltar ao início
        </button>
      </>
    );
  }

  return (
    <>
      <div className="panel-head">
        <button type="button" className="back-button" onClick={onBack}>
          ← Trocar telefone
        </button>
      </div>

      <h1 className="camping-panel__title">Digite o código</h1>
      <p className="panel-text">
        {delivery === "redirect" ? (
          <>
            🧪 Modo de teste: o código de <strong>{phoneMasked}</strong> foi enviado para o <strong>celular de teste</strong> da organização.
          </>
        ) : (
          <>
            Enviamos um SMS para <strong>{phoneMasked}</strong>
          </>
        )}
        {delivery === "mock" && (
          <span className="mock-note"> (modo dev: o código aparece no console do servidor)</span>
        )}
      </p>

      <div className={`countdown ${expired ? "countdown--expired" : ""}`}>
        {expired ? "O código expirou" : `Vale por ${minutes}:${seconds}`}
      </div>

      <OtpInput
        value={code}
        onChange={setCode}
        onComplete={submit}
        disabled={loading || expired}
        autoFocus
        invalid={!!error && attemptsLeft != null}
      />

      {error && (
        <p className="message message--error">
          {error}
          {attemptsLeft != null && (
            <span className="attempts"> · {attemptsLeft} tentativa(s) restante(s)</span>
          )}
        </p>
      )}

      <button
        type="button"
        className="button button--primary"
        disabled={loading || code.length !== 6 || expired}
        onClick={() => submit(code)}
      >
        {loading ? "Verificando…" : "Entrar"}
      </button>

      <button
        type="button"
        className="resend-button"
        disabled={resending || !expired}
        onClick={handleResend}
        title={expired ? "Pedir um novo código" : "O código ainda é válido"}
      >
        {resending ? "Reenviando…" : expired ? "Reenviar código" : "Você pode pedir um novo código quando este expirar"}
      </button>

      <StaffAccessDialog
        error={accessError}
        onClose={() => {
          setAccessError(null);
          onBack();
        }}
      />

    </>
  );
}
