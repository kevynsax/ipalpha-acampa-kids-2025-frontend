import { solve, type DistributeInput, type DistributionPlan } from "./roomDistribution";

/**
 * Runs the room solver off the main thread. Maps are not structured-cloneable
 * as-is in every browser, so `prefs` travels as entries.
 */
export interface WorkerRequest {
  input: Omit<DistributeInput, "prefs" | "excludeStaffIds"> & {
    prefs: [string, DistributeInput["prefs"] extends Map<string, infer V> ? V : never][];
    excludeStaffIds: string[];
  };
  deadlineMs: number;
}
export type WorkerMessage =
  | { type: "progress"; best: DistributionPlan; attempts: number }
  | { type: "done"; best: DistributionPlan; attempts: number }
  | { type: "error"; message: string };

const post = (m: WorkerMessage) => (self as unknown as Worker).postMessage(m);

self.onmessage = (e: MessageEvent<WorkerRequest>) => {
  try {
    const { input, deadlineMs } = e.data;
    const full: DistributeInput = { ...input, prefs: new Map(input.prefs), excludeStaffIds: new Set(input.excludeStaffIds) };
    let count = 0;
    const best = solve(full, deadlineMs, (b, attempts) => {
      count = attempts;
      post({ type: "progress", best: b, attempts });
    });
    post({ type: "done", best, attempts: count });
  } catch (err) {
    // never die silently: the dialog would sit on a full progress bar forever
    post({ type: "error", message: err instanceof Error ? `${err.name}: ${err.message}` : String(err) });
  }
};
