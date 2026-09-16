import { ICONS } from "../icons";

/** Father and mother paper-cut — "Pai ou Responsável" of a camper, inline-sized. */
export default function ParentIcon({ size = 18 }: { size?: number }) {
  return <img className="audience-icon" src={ICONS.parent} alt="" aria-hidden="true" style={{ width: size, height: size }} />;
}
