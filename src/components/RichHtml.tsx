import { useMemo, type MouseEventHandler } from "react";
import { absolutizeFileUrls } from "../api/files";

interface RichHtmlProps {
  /** sanitized HTML from the server (image srcs are relative "/api/files/…") */
  html: string;
  className?: string;
  onClick?: MouseEventHandler<HTMLDivElement>;
}

/**
 * The editor can't add classes (the sanitizer strips them), so a blockquote
 * becomes a callout by what it STARTS with: ✅ → green "senha" card,
 * 🔓 → soft yellow, ⚠️ → soft red. Everything else stays a plain box.
 */
function tagCallouts(html: string): string {
  return html.replace(/<blockquote>(\s*<p>\s*(?:<strong>\s*)?)(✅|🔓|⚠️)/g, (_m, head: string, emoji: string) => {
    const kind = emoji === "✅" ? "ok" : emoji === "🔓" ? "lock" : "warn";
    return `<blockquote data-callout="${kind}">${head}${emoji}`;
  });
}

/** Renders admin-written rich text (already sanitized server-side), resolving uploaded image urls. */
export default function RichHtml({ html, className = "instructions", onClick }: RichHtmlProps) {
  const resolved = useMemo(() => tagCallouts(absolutizeFileUrls(html)), [html]);
  return <div className={className} onClick={onClick} dangerouslySetInnerHTML={{ __html: resolved }} />;
}
