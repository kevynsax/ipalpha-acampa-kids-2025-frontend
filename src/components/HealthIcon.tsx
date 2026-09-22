import { ICONS } from "../icons";

/** Paper-cut medical-team icon, inline-sized. */
export default function HealthIcon({ size = 18 }: { size?: number }) {
  return <img className="audience-icon" src={ICONS.health} alt="" aria-hidden="true" style={{ width: size, height: size }} />;
}
