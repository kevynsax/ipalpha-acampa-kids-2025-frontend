import { ApiError, OFFLINE_MESSAGE } from "./client";
import { bearer } from "../auth/store";

// In production the API is served by the same origin through the /api Ingress.
// VITE_API_URL is only needed when development uses a separate backend.
const BASE = import.meta.env.VITE_API_URL || window.location.origin;

export interface UploadedFile {
  id: string;
  /** relative: "/api/files/<id>" — resolve with `fileUrl()` before showing */
  url: string;
  name: string;
  type: string;
  size: number;
}

/** Makes a "/api/files/…" src absolute (the API may live on another host). */
export function fileUrl(relative: string): string {
  return relative.startsWith("/api/") ? `${BASE}${relative}` : relative;
}

/** Turns absolute API image urls back into the relative form the backend stores. */
export function relativizeFileUrls(html: string): string {
  return html.split(`${BASE}/api/files/`).join("/api/files/");
}

/** Resolves relative image urls for display. */
export function absolutizeFileUrls(html: string): string {
  return html.replace(/(src=")\/api\/files\//g, `$1${BASE}/api/files/`);
}

const MAX_EDGE = 1280;
const MAX_UPLOAD = 2 * 1024 * 1024;

/**
 * Shrinks a picture on the device before upload (phones shoot 4000 px JPEGs):
 * longest edge ≤ 1280 px, re-encoded as JPEG (or WebP when the source is PNG
 * with transparency… we keep it simple: PNG stays PNG, anything else → JPEG).
 */
export async function shrinkImage(file: File): Promise<Blob> {
  if (file.type === "image/gif") return file; // keep animations
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return file;
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  if (scale === 1 && file.size <= MAX_UPLOAD) {
    bitmap.close();
    return file;
  }
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    return file;
  }
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const type = file.type === "image/png" ? "image/png" : "image/jpeg";
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, 0.85));
  return blob ?? file;
}

export async function uploadImage(token: string, file: File): Promise<UploadedFile> {
  const blob = await shrinkImage(file);
  const form = new FormData();
  const name = blob === file ? file.name : file.name.replace(/\.\w+$/, "") + (blob.type === "image/png" ? ".png" : ".jpg");
  form.append("file", blob, name);
  let res: Response;
  try {
    res = await fetch(`${BASE}/api/files`, { method: "POST", headers: bearer(token), body: form });
  } catch {
    throw new ApiError(0, "OFFLINE", OFFLINE_MESSAGE);
  }
  const data = (await res.json().catch(() => null)) as { file?: UploadedFile; error?: { code?: string; message?: string } } | null;
  if (!res.ok || !data?.file) {
    throw new ApiError(res.status, data?.error?.code ?? "UPLOAD_FAILED", data?.error?.message ?? "Não foi possível enviar a imagem.");
  }
  return data.file;
}
