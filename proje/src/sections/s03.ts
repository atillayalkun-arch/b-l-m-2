// s03 防がれた火事 — ses 6, 7  (s01/s02 yapısı: SCENES + lens + cues)
// Yeni ortak parçalar: design/fx.ts (alev, duman, sprey, alarm, whip-pan), characters/props.ts,
// components/umbrella.ts (★ s10 ile aynı kompozisyon).
import { Section, Part, Cue, W, H, clamp, ease, prog, win, lerp, rnd, speaking } from "../engine/core";
import { C, font, lightPool, lightCone, fadeBlack, rr, dust, boardGrid } from "../design/style";
import { lens, LENS, cam, dof, Lens } from "../design/grade";
import { envOffice, officeDesk, envNightRoom } from "../design/env";
import { flame, smoke, sparks, spray, alarmLight, strobe, flashPop, whipStreaks, confetti } from "../design/fx";
import { drawMascot } from "../characters/mascot";
import { drawPerson } from "../characters/people";
import { extinguisher, wasteBin, powerStrip, medal, mug, plant, wallClock, policyArrow } from "../characters/props";
import { umbrellaShot, burstRate, UMB } from "../components/umbrella";
import { sectionTitle, sourceCard, boardLabel } from "../components/cards";
import { drawSubtitles } from "../components/subtitle";
import t6 from "../timing/6.json";
import t7 from "../timing/7.json";

const P6: Part = { timing: t6 as any, at: 3.2 };
const P7: Part = { timing: t7 as any, at: 23.6 };
const parts = [P6, P7];
const END = 96.8;
const g6 = (l: number) => P6.at + l;
const g7 = (l: number) => P7.at + l;
type Ctx = CanvasRenderingContext2D;

function layer(ctx: Ctx, a: number, fn: () => void) {
  if (a <= 0.001) return;
  ctx.save(); ctx.globalAlpha *= clamp(a); fn(); ctx.restore();
}
const breathe = (t: number, i = 0) => Math.sin(t * 1.6 + i * 1.3) * 2;
function nameTag(c: Ctx, x: number, y: number, txt: string, a: number, hot = false) {
  if (a <= 0) return;
  c.save(); c.globalAlpha *= clamp(a);
  c.font = font(600, 34);
  const w = c.measureText(txt).width + 40;
  c.fillStyle = "rgba(10,13,18,0.75)"; rr(c, x - w / 2, y - 30 + (1 - a) * 10, w, 52, 26); c.fill();
  c.strokeStyle = hot ? "rgba(242,207,58,0.8)" : "rgba(140,151,168,0.6)"; c.lineWidth = 2; c.stroke();
  c.fillStyle = hot ? C.yellow : C.text; c.textAlign = "center"; c.fillText(txt, x, y + 8 + (1 - a) * 10);
  c.restore();
}
/** Damga (評価 / 後回し): ölçekle vurup oturur */
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

const LENS_FIRE: Lens = { shadow: "rgba(16,48,62,0.34)", high: "rgba(255,120,60,0.16)", bloom: 0.85, ca: 1.4, vig: 0.76, grain: 0.065, exposure: 1.02, sat: 1.0 };
const HERO_OUT = 3, B_OUT = 2;

