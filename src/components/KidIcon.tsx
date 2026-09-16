import { ICONS, type AdultSex, type KidSex } from "../icons";

interface KidIconProps {
  /** null → the generic camper icon */
  sex: KidSex | null;
  /** three kids instead of one ("no mesmo quarto") */
  group?: boolean;
  size?: number;
}

/** Paper-cut kid icon by sex — girl / boy, or the trio for room mates. */
export default function KidIcon({ sex, group, size = 18 }: KidIconProps) {
  const src = sex === "girl" ? (group ? ICONS.girls : ICONS.girl) : sex === "boy" ? (group ? ICONS.boys : ICONS.boy) : ICONS.camper;
  // the trios are wide — give them extra room without growing the line
  const style = group ? { width: "auto", height: size } : { width: size, height: size };
  return <img className="audience-icon" src={src} alt="" aria-hidden="true" style={style} />;
}

/** The paper-cut adult (equipe) icon — woman until a kids' wing says man. */
export function AdultIcon({ sex = "woman", size = 18 }: { sex?: AdultSex; size?: number }) {
  return <img className="audience-icon" src={sex === "man" ? ICONS.man : ICONS.woman} alt="" aria-hidden="true" style={{ width: size, height: size }} />;
}
