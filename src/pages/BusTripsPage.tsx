import { useEffect } from "react";
import { useRoute } from "../router";
import { useDefaultBusTrip } from "../hooks/useDefaultBusTrip";
import { useI18n } from "../i18n";

interface BusTripsPageProps {
  /** admin flow is nested below the merged Check-in landing page */
  checkinHomePath?: string;
  /** helper flow: hide trips whose configured window is closed */
  outboundAvailable?: boolean;
  returnAvailable?: boolean;
  basePath?: string;
}

/**
 * No longer a screen: opening the bus check-in goes STRAIGHT to the journey
 * that is happening now (see `useDefaultBusTrip`) — at the vehicle door nobody
 * should have to pick "ida ou volta". The roll call itself carries a button to
 * jump to the other journey when the guess is wrong.
 */
export default function BusTripsPage({ outboundAvailable = true, returnAvailable = true, basePath = "/bus" }: BusTripsPageProps) {
  const { tx } = useI18n();
  const { navigate } = useRoute();
  const preferred = useDefaultBusTrip();
  const trip = preferred === "return" ? (returnAvailable ? "return" : "outbound") : outboundAvailable ? "outbound" : "return";
  const available = trip === "return" ? returnAvailable : outboundAvailable;

  useEffect(() => {
    if (available) navigate(`${basePath}/${trip}`, { replace: true });
  }, [available, basePath, trip, navigate]);

  if (available) return null;
  return (
    <div className="admin-page">
      <p className="opt-empty">{tx("O check-in do ônibus não está aberto agora.")}</p>
    </div>
  );
}
