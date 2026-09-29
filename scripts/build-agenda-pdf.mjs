import { readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { chromium } from "playwright";
import { agenda, workshops, arabicTime, period } from "../src/lib/agenda.ts";
import { event } from "../src/lib/event.ts";

const asset = async (p, mime) =>
  `data:${mime};base64,${(await readFile(resolve(p))).toString("base64")}`;
const college = await asset("public/images/college-seal.webp", "image/webp");
const kaizen = await asset("public/images/kaizen-logo.webp", "image/webp");
const font400 = await asset(
  "node_modules/@fontsource/ibm-plex-sans-arabic/files/ibm-plex-sans-arabic-arabic-400-normal.woff2",
  "font/woff2",
);
const font600 = await asset(
  "node_modules/@fontsource/ibm-plex-sans-arabic/files/ibm-plex-sans-arabic-arabic-600-normal.woff2",
  "font/woff2",
);
const range = (x) =>
  x.end
    ? `<b dir="ltr">${arabicTime(x.start)} - ${arabicTime(x.end)}</b><small>${x.start < "12:00" && x.end >= "12:00" ? "صباحًا إلى مساءً" : period(x.start)}</small>`
    : `<b dir="ltr">${arabicTime(x.start)}</b><small>صباحًا · بداية الجولة</small>`;
const row = (x) =>
  `<div class="row"><div class="time">${range(x)}</div><div class="activity">${x.title}</div><div class="place">${x.location}</div></div>`;
const section = (number, name, caption, rows) =>
  `<section><header><span>${number}</span><h2>${name}</h2><small>${caption}</small></header>${rows.map(row).join("")}</section>`;
const welcome = agenda.filter(
  (x) => x.category === "welcome" || x.category === "tour",
);
const sessions = agenda.filter(
  (x) => x.category === "session" || x.category === "closing",
);
const workshopRows = [workshops[0], workshops[2], workshops[1]];
const html = `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>أجندة يوم السياحة العالمي 2026 - كلية مكة الأهلية</title><style>
@font-face{font-family:P;src:url('${font400}');font-weight:400}@font-face{font-family:P;src:url('${font600}');font-weight:600}
@page{size:A4;margin:0}*{box-sizing:border-box}body{margin:0;font-family:P,Arial;color:#122d47;background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact}.page{width:210mm;height:297mm;position:relative;overflow:hidden;background:#f9fbfc}.hero{background:#061b34;color:white;padding:10mm 13mm 7mm;border-bottom:2px solid #d7bd84}.brands{display:flex;justify-content:space-between;align-items:center;margin-bottom:7mm}.college{display:flex;align-items:center;gap:3mm}.college img{width:15mm;height:15mm}.college b{display:block;font-size:15px}.college small{font:10px Arial;color:#b4ccde}.kaizen{text-align:center}.kaizen img{width:37mm;border-radius:1.5mm;display:block;background:white;padding:1mm}.kaizen small{display:block;font-size:9px;color:#d7bd84;margin-top:1mm}h1{font-size:31px;font-weight:600;margin:0;line-height:1.35}.hero p{margin:1mm 0 0;color:#d7bd84;font-size:19px;font-weight:600}.date{display:flex;justify-content:space-between;align-items:center;margin-top:5mm;border-top:1px solid #36506a;padding-top:4mm;color:#d2e4f0;font-size:12px}.date b{color:white;font-weight:600}.body{padding:5mm 13mm 0}.columns{display:grid;grid-template-columns:32mm 1fr 43mm;gap:3mm;font-size:9px;color:#718598;padding:0 3mm 2mm;direction:ltr}.columns span{direction:rtl}.columns span:first-child{text-align:center}section{margin-bottom:4mm}section header{display:flex;gap:3mm;align-items:center;padding:2mm 3mm;background:#eaf2f8;border-radius:2mm 2mm 0 0;border-right:3px solid #0082bf}section header>span{font:12px Arial;color:#0082bf}h2{font-size:16px;margin:0;font-weight:600}section header small{margin-right:auto;font-size:10px;color:#53738b}.row{display:grid;grid-template-columns:32mm 1fr 43mm;gap:3mm;align-items:center;min-height:17mm;padding:3mm;background:white;border-bottom:1px solid #dce6ee;direction:ltr}.row>*{direction:rtl}.time{text-align:center;color:#007ea8}.time b{font:600 13px Arial;white-space:nowrap;display:block}.time small{font-size:9px;display:block;margin-top:1mm;color:#6b8093}.activity{font-size:14px;line-height:1.65;font-weight:600}.place{font-size:11px;line-height:1.7;color:#5f7285}.notice{border-right:3px solid #c7aa68;background:#fff6e4;padding:2.5mm 3mm;font-size:10px;line-height:1.8;color:#705931;margin-top:2mm}.bottom{position:absolute;bottom:10mm;right:13mm;left:13mm;border-top:1px solid #c5d7e4;padding-top:4mm;display:flex;justify-content:space-between;align-items:center;font-size:10px;line-height:1.8;color:#567086}.bottom strong{display:block;color:#163d5f;font-size:12px}.bottom a{color:#0079a8;text-decoration:none}.contact{text-align:left}.contact a{font:600 13px Arial}.partner-line{font-size:9px;color:#687f91}
</style></head><body><div class="page"><div class="hero"><div class="brands"><div class="college"><img src="${college}"><div><b>كلية مكة الأهلية</b><small>Makkah National College</small></div></div><div class="kaizen"><a href="https://kaizenksa.com"><img src="${kaizen}" alt="KAIZEN GROUP"></a><small>الشريك الاستراتيجي · كايزن قروب</small></div></div><h1>أجندة الفعالية</h1><p>اليوم العالمي للسياحة 2026</p><div class="date"><b>${event.date}</b><span>${event.time}</span></div></div><div class="body"><div class="columns"><span>الوقت</span><span>الفقرة / النشاط</span><span>المكان</span></div>${section("01", "الاستقبال والجولة الرسمية", "", welcome)}${section("02", "ورش العمل", "ورش متزامنة · اختر ورشة واحدة", workshopRows)}${section("03", "الجلسة الحوارية والتكريم", "", sessions)}<div class="notice">جميع الأوقات بتوقيت مكة المكرمة. الجولة الرسمية تبدأ 11:30 صباحًا، والورش الثلاث تبدأ 12:00 ظهرًا.</div></div><footer class="bottom"><div><strong>قسم السياحة والضيافة · كلية مكة الأهلية</strong><a href="${event.maps}">موقع الفعالية: كلية مكة الأهلية · افتح الاتجاهات ↗</a><div class="partner-line">كايزن قروب · للخدمات التسويقية وتنظيم المعارض والمؤتمرات</div></div><div class="contact"><a href="https://daeloffice.com">daeloffice.com ↗</a><div>اكتشف الفعالية وسجّل حضورك</div></div></footer></div></body></html>`;
await mkdir("tmp/verification", { recursive: true });
await writeFile("tmp/verification/approved-agenda.html", html);
const browser = await chromium.launch({ channel: "chrome", headless: true });
try {
  const page = await browser.newPage();
  await page.setContent(html);
  await page.addStyleTag({
    content:
      ".hero{padding:8mm 13mm 5mm}.brands{margin-bottom:5mm}.row{min-height:15mm;padding:2.4mm 3mm}",
  });
  await page.evaluate(() => document.fonts.ready);
  const gap = await page.evaluate(
    () =>
      document.querySelector(".bottom").getBoundingClientRect().top -
      document.querySelector(".body").getBoundingClientRect().bottom,
  );
  if (gap < 12) throw new Error("Agenda content overlaps the footer: " + gap);
  await page.pdf({
    path: "public/agenda.pdf",
    format: "A4",
    preferCSSPageSize: true,
    printBackground: true,
    tagged: true,
    outline: true,
  });
  console.log("Created public/agenda.pdf. Footer clearance:", Math.round(gap));
} finally {
  await browser.close();
}
