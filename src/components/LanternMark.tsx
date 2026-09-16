import { useId, useRef, type CSSProperties, type RefObject } from "react";
import { useGlowVar } from "../hooks/useGlowVar";

/**
 * The camp assistant's lantern (the inline twin of `ICONS.assistant`), drawn as
 * SVG so the star behind the glass can be lit on its own: it swells and glows
 * with whoever is speaking. Feed it `glowRef` and the star follows the voice
 * frame by frame, without re-rendering React.
 */
interface LanternMarkProps {
  size?: number | string;
  /** live 0–1 loudness, read once per frame */
  glowRef?: RefObject<{ level: number } | null>;
  /** fixed 0–1 glow; left out, the star follows the `--lantern-glow` it inherits */
  glow?: number;
  /** a voice session is open: the flame keeps breathing between phrases */
  live?: boolean;
  className?: string;
}

const STAR = "M126.5 121c1.12 15.68 12.32 26.88 28 28-15.68 1.12-26.88 12.32-28 28-1.12-15.68-12.32-26.88-28-28 15.68-1.12 26.88-12.32 28-28Z";

export default function LanternMark({ size = "1em", glowRef, glow, live = false, className = "" }: LanternMarkProps) {
  const haloId = `lantern-halo-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const svgRef = useRef<SVGSVGElement>(null);
  useGlowVar(svgRef, glowRef);

  return (
    <svg
      ref={svgRef}
      className={`lantern-mark ${live ? "lantern-mark--live" : ""} ${className}`}
      style={glowRef || glow === undefined ? undefined : ({ "--lantern-glow": Math.min(1, Math.max(0, glow)) } as CSSProperties)}
      width={size}
      height={size}
      viewBox="0 0 256 256"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id={haloId}>
          <stop offset="0%" stopColor="#fff0bd" />
          <stop offset="45%" stopColor="#f9cb4a" stopOpacity=".7" />
          <stop offset="100%" stopColor="#f7c33f" stopOpacity="0" />
        </radialGradient>
      </defs>

      <path d="M 97 58 L 97 28 Q 97 12 113 12 L 142 12 Q 158 12 158 28 L 158 58" fill="none" stroke="#ea9431" strokeWidth="12" />
      <rect x="105" y="36" width="44" height="34" rx="20" fill="#155c53" />
      <path d="M 97 63 L 157 63 L 189 90 L 65 90 Z" fill="#155c53" stroke="#155c53" strokeWidth="9" strokeLinejoin="round" />

      <circle cx="127" cy="147" r="66.5" fill="#11a091" />
      <path d="M 94 174 Q 80 198 65 207 Q 90 210 119 195 Z" fill="#11a091" />

      <rect x="90" y="198" width="74" height="26" rx="9" fill="#155c53" />
      <rect x="72" y="221" width="110" height="29" rx="12" fill="#155c53" />

      <circle cx="126.5" cy="149" r="38.5" fill="#f3efe3" />
      <circle className="lantern-mark__halo" cx="126.5" cy="149" r="38.5" fill={`url(#${haloId})`} />
      <circle className="lantern-mark__ring" cx="126.5" cy="149" r="36" fill="none" stroke="#f7c33f" strokeWidth="3" />
      <path className="lantern-mark__star" d={STAR} fill="#f2bb32" />
    </svg>
  );
}
