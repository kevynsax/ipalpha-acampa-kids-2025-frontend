import { useEffect, useMemo, useState } from "react";
import { aiUsage, type AiKindUsage, type AiVendor, type AiVendorUsage, type SmsUsage } from "../../api/ai";
import { estimateCostUsd, usd } from "../../aiCost";
import AiVendorLogo from "../../components/AiVendorLogo";
import { AiGlyph } from "../../components/Glyph";
import { speakStamp } from "../../dates";
import { useUsdtBrl } from "../../usdtRate";

interface AboutPageProps {
  token: string;
}

const VENDOR_NAMES: Record<string, string> = {
  anthropic: "Anthropic",
  openai: "OpenAI",
  // the real OpenAI API (voice assistant), billed directly — not the gateway's GPT models above
  openai_api: "OpenAI API",
  xai: "xAI",
  meta: "Meta",
  zhipu: "Zhipu AI",
  google: "Google",
};

/** slice colour per lab, from the app palette */
const VENDOR_COLORS: Record<string, string> = {
  anthropic: "var(--sun)",
  openai: "var(--panel)",
  openai_api: "var(--forest-dark)",
  xai: "var(--red)",
  meta: "var(--pine)",
  zhipu: "var(--sage)",
  google: "var(--sky)",
};

/** the kinds of AI request the backend records (AiUsageEntry.kind) */
const KIND_LABELS: Record<string, string> = {
  edit: "Assistente de texto",
  suggest: "Sugestões",
  image: "Ilustrações",
  camper_notes: "Triagem de ficha",
  dedup_field: "Limpeza",
  guess_sex: "Sexo pelo nome",
  assistant_chat: "Assistente escrito",
  assistant_voice: "Assistente por voz",
};
const KIND_COLORS: Record<string, string> = {
  edit: "var(--sun)",
  suggest: "var(--panel)",
  image: "var(--red)",
  camper_notes: "var(--pine)",
  dedup_field: "var(--sage)",
  guess_sex: "var(--sky)",
  assistant_chat: "var(--forest)",
  assistant_voice: "var(--forest-dark)",
};

/** backup format of backend/scripts/backup.ts — keep both numbers in sync */
const BACKUP_VERSION = 1;

const num = new Intl.NumberFormat("pt-BR");
const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const brlPlain = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

interface Slice {
  label: string;
  color: string;
  value: number;
}

/** Donut chart: one slice per lab, total in the middle, legend beside it. Hovering a slice (or its legend row) highlights the pair. */
function PieChart({ title, slices, total, format }: { title: string; slices: Slice[]; total: number; format: (v: number) => string }) {
  const [hot, setHot] = useState<string | null>(null);
  const known = slices.filter((s) => s.value > 0);
  let acc = 0;
  const segs = known.map((s) => {
    const pct = total ? (s.value / total) * 100 : 0;
    const seg = { ...s, from: acc, pct };
    acc += pct;
    return seg;
  });
  const active = hot ? segs.find((s) => s.label === hot) ?? null : null;
  return (
    <figure className="about-pie">
      <figcaption>{title}</figcaption>
      <div className={`about-pie__chart${hot ? " is-hot" : ""}`}>
        <svg viewBox="0 0 42 42" role="img" aria-label={title}>
          <circle className="about-pie__ring" cx="21" cy="21" r="15.9155" />
          {segs.map((s) => (
            <circle
              key={s.label}
              className={`about-pie__slice${hot === s.label ? " is-hot" : ""}`}
              cx="21"
              cy="21"
              r="15.9155"
              style={{ stroke: s.color }}
              strokeDasharray={`${s.pct} ${100 - s.pct}`}
              strokeDashoffset={25 - s.from}
              onMouseEnter={() => setHot(s.label)}
              onMouseLeave={() => setHot(null)}
            />
          ))}
        </svg>
        <span className="about-pie__center">
          {active ? (
            <>
              <b>{format(active.value)}</b>
              <i>
                {active.label} · {Math.round(active.pct)}%
              </i>
            </>
          ) : (
            <b>{format(total)}</b>
          )}
        </span>
      </div>
      <ul className="about-pie__legend">
        {known.map((s) => (
          <li
            key={s.label}
            className={hot === s.label ? "is-hot" : undefined}
            onMouseEnter={() => setHot(s.label)}
            onMouseLeave={() => setHot(null)}
          >
            <span className="about-pie__dot" style={{ background: s.color }} />
            <span className="about-pie__name">{s.label}</span>
            <span className="about-pie__val">{format(s.value)}</span>
            <span className="about-pie__pct">{total ? Math.round((s.value / total) * 100) : 0}%</span>
          </li>
        ))}
      </ul>
    </figure>
  );
}

