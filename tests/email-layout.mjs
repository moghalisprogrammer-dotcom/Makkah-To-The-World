import {chromium, expect} from "@playwright/test";
import {ticketEmail} from "../src/lib/ticket-email.ts";
import {readFile,mkdir} from "node:fs/promises";
import QRCode from "qrcode";
await mkdir("tmp/verification",{recursive:true});
const browser = await chromium.launch({channel:"chrome",headless:true});
try{
 const page=await browser.newPage({viewport:{width:390,height:844}});
 const qr=await QRCode.toDataURL("e".repeat(64));
 const seal="data:image/webp;base64,"+(await readFile("public/images/college-seal.webp")).toString("base64");
 const kaizen="data:image/webp;base64,"+(await readFile("public/images/kaizen-logo.webp")).toString("base64");
 for(const locale of ["ar","en"]){
  const message=ticketEmail({locale,full_name:locale==="ar"?"نورة أحمد — معاينة البريد":"Alex Jordan — Email preview",email:"event-preview@example.invalid",phone:"0501234567",company:"Tourism & Hospitality",job_title:"Guest",age_group:"26–35",workshop_id:"digital",registration_number:"EVT-PREVIEW",secure_token:"e".repeat(64)},"http://localhost:3000");
  await page.setContent(message.html.replaceAll("cid:ticket-qr",qr).replaceAll("cid:college-seal",seal).replaceAll("cid:kaizen-logo",kaizen));
  await page.screenshot({path:`tmp/verification/email-${locale}-mobile.png`});
  await page.locator('a[href*="maps.app.goo.gl"]').last().scrollIntoViewIfNeeded();
  await page.screenshot({path:`tmp/verification/email-${locale}-details.png`});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await expect(page.locator('a[href="https://www.mnc.edu.sa"]')).toBeVisible();
  for(const image of await page.locator("img").all())expect(await image.evaluate(img=>img.complete&&img.naturalWidth>0)).toBe(true);
 }
 console.log("PASS: Arabic and English email images and content fit 390px; map, college website and calendar links are present.");
}finally{await browser.close();}
