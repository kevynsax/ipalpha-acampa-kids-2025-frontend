import { command } from "./client";
import { bearer } from "../auth/store";

/**
 * One line of the scoreboard ledger: points given to (positive) or taken
 * from (negative) a team. A team's score is the sum of its lines; "zerar"
 * writes a `reset` line cancelling the total, so nothing is ever lost.
 */
export interface ScoreEntry {
  id: string;
  teamId: string;
  points: number;
  kind: "add" | "remove" | "reset";
  note: string;
  by: { id: string; name: string };
  createdAt: string;
}

const json = (token: string) => ({ ...bearer(token), "content-type": "application/json" });

/** `points` > 0 gives, < 0 takes. */
export async function addScore(token: string, input: { teamId: string; points: number; note?: string }): Promise<ScoreEntry> {
  const res = await command<{ score: ScoreEntry }>("/api/scores", { method: "POST", headers: json(token), body: JSON.stringify(input) }, ["scores"]);
  return res.score;
}

/** Zeroes the team (writes a line cancelling its current total). */
export async function resetScore(token: string, teamId: string, note = ""): Promise<ScoreEntry> {
  const res = await command<{ score: ScoreEntry }>(`/api/scores/reset/${teamId}`, { method: "POST", headers: json(token), body: JSON.stringify({ note }) }, ["scores"]);
  return res.score;
}

/** Removes one line (a mistake) — its points are undone. */
export async function deleteScore(token: string, id: string): Promise<void> {
  await command(`/api/scores/${id}`, { method: "DELETE", headers: bearer(token) }, ["scores"]);
}
