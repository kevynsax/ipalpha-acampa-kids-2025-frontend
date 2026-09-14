import { useState } from "react";
import { goBack, useRoute } from "../../router";
import { useCollection } from "../../store";
import { useConfirm } from "../../components/ConfirmDialog";
import {
  createTransport,
  deleteTransport,
  busColorName,
  updateTransport,
  type Transport,
  type TransportInput,
} from "../../api/transports";
import { ICONS } from "../../icons";
import BusLogo from "../../components/BusLogo";
import CarLogo from "../../components/CarLogo";
import TransportForm from "./TransportForm";

interface TransportsPageProps {
  token: string;
}

/** URL → what to show:  /transports · /transports/new · /transports/:id/edit */
type Mode = { kind: "list" } | { kind: "create" } | { kind: "edit"; id: string };
function modeOf(segments: string[]): Mode {
  const [, id, action] = segments;
  if (!id) return { kind: "list" };
  if (id === "new") return { kind: "create" };
  if (action === "edit") return { kind: "edit", id };
  return { kind: "list" };
}

/** A vehicle mark: the bus logo in its own colour with its number, or the car logo. */
function TransportBadge({ t, size = 40 }: { t: Transport; size?: number }) {
  return t.kind === "car" ? <CarLogo size={size} /> : <BusLogo color={t.color ?? "#0f9a8a"} number={t.number} size={size} />;
}

/**
 * Admin-only "Transporte": one flat list of every vehicle — the buses (colour
 * + number) and the cars that bring the kids to camp. Each row carries its
 * own edit / delete buttons; "+ Novo" sits in the top-right corner.
 */
export default function TransportsPage({ token }: TransportsPageProps) {
  const transports = useCollection("transports");
  const { segments, navigate } = useRoute();
  const mode = modeOf(segments);
  const confirm = useConfirm();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const editing = mode.kind === "edit" ? transports?.find((t) => t.id === mode.id) ?? null : null;

  async function withBusy<T>(fn: () => Promise<T>): Promise<T> {
    setBusy(true);
    setError(null);
    try {
      return await fn();
    } finally {
      setBusy(false);
    }
  }

  async function handleCreate(input: TransportInput) {
    await withBusy(() => createTransport(token, input));
    navigate("/transports", { replace: true });
  }

  async function handleEdit(input: TransportInput) {
    if (mode.kind !== "edit") return;
    await withBusy(() => updateTransport(token, mode.id, input));
    navigate("/transports", { replace: true });
  }

  async function handleDelete(t: Transport) {
    if (!(await confirm({ emoji: "🗑️", title: `Excluir "${t.label}"?`, message: "Isso não pode ser desfeito.", confirmLabel: "Excluir", danger: true }))) return;
    await withBusy(() => deleteTransport(token, t.id)).catch((e) => setError(e.message));
  }

  if (!transports) {
    return (
      <div className="admin-page">
        {error ? <p className="message message--error">{error}</p> : <p className="opt-empty">Sincronizando com o servidor… 🏕️</p>}
      </div>
    );
  }

  // ── create / edit ────────────────────────────────────────────────────

  if (mode.kind === "create" || mode.kind === "edit") {
    return (
      <div className="admin-page">
        <header className="admin-head transport-head">
          <h1 className="admin-title">
            <img className="admin-title__icon" src={ICONS.transport} alt="" aria-hidden="true" />
            Transporte
          </h1>
        </header>
        {error && <p className="message message--error">{error}</p>}
        {mode.kind === "edit" && !editing ? (
          <p className="opt-empty">Transporte não encontrado.</p>
        ) : (
          <TransportForm
            key={editing?.id ?? "new"}
            transport={editing ?? undefined}
            busy={busy}
            onSubmit={mode.kind === "create" ? handleCreate : handleEdit}
            onCancel={() => goBack("/transports")}
          />
        )}
      </div>
    );
  }

  // ── the list ─────────────────────────────────────────────────────────

  return (
    <div className="admin-page">
      <header className="admin-head transport-head">
        <h1 className="admin-title">
          <img className="admin-title__icon" src={ICONS.transport} alt="" aria-hidden="true" />
          Transporte
        </h1>
        <div className="admin-head__actions">
          <button type="button" className="button button--primary admin-head__new" disabled={busy} onClick={() => navigate("/transports/new")}>
            + Novo
          </button>
        </div>
      </header>

      {error && <p className="message message--error">{error}</p>}

      {transports.length === 0 ? (
        <div className="admin-empty">
          <img className="admin-empty__img" src={ICONS.transport} alt="" aria-hidden="true" />
          <p>
            Cadastre cada <strong>ônibus</strong> (com sua cor e número) e cada <strong>carro</strong> que traz as
            crianças ao acampamento.
          </p>
          <button type="button" className="button button--primary" onClick={() => navigate("/transports/new")}>
            + Criar o primeiro
          </button>
        </div>
      ) : (
        <ul className="staff-list transport-list">
          {transports.map((t) => (
            <li key={t.id} className="staff-card">
              <TransportBadge t={t} size={40} />
              <div className="transport-row__body">
                <span className="transport-row__name">{t.label}</span>
                {t.kind === "bus" && (
                  <span className="transport-row__meta">
                    <span className="transport-dot" style={{ background: t.color ?? "#0f9a8a" }} aria-hidden="true" />
                    {busColorName(t.color) ?? t.color}
                  </span>
                )}
              </div>
              <div className="transport-row__actions">
                <button type="button" className="icon-btn" title="Editar transporte" disabled={busy} onClick={() => navigate(`/transports/${t.id}/edit`)}>
                  <span className="pencil" aria-hidden="true">✏️</span>
                </button>
                <button type="button" className="icon-btn icon-btn--danger" title="Excluir transporte" disabled={busy} onClick={() => handleDelete(t)}>
                  🗑️
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
