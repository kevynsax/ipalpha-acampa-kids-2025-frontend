import { useMemo, useState } from "react";
import { CheckGlyph, UndoGlyph } from "../components/Glyph";
import { giveMedication, SOS_SLOT, undoMedication, type MedicationDose } from "../api/medications";
import PageFooter from "../components/PageFooter";
import { ICONS } from "../icons";
import { minutesOf, nowTime, slotEmoji, slotLabel, useMedicationDay, type MedEntry } from "../hooks/useMedicationDay";
import { useDoseGrace } from "../hooks/useDoseGrace";
import { speakDay, speakStamp, todayIso } from "../dates";
import { useCollection } from "../store";

interface MedicationsPageProps {
  token: string;
}

/**
 * Medicações — the medical team's daily checklist of the CONTINUOUS medication
 * the kids take. The prescription itself comes from each kid's record (the
 * parents / the admin fill it in); this page only answers "already given?".
 *
 * The day is split into the camp's moments (Café, Almoço, Lanche, Jantar,
 * Dormir + any custom time the parents wrote), each listing the kids who take
 * something then. One tap ticks the dose — it is saved with who ticked it and
 * when, and every device sees it at once, so two people never give the same
 * pill twice. A tap on a ticked row undoes it.
 *
 * "Quando necessário" medicines have no fixed time: they sit in their own
 * block and each dose is registered on its own (they may repeat in a day).
 * A medicine whose schedule the parents never informed is flagged in red —
 * the team has to confirm it with them.
 *
 * The grouping itself lives in hooks/useMedicationDay, shared with the
 * summary card on the team's Início so the two always agree.
 */
