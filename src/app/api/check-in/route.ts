import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { rows, type Registration } from "@/lib/db";
import { body, failure, HttpError, json } from "@/lib/http";
import {
  SELECT_REG,
  changeEntry,
  publicStaffRecord,
} from "@/lib/registrations";
import { rateLimit } from "@/lib/rate-limit";
export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const input = await body(request);
    await rateLimit(`scan:${user.id}`, 240, 60);
    if (input.action === "VERIFY") {
      const token = z
        .string()
        .regex(/^[a-f0-9]{64}$/, "رمز التذكرة غير صحيح.")
        .parse(input.token);
      const [r] = await rows<Registration>(
        `${SELECT_REG} WHERE r.secure_token=?`,
        [token],
      );
      if (!r) throw new HttpError(404, "التذكرة غير صالحة أو غير موجودة.");
      return json({ registration: publicStaffRecord(r) });
    }
    const data = z
      .object({
        id: z.number().int().positive(),
        action: z.enum(["CHECK_IN", "UNDO", "CANCEL"]),
      })
      .parse(input);
    const r = await changeEntry(data.id, user, data.action);
    return json({ registration: publicStaffRecord(r) });
  } catch (error) {
    return failure(error);
  }
}
export async function GET(request: Request) {
  try {
    const user = await requireUser();
    await rateLimit(`search:${user.id}`, 120, 60);
    const query = new URL(request.url).searchParams.get("q")?.trim() || "";
    if (query.length < 2 || query.length > 190)
      return json({ registrations: [] });
    const term = `%${query.replace(/[\\%_]/g, "\\$&")}%`;
    const found = await rows<Registration>(
      `${SELECT_REG} WHERE r.full_name LIKE ? OR r.email LIKE ? OR r.phone LIKE ? OR r.registration_number LIKE ? ORDER BY r.id DESC LIMIT 20`,
      [term, term, term, term],
    );
    return json({ registrations: found.map(publicStaffRecord) });
  } catch (error) {
    return failure(error);
  }
}
