import { useState } from "react";
import EmojiPicker from "../../components/EmojiPicker";
import { useAiAutoFill } from "../../hooks/useAiAutoFill";
import AiTitleButton from "../../components/AiTitleButton";
import type { ScheduleRole, ScheduleRoleInput } from "../../api/schedule";
import RichTextEditor from "../../components/RichTextEditor";
import Toggle from "../../components/Toggle";

const EMOJI_SUGGESTIONS = ["🎯", "🧒", "🏊", "🔍", "📻", "🧹", "🏆", "📋", "😈", "🎨", "🃏", "🚩", "🚶", "🪑", "🏖️", "⛑️", "🎤", "📸"];

interface RoleFormProps {
  /** session token — lets the editors upload images */
  token: string;
  role?: ScheduleRole;
  busy?: boolean;
  onSubmit: (input: ScheduleRoleInput) => Promise<void>;
  onCancel: () => void;
  /** rendered inside a dialog: no card chrome, tighter title */
  embedded?: boolean;
}

/** Create / edit a role: name, icon, "for everyone" flag and WYSIWYG instructions. */
export default function RoleForm({ token, role, busy, onSubmit, onCancel, embedded }: RoleFormProps) {
  const editing = !!role;
  const [name, setName] = useState(role?.name ?? "");
  const [emoji, setEmoji] = useState(role?.emoji ?? "🎯");
  const [instructions, setInstructions] = useState(role?.instructions ?? "");
  const [preparation, setPreparation] = useState(role?.preparation ?? "");
  const [forEveryone, setForEveryone] = useState(role?.forEveryone ?? false);
  const [hasDetail, setHasDetail] = useState(role?.hasDetail ?? false);
  const [detailPlaceholder, setDetailPlaceholder] = useState(role?.detailPlaceholder ?? "");
  const [error, setError] = useState<string | null>(null);

  const valid = name.trim().length > 0;
  const ai = useAiAutoFill({ token, context: "role_instructions", title: name, setTitle: setName, emoji, setEmoji, defaultEmoji: "🎯", existing: editing });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // An embedded role form can be opened from inside EventForm. The dialog is
    // portalled out of that form in the DOM, but React events still bubble
    // through the component tree, so don't let this submit the event too.
    e.stopPropagation();
    if (!valid) return;
    setError(null);
    try {
      await onSubmit({
        name: name.trim(),
        emoji: emoji.trim() || "🎯",
        instructions,
        preparation,
        forEveryone,
        hasDetail: forEveryone ? false : hasDetail,
        detailPlaceholder: forEveryone || !hasDetail ? "" : detailPlaceholder.trim(),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Algo deu errado.");
    }
  }

  return (
    <form className={embedded ? "cat-form cat-form--embedded" : "cat-form"} onSubmit={handleSubmit}>
      <h2 className="cat-form__title">{editing ? "✏️ Editar função" : "✨ Nova função"}</h2>

      <div className="cat-form__row">
        <div className="cat-field cat-field--emoji">
          <span className="cat-field__label">Ícone</span>
          <EmojiPicker value={emoji} onChange={ai.pickEmoji} suggestions={EMOJI_SUGGESTIONS} disabled={busy} />
        </div>
        <label className="cat-field cat-field--grow">
          <span className="cat-field__label">Nome{ai.suggesting && <span className="cat-field__ai"> ✨ sugerindo…</span>}</span>
          <span className="cat-input-wrap">
            <input
              className="cat-input"
              placeholder="ex.: Supervisão da piscina"
              value={name}
              maxLength={80}
              autoFocus
              disabled={busy}
              onChange={(e) => setName(e.target.value)}
            />
            <AiTitleButton html={instructions || preparation} busy={ai.suggesting} disabled={busy} onClick={() => void ai.regenerateTitle(instructions || preparation)} />
          </span>
        </label>
      </div>

      <div className="cat-field">
        <span className="cat-field__label">📝 Instruções para a equipe</span>
        <p className="cat-hint">
          O que a pessoa nesta função precisa fazer.
        </p>
        <RichTextEditor
          token={token}
          aiContext="role_instructions"
          aiTitle={name}
          onAiApplied={ai.onAiApplied}
          value={instructions}
          onChange={setInstructions}
          disabled={busy}
          placeholder="ex.: Fique dentro da área da piscina durante todo o turno…"
        />
      </div>

      <div className="cat-field">
        <span className="cat-field__label">🎒 Preparação (antes do acampamento)</span>
        <p className="cat-hint">
          O que quem faz esta função precisa <strong>levar, vestir ou preparar</strong> — ex.: “roupa verde estilo exército com boné”.
        </p>
        <RichTextEditor
          token={token}
          aiContext="role_preparation"
          aiTitle={name}
          onAiApplied={ai.onAiApplied}
          value={preparation}
          onChange={setPreparation}
          disabled={busy}
          placeholder="ex.: Leve uma camiseta verde e um boné — quanto mais parecido com o exército, melhor! 🥣"
        />
      </div>

      <div className="cat-field">
        <Toggle checked={forEveryone} onChange={setForEveryone} disabled={busy} label={forEveryone ? "👥 Vale para toda a equipe" : "Vale para toda a equipe?"} />
        <p className="cat-hint">
          Funções padrão (ex.: “cuidar das crianças”) valem para <strong>todos</strong> os voluntários do evento, sem escalar um por um.
        </p>
      </div>

      {!forEveryone && (
        <div className="cat-field">
          <Toggle checked={hasDetail} onChange={setHasDetail} disabled={busy} label={hasDetail ? "🏷️ Tem um detalhe por pessoa" : "Tem um detalhe por pessoa?"} />
          <p className="cat-hint">
            Quando cada escalado precisa de uma informação própria — o time que acompanha, o número da base, o turno.
          </p>
          {hasDetail && (
            <label className="cat-field">
              <span className="cat-field__label">Dica do detalhe (aparece no campo)</span>
              <input
                className="cat-input"
                placeholder="ex.: Time Belém · Base 3 · 14h–14h45"
                value={detailPlaceholder}
                maxLength={60}
                disabled={busy}
                onChange={(e) => setDetailPlaceholder(e.target.value)}
              />
            </label>
          )}
        </div>
      )}

      {error && <p className="message message--error">{error}</p>}

      <div className="cat-form__actions">
        <button type="button" className="button button--secondary" onClick={onCancel} disabled={busy}>
          Cancelar
        </button>
        <button type="submit" className="button button--primary" disabled={!valid || busy}>
          {busy ? "Salvando…" : editing ? "Salvar" : "Criar função 🎉"}
        </button>
      </div>
    </form>
  );
}
