// s04 思い出せるもの — ses 8, 9  (s02/s03 yapısı: SCENES + lens + cues)
// Yeni ortak parçalar: components/memory.ts (drawerCabinet, nameChip, balanceScale, dustPuff).
import { Section, Part, Cue, W, H, clamp, ease, prog, win, lerp, rnd, speaking } from "../engine/core";
import { C, font, lightPool, lightCone, fadeBlack, rr, dust, boardGrid } from "../design/style";
import { lens, LENS, cam, dof, Lens, bokeh } from "../design/grade";
import { envLab, envNightRoom } from "../design/env";
import { flame, smoke, sparks, flashPop, whipStreaks } from "../design/fx";
import { drawMascot } from "../characters/mascot";
import { drawPerson } from "../characters/people";
import { mug, plant, wallClock, extinguisher } from "../characters/props";
import { sectionTitle, screenCard, sourceCard, boardLabel, memoryCard } from "../components/cards";
import { drawerCabinet, nameChip, balanceScale, dustPuff } from "../components/memory";
import { drawSubtitles } from "../components/subtitle";
import t8 from "../timing/8.json";
import t9 from "../timing/9.json";

const P8: Part = { timing: t8 as any, at: 3.4 };
const P9: Part = { timing: t9 as any, at: 49.4 };
const parts = [P8, P9];
const END = 86.8;
const g8 = (l: number) => P8.at + l;
const g9 = (l: number) => P9.at + l;
const CARD_A = g8(42.4), CARD_B = g9(-0.25); // 利用可能性ヒューリスティック kartı
type Ctx = CanvasRenderingContext2D;

function layer(ctx: Ctx, a: number, fn: () => void) {
  if (a <= 0.001) return;
  ctx.save(); ctx.globalAlpha *= clamp(a); fn(); ctx.restore();
}
const breathe = (t: number, i = 0) => Math.sin(t * 1.6 + i * 1.3) * 2;
/** Damga: ölçekle vurup oturur */
function stamp(c: Ctx, x: number, y: number, txt: string, k: number, col: string, rot = -0.12, size = 54) {
  if (k <= 0) return;
  const s = lerp(2.2, 1, ease.out(clamp(k * 1.6)));
  c.save(); c.translate(x, y); c.rotate(rot); c.scale(s, s); c.globalAlpha *= clamp(k * 2.5);
  c.font = font(800, size, true);
  const w = c.measureText(txt).width + 44;
  c.strokeStyle = col; c.lineWidth = 5; rr(c, -w / 2, -size * 0.85, w, size * 1.35, 10); c.stroke();
  c.lineWidth = 2; rr(c, -w / 2 + 7, -size * 0.85 + 7, w - 14, size * 1.35 - 14, 6); c.stroke();
  c.fillStyle = col; c.textAlign = "center"; c.fillText(txt, 0, size * 0.32);
  c.restore();
}
function bubble(c: Ctx, x: number, y: number, txt: string, k: number, hot = false, size = 38) {
  if (k <= 0) return;
  const sc = lerp(0.6, 1, ease.back(clamp(k)));
  c.save(); c.translate(x, y); c.scale(sc, sc); c.globalAlpha *= clamp(k * 1.5);
  c.font = font(600, size);
  const w = c.measureText(txt).width + 60;
  c.fillStyle = hot ? "rgba(40,34,12,0.92)" : "rgba(16,20,28,0.9)";
  rr(c, -w / 2, -44, w, 76, 38); c.fill();
  c.beginPath(); c.moveTo(-18, 30); c.lineTo(-34, 62); c.lineTo(8, 30); c.fill();
  c.strokeStyle = hot ? "rgba(242,207,58,0.85)" : "rgba(140,151,168,0.6)"; c.lineWidth = 2.5; rr(c, -w / 2, -44, w, 76, 38); c.stroke();
  c.fillStyle = hot ? C.yellow : C.text; c.textAlign = "center"; c.fillText(txt, 0, 8);
  c.restore();
}
/** Sarı tik */
function check(c: Ctx, x: number, y: number, k: number, s = 1) {
  if (k <= 0) return;
  c.save(); c.translate(x, y); c.scale(s, s);
  c.strokeStyle = C.yellow; c.lineWidth = 9; c.lineCap = "round"; c.lineJoin = "round";
  c.shadowColor = "rgba(242,207,58,0.7)"; c.shadowBlur = 16;
  const e = ease.out(clamp(k));
  c.beginPath(); c.moveTo(-26, 0);
  if (e < 0.4) c.lineTo(lerp(-26, -6, e / 0.4), lerp(0, 20, e / 0.4));
  else { c.lineTo(-6, 20); c.lineTo(lerp(-6, 34, (e - 0.4) / 0.6), lerp(20, -26, (e - 0.4) / 0.6)); }
  c.stroke(); c.restore();
}
/** Sallanan çıplak ampul (ikincil hareket) */
function bulb(c: Ctx, t: number, x: number, y: number, len: number, on = 1, amp = 0.05) {
  const a = Math.sin(t * 1.3) * amp;
  const bx = x + Math.sin(a) * len, by = y + Math.cos(a) * len;
  c.strokeStyle = "#16181C"; c.lineWidth = 3; c.beginPath(); c.moveTo(x, y); c.lineTo(bx, by); c.stroke();
  c.fillStyle = "#2A2D33"; c.fillRect(bx - 12, by - 6, 24, 22);
  c.fillStyle = `rgba(255,${200 + 30 * on},${140 + 40 * on},${0.4 + 0.6 * on})`; c.beginPath(); c.arc(bx, by + 34, 22, 0, Math.PI * 2); c.fill();
  lightPool(c, bx, by + 34, 160, "rgba(255,214,150,", 0.35 * on);
  return { x: bx, y: by + 34 };
}

const LENS_MEM: Lens = { shadow: "rgba(18,46,62,0.34)", high: "rgba(255,190,110,0.12)", bloom: 0.7, ca: 1.0, vig: 0.78, grain: 0.065, exposure: 1.0, sat: 0.9 };
const LENS_HOT: Lens = { shadow: "rgba(16,48,62,0.32)", high: "rgba(255,140,70,0.14)", bloom: 0.8, ca: 1.2, vig: 0.76, grain: 0.065, exposure: 1.02, sat: 0.95 };

