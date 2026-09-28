import { body, failure, json } from "@/lib/http";
import { rateLimit, clientKey } from "@/lib/rate-limit";
import { register } from "@/lib/registrations";
import { sendTicket } from "@/lib/email";
export async function POST(request: Request) {
  try {
    const data = await body(request);
    await rateLimit(
      `register:${clientKey(request)}`,
      100,
      600,
    );
    const r = await register(data);
    const emailSent = await sendTicket(r);
    return json(
      { token: r.secure_token, number: r.registration_number, emailSent },
      201,
    );
  } catch (error) {
    return failure(error);
  }
}
