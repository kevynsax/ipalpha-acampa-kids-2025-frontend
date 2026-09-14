import { useMemo, useState, type FormEvent } from "react";
import { addScore, resetScore } from "../api/scores";
import { contrastText, type Team } from "../api/teams";
import Dialog from "../components/Dialog";
import ScanPointsDialog from "../components/ScanPointsDialog";
import { useCollection, useCollectionOrEmpty } from "../store";
import { QrGlyph } from "../components/Glyph";

interface ScoreboardPageProps {
  token: string;
  /** the logged-in user's id — a score helper may delete only their own lines */
  /** admin / game organizer: may give, take, zero and delete any line */
  canEdit: boolean;
  /** score helper (or anyone who canEdit): may scan QR codes in bulk (points by event) and delete their own scan lines — nothing else */
  canScan: boolean;
}

type Pending = { team: Team; sign: 1 | -1 } | { team: Team; sign: 0 };

/**
 * Placar: every team ranked by its points, with the ledger underneath. Game
 * organizers (Settings → Placar) and the admin give / take points — each with
 * an optional note of why — zero a team, or delete a wrong line. Score
 * helpers only scan QR codes in bulk (the 📷 FAB) and undo their own scans.
 */
export default function ScoreboardPage({ token, canEdit, canScan }: ScoreboardPageProps) {
  const teams = useCollection("teams");
  const scores = useCollectionOrEmpty("scores");
  const [pending, setPending] = useState<Pending | null>(null);
  const [scanning, setScanning] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totals = useMemo(() => {
    const m = new Map<string, number>();
    for (const e of scores) m.set(e.teamId, (m.get(e.teamId) ?? 0) + e.points);
    return m;
  }, [scores]);
  const ranked = useMemo(() => (teams ?? []).slice().sort((a, b) => (totals.get(b.id) ?? 0) - (totals.get(a.id) ?? 0) || a.order - b.order), [teams, totals]);
  const top = ranked.length ? Math.max(1, ...ranked.map((t) => totals.get(t.id) ?? 0)) : 1;

  async function withBusy(fn: () => Promise<void>) {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Algo deu errado.");
    } finally {
      setBusy(false);
    }
  }

  async function submitPoints(points: number, note: string) {
    if (!pending) return;
    const { team, sign } = pending;
    await withBusy(async () => {
      if (sign === 0) await resetScore(token, team.id, note);
      else await addScore(token, { teamId: team.id, points: sign * Math.abs(points), note });
      setPending(null);
    });
  }

  if (!teams) {
    return (
      <div className="admin-page">
        <p className="opt-empty">Sincronizando com o servidor… 🏕️</p>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <header className="admin-head">
        <h1 className="admin-title">🏆 Placar</h1>
      </header>
      {canEdit && <p className="admin-intro">➕ / ➖ lançam pontos, 🔄 zera o time, <QrGlyph /> dá pontos lendo os crachás.</p>}
      {!canEdit && canScan && <p className="admin-intro">Toque em <QrGlyph /> para dar pontos em massa lendo os crachás das crianças no evento que está acontecendo.</p>}

      {error && <p className="message message--error">{error}</p>}

      {teams.length === 0 && <p className="opt-empty">Nenhum time cadastrado ainda. (Configurações → Times)</p>}

      <ol className="score-list">
        {ranked.map((t, i) => {
          const pts = totals.get(t.id) ?? 0;
          const pct = Math.max(0, Math.min(100, (pts / top) * 100));
          return (
            <li key={t.id} className={`score-card ${i === 0 && pts > 0 ? "score-card--leader" : ""}`} style={{ borderLeftColor: t.color }}>
              <span className="score-card__rank" aria-label={`${i + 1}º lugar`}>
                {i === 0 && pts > 0 ? "🥇" : i === 1 && pts > 0 ? "🥈" : i === 2 && pts > 0 ? "🥉" : `${i + 1}º`}
              </span>
              <div className="score-card__body">
                <span className="score-card__name">{t.name}</span>
                <span className="score-card__bar" aria-hidden="true">
                  <span className="score-card__fill" style={{ width: `${pct}%`, background: t.color }} />
                </span>
              </div>
              <span className="score-card__points" style={{ background: t.color, color: contrastText(t.color) }}>
                {pts}
              </span>
              {canEdit && (
                <span className="score-card__actions">
                  <button type="button" className="icon-btn score-btn" title="Dar pontos" aria-label={`Dar pontos a ${t.name}`} disabled={busy} onClick={() => setPending({ team: t, sign: 1 })}>
                    ➕
                  </button>
                  <button type="button" className="icon-btn score-btn" title="Tirar pontos" aria-label={`Tirar pontos de ${t.name}`} disabled={busy} onClick={() => setPending({ team: t, sign: -1 })}>
                    ➖
                  </button>
                  <button type="button" className="icon-btn icon-btn--danger score-btn" title="Zerar time" aria-label={`Zerar ${t.name}`} disabled={busy || pts === 0} onClick={() => setPending({ team: t, sign: 0 })}>
                    🔄
                  </button>
                </span>
              )}
            </li>
          );
        })}
      </ol>

      {pending && <PointsDialog pending={pending} current={totals.get(pending.team.id) ?? 0} busy={busy} onSubmit={submitPoints} onClose={() => setPending(null)} />}

      {canScan && teams.length > 0 && (
        <button type="button" className="fab fab--icon" title="Dar pontos em massa lendo os crachás" aria-label="Dar pontos em massa lendo os crachás" onClick={() => setScanning(true)}>
          <span className="fab__icon" aria-hidden="true">
            <QrGlyph size="1.5em" />
          </span>
        </button>
      )}
      {scanning && <ScanPointsDialog token={token} onClose={() => setScanning(false)} />}
    </div>
  );
}

