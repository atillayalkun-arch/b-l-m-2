// s10 もう一人の、見えていない人 — ses 19, 20, 21  (s09 yapısı: SCENES + lens + cues)
// Yeni ortak parçalar: components/household.ts → envHome(), choreTile(), shareBars(), answerSlip()
// ★ s03 şemsiye kompozisyonu: components/umbrella.ts umbrellaShot() aynı dünya koordinatlarıyla (lift / bossAlpha / calm)
import { Section, Part, Cue, W, H, clamp, ease, prog, lerp, rnd, win, speaking } from "../engine/core";
import { C, font, lightPool, lightCone, fadeBlack, rr, dust } from "../design/style";
import { lens, LENS, cam, dof, Lens, bokeh } from "../design/grade";
import { envOffice, officeDesk } from "../design/env";
import { whipStreaks } from "../design/fx";
import { drawPerson } from "../characters/people";
import { drawMascot } from "../characters/mascot";
import { mug, plant, umbrella } from "../characters/props";
import { sectionTitle, screenCard, sourceCard } from "../components/cards";
import { armchair, speechBubble } from "../components/evaluation";
import { gazeBeam, faceCard } from "../components/evaluator";
import { umbrellaShot, burstRate, UMB, TEAM } from "../components/umbrella";
import { envHome, choreTile, shareBars, answerSlip } from "../components/household";
import { drawSubtitles } from "../components/subtitle";
import t19 from "../timing/19.json";
import t20 from "../timing/20.json";
import t21 from "../timing/21.json";

const P19: Part = { timing: t19 as any, at: 3.4 };
const P20: Part = { timing: t20 as any, at: 11.6 };
const P21: Part = { timing: t21 as any, at: 27.5 };
const parts = [P19, P20, P21];
const END = 101.0;
const h = (l: number) => P19.at + l;
const i_ = (l: number) => P20.at + l;
const j = (l: number) => P21.at + l;
const CARD1: [number, number] = [9.25, 11.75];
const CARD2: [number, number] = [24.3, 27.7];
type Ctx = CanvasRenderingContext2D;

function layer(ctx: Ctx, a: number, fn: () => void) {
  if (a <= 0.001) return;
  ctx.save(); ctx.globalAlpha *= clamp(a); fn(); ctx.restore();
}
const breathe = (t: number, k = 0) => Math.sin(t * 1.6 + k * 1.3) * 2;
function blinkAt(t: number) { const ph = (t % 4.7) / 4.7; return ph > 0.96 ? Math.sin(((ph - 0.96) / 0.04) * Math.PI) : 0; }
function stamp(c: Ctx, x: number, y: number, txt: string, k: number, col: string, rot = -0.12, size = 54) {
  if (k <= 0) return;
  const s = lerp(2.2, 1, ease.out(clamp(k * 1.6)));
  c.save(); c.translate(x, y); c.rotate(rot); c.scale(s, s); c.globalAlpha *= clamp(k * 2.5);
  c.font = font(800, size, true);
  const w = c.measureText(txt).width + 44;
  c.strokeStyle = col; c.lineWidth = 5; rr(c, -w / 2, -size * 0.85, w, size * 1.35, 10); c.stroke();
  c.fillStyle = col; c.textAlign = "center"; c.fillText(txt, 0, size * 0.32);
  c.restore();
}
function label(c: Ctx, x: number, y: number, txt: string, a: number, col: string = C.text, size = 50, align: CanvasTextAlign = "center") {
  layer(c, a, () => { c.font = font(700, size, true); c.textAlign = align; c.fillStyle = col; c.fillText(txt, x, y); });
}
function qmark(c: Ctx, t: number, x: number, y: number, a: number, col: string = C.yellow, size = 96) {
  layer(c, a, () => { c.textAlign = "center"; c.font = font(300, size, true); c.fillStyle = col; c.fillText("？", x + Math.sin(t * 2) * 4, y); });
}

const LENS_DARK: Lens = { shadow: "rgba(10,26,44,0.46)", high: "rgba(255,210,150,0.08)", bloom: 0.55, ca: 1.1, vig: 0.9, grain: 0.07, exposure: 0.94, sat: 0.78 };
const LENS_HOME: Lens = { shadow: "rgba(30,36,52,0.28)", high: "rgba(255,186,110,0.18)", bloom: 0.7, ca: 0.6, vig: 0.78, grain: 0.06, exposure: 1.02, sat: 0.95 };
const LENS_DOC: Lens = { shadow: "rgba(20,40,58,0.3)", high: "rgba(255,200,140,0.06)", bloom: 0.45, ca: 0.4, vig: 0.7, grain: 0.055, exposure: 1.0, sat: 0.85 };
const LENS_OBS: Lens = { shadow: "rgba(12,30,46,0.42)", high: "rgba(255,200,130,0.08)", bloom: 0.5, ca: 1.0, vig: 0.88, grain: 0.07, exposure: 0.95, sat: 0.8 };
const LENS_OFFICE: Lens = { shadow: "rgba(16,44,60,0.32)", high: "rgba(255,190,120,0.12)", bloom: 0.6, ca: 0.7, vig: 0.78, grain: 0.06, exposure: 1.0, sat: 0.9 };
const LENS_STORM: Lens = { shadow: "rgba(14,30,52,0.4)", high: "rgba(255,190,120,0.1)", bloom: 0.6, ca: 1.2, vig: 0.82, grain: 0.07, exposure: 0.98, sat: 0.86 };

// ---------- ortak: karanlık ofis (s01 ipucu kompozisyonu) ----------
function darkOffice(c: Ctx, t: number, l: number, dim = 0.72) {
  envOffice(c, t, 4, 0);
  c.fillStyle = `rgba(3,5,8,${dim})`; c.fillRect(-300, -300, W + 600, H + 600);
  for (let k = 0; k < 4; k++) officeDesk(c, 300 + k * 450, 860 + (k % 2) * 30, 0.9, 0.08, 0);
  for (let k = 0; k < 6; k++) lightPool(c, (rnd(k, 21) * W + l * (14 + k * 5)) % (W + 600) - 300, 600 + rnd(k, 22) * 300, 420, "rgba(120,140,170,", 0.05);
}

