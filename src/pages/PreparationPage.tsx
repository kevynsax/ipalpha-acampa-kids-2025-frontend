import { useState, type ReactNode } from "react";
import { formatEventDate } from "../api/schedule";
import { setMyPrepDone } from "../api/staff";
import RichHtml from "../components/RichHtml";
import SelfCheckinCard from "../components/SelfCheckinCard";
import { useCampTiming } from "../campPhase";
import type { LoggedUser } from "../roles";
import { useCollection, useCollectionOrEmpty } from "../store";
import { useMyPrepRoles } from "../store/derive";

interface PreparationPageProps {
  user: LoggedUser;
  token: string;
}

/** "Faltam 12 dias" / "É amanhã!" / "É hoje!" / "Acampamento em andamento" */
function countdownLabel(daysToGo: number | null): { emoji: string; text: string } | null {
  if (daysToGo === null) return null;
  if (daysToGo > 1) return { emoji: "⏳", text: `Faltam ${daysToGo} dias` };
  if (daysToGo === 1) return { emoji: "🎒", text: "É amanhã!" };
  if (daysToGo === 0) return { emoji: "🚌", text: "É hoje!" };
  return { emoji: "🏕️", text: "Acampamento em andamento" };
}

/** one card of the checklist (a role's preparation or a general section) */
interface PrepItem {
  /** "role:<id>" | "section:<id>" — what is stored in staff.prepDone */
  key: string;
  emoji: string;
  title: ReactNode;
  html: string;
  /** roles get a highlighted border */
  role?: boolean;
}

/**
 * Preparação — what the team must know / bring / wear BEFORE the camp:
 *   1. countdown to the first event
 *   2. the preparation of each role the person is scaled in (from the roles)
 *   3. the general sections written by the admin ("O que levar", "Chegada"…)
 * Each card is a checklist item: "Feito ✓" ticks it, it turns grey and sinks
 * to the end of its list. The ticks are saved on the person's staff record
 * (so they follow them to any phone). The admin edits the content in
 * ⚙️ → Preparação and the per-role text in the role itself.
 */
export default function PreparationPage({ user, token }: PreparationPageProps) {
  const sections = useCollection("preparation");
  const myRoles = useMyPrepRoles(user.phone);
  const staff = useCollectionOrEmpty("staff");
  const timing = useCampTiming();
  /** rooms still a draft: this page is the team's home, so the departure-day self check-in lives here */
  const roomsDraft = !!useCollection("settings")?.kidsRoomsDraft;
  const first = user.name.split(" ")[0];
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (sections === null || myRoles === null) {
    return (
      <div className="admin-page">
        <p className="opt-empty">Sincronizando com o servidor… 🏕️</p>
      </div>
    );
  }

  const me = staff.find((s) => s.phone === user.phone);
  const done = new Set(me?.prepDone ?? []);
  const canTick = !!me;

  const countdown = countdownLabel(timing.daysToGo);

  /** only the roles that actually ask for something — the rest would just be noise here */
  const roleItems: PrepItem[] = myRoles
    .filter((m) => m.role.preparation)
    .map((m) => ({
      key: `role:${m.role.id}`,
      emoji: m.role.emoji,
      title: (
        <>
          {m.role.name}
          {m.details.map((d) => (
            <span key={d} className="staff-tag__n">{d}</span>
          ))}
        </>
      ),
      html: m.role.preparation,
      role: true,
    }));
  const generalItems: PrepItem[] = sections.map((s) => ({ key: `section:${s.id}`, emoji: s.emoji, title: s.title, html: s.content }));

  /**
   * ONE list: the person's role items first, then the general ones (each in
   * the admin's order); whatever is ticked sinks to the very end, so when all
   * the role items are done the general ones take the top.
   */
  const all = [...roleItems, ...generalItems];
  const items = [...all.filter((i) => !done.has(i.key)), ...all.filter((i) => done.has(i.key))];

  const total = all.length;
  const doneCount = all.filter((i) => done.has(i.key)).length;
  const allDone = total > 0 && doneCount === total;

  async function toggle(item: PrepItem) {
    if (busyKey) return;
    setBusyKey(item.key);
    setError(null);
    try {
      await setMyPrepDone(token, item.key, !done.has(item.key));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Algo deu errado.");
    } finally {
      setBusyKey(null);
    }
  }

  const renderList = (items: PrepItem[]) => (
    <div className="prep-sections">
      {items.map((item) => {
        const isDone = done.has(item.key);
        return (
          <article key={item.key} className={`detail-card prep-section ${item.role ? "prep-section--role" : ""} ${isDone ? "prep-section--done" : ""}`}>
            <header className="prep-section__head">
              <h3 className="prep-section__title">
                <span aria-hidden="true">{item.emoji}</span> {item.title}
                {item.role && <span className="prep-section__tag">sua função</span>}
              </h3>
              {canTick && (
                <button
                  type="button"
                  className={`prep-check ${isDone ? "prep-check--on" : ""}`}
                  aria-pressed={isDone}
                  disabled={busyKey === item.key}
                  title={isDone ? "Desmarcar" : "Marcar como feito"}
                  aria-label={isDone ? "Desmarcar" : "Marcar como feito"}
                  onClick={() => toggle(item)}
                >
                  <span className="prep-check__box" aria-hidden="true">{isDone ? "✓" : ""}</span>
                </button>
              )}
            </header>
            {item.html ? <RichHtml html={item.html} /> : <p className="opt-empty">Em breve.</p>}
          </article>
        );
      })}
    </div>
  );

  return (
    <div className="admin-page prep-page">
      <header className="admin-head">
        <h1 className="admin-title">🎒 Preparação</h1>
      </header>

      {roomsDraft && <SelfCheckinCard token={token} user={user} />}

      {countdown && (
        <div className="prep-countdown" role="status">
          <span className="prep-countdown__emoji" aria-hidden="true">{countdown.emoji}</span>
          <div className="prep-countdown__text">
            <strong>{countdown.text}</strong>
            {timing.firstDate && <span>Começa {formatEventDate(timing.firstDate, { weekday: "long", day: "numeric", month: "long" }).toLowerCase()}</span>}
          </div>
          {canTick && total > 0 && (
            <div className="prep-progress" aria-label={`${doneCount} de ${total} itens feitos`}>
              <strong>{doneCount}/{total}</strong>
              <span>{allDone ? "tudo pronto! 🎉" : "feitos"}</span>
            </div>
          )}
        </div>
      )}

      <p className="admin-intro">
        Olá, {first}! Aqui está tudo o que você precisa saber, levar e vestir antes do acampamento.
        {canTick && total > 0 && " Conforme for resolvendo cada item, marque como feito."} 😊
      </p>

      {error && <p className="message message--error">{error}</p>}

      {/* ── one checklist: role items (only roles that ask for something) first, then the general ones; done sinks to the end ── */}
      {total > 0 && renderList(items)}

      {total === 0 && (
        <div className="admin-empty">
          <span className="admin-empty__emoji">🎒</span>
          <p>Nada para preparar por enquanto. Assim que a organização publicar as orientações, elas aparecem aqui.</p>
        </div>
      )}
    </div>
  );
}