// ================= Arşiv odası (hafıza mekânı) — ortak set =================
function envArchive(c: Ctx, t: number, blurBg = 4, pan = 0) {
  const wg = c.createLinearGradient(0, -200, 0, 760);
  wg.addColorStop(0, "#0E1218"); wg.addColorStop(1, "#1A1F27");
  c.fillStyle = wg; c.fillRect(-600, -400, W + 1200, 1160);
  dof(c, blurBg, () => {
    // arka duvar boyu raflar: dosya kutuları
    for (let sx = -2; sx < 8; sx++) {
      const x0 = -400 + sx * 330 + pan * 0.4;
      c.fillStyle = "#231A12"; c.fillRect(x0, 40, 300, 640);
      for (let r = 0; r < 5; r++) {
        c.fillStyle = "#140E09"; c.fillRect(x0 + 10, 56 + r * 124, 280, 110);
        for (let k = 0; k < 7; k++) {
          const sh = rnd(sx * 40 + r * 7 + k, 3);
          c.fillStyle = ["#6B5A44", "#4E5A66", "#7A6A50", "#3E4650", "#8A7A5E"][Math.floor(sh * 5)];
          const bw = 30 + sh * 12;
          c.fillRect(x0 + 16 + k * 39, 70 + r * 124 + sh * 14, bw, 92 - sh * 14);
          c.fillStyle = "rgba(230,222,200,0.55)"; c.fillRect(x0 + 22 + k * 39, 90 + r * 124 + sh * 14, bw - 12, 10);
        }
      }
    }
    bokeh(c, t, 10, 80, 600, 140, 0.12);
  });
  // zemin
  const fg = c.createLinearGradient(0, 680, 0, H + 200);
  fg.addColorStop(0, "#221C17"); fg.addColorStop(1, "#110E0C");
  c.fillStyle = fg; c.fillRect(-600, 680, W + 1200, 800);
  c.strokeStyle = "rgba(255,230,200,0.035)"; c.lineWidth = 2;
  for (let i = -14; i < 30; i++) { c.beginPath(); c.moveTo(W / 2 + i * 120 + pan * 0.8, 680); c.lineTo(W / 2 + i * 330 + pan * 1.2, H + 300); c.stroke(); }
}

const HELP = ["システム障害", "締切前夜", "クレーム対応", "急な欠員", "納品ミス"];

// ================= A: 「助かった」を思い浮かべて — maskot izleyiciye =================
function sceneAsk(c: Ctx, t: number) {
  const l = t - P8.at;
  const k = ease.inOut(prog(l, -0.6, 6.6));
  const rise = ease.out(prog(l, 1.7, 3.4));
  c.save();
  cam(c, t, lerp(1.0, 1.12, k), lerp(40, -60, k), lerp(20, -10, k), 0.6, 960, 600);
  envArchive(c, t, 5, -l * 6);
  // takvim: 半年 — sayfalar çevrilir (0.22–1.6)
  c.save(); c.translate(1500, 230);
  c.fillStyle = "#1A1C20"; c.fillRect(-4, -110, 8, 20);
  c.fillStyle = "#E3DDCC"; rr(c, -110, -90, 220, 250, 6); c.fill();
  c.fillStyle = "#8A3A30"; c.fillRect(-110, -90, 220, 52);
  const flips = Math.floor(clamp(prog(l, 0.2, 1.7)) * 6);
  const ph = (clamp(prog(l, 0.2, 1.7)) * 6) % 1;
  c.fillStyle = "#F4F0E4"; c.font = font(700, 30); c.textAlign = "center"; c.fillText(`${((4 + flips) % 12) + 1}月`, 0, -52);
  c.fillStyle = "#3A3D44"; for (let r = 0; r < 5; r++) for (let q = 0; q < 7; q++) c.fillRect(-92 + q * 27, -22 + r * 34, 16, 14);
  if (l > 0.2 && l < 1.7) { c.save(); c.scale(1, 1 - ph); c.fillStyle = "#D4CDBA"; rr(c, -110, -90, 220, 250, 6); c.fill(); c.restore(); }
  c.restore();
  layer(c, win(l, 0.2, 5.6, 0.4), () => { c.font = font(600, 26); c.fillStyle = C.mist; c.textAlign = "center"; c.fillText("この半年", 1500, 420); });
  // sallanan ampul
  bulb(c, t, 780, -60, 300, 0.9 + 0.1 * Math.sin(t * 7) * Math.sin(t * 2.3));
  // kahve, bitki: set objeleri
  plant(c, t, 260, 760, 1.2);
  c.fillStyle = "#3A2A1C"; c.fillRect(1200, 760, 520, 22); c.fillStyle = "#24190F"; c.fillRect(1220, 782, 18, 200); c.fillRect(1682, 782, 18, 200);
  mug(c, t, 1300, 760, 1.0, 1);
  // anı kartları yükselir (助かった) — hepsi olaylı, parlak
  HELP.forEach((lb, i) => {
    const d = ease.out(prog(l, 1.7 + i * 0.22, 2.7 + i * 0.22));
    if (d <= 0) return;
    const ang = -2.4 + i * 0.6 + Math.sin(t * 0.4 + i) * 0.05;
    const rx = 960 + Math.cos(ang) * 520 * (0.5 + 0.5 * rise), ry = 520 + Math.sin(ang) * 300 * (0.5 + 0.5 * rise) - (1 - d) * 120 + Math.sin(t * 1.1 + i) * 8;
    memoryCard(c, rx, ry, 0.85, { label: lb, glow: 0.8 * d, rot: Math.sin(t * 0.7 + i) * 0.06, alpha: d, who: i % 2 ? "A" : "none" });
  });
  // maskot: izleyiciye döner
  const turn = ease.inOut(prog(l, -0.3, 0.9));
  drawMascot(c, 960, 1060, 0.86, { mouth: speaking(parts, t), lookX: lerp(0.8, 0, turn), lookY: 0.1, armR: 0.25 + 0.5 * win(l, 1.7, 5.4, 0.5), armL: 0.15, rim: 1, light: 1, tilt: Math.sin(t * 1.1) * 0.012, brow: 0.3 * win(l, 4.2, 6.2, 0.4) });
  c.restore();
  // ön plan: bulanık kart kenarları (parallax)
  dof(c, 9, () => {
    memoryCard(c, 150 - l * 14, 980, 1.6, { glow: 0.3, rot: 0.2, alpha: 0.8 });
    memoryCard(c, 1830 - l * 22, 120, 1.4, { glow: 0.2, rot: -0.3, alpha: 0.6 });
  });
  layer(c, ease.out(prog(l, 1.7, 2.4)) * (1 - prog(l, 5.8, 6.4)), () => {
    c.font = font(700, 64, true); c.fillStyle = C.yellow; c.textAlign = "center"; c.shadowColor = "rgba(242,207,58,0.5)"; c.shadowBlur = 24;
    c.fillText("「助かった」", 960, 150); c.shadowBlur = 0;
  });
}