// ================= A (19): もう一人の「見えていない人」 =================
function sceneSilhouette(c: Ctx, t: number) {
  const l = t - P19.at;
  const k = ease.inOut(prog(l, -3, 6));
  const on = ease.out(prog(l, 0.2, 0.6)) * (0.92 + 0.08 * Math.sin(t * 23));
  const ang = lerp(-0.22, 0.0, ease.inOut(prog(l, 0.4, 2.0))) + Math.sin(l * 0.9) * 0.02;
  const sA = ease.inOut(prog(l, 1.6, 2.6));
  const push = ease.inOut(prog(l, 4.4, 6.0));
  c.save();
  cam(c, t, lerp(1.0, 1.1, k) + push * 0.25, lerp(40, -40, k) - push * 220, -push * 40, 1.2, 1400, 600);
  darkOffice(c, t, l);
  layer(c, sA, () => drawPerson(c, 1400, 860, 1.0, { outfit: 4, rim: 1, rimSide: -1, shade: 0.55, glow: 0.35 * win(l, 2.4, 7, 0.6), facing: lerp(0, -0.3, push), bob: breathe(t) * 0.4 }));
  if (on > 0) lightCone(c, 560, 690, ang, 0.13, 1500, 0.24 * on, "255,236,190");
  c.restore();
  qmark(c, t, lerp(1400, 1560, push), lerp(470, 380, push), win(l, 2.4, 7.5, 0.5) * 0.9);
  label(c, 960, 140, "最初に予告した、もう一人", ease.out(prog(l, 0.4, 0.9)) * (1 - prog(l, 3.9, 4.3)), C.mist, 44);
  drawMascot(c, lerp(420, 300, push), 1040, 0.85, { mouth: speaking(parts, t), armR: 1.25, prop: "flashlight", lookX: 0.8, blink: blinkAt(t), light: 0.7, rim: 1, tilt: Math.sin(t * 0.9) * 0.015 });
  dust(c, t, 50, 0.2, 31);
}

// ================= B (20): 一緒に暮らす二人 — 別々に答える =================
const XA = 560, XB = 1360; // çiftin yerleri
function sceneHome(c: Ctx, t: number) {
  const l = t - P20.at;
  const k = ease.inOut(prog(l, -0.4, 8.8));
  const wall = ease.inOut(prog(l, 6.2, 7.0));
  const rack = ease.inOut(prog(l, 3.0, 3.8));
  c.save();
  cam(c, t, lerp(1.0, 1.14, k), lerp(-60, 60, k), lerp(-10, 20, k), 0.35, 960, 600);
  dof(c, 2 + rack * 2, () => envHome(c, t, 3, l * 8));
  // çift: biri bulaşık (A tarafı), biri çamaşır katlıyor (B tarafı)
  drawPerson(c, XA, 900, 1.15, { outfit: 1, pose: "stand", rim: 0.9, rimSide: 1, facing: lerp(-0.4, 0.4, prog(l, 2.2, 2.8)), eye: 1, gazeX: 0.4, armUp: 0.25 + 0.08 * Math.sin(t * 4), bob: breathe(t) * 0.5 });
  drawPerson(c, XB, 900, 1.12, { outfit: 3, pose: "stand", rim: 0.9, rimSide: -1, facing: lerp(0.4, -0.4, prog(l, 2.3, 2.9)), eye: 1, gazeX: -0.4, armUp: 0.3 + 0.08 * Math.sin(t * 3 + 1), bob: breathe(t, 2) * 0.5 });
  // katlanan çamaşır yığını
  for (let n = 0; n < 4; n++) { c.fillStyle = ["#5A6B8A", "#C9B89A", "#E0DCD2", "#8A3A40"][n]; rr(c, XB + 110, 880 - n * 14 - (n === 3 ? ease.out(prog(l, 1.0, 1.5)) * 14 : 0), 120, 14, 4); c.fill(); }
  // 家事 karoları: ikisinin etrafında belirir
  for (let n = 0; n < 8; n++) {
    const side = n < 4 ? -1 : 1;
    const bx = (side < 0 ? XA : XB) + ((n % 4) - 1.5) * 130;
    const by = 360 + Math.sin(t * 1.2 + n) * 6 + (n % 2) * 24;
    const pop = ease.back(prog(l, 3.3 + n * 0.12, 3.7 + n * 0.12));
    choreTile(c, bx, by, 0.85 * pop, n, { lit: 0.6, alpha: pop * (1 - wall * 0.35), rot: (rnd(n, 2) - 0.5) * 0.1 });
  }
  // 別々に: tavandan paravan iner
  c.save(); c.translate(960, lerp(-700, 0, wall));
  c.fillStyle = "rgba(0,0,0,0.4)"; c.fillRect(-36, 120, 80, 900);
  c.fillStyle = "#3A3430"; c.fillRect(-40, 100, 80, 900); c.fillStyle = "#5A504A"; c.fillRect(-40, 100, 8, 900);
  for (let n = 0; n < 9; n++) { c.fillStyle = "rgba(255,255,255,0.05)"; c.fillRect(-40, 140 + n * 100, 80, 4); }
  c.restore();
  // cevap kâğıtları (答えて): ikisinin önünde
  const sl = ease.out(prog(l, 6.9, 7.4));
  answerSlip(c, XA + 40, lerp(980, 640, sl), 0.95, { pct: 60, write: prog(l, 7.3, 8.1), rot: -0.05, alpha: sl });
  answerSlip(c, XB - 40, lerp(980, 640, sl), 0.95, { pct: 55, write: prog(l, 7.5, 8.3), rot: 0.05, alpha: sl });
  c.restore();
  label(c, 960, 140, "ある実験", ease.out(prog(l, 0.3, 0.8)) * (1 - prog(l, 2.0, 2.4)), C.mist, 44);
  label(c, 960, 140, "一緒に暮らしている、二人", ease.out(prog(l, 2.3, 2.8)) * (1 - prog(l, 5.4, 5.8)), C.text, 46);
  label(c, 960, 140, "それぞれ、別々に", ease.out(prog(l, 6.3, 6.8)) * (1 - prog(l, 8.4, 8.8)), C.text, 46);
}

