// s01 冒頭 — ses 1, 2, 3  (v2: gerçek mekânlar + lens + kamera)
import { Section, Part, Cue, W, H, clamp, ease, prog, win, lerp, rnd, speaking } from "../engine/core";
import { C, font, lightPool, lightCone, fadeBlack, rr, dust } from "../design/style";
import { lens, LENS, cam, dof, bokeh, Lens } from "../design/grade";
import { envNightRoom, deskProps, envGym, envOffice, officeDesk, envCorridor } from "../design/env";
import { drawMascot } from "../characters/mascot";
import { drawPerson, drawGorilla, drawBall } from "../characters/people";
import { sectionTitle, screenCard, statReveal, geppoSheet, boardLabel } from "../components/cards";
import { drawSubtitles } from "../components/subtitle";
import t1 from "../timing/1.json";
import t2 from "../timing/2.json";
import t3 from "../timing/3.json";

const P1: Part = { timing: t1 as any, at: 3.4 };
const P2: Part = { timing: t2 as any, at: 39.5 };
const P3: Part = { timing: t3 as any, at: 73.0 };
const CARD1 = [36.75, 39.35];
const CARD2 = [69.7, 72.9];
const END = 125.0;
const parts = [P1, P2, P3];
const g1 = (l: number) => P1.at + l;
const g2 = (l: number) => P2.at + l;
const g3 = (l: number) => P3.at + l;
type Ctx = CanvasRenderingContext2D;

function layer(ctx: Ctx, a: number, fn: () => void) {
  if (a <= 0.001) return;
  ctx.save(); ctx.globalAlpha *= clamp(a); fn(); ctx.restore();
}
function blinkAt(t: number) { const ph = (t % 4.7) / 4.7; return ph > 0.96 ? Math.sin(((ph - 0.96) / 0.04) * Math.PI) : 0; }
const breathe = (t: number, i = 0) => Math.sin(t * 1.6 + i * 1.3) * 2;

// ================= A: gece masası, 月報 =================
function sceneDesk(c: Ctx, t: number) {
  const l = t - P1.at;
  const k = ease.inOut(prog(l, -0.4, 17.2));
  const rev = ease.inOut(prog(l, 11.6, 14.2));            // "裏" anında kağıda doğru dalış
  c.save();
  cam(c, t, lerp(1.0, 1.2, k) + 0.35 * rev, lerp(60, -40, k), lerp(-30, -90, k) - 330 * rev, 0.7);
  envNightRoom(c, t, lerp(2, 5, k));
  deskProps(c, t);
  const through = ease.inOut(prog(l, 11.9, 13.6));
  // kağıt (masada, perspektif)
  c.save();
  c.translate(930, 800); c.rotate(-0.06); c.transform(1, 0, -0.08, 0.82, 0, 0);
  // kağıdın "arkasındaki" sahne
  layer(c, through, () => {
    c.save();
    c.beginPath(); c.rect(-258, -340, 516, 680); c.clip();
    c.fillStyle = "#151A22"; c.fillRect(-260, -340, 520, 680);
    bokeh(c, t, 6, -300, -60, 31, 0.25);
    const gl = ease.out(prog(l, 14.88, 15.8));
    drawPerson(c, 10, 150, 1.0, { pose: "sit", outfit: 1, rim: 0.9, rimSide: -1, glow: 0.9 * gl, bob: breathe(t) });
    officeDesk(c, 10, 162, 0.85, 0.6, 1);
    c.restore();
  });
  geppoSheet(c, 0, 0, 0.92, { write: prog(l, 5.74, 6.5), through });
  c.restore();
  // kalem
  const wr = prog(l, 5.74, 6.5);
  const penA = win(l, 4.4, 7.8, 0.6) * (1 - through);
  layer(c, penA, () => {
    const px = 700 + 300 * wr, py = 820 + Math.sin(l * 40) * 3 * (wr > 0 && wr < 1 ? 1 : 0) - (1 - prog(l, 4.4, 5.6)) * 80;
    c.save(); c.translate(px, py); c.rotate(0.6);
    c.fillStyle = "#1C2A44"; rr(c, -9, -230, 18, 230, 8); c.fill();
    c.fillStyle = "#C9A54A"; c.fillRect(-9, -160, 18, 8);
    c.fillStyle = "#0A0C10"; c.beginPath(); c.moveTo(-9, 0); c.lineTo(9, 0); c.lineTo(0, 22); c.closePath(); c.fill();
    c.restore();
    // el (basit)
    c.fillStyle = "#C99A7A"; c.beginPath(); c.ellipse(px + 70, py - 100, 60, 42, 0.5, 0, Math.PI * 2); c.fill();
    c.fillStyle = "#2F4A6B"; c.fillRect(px + 100, py - 140, 400, 90);
  });
  c.restore();
  dust(c, t, 60, 0.35, 3);
}

