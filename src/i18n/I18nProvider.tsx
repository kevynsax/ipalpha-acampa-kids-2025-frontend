import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { LITERALS } from "./literals";
import { DEFAULT_LOCALE, LOCALE_TAG, deviceLocale, format, resolveLocale, type Locale } from "./locales";
import { t as translate, type UiKey } from "./ui";

interface I18nValue {
  locale: Locale;
  setLocale: (locale: Locale | string | null | undefined) => void;
  t: (key: UiKey, vars?: Record<string, string | number>) => string;
  tx: (pt: string, vars?: Record<string, string | number>) => string;
  tag: string;
}

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => deviceLocale());

  useEffect(() => {
    const apply = () => setLocaleState(deviceLocale());
    apply();
    window.addEventListener("languagechange", apply);
    return () => window.removeEventListener("languagechange", apply);
  }, []);

  useEffect(() => {
    document.documentElement.lang = LOCALE_TAG[locale];
  }, [locale]);

  const value = useMemo<I18nValue>(
    () => ({
      locale,
      setLocale: (next) => setLocaleState(resolveLocale(next ?? DEFAULT_LOCALE)),
      t: (key, vars) => translate(locale, key, vars),
      tx: (pt, vars) => format(locale === "pt" ? pt : (LITERALS[pt]?.[locale] ?? pt), vars ?? {}),
      tag: LOCALE_TAG[locale],
    }),
    [locale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  return ctx;
}

export function useT() {
  return useI18n().t;
}

export function useTx() {
  return useI18n().tx;
}
