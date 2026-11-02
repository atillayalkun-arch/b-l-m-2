// s02 思い出されるのは誰か — ses 4, 5  (s01 v2 yapısı: SCENES + lens + cues)
import { Section, Part, Cue, W, H, clamp, ease, prog, win, lerp, rnd, speaking } from "../engine/core";
import { C, font, lightPool, lightCone, fadeBlack, rr, dust, boardGrid } from "../design/style";
import { lens, LENS, cam, dof, bokeh, Lens } from "../design/grade";
import { envOffice, officeDesk, envNightRoom, envLab } from "../design/env";
import { drawMascot } from "../characters/mascot";
import { drawPerson } from "../characters/people";
import { sectionTitle, screenCard, sourceCard, boardLabel, thoughtExperiment, memoryCard } from "../components/cards";
import { drawSubtitles } from "../components/subtitle";
import t4 from "../timing/4.json";
import t5 from "../timing/5.json";

const P4: Part = { timing: t4 as any, at: 6.0 };
const P5: Part = { timing: t5 as any, at: 73.2 };
const CARD = [70.05, 73.0];
const END = 106.5;
const parts = [P4, P5];
const g4 = (l: number) => P4.at + l;
const g5 = (l: number) => P5.at + l;
type Ctx = CanvasRenderingContext2D;

function layer(ctx: Ctx, a: number, fn: () => void) {
  if (a <= 0.001) return;
  ctx.save(); ctx.globalAlpha *= clamp(a); fn(); ctx.restore();
}
const breathe = (t: number, i = 0) => Math.sin(t * 1.6 + i * 1.3) * 2;

// Karakter kimlikleri (s04/s09'da tekrar kullanılacak)
const A_OUT = 0, B_OUT = 2, BOSS_OUT = 4;
const ax = 640, bx = 1260, BOSS_X = 1720;

function nameTag(c: Ctx, x: number, y: number, txt: string, a: number, hot = false) {
  if (a <= 0) return;
  c.save(); c.globalAlpha *= a;
  c.font = font(600, 34);
  const w = c.measureText(txt).width + 40;
  c.fillStyle = "rgba(10,13,18,0.75)"; rr(c, x - w / 2, y - 30 + (1 - a) * 10, w, 52, 26); c.fill();
  c.strokeStyle = hot ? "rgba(242,207,58,0.8)" : "rgba(140,151,168,0.6)"; c.lineWidth = 2; c.stroke();
  c.fillStyle = C.text; c.textAlign = "center"; c.fillText(txt, x, y + 8 + (1 - a) * 10);
  c.restore();
}
function bubble(c: Ctx, x: number, y: number, txt: string, k: number, hot = true) {
  if (k <= 0) return;
  c.save(); c.translate(x, y); c.scale(lerp(0.6, 1, ease.back(k)), lerp(0.6, 1, ease.back(k))); c.globalAlpha *= clamp(k * 1.5);
  c.font = font(600, 30);
  const w = c.measureText(txt).width + 48;
  c.fillStyle = hot ? "#F2E7B0" : C.paper; rr(c, -w / 2, -36, w, 60, 18); c.fill();
  c.beginPath(); c.moveTo(-12, 22); c.lineTo(-28, 46); c.lineTo(10, 22); c.closePath(); c.fill();
  c.fillStyle = C.ink; c.textAlign = "center"; c.fillText(txt, 0, 4);
  c.restore();
}

