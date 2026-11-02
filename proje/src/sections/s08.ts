// s08 問いが、自分に向かう — ses 15, 16  (s07 yapısı: SCENES + lens + cues)
// Yeni ortak parçalar: components/direction.ts → compass(), signpost(), post(), domino(), target()
import { Section, Part, Cue, W, H, clamp, ease, prog, win, lerp, rnd } from "../engine/core";
import { C, font, lightPool, lightCone, fadeBlack, rr, dust } from "../design/style";
import { lens, LENS, cam, dof, Lens, bokeh } from "../design/grade";
import { envOffice, officeDesk } from "../design/env";
import { whipStreaks, flashPop, confetti } from "../design/fx";
import { drawPerson } from "../characters/people";
import { mug, plant, wallClock } from "../characters/props";
import { sectionTitle, screenCard, memoryCard } from "../components/cards";
import { speechBubble } from "../components/evaluation";
import { dustPuff } from "../components/memory";
import { taskCard, cardStack, inOutTray, taskLabel } from "../components/workload";
import { compass, signpost, post, domino, target } from "../components/direction";
import { drawSubtitles } from "../components/subtitle";
import t15 from "../timing/15.json";
import t16 from "../timing/16.json";

const P15: Part = { timing: t15 as any, at: 3.4 };
const P16: Part = { timing: t16 as any, at: 66.6 };
const parts = [P15, P16];
const END = 97.6;
const CARD_A = 62.75, CARD_B = 66.55;
const g = (l: number) => P15.at + l;
const h = (l: number) => P16.at + l;
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
/** el yazısı gibi soldan sağa açılan metin */
function writeText(c: Ctx, x: number, y: number, txt: string, k: number, col: string, size: number, align: CanvasTextAlign = "center") {
  if (k <= 0) return;
  c.save(); c.font = font(700, size, true); c.textAlign = align;
  const w = c.measureText(txt).width, x0 = align === "center" ? x - w / 2 : x;
  c.beginPath(); c.rect(x0 - 10, y - size * 1.2, (w + 20) * clamp(k), size * 1.6); c.clip();
  c.fillStyle = col; c.fillText(txt, x, y); c.restore();
}

const LENS_DAY: Lens = { shadow: "rgba(20,46,62,0.28)", high: "rgba(255,200,130,0.12)", bloom: 0.6, ca: 0.6, vig: 0.7, grain: 0.055, exposure: 1.02, sat: 0.92 };
const LENS_DESK: Lens = { shadow: "rgba(18,46,62,0.34)", high: "rgba(255,190,120,0.12)", bloom: 0.62, ca: 0.8, vig: 0.78, grain: 0.06, exposure: 1.0, sat: 0.9 };
const LENS_INNER: Lens = { shadow: "rgba(12,24,44,0.46)", high: "rgba(170,190,230,0.05)", bloom: 0.45, ca: 1.4, vig: 0.9, grain: 0.075, exposure: 0.93, sat: 0.72 };
const LENS_ROAD: Lens = { shadow: "rgba(16,40,56,0.34)", high: "rgba(255,210,140,0.08)", bloom: 0.55, ca: 0.8, vig: 0.8, grain: 0.06, exposure: 0.98, sat: 0.85 };
const LENS_WARM: Lens = { shadow: "rgba(22,40,56,0.28)", high: "rgba(255,200,130,0.16)", bloom: 0.7, ca: 0.5, vig: 0.72, grain: 0.055, exposure: 1.03, sat: 0.95 };

// ---------- ortak: B'nin gece masası (s07 ile aynı mekân). dawn: pencereye şafak ----------
function nightDesk(c: Ctx, t: number, l: number, blurBg: number, o: { dawn?: number; reflect?: number } = {}) {
  const dawn = o.dawn ?? 0;
  c.fillStyle = "#0D1117"; c.fillRect(-800, -600, W + 1600, H + 1200);
  dof(c, blurBg, () => {
    c.save(); c.translate(-l * 4, 0);
    const sky = c.createLinearGradient(0, 60, 0, 480);
    sky.addColorStop(0, `rgb(${lerp(10, 40, dawn)},${lerp(17, 44, dawn)},${lerp(32, 70, dawn)})`);
    sky.addColorStop(1, `rgb(${lerp(10, 150, dawn)},${lerp(17, 96, dawn)},${lerp(32, 70, dawn)})`);
    c.fillStyle = sky; c.fillRect(-400, 60, W + 1200, 420);
    for (let i = 0; i < 34; i++) {
      const bx = -400 + rnd(i, 70) * (W + 1200), bw = 50 + rnd(i, 71) * 90, bh = 120 + rnd(i, 72) * 260;
      c.fillStyle = "#0E1626"; c.fillRect(bx, 480 - bh, bw, bh);
      for (let k = 0; k < 10; k++) if (rnd(i * 20 + k, 73) > 0.62) { c.fillStyle = rnd(k, i) > 0.5 ? "rgba(255,196,120,0.65)" : "rgba(150,200,255,0.5)"; c.fillRect(bx + 8 + (k % 3) * (bw / 3), 495 - bh + Math.floor(k / 3) * 26, 8, 11); }
    }
    for (let i = 0; i < 9; i++) { c.fillStyle = "#171C24"; c.fillRect(-400 + i * 300, 60, 18, 420); }
    bokeh(c, t, 14, 120, 460, 77, 0.2);
    c.restore();
    c.save(); c.translate(-l * 9, 0);
    for (let i = 0; i < 7; i++) { const x = -100 + i * 330; c.fillStyle = "#1C2129"; c.fillRect(x, 560, 230, 12); c.fillStyle = "#11141A"; c.fillRect(x + 70, 494, 92, 60); c.fillStyle = "rgba(30,38,48,0.8)"; c.fillRect(x + 76, 500, 80, 48); }
    c.restore();
  });
  // camda B'nin yansıması (soluk)
  if ((o.reflect ?? 0) > 0) layer(c, (o.reflect ?? 0) * 0.32, () => dof(c, 3, () => drawPerson(c, 1180 - l * 4, 560, 0.9, { outfit: 2, pose: "sit", shade: 0.7, facing: -0.3, eye: 1, gazeX: -0.6 })));
  wallClock(c, 1640 - (l % 30) * 6, 170, 44, 23.5 + l / 3600);
  const tg = c.createLinearGradient(0, 740, 0, H);
  tg.addColorStop(0, "#4A3422"); tg.addColorStop(1, "#22170F");
  c.fillStyle = tg; c.fillRect(-800, 740, W + 1600, 700);
  c.strokeStyle = "rgba(0,0,0,0.2)"; for (let i = 0; i < 14; i++) { c.beginPath(); c.moveTo(-800, 760 + i * 24); c.bezierCurveTo(200, 766 + i * 24, 1200, 754 + i * 24, 2700, 762 + i * 24); c.stroke(); }
  c.fillStyle = "rgba(255,255,255,0.05)"; c.fillRect(-800, 740, W + 1600, 4);
  c.strokeStyle = "#3A3F47"; c.lineWidth = 9;
  c.beginPath(); c.moveTo(380, 744); c.lineTo(350, 560); c.lineTo(450, 500); c.stroke();
  c.fillStyle = "#454B55"; c.beginPath(); c.moveTo(420, 470); c.lineTo(520, 500); c.lineTo(486, 548); c.closePath(); c.fill();
  lightCone(c, 490, 520, 1.15, 0.55, 520, 0.16 + dawn * 0.06, "255,214,150");
  lightPool(c, 640, 780, 520, "rgba(255,214,150,", 0.24 + dawn * 0.08);
}

