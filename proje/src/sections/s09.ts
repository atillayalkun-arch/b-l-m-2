// s09 評価する側に座る — ses 17, 18  (s08 yapısı: SCENES + lens + cues)
// Yeni ortak parçalar: components/evaluator.ts → hourglass(), faceCard(), calendarStrip(), eventBanner(), gazeBeam(), binderTab()
import { Section, Part, Cue, W, H, clamp, ease, prog, lerp, rnd } from "../engine/core";
import { C, font, lightPool, lightCone, fadeBlack, rr, dust } from "../design/style";
import { lens, LENS, cam, dof, Lens, bokeh } from "../design/grade";
import { envMeetingRoom, envOffice, officeDesk } from "../design/env";
import { whipStreaks, flashPop, confetti } from "../design/fx";
import { drawPerson } from "../characters/people";
import { mug, wallClock } from "../characters/props";
import { sectionTitle } from "../components/cards";
import { armchair, evalSheet, chainLevel } from "../components/evaluation";
import { dustPuff } from "../components/memory";
import { hourglass, faceCard, calendarStrip, eventBanner, gazeBeam, binderTab } from "../components/evaluator";
import { drawSubtitles } from "../components/subtitle";
import t17 from "../timing/17.json";
import t18 from "../timing/18.json";

const P17: Part = { timing: t17 as any, at: 3.4 };
const P18: Part = { timing: t18 as any, at: 9.0 };
const parts = [P17, P18];
const END = 75.0;
const f = (l: number) => P17.at + l;
const g = (l: number) => P18.at + l;
type Ctx = CanvasRenderingContext2D;

function layer(ctx: Ctx, a: number, fn: () => void) {
  if (a <= 0.001) return;
  ctx.save(); ctx.globalAlpha *= clamp(a); fn(); ctx.restore();
}
const breathe = (t: number, i = 0) => Math.sin(t * 1.6 + i * 1.3) * 2;
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
function pen(c: Ctx, x: number, y: number, rot = 0.7, s = 1) {
  c.save(); c.translate(x, y); c.rotate(rot); c.scale(s, s);
  c.fillStyle = "rgba(0,0,0,0.35)"; c.fillRect(-4, -146, 16, 150);
  c.fillStyle = "#1E2228"; c.fillRect(-8, -150, 16, 150); c.fillStyle = "#B8BEC6"; c.fillRect(-8, -150, 16, 10); c.fillRect(6, -140, 4, 60);
  c.fillStyle = "#C9A35A"; c.beginPath(); c.moveTo(-8, 0); c.lineTo(8, 0); c.lineTo(0, 22); c.fill();
  c.restore();
}

const LENS_OBS: Lens = { shadow: "rgba(12,30,46,0.42)", high: "rgba(255,200,130,0.08)", bloom: 0.5, ca: 1.0, vig: 0.88, grain: 0.07, exposure: 0.95, sat: 0.8 };
const LENS_DESK: Lens = { shadow: "rgba(18,46,62,0.34)", high: "rgba(255,190,120,0.14)", bloom: 0.65, ca: 0.8, vig: 0.8, grain: 0.06, exposure: 1.0, sat: 0.9 };
const LENS_DOC: Lens = { shadow: "rgba(20,40,58,0.3)", high: "rgba(255,200,140,0.06)", bloom: 0.45, ca: 0.4, vig: 0.7, grain: 0.055, exposure: 1.0, sat: 0.85 };
const LENS_PARTY: Lens = { shadow: "rgba(40,20,40,0.3)", high: "rgba(255,180,110,0.2)", bloom: 0.8, ca: 0.7, vig: 0.75, grain: 0.06, exposure: 1.04, sat: 1.0 };
const LENS_COLD: Lens = { shadow: "rgba(12,24,44,0.46)", high: "rgba(170,190,230,0.06)", bloom: 0.45, ca: 1.2, vig: 0.88, grain: 0.07, exposure: 0.94, sat: 0.74 };

// ---------- ortak: değerlendiricinin gece masası (yeşil abajur, dosyalar, saat) ----------
function evalDesk(c: Ctx, t: number, l: number, blurBg: number, o: { lamp?: number } = {}) {
  const lamp = o.lamp ?? 1;
  c.fillStyle = "#0C1016"; c.fillRect(-800, -600, W + 1600, H + 1200);
  dof(c, blurBg, () => {
    c.save(); c.translate(-l * 5, 0);
    // arka duvar: dosya rafları + pencere jaluzi
    for (let i = 0; i < 5; i++) {
      const x = -200 + i * 360; c.fillStyle = "#171C24"; c.fillRect(x, 90, 300, 560);
      for (let r = 0; r < 4; r++) { c.fillStyle = "#222936"; c.fillRect(x + 10, 120 + r * 130, 280, 8); for (let b = 0; b < 9; b++) { c.fillStyle = ["#3E5A7A", "#5A4A3A", "#4A5A4A", "#6A5A40"][(b + r + i) % 4]; c.fillRect(x + 20 + b * 30, 128 + r * 130 - 90 + rnd(b + r * 9, i) * 12, 24, 90 - rnd(b + r * 9, i) * 12); } }
    }
    c.fillStyle = "#0A1120"; c.fillRect(1580, 110, 420, 420);
    for (let y = 120; y < 530; y += 20) { c.fillStyle = "rgba(196,190,176,0.18)"; c.fillRect(1580, y, 420, 7); }
    bokeh(c, t, 8, 140, 520, 91, 0.15);
    c.restore();
  });
  wallClock(c, 250 - l * 6, 170, 42, 21 + l / 3600);
  const tg = c.createLinearGradient(0, 720, 0, H); tg.addColorStop(0, "#4E3624"); tg.addColorStop(1, "#1E140D");
  c.fillStyle = tg; c.fillRect(-800, 720, W + 1600, 800);
  c.strokeStyle = "rgba(0,0,0,0.2)"; for (let i = 0; i < 14; i++) { c.beginPath(); c.moveTo(-800, 740 + i * 24); c.bezierCurveTo(200, 746 + i * 24, 1200, 734 + i * 24, 2700, 742 + i * 24); c.stroke(); }
  c.fillStyle = "rgba(255,255,255,0.05)"; c.fillRect(-800, 720, W + 1600, 4);
  // yeşil banker lambası
  c.fillStyle = "#2A2014"; c.fillRect(1490, 560, 14, 160); rr(c, 1440, 708, 114, 16, 4); c.fill();
  c.fillStyle = "#1F5A3A"; c.beginPath(); c.moveTo(1380, 590); c.lineTo(1610, 590); c.quadraticCurveTo(1590, 540, 1495, 535); c.quadraticCurveTo(1400, 540, 1380, 590); c.fill();
  c.fillStyle = `rgba(255,236,190,${0.8 * lamp})`; c.fillRect(1390, 586, 210, 6);
  lightCone(c, 1495, 592, Math.PI / 2 + 0.25, 0.7, 520, 0.18 * lamp, "255,220,160");
  lightPool(c, 1160, 760, 620, "rgba(255,220,160,", 0.26 * lamp);
}

