import type { ReactNode } from "react";
import Breadcrumbs from "../components/Breadcrumbs";
import RichHtml from "../components/RichHtml";
import type { LoggedUser } from "../roles";
import { useRoute } from "../router";
import { useCollection } from "../store";
import { useMyPrepRoles } from "../store/derive";

interface InstructionsPageProps {
  user: LoggedUser;
}

/** one row of the list — a role's instructions or a general document */
interface Doc {
  /** route segment(s) after /instructions */
  path: string;
  emoji: string;
  title: string;
  /** extra bits next to the title (assignment details of a role) */
  extra?: ReactNode;
  html: string;
  role?: boolean;
}

/**
 * Instruções — everything a team member must know, read-only:
 *   1. the instructions of every função the person is linked to (explicit
 *      assignment in an event, or a "for everyone" default) — written by
 *      the admin in the role itself;
 *   2. the general documents of the camp (⚙️ → Instruções).
 * A list of titles; tapping one opens the whole document. Works offline.
 *
 *   /instructions                 list
 *   /instructions/:id             one general document
 *   /instructions/role/:roleId    the instructions of one of my roles
 */
export default function InstructionsPage({ user }: InstructionsPageProps) {
  const docs = useCollection("instructions");
  const myRoles = useMyPrepRoles(user.phone);
  const { segments, navigate } = useRoute();

  if (!docs || myRoles === null) {
    return (
      <div className="admin-page">
        <p className="opt-empty">Sincronizando com o servidor… 🏕️</p>
      </div>
    );
  }

  /** only the roles that actually have instructions — the others would just be noise here */
  const roleDocs: Doc[] = myRoles
    .filter((m) => m.role.instructions)
    .map((m) => ({
      path: `role/${m.role.id}`,
      emoji: m.role.emoji,
      title: m.role.name,
      extra: m.details.map((d) => (
        <span key={d} className="staff-tag__n">{d}</span>
      )),
      html: m.role.instructions,
      role: true,
    }));
  const generalDocs: Doc[] = docs.map((d) => ({ path: d.id, emoji: d.emoji, title: d.title, html: d.content }));

  // ── one document ────────────────────────────────────────────────────────
  const path = segments.slice(1).join("/");
  if (path) {
    const d = [...roleDocs, ...generalDocs].find((x) => x.path === path);
    return (
      <div className="admin-page">
        <Breadcrumbs items={[{ label: "Instruções", onClick: () => navigate("/instructions") }, { label: d?.title ?? "Documento" }]} />
        {!d ? (
          <p className="opt-empty">Documento não encontrado.</p>
        ) : (
          <article className="detail-card instruction-doc">
            <h1 className="admin-title instruction-doc__title">
              <span aria-hidden="true">{d.emoji}</span> {d.title}
              {d.extra}
              {d.role && <span className="prep-section__tag">sua função</span>}
            </h1>
            {d.html ? <RichHtml html={d.html} /> : <p className="opt-empty">Este documento ainda está vazio.</p>}
          </article>
        )}
      </div>
    );
  }

  // ── list ────────────────────────────────────────────────────────────────
  const open = (d: Doc) => navigate(`/instructions/${d.path}`);
  const renderList = (items: Doc[]) => (
    <ul className="staff-list">
      {items.map((d) => (
        <li key={d.path} className="staff-card staff-card--clickable instruction-row">
          <div
            className="staff-card__body"
            role="button"
            tabIndex={0}
            onClick={() => open(d)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                open(d);
              }
            }}
          >
            <h3 className="staff-card__name">
              <span aria-hidden="true">{d.emoji}</span> {d.title}
              {d.extra}
            </h3>
          </div>
          <span className="instruction-row__chevron" aria-hidden="true">›</span>
        </li>
      ))}
    </ul>
  );

  const empty = roleDocs.length === 0 && generalDocs.length === 0;

  return (
    <div className="admin-page">
      <header className="admin-head">
        <h1 className="admin-title">📖 Instruções</h1>
      </header>

      {empty ? (
        <p className="opt-empty">A organização ainda não publicou instruções. 📖</p>
      ) : (
        <>
          {roleDocs.length > 0 && (
            <section className="day-group">
              <header className="room-group__head">
                <h2 className="room-group__title room-group__title--green">🙋 Suas funções</h2>
                <span className="room-group__stats">{roleDocs.length}</span>
              </header>
              {renderList(roleDocs)}
            </section>
          )}
          {generalDocs.length > 0 && (
            <section className="day-group">
              {roleDocs.length > 0 && (
                <header className="room-group__head">
                  <h2 className="room-group__title room-group__title--green">🏕️ Geral</h2>
                  <span className="room-group__stats">{generalDocs.length}</span>
                </header>
              )}
              {renderList(generalDocs)}
            </section>
          )}
        </>
      )}
    </div>
  );
}
