import { useEffect, useRef, useState } from "react";
import Dialog from "./Dialog";
import RichHtml from "./RichHtml";

interface InstructionsDialogProps {
  /** null = closed */
  role: { name: string; emoji: string; instructions: string } | null;
  /** optional context line under the title, e.g. "em 🏊 Piscina · Sáb 14:00" */
  context?: string;
  onClose: () => void;
}

const SHEET_OUT_MS = 220;

/** The (possibly long, illustrated) instructions of a função in a scrollable dialog. */
export default function InstructionsDialog({ role, context, onClose }: InstructionsDialogProps) {
  const [closing, setClosing] = useState(false);
  const closeTimer = useRef<number | null>(null);

  useEffect(() => {
    if (!role) return;
    if (closeTimer.current) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
    setClosing(false);
  }, [role]);

  useEffect(() => () => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
  }, []);

  function requestClose() {
    if (!role || closing) return;
    // phones: the sheet slides down first; desktop is a centred card, close now
    if (!window.matchMedia("(max-width: 700px)").matches) {
      onClose();
      return;
    }
    setClosing(true);
    closeTimer.current = window.setTimeout(onClose, SHEET_OUT_MS);
  }

  return (
    <Dialog
      open={!!role}
      onClose={requestClose}
      title="Instruções"
      width={680}
      className={`instructions-sheet-dialog${closing ? " instructions-sheet-dialog--out" : ""}`}
    >
      {role && (
        <div className="picker instructions-dialog">
          {/* phones: the sheet's drag handle (CSS shows it) */}
          <span className="instructions-dialog__handle" aria-hidden="true" />
          <div className="instructions-dialog__head">
            <h2 className="cat-form__title">
              <span aria-hidden="true">{role.emoji}</span> {role.name}
              {context && <span className="cat-form__sub">{context}</span>}
            </h2>
            <button type="button" className="instructions-dialog__close" onClick={requestClose} aria-label="Fechar" title="Fechar" autoFocus>
              ✕
            </button>
          </div>
          <RichHtml className="instructions instructions--scroll" html={role.instructions} />
          <div className="cat-form__actions instructions-dialog__actions">
            <button type="button" className="button button--secondary" onClick={requestClose}>
              Fechar
            </button>
          </div>
        </div>
      )}
    </Dialog>
  );
}
