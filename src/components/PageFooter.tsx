import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

/** the shell mounts one of these; every page's note lands inside it */
export const PAGE_FOOTER_ID = "page-footer";

/**
 * The note that closes a page ("🔑 Sua sessão fica aberta até…", "📷 Ao ligar
 * Publicadas…"). Pages declare it wherever it reads best in their JSX and it is
 * rendered in the shell's footer, below the page body, so every tab ends the
 * same way instead of each one trailing its own paragraph.
 *
 *   <PageFooter>🔒 Só o admin mexe nesta lista.</PageFooter>
 */
export default function PageFooter({ children }: { children: ReactNode }) {
  // the slot lives in the shell, which mounts first; look it up after paint so
  // a page rendered on its own (no shell) simply shows nothing
  const [slot, setSlot] = useState<HTMLElement | null>(null);
  useEffect(() => setSlot(document.getElementById(PAGE_FOOTER_ID)), []);
  if (!slot) return null;
  return createPortal(<p className="footer-note">{children}</p>, slot);
}
