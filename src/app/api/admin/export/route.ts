import { requireUser } from "@/lib/auth";
import { rows, type Registration } from "@/lib/db";
import { failure } from "@/lib/http";
import { SELECT_REG } from "@/lib/registrations";
import { workshopLabel, workshopTime } from "@/lib/workshops";
const cell = (value: unknown) => {
  let text = value instanceof Date ? value.toISOString() : String(value ?? "");
  if (/^[=+@\-\t\r\n]/.test(text.trimStart())) text = "'" + text;
  return '"' + text.replace(/"/g, '""') + '"';
};
export async function GET() {
  try {
    await requireUser(true);
    const records = await rows<Registration>(`${SELECT_REG} ORDER BY r.id`);
    const keys = [
      "full_name",
      "email",
      "phone",
      "company",
      "job_title",
      "age_group",
      "workshop_id",
      "registration_number",
      "created_at",
      "status",
      "checked_in_at",
      "staff_name",
    ] as const;
    const content =
      "\uFEFF" +
      [
        [
          "الاسم",
          "البريد",
          "الجوال",
          "الجهة",
          "المسمى الوظيفي",
          "الفئة العمرية",
          "الورشة المختارة",
          "رقم التسجيل",
          "تاريخ التسجيل",
          "الحالة",
          "وقت الدخول",
          "الموظف",
        ]
          .map(cell)
          .join(","),
        ...records.map((r) =>
          keys
            .map((k) =>
              cell(
                k === "workshop_id"
                  ? [workshopLabel(r.workshop_id), workshopTime(r.workshop_id)]
                      .filter(Boolean)
                      .join(" · ")
                  : r[k],
              ),
            )
            .join(","),
        ),
      ].join("\r\n");
    return new Response(content, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="makkah-attendance.csv"',
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return failure(error);
  }
}