// ================= C (20): 足すと、100%を超える =================
function sceneBars(c: Ctx, t: number) {
  const l = t - P20.at;
  const k = ease.inOut(prog(l, 8.6, 13.0));
  const fly = ease.inOut(prog(l, 8.7, 9.4));
  const fa = ease.out(prog(l, 9.1, 9.7)), fb = ease.out(prog(l, 9.3, 9.9));
  const st = ease.inOut(prog(l, 9.8, 10.7));
  const ov = ease.out(prog(l, 11.3, 11.8));
  c.save();
  cam(c, t, lerp(0.96, 1.08, k) + ov * 0.04, lerp(-30, 20, k), lerp(20, -30, k), 0.3 + ov * 0.8 * (1 - prog(l, 11.4, 12.2)), 960, 520);
  c.fillStyle = "#0E1218"; c.fillRect(-800, -600, W + 1600, H + 1200);
  // mantar pano dokusu + raptiyeler
  c.fillStyle = "#3A2E22"; rr(c, 240, 120, 1440, 820, 12); c.fill();
  for (let n = 0; n < 900; n++) { c.fillStyle = `rgba(0,0,0,${0.1 + rnd(n, 1) * 0.1})`; c.fillRect(250 + rnd(n, 2) * 1420, 130 + rnd(n, 3) * 800, 3, 3); }
  c.strokeStyle = "#5A4630"; c.lineWidth = 14; rr(c, 240, 120, 1440, 820, 12); c.stroke();
  lightPool(c, 960, 500, 700, "rgba(255,220,160,", 0.18 + ov * 0.1);
  shareBars(c, t, 960, 880, 560, 60, 55, { ka: fa, kb: fb, stack: st, over: ov });
  // kâğıtlar: köşelere iğnelenir
  answerSlip(c, lerp(560, 400, fly), lerp(640, 280, fly), lerp(0.95, 0.6, fly), { pct: 60, write: 1, rot: -0.08 });
  answerSlip(c, lerp(1360, 1520, fly), lerp(640, 280, fly), lerp(0.95, 0.6, fly), { pct: 55, write: 1, rot: 0.08 });
  [[400, 220], [1520, 220]].forEach(([x, y]) => { c.fillStyle = "#C83A3A"; c.beginPath(); c.arc(x, y - 4 * (1 - fly), 9, 0, Math.PI * 2); c.fill(); });
  c.restore();
  label(c, 960, 140, "二人の答えを、足すと", ease.out(prog(l, 9.0, 9.5)) * (1 - prog(l, 11.0, 11.3)), C.text, 46);
  layer(c, ov, () => stamp(c, 1360, 560, "115%", 1, C.yellow, -0.08, 80));
  label(c, 960, 140, "100%を、超えてしまう", ease.out(prog(l, 11.3, 11.8)) * (1 - prog(l, 12.5, 12.9)), C.yellow, 50);
}

// ================= D (21): 嘘ではない =================
function sceneHonest(c: Ctx, t: number) {
  const l = t - P21.at;
  const k = ease.inOut(prog(l, -0.8, 3.4));
  c.save();
  cam(c, t, lerp(1.1, 1.18, k), lerp(-20, 20, k), 40, 0.3, 960, 600);
  dof(c, 6, () => envHome(c, t, 3, l * 6, 0.85));
  c.fillStyle = "rgba(8,8,10,0.35)"; c.fillRect(-800, -600, W + 1600, H + 1200);
  const ok = ease.back(prog(l, 1.0, 1.4));
  answerSlip(c, 700, 560, 1.25, { pct: 60, write: 1, rot: -0.05, ok });
  answerSlip(c, 1220, 560, 1.25, { pct: 55, write: 1, rot: 0.05, ok: ease.back(prog(l, 1.25, 1.65)) });
  c.restore();
  // 「嘘」 yazısı kırmızı çizgiyle silinir
  layer(c, ease.out(prog(l, 0.6, 0.9)) * (1 - prog(l, 3.0, 3.4)), () => {
    c.font = font(800, 88, true); c.fillStyle = C.mist; c.textAlign = "center"; c.fillText("嘘", 960, 260);
    const s = ease.out(prog(l, 1.0, 1.3)); c.strokeStyle = C.alarm; c.lineWidth = 9; c.beginPath(); c.moveTo(890, 200); c.lineTo(890 + 140 * s, 200 + 50 * s); c.stroke();
  });
  label(c, 960, 860, "どちらも、本当に そう思っている", ease.out(prog(l, 1.7, 2.2)) * (1 - prog(l, 3.0, 3.4)), C.text, 42);
}

// ================= E (21): 内側からはすべて / 外側は目に入った分だけ =================
function sceneInside(c: Ctx, t: number) {
  const l = t - P21.at;
  const k = ease.inOut(prog(l, 3.2, 11.0));
  const crack = ease.inOut(prog(l, 6.8, 7.6));
  c.save();
  cam(c, t, lerp(1.05, 1.0, k), lerp(-160, 160, k), 0, 0.3, 960, 540);
  c.fillStyle = "#0C0E12"; c.fillRect(-800, -600, W + 1600, H + 1200);
  // sol: 内側 — sıcak oda (kendi emeği): 8 karo sırayla yanar
  c.save();
  const lg = c.createLinearGradient(0, 120, 0, 960); lg.addColorStop(0, "#3A2C20"); lg.addColorStop(1, "#1C140E");
  c.fillStyle = lg; rr(c, 100, 140, 820, 800, 16); c.fill();
  lightPool(c, 510, 520, 520, "rgba(255,206,140,", 0.25);
  for (let n = 0; n < 8; n++) {
    const lit = ease.out(prog(l, 4.6 + n * 0.16, 5.0 + n * 0.16));
    choreTile(c, 230 + (n % 4) * 190, 420 + Math.floor(n / 4) * 200, 1.15, n, { lit, yellow: lit * win(l, 5.2, 7.0, 0.4) * 0.6 });
  }
  c.restore();
  // sağ: 外側 — kapı aralığı: karolar parçalı, ancak 2'si görünür
  c.save();
  c.fillStyle = "#07080B"; rr(c, 1000, 140, 820, 800, 16); c.fill();
  const dx = lerp(1410, 1300, crack), dw = lerp(16, 220, crack);
  c.save(); c.beginPath(); c.rect(dx, 150, dw, 780); c.clip();
  c.fillStyle = "#2E241A"; c.fillRect(1000, 140, 820, 800);
  lightPool(c, 1410, 520, 400, "rgba(255,206,140,", 0.2);
  for (let n = 0; n < 8; n++) choreTile(c, 1130 + (n % 4) * 190, 420 + Math.floor(n / 4) * 200, 1.15, n, { lit: 0.7, frag: 0.5 });
  c.restore();
  // kapı kanadı
  c.fillStyle = "#3E3226"; c.fillRect(dx + dw, 150, 1820 - dx - dw, 780); c.fillStyle = "#1E1812"; c.fillRect(1000, 150, dx - 1000, 780);
  c.fillStyle = "#B8A070"; c.beginPath(); c.arc(dx + dw + 40, 560, 12, 0, Math.PI * 2); c.fill();
  c.fillStyle = "rgba(255,206,140,0.18)"; c.beginPath(); c.moveTo(dx, 930); c.lineTo(dx + dw, 930); c.lineTo(dx + dw + 260, 1080); c.lineTo(dx - 120, 1080); c.fill();
  c.restore();
  // dışarıdan sayılan: sayaç 2'de kalır
  const seen = l > 9.0 ? 2 : l > 8.7 ? 1 : 0;
  layer(c, ease.out(prog(l, 8.5, 8.9)), () => {
    c.save(); c.translate(1410, 1010);
    c.fillStyle = "rgba(10,12,16,0.85)"; rr(c, -150, -46, 300, 80, 10); c.fill();
    c.fillStyle = C.mist; c.font = font(700, 30, true); c.textAlign = "center"; c.fillText(`数えた: ${seen} / 8`, 0, 8);
    c.restore();
  });
  c.restore();
  label(c, 510, 110, "自分の苦労 — 内側から", ease.out(prog(l, 3.5, 4.0)) * (1 - prog(l, 10.5, 10.9)), C.yellow, 40);
  label(c, 1410, 110, "相手の苦労 — 目に入った分だけ", ease.out(prog(l, 6.8, 7.3)) * (1 - prog(l, 10.5, 10.9)), C.mist, 40);
}