// ================= A: 同じチーム — ofis katı =================
function aState(l: number) {
  // A: oturur → kalkar (6.1) → patrona yürür → rapor → döner
  if (l < 6.1) return { x: ax, stand: false, walk: -1, face: 0 };
  if (l < 6.6) return { x: ax, stand: true, walk: -1, face: 1 };
  if (l < 8.0) return { x: lerp(ax, BOSS_X - 190, ease.inOut(prog(l, 6.6, 8.0))), stand: true, walk: l * 1.4, face: 1 };
  if (l < 9.9) return { x: BOSS_X - 190, stand: true, walk: -1, face: 1 };
  if (l < 11.6) return { x: lerp(BOSS_X - 190, ax, ease.inOut(prog(l, 9.9, 11.6))), stand: true, walk: l * 1.4, face: -1 };
  return { x: ax, stand: false, walk: -1, face: 0 };
}
function sceneTeam(c: Ctx, t: number) {
  const l = t - P4.at;
  const k = ease.inOut(prog(l, -0.6, 5.5));
  const follow = l > 6 && l < 11.6 ? (aState(l).x - 960) * -0.35 * win(l, 6.2, 11.4, 0.8) : 0;
  const rack = ease.inOut(prog(l, 10.2, 11.4)) * (1 - ease.inOut(prog(l, 14.8, 15.6)));
  const eqz = ease.inOut(prog(l, 15.0, 16.4));
  c.save();
  cam(c, t, lerp(1.18, 1.04, k) + 0.12 * rack - 0.04 * eqz, lerp(260, 0, k) + follow - 140 * rack, lerp(-40, 0, k), 0.8);
  envOffice(c, t, 3 + 2 * rack, l * 8);
  // patron masası (sağ arka)
  drawPerson(c, BOSS_X, 640, 0.86, { pose: "sit", outfit: BOSS_OUT, tie: true, rim: 0.6, rimSide: -1, facing: -0.5, bob: breathe(t, 3), shade: 0.15 });
  officeDesk(c, BOSS_X, 652, 0.72, 0.5, 1);
  nameTag(c, BOSS_X, 300, "上司", ease.out(prog(l, 7.3, 8.0)) * win(l, 7.3, 15.0, 0.5));
  // A ve B masaları — aynı masa, aynı monitör
  const A = aState(l);
  const items: { y: number; fn: () => void }[] = [];
  items.push({ y: 830, fn: () => {
    dof(c, 4 * rack, () => {
      if (!A.stand) drawPerson(c, ax, 820, 1.0, { pose: "sit", outfit: A_OUT, rim: 0.8, rimSide: 1, facing: 0.2, bob: breathe(t) });
      officeDesk(c, ax, 832, 0.95, 0.75, 0);
    });
  } });
  items.push({ y: 831, fn: () => {
    drawPerson(c, bx, 820, 1.0, { pose: "sit", outfit: B_OUT, rim: 0.8, rimSide: -1, facing: -0.1, bob: breathe(t, 2) * 0.6 });
    officeDesk(c, bx, 832, 0.95, 0.85 + 0.1 * Math.sin(t * 3), 0);
  } });
  if (A.stand) items.push({ y: A.x > 1300 ? 600 : 840, fn: () => drawPerson(c, A.x, A.x > 1300 ? lerp(840, 700, prog(A.x, 1100, BOSS_X - 190)) : 840, A.x > 1300 ? lerp(1.0, 0.9, prog(A.x, 1100, BOSS_X - 190)) : 1.0, { outfit: A_OUT, rim: 0.9, rimSide: -1, facing: A.face, walk: A.walk, bob: A.walk >= 0 ? -Math.abs(Math.sin(l * 9)) * 5 : 0, eye: 1, gazeX: A.face }) });
  items.sort((p, q) => p.y - q.y).forEach((it) => it.fn());
  // B'nin biten işleri: sessizce yığılan ✓ kağıtları
  for (let i = 0; i < 6; i++) {
    const kk = ease.out(prog(l, 12.0 + i * 0.32, 12.4 + i * 0.32));
    if (kk <= 0) continue;
    const yy = 790 - i * 9 - (1 - kk) * 60;
    c.save(); c.globalAlpha *= kk; c.fillStyle = i % 2 ? "#D8D1BE" : "#C9C2B0"; c.fillRect(bx + 150, yy, 110, 8); c.restore();
  }
  // A'nın rapor baloncukları (毎週)
  const rp = [8.1, 8.6, 9.05];
  rp.forEach((s, i) => bubble(c, BOSS_X - 210 + i * 30, 420 - i * 74, ["今週の報告です", "進捗は順調です", "来週は…"][i], prog(l, s, s + 0.35) * (1 - prog(l, 10.2, 10.8))));
  c.restore();
  // HUD (dünya dışı): isimler, ✓, 量・質
  nameTag(c, 640 + (lerp(260, 0, k)) * 0.3, 320, "Aさん", ease.out(prog(l, 3.9, 4.5)) * (1 - prog(l, 5.9, 6.4)) + ease.out(prog(l, 15.6, 16.2)) * (1 - prog(l, 18.6, 19.0)));
  nameTag(c, 1260 + (lerp(260, 0, k)) * 0.3, 320, "Bさん", ease.out(prog(l, 4.7, 5.3)) * (1 - prog(l, 5.9, 6.4)) + ease.out(prog(l, 15.6, 16.2)) * (1 - prog(l, 18.6, 19.0)));
  // 毎週 sayaç (A rapor anında)
  layer(c, win(l, 6.6, 10.4, 0.4), () => {
    c.save(); c.translate(160, 140);
    c.font = font(500, 26); c.fillStyle = C.mist; c.fillText("Aさん ／ 報告", 0, 0);
    for (let i = 0; i < 12; i++) { const on = prog(l, 6.6 + i * 0.12, 6.7 + i * 0.12); c.fillStyle = on > 0 ? C.yellow : "rgba(140,151,168,0.25)"; rr(c, i * 34, 18, 26, 26, 4); c.fill(); }
    c.font = font(400, 22); c.fillStyle = C.mist; c.fillText("毎週", 0, 76);
    c.restore();
  });
  layer(c, win(l, 12.2, 15.0, 0.4), () => {
    c.save(); c.translate(W - 560, 140);
    c.font = font(500, 26); c.fillStyle = C.mist; c.fillText("Bさん ／ 完了", 0, 0);
    for (let i = 0; i < 12; i++) { const on = prog(l, 12.2 + i * 0.12, 12.3 + i * 0.12); c.strokeStyle = on > 0 ? "rgba(200,206,215,0.9)" : "rgba(140,151,168,0.25)"; c.lineWidth = 2; rr(c, i * 34, 18, 26, 26, 4); c.stroke(); if (on > 0) { c.beginPath(); c.moveTo(i * 34 + 6, 31); c.lineTo(i * 34 + 12, 38); c.lineTo(i * 34 + 21, 24); c.stroke(); } }
    c.font = font(400, 22); c.fillStyle = C.mist; c.fillText("ミスなく ・ 黙々と", 0, 76);
    c.restore();
  });
  // 量・質 =
  layer(c, win(l, 15.2, 18.9, 0.5), () => {
    const rows = [["量", 15.4], ["質", 16.4]] as const;
    rows.forEach(([lab, s], i) => {
      const kk = ease.out(prog(l, s, s + 0.7));
      const y = 150 + i * 70;
      c.font = font(600, 34); c.fillStyle = C.text; c.textAlign = "center"; c.fillText(lab, W / 2, y + 12);
      c.fillStyle = "rgba(200,206,215,0.85)"; c.fillRect(W / 2 - 50 - 300 * kk, y - 6, 300 * kk, 14); c.fillRect(W / 2 + 50, y - 6, 300 * kk, 14);
    });
    const e = ease.back(prog(l, 17.1, 17.6));
    c.font = font(700, 54); c.fillStyle = `rgba(232,234,238,${clamp(e)})`; c.textAlign = "center"; c.fillText("≒", W / 2, 320);
  });
  dust(c, t, 40, 0.2, 5);
}

