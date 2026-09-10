import { ICONS } from "../icons";

/** The paper-cut kid icon, inline-sized. */
export default function CamperIcon({ size = 18 }: { size?: number }) {
  return <img className="audience-icon" src={ICONS.camper} alt="" aria-hidden="true" style={{ width: size, height: size }} />;
}
