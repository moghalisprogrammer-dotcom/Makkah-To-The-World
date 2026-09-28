export const event = {
  title: "الاحتفال بيوم السياحة العالمي 2026",
  fullTitle:
    "الاحتفال باليوم السياحة العالمي 2026 بالتزامن مع اليوم الدولي للقهوة السعودية",
  companion: "بالتزامن مع اليوم الدولي للقهوة السعودية",
  date: "الخميس، 1 أكتوبر 2026",
  time: "9:00 صباحًا – 3:00 مساءً",
  location: "كلية مكة الأهلية — بهو الكلية",
  organizer: "قسم السياحة والضيافة — كلية مكة الأهلية",
  email: "hospitality.dept@mnc.edu.sa",
  maps: "https://maps.app.goo.gl/GjQE9njK7atUjA9x6?g_st=ic",
  website: "https://www.mnc.edu.sa",
};
export const ageGroups = ["18–25", "26–35", "36–45", "46–55", "56+"] as const;
export const ageLabels = [
  "18 – 25 سنة",
  "26 – 35 سنة",
  "36 – 45 سنة",
  "46 – 55 سنة",
  "56 سنة فما فوق",
];
export const statusLabels: Record<string, string> = {
  REGISTERED: "بانتظار الحضور",
  CHECKED_IN: "تم الحضور",
  CANCELLED: "ملغي",
};
export function formatDate(value: string | Date | null) {
  return value
    ? new Intl.DateTimeFormat("ar-SA", {
        dateStyle: "short",
        timeStyle: "short",
        calendar: "gregory",
        numberingSystem: "latn",
        timeZone: "Asia/Riyadh",
      }).format(new Date(value))
    : "—";
}