// ================= B: goril deneyi — spor salonu =================
const PLAYERS = [
  { x: 620, y: 760, white: true, o: 0 }, { x: 800, y: 680, white: false, o: 2 }, { x: 1010, y: 660, white: true, o: 1 },
  { x: 1230, y: 690, white: false, o: 3 }, { x: 1320, y: 800, white: true, o: 4 }, { x: 900, y: 850, white: false, o: 5 },
];
const WHITES = [0, 2, 4];
const PASS_DT = 0.85;
const PASS_T0 = 18.2;
function ballState(l: number) {
  const k = Math.max(0, l - PASS_T0);
  const n = Math.floor(k / PASS_DT), f = (k % PASS_DT) / PASS_DT;
  const a = PLAYERS[WHITES[n % 3]], b = PLAYERS[WHITES[(n + 1) % 3]];
  return { x: lerp(a.x, b.x, f), y: lerp(a.y - 190, b.y - 190, f) - Math.sin(f * Math.PI) * 100 };
}
const passCount = (l: number) => (l < 19.84 ? 0 : Math.floor((l - 19.84) / PASS_DT) + 1);
function gorillaX(l: number) {
  if (l < 23.86) return 2100;
  if (l < 26.64) return lerp(2100, 960, ease.out(prog(l, 23.86, 26.64)));
  if (l < 29.0) return 960;
  return lerp(960, -200, ease.in(prog(l, 29.0, 33.6)));
}
function gymCrowd(c: Ctx, l: number, t: number) {
  const ball = ballState(l), gx = gorillaX(l);
  const beat = win(l, 27.6, 28.9, 0.15);
  const walking = (l > 23.86 && l < 26.64) || l > 29.0;
  const items: { y: number; fn: () => void }[] = [];
  PLAYERS.forEach((p, i) => {
    const tb = Math.sign(ball.x - p.x);
    items.push({ y: p.y, fn: () => drawPerson(c, p.x + Math.sin(l * 1.3 + i) * 18, p.y, 1.0, {
      shirt: p.white ? "white" : "black", outfit: p.o, rim: 0.8, eye: 1, gazeX: tb, facing: tb * 0.6,
      armUp: WHITES.includes(i) ? 0.5 + 0.2 * Math.sin(l * 7 + i) : 0.15, bob: Math.abs(Math.sin(l * 5 + i * 2)) * -6, walk: (l * 0.9 + i * 0.3) % 1,
    }) });
  });
  if (l > 23.5 && l < 34) items.push({ y: 760, fn: () => drawGorilla(c, gx, 760, 1.05, { walk: walking ? l * 1.6 : 0, beat, rim: 0.9 }) });
  items.sort((a, b) => a.y - b.y).forEach((it) => it.fn());
  if (l > PASS_T0) drawBall(c, ball.x, ball.y, 13);
  void t;
}
function sceneGorilla(c: Ctx, t: number) {
  const l = t - P1.at;
  const ball = ballState(l);
  const push = ease.inOut(prog(l, 26.9, 27.7)) * (1 - ease.inOut(prog(l, 28.95, 29.4)));
  const wide = ease.out(prog(l, 29.0, 29.6));
  const follow = -(ball.x - 960) * 0.18 * (1 - push);
  c.save();
  cam(c, t, lerp(1.08, 1.0, ease.out(prog(l, 16.6, 19))) + 0.42 * push - 0.06 * wide,
    follow + (gorillaX(l) < 2000 && l < 26.64 ? -60 : 0), lerp(0, 120, push) - 40 * wide, 1.0, 960, lerp(540, 520, push));
  envGym(c, t, 3);
  gymCrowd(c, l, t);
  c.restore();
  // seyirciler (ön plan, sığ alan derinliği)
  const obsA = prog(l, 28.9, 29.6);
  layer(c, obsA, () => {
    dof(c, 5, () => {
      for (let i = 0; i < 10; i++) {
        const x = 260 + i * 155 + Math.sin(t + i) * 3, y = 1180;
        drawPerson(c, x, y, 1.25, { outfit: i, rim: 0.4, rimSide: 1, shade: 0.55 });
      }
    });
    for (let i = 0; i < 10; i++) {
      const x = 260 + i * 155, iy = 760;
      const seen = [1, 2, 5, 7, 8].includes(i);
      const k = ease.back(prog(l, 29.3 + i * 0.09, 29.7 + i * 0.09));
      if (k <= 0) continue;
      c.save(); c.translate(x, iy); c.scale(k, k);
      c.fillStyle = "rgba(8,10,14,0.65)"; c.beginPath(); c.arc(0, 0, 28, 0, Math.PI * 2); c.fill();
      if (seen) { c.fillStyle = C.yellow; c.beginPath(); c.arc(0, 0, 13, 0, Math.PI * 2); c.fill(); }
      else { c.strokeStyle = "rgba(200,206,215,0.95)"; c.lineWidth = 5; c.lineCap = "round"; c.beginPath(); c.moveTo(-10, -10); c.lineTo(10, 10); c.moveTo(10, -10); c.lineTo(-10, 10); c.stroke(); }
      c.restore();
    }
  });
}
function gymHud(ctx: Ctx, t: number) {
  const l = t - P1.at;
  const a = win(t, g1(17.0), CARD1[0] + 0.2, 0.5);
  if (a <= 0) return;
  layer(ctx, a, () => {
    boardLabel(ctx, 90, 74, "ある有名な実験", prog(l, 17.2, 17.9));
    layer(ctx, prog(l, 19.6, 20.2), () => {
      ctx.fillStyle = "rgba(10,13,18,0.72)"; rr(ctx, 90, 96, 250, 120, 8); ctx.fill();
      ctx.fillStyle = C.yellow; ctx.fillRect(90, 96, 4, 120);
      boardLabel(ctx, 116, 140, "パスの回数", 1);
      ctx.font = font(700, 64); ctx.fillStyle = C.text; ctx.fillText(String(passCount(l)), 118, 198);
    });
  });
}

