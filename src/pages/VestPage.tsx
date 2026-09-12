import { useMemo, useState } from "react";
import { setStaffVest, type Staff, type VestAction } from "../api/staff";
import Breadcrumbs from "../components/Breadcrumbs";
import { useConfirm } from "../components/ConfirmDialog";
import WhatsAppButton from "../components/WhatsAppButton";
import { formatBrazilPhoneClient } from "../phoneFormat";
import { useRoute } from "../router";
import { useCollection } from "../store";
import { staffGreeting, whatsappLink } from "../whatsapp";

interface VestPageProps {
  token: string;
  /** the logged-in person's name (for the WhatsApp greeting) */
  myName: string;
  /** merged admin Check-in landing page */
  checkinHomePath?: string;
}

type Step = "pending" | "out" | "back";
const STEP: { key: Step; label: string; emoji: string }[] = [
  { key: "pending", label: "A entregar", emoji: "📦" },
  { key: "out", label: "Com a pessoa", emoji: "🦺" },
  { key: "back", label: "Devolvido", emoji: "✅" },
];

function stepOf(s: Staff): Step {
  if (!s.vest?.delivered) return "pending";
  return s.vest.returned ? "back" : "out";
}

/**
 * Team vest (colete) check-out / check-in: one row per team member with the
 * vest status — hand it out, take it back, undo either. For the admin and the
 * vest helpers (Settings → Coletes); the helper sees only name + phone.
 */
export default function VestPage({ token, myName, checkinHomePath }: VestPageProps) {
  const staff = useCollection("staff");
  const { navigate } = useRoute();
  const confirm = useConfirm();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Step | null>(null);
  const [pending, setPending] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const active = useMemo(() => staff?.filter((s) => s.active) ?? [], [staff]);
  const counts = useMemo(() => {
    const c: Record<Step, number> = { pending: 0, out: 0, back: 0 };
    for (const s of active) c[stepOf(s)]++;
    return c;
  }, [active]);

  const people = useMemo(() => {
    const q = normalize(search);
    return active
      .filter((s) => !filter || stepOf(s) === filter)
      .filter((s) => !q || normalize(s.name).includes(q))
      .sort((a, b) => a.name.localeCompare(b.name, "pt-BR", { sensitivity: "base" }));
  }, [active, search, filter]);

  async function run(s: Staff, action: VestAction) {
    if (pending.has(s.id)) return;
    const first = s.name.split(" ")[0];
    if (action === "undo-deliver" && !(await confirm({ emoji: "↩️", title: `Desfazer a entrega do colete de ${first}?`, confirmLabel: "Desfazer", danger: true }))) return;
    if (action === "undo-return" && !(await confirm({ emoji: "↩️", title: `Desfazer a devolução do colete de ${first}?`, confirmLabel: "Desfazer", danger: true }))) return;
    setPending((p) => new Set(p).add(s.id));
    setError(null);
    try {
      await setStaffVest(token, s.id, action);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Algo deu errado.");
    } finally {
      setPending((p) => {
        const n = new Set(p);
        n.delete(s.id);
        return n;
      });
    }
  }

  const crumbs = checkinHomePath ? <Breadcrumbs items={[{ label: "Check-in", onClick: () => navigate(checkinHomePath) }, { label: "Coletes" }]} /> : null;

  if (!staff) {
    return (
      <div className="admin-page">
        {crumbs}
        <p className="opt-empty">Sincronizando com o servidor… 🏕️</p>
      </div>
    );
  }

  const total = active.length;
  const pct = total ? Math.round((counts.back / total) * 100) : 0;

  return (
    <div className="admin-page">
      {crumbs}
      <header className="admin-head">
        <h1 className="admin-title">🦺 Coletes da equipe</h1>
        <span className="checkin-progress" title="Coletes já devolvidos">
          ✅ {counts.back}/{total}
        </span>
      </header>
      <p className="admin-intro">Entregue o colete no início e recolha no fim. Toque no botão para registrar — dá para desfazer.</p>

      <div className="vehicle__progress" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={counts.back} aria-label="Coletes devolvidos">
        <span className="vehicle__bar" aria-hidden="true">
          <span className="vehicle__bar-fill" style={{ width: `${pct}%` }} />
        </span>
        <span className="vehicle__pct">{pct}%</span>
      </div>

      {error && <p className="message message--error">{error}</p>}

      <div className="chip-group" role="group" aria-label="Filtrar por situação">
        {STEP.map((st) => {
          const on = filter === st.key;
          return (
            <button key={st.key} type="button" className={`chip-toggle ${on ? "chip-toggle--on" : ""}`} aria-pressed={on} onClick={() => setFilter(on ? null : st.key)}>
              {st.emoji} {st.label} <span className="cat-tab__count">{counts[st.key]}</span>
            </button>
          );
        })}
      </div>

      <input className="cat-input" type="search" placeholder="Buscar pelo nome…" value={search} onChange={(e) => setSearch(e.target.value)} />

      {total === 0 && <p className="opt-empty">Ninguém na equipe ainda.</p>}
      {total > 0 && people.length === 0 && <p className="opt-empty">Nenhum resultado. 🔍</p>}

      <ul className="bus-list">
        {people.map((s) => {
          const step = stepOf(s);
          const busy = pending.has(s.id);
          return (
            <li key={s.id} className={`bus-row vest-row vest-row--${step}`}>
              <span className={`bus-row__check ${step !== "pending" ? "bus-row__check--on" : ""}`} aria-hidden="true">
                {step === "back" ? "✓" : step === "out" ? "🦺" : ""}
              </span>
              <span className="bus-row__body">
                <span className="bus-row__name">{s.name}</span>
                <span className="bus-row__meta">
                  {s.phone ? formatBrazilPhoneClient(s.phone) : <em className="staff-card__missing">sem celular</em>}
                  {step === "out" && s.vest.delivered && <> · entregue {fmtStamp(s.vest.delivered.at)}</>}
                  {step === "back" && s.vest.returned && <> · devolvido {fmtStamp(s.vest.returned.at)}</>}
                </span>
              </span>
              {s.phone && <WhatsAppButton className="wa-btn--sm" href={whatsappLink(s.phone, staffGreeting({ toName: s.name, fromName: myName }))} label={`Falar com ${s.name.split(" ")[0]} no WhatsApp`} />}
              <span className="vest-row__actions">
                {step === "pending" && (
                  <button type="button" className="button button--secondary vest-row__btn" disabled={busy} onClick={() => void run(s, "deliver")}>
                    Entregar
                  </button>
                )}
                {step === "out" && (
                  <>
                    <button type="button" className="button button--primary vest-row__btn" disabled={busy} onClick={() => void run(s, "return")}>
                      Devolver
                    </button>
                    <button type="button" className="icon-btn" title="Desfazer entrega" aria-label={`Desfazer entrega de ${s.name}`} disabled={busy} onClick={() => void run(s, "undo-deliver")}>
                      ↩️
                    </button>
                  </>
                )}
                {step === "back" && (
                  <button type="button" className="icon-btn" title="Desfazer devolução" aria-label={`Desfazer devolução de ${s.name}`} disabled={busy} onClick={() => void run(s, "undo-return")}>
                    ↩️
                  </button>
                )}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function fmtStamp(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
}

function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}
