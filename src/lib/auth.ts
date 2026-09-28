import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { rows, type User } from "./db";
import { digest } from "./security";
import { HttpError } from "./http";
import { appPath } from "./base-path";
export const SESSION_COOKIE = "makkah_session";
export async function currentUser(): Promise<User | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
  const result = await rows<User>(
    "SELECT u.id,u.username,u.display_name,u.role,u.gate FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>UTC_TIMESTAMP()",
    [digest(token)],
  );
  return result[0] ?? null;
}
export async function requireUser(admin = false) {
  const user = await currentUser();
  if (!user) throw new HttpError(401, "يرجى تسجيل الدخول أولًا.");
  if (admin && user.role !== "ADMIN")
    throw new HttpError(403, "لا تملك صلاحية الوصول.");
  return user;
}
export async function protectPage(admin = false) {
  const user = await currentUser();
  if (!user) redirect(appPath("/login"));
  if (admin && user.role !== "ADMIN") redirect(appPath("/check-in"));
  return user;
}
