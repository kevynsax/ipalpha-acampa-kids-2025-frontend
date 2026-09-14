import { command } from "./client";
import { bearer } from "../auth/store";
import { roleMeta } from "../roles";
import { ICONS } from "../icons";

export const BEDROOM_GROUPS = ["girls", "boys", "staff"] as const;
export type BedroomGroup = (typeof BEDROOM_GROUPS)[number];

/**
 * `icon` is a paper-cut image (same set as the login page); `face` is the
 * head-only version for inline markers (chips, tabs). `emoji` is the plain-text
 * fallback (native <select>/<optgroup>, exports) — never render it where an
 * image can go.
 */
export const GROUP_META: Record<BedroomGroup, { label: string; emoji: string; icon?: string; face?: string; color: string }> = {
  girls: { label: "Meninas", emoji: "👧", icon: ICONS.girls, face: ICONS.girlFace, color: "pink" },
  boys: { label: "Meninos", emoji: "👦", icon: ICONS.boys, face: ICONS.boyFace, color: "blue" },
  staff: { label: "Equipe", emoji: "🎒", icon: roleMeta("staff").icon, color: "green" },
};

export interface Bedroom {
  id: string;
  name: string;
  group: BedroomGroup;
  bunkBeds: number;
  singleBeds: number;
  capacity: number;
  occupied: number;
  occupiedStaff: number;
  occupiedCampers: number;
  available: number;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface BedroomInput {
  name: string;
  group: BedroomGroup;
  bunkBeds: number;
  singleBeds: number;
  notes: string;
}

/** "103 · Meninas" — how a bedroom is shown in pickers/tags. */
export function bedroomLabel(b: Pick<Bedroom, "name" | "group">): string {
  return `${GROUP_META[b.group].label} - ${b.name}`;
}

const json = (token: string) => ({ ...bearer(token), "content-type": "application/json" });

export interface BedroomDetail {
  bedroom: Bedroom;
  campers: import("./campers").Camper[];
  staff: import("./staff").Staff[];
}

export async function createBedroom(token: string, input: BedroomInput): Promise<Bedroom> {
  const res = await command<{ bedroom: Bedroom }>("/api/bedrooms", {
    method: "POST",
    headers: json(token),
    body: JSON.stringify(input),
  }, ["bedrooms"]);
  return res.bedroom;
}

export async function updateBedroom(token: string, id: string, patch: Partial<BedroomInput>): Promise<Bedroom> {
  const res = await command<{ bedroom: Bedroom }>(`/api/bedrooms/${id}`, {
    method: "PUT",
    headers: json(token),
    body: JSON.stringify(patch),
  }, ["bedrooms"]);
  return res.bedroom;
}

export async function deleteBedroom(token: string, id: string): Promise<void> {
  await command(`/api/bedrooms/${id}`, { method: "DELETE", headers: bearer(token) }, ["bedrooms"]);
}
