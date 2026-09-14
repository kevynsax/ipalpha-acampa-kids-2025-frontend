import { AiGlyph } from "./Glyph";

interface AiTitleButtonProps {
  /** editor HTML the title should describe; the button is hidden while it is empty */
  html: string;
  busy: boolean;
  disabled?: boolean;
  onClick: () => void;
}

/**
 * AI-spark button docked in the right corner of a title input. Wrap the input in
 * `.cat-input-wrap` and put this right after it.
 */
export default function AiTitleButton({ html, busy, disabled, onClick }: AiTitleButtonProps) {
  if (!html.trim()) return null;
  return (
    <button
      type="button"
      className={`ai-title-btn ${busy ? "ai-title-btn--busy" : ""}`}
      title="Gerar título com IA a partir do conteúdo"
      aria-label="Gerar título com IA"
      disabled={disabled || busy}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
    >
      {busy ? "⏳" : <AiGlyph />}
    </button>
  );
}
