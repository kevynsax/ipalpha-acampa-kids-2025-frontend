import type { AiVendor } from "../api/ai";
import anthropic from "../assets/ai/anthropic.svg";
import openai from "../assets/ai/openai.svg";
import xai from "../assets/ai/xai.svg";
import meta from "../assets/ai/meta.svg";
import zhipu from "../assets/ai/zhipu.svg";
import google from "../assets/ai/google.svg";

const LOGOS: Partial<Record<AiVendor, { src: string; name: string }>> = {
  anthropic: { src: anthropic, name: "Anthropic" },
  openai: { src: openai, name: "OpenAI" },
  xai: { src: xai, name: "xAI" },
  meta: { src: meta, name: "Meta" },
  zhipu: { src: zhipu, name: "Zhipu AI" },
  google: { src: google, name: "Google" },
};

/** Usage-only vendor tags that share a company logo (e.g. the direct OpenAI API and the gateway's OpenAI models). */
const VENDOR_ALIASES: Record<string, AiVendor> = { openai_api: "openai" };

/** Fallback when the server didn't send a vendor: guess it from the model id. */
export function guessVendor(modelId?: string): AiVendor | undefined {
  const id = (modelId ?? "").toLowerCase();
  if (id.startsWith("claude")) return "anthropic";
  if (id.startsWith("gpt") || /^o\d/.test(id)) return "openai";
  if (id.startsWith("grok")) return "xai";
  if (id.startsWith("muse") || id.startsWith("llama")) return "meta";
  if (id.startsWith("glm")) return "zhipu";
  if (id.startsWith("gemini") || id.startsWith("gemma")) return "google";
  if (id.startsWith("qwen") || id.startsWith("qwen3")) return "alibaba";
  return undefined;
}

/** Company mark shown beside a model name. Renders nothing for unknown vendors. */
export default function AiVendorLogo({ vendor, modelId, size = 16 }: { vendor?: AiVendor; modelId?: string; size?: number }) {
  const resolved = vendor ? VENDOR_ALIASES[vendor] ?? vendor : guessVendor(modelId);
  const logo = LOGOS[resolved ?? ("" as AiVendor)];
  if (!logo) return null;
  return <img className="ai-vendor-logo" src={logo.src} alt={logo.name} title={logo.name} width={size} height={size} />;
}
