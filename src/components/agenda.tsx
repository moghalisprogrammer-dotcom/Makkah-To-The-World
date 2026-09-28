"use client";
import { useState } from "react";
import { appPath } from "@/lib/base-path";
import {
  ArrowDown,
  ArrowLeft,
  CalendarPlus,
  CalendarDays,
  Clock3,
  MapPin,
  Mic2,
  Coffee,
  Presentation,
  Handshake,
  Award,
  Compass,
  Laptop,
  ChefHat,
  ShieldCheck,
  Info,
} from "lucide-react";
import {
  agenda,
  workshops,
  arabicTime,
  period,
  duration,
  categoryLabels,
} from "@/lib/agenda";
const icons = {
  welcome: Handshake,
  session: Mic2,
  experience: Coffee,
  tour: Compass,
  workshop: Presentation,
  closing: Award,
};
const filters = [
  { id: "all", label: "البرنامج كاملًا" },
  { id: "sessions", label: "الجلسات والتجارب" },
  { id: "tours", label: "الجولات والتواصل" },
] as const;
const workshopIcons = [Laptop, ChefHat, ShieldCheck, Compass];
export function Agenda() {
  const [filter, setFilter] = useState<(typeof filters)[number]["id"]>("all");
  const shown = agenda.filter(
    (x) =>
      filter === "all" ||
      (filter === "sessions"
        ? ["session", "experience", "workshop"].includes(x.category)
        : x.category === "tour"),
  );
  return (
    <section className="agenda-section section" id="agenda">
      <div className="container">
        <div className="section-heading agenda-heading">
          <div>
            <div className="section-label">
              <span>03</span>برنامج يومك
            </div>
            <h2>
              لكل لحظة <span>تجربتها.</span>
            </h2>
            <p>
              من فنجان الترحيب إلى آخر حكاية؛ تعرّف على فقرات يومك، وخطّط لما
              يلهمك.
            </p>
          </div>
          <a
            className="button button-outline"
            href={appPath("/event.ics")}
            download
          >
            <CalendarPlus size={18} />
            أضف الموعد إلى تقويمك
          </a>
        </div>
        <div className="agenda-overview">
          <span>
            <CalendarDays size={18} />
            الخميس، 1 أكتوبر 2026
          </span>
          <span>
            <Clock3 size={18} />9 صباحًا — 3 مساءً
          </span>
          <a href="#workshops">
            ورش العمل <ArrowDown size={15} />
          </a>
          <a href="#venue-guide">
            دليل الوصول الداخلي <ArrowDown size={15} />
          </a>
        </div>
        <div className="agenda-filter" aria-label="تصفية البرنامج">
          {filters.map((x) => (
            <button
              key={x.id}
              aria-pressed={filter === x.id}
              className={filter === x.id ? "active" : ""}
              onClick={() => setFilter(x.id)}
            >
              {x.label}
            </button>
          ))}
          <span>جميع الأوقات بتوقيت مكة المكرمة</span>
        </div>
        <div className="agenda-timeline" aria-live="polite">
          {shown.map((item) => {
            const Icon = icons[item.category];
            return (
              <article className="agenda-row" key={item.start}>
                <div className="agenda-time">
                  <strong>
                    <time dateTime={`2026-10-01T${item.start}:00+03:00`}>
                      {arabicTime(item.start)}
                    </time>
                    <span>{period(item.start)}</span>
                  </strong>
                  <small>
                    حتى {arabicTime(item.end)} {period(item.end)}
                  </small>
                  <span className="agenda-duration">
                    {duration(item.start, item.end)} دقيقة
                  </span>
                </div>
                <div className="timeline-line">
                  <span>
                    <Icon size={17} />
                  </span>
                </div>
                <div className="agenda-content">
                  <span className={`agenda-category ${item.category}`}>
                    {categoryLabels[item.category]}
                  </span>
                  <h3>{item.title}</h3>
                  {item.note && <p>{item.note}</p>}
                  {item.speaker && (
                    <span className="agenda-speaker">
                      <Mic2 size={14} />
                      {item.speaker}
                    </span>
                  )}
                </div>
                <div className="agenda-place">
                  {item.location && (
                    <span>
                      <MapPin size={15} />
                      {item.location}
                    </span>
                  )}
                </div>
              </article>
            );
          })}
        </div>
        <div className="agenda-hint">
          <Info size={17} />
          <p>
            تتزامن بعض الورش مع فقرات البرنامج العام. اطّلع على مواعيدها أدناه
            واختر التجربة المناسبة لك.
          </p>
        </div>
        <div className="workshops-block" id="workshops">
          <div className="workshop-heading">
            <div>
              <div className="section-label">مساحة للتعلّم والتجربة</div>
              <h3>ورش العمل</h3>
              <p>ثلاث ورش متزامنة؛ اختر التجربة التي توافق اهتمامك.</p>
            </div>
            <div className="workshop-time">
              <Clock3 size={21} />
              <span>
                <strong>12:00 ظهرًا — 1:00 مساءً</strong>
                <small>الظهور المهني يبدأ 12:15 · الدور الثاني</small>
              </span>
            </div>
          </div>
          <div className="workshops-grid">
            {workshops.map((w, i) => {
              const Icon = workshopIcons[i];
              return (
                <article className="workshop-card" key={w.id}>
                  <div className="card-top">
                    <Icon size={27} strokeWidth={1.4} />
                    <span>{w.number}</span>
                  </div>
                  <h4>{w.title}</h4>
                  {w.pending && (
                    <p className="workshop-status">
                      الموضوع والمتحدث بانتظار التأكيد
                    </p>
                  )}
                  <div>
                    <span>
                      <Clock3 size={15} />
                      {arabicTime(w.start)} ظهرًا — {arabicTime(w.end)} مساءً
                    </span>
                    <span>
                      <MapPin size={15} />
                      {w.location}
                    </span>
                  </div>
                </article>
              );
            })}
          </div>
          <p className="workshop-pending">
            <Info size={15} />
            تبدأ ورشتا مطابخ حول العالم وسلامة الأغذية الساعة 12 ظهرًا، وورشة
            أساسيات الظهور المهني الرقمي الساعة 12:15. تنتهي الورش الثلاث الساعة
            1 مساءً.
          </p>
        </div>
        <div className="venue-guide" id="venue-guide">
          <div className="venue-guide-title">
            <span className="section-label">تعرّف على وجهتك</span>
            <h3>أين تجد كل تجربة؟</h3>
            <p>داخل كلية مكة الأهلية</p>
          </div>
          <div className="floor-card">
            <span className="floor-number" dir="ltr">
              M
            </span>
            <div>
              <h4>دور M</h4>
              <p>
                المعرض والأركان
                <br />
                عرض وتجربة السياحة والضيافة الذكية
              </p>
            </div>
          </div>
          <div className="floor-card">
            <span className="floor-number">2</span>
            <div>
              <h4>الدور الثاني</h4>
              <p>
                المسرح: جلسة مستقبل السياحة
                <br />
                قاعات ورش العمل
              </p>
            </div>
          </div>
        </div>
        <div className="agenda-cta">
          <span>
            اختر لحظاتك المفضلة. <strong>ومكانك بيننا بانتظارك.</strong>
          </span>
          <a href="#register" className="text-link">
            سجّل حضورك <ArrowLeft size={17} />
          </a>
        </div>
      </div>
    </section>
  );
}