// ================= B: 一年後 — 上司の机 =================
const MONTHS = ["4月", "6月", "8月", "10月", "12月", "2月", "3月"];
function sceneBoss(c: Ctx, t: number) {
  const l = t - P4.at;
  const k = ease.inOut(prog(l, 18.8, 33));
  const quick = ease.out(prog(l, 26.1, 26.6)) * (1 - ease.inOut(prog(l, 28.6, 29.6)));
  const year = prog(l, 19.1, 20.9);
  c.save();
  cam(c, t, lerp(1.0, 1.14, k) + 0.14 * quick, lerp(-60, 40, k), lerp(20, -30, k) - 40 * quick, 0.6, 960, 480);
  envNightRoom(c, t, 4);
  // pencere ışığı mevsimle değişir (yaz sıcak → kış soğuk)
  const sw = Math.sin(year * Math.PI * 2);
  lightPool(c, 1500, 260, 520, sw > 0 ? "rgba(255,200,130," : "rgba(140,180,240,", 0.08 + 0.08 * Math.abs(sw));
  // duvar takvimi
  c.save(); c.translate(1380, 240);
  c.fillStyle = "#2A2F36"; c.fillRect(-4, -8, 168, 8);
  c.fillStyle = C.paper; c.fillRect(0, 0, 160, 190);
  const mi = Math.min(MONTHS.length - 1, Math.floor(year * MONTHS.length));
  c.fillStyle = "#8A3A30"; c.fillRect(0, 0, 160, 44);
  c.font = font(700, 30); c.fillStyle = "#F4EEE2"; c.textAlign = "center"; c.fillText(MONTHS[mi], 80, 33);
  c.fillStyle = "rgba(26,29,36,0.5)"; for (let i = 0; i < 20; i++) c.fillRect(14 + (i % 5) * 28, 62 + Math.floor(i / 5) * 30, 16, 14);
  // uçuşan sayfa
  const fp = (year * MONTHS.length) % 1;
  if (year > 0 && year < 1) { c.save(); c.translate(80, 0); c.rotate(-fp * 1.4); c.translate(fp * 160, fp * 120); c.globalAlpha *= 1 - fp; c.fillStyle = C.paper; c.fillRect(-80, 0, 160, 190); c.restore(); }
  c.restore();
  // patron: masada, lamba altında
  drawPerson(c, 900, 830, 1.15, { pose: "sit", outfit: BOSS_OUT, tie: true, rim: 0.9, rimSide: 1, facing: 0, bob: breathe(t, 1) });
  officeDesk(c, 900, 846, 1.15, 0.4, 1.0);
  // 評価 dosyası
  const op = ease.inOut(prog(l, 20.2, 21.2));
  c.save(); c.translate(860, 820); c.transform(1, 0, -0.25, 0.5, 0, 0);
  c.fillStyle = "#C9A54A"; c.fillRect(-150, -90, 300, 180);
  c.fillStyle = C.paper; c.fillRect(-140 + 10 * op, -80, 280 - 10 * op, 170);
  c.restore();
  layer(c, op, () => { c.font = font(700, 30); c.fillStyle = "#3A2A10"; c.textAlign = "center"; c.fillText("評価", 830, 810); });
  c.restore();
  // 頭の中の anı kartları: hep A
  const bubbleA = ease.out(prog(l, 22.4, 23.4)) * (1 - ease.inOut(prog(l, 32.4, 33.0)));
  layer(c, bubbleA, () => {
    const cx = 960, cy = 300;
    c.fillStyle = "rgba(20,26,36,0.6)"; c.beginPath(); c.ellipse(cx, cy, 560, 220, 0, 0, Math.PI * 2); c.fill();
    c.strokeStyle = "rgba(140,151,168,0.35)"; c.lineWidth = 2; c.stroke();
    [[900, 560, 22], [870, 610, 14]].forEach(([x, y, r]) => { c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fillStyle = "rgba(20,26,36,0.6)"; c.fill(); c.stroke(); });
    const labels = ["週報", "朝の報告", "進捗共有", "相談", "会議で発言"];
    labels.forEach((lab, i) => {
      const s = 23.06 + i * 0.32;
      const kk = ease.back(prog(l, s, s + 0.45));
      const jit = Math.sin(l * 38 + i) * 4 * win(l, 30.5, 32.0, 0.3);
      memoryCard(c, cx - 420 + i * 210 + jit, cy + (i % 2 ? 30 : -30) + (1 - kk) * 50, 0.78 * kk, { label: lab, who: "A", glow: 0.8 * ease.out(prog(l, s + 0.3, s + 1)), rot: (i - 2) * 0.05, alpha: clamp(kk * 1.4) });
    });
    // B'nin kartı yok: boş, kesik çizgili yuva
    const em = ease.out(prog(l, 30.4, 31.2));
    if (em > 0) {
      c.save(); c.globalAlpha *= em; c.setLineDash([10, 8]); c.strokeStyle = "rgba(160,170,185,0.7)"; c.lineWidth = 3;
      rr(c, cx + 420 - 94, cy + 120 - 62, 188, 124, 8); c.stroke(); c.setLineDash([]);
      c.font = font(500, 26); c.fillStyle = C.mist; c.textAlign = "center"; c.fillText("Bさん…？", cx + 420, cy + 130);
      c.restore();
    }
  });
  // "すぐに" — hız çizgileri
  layer(c, win(l, 26.9, 28.6, 0.2), () => {
    c.strokeStyle = "rgba(242,207,58,0.25)"; c.lineWidth = 3;
    for (let i = 0; i < 18; i++) { const a = rnd(i, 4) * Math.PI * 2, r0 = 420 + rnd(i, 5) * 120; c.beginPath(); c.moveTo(960 + Math.cos(a) * r0, 300 + Math.sin(a) * r0 * 0.5); c.lineTo(960 + Math.cos(a) * (r0 + 160), 300 + Math.sin(a) * (r0 + 160) * 0.5); c.stroke(); }
  });
  boardLabel(c, 160, 140, "一年後 ・ 評価の時期", win(l, 19.4, 23.0, 0.5));
  dust(c, t, 50, 0.3, 9);
}

