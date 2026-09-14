import { createContext, useContext, useEffect } from "react";

export type TabKey = "home" | "prep" | "instructions" | "occurrences" | "campers" | "staff" | "bedrooms" | "schedule" | "categories" | "checkin" | "bus" | "staffcheckin" | "vests" | "scoreboard" | "gallery";

/**
 * Lets a nested detail page (e.g. a função opened from a camper) tell the
 * dashboard which tab should look active, so the top menu always relates to
 * what is on screen. `null` = follow the tab the user clicked.
 */
export const TabOverrideContext = createContext<(tab: TabKey | null) => void>(() => {});

/** Highlights `tab` while the calling component is mounted. */
export function useTabOverride(tab: TabKey | null) {
  const set = useContext(TabOverrideContext);
  useEffect(() => {
    set(tab);
    return () => set(null);
  }, [set, tab]);
}
