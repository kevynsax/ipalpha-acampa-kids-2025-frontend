import { api } from "./client";
import { bearer } from "../auth/store";

/** SUPER ADMIN: how many remembered staff + camper import mappings the dictionary cache holds. */
export async function fetchImportCacheCount(token: string): Promise<{ count: number; staff: number; campers: number }> {
  return api("/api/super/import-cache", { headers: bearer(token) });
}

/** SUPER ADMIN: wipe the staff import column cache. */
export async function wipeStaffImportCache(token: string): Promise<{ removed: number }> {
  return api("/api/super/import-cache/staff", { method: "POST", headers: bearer(token) });
}

/** SUPER ADMIN: wipe the import dictionary cache. Returns how many mappings were removed. */
export async function wipeImportCache(token: string): Promise<{ removed: number }> {
  return api("/api/super/import-cache", { method: "POST", headers: bearer(token) });
}
