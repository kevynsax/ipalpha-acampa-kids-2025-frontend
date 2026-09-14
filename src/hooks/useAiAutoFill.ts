import { useCallback, useRef, useState } from "react";
import { aiSuggest, type AiContext } from "../api/ai";

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
}

/**
 * After the AI assistant rewrites the editor content, fills a blank title and
 * an untouched (default) icon with suggestions from the model. Wrap the
 * form's setEmoji with `pickEmoji` so a manual choice stops icon suggestions.
 */
export function useAiAutoFill({ token, context, title, setTitle, emoji, setEmoji, defaultEmoji, existing }: Options) {
  const [suggesting, setSuggesting] = useState(false);
  const touched = useRef(false);
  const latest = useRef({ title, emoji });
  latest.current = { title, emoji };

  const pickEmoji = useCallback(
    (v: string) => {
      touched.current = true;
      setEmoji(v);
    },
    [setEmoji],
  );

  const onAiApplied = useCallback(
    async (html: string) => {
      const needTitle = !latest.current.title.trim();
      const needEmoji = !existing && !touched.current && latest.current.emoji === defaultEmoji;
      if (!needTitle && !needEmoji) return;
      setSuggesting(true);
      try {
        const s = await aiSuggest(token, { html, context, needTitle, needEmoji });
        // re-check: the user may have typed meanwhile
        if (s.title && !latest.current.title.trim()) setTitle(s.title);
        if (s.emoji && !touched.current && latest.current.emoji === defaultEmoji) setEmoji(s.emoji);
      } catch {
        /* suggestions are best-effort */
      } finally {
        setSuggesting(false);
      }
    },
    [token, context, existing, defaultEmoji, setTitle, setEmoji],
  );

  /** AI button next to the title: (re)generate the title from the current content, even if one is set */
  const regenerateTitle = useCallback(
    async (html: string) => {
      if (!html.trim()) return;
      setSuggesting(true);
      try {
        const s = await aiSuggest(token, { html, context, needTitle: true, needEmoji: false });
        if (s.title) setTitle(s.title);
      } catch {
        /* best-effort */
      } finally {
        setSuggesting(false);
      }
    },
    [token, context, setTitle],
  );

  return { onAiApplied, pickEmoji, regenerateTitle, suggesting };
}