// ================= A: 火事を消した人は、英雄 — gece ofis, yangın =================
const FIRE_X = 1150, FIRE_Y = 900;
function heroX(l: number) { return lerp(-260, 700, ease.out(prog(l, -0.7, 0.45))); }
function sceneFire(c: Ctx, t: number) {
  const l = t - P6.at;
  const fireK = 1 - ease.inOut(prog(l, 0.55, 1.55));
  const alarm = 1 - prog(l, 1.3, 1.9);
  const hero = ease.out(prog(l, 1.5, 2.1));
  const whip = ease.in(prog(l, 3.0, 3.45));
  const hx = heroX(l);
  const zoom = lerp(1.22, 1.06, ease.inOut(prog(l, -0.6, 1.2))) + 0.14 * ease.inOut(prog(l, 1.55, 3.2));
  const fx = lerp(-(hx - 960) * 0.25 - 120, -(hx - 960) * 0.9, hero);
  c.save();
  dof(c, whip * 16, () => {
    c.save();
    cam(c, t, zoom, fx - whip * 1800, lerp(-30, -60, hero), 1.6 * (1 - hero * 0.6), 960, 640);
    envOffice(c, t, 5, l * 10);
    // kopya makinesi + raf (set objeleri)
    c.save(); c.translate(1480, 900);
    c.fillStyle = "#B9BCC2"; rr(c, -130, -230, 260, 230, 10); c.fill();
    c.fillStyle = "#8D9097"; c.fillRect(-130, -110, 260, 8); c.fillRect(-130, -60, 260, 6);
    c.fillStyle = "#2A2D33"; rr(c, -110, -220, 150, 26, 4); c.fill();
    c.fillStyle = `rgba(120,220,160,${0.6 + 0.4 * Math.sin(t * 3)})`; c.fillRect(60, -214, 40, 14);
    c.fillStyle = "#E9E3D2"; c.fillRect(-150, -150, 70, 6);
    c.fillStyle = "rgba(0,0,0,0.4)"; c.beginPath(); c.ellipse(0, 4, 150, 14, 0, 0, Math.PI * 2); c.fill();
    c.restore();
    c.save(); c.translate(1760, 900);
    c.fillStyle = "#3A2C20"; c.fillRect(-90, -380, 180, 380);
    for (let r = 0; r < 4; r++) { c.fillStyle = "#24190F"; c.fillRect(-84, -370 + r * 92, 168, 84); for (let k = 0; k < 6; k++) { c.fillStyle = ["#2F4A6B", "#8A3A30", "#C9C2B0", "#5A6B4A"][(k + r) % 4]; c.fillRect(-78 + k * 26, -356 + r * 92 + (k % 3) * 4, 20, 70 - (k % 3) * 4); } }
    c.restore();
    // çöp kutusu + priz (yangın kaynağı)
    powerStrip(c, FIRE_X - 210, FIRE_Y + 10, 0.9, 0, t, fireK);
    wasteBin(c, FIRE_X, FIRE_Y, 1.0, 1 - fireK * 0.3);
    smoke(c, t, FIRE_X, FIRE_Y - 160, 320, 760, 0.55 + 0.5 * (1 - fireK) * (1 - prog(l, 2.5, 3.4)), 11, 20);
    flame(c, t, FIRE_X, FIRE_Y - 118, 170, 300, fireK, 3);
    sparks(c, t, FIRE_X, FIRE_Y - 160, fireK, 5, 30, 420);
    // alarm lambası
    alarmLight(c, t, FIRE_X - 40, 30, alarm);
    // 英雄: spot
    lightCone(c, 700, -80, Math.PI / 2 + 0.05, 0.2, 1000, 0.22 * hero);
    lightPool(c, 700, 900, 320, "rgba(255,226,160,", 0.25 * hero);
    // arka sıra iş arkadaşları (alkış)
    const crowd = ease.out(prog(l, 1.2, 1.9));
    [[300, 0.72, 1], [430, 0.7, 5], [1000, 0.7, 0], [140, 0.74, 4]].forEach(([x, s, o], i) => {
      if (crowd <= 0) return;
      const clap = 0.55 + 0.25 * Math.sin(t * 15 + i * 2);
      drawPerson(c, x, 770, s, { outfit: o, rim: 0.6, rimSide: x < 700 ? 1 : -1, facing: x < 700 ? 0.7 : -0.7, armUp: clap * crowd, alpha: crowd, eye: 1, gazeX: x < 700 ? 1 : -1, shade: 0.25 });
    });
    // kahraman
    const spraying = l > 0.42 && l < 1.62;
    const walking = l < 0.45;
    const arm = spraying ? 0.36 : lerp(0.2, 0.05, hero);
    drawPerson(c, hx, 920, 1.12, { outfit: HERO_OUT, rim: 0.9 + 0.1 * hero, rimSide: 1, facing: lerp(1, 0.1, hero), walk: walking ? l * 1.6 : -1, bob: walking ? -Math.abs(Math.sin(l * 10)) * 7 : breathe(t) * 0.6, eye: 1, gazeX: lerp(1, 0, hero), armUp: arm, glow: 0.8 * hero });
    const hand = { x: hx + (46 + 24 * arm) * 1.12, y: 920 + (-186 + 104 - 124 * arm + 6) * 1.12 };
    const nz = extinguisher(c, hand.x, hand.y, 0.9, lerp(0.15, 0.9, hero), 1);
    if (spraying) spray(c, t, nz.nx, nz.ny, FIRE_X - 10, FIRE_Y - 150, win(l, 0.42, 1.62, 0.12), 9);
    // flaşlar (telefon kameraları)
    [1.72, 2.05, 2.38, 2.6, 2.95, 3.2].forEach((s, i) => flashPop(c, [330, 1000, 430, 140, 1000, 300][i] + 20, 600 + (i % 2) * 20, l < s ? 0 : 1 - prog(l, s, s + 0.28)));
    confetti(c, t, g6(1.7), hx, 640, hero, 3);
    c.restore();
  });
  // ön plan alkışçılar (DOF)
  layer(c, ease.out(prog(l, 1.3, 1.9)) * (1 - whip), () => dof(c, 7, () => {
    [[150, 0], [1780, 2]].forEach(([x, o], i) => drawPerson(c, x - whip * 1600, 1300, 1.55, { outfit: o, rim: 0.4, shade: 0.55, facing: i ? -1 : 1, armUp: 0.55 + 0.25 * Math.sin(t * 14 + i) }));
  }));
  // alarm ekran kızıllığı
  layer(c, alarm * strobe(t) * 0.5, () => { c.fillStyle = "rgba(180,30,20,0.35)"; c.fillRect(0, 0, W, H); });
  layer(c, win(l, 1.75, 3.1, 0.3), () => { c.font = font(700, 96, true); c.fillStyle = C.yellow; c.textAlign = "center"; c.shadowColor = "rgba(242,207,58,0.6)"; c.shadowBlur = 30; c.fillText("英雄", 960 + 330, 330 - 10 * ease.out(prog(l, 1.75, 2.3))); c.shadowBlur = 0; });
  c.restore();
}

// ================= B: 一度も出さなかった人 — aynı kat, karanlık köşe =================
function scenePrevent(c: Ctx, t: number) {
  const l = t - P6.at;
  const wIn = 1 - ease.out(prog(l, 3.3, 3.85));
  const k = ease.inOut(prog(l, 3.4, 7.6));
  const rack = ease.inOut(prog(l, 5.0, 6.2));
  const tidy = ease.inOut(prog(l, 3.9, 6.0));
  c.save();
  dof(c, wIn * 16, () => {
    c.save();
    cam(c, t, lerp(1.04, 1.13, k), wIn * 1800 + lerp(60, -40, k), lerp(10, -20, k), 0.5, 1000, 640);
    envOffice(c, t, 6 - 2 * rack, -l * 4);
    // söndürülmüş alarm lambası (aynı yer, kapalı)
    c.fillStyle = "#2A2D33"; c.fillRect(1090, 30, 40, 8); c.fillStyle = "#4A2420"; c.beginPath(); c.arc(1110, 30, 14, Math.PI, 0); c.fill();
    wallClock(c, 1560, 210, 46, 11.6 + l * 0.02);
    // B: tek lamba altında, kabloları düzenlemiş, kontrol listesi
    lightPool(c, 1180, 820, 360, "rgba(255,215,150,", 0.18);
    dof(c, 3.5 * (1 - rack), () => {
      drawPerson(c, 1180, 860, 1.0, { pose: "sit", outfit: B_OUT, rim: 0.7, rimSide: -1, facing: -0.25, bob: breathe(t, 2) * 0.6, eye: 1, gazeX: -0.5 });
      officeDesk(c, 1180, 872, 0.98, 0.7, 1);
      mug(c, t, 1360, 852, 0.9, 1);
      plant(c, t, 980, 852, 0.7);
      // kontrol listesi (masa üstü)
      c.save(); c.translate(1260, 800); c.rotate(-0.05);
      c.fillStyle = C.paper; c.fillRect(-46, -40, 92, 54);
      for (let i = 0; i < 3; i++) {
        c.fillStyle = "rgba(26,29,36,0.35)"; c.fillRect(-20, -30 + i * 16, 54, 4);
        const ck = ease.out(prog(l, 4.76 + i * 0.32, 5.0 + i * 0.32));
        if (ck > 0) { c.strokeStyle = "#2F6B3A"; c.lineWidth = 3; c.beginPath(); c.moveTo(-38, -28 + i * 16); c.lineTo(-34, -24 + i * 16); c.lineTo(-34 + 8 * ck, -33 + i * 16); c.stroke(); }
      }
      c.restore();
    });
    c.restore();
  });
  // ön plan: aynı çöp kutusu ve priz — bu kez sakin, düzenli
  dof(c, rack * 6 + wIn * 16, () => {
    c.save(); cam(c, t, lerp(1.06, 1.16, k), wIn * 2400 + lerp(80, -80, k), 0, 0.5, 960, 900);
    lightPool(c, 560, 1000, 360, "rgba(255,215,150,", 0.12);
    powerStrip(c, 620, 1010, 1.3, tidy, t, 0);
    wasteBin(c, 300, 1030, 1.15, 0);
    c.restore();
  });
  c.restore();
  layer(c, ease.out(prog(l, 4.9, 5.6)) * (1 - prog(l, 7.0, 7.5)), () => { boardLabel(c, 160, 140, "火事 ・ 0件", 1); });
  layer(c, win(l, 5.9, 7.4, 0.4), () => { c.font = font(600, 120, true); c.fillStyle = "rgba(200,206,215,0.75)"; c.textAlign = "center"; c.fillText("？", 1180, 420 + Math.sin(l * 3) * 6); });
}