// ================= A (15): 後から入った人が褒められる =================
function scenePraise(c: Ctx, t: number) {
  const l = t - P15.at;
  const k = ease.inOut(prog(l, -1.0, 5.6));
  const praise = ease.out(prog(l, 3.3, 4.0));
  const rack = ease.inOut(prog(l, 4.3, 5.1)); // yeni gelen → B
  c.save();
  cam(c, t, lerp(1.0, 1.14, k), lerp(60, -80, k), lerp(-10, 20, k), 0.5, 960, 600);
  dof(c, 3 + rack * 8, () => {
    envOffice(c, t, 3, -l * 8);
    // arka: 上司 + yeni gelen (outfit 1), alkışlayan iki kişi
    officeDesk(c, 1240, 820, 0.9, 0.7, 0);
    drawPerson(c, 1120, 820, 0.95, { outfit: 4, tie: true, pose: "stand", rim: 0.7, rimSide: -1, facing: 0.6, eye: 1, gazeX: 1, armUp: 0.5 * praise + 0.15 * Math.abs(Math.sin(t * 9)) * praise, bob: breathe(t) * 0.4 });
    drawPerson(c, 1330, 830, 0.92, { outfit: 1, pose: "stand", rim: 0.9, rimSide: -1, glow: praise * (0.8 + 0.2 * Math.sin(t * 4)), facing: -0.5, eye: 1, gazeX: -1, bob: breathe(t, 2) * 0.5 - praise * 4 });
    [[1520, 3], [1660, 5]].forEach(([x, o], i) => drawPerson(c, x, 840, 0.86, { outfit: o, pose: "stand", rim: 0.4, rimSide: -1, shade: 0.3, facing: -0.8, eye: 1, gazeX: -1, armUp: praise * (0.35 + 0.3 * Math.abs(Math.sin(t * 11 + i * 2))), bob: breathe(t, i + 3) * 0.4 }));
  });
  // ön plan: B (outfit 2), masada, sırtı yarı dönük — rack focus ona gelir
  dof(c, (1 - rack) * 9, () => {
    officeDesk(c, 520, 1000, 1.25, 0.6, 0.6);
    drawPerson(c, 470, 1000, 1.35, { outfit: 2, pose: "desk", rim: 0.7, rimSide: 1, shade: 0.35, facing: lerp(0.2, 0.9, praise), eye: 1, gazeX: lerp(0, 1, praise), bob: breathe(t) * 0.5 });
  });
  c.restore();
  if (l > 3.4) confetti(c, t, g(3.4), 1330, 520, 0.6 * (1 - prog(l, 4.6, 5.4)), 8);
  speechBubble(c, t, 1180, 330, "よくやった！", prog(l, 3.4, 3.9) * (1 - prog(l, 4.9, 5.3)), { warm: 1, size: 44, tail: 1 });
  label(c, 1330, 180, "後から入った人", ease.out(prog(l, 1.82, 2.3)) * (1 - prog(l, 3.3, 3.6)), C.mist, 44);
  flashPop(c, 1330, 560, win(l, 3.35, 3.8, 0.15) * 0.25);
}

// ================= B (15): ふと浮かぶ問い — 何のために =================
function sceneQuestion(c: Ctx, t: number) {
  const l = t - P15.at;
  const k = ease.inOut(prog(l, 5.2, 12.4));
  const q = ease.out(prog(l, 6.4, 7.0));
  const write = prog(l, 8.76, 11.6);
  c.save();
  cam(c, t, lerp(1.06, 1.26, k), lerp(-40, -160, k), lerp(0, 30, k), 0.35, 520, 700);
  nightDesk(c, t, l, 6, { reflect: 0.4 });
  drawPerson(c, 380, 900, 1.25, { outfit: 2, pose: "sit", rim: 0.8, rimSide: 1, facing: lerp(0.4, 0.1, q), eye: 1, gazeX: lerp(0.7, -0.2, q), bob: breathe(t) * 0.6, armUp: 0.1 });
  inOutTray(c, t, 1000, 744, 1.2, 8, 14, { outGrey: 0.3 });
  mug(c, t, 1560, 742, 1.0, 0.5);
  plant(c, t, 1800, 744, 1.3);
  c.restore();
  // küçük "？" kabarcığı → büyür, soru yazılır
  layer(c, q * (1 - prog(l, 8.6, 8.9)), () => { c.font = font(800, lerp(40, 90, q), true); c.fillStyle = C.mist; c.textAlign = "center"; c.fillText("？", 660, 360 - q * 20 + Math.sin(t * 2) * 4); });
  layer(c, ease.out(prog(l, 8.6, 9.0)) * (1 - prog(l, 12.0, 12.4)), () => {
    c.save(); c.translate(1000, 330 + Math.sin(t * 1.4) * 5);
    c.fillStyle = "rgba(220,224,230,0.1)"; c.strokeStyle = "rgba(220,224,230,0.55)"; c.lineWidth = 3;
    c.beginPath(); c.ellipse(0, 0, 560, 130, 0, 0, Math.PI * 2); c.fill(); c.stroke();
    for (let i = 0; i < 3; i++) { c.beginPath(); c.arc(-420 + i * 40, 150 + i * 46, 20 - i * 5, 0, Math.PI * 2); c.fill(); c.stroke(); }
    c.restore();
    writeText(c, 1000, 350, "自分は、何のために頑張っているんだろう", write, C.text, 50);
  });
}

