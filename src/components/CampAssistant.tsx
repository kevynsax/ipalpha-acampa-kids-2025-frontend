import { useEffect, useRef, useState } from "react";
import { assistantChat, assistantStatus, type AssistantMessage, type AssistantStatus } from "../api/assistant";
import { useGlowVar } from "../hooks/useGlowVar";
import { useLiveAssistant } from "../hooks/useLiveAssistant";
import { AiGlyph, MicGlyph, MicOffGlyph } from "./Glyph";
import LanternMark from "./LanternMark";

interface CampAssistantProps {
  token: string;
  /** Keep both floating actions visible by stacking above the badge scanner. */
  avoidFab?: boolean;
}

interface ChatItem extends AssistantMessage {
  id: number;
  pending?: boolean;
  lookups?: string[];
  error?: string;
}

const SUGGESTIONS = [
  "Quantas crianças estão em cada quarto?",
  "Quem ainda não fez check-in?",
  "Quais quartos estão acima da capacidade?",
  "Resuma os dados disponíveis no sistema.",
];

export default function CampAssistant({ token, avoidFab = false }: CampAssistantProps) {
  const [open, setOpen] = useState(false);
  const [service, setService] = useState<AssistantStatus | null>(null);
  const [items, setItems] = useState<ChatItem[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [statusError, setStatusError] = useState("");
  const [mode, setMode] = useState<"voice" | "text">("voice");
  const nextId = useRef(1);
  const abortRef = useRef<AbortController | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const drawerRef = useRef<HTMLElement>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);

  const live = useLiveAssistant(token);
  const enabled = service ? service.enabled : null;
  const voiceReady = !!service?.voice && !!service.enabled;
  const speaking = live.status === "live" || live.status === "connecting";

  useGlowVar(drawerRef, live.levelRef);
  useGlowVar(launcherRef, live.levelRef);

  useEffect(() => {
    let cancelled = false;
    assistantStatus(token)
      .then((status) => {
        if (cancelled) return;
        setService(status);
        if (!status.voice) setMode("text");
      })
      .catch((error) => {
        if (cancelled) return;
        setService({ enabled: false, model: "", voice: false, voiceModel: "" });
        setMode("text");
        setStatusError(error instanceof Error ? error.message : "Assistente indisponível.");
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    if (mode === "text") setTimeout(() => inputRef.current?.focus(), 40);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, mode]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [items, live.turns]);

  /** Closing the drawer hangs up: the conversation is billed by the minute. */
  function close() {
    setOpen(false);
    live.stop();
  }

  function patch(id: number, change: Partial<ChatItem>) {
    setItems((list) => list.map((item) => item.id === id ? { ...item, ...change } : item));
  }

  async function send(text = draft) {
    const content = text.trim();
    if (!content || busy || enabled !== true) return;
    const history: AssistantMessage[] = items
      .filter((item) => !item.pending && !item.error)
      .map(({ role, content: message }) => ({ role, content: message }));
    const user: ChatItem = { id: nextId.current++, role: "user", content };
    const replyId = nextId.current++;
    setItems((list) => [...list, user, { id: replyId, role: "assistant", content: "", pending: true }]);
    setDraft("");
    setBusy(true);
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const full = await assistantChat(
        token,
        [...history, { role: "user", content }],
        (progress) => patch(replyId, { content: progress.reply, lookups: progress.lookups }),
        controller.signal,
      );
      patch(replyId, { content: full.reply || "Não encontrei uma resposta.", lookups: full.lookups, pending: false });
    } catch (error) {
      patch(replyId, {
        pending: false,
        error: (error as Error)?.name === "AbortError" ? "Consulta cancelada." : error instanceof Error ? error.message : "O assistente não respondeu.",
      });
    } finally {
      abortRef.current = null;
      setBusy(false);
      inputRef.current?.focus();
    }
  }

  function statusLine() {
    if (mode === "text") return "Consulta somente leitura";
    if (live.status === "connecting") return "Conectando…";
    if (live.status === "error") return "Conversa encerrada";
    if (live.status !== "live") return "Toque para conversar";
    if (live.thinking) return "Consultando os dados…";
    if (live.muted) return "Microfone desligado";
    if (live.talking === "user") return "Ouvindo você…";
    if (live.talking === "assistant") return "Respondendo…";
    return "No ar — pode falar";
  }

  return (
    <>
      <button
        ref={launcherRef}
        type="button"
        className={`assistant-launcher ${avoidFab ? "assistant-launcher--with-fab" : ""} ${open ? "assistant-launcher--open" : ""} ${speaking ? "assistant-launcher--live" : ""}`}
        title="Abrir assistente de consulta"
        aria-label="Abrir assistente de consulta"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <LanternMark size="100%" live={live.status === "live"} />
        <span className="assistant-launcher__live" aria-hidden="true" />
      </button>

      {open && <button type="button" className="assistant-backdrop" aria-label="Fechar assistente" onClick={close} />}
      <aside ref={drawerRef} className={`assistant-drawer ${open ? "assistant-drawer--open" : ""}`} aria-hidden={!open} aria-label="Assistente do acampamento">
        <header className="assistant-drawer__head">
          <span className="assistant-drawer__identity">
            <LanternMark size={42} live={live.status === "live"} />
            <span>
              <strong>Assistente</strong>
              <small className={live.status === "live" ? "assistant-drawer__state--live" : ""}><i /> {statusLine()}</small>
            </span>
          </span>
          {voiceReady && (
            <div className="assistant-mode" role="group" aria-label="Como falar com o assistente">
              <button type="button" className={mode === "voice" ? "is-on" : ""} aria-pressed={mode === "voice"} onClick={() => setMode("voice")}>Voz</button>
              <button type="button" className={mode === "text" ? "is-on" : ""} aria-pressed={mode === "text"} onClick={() => { setMode("text"); live.stop(); }}>Escrever</button>
            </div>
          )}
          <button type="button" className="assistant-drawer__close" aria-label="Fechar assistente" onClick={close}>×</button>
        </header>

        <div className="assistant-drawer__messages" ref={listRef}>
          {mode === "voice" ? (
            live.turns.length === 0 ? (
              <div className="assistant-welcome">
                <span className="assistant-welcome__lantern"><LanternMark size={92} live={live.status === "live"} /></span>
                <h2>Vamos conversar</h2>
                <p>Pergunte em voz alta sobre participantes, quartos, equipe, programação e check-ins. Pode falar naturalmente e me interromper no meio da resposta.</p>
                <ul className="assistant-spoken">
                  {SUGGESTIONS.map((suggestion) => <li key={suggestion}>“{suggestion}”</li>)}
                </ul>
                <p className="assistant-welcome__privacy">Dados pessoais e de saúde ficam disponíveis apenas para administradores e organizadores.</p>
              </div>
            ) : (
              live.turns.map((turn) => (
                <article key={turn.id} className={`assistant-message assistant-message--${turn.role}`}>
                  {turn.role === "assistant" && <span className="assistant-message__avatar"><AiGlyph /></span>}
                  <div className="assistant-message__bubble"><p>{turn.text}</p></div>
                </article>
              ))
            )
          ) : (
            <>
              {items.length === 0 && (
                <div className="assistant-welcome">
                  <span className="assistant-welcome__lantern"><LanternMark size={92} /></span>
                  <h2>O que você quer saber?</h2>
                  <p>Consulte participantes, quartos, equipe, programação, check-ins e os outros dados do acampamento.</p>
                  <p className="assistant-welcome__privacy">Dados pessoais e de saúde ficam disponíveis apenas para administradores e organizadores.</p>
                  <div className="assistant-suggestions">
                    {SUGGESTIONS.map((suggestion) => (
                      <button key={suggestion} type="button" disabled={enabled !== true} onClick={() => void send(suggestion)}>{suggestion}</button>
                    ))}
                  </div>
                </div>
              )}

              {items.map((item) => (
                <article key={item.id} className={`assistant-message assistant-message--${item.role} ${item.error ? "assistant-message--error" : ""}`}>
                  {item.role === "assistant" && <span className="assistant-message__avatar"><AiGlyph /></span>}
                  <div className="assistant-message__bubble">
                    {item.error ? <p>{item.error}</p> : item.content ? <p>{item.content}</p> : null}
                    {item.pending && (
                      <span className="assistant-message__working" role="status">
                        <i /><i /><i /> {item.lookups?.length ? "Consultando dados…" : "Pensando…"}
                      </span>
                    )}
                    {!item.pending && !!item.lookups?.length && <small>Consultou {item.lookups.join(", ")}</small>}
                  </div>
                </article>
              ))}
            </>
          )}

          {mode === "voice" && live.thinking && (
            <span className="assistant-message__working assistant-message__working--voice" role="status"><i /><i /><i /> Consultando dados…</span>
          )}
        </div>

        {mode === "voice" ? (
          <div className="assistant-talk">
            {enabled === false && <p className="assistant-composer__error">{statusError || "Assistente não configurado no servidor."}</p>}
            {!!live.error && <p className="assistant-composer__error">{live.error}</p>}
            {live.status === "live" ? (
              <div className="assistant-talk__row">
                <button type="button" className={`assistant-talk__mute ${live.muted ? "is-off" : ""}`} aria-pressed={live.muted} onClick={live.toggleMute}>
                  {live.muted ? <MicOffGlyph size="1.3em" /> : <MicGlyph size="1.3em" />}
                  {live.muted ? "Microfone desligado" : "Microfone ligado"}
                </button>
                <button type="button" className="assistant-talk__end" onClick={live.stop}>
                  <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="6" width="12" height="12" rx="3" /></svg>
                  Encerrar
                </button>
              </div>
            ) : (
              <button type="button" className={`assistant-talk__start ${live.status === "connecting" ? "is-connecting" : ""}`} disabled={!voiceReady || live.status === "connecting"} onClick={() => void live.start()}>
                <span className="assistant-talk__halo" aria-hidden="true" />
                <MicGlyph size="1.5em" />
                {live.status === "connecting" ? "Conectando…" : live.status === "ended" ? "Conversar de novo" : "Conversar"}
              </button>
            )}
            <small>{voiceReady ? "Fale à vontade — a conversa é por voz, nos dois sentidos." : "Conversa por voz não configurada no servidor."}</small>
            <audio ref={live.audioRef} autoPlay playsInline />
          </div>
        ) : (
          <div className="assistant-composer">
            {enabled === false && <p className="assistant-composer__error">{statusError || "Assistente não configurado no servidor."}</p>}
            <div className="assistant-composer__box">
              <textarea
                ref={inputRef}
                rows={2}
                value={draft}
                placeholder="Pergunte sobre o acampamento"
                disabled={busy || enabled !== true}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void send();
                  }
                }}
              />
              {busy ? (
                <button type="button" className="assistant-composer__send" aria-label="Parar resposta" onClick={() => abortRef.current?.abort()}>■</button>
              ) : (
                <button type="button" className="assistant-composer__send" aria-label="Enviar pergunta" disabled={!draft.trim() || enabled !== true} onClick={() => void send()}>
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.4 20.4 21.8 12 3.4 3.6l.1 6.6L15 12 3.5 13.8z" /></svg>
                </button>
              )}
            </div>
            <small>O assistente pode cometer erros. Confirme informações críticas na ficha.</small>
          </div>
        )}
      </aside>
    </>
  );
}