// ================= A (17): 実験 — 席が逆 =================
function sceneSwap(c: Ctx, t: number) {
  const l = t - P17.at;
  const k = ease.inOut(prog(l, -1.2, 6.2));
  const on = ease.out(prog(l, 1.1, 1.6));
  const turn = ease.inOut(prog(l, 3.8, 4.8));
  const flip = ease.inOut(prog(l, 4.5, 5.2));
  c.save();
  cam(c, t, lerp(1.0, 1.2, k), lerp(-80, 120, k), lerp(10, -10, k), 0.35, 960, 560);
  // gözlem odası: önümüzde tek yönlü cam, arkasında aydınlık oda
  c.fillStyle = "#06080C"; c.fillRect(-800, -600, W + 1600, H + 1200);
  dof(c, 2 + (1 - on) * 3, () => {
    c.save(); c.translate(-l * 6, 0);
    c.fillStyle = `rgb(${lerp(20, 54, on)},${lerp(24, 60, on)},${lerp(30, 66, on)})`; c.fillRect(160, 140, 1600, 620);
    c.fillStyle = "#2E333A"; c.fillRect(160, 700, 1600, 60);
    lightCone(c, 960, 140, Math.PI / 2, 0.45, 600, 0.22 * on, "255,226,170");
    // sol: B (değerlendirilen) koltukta
    armchair(c, 700, 740, 0.9, { col: "#3A3E46" });
    drawPerson(c, 700, 700, 0.9, { outfit: 2, pose: "sit", rim: 0.8 * on, rimSide: 1, facing: 0.5, eye: 1, gazeX: 0.8, shade: 0.4 - on * 0.3, bob: breathe(t) * 0.4 });
    // sağ: boş değerlendirici koltuğu — bize döner
    c.save(); c.translate(1240, 740); c.scale(lerp(-0.4, 1, turn), 1);
    armchair(c, 0, 0, 1.05, { col: "#4A3428", glow: turn, tall: 1.15 });
    c.restore();
    // masa + dosya
    c.fillStyle = "#5A3E2A"; c.fillRect(880, 640, 220, 12); c.fillStyle = "#2E2016"; c.fillRect(890, 652, 200, 50);
    c.fillStyle = "#3E5A7A"; c.fillRect(940, 628, 90, 12);
    c.restore();
  });
  // cam: yansıma + kenar çerçevesi (biz karanlıkta)
  c.fillStyle = "rgba(120,150,180,0.05)"; c.fillRect(160, 140, 1600, 620);
  for (let i = 0; i < 4; i++) { c.fillStyle = "rgba(200,220,240,0.05)"; c.beginPath(); c.moveTo(300 + i * 380 + l * 10, 140); c.lineTo(420 + i * 380 + l * 10, 140); c.lineTo(260 + i * 380 + l * 10, 760); c.lineTo(140 + i * 380 + l * 10, 760); c.fill(); }
  c.strokeStyle = "#1A1E25"; c.lineWidth = 40; c.strokeRect(140, 120, 1640, 660);
  // ön plan: gözlem tezgâhı + not defteri
  c.fillStyle = "#14171C"; c.fillRect(-800, 820, W + 1600, 400);
  c.fillStyle = "#1E232B"; c.fillRect(-800, 800, W + 1600, 24);
  dof(c, 6, () => { c.fillStyle = "#2A2F37"; rr(c, 180, 830, 300, 60, 6); c.fill(); mug(c, t, 1640, 820, 1.1, 0.6); });
  c.restore();
  // levha: 評価される側 → 評価する側 (döner)
  layer(c, ease.out(prog(l, 2.9, 3.4)), () => {
    c.save(); c.translate(1240, 250); c.scale(1, Math.abs(Math.cos(flip * Math.PI)) || 0.02);
    const side = flip > 0.5;
    c.fillStyle = side ? C.paper : "#3A414B"; rr(c, -190, -40, 380, 80, 8); c.fill();
    if (side) { c.strokeStyle = C.yellow; c.lineWidth = 4; rr(c, -190, -40, 380, 80, 8); c.stroke(); }
    c.fillStyle = side ? C.ink : C.mist; c.font = font(800, 40, true); c.textAlign = "center"; c.fillText(side ? "評価する側" : "評価される側", 0, 14);
    c.restore();
  });
  label(c, 960, 110, "もうひとつの、実験", ease.out(prog(l, 1.1, 1.6)) * (1 - prog(l, 2.6, 2.9)), C.text, 46);
}

// ================= B (18): 評価する側 — 持ち時間一時間、二十人 =================
function sceneDesk(c: Ctx, t: number) {
  const l = t - P18.at;
  const k = ease.inOut(prog(l, -0.4, 7.2));
  const rack = ease.inOut(prog(l, 0.6, 1.6));   // koltuk sırtı → masa
  const hg = ease.out(prog(l, 2.8, 3.3));
  const sand = prog(l, 3.4, 40);
  const drop = ease.in(prog(l, 4.8, 5.2));
  const fan = ease.inOut(prog(l, 5.5, 6.6));
  c.save();
  cam(c, t, lerp(1.0, 1.14, k), lerp(-40, 60, k), lerp(-10, 10, k), 0.3, 1100, 640);
  dof(c, rack * 6, () => evalDesk(c, t, l, 5));
  dof(c, (1 - rack) * 8, () => {
    layer(c, hg, () => hourglass(c, t, 1580, 724, 0.9, sand, prog(l, 3.4, 3.8)));
    // dosya yığını düşer → 20 sayfa yelpaze
    const y0 = lerp(300, 712, drop);
    for (let i = 0; i < 20; i++) {
      const fx = lerp(1060, 560 + i * 44, fan), fy = lerp(y0 - i * 3, 700 - Math.sin(i / 19 * Math.PI) * 30, fan);
      layer(c, prog(l, 4.8, 4.9), () => {
        c.save(); c.translate(fx, fy); c.rotate(lerp(0.02 * (rnd(i, 4) - 0.5), (i - 9.5) * 0.035, fan));
        c.fillStyle = "rgba(0,0,0,0.3)"; c.fillRect(-56, -6, 120, 16);
        c.fillStyle = i % 2 ? C.paper : "#CFC9BA"; c.fillRect(-60, -10, 120, 16);
        c.fillStyle = "#3E5A7A"; c.fillRect(-60, -10, 10, 16);
        c.restore();
      });
    }
    mug(c, t, 360, 716, 1.1, 1);
  });
  c.restore();
  // ön plan: izleyicinin koltuğu (sırt, kenarda, bulanık)
  dof(c, 6 + rack * 6, () => { c.save(); c.globalAlpha *= lerp(1, 0.75, rack); armchair(c, 220, 1300, 2.6, { col: "#2E241F", tall: 1.1 }); c.restore(); });
  label(c, 960, 140, "あなたは、評価する側", ease.out(prog(l, 0.3, 0.8)) * (1 - prog(l, 2.5, 2.8)), C.text, 50);
  label(c, 1580, 380, "持ち時間 1時間", ease.out(prog(l, 3.0, 3.5)) * (1 - prog(l, 6.8, 7.2)), C.yellow, 40);
  label(c, 960, 520, "20人", ease.back(prog(l, 5.5, 6.0)) * (1 - prog(l, 6.8, 7.2)), C.text, 80);
}

