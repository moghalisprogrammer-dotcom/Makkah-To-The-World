"use client";
import Link from "next/link";
import { LanguageSwitch, useLocale } from "@/components/locale-provider";
export default function Credits() {
  const { locale } = useLocale();
  const en = locale === "en";
  return (
    <main className="credits-page">
      <LanguageSwitch />
      <h1>{en ? "Image & music credits" : "حقوق الصور والموسيقى"}</h1>
      <p>
        {en
          ? "The sights and sounds of your World Tourism Day 2026 invitation."
          : "صور وأصوات ترافق دعوتكم إلى فعالية يوم السياحة العالمي 2026."}
      </p>
      <h2>{en ? "Music & sound" : "الموسيقى والمؤثرات"}</h2>
      <p>
        {en
          ? "An original composition inspired by Saudi Ardah rhythm, with synthesized oud. The music and transition cues are generated without sampled recordings. This is a contemporary original, rather than a traditional performance or official event song."
          : "مقطوعة أصلية للدعوة، مستلهمة من إيقاع العرضة السعودية، مع عود اصطناعي ولحن مؤلّف للموقع. صُنعت أصواتها ومؤثرات الانتقال برمجيًا دون اقتباس تسجيلات أو ألحان. ليست تسجيل عرضة تراثية أو أغنية رسمية للفعالية."}
      </p>
      <p>
        {en ? "Rhythm reference: " : "المرجع الوصفي للإيقاع: "}
        <a href="https://saudipedia.com/en/saudi-ardah-rhythms">
          {en
            ? "Saudipedia — Saudi Ardah rhythms"
            : "سعوديبيديا — إيقاعات العرضة السعودية"}
        </a>
        .
      </p>
      <h2>{en ? "Photography" : "الصور"}</h2>
      <p>
        {en ? "AlUla: " : "العُلا: "}
        <a href="https://unsplash.com/photos/AT9KXQzmfks">
          Khawaja Umer Farooq
        </a>
        {en ? ", via Unsplash." : "، عبر Unsplash."}
      </p>
      <p>
        {en ? "Historic Jeddah: " : "جدة التاريخية: "}
        <a href="https://unsplash.com/photos/FDGA5A7IQF4">
          Muhammad Ahkamul Hakim
        </a>
        {en ? ", via Unsplash." : "، عبر Unsplash."}
      </p>
      <p>
        {en
          ? "The Makkah National College logo and brand colours are from the materials supplied by the organisers."
          : "شعار كلية مكة الأهلية وألوان هويتها من المواد المقدّمة من فريق التنظيم."}
      </p>
      <p>
        {en ? "Rijal Almaa: " : "رجال ألمع: "}
        <a href="https://unsplash.com/photos/L08hlqtD_qE">Satishaa Javali</a>
        {en ? ", via Unsplash." : "، عبر Unsplash."}
      </p>
      <p>
        {en ? "Diriyah: " : "الدرعية: "}
        <a href="https://unsplash.com/photos/XVeesLYfWIo">Ibrahim Abdullah</a>
        {en ? ", via Unsplash." : "، عبر Unsplash."}
      </p>
      <p>
        {en ? "At-Turaif: " : "حي الطريف: "}
        <a href="https://commons.wikimedia.org/wiki/File:At-Turaif_District_in_ad-Dir%27iyah_2025.jpg">
          ほっきー / Wikimedia Commons
        </a>
        {en ? ", licensed under " : "، بترخيص "}
        <a href="https://creativecommons.org/publicdomain/zero/1.0/">CC0</a>.
      </p>
      <p>
        {en
          ? "The Kaizen Group logo is a web-ready derivative of the image supplied by the organiser."
          : "شعار كايزن جروب من الصورة المقدّمة من المنظّم، مع تجهيز نسخة تناسب مساحة الواجهة."}
      </p>
      <Link href="/">
        {en ? "Back to the invitation →" : "العودة إلى الدعوة ←"}
      </Link>
    </main>
  );
}