// ================= C (15): 問いは外ではなく、内側へ =================
function sceneInward(c: Ctx, t: number) {
  const l = t - P15.at;
  const k = ease.inOut(prog(l, 12.0, 17.6));
  const flip = ease.inOut(prog(l, 15.2, 16.2));   // ok: dışarı → içe
  const dark = ease.inOut(prog(l, 15.6, 17.6));
  c.save();
  cam(c, t, lerp(1.2, 1.6, k), lerp(-120, -40, k), lerp(20, 60, k), 0.25, 420, 720);
  nightDesk(c, t, l, 7, { reflect: lerp(0.4, 1, k) });
  drawPerson(c, 380, 900, 1.25, { outfit: 2, pose: "sit", rim: lerp(0.8, 0.3, dark), rimSide: 1, facing: lerp(0.2, -0.1, flip), eye: 1, gazeX: lerp(0.6, -0.4, flip), shade: dark * 0.4, bob: breathe(t) * 0.6 - flip * 6 });
  c.restore();
  // soru oku: önce pencereye (外), sonra kıvrılıp göğse (内側)
  layer(c, ease.out(prog(l, 12.3, 12.8)) * (1 - prog(l, 17.2, 17.6)), () => {
    c.save();
    const sx = 760, sy = 420;
    const ex = lerp(1500, 600, flip), ey = lerp(260, 760, flip);
    const cx = lerp(1150, 1400, flip), cy = lerp(240, 300, flip);
    c.strokeStyle = flip > 0.5 ? "rgba(140,151,168,0.9)" : "rgba(220,224,230,0.85)"; c.lineWidth = 8; c.setLineDash([22, 14]); c.lineDashOffset = -t * 60;
    c.beginPath(); c.moveTo(sx, sy); c.quadraticCurveTo(cx, cy, ex, ey); c.stroke();
    const ang = Math.atan2(ey - cy, ex - cx);
    c.setLineDash([]); c.fillStyle = c.strokeStyle; c.translate(ex, ey); c.rotate(ang);
    c.beginPath(); c.moveTo(16, 0); c.lineTo(-24, -20); c.lineTo(-24, 20); c.closePath(); c.fill();
    c.restore();
    c.font = font(800, 60, true); c.textAlign = "center"; c.fillStyle = C.text; c.fillText("？", sx - 40, sy + 20);
  });
  label(c, 1500, 200, "外", ease.out(prog(l, 13.4, 13.9)) * (1 - flip), C.mist, 60);
  layer(c, ease.out(prog(l, 14.2, 14.6)) * (1 - flip), () => { c.strokeStyle = C.alarm; c.lineWidth = 6; c.beginPath(); c.moveTo(1460, 150); c.lineTo(1540, 230); c.moveTo(1540, 150); c.lineTo(1460, 230); c.stroke(); });
  label(c, 640, 880, "内側", ease.out(prog(l, 15.9, 16.4)), C.text, 56);
  // karanlık içeri kapanır (iris)
  if (dark > 0) {
    c.save(); const r = lerp(1600, 260, dark);
    const gr = c.createRadialGradient(560, 760, r * 0.4, 560, 760, r);
    gr.addColorStop(0, "rgba(4,6,10,0)"); gr.addColorStop(1, `rgba(4,6,10,${0.95 * dark})`);
    c.fillStyle = gr; c.fillRect(0, 0, W, H); c.restore();
  }
}

// ================= D (15): 内なる部屋 — 自責の声 =================
const STEPS: [number, number, number][] = [[1180, 760, 0], [1400, 640, 1], [1620, 520, 3]];
function sceneBlame(c: Ctx, t: number) {
  const l = t - P15.at;
  const k = ease.inOut(prog(l, 17.2, 29.4));
  const them = ease.out(prog(l, 20.0, 20.8));
  const small = ease.inOut(prog(l, 24.4, 25.4));
  const needleWrong = ease.inOut(prog(l, 26.2, 27.4));
  c.save();
  cam(c, t, lerp(1.12, 1.0, k), lerp(-60, 40, k), lerp(30, -10, k), 0.3, 960, 600);
  // 内側の暗い部屋: tek tepe ışığı, aynalı arka duvar, toz
  c.fillStyle = "#06080C"; c.fillRect(-800, -600, W + 1600, H + 1200);
  dof(c, 5, () => {
    c.save(); c.translate(-l * 5, 0);
    for (let i = 0; i < 6; i++) { const x = -200 + i * 420; c.fillStyle = "#0C1018"; c.fillRect(x, 80, 360, 640); c.strokeStyle = "rgba(120,140,170,0.12)"; c.lineWidth = 3; c.strokeRect(x, 80, 360, 640); }
    c.restore();
  });
  const fg = c.createLinearGradient(0, 800, 0, H); fg.addColorStop(0, "#14171D"); fg.addColorStop(1, "#08090C");
  c.fillStyle = fg; c.fillRect(-800, 800, W + 1600, 600);
  lightCone(c, 600, -200, Math.PI / 2, 0.18, 1100, 0.15, "200,212,235");
  lightPool(c, 600, 900, 300, "rgba(200,212,235,", 0.12);
  dust(c, t, 50, 0.3, 91);
  // basamaklar + "あの人たち" (yüksek, ışıklı, uzak)
  STEPS.forEach(([x, y, o], i) => {
    c.fillStyle = "#1A1E26"; c.fillRect(x - 130, y, 260, 900 - y + 40);
    c.fillStyle = "rgba(255,255,255,0.05)"; c.fillRect(x - 130, y, 260, 4);
    const a = ease.out(prog(l, 20.0 + i * 0.15, 20.6 + i * 0.15));
    layer(c, a, () => drawPerson(c, x, y, 0.82, { outfit: o, pose: "stand", rim: 0.9, rimSide: -1, glow: 0.35 * them, facing: -0.6, eye: 1, gazeX: -1, bob: breathe(t, i) * 0.4 }));
  });
  // etiketler: 能力 / 努力 / 要領
  [["能力 ↑", 21.24, 1180, 500], ["努力 ↑", 21.66, 1400, 380], ["要領 ◎", 22.98, 1620, 260]].forEach(([s, t0, x, y]) =>
    layer(c, ease.back(prog(l, t0 as number, (t0 as number) + 0.4)), () => {
      c.save(); c.translate(x as number, y as number);
      c.fillStyle = C.paper; rr(c, -80, -34, 160, 56, 6); c.fill();
      c.fillStyle = C.ink; c.font = font(700, 30, true); c.textAlign = "center"; c.fillText(s as string, 0, 6); c.restore();
    }));
  // B: ışık altında, küçülür (不器用)
  const bs = lerp(1.15, 0.9, small);
  drawPerson(c, 600, 900, bs, { outfit: 2, pose: "stand", rim: 0.6, rimSide: 1, shade: 0.3 + small * 0.25, facing: 0.5, eye: 1, gazeX: lerp(0.9, 0.1, small), bob: breathe(t) * 0.4 - small * 6 });
  layer(c, ease.out(prog(l, 24.5, 25.0)) * (1 - prog(l, 28.8, 29.3)), () => {
    c.save(); c.translate(600, 900 - 420 * bs); c.rotate(0.06);
    c.strokeStyle = "rgba(200,206,214,0.4)"; c.lineWidth = 2; c.beginPath(); c.moveTo(0, 50); c.lineTo(0, 110); c.stroke();
    c.fillStyle = "#A9A497"; rr(c, -90, 0, 180, 54, 5); c.fill();
    c.fillStyle = C.ink; c.font = font(700, 30, true); c.textAlign = "center"; c.fillText("不器用", 0, 38); c.restore();
  });
  // pusula: ayaklarının önünde, yanlış yönü gösterir
  layer(c, ease.out(prog(l, 25.7, 26.2)), () => compass(c, t, 330, 880, 0.75, lerp(0.2, 2.5, needleWrong) + Math.sin(t * 3) * 0.05 * (1 - needleWrong), { wrong: needleWrong, jitter: 1 - needleWrong }));
  layer(c, ease.out(prog(l, 26.8, 27.2)) * (1 - prog(l, 28.8, 29.3)), () => stamp(c, 330, 700, "方向を間違えている", 1, C.alarm, -0.06, 36));
  c.restore();
  // 努力が足りない: damga (ses: stamp)
  layer(c, ease.out(prog(l, 18.34, 18.7)) * (1 - prog(l, 20.0, 20.4)), () => stamp(c, 960, 300, "努力が足りない", 1, C.mist, -0.08, 64));
  label(c, 1400, 160, "あの人たちは", ease.out(prog(l, 20.16, 20.6)) * (1 - prog(l, 23.8, 24.2)), C.mist, 44);
}

