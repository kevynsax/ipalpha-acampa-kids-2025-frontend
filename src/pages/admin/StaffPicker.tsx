import { useEffect, useMemo, useRef, useState } from "react";
import type { Staff } from "../../api/staff";
import Dialog from "../../components/Dialog";
import { SearchGlyph } from "../../components/Glyph";
import { useI18n } from "../../i18n";

/** What a person is already doing at this time (shown as a label). */
export interface Occupation {
  role: string;
  /** where — e.g. "neste evento" or "Piscina 14:00" */
  where: string;
}

interface StaffPickerProps {
  open: boolean;
  title: string;
  staff: Staff[];
  /** staffId → occupation; people in this map go to the END of the list with a label */
  occupied: Map<string, Occupation>;
  onPick: (staffId: string) => void;
  onClose: () => void;
}

const normalize = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

/**
 * Search-as-you-type picker for one role. Free people first (alphabetical);
 * people already busy at that time come last with a label of what they do.
 */
export default function StaffPicker({ open, title, staff, occupied, onPick, onClose }: StaffPickerProps) {
  const { tx } = useI18n();
  const [q, setQ] = useState("");
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQ("");
      setCursor(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const results = useMemo(() => {
    const nq = normalize(q.trim());
    const match = staff.filter((s) => s.active && (!nq || normalize(s.name).includes(nq)));
    const free = match.filter((s) => !occupied.has(s.id)).sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
    const busy = match.filter((s) => occupied.has(s.id)).sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
    return [...free, ...busy];
  }, [staff, occupied, q]);

  useEffect(() => setCursor(0), [q]);

  function onKey(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setCursor((c) => Math.min(results.length - 1, c + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setCursor((c) => Math.max(0, c - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const s = results[cursor];
      if (s) onPick(s.id);
    }
  }

  const freeCount = results.filter((s) => !occupied.has(s.id)).length;

  return (
    <Dialog open={open} onClose={onClose} title={title} width={520} autofocus className="picker-sheet-dialog">
      <div className="picker picker-sheet">
        <header className="picker-sheet__head">
          <span className="picker-sheet__handle" aria-hidden="true" />
          <h2 className="cat-form__title">{title}</h2>
          <label className="staff-toolbar__search">
            <SearchGlyph className="staff-toolbar__search-icon" size="1.2em" />
            <input
              ref={inputRef}
              className="cat-input"
              type="search"
              placeholder={tx("Digite o nome…")}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={onKey}
              aria-label="Buscar pessoa"
            />
          </label>
          <p className="cat-hint">
            {freeCount} livre{freeCount !== 1 ? "s" : ""}
            {results.length - freeCount > 0 && ` · ${results.length - freeCount} ocupado${results.length - freeCount !== 1 ? "s" : ""}`}
          </p>
        </header>

        <div className="picker-sheet__body">
          {results.length === 0 ? (
            <p className="opt-empty">Ninguém encontrado.</p>
          ) : (
            <ul className="picker__list" role="listbox">
              {results.map((s, i) => {
                const occ = occupied.get(s.id);
                return (
                  <li key={s.id}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={i === cursor}
                      className={`picker__item ${occ ? "picker__item--busy" : ""} ${i === cursor ? "picker__item--cursor" : ""}`}
                      onMouseEnter={() => setCursor(i)}
                      onClick={() => onPick(s.id)}
                    >
                      <span className="picker__name">{s.name}</span>
                      {occ && (
                        <span className="picker__busy" title={`${occ.role} · ${occ.where}`}>
                          {occ.role}
                          <span className="picker__busy-where">{occ.where}</span>
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="cat-form__actions picker-sheet__actions">
          <button type="button" className="button button--secondary" onClick={onClose}>
            Cancelar
          </button>
        </div>
      </div>
    </Dialog>
  );
}
