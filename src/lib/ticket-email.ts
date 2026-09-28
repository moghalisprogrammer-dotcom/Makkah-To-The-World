import { event, ageGroups, ageLabels } from "./event";
import { agenda, workshops, arabicTime } from "./agenda";
import { workshopLabel, workshopTime } from "./workshops";
import { translate } from "./locale";
import type { Registration } from "./db";

const esc = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
export function ticketEmail(registration: Registration, base: string) {
  const locale = registration.locale === "en" ? "en" : "ar";
  const en = locale === "en";
  const t = (s: string) => translate(s, locale);
  const pick = (ar: string, english: string) => (en ? english : ar);
  const url = `${base}/ticket/${registration.secure_token}?lang=${locale}`;
  const calendar = `${base}/${en ? "event-en.ics" : "event.ics"}`;
  const workshop = `${workshopLabel(registration.workshop_id, locale)}${registration.workshop_id ? ` · ${workshopTime(registration.workshop_id, locale)} · ${t("الدور الثاني")}` : ""}`;
  const details = [
    [t("الاسم الكامل"), registration.full_name],
    [t("البريد الإلكتروني"), registration.email],
    [t("الجوال"), registration.phone],
    [
      t("الفئة العمرية"),
      t(
        ageLabels[
          ageGroups.indexOf(
            registration.age_group as (typeof ageGroups)[number],
          )
        ] || registration.age_group,
      ),
    ],
    [
      t("جهة العمل أو الدراسة"),
      registration.company || pick("غير محددة", "Not provided"),
    ],
    [
      t("المسمى الوظيفي"),
      registration.job_title || pick("غير محدد", "Not provided"),
    ],
    [
      pick("رقم التسجيل", "Registration number"),
      registration.registration_number,
    ],
  ];
  const button = (text: string, href: string, light = false) =>
    `<a href="${esc(href)}" style="display:inline-block;margin:6px 4px;padding:13px 22px;border-radius:9px;text-decoration:none;font-weight:bold;background:${light ? "#eaf5fc" : "#0082bf"};color:${light ? "#082b65" : "#ffffff"}">${esc(text)}</a>`;
  const time = (value: string) =>
    `${arabicTime(value)} ${Number(value.split(":")[0]) < 12 ? pick("ص", "AM") : pick("م", "PM")}`;
  const schedule = agenda
    .map(
      (item) =>
        `<tr><td style="padding:11px 8px;border-bottom:1px solid #e3edf5;vertical-align:top;white-space:nowrap;color:#0082bf;font-size:12px;direction:ltr">${time(item.start)}<br>${time(item.end)}</td><td style="padding:11px 8px;border-bottom:1px solid #e3edf5"><strong style="font-size:13px">${esc(t(item.title))}</strong><br><span style="font-size:11px;color:#607b94">${esc(
          [item.location, item.speaker, item.note]
            .filter(Boolean)
            .map((s) => t(s!))
            .join(" · "),
        )}</span></td></tr>`,
    )
    .join("");
  const workshopTable = workshops
    .map(
      (w) =>
        `<tr><td style="padding:9px;border-bottom:1px solid #e3edf5;font-size:12px"><strong>${esc(t(w.title))}</strong><br>${esc(workshopTime(w.id as Registration["workshop_id"], locale))} · ${esc(t(w.location))}</td></tr>`,
    )
    .join("");
  const profile = details
    .map(
      ([label, value]) =>
        `<tr><td style="padding:8px;border-bottom:1px solid #e3edf5;color:#607b94;font-size:12px;vertical-align:top">${esc(label)}</td><td style="padding:8px;border-bottom:1px solid #e3edf5;font-size:13px;overflow-wrap:anywhere">${esc(value)}</td></tr>`,
    )
    .join("");
  const subject = `${pick("تذكرتك", "Your ticket")} | ${t("يوم السياحة العالمي 2026")} | ${registration.registration_number}`;
  const greeting = pick(
    `أهلًا بك، ${registration.full_name}`,
    `Welcome, ${registration.full_name}`,
  );
  const note = pick(
    "شكرًا لتسجيلك. دعوتك مؤكدة، ويسعدنا أن نلتقي بك في تجربة تجمع السياحة والضيافة والتقنية والثقافة السعودية.",
    "Thank you for registering. Your place is confirmed. We look forward to sharing a day of tourism, hospitality, technology and Saudi culture.",
  );
  const arrival = pick(
    "يرجى الاحتفاظ برمز QR وإبرازه لفريق الاستقبال عند الوصول. تبدأ الفعالية الساعة 9:00 صباحًا، وتوجد 4 بوابات للاستقبال. اختيار الورشة الموضح أدناه هو اختيارك الوحيد لأن أوقات الورش متداخلة.",
    "Save your QR code and show it to the reception team on arrival. The event begins at 9:00 AM, with 4 entry gates. Your selected workshop is your only workshop choice because the sessions overlap.",
  );
  const floorGuide = pick(
    "دور M: المعرض والأركان وتجربة الضيافة الذكية. الدور الثاني: المسرح والورش الثلاث.",
    "Floor M: exhibition, experiences and smart hospitality. Second floor: theatre and all three workshops.",
  );
  const html = `<!doctype html><html lang="${locale}" dir="${en ? "ltr" : "rtl"}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>@media(max-width:480px){.email-padding{padding:22px 16px!important}.email-title{font-size:25px!important}}</style></head><body style="margin:0;background:#edf3f8;font-family:Tahoma,Arial,sans-serif;color:#041b3d"><div style="display:none;max-height:0;overflow:hidden">${esc(pick("تذكرتك وبرنامج يومك وموقع الكلية، كلها هنا.", "Your ticket, full agenda and directions, all in one place."))}</div><table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center" style="padding:24px 10px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#fff;border:1px solid #dce7f0;border-radius:16px;overflow:hidden">
  <tr><td class="email-padding" style="padding:28px 34px;background:#041b3d;color:white;text-align:center"><img src="cid:college-seal" width="62" height="62" alt="" style="display:block;margin:auto"><p style="margin:10px 0 2px;font-size:18px;color:white" lang="ar" dir="rtl">كلية مكة الأهلية</p><p style="margin:0;font-size:11px;letter-spacing:1px;color:#a9d9f3" lang="en" dir="ltr">MAKKAH NATIONAL COLLEGE</p><p style="font-size:11px;color:#88cef5;margin:25px 0 8px">${esc(t("من مكة إلى العالم"))}</p><h1 class="email-title" style="font-size:30px;line-height:1.5;margin:0;color:white">${esc(t("يوم السياحة العالمي 2026"))}</h1><p style="font-size:12px;color:#cae3f5;margin:8px 0 0">${esc(t(event.companion))}</p></td></tr>
  <tr><td class="email-padding" style="padding:30px 34px"><h2 style="font-size:23px;margin:0 0 12px">${esc(greeting)}</h2><p style="font-size:14px;line-height:1.9;color:#47627c">${esc(note)}</p><div style="background:#eef7fc;border-inline-start:3px solid #2c97d2;padding:18px;border-radius:9px;font-size:14px;line-height:2">${esc(t(event.date))}<br>${esc(t(event.time))} · ${esc(pick("بتوقيت مكة المكرمة", "Makkah time · GMT+3"))}<br>${esc(t(event.location))}</div>
  <div style="text-align:center;padding:24px 0"><img src="cid:ticket-qr" width="220" height="220" alt="${esc(t("رمز الاستجابة السريعة الخاص بتذكرة الدخول"))}" style="display:block;max-width:100%;margin:auto"><p dir="ltr" style="font-size:17px;letter-spacing:2px;color:#0082bf">${esc(registration.registration_number)}</p>${button(t("تحميل التذكرة"), url)}${button(t("موقع كلية مكة الأهلية"), event.maps, true)}<br>${button(t("أضف الموعد إلى تقويمك"), calendar, true)}</div>
  <p style="font-size:13px;line-height:1.9;color:#47627c">${esc(arrival)}</p><h2 style="font-size:19px;margin-top:28px">${esc(t("اختيارك للورش"))}</h2><p style="border:1px solid #b6dff1;background:#f6fbfe;padding:15px;border-radius:8px;font-size:14px;line-height:1.8">${esc(workshop)}</p>
  <h2 style="font-size:19px;margin-top:28px">${esc(pick("بيانات تسجيلك", "Your registration details"))}</h2><table width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;text-align:${en ? "left" : "right"}">${profile}</table>
  <h2 style="font-size:19px;margin-top:30px">${esc(pick("برنامج يومك كاملًا", "Your complete event programme"))}</h2><table width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;text-align:${en ? "left" : "right"}">${schedule}</table>
  <h2 style="font-size:19px;margin-top:28px">${esc(t("ورش العمل"))}</h2><p style="font-size:12px;color:#607b94">${esc(t("يمكنك اختيار ورشة واحدة عند تأكيد حضورك."))}</p><table width="100%" cellspacing="0" cellpadding="0">${workshopTable}</table>
  <h2 style="font-size:19px;margin-top:28px">${esc(t("دليل الزيارة"))}</h2><p style="font-size:13px;line-height:1.9">${esc(floorGuide)}</p><div style="text-align:center">${button(t("موقع كلية مكة الأهلية"), event.maps)}${button(pick("الموقع الرسمي للكلية", "College website"), event.website, true)}${button(pick("عرض الدعوة والبرنامج", "View invitation & agenda"), `${base}/?lang=${locale}#agenda`, true)}</div>
  </td></tr><tr><td class="email-padding" style="padding:25px 34px;background:#f0f6fa;text-align:center"><p style="font-size:12px;line-height:1.8">${esc(t(event.organizer))}</p><a href="mailto:${event.email}" style="color:#0082bf;font-size:12px">${event.email}</a><div style="margin:20px auto 8px"><a href="https://kaizenksa.com"><img src="cid:kaizen-logo" width="145" alt="Kaizen Group" style="max-width:145px;height:auto"></a></div><p style="font-size:11px;color:#58758c">${esc(t("شريك استراتيجي للخدمات التسويقية وتنظيم المعارض والمؤتمرات"))}</p></td></tr></table></td></tr></table></body></html>`;
  const text = [
    greeting,
    note,
    t(event.fullTitle),
    t(event.date),
    t(event.time),
    t(event.location),
    arrival,
    workshop,
    ...details.map(([k, v]) => `${k}: ${v}`),
    `${t("تحميل التذكرة")}: ${url}`,
    `${t("موقع كلية مكة الأهلية")}: ${event.maps}`,
    `College website: ${event.website}`,
    `${t("أضف الموعد إلى تقويمك")}: ${calendar}`,
    ...agenda.map(
      (i) =>
        `${time(i.start)}–${time(i.end)} · ${t(i.title)} · ${[
          i.location,
          i.speaker,
          i.note,
        ]
          .filter(Boolean)
          .map((s) => t(s!))
          .join(" · ")}`,
    ),
    ...workshops.map(
      (w) =>
        `${t(w.title)} · ${workshopTime(w.id as Registration["workshop_id"], locale)} · ${t(w.location)}`,
    ),
    floorGuide,
    t(event.organizer),
    event.email,
    `${t("كايزن جروب")} — ${t("شريك استراتيجي للخدمات التسويقية وتنظيم المعارض والمؤتمرات")}`,
    "https://kaizenksa.com",
  ].join("\n\n");
  return { subject, html, text };
}
