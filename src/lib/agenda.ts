// Source: user-provided «الاجندة مع اوقاتها.docx».
// The source's time columns are visually reversed; ranges follow the chronological 09:00–15:00 sequence.
export interface AgendaItem {
  start: string;
  end: string;
  title: string;
  category:
    "welcome" | "session" | "experience" | "tour" | "workshop" | "closing";
  location?: string;
  speaker?: string;
  note?: string;
}
export const agenda: AgendaItem[] = [
  {
    start: "09:00",
    end: "09:30",
    title: "استقبال الضيوف والتسجيل",
    category: "welcome",
    note: "تقديم القهوة السعودية وبدء استقبال الزوار في الأركان.",
  },
  {
    start: "09:30",
    end: "09:40",
    title: "الافتتاح الرسمي",
    category: "welcome",
    note: "الترحيب بضيوف الفعالية.",
  },
  {
    start: "09:40",
    end: "10:00",
    title: "كلمة كلية مكة الأهلية",
    category: "welcome",
    note: "التعريف برسالة الفعالية وأهدافها.",
  },
  {
    start: "10:00",
    end: "10:30",
    title: "الجولة الرسمية",
    category: "tour",
    note: "جولة العميد وضيوف الجهات على مسارات وأركان الفعالية.",
    location: "المعرض والأركان · دور M",
  },
  {
    start: "10:30",
    end: "11:15",
    title: "مستقبل السياحة بين الإنسان والتقنية والتجربة",
    category: "session",
    location: "المسرح · الدور الثاني",
  },
  {
    start: "11:15",
    end: "11:45",
    title: "عرض وتجربة في السياحة والضيافة الذكية",
    category: "experience",
    location: "دور M",
  },
  {
    start: "11:45",
    end: "12:15",
    title: "تجربة القهوة السعودية للمناطق الأربع",
    category: "experience",
    speaker: "سارة الشهري",
  },
  {
    start: "12:15",
    end: "13:00",
    title: "أساسيات الظهور المهني",
    category: "workshop",
    location: "الدور الثاني",
    note: "ورشة عمل ضمن برنامج الفعالية.",
  },
  {
    start: "13:00",
    end: "13:30",
    title: "لقاء ملهم / مشاركة قطاعية",
    category: "session",
  },
  {
    start: "13:30",
    end: "14:10",
    title: "جولة مفتوحة وتجارب تفاعلية",
    category: "tour",
    note: "زيارة الأركان، والتواصل المهني، والتجارب التقنية التفاعلية، والمعرض الفني.",
    location: "المعرض والأركان · دور M",
  },
  {
    start: "14:10",
    end: "14:30",
    title: "تكريم شركاء النجاح",
    category: "closing",
    note: "تكريم الشركاء والجهات والمتحدثين والمشاركين.",
  },
  {
    start: "14:30",
    end: "15:00",
    title: "الصور الرسمية والتغطية الإعلامية",
    category: "closing",
    note: "استكمال زيارة المعرض والأركان.",
  },
];
export const workshops = [
  {
    id: "digital",
    number: "01",
    title: "أساسيات الظهور المهني",
    start: "12:15",
    end: "13:00",
    location: "الدور الثاني",
    pending: false,
  },
  {
    id: "kitchens",
    number: "02",
    title: "مطابخ حول العالم",
    start: "12:00",
    end: "13:00",
    location: "الدور الثاني",
    pending: false,
  },
  {
    id: "food-safety",
    number: "03",
    title: "سلامة الأغذية من الاستلام حتى التقديم الآمن",
    start: "12:00",
    end: "13:00",
    location: "الدور الثاني",
    pending: false,
  },
];
export const categoryLabels = {
  welcome: "الاستقبال والافتتاح",
  session: "لقاء ملهم",
  experience: "تجربة تفاعلية",
  tour: "جولة وتواصل",
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
