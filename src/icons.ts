/** Paper-cut icons that are not tied to a login role. */
import iconCamper from "./assets/icons/camper.png";
import iconBunk from "./assets/icons/bunk.png";
import iconBed from "./assets/icons/bed.png";
import iconBedWoman from "./assets/icons/bed-woman.png";
import iconGirl from "./assets/icons/girl.png";
import iconBoy from "./assets/icons/boy.png";
import iconMan from "./assets/icons/man.png";
import iconWoman from "./assets/icons/woman.png";
import iconGirls from "./assets/icons/girls.png";
import iconGirlFace from "./assets/icons/girl-face.png";
import iconBoyFace from "./assets/icons/boy-face.png";
import iconBoys from "./assets/icons/boys.png";
import iconOrganizer from "./assets/icons/organizer.png";
import iconStaffPair from "./assets/icons/staff-pair.png";
import iconNoVest from "./assets/icons/no-vest.png";
import iconNoVestWoman from "./assets/icons/no-vest-woman.png";
import iconVest from "./assets/icons/vest.png";
import iconVestWoman from "./assets/icons/vest-woman.png";
import iconGiveaway from "./assets/icons/giveaway.png";
import iconDraw from "./assets/icons/draw.png";
import iconPencil from "./assets/icons/pencil.png";
import iconParent from "./assets/icons/parent.png";
import iconLeaderFace from "./assets/icons/leader-face.png";
import iconLeaderFaceWoman from "./assets/icons/leader-face-woman.png";
import iconHelperFace from "./assets/icons/helper-face.png";
import iconHelperFaceWoman from "./assets/icons/helper-face-woman.png";
import iconTransport from "./assets/icons/transport.png";
import iconCamera from "./assets/icons/camera.png";
import iconNoPhotos from "./assets/icons/no-photos.png";
import iconTakingPhoto from "./assets/icons/taking-photo.png";
import iconNotifications from "./assets/icons/notifications.png";
import iconNotifyOff from "./assets/icons/notify-off.png";
import iconCleanup from "./assets/icons/cleanup.png";
import iconPreparation from "./assets/icons/preparation.png";
import iconSwap from "./assets/icons/swap.png";
import iconHandshake from "./assets/icons/handshake.png";
import iconBadge from "./assets/icons/badge.png";
import iconMedications from "./assets/icons/medications.png";
import iconSchedule from "./assets/icons/schedule.png";
import iconReport from "./assets/icons/report.png";
import iconChooseExisting from "./assets/icons/choose-existing.png";
import iconCreateNew from "./assets/icons/create-new.png";
import iconImportCampers from "./assets/icons/import-campers.png";
import iconRoomAssign from "./assets/icons/room-assign.png";
import iconAssistant from "./assets/icons/assistant.png";
import iconWizard from "./assets/icons/wizard.png";

