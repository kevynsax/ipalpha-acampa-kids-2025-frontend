import { useState } from "react";
import { createInstruction, deleteInstruction, reorderInstructions, updateInstruction, type Instruction, type InstructionInput } from "../../api/instructions";
import Breadcrumbs from "../../components/Breadcrumbs";
import { useConfirm } from "../../components/ConfirmDialog";
import EmojiPicker from "../../components/EmojiPicker";
import AudiencePicker, { AudienceTag, type DocAudience } from "../../components/AudiencePicker";
import { useAiAutoFill } from "../../hooks/useAiAutoFill";
import AiTitleButton from "../../components/AiTitleButton";
import RichHtml from "../../components/RichHtml";
import RichTextEditor from "../../components/RichTextEditor";
import { goBack, useRoute } from "../../router";
import { useCollection } from "../../store";

interface InstructionsAdminPageProps {
  token: string;
}

const EMOJI_SUGGESTIONS = ["📖", "📋", "🚨", "🕐", "🍽️", "🏊", "🛏️", "💊", "🙏", "🎯", "📱", "🚌", "⛪", "🌧️", "🔥", "🧭", "🎒", "📸"];

const fmtDate = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" });

/**
 * ⚙️ → Instruções: general documents for the whole camp ("Regras do
 * acampamento", "Plano de emergência", "Rotina do dia"…). These can be LONG,
 * so the list shows only titles; tapping one opens the whole document, and
 * from there the admin edits it in a full-width WYSIWYG editor.
 *
 *   /instructions              list
 *   /instructions-admin/new          new document
 *   /instructions/:id          read the document
 *   /instructions/:id/edit     edit it
 */
