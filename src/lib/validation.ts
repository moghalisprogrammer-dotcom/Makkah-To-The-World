import { z } from "zod";
import { ageGroups } from "./event";
import { workshopIds } from "./workshops";
export const registrationSchema = z.object({
  locale: z.enum(["ar", "en"]).default("ar"),
  full_name: z.string().trim().min(5, "يرجى كتابة الاسم الكامل.").max(150),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("يرجى إدخال بريد إلكتروني صحيح.")
    .max(190),
  phone: z
    .string()
    .trim()
    .transform((v) =>
      v
        .replace(/[٠-٩]/g, (digit) => String(digit.charCodeAt(0) - 0x0660))
        .replace(/[۰-۹]/g, (digit) => String(digit.charCodeAt(0) - 0x06f0))
        .replace(/\D/g, ""),
    )
    .pipe(
      z
        .string()
        .regex(
          /^05\d{8}$/,
          "يرجى إدخال رقم جوال سعودي من 10 أرقام يبدأ بـ 05.",
        ),
    ),
  company: z.string().trim().max(150).default(""),
  job_title: z.string().trim().max(100).default(""),
  age_group: z.enum(ageGroups, { error: "يرجى اختيار الفئة العمرية." }),
  workshop_id: z
    .enum(workshopIds, { error: "يرجى اختيار ورشة واحدة من الورش المتاحة." })
    .nullable()
    .default(null),
  consent: z.literal(true, {
    error: "يرجى الموافقة على استخدام البيانات لتنظيم الحضور.",
  }),
  website: z.string().max(0).optional(),
});