// ================= B: 何かが起きて、誰かが解決した — kart yakın planları (rack focus) =================
const EV = [
  { x: 520, y: 520, lb: "システム障害", who: "A" as const },
  { x: 1000, y: 470, lb: "締切前夜", who: "A" as const },
  { x: 1460, y: 540, lb: "クレーム対応", who: "none" as const },
];
function sceneEvent(c: Ctx, t: number) {
  const l = t - P8.at;
  const k = ease.inOut(prog(l, 6.0, 12.2));
  const focus = clamp(prog(l, 6.8, 11.0) * 3); // 0..3 odak kartı
  const ignite = win(l, 7.9, 9.6, 0.25);
  c.save();
  cam(c, t, 1.18, lerp(380, -380, k), -20, 0.7, 960, 540);
  // masa yüzeyi (yakın plan)
  const tg = c.createLinearGradient(0, 200, 0, 1000);
  tg.addColorStop(0, "#2A1F16"); tg.addColorStop(1, "#140F0B");
  c.fillStyle = tg; c.fillRect(-800, -300, W + 1600, H + 600);
  c.strokeStyle = "rgba(0,0,0,0.25)"; for (let i = 0; i < 40; i++) { c.beginPath(); c.moveTo(-800, 100 + i * 26); c.bezierCurveTo(200, 110 + i * 26, 1200, 90 + i * 26, 2700, 104 + i * 26); c.stroke(); }
  lightPool(c, 1000, 480, 900, "rgba(255,210,150,", 0.18);
  EV.forEach((e, i) => {
    const dist = Math.abs(focus - (i + 0.5));
    dof(c, Math.min(12, dist * 7), () => {
      const hot = i === 0 ? ignite : 0;
      memoryCard(c, e.x, e.y + Math.sin(t + i) * 6, 1.7, { label: e.lb, glow: 0.7 + 0.3 * (1 - Math.min(1, dist)), rot: [-0.07, 0.04, -0.03][i], who: e.who });
      // kart içinde küçük olay: alev / saat / telefon
      c.save(); c.translate(e.x, e.y - 30); c.scale(1.7, 1.7);
      if (i === 0) { flame(c, t, 60, 30, 34, 60, 0.35 + 0.65 * hot, 2); sparks(c, t, 60, 10, hot, 3, 10, 60); }
      if (i === 1) wallClock(c, 64, -10, 20, 23.9 + Math.sin(t) * 0.01);
      if (i === 2) { c.fillStyle = "#1A1C20"; rr(c, 50, -20, 26, 44, 4); c.fill(); c.fillStyle = `rgba(120,200,255,${0.5 + 0.5 * Math.sin(t * 12)})`; c.fillRect(54, -15, 18, 30); }
      c.restore();
      // 解決 ✓
      check(c, e.x + 150, e.y - 120, prog(l, 9.54 + i * 0.28, 10.0 + i * 0.28), 1.3);
    });
  });
  c.restore();
  // alev ışığı yansıması
  layer(c, ignite * 0.5, () => { c.fillStyle = "rgba(226,96,58,0.18)"; c.fillRect(0, 0, W, H); });
  layer(c, win(l, 7.6, 11.6, 0.4), () => boardLabel(c, 140, 120, "起きた → 解決した", 1, C.yellow));
  dof(c, 10, () => memoryCard(c, 1700 - k * 600, 1000, 2.2, { glow: 0.2, rot: 0.15, alpha: 0.7 }));
}

// ================= C: 何も起きなかった日 — boş ve soluk kart =================
function sceneNothing(c: Ctx, t: number) {
  const l = t - P8.at;
  const wIn = 1 - ease.out(prog(l, 11.9, 12.5));
  const push = ease.inOut(prog(l, 12.2, 16.4));
  const fadeK = ease.inOut(prog(l, 13.6, 15.4));
  c.save();
  dof(c, wIn * 18, () => {
    c.save();
    cam(c, t, lerp(1.0, 1.35, push), wIn * -1600 + lerp(0, -40, push), lerp(0, 30, push), 0.4, 960, 560);
    envArchive(c, t, 6, -l * 3);
    // tek masa, tek lamba (soğuk)
    c.fillStyle = "#2A2017"; c.fillRect(420, 700, 1080, 26); c.fillStyle = "#18110B"; c.fillRect(450, 726, 22, 300); c.fillRect(1448, 726, 22, 300);
    lightCone(c, 960, -60, Math.PI / 2, 0.22, 900, 0.10, "190,205,230");
    lightPool(c, 960, 680, 380, "rgba(190,205,230,", 0.12);
    // boş kart: fotoğraf alanı boş, soluk, kenarları dağılır
    const fl = 0.85 + 0.15 * Math.sin(t * 17) * Math.sin(t * 5.3);
    memoryCard(c, 960, 590, 2.0, { label: "何も起きなかった日", glow: 0, fade: 0.4 + 0.6 * fadeK, alpha: (1 - 0.45 * fadeK) * fl });
    // dağılan parçacıklar
    for (let i = 0; i < 40; i++) {
      const s = (l - 13.0 - rnd(i, 4) * 2.5); if (s < 0) continue;
      const px = 720 + rnd(i, 5) * 480 + s * (30 + rnd(i, 6) * 60), py = 440 + rnd(i, 7) * 320 - s * (20 + rnd(i, 8) * 40);
      c.fillStyle = `rgba(200,196,186,${0.5 * (1 - clamp(s / 3))})`; c.fillRect(px, py, 5, 5);
    }
    // diğer kartlar kenarda: parlak, olaylı (kontrast)
    [[330, 360, 0], [1600, 330, 1], [1650, 640, 2]].forEach(([x, y, i]) => dof(c, 5, () => memoryCard(c, x, y + Math.sin(t + i) * 6, 1.0, { label: HELP[i], glow: 0.8, rot: (i - 1) * 0.1, who: i ? "A" : "none" })));
    c.restore();
  });
  c.restore();
  layer(c, ease.out(prog(l, 14.48, 15.1)) * (1 - prog(l, 16.2, 16.6)), () => bubble(c, 1420, 880, "……？", 1, false, 44));
  // maskot sağ alttan büyüteçle
  const mk = win(l, 13.2, 16.5, 0.5);
  if (mk > 0) drawMascot(c, lerp(2160, 1650, ease.out(mk)), 1130, 0.6, { mouth: speaking(parts, t), armR: 0.9, prop: "magnifier", lookX: -0.9, lookY: -0.1, rim: 1, brow: -0.3 });
}

