import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import Dialog from "./Dialog";
import RichHtml from "./RichHtml";
import { ExpandGlyph } from "./Glyph";
import { ICONS } from "../icons";

interface RichTextBoxProps {
  /** small uppercase label above the box, e.g. "📝 Instruções" */
  label: ReactNode;
  /** sanitized HTML from the server — may be empty: the section still shows, with a hint */
  html: string;
  /** heading of the full-screen view, e.g. "🏊 Salva-vidas" */
  title: string;
  /** optional line under the heading, e.g. "em 🏊 Piscina · sábado 14:00" */
  context?: string;
  /** shown in place of the text when nothing was written yet */
  emptyHint?: string;
  /** pencil in the corner — opens the editor for this text */
  onEdit?: () => void;
  /** height of the clamped box in px */
  maxHeight?: number;
}

/**
 * One block of admin-written rich text shown where it matters: a short
 * scrollable box so the rest of the page stays readable, with ⤢ (read it all
 * full screen) and ✏️ (edit) in the top-right corner. The section is always
 * rendered — when empty it says so, so nobody wonders whether it exists.
 */
export default function RichTextBox({ label, html, title, context, emptyHint = "Nada escrito ainda.", onEdit, maxHeight = 220 }: RichTextBoxProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  /** there is more text below the fold — fades the bottom edge */
  const [clamped, setClamped] = useState(false);
  const [open, setOpen] = useState(false);
  const empty = !html.trim();

  const measure = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const more = el.scrollHeight - el.clientHeight - el.scrollTop;
    setClamped(more > 8);
  }, []);

  // images load late and change the height: re-measure on every size change
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    if (el.firstElementChild) ro.observe(el.firstElementChild);
    return () => ro.disconnect();
  }, [measure, html]);

  return (
    <div className={`rich-box ${clamped ? "rich-box--clamped" : ""} ${empty ? "rich-box--empty" : ""}`}>
      <div className="rich-box__head">
        <span className="cat-field__label">{label}</span>
        {/* nothing written yet: no ⤢ and no ✏️ — the empty line itself offers "escrever" */}
        {!empty && (
          <div className="rich-box__actions">
            <button
              type="button"
              className="icon-btn icon-btn--bare rich-box__expand"
              title="Ver em tela cheia"
              aria-label="Ver em tela cheia"
              onClick={() => setOpen(true)}
            >
              <ExpandGlyph />
            </button>
            {onEdit && (
              <button type="button" className="icon-btn icon-btn--bare" title="Editar" aria-label="Editar" onClick={onEdit}>
                <img className="pencil-icon" src={ICONS.pencil} alt="" aria-hidden="true" />
              </button>
            )}
          </div>
        )}
      </div>
      <div className="rich-box__frame">
        {empty ? (
          <p className="rich-box__empty">
            {emptyHint}
            {onEdit && (
              <>
                {" "}
                <button type="button" className="link-btn" onClick={onEdit}>
                  escrever
                </button>
              </>
            )}
          </p>
        ) : (
          <div ref={scrollRef} className="rich-box__scroll" style={{ maxHeight }} onScroll={measure}>
            <RichHtml className="instructions instructions--flat" html={html} />
          </div>
        )}
      </div>

      <Dialog open={open} onClose={() => setOpen(false)} title={title} width={900} fullscreen>
        <div className="doc-full">
          <header className="doc-full__head">
            <h2 className="cat-form__title">
              {title}
              {context && <span className="cat-form__sub doc-full__sub">{context}</span>}
            </h2>
            <div className="rich-box__actions">
              {onEdit && (
                <button
                  type="button"
                  className="icon-btn icon-btn--bare"
                  title="Editar"
                  aria-label="Editar"
                  onClick={() => {
                    setOpen(false);
                    onEdit();
                  }}
                >
                  <img className="pencil-icon" src={ICONS.pencil} alt="" aria-hidden="true" />
                </button>
              )}
              <button type="button" className="icon-btn" title="Fechar" aria-label="Fechar" autoFocus onClick={() => setOpen(false)}>
                ×
              </button>
            </div>
          </header>
          <div className="doc-full__body">
            <span className="cat-field__label">{label}</span>
            <RichHtml className="instructions instructions--flat" html={html} />
          </div>
          <div className="doc-full__actions">
            <button type="button" className="button button--secondary" onClick={() => setOpen(false)}>
              Fechar
            </button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