// ================= C (18): 半分は、顔も思い出せない =================
const NAMES = ["佐藤", "鈴木", "高橋", "田中", "渡辺", "伊藤", "山本", "中村", "小林", "加藤", "吉田", "山田", "佐々木", "山口", "松本", "井上", "木村", "林", "清水", "斎藤"];
const BLANK = [1, 3, 4, 7, 8, 10, 13, 15, 16, 18];
function sceneFaces(c: Ctx, t: number) {
  const l = t - P18.at;
  const k = ease.inOut(prog(l, 6.8, 12.6));
  c.save();
  cam(c, t, lerp(0.95, 1.12, k), lerp(40, -30, k), lerp(-10, 20, k), 0.25, 960, 520);
  c.fillStyle = "#3A2A1C"; c.fillRect(-800, -600, W + 1600, H + 1200);
  for (let i = 0; i < 30; i++) { c.strokeStyle = "rgba(0,0,0,0.15)"; c.beginPath(); c.moveTo(-800, -600 + i * 70); c.bezierCurveTo(0, -590 + i * 70, 1200, -610 + i * 70, 2700, -596 + i * 70); c.stroke(); }
  lightPool(c, 1100, 400, 900, "rgba(255,220,160,", 0.22);
  for (let i = 0; i < 20; i++) {
    const col = i % 5, row = Math.floor(i / 5);
    const bi = BLANK.indexOf(i);
    const bl = bi >= 0 ? ease.inOut(prog(l, 8.7 + bi * 0.16, 9.3 + bi * 0.16)) : 0;
    const q = bi >= 0 ? ease.out(prog(l, 10.8 + bi * 0.05, 11.2 + bi * 0.05)) : 0;
    faceCard(c, 560 + col * 200 + (rnd(i, 2) - 0.5) * 16, 150 + row * 205, 0.88, { outfit: i, name: NAMES[i], blank: bl, q, rot: (rnd(i, 3) - 0.5) * 0.08, alpha: ease.out(prog(l, 6.9 + i * 0.03, 7.3 + i * 0.03)) });
  }
  c.restore();
  label(c, 200, 520, "半分は", ease.out(prog(l, 8.4, 8.8)) * (1 - prog(l, 12.2, 12.6)), C.mist, 56);
  label(c, 1720, 520, "10 / 20", ease.out(prog(l, 10.8, 11.2)) * (1 - prog(l, 12.2, 12.6)), C.mist, 56);
}

// ================= D (18): 何を手がかりに？ — 答えは決まっている =================
function sceneClue(c: Ctx, t: number) {
  const l = t - P18.at;
  const k = ease.inOut(prog(l, 12.2, 18.6));
  const lock = ease.inOut(prog(l, 16.8, 17.5));
  c.save();
  cam(c, t, lerp(1.2, 1.35, k), lerp(-60, 40, k), lerp(20, 0, k), 0.25, 960, 720);
  evalDesk(c, t, l, 8);
  // boş değerlendirme sayfası
  c.save(); c.translate(960, 820); c.rotate(-0.03);
  c.fillStyle = "rgba(0,0,0,0.45)"; rr(c, -296, -96, 600, 260, 6); c.fill();
  c.fillStyle = C.paper; rr(c, -300, -100, 600, 260, 6); c.fill();
  c.fillStyle = C.ink; c.font = font(700, 30, true); c.textAlign = "left"; c.fillText("評価コメント", -270, -54);
  c.strokeStyle = "rgba(26,29,36,0.3)"; c.lineWidth = 2; for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(-270, -10 + i * 40); c.lineTo(270, -10 + i * 40); c.stroke(); }
  c.restore();
  // kalem: arayan dolaşma → kilitlenir
  const hx = lerp(960 + Math.sin(t * 2.2) * 220, 720, lock), hy = lerp(700 + Math.cos(t * 1.7) * 30, 790, lock);
  pen(c, hx, hy, lerp(0.7 + Math.sin(t * 2) * 0.1, 0.6, lock), 1.1);
  c.restore();
  // 手がかり: üç ipucu kartı yukarıda — ikisi sarı (思い出せる / 説明しやすい), biri soluk
  const cl = [["思い出せる", 1], ["説明しやすい", 1], ["目立たない貢献", 0]] as const;
  cl.forEach(([s, y], i) => layer(c, ease.out(prog(l, 13.3 + i * 0.2, 13.8 + i * 0.2)), () => {
    c.save(); c.translate(560 + i * 400, 300 + Math.sin(t * 1.3 + i) * 6);
    const lit = y ? lock : 0, dim = y ? 0 : lock;
    if (lit > 0) lightPool(c, 0, 0, 220, "rgba(242,207,58,", 0.35 * lit);
    c.globalAlpha *= 1 - dim * 0.6;
    c.fillStyle = C.paper; rr(c, -160, -44, 320, 88, 8); c.fill();
    if (lit > 0) { c.strokeStyle = `rgba(242,207,58,${lit})`; c.lineWidth = 4; rr(c, -160, -44, 320, 88, 8); c.stroke(); }
    c.fillStyle = C.ink; c.font = font(700, 34, true); c.textAlign = "center"; c.fillText(s, 0, 12);
    c.restore();
  }));
  label(c, 960, 140, "何を手がかりに、評価する？", ease.out(prog(l, 12.6, 13.1)) * (1 - prog(l, 15.6, 15.9)), C.text, 50);
  label(c, 960, 140, "答えは、ほとんど決まっている", ease.out(prog(l, 15.9, 16.4)) * (1 - prog(l, 18.2, 18.6)), C.text, 50);
}