// ================= F (21): 自己中心性バイアス =================
function sceneTerm(c: Ctx, t: number) {
  const l = t - P21.at;
  const k = ease.inOut(prog(l, 10.8, 15.9));
  const sp = ease.inOut(prog(l, 11.4, 12.4));
  c.save();
  cam(c, t, lerp(1.15, 1.0, k), 0, lerp(-30, 10, k), 0.25, 960, 560);
  dof(c, 5, () => envHome(c, t, 3, l * 6, 0.25));
  c.fillStyle = "rgba(6,6,8,0.6)"; c.fillRect(-800, -600, W + 1600, H + 1200);
  // iki kişi: her biri kendi ışık havuzunda, kendi karolarını sarı görür, ötekini görmez
  [[XA, 1, 0], [XB, 3, 4]].forEach(([x, of, n0], s) => {
    lightCone(c, x, -100, Math.PI / 2, 0.2, 1000, 0.2 * sp, "255,214,150");
    drawPerson(c, x, 920, 1.15, { outfit: of, rim: 0.8, rimSide: s ? -1 : 1, facing: s ? -0.4 : 0.4, eye: 1, gazeX: s ? 0.5 : -0.5, shade: 0.3, bob: breathe(t, s) * 0.5 });
    for (let n = 0; n < 4; n++) choreTile(c, x + (n - 1.5) * 120, 380 + (n % 2) * 26 + Math.sin(t + n) * 5, 0.75, n0 + n, { lit: sp, yellow: sp * 0.7 });
    // ötekinin karoları — bu kişinin tarafında karanlık ve parçalı
    for (let n = 0; n < 2; n++) choreTile(c, 960 + (s ? -1 : 1) * (90 + n * 110), 560, 0.6, (s ? 0 : 4) + n, { lit: 0.2, frag: sp, alpha: 0.6 });
  });
  c.restore();
  layer(c, ease.out(prog(l, 12.7, 13.1)), () => stamp(c, 960, 210, "自己中心性バイアス", 1, C.yellow, -0.04, 64));
}

// ================= G (21): 見落としているのは、評価する側だけではない =================
function sceneNotOnly(c: Ctx, t: number) {
  const l = t - P21.at;
  const pull = ease.inOut(prog(l, 18.6, 20.4));
  const k = ease.inOut(prog(l, 15.6, 21.0));
  c.save();
  cam(c, t, lerp(1.25, 0.92, pull) + k * 0.03, lerp(-180, 0, pull), lerp(-60, 30, pull), 0.3, 960, 600);
  c.fillStyle = "#06080C"; c.fillRect(-800, -600, W + 1600, H + 1200);
  // gözlem odası camı: arkada B masada, sessiz
  dof(c, 3, () => {
    c.fillStyle = "#1A1F26"; c.fillRect(-200, 120, W + 400, 560);
    for (let n = 0; n < 6; n++) { c.fillStyle = "rgba(200,220,240,0.04)"; c.beginPath(); c.moveTo(-100 + n * 400, 120); c.lineTo(20 + n * 400, 120); c.lineTo(-140 + n * 400, 680); c.lineTo(-260 + n * 400, 680); c.fill(); }
    officeDesk(c, 960, 640, 0.8, 0.6, 1);
    drawPerson(c, 960, 640, 0.8, { outfit: 2, pose: "desk", rim: 0.5, shade: 0.5, eye: 1, bob: breathe(t) * 0.3 });
  });
  c.strokeStyle = "#1A1E25"; c.lineWidth = 40; c.strokeRect(-220, 100, W + 440, 600);
  c.fillStyle = "#14171C"; c.fillRect(-800, 740, W + 1600, 600);
  // koltuklar: önce yalnız değerlendirici, sonra yan yana meslektaş koltukları
  const seats = [[960, 1.0, "評価する側"], [520, 0.85, "同僚"], [1400, 0.85, "同僚"], [160, 0.75, "隣の席"], [1760, 0.75, "部下"]] as const;
  seats.forEach(([x, s, tag], n) => {
    const a = n === 0 ? 1 : ease.out(prog(l, 19.0 + n * 0.25, 19.5 + n * 0.25));
    layer(c, a, () => {
      armchair(c, x, 1000, s, { col: n === 0 ? "#4A3428" : "#3A3E46", glow: n === 0 ? 0.5 * (1 - pull * 0.5) : 0, tall: 1.1 });
      // bakış ışını: B'yi ıskalar (masanın üstünden geçer)
      gazeBeam(c, x, 760, 960 + (n === 0 ? 260 : (n % 2 ? -1 : 1) * 320), 300, 0.7 * a, "200,212,235");
      c.font = font(700, 26, true); c.fillStyle = n === 0 ? C.yellow : C.mist; c.textAlign = "center"; c.fillText(tag, x, 1060);
    });
  });
  c.restore();
  label(c, 960, 140, "見落としているのは", ease.out(prog(l, 16.6, 17.1)) * (1 - prog(l, 18.6, 18.9)), C.text, 48);
  label(c, 960, 140, "評価する側だけではない", ease.out(prog(l, 18.8, 19.3)) * (1 - prog(l, 20.6, 20.9)), C.yellow, 50);
}

