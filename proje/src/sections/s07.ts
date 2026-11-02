// s07 頼めば確実な人 — ses 13, 14  (s06 yapısı: SCENES + lens + cues)
// Yeni ortak parçalar: components/workload.ts → taskCard(), cardStack(), rewardBox(), inOutTray(), burdenSack(), taskLabel()
import { Section, Part, Cue, W, H, clamp, ease, prog, win, lerp, rnd, speaking } from "../engine/core";
import { C, font, lightPool, lightCone, fadeBlack, rr, dust } from "../design/style";
import { lens, LENS, cam, dof, Lens, bokeh } from "../design/grade";
import { envOffice, officeDesk, envLab } from "../design/env";
import { whipStreaks, flashPop } from "../design/fx";
import { drawMascot } from "../characters/mascot";
import { drawPerson } from "../characters/people";
import { mug, plant, wallClock, medal } from "../characters/props";
import { sectionTitle, sourceCard, boardLabel } from "../components/cards";
import { speechBubble } from "../components/evaluation";
import { dustPuff } from "../components/memory";
import { taskCard, cardStack, rewardBox, inOutTray, burdenSack, taskLabel } from "../components/workload";
import { drawSubtitles } from "../components/subtitle";
import t13 from "../timing/13.json";
import t14 from "../timing/14.json";

const P13: Part = { timing: t13 as any, at: 3.4 };
const P14: Part = { timing: t14 as any, at: 39.2 };
const parts = [P13, P14];
const END = 54.6;
const g = (l: number) => P13.at + l;
const h = (l: number) => P14.at + l;
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
/** uçan kart: p 0..1, kavisli yol */
function flyCard(c: Ctx, p: number, x0: number, y0: number, x1: number, y1: number, s: number, lb: string, arc = 160, spin = 0.6, o: { grey?: number; urgent?: number } = {}) {
  if (p <= 0) return;
  const e = ease.inOut(clamp(p));
  const x = lerp(x0, x1, e), y = lerp(y0, y1, e) - Math.sin(e * Math.PI) * arc;
  taskCard(c, x, y, s, { label: lb, rot: (1 - e) * spin + Math.sin(e * 9) * 0.05, alpha: clamp(p * 5), ...o });
}

const LENS_DESK: Lens = { shadow: "rgba(18,46,62,0.34)", high: "rgba(255,190,120,0.12)", bloom: 0.62, ca: 0.8, vig: 0.78, grain: 0.06, exposure: 1.0, sat: 0.9 };
const LENS_LAB: Lens = { shadow: "rgba(16,44,58,0.36)", high: "rgba(210,225,255,0.07)", bloom: 0.5, ca: 1.0, vig: 0.8, grain: 0.065, exposure: 0.98, sat: 0.84 };
const LENS_HEAVY: Lens = { shadow: "rgba(14,30,46,0.42)", high: "rgba(255,180,110,0.06)", bloom: 0.45, ca: 1.2, vig: 0.86, grain: 0.07, exposure: 0.95, sat: 0.78 };

// ---------- ortak: B'nin gece masası (sahne A, B, H, I aynı mekân) ----------
function nightDesk(c: Ctx, t: number, l: number, blurBg: number) {
  c.fillStyle = "#0D1117"; c.fillRect(-800, -600, W + 1600, H + 1200);
  dof(c, blurBg, () => {
    // arka: pencere + şehir (parallax katman 1)
    c.save(); c.translate(-l * 4, 0);
    c.fillStyle = "#0A1120"; c.fillRect(-400, 60, W + 1200, 420);
    for (let i = 0; i < 34; i++) {
      const bx = -400 + rnd(i, 70) * (W + 1200), bw = 50 + rnd(i, 71) * 90, bh = 120 + rnd(i, 72) * 260;
      c.fillStyle = "#0E1626"; c.fillRect(bx, 480 - bh, bw, bh);
      for (let k = 0; k < 10; k++) if (rnd(i * 20 + k, 73) > 0.62) { c.fillStyle = rnd(k, i) > 0.5 ? "rgba(255,196,120,0.65)" : "rgba(150,200,255,0.5)"; c.fillRect(bx + 8 + (k % 3) * (bw / 3), 495 - bh + Math.floor(k / 3) * 26, 8, 11); }
    }
    for (let i = 0; i < 9; i++) { c.fillStyle = "#171C24"; c.fillRect(-400 + i * 300, 60, 18, 420); }
    bokeh(c, t, 14, 120, 460, 77, 0.2);
    c.restore();
    // uzak boş masalar (katman 2): herkes gitmiş
    c.save(); c.translate(-l * 9, 0);
    for (let i = 0; i < 7; i++) { const x = -100 + i * 330; c.fillStyle = "#1C2129"; c.fillRect(x, 560, 230, 12); c.fillStyle = "#11141A"; c.fillRect(x + 70, 494, 92, 60); c.fillStyle = "rgba(30,38,48,0.8)"; c.fillRect(x + 76, 500, 80, 48); }
    c.restore();
  });
  wallClock(c, 1640 - l * 12, 170, 44, 23.2 + l / 3600);
  // ön masa yüzeyi
  const tg = c.createLinearGradient(0, 740, 0, H);
  tg.addColorStop(0, "#4A3422"); tg.addColorStop(1, "#22170F");
  c.fillStyle = tg; c.fillRect(-800, 740, W + 1600, 700);
  c.strokeStyle = "rgba(0,0,0,0.2)"; for (let i = 0; i < 14; i++) { c.beginPath(); c.moveTo(-800, 760 + i * 24); c.bezierCurveTo(200, 766 + i * 24, 1200, 754 + i * 24, 2700, 762 + i * 24); c.stroke(); }
  c.fillStyle = "rgba(255,255,255,0.05)"; c.fillRect(-800, 740, W + 1600, 4);
  // masa lambası (tek sıcak ışık)
  c.strokeStyle = "#3A3F47"; c.lineWidth = 9;
  c.beginPath(); c.moveTo(380, 744); c.lineTo(350, 560); c.lineTo(450, 500); c.stroke();
  c.fillStyle = "#454B55"; c.beginPath(); c.moveTo(420, 470); c.lineTo(520, 500); c.lineTo(486, 548); c.closePath(); c.fill();
  lightCone(c, 490, 520, 1.15, 0.55, 520, 0.16, "255,214,150");
  lightPool(c, 640, 780, 520, "rgba(255,214,150,", 0.24);
}