// ================= D: 名前のリスト — deney odası =================
const MALE = ["佐藤 健一", "鈴木 誠", "高橋 翔", "田中 浩", "渡辺 亮", "伊藤 大輔", "山本 剛", "中村 悠", "小林 学", "加藤 隆", "吉田 拓", "山田 修", "佐々木 淳", "山口 豊", "松本 聡", "井上 実", "木村 徹", "林 和也", "清水 稔"];
const FEMALE = ["斎藤 恵", "山崎 彩", "森 由美", "池田 舞", "橋本 奈々", "阿部 真理", "石川 香", "前田 愛", "藤田 友美", "小川 優子", "岡田 沙織", "後藤 紀子", "長谷川 薫", "村上 綾", "近藤 千尋", "坂本 結衣", "遠藤 早苗", "青木 瞳", "藤井 智子", "西村 文"];
function sceneLab(c: Ctx, t: number) {
  const l = t - P8.at;
  const wIn = 1 - ease.out(prog(l, 16.0, 16.6));
  const k = ease.inOut(prog(l, 16.2, 24.8));
  const read = win(l, 18.4, 23.8, 0.3);
  c.save();
  dof(c, wIn * 18, () => {
    c.save();
    cam(c, t, lerp(1.06, 1.16, k), wIn * 1700 + lerp(80, -70, k), lerp(-10, 10, k), 0.6, 960, 600);
    envLab(c, t, 4);
    // okuyucu masası + mikrofon + kâğıt
    c.fillStyle = "#4A3424"; c.fillRect(780, 720, 520, 22); c.fillStyle = "#2A1D13"; c.fillRect(800, 742, 480, 140);
    drawPerson(c, 1040, 820, 1.0, { outfit: 1, pose: "desk", rim: 0.8, rimSide: -1, facing: -0.2, eye: 1, gazeX: -0.3, bob: breathe(t) * 0.5 });
    c.fillStyle = "#16181C"; c.fillRect(930, 640, 6, 80); c.beginPath(); c.arc(933, 632, 14, 0, Math.PI * 2); c.fill();
    c.fillStyle = `rgba(226,96,58,${0.5 + 0.5 * read})`; c.beginPath(); c.arc(1240, 700, 6, 0, Math.PI * 2); c.fill(); // REC
    c.save(); c.translate(1100, 712); c.rotate(-0.08); c.fillStyle = C.paper; c.fillRect(-60, -10, 120, 16); c.restore();
    // ses halkaları
    for (let i = 0; i < 4; i++) {
      const ph = ((t * 0.9 + i / 4) % 1);
      c.strokeStyle = `rgba(180,200,230,${0.35 * (1 - ph) * read})`; c.lineWidth = 3;
      c.beginPath(); c.arc(933, 632, 40 + ph * 260, Math.PI * 0.55, Math.PI * 1.45); c.stroke();
    }
    // isimler havada akar (okunan isim şeritleri dinleyicilere)
    for (let i = 0; i < 14; i++) {
      const s0 = 18.5 + i * 0.36; const p = prog(l, s0, s0 + 2.2);
      if (p <= 0 || p >= 1) continue;
      const fam = i % 2 === 0;
      const nm = fam ? MALE[i % MALE.length] : FEMALE[i % FEMALE.length];
      nameChip(c, lerp(880, 300 + (i % 3) * 120, ease.inOut(p)), lerp(600, 380 + (i % 4) * 40, ease.inOut(p)) - Math.sin(p * Math.PI) * 120, lerp(0.5, 0.8, p), { name: nm, famous: fam ? 0.7 : 0, dim: fam ? 0 : 0.4, alpha: Math.sin(p * Math.PI) * 1.4, rot: Math.sin(i + p * 3) * 0.1 });
    }
    c.restore();
  });
  // ön plan: dinleyiciler (sırtı dönük, DOF)
  dof(c, 5, () => {
    [[300, 3], [620, 5], [1560, 0]].forEach(([x, o], i) => drawPerson(c, x - k * 60 * (i + 1) + wIn * 1700, 1290, 1.7, { outfit: o, pose: "sit", rim: 0.5, rimSide: x < 960 ? 1 : -1, shade: 0.55, facing: x < 960 ? 0.4 : -0.4, bob: breathe(t, i) }));
  });
  c.restore();
  layer(c, ease.out(prog(l, 20.38, 20.9)) * (1 - prog(l, 24.2, 24.7)), () => boardLabel(c, 160, 160, "男性", 1, C.text));
  layer(c, ease.out(prog(l, 20.94, 21.4)) * (1 - prog(l, 24.2, 24.7)), () => boardLabel(c, 330, 160, "／  女性", 1, C.text));
  layer(c, (1 - prog(l, 24.2, 24.7)), () => bubble(c, 640, 760, "どちらが多かった？", prog(l, 22.7, 23.3), true, 40));
  layer(c, win(l, 16.4, 19.6, 0.4), () => boardLabel(c, 160, 100, "実験", 1, C.yellow));
}

// ================= E: リストの中身 — 19 有名人 vs 20 無名 =================
const famAt = (i: number) => 26.94 + i * 0.085;
const unkAt = (i: number) => 30.7 + i * 0.09;
function chipPos(col: number, i: number) {
  const cx = col === 0 ? 560 : 1360;
  return { x: cx + (i % 2 ? 125 : -125), y: 250 + Math.floor(i / 2) * 64 };
}
function sceneList(c: Ctx, t: number) {
  const l = t - P8.at;
  const k = ease.inOut(prog(l, 24.0, 34.6));
  const rack = ease.inOut(prog(l, 29.3, 30.4)); // odak sol → sağ
  c.save();
  cam(c, t, lerp(1.12, 1.0, k), lerp(240, -180, rack) * (1 - ease.inOut(prog(l, 33.0, 34.4))), lerp(60, 0, k), 0.35);
  c.fillStyle = C.bg; c.fillRect(-400, -400, W + 800, H + 800);
  boardGrid(c, 0.9);
  // iki sütun kağıdı
  for (const col of [0, 1]) {
    const cx = col === 0 ? 560 : 1360;
    const blur = col === 0 ? rack * 4 : (1 - rack) * 4;
    dof(c, blur, () => {
      c.fillStyle = "rgba(217,212,199,0.06)"; rr(c, cx - 330, 150, 660, 720, 12); c.fill();
      c.strokeStyle = "rgba(140,151,168,0.25)"; c.lineWidth = 2; rr(c, cx - 330, 150, 660, 720, 12); c.stroke();
      c.font = font(700, 40, true); c.textAlign = "center"; c.fillStyle = col ? C.mist : C.yellow;
      c.fillText(col ? "女性 ── 無名の人" : "男性 ── 有名人", cx - 80, 125);
      const n = col ? 20 : 19, names = col ? FEMALE : MALE;
      for (let i = 0; i < n; i++) {
        const a = ease.out(prog(l, col ? unkAt(i) : famAt(i), (col ? unkAt(i) : famAt(i)) + 0.35));
        const p = chipPos(col, i);
        nameChip(c, p.x, p.y + (1 - a) * 30, 0.95, { name: names[i], famous: col ? 0 : 1, dim: col ? 0.55 : 0, alpha: a, rot: (rnd(i, col) - 0.5) * 0.04 });
      }
    });
  }
  // sayaçlar
  const nf = Math.min(19, Math.floor(clamp(prog(l, 26.94, famAt(18) + 0.2)) * 19 + 0.001));
  const nu = Math.min(20, Math.floor(clamp(prog(l, 30.7, unkAt(19) + 0.2)) * 20 + 0.001));
  layer(c, ease.out(prog(l, 26.9, 27.4)), () => { c.font = font(800, 92, true); c.fillStyle = C.yellow; c.textAlign = "center"; c.shadowColor = "rgba(242,207,58,0.6)"; c.shadowBlur = 26; c.fillText(`${nf}人`, 860, 120); c.shadowBlur = 0; });
  layer(c, ease.out(prog(l, 30.6, 31.1)), () => { c.font = font(800, 92, true); c.fillStyle = C.text; c.textAlign = "center"; c.fillText(`${nu}人`, 1660, 120); });
  c.restore();
}