// ================= C: 論文 — belgesel masa (üstten) =================
function deskTop(c: Ctx, t: number) {
  const g = c.createLinearGradient(0, -400, 0, H + 400);
  g.addColorStop(0, "#4A3220"); g.addColorStop(1, "#2E1E12");
  c.fillStyle = g; c.fillRect(-600, -500, W + 1200, H + 1000);
  c.strokeStyle = "rgba(20,10,4,0.35)"; c.lineWidth = 2;
  for (let i = 0; i < 46; i++) { const y = -500 + i * 46 + rnd(i, 2) * 20; c.beginPath(); c.moveTo(-600, y); c.bezierCurveTo(300, y + 14 * Math.sin(i), 1300, y - 12, W + 600, y + 6); c.stroke(); }
  // dağınık kağıtlar + kahve halkası + kalem + gözlük
  [[-120, 120, 0.3], [1700, 160, -0.25], [1820, 820, 0.18], [-60, 860, -0.4], [380, -120, 0.1]].forEach(([x, y, r], i) => {
    c.save(); c.translate(x, y); c.rotate(r); c.fillStyle = "rgba(0,0,0,0.35)"; c.fillRect(-196, -246, 400, 520); c.fillStyle = i % 2 ? "#CFC9BA" : "#DAD4C5"; c.fillRect(-200, -260, 400, 520);
    c.fillStyle = "rgba(26,29,36,0.22)"; for (let k = 0; k < 16; k++) c.fillRect(-160, -200 + k * 26, 260 + rnd(k, i) * 60, 6); c.restore();
  });
  c.strokeStyle = "rgba(70,40,20,0.5)"; c.lineWidth = 7; c.beginPath(); c.arc(1540, 900, 70, 0.4, 5.6); c.stroke();
  c.save(); c.translate(1580, 420); c.rotate(-0.6);
  c.fillStyle = "#1A1C20"; rr(c, -8, -180, 16, 300, 6); c.fill(); c.fillStyle = "#C9A54A"; c.fillRect(-8, -180, 16, 30); c.fillStyle = "#D8DCE2"; c.beginPath(); c.moveTo(-8, 120); c.lineTo(0, 150); c.lineTo(8, 120); c.fill();
  c.restore();
  c.save(); c.translate(260, 520); c.rotate(0.3); c.strokeStyle = "#141518"; c.lineWidth = 6;
  c.beginPath(); c.ellipse(-60, 0, 52, 40, 0, 0, Math.PI * 2); c.stroke(); c.beginPath(); c.ellipse(60, 0, 52, 40, 0, 0, Math.PI * 2); c.stroke();
  c.beginPath(); c.moveTo(-8, -6); c.quadraticCurveTo(0, -16, 8, -6); c.stroke();
  c.fillStyle = "rgba(200,220,240,0.12)"; c.beginPath(); c.ellipse(-60, 0, 48, 36, 0, 0, Math.PI * 2); c.ellipse(60, 0, 48, 36, 0, 0, Math.PI * 2); c.fill();
  c.restore();
  void t;
}
function sceneJournal(c: Ctx, t: number) {
  const l = t - P6.at;
  const k = ease.inOut(prog(l, 7.0, 16.5));
  const push2 = ease.inOut(prog(l, 16.4, 20.6));
  c.save();
  c.translate(W / 2, H / 2); c.rotate(lerp(-0.07, 0.015, k) + 0.01 * push2); c.translate(-W / 2, -H / 2);
  cam(c, t, lerp(0.82, 1.0, k) + 0.12 * push2, lerp(120, 0, k), lerp(80, -10, k) + 40 * push2, 0.35, 960, 470);
  deskTop(c, t);
  // lamba ışığı
  lightPool(c, 820, 360, 900, "rgba(255,220,160,", 0.18);
  // dergi sayfası
  c.save(); c.translate(960, 470); c.rotate(-0.025);
  c.fillStyle = "rgba(0,0,0,0.45)"; c.fillRect(-470, -380, 960, 800);
  const pg = c.createLinearGradient(-480, 0, 480, 0); pg.addColorStop(0, "#E7E1D2"); pg.addColorStop(1, "#D6CFBE");
  c.fillStyle = pg; c.fillRect(-480, -400, 960, 800);
  c.fillStyle = "#8A3A30"; c.fillRect(-480, -400, 960, 10);
  c.fillStyle = "rgba(26,29,36,0.6)"; c.font = font(500, 18); c.textAlign = "left";
  c.fillText("CALIFORNIA MANAGEMENT REVIEW   VOL. 43, NO. 4   SUMMER 2001", -420, -350);
  c.fillStyle = "#1A1D24"; c.font = "700 46px \"Noto Serif CJK JP\", serif";
  c.fillText("Nobody Ever Gets Credit for", -420, -270);
  c.fillText("Fixing Problems that Never Happened", -420, -214);
  c.font = "400 26px \"Noto Serif CJK JP\", serif"; c.fillStyle = "rgba(26,29,36,0.8)";
  c.fillText("Creating and Sustaining Process Improvement", -420, -168);
  c.font = font(600, 22); c.fillText("Nelson P. Repenning  ·  John D. Sterman", -420, -120);
  c.fillStyle = "rgba(26,29,36,0.2)"; c.fillRect(-420, -96, 840, 2);
  for (let col = 0; col < 2; col++) for (let i = 0; i < 18; i++) c.fillRect(-420 + col * 440, -70 + i * 24, 400 - (i % 5 === 4 ? 120 : rnd(i, col) * 30), 7);
  c.restore();
  // JP çeviri şeridi (yapışkan not) — konuşmayla senkron
  const note = ease.out(prog(l, 12.2, 12.8));
  layer(c, note, () => {
    c.save(); c.translate(960, 600 + (1 - note) * 40); c.rotate(0.012);
    c.fillStyle = "rgba(0,0,0,0.4)"; c.fillRect(-596, -96, 1200, 200);
    c.fillStyle = "#EFE8D4"; c.fillRect(-600, -100, 1200, 200);
    c.fillStyle = "rgba(242,207,58,0.85)"; c.fillRect(-600, -100, 1200, 8);
    const segs = [["「起きなかった問題を", 12.38], ["解決しても、", 13.52], ["誰の手柄にもならない」", 14.9]] as const;
    c.font = font(700, 50, true); c.textAlign = "left";
    const line1 = segs[0][0] + segs[1][0], w1 = c.measureText(line1).width, w2 = c.measureText(segs[2][0]).width;
    // ışıklı kalem (fosforlu) süpürmesi
    const hl = (x: number, y: number, w: number, s: number, e: number) => { const kk = ease.inOut(prog(l, s, e)); c.fillStyle = "rgba(242,207,58,0.55)"; c.fillRect(x, y - 40, w * kk, 54); };
    hl(-w2 / 2, 66, w2, 15.0, 16.2);
    let x = -w1 / 2;
    [segs[0], segs[1]].forEach(([s, ts]) => { const kk = ease.out(prog(l, ts, ts + 0.4)); c.fillStyle = `rgba(26,29,36,${kk})`; c.fillText(s, x, -14 + (1 - kk) * 8); x += c.measureText(s).width; });
    const kk = ease.out(prog(l, segs[2][1], segs[2][1] + 0.4)); c.fillStyle = `rgba(26,29,36,${kk})`; c.fillText(segs[2][0], -w2 / 2, 62 + (1 - kk) * 8);
    c.restore();
  });
  // 手柄 = 0 : kart arası (konuşmasız) — "誰の" damgası
  c.restore();
  stamp(c, 1490, 820, "手柄 ０", prog(l, 16.8, 17.5), "#B8352A", -0.14, 58);
  boardLabel(c, 160, 140, "組織研究の論文", win(l, 7.6, 12.0, 0.5));
  dust(c, t, 40, 0.25, 31);
}

