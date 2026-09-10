/** +5511981234567 → (11) 98123-4567 (client-side display helper) */
export function formatBrazilPhoneClient(e164: string): string {
  const n = e164.replace(/\D/g, "").replace(/^55/, "");
  const ddd = n.slice(0, 2);
  const rest = n.slice(2);
  return `(${ddd}) ${rest.slice(0, 5)}-${rest.slice(5)}`;
}
