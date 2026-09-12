import { formatEventDate } from "../../api/schedule";
import RichHtml from "../../components/RichHtml";
import { useCampTiming } from "../../campPhase";
import type { LoggedUser } from "../../roles";
import { useCollection } from "../../store";

interface ParentPreparationPageProps {
  user: LoggedUser;
}

/** "Faltam 12 dias" / "É amanhã!" / "É hoje!" / "Acampamento em andamento" */
function countdownLabel(daysToGo: number | null): { emoji: string; text: string } | null {
  if (daysToGo === null) return null;
  if (daysToGo > 1) return { emoji: "⏳", text: `Faltam ${daysToGo} dias` };
  if (daysToGo === 1) return { emoji: "🎒", text: "É amanhã!" };
  if (daysToGo === 0) return { emoji: "🚌", text: "É hoje!" };
  return { emoji: "🏕️", text: "Acampamento em andamento" };
}

/**
 * "Preparação" for a PARENT — read-only: the general sections the admin
 * posted to the parents ("O que levar na mala", "Chegada na igreja"…). The
 * server only sends the sections posted to `parent`, so no filtering here.
 */
export default function ParentPreparationPage({ user }: ParentPreparationPageProps) {
  const sections = useCollection("preparation");
  const timing = useCampTiming();
  const first = user.name.split(" ")[0];

  if (sections === null) {
    return (
      <div className="admin-page">
        <p className="opt-empty">Sincronizando com o servidor… 🏕️</p>
      </div>
    );
  }

  const countdown = countdownLabel(timing.daysToGo);

  return (
    <div className="admin-page prep-page">
      <header className="admin-head">
        <h1 className="admin-title">🎒 Preparação</h1>
      </header>

      {countdown && (
        <div className="prep-countdown" role="status">
          <span className="prep-countdown__emoji" aria-hidden="true">{countdown.emoji}</span>
          <div className="prep-countdown__text">
            <strong>{countdown.text}</strong>
            {timing.firstDate && <span>Começa {formatEventDate(timing.firstDate, { weekday: "long", day: "numeric", month: "long" }).toLowerCase()}</span>}
          </div>
        </div>
      )}

      <p className="admin-intro">Olá, {first}! Aqui está tudo o que sua família precisa saber e preparar antes do acampamento. 😊</p>

      {sections.length > 0 && (
        <div className="prep-sections">
          {sections.map((s) => (
            <article key={s.id} className="detail-card prep-section">
              <header className="prep-section__head">
                <h3 className="prep-section__title">
                  <span aria-hidden="true">{s.emoji}</span> {s.title}
                </h3>
              </header>
              {s.content ? <RichHtml html={s.content} /> : <p className="opt-empty">Em breve.</p>}
            </article>
          ))}
        </div>
      )}

      {sections.length === 0 && (
        <div className="admin-empty">
          <span className="admin-empty__emoji">🎒</span>
          <p>Nada para preparar por enquanto. Assim que a organização publicar as orientações, elas aparecem aqui.</p>
        </div>
      )}
    </div>
  );
}