// ================= E (15): さらに自分を追い込む — 静かなまま =================
function scenePush(c: Ctx, t: number) {
  const l = t - P15.at;
  const k = ease.inOut(prog(l, 28.8, 38.6));
  const more = prog(l, 30.4, 36.4);
  const mute = ease.inOut(prog(l, 36.4, 38.0));
  const done = Math.floor(lerp(4, 30, ease.in(more)));
  c.save();
  cam(c, t, lerp(1.25, 1.05, k), lerp(160, 0, k), lerp(40, 0, k), 0.3, 960, 640);
  nightDesk(c, t, l, 6);
  // hız: kollar giderek daha hızlı
  const sp = lerp(6, 16, more);
  drawPerson(c, 380, 900, 1.25, { outfit: 2, pose: "desk", rim: lerp(0.8, 0.3, mute), rimSide: 1, facing: 0.5, eye: 1, gazeX: 0.8, shade: mute * 0.35, bob: breathe(t) * 0.5 - more * 5, armUp: 0.2 + 0.18 * Math.abs(Math.sin(t * sp)) });
  inOutTray(c, t, 1000, 744, 1.3, Math.max(3, 24 - done * 0.6), Math.min(done, 22), { outGrey: mute });
  // arka: büyüyen biten iş yığını (gri olur)
  cardStack(c, t, 1420, 744, 0.85, lerp(4, 30, more), { seed: 31, grey: mute, sway: 0.4 });
  cardStack(c, t, 1560, 744, 0.75, lerp(2, 22, more), { seed: 32, grey: mute, sway: 0.4 });
  if (l > 30.4) { const ph = (l * lerp(2, 5, more)) % 1; taskCard(c, lerp(844, 1156, ease.inOut(ph)), 744 - 300 + Math.sin(ph * Math.PI) * -60, 0.5, { label: taskLabel(Math.floor(l * 4)), rot: 0.2 * (1 - ph), grey: mute }); }
  mug(c, t, 1720, 742, 1.0, 1 - mute);
  c.restore();
  label(c, 960, 150, "自分を、追い込んでいく", ease.out(prog(l, 30.42, 30.9)) * (1 - prog(l, 32.4, 32.7)), C.text, 50);
  layer(c, ease.out(prog(l, 32.6, 32.9)) * (1 - prog(l, 34.2, 34.5)), () => stamp(c, 620, 330, "もっと頑張る", 1, C.text, -0.06, 60));
  label(c, 960, 150, "静かな、まま", ease.out(prog(l, 36.6, 37.1)) * (1 - prog(l, 38.2, 38.6)), C.mist, 50);
  // 静か: ses dalgası çizgisi düzleşir
  layer(c, ease.out(prog(l, 35.2, 35.6)) * (1 - prog(l, 38.2, 38.6)), () => {
    c.strokeStyle = "rgba(200,206,214,0.6)"; c.lineWidth = 3; c.beginPath();
    for (let x = 0; x <= 600; x += 6) { const a = (1 - mute) * 30 * Math.sin(x * 0.08 + t * 10) * Math.sin(x / 600 * Math.PI); c.lineTo(660 + x, 260 + a); }
    c.stroke();
  });
}

// ================= F (15): 岐路 — 見る側の記憶 か、努力の向き か =================
function sceneFork(c: Ctx, t: number) {
  const l = t - P15.at;
  const wIn = 1 - ease.out(prog(l, 38.3, 39.0));
  const k = ease.inOut(prog(l, 38.4, 47.4));
  const leftTilt = ease.inOut(prog(l, 41.1, 41.8));
  const rightLit = ease.out(prog(l, 44.4, 45.4));
  c.save();
  dof(c, wIn * 18, () => {
    c.save();
    cam(c, t, lerp(1.0, 1.12, k), wIn * 1700 + lerp(0, 120 * rightLit, k), lerp(-20, 10, k), 0.4, 960, 560);
    // gece yol ayrımı: sisli ufuk, iki patika
    const sky = c.createLinearGradient(0, -300, 0, 640); sky.addColorStop(0, "#070A10"); sky.addColorStop(1, "#1A2230");
    c.fillStyle = sky; c.fillRect(-800, -600, W + 1600, 1300);
    dof(c, 6, () => {
      c.save(); c.translate(-l * 4, 0);
      for (let i = 0; i < 16; i++) { const x = -300 + i * 180, hh = 80 + rnd(i, 5) * 140; c.fillStyle = "#0E131B"; c.beginPath(); c.moveTo(x - 90, 640); c.lineTo(x, 640 - hh); c.lineTo(x + 90, 640); c.fill(); }
      c.restore();
      bokeh(c, t, 10, 400, 620, 13, 0.15);
    });
    c.fillStyle = "#13161C"; c.fillRect(-800, 640, W + 1600, 800);
    // patikalar
    c.fillStyle = "#262A31";
    c.beginPath(); c.moveTo(860, 1200); c.lineTo(1060, 1200); c.lineTo(980, 760); c.lineTo(400, 650); c.lineTo(360, 660); c.lineTo(940, 780); c.closePath(); c.fill();
    c.fillStyle = lerp(0, 1, rightLit) > 0.5 ? "#2E2C24" : "#262A31";
    c.beginPath(); c.moveTo(980, 760); c.lineTo(1560, 650); c.lineTo(1600, 660); c.lineTo(1060, 1200); c.lineTo(1000, 1200); c.closePath(); c.fill();
    c.fillStyle = "rgba(242,207,58,0.07)"; c.globalAlpha = rightLit; c.beginPath(); c.moveTo(980, 760); c.lineTo(1560, 650); c.lineTo(1600, 660); c.lineTo(1060, 1200); c.closePath(); c.fill(); c.globalAlpha = 1;
    dust(c, t, 40, 0.25, 101);
    lightCone(c, 960, -200, Math.PI / 2, 0.2, 1000, 0.12, "220,226,240");
    // tabela direği
    post(c, 960, 860, 520);
    const sway = Math.sin(t * 1.3) * 0.015;
    signpost(c, 946, 420, 1.0, "見る側の記憶", -1, { tilt: sway - leftTilt * 0.12, dim: leftTilt * 0.5 });
    signpost(c, 974, 540, 1.0, "努力の向き", 1, { tilt: -sway + rightLit * 0.02, lit: rightLit });
    // sol tabelada anı kartları (hafıza), sağda pusula
    for (let i = 0; i < 3; i++) memoryCard(c, 520 - i * 70, 300 + i * 30 + Math.sin(t * 1.2 + i) * 6, 0.45, { label: "", glow: 0.5 * (1 - leftTilt), rot: -0.2 + i * 0.12, alpha: ease.out(prog(l, 39.4 + i * 0.15, 39.9 + i * 0.15)) * (1 - leftTilt * 0.6), who: "A" });
    layer(c, ease.out(prog(l, 44.4, 44.9)), () => compass(c, t, 1440, 360, 0.55, lerp(-1.4, 1.2, ease.inOut(prog(l, 44.6, 46.0))) + Math.sin(t * 2) * 0.03, { lit: rightLit }));
    // B: kavşakta, sırtı bize
    drawPerson(c, 960, 1060, 1.3, { outfit: 2, pose: "stand", rim: 0.7, rimSide: 1, facing: lerp(-0.6, 0.6, ease.inOut(prog(l, 40.4, 45.6))), eye: 0, bob: breathe(t) * 0.4 });
    c.restore();
  });
  c.restore();
  label(c, 960, 140, "すべてを記憶のせいには、できない", ease.out(prog(l, 39.4, 39.9)) * (1 - prog(l, 42.3, 42.7)), C.text, 46);
  label(c, 960, 140, "理由が、努力の向きにあることも", ease.out(prog(l, 44.4, 44.9)) * (1 - prog(l, 46.8, 47.2)), C.text, 46);
}