// ================= C: 違うのは「目に入った回数」 — pano =================
function sceneCount(c: Ctx, t: number) {
  const l = t - P4.at;
  c.save();
  cam(c, t, lerp(1.06, 1.0, prog(l, 32.6, 39.8)), 0, 0, 0.3);
  c.fillStyle = C.bg; c.fillRect(-300, -300, W + 600, H + 600);
  boardGrid(c, 0.8);
  // iki eşit iş yığını
  const stack = (x: number, who: string, col: string) => {
    for (let i = 0; i < 10; i++) { const kk = ease.out(prog(l, 33.4 + i * 0.07, 33.8 + i * 0.07)); if (kk <= 0) continue; c.fillStyle = i % 2 ? "#D8D1BE" : "#C9C2B0"; c.fillRect(x - 110, 700 - i * 22 - (1 - kk) * 40, 220, 18); }
    drawPerson(c, x, 980, 0.62, { outfit: who === "A" ? A_OUT : B_OUT, rim: 0.7, body: col });
    c.font = font(600, 32); c.fillStyle = C.text; c.textAlign = "center"; c.fillText(who + "さん", x, 1040);
  };
  stack(600, "A", ""); stack(1320, "B", "");
  layer(c, ease.out(prog(l, 34.3, 35.0)) * (1 - prog(l, 36.0, 36.4)), () => {
    c.font = font(600, 40); c.fillStyle = C.text; c.textAlign = "center"; c.fillText("仕事 ＝ 仕事", W / 2, 640);
  });
  // 上司の目 + 視線の回数
  const ek = ease.out(prog(l, 36.1, 36.7));
  layer(c, ek, () => {
    c.save(); c.translate(W / 2, 220);
    c.fillStyle = C.paper; c.beginPath(); c.ellipse(0, 0, 90, 46, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = C.ink; c.beginPath(); c.arc(-20 * Math.sin(l * 2), 0, 26, 0, Math.PI * 2); c.fill();
    c.restore();
    c.font = font(500, 26); c.fillStyle = C.mist; c.textAlign = "center"; c.fillText("上司の目", W / 2, 300);
  });
  const nA = Math.floor(clamp((l - 36.9) / 2.2) * 52), nB = l > 38.4 ? 3 : l > 37.8 ? 2 : l > 37.2 ? 1 : 0;
  for (let i = 0; i < nA; i++) {
    c.strokeStyle = `rgba(242,207,58,${0.12 + 0.2 * rnd(i, 7)})`; c.lineWidth = 2;
    c.beginPath(); c.moveTo(W / 2, 240); c.quadraticCurveTo(800 + rnd(i, 8) * 200, 320 + rnd(i, 9) * 100, 560 + rnd(i, 3) * 80, 560 + rnd(i, 6) * 60); c.stroke();
  }
  for (let i = 0; i < nB; i++) { c.strokeStyle = "rgba(200,206,215,0.35)"; c.lineWidth = 2; c.beginPath(); c.moveTo(W / 2, 240); c.quadraticCurveTo(1150, 330 + i * 40, 1300 + i * 20, 570); c.stroke(); }
  layer(c, ek, () => {
    c.font = font(700, 72); c.textAlign = "center";
    c.fillStyle = C.yellow; c.fillText(String(nA), 600, 500);
    c.fillStyle = C.mist; c.fillText(String(nB), 1320, 500);
    c.font = font(500, 26); c.fillStyle = C.mist; c.fillText("目に入った回数", 600, 430); c.fillText("目に入った回数", 1320, 430);
  });
  c.restore();
}

// ================= D: Taylor & Fiske — deney odası =================
const OBS = [ // arka sıra gözlemciler (talkerR'nin yüzünü görenler) + yan
  { x: 300, y: 690, s: 0.62, see: "R" }, { x: 470, y: 670, s: 0.6, see: "R" }, { x: 640, y: 660, s: 0.58, see: "R" },
  { x: 1280, y: 660, s: 0.58, see: "L" }, { x: 1450, y: 670, s: 0.6, see: "R" }, { x: 1620, y: 690, s: 0.62, see: "R" },
];
function sceneLab(c: Ctx, t: number) {
  const l = t - P4.at;
  const k = ease.inOut(prog(l, 39.3, 54));
  const pushQ = ease.inOut(prog(l, 53.5, 55.0));
  const lit = ease.inOut(prog(l, 47.7, 49.4));
  c.save();
  cam(c, t, lerp(1.0, 1.1, k) + 0.06 * pushQ, lerp(-160, 120, k), lerp(-20, 30, k), 0.6, 960, 600);
  envLab(c, t, 3);
  // spot (gözlemcilerin "iyi gördüğü" yüz)
  lightCone(c, 1080, -40, Math.PI / 2 - 0.06, 0.22, 900, 0.10 + 0.14 * lit);
  lightPool(c, 1080, 640, 260, "rgba(255,226,160,", 0.08 + 0.14 * lit);
  OBS.forEach((o, i) => {
    const arm = o.see === "R" ? ease.out(prog(l, 57.3 + i * 0.12, 57.9 + i * 0.12)) * (1 - prog(l, 60.6, 61.2)) : 0;
    drawPerson(c, o.x, o.y, o.s, { pose: "sit", outfit: i + 1, rim: 0.5, rimSide: o.x < 960 ? 1 : -1, facing: o.x < 960 ? 0.6 : -0.6, eye: 1, gazeX: o.x < 960 ? 1 : -1, bob: breathe(t, i) * 0.5, armUp: arm * 0.9, shade: 0.2 });
  });
  // konuşan iki kişi: masa başında karşılıklı
  c.fillStyle = "#4A3424"; c.fillRect(800, 770, 320, 16); c.fillStyle = "#2A1E14"; c.fillRect(950, 786, 20, 90);
  const talk = (x: number, side: number, i: number) => Math.max(0, Math.sin(l * 6 + i)) * 4 * (l > 42.9 && l < 47.8 ? 1 : 0.3);
  drawPerson(c, 840, 790, 0.95, { pose: "sit", outfit: 5, rim: 0.4, rimSide: -1, facing: 0.8, shade: 0.15 + 0.5 * lit, bob: -talk(840, 1, 0) });
  drawPerson(c, 1080, 790, 0.95, { pose: "sit", outfit: 3, rim: 1, rimSide: 1, facing: -0.6, eye: 1, gazeX: -1, glow: 0.5 * ease.out(prog(l, 49.8, 51)), bob: -talk(1080, -1, 2) });
  c.restore();
  // ön plan gözlemci silüetleri (DOF)
  layer(c, ease.out(prog(l, 44.9, 46.0)), () => dof(c, 6, () => { [180, 1760].forEach((x, i) => drawPerson(c, x, 1260, 1.4, { outfit: i + 2, rim: 0.3, shade: 0.6, facing: i ? -1 : 1 })); }));
  // konuşma dalgaları
  layer(c, win(l, 43.0, 47.6, 0.5), () => drawWaves(c, l, 1));
  // 「どちらが会話を動かしていた？」
  layer(c, win(l, 54.5, 57.2, 0.4), () => {
    c.font = font(700, 120, true); c.textAlign = "center";
    c.fillStyle = "rgba(232,234,238,0.9)"; c.fillText("？", 840, 360 + Math.sin(l * 4) * 6); c.fillText("？", 1080, 360 + Math.sin(l * 4 + 1) * 6);
  });
  // 票: aydınlık yüz 5, gölge 1 (kameraya bağlı)
  c.save();
  cam(c, t, lerp(1.0, 1.1, k) + 0.06 * pushQ, lerp(-160, 120, k), lerp(-20, 30, k), 0.6, 960, 600);
  const votes = [0, 1, 2, 4, 5].map((i) => OBS[i]);
  votes.forEach((o, i) => {
    const kk = ease.back(prog(l, 57.6 + i * 0.14, 58.0 + i * 0.14)) * (1 - prog(l, 60.8, 61.3));
    if (kk <= 0) return;
    c.save(); c.globalAlpha *= clamp(kk); c.strokeStyle = "rgba(242,207,58,0.6)"; c.lineWidth = 3; c.setLineDash([8, 8]);
    c.beginPath(); c.moveTo(o.x, o.y - 200); c.quadraticCurveTo((o.x + 1080) / 2, 380, 1080, 560); c.stroke(); c.setLineDash([]); c.restore();
  });
  layer(c, ease.out(prog(l, 58.4, 59.0)) * (1 - prog(l, 60.8, 61.3)), () => {
    c.font = font(700, 64); c.textAlign = "center"; c.fillStyle = C.yellow; c.fillText("5票", 1080, 500); c.fillStyle = C.mist; c.fillText("1票", 840, 500);
  });
  c.restore();
  // 「全員が同じ会話を」— dalgalar ikisine de eşit
  layer(c, win(l, 61.0, 64.6, 0.5), () => drawWaves(c, l, 1.4));
  dust(c, t, 40, 0.25, 13);
}
function drawWaves(c: Ctx, l: number, amp: number) {
  for (let i = 0; i < 4; i++) {
    const ph = ((l * 0.8 + i * 0.25) % 1);
    c.strokeStyle = `rgba(200,210,225,${0.35 * (1 - ph) * amp})`; c.lineWidth = 3;
    c.beginPath(); c.arc(960, 600, 60 + ph * 280, Math.PI * 1.1, Math.PI * 1.9); c.stroke();
  }
}

// ================= E: 顕著性効果 — terazi =================
function sceneScale(c: Ctx, t: number) {
  const l = t - P5.at;
  c.save();
  cam(c, t, lerp(1.08, 1.0, ease.out(prog(l, -0.4, 4))), 0, 0, 0.3);
  c.fillStyle = C.bg; c.fillRect(-300, -300, W + 600, H + 600);
  boardGrid(c, 0.8);
  const tilt = 0.22 * ease.inOut(prog(l, 2.3, 3.4)) * (1 - 0.6 * ease.inOut(prog(l, 7.2, 8.4))) + Math.sin(l * 3) * 0.03 * win(l, 7.2, 9.6, 0.5);
  const desat = ease.inOut(prog(l, 6.9, 7.8)) * (1 - ease.inOut(prog(l, 9.4, 10)));
  c.save(); c.translate(W / 2, 360);
  c.fillStyle = C.steel2; c.fillRect(-10, 0, 20, 440); c.fillRect(-120, 430, 240, 18);
  c.rotate(tilt);
  c.fillStyle = C.mist; c.fillRect(-460, -8, 920, 14);
  for (const sd of [-1, 1]) {
    c.save(); c.translate(sd * 440, 0); c.rotate(-tilt);
    c.strokeStyle = C.mist; c.lineWidth = 2; c.beginPath(); c.moveTo(0, 0); c.lineTo(-110, 190); c.moveTo(0, 0); c.lineTo(110, 190); c.stroke();
    c.fillStyle = C.steel2; c.beginPath(); c.ellipse(0, 196, 130, 22, 0, 0, Math.PI * 2); c.fill();
    if (sd < 0) {
      const gk = ease.out(prog(l, 0.2, 1.0)) * (1 - desat * 0.7);
      const g = c.createRadialGradient(0, 120, 10, 0, 120, 220); g.addColorStop(0, `rgba(242,207,58,${0.5 * gk})`); g.addColorStop(1, "rgba(242,207,58,0)");
      c.fillStyle = g; c.fillRect(-240, -100, 480, 440);
      c.fillStyle = desat > 0.5 ? "#B9AE7A" : C.yellow; c.beginPath(); c.arc(0, 120, 64, 0, Math.PI * 2); c.fill();
    } else { c.fillStyle = "#4A5363"; c.beginPath(); c.arc(0, 120, 64, 0, Math.PI * 2); c.fill(); }
    c.restore();
  }
  c.restore();
  boardLabel(c, W / 2 - 560, 300, "目に入りやすい", ease.out(prog(l, 0.3, 1.0)), C.yellow);
  boardLabel(c, W / 2 + 320, 300, "目に入りにくい", ease.out(prog(l, 0.6, 1.3)));
  layer(c, ease.out(prog(l, 2.6, 3.3)), () => { c.font = font(600, 36); c.fillStyle = C.text; c.textAlign = "center"; c.fillText("原因として、重く見積もられる", W / 2, 180); });
  layer(c, ease.out(prog(l, 7.0, 7.8)) * (1 - prog(l, 9.5, 10)), () => { c.font = font(500, 34); c.fillStyle = C.mist; c.textAlign = "center"; c.fillText("※ いつでも同じ結果になるわけではない", W / 2, 920); });
  c.restore();
}

// ================= F: 「よく見える席」 — ofis, patronun arkasından =================
function sceneSeat(c: Ctx, t: number) {
  const l = t - P5.at;
  const k = ease.inOut(prog(l, 9.5, 22.4));
  const spot = ease.out(prog(l, 13.6, 14.6));
  c.save();
  cam(c, t, lerp(1.0, 1.12, k), lerp(-80, 60, k), lerp(0, -20, k), 0.7, 900, 560);
  envOffice(c, t, 4, -l * 6);
  // A ve B masaları orta planda
  drawPerson(c, 620, 760, 0.82, { pose: "sit", outfit: A_OUT, rim: 0.6 + 0.4 * spot, rimSide: 1, glow: 0.7 * spot, bob: breathe(t) });
  officeDesk(c, 620, 772, 0.8, 0.7, 0);
  drawPerson(c, 1180, 760, 0.82, { pose: "sit", outfit: B_OUT, rim: 0.4, rimSide: -1, shade: 0.35 * spot, bob: breathe(t, 2) * 0.6 });
  officeDesk(c, 1180, 772, 0.8, 0.75, 0);
  lightCone(c, 620, -60, Math.PI / 2, 0.2, 880, 0.2 * spot);
  lightPool(c, 620, 760, 300, "rgba(255,226,160,", 0.18 * spot);
  // patron: ön planda, sırtı dönük (DOF)
  dof(c, 5, () => drawPerson(c, 1560, 1340, 1.7, { outfit: BOSS_OUT, tie: true, rim: 0.6, rimSide: -1, shade: 0.45, facing: -0.3 }));
  c.restore();
  nameTag(c, 620, 330, "Aさん", ease.out(prog(l, 10.9, 11.5)) * (1 - prog(l, 17.4, 17.9)));
  layer(c, ease.out(prog(l, 13.9, 14.8)) * (1 - prog(l, 17.4, 17.9)), () => { c.font = font(700, 54, true); c.fillStyle = C.yellow; c.textAlign = "center"; c.fillText("「よく見える席」", 620, 230); });
  // 毎週の報告 — küçük takvim kareleri A'ya akar
  for (let i = 0; i < 8; i++) {
    const kk = prog(l, 11.4 + i * 0.18, 12.4 + i * 0.18) * (1 - prog(l, 13.6, 14.0));
    if (kk <= 0) continue;
    c.fillStyle = `rgba(242,207,58,${0.8 * (1 - kk)})`; c.fillRect(lerp(1500, 640, ease.inOut(kk)), lerp(520, 520, kk) - Math.sin(kk * Math.PI) * 120 + i * 4, 22, 22);
  }
  // 「ひいき」ではない
  layer(c, win(l, 18.0, 21.8, 0.4), () => {
    c.save(); c.translate(1460, 300);
    c.fillStyle = "#C25A5A"; c.beginPath(); c.moveTo(0, 50); c.bezierCurveTo(-90, -10, -50, -80, 0, -36); c.bezierCurveTo(50, -80, 90, -10, 0, 50); c.fill();
    const x = ease.inOut(prog(l, 19.4, 20.0));
    c.strokeStyle = C.text; c.lineWidth = 10; c.lineCap = "round";
    c.beginPath(); c.moveTo(-90, -90); c.lineTo(-90 + 180 * x, -90 + 180 * x); c.stroke();
    c.font = font(600, 34); c.fillStyle = C.text; c.textAlign = "center"; c.fillText("ひいき", 0, 120);
    c.restore();
  });
  dust(c, t, 40, 0.22, 17);
}

// ================= G: 記憶 → 評価の材料 =================
function sceneFile(c: Ctx, t: number) {
  const l = t - P5.at;
  const k = ease.inOut(prog(l, 21.9, 30));
  c.save();
  cam(c, t, lerp(1.0, 1.16, k), 0, lerp(0, 40, k), 0.5, 960, 640);
  envNightRoom(c, t, 5);
  // masa üstünde 評価 dosyası (perspektif)
  const close = ease.inOut(prog(l, 28.8, 29.8));
  c.save(); c.translate(960, 740); c.transform(1, 0, -0.12, 0.6, 0, 0);
  c.fillStyle = "rgba(0,0,0,0.5)"; c.fillRect(-330, -190, 680, 400);
  c.fillStyle = "#C9A54A"; c.fillRect(-340, -200, 680, 400);
  c.fillStyle = C.paper; c.fillRect(-320, -186, 640, 372);
  c.fillStyle = C.ink; c.font = font(700, 54); c.textAlign = "center"; c.fillText("評価シート", 0, -110);
  c.fillStyle = "rgba(26,29,36,0.25)"; for (let i = 0; i < 4; i++) c.fillRect(-260, -40 + i * 50, 520, 10);
  // kapanan kapak
  if (close > 0) { c.fillStyle = "#6E5426"; c.fillRect(-340, -200, 680, 400 * close); c.fillStyle = "#3A2A10"; c.font = font(700, 54); if (close > 0.9) c.fillText("評価", 0, 20); }
  c.restore();
  c.restore();
  // hafıza bulutu: A kartları parlar, B kartı soluk
  const cards = [
    { x: 520, y: 260, who: "A", lab: "週報" }, { x: 780, y: 200, who: "A", lab: "報告" }, { x: 1040, y: 230, who: "A", lab: "相談" },
    { x: 1300, y: 210, who: "A", lab: "発言" }, { x: 1560, y: 280, who: "B", lab: "…" },
  ] as const;
  cards.forEach((cd, i) => {
    const appear = ease.out(prog(l, 22.0 + i * 0.2, 22.6 + i * 0.2));
    const strong = cd.who === "A" ? ease.out(prog(l, 24.2, 25.2)) : 0;
    const fly = cd.who === "A" ? ease.inOut(prog(l, 27.0 + i * 0.25, 28.4 + i * 0.25)) : 0;
    const x = lerp(cd.x, 960 + (i - 1.5) * 60, fly), y = lerp(cd.y + Math.sin(t + i) * 8, 760, fly);
    memoryCard(c, x, y, lerp(0.85, 0.4, fly) * appear, { label: cd.lab, who: cd.who, glow: cd.who === "A" ? 0.4 + 0.6 * strong : 0, alpha: appear * (cd.who === "B" ? 0.45 * (1 - ease.inOut(prog(l, 27.5, 29))) : 1 - prog(fly, 0.85, 1)), fade: cd.who === "B" ? 0.7 : 0, rot: (i - 2) * 0.06 * (1 - fly) });
  });
  layer(c, ease.out(prog(l, 24.6, 25.4)) * (1 - prog(l, 27.0, 27.4)), () => { c.font = font(700, 48, true); c.fillStyle = C.yellow; c.textAlign = "center"; c.fillText("記憶に残る", W / 2, 470); });
  layer(c, ease.out(prog(l, 26.5, 27.2)), () => { boardLabel(c, 160, 140, "評価の材料 ＝ 記憶", 1, C.yellow); });
  dust(c, t, 50, 0.25, 21);
}

// ================= ÇİZİM =================
const SCENES: [number, number, (c: Ctx, t: number) => void, Lens][] = [
  [5.4, g4(19.2), sceneTeam, LENS.night],
  [g4(18.6), g4(33.2), sceneBoss, LENS.night],
  [g4(32.6), g4(39.9), sceneCount, LENS.doc],
  [g4(39.3), CARD[0] + 0.6, sceneLab, LENS.gym],
  [g5(-0.4), g5(10.0), sceneScale, LENS.doc],
  [g5(9.4), g5(22.4), sceneSeat, LENS.night],
  [g5(21.8), END, sceneFile, LENS.night],
];

function draw(ctx: Ctx, t: number) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
  ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H);
  const active = SCENES.filter(([a, b]) => t >= a && t <= b);
  const L = active.length ? active[active.length - 1][3] : LENS.night;
  if (t >= 5.0) {
    lens(ctx, t, L, (c) => {
      for (const [a, , fn] of active) layer(c, a <= 5.4 ? 1 : ease.sine(prog(t, a, a + 0.6)), () => fn(c, t));
    });
  }
  // maskot: deney bölümüne geçişte izleyiciye "bak" der
  const mk = win(t, g4(39.4), g4(43.4), 0.7);
  if (mk > 0) drawMascot(ctx, lerp(2150, 1700, ease.out(mk)), 1100, 0.62, { mouth: speaking(parts, t), armR: 0.9, prop: "magnifier", lookX: -0.8, lookY: -0.3, rim: 1, tilt: Math.sin(t * 1.1) * 0.012 });
  sectionTitle(ctx, t, 0.0, 3.3, "02", "思い出されるのは誰か");
  thoughtExperiment(ctx, t, 3.1, 6.0);
  screenCard(ctx, t, CARD[0], CARD[1], { term: "顕著性効果", source: "Taylor & Fiske, 1975" });
  sourceCard(ctx, t, g4(40.0), g4(52.0), "Taylor & Fiske (1975)");
  drawSubtitles(ctx, parts, t);
  fadeBlack(ctx, 1 - prog(t, 0, 0.5));
  fadeBlack(ctx, prog(t, END - 1.4, END - 0.2));
}