// ================= F: 「多かった」 — terazi yanlış tarafa =================
function sceneScale(c: Ctx, t: number) {
  const l = t - P8.at;
  const k = ease.inOut(prog(l, 33.8, 46.0));
  const vote = ease.out(prog(l, 37.1, 37.9));
  const truth = ease.out(prog(l, 40.0, 40.8));
  const tilt = 0.2 * ease.back(prog(l, 37.2, 38.4)) + Math.sin(t * 2.0) * 0.012;
  c.save();
  cam(c, t, lerp(0.96, 1.08, k), 0, lerp(-30, 20, k), 0.4, 960, 500);
  c.fillStyle = "#0D1117"; c.fillRect(-400, -400, W + 800, H + 800);
  boardGrid(c, 0.6);
  lightCone(c, 960, -100, Math.PI / 2, 0.35, 1100, 0.10);
  balanceScale(c, t, 960, 330, 0.92, tilt, {
    swing: 1, glowL: 0.6 + 0.4 * vote, glowR: 0,
    drawL: () => { for (let i = 0; i < 9; i++) nameChip(c, -60 + (i % 3) * 60, 40 - Math.floor(i / 3) * 34, 0.55, { name: MALE[i], famous: 1, rot: (rnd(i, 9) - 0.5) * 0.4 }); },
    drawR: () => { for (let i = 0; i < 10; i++) nameChip(c, -66 + (i % 3) * 60, 40 - Math.floor(i / 3) * 30, 0.55, { name: FEMALE[i], dim: 0.7, rot: (rnd(i, 19) - 0.5) * 0.4 }); },
  });
  boardLabel(c, 330, 250, "有名人 19", 1, C.yellow);
  boardLabel(c, 1420, 250, "無名 20", 1, C.mist);
  // ankete cevap verenler: alt sıra silüetler, eller kalkar
  for (let i = 0; i < 9; i++) {
    const x = 220 + i * 185, left = i !== 6;
    const up = left ? ease.out(prog(l, 36.9 + i * 0.07, 37.5 + i * 0.07)) : 0;
    drawPerson(c, x, 1180, 0.85, { outfit: i % 6, rim: 0.5, shade: 0.5, armUp: up * 0.95, facing: 0, eye: 1, gazeX: -0.3 });
    // oy kâğıdı: elden sol kefeye uçar
    const fly = ease.inOut(prog(l, 37.5 + i * 0.07, 38.3 + i * 0.07));
    if (left && up > 0 && fly < 1) {
      const bx = lerp(x, 960 - 423, fly), by = lerp(1180 - 260, 330 + 200, fly) - Math.sin(fly * Math.PI) * 160;
      c.save(); c.translate(bx, by); c.rotate(fly * 6 + i); c.fillStyle = C.yellow; c.fillRect(-16, -11, 32, 22); c.restore();
    }
  }
  layer(c, vote * (1 - truth * 0.4), () => { c.font = font(700, 60, true); c.fillStyle = C.yellow; c.textAlign = "center"; c.fillText("「多かった」", 380, 160); });
  // 実際には: 19 < 20 + 一人少ない
  layer(c, truth, () => {
    c.fillStyle = "rgba(8,10,14,0.65)"; rr(c, 660, 90, 600, 130, 14); c.fill();
    c.font = font(800, 84, true); c.textAlign = "center";
    c.fillStyle = C.yellow; c.fillText("19", 820, 186);
    c.fillStyle = C.text; c.fillText("<", 960, 182); c.fillText("20", 1100, 186);
  });
  stamp(c, 520, 300, "一人少ない", prog(l, 40.9, 41.6), "#E2603A", -0.1, 46);
  c.restore();
}

// ================= H: 思い出しやすいものほど、多い — kart yankıları =================
function sceneEcho(c: Ctx, t: number) {
  const l = t - P9.at;
  const k = ease.inOut(prog(l, -0.4, 11.4));
  const mult = ease.out(prog(l, 1.84, 2.6));
  const freq = ease.inOut(prog(l, 2.9, 4.2));
  c.save();
  cam(c, t, lerp(1.1, 1.0, k), lerp(-60, 60, k), 0, 0.5, 960, 540);
  envArchive(c, t, 7, l * 6);
  c.fillStyle = "rgba(8,10,14,0.45)"; c.fillRect(-400, -400, W + 800, H + 800);
  // parlak kart yankıları çoğalır
  for (let i = 0; i < 12; i++) {
    const a = mult * ease.out(prog(l, 1.84 + i * 0.06, 2.5 + i * 0.06));
    const an = i / 12 * Math.PI * 2 + t * 0.08;
    memoryCard(c, 620 + Math.cos(an) * 300 * a, 520 + Math.sin(an) * 210 * a, 0.75, { label: HELP[i % 5], glow: 0.6, alpha: a * 0.85, rot: Math.sin(an) * 0.2, who: i % 3 ? "A" : "none" });
  }
  memoryCard(c, 620, 520, 1.2, { label: "派手な出来事", glow: 1, who: "A" });
  // soluk tek kart (sağ)
  dof(c, 3, () => memoryCard(c, 1400, 560, 1.0, { label: "何も起きなかった日", fade: 1, alpha: 0.55 }));
  // frekans göstergesi (よく起きている)
  layer(c, freq, () => {
    c.save(); c.translate(1180, 880);
    c.font = font(600, 28); c.fillStyle = C.mist; c.textAlign = "left"; c.fillText("よく起きている？", 0, -150);
    for (let i = 0; i < 2; i++) {
      const v = i === 0 ? 0.92 * freq : 0.12 * freq;
      c.fillStyle = "rgba(255,255,255,0.08)"; c.fillRect(0, -110 + i * 70, 480, 34);
      c.fillStyle = i === 0 ? C.yellow : C.grey; c.fillRect(0, -110 + i * 70, 480 * v, 34);
      c.fillStyle = C.text; c.font = font(500, 22); c.fillText(i === 0 ? "派手" : "静か", -70, -86 + i * 70);
    }
    c.restore();
  });
  stamp(c, 620, 230, "多い！", prog(l, 4.16, 4.8), C.yellow, -0.1, 50);
  layer(c, ease.out(prog(l, 7.21, 8.0)), () => {
    c.font = font(700, 48, true); c.textAlign = "center"; c.fillStyle = C.yellow;
    const s = "利用可能性ヒューリスティック", n = Math.floor(clamp(prog(l, 7.21, 9.3)) * s.length + 0.01);
    c.fillText(s.slice(0, Math.max(1, n)), 960, 110);
  });
  c.restore();
  const mk = win(l, 0.2, 11.4, 0.6);
  if (mk > 0) drawMascot(c, lerp(2150, 1740, ease.out(mk)), 1120, 0.58, { mouth: speaking(parts, t), armR: 0.9, prop: "magnifier", lookX: -0.8, lookY: 0.1, rim: 1, tilt: Math.sin(t * 1.1) * 0.012 });
}

