import { useMemo, useState } from "react";
import { UndoGlyph } from "../components/Glyph";
import { checkinStaff, undoCheckinStaff, type Staff } from "../api/staff";
import { useConfirm } from "../components/ConfirmDialog";
import Breadcrumbs from "../components/Breadcrumbs";
import { roleMeta } from "../roles";
import { useRoute } from "../router";
import { useCollection } from "../store";

interface StaffCheckinPageProps {
  token: string;
  /** merged admin Check-in landing page */
  checkinHomePath?: string;
}

/** Departure day roll call for the team: name + one tap to mark as arrived. */
export default function StaffCheckinPage({ token, checkinHomePath }: StaffCheckinPageProps) {
  const staff = useCollection("staff");
  const { navigate } = useRoute();
  const confirm = useConfirm();
  const [search, setSearch] = useState("");
  const [pending, setPending] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const people = useMemo(() => {
    if (!staff) return [];
    const q = normalize(search);
    return staff
      .filter((s) => s.active)
      .filter((s) => !q || normalize(s.name).includes(q))
      // who still has to arrive first, then the ones already here — alphabetical within each
      .sort((a, b) => Number(!!a.checkin) - Number(!!b.checkin) || a.name.localeCompare(b.name, "pt-BR", { sensitivity: "base" }));
  }, [staff, search]);

  const counts = useMemo(() => {
    const active = staff?.filter((s) => s.active) ?? [];
    return { total: active.length, arrived: active.filter((s) => s.checkin).length };
  }, [staff]);

  async function toggle(s: Staff) {
    if (pending.has(s.id)) return;
    if (s.checkin && !(await confirm({ emoji: <UndoGlyph />, title: `Desfazer o check-in de ${s.name.split(" ")[0]}?`, confirmLabel: "Desfazer", danger: true }))) return;
    setPending((p) => new Set(p).add(s.id));
    setError(null);
    try {
      if (s.checkin) await undoCheckinStaff(token, s.id);
      else await checkinStaff(token, s.id);
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

  if (!staff) {
    return (
      <div className="admin-page">
        {checkinHomePath && <Breadcrumbs items={[{ label: "Check-in", onClick: () => navigate(checkinHomePath) }, { label: "Equipe" }]} />}
        <p className="opt-empty">Sincronizando com o servidor… 🏕️</p>
      </div>
    );
  }

  const pct = counts.total ? Math.round((counts.arrived / counts.total) * 100) : 0;

  return (
    <div className="admin-page">
      {checkinHomePath && <Breadcrumbs items={[{ label: "Check-in", onClick: () => navigate(checkinHomePath) }, { label: "Equipe" }]} />}
      <header className="admin-head">
        <h1 className="admin-title detail-title">
          <img className="audience-icon" src={roleMeta("staff").icon} alt="" aria-hidden="true" style={{ height: 36, width: "auto" }} />
          Check-in da equipe
        </h1>
        <span className="checkin-progress" title="Pessoas da equipe que já chegaram">
          ✅ {counts.arrived}/{counts.total}
        </span>
      </header>

      <div className="vehicle__progress" role="progressbar" aria-valuemin={0} aria-valuemax={counts.total} aria-valuenow={counts.arrived} aria-label="Equipe que chegou">
        <span className="vehicle__bar" aria-hidden="true">
          <span className="vehicle__bar-fill" style={{ width: `${pct}%` }} />
        </span>
        <span className="vehicle__pct">{pct}%</span>
      </div>

      {error && <p className="message message--error">{error}</p>}

      <input className="cat-input" type="search" placeholder="Buscar pelo nome…" value={search} onChange={(e) => setSearch(e.target.value)} />

      {counts.total === 0 && <p className="opt-empty">Ninguém na equipe ainda.</p>}
      {counts.total > 0 && people.length === 0 && <p className="opt-empty">Nenhum resultado. 🔍</p>}

      <ul className="bus-list">
        {people.map((s) => {
          const on = !!s.checkin;
          const busy = pending.has(s.id);
          return (
            <li key={s.id}>
              <button type="button" className={`bus-row ${on ? "bus-row--on" : ""}`} disabled={busy} aria-pressed={on} onClick={() => toggle(s)}>
                <span className={`bus-row__check ${on ? "bus-row__check--on" : ""}`} aria-hidden="true">
                  {on ? "✓" : ""}
                </span>
                <span className="bus-row__body">
                  <span className="bus-row__name">{s.name}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}