// ================= A: 報酬 kutusu gelir — 届きます =================
function sceneBox(c: Ctx, t: number) {
  const l = t - P13.at;
  const k = ease.inOut(prog(l, -1.6, 9.6));
  const land = ease.out(prog(l, 2.6, 3.4));
  const ribbon = 1 - ease.inOut(prog(l, 4.9, 5.8));
  const open = ease.out(prog(l, 7.7, 8.3));
  const lap = 1 - ease.inOut(prog(l, -0.6, 0.6));
  c.save();
  cam(c, t, lerp(1.0, 1.2, k), lerp(-80, 60, k), lerp(20, -30, k), 0.5, 960, 640);
  nightDesk(c, t, l, 5 + k * 2);
  // B: masa başında (outfit 2), işi bitirmiş
  drawPerson(c, 380, 900, 1.25, { outfit: 2, pose: "sit", rim: 0.8, rimSide: 1, facing: lerp(0.2, 0.7, land), eye: 1, gazeX: lerp(0, 0.9, land), bob: breathe(t) * 0.6, armUp: 0.1 + 0.15 * win(l, 0.4, 1.4, 0.3) });
  // dizüstü kapanır
  c.save(); c.translate(560, 744);
  c.fillStyle = "#23272E"; c.fillRect(-110, -10, 220, 10);
  c.save(); c.rotate(-Math.PI / 2 * lerp(0.05, 1, lap) * 0.92);
  c.fillStyle = "#2A2F37"; c.fillRect(0, -6, 210, 8);
  c.fillStyle = `rgba(110,170,230,${0.5 * lap})`; c.fillRect(6, -2, 196, 3);
  c.restore();
  lightPool(c, 0, -60, 200, "rgba(110,170,230,", 0.14 * lap);
  c.restore();
  mug(c, t, 1560, 742, 1.0, 1);
  plant(c, t, 1800, 744, 1.3);
  // kutu: yukarıdan kayıp iner (setin içinden)
  const bx = lerp(1500, 1060, land), by = lerp(420, 744, land) - Math.sin(land * Math.PI) * 40;
  const glow = 0.4 + 0.6 * win(l, 2.7, 4.8, 0.4) * (0.85 + 0.15 * Math.sin(t * 6));
  rewardBox(c, t, bx, by, 0.95, { ribbon, open, glow: glow * (1 - open * 0.8), label: "報酬", inner: 1 });
  // kutudan fışkıran görev kartları (次の仕事)
  for (let i = 0; i < 9; i++) {
    const s0 = 7.96 + i * 0.12, p = prog(l, s0, s0 + 0.9);
    if (p <= 0) continue;
    const ang = -Math.PI / 2 + (i - 4) * 0.22, e = ease.out(p);
    const x = 1060 + Math.cos(ang) * 380 * e, y = 580 + Math.sin(ang) * 300 * e + e * e * 40;
    taskCard(c, x, y, 0.8, { label: taskLabel(i), rot: (i - 4) * 0.12 * e, alpha: clamp(p * 4), urgent: i % 4 === 0 ? 1 : 0 });
  }
  // hayalet madalya: 評価ではありません → söner
  const ghost = win(l, 5.9, 7.3, 0.35);
  layer(c, ghost * 0.6, () => { medal(c, 1060, 330, 1.1, 0.4); });
  layer(c, ghost, () => { c.strokeStyle = C.alarm; c.lineWidth = 8; c.beginPath(); c.moveTo(960, 230); c.lineTo(1160, 430); c.stroke(); });
  c.restore();
  label(c, 960, 160, "評価", ease.out(prog(l, 6.0, 6.4)) * (1 - prog(l, 7.4, 7.8)), C.mist, 54);
  label(c, 960, 160, "次の仕事", ease.out(prog(l, 7.96, 8.4)) * (1 - prog(l, 9.2, 9.6)), C.text, 64);
  flashPop(c, 1060, 560, win(l, 7.9, 8.4, 0.2) * 0.35);
}