// ================= E (18): 思い出せる人から書き、説明しやすい成果から点 =================
const ROW = [0, 5, 11, 2, 9, 14];
function sceneScore(c: Ctx, t: number) {
  const l = t - P18.at;
  const k = ease.inOut(prog(l, 18.3, 24.5));
  const sort = ease.inOut(prog(l, 18.7, 19.7));
  c.save();
  cam(c, t, lerp(1.05, 1.15, k), lerp(-40, 60, k), 0, 0.25, 960, 560);
  evalDesk(c, t, l, 7);
  ROW.forEach((id, i) => {
    const rem = i < 3; // hatırlanan (sarı) üç kişi öne
    const x0 = 420 + i * 220, x1 = rem ? 520 + i * 300 : 760 + (i - 3) * 160;
    const y1 = rem ? 540 : 800;
    const x = lerp(x0, x1, sort), y = lerp(600, y1, sort);
    const sc = rem ? clamp((l - 22.5 - i * 0.35) * 2.2) * [5, 4, 4][i] : 0;
    faceCard(c, x, y, rem ? 1.25 : lerp(1.25, 0.7, sort), { outfit: id, name: NAMES[id], glow: rem ? sort : 0, blank: rem ? 0 : 0.5 * sort, score: sc, rot: rem ? 0 : (i - 4) * 0.1 * sort, alpha: rem ? 1 : 1 - sort * 0.35 });
  });
  // kalem: önce 1. karta yazar, sonra puan noktaları
  const wp = prog(l, 19.7, 22.4), sp = prog(l, 22.5, 23.9);
  const px = wp < 1 ? 470 + (wp * 3 % 1) * 110 + Math.floor(wp * 3) * 300 : 460 + Math.floor(sp * 3) * 300 + (sp * 3 % 1) * 100;
  const py = wp < 1 ? 600 : 650;
  if (l > 19.5) pen(c, px + 40, py, 0.6, 1.0);
  c.restore();
  label(c, 960, 140, "思い出せる人から、書きはじめ", ease.out(prog(l, 18.7, 19.2)) * (1 - prog(l, 20.6, 20.9)), C.text, 48);
  label(c, 960, 140, "説明しやすい成果から、点をつける", ease.out(prog(l, 20.9, 21.4)) * (1 - prog(l, 24.0, 24.4)), C.yellow, 48);
}

// ================= F (18): 傾向には名前がある — 評価者研修のファイル =================
function sceneNames(c: Ctx, t: number) {
  const l = t - P18.at;
  const wIn = 1 - ease.out(prog(l, 24.2, 24.8));
  const k = ease.inOut(prog(l, 24.2, 29.2));
  const open = ease.inOut(prog(l, 25.0, 25.9));
  c.save();
  dof(c, wIn * 18, () => {
    c.save();
    cam(c, t, lerp(1.0, 1.18, k), wIn * 1700 + lerp(-40, 40, k), lerp(10, -10, k), 0.25, 960, 560);
    c.fillStyle = "#11151B"; c.fillRect(-800, -600, W + 1600, H + 1200);
    dof(c, 5, () => { c.save(); c.translate(-l * 6, 0); for (let i = 0; i < 40; i++) { c.fillStyle = ["#3E5A7A", "#5A4A3A", "#4A5A4A", "#6A5A40"][i % 4]; c.fillRect(-200 + i * 60, 150 + rnd(i, 6) * 30, 50, 360); } c.fillStyle = "#1E232B"; c.fillRect(-400, 510, W + 800, 20); c.restore(); });
    const tg = c.createLinearGradient(0, 700, 0, H); tg.addColorStop(0, "#4E3624"); tg.addColorStop(1, "#1E140D");
    c.fillStyle = tg; c.fillRect(-800, 700, W + 1600, 800);
    lightPool(c, 960, 700, 600, "rgba(255,220,160,", 0.24);
    // binder: kapak açılır
    c.save(); c.translate(820, 720);
    c.fillStyle = "#24364A"; rr(c, -360, -440, 360, 440, 8); c.fill();
    c.fillStyle = C.paper; rr(c, -340, -420, 330, 400, 4); c.fill();
    c.fillStyle = "#8A9099"; for (let i = 0; i < 3; i++) { c.beginPath(); c.arc(-30, -330 + i * 130, 12, 0, Math.PI * 2); c.fill(); }
    c.fillStyle = C.ink; c.font = font(700, 30, true); c.textAlign = "left"; c.fillText("評価者研修", -300, -360);
    c.fillStyle = "rgba(26,29,36,0.5)"; c.font = font(500, 22, true); c.fillText("よくある評価エラー", -300, -322);
    c.strokeStyle = "rgba(26,29,36,0.2)"; c.lineWidth = 2; for (let i = 0; i < 6; i++) { c.beginPath(); c.moveTo(-300, -270 + i * 40); c.lineTo(-60, -270 + i * 40); c.stroke(); }
    c.fillStyle = "#24364A"; rr(c, 0, -440, 360, 440, 8); c.fill(); c.fillStyle = "#E2DDD0"; rr(c, 10, -420, 330, 400, 4); c.fill();
    c.save(); c.scale(Math.max(0.001, Math.cos(open * Math.PI * 0.5)), 1); if (open < 0.98) {
    c.fillStyle = "#2E4A66"; rr(c, 0, -440, 360, 440, 8); c.fill();
    c.fillStyle = C.paper; c.font = font(800, 40, true); c.textAlign = "center"; c.fillText("人事評価", 180, -220); }
    c.restore();
    c.restore();
    // sekmeler çıkar: isimli eğilimler
    binderTab(c, 1060, 340, 1.0, "期末誤差", prog(l, 26.9, 27.4));
    binderTab(c, 1060, 430, 1.0, "ハロー効果", prog(l, 27.15, 27.65));
    binderTab(c, 1060, 520, 1.0, "中心化傾向", prog(l, 27.4, 27.9));
    binderTab(c, 1060, 610, 1.0, "寛大化傾向", prog(l, 27.65, 28.15));
    c.restore();
  });
  c.restore();
  label(c, 960, 140, "こうした傾向には、名前がある", ease.out(prog(l, 26.0, 26.5)) * (1 - prog(l, 28.7, 29.1)), C.text, 48);
}

