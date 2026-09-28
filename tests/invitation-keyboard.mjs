import { chromium, expect } from "@playwright/test";
const base = process.env.APP_URL || "http://localhost:3000";
const browser = await chromium.launch({ channel: "chrome", headless: true });
try {
  const page = await browser.newPage({
    locale: "ar-SA",
    viewport: { width: 390, height: 844 },
    reducedMotion: "reduce",
  });
  await page.addInitScript(() => {
    Object.defineProperty(window.visualViewport, "height", {
      configurable: true,
      get: () => window.__visibleHeight || window.innerHeight,
    });
  });
  await page.goto(base + "/#register");
  await page.getByRole("button", { name: "تجاوز المقدمة", exact: true }).click();
  await expect(page.locator(".scene-register")).toHaveCSS("opacity", "1");
  const simulate = async (name, height) => {
    await page.locator(`input[name="${name}"]`).focus();
    await page.evaluate((h) => {
      window.__visibleHeight = h;
      window.visualViewport.dispatchEvent(new Event("resize"));
    }, height);
    await expect(page.locator(".cinematic-invitation")).toHaveAttribute(
      "data-keyboard",
      "true",
    );
    const content = await page
      .locator(
        ".question-field input,.question-heading h3,.question-next,.question-back",
      )
      .evaluateAll((nodes) =>
        nodes.map((el) => {
          const r = el.getBoundingClientRect();
          return {
            name: el.getAttribute("name") || el.className,
            top: r.top,
            bottom: r.bottom,
            hidden: !el.getClientRects().length,
          };
        }),
      );
    for (const node of content) {
      if (node.hidden) continue;
      expect(node.top, node.name).toBeGreaterThanOrEqual(0);
      expect(node.bottom, node.name).toBeLessThanOrEqual(height);
    }
    await expect(page.locator(`input[name="${name}"]`)).toBeFocused();
  };
  await simulate("full_name", 440);
  await page.screenshot({ path: "tmp/verification/keyboard-name.png" });
  await page
    .locator('input[name="full_name"]')
    .fill("زائر اختبار لوحة المفاتيح");
  const next = async (n) => {
    await page.evaluate(() => {
      window.__visibleHeight = 0;
      window.visualViewport.dispatchEvent(new Event("resize"));
    });
    await page.locator(".question-next").click();
    await expect(page.locator(`.question-stage-${n}`)).toHaveCSS(
      "opacity",
      "1",
    );
  };
  await next(1);
  await page.locator('input[name="email"]').fill("keyboard@example.invalid");
  await next(2);
  await page.locator('input[name="phone"]').fill("0501234567");
  await next(3);
  await page
    .locator('label:has(input[name="age_group"][value="26–35"])')
    .click();
  await next(4);
  await page
    .locator('label:has(input[name="workshop_id"][value="none"])')
    .click();
  await next(5);
  await simulate("company", 360);
  await page.screenshot({ path: "tmp/verification/keyboard-company.png" });
  console.log(
    "PASS: simulated visual viewport keyboard at 440/360px keeps text fields and controls visible and focused.",
  );
} finally {
  await browser.close();
}