// ================= C: ofis — 「あの人に頼めば確実だから」 kartlar B'ye kayar =================
const DESKS = [180, 520, 1400, 1740];
function sceneAsk(c: Ctx, t: number) {
  const l = t - P13.at;
  const wIn = 1 - ease.out(prog(l, 9.25, 9.85));
  const k = ease.inOut(prog(l, 9.3, 12.6));
  c.save();
  dof(c, wIn * 18, () => {
    c.save();
    cam(c, t, lerp(1.04, 1.12, k), wIn * 1700 + lerp(-40, 40, k), 0, 0.6, 960, 560);
    envOffice(c, t, 4, -l * 10);
    // B ortada (sarı değil: henüz "görülmüyor", sadece güvenilir)
    officeDesk(c, 960, 880, 1.0, 0.7, 0.8);
    drawPerson(c, 920, 860, 1.05, { outfit: 2, pose: "desk", rim: 0.8, rimSide: 1, facing: 0.1, eye: 1, gazeX: 0, bob: breathe(t) * 0.5 });
    DESKS.forEach((x, i) => {
      officeDesk(c, x, 900, 0.85, 0.5, 0);
      const turn = ease.inOut(prog(l, 9.5 + i * 0.25, 10.1 + i * 0.25));
      drawPerson(c, x - 30, 880, 0.9, { outfit: [0, 1, 3, 5][i], pose: "desk", rim: 0.5, rimSide: x < 960 ? 1 : -1, shade: 0.4, facing: (x < 960 ? 1 : -1) * turn * 0.8, eye: 1, gazeX: (x < 960 ? 1 : -1) * turn, armUp: 0.4 * win(l, 10.0 + i * 0.3, 11.4 + i * 0.2, 0.3), bob: breathe(t, i) * 0.5 });
    });
    // kartlar kenar masalardan B'nin masasına kayar
    DESKS.forEach((x, i) => {
      for (let j = 0; j < 2; j++) {
        const s0 = 10.2 + i * 0.32 + j * 0.5;
        flyCard(c, prog(l, s0, s0 + 0.8), x + 60, 840, 1010 + (i - 1.5) * 18, 852 - (i * 2 + j) * 9, 0.55, taskLabel(i * 2 + j + 3), 120, x < 960 ? -0.5 : 0.5);
      }
    });
    c.restore();
  });
  c.restore();
  speechBubble(c, t, 960 + wIn * 1700, 300, "あの人に頼めば確実だから", prog(l, 9.48, 10.0) * (1 - prog(l, 11.9, 12.3)), { warm: 0.4, size: 46, tail: 1 });
}

