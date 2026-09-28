import { chromium, expect } from "@playwright/test";
import { mkdir } from "node:fs/promises";
const base = process.env.APP_URL || "http://localhost:3000";
const browser = await chromium.launch({ channel: "chrome", headless: true });
const out = "tmp/verification";
await mkdir(out, { recursive: true });
const errors = [];
try {
  const page = await browser.newPage({
    locale: "en-US",
    viewport: { width: 390, height: 844 },
  });
  page.on("pageerror", (e) => errors.push(e.message));
  await page.addInitScript(() => {
    window.__cueNotes = 0;
    const original = AudioContext.prototype.createOscillator;
    AudioContext.prototype.createOscillator = function (...args) {
      window.__cueNotes++;
      return original.apply(this, args);
    };
    window.__titles = [];
    new MutationObserver(() => {
      const title = document.querySelector(".opening-caption h1")?.textContent;
      if (title && !window.__titles.includes(title))
        window.__titles.push(title);
    }).observe(document, { childList: true, subtree: true });
  });
  await page.goto(base + "/");
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.locator(".invitation-content")).toHaveAttribute(
    "inert",
    "",
  );
  await expect(page.locator("audio")).toHaveJSProperty("paused", true);
  expect(await page.evaluate(() => window.__cueNotes)).toBe(0);
  await page.getByRole("button", { name: "Enable sound", exact: true }).click();
  await expect
    .poll(() => page.evaluate(() => window.__cueNotes))
    .toBeGreaterThan(0);
  await page.screenshot({ path: `${out}/opening-english-mobile.png` });
  await expect(page.getByRole("dialog")).toHaveCount(0, { timeout: 16000 });
  expect(await page.evaluate(() => window.__titles)).toEqual([
    "A land of stories.",
    "A living heritage.",
    "Roots that inspire.",
    "A welcome that connects us.",
  ]);
  expect(await page.evaluate(() => window.__cueNotes)).toBeGreaterThanOrEqual(
    9,
  );
  await expect(
    page.getByRole("button", { name: "Begin the journey", exact: true }),
  ).toBeVisible();
  await page.evaluate(() => sessionStorage.setItem("makkah_intro_seen", "true"));
  await page.reload();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "Skip intro", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page
    .getByRole("button", { name: "التبديل إلى العربية", exact: true })
    .click();
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(
    page.getByRole("button", { name: "ابدأ الرحلة", exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("lang", "ar");
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.screenshot({ path: `${out}/opening-arabic-mobile.png` });
  await page.getByRole("button", { name: "تجاوز المقدمة", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.locator(".cinema-progress button").last().click();
  await page.locator('input[name="full_name"]').fill("Alex Visitor");
  await page
    .getByRole("button", { name: "Switch to English", exact: true })
    .click();
  await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
  await expect(page.locator('input[name="full_name"]')).toHaveValue(
    "Alex Visitor",
  );
  await page.locator(".question-next").click();
  await page
    .locator('input[name="email"]')
    .fill("language-check@example.invalid");
  await page.locator(".question-next").click();
  await page.locator('input[name="phone"]').fill("0501234567");
  await page.locator(".question-next").click();
  await page.locator('label:has(input[value="26–35"])').click();
  await page.locator(".question-next").click();
  await page.locator('label:has(input[value="none"])').click();
  await page.locator(".question-next").click();
  await page.locator(".question-next").click();
  await page.getByRole("checkbox").check();
  let submitted;
  await page.route("**/api/register", async (route) => {
    submitted = route.request().postDataJSON();
    await route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ error: "The request could not be completed." }),
    });
  });
  await page.locator(".question-next").click();
  await expect(page.locator(".question-error")).toBeVisible();
  expect(submitted.locale).toBe("en");
  expect(submitted.workshop_id).toBe(null);
  expect(errors).toEqual([]);
  console.log(
    "PASS: four-shot intro completes, gesture-only transition audio, skip, retained language override, English browser detection, direction and draft preservation, English registration payload.",
  );
} finally {
  await browser.close();
}
