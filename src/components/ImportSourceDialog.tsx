import Dialog from "./Dialog";
import OptionCards, { type OptionCard } from "./OptionCards";
import { ICONS } from "../icons";
import { useI18n } from "../i18n";

type Source = "sheet" | "year";

interface ImportSourceDialogProps {
  open: boolean;
  onClose: () => void;
  /** the "Planilha" card icon — importCampers for campers, staffPair for staff */
  sheetIcon: string;
  onPickSheet: () => void;
  onPickYear: () => void;
}

/**
 * The "Importar" sheet, opened from Acampantes / Equipe when there is more
 * than one camp: pick the source — a spreadsheet (today's flow) or another
 * year's camp.
 */
export default function ImportSourceDialog({ open, onClose, sheetIcon, onPickSheet, onPickYear }: ImportSourceDialogProps) {
  const { tx } = useI18n();
  const options: OptionCard<Source>[] = [
    { key: "sheet", icon: sheetIcon, title: tx("Planilha") },
    { key: "year", icon: ICONS.previousYear, title: tx("Outro ano") },
  ];

  return (
    <Dialog open={open} onClose={onClose} title={tx("Importar")} width={420} className="sheet-dialog" autofocus={false}>
      <div className="cat-form cat-form--plain">
        <span className="sheet__handle" aria-hidden="true" />
        <h2 className="cat-form__title">{tx("Importar")}</h2>
        <OptionCards row label={tx("De onde importar")} value={null} options={options} onChange={(key) => (key === "sheet" ? onPickSheet() : onPickYear())} />
      </div>
    </Dialog>
  );
}
