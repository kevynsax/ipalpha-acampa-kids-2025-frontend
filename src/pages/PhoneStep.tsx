import { useState } from "react";
import { ApiError } from "../api/client";
import { requestOtp } from "../auth/store";
import PhoneInput from "../components/PhoneInput";
import StaffAccessDialog, { isStaffAccessError } from "../components/StaffAccessDialog";
import { isCompleteMobile, toE164 } from "../phone";

interface PhoneStepProps {
  phone: string; // masked
  onPhoneChange: (masked: string) => void;
  onSent: (info: { phoneE164: string; expiresAt: string; delivery: "sms" | "mock" }) => void;
}

/** Step 1 — Brazilian cell phone entry (rendered inside the green panel). */
export default function PhoneStep({ phone, onPhoneChange, onSent }: PhoneStepProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accessError, setAccessError] = useState<ApiError | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const phoneE164 = toE164(phone);
    if (!phoneE164) {
      setError("Digite um celular válido com DDD (ex.: (11) 98123-4567).");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await requestOtp(phoneE164);
      onSent({ phoneE164, expiresAt: res.expiresAt, delivery: res.delivery });
    } catch (err) {
      if (isStaffAccessError(err)) {
        setAccessError(err);
      } else if (err instanceof ApiError && err.code === "ACCOUNT_FROZEN") {
        setError(err.message);
      } else {
        setError(err instanceof Error ? err.message : "Algo deu errado. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <h1 className="camping-panel__title">Qual é o seu celular?</h1>

      <form className="form" onSubmit={handleSubmit}>
        <PhoneInput value={phone} onChange={onPhoneChange} disabled={loading} autoFocus />

        <button
          type="submit"
          className="button button--primary"
          disabled={loading || !isCompleteMobile(phone)}
        >
          {loading ? "Enviando…" : "Continuar"}
        </button>

        {error && <p className="message message--error">{error}</p>}
      </form>

      <StaffAccessDialog error={accessError} onClose={() => setAccessError(null)} />
    </>
  );
}
