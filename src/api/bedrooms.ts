import { api } from "./client";
import { remove, upsert } from "../store";
import { bearer } from "../auth/store";
import { roleMeta } from "../roles";
import { ICONS } from "../icons";

export const BEDROOM_GROUPS = ["girls", "boys", "staff"] as const;
export type BedroomGroup = (typeof BEDROOM_GROUPS)[number];

/** `icon` is a paper-cut image (same set as the login page); falls back to `emoji` when absent. */
export const GROUP_META: Record<BedroomGroup, { label: string; emoji: string; icon?: string; color: string }> = {
  girls: { label: "Meninas", emoji: "👧", icon: ICONS.girls, color: "pink" },
  boys: { label: "Meninos", emoji: "👦", icon: ICONS.boys, color: "blue" },
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

export async function listBedrooms(token: string): Promise<Bedroom[]> {
  const res = await api<{ bedrooms: Bedroom[] }>("/api/bedrooms", { headers: bearer(token) });
  return res.bedrooms;
}

export interface BedroomDetail {
  bedroom: Bedroom;
  campers: import("./campers").Camper[];
  staff: import("./staff").Staff[];
}

export async function getBedroomDetail(token: string, id: string): Promise<BedroomDetail> {
  return api<BedroomDetail>(`/api/bedrooms/${id}/detail`, { headers: bearer(token) });
}

export async function createBedroom(token: string, input: BedroomInput): Promise<Bedroom> {
  const res = await api<{ bedroom: Bedroom }>("/api/bedrooms", {
    method: "POST",
    headers: json(token),
    body: JSON.stringify(input),
  });
  upsert("bedrooms", res.bedroom);
  return res.bedroom;
}

export async function updateBedroom(token: string, id: string, patch: Partial<BedroomInput>): Promise<Bedroom> {
  const res = await api<{ bedroom: Bedroom }>(`/api/bedrooms/${id}`, {
    method: "PUT",
    headers: json(token),
    body: JSON.stringify(patch),
  });
  upsert("bedrooms", res.bedroom);
  return res.bedroom;
}

export async function deleteBedroom(token: string, id: string): Promise<void> {
  await api(`/api/bedrooms/${id}`, { method: "DELETE", headers: bearer(token) });
  remove("bedrooms", id);
}
