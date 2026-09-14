import { command } from "./client";
import { bearer } from "../auth/store";

/** A camp team ("Time Belém"): kids and staff are split into teams that compete in the games. */
export interface Team {
  id: string;
  name: string;
  /** #rrggbb */
  color: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface TeamInput {
  name: string;
  color: string;
}

const json = (token: string) => ({ ...bearer(token), "content-type": "application/json" });

export async function createTeam(token: string, input: TeamInput): Promise<Team> {
  const res = await command<{ team: Team }>("/api/teams", { method: "POST", headers: json(token), body: JSON.stringify(input) }, ["teams"]);
  return res.team;
}

export async function updateTeam(token: string, id: string, patch: Partial<TeamInput>): Promise<Team> {
  const res = await command<{ team: Team }>(`/api/teams/${id}`, { method: "PUT", headers: json(token), body: JSON.stringify(patch) }, ["teams"]);
  return res.team;
}

export async function reorderTeams(token: string, ids: string[]): Promise<void> {
  await command(`/api/teams/reorder`, { method: "PUT", headers: json(token), body: JSON.stringify({ ids }) }, ["teams"]);
}

/** Unlinks every kid / staff member from the team and drops its score lines. */
export async function deleteTeam(token: string, id: string): Promise<void> {
  await command(`/api/teams/${id}`, { method: "DELETE", headers: bearer(token) }, ["teams", "campers", "staff", "scores"]);
}

/** Readable text colour (black / white) for a team colour background. */
export function contrastText(hex: string): string {
  const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
  if (!m) return "#fff";
  const [r, g, b] = [m[1], m[2], m[3]].map((x) => parseInt(x, 16) / 255);
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return lum > 0.6 ? "#183d36" : "#fff";
}
