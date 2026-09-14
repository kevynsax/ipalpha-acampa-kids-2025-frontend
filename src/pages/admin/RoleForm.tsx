import { useState } from "react";
import EmojiPicker from "../../components/EmojiPicker";
import { useAiAutoFill } from "../../hooks/useAiAutoFill";
import AiTitleButton from "../../components/AiTitleButton";
import type { ScheduleRole, ScheduleRoleInput } from "../../api/schedule";
import RichTextEditor from "../../components/RichTextEditor";
import Toggle from "../../components/Toggle";
import { AiGlyph } from "../../components/Glyph";

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
  /** hide 📝 Instruções e 🎒 Preparação — quando a tela de trás já edita esses textos */
  hideDocs?: boolean;
}

/** Create / edit a role: name, icon, "for everyone" flag and WYSIWYG instructions. */
export default function RoleForm({ token, role, busy, onSubmit, onCancel, embedded, hideDocs }: RoleFormProps) {
  const editing = !!role;
  const [name, setName] = useState(role?.name ?? "");
  const [emoji, setEmoji] = useState(role?.emoji ?? "🎯");
  const [instructions, setInstructions] = useState(role?.instructions ?? "");
  const [preparation, setPreparation] = useState(role?.preparation ?? "");
  const [forEveryone, setForEveryone] = useState(role?.forEveryone ?? false);
  const [hasDetail, setHasDetail] = useState(role?.hasDetail ?? false);
  const [detailFromTeam, setDetailFromTeam] = useState(role?.detailFromTeam ?? false);
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
        detailFromTeam: forEveryone || !hasDetail ? false : detailFromTeam,
        // a team-backed detail is never typed, so it needs no hint
        detailPlaceholder: forEveryone || !hasDetail || detailFromTeam ? "" : detailPlaceholder.trim(),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Algo deu errado.");
    }
  }

  return (
    <form className={embedded ? "cat-form cat-form--embedded" : "cat-form cat-form--plain"} onSubmit={handleSubmit}>
      {embedded && <h2 className="cat-form__title change-room__title">{editing ? "Editar função" : "Nova função"}</h2>}

      <div className="cat-form__row">
        <div className="cat-field cat-field--emoji">
          <span className="cat-field__label">Ícone</span>
          <EmojiPicker value={emoji} onChange={ai.pickEmoji} suggestions={EMOJI_SUGGESTIONS} disabled={busy} />
        </div>
        <label className="cat-field cat-field--grow">
          <span className="cat-field__label">Nome{ai.suggesting && <span className="cat-field__ai"> <AiGlyph /> sugerindo…</span>}</span>
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

      {/* como a função é escalada vem antes dos textos longos: decide o formato do resto */}
      <section className="form-box form-box--plain" aria-labelledby="role-options-title">
        <h3 id="role-options-title" className="form-box__title">⚙️ Como a função é escalada</h3>
      <div className="cat-field opt-field">
        <div className="opt-field__head">
          <Toggle checked={forEveryone} onChange={setForEveryone} disabled={busy} label="👥 Vale para toda a equipe" />
        </div>
        <p className="cat-hint">
          Funções padrão (ex.: “cuidar das crianças”) valem para <strong>todos</strong> os voluntários do evento, sem escalar um por um.
        </p>
      </div>

      {!forEveryone && (
        <div className="cat-field opt-field">
          <div className="opt-field__head">
            <Toggle checked={hasDetail} onChange={setHasDetail} disabled={busy} label="🏷️ Tem um detalhe por pessoa" />
          </div>
          <p className="cat-hint">
            Quando cada escalado precisa de uma informação própria — o time que acompanha, o número da base, o turno.
          </p>
          {hasDetail && (
            <>
              <div className="opt-field__head">
                <Toggle checked={detailFromTeam} onChange={setDetailFromTeam} disabled={busy} label="🏳️ O detalhe é o time da pessoa" />
              </div>
              <p className="cat-hint">
                O detalhe vem do <strong>time</strong> de cada um — não precisa preencher pessoa por pessoa. Só quem tem time entra nesta
                função, e mudar alguém de time já atualiza todos os eventos.
              </p>
              {!detailFromTeam && (
                <label className="cat-field">
                  <span className="cat-field__label">Dica do detalhe (aparece no campo)</span>
                  <input
                    className="cat-input"
                    placeholder="ex.: Base 3 · 14h–14h45"
                    value={detailPlaceholder}
                    maxLength={60}
                    disabled={busy}
                    onChange={(e) => setDetailPlaceholder(e.target.value)}
                  />
                </label>
              )}
            </>
          )}
        </div>
      )}
      </section>

      {!hideDocs && (
      <>
      <section className="form-box form-box--plain" aria-labelledby="role-instructions-title">
        <h3 id="role-instructions-title" className="form-box__title">📝 Instruções para a equipe</h3>
        <p className="cat-hint">O que a pessoa nesta função precisa fazer.</p>
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
      </section>

      <section className="form-box form-box--plain" aria-labelledby="role-prep-title">
        <h3 id="role-prep-title" className="form-box__title">🎒 Preparação (antes do acampamento)</h3>
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
      </section>
      </>
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
