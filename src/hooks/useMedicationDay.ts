import { useMemo } from "react";
import { MEDICATION_PRESETS, medicationTimeLabel } from "../components/MedicationsEditor";
import { medKeyOf, SOS_SLOT, type MedicationDose } from "../api/medications";
import type { Camper, Medication } from "../api/campers";
import { useCollection } from "../store";

/**
 * One line of the checklist: a kid × a medicine × a prescribed moment.
 * The same kid appears once per moment they take something.
 */
export interface MedEntry {
  kid: Camper;
  med: Medication;
  medKey: string;
  /** "HH:MM", "sos", or "" for a medicine the parents never scheduled */
  slot: string;
}

/** the checklist of ONE day, already grouped the way both the tab and the home card show it */
export interface MedicationDay {
  /** the moments of the day, in clock order, each with the kids due then */
  slots: { slot: string; rows: MedEntry[] }[];
  /** "quando necessário" medicines — no fixed time, may repeat */
  sos: MedEntry[];
  /** neither a time nor "quando necessário": the team must confirm with the parents */
  unscheduled: MedEntry[];
  /** how many kids take anything at all (before the search filter) */
  kidsWithMeds: number;
  /** ticks of the day, keyed "<camperId>|<medKey>|<slot>" (scheduled doses only) */
  given: Map<string, MedicationDose>;
  /** "quando necessário" doses of the day, keyed "<camperId>|<medKey>" (they repeat) */
  sosGiven: Map<string, MedicationDose[]>;
  /** scheduled doses already ticked / due today */
  doneCount: number;
  total: number;
  /** null while the collections have not arrived yet */
  loading: boolean;
}

export const normalizeName = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

/** "HH:MM" → minutes, for sorting the moments of the day */
export function minutesOf(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

/** "08:30" → "🥐 Café 08:30"; "sos" → "🆘 Quando necessário" */
export function slotLabel(slot: string): string {
  return slot === SOS_SLOT ? "🆘 Quando necessário" : medicationTimeLabel(slot);
}

/** the preset emoji of a moment (plain clock for a custom time) */
export function slotEmoji(slot: string): string {
  if (slot === SOS_SLOT) return "🆘";
  return MEDICATION_PRESETS.find((p) => p.time === slot)?.emoji ?? "🕒";
}

/** "HH:MM" of now on the device clock */
export function nowTime(now = new Date()): string {
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

/**
 * The medication checklist of `day`, built from the kids' prescriptions and
 * the ticks already made. Shared by the Medicações tab and the summary card on
 * the medical team's Início, so the two can never disagree about what is due.
 *
 * `search` filters by the kid's name (the tab's search box); the home card
 * passes nothing.
 */
export function useMedicationDay(day: string, search = ""): MedicationDay {
  const campers = useCollection("campers");
  const doses = useCollection("medications");

  const { slots, sos, unscheduled, kidsWithMeds } = useMemo(() => {
    const list = campers ?? [];
    const q = normalizeName(search.trim());
    const withMeds = list.filter((k) => k.medications.length > 0);
    const matches = (k: Camper) => !q || normalizeName(k.name).includes(q);
    const bySlot = new Map<string, MedEntry[]>();
    const sosList: MedEntry[] = [];
    const missing: MedEntry[] = [];
    for (const kid of withMeds) {
      if (!matches(kid)) continue;
      for (const med of kid.medications) {
        const entry = { kid, med, medKey: medKeyOf(med.name) };
        if (med.asNeeded) sosList.push({ ...entry, slot: SOS_SLOT });
        else if (med.times.length === 0) missing.push({ ...entry, slot: "" });
        else
          for (const t of med.times) {
            const rows = bySlot.get(t) ?? [];
            rows.push({ ...entry, slot: t });
            bySlot.set(t, rows);
          }
      }
    }
    const byName = (a: MedEntry, b: MedEntry) => a.kid.name.localeCompare(b.kid.name, "pt-BR", { sensitivity: "base" });
    return {
      slots: [...bySlot.entries()].sort((a, b) => minutesOf(a[0]) - minutesOf(b[0])).map(([slot, rows]) => ({ slot, rows: rows.sort(byName) })),
      sos: sosList.sort(byName),
      unscheduled: missing.sort(byName),
      kidsWithMeds: withMeds.length,
    };
  }, [campers, search]);

  const given = useMemo(() => {
    const map = new Map<string, MedicationDose>();
    for (const d of doses ?? []) if (d.day === day && d.slot !== SOS_SLOT) map.set(`${d.camperId}|${d.medKey}|${d.slot}`, d);
    return map;
  }, [doses, day]);

  const sosGiven = useMemo(() => {
    const map = new Map<string, MedicationDose[]>();
    for (const d of doses ?? []) {
      if (d.day !== day || d.slot !== SOS_SLOT) continue;
      const key = `${d.camperId}|${d.medKey}`;
      map.set(key, [...(map.get(key) ?? []), d]);
    }
    for (const rows of map.values()) rows.sort((a, b) => a.givenAt.localeCompare(b.givenAt));
    return map;
  }, [doses, day]);

  const rows = slots.flatMap((s) => s.rows);
  return {
    slots,
    sos,
    unscheduled,
    kidsWithMeds,
    given,
    sosGiven,
    doneCount: rows.filter((e) => given.has(`${e.kid.id}|${e.medKey}|${e.slot}`)).length,
    total: rows.length,
    loading: !campers || !doses,
  };
}
