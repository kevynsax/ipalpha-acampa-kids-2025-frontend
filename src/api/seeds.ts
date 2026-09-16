import { api, command } from "./client";
import { bearer } from "../auth/store";
import type { KnownPlace } from "../wizard/places";
import type { TemplateEvent, TemplateRole } from "../wizard/scheduleTemplate";

/**
 * 🌱 Seeds — the templates the setup wizard imports, maintained by the super
 * admin in ⚙️ → Sementes. Whatever is saved here REPLACES the app's built-in
 * defaults (frontend/src/wizard/places.ts + scheduleTemplate.ts) everywhere.
 */

/** One bus of the fleet seeded on an empty camp. */
export interface SeedBus {
  number: string;
  color: string;
  capacity: number | null;
}

/** The two starter documents the wizard writes. */
export interface SeedDocs {
  prepTitle: string;
  prepEmoji: string;
  prepContent: string;
  addressTitle: string;
  addressEmoji: string;
}

export interface Seeds {
  places: KnownPlace[];
  roles: TemplateRole[];
  events: TemplateEvent[];
  fleet: SeedBus[];
  docs: SeedDocs;
  updatedAt: string | null;
}

/** The saved seeds, or null when the super admin never changed them (built-in defaults apply). */
export async function fetchSeeds(token: string): Promise<Seeds | null> {
  const res = await api<{ seeds: Seeds | null }>("/api/seeds", { headers: bearer(token) });
  return res.seeds;
}

/** SUPER ADMIN only: replaces the whole seeds document. */
export async function saveSeeds(token: string, seeds: Omit<Seeds, "updatedAt">): Promise<Seeds> {
  const res = await command<{ seeds: Seeds }>(
    "/api/seeds",
    { method: "PUT", headers: { ...bearer(token), "content-type": "application/json" }, body: JSON.stringify(seeds) },
    [],
  );
  return res.seeds;
}

/** SUPER ADMIN only: throws the saved seeds away — back to the app's built-in defaults. */
export async function resetSeeds(token: string): Promise<void> {
  await command("/api/seeds", { method: "DELETE", headers: bearer(token) }, []);
}
