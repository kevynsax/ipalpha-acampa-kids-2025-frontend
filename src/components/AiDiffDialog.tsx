import { useMemo, useState } from "react";
import Dialog from "./Dialog";
import RichHtml from "./RichHtml";
import { describeDiff, diffHtml, summarizeDiff } from "../htmlDiff";

interface AiDiffDialogProps {
  open: boolean;
  onClose: () => void;
  /** document before the assistant's change */
  before: string;
  /** document after it */
  after: string;
  /** undo the change (the dialog closes) */
  onRevert: () => void;
}

/**
 * "Ver o que mudou": side-by-side review of what the assistant did, the way a
 * code review reads — removed blocks in red, new ones in green, rewritten ones
 * paired. Unchanged blocks are collapsed unless the user asks for them.
 */
export default function AiDiffDialog({ open, onClose, before, after, onRevert }: AiDiffDialogProps) {
  const [showAll, setShowAll] = useState(false);
  const [preview, setPreview] = useState(false);
  const rows = useMemo(() => (open ? diffHtml(before, after) : []), [open, before, after]);
  const summary = useMemo(() => summarizeDiff(rows), [rows]);
  const visible = showAll ? rows : rows.filter((r) => r.kind !== "same");

  return (
    <Dialog open={open} onClose={onClose} title="O que a IA mudou" width={820} fullscreenOnMobile>
      <div className="cat-form cat-form--plain ai-diff">
        <div className="ai-diff__head">
          <h2 className="cat-form__title">O que mudou</h2>
          <span className="ai-diff__summary">{describeDiff(summary)}</span>
        </div>

        <div className="ai-diff__tabs" role="tablist">
          <button type="button" role="tab" aria-selected={!preview} className={`ai-diff__tab ${preview ? "" : "is-active"}`} onClick={() => setPreview(false)}>
            Diferenças
          </button>
          <button type="button" role="tab" aria-selected={preview} className={`ai-diff__tab ${preview ? "is-active" : ""}`} onClick={() => setPreview(true)}>
            Documento novo
          </button>
          {!preview && !summary.identical && (
            <label className="ai-diff__toggle">
              <input type="checkbox" checked={showAll} onChange={(e) => setShowAll(e.target.checked)} />
              <span>Mostrar o texto inteiro</span>
            </label>
          )}
        </div>

        {preview ? (
          <div className="ai-diff__preview">
            <RichHtml html={after} className="instructions instructions--scroll" />
          </div>
        ) : summary.identical ? (
          <p className="cat-hint">O texto ficou igual — a IA não mudou nada.</p>
        ) : (
          <ol className="ai-diff__list">
            {visible.map((r, i) => (
              <li key={i} className={`ai-diff__row ai-diff__row--${r.kind}`}>
                {r.kind === "changed" ? (
                  <>
                    <p className="ai-diff__text ai-diff__text--before">
                      <span className="ai-diff__mark" aria-hidden>−</span>
                      {r.before}
                    </p>
                    <p className="ai-diff__text ai-diff__text--after">
                      <span className="ai-diff__mark" aria-hidden>+</span>
                      {r.after}
                    </p>
                  </>
                ) : (
                  <p className="ai-diff__text">
                    <span className="ai-diff__mark" aria-hidden>
                      {r.kind === "added" ? "+" : r.kind === "removed" ? "−" : ""}
                    </span>
                    {r.after ?? r.before}
                  </p>
                )}
              </li>
            ))}
          </ol>
        )}

        <div className="cat-form__actions">
          <button
            type="button"
            className="button button--secondary"
            onClick={() => {
              onRevert();
              onClose();
            }}
          >
            ↶ Desfazer a mudança
          </button>
          <button type="button" className="button button--primary" onClick={onClose}>
            Manter
          </button>
        </div>
      </div>
    </Dialog>
  );
}
