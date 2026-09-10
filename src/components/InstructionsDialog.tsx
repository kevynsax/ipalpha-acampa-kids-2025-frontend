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
    <Dialog open={!!role} onClose={onClose} title="Instruções" width={680}>
      {role && (
        <div className="picker instructions-dialog">
          <h2 className="cat-form__title">
            <span aria-hidden="true">{role.emoji}</span> {role.name}
            {context && <span className="cat-form__sub">{context}</span>}
          </h2>
          <RichHtml className="instructions instructions--scroll" html={role.instructions} />
          <div className="cat-form__actions">
            <button type="button" className="button button--secondary" onClick={onClose} autoFocus>
              Fechar
            </button>
          </div>
        </div>
      )}
    </Dialog>
  );
}
