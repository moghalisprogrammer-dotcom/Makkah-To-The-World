"use client";
import { useLocale, LanguageSwitch } from "@/components/locale-provider";
export default function ErrorPage({ reset }: { reset: () => void }) {
  const { locale } = useLocale();
  const en = locale === "en";
  return (
    <main className="error-page">
      <LanguageSwitch />
      <h1>{en ? "Unable to load this page" : "تعذر تحميل الصفحة"}</h1>
      <p>
        {en
          ? "There was a temporary connection problem. Please try again."
          : "حدث خلل مؤقت في الاتصال. يرجى المحاولة مجددًا."}
      </p>
      <button className="button" onClick={reset}>
        {en ? "Try again" : "إعادة المحاولة"}
      </button>
    </main>
  );
}
