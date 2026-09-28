import { db } from "../src/lib/db";
try {
  await db().execute("DELETE FROM sessions WHERE expires_at<UTC_TIMESTAMP()");
  await db().execute(
    "DELETE FROM rate_limits WHERE expires_at<UTC_TIMESTAMP()",
  );
  console.log("Expired sessions and rate-limit counters removed.");
} finally {
  await db().end();
}
