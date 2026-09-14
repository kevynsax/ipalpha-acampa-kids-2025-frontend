import { Extension } from "@tiptap/core";
import { STYLE_ATTRS, type StyleAttr } from "../htmlStyle";

/**
 * Teaches the editor the document style tokens (`data-align`, `data-size`,
 * `data-space`, `data-color`, `data-tone`, `data-font`).
 *
 * They are declared as real node attributes so ProseMirror keeps them while the
 * text around is edited, undo/redo works, and `getHTML()` writes them back —
 * which is what lets the same token round-trip through the server sanitizer.
 */

/** node types that may carry a token (mirrors STYLEABLE_TAGS for the editor schema) */
const STYLED_NODES = ["paragraph", "heading", "blockquote", "figure", "figcaption", "table", "bulletList", "orderedList", "image", "horizontalRule"];

/** list tightness belongs to the list, not to the paragraph inside the item */
const LIST_NODES = ["bulletList", "orderedList"];

/** Which node types a given token may sit on. */
function targetsFor(attr: StyleAttr): string[] {
  return attr === "data-density" ? LIST_NODES : STYLED_NODES;
}

/**
 * Walks out from the cursor to the nearest node a token may sit on. Returns the
 * node name and its depth, or null when the cursor isn't inside one (e.g.
 * asking for density outside a list).
 */
function findTarget(
  state: { selection: { from: number }; doc: { resolve: (pos: number) => { depth: number; node: (d: number) => { type: { name: string }; attrs: Record<string, unknown> } } } },
  types: string[],
): { name: string; attrs: Record<string, unknown> } | null {
  const $pos = state.doc.resolve(state.selection.from);
  for (let depth = $pos.depth; depth > 0; depth--) {
    const node = $pos.node(depth);
    if (types.includes(node.type.name)) return { name: node.type.name, attrs: node.attrs };
  }
  return null;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    styleTokens: {
      /** sets one token on the current block; `null` clears it */
      setStyleToken: (attr: StyleAttr, value: string | null) => ReturnType;
      /** clears every token of the current block */
      clearStyleTokens: () => ReturnType;
    };
  }
}

export const StyleTokens = Extension.create({
  name: "styleTokens",

  addGlobalAttributes() {
    const spec = (attr: StyleAttr) => ({
      default: null as string | null,
      parseHTML: (element: HTMLElement) => element.getAttribute(attr),
      renderHTML: (attributes: Record<string, unknown>) => {
        const value = attributes[attr];
        return value ? { [attr]: value } : {};
      },
    });
    const common = STYLE_ATTRS.filter((a) => a !== "data-density");
    return [
      { types: STYLED_NODES, attributes: Object.fromEntries(common.map((attr) => [attr, spec(attr)])) },
      // density belongs to the list itself
      { types: LIST_NODES, attributes: { "data-density": spec("data-density") } },
    ];
  },

  addCommands() {
    return {
      setStyleToken:
        (attr, value) =>
        ({ state, chain }) => {
          const target = findTarget(state, targetsFor(attr));
          if (!target) return false;
          return chain().focus().updateAttributes(target.name, { [attr]: value }).run();
        },
      clearStyleTokens:
        () =>
        ({ state, chain }) => {
          const block = findTarget(state, STYLED_NODES);
          if (!block) return false;
          const cleared = Object.fromEntries(STYLE_ATTRS.map((a) => [a, null]));
          const list = findTarget(state, LIST_NODES);
          const run = chain().focus().updateAttributes(block.name, cleared);
          // clearing inside a list also drops the list's own density
          return (list && list.name !== block.name ? run.updateAttributes(list.name, { "data-density": null }) : run).run();
        },
    };
  },
});

type EditorLike = { state: Parameters<typeof findTarget>[0] };

/** Is the cursor inside a list? (the menu only offers density there) */
export function inList(editor: EditorLike): boolean {
  return !!findTarget(editor.state, LIST_NODES);
}

/**
 * The tokens in effect where the cursor is: the block's own, plus the density
 * of the list around it (which lives on a different node).
 */
export function activeStyleTokens(editor: EditorLike): Partial<Record<StyleAttr, string>> {
  const out: Partial<Record<StyleAttr, string>> = {};
  const block = findTarget(editor.state, STYLED_NODES);
  const list = findTarget(editor.state, LIST_NODES);
  for (const attr of STYLE_ATTRS) {
    const source = attr === "data-density" ? list : block;
    const v = source?.attrs[attr];
    if (typeof v === "string" && v) out[attr] = v;
  }
  return out;
}
