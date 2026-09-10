/** Paper-cut icons that are not tied to a login role. */
import iconCamper from "./assets/icons/camper.png";
import iconBunk from "./assets/icons/bunk.png";
import iconGirl from "./assets/icons/girl.png";
import iconBoy from "./assets/icons/boy.png";
import iconMan from "./assets/icons/man.png";
import iconWoman from "./assets/icons/woman.png";
import iconGirls from "./assets/icons/girls.png";
import iconBoys from "./assets/icons/boys.png";
import iconOrganizer from "./assets/icons/organizer.png";

export const ICONS = {
  camper: iconCamper,
  bunk: iconBunk,
  girl: iconGirl,
  boy: iconBoy,
  man: iconMan,
  woman: iconWoman,
  /** groups of three — "the same room" */
  girls: iconGirls,
  boys: iconBoys,
  /** worker with a checklist — programme organizers (admin settings + their tabs) */
  organizer: iconOrganizer,
} as const;

/** A kid's sex is not stored: it follows the wing of the bedroom (meninas / meninos). */
export type KidSex = "girl" | "boy";
export type AdultSex = "man" | "woman";

type Wing = "girls" | "boys" | "staff" | null | undefined;

export function kidSexOf(group: Wing): KidSex | null {
  if (group === "girls") return "girl";
  if (group === "boys") return "boy";
  return null;
}

/**
 * Staff sleeping in a kids' room as caretakers share the wing's sex. In a
 * staff room (or without one) there is nothing to go on → man.
 */
export function adultSexOf(group: Wing): AdultSex {
  return group === "girls" ? "woman" : "man";
}