// ================= D: 研究 — 自分を律する力 → 期待され、任される =================
const RING = [[360, 860], [600, 760], [1320, 760], [1560, 860], [960, 700]];
function sceneStudy(c: Ctx, t: number) {
  const l = t - P13.at;
  const k = ease.inOut(prog(l, 12.0, 23.8));
  const meter = ease.inOut(prog(l, 15.9, 17.4));
  const ring = ease.out(prog(l, 19.9, 20.8));
  const rack = ease.inOut(prog(l, 13.4, 14.6)); // dergi → figür
  c.save();
  cam(c, t, lerp(1.08, 1.0, k), lerp(40, -20, k), lerp(-10, 30, k), 0.4, 960, 560);
  envLab(c, t, 4);
  c.fillStyle = "rgba(6,8,12,0.35)"; c.fillRect(-600, -400, W + 1200, H + 800);
  lightCone(c, 960, -120, Math.PI / 2, 0.24, 1100, 0.14, "220,230,255");
  // zemin dairesi (gözlem halkası)
  c.save(); c.strokeStyle = `rgba(140,151,168,${0.25 + 0.2 * ring})`; c.lineWidth = 3; c.setLineDash([14, 12]);
  c.beginPath(); c.ellipse(960, 900, lerp(200, 720, ring), lerp(50, 150, ring), 0, 0, Math.PI * 2); c.stroke(); c.restore();
  // merkez: B (sarı yok)
  dof(c, (1 - rack) * 6, () => {
    drawPerson(c, 960, 920, 1.2, { outfit: 2, pose: "stand", rim: 0.9, rimSide: 1, facing: 0, eye: 1, gazeX: Math.sin(t * 0.7) * 0.3, bob: breathe(t) * 0.5 });
  });
  // 自分を律する力 metresi
  layer(c, ease.out(prog(l, 15.4, 15.9)) * (1 - prog(l, 23.4, 23.8)), () => {
    c.save(); c.translate(1260, 420);
    c.fillStyle = "rgba(10,13,18,0.75)"; rr(c, -20, -40, 380, 140, 10); c.fill();
    c.fillStyle = C.mist; c.font = font(600, 26, true); c.textAlign = "left"; c.fillText("自分を律する力", 6, -6);
    c.fillStyle = "#222833"; rr(c, 6, 20, 330, 26, 13); c.fill();
    const gr = c.createLinearGradient(6, 0, 336, 0); gr.addColorStop(0, "#5B6678"); gr.addColorStop(1, "#C9D2DE");
    c.fillStyle = gr; rr(c, 6, 20, 330 * meter, 26, 13); c.fill();
    for (let i = 1; i < 5; i++) { c.fillStyle = "rgba(0,0,0,0.4)"; c.fillRect(6 + i * 66, 20, 2, 26); }
    c.fillStyle = C.text; c.font = font(700, 22); c.fillText("高", 340 * Math.max(0.1, meter) - 20, 80);
    c.restore();
  });
  // 「きちんと」 etiketi: figüre takılır
  layer(c, ease.out(prog(l, 17.76, 18.3)) * (1 - prog(l, 23.4, 23.8)), () => {
    c.save(); c.translate(960, 520); c.rotate(-0.05 + Math.sin(t * 2) * 0.02);
    c.strokeStyle = "rgba(200,206,214,0.5)"; c.lineWidth = 2; c.beginPath(); c.moveTo(0, 60); c.lineTo(0, 120); c.stroke();
    c.fillStyle = C.paper; rr(c, -110, 0, 220, 64, 6); c.fill();
    c.fillStyle = C.ink; c.font = font(700, 34, true); c.textAlign = "center"; c.fillText("きちんと", 0, 44);
    c.restore();
  });
  // 周り: 5 kişi halkada (ön/arka parallax)
  RING.forEach(([x, y], i) => {
    const a = ease.out(prog(l, 19.9 + i * 0.12, 20.5 + i * 0.12));
    if (a <= 0) return;
    const blur = i === 4 ? 4 : 0;
    dof(c, blur, () => layer(c, a, () => drawPerson(c, x, y + (1 - a) * 40, i === 4 ? 0.8 : 1.0, { outfit: [0, 1, 3, 5, 4][i], tie: i === 4, pose: "stand", rim: 0.5, rimSide: x < 960 ? 1 : -1, shade: 0.45, facing: x < 960 ? 0.8 : -0.8, eye: 1, gazeX: x < 960 ? 1 : -1, armUp: 0.45 * win(l, 21.3 + i * 0.12, 22.6, 0.3), bob: breathe(t, i) * 0.4 })));
  });
  // 期待: her birinden kart B'ye uçar (多くの仕事)
  RING.forEach(([x, y], i) => {
    for (let j = 0; j < 3; j++) {
      const s0 = 21.4 + i * 0.1 + j * 0.28;
      const tx = 960 + (rnd(i * 3 + j, 9) - 0.5) * 120, ty = 640 - (i * 3 + j) * 6;
      flyCard(c, prog(l, s0, s0 + 0.7) * (1 - prog(l, 23.4, 23.8)), x, y - 240, tx, ty, 0.5, taskLabel(i * 3 + j), 140, x < 960 ? -0.7 : 0.7);
    }
  });
  c.restore();
  // dergi (rack focus öncesi ön plan)
  layer(c, 1 - prog(l, 14.4, 15.0), () => dof(c, rack * 10, () => {
    c.save(); c.translate(520, 760); c.rotate(-0.08);
    c.fillStyle = "rgba(0,0,0,0.5)"; rr(c, -296, -186, 600, 380, 8); c.fill();
    c.fillStyle = C.paper; rr(c, -300, -190, 600, 380, 8); c.fill();
    c.fillStyle = C.ink; c.font = font(700, 28, true); c.textAlign = "left";
    c.fillText("The burden of responsibility", -270, -130);
    c.font = font(400, 20); c.fillStyle = "rgba(26,29,36,0.7)"; c.fillText("Journal of Personality and Social Psychology", -270, -96);
    for (let i = 0; i < 8; i++) c.fillRect(-270, -60 + i * 26, 520 - (i % 3) * 60, 6);
    c.fillStyle = "rgba(242,207,58,0.55)"; c.fillRect(-274, 2, 420 * ease.out(prog(l, 13.6, 14.3)), 22);
    c.restore();
  }));
  label(c, 960, 150, "周りから、多くの仕事を", ease.out(prog(l, 20.42, 20.9)) * (1 - prog(l, 22.2, 22.5)), C.text, 50);
  layer(c, ease.out(prog(l, 22.3, 22.6)) * (1 - prog(l, 23.4, 23.8)), () => stamp(c, 1420, 300, "任される", 1, C.text, -0.08, 56));
}

