/**
 * Small inline SVG icons for the spots where an emoji reads wrong
 * (📷 for a QR scan, ⬇️ for a download…). Sized with `1em` so they
 * follow the button's font size; `currentColor` unless a brand colour fits.
 */
interface GlyphProps {
  size?: number | string;
  className?: string;
}

/** a QR code — used on every "read the badge / wristband" action */
export function QrGlyph({ size = "1.1em", className }: GlyphProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M3 3h8v8H3V3zm2 2v4h4V5H5zm1 1h2v2H6V6zM13 3h8v8h-8V3zm2 2v4h4V5h-4zm1 1h2v2h-2V6zM3 13h8v8H3v-8zm2 2v4h4v-4H5zm1 1h2v2H6v-2zM13 13h2v2h-2v-2zm2 2h2v2h-2v-2zm2-2h2v2h-2v-2zm2 2h2v2h-2v-2zm-6 4h2v2h-2v-2zm4 0h2v2h-2v-2zm-2-2h2v2h-2v-2zm4 2h2v2h-2v-2z" />
    </svg>
  );
}

/** an undo arrow — used on every "Desfazer" action (buttons and confirm titles) instead of the ↩️ emoji */
export function UndoGlyph({ size = "1.1em", className }: GlyphProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 14 4 9l5-5" />
      <path d="M4 9h9.5a6.5 6.5 0 0 1 0 13H12" />
    </svg>
  );
}

/** two arrows swapping places (→ over ←) — used on "Trocar" (move to another room / hand over to another leader) instead of the 🔄 emoji */
export function SwapGlyph({ size = "1.1em", className }: GlyphProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 8h15" />
      <path d="m15 4 4 4-4 4" />
      <path d="M20 16H5" />
      <path d="m9 12-4 4 4 4" />
    </svg>
  );
}

/** a bold check mark — used inside ticked boxes instead of the ✓ character */
export function CheckGlyph({ size = "1.1em", className }: GlyphProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4.5 12.5l5 5 10-11" />
    </svg>
  );
}

/** a download arrow into a tray — used on the "Download" (Excel) buttons */
export function DownloadGlyph({ size = "1.1em", className }: GlyphProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 4v11" />
      <path d="M7 10l5 5 5-5" />
      <path d="M4 17v2a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-2" />
    </svg>
  );
}
