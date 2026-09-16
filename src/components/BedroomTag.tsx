import { bedroomLabel, type Bedroom } from "../api/bedrooms";
import BedIcon from "./BedIcon";

type BedroomRef = Pick<Bedroom, "name" | "group">;

interface BedroomTagProps {
  bedroom: BedroomRef | null | undefined;
  /** shown when there is no room (default: nothing) */
  fallback?: string | null;
  title?: string;
  className?: string;
  /** icon size in px */
  size?: number;
  /** when set, the chip is a button (e.g. open the room) */
  onClick?: () => void;
}

/**
 * A `.staff-tag` chip with the wing's bed + room number — the ONE way a
 * bedroom is shown wherever a person's tags are listed. Plain-text
 * `bedroomLabel` stays for search, exports, print, and native <select>.
 */
export default function BedroomTag({ bedroom, fallback = null, title, className = "", size = 18, onClick }: BedroomTagProps) {
  if (!bedroom) {
    return fallback ? (
      <span className={`staff-tag ${className}`} title={title ?? "Quarto"}>
        <em className="staff-card__missing">{fallback}</em>
      </span>
    ) : null;
  }
  const label = bedroomLabel(bedroom);
  const cls = `staff-tag staff-tag--room ${className}`.trim();
  const inner = (
    <>
      <BedIcon size={size} group={bedroom.group} />
      {bedroom.name}
    </>
  );
  if (onClick) {
    return (
      <button type="button" className={cls} title={title ?? label} onClick={onClick}>
        {inner}
      </button>
    );
  }
  return (
    <span className={cls} title={title ?? label}>
      {inner}
    </span>
  );
}
