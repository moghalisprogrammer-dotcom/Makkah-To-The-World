import { translate } from "../src/lib/locale.ts";
import { agenda } from "../src/lib/agenda.ts";
const englishRun = process.env.TEST_LOCALE === "en";
const t = (value) => translate(value, englishRun ? "en" : "ar");
import { chromium, expect } from "@playwright/test";
import { mkdir } from "node:fs/promises";

const base = process.env.APP_URL || "http://localhost:3000";
if (!["localhost", "127.0.0.1"].includes(new URL(base).hostname))
  throw new Error("Navigation checks require a local application.");
const browser = await chromium.launch({ channel: "chrome", headless: true });
const failures = [];
const errors = [];
const chapters = [
  ["welcome", t("الدعوة")],
  ["experience", t("التجربة")],
  ["agenda", t("البرنامج")],
  ["workshops", t("الورش")],
  ["location", t("الوصول")],
  ["register", t("حضورك")],
];
const skipOpening = (page) =>
  page.getByRole("button", {
    name: englishRun ? "Skip intro" : "تجاوز المقدمة",
    exact: true,
  });
async function visit(page, url) {
  await page.goto(url);
  const skip = skipOpening(page);
  if (await skip.isVisible().catch(() => false)) await skip.click();
}
await mkdir("tmp/verification", { recursive: true });

async function checkLayout(page, label) {
  await page.evaluate(() => document.fonts.ready);
  const issues = await page.evaluate(() => {
    const main = document.querySelector(".cinema-main");
    const root = document.documentElement;
    const issues = [];
    if (
      root.scrollHeight > innerHeight + 1 ||
      root.scrollWidth > innerWidth + 1
    )
      issues.push({
        kind: "document-scroll",
        width: root.scrollWidth,
        height: root.scrollHeight,
      });
    if (
      main.scrollHeight > main.clientHeight + 1 ||
      main.scrollWidth > main.clientWidth + 1
    )
      issues.push({
        kind: "main-scroll",
        width: main.scrollWidth,
        clientWidth: main.clientWidth,
        height: main.scrollHeight,
        clientHeight: main.clientHeight,
      });
    const mainBox = main.getBoundingClientRect();
    const nodes = document.querySelectorAll(
      ".cinema-progress button,.cinema-footer button,.cinema-header a,.cinema-scene h1,.cinema-scene h2,.cinema-scene h3,.cinema-scene p,.cinema-scene button,.cinema-scene label,.cinema-scene input:not([type=radio]):not([name=website]),.cinema-scene .scene-pager",
    );
    for (const node of nodes) {
      const style = getComputedStyle(node);
      if (
        !node.getClientRects().length ||
        style.visibility === "hidden" ||
        node.closest("[aria-hidden=true],.question-honeypot")
      )
        continue;
      const rect = node.getBoundingClientRect();
      if (rect.width < 2 || rect.height < 2) continue;
      const inMain = main.contains(node);
      const top = inMain ? Math.max(0, mainBox.top) : 0;
      const bottom = inMain
        ? Math.min(innerHeight, mainBox.bottom)
        : innerHeight;
      if (
        rect.left < -1 ||
        rect.right > innerWidth + 1 ||
        rect.top < top - 1 ||
        rect.bottom > bottom + 1
      )
        issues.push({
          kind: "outside-visible-area",
          element: node.tagName,
          class: node.className,
          text: (node.textContent || node.getAttribute("name") || "")
            .trim()
            .slice(0, 85),
          left: Math.round(rect.left),
          right: Math.round(rect.right),
          top: Math.round(rect.top),
          bottom: Math.round(rect.bottom),
          availableTop: Math.round(top),
          availableBottom: Math.round(bottom),
        });
    }
    const stage = document.querySelector(".question-stage");
    const action = document.querySelector(".question-error,.question-actions");
    if (stage && action)
      for (const child of stage.children) {
        if (
          child.getBoundingClientRect().bottom >
            action.getBoundingClientRect().top + 1 ||
          child.scrollHeight > child.clientHeight + 1
        )
          issues.push({
            kind: "question-content-overlap",
            element: child.className,
            contentBottom: child.getBoundingClientRect().bottom,
            actionTop: action.getBoundingClientRect().top,
            hiddenHeight: child.scrollHeight - child.clientHeight,
          });
      }
    return issues;
  });
  if (issues.length) {
    const failure = { label, viewport: page.viewportSize(), issues };
    failures.push(failure);
    console.error("LAYOUT ISSUE", JSON.stringify(failure));
  }
}
async function scene(page, id, label) {
  await page
    .locator(".cinema-progress")
    .getByRole("button", { name: label, exact: true })
    .click();
  await expect(page.locator(`.scene-${id}`)).toHaveCSS("opacity", "1");
  await expect(page.locator(".cinema-scene")).toHaveCount(1);
}
async function question(page, step) {
  await expect(page.locator(`.question-stage-${step}`)).toBeVisible();
  await expect(page.locator(`.question-stage-${step}`)).toHaveCSS(
    "opacity",
    "1",
  );
  await expect(page.locator(".question-stage")).toHaveCount(1);
}
async function nextQuestion(page, step) {
  await page.locator(".question-next").click();
  await question(page, step);
}