// ================= D: 構造 — iki diyagram (belgesel pano) =================
function axes(c: Ctx, x: number, y: number, w: number, h: number, k: number, ylab: string) {
  c.strokeStyle = `rgba(200,206,215,${0.7 * k})`; c.lineWidth = 2;
  c.beginPath(); c.moveTo(x, y); c.lineTo(x, y + h * k); c.moveTo(x, y + h); c.lineTo(x + w * k, y + h); c.stroke();
  c.fillStyle = `rgba(200,206,215,${0.5 * k})`; for (let i = 1; i < 8; i++) c.fillRect(x + (w / 8) * i, y + h, 2, 8);
  c.font = font(500, 22); c.fillStyle = `rgba(140,151,168,${k})`; c.textAlign = "left"; c.fillText(ylab, x + 12, y + 8);
  c.textAlign = "right"; c.fillText("時間 →", x + w, y + h + 40);
}
function sceneChart(c: Ctx, t: number) {
  const l = t - P7.at;
  const pull = ease.inOut(prog(l, 17.6, 19.0));
  c.save();
  cam(c, t, lerp(1.08, 1.0, ease.out(prog(l, 3.4, 8))) - 0.06 * pull, lerp(240, 0, ease.inOut(prog(l, 8.6, 10.2))), 0, 0.3);
  c.fillStyle = C.bg; c.fillRect(-400, -400, W + 800, H + 800);
  boardGrid(c, 0.8);
  const PX = [180, 1010], PY = 230, PW = 730, PH = 470;
  // --- sol: 消火
  const kL = ease.out(prog(l, 3.8, 4.6));
  const praise = ease.out(prog(l, 19.1, 19.8));
  c.save();
  layer(c, kL, () => {
    c.fillStyle = "rgba(20,26,36,0.7)"; rr(c, PX[0] - 40, PY - 110, PW + 80, PH + 190, 14); c.fill();
    c.strokeStyle = `rgba(242,207,58,${0.15 + 0.55 * praise})`; c.lineWidth = 2; c.stroke();
    c.font = font(700, 44, true); c.fillStyle = C.text; c.textAlign = "left"; c.fillText("消火", PX[0], PY - 42);
    flame(c, t, PX[0] + 150, PY - 40, 36, 52, 0.9, 1);
    axes(c, PX[0], PY, PW, PH, kL, "見える成果");
    // eğri: düz → 消す anında sıçrar
    const draw = prog(l, 4.2, 7.2);
    const spikeT = 0.42;
    const yAt = (u: number) => PY + PH - 20 - (u < spikeT ? 0 : (PH - 120) * ease.out(clamp((u - spikeT) / 0.06)));
    c.save(); c.shadowColor = "rgba(242,207,58,0.8)"; c.shadowBlur = 18;
    c.strokeStyle = C.yellow; c.lineWidth = 6; c.lineJoin = "round"; c.beginPath();
    for (let i = 0; i <= 120 * draw; i++) { const u = i / 120; const px = PX[0] + u * PW, py = yAt(u); i ? c.lineTo(px, py) : c.moveTo(px, py); }
    c.stroke(); c.restore();
    const hit = ease.out(prog(l, 4.76, 5.3));
    if (draw > spikeT) {
      const sx = PX[0] + spikeT * PW;
      flame(c, t, sx, PY + PH - 20, 50, 90, 1 - prog(l, 4.8, 5.6), 4);
      layer(c, hit, () => { c.font = font(600, 30); c.fillStyle = C.yellow; c.textAlign = "left"; c.fillText("火を消した！", sx + 20, PY + 50); });
    }
    layer(c, ease.out(prog(l, 6.06, 6.6)), () => { boardLabel(c, PX[0] + 440, PY + PH - 160, "すぐに見える", 1, C.yellow); });
    stamp(c, PX[0] + 540, PY + 300, "評価 ✓", prog(l, 7.44, 8.0), C.yellow, -0.1, 50);
  });
  c.restore();
  // --- sağ: 予防
  const kR = ease.out(prog(l, 9.24, 10.0));
  const later = ease.inOut(prog(l, 20.4, 21.6));
  c.save();
  c.translate(PX[1] + PW / 2, PY + PH / 2); c.rotate(0.06 * later); c.scale(1 - 0.12 * later, 1 - 0.12 * later); c.translate(-(PX[1] + PW / 2), -(PY + PH / 2) - 150 * later);
  layer(c, kR * (1 - 0.45 * later), () => {
    c.fillStyle = "rgba(20,26,36,0.7)"; rr(c, PX[1] - 40, PY - 110, PW + 80, PH + 190, 14); c.fill();
    c.strokeStyle = "rgba(140,151,168,0.35)"; c.lineWidth = 2; c.stroke();
    c.font = font(700, 44, true); c.fillStyle = C.text; c.textAlign = "left"; c.fillText("予防", PX[1], PY - 42);
    // kalkan ikonu
    c.save(); c.translate(PX[1] + 150, PY - 58); c.fillStyle = "#5A6B7E"; c.beginPath(); c.moveTo(0, -24); c.lineTo(20, -16); c.lineTo(18, 8); c.quadraticCurveTo(10, 22, 0, 28); c.quadraticCurveTo(-10, 22, -18, 8); c.lineTo(-20, -16); c.closePath(); c.fill(); c.restore();
    axes(c, PX[1], PY, PW, PH, kR, "見える成果");
    // olmayan yangınlar (hayalet): kesikli zirveler, belirip söner
    const ghosts = [0.18, 0.37, 0.58, 0.79];
    ghosts.forEach((u, i) => {
      const a = ease.out(prog(l, 10.84 + i * 0.25, 11.3 + i * 0.25)) * (1 - ease.inOut(prog(l, 12.14 + i * 0.3, 12.9 + i * 0.3)));
      if (a <= 0) return;
      const x = PX[1] + u * PW, y0 = PY + PH - 20;
      c.save(); c.globalAlpha *= a; c.setLineDash([8, 8]); c.strokeStyle = "rgba(226,96,58,0.75)"; c.lineWidth = 3;
      c.beginPath(); c.moveTo(x - 50, y0); c.lineTo(x, y0 - 260); c.lineTo(x + 50, y0); c.stroke(); c.setLineDash([]);
      flame(c, t, x, y0 - 4, 30, 60, 0.7, 10 + i);
      // söndürülmüş çarpı
      const xk = ease.out(prog(l, 12.14 + i * 0.3, 12.5 + i * 0.3));
      c.strokeStyle = "rgba(200,206,215,0.9)"; c.lineWidth = 4; c.beginPath(); c.moveTo(x - 24, y0 - 160); c.lineTo(x - 24 + 48 * xk, y0 - 160 + 48 * xk); c.stroke();
      c.restore();
    });
    const draw = prog(l, 9.6, 13.4);
    c.strokeStyle = "rgba(200,206,215,0.85)"; c.lineWidth = 6; c.beginPath(); c.moveTo(PX[1], PY + PH - 20); c.lineTo(PX[1] + PW * draw, PY + PH - 20); c.stroke();
    layer(c, ease.out(prog(l, 14.52, 15.3)), () => {
      c.font = font(700, 48, true); c.fillStyle = C.text; c.textAlign = "center"; c.fillText("「何も起きない」", PX[1] + PW / 2, PY + PH - 70);
      c.font = font(500, 24); c.fillStyle = C.mist; c.fillText("＝ 成果", PX[1] + PW / 2, PY + PH - 30 + 60);
    });
  });
  c.restore();
  // 組織: madalya → 消火 / 後回し → 予防
  const md = ease.out(prog(l, 19.1, 19.9));
  if (md > 0) { medal(c, PX[0] + PW - 60, lerp(-120, PY + 40, ease.back(prog(l, 19.1, 19.8))), 1.25, 0.5 + 0.5 * Math.sin(t * 3)); }
  stamp(c, PX[1] + PW / 2 + 10, PY + 120 + 150 * later * 0.6, "後回し", prog(l, 20.74, 21.3), "#B8352A", 0.1, 58);
  layer(c, ease.out(prog(l, 17.86, 18.5)) * (1 - pull * 0), () => boardLabel(c, W / 2 - 60, 120, "組織は…", 1));
  c.restore();
}

