import { useEffect, useState } from "react";
import { getSettings, updateSettings, type NotificationSettings, type Settings } from "../../api/settings";
import Toggle from "../../components/Toggle";

interface NotificationsPageProps {
  token: string;
}

const OPTIONS: { key: keyof NotificationSettings; emoji: string; title: string; text: string }[] = [
  {
    key: "bedroomChanges",
    emoji: "🛏️",
    title: "Mudança de criança no quarto",
    text: "Quando uma criança entra, sai ou é transferida de um quarto, quem cuida daquele quarto recebe um SMS.",
  },
  {
    key: "roleChanges",
    emoji: "🎯",
    title: "Mudança de função na programação",
    text: "Quando alguém é escalado, trocado ou retirado de uma função — ou o evento muda de horário / é cancelado, ou as instruções da função mudam — a pessoa recebe um SMS.",
  },
  {
    key: "checkinConfirmation",
    emoji: "✅",
    title: "Confirmação de check-in",
    text: "Quando o check-in de alguém da equipe é registrado na igreja — pela própria pessoa ou pela chamada do admin — ela recebe um SMS confirmando e lembrando de conferir as crianças do seu quarto.",
  },
];

/**
 * Admin-only: which changes are texted to the team. The SMS is only a nudge
 * ("houve uma mudança… abra o app") — the details live in the app.
 */
export default function NotificationsPage({ token }: NotificationsPageProps) {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [busy, setBusy] = useState<keyof NotificationSettings | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    getSettings(token)
      .then((s) => alive && setSettings(s))
      .catch((e) => alive && setError(e instanceof Error ? e.message : "Algo deu errado."));
    return () => {
      alive = false;
    };
  }, [token]);

  async function toggle(key: keyof NotificationSettings, value: boolean) {
    if (!settings || busy) return;
    setBusy(key);
    setError(null);
    // optimistic — flip back on failure
    const previous = settings;
    setSettings({ ...settings, notifications: { ...settings.notifications, [key]: value } });
    try {
      setSettings(await updateSettings(token, { notifications: { [key]: value } }));
    } catch (e) {
      setSettings(previous);
      setError(e instanceof Error ? e.message : "Algo deu errado.");
    } finally {
      setBusy(null);
    }
  }

  if (!settings && !error) {
    return (
      <div className="admin-page">
        <p className="opt-empty">Carregando configurações… ⚙️</p>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <header className="admin-head">
        <h1 className="admin-title">📲 Notificações por SMS</h1>
      </header>
      <p className="admin-intro">
        A equipe recebe um <strong>SMS curto</strong> avisando que algo mudou e pedindo para abrir o app — as instruções ficam
        sempre aqui, nunca na mensagem. Várias mudanças seguidas para a mesma pessoa viram um único SMS.
      </p>

      {settings && !settings.smsEnabled && (
        <p className="message message--error">
          ⚠️ O envio de SMS não está configurado no servidor (COMTELE_API_KEY). As mensagens estão sendo apenas registradas no console.
        </p>
      )}
      {error && <p className="message message--error">{error}</p>}

      {settings && (
        <ul className="notif-list">
          {OPTIONS.map((o) => {
            const on = settings.notifications[o.key];
            return (
              <li key={o.key} className={`notif-item ${on ? "notif-item--on" : ""}`}>
                <span className="notif-item__emoji" aria-hidden="true">{o.emoji}</span>
                <div className="notif-item__body">
                  <h2 className="notif-item__title">{o.title}</h2>
                  <p className="notif-item__text">{o.text}</p>
                </div>
                <Toggle checked={on} disabled={busy !== null} label={on ? "Ligado" : "Desligado"} onChange={(v) => toggle(o.key, v)} />
              </li>
            );
          })}
        </ul>
      )}

      <p className="footer-note">
        Só recebe SMS quem tem celular cadastrado na equipe e está ativo. Exemplos de mensagem: <em>"AcampaKids: João, houve uma
        mudança na sua escala (função). Abra o app para ver suas instruções."</em> · <em>"AcampaKids: João, seu check-in foi feito
        com sucesso. Lembre-se de conferir as crianças do seu quarto no app."</em>
      </p>
    </div>
  );
}
