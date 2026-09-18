import { useEffect, useState } from "react";
import type { Team } from "../api/teams";
import { useI18n } from "../i18n";
import Dialog from "./Dialog";
import { teamTagStyle } from "./TeamTag";

interface TeamFilterDialogProps {
  open: boolean;
  teams: Team[];
  /** selected team ids — empty = every team */
  value: Set<string>;
  /** how many people are in each team (shown on the chips) */
  counts?: Map<string, number>;
  onChange: (next: Set<string>) => void;
  onClose: () => void;
}

/** "Times" chip → pick every team or any mix of them; the choice applies on "Filtrar". */
export default function TeamFilterDialog({ open, teams, value, counts, onChange, onClose }: TeamFilterDialogProps) {
  const { tx } = useI18n();
  const [draft, setDraft] = useState<Set<string>>(value);
  useEffect(() => {
    if (open) setDraft(new Set(value));
  }, [open, value]);

  const all = draft.size === 0;
  const toggle = (id: string) => {
    const next = new Set(draft);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    // ticking every team = no filter
    setDraft(next.size === teams.length ? new Set() : next);
  };

  return (
    <Dialog open={open} onClose={onClose} title={tx("Filtrar por time")} width={480}>
      <div className="cat-form cat-form--plain">
        <h2 className="cat-form__title">🚩 {tx("Filtrar por time")}</h2>
        <p className="admin-intro">{tx("Escolha um ou mais times. Nenhum marcado = todos.")}</p>
        <div className="team-filter__list" role="group" aria-label={tx("Times")}>
          <button type="button" className={`chip-toggle chip-toggle--small ${all ? "chip-toggle--on" : ""}`} aria-pressed={all} onClick={() => setDraft(new Set())}>
            {tx("Todos os times")}
          </button>
          {teams.map((t) => {
            const on = draft.has(t.id);
            const n = counts?.get(t.id);
            return (
              <button
                key={t.id}
                type="button"
                className={`chip-toggle chip-toggle--small team-filter__chip ${on ? "chip-toggle--on" : ""}`}
                aria-pressed={on}
                style={on ? { ...teamTagStyle(t), borderColor: t.color } : { borderColor: t.color }}
                onClick={() => toggle(t.id)}
              >
                {!on && <span className="score-swatch" style={{ background: t.color }} aria-hidden="true" />}
                {t.name}
                {n !== undefined && <span className="cat-tab__count">{n}</span>}
              </button>
            );
          })}
        </div>
        <div className="cat-form__actions">
          <button type="button" className="button button--secondary" onClick={onClose}>
            {tx("Cancelar")}
          </button>
          <button
            type="button"
            className="button button--primary"
            onClick={() => {
              onChange(draft);
              onClose();
            }}
          >
            {tx("Filtrar")}
          </button>
        </div>
      </div>
    </Dialog>
  );
}
