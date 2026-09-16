import { useEffect, useState } from "react";

/**
 * Reactive CSS media query (`useMediaQuery("(max-width: 760px)")`). Use the
 * SAME query the CSS uses for a layout switch, so the JS render and the
 * stylesheet can never disagree about which layout is on screen.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => typeof window !== "undefined" && window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = () => setMatches(mq.matches);
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [query]);
  return matches;
}
