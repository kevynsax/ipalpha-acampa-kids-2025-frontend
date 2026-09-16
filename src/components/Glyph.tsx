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

/** a four-point spark (Google-style "AI" mark) — every AI action / status, instead of the ✨ emoji (no longer used anywhere, so the spark always means AI) */
export function AiGlyph({ size = "1.1em", className }: GlyphProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2c.4 5.6 4.4 9.6 10 10-5.6.4-9.6 4.4-10 10-.4-5.6-4.4-9.6-10-10 5.6-.4 9.6-4.4 10-10z" />
    </svg>
  );
}

/** a microphone on its stand — "falar com o assistente" / the mic is open */
export function MicGlyph({ size = "1.1em", className }: GlyphProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="9" y="2.4" width="6" height="11.2" rx="3" />
      <path d="M5 11.2a7 7 0 0 0 14 0" />
      <path d="M12 18.2v3.4" />
    </svg>
  );
}

/** the same microphone crossed out — the mic is muted while the conversation stays open */
export function MicOffGlyph({ size = "1.1em", className }: GlyphProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="9" y="2.4" width="6" height="11.2" rx="3" />
      <path d="M5 11.2a7 7 0 0 0 14 0" />
      <path d="M12 18.2v3.4" />
      <path d="M4 3.4 20 20.6" />
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

/** an upload arrow out of a tray — the "Enviar fotos" action */
export function UploadGlyph({ size = "1.1em", className }: GlyphProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 15V4" />
      <path d="M7 9l5-5 5 5" />
      <path d="M4 17v2a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-2" />
    </svg>
  );
}

/** four arrows pushing into the corners — "open this in full screen" */
export function ExpandGlyph({ size = "1.1em", className }: GlyphProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 3H3v6" />
      <path d="M3 3l7 7" />
      <path d="M15 21h6v-6" />
      <path d="M21 21l-7-7" />
    </svg>
  );
}

/** a magnifying glass — sits inside the search fields of the Acampantes / Equipe lists */
export function SearchGlyph({ size = "1.1em", className }: GlyphProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="M15.5 15.5 21 21" />
    </svg>
  );
}
