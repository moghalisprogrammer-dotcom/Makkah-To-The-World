import { arabicTime, period, workshops } from "./agenda";
import { translate, type Locale } from "./locale";

export const workshopIds = ["digital", "kitchens", "food-safety"] as const;
export type WorkshopId = (typeof workshopIds)[number];

export function selectedWorkshop(id: WorkshopId | null | undefined) {
  return workshops.find((workshop) => workshop.id === id) ?? null;
}

export function workshopLabel(
  id: WorkshopId | null | undefined,
  locale: Locale = "ar",
) {
  return translate(
    selectedWorkshop(id)?.title ?? "حضور الفعالية دون ورشة",
    locale,
  );
}

export function workshopTime(
  id: WorkshopId | null | undefined,
  locale: Locale = "ar",
) {
  const workshop = selectedWorkshop(id);
  return workshop
    ? `${arabicTime(workshop.start)} – ${arabicTime(workshop.end)} ${translate(period(workshop.end), locale)}`
    : "";
}
