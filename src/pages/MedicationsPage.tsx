import { useMemo, useState } from "react";
import MedicationChecklist from "../components/MedicationChecklist";
import PageFooter from "../components/PageFooter";
import { ICONS } from "../icons";
import { speakDay, todayIso } from "../dates";
import { useCollection } from "../store";

interface MedicationsPageProps {
  token: string;
}

/**
 * Medicações — the medical team's daily checklist of the CONTINUOUS medication
 * the kids take. The prescription itself comes from each kid's record (the
 * parents / the admin fill it in); this page only answers "already given?".
 *
 * The checklist itself is <MedicationChecklist>, shared with the team's Início
 * so ticking a dose works and looks the same in both places. What belongs ONLY
 * here is the day picker: the other days of the camp (and yesterday) are
 * checked from this tab, while Início always shows today.
 */
export default function MedicationsPage({ token }: MedicationsPageProps) {
  const events = useCollection("events");
  const [day, setDay] = useState(todayIso);

  /** the camp's days (from the programme) plus today, so the team can look back at yesterday */
  const days = useMemo(() => {
    const set = new Set<string>((events ?? []).map((e) => e.date));
    set.add(todayIso());
    return [...set].sort();
  }, [events]);

  return (
    <div className="admin-page admin-page--wide">
      <header className="admin-head">
        <h1 className="admin-title detail-title">
          <img className="audience-icon" src={ICONS.medications} alt="" aria-hidden="true" />
          Medicações
        </h1>
      </header>
      <p className="admin-intro">
        A medicação de uso contínuo de cada criança, hora a hora. Toque para marcar que foi dada — todo mundo da equipe vê na hora, então ninguém repete a dose.
      </p>

      {/* ── the day (this tab only: Início is always today) ── */}
      <div className="cat-tabs" role="tablist" aria-label="Dia">
        {days.map((d) => (
          <button
            key={d}
            type="button"
            role="tab"
            aria-selected={d === day}
            className={`cat-tab ${d === day ? "cat-tab--active" : ""} ${d === todayIso() ? "cat-tab--now" : ""} ${d < todayIso() ? "cat-tab--past" : ""}`}
            onClick={() => setDay(d)}
          >
            {d === todayIso() ? "Hoje" : speakDay(d, "short")}
          </button>
        ))}
      </div>

      <MedicationChecklist token={token} day={day} />

      <PageFooter>🔒 Só a equipe médica e a organização veem esta página.</PageFooter>
    </div>
  );
}