// ================= G (15): ずれ — 求めているもの vs 注いでいるもの =================
function sceneGap(c: Ctx, t: number) {
  const l = t - P15.at;
  const k = ease.inOut(prog(l, 46.8, 53.4));
  const split = ease.inOut(prog(l, 50.9, 51.9));
  c.save();
  cam(c, t, lerp(1.08, 1.0, k), lerp(-40, 40, k), 0, 0.3, 960, 560);
  c.fillStyle = "#0B0E14"; c.fillRect(-800, -600, W + 1600, H + 1200);
  c.strokeStyle = "rgba(255,255,255,0.03)"; for (let x = -800; x < W + 800; x += 60) { c.beginPath(); c.moveTo(x, -600); c.lineTo(x, H + 600); c.stroke(); }
  lightCone(c, 1500, -200, Math.PI / 2, 0.2, 1000, 0.12, "255,214,150");
  // hedef: 会社が求めているもの
  layer(c, ease.out(prog(l, 47.3, 47.9)), () => target(c, 1500, 380, 1.0, 0));
  // B ve iki ok: önce aynı yön, sonra ayrılır
  drawPerson(c, 360, 960, 1.1, { outfit: 2, pose: "stand", rim: 0.8, rimSide: 1, facing: 0.7, eye: 1, gazeX: 1, armUp: 0.45, bob: breathe(t) * 0.4 });
  const ox = 480, oy = 640;
  const aim = Math.atan2(380 - oy, 1500 - ox);
  const mine = aim + split * 0.42;
  const grow = ease.out(prog(l, 49.2, 50.4));
  const drawArrow = (ang: number, len: number, col: string, w: number) => {
    c.save(); c.translate(ox, oy); c.rotate(ang);
    c.strokeStyle = col; c.lineWidth = w; c.beginPath(); c.moveTo(0, 0); c.lineTo(len, 0); c.stroke();
    c.fillStyle = col; c.beginPath(); c.moveTo(len + 26, 0); c.lineTo(len - 10, -22); c.lineTo(len - 10, 22); c.closePath(); c.fill(); c.restore();
  };
  layer(c, ease.out(prog(l, 47.4, 48.0)), () => { c.setLineDash([16, 14]); drawArrow(aim, 1000, "rgba(140,151,168,0.7)", 5); c.setLineDash([]); });
  layer(c, grow, () => drawArrow(mine, lerp(100, 900, grow), C.paper, 10));
  // açı yayı
  layer(c, split, () => {
    c.strokeStyle = C.alarm; c.lineWidth = 4; c.beginPath(); c.arc(ox, oy, 320, aim, mine); c.stroke();
    c.font = font(800, 40, true); c.fillStyle = C.alarm; c.textAlign = "center";
    const m = (aim + mine) / 2; c.fillText("ずれ", ox + Math.cos(m) * 380, oy + Math.sin(m) * 380 + 12);
  });
  c.restore();
  label(c, 1500, 160, "会社が求めているもの", ease.out(prog(l, 47.36, 47.9)), C.mist, 40);
  label(c, 760, 840, "自分が力を注いでいるもの", ease.out(prog(l, 49.2, 49.7)), C.text, 40);
}

// ================= H (15): どう見分けるか — ひとつの問い =================
function sceneKey(c: Ctx, t: number) {
  const l = t - P15.at;
  const k = ease.inOut(prog(l, 52.8, 59.6));
  const card = ease.out(prog(l, 57.0, 57.9));
  c.save();
  cam(c, t, lerp(1.0, 1.35, k), 0, lerp(0, -40, k), 0.25, 960, 520);
  c.fillStyle = "#07090D"; c.fillRect(-800, -600, W + 1600, H + 1200);
  // iki kapı: 記憶 / 向き — ikisi de aralık
  [[620, "記憶"], [1300, "向き"]].forEach(([x, s], i) => {
    const xx = x as number;
    c.fillStyle = "#151A22"; c.fillRect(xx - 150, 260, 300, 560);
    const open = 0.15 + 0.05 * Math.sin(t * 1.5 + i);
    c.fillStyle = "rgba(242,207,58,0.10)"; c.fillRect(xx - 150, 260, 300 * open, 560);
    c.fillStyle = "#1F2530"; c.fillRect(xx - 150 + 300 * open, 260, 300 * (1 - open), 560);
    c.fillStyle = "#8C97A8"; c.beginPath(); c.arc(xx + 120, 560, 8, 0, Math.PI * 2); c.fill();
    label(c, xx, 230, s as string, ease.out(prog(l, 53.6 + i * 0.4, 54.1 + i * 0.4)) * (1 - card), C.mist, 40);
  });
  c.fillStyle = "#101318"; c.fillRect(-800, 820, W + 1600, 600);
  drawPerson(c, 960, 960, 1.0, { outfit: 2, pose: "stand", rim: 0.6, rimSide: 1, facing: Math.sin(t * 0.9) * 0.8 * (1 - card), eye: 1, gazeX: Math.sin(t * 0.9) * (1 - card), bob: breathe(t) * 0.4 });
  // 「？」 iki kapı arasında gidip gelir → tek sarı kart
  layer(c, ease.out(prog(l, 53.2, 53.6)) * (1 - card), () => { c.font = font(800, 90, true); c.fillStyle = C.text; c.textAlign = "center"; c.fillText("？", 960 + Math.sin(t * 2.4) * 300, 420); });
  layer(c, card, () => {
    c.save(); c.translate(960, 520 - card * 20); c.rotate(Math.sin(t) * 0.02);
    const gl = c.createRadialGradient(0, 0, 40, 0, 0, 380); gl.addColorStop(0, `rgba(242,207,58,${0.4 * card})`); gl.addColorStop(1, "rgba(242,207,58,0)");
    c.fillStyle = gl; c.fillRect(-400, -400, 800, 800);
    c.fillStyle = C.paper; rr(c, -180, -110, 360, 220, 8); c.fill();
    c.strokeStyle = C.yellow; c.lineWidth = 5; rr(c, -180, -110, 360, 220, 8); c.stroke();
    c.fillStyle = C.ink; c.font = font(800, 96, true); c.textAlign = "center"; c.fillText("？", 0, 34);
    c.restore();
  });
  c.restore();
  label(c, 960, 140, "どちらなのか", ease.out(prog(l, 53.9, 54.4)) * (1 - prog(l, 56.6, 57.0)), C.text, 50);
  label(c, 960, 140, "ひとつの問いが、手がかりに", ease.out(prog(l, 57.0, 57.5)), C.text, 50);
}

