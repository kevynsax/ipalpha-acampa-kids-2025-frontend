import { useEffect, useState } from "react";
import { CheckGlyph, UndoGlyph } from "./Glyph";
import { giveMedication, undoMedication, type MedicationDose } from "../api/medications";
import { minutesOf, nowTime, slotEmoji, slotLabel, useMedicationDay, type MedEntry } from "../hooks/useMedicationDay";
import { useDoseGrace } from "../hooks/useDoseGrace";
import { ICONS } from "../icons";
import { todayIso } from "../dates";

interface MedicationsCardProps {
  token: string;
  /** opens the full Medicações tab */
  onOpen: () => void;
}

/** a moment is "due" from its clock time until this long after (then it counts as late) */
const DUE_WINDOW_MIN = 60;

/**
 * The medication summary on the medical team's Início: what is due RIGHT NOW
 * and what is already late, with the same one-tap tick as the full tab.
 *
 * Ticking saves the dose immediately (another phone must see it at once), then
 * the row turns green and waits a few seconds offering "Desfazer" before it
 * fades out and the list closes the gap — so the team sees the tick register
 * and still has a moment to take it back.
 *
 * It deliberately shows only the moments that need attention — a team member
 * opening the app mid-afternoon wants "who still has to take something", not
 * the whole day (that is the Medicações tab, one tap away). When everything
 * due so far is ticked, the card collapses to a single green line.
 */
export default function MedicationsCard({ token, onOpen }: MedicationsCardProps) {
  const day = todayIso();
  const { slots, given, unscheduled, kidsWithMeds, doneCount, total, loading } = useMedicationDay(day);
  const [pending, setPending] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const { grace, leaving, start, forget } = useDoseGrace();
  // re-render every minute so a moment becomes due / late on its own
  const [, tick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => tick((n) => n + 1), 60_000);
    return () => clearInterval(t);
  }, []);

  if (loading || kidsWithMeds === 0) return null;

  const now = minutesOf(nowTime());
  const keyOf = (e: MedEntry) => `${e.kid.id}|${e.medKey}|${e.slot}`;
  /**
   * Moments already reached today that still need someone. A row ticked
   * seconds ago stays in the list (greyed, undoable) until its fade is over,
   * so the tick is visible instead of the row vanishing under the finger.
   */
  const openSlots = slots
    .map(({ slot, rows }) => ({ slot, rows: rows.filter((e) => !given.has(keyOf(e)) || grace.has(keyOf(e))) }))
    .filter(({ slot, rows }) => rows.length > 0 && minutesOf(slot) <= now);
  const late = openSlots.filter(({ slot }) => now - minutesOf(slot) > DUE_WINDOW_MIN);
  const dueNow = openSlots.filter(({ slot }) => now - minutesOf(slot) <= DUE_WINDOW_MIN);
  /** the next moment still ahead today — shown when nothing is pending, so the team knows what is coming */
  const next = slots.find(({ slot }) => minutesOf(slot) > now);

  async function run(key: string, action: () => Promise<unknown>) {
    if (pending.has(key)) return;
    setPending((p) => new Set(p).add(key));
    setError(null);
    try {
      await action();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível marcar.");
      return false;
    } finally {
      setPending((p) => {
        const n = new Set(p);
        n.delete(key);
        return n;
      });
    }
  }

  /** tick: save at once, then hold the row for the undo window */
  async function give(e: MedEntry) {
    const key = keyOf(e);
    if (grace.has(key)) return;
    const ok = await run(key, () => giveMedication(token, { camperId: e.kid.id, medName: e.med.name, day, slot: e.slot }));
    if (ok) start(key);
  }

  /** "Desfazer": a real delete — the dose was already saved when it was ticked */
  async function undo(e: MedEntry, dose: MedicationDose) {
    const key = keyOf(e);
    forget(key);
    await run(key, () => undoMedication(token, dose.id));
  }

  const nothingPending = openSlots.length === 0;

  return (
    <section className="detail-card meds-card" aria-label="Medicações de hoje">
      <div className="meds-card__head">
        <img className="meds-card__icon" src={ICONS.medications} alt="" aria-hidden="true" />
        <div className="meds-card__title">
          <h2 className="detail-h2 meds-card__h2">Medicações de hoje</h2>
          <span className="meds-card__count">
            {total > 0 ? `${doneCount}/${total} dadas` : "nenhuma com horário fixo"}
            {unscheduled.length > 0 && <> · ⚠️ {unscheduled.length} sem horário</>}
          </span>
        </div>
        <button type="button" className="button button--secondary meds-card__open" onClick={onOpen}>
          Ver tudo
        </button>
      </div>

      {error && <p className="message message--error">{error}</p>}

      {nothingPending ? (
        <p className="meds-card__clear">
          ✅ Tudo em dia por aqui.
          {next && <> Próxima: <strong>{slotLabel(next.slot)}</strong>.</>}
        </p>
      ) : (
        [...late, ...dueNow].map(({ slot, rows }) => {
          const isLate = now - minutesOf(slot) > DUE_WINDOW_MIN;
          return (
            <div key={slot} className="meds-card__slot">
              <h3 className="meds-card__slot-title">
                {slotLabel(slot)}
                {isLate ? <span className="meds-card__flag meds-card__flag--late">atrasado</span> : <span className="meds-card__flag">agora</span>}
                <span className="cat-tab__count">{rows.filter((e) => !given.has(keyOf(e))).length}</span>
              </h3>
              <ul className="meds-rows">
                {rows.map((e) => {
                  const key = keyOf(e);
                  const dose = given.get(key);
                  const ticked = grace.has(key);
                  return (
                    <li key={key} className={`meds-item ${leaving.has(key) ? "meds-item--leaving" : ""}`}>
                      <div className={`bus-row meds-row meds-row--tick ${ticked ? "bus-row--on meds-row--ticked" : ""}`}>
                        <button
                          type="button"
                          className="meds-row__hit"
                          disabled={pending.has(key) || ticked}
                          title={ticked ? "Dado agora" : `Marcar ${e.med.name} de ${e.kid.name.split(" ")[0]} como dado`}
                          onClick={() => void give(e)}
                        >
                          <span className={`bus-row__check meds-row__check ${ticked ? "bus-row__check--on" : ""}`} aria-hidden="true">
                            {ticked ? <CheckGlyph size="1.2em" /> : slotEmoji(slot)}
                          </span>
                          <span className="bus-row__body">
                            <span className="bus-row__name">
                              {e.kid.name}
                              {e.kid.drugAllergies.length > 0 && (
                                <span className="meds-row__flag" title="A criança tem alergia a medicamentos — confira antes de dar">
                                  🚫💊
                                </span>
                              )}
                            </span>
                            <span className="bus-row__meta">
                              💊 {[e.med.name, e.med.dose].filter(Boolean).join(" ")}
                              {e.med.notes && <> · {e.med.notes}</>}
                            </span>
                            {ticked && <span className="meds-row__given">✅ Dado agora</span>}
                          </span>
                        </button>
                        {ticked && dose ? (
                          <button
                            type="button"
                            className="button button--secondary meds-row__undo-btn"
                            disabled={pending.has(key)}
                            onClick={() => void undo(e, dose)}
                          >
                            <UndoGlyph /> Desfazer
                          </button>
                        ) : (
                          <span className="meds-card__tick" aria-hidden="true">
                            <CheckGlyph size="1.1em" />
                          </span>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })
      )}
    </section>
  );
}
