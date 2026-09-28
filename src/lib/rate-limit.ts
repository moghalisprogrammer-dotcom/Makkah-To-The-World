import { db, rows } from "./db";
import { digest } from "./security";
import { HttpError } from "./http";
// A shared SQL counter also works across multiple Node processes.
export async function rateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
) {
  const bucket = Math.floor(Date.now() / 1000 / windowSeconds);
  const hashed = digest(`${key}:${bucket}`);
  await db().execute(
    "INSERT INTO rate_limits (bucket_key,hits,expires_at) VALUES (?,1,DATE_ADD(UTC_TIMESTAMP(),INTERVAL ? SECOND)) ON DUPLICATE KEY UPDATE hits=hits+1",
    [hashed, windowSeconds * 2],
  );
  const [row] = await rows<{ hits: number }>(
    "SELECT hits FROM rate_limits WHERE bucket_key=?",
    [hashed],
  );
  if (row.hits > limit)
    throw new HttpError(
      429,
      "محاولات كثيرة. يرجى الانتظار قليلًا ثم المحاولة مجددًا.",
    );
}
export function clientKey(req: Request) {
  return process.env.TRUST_PROXY === "true"
    ? req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"
    : "shared";
}