// ================= E: 職場の予防 — mantar pano, iz kalmayan işler =================
const TASKS = [
  { s: 26.46, txt: "基準を整える", icon: 0 },
  { s: 29.0, txt: "早めに問題を拾う", icon: 1 },
  { s: 31.2, txt: "他部署とのズレを潰す", icon: 2 },
];
function taskIcon(c: Ctx, t: number, kind: number, l: number, s: number) {
  const k = ease.inOut(prog(l, s + 0.4, s + 1.6));
  c.save();
  if (kind === 0) {
    // hizalanan çubuklar + cetvel
    for (let i = 0; i < 4; i++) { const off = (rnd(i, 3) - 0.5) * 60 * (1 - k); c.fillStyle = ["#2F4A6B", "#5A6B4A", "#8A3A30", "#3D4A5A"][i]; rr(c, -80 + off, -50 + i * 22, 140, 14, 4); c.fill(); }
    c.fillStyle = "#C9A54A"; c.fillRect(64, -60, 10, 110); for (let i = 0; i < 8; i++) c.fillRect(74, -56 + i * 13, 6, 2);
  } else if (kind === 1) {
    // çatlak + büyüteç; çatlak dikilir
    c.strokeStyle = "#5B6678"; c.lineWidth = 4; c.beginPath(); c.moveTo(-70, 30); c.lineTo(-30, 10); c.lineTo(-10, 34); c.lineTo(30, 4); c.lineTo(60, 20); c.stroke();
    c.strokeStyle = `rgba(242,207,58,${k})`; c.lineWidth = 3; for (let i = 0; i < 5; i++) { const x = -60 + i * 28; c.beginPath(); c.moveTo(x, 4); c.lineTo(x + 10, 40); c.stroke(); }
    const mx = lerp(60, -10, k), my = -20;
    c.strokeStyle = "#2A2D33"; c.lineWidth = 8; c.beginPath(); c.arc(mx, my, 34, 0, Math.PI * 2); c.stroke();
    c.fillStyle = "rgba(180,210,240,0.25)"; c.fill();
    c.lineWidth = 12; c.beginPath(); c.moveTo(mx + 24, my + 24); c.lineTo(mx + 56, my + 56); c.stroke();
  } else {
    // iki dişli: kaçık → kenetlenir
    const gear = (x: number, y: number, r: number, a: number, col: string) => {
      c.save(); c.translate(x, y); c.rotate(a); c.fillStyle = col; c.beginPath();
      for (let i = 0; i < 20; i++) { const rr2 = i % 2 ? r : r + 10; const an = i * Math.PI / 10; c.lineTo(Math.cos(an) * rr2, Math.sin(an) * rr2); }
      c.closePath(); c.fill(); c.fillStyle = "#E9E3D2"; c.beginPath(); c.arc(0, 0, r * 0.35, 0, Math.PI * 2); c.fill(); c.restore();
    };
    const off = lerp(28, 0, k);
    gear(-38, -off, 36, t * 0.9 * k, "#5A6B7E");
    gear(36, off, 36, -t * 0.9 * k + 0.16, "#8A3A30");
  }
  c.restore();
}
function sceneTasks(c: Ctx, t: number) {
  const l = t - P7.at;
  const k = ease.inOut(prog(l, 23.0, 38.8));
  const fade = ease.inOut(prog(l, 34.4, 37.6));
  c.save();
  cam(c, t, lerp(1.12, 1.02, k), lerp(-120, 120, k), lerp(-20, 10, k), 0.6, 960, 500);
  envNightRoom(c, t, 6);
  // mantar pano
  c.save(); c.translate(960, 480);
  c.fillStyle = "rgba(0,0,0,0.5)"; c.fillRect(-690, -330, 1400, 680);
  c.fillStyle = "#3A2A1C"; c.fillRect(-710, -350, 1420, 700);
  const cg = c.createLinearGradient(0, -330, 0, 330); cg.addColorStop(0, "#9A7450"); cg.addColorStop(1, "#7A5A3C");
  c.fillStyle = cg; c.fillRect(-690, -330, 1380, 660);
  for (let i = 0; i < 900; i++) { c.fillStyle = rnd(i, 7) > 0.5 ? "rgba(60,40,20,0.35)" : "rgba(200,170,120,0.25)"; c.fillRect(-690 + rnd(i, 8) * 1380, -330 + rnd(i, 9) * 660, 3, 3); }
  // eski izler (çıkarılmış notların bıraktığı soluk dikdörtgenler)
  c.fillStyle = "rgba(255,240,210,0.05)"; c.fillRect(-620, -280, 160, 120); c.fillRect(460, 120, 170, 130);
  c.restore();
  lightPool(c, 960, 420, 760, "rgba(255,215,150,", 0.2);
  TASKS.forEach((tk, i) => {
    const a = ease.out(prog(l, tk.s - 0.1, tk.s + 0.45));
    if (a <= 0) return;
    const x = 960 + (i - 1) * 430, y = 470 + (i === 1 ? -30 : 20);
    const drop = (1 - ease.back(prog(l, tk.s - 0.1, tk.s + 0.5))) * -120;
    const vanish = ease.inOut(prog(l, 34.4 + i * 0.6, 36.4 + i * 0.6));
    c.save(); c.translate(x, y + drop); c.rotate((i - 1) * 0.05 + Math.sin(t * 0.7 + i) * 0.006);
    // gölge + kart
    c.globalAlpha *= a * (1 - vanish);
    c.fillStyle = "rgba(0,0,0,0.4)"; c.fillRect(-176, -146, 360, 310);
    c.fillStyle = "#EFE8D4"; c.fillRect(-180, -150, 360, 310);
    c.fillStyle = "rgba(0,0,0,0.08)"; c.beginPath(); c.moveTo(150, 160); c.lineTo(180, 130); c.lineTo(180, 160); c.fill();
    c.font = font(700, 36, true); c.fillStyle = C.ink; c.textAlign = "center"; c.fillText(tk.txt, 0, -88);
    c.fillStyle = "rgba(26,29,36,0.15)"; c.fillRect(-140, -66, 280, 2);
    c.translate(0, 50); taskIcon(c, t, tk.icon, l, tk.s); c.translate(0, -50);
    c.restore();
    // raptiye (en son o da söner)
    c.save(); c.translate(x, y + drop - 140); c.globalAlpha *= a * (1 - 0.8 * ease.inOut(prog(l, 36.6, 38.2)));
    c.fillStyle = "rgba(0,0,0,0.4)"; c.beginPath(); c.ellipse(6, 8, 14, 6, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = ["#C4281E", "#2F6B3A", "#2F4A6B"][i]; c.beginPath(); c.arc(0, 0, 14, 0, Math.PI * 2); c.fill();
    c.fillStyle = "rgba(255,255,255,0.5)"; c.beginPath(); c.arc(-4, -4, 4, 0, Math.PI * 2); c.fill();
    c.restore();
    // silinme: kağıt tozları yükselir
    if (vanish > 0 && vanish < 1) for (let p = 0; p < 26; p++) {
      const ph = clamp(vanish * 1.3 - rnd(p, i) * 0.3);
      c.fillStyle = `rgba(239,232,212,${0.6 * Math.sin(Math.PI * ph)})`;
      c.fillRect(x - 170 + rnd(p, i + 4) * 340, y - 140 + rnd(p, i + 5) * 300 - ph * 160, 4, 4);
    }
  });
  c.restore();
  layer(c, win(l, 23.6, 26.2, 0.4), () => boardLabel(c, 160, 140, "職場に置き換えると", 1));
  layer(c, ease.out(prog(l, 36.4, 37.2)) * (1 - prog(l, 38.2, 38.8)), () => { c.font = font(600, 44, true); c.fillStyle = "rgba(200,206,215,0.85)"; c.textAlign = "center"; c.fillText("跡が、消えていく", W / 2, 180); });
  dust(c, t, 40, 0.3, 37);
}

// ================= F: ★ 方針を受け止める上司 — şemsiye =================
const RAIN = burstRate([43.1, 44.3, 45.5, 46.4, 47.3, 54.0, 59.0], 0.12, 1.5);
function sceneUmbrella(c: Ctx, t: number) {
  const l = t - P7.at;
  const reveal = ease.inOut(prog(l, 38.6, 41.0));
  const open = ease.back(prog(l, 41.6, 42.4));
  const down = ease.inOut(prog(l, 48.6, 51.8));
  c.save();
  cam(c, t, lerp(1.22, 1.0, ease.inOut(prog(l, 38.4, 44.0))) + 0.08 * down, lerp(0, -40, down), lerp(220, 0, ease.inOut(prog(l, 38.4, 44.0))) - 120 * down, 0.7 + 0.5 * win(l, 42.6, 48.4, 1), 980, 420);
  envOffice(c, t, 6, -l * 3);
  lightCone(c, UMB.ux, -100, Math.PI / 2, 0.32, 1000, 0.12 * reveal);
  umbrellaShot(c, t, l - 41.0, { rate: (s) => (s + 41.0 < 42.2 ? 0 : RAIN(s + 41.0) * (1 - 0.8 * down)), open: lerp(0.15, 1, open), bossAlpha: lerp(0.25, 1, reveal), bossArm: lerp(0.4, 1, open), calm: 1, seed: 3 });
  c.restore();
  // HUD
  layer(c, win(l, 42.2, 48.4, 0.5), () => {
    c.save(); c.translate(W / 2, 70); c.font = font(600, 30); c.fillStyle = C.mist; c.textAlign = "center"; c.fillText("上層部 ▼ 方針変更", 0, 0); c.restore();
  });
  nameTag(c, 980, 620 - 120 * 0, "上司", ease.out(prog(l, 47.3, 47.9)) * (1 - prog(l, 52.6, 53.2)));
  layer(c, ease.out(prog(l, 50.4, 51.2)) * (1 - prog(l, 53.0, 53.5)), () => boardLabel(c, 160, 140, "現場：目の前の仕事に集中", 1));
}

// ================= G: 上層部からの眺め — iki ekran =================
function pane(c: Ctx, t: number, x: number, y: number, w: number, h: number, fn: () => void, tint: number) {
  c.save();
  c.fillStyle = "#0A0D12"; rr(c, x - 14, y - 14, w + 28, h + 28, 10); c.fill();
  c.beginPath(); c.rect(x, y, w, h); c.clip();
  c.translate(x, y); c.scale(w / W, h / H);
  c.fillStyle = "#151A22"; c.fillRect(0, 0, W, H);
  fn();
  c.restore();
  if (tint > 0) { c.save(); c.globalCompositeOperation = "saturation"; c.fillStyle = `rgba(128,128,128,${tint})`; c.fillRect(x, y, w, h); c.restore(); c.fillStyle = `rgba(10,13,18,${0.35 * tint})`; c.fillRect(x, y, w, h); }
  // cam yansıması
  const g = c.createLinearGradient(x, y, x + w, y + h); g.addColorStop(0, "rgba(255,255,255,0.06)"); g.addColorStop(0.5, "rgba(255,255,255,0)"); g.addColorStop(1, "rgba(255,255,255,0.03)");
  c.fillStyle = g; c.fillRect(x, y, w, h);
}
function sceneAbove(c: Ctx, t: number) {
  const l = t - P7.at;
  const k = ease.inOut(prog(l, 53.4, 62.4));
  const fastHot = ease.out(prog(l, 58.34, 59.2));
  const dim = ease.inOut(prog(l, 60.0, 61.2));
  c.save();
  cam(c, t, lerp(1.0, 1.08, k), lerp(-40, 40, k), 0, 0.5, 960, 480);
  // yönetim katı: koyu cam duvar, ahşap kaplama
  const wg = c.createLinearGradient(0, 0, 0, H); wg.addColorStop(0, "#161B23"); wg.addColorStop(1, "#0D1016");
  c.fillStyle = wg; c.fillRect(-300, -300, W + 600, H + 600);
  for (let i = 0; i < 9; i++) { c.fillStyle = "#1E1812"; c.fillRect(-300 + i * 300, -300, 18, H + 600); }
  const RATE2 = burstRate([0.5, 2.0, 3.5, 5.0, 6.5, 8.0], 0.25, 1.2);
  pane(c, t, 170, 170, 760, 428, () => {
    umbrellaShot(c, t, l - 53.4, { rate: RATE2, lift: 1, bossOutfit: 1, bossTie: false, bossArm: 0.6 + 0.3 * Math.sin(t * 6), calm: 0.25, seed: 9, n: 120 });
  }, 0);
  pane(c, t, 990, 170, 760, 428, () => {
    umbrellaShot(c, t, l - 53.4, { rate: RATE2, lift: 0, calm: 1, seed: 9, n: 120 });
  }, dim * 0.8);
  // etiketler
  layer(c, ease.out(prog(l, 55.2, 55.9)), () => {
    stamp(c, 1370, 650, "反応が遅い…？", 1, "rgba(160,170,185,0.95)", -0.04, 40);
    c.save(); c.translate(1650, 230); wallClock(c, 0, 0, 34, 2 + l * 0.6); c.restore();
  });
  layer(c, fastHot, () => {
    stamp(c, 550, 650, "すぐ動く ✓", 1, C.yellow, 0.04, 40);
    c.strokeStyle = `rgba(242,207,58,${0.7 * fastHot})`; c.lineWidth = 4; rr(c, 156, 156, 788, 456, 12); c.stroke();
  });
  layer(c, ease.out(prog(l, 60.02, 60.8)), () => { c.font = font(700, 54, true); c.fillStyle = C.yellow; c.textAlign = "center"; c.fillText("「頼もしい」", 550, 140); });
  c.restore();
  // ön plan: yöneticiler (sırtı dönük, DOF)
  dof(c, 6, () => {
    drawPerson(c, 520, 1380, 1.9, { outfit: 4, tie: true, rim: 0.5, rimSide: 1, shade: 0.55, facing: 0.3 });
    drawPerson(c, 1500, 1400, 2.0, { outfit: 5, tie: true, rim: 0.5, rimSide: -1, shade: 0.6, facing: -0.2 });
  });
  layer(c, win(l, 53.8, 58.0, 0.5), () => boardLabel(c, 160, 90, "上層部から見ると", 1));
}

// ================= H: 「何も起きないこと」 — şemsiyeye dönüş =================
function sceneReturn(c: Ctx, t: number) {
  const l = t - P7.at;
  const k = ease.inOut(prog(l, 62.2, 72.0));
  const push = ease.inOut(prog(l, 68.2, 72.6));
  const glow = ease.out(prog(l, 68.44, 69.6));
  c.save();
  cam(c, t, lerp(1.0, 1.1, k) + 0.28 * push, lerp(0, -40, push), lerp(-60, 0, k) + 150 * push, 0.5, 980, 420);
  envOffice(c, t, 6, -l * 2);
  umbrellaShot(c, t, l - 41.0, { rate: (s) => 0.16 + 0.5 * win(s + 41.0, 63.5, 66.0, 0.6), calm: 1, seed: 3, glow: 0.6 * glow });
  c.restore();
  layer(c, ease.out(prog(l, 65.0, 65.8)) * (1 - prog(l, 69.0, 69.6)), () => {
    c.font = font(700, 56, true); c.fillStyle = "rgba(232,234,238,0.92)"; c.textAlign = "center"; c.fillText("「何も起きない」", W / 2, 560);
    c.font = font(500, 26); c.fillStyle = C.mist; c.fillText("── それが、この上司の成果", W / 2, 610);
  });
  dust(c, t, 40, 0.3, 41);
}

// ================= ÇİZİM =================
const SCENES: [number, number, (c: Ctx, t: number) => void, Lens][] = [
  [2.6, g6(3.5), sceneFire, LENS_FIRE],
  [g6(3.25), g6(7.8), scenePrevent, LENS.night],
  [g6(7.2), g7(4.2), sceneJournal, LENS.doc],
  [g7(3.6), g7(23.4), sceneChart, LENS.doc],
  [g7(22.8), g7(39.0), sceneTasks, LENS.night],
  [g7(38.4), g7(53.8), sceneUmbrella, LENS.night],
  [g7(53.2), g7(62.6), sceneAbove, LENS.night],
  [g7(62.0), END, sceneReturn, LENS.night],
];

function draw(ctx: Ctx, t: number) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
  ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H);
  const active = SCENES.filter(([a, b]) => t >= a && t <= b);
  const L = active.length ? active[active.length - 1][3] : LENS.night;
  if (t >= 2.6) {
    lens(ctx, t, L, (c) => {
      for (const [a, , fn] of active) layer(c, a <= 2.6 ? 1 : (fn === scenePrevent ? 1 : ease.sine(prog(t, a, a + 0.6))), () => fn(c, t));
    });
  }
  // whip-pan ışık izleri
  const wk = Math.sin(Math.PI * prog(t, g6(3.0), g6(3.85)));
  whipStreaks(ctx, wk, -1, 5);
  // maskot: araştırmaya geçişte büyüteçle
  const mk = win(t, g6(7.6), g6(12.0), 0.7);
  if (mk > 0) drawMascot(ctx, lerp(2150, 1720, ease.out(mk)), 1110, 0.62, { mouth: speaking(parts, t), armR: 0.9, prop: "magnifier", lookX: -0.8, lookY: 0.2, rim: 1, tilt: Math.sin(t * 1.1) * 0.012 });
  sectionTitle(ctx, t, 0.0, 3.4, "03", "防がれた火事");
  sourceCard(ctx, t, 19.9, g7(9.0), "Repenning & Sterman (2001)");
  drawSubtitles(ctx, parts, t);
  fadeBlack(ctx, 1 - prog(t, 0, 0.5));
  fadeBlack(ctx, prog(t, END - 1.5, END - 0.2));
}

