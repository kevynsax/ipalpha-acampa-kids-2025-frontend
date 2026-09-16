import { useState, type ReactNode } from "react";
import { updateSettings, welcomePreview, type NotificationSettings } from "../../api/settings";
import { useCollection } from "../../store";
import { useConfirm } from "../../components/ConfirmDialog";
import Toggle from "../../components/Toggle";
import { useRoute } from "../../router";
import { ICONS } from "../../icons";
import { roleMeta } from "../../roles";
import CheckinReminderCard from "./CheckinReminderCard";
import PageFooter from "../../components/PageFooter";

interface NotificationsPageProps {
  token: string;
}

/** the exact bus check-in SMS (mirrors backend composeBusCheckinSms) — shown to the admin so they know what parents get */
const BUS_SMS_EXAMPLE = "AcampaKids: Marcela, a Ana está a caminho de um fim de semana incrível para aprender sobre Jesus! Aproveite o fim de semana livre: vamos cuidar muito bem dela.";
const BIRTHDAY_SMS_EXAMPLE = "AcampaKids: João, hoje é aniversário da Ana (8 anos), do quarto 103! 🎂 Vamos fazer o dia dela especial.";
const PARENT_WELCOME_EXAMPLE = "AcampaKids: Marcela, a Ana está inscrita no Acampa Kids! Acompanhe tudo pelo app. Entre com o celular (11) 99999-9999 em <link do app>";
const PHOTOS_SMS_EXAMPLE = "AcampaKids: Marcela, as fotos do acampamento já estão no app \u{1F4F7}. <link do app>";

type NotifKey = Exclude<keyof NotificationSettings, "checkinReminder">;

interface NotifOption {
  key: NotifKey;
  emoji?: string;
  icon?: string;
  /** second half of a 📖 + mala pair (emoji is the first half) */
  pairIcon?: string;
  title: string;
  text: ReactNode;
  /** switching ON asks for confirmation with a preview of who gets texted right now */
  welcome?: "staff" | "parents";
}

interface NotifGroup {
  id: string;
  title: string;
  icon?: string;
  emoji?: string;
  hint: string;
  options: NotifOption[];
  /** render the check-in reminder card after this group's toggles */
  reminder?: boolean;
}

/**
 * Grouped by who receives the SMS, then in camp-lifecycle order
 * (welcome → day-to-day changes → check-in → during camp → alerts).
 */
