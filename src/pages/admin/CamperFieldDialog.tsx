import { useEffect, useState } from "react";
import { CAMPER_CATEGORY_KEYS, updateCamper, type Camper } from "../../api/campers";
import { CategorySelect, TeamSelect } from "../../components/CategoryFields";
import Dialog from "../../components/Dialog";
import { ICONS } from "../../icons";
import { useCollectionOrEmpty } from "../../store";

export type CamperQuickField = "team" | "transportation";

const META: Record<CamperQuickField, { title: string }> = {
  team: { title: "Trocar de time" },
  transportation: { title: "Trocar o transporte" },
};

interface CamperFieldDialogProps {
  token: string;
  open: boolean;
  camper: Camper;
  field: CamperQuickField;
  onClose: () => void;
}

/** Admin: change ONE quick field of a kid (team or transportation) from the detail page. */
export default function CamperFieldDialog({ token, open, camper: k, field, onClose }: CamperFieldDialogProps) {
  const categories = useCollectionOrEmpty("categories");
  const [value, setValue] = useState<string | null>(k[field]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setValue(k[field]);
      setError(null);
    }
  }, [open, k, field]);

  const changed = value !== k[field];

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      await updateCamper(token, k.id, { [field]: value });
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
          <CategorySelect label="Transporte" category={categories.find((c) => c.key === CAMPER_CATEGORY_KEYS.transportation)} value={value} onChange={setValue} disabled={busy} />
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