// ================= J: 評価する人も、記憶の中から — 上司 + hafıza çekmecesi =================
const DRAWER_LB = ["A：報告", "A：会議", "A：対応", "B：…", "B：…", "火事", "予防", "保守", "その他", "半年前", "先月", "先週"];
function sceneDrawer(c: Ctx, t: number) {
  const l = t - P9.at;
  const wIn = 1 - ease.out(prog(l, 11.1, 11.7));
  const k = ease.inOut(prog(l, 11.2, 19.4));
  const open0 = ease.out(prog(l, 13.02, 13.6));
  const riff = prog(l, 13.7, 14.9);
  c.save();
  dof(c, wIn * 16, () => {
    c.save();
    cam(c, t, lerp(1.02, 1.14, k), wIn * -1700 + lerp(80, -40, k), lerp(20, -20, k), 0.6, 960, 600);
    envArchive(c, t, 6, -l * 4);
    bulb(c, t, 1180, -80, 260, 0.95, 0.04);
    drawerCabinet(c, 1180, 960, 1.05, {
      t, labels: (i) => DRAWER_LB[i],
      open: (i) => i === 0 ? open0 * (1 - ease.inOut(prog(l, 16.4, 17.0)) * 0.6) : i === 1 ? ease.out(prog(l, 14.9, 15.4)) : 0,
      cards: (i) => i < 3 ? 14 : 2, glow: (i) => i < 3 ? 0.9 : 0, riffle: riff > 0 && riff < 1 ? t : 0,
    });
    // 上司 (outfit 4 + kravat): çekmeceyi karıştırır
    const reach = win(l, 12.8, 16.2, 0.4);
    drawPerson(c, 700, 960, 1.15, { outfit: 4, tie: true, rim: 0.8, rimSide: 1, facing: lerp(0.6, 0.9, reach), armUp: 0.25 + 0.2 * reach + 0.05 * Math.sin(t * 9) * reach, eye: 1, gazeX: 1, bob: breathe(t) * 0.6 });
    // çıkan kartlar hep A, parlak
    for (let i = 0; i < 4; i++) {
      const p = ease.out(prog(l, 13.8 + i * 0.25, 14.5 + i * 0.25));
      if (p <= 0) continue;
      memoryCard(c, lerp(1000, 380 + i * 170, p), lerp(560, 270 - (i % 2) * 40, p), 0.7, { label: ["週報", "朝会で発言", "トラブル報告", "提案"][i], glow: 0.85, who: "A", rot: (i - 1.5) * 0.08, alpha: p });
    }
    c.restore();
  });
  c.restore();
  // あの人は… B'nin dosyası, düşünce balonu
  layer(c, ease.out(prog(l, 15.68, 16.3)) * (1 - prog(l, 18.8, 19.3)), () => {
    memoryCard(c, 1640, 300, 1.1, { label: "Bさん", who: "B", fade: 0.5, rot: 0.06 });
    bubble(c, 1600, 520, "どんな仕事を…？", ease.out(prog(l, 16.6, 17.2)), false, 36);
  });
  layer(c, win(l, 11.6, 15.5, 0.4), () => boardLabel(c, 140, 110, "記憶の中から、例を探す", 1, C.mist));
}

// ================= K: 防がれた問題は、例を何も残さない — boş çekmece =================
function sceneEmpty(c: Ctx, t: number) {
  const l = t - P9.at;
  const k = ease.inOut(prog(l, 18.6, 24.2));
  const open = ease.out(prog(l, 19.6, 20.4));
  const beam = ease.inOut(prog(l, 20.8, 23.2));
  c.save();
  cam(c, t, lerp(1.7, 1.95, k), 0, lerp(-20, 30, k), 0.5, 960, 520);
  envArchive(c, t, 8, 0);
  drawerCabinet(c, 960, 1180, 1.25, { t, labels: (i) => i === 4 ? "防がれた問題" : DRAWER_LB[i], open: (i) => i === 4 ? open : 0, cards: () => 0 });
  c.restore();
  // fener ışığı boş çekmeceyi tarar
  layer(c, open, () => {
    c.save(); c.globalCompositeOperation = "lighter";
    const bx = lerp(700, 1220, beam);
    const g = c.createRadialGradient(bx, 560, 10, bx, 560, 240);
    g.addColorStop(0, "rgba(255,230,170,0.22)"); g.addColorStop(1, "rgba(255,230,170,0)");
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    c.restore();
  });
  dustPuff(c, t, g9(20.2), 960, 620, 1, 3);
  dustPuff(c, t, g9(22.3), 1010, 640, 0.8, 7);
  layer(c, ease.out(prog(l, 21.96, 22.6)), () => { c.font = font(700, 62, true); c.fillStyle = C.text; c.textAlign = "center"; c.fillText("例が、何も残らない", W / 2, 180); });
  dust(c, t, 60, 0.4, 44);
}

// ================= L: 半年前の静かな事故 vs 先週の派手な火事 — zaman ipi =================
function sceneTimeline(c: Ctx, t: number) {
  const l = t - P9.at;
  const k = ease.inOut(prog(l, 23.6, 31.6));
  const rack = ease.inOut(prog(l, 26.6, 27.6));
  const vivid = ease.out(prog(l, 29.4, 30.2));
  c.save();
  cam(c, t, lerp(1.04, 1.1, k), lerp(150, -150, rack), -60, 0.5, 960, 540);
  envArchive(c, t, 7, -l * 8);
  c.fillStyle = "rgba(8,10,14,0.4)"; c.fillRect(-400, -400, W + 800, H + 800);
  // ip + mandallar
  c.strokeStyle = "#8A7A5E"; c.lineWidth = 3; c.beginPath(); c.moveTo(-200, 300); c.quadraticCurveTo(960, 380, 2100, 300); c.stroke();
  // ok: zaman
  c.strokeStyle = "rgba(140,151,168,0.5)"; c.lineWidth = 3; c.beginPath(); c.moveTo(200, 820); c.lineTo(1720, 820); c.stroke();
  c.fillStyle = "rgba(140,151,168,0.5)"; c.beginPath(); c.moveTo(1740, 820); c.lineTo(1710, 805); c.lineTo(1710, 835); c.fill();
  c.font = font(600, 30); c.textAlign = "center";
  c.fillStyle = C.mist; c.fillText("半年前", 520, 870);
  c.fillStyle = C.text; c.fillText("先週", 1400, 870);
  // sol: sessizce önlenen kaza — soluk, bulanık, giderek söner
  dof(c, 1 + rack * 6, () => {
    const fd = 0.5 + 0.5 * ease.inOut(prog(l, 25.3, 30.5));
    memoryCard(c, 520, 560, 1.7, { label: "静かに防がれた事故", fade: fd, alpha: 1 - 0.5 * fd, rot: -0.04 });
    c.save(); c.globalAlpha *= 1 - fd * 0.7; extinguisher(c, 560, 560, 0.5, 0, 1); c.restore();
  });
  // sağ: dün gibi parlak yangın
  dof(c, (1 - rack) * 7, () => {
    memoryCard(c, 1400, 560, 1.7 + 0.15 * vivid, { label: "派手に消された火事", glow: 0.5 + 0.5 * vivid, rot: 0.05, who: "A" });
    c.save(); c.translate(1400, 510); c.scale(1.7, 1.7);
    flame(c, t, 50, 30, 36, 64, 0.5 + 0.5 * win(l, 26.8, 31.5, 0.6), 4);
    smoke(c, t, 50, -10, 40, 70, 0.3, 4, 8);
    c.restore();
  });
  [[520, 240], [1400, 280]].forEach(([x, y]) => { c.fillStyle = "#A08A5A"; c.fillRect(x - 8, y + 50, 16, 40); });
  flashPop(c, 1400, 480, vivid * (1 - prog(l, 29.6, 30.2)));
  layer(c, vivid, () => { c.font = font(700, 54, true); c.fillStyle = C.yellow; c.textAlign = "center"; c.shadowColor = "rgba(242,207,58,0.6)"; c.shadowBlur = 24; c.fillText("鮮明", 1400, 220); c.shadowBlur = 0; });
  c.restore();
}

