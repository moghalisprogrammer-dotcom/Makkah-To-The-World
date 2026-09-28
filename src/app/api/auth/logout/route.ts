import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { SESSION_COOKIE } from "@/lib/auth";
import { digest } from "@/lib/security";
import { body, failure, json } from "@/lib/http";
import { basePath } from "@/lib/base-path";
export async function POST(request: Request) {
  try {
    await body(request);
    const jar = await cookies();
    const token = jar.get(SESSION_COOKIE)?.value;
    if (token)
      await db().execute("DELETE FROM sessions WHERE token_hash=?", [
        digest(token),
      ]);
    jar.set(SESSION_COOKIE, "", { path: basePath || "/", maxAge: 0 });
    return json({ ok: true });
  } catch (error) {
    return failure(error);
  }
}
