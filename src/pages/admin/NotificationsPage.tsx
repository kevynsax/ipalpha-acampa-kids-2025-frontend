import { useState, type ReactNode } from "react";
import { updateSettings, welcomePreview, type NotificationSettings } from "../../api/settings";
import { useCollection } from "../../store";
import { useConfirm } from "../../components/ConfirmDialog";
import Toggle from "../../components/Toggle";
import { useRoute } from "../../router";
import { roleMeta } from "../../roles";
import CheckinReminderCard from "./CheckinReminderCard";

interface NotificationsPageProps {
  token: string;
}

/** the exact bus check-in SMS (mirrors backend composeBusCheckinSms) — shown to the admin so they know what parents get */
const BUS_SMS_EXAMPLE = "AcampaKids: Marcela, a Ana está a caminho de um fim de semana incrível para aprender sobre Jesus! Aproveite o fim de semana livre: vamos cuidar muito bem dela.";
const BIRTHDAY_SMS_EXAMPLE = "AcampaKids: João, hoje é aniversário da Ana (8 anos), do quarto 103! 🎂 Vamos fazer o dia dela especial.";
const PARENT_WELCOME_EXAMPLE = "AcampaKids: Marcela, a Ana está inscrita no Acampa Kids! Acompanhe tudo pelo app. Entre com o celular (11) 99999-9999 em <link do app>";

/** every toggle except `checkinReminder`, which has its own card (needs a date) */
const OPTIONS: { key: Exclude<keyof NotificationSettings, "checkinReminder">; emoji?: string; icon?: string; title: string; text: ReactNode; /** switching ON asks for confirmation with a preview of who gets texted right now */ welcome?: "staff" | "parents" }[] = [
  {
    key: "bedroomChanges",
    emoji: "🛏️",
    title: "Mudança de criança sob responsabilidade",
    text: "Quando uma criança passa a ser (ou deixa de ser) responsabilidade de alguem, só o líder envolvido recebe um SMS — auxiliares não são avisados.",
  },
  {
    key: "staffChanges",
    icon: roleMeta("staff").icon,
    title: "Mudanca no cadastro da equipe",
    text: "Quando o quarto, a função no quarto (líder ↔ auxiliar), o time ou o transporte de alguém da equipe é alterado, a própria pessoa recebe um SMS.",
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
    text: "Quando um documento de Instruções ou uma seção da Preparação é criado ou alterado (a equipe para quem foi publicado), ou as instruções / preparação de uma função mudam (quem tem a função), a pessoa recebe um SMS.",
  },
  {
    key: "parentContentChanges",
    emoji: "👨‍👩‍👧+🎒",
    title: "Preparação nova / alterada para os pais",
    text: "Quando uma seção da Preparação publicada para os pais é criada ou alterada, cada responsável recebe um SMS — só enquanto a janela de acesso dos pais (em Geral) estiver aberta.",
  },
  {
    key: "enrolments",
    emoji: "🎉",
    title: "Boas-vindas e novas responsabilidades",
    text: "Quando o app é liberado para a equipe (início do período de acesso) cada pessoa recebe, uma única vez, um SMS de boas-vindas com o link do app. Quem vira organizador (da programação ou dos jogos / placar), ajudante do placar, ajudante do check-in / ônibus, equipe médica, responsável pelos coletes ou contato dos pais recebe o SMS na hora.",
    welcome: "staff",
  },
  {
    key: "parentWelcome",
    emoji: "👨‍👩‍👧",
    title: "Boas-vindas aos pais",
    text: (
      <>
        Quando o app é liberado para os pais (janela de acesso dos pais, em Geral) cada responsável recebe, <strong>uma única vez</strong>, um SMS avisando que a criança está inscrita e como entrar no app.
        <br />
        <code className="sms-example">{PARENT_WELCOME_EXAMPLE}</code>
      </>
    ),
    welcome: "parents",
  },
  {
    key: "busCheckin",
    emoji: "🚌",
    title: "Criança embarcou no ônibus",
    text: (
      <>
        Quando o check-in da criança no ônibus é registrado, o responsável recebe este SMS (com o nome da criança e "dele" / "dela" conforme o cadastro):
        <br />
        <code className="sms-example">{BUS_SMS_EXAMPLE}</code>
      </>
    ),
  },
  {
    key: "checkinConfirmation",
    emoji: "👋",
    title: "Confirmação de check-in da equipe",
    text: "Quando o check-in de alguém da equipe é registrado na igreja ela recebe um SMS confirmando e lembrando de conferir as crianças do seu quarto.",
  },
  {
    key: "parentEdits",
    emoji: "👨‍👩‍👧",
    title: "Pais alteraram os pontos de atenção",
    text: "Quando um pai ou mãe altera os dados médicos da criança (alergias, medicação, convênio…), a equipe médica, os administradores e o líder do quarto recebem um SMS. Se mudar só as observações, apenas o líder do quarto é avisado.",
  },
  {
    key: "birthdays",
    emoji: "🎂",
    title: "Aniversário de criança no acampamento",
    text: (
      <>
        Quando uma criança faz aniversário num dia do acampamento, toda a equipe do quarto dela recebe um SMS às <strong>07:45</strong> desse dia:
        <br />
        <code className="sms-example">{BIRTHDAY_SMS_EXAMPLE}</code>
      </>
    ),
  },
  {
    key: "occurrences",
    emoji: "🚨",
    title: "Ocorrência registrada",
    text: "Quando uma ocorrência é registrada (pela organização ou pela equipe médica), o admin recebe um SMS — a não ser que tenha sido ele quem registrou.",
  },
];