try {
  const page = await browser.newPage({
    locale: englishRun ? "en-US" : "ar-SA",
    viewport: { width: 390, height: 844 },
    reducedMotion: "reduce",
  });
  page.on("pageerror", (error) => errors.push(error.message));
  await page.addInitScript(() =>
    sessionStorage.setItem("makkah_intro_seen", "true"),
  );
  let registrationRequests = 0;
  page.on("request", (request) => {
    if (request.url().endsWith("/api/register")) registrationRequests++;
  });
  await visit(page, base);
  await page
    .getByRole("button", { name: t("ابدأ الرحلة"), exact: true })
    .click();
  await expect(page.locator(".scene-experience")).toHaveCSS("opacity", "1");
  await page.goBack();
  await expect(page.locator(".scene-welcome")).toHaveCSS("opacity", "1");
  await page.locator(".cinema-main").focus();
  await page.keyboard.press(englishRun ? "ArrowRight" : "ArrowLeft");
  await expect(page.locator(".scene-experience")).toHaveCSS("opacity", "1");
  await page.locator(".cinema-main").focus();
  await page.keyboard.press(englishRun ? "ArrowLeft" : "ArrowRight");
  await expect(page.locator(".scene-welcome")).toHaveCSS("opacity", "1");
  await visit(page, base + "/#venue-guide");
  await expect(page.locator(".scene-location")).toHaveCSS("opacity", "1");
  expect(
    await page
      .locator(".cinema-photo img")
      .last()
      .evaluate((node) => getComputedStyle(node).animationName),
  ).toBe("none");

  await visit(page, base);
  await page
    .getByRole("button", { name: t("ابدأ الرحلة"), exact: true })
    .click();
  const next = page.locator(".cinema-next");
  await next.click();
  await expect(page.locator("#track-1")).toHaveAttribute(
    "aria-selected",
    "true",
  );
  for (let i = 2; i < 5; i++) {
    await next.click();
    await expect(page.locator(`#track-${i}`)).toHaveAttribute(
      "aria-selected",
      "true",
    );
  }
  await next.click();
  await expect(page.locator(".scene-agenda")).toHaveCSS("opacity", "1");
  const agendaPageCount = await page
    .locator(".scene-pager > div > button")
    .count();
  for (let i = 1; i < agendaPageCount; i++) {
    await next.click();
    await expect(
      page.locator(".scene-pager > div > button").nth(i),
    ).toHaveAttribute("aria-current", "true");
  }
  await next.click();
  await expect(page.locator(".scene-workshops")).toHaveCSS("opacity", "1");
  for (let i = 1; i < 3; i++) {
    await next.click();
    await expect(
      page.locator(".workshop-selector button").nth(i),
    ).toHaveAttribute("aria-pressed", "true");
  }
  await next.click();
  await expect(page.locator(".scene-location")).toHaveCSS("opacity", "1");
  for (let i = 1; i < 3; i++) {
    await next.click();
    await expect(page.locator(".location-tabs button").nth(i)).toHaveAttribute(
      "aria-selected",
      "true",
    );
  }
  await next.click();
  await expect(page.locator(".scene-register")).toHaveCSS("opacity", "1");

  for (const viewport of [
    { width: 360, height: 640 },
    { width: 390, height: 844 },
    { width: 1440, height: 900 },
  ]) {
    await page.setViewportSize(viewport);
    await visit(page, base + `/?layout=${viewport.width}#welcome`);
    for (const [id, label] of chapters) {
      await scene(page, id, label);
      await checkLayout(page, id);
      if (id === "experience") {
        const tabs = page.locator(".experience-tabs button");
        await expect(tabs).toHaveCount(5);
        for (let i = 0; i < 5; i++) {
          await tabs.nth(i).click();
          await expect(page.locator(".experience-panel")).toHaveCount(1);
          await expect(page.locator(".experience-panel")).toHaveCSS(
            "opacity",
            "1",
          );
          await checkLayout(page, `experience-${i}`);
        }
      }
      if (id === "agenda") {
        const pages = page.locator(".scene-pager > div > button");
        const count = await pages.count();
        expect(count).toBe(
          Math.ceil(agenda.length / (viewport.height < 740 ? 3 : 4)),
        );
        const titles = new Set();
        for (let i = 0; i < count; i++) {
          await pages.nth(i).click();
          await expect(page.locator(".agenda-pages")).toHaveCount(1);
          await expect(page.locator(".agenda-pages")).toHaveCSS("opacity", "1");
          for (const title of await page
            .locator(".cinema-agenda-item h3")
            .allTextContents())
            titles.add(title);
          await checkLayout(page, `agenda-page-${i}`);
        }
        expect(titles.size).toBe(agenda.length);
      }
      if (id === "workshops") {
        const tabs = page.locator(".workshop-selector button");
        await expect(tabs).toHaveCount(3);
        for (let i = 0; i < 3; i++) {
          await tabs.nth(i).click();
          await expect(page.locator(".workshop-spotlight")).toHaveCount(1);
          await expect(page.locator(".workshop-spotlight")).toHaveCSS(
            "opacity",
            "1",
          );
          await expect(page.locator(".workshop-start")).toContainText("12:00");
          await checkLayout(page, `workshop-${i}`);
        }
        await page.getByRole("button", { name: t("شاهد موقع الورش") }).click();
        await expect(page.locator(".scene-location")).toHaveCSS("opacity", "1");
        await expect(
          page.locator(".location-tabs button").nth(1),
        ).toHaveAttribute("aria-selected", "true");
        await scene(page, "workshops", t("الورش"));
      }
      if (id === "location") {
        for (let i = 0; i < 3; i++) {
          await page.locator(".location-tabs button").nth(i).click();
          await expect(page.locator(".location-panel")).toHaveCount(1);
          await expect(page.locator(".location-panel")).toHaveCSS(
            "opacity",
            "1",
          );
          await checkLayout(page, `location-${i}`);
        }
      }
      if (id === "register") {
        await question(page, 0);
        await page.locator(".question-next").click();
        await expect(page.locator(".question-error")).toBeVisible();
        await checkLayout(page, "question-0-error");
        await page
          .getByRole("textbox", { name: t("الاسم الكامل"), exact: true })
          .fill(t("زائر اختبار تجربة الدعوة"));
        await nextQuestion(page, 1);
        await checkLayout(page, "question-1");
        await page
          .getByRole("textbox", { name: t("البريد الإلكتروني"), exact: true })
          .fill("invitation.navigation@example.invalid");
        await nextQuestion(page, 2);
        await checkLayout(page, "question-2");
        await page
          .getByRole("textbox", { name: t("رقم الجوال"), exact: true })
          .fill(t("٠٥٠١٢٣٤٥٦٧"));
        await expect(page.locator('input[name="phone"]')).toHaveValue(
          "0501234567",
        );
        await nextQuestion(page, 3);
        await checkLayout(page, "question-3");
        await page
          .locator('label:has(input[name="age_group"][value="26–35"])')
          .click();
        await nextQuestion(page, 4);
        await checkLayout(page, "question-4");
        await page.locator(".question-next").click();
        await expect(page.locator(".question-error")).toBeVisible();
        await checkLayout(page, "question-4-error");
        for (const value of ["digital", "kitchens", "food-safety", "none"]) {
          await page
            .locator(`label:has(input[name="workshop_id"][value="${value}"])`)
            .click();
          await expect(
            page.locator('input[name="workshop_id"]:checked'),
          ).toHaveCount(1);
          await expect(
            page.locator(`input[name="workshop_id"][value="${value}"]`),
          ).toBeChecked();
        }
        await nextQuestion(page, 5);
        await checkLayout(page, "question-5");
        await nextQuestion(page, 6);
        await checkLayout(page, "question-6");
        await expect(page.locator(".question-review")).toContainText(
          t("حضور الفعالية فقط"),
        );
        await page.locator(".question-next").click();
        await expect(page.locator(".question-error")).toBeVisible();
        await checkLayout(page, "question-6-error");
        await scene(page, "agenda", t("البرنامج"));
        await scene(page, "register", t("حضورك"));
        await question(page, 6);
        await expect(page.locator(".question-review")).toContainText(
          "invitation.navigation@example.invalid",
        );
        await expect(page.locator(".question-review")).toContainText(
          t("حضور الفعالية فقط"),
        );
        await page.screenshot({
          path: `tmp/verification/questions-${viewport.width}.png`,
        });
      }
    }
    await scene(page, "welcome", t("الدعوة"));
    await page.screenshot({
      path: `tmp/verification/cinematic-${viewport.width}.png`,
    });
  }
  expect(registrationRequests).toBe(0);
  expect(errors).toEqual([]);
  if (failures.length)
    console.error("LAYOUT FAILURES", JSON.stringify(failures, null, 2));
  expect(
    failures,
    "Every scene, tab, agenda page, and question must fit without document or main scrolling",
  ).toEqual([]);
  console.log(
    `PASS: history, RTL keyboard, deep links, reduced motion, 6 scenes, all experience/location tabs, all ${agenda.length} agenda items, 3 workshop details, 7 questions, explicit single/none workshop selection, retained draft, and no viewport scrolling at 360x640, 390x844 and 1440x900.`,
  );
} finally {
  await browser.close();
}
