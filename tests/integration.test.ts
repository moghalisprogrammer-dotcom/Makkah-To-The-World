import { test, after } from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { db, rows, type Registration } from "../src/lib/db";
import { register } from "../src/lib/registrations";
import { sendTicket } from "../src/lib/email";
import { ticketEmail } from "../src/lib/ticket-email";
import { agenda, workshops } from "../src/lib/agenda";
import { event } from "../src/lib/event";
import { translate } from "../src/lib/locale";
import { rateLimit } from "../src/lib/rate-limit";
import { hashPassword, verifyPassword } from "../src/lib/security";

const base = process.env.APP_URL || "";
if (
  !["localhost", "127.0.0.1"].includes(new URL(base).hostname) ||
  !["localhost", "127.0.0.1"].includes(
    new URL(process.env.DATABASE_URL!).hostname,
  ) ||
  !["localhost", "127.0.0.1"].includes(process.env.SMTP_HOST || "") ||
  Number(process.env.SMTP_PORT) !== 1025
)
  throw new Error(
    "Integration tests are restricted to a local test environment.",
  );
const run = randomBytes(6).toString("hex");
const prefix = `qa-${run}`;
const fixture = (suffix: string) => ({
  full_name: "زائر اختبار " + suffix,
  email: `${prefix}-${suffix}@example.invalid`,
  phone: "0501234567",
  company: "جهة اختبار",
  job_title: "مختبر",
  age_group: "26–35",
  consent: true,
});
async function call(
  path: string,
  data?: unknown,
  cookie?: string,
  origin = base,
) {
  return fetch(base + path, {
    method: data === undefined ? "GET" : "POST",
    headers: {
      ...(data === undefined
        ? {}
        : { "Content-Type": "application/json", Origin: origin }),
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: data === undefined ? undefined : JSON.stringify(data),
    redirect: "manual",
  });
}
async function login(username: string, password: string) {
  const response = await call("/api/auth/login", { username, password });
  assert.equal(response.status, 200, await response.text());
  return response.headers.get("set-cookie")!.split(";")[0];
}
const sessions: string[] = [];
after(async () => {
  for (const cookie of sessions) await call("/api/auth/logout", {}, cookie);
  const records = await rows<{ id: number }>(
    "SELECT id FROM registrations WHERE email LIKE ?",
    [`${prefix}%`],
  );
  for (const r of records) {
    await db().execute("DELETE FROM email_logs WHERE registration_id=?", [
      r.id,
    ]);
    await db().execute("DELETE FROM check_in_logs WHERE registration_id=?", [
      r.id,
    ]);
    await db().execute("DELETE FROM registrations WHERE id=?", [r.id]);
  }
  await db().end();
});
test("End-to-end registration, authorization, email and gate concurrency", async (t) => {
  let token = "";
  let id = 0;
  let number = "";
  let staff = "";
  let staff2 = "";
  let admin = "";
  await t.test(
    "passwords use salted scrypt and constant-time verification",
    async () => {
      const a = await hashPassword("a-test-password-123");
      const b = await hashPassword("a-test-password-123");
      assert.notEqual(a, b);
      assert.equal(await verifyPassword("a-test-password-123", a), true);
      assert.equal(await verifyPassword("wrong", a), false);
    },
  );
  await t.test(
    "private routes and APIs reject unauthenticated visitors",
    async () => {
      for (const path of [
        "/api/admin",
        "/api/check-in?q=test",
        "/api/admin/export",
      ])
        assert.equal((await call(path)).status, 401);
      const page = await call("/admin");
      assert.equal(page.status, 307);
      assert.equal(page.headers.get("location"), "/login");
    },
  );
  await t.test(
    "registration rejects cross-origin, bad data, and oversized requests",
    async () => {
      assert.equal(
        (
          await call(
            "/api/register",
            fixture("cross"),
            undefined,
            "https://attacker.invalid",
          )
        ).status,
        403,
      );
      assert.equal(
        (await call("/api/register", { ...fixture("bad"), email: "invalid" }))
          .status,
        400,
      );
      assert.equal(
        (await call("/api/register", { full_name: "x".repeat(9000) })).status,
        413,
      );
      assert.equal(
        (
          await call("/api/register", {
            ...fixture("long-phone"),
            phone: "05012345678",
          })
        ).status,
        400,
      );
      for (const workshop_id of ["unknown", ["digital", "kitchens"]]) {
        assert.equal(
          (
            await call("/api/register", {
              ...fixture("invalid-workshop"),
              workshop_id,
            })
          ).status,
          400,
        );
      }
    },
  );
  await t.test(
    "real registration persists and delivers a QR email to local SMTP",
    async () => {
      const response = await call("/api/register", {
        ...fixture("main"),
        workshop_id: "digital",
      });
      const data = await response.json();
      assert.equal(response.status, 201, JSON.stringify(data));
      assert.equal(data.emailSent, true);
      assert.match(data.token, /^[a-f0-9]{64}$/);
      assert.match(data.number, /^EVT-\d+$/);
      token = data.token;
      number = data.number;
      const [r] = await rows<Registration>(
        "SELECT * FROM registrations WHERE secure_token=?",
        [token],
      );
      id = r.id;
      assert.equal(r.locale, "ar");
      assert.equal(r.status, "REGISTERED");
      assert.equal(r.workshop_id, "digital");
      const logs = await rows<{ status: string }>(
        "SELECT status FROM email_logs WHERE registration_id=?",
        [id],
      );
      assert.equal(logs[0].status, "SENT");
      const inbox = await fetch(
        "http://localhost:8026/api/v1/search?query=" +
          encodeURIComponent(`to:${fixture("main").email}`),
      ).then((r) => r.json());
      assert.ok(inbox.messages.length > 0, "Email must exist in Mailpit");
    },
  );
  await t.test("Resend API delivery includes ticket, event and inline logos", async () => {
    const [registration] = await rows<Registration>(
      "SELECT * FROM registrations WHERE id=?",
      [id],
    );
    const originalFetch = globalThis.fetch;
    const prior = {
      provider: process.env.EMAIL_PROVIDER,
      key: process.env.RESEND_API_KEY,
      from: process.env.EMAIL_FROM,
    };
    let requestUrl = "";
    let requestInit: RequestInit | undefined;
    try {
      process.env.EMAIL_PROVIDER = "resend";
      process.env.RESEND_API_KEY = "re_test_key";
      process.env.EMAIL_FROM = "Test Events <events@example.invalid>";
      globalThis.fetch = async (input, init) => {
        requestUrl = String(input);
        requestInit = init;
        return new Response(JSON.stringify({ id: "email-test" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      };
      assert.equal(await sendTicket(registration), true);
      assert.equal(requestUrl, "https://api.resend.com/emails");
      assert.equal(
        new Headers(requestInit?.headers).get("authorization"),
        "Bearer re_test_key",
      );
      const payload = JSON.parse(String(requestInit?.body));
      assert.deepEqual(payload.to, [registration.email]);
      assert.ok(payload.html.includes("cid:ticket-qr"));
      assert.ok(
        payload.attachments.some(
          (file: { filename: string; content_id?: string }) =>
            file.filename === "ticket-qr.png" && file.content_id === "ticket-qr",
        ),
      );
      assert.ok(
        payload.attachments.some(
          (file: { filename: string }) => file.filename === "event.ics",
        ),
      );
    } finally {
      globalThis.fetch = originalFetch;
      if (prior.provider === undefined) delete process.env.EMAIL_PROVIDER;
      else process.env.EMAIL_PROVIDER = prior.provider;
      if (prior.key === undefined) delete process.env.RESEND_API_KEY;
      else process.env.RESEND_API_KEY = prior.key;
      if (prior.from === undefined) delete process.env.EMAIL_FROM;
      else process.env.EMAIL_FROM = prior.from;
    }
  });
  await t.test(
    "English preference persists and complete bilingual emails escape visitor data",
    async () => {
      const response = await call("/api/register", {
        ...fixture("english"),
        full_name: "Alex & Jordan <visitor>",
        locale: "en",
        workshop_id: "kitchens",
      });
      const data = await response.json();
      assert.equal(response.status, 201, JSON.stringify(data));
      assert.equal(data.emailSent, true);
      const [registration] = await rows<Registration>(
        "SELECT * FROM registrations WHERE secure_token=?",
        [data.token],
      );
      assert.equal(registration.locale, "en");
      const inbox = await fetch(
        "http://localhost:8026/api/v1/search?query=" +
          encodeURIComponent(`to:${registration.email}`),
      ).then((r) => r.json());
      const received = await fetch(
        `http://localhost:8026/api/v1/message/${inbox.messages[0].ID}`,
      ).then((r) => r.json());
      assert.match(received.Subject, /Your ticket/);
      assert.match(received.HTML, /Your complete event programme/);
      assert.ok(
        received.Inline.some(
          (a: { FileName: string }) => a.FileName === "ticket-qr.png",
        ),
      );
      assert.ok(
        received.Attachments.some(
          (a: { FileName: string }) => a.FileName === "event.ics",
        ),
      );
      for (const locale of ["ar", "en"] as const) {
        const message = ticketEmail({ ...registration, locale }, base);
        assert.ok(message.html.includes(`lang="${locale}"`));
        assert.ok(message.html.includes(`?lang=${locale}`));
        for (const value of [
          registration.email,
          registration.phone,
          registration.company!,
          registration.job_title!,
          event.maps,
          event.website,
        ])
          assert.ok(message.html.includes(value), value);
        assert.ok(message.html.includes("Alex &amp; Jordan &lt;visitor&gt;"));
        assert.ok(!message.html.includes("<visitor>"));
        for (const item of [...agenda, ...workshops])
          assert.ok(
            message.text.includes(translate(item.title, locale)),
            item.title,
          );
      }
    },
  );
  await t.test(
    "email uniqueness is case-insensitive and survives simultaneous requests",
    async () => {
      assert.equal(
        (
          await call("/api/register", {
            ...fixture("main"),
            email: fixture("main").email.toUpperCase(),
          })
        ).status,
        409,
      );
      const responses = await Promise.all([
        call("/api/register", fixture("race")),
        call("/api/register", fixture("race")),
      ]);
      assert.deepEqual(responses.map((r) => r.status).sort(), [201, 409]);
    },
  );
  await t.test(
    "ticket exposes only admission data and generated QR",
    async () => {
      const response = await call(`/api/ticket/${token}`);
      const ticket = await response.json();
      assert.equal(response.headers.get("cache-control"), "no-store");
      assert.equal(ticket.registration_number, number);
      assert.equal(ticket.workshop_id, "digital");
      assert.ok(ticket.qr.startsWith("data:image/png;base64,"));
      assert.equal(ticket.email, undefined);
      assert.equal(ticket.phone, undefined);
      assert.equal((await call("/api/ticket/" + "a".repeat(64))).status, 404);
    },
  );
  await t.test(
    "staff and administrator can authenticate; staff cannot access admin APIs",
    async () => {
      staff = await login("staff1", process.env.STAFF_1_PASSWORD!);
      staff2 = await login("staff2", process.env.STAFF_2_PASSWORD!);
      admin = await login("admin", process.env.ADMIN_PASSWORD!);
      sessions.push(staff, staff2, admin);
      for (const path of ["/api/admin", "/api/admin/export"])
        assert.equal((await call(path, undefined, staff)).status, 403);
      assert.equal(
        (await call("/api/admin/resend", { id }, staff)).status,
        403,
      );
      assert.equal(
        (await call("/admin", undefined, staff)).headers.get("location"),
        "/check-in",
      );
    },
  );
  await t.test(
    "scan verifies without recording attendance; manual search works",
    async () => {
      const scan = await call(
        "/api/check-in",
        { action: "VERIFY", token },
        staff,
      );
      assert.equal(scan.status, 200);
      const data = await scan.json();
      assert.equal(data.registration.status, "REGISTERED");
      assert.equal(data.registration.email, fixture("main").email);
      assert.equal(data.registration.phone, fixture("main").phone);
      assert.equal(data.registration.job_title, fixture("main").job_title);
      assert.equal(data.registration.age_group, fixture("main").age_group);
      assert.equal(data.registration.secure_token, undefined);
      assert.equal(data.registration.workshop_id, "digital");
      const result = await call(
        "/api/check-in?q=" + encodeURIComponent(number),
        undefined,
        staff,
      ).then((r) => r.json());
      assert.equal(result.registrations[0].id, id);
      assert.equal(
        (
          await rows<Registration>(
            "SELECT status FROM registrations WHERE id=?",
            [id],
          )
        )[0].status,
        "REGISTERED",
      );
      assert.equal(
        (
          await call(
            "/api/check-in",
            { action: "VERIFY", token: "f".repeat(64) },
            staff,
          )
        ).status,
        404,
      );
    },
  );
  await t.test(
    "two gates cannot admit the same ticket concurrently",
    async () => {
      const responses = await Promise.all([
        call("/api/check-in", { id, action: "CHECK_IN" }, staff),
        call("/api/check-in", { id, action: "CHECK_IN" }, staff2),
      ]);
      assert.deepEqual(responses.map((r) => r.status).sort(), [200, 409]);
      const [r] = await rows<Registration>(
        "SELECT * FROM registrations WHERE id=?",
        [id],
      );
      assert.equal(r.status, "CHECKED_IN");
      assert.ok(r.checked_in_at);
      assert.ok(r.checked_in_by);
      const logs = await rows<{ total: number }>(
        "SELECT COUNT(*) AS total FROM check_in_logs WHERE registration_id=? AND action='CHECK_IN'",
        [id],
      );
      assert.equal(logs[0].total, 1);
      const scan = await call(
        "/api/check-in",
        { action: "VERIFY", token },
        staff,
      ).then((r) => r.json());
      assert.equal(scan.registration.status, "CHECKED_IN");
      assert.ok(scan.registration.staff_name);
    },
  );
  await t.test(
    "only administrator can undo, resend and cancel; cancelled ticket cannot enter",
    async () => {
      assert.equal(
        (await call("/api/check-in", { id, action: "UNDO" }, staff)).status,
        403,
      );
      assert.equal(
        (await call("/api/check-in", { id, action: "UNDO" }, admin)).status,
        200,
      );
      assert.equal(
        (await call("/api/admin/resend", { id }, admin)).status,
        200,
      );
      assert.equal(
        (await call("/api/check-in", { id, action: "CANCEL" }, admin)).status,
        200,
      );
      assert.equal(
        (await call("/api/check-in", { id, action: "CHECK_IN" }, staff)).status,
        409,
      );
      assert.equal(
        (await call("/api/admin/resend", { id }, admin)).status,
        409,
      );
    },
  );
  await t.test("capacity lock prevents concurrent overbooking", async () => {
    const [setting] = await rows<{ capacity: number }>(
      "SELECT capacity FROM event_settings WHERE id=1",
    );
    try {
      const [count] = await rows<{ total: number }>(
        "SELECT COUNT(*) AS total FROM registrations WHERE status<>'CANCELLED'",
      );
      await db().execute("UPDATE event_settings SET capacity=? WHERE id=1", [
        count.total + 1,
      ]);
      const responses = await Promise.all([
        call("/api/register", fixture("last1")),
        call("/api/register", fixture("last2")),
      ]);
      assert.deepEqual(responses.map((r) => r.status).sort(), [201, 409]);
    } finally {
      await db().execute("UPDATE event_settings SET capacity=? WHERE id=1", [
        setting.capacity,
      ]);
    }
  });
  await t.test(
    "SMTP failure retains registration, logs failure and allows resend",
    async () => {
      const r = await register(fixture("emailfail"));
      const host = process.env.SMTP_HOST;
      try {
        delete process.env.SMTP_HOST;
        assert.equal(await sendTicket(r), false);
      } finally {
        process.env.SMTP_HOST = host;
      }
      assert.equal(
        (
          await rows<Registration>("SELECT * FROM registrations WHERE id=?", [
            r.id,
          ])
        ).length,
        1,
      );
      const [log] = await rows<{ status: string }>(
        "SELECT status FROM email_logs WHERE registration_id=? ORDER BY id DESC",
        [r.id],
      );
      assert.equal(log.status, "FAILED");
      assert.equal(
        (await call("/api/admin/resend", { id: r.id }, admin)).status,
        200,
      );
    },
  );
  await t.test(
    "dashboard filters workshop and age data without secure tokens",
    async () => {
      const workshopRegistration = await register({
        ...fixture("filter-workshop"),
        workshop_id: "kitchens",
      });
      const response = await call("/api/admin?q=" + prefix, undefined, admin);
      const result = await response.json();
      assert.ok(result.registrations.length >= 4);
      assert.equal(result.gates.length, 4);
      assert.equal(result.capacity, 800);
      assert.equal(result.registrations[0].secure_token, undefined);
      assert.equal(
        result.registrations.find((r: Registration) => r.id === id).workshop_id,
        "digital",
      );
      const workshopResponse = await call(
        "/api/admin?workshop=kitchens",
        undefined,
        admin,
      );
      const workshopResult = await workshopResponse.json();
      assert.equal(workshopResponse.status, 200);
      assert.ok(
        workshopResult.registrations.some(
          (r: Registration) => r.id === workshopRegistration.id,
        ),
      );
      assert.ok(
        workshopResult.registrations.every(
          (r: Registration) => r.workshop_id === "kitchens",
        ),
      );
      assert.ok(
        workshopResult.workshops.some(
          (item: { workshop_id: string; total: number }) =>
            item.workshop_id === "kitchens" && item.total >= 1,
        ),
      );
      const ageResponse = await call(
        "/api/admin?age=" + encodeURIComponent("26–35"),
        undefined,
        admin,
      );
      const ageResult = await ageResponse.json();
      assert.equal(ageResponse.status, 200);
      assert.ok(
        ageResult.registrations.every(
          (r: Registration) => r.age_group === "26–35",
        ),
      );
      await db().execute("UPDATE registrations SET company=? WHERE id=?", [
        '=HYPERLINK("https://invalid")',
        id,
      ]);
      const csvResponse = await call("/api/admin/export", undefined, admin);
      assert.equal(csvResponse.status, 200);
      const csv = await csvResponse.text();
      assert.ok(csv.includes("'=HYPERLINK"));
      assert.ok(!csv.includes(token));
      assert.ok(csv.includes(number));
      assert.ok(csv.includes("أساسيات الظهور المهني"));
    },
  );
  await t.test("SQL rate limiting blocks excess attempts", async () => {
    const key = `test:${run}`;
    await rateLimit(key, 2, 60);
    await rateLimit(key, 2, 60);
    await assert.rejects(() => rateLimit(key, 2, 60), { status: 429 });
  });
  await t.test("logout revokes session on server", async () => {
    assert.equal((await call("/api/auth/logout", {}, staff)).status, 200);
    assert.equal(
      (await call("/api/check-in?q=test", undefined, staff)).status,
      401,
    );
  });
});
