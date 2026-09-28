import { after, test } from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { db, rows, type Registration } from "../src/lib/db";
import { registrationSchema } from "../src/lib/validation";
import { register, publicStaffRecord } from "../src/lib/registrations";
import { workshopIds, workshopLabel, workshopTime } from "../src/lib/workshops";
import { migrateWorkshops } from "../scripts/migrations";

if (
  !["localhost", "127.0.0.1"].includes(
    new URL(process.env.DATABASE_URL!).hostname,
  )
)
  throw new Error("Workshop persistence tests require a local database.");

const prefix = `qa-workshops-${randomBytes(6).toString("hex")}`;
const fixture = (name: string) => ({
  full_name: "زائر تجربة الورش",
  email: `${prefix}-${name}@example.invalid`,
  phone: "0501234567",
  age_group: "26–35",
  consent: true,
});

after(async () => {
  await db().execute("DELETE FROM registrations WHERE email LIKE ?", [
    `${prefix}%`,
  ]);
  await db().end();
});

test("workshop schema accepts one known selection or no workshop and rejects invalid or multiple selections", () => {
  for (const workshop_id of [...workshopIds, null]) {
    const result = registrationSchema.parse({
      ...fixture("schema"),
      workshop_id,
    });
    assert.equal(result.workshop_id, workshop_id);
  }
  assert.equal(registrationSchema.parse(fixture("legacy")).workshop_id, null);
  for (const workshop_id of [
    "unknown",
    "",
    "digital,kitchens",
    ["digital"],
    ["digital", "kitchens"],
    {},
    true,
    1,
  ]) {
    assert.equal(
      registrationSchema.safeParse({ ...fixture("invalid"), workshop_id })
        .success,
      false,
    );
  }
});

test("each workshop persists as one SQL value and authenticated staff receives visitor details without the secure token", async () => {
  for (const workshop_id of [...workshopIds, null]) {
    const registration = await register({
      ...fixture(workshop_id ?? "none"),
      workshop_id,
    });
    const [stored] = await rows<Registration>(
      "SELECT * FROM registrations WHERE id=?",
      [registration.id],
    );
    assert.equal(stored.workshop_id, workshop_id);
    const staff = publicStaffRecord(registration);
    assert.equal(staff.workshop_id, workshop_id);
    assert.equal(staff.email, registration.email);
    assert.equal(staff.phone, registration.phone);
    assert.equal(staff.age_group, registration.age_group);
    assert.equal("secure_token" in staff, false);
    assert.ok(workshopLabel(stored.workshop_id));
  }
  assert.match(workshopTime("digital"), /12:15/);
  assert.match(workshopTime("kitchens"), /12:00/);
  assert.match(workshopTime("food-safety"), /12:00/);
  assert.equal(workshopTime(null), "");
});

test("the additive workshop migration is repeatable and preserves existing registrations", async () => {
  const original = await register(fixture("legacy"));
  const [before] = await rows<Registration>(
    "SELECT * FROM registrations WHERE id=?",
    [original.id],
  );
  assert.equal(before.workshop_id, null);
  await migrateWorkshops();
  await migrateWorkshops();
  const [afterMigration] = await rows<Registration>(
    "SELECT * FROM registrations WHERE id=?",
    [original.id],
  );
  assert.deepEqual(afterMigration, before);
});