// ================= I (16): 答えがすぐ出る — 誰が困るか、の連鎖 =================
const DOM = ["チーム", "隣の課", "顧客", "上司", "締切"];
function sceneChain(c: Ctx, t: number, noAnswer = false) {
  const l = t - P16.at;
  const pull = ease.inOut(prog(l, 0.2, 0.9));
  c.save();
  const k = ease.inOut(prog(l, -0.4, 4.6));
  cam(c, t, lerp(1.1, 1.0, k), lerp(-160, 60, k), 0, 0.3, 960, 640);
  c.fillStyle = "#0C0F14"; c.fillRect(-800, -600, W + 1600, H + 1200);
  const fg = c.createLinearGradient(0, 760, 0, H); fg.addColorStop(0, "#4A3422"); fg.addColorStop(1, "#1E140D");
  c.fillStyle = fg; c.fillRect(-800, 760, W + 1600, 800);
  c.fillStyle = "rgba(255,255,255,0.05)"; c.fillRect(-800, 760, W + 1600, 4);
  lightCone(c, 960, -200, Math.PI / 2, 0.3, 1100, 0.14, "255,214,150");
  dust(c, t, 30, 0.2, 111);
  // B'nin görev kartı (ilk taş) masadan çekilir
  const cx = lerp(340, 160, pull), cy = lerp(760, 560, pull);
  taskCard(c, cx, cy, 0.9, { label: "B の仕事", rot: -0.1 * pull, alpha: 1 - prog(l, 1.4, 1.8) });
  // domino zinciri
  DOM.forEach((s, i) => {
    const t0 = 0.9 + i * 0.32;
    const f = ease.in(prog(l, t0, t0 + 0.35));
    domino(c, 520 + i * 250, 760, 1.4, f, { label: s, lit: ease.out(prog(l, 2.94, 3.4)) });
  });
  c.restore();
  label(c, 960, 150, "答えが、すぐに出る", ease.out(prog(l, 0.4, 0.9)) * (1 - prog(l, 2.6, 2.9)), C.text, 50);
  layer(c, ease.out(prog(l, 2.94, 3.3)) * (1 - prog(l, 4.2, 4.6)), () => stamp(c, 960, 260, "必要とされている ✓", 1, C.yellow, -0.05, 52));
  void noAnswer;
}

// ================= J (16): 足りないのは、記憶に残る形 =================
function sceneForm(c: Ctx, t: number) {
  const l = t - P16.at;
  const k = ease.inOut(prog(l, 4.2, 9.4));
  const frame = ease.out(prog(l, 6.66, 7.4));
  c.save();
  cam(c, t, lerp(1.0, 1.16, k), lerp(40, -40, k), lerp(0, 20, k), 0.3, 960, 540);
  c.fillStyle = "#0B0E14"; c.fillRect(-800, -600, W + 1600, H + 1200);
  // mantar pano (arka, parallax)
  dof(c, 4, () => {
    c.save(); c.translate(-l * 6, 0);
    c.fillStyle = "#4A3B2C"; c.fillRect(160, 120, 1600, 720);
    for (let i = 0; i < 180; i++) { c.fillStyle = "rgba(0,0,0,0.12)"; c.fillRect(160 + rnd(i, 3) * 1600, 120 + rnd(i, 4) * 720, 4, 4); }
    c.restore();
  });
  // sol: iş kartları yerinde, sağlam (仕事はある)
  for (let i = 0; i < 6; i++) taskCard(c, 360 + (i % 3) * 170, 360 + Math.floor(i / 3) * 170, 0.7, { label: taskLabel(i + 2), rot: (rnd(i, 7) - 0.5) * 0.2, alpha: ease.out(prog(l, 4.5 + i * 0.1, 4.9 + i * 0.1)) });
  label(c, 530, 720, "仕事はある", ease.out(prog(l, 5.1, 5.5)), C.mist, 40);
  // sağ: boş çerçeve → 記憶に残る形 (sarı)
  c.save(); c.translate(1330, 470);
  c.setLineDash(frame > 0.5 ? [] : [16, 12]);
  c.strokeStyle = frame > 0 ? `rgba(242,207,58,${0.4 + 0.6 * frame})` : "rgba(140,151,168,0.6)"; c.lineWidth = 6;
  rr(c, -240, -170, 480, 340, 10); c.stroke(); c.setLineDash([]);
  if (frame > 0) { const gl = c.createRadialGradient(0, 0, 40, 0, 0, 360); gl.addColorStop(0, `rgba(242,207,58,${0.22 * frame})`); gl.addColorStop(1, "rgba(242,207,58,0)"); c.fillStyle = gl; c.fillRect(-360, -360, 720, 720); }
  c.restore();
  label(c, 1330, 485, "？", ease.out(prog(l, 5.2, 5.6)) * (1 - frame), C.mist, 90);
  label(c, 1330, 760, "記憶に残る形", frame, C.yellow, 46);
  c.restore();
  label(c, 960, 140, "足りないのは、仕事ではなく", ease.out(prog(l, 4.52, 5.0)) * (1 - prog(l, 8.8, 9.2)), C.text, 48);
}

// ================= K (16): 何も起きなかった → 何を起こさずに済んだか =================
function sceneRewrite(c: Ctx, t: number) {
  const l = t - P16.at;
  const wIn = 1 - ease.out(prog(l, 9.1, 9.7));
  const k = ease.inOut(prog(l, 9.1, 16.8));
  const strike = ease.inOut(prog(l, 11.6, 12.4));
  const wr = prog(l, 13.01, 15.0);
  const glow = ease.out(prog(l, 15.1, 15.9));
  c.save();
  dof(c, wIn * 16, () => {
    c.save();
    cam(c, t, lerp(1.1, 1.25, k), wIn * -1700 + lerp(-30, 30, k), lerp(20, -10, k), 0.25, 960, 560);
    nightDesk(c, t, l + 40, 8);
    // defter (yukarıdan, masada)
    c.save(); c.translate(960, 640); c.rotate(-0.04);
    c.fillStyle = "rgba(0,0,0,0.5)"; rr(c, -506, -246, 1020, 500, 8); c.fill();
    c.fillStyle = C.paper; rr(c, -510, -250, 1020, 500, 8); c.fill();
    c.fillStyle = "rgba(26,29,36,0.12)"; c.fillRect(-4, -250, 8, 500);
    c.strokeStyle = "rgba(90,110,150,0.22)"; c.lineWidth = 2; for (let i = 0; i < 9; i++) { c.beginPath(); c.moveTo(-480, -170 + i * 50); c.lineTo(480, -170 + i * 50); c.stroke(); }
    c.fillStyle = "rgba(26,29,36,0.55)"; c.font = font(600, 24, true); c.textAlign = "left"; c.fillText("報告メモ", -470, -200);
    // eski satır
    writeText(c, -470, -110, "何も起きなかった", ease.out(prog(l, 9.64, 10.6)), "rgba(26,29,36,0.75)", 46, "left");
    if (strike > 0) { c.strokeStyle = C.alarm; c.lineWidth = 6; c.beginPath(); c.moveTo(-480, -126); c.lineTo(-480 + 400 * strike, -120); c.stroke(); }
    // yeni satır
    if (glow > 0) { c.fillStyle = `rgba(242,207,58,${0.5 * glow})`; c.fillRect(-480, -36, 720, 60); }
    writeText(c, -470, 10, "何を起こさずに済んだか", wr, C.ink, 50, "left");
    // somut örnekler (soldan sağa)
    [["夜間障害の予兆 → 3件つぶした", 14.2], ["引き継ぎ漏れ → 0件", 14.6]].forEach(([s, t0], i) =>
      writeText(c, -440, 100 + i * 60, s as string, prog(l, t0 as number, (t0 as number) + 0.9), "rgba(26,29,36,0.8)", 34, "left"));
    // kalem
    const px = wr < 1 ? -470 + 560 * wr : -440 + 520 * prog(l, 14.6, 15.5);
    const py = wr < 1 ? 0 : 160;
    if (l > 9.6 && l < 16.2) { c.save(); c.translate(px + 20, py - 30); c.rotate(0.7); c.fillStyle = "#2A2F37"; c.fillRect(-8, -150, 16, 150); c.fillStyle = C.yellow; c.fillRect(-8, -150, 16, 24); c.fillStyle = "#C9A35A"; c.beginPath(); c.moveTo(-8, 0); c.lineTo(8, 0); c.lineTo(0, 20); c.fill(); c.restore(); }
    c.restore();
    // söndürülmüş hayalet alev (önlenen olay) — sarı halka içinde
    layer(c, glow * 0.8, () => { c.save(); c.strokeStyle = C.yellow; c.lineWidth = 4; c.beginPath(); c.arc(1350, 570, 70, 0, Math.PI * 2); c.stroke(); c.fillStyle = "rgba(226,96,58,0.25)"; c.beginPath(); c.moveTo(1350, 520); c.quadraticCurveTo(1390, 580, 1350, 610); c.quadraticCurveTo(1310, 580, 1350, 520); c.fill(); c.strokeStyle = C.yellow; c.beginPath(); c.moveTo(1300, 620); c.lineTo(1400, 520); c.stroke(); c.restore(); });
    c.restore();
  });
  c.restore();
  label(c, 960, 140, "言葉にする", ease.out(prog(l, 15.1, 15.6)) * (1 - prog(l, 16.4, 16.8)), C.yellow, 52);
}

