// Approved source: user-provided «أجندة فعالية اليوم العالمي للسياحة.pdf».
// The official tour has a start time only; do not invent an end time.
export interface AgendaItem {
  start: string;
  end?: string;
  title: string;
  category:
    "welcome" | "session" | "experience" | "tour" | "workshop" | "closing";
  location?: string;
  speaker?: string;
  speakerImage?: string;
  participants?: { name: string; role: string; image?: string }[];
  note?: string;
}
export const workshops = [
  {
    id: "digital",
    number: "01",
    title: "أساسيات الظهور المهني الرقمي",
    formUrl: "https://forms.gle/6tieMndiVakSni1o8",
    start: "12:00",
    end: "13:00",
    location: "قاعة 203",
    pending: false,
  },
  {
    id: "kitchens",
    number: "02",
    title: "مطابخ حول العالم",
    formUrl:
      "https://docs.google.com/forms/d/e/1FAIpQLScSl_3X2OnsCVkTo8nBeqqmUt2eI7PZ2xlUv70ZZCPWXDqRCg/viewform?pli=1",
    start: "12:00",
    end: "13:00",
    location: "قاعة 201",
    pending: false,
  },
  {
    id: "food-safety",
    number: "03",
    title: "سلامة الأغذية من الاستلام حتى التقديم الآمن",
    formUrl:
      "https://docs.google.com/forms/d/e/1FAIpQLSdEvIOFyUXG10_0Pq5o5QaiKWTdppr3U72uqIVy0gLF_j7XGQ/viewform",
    start: "12:00",
    end: "13:00",
    location: "قاعة 202",
    pending: false,
  },
];
export const agenda: AgendaItem[] = [
  {
    start: "09:00",
    end: "09:30",
    title: "استقبال الضيوف والتسجيل",
    category: "welcome",
    location: "بهو الكلية",
  },
  {
    start: "09:30",
    end: "10:00",
    title: "الافتتاح",
    category: "welcome",
    location: "بهو الكلية",
  },
  {
    start: "11:15",
    end: "13:15",
    title: "السياحة بين الماضي والحاضر ورؤيتنا المستقبلية",
    category: "session",
    speaker: "مدير الحوار: صهيب تركستاني",
    participants: [
      { name: "صهيب تركستاني", role: "مدير الحوار" },
      { name: "سمير قمصاني", role: "المتحاور الأول" },
      { name: "سامي محمد احمد خياري", role: "المتحاور الثاني" },
      { name: "طارق الشلبي", role: "المتحاور الثالث" },
    ],
    location: "مسرح الكلية · الدور 2",
  },
  {
    start: "11:30",
    title: "بدء الجولة الرسمية للعميد",
    category: "tour",
    location: "بهو الكلية · الورش · الجلسة الحوارية",
  },
  ...[workshops[0], workshops[2], workshops[1]].map((workshop): AgendaItem => ({
    start: workshop.start,
    end: workshop.end,
    title: workshop.title,
    category: "workshop",
    location: workshop.location,
  })),
  {
    start: "13:15",
    end: "13:30",
    title: "تكريم الشركاء والجهات والمتحدثين والمشاركين",
    category: "closing",
    location: "مسرح الكلية · الدور 2",
  },
];
export const categoryLabels = {
  welcome: "الاستقبال والافتتاح",
  session: "جلسة حوارية",
  experience: "تجربة تفاعلية",
  tour: "الجولة الرسمية",
  workshop: "ورشة عمل",
  closing: "التكريم والختام",
};
export function arabicTime(value: string) {
  const [h, m] = value.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")}`;
}
export function period(value: string) {
  const h = Number(value.split(":")[0]);
  return h < 12 ? "صباحًا" : h === 12 ? "ظهرًا" : "مساءً";
}
export function duration(start: string, end: string) {
  const minutes = (time: string) => {
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m;
  };
  return new Intl.NumberFormat("en-US").format(minutes(end) - minutes(start));
}