// ================= H (21): 「もっと上手くアピールすればいいのに」 =================
const PEER = 5; // 同僚 → 管理職 (outfit 5)
function sceneAppeal(c: Ctx, t: number) {
  const l = t - P21.at;
  const k = ease.inOut(prog(l, 20.7, 26.2));
  const rack = ease.inOut(prog(l, 21.0, 21.8));
  c.save();
  cam(c, t, lerp(1.05, 1.18, k), lerp(-40, 80, k), lerp(0, -20, k), 0.3, 1100, 600);
  dof(c, 5, () => envOffice(c, t, 4, -l * 8));
  c.fillStyle = "rgba(6,8,12,0.35)"; c.fillRect(-800, -600, W + 1600, H + 1200);
  // arka: B sessizce çalışır (rack focus hedefi)
  dof(c, (1 - rack) * 6, () => {
    lightPool(c, 1340, 760, 360, "rgba(255,220,160,", 0.18);
    drawPerson(c, 1340, 800, 0.95, { outfit: 2, pose: "desk", rim: 0.6, rimSide: -1, eye: 1, gazeX: 0.2, shade: 0.35, bob: breathe(t, 1) * 0.4 });
    officeDesk(c, 1340, 800, 0.95, 0.85, 1);
  });
  // ön: meslektaş, omuz üstü, B'ye bakar
  dof(c, rack * 4, () => {
    drawPerson(c, 560, 1180, 1.7, { outfit: PEER, rim: 0.9, rimSide: 1, facing: 0.6, eye: 1, gazeX: 0.9, bob: breathe(t) * 0.6 });
    mug(c, t, 860, 1030, 1.4, 1);
  });
  c.restore();
  speechBubble(c, t, 1180, 380, "もっと上手く、アピールすればいいのに", ease.out(prog(l, 21.9, 22.4)) * (1 - prog(l, 25.6, 26.0)), { grey: 1, size: 40, tail: -1 });
}

// ================= I (21): 管理職になって初めて — 見えていなかったのは自分 =================
function sceneManager(c: Ctx, t: number) {
  const l = t - P21.at;
  const wIn = 1 - ease.out(prog(l, 25.8, 26.4));
  const k = ease.inOut(prog(l, 25.8, 33.4));
  const plate = ease.in(prog(l, 26.3, 26.7));
  const reveal = ease.inOut(prog(l, 27.2, 29.0));
  const turn = ease.inOut(prog(l, 29.1, 30.0));
  c.save();
  dof(c, wIn * 18, () => {
    c.save();
    cam(c, t, lerp(1.0, 1.12, k), wIn * 1700 + lerp(-40, 40, k), lerp(10, -10, k), 0.3, 960, 560);
    dof(c, 4, () => envOffice(c, t, 4, -(l - 25.8) * 10));
    c.fillStyle = "rgba(6,8,12,0.4)"; c.fillRect(-800, -600, W + 1600, H + 1200);
    // ekip masaları (arkada): B ve diğerleri — görünmeyen işler sarı karolar olarak belirir
    [[620, 2], [1000, 0], [1380, 1]].forEach(([x, of], n) => {
      drawPerson(c, x, 640, 0.7, { outfit: of, pose: "desk", rim: 0.4, shade: 0.4, eye: 1, bob: breathe(t, n) * 0.3 });
      officeDesk(c, x, 640, 0.7, 0.7, 0);
      const cnt = n === 0 ? 6 : 2;
      for (let m = 0; m < cnt; m++) {
        const a = ease.back(prog(l, 27.3 + m * 0.18 + n * 0.1, 27.7 + m * 0.18 + n * 0.1));
        choreTile(c, x - 120 + (m % 3) * 120, 300 + Math.floor(m / 3) * 110 + Math.sin(t + m) * 4, 0.55 * a, m + n * 2 + 8, { lit: 0.5, yellow: reveal, label: false, alpha: a });
      }
    });
    c.fillStyle = "rgba(242,207,58,0.9)"; c.font = font(700, 26, true); c.textAlign = "center";
    layer(c, reveal * (1 - prog(l, 32.8, 33.2)), () => c.fillText(["障害の予兆", "引き継ぎ資料", "新人の質問", "夜間の確認", "締切の調整", "顧客の一言"][Math.floor(l * 2) % 6], 620, 250));
    // ön: 管理職のデスク
    c.fillStyle = "#4E3624"; c.fillRect(-800, 860, W + 1600, 600);
    c.fillStyle = "rgba(255,255,255,0.05)"; c.fillRect(-800, 860, W + 1600, 4);
    drawPerson(c, 960, 960, 1.4, { outfit: PEER, tie: true, pose: "desk", rim: 0.9, rimSide: 1, facing: lerp(-0.3, 0.6, turn), eye: 1, gazeX: lerp(-0.2, 0.8, turn), bob: breathe(t) * 0.5 });
    // isim plakası düşer: 課長
    c.save(); c.translate(1260, lerp(400, 850, plate));
    c.fillStyle = "#2A2014"; rr(c, -110, -36, 220, 60, 6); c.fill(); c.fillStyle = "#C9A35A"; rr(c, -100, -30, 200, 46, 4); c.fill();
    c.fillStyle = "#1A1410"; c.font = font(800, 30, true); c.textAlign = "center"; c.fillText("課長", 0, 4);
    c.restore();
    for (let m = 0; m < 6; m++) { c.fillStyle = m % 2 ? C.paper : "#CFC9BA"; c.fillRect(560, 850 - m * 6, 160, 6); }
    c.restore();
  });
  c.restore();
  // eski balon çatlar: 見えていなかったのは自分
  speechBubble(c, t, 520, 360, "アピールすれば…", ease.out(prog(l, 28.0, 28.4)) * (1 - prog(l, 30.6, 31.0)), { grey: 1, size: 34, crack: ease.out(prog(l, 29.2, 29.8)) });
  label(c, 960, 140, "見えていなかったのは、自分のほう", ease.out(prog(l, 29.8, 30.3)) * (1 - prog(l, 32.8, 33.2)), C.yellow, 48);
}

