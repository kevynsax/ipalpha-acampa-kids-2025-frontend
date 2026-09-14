/**
 * Block-level diff between two versions of a document, used to show what the
 * assistant changed before the user keeps it (the "Ver o que mudou" panel).
 *
 * Documents are a flat-ish list of blocks (`<p>`, `<h2>`, `<li>`, `<details>`…),
 * so comparing whole blocks — not characters — matches how the user reads the
 * change: "this paragraph is new, this one was reworded, this one is gone".
 */

export type DiffKind = "same" | "added" | "removed" | "changed";

export interface DiffRow {
  kind: DiffKind;
  /** plain text of the block before (removed / changed) */
  before?: string;
  /** plain text of the block after (added / changed / same) */
  after?: string;
}

/** Top-level blocks of a document, as plain text (nested blocks are flattened). */
export function textBlocks(html: string): string[] {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const out: string[] = [];
  const walk = (el: Element) => {
    for (const child of [...el.children]) {
      const tag = child.tagName.toLowerCase();
      if (tag === "ul" || tag === "ol" || tag === "details" || tag === "div" || tag === "table" || tag === "thead" || tag === "tbody") {
        walk(child);
        continue;
      }
      // a picture is one block, caption included (so swapping the caption is one change)
      if (tag === "figure") {
        const caption = child.querySelector("figcaption")?.textContent?.trim();
        const alt = child.querySelector("img")?.getAttribute("alt")?.trim();
        out.push(`🖼️ ${caption || alt || "(imagem)"}`);
        continue;
      }
      if (tag === "tr") {
        const cells = [...child.children].map((c) => c.textContent?.trim() ?? "").filter(Boolean);
        if (cells.length) out.push(cells.join(" · "));
        continue;
      }
      const text = (child.textContent ?? "").replace(/\s+/g, " ").trim();
      const label = tag === "li" ? `• ${text}` : tag === "summary" ? `▸ ${text}` : text;
      if (text) out.push(label);
      else if (tag === "img") out.push(`🖼️ ${child.getAttribute("alt")?.trim() || "(imagem)"}`);
      else if (tag === "hr") out.push("———");
    }
  };
  walk(doc.body);
  return out;
}

/** Longest common subsequence of two block lists (indices into each). */
function lcs(a: string[], b: string[]): [number, number][] {
  const n = a.length;
  const m = b.length;
  // documents are short (tens of blocks); the quadratic table is fine
  const table: number[][] = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      table[i][j] = a[i] === b[j] ? table[i + 1][j + 1] + 1 : Math.max(table[i + 1][j], table[i][j + 1]);
    }
  }
  const pairs: [number, number][] = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      pairs.push([i, j]);
      i++;
      j++;
    } else if (table[i + 1][j] >= table[i][j + 1]) i++;
    else j++;
  }
  return pairs;
}

/**
 * How similar two blocks are (0–1) — Sørensen–Dice over the words. Used to
 * tell a rewrite ("Sempre conte as crianças" → "Conte as crianças ao entrar e
 * ao sair da piscina") from an unrelated removal plus addition; Dice is kinder
 * than a max-based ratio when one version is much longer than the other.
 */
function similarity(a: string, b: string): number {
  if (a === b) return 1;
  const wordsA = new Set(a.toLowerCase().split(/\W+/).filter(Boolean));
  const wordsB = new Set(b.toLowerCase().split(/\W+/).filter(Boolean));
  if (!wordsA.size || !wordsB.size) return 0;
  let shared = 0;
  for (const w of wordsA) if (wordsB.has(w)) shared++;
  return (2 * shared) / (wordsA.size + wordsB.size);
}

/** a removal + addition this alike is one rewritten block, not two changes */
const REWRITE_MIN = 0.4;

/** Block diff of two documents. `same` rows are kept so the panel can show context. */
export function diffHtml(before: string, after: string): DiffRow[] {
  const a = textBlocks(before);
  const b = textBlocks(after);
  const pairs = lcs(a, b);
  const rows: DiffRow[] = [];
  let i = 0;
  let j = 0;
  const flushGap = (endA: number, endB: number) => {
    const removed = a.slice(i, endA);
    const added = b.slice(j, endB);
    // pair rewrites (similar blocks); best matches first, so a paragraph isn't
    // claimed by a vaguely similar neighbour before its real counterpart
    const candidates: { r: number; k: number; score: number }[] = [];
    removed.forEach((old, r) =>
      added.forEach((nw, k) => {
        const score = similarity(old, nw);
        if (score >= REWRITE_MIN) candidates.push({ r, k, score });
      }),
    );
    candidates.sort((x, y) => y.score - x.score);
    const pairOf = new Map<number, number>();
    const takenAdds = new Set<number>();
    for (const cand of candidates) {
      if (pairOf.has(cand.r) || takenAdds.has(cand.k)) continue;
      pairOf.set(cand.r, cand.k);
      takenAdds.add(cand.k);
    }
    // rows come out in reading order of the NEW document; a removal with no
    // counterpart keeps its relative place among them
    const scale = removed.length ? added.length / removed.length : 0;
    const gap: { at: number; order: number; row: DiffRow }[] = [];
    removed.forEach((old, r) => {
      const k = pairOf.get(r);
      if (k === undefined) gap.push({ at: r * scale, order: r, row: { kind: "removed", before: old } });
      else gap.push({ at: k, order: r, row: { kind: "changed", before: old, after: added[k] } });
    });
    added.forEach((nw, k) => {
      if (!takenAdds.has(k)) gap.push({ at: k, order: removed.length + k, row: { kind: "added", after: nw } });
    });
    gap.sort((x, y) => x.at - y.at || x.order - y.order);
    for (const g of gap) rows.push(g.row);
    i = endA;
    j = endB;
  };
  for (const [ai, bj] of pairs) {
    if (ai > i || bj > j) flushGap(ai, bj);
    rows.push({ kind: "same", after: b[bj] });
    i = ai + 1;
    j = bj + 1;
  }
  flushGap(a.length, b.length);
  return rows;
}

export interface DiffSummary {
  added: number;
  removed: number;
  changed: number;
  /** nothing but `same` rows */
  identical: boolean;
}

export function summarizeDiff(rows: DiffRow[]): DiffSummary {
  const added = rows.filter((r) => r.kind === "added").length;
  const removed = rows.filter((r) => r.kind === "removed").length;
  const changed = rows.filter((r) => r.kind === "changed").length;
  return { added, removed, changed, identical: !added && !removed && !changed };
}

/** Human summary for the chat line ("2 blocos novos, 1 reescrito"). */
export function describeDiff(s: DiffSummary): string {
  if (s.identical) return "nada mudou";
  const parts: string[] = [];
  if (s.added) parts.push(`${s.added} ${s.added === 1 ? "trecho novo" : "trechos novos"}`);
  if (s.changed) parts.push(`${s.changed} ${s.changed === 1 ? "reescrito" : "reescritos"}`);
  if (s.removed) parts.push(`${s.removed} ${s.removed === 1 ? "removido" : "removidos"}`);
  return parts.join(", ");
}
