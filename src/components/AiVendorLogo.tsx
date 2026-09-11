import type { AiVendor } from "../api/ai";
import anthropic from "../assets/ai/anthropic.svg";
import openai from "../assets/ai/openai.svg";
import xai from "../assets/ai/xai.svg";
import meta from "../assets/ai/meta.svg";
import zhipu from "../assets/ai/zhipu.svg";

const LOGOS: Record<AiVendor, { src: string; name: string }> = {
  anthropic: { src: anthropic, name: "Anthropic" },
  openai: { src: openai, name: "OpenAI" },
  xai: { src: xai, name: "xAI" },
  meta: { src: meta, name: "Meta" },
  zhipu: { src: zhipu, name: "Zhipu AI" },
};

/** Fallback when the server didn't send a vendor: guess it from the model id. */
export function guessVendor(modelId?: string): AiVendor | undefined {
  const id = (modelId ?? "").toLowerCase();
  if (id.startsWith("claude")) return "anthropic";
  if (id.startsWith("gpt") || /^o\d/.test(id)) return "openai";
  if (id.startsWith("grok")) return "xai";
  if (id.startsWith("muse") || id.startsWith("llama")) return "meta";
  if (id.startsWith("glm")) return "zhipu";
  return undefined;
}

/** Company mark shown beside a model name. Renders nothing for unknown vendors. */
export default function AiVendorLogo({ vendor, modelId, size = 16 }: { vendor?: AiVendor; modelId?: string; size?: number }) {
  const logo = LOGOS[vendor ?? guessVendor(modelId) ?? ("" as AiVendor)];
  if (!logo) return null;
  return <img className="ai-vendor-logo" src={logo.src} alt={logo.name} title={logo.name} width={size} height={size} />;
}
