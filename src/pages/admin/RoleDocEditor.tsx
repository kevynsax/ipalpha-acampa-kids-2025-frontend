import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { updateRole, type ScheduleRole } from "../../api/schedule";
import RichTextEditor from "../../components/RichTextEditor";

/** which of the função's two texts is being written */
export type RoleDocField = "instructions" | "preparation";

export const ROLE_DOC_META: Record<RoleDocField, { label: string; placeholder: string; aiContext: "role_instructions" | "role_preparation" }> = {
  instructions: {
    label: "📝 Instruções para a equipe",
    placeholder: "ex.: Fique dentro da área da piscina durante todo o turno…",
    aiContext: "role_instructions",
  },
  preparation: {
    label: "🎒 Preparação (antes do acampamento)",
    placeholder: "ex.: Leve uma camiseta verde e um boné — quanto mais parecido com o exército, melhor! 🥣",
    aiContext: "role_preparation",
  },
};

interface RoleDocEditorProps {
  token: string;
  role: ScheduleRole;
  field: RoleDocField;
  /** line under the title, e.g. "em 🏊 Piscina · sábado 14:00" */
  context?: string;
  onClose: () => void;
}

/**
 * Writes ONE text of a função (instruções or preparação) with the AI assistant
 * already open — what the ✏️ beside that text opens.
 *
 * Deliberately NOT a <Dialog>: the assistant's workspace is a plain fixed
 * overlay, and a modal <dialog> renders in the browser's TOP LAYER, which
 * would paint over it. This overlay therefore sits just below the workspace
 * (z-index) so the assistant can cover it when it opens.
 *
 * "Concluir" SAVES — the word promises it, and the assistant's own Concluir
 * is wired to the same save, so there is no way to finish and lose the text.
 */
export default function RoleDocEditor({ token, role, field, context, onClose }: RoleDocEditorProps) {
  const meta = ROLE_DOC_META[field];
  const [html, setHtml] = useState(role[field] ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dirty = html !== (role[field] ?? "");

  // Esc gives up (asking first when something was written)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      cancel();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  });

  function cancel() {
    if (saving) return;
    if (dirty && !window.confirm("Descartar o que você escreveu?")) return;
    onClose();
  }

  async function save() {
    if (saving) return;
    // nothing changed: closing is the honest no-op
    if (!dirty) return onClose();
    setSaving(true);
    setError(null);
    try {
      await updateRole(token, role.id, { [field]: html });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível salvar.");
      setSaving(false);
    }
  }

  return createPortal(
    <div className="doc-edit" role="dialog" aria-modal="true" aria-label={`${meta.label} — ${role.name}`}>
      <header className="doc-edit__head">
        <div className="doc-edit__titles">
          <span className="doc-edit__title">
            <span aria-hidden="true">{role.emoji}</span> {role.name}
          </span>
          <span className="doc-edit__sub">
            {meta.label}
            {context ? ` · ${context}` : ""}
          </span>
        </div>
        <div className="doc-edit__actions">
          <button type="button" className="button button--secondary" disabled={saving} onClick={cancel}>
            Cancelar
          </button>
          <button type="button" className="button button--primary" disabled={saving} onClick={save}>
            {saving ? "Salvando…" : "Concluir"}
          </button>
        </div>
      </header>
      {error && <p className="message message--error doc-edit__error">{error}</p>}
      <div className="doc-edit__body">
        <RichTextEditor
          token={token}
          value={html}
          onChange={setHtml}
          disabled={saving}
          tall
          autoOpenAi
          onDone={save}
          doneBusy={saving}
          aiContext={meta.aiContext}
          aiTitle={role.name}
          onAiApplied={setHtml}
          placeholder={meta.placeholder}
        />
      </div>
    </div>,
    document.body,
  );
}
