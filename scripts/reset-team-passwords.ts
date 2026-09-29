import {
  mkdir,
  readFile,
  realpath,
  rename,
  writeFile,
  chmod,
} from "node:fs/promises";
import { join } from "node:path";
import { parseEnv } from "node:util";
import type { RowDataPacket } from "mysql2/promise";
import { db } from "../src/lib/db";
import { hashPassword } from "../src/lib/security";
import {
  accountNames,
  generateAccountPasswords,
  replaceAccountPasswords,
} from "./account-passwords";

async function main() {
  if (!process.argv.includes("--apply"))
    throw new Error(
      "Add --apply to reset the five team accounts and sign them out.",
    );
  const base = "/opt/makkah-event";
  const current = await realpath(join(base, "dael-current"));
  if ((await realpath(process.cwd())) !== current)
    throw new Error("Run this command from /opt/makkah-event/dael-current.");
  const paths = [
    ...new Set(
      await Promise.all(
        [
          join(base, "app/.env.production.local"),
          join(current, ".env.production.local"),
        ].map((p) => realpath(p)),
      ),
    ),
  ];
  const originals = await Promise.all(
    paths.map(async (p) => ({ path: p, text: await readFile(p, "utf8") })),
  );
  for (const file of originals) {
    if (parseEnv(file.text).DATABASE_URL !== process.env.DATABASE_URL)
      throw new Error(
        "Environment files refer to different databases. No passwords were changed.",
      );
  }
  const values = generateAccountPasswords();
  const hashes = await Promise.all(values.map(hashPassword));
  const stamp = new Date().toISOString().replace(/[^0-9]/g, "");
  const backup = join(base, "backups", `team-passwords-${stamp}`);
  await mkdir(backup, { recursive: true, mode: 0o700 });
  const staged: string[] = [];
  const connection = await db().getConnection();
  let committed = false;
  try {
    await connection.beginTransaction();
    const [users] = await connection.execute<RowDataPacket[]>(
      "SELECT id,username,role FROM users WHERE username IN (?,?,?,?,?) FOR UPDATE",
      accountNames,
    );
    if (
      users.length !== 5 ||
      users.some((u) => u.role !== (u.username === "admin" ? "ADMIN" : "STAFF"))
    )
      throw new Error(
        "The expected admin and four staff accounts were not found. No passwords were changed.",
      );
    for (let i = 0; i < accountNames.length; i++)
      await connection.execute(
        "UPDATE users SET password_hash=? WHERE username=?",
        [hashes[i], accountNames[i]],
      );
    await connection.execute(
      "DELETE FROM sessions WHERE user_id IN (?,?,?,?,?)",
      users.map((u) => u.id),
    );
    for (let i = 0; i < originals.length; i++) {
      const file = originals[i];
      await writeFile(join(backup, `environment-${i}.backup`), file.text, {
        mode: 0o600,
      });
      const temp = file.path + `.reset-${stamp}`;
      await writeFile(temp, replaceAccountPasswords(file.text, values), {
        mode: 0o600,
      });
      await rename(temp, file.path);
      staged.push(file.path);
      await chmod(file.path, 0o600);
    }
    await connection.commit();
    committed = true;
    console.log(
      "\nTeam passwords updated. Previous sessions signed out. Visitor records are unchanged.\n",
    );
    console.table(
      accountNames.map((username, i) => ({ username, password: values[i] })),
    );
    console.log("Login: https://daeloffice.com/login");
    console.log("Store these credentials privately. Backup:", backup);
  } catch (error) {
    if (!committed) {
      await connection.rollback();
      for (const file of originals.filter((f) => staged.includes(f.path))) {
        await writeFile(file.path, file.text, { mode: 0o600 });
        await chmod(file.path, 0o600);
      }
    }
    throw error;
  } finally {
    connection.release();
  }
}
main()
  .catch((error) => {
    console.error(
      error instanceof Error ? error.message : "Password reset failed.",
    );
    process.exitCode = 1;
  })
  .finally(() => db().end());
