import type { Camper } from "./api/campers";

/** lowercase, accent-free, single-spaced comparison form of a name. */
export function normName(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * The names of a kid's "prefere dividir quarto com" field. Parents write the
 * list however they like: "Ana, Bruno e Carla" / "Ana; Bruno" / "Ana e Bruno".
 */
export function parsePreference(pref: string): string[] {
  return pref
    .split(/\s*[,;/]\s*|\s+e\s+|\s+&\s+/i)
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Does the preference name `pref` point at a kid called `name`?
 * — one word  → compares with the FIRST name
 * — two words → first + LAST name, or first + SECOND name
 */
export function prefNameMatches(pref: string, name: string): boolean {
  const p = normName(pref).split(" ").filter(Boolean);
  const n = normName(name).split(" ").filter(Boolean);
  if (p.length === 0 || n.length === 0) return false;
  if (p.length === 1) return n[0] === p[0];
  const [first, second] = p;
  return n[0] === first && ((n.length > 1 && n[n.length - 1] === second) || n[1] === second);
}

/** One name of the preference field, resolved against the kids on the roster. */
export interface PrefMatch {
  /** the name exactly as typed on the enrolment */
  raw: string;
  /** the kid it points at (null = nobody matched → the admin sees a red chip) */
  camperId: string | null;
}

/** Resolve every comma-separated name of `kid`'s preference against `others`. */
export function matchPreferences(kid: Camper, others: readonly Camper[]): PrefMatch[] {
  return parsePreference(kid.bedroomPreference).map((raw) => {
    const found = others.find((k) => prefNameMatches(raw, k.name));
    return { raw, camperId: found ? found.id : null };
  });
}

/** kidId → resolved preference entries (empty when the kid asked for nobody). */
export type PreferenceMap = Map<string, PrefMatch[]>;

export function matchAllPreferences(kids: readonly Camper[]): PreferenceMap {
  const map: PreferenceMap = new Map();
  for (const k of kids) map.set(k.id, matchPreferences(k, kids.filter((o) => o.id !== k.id)));
  return map;
}

/** A "stuck together" unit: kids linked by their preference names (either direction). */
export interface KidUnit {
  /** stable id: the smallest member id */
  id: string;
  members: Camper[];
}

/**
 * Likely room groups: kids whose preference names match each other end up in
 * the same unit, so they can be dragged into a room in one go. Single kids
 * (nobody matched, or nobody asked for them) come back as one-member units.
 */
export function buildUnits(kids: readonly Camper[], prefs: PreferenceMap): KidUnit[] {
  const ids = kids.map((k) => k.id);
  const byId = new Map(kids.map((k) => [k.id, k]));
  const parent = new Map<string, string>(ids.map((id) => [id, id]));
  const find = (id: string): string => {
    let root = id;
    while (parent.get(root)! !== root) root = parent.get(root)!;
    return root;
  };
  const union = (a: string, b: string) => {
    const [ra, rb] = [find(a), find(b)];
    if (ra === rb) return;
    // smaller id becomes the root, so a cluster keeps its id when members move
    if (ra < rb) parent.set(rb, ra);
    else parent.set(ra, rb);
  };
  for (const k of kids) {
    for (const p of prefs.get(k.id) ?? []) {
      if (p.camperId && byId.has(p.camperId)) union(k.id, p.camperId);
    }
  }
  const groups = new Map<string, Camper[]>();
  for (const k of kids) {
    const root = find(k.id);
    if (!groups.has(root)) groups.set(root, []);
    groups.get(root)!.push(k);
  }
  return [...groups.values()].map((members) => ({
    id: members.reduce((min, k) => (k.id < min ? k.id : min), members[0].id),
    members: members.slice().sort((a, b) => a.name.localeCompare(b.name, "pt-BR")),
  }));
}
