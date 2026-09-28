import { chromium, expect } from "@playwright/test";
import QRCode from "qrcode";
import jsQR from "jsqr";
import { PNG } from "pngjs";
import { mkdir, readFile } from "node:fs/promises";

const base = "http://127.0.0.1:3105/makkah";
const token = "a".repeat(64);
const qr = await QRCode.toDataURL(token, { margin: 4, width: 440 });
const out = "tmp/verification";
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
const cases = [
  { id: "digital", locale: "ar", url: "https://forms.gle/6tieMndiVakSni1o8" },
  {
    id: "kitchens",
    locale: "en",
    url: "https://docs.google.com/forms/d/e/1FAIpQLScSl_3X2OnsCVkTo8nBeqqmUt2eI7PZ2xlUv70ZZCPWXDqRCg/viewform?pli=1",
  },
  {
    id: "food-safety",
    locale: "ar",
    url: "https://docs.google.com/forms/d/e/1FAIpQLSdEvIOFyUXG10_0Pq5o5QaiKWTdppr3U72uqIVy0gLF_j7XGQ/viewform",
  },
  { id: null, locale: "ar" },
  { id: "digital", locale: "ar", status: "CANCELLED" },
];
const errors = [];
try {
  for (const item of cases) {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      locale: item.locale,
    });
    const page = await context.newPage();
    page.on("pageerror", (error) => errors.push(error.message));
    await page.addInitScript(
      ({ token }) => {
        sessionStorage.setItem("makkah_ticket", token);
        sessionStorage.setItem("makkah_email_sent", "true");
      },
      { token },
    );
    await page.route("**/api/ticket/*", (route) =>
      route.fulfill({
        json: {
          full_name:
            item.locale === "ar"
              ? "زائر تجربة الورشة"
              : "Workshop Preview Guest",
          registration_number: "EVT-TEST",
          status: item.status || "REGISTERED",
          qr,
          workshop_id: item.id,
        },
      }),
    );
    await page.goto(`${base}/registration/success?lang=${item.locale}`);
    await expect(page.locator(".ticket-page h1")).toBeVisible();
    if (!item.id || item.status === "CANCELLED") {
      await expect(page.locator(".ticket-step-nav")).toHaveCount(0);
      await expect(page.locator(".workshop-form-link")).toHaveCount(0);
      await context.close();
      continue;
    }
    if (item.id === "digital") {
      const [download] = await Promise.all([
        page.waitForEvent("download"),
        page.locator(".ticket-pass-panel .ticket-save-button").click(),
      ]);
      await download.saveAs(`${out}/workshop-entry-ticket.png`);
      const png = PNG.sync.read(
        await readFile(`${out}/workshop-entry-ticket.png`),
      );
      expect(
        jsQR(new Uint8ClampedArray(png.data), png.width, png.height)?.data,
      ).toBe(token);
      await expect(
        page.locator(".ticket-pass-panel .ticket-save-button"),
      ).not.toHaveClass(/needs-attention/);
    }
    await page.locator(".ticket-workshop-next").click();
    await expect(page.locator("#workshop-followup-title")).toBeFocused();
    await expect(page.locator(".workshop-form-link")).toHaveAttribute(
      "href",
      item.url,
    );
    await expect(page.locator(".workshop-form-link")).toHaveAttribute(
      "target",
      "_blank",
    );
    await expect(page.locator(".ticket-pass-panel")).not.toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.locator(".ticket-workshop-followup").evaluate(async (node) => {
      await Promise.all(
        node.getAnimations().map((animation) => animation.finished),
      );
    });
    await page.screenshot({
      path: `${out}/workshop-${item.id}-${item.locale}.png`,
      fullPage: true,
    });
    await page.emulateMedia({ media: "print" });
    await expect(page.locator(".ticket-pass-panel .ticket")).toBeVisible();
    await expect(page.locator(".ticket-workshop-followup")).not.toBeVisible();
    await page.emulateMedia({ media: "screen", reducedMotion: "reduce" });
    expect(
      await page
        .locator(".ticket-workshop-followup")
        .evaluate((node) => getComputedStyle(node).animationName),
    ).toBe("none");
    await page.setViewportSize({ width: 320, height: 740 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.setViewportSize({ width: 1440, height: 1000 });
    if (item.id === "digital")
      await page.screenshot({
        path: `${out}/workshop-desktop.png`,
        fullPage: true,
      });
    await page.locator(".ticket-step-nav button").first().click();
    await expect(page.locator(".ticket-pass-panel .ticket-qr")).toBeVisible();
    await context.close();
  }
  expect(errors).toEqual([]);
  console.log(
    "PASS: correct forms, AR/EN, mobile/desktop, QR PNG round-trip, cancellation/no workshop, print and reduced motion. No external form submitted.",
  );
} finally {
  await browser.close();
}