// ================= M: 思い出せた仕事にしか、点をつけられない — 評価シート =================
function sceneScore(c: Ctx, t: number) {
  const l = t - P9.at;
  const k = ease.inOut(prog(l, 31.0, 37.6));
  c.save();
  cam(c, t, lerp(1.05, 1.22, k), lerp(-40, 60, k), lerp(-20, 40, k), 0.4, 960, 560);
  envNightRoom(c, t, 5);
  // masa + lamba ışığı
  lightPool(c, 960, 560, 700, "rgba(255,214,150,", 0.25);
  c.save(); c.translate(960, 560); c.rotate(-0.03);
  c.fillStyle = "rgba(0,0,0,0.45)"; rr(c, -430, -300, 880, 620, 8); c.fill();
  c.fillStyle = C.paper; rr(c, -440, -310, 880, 620, 8); c.fill();
  c.fillStyle = C.ink; c.font = font(700, 44, true); c.textAlign = "left"; c.fillText("評価シート", -390, -230);
  c.strokeStyle = "rgba(26,29,36,0.4)"; c.lineWidth = 2;
  for (let r = 0; r < 3; r++) { c.beginPath(); c.moveTo(-400, -170 + r * 150); c.lineTo(400, -170 + r * 150); c.stroke(); }
  c.font = font(600, 36); c.fillStyle = C.ink;
  c.fillText("Aさん", -390, -80); c.fillText("Bさん", -390, 70);
  memoryCard(c, -110, -90, 0.5, { who: "A", glow: 0.6 });
  memoryCard(c, -110, 60, 0.5, { who: "B", fade: 0.7 });
  // A: puan çizgileri dolu, B: boş
  for (let i = 0; i < 5; i++) {
    const p = ease.out(prog(l, 33.72 + i * 0.14, 33.95 + i * 0.14));
    c.fillStyle = `rgba(201,154,18,${p})`; c.beginPath(); c.arc(80 + i * 62, -92, 22 * (0.5 + 0.5 * p), 0, Math.PI * 2); c.fill();
    c.strokeStyle = "rgba(26,29,36,0.35)"; c.lineWidth = 2; c.beginPath(); c.arc(80 + i * 62, 58, 22, 0, Math.PI * 2); c.stroke();
  }
  layer(c, ease.out(prog(l, 34.6, 35.2)), () => { c.fillStyle = "rgba(26,29,36,0.55)"; c.font = font(500, 30); c.fillText("── 例なし", 60, 130); });
  c.restore();
  // ön plan: kalem (DOF), hafif titreşim
  dof(c, 6, () => {
    c.save(); c.translate(1440 - k * 40, 820 + Math.sin(t * 2) * 4); c.rotate(-0.7);
    c.fillStyle = "#1E2836"; rr(c, -18, -260, 36, 520, 14); c.fill();
    c.fillStyle = "#B08A4A"; c.fillRect(-18, -260, 36, 26);
    c.restore();
  });
  c.restore();
  layer(c, ease.out(prog(l, 32.16, 32.8)) * (1 - prog(l, 35.3, 35.8)), () => { c.font = font(700, 52, true); c.fillStyle = C.yellow; c.textAlign = "center"; c.fillText("思い出せた仕事 ＝ 点", W / 2, 130); });
  dust(c, t, 40, 0.3, 45);
}

// ================= ÇİZİM =================
const SCENES: [number, number, (c: Ctx, t: number) => void, Lens][] = [
  [g8(-0.8), g8(6.9), sceneAsk, LENS_MEM],
  [g8(6.3), g8(12.5), sceneEvent, LENS_HOT],
  [g8(11.9), g8(16.7), sceneNothing, LENS.night],
  [g8(16.0), g8(24.9), sceneLab, LENS.night],
  [g8(24.3), g8(34.6), sceneList, LENS.doc],
  [g8(34.0), CARD_A + 0.6, sceneScale, LENS.doc],
  [CARD_B - 0.4, g9(11.7), sceneEcho, LENS_MEM],
  [g9(11.1), g9(19.0), sceneDrawer, LENS_MEM],
  [g9(18.6), g9(24.2), sceneEmpty, LENS.night],
  [g9(23.6), g9(31.6), sceneTimeline, LENS_HOT],
  [g9(31.0), END, sceneScore, LENS_MEM],
];
const HARD = new Set<any>([sceneNothing, sceneLab, sceneDrawer]); // whip-pan girişli: kendi bulanıklığı var

function draw(ctx: Ctx, t: number) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
  ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H);
  const active = SCENES.filter(([a, b]) => t >= a && t <= b);
  const L = active.length ? active[active.length - 1][3] : LENS.night;
  if (active.length) {
    lens(ctx, t, L, (c) => {
      for (const [a, , fn] of active) layer(c, HARD.has(fn) || a <= g8(-0.8) ? 1 : ease.sine(prog(t, a, a + 0.6)), () => fn(c, t));
    });
  }
  // whip-pan ışık izleri
  whipStreaks(ctx, Math.sin(Math.PI * prog(t, g8(11.75), g8(12.55))), 1, 4);
  whipStreaks(ctx, Math.sin(Math.PI * prog(t, g8(15.85), g8(16.65))), -1, 6);
  whipStreaks(ctx, Math.sin(Math.PI * prog(t, g9(10.95), g9(11.75))), 1, 8);
  sectionTitle(ctx, t, 0.0, 3.6, "04", "思い出せるもの");
  screenCard(ctx, t, CARD_A, CARD_B + 0.2, { term: "利用可能性ヒューリスティック", size: 92, lines: ["思い出しやすいものほど、多く・よく起きると判断する"], source: "Tversky & Kahneman (1973)" });
  sourceCard(ctx, t, g8(17.0), g8(33.8), "Tversky & Kahneman (1973)");
  drawSubtitles(ctx, parts, t);
  fadeBlack(ctx, 1 - prog(t, 0, 0.5));
  fadeBlack(ctx, prog(t, END - 1.6, END - 0.2));
}

