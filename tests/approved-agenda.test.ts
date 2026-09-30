import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { agenda, workshops } from "../src/lib/agenda";
import { translate } from "../src/lib/locale";
import { ticketEmail } from "../src/lib/ticket-email";
import type { Registration } from "../src/lib/db";
import {
  generateAccountPasswords,
  replaceAccountPasswords,
  validAccountPasswords,
} from "../scripts/account-passwords";
import { hashPassword, verifyPassword } from "../src/lib/security";

test("approved schedule preserves the overlap and start-only official tour", () => {
  assert.equal(agenda.length, 8);
  assert.deepEqual(
    agenda.filter((x) => x.category === "session").map((x) => [x.start, x.end]),
    [["11:15", "13:15"]],
  );
  assert.equal(agenda.find((x) => x.category === "tour")?.start, "11:30");
  assert.equal(agenda.find((x) => x.category === "tour")?.end, undefined);
  assert.deepEqual(
    agenda.at(-1) && [agenda.at(-1)!.start, agenda.at(-1)!.end],
    ["13:15", "13:30"],
  );
  for (const w of workshops)
    assert.deepEqual([w.start, w.end], ["13:00", "14:00"]);
  assert.deepEqual(
    agenda.find((x) => x.category === "session")!.participants!.map((p) => p.name),
    ["الأستاذ صهيب محمد نور تركستاني", "الأستاذ سمير عبدالله قمصاني", "الأستاذ سامي محمد خياري", "المهندس طارق حمزة شلبي"],
  );
  const people = agenda.find((x) => x.category === "session")!.participants!;
  assert.deepEqual(people.map((p) => p.role), ["محاور الجلسة", "متحدث", "متحدث", "متحدث"]);
  for (const person of people) {
    assert.ok(person.expertise);
    for (const value of [person.name, person.role, person.expertise!])
      assert.notEqual(translate(value, "en"), value);
  }
  assert.deepEqual(
    workshops.map((w) => [w.id, w.location]),
    [
      ["digital", "قاعة 203"],
      ["kitchens", "قاعة 201"],
      ["food-safety", "قاعة 202"],
    ],
  );
  for (const item of agenda) {
    assert.notEqual(translate(item.title, "en"), item.title);
    assert.notEqual(translate(item.location!, "en"), item.location);
  }
});
test("email and both calendars use the new times and rooms without inventing a tour end", async () => {
  for (const locale of ["ar", "en"] as const) {
    const message = ticketEmail(
      {
        locale,
        full_name: "Preview",
        email: "preview@example.invalid",
        phone: "0500000000",
        company: "",
        job_title: "",
        age_group: "26–35",
        workshop_id: "digital",
        registration_number: "EVT-PREVIEW",
        secure_token: "a".repeat(64),
        status: "REGISTERED",
      } as Registration,
      "https://daeloffice.com",
    );
    assert.match(message.text, /203/);
    assert.match(message.text, /2:00/);
    assert.doesNotMatch(message.text, /12:15|3:00|undefined|NaN/);
    assert.doesNotMatch(message.html, /undefined|NaN/);
    const ics = await readFile(
      new URL(
        locale === "ar" ? "../public/event.ics" : "../public/event-en.ics",
        import.meta.url,
      ),
      "utf8",
    );
    assert.match(ics, /DTEND:20261001T110000Z/);
  }
});
test("shorter team passwords are unique, hash correctly, and replace only account settings", async () => {
  const values = generateAccountPasswords();
  assert.equal(new Set(values).size, 5);
  assert.ok(validAccountPasswords(values));
  for (const value of values) {
    assert.match(value, /^[abcdefghjkmnpqrstuvwxyz23456789]{12}$/);
    const hash = await hashPassword(value);
    assert.equal(await verifyPassword(value, hash), true);
    assert.equal(await verifyPassword("wrong-password", hash), false);
  }
  assert.equal(validAccountPasswords(Array(5).fill(values[0])), false);
  assert.equal(validAccountPasswords([...values.slice(0, 4), "short"]), false);
  const result = replaceAccountPasswords(
    "DATABASE_URL=mysql://unchanged\nexport ADMIN_PASSWORD=old\nADMIN_PASSWORD=duplicate\nRESEND_API_KEY=unchanged\n",
    values,
  );
  assert.equal((result.match(/^ADMIN_PASSWORD=/gm) || []).length, 1);
  assert.match(result, /DATABASE_URL=mysql:\/\/unchanged/);
  assert.match(result, /RESEND_API_KEY=unchanged/);
  assert.doesNotMatch(result, /old|duplicate/);
});
