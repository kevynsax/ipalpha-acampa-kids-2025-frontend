import { useState } from "react";
import { createPrepSection, deletePrepSection, reorderPrepSections, updatePrepSection, type PrepSection, type PrepSectionInput } from "../../api/preparation";
import { useConfirm } from "../../components/ConfirmDialog";
import EmojiPicker from "../../components/EmojiPicker";
import { useAiAutoFill } from "../../hooks/useAiAutoFill";
import AiTitleButton from "../../components/AiTitleButton";
import RichHtml from "../../components/RichHtml";
import RichTextEditor from "../../components/RichTextEditor";
import { goBack, useRoute } from "../../router";
import { useCollection, useCollectionOrEmpty } from "../../store";

interface PreparationAdminPageProps {
  token: string;
}

const EMOJI_SUGGESTIONS = ["📌", "🎒", "👕", "🧢", "🧴", "💊", "⛪", "🚌", "🕐", "📱", "💤", "🍽️", "🌧️", "☀️", "🙏", "📸", "🧸", "🩹"];

/**
 * ⚙️ → Preparação: the general sections every team member reads before the
 * camp. Each section is a title + emoji + rich text (with pictures). Role
 * specific preparation ("Inspetor: roupa verde") is written on the role
 * itself (Programação → Funções).
 *
 *   /preparation            list          /preparation/new        new section
 *   /preparation/:id/edit   edit section
 */