const QUICK = [1, 2, 3, 5, 10, 20, 50, 100];

function PointsDialog({ pending, current, busy, onSubmit, onClose }: { pending: Pending; current: number; busy: boolean; onSubmit: (points: number, note: string) => Promise<void>; onClose: () => void }) {
  const { team, sign } = pending;
  const [points, setPoints] = useState<number>(10);
  const [note, setNote] = useState("");
  const reset = sign === 0;
  const title = reset ? `🔄 Zerar ${team.name}` : sign > 0 ? `➕ Dar pontos a ${team.name}` : `➖ Tirar pontos de ${team.name}`;
  const valid = reset || (Number.isInteger(points) && points > 0);

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!valid || busy) return;
    void onSubmit(points, note.trim());
  }

  return (
    <Dialog open onClose={onClose} title={title} width={480}>
      <form className="cat-form" onSubmit={submit}>
        <h2 className="cat-form__title" style={{ borderLeft: `8px solid ${team.color}`, paddingLeft: 12 }}>
          {title}
        </h2>
        {reset ? (
          <p className="cat-hint">
            Zerar não apaga o histórico.
          </p>
        ) : (
          <div className="cat-field">
            <span className="cat-field__label">Quantos pontos?</span>
            <div className="chip-group">
              {QUICK.map((q) => (
                <button key={q} type="button" className={`chip-toggle chip-toggle--small ${points === q ? "chip-toggle--on" : ""}`} aria-pressed={points === q} disabled={busy} onClick={() => setPoints(q)}>
                  {q}
                </button>
              ))}
            </div>
            <input className="cat-input" type="number" min={1} max={100000} step={1} value={points} onChange={(e) => setPoints(Number(e.target.value))} disabled={busy} aria-label="Pontos" />
          </div>
        )}
        <label className="cat-field">
          <span className="cat-field__label">Observação (opcional)</span>
          <input className="cat-input" value={note} onChange={(e) => setNote(e.target.value)} placeholder={reset ? "Por que zerar?" : "Ex.: Gincana da piscina — 1º lugar"} maxLength={200} disabled={busy} autoFocus />
        </label>
        <div className="cat-form__actions">
          <button type="button" className="button button--secondary" disabled={busy} onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className={`button ${reset ? "button--danger" : "button--primary"}`} disabled={busy || !valid}>
            {reset ? "Zerar" : sign > 0 ? `Dar ${points} ponto${points !== 1 ? "s" : ""}` : `Tirar ${points} ponto${points !== 1 ? "s" : ""}`}
          </button>
        </div>
      </form>
    </Dialog>
  );
}

function fmtPoints(n: number): string {
  return n > 0 ? `+${n}` : `${n}`;
}

