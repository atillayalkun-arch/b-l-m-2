// Windows / Mac / Linux: kaldığı yerden devam eden paralel render.
// Kullanım: node engine/render_all.mjs s01 [--jobs 4] [--gpu]
//   --jobs N : aynı anda kaç parça (her biri ~0,7–1 GB RAM). Varsayılan: boş RAM'e göre otomatik, en fazla 6.
//   --gpu    : ekran kartıyla render (NVIDIA/AMD/Intel). Açılamazsa normal moda döner.
import { spawn, execFileSync } from "node:child_process";
import { build } from "esbuild";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "out");
const id = process.argv[2] || "s01";
const SEG = 300;
const ji = process.argv.indexOf("--jobs");
const autoJobs = Math.min(Math.floor(os.cpus().length / 2), Math.floor(os.freemem() / 2 ** 30 / 0.9), 6);
const JOBS = Math.max(1, ji > 0 ? Number(process.argv[ji + 1]) : autoJobs);
const GPU = process.argv.includes("--gpu");
const extra = ["--nobuild", ...(GPU ? ["--gpu"] : [])];
fs.mkdirSync(OUT, { recursive: true });

// bundle bir kez derlenir (paralel işler aynı dosyayı aynı anda yazmasın)
await build({ entryPoints: [path.join(ROOT, "engine/entry.ts")], bundle: true, outfile: path.join(OUT, "bundle.js"), format: "iife", target: "chrome120", loader: { ".json": "json" }, logLevel: "warning" });
// bölüm süresini öğren (tek kare still render ederek değil, bundle'dan)
const dur = Number(execFileSync("node", [path.join(ROOT, "engine/render.mjs"), id, "--meta", "--nobuild"], { cwd: ROOT }).toString().trim().split("\n").pop());
const N = Math.ceil(dur * 30);
const segs = [];
for (let f = 0; f < N; f += SEG) segs.push(f);
console.log(`${id}: ${N} kare, ${segs.length} parça, ${JOBS} paralel iş, GPU: ${GPU ? "açık" : "kapalı"}  (boş RAM ${(os.freemem() / 2 ** 30).toFixed(1)} GB)`);
if (GPU) execFileSync("node", [path.join(ROOT, "engine/render.mjs"), id, "--gpuinfo", ...extra], { cwd: ROOT, stdio: "inherit" });

let done = 0;
const t0 = Date.now();
async function worker() {
  while (segs.length) {
    const f = segs.shift();
    const ok = path.join(OUT, `${id}_seg_${String(f).padStart(5, "0")}.mp4.ok`);
    if (!fs.existsSync(ok)) {
      await new Promise((res, rej) => {
        const p = spawn("node", [path.join(ROOT, "engine/render.mjs"), id, "--range", `${f},${f + SEG}`, ...extra], { cwd: ROOT, stdio: ["ignore", "ignore", "inherit"] });
        p.on("close", (c) => (c === 0 ? res() : rej(new Error("parça hatası " + f))));
      });
      fs.writeFileSync(ok, "1");
    }
    done++;
    console.log(`parça ${done}/${Math.ceil(N / SEG)}  (${((Date.now() - t0) / 60000).toFixed(1)} dk)`);
  }
}
await Promise.all(Array.from({ length: JOBS }, worker));

const list = fs.readdirSync(OUT).filter((f) => f.startsWith(`${id}_seg_`) && f.endsWith(".mp4")).sort();
fs.writeFileSync(path.join(OUT, `${id}_list.txt`), list.map((f) => `file '${f}'`).join("\n"));
execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", path.join(OUT, `${id}_list.txt`), "-c", "copy", path.join(OUT, `${id}_video.mp4`)], { stdio: "inherit" });
execFileSync("node", [path.join(ROOT, "engine/render.mjs"), id, "--audio-only", "--nobuild"], { cwd: ROOT, stdio: "inherit" });
for (const f of list) { fs.unlinkSync(path.join(OUT, f)); fs.rmSync(path.join(OUT, f + ".ok"), { force: true }); }
console.log(`BİTTİ → out/${id}.mp4`);