export default function PreparationAdminPage({ token }: PreparationAdminPageProps) {
  const sections = useCollection("preparation");
  const roles = useCollectionOrEmpty("roles");
  const { segments, navigate } = useRoute();
  const confirm = useConfirm();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [, id, action] = segments;
  const mode: { kind: "list" } | { kind: "new" } | { kind: "edit"; id: string } =
    id === "new" ? { kind: "new" } : id && action === "edit" ? { kind: "edit", id } : { kind: "list" };

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

  async function handleCreate(input: PrepSectionInput) {
    await withBusy(() => createPrepSection(token, input));
    navigate("/preparation", { replace: true });
  }
  async function handleEdit(s: PrepSection, input: PrepSectionInput) {
    await withBusy(() => updatePrepSection(token, s.id, input));
    navigate("/preparation", { replace: true });
  }
  async function handleDelete(s: PrepSection) {
    if (!(await confirm({ emoji: "🗑️", title: `Excluir a seção "${s.title}"?`, message: "Isso não pode ser desfeito.", confirmLabel: "Excluir", danger: true }))) return;
    await withBusy(() => deletePrepSection(token, s.id)).catch(() => {});
    navigate("/preparation", { replace: true });
  }
  async function move(s: PrepSection, dir: -1 | 1) {
    if (!sections) return;
    const ids = sections.map((x) => x.id);
    const i = ids.indexOf(s.id);
    const j = i + dir;
    if (j < 0 || j >= ids.length) return;
    [ids[i], ids[j]] = [ids[j], ids[i]];
    await withBusy(() => reorderPrepSections(token, ids)).catch(() => {});
  }

  if (!sections) {
    return (
      <div className="admin-page">
        {error ? <p className="message message--error">{error}</p> : <p className="opt-empty">Sincronizando com o servidor… 🏕️</p>}
      </div>
    );
  }

  const editing = mode.kind === "edit" ? sections.find((s) => s.id === mode.id) : undefined;
  const rolesWithPrep = roles.filter((r) => r.preparation).length;
  const cancel = () => goBack("/preparation");

  return (
    <div className="admin-page">
      <header className="admin-head">
        <h1 className="admin-title">🎒 Preparação</h1>
        {mode.kind === "list" && (
          <button type="button" className="button button--primary admin-head__new" disabled={busy} onClick={() => navigate("/preparation/new")}>
            + Seção
          </button>
        )}
      </header>

      {mode.kind === "list" && (
        <>
          <p className="admin-intro">
            O que a equipe precisa saber, levar e vestir <strong>antes</strong> do acampamento.
          </p>
          <p className="cat-hint">
            🎯 A preparação <strong>por função</strong> (ex.: “Inspeção: roupa verde estilo exército com boné”) é escrita na própria função, em{" "}
            <button type="button" className="link-btn" onClick={() => navigate("/schedule/roles")}>
              Programação → Funções
            </button>
            . {rolesWithPrep > 0 ? `${rolesWithPrep} função${rolesWithPrep > 1 ? "ões têm" : " tem"} preparação escrita.` : "Nenhuma função tem preparação escrita ainda."}
          </p>
        </>
      )}

      {error && <p className="message message--error">{error}</p>}

      {mode.kind === "new" && <SectionForm token={token} busy={busy} onSubmit={handleCreate} onCancel={cancel} />}
      {mode.kind === "edit" && !editing && <p className="opt-empty">Seção não encontrada.</p>}
      {mode.kind === "edit" && editing && (
        <>
          <SectionForm key={editing.id} token={token} section={editing} busy={busy} onSubmit={(i) => handleEdit(editing, i)} onCancel={cancel} />
          <button type="button" className="link-danger" disabled={busy} onClick={() => handleDelete(editing)}>
            🗑️ Excluir seção "{editing.title}"
          </button>
        </>
      )}

      {mode.kind === "list" && sections.length === 0 && (
        <div className="admin-empty">
          <span className="admin-empty__emoji">🎒</span>
          <p>Nenhuma seção ainda. Comece com “O que levar”, “Chegada na igreja” ou “Uniforme da equipe”.</p>
          <button type="button" className="button button--primary" onClick={() => navigate("/preparation/new")}>
            + Criar seção
          </button>
        </div>
      )}

      {mode.kind === "list" && sections.length > 0 && (
        <div className="prep-sections">
          {sections.map((s, i) => (
            <article key={s.id} className="detail-card prep-section">
              <header className="prep-section__head">
                <h3 className="prep-section__title">
                  <span aria-hidden="true">{s.emoji}</span> {s.title}
                </h3>
                <div className="opt-item__actions">
                  <button type="button" className="icon-btn" title="Subir" aria-label="Subir" disabled={busy || i === 0} onClick={() => move(s, -1)}>
                    ↑
                  </button>
                  <button type="button" className="icon-btn" title="Descer" aria-label="Descer" disabled={busy || i === sections.length - 1} onClick={() => move(s, 1)}>
                    ↓
                  </button>
                  <button type="button" className="icon-btn" title="Editar" aria-label="Editar" disabled={busy} onClick={() => navigate(`/preparation/${s.id}/edit`)}>
                    ✏️
                  </button>
                </div>
              </header>
              {s.content ? <RichHtml html={s.content} /> : <p className="opt-empty">Sem conteúdo.</p>}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

interface SectionFormProps {
  token: string;
  section?: PrepSection;
  busy: boolean;
  onSubmit: (input: PrepSectionInput) => Promise<void>;
  onCancel: () => void;
}

function SectionForm({ token, section, busy, onSubmit, onCancel }: SectionFormProps) {
  const [title, setTitle] = useState(section?.title ?? "");
  const [emoji, setEmoji] = useState(section?.emoji ?? "📌");
  const [content, setContent] = useState(section?.content ?? "");
  const valid = title.trim().length > 0;
  const ai = useAiAutoFill({ token, context: "preparation", title, setTitle, emoji, setEmoji, defaultEmoji: "📌", existing: !!section });

  return (
    <form
      className="cat-form"
      onSubmit={(e) => {
        e.preventDefault();
        if (valid && !busy) void onSubmit({ title: title.trim(), emoji: emoji.trim() || "📌", content }).catch(() => {});
      }}
    >
      <h2 className="cat-form__title">{section ? "✏️ Editar seção" : "✨ Nova seção"}</h2>
      <div className="cat-form__row">
        <div className="cat-field cat-field--emoji">
          <span className="cat-field__label">Ícone</span>
          <EmojiPicker value={emoji} onChange={ai.pickEmoji} suggestions={EMOJI_SUGGESTIONS} disabled={busy} />
        </div>
        <label className="cat-field cat-field--grow">
          <span className="cat-field__label">Título{ai.suggesting && <span className="cat-field__ai"> ✨ sugerindo…</span>}</span>
          <span className="cat-input-wrap">
            <input className="cat-input" placeholder="ex.: O que levar na mala" value={title} maxLength={80} autoFocus disabled={busy} onChange={(e) => setTitle(e.target.value)} />
            <AiTitleButton html={content} busy={ai.suggesting} disabled={busy} onClick={() => void ai.regenerateTitle(content)} />
          </span>
        </label>
      </div>
      <div className="cat-field">
        <span className="cat-field__label">📝 Conteúdo</span>
        <p className="cat-hint">Texto, listas, links e fotos (🖼️ ou cole / arraste uma imagem). As fotos são reduzidas automaticamente.</p>
        <RichTextEditor token={token} value={content} onChange={setContent} disabled={busy} placeholder="ex.: Leve roupa de banho, toalha, protetor solar…" aiContext="preparation" aiTitle={title} onAiApplied={ai.onAiApplied} />
      </div>
      <div className="cat-form__actions">
        <button type="button" className="button button--secondary" onClick={onCancel} disabled={busy}>
          Cancelar
        </button>
        <button type="submit" className="button button--primary" disabled={!valid || busy}>
          {busy ? "Salvando…" : section ? "Salvar" : "Criar seção 🎉"}
        </button>
      </div>
    </form>
  );
}
