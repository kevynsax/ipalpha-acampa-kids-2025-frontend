import { useEffect, useState } from "react";
import { addAdmin, listAdmins, removeAdmin, type AdminAccount, type AdminsInfo } from "../api/admins";
import PhoneInput from "./PhoneInput";
import { useI18n } from "../i18n";
import type { LoggedUser } from "../roles";
import { toE164 } from "../phone";
import { formatBrazilPhoneClient } from "../phoneFormat";
import { whatsappLink } from "../whatsapp";

interface AdminsEditorProps {
  token: string;
  user: LoggedUser;
}

/**
 * The admin list + add/remove form (setup wizard's Admins step and the
 * Superusuário page's Administradores card use the same one).
 */
export default function AdminsEditor({ token, user }: AdminsEditorProps) {
  const { tx } = useI18n();
  const [info, setInfo] = useState<AdminsInfo | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [added, setAdded] = useState<AdminAccount | null>(null);
  const [smsSent, setSmsSent] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let alive = true;
    setError(null);
    listAdmins(token)
      .then((i) => alive && setInfo(i))
      .catch((e) => alive && setError(e instanceof Error ? e.message : tx("Não foi possível carregar os admins.")));
    return () => {
      alive = false;
    };
  }, [token]);

  const link = info?.appUrl || window.location.origin;
  const e164 = toE164(phone);

  async function add() {
    if (busy || !name.trim() || !e164) return;
    setBusy(true);
    setError(null);
    setCopied(false);
    try {
      const r = await addAdmin(token, { name: name.trim(), phone: e164 });
      setAdded(r.admin);
      setSmsSent(r.smsSent);
      setName("");
      setPhone("");
      setInfo(await listAdmins(token));
    } catch (e) {
      setError(e instanceof Error ? e.message : tx("Algo deu errado."));
    } finally {
      setBusy(false);
    }
  }

  async function remove(a: AdminAccount) {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await removeAdmin(token, a.id);
      setInfo(await listAdmins(token));
      setAdded((kept) => (kept?.id === a.id ? null : kept));
    } catch (e) {
      setError(e instanceof Error ? e.message : tx("Algo deu errado."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {error && <p className="message message--error">{error}</p>}

      {info && (
        <ul className="wizard-admins">
          {info.admins.map((a) => (
            <li key={a.id} className="wizard-admins__row">
              <span className="wizard-admins__name">
                {a.name} {a.id === user.id && <span className="cat-hint">{tx("(você)")}</span>}
                {a.superAdmin && <span className="cat-hint"> {tx("· admin da implantação")}</span>}
              </span>
              <span className="wizard-admins__phone">{formatBrazilPhoneClient(a.phone)}</span>
              {!a.superAdmin && a.id !== user.id && (
                <button type="button" className="helpers-tag__x" title={tx("Remover acesso de admin")} aria-label={tx("Remover {name}", { name: a.name })} disabled={busy} onClick={() => void remove(a)}>
                  ✕
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      <form
        className="cat-form"
        onSubmit={(e) => {
          e.preventDefault();
          void add();
        }}
      >
        <div className="cat-form__row staff-form__row">
          <label className="cat-field cat-field--grow">
            <span className="cat-field__label">{tx("Nome")}</span>
            <input className="cat-input" placeholder={tx("Quem vai administrar")} value={name} maxLength={80} disabled={busy} onChange={(e) => setName(e.target.value)} />
          </label>
          <label className="cat-field cat-field--grow">
            <span className="cat-field__label">{tx("Celular")}</span>
            <PhoneInput value={phone} onChange={setPhone} disabled={busy} />
          </label>
        </div>
        <div className="cat-form__actions">
          <button type="submit" className="button button--primary" disabled={busy || !name.trim() || !e164}>
            {busy ? tx("Adicionando…") : tx("Adicionar e enviar link")}
          </button>
        </div>
      </form>

      {added && (
        <div className="wizard-invite">
          <p className="message message--ok">
            ✅ <strong>{added.name}</strong> {tx("já é admin.")}{smsSent ? tx(" O link já foi mandado por SMS —") : ""} {tx("Envie o link:")}
          </p>
          <div className="cat-form__actions">
            <a className="button button--secondary" href={whatsappLink(added.phone, tx("Olá! Você agora administra o Acampa Kids 🏕️ Entre com este celular: {link}", { link }))} target="_blank" rel="noreferrer">
              {tx("Mandar no WhatsApp")}
            </a>
            <button
              type="button"
              className="button button--secondary"
              onClick={() => {
                void navigator.clipboard?.writeText(link).then(() => setCopied(true));
              }}
            >
              {copied ? tx("✓ Copiado") : tx("Copiar link")}
            </button>
          </div>
          <p className="cat-hint">{link}</p>
        </div>
      )}
    </>
  );
}
