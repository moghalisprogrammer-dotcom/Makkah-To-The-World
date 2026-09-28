import { z } from "zod";
import { cookies } from "next/headers";
import { db, rows, type User } from "@/lib/db";
import { verifyPassword, newToken, digest } from "@/lib/security";
import { body, failure, HttpError, json } from "@/lib/http";
import { rateLimit, clientKey } from "@/lib/rate-limit";
import { SESSION_COOKIE } from "@/lib/auth";
export async function POST(request: Request) {
  try {
    const data = z
      .object({
        username: z.string().trim().toLowerCase().min(1).max(64),
        password: z.string().min(1).max(200),
      })
      .parse(await body(request));
    await rateLimit(`login-ip:${clientKey(request)}`, 60, 900);
    await rateLimit(`login-user:${data.username}`, 10, 900);
    const [user] = await rows<User & { password_hash: string }>(
      "SELECT * FROM users WHERE username=?",
      [data.username],
    );
    const dummy = "0123456789abcdef0123456789abcdef:" + "00".repeat(64);
    const valid = await verifyPassword(
      data.password,
      user?.password_hash || dummy,
    );
    if (!user || !valid)
      throw new HttpError(401, "اسم المستخدم أو كلمة المرور غير صحيحة.");
    const token = newToken();
    const hours = Number(process.env.SESSION_HOURS || 12);
    await db().execute(
      "INSERT INTO sessions (token_hash,user_id,expires_at) VALUES (?,?,DATE_ADD(UTC_TIMESTAMP(),INTERVAL ? HOUR))",
      [digest(token), user.id, hours],
    );
    (await cookies()).set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure:
        new URL(process.env.APP_URL || "http://localhost:3000").protocol ===
        "https:",
      sameSite: "strict",
      path: "/",
      maxAge: hours * 3600,
    });
    return json({ redirect: user.role === "ADMIN" ? "/admin" : "/check-in" });
  } catch (error) {
    return failure(error);
  }
}