export default function InstructionsAdminPage({ token }: InstructionsAdminPageProps) {
  const docs = useCollection("instructions");
  const { segments, navigate } = useRoute();
  const confirm = useConfirm();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [, id, action] = segments;
  const mode: { kind: "list" } | { kind: "new" } | { kind: "read"; id: string } | { kind: "edit"; id: string } =
    id === "new" ? { kind: "new" } : id && action === "edit" ? { kind: "edit", id } : id ? { kind: "read", id } : { kind: "list" };

  async function withBusy<T>(fn: () => Promise<T>): Promise<T> {
    setBusy(true);
    setError(null);
    try {
      return await fn();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Algo deu errado.");
      throw err;
    } finally {
      setBusy(false);
    }
  }

  async function handleCreate(input: InstructionInput) {
    const created = await withBusy(() => createInstruction(token, input));
    navigate(`/instructions-admin/${created.id}`, { replace: true });
  }
  async function handleEdit(d: Instruction, input: InstructionInput) {
    await withBusy(() => updateInstruction(token, d.id, input));
    navigate(`/instructions-admin/${d.id}`, { replace: true });
  }
  async function handleDelete(d: Instruction) {
    if (!(await confirm({ emoji: "🗑️", title: `Excluir "${d.title}"?`, message: "O documento inteiro será apagado. Isso não pode ser desfeito.", confirmLabel: "Excluir", danger: true }))) return;
    await withBusy(() => deleteInstruction(token, d.id)).catch(() => {});
    navigate("/instructions-admin", { replace: true });
  }
  async function move(d: Instruction, dir: -1 | 1) {
    if (!docs) return;
    const ids = docs.map((x) => x.id);
    const i = ids.indexOf(d.id);
    const j = i + dir;
    if (j < 0 || j >= ids.length) return;
    [ids[i], ids[j]] = [ids[j], ids[i]];
    await withBusy(() => reorderInstructions(token, ids)).catch(() => {});
  }

  if (!docs) {
    return (
      <div className="admin-page">
        {error ? <p className="message message--error">{error}</p> : <p className="opt-empty">Sincronizando com o servidor… 🏕️</p>}
      </div>
    );
  }

  const current = mode.kind === "read" || mode.kind === "edit" ? docs.find((d) => d.id === mode.id) : undefined;

  // ── read one document ──
  if (mode.kind === "read") {
    return (
      <div className="admin-page">
        <Breadcrumbs items={[{ label: "Instruções", onClick: () => navigate("/instructions-admin") }, { label: current?.title ?? "Documento" }]} />
        {!current ? (
          <p className="opt-empty">Documento não encontrado.</p>
        ) : (
          <article className="detail-card instruction-doc">
            <header className="admin-head">
              <h1 className="admin-title instruction-doc__title">
                <span aria-hidden="true">{current.emoji}</span> {current.title}
              </h1>
              <button type="button" className="icon-btn icon-btn--lg" title="Editar" aria-label="Editar" disabled={busy} onClick={() => navigate(`/instructions-admin/${current.id}/edit`)}>
                <span className="pencil" aria-hidden="true">✏️</span>
              </button>
            </header>
            {error && <p className="message message--error">{error}</p>}
            {current.content ? <RichHtml html={current.content} /> : <p className="opt-empty">Documento vazio — toque em ✏️ para escrever.</p>}
            <p className="footer-note">Última alteração: {fmtDate.format(new Date(current.updatedAt))}</p>
          </article>
        )}
      </div>
    );
  }

  // ── editor (new / edit) ──
  if (mode.kind === "new" || mode.kind === "edit") {
    const back = mode.kind === "edit" && current ? `/instructions-admin/${current.id}` : "/instructions-admin";
    return (
      <div className="admin-page admin-page--wide">
        <Breadcrumbs
          items={[
            { label: "Instruções", onClick: () => navigate("/instructions-admin") },
            ...(mode.kind === "edit" && current ? [{ label: current.title, onClick: () => navigate(`/instructions-admin/${current.id}`) }] : []),
            { label: mode.kind === "new" ? "Novo documento" : "Editar" },
          ]}
        />
        {error && <p className="message message--error">{error}</p>}
        {mode.kind === "edit" && !current && <p className="opt-empty">Documento não encontrado.</p>}
        {(mode.kind === "new" || current) && (
          <>
            <DocForm key={current?.id ?? "new"} token={token} doc={current} busy={busy} onSubmit={(i) => (current ? handleEdit(current, i) : handleCreate(i))} onCancel={() => goBack(back)} />
            {current && (
              <button type="button" className="link-danger" disabled={busy} onClick={() => handleDelete(current)}>
                🗑️ Excluir "{current.title}"
              </button>
            )}
          </>
        )}
      </div>
    );
  }

  // ── list ──
  return (
    <div className="admin-page">
      <header className="admin-head">
        <h1 className="admin-title">📖 Instruções</h1>
        <button type="button" className="button button--primary admin-head__new" disabled={busy} onClick={() => navigate("/instructions-admin/new")}>
          + Documento
        </button>
      </header>
      <p className="admin-intro">
        Documentos gerais do acampamento, para toda a equipe ler: regras, plano de emergência, rotina do dia…
      </p>

      {error && <p className="message message--error">{error}</p>}

      {docs.length === 0 ? (
        <div className="admin-empty">
          <span className="admin-empty__emoji">📖</span>
          <p>Nenhum documento ainda. Comece com “Regras do acampamento” ou “Plano de emergência”.</p>
          <button type="button" className="button button--primary" onClick={() => navigate("/instructions-admin/new")}>
            + Criar documento
          </button>
        </div>
      ) : (
        <ul className="staff-list">
          {docs.map((d, i) => (
            <li key={d.id} className="staff-card staff-card--clickable instruction-row">
              <div
                className="staff-card__body"
                role="button"
                tabIndex={0}
                title={`Abrir "${d.title}"`}
                onClick={() => navigate(`/instructions-admin/${d.id}`)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    navigate(`/instructions-admin/${d.id}`);
                  }
                }}
              >
                <h3 className="staff-card__name">
                  <span aria-hidden="true">{d.emoji}</span> {d.title} <AudienceTag audience={d.audience} />
                </h3>
                <p className="staff-card__meta">
                  {d.content ? `Atualizado ${fmtDate.format(new Date(d.updatedAt))}` : <span className="staff-card__missing">sem conteúdo</span>}
                </p>
              </div>
              <div className="opt-item__actions">
                <button type="button" className="icon-btn" title="Subir" aria-label="Subir" disabled={busy || i === 0} onClick={() => move(d, -1)}>
                  ↑
                </button>
                <button type="button" className="icon-btn" title="Descer" aria-label="Descer" disabled={busy || i === docs.length - 1} onClick={() => move(d, 1)}>
                  ↓
                </button>
                <button type="button" className="icon-btn" title="Editar" aria-label="Editar" disabled={busy} onClick={() => navigate(`/instructions-admin/${d.id}/edit`)}>
                  <span className="pencil" aria-hidden="true">✏️</span>
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

interface DocFormProps {
  token: string;
  doc?: Instruction;
  busy: boolean;
  onSubmit: (input: InstructionInput) => Promise<void>;
  onCancel: () => void;
}

function DocForm({ token, doc, busy, onSubmit, onCancel }: DocFormProps) {
  const [title, setTitle] = useState(doc?.title ?? "");
  const [emoji, setEmoji] = useState(doc?.emoji ?? "📖");
  const [audience, setAudience] = useState<DocAudience>(doc?.audience ?? "all");
  const [content, setContent] = useState(doc?.content ?? "");
  const valid = title.trim().length > 0;
  const ai = useAiAutoFill({ token, context: "instruction", title, setTitle, emoji, setEmoji, defaultEmoji: "📖", existing: !!doc });

  return (
    <form
      className="cat-form instruction-form"
      onSubmit={(e) => {
        e.preventDefault();
        if (valid && !busy) void onSubmit({ title: title.trim(), emoji: emoji.trim() || "📖", audience, content }).catch(() => {});
      }}
    >
      <h2 className="cat-form__title">{doc ? "✏️ Editar documento" : "✨ Novo documento"}</h2>
      <div className="cat-form__row">
        <div className="cat-field cat-field--emoji">
          <span className="cat-field__label">Ícone</span>
          <EmojiPicker value={emoji} onChange={ai.pickEmoji} suggestions={EMOJI_SUGGESTIONS} disabled={busy} />
        </div>
        <label className="cat-field cat-field--grow">
          <span className="cat-field__label">Título{ai.suggesting && <span className="cat-field__ai"> ✨ sugerindo…</span>}</span>
          <span className="cat-input-wrap">
            <input className="cat-input" placeholder="ex.: Regras do acampamento" value={title} maxLength={120} autoFocus={!doc} disabled={busy} onChange={(e) => setTitle(e.target.value)} />
            <AiTitleButton html={content} busy={ai.suggesting} disabled={busy} onClick={() => void ai.regenerateTitle(content)} />
          </span>
        </label>
      </div>
      <AudiencePicker value={audience} onChange={setAudience} disabled={busy} />
      <div className="cat-field">
        <span className="cat-field__label">📝 Documento</span>
        <p className="cat-hint">Texto, títulos, listas, links e fotos (🖼️ ou cole / arraste uma imagem).</p>
        <RichTextEditor token={token} value={content} onChange={setContent} disabled={busy} placeholder="Escreva o documento aqui…" tall aiContext="instruction" aiTitle={title} onAiApplied={ai.onAiApplied} />
      </div>
      <div className="cat-form__actions">
        <button type="button" className="button button--secondary" onClick={onCancel} disabled={busy}>
          Cancelar
        </button>
        <button type="submit" className="button button--primary" disabled={!valid || busy}>
          {busy ? "Salvando…" : doc ? "Salvar" : "Criar documento 🎉"}
        </button>
      </div>
    </form>
  );
}
