import { chromium } from "playwright-core";
const b = await chromium.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe" });
for (const w of [1440, 390]) {
  const p = await b.newPage({ viewport: { width: w, height: w === 390 ? 844 : 900 } });
  await p.goto("http://localhost:4500", { waitUntil: "networkidle" });
  const seq = [];
  for (let i = 0; i < 14; i++) {
    await p.keyboard.press("Tab");
    seq.push(await p.evaluate(() => {
      const a = document.activeElement;
      if (!a || a === document.body) return "(body)";
      const r = a.getBoundingClientRect();
      const st = getComputedStyle(a);
      return `${a.tagName.toLowerCase()}:${(a.textContent || "").trim().slice(0, 34)} | outline=${st.outlineWidth} vis=${r.width > 0 && r.height > 0}`;
    }));
  }
  console.log(`--- ${w}px ---`);
  seq.forEach((s, i) => console.log(` ${i + 1}. ${s}`));
  // headings outline
  const h = await p.evaluate(() => [...document.querySelectorAll("h1,h2,h3")].map(e => e.tagName + " " + e.textContent.trim().slice(0, 40)));
  if (w === 1440) console.log("headings:\n  " + h.join("\n  "));
  const overflow = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  console.log("horizontal overflow:", overflow);
  await p.close();
}
await b.close();