const GROUPS: NotifGroup[] = [
  {
    id: "staff",
    title: "Para a equipe",
    icon: roleMeta("staff").icon,
    hint: "SMS para quem está no cadastro da equipe.",
    reminder: true,
    options: [
      {
        key: "enrolments",
        icon: roleMeta("staff").icon,
        title: "Boas-vindas e novas responsabilidades",
        text: "Quando o app é liberado para a equipe (início do período de acesso) cada pessoa recebe, uma única vez, um SMS de boas-vindas com o link do app. Quem vira organizador (da programação ou dos jogos / placar), ajudante do placar, ajudante do check-in / ônibus, equipe médica, responsável pelos coletes ou contato dos pais recebe o SMS na hora.",
        welcome: "staff",
      },
      {
        key: "staffChanges",
        icon: roleMeta("staff").icon,
        title: "Mudança no cadastro da equipe",
        text: "Quando o quarto, a função no quarto (líder ↔ auxiliar), o time ou o transporte de alguém da equipe é alterado, a própria pessoa recebe um SMS.",
      },
      {
        key: "bedroomChanges",
        icon: ICONS.bunk,
        title: "Mudança de criança sob responsabilidade",
        text: "Quando uma criança passa a ser (ou deixa de ser) responsabilidade de alguem, só o líder envolvido recebe um SMS — auxiliares não são avisados.",
      },
      {
        key: "roleChanges",
        emoji: "🎯",
        title: "Mudança de função na programação",
        text: "Quando alguém é escalado, trocado ou retirado de uma função — ou o evento muda de horário / é cancelado — a pessoa recebe um SMS.",
      },
      {
        key: "contentChanges",
        emoji: "📖",
        pairIcon: ICONS.preparation,
        title: "Instruções ou Preparação novas / alteradas",
        text: "Quando um documento de Instruções ou uma seção da Preparação é criado ou alterado (a equipe para quem foi publicado), ou as instruções / preparação de uma função mudam (quem tem a função), a pessoa recebe um SMS.",
      },
      {
        key: "checkinConfirmation",
        emoji: "✅",
        title: "Confirmação de check-in da equipe",
        text: "Quando o check-in de alguém da equipe é registrado na igreja ela recebe um SMS confirmando e lembrando de conferir as crianças do seu quarto.",
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
        key: "parentEdits",
        icon: roleMeta("health_staff").icon,
        title: "Pais alteraram os pontos de atenção",
        text: "Quando um pai ou mãe altera os dados médicos da criança (alergias, medicação, convênio…), a equipe médica, os administradores e o líder do quarto recebem um SMS. Se mudar só as observações, apenas o líder do quarto é avisado.",
      },
      {
        key: "occurrences",
        emoji: "📋",
        title: "Ocorrência registrada",
        text: "Quando uma ocorrência é registrada (pela organização ou pela equipe médica), o admin recebe um SMS — a não ser que tenha sido ele quem registrou.",
      },
    ],
  },
  {
    id: "parents",
    title: "Para os pais",
    icon: roleMeta("parent").icon,
    hint: "SMS para responsáveis — só enquanto a janela de acesso dos pais estiver aberta, quando fizer sentido.",
    options: [
      {
        key: "parentWelcome",
        icon: roleMeta("parent").icon,
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
        key: "parentContentChanges",
        icon: ICONS.preparation,
        title: "Preparação nova / alterada para os pais",
        text: "Quando uma seção da Preparação publicada para os pais é criada ou alterada, cada responsável recebe um SMS — só enquanto a janela de acesso dos pais (em Geral) estiver aberta.",
      },
      {
        key: "busCheckin",
        icon: ICONS.transport,
        title: "Criança embarcou no ônibus",
        text: (
          <>
            Quando o check-in da criança no ônibus é registrado, o responsável recebe este SMS (com o nome da criança e "dele" / "dela" conforme o cadastro):
            <br />
            <code className="sms-example">{BUS_SMS_EXAMPLE}</code>
          </>
        ),
      },
    ],
  },
  {
    id: "everyone",
    title: "Para todos",
    icon: ICONS.camera,
    hint: "SMS para a equipe e para os responsáveis.",
    options: [
      {
        key: "photoPublishes",
        icon: ICONS.camera,
        title: "Fotos publicadas",
        text: (
          <>
            Quando o fotógrafo liga <strong>Publicadas</strong> na aba Fotos, a equipe e os responsáveis recebem um SMS avisando — <strong>uma única vez por acampamento</strong>. Publicar mais fotos depois não manda SMS de novo, e esconder as fotos não avisa ninguém. Desligar e ligar este aviso libera um novo envio para todos.
            <br />
            <code className="sms-example">{PHOTOS_SMS_EXAMPLE}</code>
          </>
        ),
      },
    ],
  },
];

