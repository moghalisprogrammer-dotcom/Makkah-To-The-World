import { chromium, expect } from "@playwright/test";
import QRCode from "qrcode";
import { mkdir } from "node:fs/promises";

const base = "http://127.0.0.1:3105/makkah";
const token = "b".repeat(64);
const fixture = {
  full_name: "زائر عائد",
  email: "returning@example.invalid",
  phone: "0501234567",
  company: "جهة الاختبار",
  job_title: "زائر",
  age_group: "26–35",
  registration_number: "EVT-RETURN",
  status: "REGISTERED",
  workshop_id: "digital",
  qr: await QRCode.toDataURL(token),
};
const browser = await chromium.launch({ channel: "chrome", headless: true });
const errors = [];
await mkdir("tmp/verification", { recursive: true });
const options = { viewport: { width: 390, height: 844 }, locale: "ar-SA" };
async function intercept(context, status = 200) {
  await context.route("**/api/ticket/*", (route) =>
    route.fulfill({
      status,
      json: status === 200 ? fixture : { error: "التذكرة غير موجودة." },
    }),
  );
  context.on("page", (page) =>
    page.on("pageerror", (error) => errors.push(error.message)),
  );
}

try {
  const context = await browser.newContext(options);
  await intercept(context);
  const ticket = await context.newPage();
  await ticket.goto(`${base}/ticket/${token}?lang=ar`);
  await expect(ticket.locator(".ticket-qr")).toBeVisible();
  expect(
    await ticket.evaluate(() => localStorage.getItem("makkah_ticket")),
  ).toBe(token);
  await ticket.locator(".ticket-personal-details summary").click();
  await expect(ticket.locator(".ticket-personal-details")).toContainText(
    fixture.email,
  );
  await ticket.close();

  const home = await context.newPage();
  await home.goto(`${base}/?lang=ar`);
  const shortcut = home.locator(".cinema-opening .saved-ticket-link");
  await expect(shortcut).toBeVisible();
  await expect(shortcut).toHaveAttribute("href", `/makkah/ticket/${token}`);
  await home.screenshot({
    path: "tmp/verification/returning-visitor-opening.png",
  });
  expect(
    await home.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await home.getByRole("button", { name: "تجاوز المقدمة" }).click();
  await expect(home.locator(".cinema-opening")).toHaveCount(0);
  await expect(
    home.locator(".cinema-visitor-tools .saved-ticket-link"),
  ).toBeVisible();
  await home.screenshot({
    path: "tmp/verification/returning-visitor-home.png",
  });
  await home.setViewportSize({ width: 320, height: 740 });
  expect(
    await home.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  const state = await context.storageState();
  expect(JSON.stringify(state)).not.toContain(fixture.email);
  await context.close();

  const restored = await browser.newContext({
    ...options,
    storageState: state,
  });
  await intercept(restored);
  const page = await restored.newPage();
  await page.goto(`${base}/?lang=ar`);
  await page.locator(".cinema-opening .saved-ticket-link").click();
  await expect(page.locator(".ticket-body h3")).toHaveText(fixture.full_name);
  const otherTab = await restored.newPage();
  await otherTab.goto(`${base}/?lang=ar`);
  await expect(
    otherTab.locator(".cinema-opening .saved-ticket-link"),
  ).toBeVisible();
  await page.bringToFront();
  await page.locator(".ticket-device-note button").click();
  await expect(otherTab.locator(".saved-ticket-link")).toHaveCount(0);
  expect(
    await page.evaluate(() => localStorage.getItem("makkah_ticket")),
  ).toBeNull();
  expect(
    await page.evaluate(() => sessionStorage.getItem("makkah_ticket")),
  ).toBeNull();
  await page.goto(`${base}/?lang=ar`);
  await expect(page.locator(".saved-ticket-link")).toHaveCount(0);
  await restored.close();

  for (const status of [404, 503]) {
    const ctx = await browser.newContext({ ...options, storageState: state });
    await intercept(ctx, status);
    const p = await ctx.newPage();
    await p.goto(`${base}/ticket/${token}?lang=ar`);
    await expect(p.locator(".notice.error")).toBeVisible();
    expect(await p.evaluate(() => localStorage.getItem("makkah_ticket"))).toBe(
      status === 404 ? null : token,
    );
    await ctx.close();
  }

  const blocked = await browser.newContext(options);
  await blocked.addInitScript(() => {
    for (const name of ["localStorage", "sessionStorage"])
      Object.defineProperty(window, name, {
        get() {
          throw new DOMException("Blocked", "SecurityError");
        },
      });
  });
  await intercept(blocked);
  const fallback = await blocked.newPage();
  await fallback.goto(`${base}/registration/success?ticket=${token}&lang=ar`);
  await expect(fallback.locator(".ticket-qr")).toBeVisible();
  await expect(fallback.locator(".ticket-device-note")).toHaveCount(0);
  await blocked.close();

  for (const mode of ["allowed", "blocked", "muted"]) {
    const ctx = await browser.newContext(options);
    await ctx.addInitScript(
      ({ mode }) => {
        const paused = new WeakMap();
        window.audioAttempts = 0;
        window.allowTestAudio = mode === "allowed";
        if (mode === "muted") localStorage.setItem("makkah_sound", "off");
        Object.defineProperty(HTMLMediaElement.prototype, "paused", {
          get() {
            return paused.get(this) ?? true;
          },
        });
        HTMLMediaElement.prototype.play = function () {
          window.audioAttempts++;
          if (!window.allowTestAudio)
            return Promise.reject(
              new DOMException("Gesture required", "NotAllowedError"),
            );
          paused.set(this, false);
          this.dispatchEvent(new Event("play"));
          return Promise.resolve();
        };
        HTMLMediaElement.prototype.pause = function () {
          paused.set(this, true);
          this.dispatchEvent(new Event("pause"));
        };
      },
      { mode },
    );
    const p = await ctx.newPage();
    p.on("pageerror", (error) => errors.push(error.message));
    await p.goto(`${base}/?lang=ar`);
    const sound = p.locator(".cinema-opening [data-audio-toggle]");
    await expect(sound).toBeVisible();
    if (mode === "muted") {
      expect(await p.evaluate(() => window.audioAttempts)).toBe(0);
      await p.locator(".opening-topline").click();
      expect(await p.evaluate(() => window.audioAttempts)).toBe(0);
      await p.evaluate(() => {
        window.allowTestAudio = true;
      });
      await sound.click();
    } else if (mode === "blocked") {
      await expect
        .poll(() => p.evaluate(() => window.audioAttempts))
        .toBeGreaterThan(0);
      await expect(sound).toHaveAttribute("aria-pressed", "false");
      await p.evaluate(() => {
        window.allowTestAudio = true;
      });
      await p.locator(".opening-topline").click();
    }
    await expect(sound).toHaveAttribute("aria-pressed", "true");
    await sound.click();
    await expect(sound).toHaveAttribute("aria-pressed", "false");
    const attempts = await p.evaluate(() => window.audioAttempts);
    await p.locator(".opening-topline").click();
    expect(await p.evaluate(() => window.audioAttempts)).toBe(attempts);
    expect(await p.evaluate(() => localStorage.getItem("makkah_sound"))).toBe(
      "off",
    );
    await ctx.close();
  }
  const native = await browser.newContext(options);
  const nativePage = await native.newPage();
  await nativePage.goto(`${base}/?lang=ar`);
  await nativePage.locator(".opening-topline").click();
  await expect
    .poll(() =>
      nativePage
        .locator("audio")
        .evaluate((audio) => !audio.paused && audio.currentTime > 0),
    )
    .toBe(true);
  expect(
    await nativePage.locator("audio").evaluate((audio) => audio.muted),
  ).toBe(false);
  await native.close();
  expect(errors).toEqual([]);
  console.log(
    "PASS: returning visitor across tabs/browser sessions, fresh details, removal, storage blocked, stale ticket vs network failure; autoplay allowed/blocked and explicit mute. No registration created.",
  );
} finally {
  await browser.close();
}
