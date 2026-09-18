export const LOCALES = ["pt", "en", "es", "fr"] as const;
export type Locale = (typeof LOCALES)[number];

/** Default / fallback language — Brazilian Portuguese. */
export const DEFAULT_LOCALE: Locale = "pt";

export const LOCALE_TAG: Record<Locale, string> = {
  pt: "pt-BR",
  en: "en-US",
  es: "es-ES",
  fr: "fr-FR",
};

/** Device language → one of our four. Transparent — no picker. */
export function deviceLocale(): Locale {
  const raw = (typeof navigator !== "undefined" && (navigator.languages?.[0] || navigator.language)) || "pt";
  const primary = raw.trim().toLowerCase().replace("_", "-").split("-")[0] ?? "pt";
  if (primary === "pt" || primary === "en" || primary === "es" || primary === "fr") return primary;
  return DEFAULT_LOCALE;
}

export function resolveLocale(raw: string | null | undefined): Locale {
  if (!raw) return DEFAULT_LOCALE;
  const primary = raw.trim().toLowerCase().replace("_", "-").split("-")[0] ?? "pt";
  if (primary === "pt" || primary === "en" || primary === "es" || primary === "fr") return primary;
  return DEFAULT_LOCALE;
}

export function format(template: string, vars: Record<string, string | number> = {}): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => (vars[key] !== undefined ? String(vars[key]) : `{${key}}`));
}

export function collatorLocale(): string {
  if (typeof document !== "undefined" && document.documentElement.lang) return document.documentElement.lang;
  return LOCALE_TAG[DEFAULT_LOCALE];
}
