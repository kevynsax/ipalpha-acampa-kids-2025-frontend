import { useCallback, useEffect, useSyncExternalStore } from "react";

/**
 * Tiny hash router — every screen is a URL (`#/campers/abc/edit`), so the
 * browser Back/Forward buttons walk the real navigation history and a reload
 * lands on the same screen. Hash-based so it works from any static host with
 * no rewrite rules.
 *
 *   const { path, params, navigate } = useRoute();
 *   navigate("/campers/123");                 // push
 *   navigate("/campers", { replace: true });  // replace (after a delete, etc.)
 */

export interface Route {
  /** "/campers/123/edit" (no hash, no query) */
  path: string;
  /** path split on "/" without empties */
  segments: string[];
  /** query string params */
  params: URLSearchParams;
}

function parse(hash: string): Route {
  const raw = hash.replace(/^#/, "") || "/";
  const [p, q = ""] = raw.split("?");
  const path = p.startsWith("/") ? p : `/${p}`;
  return { path, segments: path.split("/").filter(Boolean), params: new URLSearchParams(q) };
}

const listeners = new Set<() => void>();
let current = parse(location.hash);

window.addEventListener("hashchange", () => {
  current = parse(location.hash);
  listeners.forEach((l) => l());
});

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function getRoute(): Route {
  return current;
}

export interface NavigateOptions {
  replace?: boolean;
  /** query params appended to the path */
  query?: Record<string, string | undefined>;
}

export function navigate(path: string, opts: NavigateOptions = {}): void {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(opts.query ?? {})) if (v) q.set(k, v);
  const qs = q.toString();
  const target = `#${path}${qs ? `?${qs}` : ""}`;
  if (target === location.hash) return;
  if (opts.replace) {
    // replaceState does not fire hashchange → notify by hand
    history.replaceState(null, "", target);
    current = parse(location.hash);
    listeners.forEach((l) => l());
  } else {
    location.hash = target;
  }
}

/** Browser back (falls back to `fallback` when there is nothing to go back to, e.g. deep link). */
export function goBack(fallback: string): void {
  if (history.length > 1) history.back();
  else navigate(fallback, { replace: true });
}

export function useRoute(): Route & { navigate: typeof navigate } {
  const route = useSyncExternalStore(subscribe, getRoute);
  return { ...route, navigate };
}

/** Scroll to top when the path changes (like a full page navigation would). */
export function useScrollTopOnRoute(path: string): void {
  useEffect(() => {
    for (const selector of [".dash", ".dash-scroll"]) {
      const scroller = document.querySelector(selector);
      if (scroller) scroller.scrollTop = 0;
    }
    window.scrollTo({ top: 0 });
  }, [path]);
}

/** Small helper for building "?a=1&b=2" from an object. */
export function qs(params: Record<string, string | undefined>): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v) q.set(k, v);
  const s = q.toString();
  return s ? `?${s}` : "";
}

/**
 * Detail pages can chain (camper → staff → bedroom …). The chain is kept in
 * the URL as `via=kind:id,kind:id` so the breadcrumb is rebuildable after a
 * reload and each hop is its own history entry.
 */
export type Via = { kind: string; id: string }[];

export function parseVia(params: URLSearchParams): Via {
  return (params.get("via") ?? "")
    .split(",")
    .filter(Boolean)
    .map((s) => {
      const [kind, id] = s.split(":");
      return { kind, id };
    })
    .filter((v) => v.kind && v.id);
}

export function serializeVia(via: Via): string | undefined {
  return via.length ? via.map((v) => `${v.kind}:${v.id}`).join(",") : undefined;
}

export function useNavigate() {
  return useCallback(navigate, []);
}
