import { useSyncExternalStore } from "react";
import type { Bedroom } from "../api/bedrooms";
import type { Camper } from "../api/campers";
import type { Category } from "../api/categories";
import type { Instruction } from "../api/instructions";
import type { Occurrence } from "../api/occurrences";
import type { PrepSection } from "../api/preparation";
import type { CampEvent, ScheduleRole } from "../api/schedule";
import type { Staff } from "../api/staff";

/**
 * Local-first data store.
 *
 * Every collection the app reads lives here, persisted in localStorage, so the
 * whole app keeps working with no network at all (the camp site has no
 * internet). The server pushes the data over a WebSocket (see ./realtime.ts):
 * a full snapshot on connect and an update after every change. Writes still
 * go through the REST API; their result is applied here optimistically and
 * then confirmed by the server's push.
 */

export interface Collections {
  campers: Camper[];
  staff: Staff[];
  bedrooms: Bedroom[];
  categories: Category[];
  roles: ScheduleRole[];
  events: CampEvent[];
  preparation: PrepSection[];
  instructions: Instruction[];
  occurrences: Occurrence[];
}
export type CollectionName = keyof Collections;
export const COLLECTION_NAMES: CollectionName[] = ["campers", "staff", "bedrooms", "categories", "roles", "events", "preparation", "instructions", "occurrences"];

export type ConnectionState = "connecting" | "online" | "offline";

interface StoreState {
  data: Partial<Collections>;
  /** ISO time of the last message from the server (null = never synced on this device) */
  syncedAt: string | null;
  connection: ConnectionState;
}

const STORAGE_KEY = "acampa.data.v1";
const STORAGE_META = "acampa.data.meta";

function load(): StoreState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const meta = localStorage.getItem(STORAGE_META);
    const data = raw ? (JSON.parse(raw) as Partial<Collections>) : {};
    const syncedAt = meta ? ((JSON.parse(meta) as { syncedAt?: string }).syncedAt ?? null) : null;
    return { data, syncedAt, connection: "connecting" };
  } catch {
    return { data: {}, syncedAt: null, connection: "connecting" };
  }
}

let state: StoreState = load();
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

let persistTimer: ReturnType<typeof setTimeout> | null = null;
function persist() {
  // coalesce bursts of writes into one localStorage write
  if (persistTimer) return;
  persistTimer = setTimeout(() => {
    persistTimer = null;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.data));
      localStorage.setItem(STORAGE_META, JSON.stringify({ syncedAt: state.syncedAt }));
    } catch (err) {
      console.warn("store: could not persist", err);
    }
  }, 50);
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function getState(): StoreState {
  return state;
}

/** Replace whole collections (what the server pushes). */
export function applyServerData(data: Partial<Collections>, at: string): void {
  state = { ...state, data: { ...state.data, ...data }, syncedAt: at };
  persist();
  emit();
}

export function setConnection(connection: ConnectionState): void {
  if (state.connection === connection) return;
  state = { ...state, connection };
  emit();
}

/** Optimistic local edit of one collection (after a successful REST write). */
export function patchCollection<K extends CollectionName>(name: K, fn: (list: Collections[K]) => Collections[K]): void {
  const current = (state.data[name] ?? []) as Collections[K];
  state = { ...state, data: { ...state.data, [name]: fn(current) } };
  persist();
  emit();
}

/** Upsert one item by id. */
export function upsert<K extends CollectionName>(name: K, item: Collections[K][number]): void {
  patchCollection(name, (list) => {
    const i = list.findIndex((x) => x.id === item.id);
    const next = list.slice() as Collections[K];
    if (i < 0) next.push(item as never);
    else next[i] = item as never;
    return next;
  });
}

export function remove<K extends CollectionName>(name: K, id: string): void {
  patchCollection(name, (list) => list.filter((x) => x.id !== id) as Collections[K]);
}

/** Wipe everything (logout). */
export function clearStore(): void {
  state = { data: {}, syncedAt: null, connection: "offline" };
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(STORAGE_META);
  emit();
}

// ── hooks ───────────────────────────────────────────────────────────────────

const EMPTY: never[] = [];

/** One collection, or `null` while this device has never received it. */
export function useCollection<K extends CollectionName>(name: K): Collections[K] | null {
  return useSyncExternalStore(subscribe, () => (state.data[name] as Collections[K] | undefined) ?? null);
}

/** Same, but never null (empty list until synced). */
export function useCollectionOrEmpty<K extends CollectionName>(name: K): Collections[K] {
  return useSyncExternalStore(subscribe, () => ((state.data[name] as Collections[K] | undefined) ?? (EMPTY as unknown as Collections[K])));
}

export function useConnection(): ConnectionState {
  return useSyncExternalStore(subscribe, () => state.connection);
}

export function useSyncedAt(): string | null {
  return useSyncExternalStore(subscribe, () => state.syncedAt);
}

/** True once every collection has been received at least once. */
export function useHydrated(): boolean {
  return useSyncExternalStore(subscribe, () => COLLECTION_NAMES.every((n) => state.data[n] !== undefined));
}