/**
 * Admin-only: which changes are texted to the team / parents. The SMS is only a nudge
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
                <p>
                  Ao ligar,{" "}
                  <strong>
                    {preview.count} {who}
                  </strong>{" "}
                  que ainda não receberam as boas-vindas e já estão dentro da janela de acesso recebem o SMS <strong>imediatamente</strong>:
                </p>
                <p className="cat-hint">{names}</p>
              </>
            ) : (
              <p>
                {preview.windowOpen
                  ? `Ninguém recebe agora: todos os ${who} dentro da janela já foram avisados.`
                  : `Ninguém recebe agora — a janela de acesso ${welcome === "staff" ? "da equipe" : "dos pais"} está fechada. O SMS sai quando ela abrir, para quem ainda não recebeu.`}
              </p>
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
        <h1 className="admin-title">
          <img className="admin-title__icon" src={ICONS.notifications} alt="" aria-hidden="true" />
          Notificações por SMS
        </h1>
      </header>
      <p className="admin-intro">
        Um <strong>SMS curto</strong> avisa quem precisa quando algo muda.
      </p>

      {settings && !settings.smsEnabled && (
        <p className="message message--error">
          ⚠️ O envio de SMS não está configurado no servidor (COMTELE_API_KEY). As mensagens estão sendo apenas registradas no console.
        </p>
      )}
      {settings && settings.staffAccessWindow && !settings.staffAccessWindow.open && (
        <p className="message message--warn">
          A equipe está sem acesso ao sistema, então não recebe notificações.{" "}
          <a
            href="#/general"
            onClick={(e) => {
              e.preventDefault();
              navigate("/general");
            }}
          >
            Ajustar período de acesso
          </a>
        </p>
      )}
      {settings?.smsRedirect.enabled && (
        <p className="message message--error">
          📵 <strong>Redirecionamento de SMS ligado</strong>: nenhum aviso (nem código de login) chega à equipe ou aos pais — tudo vai para os celulares de teste.{" "}
          <strong>Desligue antes do acampamento começar.</strong>{" "}
          <a
            href="#/trials"
            onClick={(e) => {
              e.preventDefault();
              navigate("/trials");
            }}
          >
            Ajustar em Testes
          </a>
        </p>
      )}
      {settings?.kidsRoomsDraft && (
        <p className="message message--warn">
          Os quartos das crianças estão em rascunho: os avisos de quarto (crianças e equipe) estão pausados.{" "}
          <a
            href="#/trials"
            onClick={(e) => {
              e.preventDefault();
              navigate("/trials");
            }}
          >
            Ajustar em Testes
          </a>
        </p>
      )}
      {error && <p className="message message--error">{error}</p>}

      {settings &&
        GROUPS.map((g) => (
          <section key={g.id} className="notif-group" aria-labelledby={`notif-${g.id}`}>
            <header className="notif-group__head">
              <span className="notif-group__mark" aria-hidden="true">
                {g.icon ? <img src={g.icon} alt="" className="notif-group__icon" /> : g.emoji}
              </span>
              <div>
                <h2 id={`notif-${g.id}`} className="notif-group__title">
                  {g.title}
                </h2>
                <p className="notif-group__hint">{g.hint}</p>
              </div>
            </header>
            <ul className="notif-list">
              {g.options.map((o) => {
                const on = settings.notifications[o.key];
                return (
                  <li key={o.key} className={`notif-item ${on ? "notif-item--on" : ""}`}>
                    <span className={`notif-item__emoji ${o.pairIcon ? "notif-item__emoji--pair" : ""}`} aria-hidden="true">
                      {o.pairIcon ? (
                        <>
                          <span>{o.emoji}</span>
                          <i className="notif-item__plus">+</i>
                          <img src={o.pairIcon} alt="" className="notif-item__icon" />
                        </>
                      ) : o.icon ? (
                        <img src={o.icon} alt="" className="notif-item__icon" />
                      ) : (
                        o.emoji
                      )}
                    </span>
                    <div className="notif-item__body">
                      <h3 className="notif-item__title">{o.title}</h3>
                      <p className="notif-item__text">{o.text}</p>
                    </div>
                    <Toggle checked={on} disabled={busy !== null} label={on ? "Ligado" : "Desligado"} onChange={(v) => toggle(o.key, v, o.welcome)} />
                  </li>
                );
              })}
            </ul>
            {g.reminder && <CheckinReminderCard token={token} />}
          </section>
        ))}

      <PageFooter>
        Só recebe SMS quem tem celular cadastrado e está ativo. Os pais só recebem o que está em “Para os pais” (e as fotos publicadas) — nunca avisos de quarto, função ou cadastro da equipe.
      </PageFooter>
    </div>
  );
}