// ================= G (18): 期末誤差 =================
function sceneRecency(c: Ctx, t: number) {
  const l = t - P18.at;
  const k = ease.inOut(prog(l, 29.0, 34.4));
  const heavy = ease.inOut(prog(l, 30.6, 32.0));
  c.save();
  cam(c, t, lerp(0.96, 1.06, k), lerp(-60, 30, k), 0, 0.25, 960, 600);
  c.fillStyle = "#0B0E14"; c.fillRect(-800, -600, W + 1600, H + 1200);
  c.strokeStyle = "rgba(255,255,255,0.03)"; for (let x = -800; x < W + 800; x += 60) { c.beginPath(); c.moveTo(x, -600); c.lineTo(x, H + 600); c.stroke(); }
  lightCone(c, 1600, -200, Math.PI / 2, 0.22, 1100, 0.14 * heavy, "255,214,150");
  const X0 = 200, Wd = 1520, cw = Wd / 12;
  const dim = Array.from({ length: 12 }, (_, i) => i < 9 ? heavy * 0.8 : 0);
  calendarStrip(c, X0, 820, Wd, { dim, lit: heavy });
  for (let i = 0; i < 12; i++) {
    const late = i >= 10 ? 1 : i === 9 ? 0.4 : 0;
    const s = lerp(0.45, 0.45 + late * 0.55, heavy);
    const a = ease.out(prog(l, 29.3 + i * 0.07, 29.6 + i * 0.07)) * (1 - (i < 9 ? heavy * 0.55 : 0));
    const sink = late * heavy * 40;
    layer(c, a, () => {
      c.save(); c.translate(X0 + i * cw + cw / 2, 700 + sink - s * 100); c.scale(s, s);
      c.fillStyle = late > 0.5 ? C.paper : "#A9A497"; rr(c, -70, -90, 140, 180, 6); c.fill();
      if (late > 0.5 && heavy > 0) { c.strokeStyle = `rgba(242,207,58,${heavy})`; c.lineWidth = 5; rr(c, -70, -90, 140, 180, 6); c.stroke(); }
      c.fillStyle = "rgba(26,29,36,0.4)"; for (let r = 0; r < 4; r++) c.fillRect(-50, -60 + r * 34, 100 - r * 14, 8);
      c.restore();
    });
  }
  c.restore();
  label(c, 960, 140, "終わりごろの出来事ほど、重く見る", ease.out(prog(l, 29.6, 30.1)) * (1 - prog(l, 32.4, 32.7)), C.text, 48);
  layer(c, ease.out(prog(l, 32.7, 33.1)), () => stamp(c, 960, 300, "期末誤差", 1, C.yellow, -0.06, 70));
}

// ================= H (18): ハロー効果 =================
function sceneHalo(c: Ctx, t: number) {
  const l = t - P18.at;
  const k = ease.inOut(prog(l, 34.2, 39.8));
  const badge = ease.back(prog(l, 34.8, 35.3));
  const spread = ease.inOut(prog(l, 36.4, 37.6));
  c.save();
  cam(c, t, lerp(1.2, 1.05, k), lerp(-60, 20, k), lerp(20, 0, k), 0.3, 900, 600);
  dof(c, 5, () => envOffice(c, t, 4, -(t - g(34.2)) * 10));
  c.fillStyle = "rgba(6,8,12,0.45)"; c.fillRect(-800, -600, W + 1600, H + 1200);
  lightCone(c, 760, -200, Math.PI / 2, 0.22, 1300, 0.16 + spread * 0.1, "255,226,170");
  // A: parlak rozet → hale tüm gövdeye
  drawPerson(c, 760, 960, 1.45, { outfit: 0, pose: "stand", rim: 0.8, rimSide: 1, glow: spread, facing: 0.3, eye: 1, gazeX: 0.5, bob: breathe(t) * 0.5 });
  layer(c, badge, () => {
    c.save(); c.translate(820, 620); c.scale(badge, badge);
    const gl = c.createRadialGradient(0, 0, 4, 0, 0, lerp(60, 520, spread)); gl.addColorStop(0, "rgba(242,207,58,0.6)"); gl.addColorStop(1, "rgba(242,207,58,0)");
    c.fillStyle = gl; c.fillRect(-540, -540, 1080, 1080);
    c.fillStyle = C.yellow; c.beginPath(); for (let i = 0; i < 10; i++) { const r = i % 2 ? 12 : 28, a = -Math.PI / 2 + i * Math.PI / 5; c.lineTo(Math.cos(a) * r, Math.sin(a) * r); } c.closePath(); c.fill();
    c.restore();
  });
  label(c, 560, 600, "プレゼンが上手", ease.out(prog(l, 35.1, 35.5)) * (1 - prog(l, 37.4, 37.8)), C.yellow, 34, "right");
  // sağ: değerlendirme satırları — hepsi ◎ olur
  const rows = ["企画力", "協調性", "正確さ", "勤怠"];
  layer(c, ease.out(prog(l, 35.6, 36.1)), () => {
    c.save(); c.translate(1420, 560);
    c.fillStyle = "rgba(0,0,0,0.45)"; rr(c, -226, -236, 460, 480, 8); c.fill();
    c.fillStyle = C.paper; rr(c, -230, -240, 460, 480, 8); c.fill();
    c.fillStyle = C.ink; c.font = font(700, 32, true); c.textAlign = "left"; c.fillText("評価シート", -190, -180);
    rows.forEach((r, i) => {
      const y = -100 + i * 90;
      c.fillStyle = "rgba(26,29,36,0.75)"; c.font = font(600, 32, true); c.textAlign = "left"; c.fillText(r, -190, y + 10);
      const m = ease.back(prog(l, 36.6 + i * 0.22, 36.9 + i * 0.22));
      if (m > 0) { c.save(); c.translate(140, y); c.scale(m, m); c.strokeStyle = "#B08A10"; c.lineWidth = 5; c.beginPath(); c.arc(0, 0, 28, 0, Math.PI * 2); c.stroke(); c.beginPath(); c.arc(0, 0, 16, 0, Math.PI * 2); c.stroke(); c.restore(); }
    });
    c.restore();
  });
  c.restore();
  label(c, 960, 140, "目立つひとつの特徴に、全体が引っぱられる", ease.out(prog(l, 34.4, 34.9)) * (1 - prog(l, 37.7, 38.0)), C.text, 44);
  layer(c, ease.out(prog(l, 38.0, 38.4)), () => stamp(c, 960, 280, "ハロー効果", 1, C.yellow, -0.06, 70));
}