/** Admin-only "Sobre": app version and how much each AI company has been used. */
export default function AboutPage({ token }: AboutPageProps) {
  const [vendors, setVendors] = useState<AiVendorUsage[] | null>(null);
  const [kinds, setKinds] = useState<AiKindUsage[] | null>(null);
  const [sms, setSms] = useState<SmsUsage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const usdtBrl = useUsdtBrl();

  useEffect(() => {
    let cancelled = false;
    aiUsage(token)
      .then((r) => {
        if (cancelled) return;
        setVendors(r.vendors);
        setKinds(r.kinds);
        setSms(r.sms ?? null);
      })
      .catch((e) => !cancelled && setError(e instanceof Error ? e.message : "Não foi possível carregar o uso de IA."));
    return () => {
      cancelled = true;
    };
  }, [token]);

  /** per lab (not per model): tokens + estimated cost */
  const rows = useMemo(
    () =>
      (vendors ?? []).map((v) => ({
        ...v,
        name: VENDOR_NAMES[v.vendor] ?? v.vendor,
        color: VENDOR_COLORS[v.vendor] ?? "var(--muted)",
        tokens: v.promptTokens + v.completionTokens,
        cost: v.models.reduce((n, m) => n + (estimateCostUsd(m.model, m.promptTokens, m.completionTokens) ?? 0), 0),
      })),
    [vendors],
  );

  const totalCalls = rows.reduce((n, v) => n + v.calls, 0);
  const totalTokens = rows.reduce((n, v) => n + v.tokens, 0);
  const totalCost = rows.reduce((n, v) => n + v.cost, 0);

  /** BRL at the live USDT rate; US$ until the rate arrives */
  const fmtCost = (v: number) => (usdtBrl != null ? brl.format(v * usdtBrl) : usd.format(v));

  return (
    <div className="admin-page">
      <header className="admin-head">
        <h1 className="admin-title">ℹ️ Sobre</h1>
      </header>

      <section className="cat-form">
        <h2 className="cat-form__title">🏕️ Acampamento Kids</h2>
        <dl className="about-facts">
          <div>
            <dt>Versão</dt>
            <dd>{__APP_VERSION__}</dd>
          </div>
          <div>
            <dt>Backup</dt>
            <dd>v{BACKUP_VERSION}</dd>
          </div>
          <div>
            <dt>Chamadas de IA</dt>
            <dd>{vendors ? num.format(totalCalls) : "…"}</dd>
          </div>
          <div>
            <dt>Tokens</dt>
            <dd>{vendors ? num.format(totalTokens) : "…"}</dd>
          </div>
          <div>
            <dt>Custo estimado</dt>
            <dd>{vendors ? fmtCost(totalCost) : "…"}</dd>
          </div>
          <div>
            <dt>SMS enviados</dt>
            <dd>{sms ? num.format(sms.sent) : "…"}</dd>
          </div>
          <div>
            <dt>Custo de SMS</dt>
            <dd>{sms ? brl.format(sms.costBrl) : "…"}</dd>
          </div>
        </dl>
      </section>

      <section className="cat-form">
        <h2 className="cat-form__title"><AiGlyph /> Uso de IA por empresa</h2>
        <p className="cat-hint">
          Assistente do editor e sugestões de título/emoji, somados desde o início. Custo estimado pela tabela do gateway, em reais pela cotação do
          USDT{usdtBrl != null ? ` de R$ ${brlPlain.format(usdtBrl)}` : ""} (cross-otc.com).
        </p>
        {error && <p className="message message--error">{error}</p>}
        {!error && !vendors && <p className="opt-empty">Carregando…</p>}
        {vendors && !vendors.length && <p className="opt-empty">Ninguém usou a IA ainda.</p>}
        {rows.length > 0 && (
          <>
            <div className="about-pies">
              <PieChart title="Tokens por empresa" slices={rows.map((r) => ({ label: r.name, color: r.color, value: r.tokens }))} total={totalTokens} format={num.format} />
              {totalCost > 0 && (
                <PieChart title="Custo por empresa" slices={rows.map((r) => ({ label: r.name, color: r.color, value: r.cost }))} total={totalCost} format={fmtCost} />
              )}
              <PieChart title="Chamadas por empresa" slices={rows.map((r) => ({ label: r.name, color: r.color, value: r.calls }))} total={totalCalls} format={num.format} />
              {kinds && kinds.length > 0 && (
                <PieChart
                  title="Chamadas por pedido"
                  slices={kinds.map((k) => ({ label: KIND_LABELS[k.kind] ?? k.kind, color: KIND_COLORS[k.kind] ?? "var(--muted)", value: k.calls }))}
                  total={totalCalls}
                  format={num.format}
                />
              )}
            </div>
            <ul className="about-vendors">
              {rows.map((v) => (
                <li key={v.vendor} className="about-vendor">
                  <div className="about-vendor__head">
                    <AiVendorLogo vendor={v.vendor as AiVendor} size={22} />
                    <span className="about-vendor__name">{v.name}</span>
                    <span className="about-vendor__cost">{fmtCost(v.cost)}</span>
                  </div>
                  <div className="about-vendor__stats">
                    <span>
                      <b>{num.format(v.calls)}</b> chamadas{v.errors ? ` · ${num.format(v.errors)} falhas` : ""}
                    </span>
                    <span>
                      <b>{num.format(v.tokens)}</b> tokens ({num.format(v.promptTokens)} entrada · {num.format(v.completionTokens)} saída)
                    </span>
                    {v.lastAt && <span>último uso {speakStamp(v.lastAt)}</span>}
                  </div>
                  <ul className="about-vendor__models">
                    {v.models.map((m) => {
                      const cost = estimateCostUsd(m.model, m.promptTokens, m.completionTokens);
                      return (
                        <li key={m.model}>
                          <code>{m.model}</code> — {num.format(m.calls)} chamadas · {num.format(m.promptTokens + m.completionTokens)} tokens
                          {cost != null && ` · ≈ ${fmtCost(cost)}`}
                        </li>
                      );
                    })}
                  </ul>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </div>
  );
}