// ================= J–L (21): ★ s03 şemsiye — 上司が離れたとき =================
const RAIN = burstRate([34.6, 35.4, 36.2, 37.1], 0.14, 1.3);
const STORM = burstRate([43.0, 43.8, 44.6, 45.4, 46.3, 47.4, 48.6], 0.3, 1.5);
function sceneUmb(c: Ctx, t: number) {
  const l = t - P21.at;
  const wIn = 1 - ease.out(prog(l, 33.0, 33.6));
  const leave = l >= 40.2;                         // 上司 ayrılır
  const walk = prog(l, 40.2, 42.6);
  const calm = 1 - ease.inOut(prog(l, 44.2, 46.0)) * (1 - 0.6 * ease.inOut(prog(l, 49.6, 51.0)));
  const realize = ease.inOut(prog(l, 49.5, 51.2));
  const ghost = ease.inOut(prog(l, 52.8, 54.2));
  const rate = (s: number) => {
    const g = s + 33.0;
    if (g < 39.5) return RAIN(g);
    if (g < 42.6) return 0.02;
    return STORM(g) * (1 - 0.65 * prog(g, 52.0, 55.0));
  };
  c.save();
  dof(c, wIn * 18, () => {
    c.save();
    const zk = ease.inOut(prog(l, 33.0, 39.4));
    cam(c, t, lerp(1.18, 1.0, zk) + 0.06 * prog(l, 42.6, 47.0) - 0.05 * realize, wIn * -1700 + lerp(-30, 30, prog(l, 33, 58)), lerp(160, 0, zk) - 60 * realize, 0.6 + 0.6 * win(l, 43.2, 48.6, 1), 980, 420);
    envOffice(c, t, 6, -l * 3);
    lightCone(c, UMB.ux, -100, Math.PI / 2, 0.32, 1000, 0.12 * (1 - walk));
    const res = umbrellaShot(c, t, l - 33.0, { rate, lift: leave ? 1 : 0, bossAlpha: leave ? 0 : 1, calm, seed: 3, glow: 0.6 * win(l, 36.2, 39.6, 0.6) });
    void res;
    // 上司, kapalı şemsiyeyle sağa yürür, kapıdan çıkar
    if (leave && walk < 1) {
      const x = lerp(UMB.bossX, 2100, ease.inOut(walk));
      drawPerson(c, x, UMB.bossY, UMB.bossS, { outfit: 4, tie: true, walk: walk * 5, rim: 1, rimSide: -1, facing: 0.9, alpha: 1 - prog(walk, 0.8, 1) });
      c.save(); c.translate(x + 40, UMB.bossY - 120); c.rotate(0.15); c.fillStyle = "#1A2230"; c.beginPath(); c.moveTo(-10, -150); c.lineTo(10, -150); c.lineTo(4, 40); c.lineTo(-4, 40); c.fill(); c.strokeStyle = "#5A4630"; c.lineWidth = 5; c.beginPath(); c.arc(-8, 44, 10, 0, Math.PI); c.stroke(); c.restore();
    }
    // 防がれていたもの: sarı hayalet şemsiye + 上司 silueti
    layer(c, ghost * 0.55, () => {
      drawPerson(c, UMB.bossX, UMB.bossY, UMB.bossS, { outfit: 4, tie: true, armUp: 1, glow: 1, alpha: 0.5, rim: 1 });
      umbrella(c, UMB.ux, UMB.uy, UMB.R, { open: 1, shaft: UMB.shaft, glow: 1 });
    });
    // ekip yukarı bakar (realize): sarı fark ediş ışını
    if (realize > 0) TEAM.forEach((m) => gazeBeam(c, m.x, 720, UMB.ux + (m.x - UMB.ux) * 0.3, UMB.uy + 80, realize * 0.6, "242,207,58"));
    c.restore();
  });
  c.restore();
  label(c, 960, 110, "方針の嵐を、受け止めていた人", ease.out(prog(l, 34.2, 34.7)) * (1 - prog(l, 38.8, 39.2)), C.text, 46);
  label(c, 960, 110, "その人が、部署を離れたとき", ease.out(prog(l, 39.5, 40.0)) * (1 - prog(l, 42.4, 42.8)), C.mist, 46);
  label(c, 960, 110, "方針が、そのまま現場に", ease.out(prog(l, 43.4, 43.9)) * (1 - prog(l, 47.0, 47.4)), C.alarm, 46);
  label(c, 960, 110, "守られていた", ease.out(prog(l, 50.1, 50.6)) * (1 - prog(l, 52.4, 52.8)), C.yellow, 54);
  label(c, 960, 110, "防がれていたものは、防ぐ人がいなくなって 初めて姿を現す", ease.out(prog(l, 53.0, 53.5)) * (1 - prog(l, 58.2, 58.7)), C.yellow, 40);
}

// ================= M (21): あなたの隣で、いまも静かに支えている人 =================
function sceneBeside(c: Ctx, t: number) {
  const l = t - P21.at;
  const k = ease.inOut(prog(l, 58.5, 66.8));
  const on = ease.out(prog(l, 58.8, 59.2)) * (0.92 + 0.08 * Math.sin(t * 23));
  const sA = ease.inOut(prog(l, 59.6, 60.4)) * (1 - ease.inOut(prog(l, 61.9, 62.8)));
  const pan = ease.inOut(prog(l, 62.0, 63.6));
  const glow = ease.inOut(prog(l, 64.8, 66.0));
  c.save();
  cam(c, t, lerp(1.0, 1.12, k), lerp(40, -60, k) + pan * 240, 0, 1.0, 960, 600);
  darkOffice(c, t, l, 0.74);
  // s01 silueti — sonra yan masaya dönüşür
  layer(c, sA, () => drawPerson(c, 1400, 860, 1.0, { outfit: 4, rim: 1, rimSide: -1, shade: 0.55, glow: 0.3 }));
  if (on > 0) lightCone(c, 560, 690, lerp(-0.1, 0.0, prog(l, 58.8, 60)) - pan * 0.25, 0.13, 1500, 0.22 * on * (1 - pan * 0.6), "255,236,190");
  // yan masa: B, masa altındaki kabloyu düzeltir / rafı tutar — sessizce destekler
  const bA = ease.inOut(prog(l, 62.2, 63.2));
  layer(c, bA, () => {
    lightPool(c, 760, 840, 340, "rgba(242,207,58,", 0.3 * glow);
    officeDesk(c, 760, 860, 1.05, 0.7, 1);
    drawPerson(c, 760, 860, 1.05, { outfit: 2, pose: "desk", rim: 0.7, rimSide: 1, glow: glow * 0.9, eye: 1, gazeX: -0.2, bob: breathe(t) * 0.5 });
    // raf: B'nin eli altında, düşmekte olan dosyaları tutar
    c.save(); c.translate(560, 640); c.rotate(-0.02 + 0.01 * Math.sin(t * 2));
    c.fillStyle = "#3A2C20"; c.fillRect(-120, 0, 240, 12);
    for (let m = 0; m < 6; m++) { c.fillStyle = ["#3E5A7A", "#5A4A3A", "#4A5A4A"][m % 3]; c.fillRect(-110 + m * 36, -90, 30, 90); }
    c.restore();
    c.strokeStyle = `rgba(242,207,58,${0.6 * glow})`; c.lineWidth = 3; c.strokeRect(440, 540, 240, 112);
  });
  // ön plan: bizim masamız (kenarda bulanık)
  dof(c, 7, () => { c.fillStyle = "#2A2F37"; c.fillRect(1300, 980, 900, 200); mug(c, t, 1500, 990, 1.6, 0.6); plant(c, t, 1760, 990, 1.2); });
  c.restore();
  qmark(c, t, 1400, 470, win(l, 59.8, 62.2, 0.4) * 0.9);
  label(c, 960, 140, "もう一人の、見えていない人", ease.out(prog(l, 58.8, 59.3)) * (1 - prog(l, 61.6, 62.0)), C.mist, 46);
  label(c, 960, 140, "あなたの隣で、いまも静かに", ease.out(prog(l, 62.7, 63.2)) * (1 - prog(l, 64.6, 65.0)), C.text, 46);
  label(c, 960, 140, "何かを支えている人", ease.out(prog(l, 64.9, 65.4)) * (1 - prog(l, 66.4, 66.8)), C.yellow, 52);
}

