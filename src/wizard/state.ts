/**
 * Setup-wizard state that outlives the component: whether the admin already
 * waved the wizard away (only a ZEROED camp brings it back on its own — the
 * buttons on Limpeza / Perfil always reopen it) and what "zeroed" means.
 */

const DISMISS_KEY = "acampa.wizard.dismissed";
/** the venue the admin picked (id + address), so later steps can use it */
const PLACE_KEY = "acampa.wizard.place";

export function wizardDismissed(): boolean {
  try {
    return localStorage.getItem(DISMISS_KEY) === "1";
  } catch {
    return false;
  }
}

export function setWizardDismissed(v: boolean): void {
  try {
    if (v) localStorage.setItem(DISMISS_KEY, "1");
    else localStorage.removeItem(DISMISS_KEY);
  } catch {
    /* private mode — the flag just won't stick */
  }
}

export interface WizardPlaceChoice {
  id: string;
  name: string;
  address: string;
}

export function rememberWizardPlace(place: WizardPlaceChoice): void {
  try {
    localStorage.setItem(PLACE_KEY, JSON.stringify(place));
  } catch {
    /* fine */
  }
}

export function recalledWizardPlace(): WizardPlaceChoice | null {
  try {
    const raw = localStorage.getItem(PLACE_KEY);
    const p = raw ? (JSON.parse(raw) as WizardPlaceChoice) : null;
    return p && typeof p.id === "string" && typeof p.name === "string" ? { id: p.id, name: p.name, address: p.address ?? "" } : null;
  } catch {
    return null;
  }
}

export interface ZeroCheck {
  campers: unknown[];
  bedrooms: unknown[];
  events: unknown[];
  transports: unknown[];
  preparation: unknown[];
  instructions: unknown[];
  /** ACTIVE team members who are NOT admins (the super admin lands on a roster row) */
  teamStaff: unknown[];
}

/**
 * A camp that has just been cleaned up (or never existed): nothing imported,
 * no rooms, no programme, no documents. The setup wizard opens by itself on
 * this state — until the admin dismisses it.
 */
export function campIsZeroed(z: ZeroCheck): boolean {
  return (
    z.campers.length === 0 &&
    z.bedrooms.length === 0 &&
    z.events.length === 0 &&
    z.transports.length === 0 &&
    z.preparation.length === 0 &&
    z.instructions.length === 0 &&
    z.teamStaff.length === 0
  );
}
