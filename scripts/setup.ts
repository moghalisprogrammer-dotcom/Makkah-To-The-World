import { readFile } from "node:fs/promises";
import { db } from "../src/lib/db";
import { hashPassword } from "../src/lib/security";
import { migrateWorkshops } from "./migrations";
async function main() {
  const production = process.argv.includes("--production");
  const passwords = [
    process.env.ADMIN_PASSWORD,
    ...[1, 2, 3, 4].map((n) => process.env[`STAFF_${n}_PASSWORD`]),
  ];
  if (passwords.some((p) => !p || p.length < 16 || p.includes("REPLACE_")))
    throw new Error(
      "Set five unique passwords of at least 16 characters in .env.local",
    );
  if (new Set(passwords).size !== 5)
    throw new Error("Every account needs its own password");
  if (production) {
    const appUrl = new URL(process.env.APP_URL || "http://localhost:3000");
    if (
      appUrl.protocol !== "https:" ||
      process.env.EMAIL_PROVIDER !== "resend" ||
      !process.env.RESEND_API_KEY ||
      !process.env.EMAIL_FROM ||
      process.env.TRUST_PROXY !== "true"
    ) {
      throw new Error(
        "Production setup requires HTTPS APP_URL, Resend credentials/from address, and TRUST_PROXY=true.",
      );
    }
  }
  const capacity = Number(process.env.EVENT_CAPACITY || 800);
  if (!Number.isInteger(capacity) || capacity < 1)
    throw new Error("Invalid EVENT_CAPACITY");
  const schema = await readFile(
    new URL("./schema.sql", import.meta.url),
    "utf8",
  );
  for (const statement of schema
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean))
    await db().query(statement);
  await migrateWorkshops();
  await db().execute(
    "INSERT INTO event_settings (id,capacity) VALUES (1,?) ON DUPLICATE KEY UPDATE capacity=VALUES(capacity)",
    [capacity],
  );
  for (let i = 0; i < 5; i++) {
    const username = i === 0 ? "admin" : `staff${i}`;
    const hash = await hashPassword(passwords[i]!);
    // Existing accounts retain passwords; reset only with the explicit --reset-passwords option.
    const reset = process.argv.includes("--reset-passwords");
    await db().execute(
      `INSERT INTO users (username,password_hash,role,display_name,gate) VALUES (?,?,?,?,?) ON DUPLICATE KEY UPDATE ${reset ? "password_hash=VALUES(password_hash)" : "username=VALUES(username)"}`,
      [
        username,
        hash,
        i === 0 ? "ADMIN" : "STAFF",
        i === 0 ? "مدير الفعالية" : `موظف البوابة ${i}`,
        i || null,
      ],
    );
  }
  await db().execute("DELETE FROM sessions WHERE expires_at<UTC_TIMESTAMP()");
  if (process.argv.includes("--reset-passwords"))
    await db().execute("DELETE FROM sessions");
  await db().execute(
    "DELETE FROM rate_limits WHERE expires_at<UTC_TIMESTAMP()",
  );
  console.log(
    "Database ready. Accounts: admin, staff1, staff2, staff3, staff4.",
  );
}
main().finally(() => db().end());
