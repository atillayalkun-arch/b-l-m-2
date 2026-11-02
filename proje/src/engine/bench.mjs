// Kare başına çizim süresi ölçümü: node engine/bench.mjs
import { chromium } from "playwright";
import fs from "fs";
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
await p.setContent(`<html><body><script>${fs.readFileSync("out/bundle.js", "utf8")}</script></body></html>`);
await p.evaluate(() => window.__init("s01"));
for (const t0 of [10, 30, 60, 80, 100]) {
  const s = Date.now();
  await p.evaluate((t) => window.__frames(Array.from({ length: 10 }, (_, i) => t + i / 30), 0.93), t0);
  console.log(t0, ((Date.now() - s) / 10).toFixed(0) + "ms/frame");
}
await b.close();
