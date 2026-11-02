// Kullanım:
//   node engine/render.mjs s01                 → out/s01.mp4 (sesli)
//   node engine/render.mjs s01 --stills 5,40.2  → out/stills/s01_5.00.png ...
import { build } from "esbuild";
import { chromium } from "playwright";
import { spawn, execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const id = process.argv[2] || "s01";
const si = process.argv.indexOf("--stills");
const stills = si > 0 ? process.argv[si + 1].split(",").map(Number) : null;
const ri = process.argv.indexOf("--range");
const range = ri > 0 ? process.argv[ri + 1].split(",").map(Number) : null;
const ai = process.argv.indexOf("--audio-only");
const FPS = 30;
const OUT = path.join(ROOT, "out");
fs.mkdirSync(OUT, { recursive: true });

const GPU = process.argv.includes("--gpu");
if (!process.argv.includes("--nobuild")) await build({ entryPoints: [path.join(ROOT, "engine/entry.ts")], bundle: true, outfile: path.join(OUT, "bundle.js"), format: "iife", target: "chrome120", loader: { ".json": "json" }, logLevel: "warning" });

// --gpu: tarayıcıyı ekran kartıyla başlat (Windows: D3D11/ANGLE). Açılamazsa normal moda döner.
const GPU_ARGS = ["--enable-gpu", "--ignore-gpu-blocklist", "--enable-gpu-rasterization", "--enable-accelerated-2d-canvas",
  ...(process.platform === "win32" ? ["--use-angle=d3d11"] : process.platform === "darwin" ? ["--use-angle=metal"] : ["--use-gl=angle"])];
let browser;
if (GPU) {
  try { browser = await chromium.launch({ channel: "chromium", args: GPU_ARGS }); }
  catch (e) { console.error("GPU modu açılamadı, normal moda geçiliyor:", String(e).split("\n")[0]); }
}
if (!browser) browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
page.on("pageerror", (e) => console.error("PAGE ERROR", e));
await page.setContent(`<html><body style="margin:0;background:#000"><script>${fs.readFileSync(path.join(OUT, "bundle.js"), "utf8")}</script></body></html>`);
const meta = await page.evaluate((i) => window.__init(i), id);
if (process.argv.includes("--gpuinfo")) {
  const r = await page.evaluate(() => { const g = document.createElement("canvas").getContext("webgl"); if (!g) return "WebGL yok (GPU kullanılmıyor)"; const d = g.getExtension("WEBGL_debug_renderer_info"); return d ? g.getParameter(d.UNMASKED_RENDERER_WEBGL) : g.getParameter(g.RENDERER); });
  console.log("Kullanılan grafik birimi:", r, /swiftshader|llvmpipe|software|WebGL yok/i.test(r) ? "→ GPU KULLANILMIYOR" : "→ GPU aktif");
  await browser.close(); process.exit(0);
}
if (process.argv.includes("--meta")) { console.log(meta.duration); await browser.close(); process.exit(0); }

if (stills) {
  const dir = path.join(OUT, "stills");
  fs.mkdirSync(dir, { recursive: true });
  const urls = await page.evaluate((ts) => window.__frames(ts, 0.92), stills);
  urls.forEach((u, k) => fs.writeFileSync(path.join(dir, `${id}_${stills[k].toFixed(2)}.jpg`), Buffer.from(u.split(",")[1], "base64")));
  console.log("stills:", stills.length);
  await browser.close();
  process.exit(0);
}

// ---- video ----
const N = Math.ceil(meta.duration * FPS);
const silent = path.join(OUT, `${id}_video.mp4`);
const F0 = range ? range[0] : 0, F1 = range ? Math.min(N, range[1]) : N;
const vout = range ? path.join(OUT, `${id}_seg_${String(F0).padStart(5, "0")}.mp4`) : silent;
if (ai < 0) {
const ff = spawn("ffmpeg", ["-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", String(FPS), "-c:v", "mjpeg", "-i", "-",
  "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-pix_fmt", "yuv420p", vout], { stdio: ["pipe", "inherit", "inherit"] });
const B = 30;
const t0 = Date.now();
for (let f = F0; f < F1; f += B) {
  const ts = [];
  for (let k = f; k < Math.min(F1, f + B); k++) ts.push(k / FPS);
  const urls = await page.evaluate((x) => window.__frames(x, 0.93), ts);
  for (const u of urls) {
    if (!ff.stdin.write(Buffer.from(u.split(",")[1], "base64"))) await new Promise((r) => ff.stdin.once("drain", r));
  }
  if ((f / B) % 20 === 0) process.stdout.write(`\r${f}/${N} (${((Date.now() - t0) / 1000).toFixed(0)}s)`);
}
ff.stdin.end();
await new Promise((r) => ff.on("close", r));
console.log("\nvideo ok");
}
await browser.close();
if (range) process.exit(0);

// ---- ses: efektler + seslendirme ----
const cuesFile = path.join(OUT, `${id}_cues.json`);
fs.writeFileSync(cuesFile, JSON.stringify({ duration: meta.duration, cues: meta.cues }));
const sfx = path.join(OUT, `${id}_sfx.wav`);
const PY = findPython();
console.log("python:", PY.cmd, PY.pre.join(" "), "→", PY.exe);
execFileSync(PY.cmd, [...PY.pre, "-I", path.join(ROOT, "engine/sfx.py"), cuesFile, sfx], { stdio: "inherit" });

const args = ["-y", "-loglevel", "error"];
meta.parts.forEach((p) => args.push("-i", path.join(ROOT, "audio", p.audio)));
args.push("-i", sfx, "-i", silent);
const nv = meta.parts.length;
let fc = "";
meta.parts.forEach((p, i) => { const ms = Math.round(p.at * 1000); fc += `[${i}:a]aformat=sample_rates=48000:channel_layouts=stereo,adelay=${ms}|${ms}[v${i}];`; });
fc += meta.parts.map((_, i) => `[v${i}]`).join("") + `amix=inputs=${nv}:normalize=0,apad=whole_dur=${meta.duration}[voice];`;
fc += `[voice]asplit=2[vo][sc];`;
// efektler konuşma sırasında otomatik kısılır (sidechain)
fc += `[${nv}:a]aformat=sample_rates=48000:channel_layouts=stereo[fx];[fx][sc]sidechaincompress=threshold=0.02:ratio=6:attack=15:release=350[fxd];`;
fc += `[vo][fxd]amix=inputs=2:normalize=0,alimiter=limit=0.95,atrim=0:${meta.duration}[a]`;
args.push("-filter_complex", fc, "-map", `${nv + 1}:v`, "-map", "[a]", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-shortest", path.join(OUT, `${id}.mp4`));
execFileSync("ffmpeg", args, { stdio: "inherit" });
console.log("done:", path.join(OUT, `${id}.mp4`));

// Python seçimi: PYTHON ortam değişkeni > Windows'ta "py -3" başlatıcısı > python > python3.
// Başka araçların (hermes vb.) venv Python'ları atlanır; numpy+scipy olan sistem Python'u seçilir.
function findPython() {
  const cands = [];
  if (process.env.PYTHON) cands.push({ cmd: process.env.PYTHON, pre: [], forced: true });
  if (process.platform === "win32") cands.push({ cmd: "py", pre: ["-3"] }, { cmd: "py", pre: [] });
  cands.push({ cmd: "python", pre: [] }, { cmd: "python3", pre: [] });
  const probe = "import sys,numpy,scipy;print(sys.executable);print(int(sys.prefix!=sys.base_prefix))";
  const bad = /hermes|[\\/]\.?venv[\\/]|[\\/]virtualenvs?[\\/]|[\\/]envs[\\/]/i;
  const tried = [];
  for (const c of cands) {
    try {
      const [exe, isVenv] = execFileSync(c.cmd, [...c.pre, "-I", "-c", probe], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim().split(/\r?\n/);
      if (!c.forced && (isVenv === "1" || bad.test(exe))) { tried.push(`${c.cmd}: venv atlandı (${exe})`); continue; }
      return { ...c, exe };
    } catch { tried.push(`${c.cmd} ${c.pre.join(" ")}: yok veya numpy/scipy eksik`); }
  }
  throw new Error("Uygun Python bulunamadı (numpy+scipy gerekli). Denenenler:\n  " + tried.join("\n  ") + "\nÇözüm: py -m pip install numpy scipy  veya  PYTHON=C:\\yol\\python.exe");
}
