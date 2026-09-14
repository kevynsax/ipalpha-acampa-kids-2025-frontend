import { ICONS } from "../icons";

/** Adult holding a child's hand — "Pai ou Responsável" of a camper, inline-sized. */
export default function ParentIcon({ size = 18 }: { size?: number }) {
  return <img className="audience-icon" src={ICONS.guardian} alt="" aria-hidden="true" style={{ width: size, height: size }} />;
}
