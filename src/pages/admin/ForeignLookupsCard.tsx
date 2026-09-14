import { useState } from "react";
import { resetForeignLookups } from "../../api/settings";
import { useConfirm } from "../../components/ConfirmDialog";
import { useCollection } from "../../store";

interface ForeignLookupsCardProps {
  token: string;
}

/**
 * Settings → Geral: staff who scanned ≥3 kids outside their scope via the
 * emergency QR FAB. Hidden while the list is empty (nobody at the threshold).
 * "Zerar contadores" unblocks anyone at ≥5 and clears the SMS-alert mark.
 */
export default function ForeignLookupsCard({ token }: ForeignLookupsCardProps) {
  const settings = useCollection("settings");
  const offenders = settings?.foreignLookupOffenders ?? [];
  const confirm = useConfirm();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!settings || offenders.length === 0) return null;

  async function reset() {
    if (busy) return;
    if (
      !(await confirm({
        title: "Zerar contadores?",
        message: "Isso zera o contador de todo mundo (e libera quem estava bloqueado). O histórico de leituras continua no servidor para auditoria.",
        confirmLabel: "Zerar",
        emoji: "🔍",
      }))
    ) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await resetForeignLookups(token);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Algo deu errado.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="cat-form">
      <div className="cat-form__head">
        <h2 className="cat-form__title">🔍 Leituras fora do escopo</h2>
        <button type="button" className="button button--secondary" disabled={busy} onClick={() => void reset()}>
          Zerar contadores
        </button>
      </div>
      <p className="cat-hint">
        Pessoas da equipe que leram <strong>3 ou mais</strong> crianças que não são do quarto delas pelo botão de busca.
        A partir de 3 o admin recebe um SMS; a partir de 5 o acesso a crianças de fora fica bloqueado até zerar.
      </p>
      <ul className="foreign-lookup-list">
        {offenders.map((o) => (
          <li key={o.staffId} className={`foreign-lookup-list__item ${o.blocked ? "foreign-lookup-list__item--blocked" : ""}`}>
            <div>
              <strong>{o.name}</strong>
              <span className="foreign-lookup-list__count">
                {o.count} criança{o.count === 1 ? "" : "s"}
                {o.blocked ? " · bloqueado" : ""}
              </span>
            </div>
            {o.names.length > 0 && <p className="foreign-lookup-list__names">{o.names.join(", ")}</p>}
          </li>
        ))}
      </ul>
      {error && <p className="message message--error">{error}</p>}
    </section>
  );
}
