import { useEffect, useMemo, useRef, useState } from "react";
import { createRole, type ScheduleRole, type ScheduleRoleInput } from "../../api/schedule";
import AutoRoleBadge from "../../components/AutoRoleBadge";
import Dialog from "../../components/Dialog";
import RoleForm from "./RoleForm";
import { ICONS } from "../../icons";

interface AddRoleDialogProps {
  token: string;
  open: boolean;
  /** the whole catalogue — what can be reused */
  roles: ScheduleRole[];
  /** funções already linked where we are adding: not offered again */
  excludeIds: string[];
  /** where the função is being added, spoken — "em 🏊 Piscina" / "neste evento" */
  where: string;
  /** links a função (existing or just created) where it was asked for */
  onAdd: (roleId: string) => Promise<void> | void;
  onClose: () => void;
}

const normalize = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

/**
 * The "+" on 🎯 Funções: first ASK what he wants — link a função that ALREADY
 * EXISTS or create one from scratch.
 *
 * Reusing is the default — the catalogue is shared between every event, so a
 * new "Base" for each one would fragment the escala. Creating shows the whole
 * form in one go (ícone, nome, quem faz, detalhe por pessoa) but WITHOUT the
 * instruções and the preparação — those are written later, via the ✏️.
 */
export default function AddRoleDialog({ token, open, roles, excludeIds, where, onAdd, onClose }: AddRoleDialogProps) {
  const [step, setStep] = useState<"choice" | "pick" | "create">("choice");
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setStep("choice");
    setQ("");
    setError(null);
  }, [open]);

  useEffect(() => {
    if (open && step === "pick") setTimeout(() => inputRef.current?.focus(), 50);
  }, [open, step]);

  /** already linked where we are adding → not offered again */
  const available = useMemo(() => {
    const here = new Set(excludeIds);
    const nq = normalize(q.trim());
    return roles
      .filter((r) => !here.has(r.id) && (!nq || normalize(r.name).includes(nq)))
      .sort((a, b) => a.name.localeCompare(b.name, "pt-BR", { sensitivity: "base" }));
  }, [roles, excludeIds, q]);

  const alreadyHere = roles.length - roles.filter((r) => !excludeIds.includes(r.id)).length;

  /** links an existing função where it was asked for */
  async function add(roleId: string) {
    setBusy(true);
    setError(null);
    try {
      await onAdd(roleId);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Algo deu errado.");
    } finally {
      setBusy(false);
    }
  }

  /** creates the função and links it where it was asked for, in one go */
  async function handleCreate(input: ScheduleRoleInput) {
    setBusy(true);
    setError(null);
    try {
      const created = await createRole(token, input);
      await onAdd(created.id);
      onClose();
    } catch (err) {
      // the dialog stays open so the typed função isn't lost
      setError(err instanceof Error ? err.message : "Algo deu errado.");
    } finally {
      setBusy(false);
    }
  }

  const closeAll = () => {
    if (!busy) onClose();
  };

  return (
    <>
      {/* 1 · what do you want: reuse a função or create one? */}
      <Dialog open={open && step === "choice"} onClose={closeAll} title="Adicionar função" width={520} className="sheet-dialog">
        <div className="cat-form cat-form--embedded">
          <span className="sheet__handle" aria-hidden="true" />
          <h2 className="cat-form__title change-room__title">🎯 Adicionar função</h2>
          <p className="cat-hint">{where}</p>
          <div className="big-options">
            <button type="button" className="big-option" disabled={busy} onClick={() => setStep("pick")}>
              <span className="big-option__emoji" aria-hidden="true">
                <img src={ICONS.chooseExisting} alt="" style={{ width: 34, height: 34 }} />
              </span>
              <span className="big-option__label">Escolher existente</span>
              <span className="big-option__hint">do catálogo de funções do acampamento</span>
            </button>
            <button type="button" className="big-option" disabled={busy} onClick={() => setStep("create")}>
              <span className="big-option__emoji" aria-hidden="true">
                <img src={ICONS.createNew} alt="" style={{ width: 34, height: 34 }} />
              </span>
              <span className="big-option__label">Criar nova</span>
              <span className="big-option__hint">instruções e preparação ficam para depois</span>
            </button>
          </div>
          {error && <p className="message message--error">{error}</p>}
          <div className="cat-form__actions">
            <button type="button" className="button button--secondary" disabled={busy} onClick={onClose}>
              Cancelar
            </button>
          </div>
        </div>
      </Dialog>

      {/* 2 · reuse: pick a função that already exists */}
      <Dialog open={open && step === "pick"} onClose={closeAll} title="Escolher função" width={520} className="picker-sheet-dialog">
        <div className="picker picker-sheet">
          <header className="picker-sheet__head">
            <span className="picker-sheet__handle" aria-hidden="true" />
            <h2 className="cat-form__title">🎯 Escolher função existente</h2>
            <p className="cat-hint">{where}</p>
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
          </header>

          <div className="picker-sheet__body">
            {available.length === 0 ? (
              <p className="opt-empty">
                {roles.length === 0
                  ? "Nenhuma função cadastrada ainda."
                  : q.trim()
                    ? "Nenhuma função com esse nome."
                    : "Todas as funções já estão aqui."}
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
                      <span className="picker__tags">
                        <AutoRoleBadge role={r} />
                        {r.detailFromTeam && <span className="slot-item__badge">🚩 detalhe = time</span>}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {alreadyHere > 0 && (
              <p className="cat-hint">
                {alreadyHere === 1 ? "1 função já está aqui." : `${alreadyHere} funções já estão aqui.`}
              </p>
            )}
          </div>

          <div className="cat-form__actions picker-sheet__actions">
            <button type="button" className="button button--secondary" disabled={busy} onClick={() => setStep("choice")}>
              ‹ Voltar
            </button>
            <button type="button" className="button button--primary" disabled={busy} onClick={() => setStep("create")}>
              + Criar nova
            </button>
          </div>
        </div>
      </Dialog>

      {/* 3 · create: the whole form in ONE go — ícone, nome, quem faz e o
             detalhe; instruções and preparação stay with the ✏️ (hideDocs) */}
      <Dialog open={open && step === "create"} onClose={() => !busy && setStep("choice")} title="Nova função" width={680} dismissible={false} className="sheet-dialog role-sheet">
        <RoleForm embedded hideDocs token={token} busy={busy} onSubmit={handleCreate} onCancel={() => setStep("choice")} />
      </Dialog>
    </>
  );
}