// ================= SES EFEKTLERİ =================
const cues: Cue[] = [];
const cue = (t: number, type: string, gain = 1, p: Record<string, number> = {}) => cues.push({ t, type, gain, p });

cue(0.0, "room", 0.5, { d: END });
cue(0.35, "whoosh", 0.6, { d: 1.2 });
cue(2.2, "alarm", 0.55, { d: g6(1.9) - 2.2 });
cue(2.4, "crackle", 0.7, { d: g6(1.6) - 2.4 });
for (let s = -0.6; s < 0.45; s += 0.24) cue(g6(s), "step", 0.45);
cue(g6(0.42), "spray", 0.7, { d: 1.2 });
cue(g6(1.56), "hit", 0.55);
cue(g6(1.6), "clap", 0.6, { d: 1.8 });
[1.72, 2.05, 2.38, 2.6, 2.95, 3.2].forEach((s) => cue(g6(s), "shutter", 0.35));
cue(g6(3.0), "whoosh", 0.75, { d: 0.9 });
for (let i = 0; i < 3; i++) cue(g6(4.76 + i * 0.32), "pen", 0.25, { d: 0.2 });
cue(g6(5.9), "tick", 0.25, { f: 900 });
cue(g6(7.2), "whoosh", 0.4, { d: 1.2 });
cue(g6(7.4), "paper", 0.5);
cue(g6(12.2), "paper", 0.45);
cue(g6(15.0), "pen", 0.45, { d: 1.1 });
cue(g6(16.8), "thump", 0.8);
cue(g7(3.6), "whoosh", 0.4, { d: 1.0 });
cue(g7(4.76), "hit", 0.45);
cue(g7(6.06), "shimmer", 0.35, { f: 523 });
cue(g7(7.44), "thump", 0.75);
cue(g7(9.24), "swish", 0.35);
for (let i = 0; i < 4; i++) cue(g7(12.14 + i * 0.3), "tick", 0.3, { f: 1300 });
cue(g7(14.52), "shimmer", 0.25, { f: 392 });
cue(g7(19.1), "shimmer", 0.45, { f: 659 });
cue(g7(19.3), "thunk", 0.4);
cue(g7(20.74), "thump", 0.75);
cue(g7(22.8), "whoosh", 0.4, { d: 1.2 });
TASKS.forEach((tk) => { cue(g7(tk.s), "paper", 0.45); cue(g7(tk.s + 0.35), "click", 0.45); });
for (let i = 0; i < 3; i++) cue(g7(34.4 + i * 0.6), "fall", 0.25);
cue(g7(38.4), "whoosh", 0.4, { d: 1.4 });
cue(g7(38.8), "riser", 0.3, { d: 2.4 });
cue(g7(41.6), "umbrella", 0.7);
// ok darbeleri: kompozisyonla aynı yoğunluk eğrisi
for (let s = 42.3; s < 52; s += 0.13) { const r = RAIN(s); if (rnd(Math.round(s * 100), 77) < r * 0.9) cue(g7(s + 0.25), "thunk", 0.12 + 0.2 * r); }
cue(g7(49.1), "shimmer", 0.3, { f: 440 });
cue(g7(53.2), "whoosh", 0.4, { d: 1.2 });
cue(g7(55.3), "fall", 0.35);
cue(g7(58.34), "blip", 0.4, { f: 880 });
cue(g7(60.02), "shimmer", 0.4, { f: 587 });
cue(g7(62.0), "whoosh", 0.35, { d: 1.2 });
cue(g7(65.0), "shimmer", 0.3, { f: 392 });
cue(g7(68.44), "riser", 0.3, { d: 2.0 });
cue(g7(70.66), "shimmer", 0.35, { f: 523 });
cue(END - 1.6, "whoosh", 0.35, { d: 1.4 });

export const s03: Section = { id: "s03", duration: END, parts, cues, draw };
void policyArrow;