/**
 * Admin-only: which changes are texted to the team. The SMS is only a nudge
 * ("houve uma mudança… abra o app") — the details live in the app.
 */
export default function NotificationsPage({ token }: NotificationsPageProps) {
  const settings = useCollection("settings");
  const { navigate } = useRoute();
  const confirm = useConfirm();
  const [busy, setBusy] = useState<keyof NotificationSettings | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function toggle(key: keyof NotificationSettings, value: boolean, welcome?: "staff" | "parents") {
    if (!settings || busy) return;
    setBusy(key);
    setError(null);
    try {
      // a welcome toggle switched ON texts everyone inside their window who was never welcomed — at once. Show who, ask first.
      if (value && welcome) {
        const preview = (await welcomePreview(token))[welcome];
        const who = welcome === "staff" ? "pessoas da equipe" : "responsáveis";
        const names = preview.names.slice(0, 8).join(", ") + (preview.names.length > 8 ? ` e mais ${preview.names.length - 8}` : "");
        const ok = await confirm({
          emoji: "📲",
          title: preview.count > 0 ? `Enviar SMS para ${preview.count} ${who} agora?` : "Ligar boas-vindas?",
          message:
            preview.count > 0 ? (
              <>
                <p>Ao ligar, <strong>{preview.count} {who}</strong> que ainda não receberam as boas-vindas e já estão dentro da janela de acesso recebem o SMS <strong>imediatamente</strong>:</p>
                <p className="cat-hint">{names}</p>
              </>
            ) : (
              <p>{preview.windowOpen ? `Ninguém recebe agora: todos os ${who} dentro da janela já foram avisados.` : `Ninguém recebe agora — a janela de acesso ${welcome === "staff" ? "da equipe" : "dos pais"} está fechada. O SMS sai quando ela abrir, para quem ainda não recebeu.`}</p>
            ),
          confirmLabel: preview.count > 0 ? `Enviar para ${preview.count}` : "Ligar",
        });
        if (!ok) return;
      }
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
        A equipe recebe um <strong>SMS curto</strong> avisando que algo mudou.
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
      {settings?.smsRedirect.enabled && (
        <p className="message message--error">
          📵 <strong>Redirecionamento de SMS ligado</strong>: nenhum aviso (nem código de login) chega à equipe ou aos pais — tudo vai para os celulares de
          teste. <strong>Desligue antes do acampamento começar.</strong>{" "}
          <a href="#/trials" onClick={(e) => { e.preventDefault(); navigate("/trials"); }}>Ajustar em Testes</a>
        </p>
      )}
      {settings?.kidsRoomsDraft && (
        <p className="message message--warn">
          Os quartos das crianças estão em rascunho: os avisos de quarto (crianças e equipe) estão pausados.{" "}
          <a href="#/trials" onClick={(e) => { e.preventDefault(); navigate("/trials"); }}>Ajustar em Testes</a>
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
                <Toggle checked={on} disabled={busy !== null} label={on ? "Ligado" : "Desligado"} onChange={(v) => toggle(o.key, v, o.welcome)} />
              </li>
            );
          })}
        </ul>
      )}

      {settings && <CheckinReminderCard token={token} />}

      <p className="footer-note">
        Só recebe SMS quem tem celular cadastrado e está ativo. Os pais só recebem as boas-vindas, a preparação publicada para eles e o aviso de embarque no ônibus — nunca avisos de quarto, função ou qualquer outra mudança.
      </p>
    </div>
  );
}