// ================= I (18): 社内イベントの幹事 =================
function sceneEvent(c: Ctx, t: number) {
  const l = t - P18.at;
  const k = ease.inOut(prog(l, 39.6, 47.2));
  const name = ease.out(prog(l, 41.1, 41.7));
  const up = ease.inOut(prog(l, 43.5, 44.6));
  c.save();
  cam(c, t, lerp(1.0, 1.16, k), lerp(-100, 80, k), lerp(0, -20, k), 0.4, 960, 560);
  c.fillStyle = "#1A1218"; c.fillRect(-800, -600, W + 1600, H + 1200);
  dof(c, 6, () => {
    c.save(); c.translate(-l * 8, 0);
    bokeh(c, t, 30, 80, 620, 141, 0.45);
    for (let i = 0; i < 6; i++) { c.fillStyle = "#2A1E24"; c.fillRect(-200 + i * 420, 120, 16, 600); }
    c.restore();
  });
  c.fillStyle = "#2A2024"; c.fillRect(-800, 760, W + 1600, 600);
  eventBanner(c, t, 960, 200, 1.0, "社内 忘年会 2025", name);
  // sahne: 幹事 (outfit 3) mikrofonla, kol bandı
  lightCone(c, 960, 60, Math.PI / 2, 0.3, 900, 0.22, "255,210,150");
  drawPerson(c, 960, 860, 1.3, { outfit: 3, pose: "stand", rim: 1, rimSide: -1, glow: name * 0.8, facing: 0, eye: 1, gazeX: 0, armUp: 0.55 + Math.sin(t * 3) * 0.05, bob: breathe(t) * 0.6 });
  c.fillStyle = "#1A1A1A"; c.fillRect(1010, 560, 12, 60); c.fillStyle = "#555"; c.beginPath(); c.arc(1016, 552, 16, 0, Math.PI * 2); c.fill();
  c.fillStyle = "#C83A3A"; c.fillRect(890, 640, 50, 22); c.fillStyle = "#FFF"; c.font = font(800, 16, true); c.textAlign = "center"; c.fillText("幹事", 915, 657);
  // ön plan: kadeh kaldıran kalabalık silüetleri
  dof(c, 5, () => { for (let i = 0; i < 7; i++) drawPerson(c, 120 + i * 280, 1200, 1.4, { outfit: (i + 1) % 6, pose: "stand", shade: 0.85, rim: 0.4, rimSide: -1, armUp: 0.4 + 0.3 * Math.abs(Math.sin(t * 2 + i)), bob: breathe(t, i) }); });
  if (l > 41.1) confetti(c, t, g(41.1), 960, 300, 0.5 * (1 - prog(l, 43.0, 43.6)), 14);
  c.restore();
  // isim etiketi büyür
  layer(c, name * (1 - prog(l, 43.2, 43.5)), () => {
    c.save(); c.translate(1340, 470); c.scale(lerp(0.6, 1, name), lerp(0.6, 1, name));
    c.fillStyle = C.paper; rr(c, -150, -56, 300, 112, 8); c.fill(); c.strokeStyle = C.yellow; c.lineWidth = 5; rr(c, -150, -56, 300, 112, 8); c.stroke();
    c.fillStyle = C.ink; c.font = font(800, 54, true); c.textAlign = "center"; c.fillText("山田 健一", 0, 18); c.restore();
  });
  // puan oku yükselir
  layer(c, ease.out(prog(l, 43.4, 43.8)), () => {
    c.save(); c.translate(1500, 600);
    c.fillStyle = "rgba(10,12,16,0.75)"; rr(c, -170, -150, 340, 300, 10); c.fill();
    c.fillStyle = C.mist; c.font = font(600, 28, true); c.textAlign = "center"; c.fillText("今期評価", 0, -100);
    c.font = font(800, 110, true); c.fillStyle = up > 0.5 ? C.yellow : C.text; c.fillText(up > 0.5 ? "A" : "B", -40, 50 - up * 10);
    c.strokeStyle = C.yellow; c.lineWidth = 8; c.beginPath(); c.moveTo(70, 80); c.lineTo(70, lerp(80, -40, up)); c.stroke();
    c.fillStyle = C.yellow; c.beginPath(); c.moveTo(70, lerp(80, -40, up) - 30); c.lineTo(46, lerp(80, -40, up)); c.lineTo(94, lerp(80, -40, up)); c.fill();
    c.restore();
  });
  label(c, 1500, 820, "名前が知られていただけで", ease.out(prog(l, 43.6, 44.1)) * (1 - prog(l, 46.6, 47.0)), C.yellow, 34);
}

// ================= J (18): 評価する人もまた、上から評価されている =================
function sceneAbove(c: Ctx, t: number) {
  const l = t - P18.at;
  const wIn = 1 - ease.out(prog(l, 46.9, 47.5));
  const tilt = ease.inOut(prog(l, 48.6, 50.2));
  const beam = ease.out(prog(l, 49.3, 50.0));
  c.save();
  dof(c, wIn * 18, () => {
    c.save();
    cam(c, t, lerp(1.0, 0.8, tilt), wIn * -1700, lerp(0, 230, tilt), 0.3, 960, 560);
    c.fillStyle = "#07090D"; c.fillRect(-800, -1200, W + 1600, H + 2400);
    // üst kat: daha yüksek koltuk + bakan figür
    lightCone(c, 1260, -1000, Math.PI / 2, 0.2, 900, 0.14, "200,212,235");
    chainLevel(c, 1260, -160, 1.0, { label: "部長", lit: 0.4, w: 460 });
    drawPerson(c, 1260, -240, 0.85, { outfit: 5, tie: true, pose: "sit", rim: 0.8, rimSide: -1, facing: -0.5, eye: 1, gazeX: -0.8, bob: breathe(t, 3) * 0.4 });
    armchair(c, 1380, -160, 0.8, { col: "#3A2E2A", tall: 1.3 });
    gazeBeam(c, 1220, -400, 760, 560, beam);
    // alt: değerlendirici (上司 outfit 4) masasında, 20 dosya
    lightPool(c, 760, 760, 500, "rgba(255,220,160,", 0.24);
    c.fillStyle = "#3A281A"; c.fillRect(-800, 820, W + 1600, 600);
    officeDesk(c, 820, 820, 1.2, 0.6, 0.8);
    drawPerson(c, 760, 820, 1.25, { outfit: 4, tie: true, pose: "desk", rim: 0.7, rimSide: 1, facing: lerp(0.3, -0.2, tilt), eye: 1, gazeX: lerp(0.5, 0.6, tilt), shade: beam * 0.25, bob: breathe(t) * 0.5 - beam * 5 });
    for (let i = 0; i < 8; i++) { c.fillStyle = i % 2 ? C.paper : "#CFC9BA"; c.fillRect(980, 780 - i * 6, 140, 6); }
    c.restore();
  });
  c.restore();
  label(c, 960, 140, "評価する人も、また", ease.out(prog(l, 47.7, 48.2)) * (1 - prog(l, 49.0, 49.3)), C.text, 48);
  label(c, 560, 140, "上から、評価されている", ease.out(prog(l, 49.5, 50.0)) * (1 - prog(l, 51.0, 51.4)), C.mist, 48);
}