// ================= L (16): 答えが出ない — 向きを見直す =================
function sceneRedirect(c: Ctx, t: number) {
  const l = t - P16.at;
  const k = ease.inOut(prog(l, 16.4, 21.9));
  const turn = ease.inOut(prog(l, 18.4, 19.6));
  c.save();
  cam(c, t, lerp(1.0, 1.1, k), lerp(60, -40, k), 0, 0.3, 960, 600);
  c.fillStyle = "#0C0F14"; c.fillRect(-800, -600, W + 1600, H + 1200);
  const fg = c.createLinearGradient(0, 760, 0, H); fg.addColorStop(0, "#3A2A1C"); fg.addColorStop(1, "#1A120C");
  c.fillStyle = fg; c.fillRect(-800, 760, W + 1600, 800);
  lightCone(c, 960, -200, Math.PI / 2, 0.3, 1100, 0.12, "220,226,240");
  // kart çekilir ama dominolar dik kalır (誰も困らない)
  const pull = ease.inOut(prog(l, 16.9, 17.5));
  taskCard(c, lerp(340, 160, pull), lerp(760, 560, pull), 0.9, { label: "B の仕事", rot: -0.1 * pull, grey: 0.6, alpha: 1 - prog(l, 18.0, 18.4) });
  DOM.slice(0, 3).forEach((s, i) => domino(c, 560 + i * 230, 760, 1.2, Math.sin(Math.max(0, l - 17.4 - i * 0.1) * 12) * 0.03 * Math.exp(-(l - 17.4) * 2), { label: s, grey: 0 }));
  label(c, 790, 520, "……", ease.out(prog(l, 17.4, 17.8)), C.mist, 60);
  // pusula: iğne hedefe döner
  compass(c, t, 1420, 560, 0.9, lerp(2.4, 0.15, turn) + Math.sin(t * 2.2) * 0.04 * (1 - turn), { lit: ease.out(prog(l, 19.4, 20.2)), jitter: (1 - turn) * 0.5 });
  layer(c, ease.out(prog(l, 19.5, 20.1)), () => target(c, 1420, 230, 0.45, 1));
  c.restore();
  label(c, 960, 140, "答えが、出ないなら", ease.out(prog(l, 16.9, 17.4)) * (1 - prog(l, 18.2, 18.5)), C.text, 50);
  label(c, 960, 140, "向きを、見直してみる", ease.out(prog(l, 18.4, 18.9)) * (1 - prog(l, 21.2, 21.6)), C.text, 50);
}

// ================= M (16): 力が足りない と結論づけない — 柔らかい終わり =================
function sceneClose(c: Ctx, t: number) {
  const l = t - P16.at;
  const k = ease.inOut(prog(l, 21.4, 31.0));
  const verdict = ease.out(prog(l, 24.7, 25.4));
  const dissolveK = ease.inOut(prog(l, 26.4, 27.6));
  const dawn = ease.inOut(prog(l, 26.8, 30.5));
  c.save();
  cam(c, t, lerp(1.2, 1.0, k), lerp(-120, 0, k), lerp(30, 0, k), 0.25, 700, 640);
  nightDesk(c, t, l + 50, 6, { dawn });
  drawPerson(c, 380, 900, 1.25, { outfit: 2, pose: "sit", rim: lerp(0.5, 0.9, dawn), rimSide: 1, shade: lerp(0.35, 0, dawn), facing: lerp(-0.1, 0.6, dawn), eye: 1, gazeX: lerp(-0.4, 0.8, dawn), bob: breathe(t) * 0.6 + dawn * -4, glow: dawn * 0.3 });
  inOutTray(c, t, 1000, 744, 1.2, 6, 12, { outGrey: 0.2 });
  mug(c, t, 1560, 742, 1.0, 1);
  plant(c, t, 1800, 744, 1.3);
  c.restore();
  // 結論のハンコ: B'nin üstünde asılı kalır, inmez → toza dönüşür
  layer(c, verdict * (1 - dissolveK), () => {
    c.save(); c.translate(560, lerp(120, 300, verdict) + Math.sin(t * 2) * 6);
    c.fillStyle = "#5A4130"; rr(c, -40, -120, 80, 90, 8); c.fill();
    c.fillStyle = "#2A1E14"; rr(c, -110, -30, 220, 40, 6); c.fill();
    c.restore();
    stamp(c, 560, lerp(220, 400, verdict), "力が足りない", 1, C.alarm, -0.06, 46);
  });
  if (l > 26.4) dustPuff(c, t, h(26.4), 560, 380, 1.3, 5);
  label(c, 960, 150, "確かめないまま", ease.out(prog(l, 22.5, 23.0)) * (1 - prog(l, 24.4, 24.7)), C.mist, 48);
  label(c, 960, 150, "それが、いちばんもったいないこと", ease.out(prog(l, 28.0, 28.6)) * (1 - prog(l, 30.4, 30.9)), C.yellow, 48);
}

