import { useEffect, useState } from "react";
import { updateSettings, type Settings } from "../../api/settings";
import { useCollection } from "../../store";
import { useRoute } from "../../router";

interface AccessWindowCardProps {
  token: string;
  /** which window this card edits */
  which: "staffAccessWindow" | "parentAccessWindow";
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

const META = {
  staffAccessWindow: {
    title: "🕒 Janela de acesso da equipe",
    hint: "Nesse período a equipe (geral) tem acesso ao sistema, e só nesse período as notificações por SMS são enviadas para eles.",
    who: "a equipe",
    toggle: "enrolments" as const,
    toggleLabel: "Boas-vindas e novas responsabilidades",
  },
  parentAccessWindow: {
    title: "👨‍👩‍👧 Janela de acesso dos pais",
    hint: "Nesse período os pais conseguem entrar no app. Os contatos da equipe eles só veem do check-in até o fim do último evento da programação, independente desta janela.",
    who: "os pais",
    toggle: "parentWelcome" as const,
    toggleLabel: "Boas-vindas aos pais",
  },
};

/**
 * Settings → Geral: one ACCESS window (team or parents). Outside it the
 * server sends those people nothing and logs them out. When the window
 * opens, the matching welcome SMS goes out (once per person) — IF its toggle
 * is on: the card says so, in yellow when it is off.
 */
export default function AccessWindowCard({ token, which }: AccessWindowCardProps) {
  const settings = useCollection("settings");
  const { navigate } = useRoute();
  const m = META[which];
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [from, setFrom] = useState("");
  const [until, setUntil] = useState("");

  function fill(s: Settings) {
    setFrom(toLocalInput(s[which]?.from ?? null));
    setUntil(toLocalInput(s[which]?.until ?? null));
  }
  useEffect(() => {
    if (settings) fill(settings);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings, which]);

  const fromIso = fromLocalInput(from);
  const untilIso = fromLocalInput(until);
  const orderOk = !fromIso || !untilIso || new Date(fromIso) < new Date(untilIso);
  const current = settings?.[which] ?? { from: null, until: null };
  const dirty = !!settings && (!sameMinute(fromIso, current.from) || !sameMinute(untilIso, current.until));
  const now = Date.now();
  const openNow = (!fromIso || new Date(fromIso).getTime() <= now) && (!untilIso || now < new Date(untilIso).getTime());
  const smsOn = !!settings?.notifications[m.toggle];

  async function save() {
    if (busy || !orderOk) return;
    setBusy(true);
    setError(null);
    setSaved(false);
    try {
      await updateSettings(token, { [which]: { from: fromIso, until: untilIso } });
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Algo deu errado.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      className="cat-form"
      onSubmit={(e) => {
        e.preventDefault();
        void save();
      }}
    >
      <h2 className="cat-form__title">{m.title}</h2>
      <p className="cat-hint">{m.hint}</p>
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
            ? `🟢 Sem restrição — ${m.who} acessa${m.who === "os pais" ? "m" : ""} a qualquer hora.`
            : openNow
              ? `🟢 Aberta agora${untilIso ? ` — fecha ${fmt.format(new Date(untilIso))}` : ""}`
              : fromIso && new Date(fromIso).getTime() > now
                ? `🕒 Abre ${fmt.format(new Date(fromIso))}${untilIso ? ` até ${fmt.format(new Date(untilIso))}` : ""}`
                : `⚫ Fechada${untilIso ? ` desde ${fmt.format(new Date(untilIso))}` : ""}`}
          .
        </p>
      )}
      {settings &&
        (smsOn ? (
          <p className="message message--ok">
            📲 Quando a janela abrir, {m.who} <strong>recebe{m.who === "os pais" ? "m" : ""} o SMS de boas-vindas</strong> com o link do app (uma única vez por pessoa).
          </p>
        ) : (
          <p className="message message--warn">
            ⚠️ {m.who.charAt(0).toUpperCase() + m.who.slice(1)} <strong>não vão receber</strong> o SMS de boas-vindas quando a janela abrir — a notificação "{m.toggleLabel}" está desligada.{" "}
            <a href="#/notifications" onClick={(e) => { e.preventDefault(); navigate("/notifications"); }}>Ligar em Notificações</a>
          </p>
        ))}
      {error && <p className="message message--error">{error}</p>}
      {saved && <p className="message message--ok">✅ Janela de acesso salva.</p>}
      <div className="cat-form__actions">
        <button type="submit" className="button button--primary" disabled={!orderOk || !dirty || busy}>
          {busy ? "Salvando…" : "Salvar horário 🕒"}
        </button>
      </div>
    </form>
  );
}
