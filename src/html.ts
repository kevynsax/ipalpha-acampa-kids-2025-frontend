/**
 * Helpers for the editor's HTML source mode (the `</>` button).
 *
 * The documents are small, hand-written HTML in a closed vocabulary (see
 * backend/src/services/html.ts), so a token walk is enough to pretty-print the
 * source and to tell which tags the app would throw away on save.
 */

/** Tags the editor and the server sanitizer keep. Anything else is dropped on save. */
export const ALLOWED_TAGS = new Set([
  "p", "br", "strong", "b", "em", "i", "u", "s", "ul", "ol", "li", "h2", "h3", "blockquote", "a", "hr", "img", "mark",
  "details", "summary", "div", "figure", "figcaption", "table", "thead", "tbody", "tr", "th", "td",
]);

/** Tags that get their own line when the source is formatted. */
const BLOCK = new Set([
  "p", "h2", "h3", "ul", "ol", "li", "blockquote", "hr", "img", "details", "summary", "div",
  "figure", "figcaption", "table", "thead", "tbody", "tr", "th", "td",
]);

/** Self-closing: never open a nesting level. */
const VOID = new Set(["br", "hr", "img", "meta", "link", "source"]);

const TOKEN = /<[^>]+>|[^<]+/g;

function tagName(token: string): string {
  return (/^<\/?\s*([a-zA-Z][\w-]*)/.exec(token)?.[1] ?? "").toLowerCase();
}

/** The tag names used in a piece of HTML (lowercase, no duplicates, in order). */
export function htmlTags(html: string): string[] {
  const out: string[] = [];
  for (const m of html.match(TOKEN) ?? []) {
    if (!m.startsWith("<") || m.startsWith("<!")) continue;
    const name = tagName(m);
    if (name && !out.includes(name)) out.push(name);
  }
  return out;
}

/** Tags in the source the app will drop (so the editor can warn before applying). */
export function unsupportedTags(html: string): string[] {
  return htmlTags(html).filter((t) => !ALLOWED_TAGS.has(t));
}

interface Node {
  /** "" = text node */
  tag: string;
  /** raw open tag (`<p class="x">`) or the text itself */
  raw: string;
  children: Node[];
  /** no closing tag (void element) */
  selfClosing: boolean;
}

/**
 * Tags an opening tag implicitly closes (HTML lets `<p>a<p>b` and `<li>a<li>b`
 * stand); without this a missing `</p>` would nest the whole rest of the
 * document one level deeper.
 */
const IMPLICIT_CLOSE: Record<string, string[]> = {
  p: ["p"],
  li: ["li"],
  tr: ["tr", "td", "th"],
  td: ["td", "th"],
  th: ["td", "th"],
  thead: ["thead", "tbody", "tr", "td", "th"],
  tbody: ["thead", "tbody", "tr", "td", "th"],
  summary: ["summary"],
  figcaption: ["figcaption"],
};

/** Tolerant tree of the source: unknown / unclosed tags are kept as-is. */
function parse(html: string): Node[] {
  const root: Node = { tag: "#root", raw: "", children: [], selfClosing: false };
  const stack: Node[] = [root];
  for (const token of html.match(TOKEN) ?? []) {
    let top = stack[stack.length - 1];
    if (!token.startsWith("<")) {
      // whitespace between inline tags is meaningful ("<strong>a</strong> <mark>b</mark>")
      const text = token.replace(/\s+/g, " ");
      if (text) top.children.push({ tag: "", raw: text, children: [], selfClosing: true });
      continue;
    }
    if (token.startsWith("<!")) {
      top.children.push({ tag: "#comment", raw: token, children: [], selfClosing: true });
      continue;
    }
    const name = tagName(token);
    if (token.startsWith("</")) {
      // close the nearest matching open tag; ignore strays
      let at = -1;
      for (let i = stack.length - 1; i > 0; i--) {
        if (stack[i].tag === name) {
          at = i;
          break;
        }
      }
      if (at > 0) stack.length = at;
      continue;
    }
    for (const closes = IMPLICIT_CLOSE[name] ?? []; closes.includes(top.tag); top = stack[stack.length - 1]) stack.pop();
    const node: Node = { tag: name, raw: token, children: [], selfClosing: VOID.has(name) || token.endsWith("/>") };
    top.children.push(node);
    if (!node.selfClosing) stack.push(node);
  }
  return root.children;
}

function isBlock(n: Node): boolean {
  return BLOCK.has(n.tag);
}

function serializeInline(nodes: Node[]): string {
  return nodes
    .map((n) => {
      if (n.tag === "" || n.tag === "#comment") return n.raw;
      if (n.selfClosing) return n.raw;
      return `${n.raw}${serializeInline(n.children)}</${n.tag}>`;
    })
    .join("");
}

function write(nodes: Node[], depth: number, out: string[]): void {
  const pad = "  ".repeat(depth);
  let inline: Node[] = [];
  const flushInline = () => {
    if (!inline.length) return;
    const text = serializeInline(inline).trim();
    if (text) out.push(pad + text);
    inline = [];
  };
  for (const n of nodes) {
    if (!isBlock(n)) {
      inline.push(n);
      continue;
    }
    flushInline();
    if (n.selfClosing) {
      out.push(pad + n.raw);
      continue;
    }
    // a block holding only inline content stays on one line
    if (!n.children.some(isBlock)) {
      out.push(`${pad}${n.raw}${serializeInline(n.children).trim()}</${n.tag}>`);
      continue;
    }
    out.push(pad + n.raw);
    write(n.children, depth + 1, out);
    out.push(`${pad}</${n.tag}>`);
  }
  flushInline();
}

/**
 * Pretty-prints document HTML: one block element per line, nesting indented,
 * inline markup (`strong`, `a`, `mark`, `br`…) left inside the text flow.
 */
export function formatHtml(html: string): string {
  const out: string[] = [];
  write(parse(html), 0, out);
  return out.join("\n");
}

/**
 * Cleans HTML on its way INTO the editor.
 *
 * ProseMirror happily builds an `<img>` node with no src (from a pasted
 * `<figure>`, or from an assistant placeholder that was never rendered), which
 * then shows as a broken picture and is thrown away on save. Dropping those
 * here — and the figures left without an image — keeps the editor content and
 * the stored document in agreement.
 */
export function sanitizeForEditor(html: string): string {
  const out = html
    .replace(/<img\b[^>]*>/gi, (tag) => (/\ssrc=["']/i.test(tag) ? tag : ""))
    .replace(/<figure\b[^>]*>([\s\S]*?)<\/figure>/gi, (m, inner: string) => (/<img\s/i.test(inner) ? m : ""))
    // an empty caption is noise the editor would keep re-rendering
    .replace(/<figcaption>\s*<\/figcaption>/gi, "");
  return out;
}

/**
 * Same HTML without the formatting line breaks — what actually goes into the
 * editor. Indentation is dropped, but a space between inline tags on the SAME
 * line is kept (it is real content: "<strong>a</strong> <mark>b</mark>"), and
 * text wrapped across lines is rejoined with a space instead of glued.
 */
export function compactHtml(source: string): string {
  let out = "";
  for (const raw of source.split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    const glue = !out || out.endsWith(">") || line.startsWith("<");
    out += (glue ? "" : " ") + line;
  }
  return out;
}
