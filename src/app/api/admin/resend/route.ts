import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { rows, type Registration } from "@/lib/db";
import { body, failure, HttpError, json } from "@/lib/http";
import { sendTicket } from "@/lib/email";
import { rateLimit } from "@/lib/rate-limit";
export async function POST(request: Request) {
  try {
    const user = await requireUser(true);
    const { id } = z
      .object({ id: z.number().int().positive() })
      .parse(await body(request));
    await rateLimit(`resend:${id}`, 3, 600);
    await rateLimit(`resend-admin:${user.id}`, 30, 60);
    const [r] = await rows<Registration>(
      "SELECT * FROM registrations WHERE id=?",
      [id],
    );
    if (!r) throw new HttpError(404, "التسجيل غير موجود.");
    if (r.status === "CANCELLED")
      throw new HttpError(409, "لا يمكن إرسال تذكرة ملغاة.");
    const sent = await sendTicket(r);
    if (!sent)
      throw new HttpError(
        502,
        "التسجيل محفوظ، لكن تعذر إرسال البريد. تحقق من إعدادات SMTP.",
      );
    return json({ ok: true });
  } catch (error) {
    return failure(error);
  }
}