// ================= E: 見積もり — 周りが思う苦労（小）vs 実際（大）=================
function sceneEstimate(c: Ctx, t: number) {
  const l = t - P13.at;
  const k = ease.inOut(prog(l, 23.4, 30.9));
  const rack = ease.inOut(prog(l, 27.7, 28.6)); // 見積もり → 実際
  const real = ease.out(prog(l, 26.6, 28.8));
  c.save();
  cam(c, t, lerp(1.02, 1.12, k), lerp(-140, 140, rack), lerp(0, 20, k), 0.4, 960, 560);
  c.fillStyle = "#0C0F14"; c.fillRect(-800, -600, W + 1600, H + 1200);
  const fg = c.createLinearGradient(0, 760, 0, H); fg.addColorStop(0, "#1C1F25"); fg.addColorStop(1, "#0E1013");
  c.fillStyle = fg; c.fillRect(-800, 760, W + 1600, 800);
  dust(c, t, 40, 0.28, 71);
  lightCone(c, 1320, -200, Math.PI / 2, 0.26, 1100, 0.14, "255,214,150");
  lightCone(c, 520, -200, Math.PI / 2, 0.22, 1000, 0.08, "190,205,235");
  // sol: 周り — kafa üstünde düşünce balonu, içinde küçük yığın
  dof(c, rack * 6, () => {
    for (let i = 0; i < 3; i++) drawPerson(c, 300 + i * 190, 920, 0.95, { outfit: [0, 3, 5][i], pose: "stand", rim: 0.5, rimSide: 1, shade: 0.4, facing: 0.7, eye: 1, gazeX: 1, bob: breathe(t, i) * 0.4 });
    const ba = ease.out(prog(l, 24.06, 24.7));
    layer(c, ba, () => {
      c.save(); c.translate(500, 360);
      c.fillStyle = "rgba(220,224,230,0.12)"; c.strokeStyle = "rgba(220,224,230,0.5)"; c.lineWidth = 3;
      c.beginPath(); c.ellipse(0, 0, 230, 150, 0, 0, Math.PI * 2); c.fill(); c.stroke();
      for (let i = 0; i < 3; i++) { c.beginPath(); c.arc(-80 + i * 30, 190 + i * 50, 18 - i * 5, 0, Math.PI * 2); c.fill(); c.stroke(); }
      c.restore();
      cardStack(c, t, 500, 420, 0.7, lerp(0, 3, ease.out(prog(l, 26.84, 27.6))), { seed: 2 });
      c.font = font(700, 34, true); c.fillStyle = C.text; c.textAlign = "center"; c.fillText("このくらいでしょ", 500, 300);
    });
  });
  // sağ: 実際 — B ve dev yığın
  dof(c, (1 - rack) * 5, () => {
    cardStack(c, t, 1480, 900, 1.05, 40 * real, { seed: 5, sway: 0.6, glowTop: 0 });
    drawPerson(c, 1250, 920, 1.1, { outfit: 2, pose: "stand", rim: 0.9, rimSide: 1, facing: 0.6, eye: 1, gazeX: 0.8, bob: breathe(t) * 0.5, armUp: 0.25 });
  });
  c.restore();
  label(c, 520, 150, "周りの見積もり", ease.out(prog(l, 24.06, 24.6)), C.mist, 48);
  label(c, 1420, 150, "実際の苦労", ease.out(prog(l, 27.88, 28.4)), C.text, 48);
  layer(c, ease.out(prog(l, 28.36, 28.7)), () => { c.font = font(800, 90, true); c.fillStyle = C.mist; c.textAlign = "center"; c.fillText("<", 960, 200); });
  layer(c, ease.out(prog(l, 28.9, 29.3)) * (1 - prog(l, 30.4, 30.8)), () => stamp(c, 520, 620, "小さく見積もる", 1, C.mist, -0.08, 40));
}

// ================= F: 本人 — 期待を、重荷として =================
function sceneBurden(c: Ctx, t: number) {
  const l = t - P13.at;
  const k = ease.inOut(prog(l, 30.5, 36.2));
  const drop = prog(l, 33.6, 34.0);
  const dropE = drop * drop;
  const sink = ease.out(prog(l, 33.95, 34.6));
  const fall = l > 34.0 ? Math.exp(-(l - 34.0) * 6) * Math.sin((l - 34.0) * 40) : 0;
  c.save();
  cam(c, t, lerp(1.1, 1.3, k) + Math.abs(fall) * 0.01, 0, lerp(-20, 40, k) + fall * 8, 0.3, 960, 620);
  c.fillStyle = "#0A0D12"; c.fillRect(-800, -600, W + 1600, H + 1200);
  lightCone(c, 960, -200, Math.PI / 2, 0.2, 1100, 0.16, "220,226,240");
  const fg = c.createLinearGradient(0, 800, 0, H); fg.addColorStop(0, "#191C22"); fg.addColorStop(1, "#0C0E11");
  c.fillStyle = fg; c.fillRect(-800, 800, W + 1600, 600);
  lightPool(c, 960, 900, 360, "rgba(220,226,240,", 0.12);
  dust(c, t, 30, 0.3, 81);
  // omuzlarda biriken kartlar (期待)
  const by = 960 + sink * 30;
  drawPerson(c, 960, by, 1.5, { outfit: 2, pose: "stand", rim: 0.7, rimSide: 1, facing: 0, eye: 1, gazeX: 0, bob: -sink * 8 + breathe(t) * 0.3 });
  cardStack(c, t, 960, by - 440 + sink * 10, 1.0, lerp(0, 9, ease.out(prog(l, 32.8, 33.6))), { seed: 11, sway: 0.3 });
  // kum torbası yukarıdan düşer
  const sy = lerp(-300, by - 560, dropE) + sink * 10;
  burdenSack(c, 960, sy, 1.0, "重荷", ease.out(prog(l, 33.5, 33.7)));
  if (l > 34.0) dustPuff(c, t, g(34.0), 960, by - 470, 1.2, 3);
  c.restore();
  label(c, 960, 150, "任された本人は", ease.out(prog(l, 30.94, 31.5)) * (1 - prog(l, 32.6, 33.0)), C.mist, 48);
  label(c, 960, 150, "その期待を", ease.out(prog(l, 32.8, 33.2)) * (1 - prog(l, 37.4, 37.9)), C.text, 48);
}

