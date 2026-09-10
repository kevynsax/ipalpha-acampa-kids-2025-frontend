/** First name of a person, or `fallback` when the name is blank. */
function firstName(name: string, fallback: string): string {
  const first = name.trim().split(/\s+/)[0];
  return first || fallback;
}

/**
 * The opening message a caretaker sends to a kid's guardian, e.g.
 * "Olá, Marcela! Meu nome é Cesar e sou o responsável pela Ana aqui no
 *  Acampa Kids 2025. Como você está?"
 */
export function guardianGreeting(opts: { guardianName: string; staffName: string; camperName: string }): string {
  const guardian = firstName(opts.guardianName, "");
  const staff = firstName(opts.staffName, "da equipe");
  const camper = firstName(opts.camperName, "seu filho(a)");
  const hello = guardian ? `Olá, ${guardian}!` : "Olá!";
  return `${hello} Meu nome é ${staff} e sou responsável por ${camper} aqui no Acampa Kids 2025. Como você está?`;
}

/**
 * Generic opening message from a logged-in person to anyone in the camp, e.g.
 * "Olá, Cesar! Aqui é Flavi, do Acampa Kids 2025."
 * With `about` (a kid's name): "… Estou entrando em contato sobre a Ana."
 */
export function staffGreeting(opts: { toName: string; fromName: string; about?: string }): string {
  const to = firstName(opts.toName, "");
  const from = firstName(opts.fromName, "");
  const hello = to ? `Olá, ${to}!` : "Olá!";
  const who = from ? `Aqui é ${from}, do Acampa Kids 2025.` : "Aqui é do Acampa Kids 2025.";
  const about = opts.about ? ` Estou entrando em contato sobre ${firstName(opts.about, "seu filho(a)")}.` : "";
  return `${hello} ${who}${about}`;
}

/** wa.me deep link (works on phones with the app and on desktop via WhatsApp Web). */
export function whatsappLink(phoneE164: string, text: string): string {
  const digits = phoneE164.replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}
