import Dialog from "./Dialog";
import RichHtml from "./RichHtml";

interface InstructionsDialogProps {
  /** null = closed */
  role: { name: string; emoji: string; instructions: string } | null;
  /** optional context line under the title, e.g. "em 🏊 Piscina · Sáb 14:00" */
  context?: string;
  onClose: () => void;
}

/** The (possibly long, illustrated) instructions of a função in a scrollable dialog. */
export default function InstructionsDialog({ role, context, onClose }: InstructionsDialogProps) {
  return (
    <Dialog open={!!role} onClose={onClose} title="Instruções" width={680} className="instructions-sheet-dialog">
      {role && (
        <div className="picker instructions-dialog">
          {/* phones: the sheet's drag handle (CSS shows it) */}
          <span className="instructions-dialog__handle" aria-hidden="true" />
          <div className="instructions-dialog__head">
            <h2 className="cat-form__title">
              <span aria-hidden="true">{role.emoji}</span> {role.name}
              {context && <span className="cat-form__sub">{context}</span>}
            </h2>
            <button type="button" className="instructions-dialog__close" onClick={onClose} aria-label="Fechar" title="Fechar" autoFocus>
              ✕
            </button>
          </div>
          <RichHtml className="instructions instructions--scroll" html={role.instructions} />
        </div>
      )}
    </Dialog>
  );
}