// ================= G (14): 仕事は集まっていく — tepeden ofis, kart akıntıları =================
function sceneFlow(c: Ctx, t: number) {
  const l = t - P14.at;
  const k = ease.inOut(prog(l, -0.6, 4.2));
  c.save();
  cam(c, t, lerp(0.95, 1.12, k), 0, 0, 0.3, 960, 560);
  // tepeden plan: halı + masa adaları
  c.fillStyle = "#151A21"; c.fillRect(-800, -600, W + 1600, H + 1200);
  c.strokeStyle = "rgba(255,255,255,0.025)"; for (let x = -800; x < W + 800; x += 40) { c.beginPath(); c.moveTo(x, -600); c.lineTo(x, H + 600); c.stroke(); }
  const desks: [number, number][] = [];
  for (let r = 0; r < 3; r++) for (let q = 0; q < 5; q++) desks.push([260 + q * 350, 200 + r * 340]);
  const center = 7; // B'nin masası (orta)
  desks.forEach(([x, y], i) => {
    const me = i === center;
    c.fillStyle = "rgba(0,0,0,0.4)"; c.fillRect(x - 116, y - 56, 240, 120);
    c.fillStyle = me ? "#5A4130" : "#2C3138"; c.fillRect(x - 120, y - 60, 240, 120);
    c.fillStyle = "#111418"; c.fillRect(x - 40, y - 52, 80, 14);
    // kişi (tepeden kafa)
    c.fillStyle = ["#2F4A6B", "#B9A88A", "#6E2F35", "#8C8C88", "#3D4A5A"][i % 5];
    if (me) c.fillStyle = "#5A6B4A";
    c.beginPath(); c.ellipse(x, y + 92, 46, 30, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = me ? "#120E0A" : "#1A1410"; c.beginPath(); c.arc(x, y + 86, 20, 0, Math.PI * 2); c.fill();
    if (me) lightPool(c, x, y, 220, "rgba(255,214,150,", 0.28);
  });
  const [bx, by] = desks[center];
  // akıntılar: her masadan merkeze kart
  desks.forEach(([x, y], i) => {
    if (i === center) return;
    for (let j = 0; j < 3; j++) {
      const s0 = 0.4 + rnd(i, 41) * 1.2 + j * 0.9, p = prog(l, s0, s0 + 1.1);
      if (p <= 0 || p >= 1) continue;
      const e = ease.inOut(p);
      const xx = lerp(x, bx, e) + Math.sin(e * Math.PI) * (rnd(i, 42) - 0.5) * 160, yy = lerp(y, by, e);
      c.save(); c.globalAlpha *= 0.25; c.strokeStyle = C.paper; c.lineWidth = 2; c.beginPath(); c.moveTo(x, y); c.lineTo(xx, yy); c.stroke(); c.restore();
      taskCard(c, xx, yy, 0.5, { label: taskLabel(i + j), rot: (1 - e) * (rnd(i, 43) - 0.5) * 2 });
    }
  });
  // merkez yığın büyür (tepeden: üst üste kartlar)
  const n = Math.floor(lerp(2, 22, prog(l, 0.4, 4.4)));
  for (let i = 0; i < n; i++) taskCard(c, bx + 40 + (rnd(i, 44) - 0.5) * 50, by - 6 + (rnd(i, 45) - 0.5) * 30, 0.5, { label: taskLabel(i), rot: (rnd(i, 46) - 0.5) * 0.6 });
  c.restore();
  label(c, 960, 140, "仕事は、集まっていく", ease.out(prog(l, 2.18, 2.7)) * (1 - prog(l, 3.6, 4.0)), C.text, 52);
}

// ================= H (14): 静かにこなされていく — IN → OUT =================
function sceneQuiet(c: Ctx, t: number) {
  const l = t - P14.at;
  const k = ease.inOut(prog(l, 3.6, 8.0));
  // sessiz işleme: kart IN'den OUT'a — giderek hızlanır
  const done = (() => { let n = 0; for (let i = 0; i < 40; i++) { const s0 = 4.2 + i * Math.max(0.12, 0.42 - i * 0.03); if (l > s0) n++; } return n; })();
  const nextT = 4.2;
  void nextT;
  c.save();
  cam(c, t, lerp(1.3, 1.08, k), lerp(140, 0, k), lerp(40, 0, k), 0.3, 960, 640);
  nightDesk(c, t, l + 20, 6);
  drawPerson(c, 380, 900, 1.25, { outfit: 2, pose: "desk", rim: 0.8, rimSide: 1, facing: 0.5, eye: 1, gazeX: 0.8, bob: breathe(t) * 0.5, armUp: 0.2 + 0.15 * Math.abs(Math.sin(t * 7)) });
  mug(c, t, 1640, 742, 1.0, 0.4);
  inOutTray(c, t, 1000, 744, 1.3, Math.max(4, 22 - done * 0.5), Math.min(done, 20), { outGrey: 0 });
  // tek kartın IN→OUT yolculuğu (el hareketi)
  const ph = (l * 2.6) % 1;
  if (l > 4.2) flyCard(c, ph, 1000 - 156, 744 - 26 - 18 * 14, 1000 + 156, 744 - 26 - Math.min(done, 20) * 14, 0.5, taskLabel(Math.floor(l * 2.6)), 80, 0.2);
  c.restore();
  label(c, 960, 150, "静かに", ease.out(prog(l, 5.3, 5.8)) * (1 - prog(l, 7.2, 7.6)), C.mist, 50);
}

// ================= I (14): 当たり前 — kartlar griye solar, hafızadan silinir =================
function sceneNormal(c: Ctx, t: number) {
  const l = t - P14.at;
  const k = ease.inOut(prog(l, 7.3, 14.4));
  const grey = ease.inOut(prog(l, 9.0, 11.0));
  const vanish = ease.inOut(prog(l, 12.0, 13.8));
  c.save();
  cam(c, t, lerp(1.08, 0.8, k), lerp(0, 60, k), lerp(0, -60, k), 0.25, 960, 640);
  nightDesk(c, t, l + 20, 6);
  drawPerson(c, 380, 900, 1.25, { outfit: 2, pose: "desk", rim: lerp(0.8, 0.3, grey), rimSide: 1, facing: 0.5, eye: 1, gazeX: 0.8, shade: 0.5 * grey, bob: breathe(t) * 0.5, armUp: 0.2 + 0.15 * Math.abs(Math.sin(t * 7)) });
  inOutTray(c, t, 1000, 744, 1.3, 6, 20, { outGrey: grey });
  // arkada biten iş yığınları: soldan sağa, griye döner sonra toza
  for (let i = 0; i < 6; i++) {
    const x = 1260 + i * 110, n = 8 + rnd(i, 51) * 14;
    const a = 1 - clamp(vanish * 1.6 - i * 0.12);
    cardStack(c, t, x, 744, 0.75, n * ease.out(prog(l, 7.6 + i * 0.2, 8.6 + i * 0.2)), { seed: 20 + i, grey, alpha: a });
    if (vanish > 0.05 + i * 0.07 && vanish < 0.9) dustPuff(c, t, h(12.0 + i * 0.25), x, 744 - n * 10, 0.9, i);
  }
  c.restore();
  layer(c, ease.out(prog(l, 9.9, 10.3)) * (1 - prog(l, 12.6, 13.2)), () => stamp(c, 760, 380, "当たり前", 1, "#A9B2C0", -0.08, 70));
  label(c, 960, 150, "記憶に、残らない", ease.out(prog(l, 12.0, 12.6)), C.mist, 46);
}

// ================= ÇİZİM =================
const SCENES: [number, number, (c: Ctx, t: number) => void, Lens][] = [
  [g(-1.2), g(9.6), sceneBox, LENS_DESK],
  [g(9.2), g(12.6), sceneAsk, LENS.night],
  [g(12.0), g(23.9), sceneStudy, LENS_LAB],
  [g(23.4), g(30.9), sceneEstimate, LENS.night],
  [g(30.4), h(0.0), sceneBurden, LENS_HEAVY],
  [h(-0.6), h(4.2), sceneFlow, LENS.night],
  [h(3.6), h(8.0), sceneQuiet, LENS_DESK],
  [h(7.4), END, sceneNormal, LENS_HEAVY],
];
const HARD = new Set<any>([sceneAsk]); // whip-pan girişli

function draw(ctx: Ctx, t: number) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
  ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H);
  const active = SCENES.filter(([a, b]) => t >= a && t <= b);
  const L = active.length ? active[active.length - 1][3] : LENS.night;
  if (active.length) {
    lens(ctx, t, L, (c) => {
      for (const [a, , fn] of active) layer(c, HARD.has(fn) || a <= g(-1.2) ? 1 : ease.sine(prog(t, a, a + 0.6)), () => fn(c, t));
    });
  }
  whipStreaks(ctx, Math.sin(Math.PI * prog(t, g(9.2), g(10.0))), 1, 7);
  sectionTitle(ctx, t, 0.0, 3.6, "07", "頼めば確実な人");
  sourceCard(ctx, t, g(12.4), g(30.4), "Koval, vanDellen, Fitzsimons & Ranby (2015)");
  drawSubtitles(ctx, parts, t);
  fadeBlack(ctx, 1 - prog(t, 0, 0.5));
  fadeBlack(ctx, prog(t, END - 1.4, END - 0.2));
}