// ================= C: göz (yakın plan) =================
function sceneEye(c: Ctx, t: number) {
  const l = t - P2.at;
  const cx = W / 2, cy = H / 2 - 30;
  c.save();
  cam(c, t, lerp(1.25, 1.0, ease.out(prog(l, -0.4, 4))) + 0.08 * prog(l, 4, 9.6), 0, 0, 0.5, cx, cy);
  c.rotate(0);
  // cilt (yerel renk) + ışık
  const sk = c.createRadialGradient(cx - 200, cy - 250, 50, cx, cy, 1100);
  sk.addColorStop(0, "#A47658"); sk.addColorStop(0.5, "#6E4A36"); sk.addColorStop(1, "#24170F");
  c.fillStyle = sk; c.fillRect(-200, -200, W + 400, H + 400);
  // kaş
  c.strokeStyle = "#1E140E"; c.lineWidth = 46; c.lineCap = "round";
  c.beginPath(); c.moveTo(cx - 560, cy - 300); c.quadraticCurveTo(cx, cy - 430, cx + 560, cy - 300); c.stroke();
  const open = ease.out(prog(l, 0.1, 0.9)) * (1 - 0.92 * win(l, 8.55, 8.95, 0.18));
  const ew = 520, eh = 230 * open;
  // göz kapağı kıvrımı
  c.strokeStyle = "rgba(40,24,14,0.6)"; c.lineWidth = 8;
  c.beginPath(); c.moveTo(cx - ew - 20, cy - 20); c.quadraticCurveTo(cx, cy - 330, cx + ew + 20, cy - 20); c.stroke();
  c.save();
  c.beginPath(); c.moveTo(cx - ew, cy); c.quadraticCurveTo(cx, cy - eh * 1.6, cx + ew, cy); c.quadraticCurveTo(cx, cy + eh * 1.6, cx - ew, cy); c.closePath();
  c.fillStyle = "#E6E0D6"; c.fill(); c.clip();
  const sg = c.createRadialGradient(cx, cy, 100, cx, cy, ew);
  sg.addColorStop(0, "rgba(0,0,0,0)"); sg.addColorStop(1, "rgba(80,20,10,0.45)");
  c.fillStyle = sg; c.fillRect(cx - ew, cy - 400, ew * 2, 800);
  const gx = Math.sin(l * 4) * 18;
  const ir = 190;
  const ig = c.createRadialGradient(cx + gx, cy, 30, cx + gx, cy, ir);
  ig.addColorStop(0, "#6B4A2A"); ig.addColorStop(0.55, "#4A3220"); ig.addColorStop(1, "#1A110A");
  c.fillStyle = ig; c.beginPath(); c.arc(cx + gx, cy, ir, 0, Math.PI * 2); c.fill();
  c.strokeStyle = "rgba(160,120,70,0.25)"; c.lineWidth = 2;
  for (let i = 0; i < 60; i++) { const a = (i / 60) * Math.PI * 2; c.beginPath(); c.moveTo(cx + gx + Math.cos(a) * 82, cy + Math.sin(a) * 82); c.lineTo(cx + gx + Math.cos(a) * (150 + rnd(i, 3) * 35), cy + Math.sin(a) * (150 + rnd(i, 3) * 35)); c.stroke(); }
  c.fillStyle = "#050302"; c.beginPath(); c.arc(cx + gx, cy, 82, 0, Math.PI * 2); c.fill();
  // yansıma: salon + goril (görülen ama fark edilmeyen)
  c.save(); c.beginPath(); c.arc(cx + gx, cy, 170, 0, Math.PI * 2); c.clip();
  c.globalAlpha *= 0.35;
  c.translate(cx + gx, cy); c.scale(0.14, 0.14); c.translate(-W / 2, -H / 2);
  envGym(c, t, 0);
  const ghost = 1 - ease.inOut(prog(l, 2.66, 3.6));
  c.globalAlpha *= 0.3 + 0.7 * ghost;
  drawGorilla(c, 1100 - l * 40, 780, 1.1, { rim: 0 });
  c.restore();
  drawBall(c, cx + gx - 30 + Math.sin(l * 4) * 34, cy - 30 - Math.abs(Math.sin(l * 4)) * 16, 8, 0.95);
  c.fillStyle = "rgba(255,255,255,0.85)"; c.beginPath(); c.ellipse(cx + gx + 60, cy - 60, 26, 15, -0.6, 0, Math.PI * 2); c.fill();
  c.restore();
  // kirpikler
  c.strokeStyle = "#140C08"; c.lineWidth = 12;
  c.beginPath(); c.moveTo(cx - ew, cy); c.quadraticCurveTo(cx, cy - eh * 1.6, cx + ew, cy); c.stroke();
  c.lineWidth = 4;
  for (let i = 1; i < 22; i++) {
    const k = i / 22, x = lerp(cx - ew, cx + ew, k);
    const y = cy - eh * 1.6 * 2 * k * (1 - k) * 1.0;
    c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + (k - 0.5) * 30, y - 30 * open, x + (k - 0.5) * 60, y - 44 * open); c.stroke();
  }
  c.restore();
}
function eyeHud(ctx: Ctx, t: number) {
  const l = t - P2.at;
  layer(ctx, win(l, 5.86, 9.4, 0.4), () => {
    ctx.textAlign = "center"; ctx.font = font(600, 54, true); ctx.fillStyle = C.text;
    ctx.shadowColor = "rgba(0,0,0,0.8)"; ctx.shadowBlur = 16;
    ctx.fillText("非注意性盲目", W / 2, 140);
    ctx.shadowBlur = 0;
    ctx.fillStyle = C.yellow; ctx.fillRect(W / 2 - 170, 165, 340 * ease.inOut(prog(l, 6.2, 7.3)), 3);
  });
}

