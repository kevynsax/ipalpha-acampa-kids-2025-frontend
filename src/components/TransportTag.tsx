import { transportShortLabel } from "../api/transports";
import { useTransportOf } from "../store/derive";
import TransportMark from "./TransportMark";

interface TransportTagProps {
  /** the transport id on the record (null / unknown → nothing, or `fallback`) */
  transportId: string | null | undefined;
  /** shown when there is no transport (default: nothing) */
  fallback?: string | null;
  title?: string;
  className?: string;
  /** logo size in px */
  size?: number;
  /**
   * LIST contexts (my kids, campers, staff, roommates…): several vehicles are
   * on screen at once, so the colour name is dropped ("Ônibus 3") — the
   * coloured logo already tells them apart. On a page where the vehicle
   * appears ONCE (detail rows, check-in) leave it off to get the colour.
   */
  short?: boolean;
}

/**
 * A `.staff-tag` chip with the vehicle's coloured logo (the numbered bus in
 * its own colour, or the car) plus its label — the ONE way a transport is
 * shown wherever a person's tags are listed.
 */
export default function TransportTag({ transportId, fallback = null, title = "Transporte", className = "", size = 20, short = false }: TransportTagProps) {
  const t = useTransportOf()(transportId);
  if (!t) {
    return fallback ? (
      <span className={`staff-tag ${className}`} title={title}>
        <em className="staff-card__missing">{fallback}</em>
      </span>
    ) : null;
  }
  return (
    <span className={`staff-tag staff-tag--transport ${className}`} title={short ? t.label : title}>
      <TransportMark transport={t} size={size} />
      {short ? transportShortLabel(t) : t.label}
    </span>
  );
}
