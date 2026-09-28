"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { Languages } from "lucide-react";
import { translate, type Locale } from "@/lib/locale";

const Context = createContext({
  locale: "ar" as Locale,
  ready: false,
  setLocale: (_: Locale) => {},
  t: (text: string) => text,
});
export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, update] = useState<Locale>("ar");
  const [ready, setReady] = useState(false);
  const path = usePathname();
  const internal = /^\/(admin|check-in|login)(\/|$)/.test(path);
  useEffect(() => {
    let saved: string | null = null;
    try {
      saved = localStorage.getItem("makkah_language");
    } catch {}
    const requested = new URLSearchParams(location.search).get("lang");
    const language =
      requested ||
      saved ||
      (navigator.language.toLowerCase().startsWith("ar") ? "ar" : "en");
    update(language === "ar" ? "ar" : "en");
    setReady(true);
  }, []);
  const setLocale = useCallback((language: Locale) => {
    update(language);
    try {
      localStorage.setItem("makkah_language", language);
    } catch {}
    const url = new URL(location.href);
    if (url.searchParams.has("lang")) {
      url.searchParams.set("lang", language);
      history.replaceState(null, "", url);
    }
  }, []);
  const current = internal ? "ar" : locale;
  useEffect(() => {
    document.documentElement.lang = current;
    document.documentElement.dir = current === "ar" ? "rtl" : "ltr";
  }, [current]);
  const t = useCallback((text: string) => translate(text, current), [current]);
  const value = useMemo(
    () => ({ locale: current, ready, setLocale, t }),
    [current, ready, setLocale, t],
  );
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useLocale() {
  return useContext(Context);
}
export function LanguageSwitch() {
  const { locale, setLocale } = useLocale();
  return (
    <button
      type="button"
      className="language-switch"
      lang={locale === "ar" ? "en" : "ar"}
      onClick={() => setLocale(locale === "ar" ? "en" : "ar")}
      aria-label={locale === "ar" ? "Switch to English" : "التبديل إلى العربية"}
    >
      <Languages size={15} />
      <span>{locale === "ar" ? "English" : "العربية"}</span>
    </button>
  );
}
