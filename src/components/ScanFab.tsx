import { createPortal } from "react-dom";
import { QrGlyph } from "./Glyph";

interface ScanFabProps {
  /** tooltip / accessible name, e.g. "Ler a pulseira ou o crachá" */
  label: string;
  onClick: () => void;
}

/**
 * The yellow QR FAB of a page whose job IS reading badges (church / bus
 * check-in, bulk points): the scan performs that page's action. Pages that
 * show it must not also show the app-wide EmergencyScanFab.
 */
export default function ScanFab({ label, onClick }: ScanFabProps) {
  return createPortal(
    <button type="button" className="fab fab--icon" title={label} aria-label={label} onClick={onClick}>
      <span className="fab__icon" aria-hidden="true">
        <QrGlyph size="1.5em" />
      </span>
    </button>,
    document.body,
  );
}
