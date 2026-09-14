/**
 * The car mark — a flat paper-cut side-view car in the same family as
 * `BusLogo` (cream windows, sun-yellow headlight, dark wheels). Cars carry no
 * colour in the data, so it defaults to a bright red (easy to spot next to the
 * buses) but accepts a `color` for symmetry with the bus.
 */
export default function CarLogo({
  color = "#e8503a",
  size = 40,
  title,
}: {
  color?: string;
  size?: number;
  /** accessible name; when set the SVG is announced, otherwise it is decorative */
  title?: string;
}) {
  const dark = shade(color, -0.28);
  const roof = shade(color, 0.16);
  const deep = shade(color, -0.45);
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className="car-logo"
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      focusable="false"
    >
      {title && <title>{title}</title>}
      {/* wheels: tyre + hub */}
      <circle cx="20" cy="49" r="8" fill={deep} />
      <circle cx="20" cy="49" r="3.4" fill="#faf4e6" />
      <circle cx="44" cy="49" r="8" fill={deep} />
      <circle cx="44" cy="49" r="3.4" fill="#faf4e6" />
      {/* cabin / roof */}
      <path d="M20 33 L26 20 Q27.5 17 31 17 L40 17 Q44 17 46 20.5 L51 33 Z" fill={roof} />
      {/* lower body */}
      <rect x="5" y="31" width="54" height="15" rx="7.5" fill={color} />
      {/* wheel arches so the body hugs the tyres */}
      <circle cx="20" cy="49" r="9.5" fill="none" stroke={color} strokeWidth="3" />
      <circle cx="44" cy="49" r="9.5" fill="none" stroke={color} strokeWidth="3" />
      {/* windows (two cream panes split by a pillar) */}
      <path d="M27 20.5 Q27.6 19 29.5 19 L31 19 L31 30 L23.5 30 Z" fill="#faf4e6" />
      <path d="M34 19 L39.5 19 Q42 19 43 21 L45.5 30 L34 30 Z" fill="#faf4e6" />
      {/* door line + rounded handle */}
      <line x1="32.5" y1="31" x2="32.5" y2="44" stroke={dark} strokeWidth="1.6" opacity="0.55" />
      <rect x="35" y="35" width="5" height="2" rx="1" fill={dark} opacity="0.7" />
      {/* side mirror */}
      <path d="M24 31 l-3 -2.5 v3 z" fill={dark} />
      {/* headlight + tail light + bumper */}
      <circle cx="55" cy="37" r="2.6" fill="#f4c430" />
      <rect x="5.5" y="35" width="3" height="4" rx="1.2" fill="#faf4e6" />
      <rect x="52" y="41" width="6" height="3" rx="1.5" fill={dark} />
    </svg>
  );
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
