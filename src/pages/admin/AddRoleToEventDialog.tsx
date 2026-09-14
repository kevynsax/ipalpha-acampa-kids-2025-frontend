import { useEffect, useMemo, useRef, useState } from "react";
import { createRole, updateEvent, type CampEvent, type ScheduleRole, type ScheduleRoleInput } from "../../api/schedule";
import Dialog from "../../components/Dialog";
import RoleForm from "./RoleForm";

interface AddRoleToEventDialogProps {
  token: string;
  open: boolean;
  event: CampEvent;
  roles: ScheduleRole[];
  onClose: () => void;
}

const normalize = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

/**
 * The "+" on 🎯 Funções of an event: link a função that ALREADY EXISTS, or
 * create one on the spot.
 *
 * Reusing is the default — the catalogue is shared between every event, so a
 * new "Base" for each one would fragment the escala. The list is therefore the
 * first screen; creating is one button away and asks ONLY for the basics
 * (name, ícone, how it is escalada) — the instructions and the preparação are
 * written afterwards, on the event, where their ✏️ opens the editor.
 */
export default function AddRoleToEventDialog({ token, open, event, roles, onClose }: AddRoleToEventDialogProps) {
  const [step, setStep] = useState<"pick" | "create">("pick");
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setStep("pick");
    setQ("");
    setError(null);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  /** already in this event → not offered again */
  const available = useMemo(() => {
    const here = new Set(event.roles);
    const nq = normalize(q.trim());
    return roles
      .filter((r) => !here.has(r.id) && (!nq || normalize(r.name).includes(nq)))
      .sort((a, b) => a.name.localeCompare(b.name, "pt-BR", { sensitivity: "base" }));
  }, [roles, event.roles, q]);

  const alreadyHere = roles.length - roles.filter((r) => !event.roles.includes(r.id)).length;

  /** links an existing função to the event (assignments of the other roles are untouched) */
  async function add(roleId: string) {
    setBusy(true);
    setError(null);
    try {
      await updateEvent(token, event.id, { roles: [...event.roles, roleId] });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Algo deu errado.");
    } finally {
      setBusy(false);
    }
  }

  /** creates the função and links it to this event in one go */
  async function handleCreate(input: ScheduleRoleInput) {
    setBusy(true);
    setError(null);
    try {
      const created = await createRole(token, input);
      await updateEvent(token, event.id, { roles: [...event.roles, created.id] });
      onClose();
    } catch (err) {
      // the dialog stays open so the typed função isn't lost
      setError(err instanceof Error ? err.message : "Algo deu errado.");
      setStep("pick");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Dialog open={open} onClose={() => !busy && onClose()} title={`Adicionar função em ${event.title}`} width={520}>
        <div className="picker">
          <h2 className="cat-form__title">🎯 Adicionar função</h2>
          <p className="cat-hint">
            em <strong>{event.emoji} {event.title}</strong> — escolha uma função que já existe ou crie uma nova.
          </p>

          <input
            ref={inputRef}
            className="cat-input"
            type="search"
            placeholder="Buscar função…"
            value={q}
            disabled={busy}
            onChange={(e) => setQ(e.target.value)}
            aria-label="Buscar função"
          />

          {error && <p className="message message--error">{error}</p>}

          {available.length === 0 ? (
            <p className="opt-empty">
              {roles.length === 0
                ? "Nenhuma função cadastrada ainda."
                : q.trim()
                  ? "Nenhuma função com esse nome."
                  : "Todas as funções já estão neste evento."}
            </p>
          ) : (
            <ul className="picker__list" role="listbox">
              {available.map((r) => (
                <li key={r.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={false}
                    className="picker__item"
                    disabled={busy}
                    onClick={() => add(r.id)}
                  >
                    <span className="picker__name">
                      <span aria-hidden="true">{r.emoji}</span> {r.name}
                    </span>
                    {r.forEveryone && <span className="slot-item__badge slot-item__badge--everyone">👥 toda a equipe</span>}
                    {!r.forEveryone && r.detailFromTeam && <span className="slot-item__badge">🏳️ detalhe = time</span>}
                  </button>
                </li>
              ))}
            </ul>
          )}

          {alreadyHere > 0 && (
            <p className="cat-hint">
              {alreadyHere === 1 ? "1 função já está neste evento." : `${alreadyHere} funções já estão neste evento.`}
            </p>
          )}

          <div className="cat-form__actions">
            <button type="button" className="button button--secondary" disabled={busy} onClick={onClose}>
              Cancelar
            </button>
            <button type="button" className="button button--primary" disabled={busy} onClick={() => setStep("create")}>
              + Nova função
            </button>
          </div>
        </div>
      </Dialog>

      {/* only the basics — as in the ✏️ of a função on the event */}
      <Dialog open={open && step === "create"} onClose={() => !busy && setStep("pick")} title="Nova função" width={680} dismissible={false}>
        <RoleForm embedded hideDocs token={token} busy={busy} onSubmit={handleCreate} onCancel={() => setStep("pick")} />
      </Dialog>
    </>
  );
}