// ================= SES EFEKTLERİ (eyleme bire bir) =================
const cues: Cue[] = [];
const cue = (t: number, type: string, gain = 1, p: Record<string, number> = {}) => cues.push({ t, type, gain, p });

cue(0.0, "room", 0.5, { d: END });
cue(0.35, "whoosh", 0.55, { d: 1.2 });
cue(g8(-0.6), "bulbhum", 0.35, { d: 16.0 });                       // sallanan ampul vızıltısı (arşiv)
for (let i = 0; i < 6; i++) cue(g8(0.2 + i * 0.25), "pageflip", 0.35); // takvim: 半年
HELP.forEach((_, i) => cue(g8(1.7 + i * 0.22), "cardrise", 0.4, { f: [523, 587, 659, 698, 784][i] })); // kartlar yükselir
cue(g8(6.2), "whoosh", 0.4, { d: 1.0 });
cue(g8(7.95), "flare", 0.65);                                       // 起きて: kartta alev parlar
cue(g8(8.1), "crackle", 0.35, { d: 1.5 });
[0, 1, 2].forEach((i) => cue(g8(9.54 + i * 0.28), "checkmark", 0.5, { f: 660 + i * 110 })); // 解決 ✓
cue(g8(11.75), "whoosh", 0.8, { d: 0.8 });                          // whip-pan
cue(g8(12.6), "lowdrone", 0.4, { d: 4.0 });                         // boş kart: soğuk boşluk
cue(g8(13.2), "dissolve", 0.45, { d: 2.8 });                        // kart dağılır
cue(g8(15.85), "whoosh", 0.8, { d: 0.8 });                          // whip-pan → deney odası
cue(g8(16.8), "click", 0.4);                                        // REC
cue(g8(18.5), "tapehiss", 0.35, { d: 5.4 });                        // okuma: hoparlör hışırtısı
for (let i = 0; i < 14; i++) cue(g8(18.5 + i * 0.36), "flick", 0.18);  // isim şeritleri uçar
cue(g8(20.38), "blip", 0.3, { f: 660 }); cue(g8(20.94), "blip", 0.3, { f: 784 });
cue(g8(22.7), "pop", 0.45);                                         // soru balonu
cue(g8(24.3), "paper", 0.5);
for (let i = 0; i < 19; i++) cue(g8(famAt(i)), "tally", 0.28, { f: 1400 + i * 18 }); // 19 有名人 sayacı (parlak)
for (let i = 0; i < 20; i++) cue(g8(unkAt(i)), "tally", 0.18, { f: 700 });            // 20 無名 (donuk)
cue(g8(28.2), "shimmer", 0.3, { f: 523 });
cue(g8(34.0), "whoosh", 0.4, { d: 1.0 });
cue(g8(34.4), "murmur", 0.4, { d: 2.6 });                           // 多くの人が: kalabalık mırıltı
cue(g8(37.1), "rustle", 0.45);
for (let i = 0; i < 8; i++) cue(g8(37.6 + i * 0.07), "flick", 0.22);                                      // eller kalkar
cue(g8(37.25), "scaleclank", 0.75);                                 // terazi yanlış tarafa çöker
cue(g8(40.0), "hit", 0.45);                                         // 実際には
cue(g8(40.9), "stamp", 0.7);                                        // 一人少ない
cue(CARD_A, "whoosh", 0.4, { d: 1.2 });
cue(CARD_A + 0.5, "shimmer", 0.35, { f: 440 });
cue(CARD_B, "whoosh", 0.35, { d: 1.0 });
for (let i = 0; i < 12; i++) cue(g9(1.84 + i * 0.06), "cardrise", 0.14, { f: 880 + i * 30 }); // kart yankıları çoğalır
cue(g9(2.9), "riser", 0.25, { d: 1.3 });                            // frekans barı
cue(g9(4.16), "stamp", 0.6);                                        // 多い！
for (let i = 0; i < 14; i++) cue(g9(7.21 + i * 0.15), "type", 0.2);   // terim yazılır
cue(g9(10.95), "whoosh", 0.8, { d: 0.8 });                          // whip-pan → çekmece
cue(g9(11.4), "bulbhum", 0.3, { d: 12.6 });
for (let s = 11.8; s < 12.7; s += 0.3) cue(g9(s), "step", 0.35);
cue(g9(13.02), "drawer", 0.75);                                     // çekmece açılır
cue(g9(13.7), "riffle", 0.55, { d: 1.2 });                          // kartlar karıştırılır
for (let i = 0; i < 4; i++) cue(g9(13.8 + i * 0.25), "flick", 0.3);
cue(g9(14.9), "drawer", 0.45, { d: 0.5 });                          // ikinci çekmece
cue(g9(15.68), "paper", 0.4);                                       // B'nin kartı
cue(g9(16.6), "pop", 0.35);
cue(g9(16.4), "drawerclose", 0.4);
cue(g9(18.7), "whoosh", 0.35, { d: 1.0 });
cue(g9(19.6), "drawer", 0.8, { d: 0.9 });                           // 防がれた問題 çekmecesi
cue(g9(20.2), "dustpuff", 0.6);                                     // boş: toz
cue(g9(20.8), "lowdrone", 0.4, { d: 3.2 });
cue(g9(22.3), "dustpuff", 0.4);
cue(g9(23.6), "whoosh", 0.4, { d: 1.2 });
cue(g9(24.06), "lowdrone", 0.25, { d: 2.4 });                       // 半年前: sönük
cue(g9(26.7), "swish", 0.4);                                        // rack focus
cue(g9(26.88), "flare", 0.7);                                       // 派手に: alev
cue(g9(27.0), "crackle", 0.4, { d: 4.2 });
cue(g9(29.4), "shutter", 0.45);                                     // 鮮明: flaş
cue(g9(29.5), "shimmer", 0.35, { f: 659 });
cue(g9(31.0), "whoosh", 0.35, { d: 1.2 });
cue(g9(31.3), "paper", 0.45);
for (let i = 0; i < 5; i++) cue(g9(33.72 + i * 0.14), "inkdot", 0.4, { f: 520 + i * 60 }); // puan noktaları
cue(g9(34.6), "pen", 0.3, { d: 0.5 });                              // ── 例なし
cue(END - 1.7, "whoosh", 0.35, { d: 1.4 });

export const s04: Section = { id: "s04", duration: END, parts, cues, draw };
void rr; void sparks; void lightCone;
