import { useEffect, useMemo, useState } from "react";
import { type CampEvent } from "../../api/schedule";
import { speakDay } from "../../dates";
import { useCollection } from "../../store";

/** "HH:mm" of now, local time */
function clock(): { date: string; time: string } {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return { date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`, time: `${pad(d.getHours())}:${pad(d.getMinutes())}` };
}

/**
 * "Programação" for a PARENT — read-only, the events from the check-in start
 * to the end of the camp (the server already cuts everything before the
 * check-in, and never sends roles or assignments).
 */
export default function ParentSchedulePage() {
  const storedEvents = useCollection("events");
  const [showPast, setShowPast] = useState(false);
  const [now, setNow] = useState(clock);
  useEffect(() => {
    const t = setInterval(() => setNow(clock()), 60_000);
    return () => clearInterval(t);
  }, []);

  const items = useMemo<CampEvent[] | null>(() => {
    if (!storedEvents) return null;
    return [...storedEvents].sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime) || a.title.localeCompare(b.title, "pt-BR"));
  }, [storedEvents]);

  if (!items) {
    return (
      <div className="admin-page">
        <p className="opt-empty">Sincronizando com o servidor… 🏕️</p>
      </div>
    );
  }

  const current = (() => {
    const today = items.filter((e) => e.date === now.date);
    for (let k = 0; k < today.length; k++) {
      const e = today[k];
      const end = e.endTime ?? today[k + 1]?.startTime ?? "23:59";
      if (e.startTime <= now.time && now.time < end) return e.id;
    }
    return null;
  })();
  const isPast = (e: CampEvent) => e.id !== current && (e.date < now.date || (e.date === now.date && (e.endTime ?? e.startTime) < now.time));
  const pastCount = items.filter(isPast).length;
  const collapsePast = pastCount > 0 && pastCount < items.length && !showPast;
  const shown = collapsePast ? items.filter((e) => !isPast(e)) : items;
  const days = [...new Set(shown.map((e) => e.date))];

  return (
    <div className="admin-page">
      <header className="admin-head">
        <h1 className="admin-title">📅 Programação</h1>
      </header>
      <p className="admin-intro">O que acontece no acampamento, do check-in até a volta.</p>

      {items.length === 0 && (
        <div className="admin-empty">
          <span className="admin-empty__emoji">📅</span>
          <p>A programação ainda não foi publicada.</p>
        </div>
      )}

      {pastCount > 0 && pastCount < items.length && (
        <button type="button" className={`past-toggle ${showPast ? "past-toggle--open" : ""}`} aria-expanded={showPast} onClick={() => setShowPast((v) => !v)}>
          <span className="past-toggle__icon" aria-hidden="true">{showPast ? "▾" : "▸"}</span>
          <span className="past-toggle__label">{showPast ? "Esconder o que já aconteceu" : `${pastCount} ${pastCount === 1 ? "item já aconteceu" : "itens já aconteceram"}`}</span>
          <span className="past-toggle__hint">{showPast ? "recolher" : "mostrar"}</span>
        </button>
      )}

      {days.map((d) => (
        <section key={d} className="day-group">
          <header className="room-group__head">
            <h2 className="room-group__title room-group__title--green">📆 {speakDay(d)}</h2>
            {d === now.date && <span className="room-group__stats">hoje</span>}
          </header>
          <ol className="timeline">
            {shown
              .filter((e) => e.date === d)
              .map((e) => {
                const isNow = e.id === current;
                return (
                  <li key={e.id} className={`timeline__item ${isNow ? "timeline__item--now" : ""} ${isPast(e) ? "timeline__item--past" : ""}`}>
                    <div className="timeline__time">
                      <span className="timeline__start">{e.startTime}</span>
                      {e.endTime && <span className="timeline__end">{e.endTime}</span>}
                    </div>
                    <div className={`event-card event-card--plain ${isNow ? "event-card--now" : ""}`}>
                      <h3 className="event-card__title">
                        {isNow && <span className="event-card__now">agora</span>}
                        <span aria-hidden="true">{e.emoji}</span> {e.title}
                      </h3>
                      {e.notes && <p className="staff-card__meta">{e.notes}</p>}
                    </div>
                  </li>
                );
              })}
          </ol>
        </section>
      ))}
    </div>
  );
}