// ================= N (21): 見ていないのは、私たち自身 =================
function sceneUs(c: Ctx, t: number) {
  const l = t - P21.at;
  const k = ease.inOut(prog(l, 66.4, 72.0));
  const screenOff = ease.inOut(prog(l, 67.5, 68.4));
  const refl = ease.inOut(prog(l, 69.8, 71.0));
  const lampOff = ease.in(prog(l, 71.4, 72.6));
  c.save();
  cam(c, t, lerp(1.0, 1.22, k), 0, lerp(0, -30, k), 0.2, 960, 520);
  c.fillStyle = "#07090C"; c.fillRect(-800, -600, W + 1600, H + 1200);
  // masa + monitör (izleyicinin). Ekran söner → siyah cam: yansıma
  const tg = c.createLinearGradient(0, 760, 0, H); tg.addColorStop(0, "#3E2C1E"); tg.addColorStop(1, "#140E09");
  c.fillStyle = tg; c.fillRect(-800, 760, W + 1600, 700);
  lightPool(c, 960, 840, 700, "rgba(255,220,160,", 0.22 * (1 - lampOff));
  c.fillStyle = "#14161A"; rr(c, 400, 140, 1120, 640, 18); c.fill();
  c.fillStyle = "#2A2D33"; c.fillRect(920, 780, 80, 60); rr(c, 820, 830, 280, 20, 6); c.fill();
  c.save(); c.beginPath(); rr(c, 430, 170, 1060, 580, 6); c.clip();
  // ekran içeriği: ekip sohbeti listesi (söner)
  c.fillStyle = `rgba(40,56,76,${1 - screenOff})`; c.fillRect(430, 170, 1060, 580);
  for (let m = 0; m < 7; m++) { c.fillStyle = `rgba(200,212,235,${0.3 * (1 - screenOff)})`; c.fillRect(470, 210 + m * 76, 300 + rnd(m, 5) * 500, 22); }
  // yansıma: biz (izleyici) — arkadan aydınlatılmış baş ve omuz + yanımızdaki kişi sarı
  c.fillStyle = `rgba(8,10,14,${screenOff})`; c.fillRect(430, 170, 1060, 580);
  layer(c, refl * 0.85, () => {
    drawPerson(c, 820, 1120, 2.2, { outfit: 1, rim: 0.6, rimSide: 1, shade: 0.7, facing: 0, alpha: 0.6 });
    drawPerson(c, 1260, 1000, 1.5, { outfit: 2, rim: 0.6, glow: 0.8 * (1 - lampOff), shade: 0.4, alpha: 0.55 });
  });
  for (let m = 0; m < 3; m++) { c.fillStyle = "rgba(200,220,240,0.05)"; c.beginPath(); c.moveTo(500 + m * 360, 170); c.lineTo(600 + m * 360, 170); c.lineTo(480 + m * 360, 750); c.lineTo(380 + m * 360, 750); c.fill(); }
  c.restore();
  mug(c, t, 1640, 820, 1.2, 0.5 * (1 - lampOff));
  c.restore();
  fadeBlack(c, lampOff * 0.85);
  label(c, 960, 110, "その人を見ていないかもしれないのは", ease.out(prog(l, 67.6, 68.1)) * (1 - prog(l, 69.6, 69.9)), C.mist, 44);
  label(c, 960, 110, "私たち自身", ease.out(prog(l, 70.0, 70.5)) * (1 - prog(l, 72.6, 73.2)), C.yellow, 60);
}

// ================= ÇİZİM =================
const SCENES: [number, number, (c: Ctx, t: number) => void, Lens][] = [
  [0, CARD1[0] + 0.5, sceneSilhouette, LENS_DARK],
  [i_(-0.3), i_(8.9), sceneHome, LENS_HOME],
  [i_(8.6), CARD2[0] + 0.5, sceneBars, LENS_DOC],
  [CARD2[1] - 0.4, j(3.4), sceneHonest, LENS_HOME],
  [j(3.2), j(11.0), sceneInside, LENS_HOME],
  [j(10.8), j(15.9), sceneTerm, LENS_HOME],
  [j(15.6), j(21.0), sceneNotOnly, LENS_OBS],
  [j(20.7), j(26.2), sceneAppeal, LENS_OFFICE],
  [j(25.8), j(33.4), sceneManager, LENS_OFFICE],
  [j(33.0), j(58.8), sceneUmb, LENS_STORM],
  [j(58.5), j(66.8), sceneBeside, LENS_DARK],
  [j(66.4), END, sceneUs, LENS_OBS],
];
const HARD = new Set<any>([sceneSilhouette, sceneManager, sceneUmb]); // siyahtan / whip-pan girişli

function draw(ctx: Ctx, t: number) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
  ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H);
  const active = SCENES.filter(([a, b]) => t >= a && t <= b);
  const L = active.length ? active[active.length - 1][3] : LENS.night;
  if (active.length) {
    lens(ctx, t, L, (c) => {
      for (const [a, , fn] of active) layer(c, HARD.has(fn) ? 1 : ease.sine(prog(t, a, a + 0.6)), () => fn(c, t));
    });
  }
  whipStreaks(ctx, Math.sin(Math.PI * prog(t, j(25.7), j(26.5))), 1, 12);
  whipStreaks(ctx, Math.sin(Math.PI * prog(t, j(32.9), j(33.7))), -1, 13);
  sectionTitle(ctx, t, 0.0, 3.6, "10", "もう一人の、見えていない人");
  screenCard(ctx, t, CARD1[0], CARD1[1], { term: "家事の割合", size: 110, lines: ["一緒に暮らす二人に、別々に聞く"] });
  screenCard(ctx, t, CARD2[0], CARD2[1], { term: "自己中心性バイアス", size: 100, lines: ["自分の苦労は内側からすべて見え、相手の苦労は見えた分しか数えない"], source: "Ross & Sicoly (1979)" });
  sourceCard(ctx, t, j(11.0), j(15.6), "Ross & Sicoly (1979)");
  drawSubtitles(ctx, parts, t);
  fadeBlack(ctx, 1 - prog(t, 0, 0.5));
  fadeBlack(ctx, prog(t, END - 1.4, END - 0.2));
}

// ================= SES EFEKTLERİ (eyleme bire bir) =================
const cues: Cue[] = [];
const cue = (t: number, type: string, gain = 1, p: Record<string, number> = {}) => cues.push({ t, type, gain, p });

