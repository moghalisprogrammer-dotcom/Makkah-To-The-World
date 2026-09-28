"use client";
import Link from "next/link";
import { useLocale } from "@/components/locale-provider";
import { Header } from "@/components/header";
export default function NotFound() {
  const { locale } = useLocale();
  const en = locale === "en";
  return (
    <>
      <Header simple />
      <main className="error-page">
        <span className="section-label" style={{ justifyContent: "center" }}>
          404
        </span>
        <h1>
          {en ? "This destination was not found" : "هذه الوجهة غير موجودة"}
        </h1>
        <p>
          {en
            ? "Please check the link or return to the event invitation."
            : "قد يكون الرابط غير صحيح. يمكنك العودة إلى صفحة الفعالية."}
        </p>
        <Link className="button" href="/">
          {en ? "Back to the invitation" : "العودة للرئيسية"}
        </Link>
      </main>
    </>
  );
}
