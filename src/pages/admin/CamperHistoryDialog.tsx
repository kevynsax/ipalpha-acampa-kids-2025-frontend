import { useEffect, useState } from "react";
import { listCamperChanges, medicationLine, PARENT_FIELD_LABEL, type CamperChange, type Medication } from "../../api/campers";
import Dialog from "../../components/Dialog";
import { useLabelOf } from "../../store/derive";
import { speakDateTime } from "../../dates";
import { useI18n } from "../../i18n";

interface CamperHistoryDialogProps {
  token: string;
  open: boolean;
  camperId: string;
  camperName: string;
  onClose: () => void;
}

/** Every edit the kid's parent made to the "Informações de saúde" block, newest first — read by the admin. */
export default function CamperHistoryDialog({ token, open, camperId, camperName, onClose }: CamperHistoryDialogProps) {
  const { tx } = useI18n();
  const [changes, setChanges] = useState<CamperChange[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const labelOf = useLabelOf();

  useEffect(() => {
    if (!open) return;
    setChanges(null);
    setError(null);
    listCamperChanges(token, camperId)
      .then(setChanges)
      .catch((e) => setError(e instanceof Error ? e.message : tx("Algo deu errado.")));
  }, [open, token, camperId]);

  /** a stored value → readable text (option ids become labels) */
  const show = (v: unknown): string => {
    if (v === null || v === undefined || v === "") return "—";
    if (Array.isArray(v)) {
      if (!v.length) return "—";
      // medications are objects; every other list is option ids
      if (typeof v[0] === "object" && v[0] !== null) return (v as Medication[]).map(medicationLine).join("; ");
      return v.map((id) => labelOf(String(id)) ?? String(id)).join(", ");
    }
    if (typeof v === "number") return String(v).replace(".", ",");
    return String(v);
  };

  return (
    <Dialog open={open} onClose={onClose} title={tx("Histórico de alterações")} width={640}>
      <div className="cat-form">
        <h2 className="cat-form__title">{tx("🕓 Alterações feitas pelos pais · {name}", { name: camperName.split(" ")[0] })}</h2>
        {error && <p className="message message--error">{error}</p>}
        {!error && changes === null && <p className="opt-empty">{tx("Carregando…")}</p>}
        {changes && changes.length === 0 && <p className="opt-empty">{tx("Os pais ainda não alteraram nada.")}</p>}
        {changes && changes.length > 0 && (
          <ol className="history-list">
            {changes.map((c) => (
              <li key={c.id} className={`history-item ${c.medical ? "history-item--medical" : ""}`}>
                <p className="history-item__head">
                  <strong>{c.byName}</strong> · {speakDateTime(c.at)}
                  <span className={`staff-tag ${c.medical ? "staff-tag--late" : "staff-tag--soft"}`}>{c.medical ? tx("🩺 dados médicos") : tx("📝 observações")}</span>
                </p>
                <ul className="history-item__changes">
                  {c.changes.map((x) => (
                    <li key={x.field}>
                      <span className="history-item__field">{tx(PARENT_FIELD_LABEL[x.field] ?? x.field)}</span>
                      <span className="history-item__before">{show(x.before)}</span>
                      <span aria-hidden="true">→</span>
                      <span className="history-item__after">{show(x.after)}</span>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        )}
        <div className="cat-form__actions">
          <button type="button" className="button button--secondary" onClick={onClose}>
            {tx("Fechar")}
          </button>
        </div>
      </div>
    </Dialog>
  );
}
