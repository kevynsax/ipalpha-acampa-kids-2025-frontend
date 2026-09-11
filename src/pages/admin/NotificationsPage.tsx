import { useState } from "react";
import { updateSettings, type NotificationSettings } from "../../api/settings";
import { useCollection } from "../../store";
import Toggle from "../../components/Toggle";
import { useRoute } from "../../router";
import { roleMeta } from "../../roles";

interface NotificationsPageProps {
  token: string;
}

const OPTIONS: { key: keyof NotificationSettings; emoji?: string; icon?: string; title: string; text: string }[] = [
  {
    key: "bedroomChanges",
    emoji: "🛏️",
    title: "Mudança de criança no quarto",
    text: "Quando uma criança entra, sai ou é transferida de um quarto, quem cuida daquele quarto recebe um SMS.",
  },
  {
    key: "staffChanges",
    icon: roleMeta("staff").icon,
    title: "Mudanca no cadastro da equipe",
    text: "Quando o quarto, o time ou o transporte de alguém da equipe é alterado, a própria pessoa recebe um SMS.",
  },
  {
    key: "roleChanges",
    emoji: "🎯",
    title: "Mudança de função na programação",
    text: "Quando alguém é escalado, trocado ou retirado de uma função — ou o evento muda de horário / é cancelado — a pessoa recebe um SMS.",
  },
  {
    key: "contentChanges",
    emoji: "📖+🎒",
    title: "Instruções ou Preparação novas / alteradas",
    text: "Quando um documento de Instruções ou uma seção da Preparação é criado ou alterado (toda a equipe), ou as instruções / preparação de uma função mudam (quem tem a função), a pessoa recebe um SMS.",
  },
  {
    key: "enrolments",
    emoji: "🎉",
    title: "Boas-vindas e novas responsabilidades",
    text: "Quando o app é liberado para a equipe (início do período de acesso) cada pessoa recebe, uma única vez, um SMS de boas-vindas com o link do app. Quem vira organizador, ajudante do check-in / ônibus, equipe médica ou contato dos pais recebe o SMS na hora.",
  },
  {
    key: "checkinConfirmation",
    emoji: "👋",
    title: "Confirmação de check-in da equipe",
    text: "Quando o check-in de alguém da equipe é registrado na igreja ela recebe um SMS confirmando e lembrando de conferir as crianças do seu quarto.",
  },
  {
    key: "occurrences",
    emoji: "🚨",
    title: "Ocorrência registrada",
    text: "Quando uma ocorrência é registrada (pela organização ou pela equipe médica), todos os administradores recebem um SMS — exceto quem registrou.",
  },
];

/**
 * Admin-only: which changes are texted to the team. The SMS is only a nudge
 * ("houve uma mudança… abra o app") — the details live in the app.
 */
export default function NotificationsPage({ token }: NotificationsPageProps) {
  const settings = useCollection("settings");
  const { navigate } = useRoute();
  const [busy, setBusy] = useState<keyof NotificationSettings | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function toggle(key: keyof NotificationSettings, value: boolean) {
    if (!settings || busy) return;
    setBusy(key);
    setError(null);
    try {
      await updateSettings(token, { notifications: { [key]: value } });
    } catch (e) {
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
        A equipe recebe um <strong>SMS curto</strong> avisando que algo mudou e pedindo para abrir o app.
      </p>

      {settings && !settings.smsEnabled && (
        <p className="message message--error">
          ⚠️ O envio de SMS não está configurado no servidor (COMTELE_API_KEY). As mensagens estão sendo apenas registradas no console.
        </p>
      )}
      {settings && settings.staffAccessWindow && !settings.staffAccessWindow.open && (
        <p className="message message--warn">
          A equipe está sem acesso ao sistema, então não recebe notificações.{" "}
          <a href="#/general" onClick={(e) => { e.preventDefault(); navigate("/general"); }}>Ajustar período de acesso</a>
        </p>
      )}
      {settings?.kidsRoomsDraft && (
        <p className="message message--warn">
          Os quartos das crianças estão em rascunho: os avisos de quarto (crianças e equipe) estão pausados.{" "}
          <a href="#/general" onClick={(e) => { e.preventDefault(); navigate("/general"); }}>Ajustar em Geral</a>
        </p>
      )}
      {error && <p className="message message--error">{error}</p>}

      {settings && (
        <ul className="notif-list">
          {OPTIONS.map((o) => {
            const on = settings.notifications[o.key];
            return (
              <li key={o.key} className={`notif-item ${on ? "notif-item--on" : ""}`}>
                <span className={`notif-item__emoji ${o.emoji?.includes("+") ? "notif-item__emoji--pair" : ""}`} aria-hidden="true">
                  {o.icon ? <img src={o.icon} alt="" className="notif-item__icon" /> : o.emoji?.includes("+") ? o.emoji.split("+").map((e, i) => (i ? <span key={e}><span className="notif-item__plus">+</span>{e}</span> : <span key={e}>{e}</span>)) : o.emoji}
                </span>
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
        Só recebe SMS quem tem celular cadastrado na equipe e está ativo.
      </p>
    </div>
  );
}