// ================= D: ters bakış — sen gorilsin =================
function sceneFlip(c: Ctx, t: number) {
  const l = t - P2.at;
  const fk = prog(l, 9.94, 10.9);
  const whip = Math.sin(fk * Math.PI);
  c.save();
  cam(c, t, 1.05 + 0.1 * prog(l, 10.9, 15.6), -whip * 900 * (fk < 0.5 ? 1 : -1) * 0.5, 0, 0.8);
  if (fk < 0.5) {
    envGym(c, t, 3);
    PLAYERS.forEach((p, i) => drawPerson(c, p.x, p.y, 1.0, { shirt: p.white ? "white" : "black", outfit: p.o, eye: 1, rim: 0.6, bob: breathe(t, i) }));
    drawGorilla(c, 960, 760, 1.05, {});
  } else {
    // ters açı: salonun diğer ucu, goril merkezde spot altında
    c.save(); c.translate(W, 0); c.scale(-1, 1); envGym(c, t, 4); c.restore();
    c.fillStyle = "rgba(5,7,10,0.45)"; c.fillRect(-200, -200, W + 400, H + 400);
    lightCone(c, 960, -60, Math.PI / 2, 0.2, 900, 0.22, "255,236,200");
    lightPool(c, 960, 800, 320, "rgba(255,236,200,", 0.25);
    const ring = [[480, 640], [700, 600], [1220, 600], [1440, 640], [600, 900], [1330, 900]];
    ring.forEach(([x, y], i) => drawPerson(c, x, y, 0.95, { shirt: i % 2 ? "black" : "white", outfit: i, rim: 0.5, rimSide: x > 960 ? -1 : 1, shade: 0.35, bob: breathe(t, i), facing: x > 960 ? 0.6 : -0.6 }));
    drawBall(c, 700 + Math.sin(l * 3) * 520, 360 - Math.abs(Math.sin(l * 3)) * 70, 12, 0.9);
    layer(c, 1 - ease.inOut(prog(l, 14.6, 15.4)), () => drawGorilla(c, 960, 800, 1.25, { rim: 1, beat: 0 }));
    layer(c, win(l, 12.96, 15.3, 0.35), () => {
      c.strokeStyle = C.yellow; c.lineWidth = 4;
      c.beginPath(); c.ellipse(960, 806, 170, 30, 0, 0, Math.PI * 2); c.stroke();
      c.textAlign = "center"; c.font = font(700, 38); c.fillStyle = C.yellow;
      c.fillText("あなた", 960, 880);
    });
  }
  c.restore();
}

// ================= E: gece ofisi — sessiz çalışan =================
const TASKS = 8;
function sceneWorker(c: Ctx, t: number) {
  const l = t - P2.at;
  const k = ease.inOut(prog(l, 15.0, 31));
  const pan = lerp(260, -180, k);
  c.save();
  cam(c, t, lerp(1.0, 1.12, k), pan, lerp(0, -30, k), 0.6);
  envOffice(c, t, 3, pan);
  // meslektaşlar (sıcak lambalar: soğuk değiller, sadece meşguller)
  const colA = ease.out(prog(l, 22.6, 23.8));
  const cols = [[260, 840, 3], [560, 760, 2], [1700, 820, 5]];
  cols.forEach(([x, y, o], i) => {
    drawPerson(c, x, y, 0.85, { pose: "sit", outfit: o, rim: 0.5, rimSide: i === 2 ? -1 : 1, shade: 0.6 - 0.45 * colA, bob: breathe(t, i) });
    officeDesk(c, x, y + 10, 0.85, 0.7, colA);
    const cA = prog(l, 26.5, 27.0);
    if (cA > 0) {
      const n = Math.floor(Math.max(0, l - 26.6) * (6 + i * 2)) + 12 + i * 7;
      layer(c, cA, () => {
        c.fillStyle = "rgba(10,13,18,0.85)"; rr(c, x - 54, y - 330, 108, 58, 6); c.fill();
        c.strokeStyle = "rgba(242,207,58,0.5)"; c.lineWidth = 2; c.stroke();
        c.textAlign = "center"; c.font = font(700, 36); c.fillStyle = C.text; c.fillText(String(n), x, y - 288);
      });
    }
  });
  // ana figür
  const mx = 1080, my = 820;
  drawPerson(c, mx, my, 1.15, { pose: "sit", outfit: 1, rim: 0.9, rimSide: -1, bob: breathe(t), facing: Math.sin(l * 0.8) * 0.3 });
  officeDesk(c, mx, my + 12, 1.15, 0.8, 1);
  for (let i = 0; i < TASKS; i++) {
    const t0 = 15.4 + i * 0.62, kk = prog(l, t0, t0 + 0.5);
    if (kk <= 0) continue;
    const done = prog(l, t0 + 0.45, t0 + 0.6);
    const sx = mx - 480, sy = 380 + (i % 3) * 30, ex = mx + 250, ey = my - 50 - i * 9;
    const x = lerp(sx, ex, ease.inOut(kk)), y = lerp(sy, ey, ease.inOut(kk)) - Math.sin(kk * Math.PI) * 90;
    c.save(); c.translate(x, y); c.rotate(lerp(-0.3, 0.02 * ((i % 3) - 1), kk));
    c.fillStyle = "#E2DCCB"; c.fillRect(-42, -28, 84, 56);
    c.fillStyle = "rgba(30,34,40,0.5)"; c.fillRect(-30, -15, 52, 4); c.fillRect(-30, -5, 40, 4); c.fillRect(-30, 5, 48, 4);
    if (done > 0) { c.strokeStyle = `rgba(60,120,90,${done})`; c.lineWidth = 6; c.lineCap = "round"; c.beginPath(); c.moveTo(14, 0); c.lineTo(22, 10); c.lineTo(38, -14); c.stroke(); }
    c.restore();
  }
  layer(c, win(l, 20.6, 23.4, 0.4), () => {
    const ox = lerp(80, 0, ease.out(prog(l, 20.6, 21.2)));
    c.save(); c.translate(1440 + ox, 300);
    c.fillStyle = "rgba(14,18,24,0.94)"; rr(c, 0, 0, 300, 220, 8); c.fill();
    c.strokeStyle = "rgba(140,151,168,0.35)"; c.lineWidth = 2; c.stroke();
    c.font = font(600, 32); c.fillStyle = C.text; c.fillText("評価", 28, 54);
    for (let i = 0; i < 3; i++) { c.strokeStyle = "rgba(140,151,168,0.5)"; c.strokeRect(28, 86 + i * 42, 30, 30); c.fillStyle = "rgba(140,151,168,0.25)"; c.fillRect(72, 98 + i * 42, 190, 6); }
    c.restore();
  });
  c.restore();
  dust(c, t, 40, 0.25, 11);
}

