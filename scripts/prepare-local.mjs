import { randomBytes } from "node:crypto";
import { writeFile, access } from "node:fs/promises";
try {
  await access(".env.local");
  console.log(".env.local already exists; unchanged.");
} catch {
  const secret = () => randomBytes(24).toString("base64url");
  const dbPassword = secret();
  const passwords = Array.from({ length: 5 }, secret);
  await writeFile(
    ".env.local",
    `DATABASE_URL=mysql://makkah:${dbPassword}@127.0.0.1:3307/makkah_event\nMYSQL_ROOT_PASSWORD=${secret()}\nMYSQL_PASSWORD=${dbPassword}\nAPP_URL=http://localhost:3000\nEVENT_CAPACITY=800\nSESSION_HOURS=12\nTRUST_PROXY=false\nEMAIL_PROVIDER=smtp\nEMAIL_FROM="Makkah National College <test@localhost>"\nSMTP_HOST=127.0.0.1\nSMTP_PORT=1025\nSMTP_SECURE=false\nADMIN_PASSWORD=${passwords[0]}\n${passwords
      .slice(1)
      .map((p, i) => `STAFF_${i + 1}_PASSWORD=${p}`)
      .join("\n")}\n`,
  );
  await writeFile(
    "local-access.txt",
    `LOCAL DEVELOPMENT ACCOUNTS — keep private\nhttp://localhost:3000/login\n\n${passwords.map((p, i) => `${i ? "staff" + i : "admin"}: ${p}`).join("\n")}\n\nLocal email inbox: http://localhost:8026\n`,
  );
  console.log("Local configuration and private local-access.txt created.");
}
