import { useEffect, useState } from "react";
import { updateSettings } from "../../api/settings";
import PhoneInput from "../../components/PhoneInput";
import Toggle from "../../components/Toggle";
import { useI18n } from "../../i18n";
import { maskBrazilPhone, toE164 } from "../../phone";
import { useCollection } from "../../store";

interface SmsRedirectCardProps {
  token: string;
}

const toMasked = (e164: string | null) => (e164 ? maskBrazilPhone(e164.replace(/^\+55/, "")) : "");

/**
 * Settings → Testes: SMS redirect. While on, every text meant for a team
 * member (login code + notifications) goes to the STAFF test phone and every
 * text meant for a parent goes to the PARENT test phone — so the admin can
 * rehearse the whole flow (logins, roster changes, check-ins…) without
 * texting real people. Admins keep receiving their own login codes and admin invitations.
 */
export default function SmsRedirectCard({ token }: SmsRedirectCardProps) {
  const { tx } = useI18n();
  const settings = useCollection("settings");
  const [staffPhone, setStaffPhone] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  const [busy, setBusy] = useState<"toggle" | "save" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const current = settings?.smsRedirect ?? { enabled: false, staffPhone: null, parentPhone: null };
  const on = current.enabled;

  useEffect(() => {
    setStaffPhone(toMasked(current.staffPhone));
    setParentPhone(toMasked(current.parentPhone));
  }, [current.staffPhone, current.parentPhone]);

  const staffE164 = toE164(staffPhone);
  const parentE164 = toE164(parentPhone);
  const staffOk = !staffPhone.trim() || !!staffE164;
  const parentOk = !parentPhone.trim() || !!parentE164;
  const dirty = (staffE164 ?? null) !== current.staffPhone || (parentE164 ?? null) !== current.parentPhone;

  async function run(kind: "toggle" | "save", patch: Parameters<typeof updateSettings>[1]) {
    if (busy) return;
    setBusy(kind);
    setError(null);
    setSaved(false);
    try {
      await updateSettings(token, patch);
      if (kind === "save") setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : tx("Algo deu errado."));
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="cat-form">
      <div className="cat-form__head">
        <h2 className="cat-form__title">📵 {tx("Redirecionar SMS")}</h2>
        <Toggle checked={on} disabled={!settings || busy !== null} label={on ? tx("Ligado") : tx("Desligado")} onChange={(v) => void run("toggle", { smsRedirect: { enabled: v } })} />
      </div>
      <p className="cat-hint">
        {tx("Ligado,")} <strong>{tx("nenhum SMS chega às pessoas de verdade")}</strong>
        {tx(": o código de login e os avisos da")} <strong>{tx("equipe")}</strong> {tx("vão para o primeiro celular, os dos")}{" "}
        <strong>{tx("pais")}</strong> {tx("para o segundo. Sem celular em um dos campos, os SMS daquele grupo não saem. Administradores continuam recebendo diretamente os próprios códigos e convites de admin.")}
      </p>
      <form
        className="cat-form__row staff-form__row sms-form"
        onSubmit={(e) => {
          e.preventDefault();
          void run("save", { smsRedirect: { staffPhone: staffE164 ?? null, parentPhone: parentE164 ?? null } });
        }}
      >
        <div className="cat-field cat-field--grow">
          <span className="cat-field__label">{tx("Celular de teste da equipe")}</span>
          <PhoneInput value={staffPhone} onChange={setStaffPhone} disabled={busy !== null} />
          {!staffOk && <p className="cat-hint cat-hint--error">{tx("Informe um celular válido com DDD.")}</p>}
        </div>
        <div className="cat-field cat-field--grow">
          <span className="cat-field__label">{tx("Celular de teste dos pais")}</span>
          <PhoneInput value={parentPhone} onChange={setParentPhone} disabled={busy !== null} />
          {!parentOk && <p className="cat-hint cat-hint--error">{tx("Informe um celular válido com DDD.")}</p>}
        </div>
        <div className="cat-field">
          <span className="cat-field__label">&nbsp;</span>
          <button type="submit" className="button button--primary" disabled={busy !== null || !dirty || !staffOk || !parentOk}>
            {busy === "save" ? tx("Salvando…") : tx("Salvar")}
          </button>
        </div>
      </form>
      {error && <p className="message message--error">{error}</p>}
      {saved && <p className="message message--ok">{tx("✅ Celulares salvos.")}</p>}
      {on && (
        <p className="cat-hint cat-hint--error">
          {tx("⚠️ Redirecionamento ligado: equipe e pais")} <strong>{tx("não recebem SMS")}</strong> {tx("(nem o código de login).")} {tx("Desligue antes do acampamento!")}
        </p>
      )}
      {on && !current.staffPhone && <p className="cat-hint cat-hint--error">{tx("Sem celular da equipe: a equipe não consegue fazer login enquanto isso estiver ligado.")}</p>}
      {on && !current.parentPhone && <p className="cat-hint cat-hint--error">{tx("Sem celular dos pais: os pais não conseguem fazer login enquanto isso estiver ligado.")}</p>}
    </section>
  );
}