// ================= F: 4 kişiden 1 — ofis katında kalabalık =================
const GLOW_IDX = [11, 2, 5, 16, 18];
function sceneGrid(c: Ctx, t: number) {
  const l = t - P3.at;
  const k = ease.inOut(prog(l, -0.4, 9.2));
  c.save();
  cam(c, t, lerp(1.18, 1.0, k), 0, lerp(-80, 0, k), 0.6);
  envOffice(c, t, 7, 0);
  c.fillStyle = "rgba(5,7,10,0.5)"; c.fillRect(-300, -300, W + 600, H + 600);
  const sx = 330, dx = 140;
  for (let i = 0; i < 20; i++) {
    const r = Math.floor(i / 10), col = i % 10;
    const x = sx + col * dx, y = 620 + r * 300;
    const a = ease.out(prog(l, 0.1 + i * 0.04, 0.6 + i * 0.04));
    const lit = GLOW_IDX.includes(i) ? ease.out(prog(l, 3.6 + (i % 5) * 0.12, 4.6 + (i % 5) * 0.12)) : 0;
    if (lit > 0) { lightCone(c, x, -40, Math.PI / 2, 0.08, y + 40, 0.18 * lit, "255,226,160"); lightPool(c, x, y, 120, "rgba(255,226,160,", 0.3 * lit); }
    drawPerson(c, x, y, 0.7, { alpha: a, outfit: i, rim: 0.4 + 0.5 * lit, glow: lit * 0.8, shade: 0.55 * (1 - lit), bob: breathe(t, i) });
  }
  c.restore();
}
function gridHud(ctx: Ctx, t: number) {
  const l = t - P3.at;
  layer(ctx, ease.out(prog(l, 7.14, 7.8)) * (1 - prog(l, 8.8, 9.2)), () => {
    ctx.strokeStyle = "rgba(200,206,215,0.45)"; ctx.lineWidth = 2; ctx.setLineDash([8, 8]);
    for (let g = 0; g < 5; g++) { rr(ctx, 330 - 70 + g * 280, 360, 280, 600, 14); ctx.stroke(); }
    ctx.setLineDash([]);
  });
  layer(ctx, win(l, 4.9, 9.2, 0.4), () => {
    ctx.textAlign = "center"; ctx.font = font(700, 60); ctx.fillStyle = C.yellow;
    ctx.shadowColor = "rgba(0,0,0,0.8)"; ctx.shadowBlur = 18; ctx.fillText("27.7%", W / 2, 230); ctx.shadowBlur = 0;
  });
}

