import { useEffect, useState } from "react";
import { updateSettings, type Settings } from "../../api/settings";
import { useCollection } from "../../store";
import CheckinReminderCard from "./CheckinReminderCard";
import CheckinTestTools from "./CheckinTestTools";
import KidsRoomsDraftCard from "./KidsRoomsDraftCard";

interface GeneralSettingsPageProps {
  token: string;
}

/** ISO instant → value for <input type="datetime-local"> (device clock) */
function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** datetime-local value → ISO instant (device clock), or null when empty */
function fromLocalInput(v: string): string | null {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

const sameMinute = (a: string | null, b: string | null) => (a ? Math.floor(new Date(a).getTime() / 60_000) : null) === (b ? Math.floor(new Date(b).getTime() / 60_000) : null);
const fmt = new Intl.DateTimeFormat("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

/**
 * Admin-only "Geral":
 *   1. the ACCESS window of the ordinary team (people on no list: not
 *      organizers, check-in helpers, medical team or parent contacts) — outside
 *      it the server sends them nothing and the app shows no data;
 *   2. the check-in reminder date (SMS to the whole team; also on Notificações);
 *   3. the "kids' rooms still a draft" switch (hides kids from caretakers, mutes room SMS);
 *   4. the check-in rehearsal tools (also on the Check-in settings page).
 */
export default function GeneralSettingsPage({ token }: GeneralSettingsPageProps) {
  const settings = useCollection("settings");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [from, setFrom] = useState("");
  const [until, setUntil] = useState("");

  function fill(s: Settings) {
    setFrom(toLocalInput(s.staffAccessWindow?.from ?? null));
    setUntil(toLocalInput(s.staffAccessWindow?.until ?? null));
  }
  useEffect(() => {
    if (settings) fill(settings);
  }, [settings]);

  if (!settings && !error) {
    return (
      <div className="admin-page">
        <p className="opt-empty">Carregando configurações… ⚙️</p>
      </div>
    );
  }

  const fromIso = fromLocalInput(from);
  const untilIso = fromLocalInput(until);
  const orderOk = !fromIso || !untilIso || new Date(fromIso) < new Date(untilIso);
  const current = settings?.staffAccessWindow ?? { from: null, until: null };
  const dirty = !!settings && (!sameMinute(fromIso, current.from) || !sameMinute(untilIso, current.until));
  const now = Date.now();
  const openNow = (!fromIso || new Date(fromIso).getTime() <= now) && (!untilIso || now < new Date(untilIso).getTime());

  async function save() {
    if (busy || !orderOk) return;
    setBusy(true);
    setError(null);
    setSaved(false);
    try {
      await updateSettings(token, { staffAccessWindow: { from: fromIso, until: untilIso } });
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Algo deu errado.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="admin-page">
      <header className="admin-head">
        <h1 className="admin-title">⚙️ Geral</h1>
      </header>
      {error && <p className="message message--error">{error}</p>}

      <form
        className="cat-form"
        onSubmit={(e) => {
          e.preventDefault();
          void save();
        }}
      >
        <h2 className="cat-form__title">🕒 Janela de acesso da equipe</h2>
        <p className="cat-hint">
          Nesse período a equipe (geral) tem acesso ao sistema, e só nesse período as notificações por SMS são enviadas para eles
        </p>
        <div className="cat-form__row staff-form__row">
          <label className="cat-field cat-field--grow">
            <span className="cat-field__label">Abre em</span>
            <input className="cat-input" type="datetime-local" value={from} disabled={busy} onChange={(e) => setFrom(e.target.value)} />
          </label>
          <label className="cat-field cat-field--grow">
            <span className="cat-field__label">Fecha em</span>
            <input className="cat-input" type="datetime-local" value={until} disabled={busy} onChange={(e) => setUntil(e.target.value)} />
          </label>
        </div>
        {!orderOk ? (
          <p className="cat-hint cat-hint--error">O fim da janela precisa ser depois do início.</p>
        ) : (
          <p className="cat-hint">
            {!fromIso && !untilIso
              ? "🟢 Sem restrição — a equipe acessa a qualquer hora."
              : openNow
                ? `🟢 Aberta agora${untilIso ? ` — fecha ${fmt.format(new Date(untilIso))}` : ""}`
                : fromIso && new Date(fromIso).getTime() > now
                  ? `🕒 Abre ${fmt.format(new Date(fromIso))}${untilIso ? ` até ${fmt.format(new Date(untilIso))}` : ""}`
                  : `⚫ Fechada${untilIso ? ` desde ${fmt.format(new Date(untilIso))}` : ""}`}
            .
          </p>
        )}
        {saved && <p className="message message--ok">✅ Janela de acesso salva.</p>}
        <div className="cat-form__actions">
          <button type="submit" className="button button--primary" disabled={!orderOk || !dirty || busy}>
            {busy ? "Salvando…" : "Salvar horário 🕒"}
          </button>
        </div>
      </form>

      <CheckinReminderCard token={token} />

      <KidsRoomsDraftCard token={token} />

      <CheckinTestTools token={token} />
    </div>
  );
}
