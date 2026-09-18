import { useEffect, useRef, useState } from "react";
import type { Editor } from "@tiptap/react";
import { STYLE_ATTRS, STYLE_LABELS, type StyleAttr } from "../htmlStyle";
import { useI18n } from "../i18n";
import { activeStyleTokens, inList } from "./StyleTokens";

interface StyleMenuProps {
  editor: Editor;
  disabled?: boolean;
}

/**
 * "Aa" toolbar menu: spacing, size, alignment, colour, background and font for
 * the block under the cursor.
 *
 * The values are the app's design tokens, not free CSS — so a document can't
 * end up with 11px grey text on a grey card, and a future redesign reaches
 * every document already written.
 */
export default function StyleMenu({ editor, disabled }: StyleMenuProps) {
  const { tx } = useI18n();
  const [open, setOpen] = useState(false);
  const [, force] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  // the menu shows what the cursor sits on: repaint as the selection moves
  useEffect(() => {
    if (!open) return;
    const update = () => force((n) => n + 1);
    editor.on("selectionUpdate", update);
    editor.on("transaction", update);
    return () => {
      editor.off("selectionUpdate", update);
      editor.off("transaction", update);
    };
  }, [open, editor]);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        editor.commands.focus();
      }
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [open, editor]);

  const active = activeStyleTokens(editor);
  const count = Object.keys(active).length;
  // density only means something on a list: don't offer a dead control elsewhere
  const attrs = STYLE_ATTRS.filter((a) => a !== "data-density" || inList(editor));

  return (
    <div className="rte-style" ref={ref}>
      <button
        type="button"
        className={`rte__btn ${open || count ? "rte__btn--active" : ""}`}
        title={tx("Estilo do bloco (espaçamento, tamanho, cor, fundo)")}
        aria-label={tx("Estilo do bloco")}
        aria-haspopup="dialog"
        aria-expanded={open}
        disabled={disabled}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => setOpen((v) => !v)}
      >
        Aa{count ? <span className="rte-style__count">{count}</span> : null}
      </button>
      {open && (
        <div className="rte-style__menu" role="dialog" aria-label={tx("Estilo do bloco")}>
          {attrs.map((attr: StyleAttr) => {
            const spec = STYLE_LABELS[attr];
            return (
              <div className="rte-style__group" key={attr}>
                <span className="rte-style__label">{tx(spec.label)}</span>
                <div className="rte-style__options">
                  <button
                    type="button"
                    className={`rte-style__opt ${active[attr] ? "" : "is-active"}`}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => editor.commands.setStyleToken(attr, null)}
                  >
                    {tx("Padrão")}
                  </button>
                  {spec.options.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      className={`rte-style__opt ${active[attr] === opt.value ? "is-active" : ""} ${attr === "data-tone" || attr === "data-color" ? `rte-style__opt--${attr === "data-tone" ? "tone" : "ink"}-${opt.value}` : ""}`}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => editor.commands.setStyleToken(attr, active[attr] === opt.value ? null : opt.value)}
                    >
                      {tx(opt.label)}
                    </button>
                  ))}
                </div>
                <span className="rte-style__hint">{tx(spec.hint)}</span>
              </div>
            );
          })}
          <div className="rte-style__foot">
            <button type="button" className="rte-style__clear" disabled={!count} onMouseDown={(e) => e.preventDefault()} onClick={() => editor.commands.clearStyleTokens()}>
              {tx("Limpar estilo do bloco")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