// ================= G: koridor — iki kapı =================
function sceneDoors(c: Ctx, t: number) {
  const l = t - P3.at;
  const k = ease.inOut(prog(l, 8.7, 24.4));
  const close = ease.inOut(prog(l, 16.7, 17.6));
  c.save();
  cam(c, t, lerp(1.0, 1.22, k), 0, lerp(0, 40, k), 0.9);
  envCorridor(c, t);
  // kapılar duvarlarda (perspektif dörtgen)
  const doors = [{ s: -1, label: "悪意", t: 12.7 }, { s: 1, label: "仕組み", t: 13.98 }];
  doors.forEach((d) => {
    const a = ease.out(prog(l, d.t - 0.4, d.t + 0.4));
    if (a <= 0) return;
    const xo = d.s < 0 ? 380 : W - 380, xi = d.s < 0 ? 600 : W - 600;
    const q = [[xo, 200], [xi, 300], [xi, 700], [xo, 860]];
    const open = 1 - close;
    c.save(); c.globalAlpha *= a;
    c.fillStyle = `rgba(190,205,230,${0.15 + 0.6 * open})`;
    c.beginPath(); q.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath(); c.fill();
    lightPool(c, (xo + xi) / 2, 760, 260, "rgba(190,205,230,", 0.25 * open);
    // kapı kanadı (açık → kapalı)
    const sw = lerp(0.25, 1, close);
    const pq = [[xo, 200], [lerp(xo, xi, sw), lerp(200, 300, sw)], [lerp(xo, xi, sw), lerp(860, 700, sw)], [xo, 860]];
    c.fillStyle = "#5A3E2A"; c.beginPath(); pq.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath(); c.fill();
    c.strokeStyle = "#2A1C12"; c.lineWidth = 10; c.beginPath(); q.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath(); c.stroke();
    c.textAlign = "center"; c.font = font(700, 50, true); c.fillStyle = `rgba(232,234,238,${0.45 + 0.55 * open})`;
    c.fillText(d.label, (xo + xi) / 2, 210);
    c.restore();
  });
  const pA = ease.inOut(prog(l, 19.78, 21.4));
  layer(c, pA, () => {
    const g = c.createLinearGradient(0, H, 0, 640);
    g.addColorStop(0, "rgba(242,207,58,0.28)"); g.addColorStop(1, "rgba(242,207,58,0)");
    c.fillStyle = g; c.beginPath(); c.moveTo(W / 2 - 300, H + 50); c.lineTo(W / 2 + 300, H + 50); c.lineTo(W / 2 + 60, 640); c.lineTo(W / 2 - 60, 640); c.closePath(); c.fill();
    lightPool(c, W / 2, 560, 220, "rgba(242,207,58,", 0.4);
  });
  layer(c, ease.out(prog(l, 21.3, 22.2)), () => {
    c.textAlign = "center"; c.font = font(600, 44, true); c.fillStyle = C.text;
    c.fillText("誰も悪くないのに、起きてしまうこと", W / 2, 440);
  });
  c.restore();
  const mIn = ease.out(prog(l, 9.2, 10.4));
  if (mIn > 0) {
    const gest = win(l, 16.5, 18.8, 0.4);
    drawMascot(c, lerp(2100, 1650, mIn), 1030, 0.82, { mouth: speaking(parts, t), armR: 0.12 + 1.6 * gest, lookX: lerp(-0.6, -1, gest), blink: blinkAt(t), rim: 1, light: 0.85, tilt: Math.sin(t * 1.2) * 0.012 });
  }
  dust(c, t, 40, 0.25, 15);
}

// ================= H: karanlık ofis — もう一人 =================
function sceneForeshadow(c: Ctx, t: number) {
  const l = t - P3.at;
  c.save();
  cam(c, t, lerp(1.0, 1.1, prog(l, 23.8, 35.6)), lerp(40, -40, prog(l, 23.8, 35.6)), 0, 1.4);
  envOffice(c, t, 4, 0);
  c.fillStyle = "rgba(3,5,8,0.72)"; c.fillRect(-300, -300, W + 600, H + 600);
  for (let i = 0; i < 4; i++) officeDesk(c, 300 + i * 450, 860 + (i % 2) * 30, 0.9, 0.08, 0);
  for (let i = 0; i < 6; i++) lightPool(c, (rnd(i, 21) * W + l * (14 + i * 5)) % (W + 600) - 300, 600 + rnd(i, 22) * 300, 420, "rgba(120,140,170,", 0.05);
  const ang = lerp(-0.2, 0.0, ease.inOut(prog(l, 25.0, 28.6))) + Math.sin(l * 0.9) * 0.025 - 0.25 * ease.inOut(prog(l, 32.7, 34.8));
  const on = ease.out(prog(l, 24.9, 25.3)) * (0.92 + 0.08 * Math.sin(t * 23));
  const sA = ease.inOut(prog(l, 28.78, 30.4)) * (1 - ease.inOut(prog(l, 33.2, 35.0)));
  layer(c, sA, () => drawPerson(c, 1400, 860, 1.0, { outfit: 4, rim: 1, rimSide: -1, shade: 0.55, glow: 0.3 * win(l, 29.8, 34, 0.6) }));
  if (on > 0) lightCone(c, 560, 690, ang, 0.13, 1500, 0.24 * on, "255,236,190");
  c.restore();
  layer(c, win(l, 30.0, 34.2, 0.5) * 0.9, () => {
    c.textAlign = "center"; c.font = font(300, 96, true); c.fillStyle = C.yellow;
    c.fillText("？", 1400 + Math.sin(t * 2) * 4, 470);
  });
  drawMascot(c, 420, 1040, 0.85, { mouth: speaking(parts, t), armR: 1.25, prop: "flashlight", lookX: 0.8, blink: blinkAt(t), light: 0.7, rim: 1, tilt: Math.sin(t * 0.9) * 0.015 });
  dust(c, t, 50, 0.2, 17);
}

// ================= I: あの人 / 自分 =================
function sceneTwo(c: Ctx, t: number) {
  const l = t - P3.at;
  c.save();
  cam(c, t, lerp(1.0, 1.08, prog(l, 35.1, 42.3)), 0, 0, 0.6);
  envOffice(c, t, 6, 0);
  c.fillStyle = "rgba(3,5,8,0.7)"; c.fillRect(-300, -300, W + 600, H + 600);
  const spot = ease.out(prog(l, 36.2, 36.8)) * (1 - ease.inOut(prog(l, 40.0, 41.6)));
  lightCone(c, 700, -60, Math.PI / 2, 0.2, 1000, 0.3 * spot, "255,236,190");
  lightPool(c, 700, 900, 300, "rgba(255,236,190,", 0.3 * spot);
  drawPerson(c, 700, 900, 1.3, { outfit: 0, tie: true, rim: 0.4 + 0.6 * spot, glow: 0.5 * spot, shade: 0.6 * (1 - spot), bob: breathe(t) });
  const self = ease.out(prog(l, 37.88, 38.6)) * (1 - ease.inOut(prog(l, 40.0, 41.6)));
  drawPerson(c, 1240, 900, 1.3, { outfit: 1, rim: 0.4 * self, rimSide: -1, shade: 0.75, bob: breathe(t, 2) });
  layer(c, spot, () => { c.textAlign = "center"; c.font = font(600, 34); c.fillStyle = C.yellow; c.fillText("あの人", 700, 470); });
  layer(c, self, () => { c.textAlign = "center"; c.font = font(600, 34); c.fillStyle = C.mist; c.fillText("自分", 1240, 470); });
  c.restore();
  dust(c, t, 40, 0.2, 19);
}

