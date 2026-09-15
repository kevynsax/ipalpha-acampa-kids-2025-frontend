/** Paper-cut icons that are not tied to a login role. */
import iconCamper from "./assets/icons/camper.png";
import iconBunk from "./assets/icons/bunk.png";
import iconGirl from "./assets/icons/girl.png";
import iconBoy from "./assets/icons/boy.png";
import iconMan from "./assets/icons/man.png";
import iconWoman from "./assets/icons/woman.png";
import iconGirls from "./assets/icons/girls.png";
import iconGirlFace from "./assets/icons/girl-face.png";
import iconBoyFace from "./assets/icons/boy-face.png";
import iconBoys from "./assets/icons/boys.png";
import iconOrganizer from "./assets/icons/organizer.png";
import iconNoVest from "./assets/icons/no-vest.png";
import iconVest from "./assets/icons/vest.png";
import iconGiveaway from "./assets/icons/giveaway.png";
import iconDraw from "./assets/icons/draw.png";
import iconPencil from "./assets/icons/pencil.png";
import iconGuardian from "./assets/icons/guardian.png";
import iconLeader from "./assets/icons/leader.png";
import iconLeaderFace from "./assets/icons/leader-face.png";
import iconHelper from "./assets/icons/helper.png";
import iconHelperFace from "./assets/icons/helper-face.png";
import iconTransport from "./assets/icons/transport.png";
import iconCamera from "./assets/icons/camera.png";
import iconNoPhotos from "./assets/icons/no-photos.png";
import iconSearchPhotos from "./assets/icons/search-photos.png";
import iconTakingPhoto from "./assets/icons/taking-photo.png";
import iconNotifications from "./assets/icons/notifications.png";
import iconCleanup from "./assets/icons/cleanup.png";
import iconSwap from "./assets/icons/swap.png";
import iconBadge from "./assets/icons/badge.png";
import iconMedications from "./assets/icons/medications.png";
import iconSchedule from "./assets/icons/schedule.png";

export const ICONS = {
  camper: iconCamper,
  bunk: iconBunk,
  girl: iconGirl,
  boy: iconBoy,
  man: iconMan,
  woman: iconWoman,
  /** head only — the girl with pigtails / the boy in the yellow cap: inline "Meninas" / "Meninos" markers (chips, tabs, labels) */
  girlFace: iconGirlFace,
  boyFace: iconBoyFace,
  /** groups of three — "the same room" */
  girls: iconGirls,
  boys: iconBoys,
  /** worker with a checklist — programme organizers (admin settings + their tabs) */
  organizer: iconOrganizer,
  /** bare head + shoulders — team member still without the vest */
  noVest: iconNoVest,
  /** wearing the orange vest — vest is with the person */
  vest: iconVest,
  /** lottery cage + ticket — giveaway / Sorteio */
  giveaway: iconGiveaway,
  /** hand holding up a freshly drawn numbered ball — the "Sortear" action */
  draw: iconDraw,
  /** orange pencil with a teal eraser — inline "edit this value" actions (the bare button beside a value) */
  pencil: iconPencil,
  /** adult holding a child's hand — the camper's "Pai ou Responsável" */
  guardian: iconGuardian,
  /** adult holding a guide flag — room leader */
  leader: iconLeader,
  /** head only — teal camp hat + the orange flag: the inline "Líder" marker (tags, pickers, labels) */
  leaderFace: iconLeaderFace,
  /** adult with a big thumbs-up — room assistant (full figure, lists / home) */
  helper: iconHelper,
  /** head only — yellow camp cap: the inline "Auxiliar" marker (tags, pickers, labels) */
  helperFace: iconHelperFace,
  /** front-facing bus with a numbered badge — the transports (buses / cars) settings menu */
  transport: iconTransport,
  /** vintage camera with a cream lens — the Fotos tab and the photographers settings */
  camera: iconCamera,
  /** glum photographer sitting on the ground, camera set aside — the empty album */
  noPhotos: iconNoPhotos,
  /** kid with a loupe over polaroids scattered on the ground — waiting for a parent reference photo */
  searchPhotos: iconSearchPhotos,
  /** kid posing for a vintage camera with a yellow flash — parent face-search card */
  takingPhoto: iconTakingPhoto,
  /** teal phone with a sun-yellow speech-bubble (dark dots) — SMS notifications settings */
  notifications: iconNotifications,
  /** teal broom sweeping, with sparkles — the end-of-camp cleanup settings */
  cleanup: iconCleanup,
  /** two thick curved arrows in a circle (teal over orange) — "trocar": move room, hand over, swap role */
  swap: iconSwap,
  /** smiling woman holding her lanyard ID card up beside her face — "quem você é aqui": choosing / showing a profile */
  badge: iconBadge,
  /** clipboard checklist with two orange ticks and a capsule on top — the Medicações tab (what each kid already took) */
  medications: iconMedications,
  /** 📅 calendar emoji in pastel camp colours: teal header with 31, cream page with a big 31, orange header dots — the Programação tab */
  schedule: iconSchedule,
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