// ================= ÇİZİM =================
const SCENES: [number, number, (c: Ctx, t: number) => void, Lens][] = [
  [g(-1.2), g(5.6), scenePraise, LENS_DAY],
  [g(5.2), g(12.4), sceneQuestion, LENS_DESK],
  [g(12.0), g(17.6), sceneInward, LENS_DESK],
  [g(17.2), g(29.4), sceneBlame, LENS_INNER],
  [g(28.8), g(38.6), scenePush, LENS_DESK],
  [g(38.3), g(47.4), sceneFork, LENS_ROAD],
  [g(46.8), g(53.4), sceneGap, LENS.night],
  [g(52.8), CARD_A + 0.6, sceneKey, LENS.night],
  [h(-0.4), h(4.6), sceneChain, LENS_WARM],
  [h(4.2), h(9.4), sceneForm, LENS.night],
  [h(9.1), h(16.8), sceneRewrite, LENS_WARM],
  [h(16.4), h(21.9), sceneRedirect, LENS.night],
  [h(21.4), END, sceneClose, LENS_WARM],
];
const HARD = new Set<any>([sceneFork, sceneRewrite]); // whip-pan girişli

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
  whipStreaks(ctx, Math.sin(Math.PI * prog(t, g(38.2), g(39.0))), 1, 8);
  whipStreaks(ctx, Math.sin(Math.PI * prog(t, h(9.0), h(9.8))), -1, 9);
  sectionTitle(ctx, t, 0.0, 3.6, "08", "問いが、自分に向かう");
  screenCard(ctx, t, CARD_A, CARD_B, { term: "その仕事がなくなったら、誰が、いつ困るか", size: 68 });
  drawSubtitles(ctx, parts, t);
  fadeBlack(ctx, 1 - prog(t, 0, 0.5));
  fadeBlack(ctx, prog(t, END - 1.4, END - 0.2));
}

// ================= SES EFEKTLERİ (eyleme bire bir) =================
const cues: Cue[] = [];
const cue = (t: number, type: string, gain = 1, p: Record<string, number> = {}) => cues.push({ t, type, gain, p });

cue(0.0, "room", 0.5, { d: END });
cue(0.35, "whoosh", 0.5, { d: 1.2 });                              // başlık
cue(g(0.4), "murmur", 0.25, { d: 4.6 });                           // ofis
cue(g(3.4), "clap", 0.55, { d: 1.6 });                             // 褒められる: alkış
cue(g(3.45), "pop", 0.3);                                          // よくやった balonu
cue(g(4.3), "chair", 0.25);                                        // B döner (rack focus)
cue(g(5.3), "lamp", 0.35);                                         // gece masa lambası
cue(g(6.4), "pop", 0.25);                                          // ふと: ？
cue(g(8.7), "pop", 0.35);                                          // soru balonu
cue(g(8.8), "pen", 0.3, { d: 2.6 });                               // soru yazılır
cue(g(12.3), "flick", 0.3);                                        // ok çıkar
cue(g(14.2), "click", 0.35);                                       // 外 ✕
cue(g(15.2), "heartbeat", 0.6, { d: 2.4 });                        // 内側: ok göğse döner
cue(g(15.6), "lowdrone", 0.35, { d: 2.4 });                        // iris kararır
cue(g(18.34), "stamp", 0.55);                                      // 努力が足りない
for (let i = 0; i < 3; i++) cue(g(20.0 + i * 0.15), "step", 0.25); // あの人たち basamaklarda
cue(g(21.24), "paper", 0.3); cue(g(21.66), "paper", 0.3); cue(g(22.98), "paper", 0.3); // etiketler
cue(g(24.5), "paper", 0.25);                                       // 不器用 etiketi
cue(g(25.7), "boxland", 0.25);                                     // pusula yere konur
cue(g(26.2), "compass", 0.6, { d: 1.2 });                          // iğne yanlış yöne döner
cue(g(26.8), "stamp", 0.45);                                       // 間違えている
cue(g(29.0), "lamp", 0.3);                                         // masaya dönüş
cue(g(30.4), "typing", 0.4, { d: 6.0 });                           // 追い込む: hızlanan klavye
for (let i = 0; i < 12; i++) cue(g(30.6 + i * Math.max(0.2, 0.55 - i * 0.03)), "carddeal", 0.14); // IN→OUT
cue(g(31.0), "stackcreak", 0.35, { d: 4.0 });                      // yığın büyür
cue(g(32.6), "stamp", 0.4);                                        // もっと頑張る
cue(g(36.4), "lowdrone", 0.35, { d: 2.4 });                        // 静かなまま
cue(g(38.2), "whoosh", 0.8, { d: 0.8 });                           // whip-pan → yol ayrımı
cue(g(38.8), "wind", 0.35, { d: 8.4 });                            // gece rüzgârı
cue(g(39.4), "cardrise", 0.3);                                     // anı kartları
cue(g(41.1), "signcreak", 0.5);                                    // sol tabela eğilir
cue(g(44.4), "signcreak", 0.35);                                   // sağ tabela
cue(g(44.6), "compass", 0.45, { d: 1.4 });                         // pusula
cue(g(47.3), "thunk", 0.35);                                       // hedef asılır
cue(g(49.2), "swish", 0.3);                                        // ok uzanır
cue(g(50.9), "creak", 0.45, { d: 1.0 });                           // ok sapar (ずれ)
cue(g(53.2), "door", 0.3);                                         // kapılar
cue(g(57.0), "cardrise", 0.5);                                     // ひとつの問い kartı
cue(CARD_A - 0.1, "shimmer", 0.35, { d: 1.6 });                    // ScreenCard geçişi
cue(h(0.2), "slide", 0.5, { d: 0.7 });                             // kart çekilir
for (let i = 0; i < DOM.length; i++) cue(h(0.9 + i * 0.32 + 0.33), "domino", 0.5); // domino düşer
cue(h(2.94), "checkmark", 0.45);                                   // 必要 ✓
for (let i = 0; i < 6; i++) cue(h(4.5 + i * 0.1), "pin", 0.2);     // kartlar panoya iğnelenir
cue(h(6.66), "cardrise", 0.45);                                    // 記憶に残る形 çerçevesi
cue(h(9.0), "whoosh", 0.7, { d: 0.8 });                            // whip-pan → defter
cue(h(9.64), "pen", 0.35, { d: 1.0 });                             // 何も起きなかった
cue(h(11.6), "strike", 0.55);                                      // üstü çizilir
cue(h(13.01), "pen", 0.45, { d: 2.0 });                            // 何を起こさずに済んだか
cue(h(14.2), "pen", 0.3, { d: 1.3 });
cue(h(15.1), "mend", 0.45);                                        // sarıya döner
cue(h(16.9), "slide", 0.4, { d: 0.6 });                            // kart çekilir (cevap yok)
cue(h(17.4), "domino", 0.15);                                      // dominolar kıpırdar ama düşmez
cue(h(18.4), "compass", 0.6, { d: 1.4 });                          // 向きを見直す
cue(h(19.5), "approve", 0.35);                                     // hedef yanar
cue(h(24.6), "swish", 0.3);                                        // damga havada asılır
cue(h(26.4), "dissolve", 0.5, { d: 1.6 });                         // damga toza dönüşür
cue(h(26.8), "dawnbird", 0.3, { d: 3.0 });                         // şafak
cue(END - 1.5, "whoosh", 0.25, { d: 1.3 });

export const s08: Section = { id: "s08", duration: END, parts, cues, draw };
