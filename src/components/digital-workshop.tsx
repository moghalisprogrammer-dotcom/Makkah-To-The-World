"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Award, CalendarDays, Clock3, MapPin, ArrowDown, TicketCheck } from "lucide-react";
import { LanguageSwitch, useLocale } from "./locale-provider";
import { InvitationForm, emptyInvitation } from "./invitation-form";
import { appPath } from "@/lib/base-path";
import { digitalWorkshop } from "@/lib/digital-workshop";
import { readSavedTicket } from "@/lib/saved-ticket";
import { workshops } from "@/lib/agenda";
import { workshopTime } from "@/lib/workshops";
import { event } from "@/lib/event";

export function DigitalWorkshop() {
  const { locale, t } = useLocale();
  const en = locale === "en";
  const router = useRouter();
  const workshop = workshops.find(w => w.id === "digital")!;
  const [data, setData] = useState<typeof emptyInvitation>({ ...emptyInvitation, workshop_id: "digital", workshop_answered: true });
  const [step, setStep] = useState(0);
  const [saved, setSaved] = useState<string | null>(null);
  useEffect(() => { setSaved(readSavedTicket()); }, []);
  return <main className="digital-workshop">
    <header className="dw-header">
      <a href={appPath("/")} className="dw-college"><img src={appPath("/images/college-seal.webp")} alt={t("كلية مكة الأهلية")} width={56} height={56}/><span>{t("كلية مكة الأهلية")}<small>{en ? "World Tourism Day 2026" : "يوم السياحة العالمي 2026"}</small></span></a>
      <div className="dw-header-end"><img className="dw-medyaf" src={appPath("/images/medyaf-logo.png")} alt="مضياف · MEDYAF" width={60} height={70}/><LanguageSwitch /></div>
    </header>
    <section className="dw-hero">
      <div className="dw-copy"><span className="dw-eyebrow">{en ? "A stronger professional presence" : "حضور مهني يعبّر عنك"}</span>
      <h1>{t(digitalWorkshop.title)}</h1>
      <p>{en ? digitalWorkshop.descriptionEn : digitalWorkshop.description}</p>
      <span className="dw-certificate"><Award size={21}/>{en ? "Workshop attendance certificate available" : "توجد شهادة حضور للورشة"}</span>
      <a className="dw-primary" href="#register">{en ? "Register for this workshop" : "سجّل في الورشة"}<ArrowDown size={19}/></a>
      </div>
      <div className="dw-portrait"><div className="dw-orbit"/><img src={appPath("/people/bandar-cutout.webp")} alt={t(workshop.presenter)} width={650} height={780} fetchPriority="high"/><div className="dw-presenter"><small>{t("تقديم")}</small><strong>{t(workshop.presenter)}</strong></div></div>
    </section>
    <section className="dw-facts" aria-label={en ? "Workshop details" : "تفاصيل الورشة"}>
      <span><CalendarDays/><b>{t(event.date)}</b></span><span><Clock3/><b>{workshopTime("digital", locale)}</b></span><span><MapPin/><b>{t(workshop.location)} · {t("كلية مكة الأهلية")}</b></span>
    </section>
    <section className="dw-registration" id="register">
      <div className="dw-register-intro"><span className="dw-eyebrow">{en ? "Your workshop registration" : "تسجيل حضور الورشة"}</span><h2>{en ? "Your details. Your entry ticket." : "بياناتك، ثم تذكرة حضورك."}</h2><p>{en ? "Complete your details to receive your personal QR ticket. Save it and show it at reception." : "أكمل بياناتك لتحصل على تذكرة QR شخصية. احفظها وأبرزها لموظف الاستقبال عند الوصول."}</p><p>{en ? "This form registers you for Digital Professional Presence. Your ticket also includes the organiser’s workshop form." : "هذا التسجيل مخصص لورشة أساسيات الظهور المهني الرقمي. ستجد في تذكرتك أيضًا رابط نموذج الجهة المنظمة لاستكماله."}</p>{saved && <a className="dw-saved" href={appPath(`/ticket/${saved}`)}><TicketCheck size={20}/>{en ? "Open my saved ticket" : "عرض تذكرتي المحفوظة"}</a>}</div>
      <div className="dw-form"><InvitationForm data={data} setData={setData} step={step} setStep={setStep} fixedWorkshopId="digital" onSuccess={(token) => router.push(appPath(`/registration/success?ticket=${token}`))}/></div>
    </section>
    <footer className="dw-footer"><div><img src={appPath("/images/medyaf-logo.png")} alt="مضياف · MEDYAF" width={60} height={70}/><span>{en ? "Department of Tourism and Hospitality" : "قسم السياحة والضيافة"}<small>{t("كلية مكة الأهلية")}</small></span></div><a href="https://kaizenksa.com" target="_blank" rel="noopener noreferrer"><span>{en ? "Strategic partner · Kaizen Group" : "الشريك الاستراتيجي · كايزن قروب"}<small>{en ? "Marketing services, exhibitions and conferences" : "للخدمات التسويقية وتنظيم المعارض والمؤتمرات"}</small></span><img className="dw-kaizen" src={appPath("/images/kaizen-logo.webp")} alt="KAIZEN GROUP" width={116} height={44}/></a></footer>
  </main>;
}
