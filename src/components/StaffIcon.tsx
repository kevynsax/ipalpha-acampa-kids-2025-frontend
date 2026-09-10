import { roleMeta } from "../roles";

/** The paper-cut "Equipe" icon from the login page, inline-sized. */
export default function StaffIcon({ size = 18 }: { size?: number }) {
  return <img className="audience-icon" src={roleMeta("staff").icon} alt="" aria-hidden="true" style={{ width: size, height: size }} />;
}