cue(0.0, "room", 0.5, { d: END });
cue(0.35, "whoosh", 0.5, { d: 1.2 });                              // başlık
cue(h(0.2), "click", 0.4);                                         // fener düğmesi
cue(h(0.3), "bulbhum", 0.2, { d: 5.0 });                           // fener vızıltısı
cue(h(1.6), "step", 0.3); cue(h(2.1), "step", 0.25);               // silüet karanlıktan bir adım atar
cue(h(2.4), "lowdrone", 0.3, { d: 2.4 });                          // 見えていない ？
cue(h(4.4), "swish", 0.35, { d: 1.2 });                            // push-in
cue(CARD1[0], "shimmer", 0.35, { d: 1.6 });                        // kart (geçiş)
cue(i_(-0.2), "dishclink", 0.45);                                  // bulaşık tabakları
cue(i_(0.6), "tap", 0.3, { d: 2.4 });                              // musluk akar
cue(i_(1.0), "rustle", 0.3);                                       // çamaşır katlanır
for (let n = 0; n < 8; n++) cue(i_(3.3 + n * 0.12), "carddeal", 0.18); // 家事 karoları
cue(i_(6.2), "partition", 0.6);                                    // paravan iner (別々に)
cue(i_(6.9), "paper", 0.35); cue(i_(7.0), "paper", 0.3);           // cevap kâğıtları
cue(i_(7.3), "pen", 0.4, { d: 0.8 }); cue(i_(7.5), "pen", 0.35, { d: 0.8 }); // yüzde yazılır
cue(i_(8.6), "swish", 0.3, { d: 0.8 });                            // panoya geçiş
cue(i_(8.8), "pin", 0.4); cue(i_(9.0), "pin", 0.4);                // raptiyeler
cue(i_(9.1), "barfill", 0.4, { d: 0.6 }); cue(i_(9.3), "barfill", 0.4, { d: 0.6 }); // çubuklar dolar
cue(i_(9.8), "slide", 0.45, { d: 0.9 });                           // üst üste biner
cue(i_(10.6), "tick", 0.35);                                       // %100 çizgisi
cue(i_(11.3), "overflow", 0.6);                                    // 超えて: taşar
cue(i_(11.4), "stamp", 0.5);                                       // 115%
cue(CARD2[0], "shimmer", 0.35, { d: 1.6 });                        // kart (geçiş)
cue(j(0.6), "pen", 0.3, { d: 0.4 });                               // 「嘘」 çizilir
cue(j(1.0), "checkmark", 0.35); cue(j(1.25), "checkmark", 0.3);    // ✓ ✓
for (let n = 0; n < 8; n++) cue(j(4.6 + n * 0.16), "lampclick", 0.18); // 内側: karolar tek tek yanar
cue(j(6.8), "doorcreak", 0.5);                                     // kapı aralanır
cue(j(8.7), "counter", 0.35); cue(j(9.0), "counter", 0.35);        // sayaç: 1, 2 — durur
cue(j(9.7), "lowdrone", 0.25, { d: 1.4 });                         // 数えられない
cue(j(11.4), "lamp", 0.35);                                        // iki ışık havuzu
cue(j(12.7), "stamp", 0.55);                                       // 自己中心性バイアス
cue(j(15.6), "chair", 0.4);                                        // gözlem odası: koltuk
cue(j(18.6), "swish", 0.35, { d: 1.6 });                           // geri çekilme
for (let n = 1; n < 5; n++) cue(j(19.0 + n * 0.25), "chair", 0.25); // yeni koltuklar
cue(j(19.3), "glasswall", 0.3);                                    // bakış ışınları
cue(j(20.7), "typing", 0.25, { d: 5.0 });                          // B sessizce yazıyor
cue(j(21.9), "pop", 0.3);                                          // gri balon
cue(j(25.7), "whoosh", 0.8, { d: 0.8 });                           // whip-pan → 管理職
cue(j(26.7), "nameplate", 0.6);                                    // 課長 plakası masaya
for (let n = 0; n < 6; n++) cue(j(27.3 + n * 0.18), "cardrise", 0.2); // görünmeyen işler belirir
cue(j(29.2), "crack", 0.5);                                        // balon çatlar
cue(j(29.8), "heartbeat", 0.3, { d: 1.6 });                        // 自分のほう
cue(j(32.9), "whoosh", 0.8, { d: 0.8 });                           // whip-pan → şemsiye
cue(j(33.4), "umbrella", 0.5);                                     // şemsiye (hatırlama)
[34.6, 35.4, 36.2, 37.1].forEach((s) => cue(j(s + 0.3), "arrowthud", 0.35, { n: 3 })); // oklar şemsiyeye çarpar
cue(j(36.3), "glowhum", 0.3, { d: 2.6 });                          // あの上司 sarı
cue(j(40.0), "umbrellafold", 0.55);                                // şemsiye kapanır
cue(j(40.4), "steps", 0.4, { d: 2.0 });                            // 上司 yürür
cue(j(42.4), "door", 0.45);                                        // kapı kapanır
cue(j(42.9), "wind", 0.4, { d: 6.0 });                             // fırtına
[43.0, 43.8, 44.6, 45.4, 46.3, 47.4, 48.6].forEach((s) => cue(j(s + 0.5), "arrowthud", 0.5, { n: 5 })); // oklar masalara saplanır
cue(j(44.6), "flutter", 0.35); cue(j(45.6), "flutter", 0.3);       // kâğıtlar uçuşur
cue(j(44.2), "murmurs", 0.35, { d: 4.0 });                         // ekip paniği
cue(j(49.6), "rustle", 0.3);                                       // ekip yukarı bakar
cue(j(50.1), "mend", 0.35);                                        // 守られていた
cue(j(52.8), "glowhum", 0.4, { d: 3.4 });                          // hayalet şemsiye belirir
cue(j(58.5), "whoosh", 0.3, { d: 1.0 });                           // karanlık ofise geçiş (geçiş)
cue(j(58.8), "click", 0.4);                                        // fener
cue(j(59.6), "step", 0.25);                                        // silüet
cue(j(62.0), "swish", 0.35, { d: 1.4 });                           // pan → yan masa
cue(j(63.0), "shelfcreak", 0.45);                                  // raf gıcırdar, B tutar
cue(j(64.8), "glowhum", 0.35, { d: 2.4 });                         // 支えている sarı
cue(j(67.5), "monitoroff", 0.5);                                   // ekran söner
cue(j(69.8), "glasswall", 0.3);                                    // yansıma belirir
cue(j(70.0), "heartbeat", 0.4, { d: 1.8 });                        // 私たち自身
cue(j(71.4), "lamp", 0.45);                                        // lamba söner
cue(END - 1.5, "whoosh", 0.25, { d: 1.3 });

void bokeh; void faceCard;
export const s10: Section = { id: "s10", duration: END, parts, cues, draw };
