import { useMemo, useState, type ReactNode } from "react";
import type { Staff } from "../../api/staff";
import { useI18n } from "../../i18n";
import { useCollectionOrEmpty } from "../../store";
import { useMediaQuery } from "../../hooks/useMediaQuery";
import StaffPicker from "./StaffPicker";

interface StaffListEditorProps {
  /** section title; the "add" button sits on its right (top-right corner of the section) */
  title: ReactNode;
  /** optional explanation, under the title row */
  hint?: ReactNode;
  /** selected staff ids, in order */
  value: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
  /** dialog title */
  pickerTitle: string;
  /** what to show when nobody is selected */
  empty: ReactNode;
  /** extra text per chip (e.g. the person's vehicle) */
  detail?: (s: Staff) => ReactNode;
  /** label of the "add" button */
  addLabel?: string;
}

/**
 * A list of team members as removable chips + a search-as-you-type picker to
 * add more. Shared by the admin lists (check-in helpers, organizers, medical
 * team). Same layout everywhere: title on the left, "add" button top-right.
 * Pure UI: the parent owns the ids and saves them.
 */
export default function StaffListEditor({ title, hint, value, onChange, disabled, pickerTitle, empty, detail, addLabel }: StaffListEditorProps) {
  const { tx } = useI18n();
  const staff = useCollectionOrEmpty("staff");
  const addText = addLabel ?? tx("➕ Adicionar pessoa");
  const [pickerOpen, setPickerOpen] = useState(false);
  const byId = useMemo(() => new Map(staff.map((s) => [s.id, s])), [staff]);
  const people = value.map((id) => byId.get(id)).filter((s): s is Staff => !!s);
  /** phones: no count chip and the "add" button lands at the END of the card;
      the desktop keeps the button top-right with the counter beside the title */
  const phone = useMediaQuery("(max-width: 760px)");

  const addButton = (
    <button type="button" className="button button--secondary list-head__add" disabled={disabled} onClick={() => setPickerOpen(true)}>
      {addText}
    </button>
  );

  return (
    <>
      <div className="list-head">
        <h2 className="cat-form__title">
          {title} {!phone && <span className="cat-tab__count">{value.length}</span>}
        </h2>
        {!phone && addButton}
      </div>
      {hint && <p className="cat-hint">{hint}</p>}
      {people.length === 0 ? (
        <p className="opt-empty">{empty}</p>
      ) : (
        <ul className="staff-card__tags helpers-list" aria-label={tx("Pessoas")}>
          {people.map((s) => (
            <li key={s.id} className={`staff-tag helpers-tag ${s.aiReviewStatus === "pending" || s.aiReviewStatus === "processing" || s.aiReviewStatus === "structured" ? "camper-ai-review" : ""}`} title={s.aiReviewStatus === "pending" || s.aiReviewStatus === "processing" || s.aiReviewStatus === "structured" ? tx("Cadastro em revisão pela IA") : undefined}>
              <span className="helpers-tag__name">
                {s.name}
                {detail && <span className="helpers-tag__detail">{detail(s)}</span>}
              </span>
              <button
                type="button"
                className="helpers-tag__x"
                aria-label={tx("Remover {name}", { name: s.name })}
                title={tx("Remover")}
                disabled={disabled}
                onClick={() => onChange(value.filter((x) => x !== s.id))}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
      {phone && <div className="list-add">{addButton}</div>}
      <StaffPicker
        open={pickerOpen}
        title={pickerTitle}
        staff={staff.filter((s) => !value.includes(s.id))}
        occupied={new Map()}
        onPick={(id) => {
          if (!value.includes(id)) onChange([...value, id]);
          setPickerOpen(false);
        }}
        onClose={() => setPickerOpen(false)}
      />
    </>
  );
}