export default function MedicationsPage({ token }: MedicationsPageProps) {
  const events = useCollection("events");
  const [day, setDay] = useState(todayIso);
  const [search, setSearch] = useState("");
  const [pending, setPending] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  /** hide what is already done, so only what is still missing stays on screen */
  const [onlyMissing, setOnlyMissing] = useState(false);
  /** a row just ticked: stays put for a few seconds (undoable), then fades out of "Só o que falta" */
  const { grace, leaving, start, forget } = useDoseGrace();

  /** the camp's days (from the programme) plus today, so the team can look back at yesterday */
  const days = useMemo(() => {
    const set = new Set<string>((events ?? []).map((e) => e.date));
    set.add(todayIso());
    return [...set].sort();
  }, [events]);

  /** every prescribed line of the day + the ticks already made (shared with the Início card) */
  const { slots, sos, unscheduled, kidsWithMeds, given: givenToday, sosGiven: sosToday, doneCount, total, loading } = useMedicationDay(day, search);

  async function run(key: string, action: () => Promise<unknown>) {
    if (pending.has(key)) return;
    setPending((p) => new Set(p).add(key));
    setError(null);
    try {
      await action();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível salvar a marcação.");
    } finally {
      setPending((p) => {
        const n = new Set(p);
        n.delete(key);
        return n;
      });
    }
  }

  /** tick ↔ untick. Ticking animates and holds the row; untick clears that state at once. */
  async function toggle(e: MedEntry) {
    const key = `${e.kid.id}|${e.medKey}|${e.slot}`;
    const given = givenToday.get(key);
    if (given) {
      forget(key);
      await run(key, () => undoMedication(token, given.id));
      return;
    }
    await run(key, () => giveMedication(token, { camperId: e.kid.id, medName: e.med.name, day, slot: e.slot }));
    start(key);
  }

  if (loading) {
    return (
      <div className="admin-page">
        <p className="opt-empty">Sincronizando medicações… 🏕️</p>
      </div>
    );
  }

  const isToday = day === todayIso();
  const now = nowTime();
  /** the moment happening now: the last one already reached today */
  const currentSlot = isToday ? slots.filter((s) => minutesOf(s.slot) <= minutesOf(now)).slice(-1)[0]?.slot ?? null : null;
  const allDone = total > 0 && doneCount === total;

  return (
    <div className="admin-page admin-page--wide">
      <header className="admin-head">
        <h1 className="admin-title detail-title">
          <img className="audience-icon" src={ICONS.medications} alt="" aria-hidden="true" />
          Medicações
        </h1>
        {total > 0 && (
          <span className={`meds-progress ${allDone ? "meds-progress--done" : ""}`}>
            {doneCount}/{total} {allDone ? "tudo dado ✅" : "dadas"}
          </span>
        )}
      </header>
      <p className="admin-intro">
        A medicação de uso contínuo de cada criança, hora a hora. Toque para marcar que foi dada — todo mundo da equipe vê na hora, então ninguém repete a dose.
      </p>

      {/* ── the day ── */}
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

      {kidsWithMeds === 0 ? (
        <div className="admin-empty">
          <img className="admin-empty__icon" src={ICONS.medications} alt="" aria-hidden="true" />
          <p>Nenhuma criança com medicação cadastrada.</p>
        </div>
      ) : (
        <>
          <div className="meds-toolbar">
            <input className="cat-input" type="search" value={search} placeholder="Procurar criança…" aria-label="Procurar criança" onChange={(e) => setSearch(e.target.value)} />
            <button type="button" className={`cat-tab ${onlyMissing ? "cat-tab--active" : ""}`} aria-pressed={onlyMissing} onClick={() => setOnlyMissing((v) => !v)}>
              ⏳ Só o que falta
            </button>
          </div>

          {error && <p className="message message--error">{error}</p>}

          {/* ── medicines the parents never scheduled ── */}
          {unscheduled.length > 0 && (
            <section className="detail-section">
              <h2 className="detail-h2">⚠️ Horário a confirmar <span className="cat-tab__count">{unscheduled.length}</span></h2>
              <p className="cat-hint">Sem horário nem "quando necessário": confirme com os pais antes de dar.</p>
              <ul className="meds-rows">
                {unscheduled.map((e) => (
                  <li key={`${e.kid.id}|${e.medKey}`} className="bus-row meds-row meds-row--warn">
                    <span className="bus-row__check meds-row__check meds-row__check--warn" aria-hidden="true">?</span>
                    <MedBody entry={e} />
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* ── the moments of the day ── */}
          {slots.map(({ slot, rows }) => {
            // "Só o que falta": a row ticked seconds ago stays until its fade is over, so the tick is seen
            const visible = onlyMissing
              ? rows.filter((e) => !givenToday.has(`${e.kid.id}|${e.medKey}|${e.slot}`) || grace.has(`${e.kid.id}|${e.medKey}|${e.slot}`))
              : rows;
            if (visible.length === 0) return null;
            const done = rows.filter((e) => givenToday.has(`${e.kid.id}|${e.medKey}|${e.slot}`)).length;
            return (
              <section key={slot} className={`detail-section meds-slot ${slot === currentSlot ? "meds-slot--now" : ""}`}>
                <h2 className="detail-h2">
                  {slotLabel(slot)}
                  <span className="cat-tab__count">
                    {done}/{rows.length}
                  </span>
                  {slot === currentSlot && <span className="meds-slot__now">agora</span>}
                </h2>
                <ul className="meds-rows">
                  {visible.map((e) => {
                    const key = `${e.kid.id}|${e.medKey}|${e.slot}`;
                    const given = givenToday.get(key);
                    const justTicked = grace.has(key);
                    return (
                      <li key={key} className={`meds-item ${leaving.has(key) ? "meds-item--leaving" : ""}`}>
                        <button
                          type="button"
                          className={`bus-row meds-row ${given ? "bus-row--on" : ""} ${justTicked ? "meds-row--ticked" : ""}`}
                          aria-pressed={!!given}
                          disabled={pending.has(key)}
                          title={given ? `Dado por ${given.by.name} · ${speakStamp(given.givenAt)} — toque para desfazer` : "Marcar como dado"}
                          onClick={() => void toggle(e)}
                        >
                          <span className={`bus-row__check meds-row__check ${given ? "bus-row__check--on" : ""}`} aria-hidden="true">
                            {given ? <CheckGlyph size="1.2em" /> : slotEmoji(slot)}
                          </span>
                          <MedBody entry={e} given={given} />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}

          {/* ── "quando necessário": each dose is registered on its own ── */}
          {sos.length > 0 && (
            <section className="detail-section">
              <h2 className="detail-h2">🆘 Quando necessário <span className="cat-tab__count">{sos.length}</span></h2>
              <p className="cat-hint">Sem horário fixo. Cada dose fica registrada com a hora e quem deu.</p>
              <ul className="meds-rows">
                {sos.map((e) => {
                  const key = `${e.kid.id}|${e.medKey}`;
                  const taken = sosToday.get(key) ?? [];
                  return (
                    <li key={key} className={`bus-row meds-row meds-row--sos ${taken.length ? "bus-row--on" : ""}`}>
                      <span className="bus-row__check meds-row__check" aria-hidden="true">
                        {taken.length ? taken.length : "🆘"}
                      </span>
                      <MedBody entry={e} sosDoses={taken} />
                      <span className="meds-row__actions">
                        {taken.length > 0 && (
                          <button
                            type="button"
                            className="icon-btn meds-row__undo"
                            title="Desfazer a última dose"
                            aria-label="Desfazer a última dose"
                            disabled={pending.has(key)}
                            onClick={() => void run(key, () => undoMedication(token, taken[taken.length - 1].id))}
                          >
                            <UndoGlyph />
                          </button>
                        )}
                        <button
                          type="button"
                          className="button button--secondary meds-row__give"
                          disabled={pending.has(key)}
                          onClick={() => void run(key, () => giveMedication(token, { camperId: e.kid.id, medName: e.med.name, day, slot: SOS_SLOT }))}
                        >
                          + Dose
                        </button>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          {total === 0 && sos.length === 0 && unscheduled.length === 0 && <p className="opt-empty">Nenhuma criança encontrada.</p>}
        </>
      )}

      <PageFooter>🔒 Só a equipe médica e a organização veem esta página.</PageFooter>
    </div>
  );
}

/** name + medicine + dose, plus who gave it and any warning about the kid */
function MedBody({ entry, given, sosDoses }: { entry: MedEntry; given?: MedicationDose; sosDoses?: MedicationDose[] }) {
  const { kid, med } = entry;
  const cannotTake = kid.drugAllergies.length > 0;
  return (
    <span className="bus-row__body">
      <span className="bus-row__name">
        {kid.name}
        {cannotTake && (
          <span className="meds-row__flag" title="A criança tem alergia a medicamentos — confira antes de dar">
            🚫💊
          </span>
        )}
      </span>
      <span className="bus-row__meta">
        💊 {[med.name, med.dose].filter(Boolean).join(" ")}
        {med.notes && <> · {med.notes}</>}
      </span>
      {given && (
        <span className="meds-row__given">
          ✅ {given.by.name.split(" ")[0]} · {speakStamp(given.givenAt)}
        </span>
      )}
      {sosDoses && sosDoses.length > 0 && (
        <span className="meds-row__given">
          ✅ {sosDoses.map((d) => `${speakStamp(d.givenAt)} (${d.by.name.split(" ")[0]})`).join(" · ")}
        </span>
      )}
    </span>
  );
}