// ================= K (18): 説明でき、責任を問われにくい評価 =================
function sceneSafe(c: Ctx, t: number) {
  const l = t - P18.at;
  const k = ease.inOut(prog(l, 51.2, 57.8));
  const pick = ease.inOut(prog(l, 54.7, 55.6));
  c.save();
  cam(c, t, lerp(1.15, 1.25, k), lerp(-40, 40, k), lerp(10, 30, k), 0.25, 960, 640);
  evalDesk(c, t, l, 7);
  // sol: わかりやすい成果カード (三つのチェック) / sağ: 見えにくい貢献 (B)
  const lx = lerp(640, 760, pick), ly = lerp(560, 640, pick);
  c.save(); c.translate(lx, ly); c.rotate(lerp(-0.04, 0, pick));
  lightPool(c, 0, 0, 300, "rgba(242,207,58,", 0.2 + 0.2 * pick);
  c.fillStyle = "rgba(0,0,0,0.45)"; rr(c, -226, -166, 460, 340, 8); c.fill();
  c.fillStyle = C.paper; rr(c, -230, -170, 460, 340, 8); c.fill();
  c.fillStyle = C.ink; c.font = font(800, 36, true); c.textAlign = "left"; c.fillText("売上 前年比 +12%", -200, -110);
  const chk = [["分かりやすい", 51.4], ["説明できる", 52.0], ["責任を問われにくい", 53.4]] as const;
  chk.forEach(([s, t0], i) => {
    const m = ease.back(prog(l, t0, t0 + 0.35));
    c.fillStyle = "rgba(26,29,36,0.75)"; c.font = font(600, 30, true); c.fillText(s, -150, -30 + i * 64);
    if (m > 0) { c.save(); c.translate(-180, -40 + i * 64); c.scale(m, m); c.strokeStyle = "#2E7D4A"; c.lineWidth = 6; c.beginPath(); if (i === 2) { c.moveTo(-14, -16); c.lineTo(14, -16); c.lineTo(14, 2); c.quadraticCurveTo(10, 16, 0, 22); c.quadraticCurveTo(-10, 16, -14, 2); c.closePath(); } else { c.moveTo(-12, 0); c.lineTo(-3, 10); c.lineTo(14, -12); } c.stroke(); c.restore(); }
  });
  c.restore();
  // sağ kart: B'nin見えにくい貢献 — itilir, solar
  c.save(); c.translate(lerp(1280, 1420, pick), lerp(580, 640, pick)); c.rotate(lerp(0.04, 0.16, pick)); c.globalAlpha *= 1 - pick * 0.5;
  c.fillStyle = "rgba(0,0,0,0.45)"; rr(c, -196, -136, 400, 280, 8); c.fill();
  c.fillStyle = "#A9A497"; rr(c, -200, -140, 400, 280, 8); c.fill();
  c.fillStyle = "rgba(26,29,36,0.7)"; c.font = font(700, 30, true); c.textAlign = "left"; c.fillText("障害の予兆つぶし", -170, -80);
  c.font = font(500, 26, true); c.fillText("（説明に時間がかかる）", -170, -30);
  c.restore();
  // el: 左カードを手前へ (上司の手)
  c.restore();
  label(c, 960, 140, "選びたくなるのは、自然なこと", ease.out(prog(l, 55.6, 56.1)) * (1 - prog(l, 57.4, 57.8)), C.text, 48);
}

// ================= L (18): この席に座れば、誰もが =================
function sceneMirror(c: Ctx, t: number) {
  const l = t - P18.at;
  const k = ease.inOut(prog(l, 57.5, 63.4));
  const recall = ease.out(prog(l, 57.8, 58.4)) * (1 - prog(l, 60.2, 60.6));
  const sit = ease.inOut(prog(l, 60.6, 61.8));
  const ghosts = ease.out(prog(l, 62.0, 62.9));
  const lampOff = ease.in(prog(l, 63.6, 64.6));
  c.save();
  cam(c, t, lerp(1.0, 1.18, k), lerp(0, -30, k), lerp(-20, -60, k), 0.2, 960, 560);
  // gözlem odası: camın öbür yanı — şimdi koltuk bizim
  c.fillStyle = "#06080C"; c.fillRect(-800, -600, W + 1600, H + 1200);
  dof(c, 4, () => {
    c.fillStyle = "#1C2128"; c.fillRect(160, 140, 1600, 620);
    for (let i = 0; i < 4; i++) { c.fillStyle = "rgba(200,220,240,0.04)"; c.beginPath(); c.moveTo(300 + i * 380, 140); c.lineTo(420 + i * 380, 140); c.lineTo(260 + i * 380, 760); c.lineTo(140 + i * 380, 760); c.fill(); }
    // camda: geçmiş sahnelerin hayaleti — A sarı, B gri (さっきまで不思議に)
    layer(c, recall, () => {
      drawPerson(c, 640, 700, 0.8, { outfit: 0, pose: "stand", glow: 0.8, rim: 0.6, eye: 1 });
      drawPerson(c, 1280, 700, 0.8, { outfit: 2, pose: "desk", shade: 0.6, rim: 0.3, eye: 1 });
      c.font = font(800, 90, true); c.fillStyle = C.mist; c.textAlign = "center"; c.fillText("？", 960, 420 + Math.sin(t * 2) * 6);
    });
  });
  c.strokeStyle = "#1A1E25"; c.lineWidth = 40; c.strokeRect(140, 120, 1640, 660);
  c.fillStyle = "#14171C"; c.fillRect(-800, 800, W + 1600, 500);
  lightPool(c, 960, 860, 600, "rgba(255,220,160,", 0.22 * (1 - lampOff));
  // koltuk: hayalet oturanlar (誰もが)
  armchair(c, 960, 900, 1.15, { col: "#4A3428", glow: 0.6 * (1 - lampOff) + sit * 0.3, tall: 1.15 });
  for (let i = 0; i < 5; i++) layer(c, ghosts * (0.4 - i * 0.04) * (1 - lampOff), () => drawPerson(c, 960 + (i - 2) * 26, 860, 1.08, { outfit: i, pose: "sit", rim: 0.4, facing: (i - 2) * 0.2, eye: 1 }));
  // masa + A/B kartı: kalem A'ya gider
  faceCard(c, 740, 760, 0.8, { outfit: 0, name: "Aさん", glow: (1 - lampOff), rot: -0.06 });
  faceCard(c, 1180, 770, 0.8, { outfit: 2, name: "Bさん", blank: 0.4, rot: 0.08, alpha: 1 - ghosts * 0.4 });
  const pk = ease.inOut(prog(l, 62.0, 63.2));
  if (l > 61.0) pen(c, lerp(960, 770, pk), lerp(680, 740, pk), 0.6, 0.8);
  c.restore();
  fadeBlack(c, lampOff * 0.8);
  label(c, 960, 140, "さっきまで、不思議に思っていたこと", ease.out(prog(l, 57.8, 58.3)) * (1 - prog(l, 60.2, 60.6)), C.mist, 46);
  label(c, 960, 140, "この席に座れば", ease.out(prog(l, 60.6, 61.1)) * (1 - prog(l, 61.9, 62.2)), C.text, 50);
  label(c, 960, 140, "誰もが、同じことをしてしまう", ease.out(prog(l, 62.0, 62.5)) * (1 - prog(l, 64.6, 65.2)), C.yellow, 50);
  void dustPuff; void evalSheet; void envMeetingRoom; void flashPop; void dust;
}

// ================= ÇİZİM =================
const SCENES: [number, number, (c: Ctx, t: number) => void, Lens][] = [
  [f(-1.2), g(0.6), sceneSwap, LENS_OBS],
  [g(-0.4), g(7.2), sceneDesk, LENS_DESK],
  [g(6.8), g(12.6), sceneFaces, LENS_DESK],
  [g(12.2), g(18.6), sceneClue, LENS_DESK],
  [g(18.3), g(24.5), sceneScore, LENS_DESK],
  [g(24.2), g(29.2), sceneNames, LENS_DOC],
  [g(29.0), g(34.4), sceneRecency, LENS.night],
  [g(34.2), g(39.8), sceneHalo, LENS_DESK],
  [g(39.6), g(47.2), sceneEvent, LENS_PARTY],
  [g(46.9), g(51.6), sceneAbove, LENS_COLD],
  [g(51.2), g(57.8), sceneSafe, LENS_DESK],
  [g(57.5), END, sceneMirror, LENS_OBS],
];
const HARD = new Set<any>([sceneNames, sceneAbove]); // whip-pan girişli

