import { db } from "@/lib/db";
import { json } from "@/lib/http";

export const runtime = "nodejs";

export async function GET() {
  try {
    await db().query("SELECT 1");
    return json({ status: "ok" });
  } catch {
    return json({ status: "unavailable" }, 503);
  }
}
