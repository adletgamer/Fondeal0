// Targeted screenshots at exact scroll positions (the harness only walks acts).
import { chromium } from "playwright-core";

const url = process.argv[2] || "http://localhost:4500";
const out = process.argv[3] || "lab/peek";
const width = Number(process.argv[4] || 1440);
const height = Number(process.argv[5] || 900);
const spec = (process.argv[6] || "").split(",").filter(Boolean); // sel:Name or y:1234:Name

const browser = await chromium.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  args: ["--disable-features=PointerLock"],
});
const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
await page.goto(url, { waitUntil: "networkidle" });
await page.waitForTimeout(600);

for (const s of spec) {
  const [kind, val, name] = s.split(":");
  if (kind === "sel") {
    await page.evaluate((v) => {
      const el = document.querySelector(v);
      el.scrollIntoView({ block: "start", behavior: "instant" });
    }, val);
  } else {
    await page.evaluate((y) => window.scrollTo(0, Number(y)), val);
  }
  await page.waitForTimeout(900);
  const label = name || (kind + "-" + val);
  await page.screenshot({ path: `${out}/${label}.png` });
  const info = await page.evaluate(() => ({
    y: Math.round(scrollY),
    p4: getComputedStyle(document.getElementById("ch4")).getPropertyValue("--sc-p").trim(),
    filed: document.getElementById("stub-n")?.textContent,
    bound: document.querySelectorAll("#bind-plate .row-field.is-bound").length,
  }));
  console.log(label, JSON.stringify(info));
}
await browser.close();
