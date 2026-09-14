/**
 * The bus mark, tinted with the vehicle's own colour. A flat paper-cut
 * front-facing bus (same family as the app's PNG icons) drawn as inline SVG so
 * the body takes any bus colour and, optionally, shows the bus number on the
 * front — usable anywhere a bus needs a coloured logo (settings, roll call,
 * cards, pickers).
 */
export default function BusLogo({
  color = "#0f9a8a",
  number,
  size = 40,
  title,
}: {
  color?: string;
  /** shown in the round badge on the front; hidden when absent */
  number?: string | null;
  size?: number;
  /** accessible name; when set the SVG is announced, otherwise it is decorative */
  title?: string;
}) {
  // A light body (yellow, sun) washes every detail out: lightening an already
  // pale colour barely changes it and the cream windows / yellow headlights
  // disappear. So on light buses the roof band goes DARKER instead of lighter,
  // the wheels get a deeper shade and the panes are outlined — every bus then
  // shows the same amount of detail.
  const light = isLight(color);
  const dark = shade(color, light ? -0.45 : -0.28);
  const roof = shade(color, light ? -0.16 : 0.18);
  const edge = shade(color, light ? -0.5 : -0.42);
  const outline = light ? { stroke: edge, strokeWidth: 1.4 } : {};
  const lampFill = light ? edge : "#f4c430";
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className="bus-logo"
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      focusable="false"
    >
      {title && <title>{title}</title>}
      {/* wheels */}
      <circle cx="19" cy="55" r="6" fill={dark} />
      <circle cx="45" cy="55" r="6" fill={dark} />
      {/* body */}
      <rect x="7" y="12" width="50" height="42" rx="9" fill={color} />
      {/* roof band */}
      <path d="M16 12h32a9 9 0 0 1 9 9v2H7v-2a9 9 0 0 1 9-9z" fill={roof} />
      {/* windscreen (two panes) */}
      <rect x="13" y="19" width="17" height="14" rx="3.5" fill="#faf4e6" {...outline} />
      <rect x="34" y="19" width="17" height="14" rx="3.5" fill="#faf4e6" {...outline} />
      {/* headlights */}
      <circle cx="15" cy="44" r="3.4" fill={lampFill} />
      <circle cx="49" cy="44" r="3.4" fill={lampFill} />
      {/* front number badge */}
      {number ? (
        <>
          <circle cx="32" cy="43.5" r="7.6" fill="#fff" {...outline} />
          <text
            x="32"
            y="44"
            textAnchor="middle"
            dominantBaseline="central"
            fontSize="9"
            fontWeight="800"
            fontFamily="var(--font-display, system-ui, sans-serif)"
            fill={dark}
          >
            {number}
          </text>
        </>
      ) : (
        <rect x="26" y="41" width="12" height="5" rx="2.5" fill={dark} opacity="0.6" />
      )}
    </svg>
  );
}

/** True for a pale body colour (yellow, sun) where cream details would vanish. */
function isLight(hex: string): boolean {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return false;
  const n = parseInt(m[1], 16);
  // perceived luminance (ITU-R BT.601)
  const l = (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
  return l > 0.6;
}

/** Lighten (amount>0) or darken (amount<0) a #rrggbb hex by a ratio. */
function shade(hex: string, amount: number): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  const t = amount < 0 ? 0 : 255;
  const p = Math.abs(amount);
  const ch = (c: number) => Math.round((t - c) * p) + c;
  const r = ch((n >> 16) & 255);
  const g = ch((n >> 8) & 255);
  const b = ch(n & 255);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}
