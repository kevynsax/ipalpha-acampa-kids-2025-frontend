import { roleMeta } from "../roles";

/** The paper-cut "Pais & Responsáveis" icon from the login page, inline-sized. */
export default function ParentIcon({ size = 18 }: { size?: number }) {
  return <img className="audience-icon" src={roleMeta("parent").icon} alt="" aria-hidden="true" style={{ width: size, height: size }} />;
}