// ================= SES EFEKTLERİ (eyleme bire bir) =================
const cues: Cue[] = [];
const cue = (t: number, type: string, gain = 1, p: Record<string, number> = {}) => cues.push({ t, type, gain, p });

cue(0.0, "room", 0.5, { d: END });
cue(0.35, "whoosh", 0.5, { d: 1.2 });                               // başlık
cue(g(-0.4), "laptop", 0.5);                                        // dizüstü kapanır
cue(g(2.7), "slide", 0.4, { d: 0.7 });                              // kutu masaya kayar
cue(g(3.38), "boxland", 0.7);                                       // 届きます: kutu oturur
cue(g(4.9), "ribbon", 0.6);                                         // kurdele çözülür
cue(g(6.0), "medalfade", 0.4);                                      // 評価ではない: madalya söner
cue(g(7.7), "lidpop", 0.7);                                         // kapak fırlar
cue(g(7.96), "cardburst", 0.6);                                     // 次の仕事: kartlar fışkırır
cue(g(9.2), "whoosh", 0.8, { d: 0.8 });                             // whip-pan → ofis
cue(g(9.5), "chair", 0.25); cue(g(9.8), "chair", 0.2);              // meslektaşlar döner
cue(g(9.48), "pop", 0.35);                                          // balon
DESKS.forEach((_, i) => { for (let j = 0; j < 2; j++) cue(g(10.2 + i * 0.32 + j * 0.5 + 0.8), "carddeal", 0.35); }); // kartlar B'nin masasına
cue(g(12.0), "pageflip", 0.5);                                      // dergi
cue(g(13.6), "pen", 0.35, { d: 0.7 });                              // fosforlu kalem
cue(g(15.9), "meter", 0.45, { d: 1.5 });                            // 律する力 metresi dolar
cue(g(17.76), "paper", 0.4);                                        // きちんと etiketi
for (let i = 0; i < 5; i++) cue(g(19.9 + i * 0.12), "step", 0.25);  // 周り halkaya girer
for (let i = 0; i < 15; i++) cue(g(21.4 + Math.floor(i / 3) * 0.1 + (i % 3) * 0.28), "flick", 0.18); // beklenti kartları uçar
cue(g(22.3), "stamp", 0.6);                                         // 任される
cue(g(24.06), "pop", 0.3);                                          // düşünce balonu
for (let i = 0; i < 3; i++) cue(g(26.9 + i * 0.25), "carddeal", 0.25); // küçük yığın
cue(g(26.7), "stackcreak", 0.55, { d: 2.0 });                       // dev yığın yükselir
cue(g(27.8), "lowdrone", 0.3, { d: 2.6 });                          // rack focus
cue(g(28.9), "stamp", 0.4);                                         // 小さく見積もる
cue(g(30.6), "lowdrone", 0.35, { d: 4.0 });
for (let i = 0; i < 4; i++) cue(g(32.8 + i * 0.2), "carddeal", 0.25); // omuza kartlar
cue(g(33.98), "sandbag", 0.85);                                     // 重荷: torba düşer
cue(g(34.0), "dustpuff", 0.4);
cue(h(-0.4), "whoosh", 0.4, { d: 1.0 });                            // geçiş → tepe planı
cue(h(0.3), "flick", 0.2);
for (let i = 0; i < 14; i++) cue(h(0.8 + i * 0.25), "carddeal", 0.12 + 0.01 * i); // 集まっていく
cue(h(3.7), "lamp", 0.35);                                          // masa lambası
for (let i = 0; i < 16; i++) cue(h(4.2 + i * Math.max(0.12, 0.42 - i * 0.03)), "carddeal", 0.12); // IN→OUT, sessiz
cue(h(7.6), "stackcreak", 0.35, { d: 1.6 });                        // arka yığınlar
cue(h(9.0), "lowdrone", 0.3, { d: 3.0 });                           // griye solar
cue(h(9.9), "stamp", 0.45);                                         // 当たり前
cue(h(12.0), "dissolve", 0.5, { d: 1.8 });                          // 記憶に残らない
cue(END - 1.5, "whoosh", 0.3, { d: 1.3 });

export const s07: Section = { id: "s07", duration: END, parts, cues, draw };
void speaking; void drawMascot; void boardLabel; void rnd;
