import { chromium, expect } from "@playwright/test";
import mysql from "mysql2/promise";
import QRCode from "qrcode";
import { mkdir } from "node:fs/promises";
import { randomBytes } from "node:crypto";
const base = process.env.APP_URL;
if (
  new URL(base).hostname !== "localhost" ||
  !["localhost", "127.0.0.1"].includes(
    new URL(process.env.DATABASE_URL).hostname,
  )
)
  throw new Error("Browser tests require the local environment.");
const email = `browser-${randomBytes(6).toString("hex")}@example.invalid`;
const out = "tmp/verification";
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
const errors = [];
const context = await browser.newContext({
  locale: "ar-SA",
  viewport: { width: 1440, height: 1000 },
  deviceScaleFactor: 1,
});
const page = await context.newPage();
await page.addInitScript(() => sessionStorage.setItem("makkah_intro_seen", "true"));
let staffPage;
const cameraDiagnostics = [];
page.on("pageerror", (e) => errors.push(e.message));
const database = await mysql.createConnection(process.env.DATABASE_URL);
try {
  await page.goto(base, { waitUntil: "networkidle" });
  for (const width of [360, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await expect(page.locator(".cinema-photo img").last()).toHaveJSProperty(
    "complete",
    true,
  );
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: `${out}/home-desktop.png`, fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: `${out}/hero-mobile.png` });
  expect(await page.locator("audio").evaluate((a) => a.paused)).toBe(true);
  await page
    .getByRole("button", { name: "تشغيل الموسيقى", exact: true })
    .click();
  await expect
    .poll(() =>
      page.locator("audio").evaluate((a) => !a.paused && a.currentTime > 0),
    )
    .toBe(true);
  await page
    .getByRole("button", { name: "إيقاف الموسيقى", exact: true })
    .click();
  for (const [name, id] of [
    ["التجربة", "experience"],
    ["البرنامج", "agenda"],
    ["الورش", "workshops"],
    ["الوصول", "location"],
  ]) {
    await page
      .locator(".cinema-progress")
      .getByRole("button", { name, exact: true })
      .click();
    await expect(page.locator(`.scene-${id}`)).toBeVisible();
    await expect(page.locator(`.scene-${id}`)).toHaveCSS("opacity", "1");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({ path: `${out}/${id}-mobile.png` });
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.screenshot({ path: `${out}/${id}-desktop.png` });
    await page.setViewportSize({ width: 390, height: 844 });
    if (id === "agenda")
      await expect(page.locator(".cinema-agenda-item")).toHaveCount(4);
    if (id === "workshops") {
      await expect(page.locator(".workshop-selector button")).toHaveCount(3);
      await expect(page.locator(".workshop-start")).toContainText("12:00");
      await page.locator(".workshop-selector button").nth(1).click();
      await expect(page.locator(".workshop-spotlight")).toHaveCount(1);
      await expect(page.locator(".workshop-spotlight")).toHaveCSS(
        "opacity",
        "1",
      );
      await expect(page.locator(".workshop-start")).toContainText("12:00");
    }
  }
  await page
    .locator(".location-tabs")
    .getByRole("tab", { name: "المساعدة", exact: true })
    .click();
  await expect(page.locator(".location-panel")).toContainText("يسعدنا مساعدتك");
  await page
    .locator(".cinema-progress")
    .getByRole("button", { name: "حضورك", exact: true })
    .click();
  await expect(page.locator(".question-form")).toBeVisible();
  await expect(page.locator(".scene-register")).toHaveCSS("opacity", "1");
  await page.screenshot({ path: `${out}/registration-mobile.png` });
  await page
    .getByRole("textbox", { name: /الاسم الكامل/ })
    .fill("نورة أحمد — اختبار الواجهة");
  await page.locator(".question-next").click();
  await expect(page.locator(".question-stage-1")).toHaveCSS("opacity", "1");
  await page.getByRole("textbox", { name: /البريد الإلكتروني/ }).fill(email);
  await page.locator(".question-next").click();
  await expect(page.locator(".question-stage-2")).toHaveCSS("opacity", "1");
  await page.getByRole("textbox", { name: /رقم الجوال/ }).fill("0501234567");
  await page.locator(".question-next").click();
  await expect(page.locator(".question-stage-3")).toHaveCSS("opacity", "1");
  await page
    .locator('label:has(input[name="age_group"][value="26–35"])')
    .click();
  await page.locator(".question-next").click();
  await expect(page.locator(".question-stage-4")).toHaveCSS("opacity", "1");
  await page
    .locator('label:has(input[name="workshop_id"][value="digital"])')
    .click();
  await page
    .locator('label:has(input[name="workshop_id"][value="food-safety"])')
    .click();
  await expect(page.locator('input[name="workshop_id"]:checked')).toHaveCount(
    1,
  );
  await expect(
    page.locator('input[name="workshop_id"][value="digital"]'),
  ).not.toBeChecked();
  await page.locator(".question-next").click();
  await expect(page.locator(".question-stage-5")).toHaveCSS("opacity", "1");
  await page
    .locator(".cinema-progress")
    .getByRole("button", { name: "البرنامج", exact: true })
    .click();
  await expect(page.locator(".scene-agenda")).toHaveCSS("opacity", "1");
  await page
    .locator(".cinema-progress")
    .getByRole("button", { name: "حضورك", exact: true })
    .click();
  await expect(page.locator(".scene-register")).toHaveCSS("opacity", "1");
  await expect(page.locator(".question-stage-5")).toBeVisible();
  await page
    .getByRole("textbox", { name: /جهة العمل أو الدراسة/ })
    .fill("كلية مكة الأهلية");
  await page
    .getByRole("textbox", { name: /المسمى الوظيفي/ })
    .fill("زائرة اختبار");
  await page.locator(".question-next").click();
  await expect(page.locator(".question-stage-6")).toHaveCSS("opacity", "1");
  await expect(page.locator(".question-review")).toContainText(email);
  await expect(page.locator(".question-review")).toContainText("سلامة الأغذية");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "أؤكد حضوري" }).click();
  await page.waitForURL("**/registration/success", { timeout: 25000 });
  await expect(
    page.getByRole("heading", { name: "تم تسجيلك، أهلًا بك!" }),
  ).toBeVisible();
  await expect(page.locator(".ticket-qr")).toBeVisible();
  await expect(
    page.getByText("أُرسلت تذكرتك ورمز QR إلى بريدك الإلكتروني"),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "فتح Gmail" })).toHaveAttribute(
    "href",
    "https://mail.google.com/mail/u/0/#inbox",
  );
  const registration = {
    number: (await page.locator(".ticket-number").textContent()).trim(),
  };
  expect(
    await page.evaluate(() => sessionStorage.getItem("makkah_email_sent")),
  ).toBe("true");
  expect(
    await page.evaluate(() => sessionStorage.getItem("makkah_registration_email")),
  ).toBe(email);
  const [saved] = await database.execute(
    "SELECT id,workshop_id,company,job_title FROM registrations WHERE email=?",
    [email],
  );
  expect(saved).toHaveLength(1);
  expect(saved[0].workshop_id).toBe("food-safety");
  expect(saved[0].company).toBe("كلية مكة الأهلية");
  expect(saved[0].job_title).toBe("زائرة اختبار");
  const [emailLogs] = await database.execute(
    "SELECT status FROM email_logs WHERE registration_id=?",
    [saved[0].id],
  );
  expect(emailLogs.some((log) => log.status === "SENT")).toBe(true);
  const inbox = await fetch(
    "http://localhost:8026/api/v1/search?query=" +
      encodeURIComponent(`to:${email}`),
  ).then((response) => response.json());
  expect(inbox.messages.length).toBeGreaterThan(0);
  const message = await fetch(
    `http://localhost:8026/api/v1/message/${inbox.messages[0].ID}`,
  ).then((response) => response.json());
  expect(message.HTML).toContain("سلامة الأغذية");
  expect(message.HTML).toContain("cid:ticket-qr");
  expect(
    message.Inline.some(
      (attachment) => attachment.FileName === "ticket-qr.png",
    ),
  ).toBe(true);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({ path: `${out}/ticket-mobile.png`, fullPage: true });
  const download = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "تحميل التذكرة", exact: true })
    .click();
  const file = await download;
  expect(file.suggestedFilename()).toMatch(/^EVT-\d+\.png$/);
  await file.saveAs(`${out}/downloaded-ticket.png`);
  const qr = await page.locator(".ticket-qr").getAttribute("src");
  // Exercise the actual camera decoder with a canvas media stream containing the issued QR.
  const staffContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
  });
  staffPage = await staffContext.newPage();
  staffPage.on("pageerror", (e) => errors.push(e.message));
  staffPage.on("response", (response) => {
    if (response.url().includes("/api/check-in"))
      cameraDiagnostics.push({
        event: "verification-response",
        status: response.status(),
      });
  });
  staffPage.on("requestfailed", (request) =>
    cameraDiagnostics.push({
      event: "request-failed",
      path: new URL(request.url()).pathname,
      error: request.failure()?.errorText,
    }),
  );
  await staffPage.goto(base + "/login");
  await staffPage.getByRole("textbox", { name: "اسم المستخدم" }).fill("staff1");
  await staffPage.getByLabel("كلمة المرور").fill(process.env.STAFF_1_PASSWORD);
  await staffPage.getByRole("button", { name: "تسجيل الدخول" }).click();
  await expect(
    staffPage.getByRole("heading", { name: "أهلًا بكل ضيف" }),
  ).toBeVisible();
  async function installCamera(qrData) {
    await staffPage.evaluate((qrData) => {
      Object.defineProperty(navigator.mediaDevices, "getUserMedia", {
        configurable: true,
        value: async () => {
          const canvas = document.createElement("canvas");
          canvas.width = 640;
          canvas.height = 480;
          const ctx = canvas.getContext("2d");
          const image = new Image();
          image.src = qrData;
          await image.decode();
          window.__testCamera = {
            draws: 0,
            imageWidth: image.naturalWidth,
            imageHeight: image.naturalHeight,
          };
          const draw = () => {
            window.__testCamera.draws++;
            ctx.fillStyle = "white";
            ctx.fillRect(0, 0, 640, 480);
            ctx.drawImage(image, 140, 60, 360, 360);
          };
          draw();
          const timer = setInterval(draw, 100);
          const stream = canvas.captureStream(10);
          stream
            .getTracks()
            .forEach((track) =>
              track.addEventListener("ended", () => clearInterval(timer)),
            );
          return stream;
        },
      });
    }, qrData);
  }
  // Synthetic, unregistered tokens whose valid camera QR patterns defeated ZXing.
  // Keep these exact masks as regressions for the independent pixel decoder.
  for (const [maskPattern, token] of [
    [6, "f35ebc70bc1776abd4cb8a329fe77931c0a2aaafb1901fafec53eaae95d76b3c"],
    [0, "f2abe8894478fe1f8b38bf2764b9e978296ebf1127335e7bf5a6f2794ff2e43d"],
    [1, "df7f4f4ddb7faef7b77e43b670d89b453f6fc159c0efa28b3be4c56502a2386c"],
    [2, "1dfc02e1386aaddda5e8a84edb17fb46faf6f1ace65086d7648a3bdf496fe54f"],
  ]) {
    await installCamera(
      await QRCode.toDataURL(token, {
        width: 360,
        margin: 3,
        errorCorrectionLevel: "M",
        maskPattern,
      }),
    );
    const verified = staffPage.waitForResponse(
      (response) =>
        response.url().endsWith("/api/check-in") &&
        response.request().method() === "POST",
      { timeout: 10000 },
    );
    await staffPage
      .getByRole("button", { name: "تشغيل الكاميرا", exact: true })
      .click();
    const response = await verified;
    expect(response.request().postDataJSON().token).toBe(token);
    expect(response.status()).toBe(404);
    await expect(staffPage.locator(".notice.error")).toContainText(
      "التذكرة غير صالحة",
    );
    await expect(
      staffPage.getByRole("button", { name: "تأكيد الدخول", exact: true }),
    ).toHaveCount(0);
  }
  await installCamera(qr);
  await staffPage.getByRole("button", { name: "تشغيل الكاميرا" }).click();
  await expect(
    staffPage.getByRole("heading", { name: "تذكرة صالحة للدخول" }),
  ).toBeVisible({ timeout: 15000 });
  const [before] = await database.execute(
    "SELECT status FROM registrations WHERE email=?",
    [email],
  );
  expect(before[0].status).toBe("REGISTERED");
  for (const detail of [email, "0501234567", "زائرة اختبار", "كلية مكة الأهلية", "26", "سلامة الأغذية"]) {
    await expect(staffPage.locator(".result-details")).toContainText(detail);
  }
  await staffPage.screenshot({
    path: `${out}/gate-valid-mobile.png`,
    fullPage: true,
  });
  await staffPage
    .getByRole("button", { name: "تأكيد الدخول", exact: true })
    .click();
  await expect(
    staffPage.getByRole("heading", { name: "تم الدخول بنجاح" }),
  ).toBeVisible();
  await staffPage
    .getByRole("button", { name: "استقبال الزائر التالي" })
    .click();
  await staffPage.getByRole("button", { name: "البحث اليدوي" }).click();
  await staffPage
    .getByRole("textbox", { name: "ابحث عن الزائر" })
    .fill(registration.number);
  await staffPage.getByRole("button", { name: "البحث عن التسجيل" }).click();
  await staffPage.locator(".search-result").click();
  await expect(
    staffPage.getByRole("heading", { name: "سبق تسجيل الدخول" }),
  ).toBeVisible();
  await expect(
    staffPage.getByRole("button", { name: "تأكيد الدخول", exact: true }),
  ).toHaveCount(0);
  await staffPage.screenshot({
    path: `${out}/gate-duplicate-mobile.png`,
    fullPage: true,
  });
  await staffPage.goto(base + "/admin");
  await expect(staffPage).toHaveURL(base + "/check-in");
  const adminContext = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
  });
  const adminPage = await adminContext.newPage();
  adminPage.on("pageerror", (e) => errors.push(e.message));
  await adminPage.goto(base + "/login");
  await adminPage.getByRole("textbox", { name: "اسم المستخدم" }).fill("admin");
  await adminPage.getByLabel("كلمة المرور").fill(process.env.ADMIN_PASSWORD);
  await adminPage.getByRole("button", { name: "تسجيل الدخول" }).click();
  await expect(
    adminPage.getByRole("heading", { name: "نظرة على الحضور" }),
  ).toBeVisible();
  await adminPage
    .getByRole("textbox", { name: "البحث في المسجلين" })
    .fill(registration.number);
  await adminPage
    .getByLabel("تصفية حسب ورشة العمل")
    .selectOption("food-safety");
  await expect(adminPage.locator("tbody tr")).toHaveCount(1);
  await adminPage.screenshot({
    path: `${out}/admin-desktop.png`,
    fullPage: true,
  });
  await adminPage.getByRole("button", { name: "عرض التفاصيل" }).click();
  await expect(adminPage.getByRole("dialog")).toBeVisible();
  await adminPage.getByRole("button", { name: "التراجع عن الدخول" }).click();
  await adminPage.getByRole("button", { name: "تأكيد العملية" }).click();
  await expect(adminPage.getByRole("dialog")).toHaveCount(0);
  await expect(adminPage.locator("tbody .status-pill")).toHaveText(
    "بانتظار الحضور",
  );
  await adminPage.setViewportSize({ width: 390, height: 844 });
  await expect(adminPage.locator(".admin-mobile-list")).toBeVisible();
  await expect(adminPage.locator(".admin-visitor-card")).toHaveCount(1);
  await expect(adminPage.locator(".admin-visitor-card")).toContainText(
    registration.number,
  );
  expect(
    await adminPage.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await adminPage.screenshot({
    path: `${out}/admin-mobile.png`,
    fullPage: true,
  });
  await adminPage.getByRole("button", { name: "تسجيل الخروج" }).click();
  await expect(adminPage).toHaveURL(base + "/login");
  expect(errors).toEqual([]);
  console.log(
    "PASS: Cinematic scene navigation, audio toggle, 7-question registration, exclusive workshop selection persisted in SQL and QR confirmation email, QR download, actual QR camera decoding, explicit entry, duplicate detection, staff authorization, admin undo, logout. No browser runtime errors.",
  );
} catch (error) {
  if (staffPage && !staffPage.isClosed()) {
    await staffPage.screenshot({
      path: `${out}/failure-staff.png`,
      fullPage: true,
    });
    console.error(
      "Staff failure diagnostics:",
      JSON.stringify(
        {
          requests: cameraDiagnostics,
          runtime: await staffPage.evaluate(() => {
            const video = document.querySelector("video");
            const stream = video?.srcObject;
            return {
              path: location.pathname,
              visibility: document.visibilityState,
              notices: [...document.querySelectorAll(".notice")].map(
                (node) => node.textContent,
              ),
              camera: window.__testCamera || null,
              video: video
                ? {
                    readyState: video.readyState,
                    paused: video.paused,
                    width: video.videoWidth,
                    height: video.videoHeight,
                    currentTime: video.currentTime,
                    tracks:
                      stream instanceof MediaStream
                        ? stream.getVideoTracks().map((track) => ({
                            readyState: track.readyState,
                            muted: track.muted,
                            enabled: track.enabled,
                            settings: track.getSettings(),
                          }))
                        : [],
                  }
                : null,
            };
          }),
        },
        null,
        2,
      ),
    );
  }
  await page.screenshot({ path: `${out}/failure.png`, fullPage: false });
  console.error("Browser failure location:", page.url());
  console.error(
    "Visible notices:",
    await page.locator(".notice,.question-error").allTextContents(),
  );
  console.error(
    "Invalid fields:",
    await page.locator("form").evaluateAll((forms) =>
      forms.flatMap((form) =>
        [...form.querySelectorAll("input,select")]
          .filter((input) => !input.validity.valid)
          .map((input) => ({
            name: input.name,
            message: input.validationMessage,
          })),
      ),
    ),
  );
  throw error;
} finally {
  await browser.close();
  const [registrations] = await database.execute(
    "SELECT id FROM registrations WHERE email=?",
    [email],
  );
  for (const r of registrations) {
    await database.execute("DELETE FROM email_logs WHERE registration_id=?", [
      r.id,
    ]);
    await database.execute(
      "DELETE FROM check_in_logs WHERE registration_id=?",
      [r.id],
    );
    await database.execute("DELETE FROM registrations WHERE id=?", [r.id]);
  }
  await database.end();
}