// ================= J: tez cümlesi =================
function sceneThesis(c: Ctx, t: number) {
  const l = t - P3.at;
  c.save();
  cam(c, t, lerp(1.06, 1.0, prog(l, 41.8, 52)), lerp(-30, 30, prog(l, 41.8, 52)), 0, 0.4);
  c.fillStyle = "#07090D"; c.fillRect(-300, -300, W + 600, H + 600);
  dof(c, 14, () => bokeh(c, t, 26, 100, 980, 77, 0.22));
  c.restore();
  const shrink = ease.inOut(prog(l, 47.0, 48.4));
  const cy = lerp(H / 2 - 40, 330, shrink), sc = lerp(1, 0.62, shrink);
  c.save();
  c.translate(W / 2, cy); c.scale(sc, sc);
  c.textAlign = "left"; c.font = font(700, 96, true);
  const L1 = ["評価は、", "目ではなく、"], L2 = ["記憶で", "行われる。"];
  const t1s = [42.76, 43.66], t2s = [44.82, 45.28];
  const w1 = c.measureText(L1.join("")).width, w2 = c.measureText(L2.join("")).width;
  let x = -w1 / 2;
  L1.forEach((s, i) => {
    const k = ease.out(prog(l, t1s[i] - 0.05, t1s[i] + 0.5));
    const dim = i === 1 ? 1 - 0.55 * ease.inOut(prog(l, 44.6, 45.4)) : 1;
    c.fillStyle = `rgba(232,234,238,${k * dim})`; c.fillText(s, x, -40 + (1 - k) * 16);
    if (i === 1) { const st = ease.inOut(prog(l, 44.6, 45.2)); const mw = c.measureText("目").width; c.strokeStyle = `rgba(160,170,185,${0.9 * st})`; c.lineWidth = 5; c.beginPath(); c.moveTo(x - 6, -72); c.lineTo(x + (mw + 12) * st - 6, -72); c.stroke(); }
    x += c.measureText(s).width;
  });
  x = -w2 / 2;
  L2.forEach((s, i) => {
    const k = ease.out(prog(l, t2s[i] - 0.05, t2s[i] + 0.5));
    if (i === 0) {
      const gw = c.measureText("記憶").width;
      const gl = c.createRadialGradient(x + gw / 2, 70, 10, x + gw / 2, 70, 260);
      gl.addColorStop(0, `rgba(242,207,58,${0.25 * k})`); gl.addColorStop(1, "rgba(242,207,58,0)");
      c.fillStyle = gl; c.fillRect(x - 220, -200, gw + 440, 520);
      c.fillStyle = `rgba(242,207,58,${k})`; c.fillText("記憶", x, 100 + (1 - k) * 16);
      c.fillStyle = `rgba(232,234,238,${k})`; c.fillText("で", x + gw, 100 + (1 - k) * 16);
    } else { c.fillStyle = `rgba(232,234,238,${k})`; c.fillText(s, x, 100 + (1 - k) * 16); }
    x += c.measureText(s).width;
  });
  c.restore();
  layer(c, shrink, () => {
    c.strokeStyle = "rgba(242,207,58,0.55)"; c.lineWidth = 2; rr(c, W / 2 - 560, 170, 1120, 300, 10); c.stroke();
    c.fillStyle = C.yellow; c.beginPath(); c.arc(W / 2, 170, 9, 0, Math.PI * 2); c.fill();
  });
  const mIn = ease.out(prog(l, 47.2, 48.4));
  if (mIn > 0) drawMascot(c, lerp(2100, 1560, mIn), 1040, 0.8, { mouth: speaking(parts, t), armR: 0.9, prop: "magnifier", lookX: -0.7, lookY: -0.6, blink: blinkAt(t), rim: 1, tilt: Math.sin(t * 1.1) * 0.012 });
  dust(c, t, 40, 0.22, 23);
}

// ================= ÇİZİM =================
const SCENES: [number, number, (c: Ctx, t: number) => void, Lens][] = [
  [3.0, g1(17.2), sceneDesk, LENS.night],
  [g1(16.6), CARD1[0] + 0.6, sceneGorilla, LENS.gym],
  [g2(-0.4), g2(9.6), sceneEye, LENS.doc],
  [g2(9.1), g2(15.8), sceneFlip, LENS.gym],
  [g2(15.0), CARD2[0] + 0.6, sceneWorker, LENS.night],
  [g3(-0.4), g3(9.2), sceneGrid, LENS.night],
  [g3(8.7), g3(24.4), sceneDoors, LENS.doc],
  [g3(23.8), g3(35.6), sceneForeshadow, LENS.night],
  [g3(35.1), g3(42.3), sceneTwo, LENS.night],
  [g3(41.8), END, sceneThesis, LENS.night],
];