export const ICONS = {
  camper: iconCamper,
  bunk: iconBunk,
  /** top-down single bed, teal frame — boys / staff / Quartos chrome */
  bed: iconBed,
  /** same bed as bed.png, teal frame tinted camp pink — girls wing (BedroomTag) */
  bedWoman: iconBedWoman,
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
  /** man in teal camp hat + badge, woman in pink with whistle, hands on his shoulders — "toda a equipe" / Todos */
  staffPair: iconStaffPair,
  /** bare head + shoulders — team member still without the vest (a man) */
  noVest: iconNoVest,
  /** same pose, a blonde woman with a pointed "bico" bob — still without the vest */
  noVestWoman: iconNoVestWoman,
  /** wearing the orange vest — vest is with the person (a man) */
  vest: iconVest,
  /** same orange vest, a woman */
  vestWoman: iconVestWoman,
  /** lottery cage + ticket — giveaway / Sorteio */
  giveaway: iconGiveaway,
  /** hand holding up a freshly drawn numbered ball — the "Sortear" action */
  draw: iconDraw,
  /** orange pencil with a teal eraser — inline "edit this value" actions (the bare button beside a value) */
  pencil: iconPencil,
  /** father and mother heads — "Pai ou Responsável" (same drawing as the login parent role) */
  parent: iconParent,
  /** head only — teal camp hat + the orange flag: the inline "Líder" marker (a man) */
  leaderFace: iconLeaderFace,
  /** head only — pink camp hat + the orange flag: the inline "Líder" marker (a woman) */
  leaderFaceWoman: iconLeaderFaceWoman,
  /** head only — yellow camp cap: the inline "Auxiliar" marker (a man) */
  helperFace: iconHelperFace,
  /** head only — yellow camp cap: the inline "Auxiliar" marker (a woman) */
  helperFaceWoman: iconHelperFaceWoman,
  /** front-facing bus with a numbered badge — the transports (buses / cars) settings menu */
  transport: iconTransport,
  /** vintage camera with a cream lens — the Fotos tab and the photographers settings */
  camera: iconCamera,
  /** glum photographer sitting on the ground, camera set aside — the empty album */
  noPhotos: iconNoPhotos,
  /** kid posing for a vintage camera with a yellow flash — parent face-search card */
  takingPhoto: iconTakingPhoto,
  /** teal phone with a sun-yellow speech-bubble (dark dots) — SMS notifications settings */
  notifications: iconNotifications,
  /** teal notification bell with a diagonal slash — nobody will be texted (muted) */
  notifyOff: iconNotifyOff,
  /** teal broom sweeping, with sparkles — the end-of-camp cleanup settings */
  cleanup: iconCleanup,
  /** closed red-orange hard suitcase with wheels — Preparação (what to pack before camp) */
  preparation: iconPreparation,
  /** two thick curved arrows in a circle (teal over orange) — "trocar": move room, hand over, swap role */
  swap: iconSwap,
  /** light-skin hand clasping a brown-skin hand — pass kids / responsibility to someone else */
  handshake: iconHandshake,
  /** smiling woman holding her lanyard ID card up beside her face — "quem você é aqui": choosing / showing a profile */
  badge: iconBadge,
  /** clipboard checklist with two orange ticks and a capsule on top — the Medicações tab (what each kid already took) */
  medications: iconMedications,
  /** 📅 calendar emoji in pastel camp colours: teal header with 31, cream page with a big 31, orange header dots — the Programação tab */
  schedule: iconSchedule,
  /** three bars (teal, orange, yellow) on a dark teal baseline — the check-in report "Por veículo" */
  report: iconReport,
  /** cream list card under a big orange magnifying glass — pick something that already exists */
  chooseExisting: iconChooseExisting,
  /** teal tile with a cream plus and a sun-yellow sparkle — create something new */
  createNew: iconCreateNew,
  /** spreadsheet with an entering arrow and yellow sparkle — import campers from CSV/Excel */
  importCampers: iconImportCampers,
  /** bunk bed with two kids tucked in while a curved arrow drops a third kid head on the top mattress — "Montar quartos": assign kids / staff to rooms */
  roomAssign: iconRoomAssign,
  /** teal camping lantern shaped like a chat bubble, with a cream AI sparkle — read-only camp assistant */
  assistant: iconAssistant,
  /** wooden trail signpost with three direction boards and an orange pennant — the setup wizard */
  wizard: iconWizard,
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

function hashParity(seed: string): boolean {
  let n = 0;
  for (let i = 0; i < seed.length; i++) n = (n * 31 + seed.charCodeAt(i)) >>> 0;
  return n % 2 === 0;
}

/** session-stable coin flip so unknown-sex faces don't flicker on re-render */
let sessionKidIsGirl: boolean | undefined;
function unknownKidIsGirl(seed?: string): boolean {
  if (seed) return hashParity(seed);
  return (sessionKidIsGirl ??= Math.random() < 0.5);
}

/** Head-only kid marker. Unknown sex → girl or boy at random (stable per seed / session). */
export function kidFaceSrc(sex?: KidSex | "F" | "M" | null, seed?: string): string {
  if (sex === "girl" || sex === "F") return ICONS.girlFace;
  if (sex === "boy" || sex === "M") return ICONS.boyFace;
  return unknownKidIsGirl(seed) ? ICONS.girlFace : ICONS.boyFace;
}

/**
 * Staff sleeping in a kids' room share the wing's sex. No room / staff wing
 * → assume woman (icons), until a kids' wing is assigned.
 */
export function adultSexOf(group: Wing): AdultSex {
  return group === "boys" ? "man" : "woman";
}

/** Top-down bed. Girls wing → pink; boys / staff / unknown → teal. */
export function bedSrc(group?: Wing): string {
  return group === "girls" ? ICONS.bedWoman : ICONS.bed;
}

/** Orange vest on / off. Woman when sex is F; man otherwise. */
export function vestSrc(on: boolean, sex?: "F" | "M" | null): string {
  if (sex === "F") return on ? ICONS.vestWoman : ICONS.noVestWoman;
  return on ? ICONS.vest : ICONS.noVest;
}
