/** Keeps only digits, max 11 (DDD + 9-digit mobile). */
export function digitsOnly(value: string, max = 11): string {
  return value.replace(/\D/g, "").slice(0, max);
}

/** Formats BR digits as (11) 98123-4567 progressively. */
export function maskBrazilPhone(value: string): string {
  const d = digitsOnly(value);
  if (d.length === 0) return "";
  if (d.length <= 2) return `(${d}`;
  const ddd = d.slice(0, 2);
  const rest = d.slice(2);
  if (rest.length <= 4) return `(${ddd}) ${rest}`;
  if (rest.length <= 5) return `(${ddd}) ${rest}`;
  return `(${ddd}) ${rest.slice(0, 5)}-${rest.slice(5)}`;
}

/** (11) 98123-4567 or 11981234567 → +5511981234567; null if not a BR mobile. */
export function toE164(masked: string): string | null {
  const d = digitsOnly(masked);
  if (d.length !== 11) return null;
  if (!/^[1-9][1-9]9\d{8}$/.test(d)) return null;
  return `+55${d}`;
}

export function isCompleteMobile(masked: string): boolean {
  return digitsOnly(masked).length === 11;
}
