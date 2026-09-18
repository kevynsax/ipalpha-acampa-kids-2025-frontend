/**
 * Age in whole years. Kept in its own module with NO imports so it can run
 * anywhere — the room-distribution Web Worker included, where `window`,
 * `localStorage` and the i18n layer do not exist. `api/campers.ts` re-exports
 * it for the rest of the app.
 */
export function ageOf(birthDate: string | null, at = new Date()): number | null {
  if (!birthDate) return null;
  const [y, m, d] = birthDate.split("-").map(Number);
  let age = at.getFullYear() - y;
  if (at.getMonth() + 1 < m || (at.getMonth() + 1 === m && at.getDate() < d)) age--;
  return age >= 0 && age < 120 ? age : null;
}
