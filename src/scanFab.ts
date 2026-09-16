import { createContext, useContext, useEffect } from "react";

/**
 * The app-wide "Ler crachá" FAB (components/EmergencyScanFab) floats over the
 * bottom-right corner of every page. On a FORM that corner belongs to the
 * form's own actions (Salvar / Cancelar) and the FAB would sit on top of them
 * — so a form asks for it to be hidden while it is on screen.
 *
 * A counter, not a boolean: a dialog with a form may open over a page that is
 * already a form (a nova função over o formulário do evento), and the FAB must
 * only come back when the LAST of them closes.
 */
export const HideScanFabContext = createContext<(delta: number) => void>(() => {});

/** Hides the "Ler crachá" FAB while the calling component is mounted. */
export function useHideScanFab(active = true): void {
  const bump = useContext(HideScanFabContext);
  useEffect(() => {
    if (!active) return;
    bump(1);
    return () => bump(-1);
  }, [bump, active]);
}
