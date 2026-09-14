import { aiImage, type AiImageShape } from "./api/ai";
import { uploadImage } from "./api/files";

/**
 * The assistant can ask the app to DRAW a picture: instead of a src it writes
 *   <img data-gen="descrição do desenho" alt="…">
 * Before such a document can be shown (and saved — the server drops srcless
 * images), each placeholder is rendered by the gateway, shrunk on the device and
 * uploaded to /api/files, then the tag gets its real `/api/files/<id>` src.
 */

/** a reply may not turn into a batch of renders: hard cap per document */
const MAX_PER_DOC = 3;

const IMG_TAG = /<img\b[^>]*>/gi;

function attr(tag: string, name: string): string | null {
  const m = new RegExp(`${name}="([^"]*)"`, "i").exec(tag) ?? new RegExp(`${name}='([^']*)'`, "i").exec(tag);
  return m ? m[1] : null;
}

function decodeEntities(value: string): string {
  const el = document.createElement("textarea");
  el.innerHTML = value;
  return el.value;
}

export interface PendingImage {
  /** the whole `<img …>` tag as it appears in the HTML */
  tag: string;
  /** what to draw */
  description: string;
  alt: string;
  shape: AiImageShape;
}

/** Placeholders the assistant left in a document, in order, capped. */
export function pendingImages(html: string): PendingImage[] {
  const out: PendingImage[] = [];
  for (const tag of html.match(IMG_TAG) ?? []) {
    const gen = attr(tag, "data-gen");
    if (!gen || attr(tag, "src")) continue;
    const description = decodeEntities(gen).trim();
    if (!description) continue;
    const shapeAttr = attr(tag, "data-shape");
    const shape: AiImageShape = shapeAttr === "square" || shapeAttr === "tall" ? shapeAttr : "wide";
    out.push({ tag, description, alt: decodeEntities(attr(tag, "alt") ?? "").trim(), shape });
    if (out.length >= MAX_PER_DOC) break;
  }
  return out;
}

/** data url → File, so a generated picture goes through the normal upload path. */
export async function dataUrlToFile(dataUrl: string, name: string): Promise<File> {
  const blob = await (await fetch(dataUrl)).blob();
  const ext = blob.type === "image/webp" ? "webp" : blob.type === "image/jpeg" ? "jpg" : "png";
  return new File([blob], `${name}.${ext}`, { type: blob.type || "image/png" });
}

/** Renders one description and stores it; returns the relative `/api/files/<id>` url. */
async function generateAndUpload(
  token: string,
  input: { description: string; shape?: AiImageShape; model?: string; name?: string },
  signal?: AbortSignal,
): Promise<{ url: string; model: string }> {
  const img = await aiImage(token, { description: input.description, shape: input.shape, model: input.model }, signal);
  const file = await dataUrlToFile(img.dataUrl, input.name?.replace(/[^\w-]+/g, "-").slice(0, 40) || "ilustracao");
  const up = await uploadImage(token, file);
  return { url: up.url, model: img.model };
}

/** an `<img>` tag with the placeholder attributes swapped for the stored src */
function withSrc(tag: string, url: string, alt: string): string {
  const attrs = [`src="${url}"`, `alt="${alt.replace(/"/g, "&quot;")}"`].join(" ");
  return `<img ${attrs}>`;
}

/**
 * Renders every placeholder in a document (sequentially — the gateway is slow
 * and parallel renders get rate-limited) and returns the HTML with real srcs.
 * `onProgress` drives the "desenhando 1 de 2…" note in the chat. Placeholders
 * that fail are removed, and reported in `failed`.
 */
export async function resolveGeneratedImages(
  token: string,
  html: string,
  opts: { model?: string; signal?: AbortSignal; onProgress?: (done: number, total: number, description: string) => void } = {},
): Promise<{ html: string; made: number; failed: string[] }> {
  const pending = pendingImages(html);
  if (!pending.length) return { html, made: 0, failed: [] };
  let out = html;
  const failed: string[] = [];
  let made = 0;
  for (const [i, p] of pending.entries()) {
    opts.onProgress?.(i, pending.length, p.description);
    try {
      const { url } = await generateAndUpload(token, { description: p.description, shape: p.shape, model: opts.model, name: p.alt || "ilustracao" }, opts.signal);
      out = out.replace(p.tag, withSrc(p.tag, url, p.alt));
      made++;
    } catch (err) {
      if ((err as Error)?.name === "AbortError") throw err;
      console.error("generated image failed", p.description, err);
      out = out.replace(p.tag, "");
      failed.push(p.description);
    }
  }
  // a <figure> whose image failed would keep a lonely caption
  out = out.replace(/<figure>(?:(?!<img)[\s\S])*?<\/figure>/g, (m) => (/<img\s/i.test(m) ? m : ""));
  opts.onProgress?.(pending.length, pending.length, "");
  return { html: out, made, failed };
}
