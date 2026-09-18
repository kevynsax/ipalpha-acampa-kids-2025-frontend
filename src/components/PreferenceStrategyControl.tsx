import { useState, type FormEvent } from "react";
import Dialog from "./Dialog";
import { useI18n } from "../i18n";
import { Radio, RadioGroup } from "./Radio";
import { DEFAULT_BLOB_LIMIT, type GroupingOptions, type PreferenceStrategy } from "../roomGroups";

/** which board the choice belongs to — each keeps its own */
export type PreferenceBoard = "rooms" | "teams";
const storageKey = (board: PreferenceBoard) => `acampa.preference-grouping.${board}.v1`;

/** The admin's grouping choice for one board, remembered on this device. */
export function usePreferenceStrategy(board: PreferenceBoard): [GroupingOptions, (next: GroupingOptions) => void] {
  const STORAGE_KEY = storageKey(board);
  const [options, setOptions] = useState<GroupingOptions>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw) as GroupingOptions;
      const strategy: PreferenceStrategy | undefined = parsed.strategy === "strict" || parsed.strategy === "loose" ? parsed.strategy : "smart";
      const limit = typeof parsed.limit === "number" && parsed.limit >= 2 ? Math.floor(parsed.limit) : null;
      return { strategy, limit };
    } catch {
      return {};
    }
  });
  const set = (next: GroupingOptions) => {
    setOptions(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* private mode: the choice just doesn't survive a reload */
    }
  };
  return [options, set];
}

const OPTIONS: { key: PreferenceStrategy; label: string; title: string }[] = [
  { key: "smart", label: "Inteligente", title: "Liga todo nome encontrado; um grupo maior que as camas de criança de um quarto é refeito só com nomes completos ou pedidos mútuos" },
  { key: "strict", label: "Rigoroso", title: "Só nomes completos ou pedidos mútuos ligam" },
  { key: "loose", label: "Livre", title: "Todo nome encontrado liga, sem limite de tamanho" },
];

/**
 * Footer of the "sem quarto / sem time" pool: a three-way toggle for how
 * preference names glue kids, plus (on Smart) the size limit a group may
 * reach before it is re-linked strictly. Tapping the limit opens the
 * explanation and lets the admin pin a number or go back to the wing's big room.
 */
export default function PreferenceStrategyControl({ value, onChange, medianHint }: { value: GroupingOptions; onChange: (next: GroupingOptions) => void; medianHint: string }) {
  const { tx } = useI18n();
  const [open, setOpen] = useState(false);
  const strategy = value.strategy ?? "smart";
  return (
    <div className="pref-strategy">
      <div className="pref-strategy__seg" role="radiogroup" aria-label={tx("Como agrupar pelas preferências")}>
        {OPTIONS.map((o) => (
          <button key={o.key} type="button" role="radio" aria-checked={strategy === o.key} title={tx(o.title)} className={`pref-strategy__opt${strategy === o.key ? " pref-strategy__opt--on" : ""}`} onClick={() => onChange({ ...value, strategy: o.key })}>
            {tx(o.label)}
          </button>
        ))}
      </div>
      {strategy === "smart" && (
        <button type="button" className="pref-strategy__limit" title={tx("O que é o limite?")} onClick={() => setOpen(true)}>
          {tx("Limite")} {value.limit ?? <em>{medianHint}</em>}
        </button>
      )}
      {open && <LimitDialog value={value.limit ?? null} medianHint={medianHint} onSave={(limit) => { onChange({ ...value, limit }); setOpen(false); }} onClose={() => setOpen(false)} />}
    </div>
  );
}

function LimitDialog({ value, medianHint, onSave, onClose }: { value: number | null; medianHint: string; onSave: (limit: number | null) => void; onClose: () => void }) {
  const { tx } = useI18n();
  const [custom, setCustom] = useState(value !== null);
  const [n, setN] = useState<number | null>(value ?? DEFAULT_BLOB_LIMIT);
  const valid = !custom || (n !== null && Number.isInteger(n) && n >= 2 && n <= 40);
  function submit(e: FormEvent) {
    e.preventDefault();
    if (!valid) return;
    onSave(custom ? n! : null);
  }
  return (
    <Dialog open onClose={onClose} title={tx("Limite do grupo")} width={480}>
      <form className="cat-form cat-form--plain" onSubmit={submit}>
        <h2 className="cat-form__title">{tx("Limite do grupo")}</h2>
        <p className="admin-intro">
          {tx("Primeiros nomes repetidos emendam grupos sem relação. Um grupo maior que o limite é refeito só com nomes completos ou pedidos mútuos.")}
        </p>
        <RadioGroup label={tx("Limite do grupo")}>
          <Radio checked={!custom} onChange={() => setCustom(false)} label={tx("Maior quarto da ala menos líder e auxiliar ({n})", { n: medianHint })} />
          <Radio
            checked={custom}
            onChange={() => setCustom(true)}
            label={tx("Fixar em")}
            extra={
              <>
                <input
                  className="cat-input pref-strategy__num"
                  type="number"
                  min={2}
                  max={40}
                  step={1}
                  value={n ?? ""}
                  disabled={!custom}
                  onChange={(e) => {
                    const raw = e.target.value;
                    setN(raw === "" ? null : Number(raw));
                  }}
                  aria-label={tx("Limite fixo")}
                />
                <span className="radio__hint">{tx("crianças")}</span>
              </>
            }
          />
        </RadioGroup>
        <div className="cat-form__actions">
          <button type="button" className="button button--secondary" onClick={onClose}>{tx("Cancelar")}</button>
          <button type="submit" className="button button--primary" disabled={!valid}>{tx("Salvar")}</button>
        </div>
      </form>
    </Dialog>
  );
}
