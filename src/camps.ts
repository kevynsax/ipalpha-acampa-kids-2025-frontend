/** "Acampa Kids · 2026" — the label already has the year, or gets it appended. */
export function campBrandLabel(label: string, year: number): string {
  return label.includes(String(year)) ? label : `${label} · ${year}`;
}