function draw(ctx: Ctx, t: number) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
  ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H);
  const active = SCENES.filter(([a, b]) => t >= a && t <= b);
  const L = active.length ? active[active.length - 1][3] : LENS.night;
  if (active.length) {
    lens(ctx, t, L, (c) => {
      for (const [a, , fn] of active) layer(c, HARD.has(fn) || a <= f(-1.2) ? 1 : ease.sine(prog(t, a, a + 0.6)), () => fn(c, t));
    });
  }
  whipStreaks(ctx, Math.sin(Math.PI * prog(t, g(24.1), g(24.9))), 1, 10);
  whipStreaks(ctx, Math.sin(Math.PI * prog(t, g(46.8), g(47.6))), -1, 11);
  sectionTitle(ctx, t, 0.0, 3.6, "09", "評価する側に座る");
  drawSubtitles(ctx, parts, t);
  fadeBlack(ctx, 1 - prog(t, 0, 0.5));
  fadeBlack(ctx, prog(t, END - 1.4, END - 0.2));
}

// ================= SES EFEKTLERİ (eyleme bire bir) =================
const cues: Cue[] = [];
const cue = (t: number, type: string, gain = 1, p: Record<string, number> = {}) => cues.push({ t, type, gain, p });

cue(0.0, "room", 0.5, { d: END });
cue(0.35, "whoosh", 0.5, { d: 1.2 });                              // başlık
cue(f(1.1), "bulbhum", 0.3, { d: 4.0 });                           // gözlem odası ışığı yanar
cue(f(1.1), "click", 0.35);                                        // ışık düğmesi
cue(f(2.9), "signcreak", 0.3);                                     // levha asılı
cue(f(3.8), "chair", 0.6);                                         // koltuk bize döner
cue(f(4.5), "plateflip", 0.55);                                    // levha döner (逆)
cue(g(0.2), "lamp", 0.4);                                          // değerlendirici abajuru
cue(g(0.6), "chair", 0.3);                                         // izleyici koltuğa yerleşir
cue(g(2.8), "thunk", 0.3);                                         // kum saati masaya
cue(g(3.4), "sand", 0.4, { d: 3.6 });                              // kum akar (一時間)
cue(g(4.8), "boxland", 0.5);                                       // dosya yığını düşer
cue(g(5.5), "sheetfan", 0.55);                                     // 20 sayfa yelpaze
cue(g(6.9), "riffle", 0.35);                                       // kartlar dizilir
for (let i = 0; i < BLANK.length; i++) cue(g(8.7 + i * 0.16), "erase", 0.22); // yüzler silinir
cue(g(10.8), "lowdrone", 0.3, { d: 1.8 });                         // ？ — boşluk
cue(g(12.4), "pen", 0.15, { d: 3.4 });                             // kalem havada dolaşır (kâğıda değmeden sürtünme)
for (let i = 0; i < 3; i++) cue(g(13.3 + i * 0.2), "paper", 0.25); // ipucu kartları
cue(g(16.8), "click", 0.45);                                       // 決まっている: kalem kilitlenir
cue(g(18.7), "slide", 0.45, { d: 0.9 });                           // kartlar ayrılır
cue(g(19.7), "pen", 0.45, { d: 2.6 });                             // yazmaya başlar
for (let i = 0; i < 13; i++) cue(g(22.5 + i * 0.11), "inkdot", 0.2); // puan noktaları
cue(g(24.1), "whoosh", 0.8, { d: 0.8 });                           // whip-pan → klasör
cue(g(25.0), "folderclose", 0.45);                                 // klasör kapağı açılır
for (let i = 0; i < 4; i++) cue(g(26.9 + i * 0.25), "flick", 0.3); // sekmeler çıkar
for (let i = 0; i < 12; i++) cue(g(29.3 + i * 0.07), "pageflip", 0.12); // takvim ayları
cue(g(30.6), "stackcreak", 0.35, { d: 1.4 });                      // son aylar ağırlaşır
cue(g(31.6), "thump", 0.4);                                        // 重く: kartlar çöker
cue(g(32.7), "stamp", 0.55);                                       // 期末誤差
cue(g(34.8), "pin", 0.45);                                         // rozet takılır
cue(g(35.0), "glowhum", 0.4, { d: 3.0 });                          // hale yayılır
for (let i = 0; i < 4; i++) cue(g(36.6 + i * 0.22), "inkdot", 0.3); // ◎ işaretleri
cue(g(38.0), "stamp", 0.55);                                       // ハロー効果
cue(g(39.6), "murmur", 0.35, { d: 7.4 });                          // parti kalabalığı
cue(g(40.5), "mictap", 0.5);                                       // 幹事 mikrofona vurur
cue(g(41.1), "clap", 0.4, { d: 1.4 });                             // isim duyurulur
cue(g(41.15), "pop", 0.3);                                         // konfeti topu
cue(g(43.5), "riser", 0.3, { d: 1.0 });                            // puan B → A yükselir
cue(g(46.8), "whoosh", 0.8, { d: 0.8 });                           // whip-pan → üst kat
cue(g(48.6), "creak", 0.3, { d: 1.4 });                            // kamera yukarı (gıcırtı: ahşap kat)
cue(g(49.3), "glasswall", 0.35);                                   // bakış ışını iner
cue(g(51.4), "checkmark", 0.35); cue(g(52.0), "checkmark", 0.35);  // ✓ ✓
cue(g(53.4), "thunk", 0.35);                                       // 🛡 責任を問われにくい
cue(g(54.7), "slide", 0.5, { d: 0.9 });                            // kart öne çekilir
cue(g(54.8), "flutter", 0.25);                                     // B kartı kenara itilir
cue(g(57.6), "chair", 0.4);                                        // gözlem odasına dönüş: koltuk
cue(g(57.8), "tapehiss", 0.25, { d: 2.4 });                        // geçmişin hayaleti (camda)
cue(g(60.6), "chair", 0.55);                                       // この席に座れば
cue(g(62.0), "heartbeat", 0.4, { d: 1.8 });                        // 誰もが — hayaletler
cue(g(62.4), "pen", 0.3, { d: 0.8 });                              // kalem A'ya
cue(g(63.6), "lamp", 0.45);                                        // lamba söner
cue(END - 1.5, "whoosh", 0.25, { d: 1.3 });

export const s09: Section = { id: "s09", duration: END, parts, cues, draw };
