import { test } from "node:test";
import assert from "node:assert/strict";
import { ticketEmail } from "../src/lib/ticket-email";
import { selectedWorkshop, type WorkshopId } from "../src/lib/workshops";
import type { Registration } from "../src/lib/db";

const urls: Record<WorkshopId, string> = {
  digital: "https://forms.gle/6tieMndiVakSni1o8",
  kitchens:
    "https://docs.google.com/forms/d/e/1FAIpQLScSl_3X2OnsCVkTo8nBeqqmUt2eI7PZ2xlUv70ZZCPWXDqRCg/viewform?pli=1",
  "food-safety":
    "https://docs.google.com/forms/d/e/1FAIpQLSdEvIOFyUXG10_0Pq5o5QaiKWTdppr3U72uqIVy0gLF_j7XGQ/viewform",
};
const fixture = (
  id: WorkshopId | null,
  locale: "ar" | "en",
  cancelled = false,
): Registration => ({
  id: 1,
  full_name: "زائر الاختبار",
  email: "preview@example.invalid",
  phone: "0501234567",
  company: "",
  job_title: "",
  age_group: "26–35",
  workshop_id: id,
  locale,
  registration_number: "EVT-TEST",
  secure_token: "a".repeat(64),
  status: cancelled ? "CANCELLED" : "REGISTERED",
  created_at: "2026-09-28",
  checked_in_at: null,
  checked_in_by: null,
});

test("each workshop uses the organiser's exact form URL", () => {
  for (const [id, url] of Object.entries(urls)) {
    assert.equal(selectedWorkshop(id as WorkshopId)?.formUrl, url);
  }
  assert.equal(selectedWorkshop(null), null);
});

for (const locale of ["ar", "en"] as const) {
  test(`${locale}: email requires submitting the selected form and includes no other workshop form`, () => {
    for (const [id, url] of Object.entries(urls)) {
      const message = ticketEmail(
        fixture(id as WorkshopId, locale),
        "https://example.test/makkah",
      );
      assert.ok(message.html.includes(`href="${url}"`));
      assert.ok(message.text.includes(url));
      assert.ok(
        message.html.includes(
          locale === "ar"
            ? "يجب تعبئة نموذجها وإرساله"
            : "must complete and submit its form",
        ),
      );
      for (const other of Object.values(urls).filter((item) => item !== url)) {
        assert.ok(!message.html.includes(other));
        assert.ok(!message.text.includes(other));
      }
      assert.ok(message.html.includes("https://example.test/makkah/ticket/"));
    }
  });
}

test("no workshop or a cancelled registration gets no workshop form call to action", () => {
  for (const registration of [
    fixture(null, "ar"),
    fixture("digital", "en", true),
  ]) {
    const message = ticketEmail(registration, "https://example.test/makkah");
    for (const url of Object.values(urls)) {
      assert.ok(!message.html.includes(url));
      assert.ok(!message.text.includes(url));
    }
  }
});
