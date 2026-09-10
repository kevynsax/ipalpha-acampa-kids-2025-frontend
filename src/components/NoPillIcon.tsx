/** "Must not take": a red prohibition ring over a capsule. Sized like an emoji (1em). */
export default function NoPillIcon({ size = "1em" }: { size?: number | string }) {
  return (
    <svg className="no-pill" viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" focusable="false">
      {/* capsule, tilted */}
      <g transform="rotate(-45 12 12)">
        <rect x="5" y="9" width="14" height="6" rx="3" fill="#f3f0e8" stroke="#6b7c74" strokeWidth="1.2" />
        <path d="M12 9h4a3 3 0 0 1 0 6h-4z" fill="#e7a44e" />
      </g>
      {/* prohibition ring + bar */}
      <circle cx="12" cy="12" r="9.5" fill="none" stroke="#c0392b" strokeWidth="2.4" />
      <line x1="5.4" y1="5.4" x2="18.6" y2="18.6" stroke="#c0392b" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}
