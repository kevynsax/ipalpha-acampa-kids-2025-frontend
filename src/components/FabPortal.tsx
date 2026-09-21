import { createContext, useContext, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

export const FAB_LAYER_ID = "dashboard-fab-layer";

const FabPortalContext = createContext<HTMLElement | null>(null);

export function FabPortalProvider({ children }: { children: ReactNode }) {
  const [target, setTarget] = useState<HTMLDivElement | null>(null);
  return (
    <FabPortalContext.Provider value={target}>
      {children}
      <div className="dash-fab-layer" id={FAB_LAYER_ID} ref={setTarget} />
    </FabPortalContext.Provider>
  );
}

/** Portals dashboard FABs into the shell so drawer/backdrop stacking stays deterministic. */
export function FabPortal({ children }: { children: ReactNode }) {
  const target = useContext(FabPortalContext);
  if (!target) return null;
  return createPortal(children, target);
}
