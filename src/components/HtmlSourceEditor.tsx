import { useEffect, useMemo, useRef, useState } from "react";
import { compactHtml, formatHtml, unsupportedTags } from "../html";

interface HtmlSourceEditorProps {
  /** document HTML (relative image urls, as stored) */
  value: string;
  /** apply the edited source back to the document */
  onApply: (html: string) => void;
  /** leave source mode without applying */
  onCancel: () => void;
  disabled?: boolean;
}

/**
 * Raw HTML view of the document ("</>" in the toolbar): the admin — or someone
 * pasting markup the AI wrote elsewhere — edits the source directly, sees which
 * tags the app will drop, and applies it to the WYSIWYG editor.
 *
 * Tab inserts two spaces, Ctrl/Cmd+Enter applies, Esc cancels.
 */
export default function HtmlSourceEditor({ value, onApply, onCancel, disabled }: HtmlSourceEditorProps) {
  const [text, setText] = useState(() => formatHtml(value));
  const areaRef = useRef<HTMLTextAreaElement>(null);
  const dropped = useMemo(() => unsupportedTags(text), [text]);
  const dirty = compactHtml(text) !== compactHtml(formatHtml(value));

  useEffect(() => {
    areaRef.current?.focus();
  }, []);

  function apply() {
    onApply(compactHtml(text));
  }

  return (
    <div className="rte-source">
      <div className="rte-source__bar">
        <span className="rte-source__label">HTML do documento</span>
        <button type="button" className="rte-source__btn" disabled={disabled} onClick={() => setText(formatHtml(compactHtml(text)))}>
          ⤷ Formatar
        </button>
        <span className="rte__spacer" />
        <button type="button" className="rte-source__btn" onClick={onCancel}>
          Cancelar
        </button>
        <button type="button" className="rte-source__btn rte-source__btn--go" disabled={disabled} onClick={apply}>
          ✓ Aplicar
        </button>
      </div>
      <textarea
        ref={areaRef}
        className="rte-source__area"
        spellCheck={false}
        value={text}
        disabled={disabled}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Tab") {
            e.preventDefault();
            const el = e.currentTarget;
            const { selectionStart: a, selectionEnd: b } = el;
            const next = `${text.slice(0, a)}  ${text.slice(b)}`;
            setText(next);
            requestAnimationFrame(() => el.setSelectionRange(a + 2, a + 2));
          }
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            apply();
          }
          if (e.key === "Escape") {
            e.preventDefault();
            onCancel();
          }
        }}
      />
      <p className="rte-source__foot">
        {dropped.length ? (
          <span className="rte-source__warn">⚠️ Estas tags serão removidas ao aplicar: {dropped.map((t) => `<${t}>`).join(" ")}</span>
        ) : (
          <span>
            Permitido: p, br, strong, em, s, ul, ol, li, h2, h3, blockquote, a, hr, img, mark, details, summary, figure, figcaption, table.
          </span>
        )}
        <span className="rte-source__meta">
          {text.length.toLocaleString("pt-BR")} caracteres{dirty ? " · alterado" : ""} · ⌘/Ctrl+Enter aplica
        </span>
      </p>
    </div>
  );
}
