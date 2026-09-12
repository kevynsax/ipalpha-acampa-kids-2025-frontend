import { useEffect, useMemo, useState } from "react";
import { updateSettings, type ParentContact } from "../../api/settings";
import { useCollection, useCollectionOrEmpty } from "../../store";
import StaffPicker from "./StaffPicker";

interface ParentContactsPageProps {
  token: string;
}

interface ContactDraft {
  id: string | null;
  title: string;
  staffId: string;
}

const EMPTY_DRAFT: ContactDraft = { id: null, title: "", staffId: "" };
function contactId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `contact-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

const fmt = new Intl.DateTimeFormat("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

/** When the parents actually see these contacts: only during the camp (check-in start → end of the last event). */
function ParentWindowNote({ window: w }: { window: { from: string | null; until: string | null; open: boolean } }) {
  const range = w.from && w.until ? `de ${fmt.format(new Date(w.from))} até ${fmt.format(new Date(w.until))}` : null;
  return (
    <p className={`message ${w.open ? "message--ok" : "message--warn"}`}>
      {w.open ? "🟢" : "🕒"} Os pais só veem estes contatos <strong>durante o acampamento</strong> — do início do check-in das crianças até o fim do último evento da programação
      {range ? <>: <strong>{range}</strong></> : " (defina a janela de check-in e a programação)"}.{" "}
      {w.open ? "Visível para os pais agora." : "Fora desse período os pais veem só os dados da própria criança."}
    </p>
  );
}

/** Admin-only list of the staff contacts shown to parents. */
export default function ParentContactsPage({ token }: ParentContactsPageProps) {
  const staff = useCollectionOrEmpty("staff");
  const settings = useCollection("settings");
  const [contacts, setContacts] = useState<ParentContact[]>([]);
  const [draft, setDraft] = useState<ContactDraft>(EMPTY_DRAFT);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const staffById = useMemo(() => new Map(staff.map((person) => [person.id, person])), [staff]);
  const selectedStaff = draft.staffId ? staffById.get(draft.staffId) ?? null : null;
  const editing = draft.id !== null;
  const validDraft = draft.title.trim().length > 0 && !!selectedStaff?.active;

  useEffect(() => {
    if (settings) setContacts(settings.parentContacts);
  }, [settings]);

  function resetDraft() {
    setDraft(EMPTY_DRAFT);
    setPickerOpen(false);
  }

  async function persist(nextContacts: ParentContact[]): Promise<boolean> {
    if (busy) return false;
    const previous = contacts;
    setBusy(true);
    setError(null);
    setContacts(nextContacts);
    try {
      await updateSettings(token, { parentContacts: nextContacts });
      return true;
    } catch (cause) {
      setContacts(previous);
      setError(cause instanceof Error ? cause.message : "Algo deu errado.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function submitDraft(e: React.FormEvent) {
    e.preventDefault();
    if (!validDraft || busy) return;
    const nextContact: ParentContact = {
      id: draft.id ?? contactId(),
      title: draft.title.trim(),
      staffId: draft.staffId,
    };
    const nextContacts = draft.id
      ? contacts.map((contact) => (contact.id === draft.id ? nextContact : contact))
      : [...contacts, nextContact];
    if (await persist(nextContacts)) resetDraft();
  }

  function edit(contact: ParentContact) {
    setDraft({ ...contact });
  }

  async function remove(id: string) {
    if (await persist(contacts.filter((contact) => contact.id !== id)) && draft.id === id) resetDraft();
  }

  async function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= contacts.length) return;
    const next = [...contacts];
    [next[index], next[target]] = [next[target], next[index]];
    await persist(next);
  }

  if (!settings && !error) {
    return (
      <div className="admin-page">
        <p className="opt-empty">Carregando configurações… 📞</p>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <header className="admin-head">
        <h1 className="admin-title">📞 Important contacts</h1>
      </header>
      <p className="admin-intro">
        Escolha quem os pais poderão procurar e dê um <strong>título claro</strong> para o assunto de cada contato. Os pais veem o nome, o celular e um botão de WhatsApp de cada pessoa.
      </p>
      {settings && <ParentWindowNote window={settings.parentWindow} />}

      {error && <p className="message message--error">{error}</p>}

      <form className="cat-form contact-form" onSubmit={submitDraft}>
        <h2 className="cat-form__title">{editing ? "✏️ Editar contato" : "➕ Novo contato"}</h2>
        <label className="cat-field">
          <span className="cat-field__label">Título</span>
          <input
            className="cat-input"
            placeholder="ex.: Coordenação do acampamento"
            value={draft.title}
            maxLength={80}
            disabled={busy}
            autoFocus
            onChange={(e) => setDraft((current) => ({ ...current, title: e.target.value }))}
          />
        </label>
        <div className="cat-field">
          <span className="cat-field__label">Pessoa da equipe</span>
          <button type="button" className="contact-person" disabled={busy} onClick={() => setPickerOpen(true)}>
            <span className="contact-person__icon" aria-hidden="true">👤</span>
            <span className="contact-person__body">
              <strong>{selectedStaff?.name ?? "Escolher pessoa"}</strong>
              <span>{selectedStaff ? "Toque para trocar" : "Busque na equipe ativa"}</span>
            </span>
            <span className="contact-person__action">{selectedStaff ? "Trocar" : "Escolher"}</span>
          </button>
        </div>
        <div className="cat-form__actions">
          {editing && (
            <button type="button" className="button button--secondary" disabled={busy} onClick={resetDraft}>
              Cancelar
            </button>
          )}
          <button type="submit" className="button button--primary" disabled={busy || !validDraft}>
            {busy ? "Salvando…" : editing ? "Atualizar contato" : "Adicionar contato"}
          </button>
        </div>
      </form>

      <section className="contacts-section" aria-labelledby="contacts-list-title">
        <div className="list-head">
          <h2 id="contacts-list-title" className="cat-form__title">
            Contatos cadastrados <span className="cat-tab__count">{contacts.length}</span>
          </h2>
        </div>
        {contacts.length === 0 ? (
          <p className="opt-empty">Nenhum contato cadastrado ainda.</p>
        ) : (
          <ol className="contact-list">
            {contacts.map((contact, index) => {
              const person = staffById.get(contact.staffId);
              return (
                <li key={contact.id} className="contact-item">
                  <div className="contact-item__main">
                    <span className="contact-item__icon" aria-hidden="true">👤</span>
                    <div className="contact-item__body">
                      <h3>{contact.title}</h3>
                      <p>{person?.name ?? "Pessoa não encontrada"}</p>
                    </div>
                  </div>
                  <div className="contact-item__actions" aria-label={`Ações de ${contact.title}`}>
                    <button type="button" className="icon-btn" title="Mover para cima" disabled={busy || index === 0} onClick={() => void move(index, -1)}>▲</button>
                    <button type="button" className="icon-btn" title="Mover para baixo" disabled={busy || index === contacts.length - 1} onClick={() => void move(index, 1)}>▼</button>
                    <button type="button" className="icon-btn" title="Editar" disabled={busy} onClick={() => edit(contact)}>✏️</button>
                    <button type="button" className="icon-btn icon-btn--danger" title="Remover" disabled={busy} onClick={() => void remove(contact.id)}>🗑️</button>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </section>

      <p className="footer-note">O telefone vem do cadastro da equipe. Quem entra nesta lista passa a ter acesso ao app fora da janela da equipe (como os organizadores).</p>

      <StaffPicker
        open={pickerOpen}
        title="Escolher pessoa da equipe"
        staff={staff}
        occupied={new Map()}
        onPick={(staffId) => {
          setDraft((current) => ({ ...current, staffId }));
          setPickerOpen(false);
        }}
        onClose={() => setPickerOpen(false)}
      />
    </div>
  );
}