function draw(ctx: Ctx, t: number) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
  ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H);
  const active = SCENES.filter(([a, b]) => t >= a && t <= b);
  const L = active.length ? active[active.length - 1][3] : LENS.night;
  if (t >= 2.6) {
    lens(ctx, t, L, (c) => {
      for (const [a, , fn] of active) layer(c, a <= 3.0 ? 1 : ease.sine(prog(t, a, a + 0.6)), () => fn(c, t));
    });
  }
  gymHud(ctx, t);
  eyeHud(ctx, t);
  gridHud(ctx, t);
  sectionTitle(ctx, t, 0.0, 3.2, "01", "冒頭");
  screenCard(ctx, t, CARD1[0], CARD1[1], { term: "非注意性盲目", source: "Simons & Chabris, 1999" });
  statReveal(ctx, t, CARD2[0], CARD2[1], { value: 27.7, source: "リクルートマネジメントソリューションズ調査（2026年5月）" });
  drawSubtitles(ctx, parts, t);
  fadeBlack(ctx, 1 - prog(t, 0, 0.5));
  fadeBlack(ctx, prog(t, END - 1.4, END - 0.2));
}

// ================= SES EFEKTLERİ =================
const cues: Cue[] = [];
const cue = (t: number, type: string, gain = 1, p: Record<string, number> = {}) => cues.push({ t, type, gain, p });

cue(0.0, "room", 0.5, { d: END });
cue(0.35, "whoosh", 0.6, { d: 1.2 });
cue(2.7, "whoosh", 0.35, { d: 1.0 });
cue(g1(5.74), "pen", 0.8, { d: 0.8 });
cue(g1(11.95), "shimmer", 0.35, { f: 330 });
cue(g1(14.88), "shimmer", 0.5, { f: 440 });
cue(g1(16.8), "swish", 0.55);
for (let n = 0; n < 16; n++) {
  const tt = PASS_T0 + n * PASS_DT + PASS_DT;
  if (tt > 33) break;
  cue(g1(tt), "tick", tt > 19.84 ? 0.5 : 0.3, { f: 1800 + (n % 2) * 300 });
}
for (let s = 23.9; s < 26.6; s += 0.62) cue(g1(s), "step", 0.45);
for (let s = 29.1; s < 33.0; s += 0.58) cue(g1(s), "step", 0.35);
[27.7, 28.05, 28.4, 28.7].forEach((s) => cue(g1(s), "thump", 0.9));
for (let i = 0; i < 10; i++) cue(g1(29.3 + i * 0.09), [1, 2, 5, 7, 8].includes(i) ? "blip" : "tick", 0.3, { f: [1, 2, 5, 7, 8].includes(i) ? 880 : 600 });
cue(CARD1[0], "hit", 0.8);
cue(CARD1[0] + 0.15, "shimmer", 0.4, { f: 392 });
cue(CARD1[1] - 0.3, "whoosh", 0.3, { d: 0.8 });
cue(g2(0.15), "swish", 0.35);
cue(g2(2.66), "fall", 0.4);
cue(g2(5.86), "shimmer", 0.3, { f: 523 });
cue(g2(9.94), "swish", 0.6);
cue(g2(12.96), "blip", 0.35, { f: 660 });
cue(g2(14.8), "whoosh", 0.35, { d: 1.0 });
for (let i = 0; i < TASKS; i++) cue(g2(15.4 + i * 0.62 + 0.5), "tick", 0.38, { f: 1400 });
cue(g2(20.6), "thunk", 0.55);
cue(g2(22.9), "whoosh", 0.25, { d: 1.2 });
for (let s = 26.7; s < 30.2; s += 0.16) cue(g2(s), "tick", 0.14, { f: 2200 + ((s * 100) % 3) * 200 });
cue(CARD2[0], "hit", 0.8);
for (let i = 0; i < 14; i++) cue(CARD2[0] + 0.25 + i * 0.1 * (1 + i * 0.06), "tick", 0.3, { f: 1500 + i * 60 });
cue(CARD2[1] - 0.3, "whoosh", 0.3, { d: 0.8 });
cue(g3(3.6), "shimmer", 0.45, { f: 440 });
cue(g3(7.14), "swish", 0.3);
cue(g3(9.2), "step", 0.3); cue(g3(9.6), "step", 0.3);
cue(g3(12.7), "thunk", 0.5);
cue(g3(13.98), "thunk", 0.5);
cue(g3(16.9), "door", 0.7);
cue(g3(17.3), "door", 0.6);
cue(g3(19.78), "shimmer", 0.45, { f: 392 });
cue(g3(23.8), "whoosh", 0.35, { d: 1.2 });
cue(g3(24.95), "click", 0.7);
cue(g3(28.6), "riser", 0.45, { d: 2.4 });
cue(g3(33.0), "fall", 0.35);
cue(g3(36.2), "thunk", 0.4);
cue(g3(41.7), "whoosh", 0.4, { d: 1.2 });
cue(g3(42.76), "hit", 0.45);
cue(g3(43.66), "hit", 0.45);
cue(g3(44.82), "hit", 0.85);
cue(g3(44.82), "shimmer", 0.55, { f: 523 });
cue(g3(47.0), "swish", 0.4);
cue(END - 1.6, "whoosh", 0.35, { d: 1.4 });

export const s01: Section = { id: "s01", duration: END, parts, cues, draw };
