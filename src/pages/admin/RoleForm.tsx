import { useState, type ReactNode } from "react";
import EmojiPicker from "../../components/EmojiPicker";
import { useAiAutoFill } from "../../hooks/useAiAutoFill";
import AiTitleButton from "../../components/AiTitleButton";
import type { ScheduleRole, ScheduleRoleInput } from "../../api/schedule";
import { ROOM_ROLE_META, type RoomRole } from "../../api/staff";
import RichTextEditor from "../../components/RichTextEditor";
import Toggle from "../../components/Toggle";
import { AiGlyph } from "../../components/Glyph";
import { ICONS } from "../../icons";
import { useHideScanFab } from "../../scanFab";

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
  // the "Ler crachá" FAB would sit on top of Salvar / Cancelar
  useHideScanFab();
  const editing = !!role;
  const [name, setName] = useState(role?.name ?? "");
  const [emoji, setEmoji] = useState(role?.emoji ?? "🎯");
  const [instructions, setInstructions] = useState(role?.instructions ?? "");
  const [preparation, setPreparation] = useState(role?.preparation ?? "");
  /** posições que pegam a função sozinhas (as duas = toda a equipe, nenhuma = só quem for escalado) */
  const [forRoomRoles, setForRoomRoles] = useState<RoomRole[]>(role?.forRoomRoles ?? []);
  const [hasDetail, setHasDetail] = useState(role?.hasDetail ?? false);
  const [detailFromTeam, setDetailFromTeam] = useState(role?.detailFromTeam ?? false);
  const [detailPlaceholder, setDetailPlaceholder] = useState(role?.detailPlaceholder ?? "");
  const [error, setError] = useState<string | null>(null);

  const valid = name.trim().length > 0;
  /** função que vai por posição: ninguém é escalado, então não há onde preencher um detalhe */
  const byPosition = forRoomRoles.length > 0;
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
        forRoomRoles,
        // o detalhe é preenchido na escala: só existe quando a função vai para pessoas específicas
        hasDetail: byPosition ? false : hasDetail,
        detailFromTeam: !byPosition && hasDetail ? detailFromTeam : false,
        // a team-backed detail is never typed, so it needs no hint
        detailPlaceholder: byPosition || !hasDetail || detailFromTeam ? "" : detailPlaceholder.trim(),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Algo deu errado.");
    }
  }

  return (
    <form className={embedded ? "cat-form cat-form--embedded" : "cat-form cat-form--plain"} onSubmit={handleSubmit}>
      {embedded && <span className="sheet__handle" aria-hidden="true" />}
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

      {/* quem faz a função vem antes dos textos longos: decide o formato do resto */}
      <section className="form-box form-box--plain" aria-labelledby="role-options-title">
        <h3 id="role-options-title" className="form-box__title">⚙️ Quem faz esta função</h3>

        <RolePositionsPicker value={forRoomRoles} onChange={setForRoomRoles} disabled={busy} />

        {/* o detalhe é digitado ao escalar: não faz sentido quando a função vai por posição */}
        <Reveal open={!byPosition}>
          <div className="cat-field opt-field">
            <div className="opt-field__head">
              <Toggle checked={hasDetail} onChange={setHasDetail} disabled={busy || byPosition} label="🏷️ Tem um detalhe por pessoa" />
            </div>
            <Reveal open={hasDetail && !byPosition}>
              <div className="opt-field__head">
                <Toggle checked={detailFromTeam} onChange={setDetailFromTeam} disabled={busy || byPosition} label="🚩 O detalhe é o time da pessoa" />
              </div>
              <Reveal open={!detailFromTeam}>
                <label className="cat-field">
                  <span className="cat-field__label">Dica do detalhe (aparece no campo)</span>
                  <input
                    className="cat-input"
                    placeholder="ex.: Base 3 · 14h–14h45"
                    value={detailPlaceholder}
                    maxLength={60}
                    disabled={busy || byPosition}
                    onChange={(e) => setDetailPlaceholder(e.target.value)}
                  />
                </label>
              </Reveal>
            </Reveal>
          </div>
        </Reveal>
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
        <h3 id="role-prep-title" className="form-box__title"><img className="admin-title__icon" src={ICONS.preparation} alt="" aria-hidden="true" /> Preparação (antes do acampamento)</h3>
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

/** Grow/shrink extra fields instead of popping the dialog taller. */
function Reveal({ open, children }: { open: boolean; children: ReactNode }) {
  return (
    <div className={`reveal${open ? " reveal--open" : ""}`} aria-hidden={!open} inert={!open || undefined}>
      <div className="reveal__inner">{children}</div>
    </div>
  );
}

/**
 * The four ways to answer "quem faz esta função", as ONE exclusive choice.
 * Each is just a value of `forRoomRoles`:
 *   []                        → só quem você escalar em cada evento
 *   ["caretaker"]             → todo Líder
 *   ["helper"]                → todo Auxiliar
 *   ["caretaker", "helper"]   → toda a equipe
 */
const WHO_OPTIONS: { key: string; roles: RoomRole[]; label: string; icon: string; hint: string }[] = [
  { key: "picked", roles: [], label: "Pessoas específicas", icon: ICONS.organizer, hint: "escolhidas por você" },
  { key: "caretaker", roles: ["caretaker"], label: ROOM_ROLE_META.caretaker.plural, icon: ROOM_ROLE_META.caretaker.icon!, hint: "quem cuida de crianças" },
  { key: "helper", roles: ["helper"], label: ROOM_ROLE_META.helper.plural, icon: ROOM_ROLE_META.helper.icon!, hint: "os auxiliares de quarto" },
  { key: "all", roles: ["caretaker", "helper"], label: "Toda a equipe", icon: ICONS.staffPair, hint: "líderes e auxiliares" },
];

/**
 * WHO does the função — pick one. A posição (Líderes / Auxiliares / toda a
 * equipe) links people by their `Staff.roomRole`, with no escala: moving
 * somebody between posições re-does every event at once. "Pessoas
 * específicas" leaves it to the escala you make in each event.
 */
function RolePositionsPicker({ value, onChange, disabled }: { value: RoomRole[]; onChange: (v: RoomRole[]) => void; disabled?: boolean }) {
  const current = WHO_OPTIONS.find((o) => o.roles.length === value.length && o.roles.every((r) => value.includes(r))) ?? WHO_OPTIONS[0];
  return (
    <fieldset className="cat-fieldset" aria-label="Quem faz esta função">
      <div className="big-options big-options--row">
        {WHO_OPTIONS.map((o) => {
          const on = o.key === current.key;
          return (
            <button
              key={o.key}
              type="button"
              className={`big-option ${on ? "big-option--on" : ""}`}
              aria-pressed={on}
              disabled={disabled}
              onClick={() => onChange(o.roles)}
            >
              <span className="big-option__emoji" aria-hidden="true">
                <img className="audience-icon" src={o.icon} alt="" style={{ width: 32, height: 32 }} />
              </span>
              <span className="big-option__label">{o.label}</span>
              <span className="big-option__hint">{o.hint}</span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