// ================= SES EFEKTLERİ =================
const cues: Cue[] = [];
const cue = (t: number, type: string, gain = 1, p: Record<string, number> = {}) => cues.push({ t, type, gain, p });

cue(0.0, "room", 0.5, { d: END });
cue(0.35, "whoosh", 0.6, { d: 1.2 });
cue(3.25, "thump", 0.8);
cue(3.4, "shimmer", 0.35, { f: 392 });
cue(5.6, "whoosh", 0.35, { d: 1.0 });
cue(g4(3.92), "blip", 0.3, { f: 660 });
cue(g4(4.72), "blip", 0.3, { f: 587 });
cue(g4(6.1), "thunk", 0.3);
for (let s = 6.7; s < 8.0; s += 0.42) cue(g4(s), "step", 0.35);
for (let i = 0; i < 12; i++) cue(g4(6.6 + i * 0.12), "tick", 0.22, { f: 1600 });
[8.1, 8.6, 9.05].forEach((s) => cue(g4(s), "blip", 0.35, { f: 880 }));
for (let s = 10.0; s < 11.6; s += 0.42) cue(g4(s), "step", 0.3);
for (let i = 0; i < 6; i++) cue(g4(12.0 + i * 0.32), "tick", 0.3, { f: 1200 });
cue(g4(15.4), "swish", 0.35); cue(g4(16.4), "swish", 0.35); cue(g4(17.15), "hit", 0.4);
cue(g4(18.8), "whoosh", 0.4, { d: 1.2 });
for (let i = 0; i < 7; i++) cue(g4(19.1 + i * 0.26), "swish", 0.22);
cue(g4(20.2), "pen", 0.4, { d: 0.6 });
for (let i = 0; i < 5; i++) cue(g4(23.06 + i * 0.32), "shimmer", 0.25, { f: 440 + i * 50 });
cue(g4(26.1), "swish", 0.55);
cue(g4(30.4), "fall", 0.35);
cue(g4(32.6), "whoosh", 0.35, { d: 1.0 });
cue(g4(34.3), "thunk", 0.4);
cue(g4(36.1), "blip", 0.45, { f: 520 });
for (let i = 0; i < 20; i++) cue(g4(36.9 + i * 0.11), "tick", 0.18, { f: 2000 });
cue(g4(39.3), "whoosh", 0.4, { d: 1.2 });
cue(g4(47.7), "riser", 0.35, { d: 1.6 });
cue(g4(49.8), "shimmer", 0.4, { f: 523 });
cue(g4(54.5), "blip", 0.35, { f: 700 });
for (let i = 0; i < 5; i++) cue(g4(57.6 + i * 0.14), "blip", 0.3, { f: 880 });
cue(g4(61.0), "shimmer", 0.3, { f: 392 });
cue(CARD[0], "hit", 0.8);
cue(CARD[0] + 0.15, "shimmer", 0.4, { f: 392 });
cue(CARD[1] - 0.3, "whoosh", 0.3, { d: 0.8 });
cue(g5(2.3), "thump", 0.7);
cue(g5(4.38), "hit", 0.4);
cue(g5(6.9), "fall", 0.3);
cue(g5(9.4), "whoosh", 0.35, { d: 1.0 });
cue(g5(13.6), "thunk", 0.7);
cue(g5(13.7), "shimmer", 0.4, { f: 440 });
cue(g5(19.4), "swish", 0.5);
cue(g5(21.8), "whoosh", 0.35, { d: 1.0 });
for (let i = 0; i < 5; i++) cue(g5(22.0 + i * 0.2), "tick", 0.25, { f: 1500 });
cue(g5(24.2), "shimmer", 0.45, { f: 523 });
for (let i = 0; i < 4; i++) cue(g5(27.0 + i * 0.25 + 1.2), "swish", 0.25);
cue(g5(29.6), "door", 0.5);
cue(END - 1.6, "whoosh", 0.35, { d: 1.4 });

export const s02: Section = { id: "s02", duration: END, parts, cues, draw };
void rnd; void bokeh;
