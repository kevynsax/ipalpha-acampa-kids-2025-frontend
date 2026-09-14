import { useEffect, useState } from "react";
import { STAFF_CATEGORY_KEYS, updateStaff, type Staff } from "../../api/staff";
import { CategorySelect, TeamSelect } from "../../components/CategoryFields";
import Dialog from "../../components/Dialog";
import { ICONS } from "../../icons";
import { useCollectionOrEmpty } from "../../store";

export type StaffQuickField = "team" | "transportation";

const META: Record<StaffQuickField, { title: string }> = {
  team: { title: "Trocar de time" },
  transportation: { title: "Trocar o transporte" },
};

interface StaffFieldDialogProps {
  token: string;
  open: boolean;
  member: Staff;
  field: StaffQuickField;
  onClose: () => void;
}

/** Admin: change ONE quick field of a team member (team or transportation) from the detail page. */
export default function StaffFieldDialog({ token, open, member: s, field, onClose }: StaffFieldDialogProps) {
  const categories = useCollectionOrEmpty("categories");
  const [value, setValue] = useState<string | null>(s[field]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setValue(s[field]);
      setError(null);
    }
  }, [open, s, field]);

  const changed = value !== s[field];

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      await updateStaff(token, s.id, { [field]: value });
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Algo deu errado.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title={META[field].title} width={480}>
      <div className="cat-form cat-form--plain">
        <h2 className="cat-form__title change-room__title">
          <img className="pencil-icon" src={ICONS.pencil} alt="" aria-hidden="true" /> {META[field].title}
        </h2>

        {field === "team" ? (
          <TeamSelect value={value} onChange={setValue} disabled={busy} />
        ) : (
          <CategorySelect label="Transporte" category={categories.find((c) => c.key === STAFF_CATEGORY_KEYS.transportation)} value={value} onChange={setValue} disabled={busy} />
        )}

        {error && <p className="message message--error">{error}</p>}

        <div className="cat-form__actions">
          <button type="button" className="button button--secondary" onClick={onClose} disabled={busy}>
            Cancelar
          </button>
          <button type="button" className="button button--primary" disabled={busy || !changed} onClick={submit}>
            {busy ? "Salvando…" : "Confirmar"}
          </button>
        </div>
      </div>
    </Dialog>
  );
}
