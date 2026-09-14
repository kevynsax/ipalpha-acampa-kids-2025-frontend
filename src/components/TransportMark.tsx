import type { Transport } from "../api/transports";
import BusLogo from "./BusLogo";
import CarLogo from "./CarLogo";

/**
 * The coloured mark for one vehicle: the numbered bus logo in its colour, or
 * the car logo. Used everywhere a transport is shown inline (detail pages,
 * lists, roll call) so buses and cars read the same visual family.
 */
export default function TransportMark({ transport: t, size = 22 }: { transport: Transport; size?: number }) {
  return t.kind === "car" ? (
    <CarLogo size={size} title={t.label} />
  ) : (
    <BusLogo color={t.color ?? "#0f9a8a"} number={t.number} size={size} title={t.label} />
  );
}
