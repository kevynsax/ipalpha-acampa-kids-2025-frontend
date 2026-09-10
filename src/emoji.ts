/**
 * An "icon" is 1–2 user-perceived characters (graphemes). A single emoji can
 * be many code units (👨‍👩‍👧 is 8 UTF-16 units), so never limit by `.length`.
 */
const MAX_GRAPHEMES = 2;
const MAX_CODE_UNITS = 32;

const segmenter = typeof Intl !== "undefined" && "Segmenter" in Intl ? new Intl.Segmenter(undefined, { granularity: "grapheme" }) : null;

export function graphemeCount(s: string): number {
  if (segmenter) return [...segmenter.segment(s)].length;
  return [...s].length; // code points — good enough fallback
}

/** Trimmed icon when valid, otherwise null. */
export function cleanEmojiInput(raw: string): string | null {
  const v = raw.trim();
  if (!v || /\s/.test(v) || v.length > MAX_CODE_UNITS) return null;
  const n = graphemeCount(v);
  return n >= 1 && n <= MAX_GRAPHEMES ? v : null;
}
