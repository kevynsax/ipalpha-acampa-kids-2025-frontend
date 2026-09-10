import { ICONS } from "../icons";

/** Paper-cut bunk bed (beliche) icon, inline-sized. */
export default function BunkIcon({ size = 18 }: { size?: number }) {
  return <img className="audience-icon" src={ICONS.bunk} alt="" aria-hidden="true" style={{ width: size, height: size }} />;
}
