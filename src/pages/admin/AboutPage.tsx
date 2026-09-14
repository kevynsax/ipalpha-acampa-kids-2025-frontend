import { useEffect, useState } from "react";
import { aiUsage, type AiVendor, type AiVendorUsage } from "../../api/ai";
import AiVendorLogo from "../../components/AiVendorLogo";
import { AiGlyph } from "../../components/Glyph";
import { speakStamp } from "../../dates";

interface AboutPageProps {
  token: string;
}

const VENDOR_NAMES: Record<string, string> = {
  anthropic: "Anthropic",
  openai: "OpenAI",
  xai: "xAI",
  meta: "Meta",
  zhipu: "Zhipu AI",
};

const num = new Intl.NumberFormat("pt-BR");

/** Admin-only "Sobre": app version and how much each AI company has been used. */
export default function AboutPage({ token }: AboutPageProps) {
  const [vendors, setVendors] = useState<AiVendorUsage[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    aiUsage(token)
      .then((r) => !cancelled && setVendors(r.vendors))
      .catch((e) => !cancelled && setError(e instanceof Error ? e.message : "Não foi possível carregar o uso de IA."));
    return () => {
      cancelled = true;
    };
  }, [token]);

  const totalCalls = vendors?.reduce((n, v) => n + v.calls, 0) ?? 0;
  const totalTokens = vendors?.reduce((n, v) => n + v.promptTokens + v.completionTokens, 0) ?? 0;

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
            <dt>Chamadas de IA</dt>
            <dd>{vendors ? num.format(totalCalls) : "…"}</dd>
          </div>
          <div>
            <dt>Tokens</dt>
            <dd>{vendors ? num.format(totalTokens) : "…"}</dd>
          </div>
        </dl>
      </section>

      <section className="cat-form">
        <h2 className="cat-form__title"><AiGlyph /> Uso de IA por empresa</h2>
        <p className="cat-hint">Assistente do editor e sugestões de título/emoji, somados desde o início.</p>
        {error && <p className="message message--error">{error}</p>}
        {!error && !vendors && <p className="opt-empty">Carregando…</p>}
        {vendors && !vendors.length && <p className="opt-empty">Ninguém usou a IA ainda.</p>}
        {vendors && vendors.length > 0 && (
          <ul className="about-vendors">
            {vendors.map((v) => {
              const tokens = v.promptTokens + v.completionTokens;
              const share = totalCalls ? Math.round((v.calls / totalCalls) * 100) : 0;
              return (
                <li key={v.vendor} className="about-vendor">
                  <div className="about-vendor__head">
                    <AiVendorLogo vendor={v.vendor as AiVendor} size={22} />
                    <span className="about-vendor__name">{VENDOR_NAMES[v.vendor] ?? v.vendor}</span>
                    <span className="about-vendor__share">{share}%</span>
                  </div>
                  <div className="about-vendor__bar" aria-hidden>
                    <span style={{ width: `${share}%` }} />
                  </div>
                  <div className="about-vendor__stats">
                    <span>
                      <b>{num.format(v.calls)}</b> chamadas{v.errors ? ` · ${num.format(v.errors)} falhas` : ""}
                    </span>
                    <span>
                      <b>{num.format(tokens)}</b> tokens ({num.format(v.promptTokens)} entrada · {num.format(v.completionTokens)} saída)
                    </span>
                    {v.lastAt && <span>último uso {speakStamp(v.lastAt)}</span>}
                  </div>
                  <ul className="about-vendor__models">
                    {v.models.map((m) => (
                      <li key={m.model}>
                        <code>{m.model}</code> — {num.format(m.calls)} chamadas · {num.format(m.promptTokens + m.completionTokens)} tokens
                      </li>
                    ))}
                  </ul>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
