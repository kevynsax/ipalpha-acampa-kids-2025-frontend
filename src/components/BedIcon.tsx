import type { BedroomGroup } from "../api/bedrooms";
import { bedSrc } from "../icons";

/** Paper-cut single bed (cama). Girls wing → pink; boys / staff / unknown → teal. */
export default function BedIcon({ size = 18, group }: { size?: number; group?: BedroomGroup | null }) {
  return <img className="audience-icon" src={bedSrc(group)} alt="" aria-hidden="true" style={{ width: size, height: size }} />;
}
