/**
 * Estimated US$ cost of the AI models the app can call, from the gateway's
 * price table (per 1M tokens, non-batch — the app never uses batch variants).
 * Keys are normalized (dots → dashes), so "claude-fable-5.1" and
 * "claude-fable-5-1" both match. Models missing from the table are estimated
 * from their closest sibling (luna ≈ sol, grok-4.5 ≈ 4.6).
 */
const PRICE_PER_MTOK: Record<string, [inPrice: number, outPrice: number]> = {
  "claude-fable-5-1": [10, 50],
  "claude-fable-5": [10, 50],
  "claude-opus-5": [5, 25],
  "claude-opus-4-8": [5, 25],
  "claude-opus-4-7": [5, 25],
  "gpt-6-astra": [10, 50],
  "gpt-5-6-sol": [2, 10],
  "gpt-5-6-terra": [2, 12],
  "gpt-5-6-luna": [0.2, 1.2],
  "grok-4-6": [2, 6],
  "grok-4-5": [2, 6],
  "muse-spark-1-3": [1.25, 4.25],
  "muse-spark-1-2": [1.25, 4.25],
  "glm-5-3": [1.4, 4.4],
  "glm-5-3-flash": [0.15, 0.5],
  "typesafe/jev-1-13": [0.042, 0],
};

/** US$ 12,34-style currency (the app is pt-BR but pays the gateway in US$). */
export const usd = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "USD" });

/** Estimated US$ cost of `promptTokens` + `completionTokens` on `model`; null when the model has no price. */
export function estimateCostUsd(model: string, promptTokens: number, completionTokens: number): number | null {
  const price = PRICE_PER_MTOK[model.toLowerCase().replace(/[._]/g, "-")];
  if (!price) return null;
  return (promptTokens * price[0] + completionTokens * price[1]) / 1_000_000;
}
