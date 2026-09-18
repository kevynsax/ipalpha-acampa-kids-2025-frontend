import { useCallback, useEffect, useRef, useState } from "react";
import { aiSuggest, type AiContext } from "../api/ai";

/** wait until they pause typing the title before guessing the icon */
const TITLE_DEBOUNCE_MS = 1200;
const BODY_DEBOUNCE_MS = 400;
const MAX_BODY_GUESSES = 3;
const MIN_TITLE = 2;
const MIN_BODY = 8;

interface Options {
  token: string;
  context: AiContext;
  /** current title / name ("" = blank, will be suggested) */
  title: string;
  setTitle: (v: string) => void;
  /** current emoji */
  emoji: string;
  setEmoji: (v: string) => void;
  /** the emoji the form started with; only replaced while the user hasn't picked one */
  defaultEmoji: string;
  /** editing an existing item: its emoji was chosen before, keep it */
  existing: boolean;
  /** body HTML / text — used to guess the icon when the title is still blank */
  html?: string;
}

/** Non-empty block-level chunks in editor HTML, or newline-separated plain text. */
export function countParagraphs(html: string): number {
  const raw = html.trim();
  if (!raw) return 0;
  const blocks = [...raw.matchAll(/<(p|h2|h3|li|blockquote)\b[^>]*>([\s\S]*?)<\/\1>/gi)];
  if (blocks.length) {
    return blocks.filter((m) =>
      m[2]
        .replace(/<[^>]+>/g, " ")
        .replace(/&nbsp;/gi, " ")
        .trim(),
    ).length;
  }
  return raw
    .replace(/<[^>]+>/g, " ")
    .split(/\n+/)
    .map((s) => s.replace(/&nbsp;/gi, " ").trim())
    .filter(Boolean).length;
}

function plainText(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Fills a blank title from the AI assistant, and live-guesses the icon:
 *   - title filled, icon not picked → guess from the title
 *   - both blank, user typing the body → guess on each new paragraph, up to 3
 * Wrap the form's setEmoji with `pickEmoji` so a manual choice stops guesses.
 */
export function useAiAutoFill({ token, context, title, setTitle, emoji, setEmoji, defaultEmoji, existing, html = "" }: Options) {
  const [suggesting, setSuggesting] = useState(false);
  const [suggestingEmoji, setSuggestingEmoji] = useState(false);
  const touched = useRef(false);
  const latest = useRef({ title, emoji, html, defaultEmoji });
  latest.current = { title, emoji, html, defaultEmoji };
  const bodyGuesses = useRef(0);
  const maxParagraphs = useRef(0);
  const lastSource = useRef("");
  const abort = useRef<AbortController | null>(null);

  const canGuessEmoji = useCallback(
    () => !existing && !touched.current,
    [existing],
  );

  const pickEmoji = useCallback(
    (v: string) => {
      touched.current = true;
      abort.current?.abort();
      abort.current = null;
      setSuggesting(false);
      setSuggestingEmoji(false);
      setEmoji(v);
    },
    [setEmoji],
  );

  const guessEmoji = useCallback(
    async (source: string) => {
      if (!canGuessEmoji()) return;
      const text = source.trim();
      if (!text || lastSource.current === text) return;
      abort.current?.abort();
      const ctrl = new AbortController();
      abort.current = ctrl;
      setSuggestingEmoji(true);
      try {
        const s = await aiSuggest(token, { html: text, context, needTitle: false, needEmoji: true }, ctrl.signal);
        if (ctrl.signal.aborted) return;
        lastSource.current = text;
        if (s.emoji && canGuessEmoji()) setEmoji(s.emoji);
      } catch (err) {
        if ((err as Error)?.name === "AbortError") return;
        /* suggestions are best-effort */
      } finally {
        if (abort.current === ctrl) {
          abort.current = null;
          setSuggestingEmoji(false);
        }
      }
    },
    [token, context, canGuessEmoji, setEmoji],
  );

  useEffect(() => () => abort.current?.abort(), []);

  // Title filled, icon not picked → wait until they pause, then guess. Each new
  // keystroke resets the timer and cancels an in-flight guess.
  useEffect(() => {
    if (!canGuessEmoji()) return;
    const t = title.trim();
    if (t.length < MIN_TITLE) return;
    abort.current?.abort();
    abort.current = null;
    setSuggestingEmoji(false);
    const timer = setTimeout(() => {
      if (!canGuessEmoji()) return;
      if (latest.current.title.trim() !== t) return;
      void guessEmoji(t);
    }, TITLE_DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
      abort.current?.abort();
      abort.current = null;
      setSuggestingEmoji(false);
    };
  }, [title, canGuessEmoji, guessEmoji]);

  // No title and no icon: guess on each new paragraph, stop after 3.
  useEffect(() => {
    if (!canGuessEmoji() || title.trim()) return;
    if (plainText(html).length < MIN_BODY) return;
    const n = countParagraphs(html);
    if (n <= maxParagraphs.current || bodyGuesses.current >= MAX_BODY_GUESSES) return;
    const timer = setTimeout(() => {
      if (!canGuessEmoji() || latest.current.title.trim()) return;
      const now = countParagraphs(latest.current.html);
      if (now <= maxParagraphs.current || bodyGuesses.current >= MAX_BODY_GUESSES) return;
      maxParagraphs.current = now;
      bodyGuesses.current += 1;
      void guessEmoji(latest.current.html);
    }, BODY_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [html, title, canGuessEmoji, guessEmoji]);

  const onAiApplied = useCallback(
    async (appliedHtml: string) => {
      const needTitle = !latest.current.title.trim();
      const needEmoji = canGuessEmoji();
      if (!needTitle && !needEmoji) return;
      abort.current?.abort();
      const ctrl = new AbortController();
      abort.current = ctrl;
      setSuggesting(true);
      if (needEmoji) setSuggestingEmoji(true);
      try {
        const s = await aiSuggest(token, { html: appliedHtml, context, needTitle, needEmoji }, ctrl.signal);
        if (ctrl.signal.aborted) return;
        if (s.title && !latest.current.title.trim()) setTitle(s.title);
        if (s.emoji && canGuessEmoji()) setEmoji(s.emoji);
      } catch {
        /* suggestions are best-effort */
      } finally {
        if (abort.current === ctrl) {
          abort.current = null;
          setSuggesting(false);
          setSuggestingEmoji(false);
        }
      }
    },
    [token, context, canGuessEmoji, setTitle, setEmoji],
  );

  /** AI button next to the title: (re)generate the title from the current content, even if one is set */
  const regenerateTitle = useCallback(
    async (sourceHtml: string) => {
      if (!sourceHtml.trim()) return;
      setSuggesting(true);
      try {
        const s = await aiSuggest(token, { html: sourceHtml, context, needTitle: true, needEmoji: false });
        if (s.title) setTitle(s.title);
      } catch {
        /* best-effort */
      } finally {
        setSuggesting(false);
      }
    },
    [token, context, setTitle],
  );

  return { onAiApplied, pickEmoji, regenerateTitle, suggesting, suggestingEmoji };
}
