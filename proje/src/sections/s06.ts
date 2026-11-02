// s06 気づかれても、数えられない — ses 12, 12b  (s04 yapısı: SCENES + lens + cues)
// Yeni ortak parçalar: design/env.ts → envMeetingRoom(), meetingTable(); components/evaluation.ts →
//   speechBubble(), evalSheet(), armchair(), chainLevel(), tallyCounter().
import { Section, Part, Cue, W, H, clamp, ease, prog, win, lerp, rnd, speaking } from "../engine/core";
import { C, font, lightPool, lightCone, fadeBlack, rr, dust } from "../design/style";
import { lens, LENS, cam, dof, Lens, bokeh } from "../design/grade";
import { envMeetingRoom, meetingTable, envOffice, officeDesk } from "../design/env";
import { whipStreaks, flashPop } from "../design/fx";
import { drawMascot } from "../characters/mascot";
import { drawPerson } from "../characters/people";
import { mug, plant, wallClock } from "../characters/props";
import { sectionTitle, screenCard, boardLabel, memoryCard } from "../components/cards";
import { speechBubble, evalSheet, armchair, chainLevel, tallyCounter } from "../components/evaluation";
import { drawSubtitles } from "../components/subtitle";
import t12 from "../timing/12.json";
import t12b from "../timing/12b.json";

const P12: Part = { timing: t12 as any, at: 3.4 };
const P12b: Part = { timing: t12b as any, at: 85.6 };
const parts = [P12, P12b];
const END = 91.4;
const g = (l: number) => P12.at + l;
const gb = (l: number) => P12b.at + l;
const CARD_A = g(78.5), CARD_B = gb(-0.1); // 気づかれない ／ 気づかれても、数えられない
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
/** Sarı "görme" ışını: gözden hedefe */
function gazeBeam(c: Ctx, x0: number, y0: number, x1: number, y1: number, k: number) {
  if (k <= 0) return;
  c.save(); c.globalCompositeOperation = "lighter";
  const ang = Math.atan2(y1 - y0, x1 - x0), len = Math.hypot(x1 - x0, y1 - y0) * ease.out(clamp(k));
  c.translate(x0, y0); c.rotate(ang);
  const gr = c.createLinearGradient(0, 0, len, 0);
  gr.addColorStop(0, "rgba(242,207,58,0.35)"); gr.addColorStop(1, "rgba(242,207,58,0.05)");
  c.fillStyle = gr; c.beginPath(); c.moveTo(0, -10); c.lineTo(len, -70); c.lineTo(len, 70); c.lineTo(0, 10); c.closePath(); c.fill();
  c.restore();
}

const LENS_ROOM: Lens = { shadow: "rgba(18,46,62,0.32)", high: "rgba(255,190,120,0.12)", bloom: 0.6, ca: 0.8, vig: 0.76, grain: 0.06, exposure: 1.0, sat: 0.9 };
const LENS_COLD: Lens = { shadow: "rgba(16,40,66,0.38)", high: "rgba(200,215,255,0.06)", bloom: 0.5, ca: 1.0, vig: 0.8, grain: 0.065, exposure: 0.98, sat: 0.82 };

// ================= A: 面談室 — 「頑張ってるね」「頼りにしているよ」 =================
function sceneMeeting(c: Ctx, t: number) {
  const l = t - P12.at;
  const k = ease.inOut(prog(l, -0.6, 10.2));
  const rack = ease.inOut(prog(l, 3.4, 4.4)); // odak: B → 上司
  c.save();
  cam(c, t, lerp(1.0, 1.14, k), lerp(-60, 80, k), lerp(30, -10, k), 0.6, 960, 600);
  envMeetingRoom(c, t, 4 + rack * 2, -l * 8);
  wallClock(c, 820, 200, 46, 14.5 + l / 3600);
  plant(c, t, 1820, 760, 1.4);
  // masa arkasında 上司 (outfit 4 + kravat), sıcak lamba ışığı
  lightPool(c, 1180, 520, 520, "rgba(255,210,150,", 0.18 + 0.06 * rack);
  dof(c, (1 - rack) * 5, () => {
    drawPerson(c, 1180, 760, 1.25, { outfit: 4, tie: true, pose: "sit", rim: 0.8, rimSide: 1, facing: -0.5, eye: 1, gazeX: -0.8, bob: breathe(t) * 0.6, armUp: 0.12 + 0.18 * win(l, 4.3, 8.6, 0.5) * (0.5 + 0.5 * Math.sin(t * 5)) });
  });
  meetingTable(c, 1000, 780, 1300, 1);
  mug(c, t, 1360, 762, 0.9, 1);
  c.fillStyle = "#E3DDCC"; c.save(); c.translate(1000, 770); c.rotate(-0.05); c.fillRect(-90, -8, 180, 10); c.restore();
  c.restore();
  // ön plan: Bさん omuz üstü (outfit 2), DOF
  dof(c, rack * 7, () => {
    c.save(); cam(c, t, 1, -k * 40, 0, 0.4);
    drawPerson(c, 480, 1260, 2.0, { outfit: 2, pose: "sit", rim: 0.6, rimSide: 1, shade: 0.35, facing: 0.6, bob: breathe(t, 1) });
    c.restore();
  });
  // sözcükler: sıcak balonlar
  speechBubble(c, t, 1360, 300, "頑張ってるね", prog(l, 4.36, 4.9) * (1 - prog(l, 9.2, 9.8)), { warm: 1, tail: -1, size: 44 });
  speechBubble(c, t, 1100, 160, "頼りにしているよ", prog(l, 5.66, 6.2) * (1 - prog(l, 9.2, 9.8)), { warm: 1, tail: 1, size: 44 });
  layer(c, win(l, 0.0, 3.4, 0.5), () => boardLabel(c, 140, 110, "評価の面談", 1, C.mist));
}

// ================= B: 評価シート — 前の年より低い, あいまいな一言 =================
function sceneSheet(c: Ctx, t: number) {
  const l = t - P12.at;
  const k = ease.inOut(prog(l, 9.4, 21.6));
  const slide = ease.out(prog(l, 10.0, 11.0));
  const drop = ease.out(prog(l, 12.7, 13.3));
  const fuzzy = ease.inOut(prog(l, 18.5, 19.6));
  const close = ease.inOut(prog(l, 20.4, 21.1));
  c.save();
  cam(c, t, lerp(1.15, 1.28, k), lerp(40, -40, k), lerp(-20, 20, k), 0.5, 960, 540);
  // masa yüzeyi (üstten yakın)
  const tg = c.createLinearGradient(0, 0, 0, H);
  tg.addColorStop(0, "#3A281A"); tg.addColorStop(1, "#1C130C");
  c.fillStyle = tg; c.fillRect(-600, -400, W + 1200, H + 800);
  c.strokeStyle = "rgba(0,0,0,0.22)"; for (let i = 0; i < 40; i++) { c.beginPath(); c.moveTo(-600, i * 30); c.bezierCurveTo(300, i * 30 + 10, 1300, i * 30 - 8, 2600, i * 30 + 4); c.stroke(); }
  lightPool(c, 900, 520, 800, "rgba(255,214,150,", 0.2);
  // kupa + kalem + not (set)
  mug(c, t, 1500, 360, 1.3, 1);
  c.save(); c.translate(1460, 820); c.rotate(0.5); c.fillStyle = "#1E2836"; rr(c, -12, -170, 24, 340, 10); c.fill(); c.fillStyle = "#B08A4A"; c.fillRect(-12, -170, 24, 18); c.restore();
  // 上司'nin eli kâğıdı iter
  const sx = lerp(1300, 860, slide);
  c.save(); c.globalAlpha *= 1 - prog(l, 11.4, 12.0);
  c.fillStyle = "#3D4A5A"; rr(c, sx + 150, 380, 360, 90, 40); c.fill();
  c.fillStyle = "#C48F6C"; c.beginPath(); c.ellipse(sx + 150, 425, 48, 36, 0, 0, Math.PI * 2); c.fill();
  c.restore();
  evalSheet(c, sx, 560, 0.95, { drop, rot: lerp(0.2, -0.04, slide), close });
  c.restore();
  // 低かった: kırmızımsı darbe
  flashPop(c, 1000, 760, (drop > 0 && drop < 1 ? 0.5 : 0) * (1 - drop));
  // あいまいな一言: belirsiz balon
  speechBubble(c, t, 1400, 230, "特に大きな成果はないけど…", prog(l, 14.16, 14.7) * (1 - prog(l, 20.3, 20.8)), { grey: 1, tail: -1, size: 38, fuzzy: fuzzy * 0.8 });
  speechBubble(c, t, 1240, 400, "頑張ってるのはわかってるから", prog(l, 16.24, 16.8) * (1 - prog(l, 20.3, 20.8)), { warm: 0.4 * (1 - fuzzy), tail: 1, size: 38, fuzzy: fuzzy });
  layer(c, ease.out(prog(l, 18.6, 19.2)) * (1 - prog(l, 20.3, 20.8)), () => { c.font = font(700, 48, true); c.fillStyle = C.mist; c.textAlign = "left"; c.fillText("あいまい", 140, 160); });
  layer(c, ease.out(prog(l, 12.72, 13.2)) * (1 - prog(l, 16.0, 16.5)), () => { c.font = font(700, 54, true); c.fillStyle = "#E2603A"; c.textAlign = "left"; c.fillText("前の年より、低い", 140, 160); });
}

// ================= C: 働く人の声 — 珍しくない =================
const VOICES = ["私も", "同じことを言われた", "頑張ってるのは知ってる、と", "評価は下がった", "成果がない、って", "よくある", "うちも", "去年も"];
function sceneVoices(c: Ctx, t: number) {
  const l = t - P12.at;
  const wIn = 1 - ease.out(prog(l, 21.3, 21.9));
  const k = ease.inOut(prog(l, 21.4, 31.6));
  c.save();
  dof(c, wIn * 18, () => {
    c.save();
    cam(c, t, lerp(1.0, 1.1, k), wIn * 1700 + lerp(120, -120, k), 0, 0.6, 960, 560);
    envOffice(c, t, 4, -l * 10);
    for (let i = 0; i < 7; i++) {
      const x = 200 + i * 260;
      officeDesk(c, x, 880, 0.9, 0.5 + 0.3 * rnd(i, 3), i % 3 === 0 ? 0.7 : 0);
      drawPerson(c, x - 40, 860, 0.95, { outfit: (i * 2 + 1) % 6, pose: "desk", rim: 0.5, rimSide: i % 2 ? 1 : -1, shade: 0.45, facing: (rnd(i, 4) - 0.5), bob: breathe(t, i) * 0.5, eye: 1, gazeX: rnd(i, 9) - 0.5 });
    }
    c.restore();
  });
  // balonlar: ofisin her yerinden, hızlanarak (珍しくない)
  for (let i = 0; i < 16; i++) {
    const s0 = 22.9 + (i < 6 ? i * 0.45 : 2.7 + (i - 6) * 0.22);
    const a = prog(l, s0, s0 + 0.5) * (1 - prog(l, 27.6, 28.2));
    const x = 200 + rnd(i, 21) * 1500, y = 200 + rnd(i, 22) * 420;
    speechBubble(c, t + i, x + wIn * 1700, y, VOICES[i % VOICES.length], a, { grey: i % 4 === 0 ? 0 : 1, size: 26 + rnd(i, 23) * 8, tail: i % 2 ? 1 : -1 });
  }
  layer(c, ease.out(prog(l, 25.5, 26.1)) * (1 - prog(l, 27.6, 28.2)), () => stamp(c, 960, 860, "珍しくない", 1, C.text, -0.06, 56));
  c.restore();
  // ひとつの問い: maskot + "？"
  const mk = win(l, 27.6, 31.6, 0.5);
  layer(c, mk, () => { c.fillStyle = "rgba(6,8,12,0.55)"; c.fillRect(0, 0, W, H); });
  if (mk > 0) drawMascot(c, 960, lerp(1300, 1080, ease.out(mk)), 0.75, { mouth: speaking(parts, t), lookX: 0, lookY: -0.2, armR: 0.5, armL: 0.2, rim: 1, light: 0.9, brow: 0.6 });
  layer(c, ease.out(prog(l, 29.54, 30.2)) * (1 - prog(l, 31.2, 31.6)), () => {
    const s = 1 + 0.04 * Math.sin(t * 3);
    c.save(); c.translate(960, 300); c.scale(s, s);
    c.font = font(800, 200, true); c.fillStyle = C.text; c.textAlign = "center"; c.shadowColor = "rgba(232,234,238,0.4)"; c.shadowBlur = 30; c.fillText("？", 0, 70);
    c.restore();
  });
}

// ================= D: あの言葉は、嘘だったのか — 嘘ではなかった =================
function sceneLie(c: Ctx, t: number) {
  const l = t - P12.at;
  const k = ease.inOut(prog(l, 31.2, 41.0));
  const crack = prog(l, 32.9, 33.7);
  const mend = ease.out(prog(l, 34.5, 35.6));
  const tilt = ease.inOut(prog(l, 38.6, 41.0)); // kamera yukarı: 流れ
  c.save();
  cam(c, t, lerp(1.12, 1.0, k), 0, lerp(0, 700, tilt), 0.4, 960, 540);
  envMeetingRoom(c, t, 7, 0);
  c.fillStyle = "rgba(6,8,12,0.5)"; c.fillRect(-600, -400, W + 1200, H + 800);
  // boş masa, sandalye: görüşme bitti
  meetingTable(c, 960, 820, 1100, 1);
  armchair(c, 1220, 800, 0.8, { col: "#2E2A2A" });
  // balon: ortada, çatlar → onarılır (sarı)
  const warm = mend;
  speechBubble(c, t, 960, 420, "頑張ってるね", 1, { warm: 0.3 + 0.7 * warm, crack: crack * (1 - mend), size: 60 });
  c.restore();
  layer(c, ease.out(prog(l, 32.84, 33.4)) * (1 - prog(l, 34.4, 34.8)), () => { c.font = font(800, 76, true); c.fillStyle = C.text; c.textAlign = "center"; c.fillText("嘘？", 960, 200); });
  layer(c, (1 - tilt), () => check(c, 1270, 330, prog(l, 34.6, 35.3), 1.6));
  layer(c, ease.out(prog(l, 35.0, 35.6)) * (1 - prog(l, 37.8, 38.4)), () => { c.font = font(700, 54, true); c.fillStyle = C.yellow; c.textAlign = "center"; c.fillText("嘘ではなかった", 960, 200); });
  // tilt: yukarıda basamaklar görünmeye başlar
  layer(c, tilt, () => {
    c.save(); c.translate(0, 700 * (1 - tilt));
    c.font = font(700, 50, true); c.fillStyle = C.mist; c.textAlign = "center"; c.fillText("評価の流れ", 960, 140);
    c.restore();
  });
}

// ================= E: 評価の流れ — 階段: 印象は落ち、言葉にできる成果だけ通る =================
const LV = [
  { x: 360, y: 900, lb: "直属の上司" },
  { x: 860, y: 680, lb: "部長" },
  { x: 1360, y: 460, lb: "本部長" },
  { x: 1800, y: 240, lb: "評価会議" },
];
/** kart yolu: basamak i'den i+1'e */
function pathPos(p: number) {
  const i = Math.min(2, Math.floor(p)), f = p - i;
  const a = LV[i], b = LV[i + 1];
  return { x: lerp(a.x + 60, b.x - 60, ease.inOut(f)), y: lerp(a.y - 200, b.y - 200, ease.inOut(f)) - Math.sin(f * Math.PI) * 90 };
}
function sceneChain(c: Ctx, t: number) {
  const l = t - P12.at;
  const k = ease.inOut(prog(l, 40.6, 56.4));
  const bossUp = win(l, 45.2, 56.4, 0.5);
  const gates = ease.out(prog(l, 49.5, 50.4));
  // kamera basamakları takip eder
  const camX = lerp(380, -420, ease.inOut(prog(l, 41.0, 54.6)));
  const camY = lerp(-180, 230, ease.inOut(prog(l, 41.0, 54.6)));
  c.save();
  cam(c, t, lerp(1.05, 0.92, k), camX, camY, 0.5, 960, 540);
  // arka: soğuk beton kuyu + uzak pencereler (parallax)
  c.fillStyle = "#0E1218"; c.fillRect(-1200, -1200, W + 2400, H + 2400);
  dof(c, 6, () => {
    for (let i = 0; i < 30; i++) {
      const x = -800 + rnd(i, 31) * 3600 - camX * 0.4, y = -800 + rnd(i, 32) * 2200 - camY * 0.4;
      c.fillStyle = rnd(i, 33) > 0.5 ? "rgba(255,200,130,0.25)" : "rgba(150,190,240,0.18)"; c.fillRect(x, y, 60, 90);
    }
    bokeh(c, t, 12, -300, 900, 40, 0.15);
  });
  // en üstte karar koltuğu (評価会議)
  lightCone(c, 1800, -500, Math.PI / 2, 0.25, 900, 0.10, "200,215,240");
  LV.forEach((v, i) => {
    const lit = i === 0 ? 1 - 0.5 * ease.inOut(prog(l, 45.0, 47.0)) : i === 3 ? win(l, 42.2, 46.0, 0.5) : 0.3;
    chainLevel(c, v.x, v.y, 1, { label: v.lb, lit, gate: i < 3 ? gates : 0 });
  });
  // kişiler
  drawPerson(c, LV[0].x - 40, LV[0].y - 20, 0.9, { outfit: 4, tie: true, rim: 0.8, rimSide: 1, facing: lerp(0, 0.8, bossUp), eye: 1, gazeX: lerp(0, 1, bossUp), armUp: 0.3 * bossUp, bob: breathe(t) * 0.5 });
  drawPerson(c, LV[1].x - 40, LV[1].y - 20, 0.85, { outfit: 5, tie: true, rim: 0.5, shade: 0.3, facing: 0.5, eye: 1, gazeX: 0.6 });
  drawPerson(c, LV[2].x - 40, LV[2].y - 20, 0.85, { outfit: 3, tie: true, rim: 0.5, shade: 0.4, facing: 0.5, eye: 1, gazeX: 0.6 });
  armchair(c, LV[3].x, LV[3].y - 10, 0.6, { col: "#2A2420", glow: win(l, 42.2, 46.0, 0.5), tall: 1.2 });
  layer(c, win(l, 42.2, 46.0, 0.5), () => { c.font = font(700, 34, true); c.fillStyle = C.text; c.textAlign = "center"; c.fillText("最後に決める", LV[3].x, LV[3].y - 300); });
  // 上司: 上に説明 (balon)
  speechBubble(c, t, LV[0].x + 160, LV[0].y - 380, "説明しなければ", prog(l, 47.28, 47.8) * (1 - prog(l, 50.8, 51.3)), { grey: 1, size: 30, tail: -1 });
  // iki kart yukarı yolculuğa çıkar: 印象 (düşer) ve 言葉にできる成果 (geçer)
  const travel = clamp(prog(l, 50.8, 52.34)) * 1.55; // 印象: 1. basamağın geçidine kadar
  // 印象: her geçitte takılıp düşer — ilk geçitte düşer @52.34
  const fallT = Math.max(0, l - 52.34);
  {
    const pi = travel;
    const p0 = pathPos(pi);
    const fy = p0.y + fallT * fallT * 260, fx = p0.x + Math.sin(fallT * 6) * 30 + fallT * 40;
    const a = prog(l, 50.4, 50.9) * (1 - prog(l, 54.4, 55.2));
    memoryCard(c, fx, fy, 0.8, { label: "「頑張っていた」印象", glow: 0.5 * (1 - clamp(fallT)), fade: clamp(fallT * 0.8), rot: fallT * 1.4, alpha: a });
  }
  {
    const p1 = pathPos(Math.min(2.999, travel));
    const a = prog(l, 53.6, 54.1);
    const pp = 1 + clamp(prog(l, 53.76, 56.2)) * 1.999;
    const q = pathPos(pp);
    void p1;
    c.save(); c.globalAlpha *= a; c.translate(q.x, q.y); c.rotate(Math.sin(t * 2) * 0.04);
    c.fillStyle = "rgba(0,0,0,0.4)"; rr(c, -116, -66, 240, 140, 8); c.fill();
    c.fillStyle = C.paper; rr(c, -120, -70, 240, 140, 8); c.fill();
    c.fillStyle = C.ink; c.font = font(700, 26); c.textAlign = "center"; c.fillText("言葉にできる成果", 0, -24);
    c.font = font(500, 20); c.fillText("売上 +12%　／　納期 3日短縮", 0, 14);
    c.fillStyle = "#3A6A4A"; c.fillText("■■■■□", 0, 46);
    c.restore();
  }
  // geçitler: 成果 geçerken yeşil yanar
  for (let i = 0; i < 3; i++) {
    const at = 53.76 + (i - 0.5) * 1.22; if (i === 0) continue;
    const fl = win(l, at - 0.15, at + 0.4, 0.15);
    if (fl > 0) { c.save(); c.globalCompositeOperation = "lighter"; c.fillStyle = `rgba(140,220,160,${0.25 * fl})`; c.fillRect(LV[i].x + 160, LV[i].y - 300, 60, 300); c.restore(); }
  }
  c.restore();
  layer(c, ease.out(prog(l, 52.34, 52.9)) * (1 - prog(l, 55.6, 56.2)), () => stamp(c, 360, 200, "印象 ✕", 1, "#E2603A", -0.1, 50));
  layer(c, ease.out(prog(l, 54.2, 54.8)) * (1 - prog(l, 55.8, 56.3)), () => stamp(c, 1500, 900, "成果 ○", 1, C.yellow, 0.06, 50));
  layer(c, win(l, 41.0, 44.2, 0.4), () => boardLabel(c, 140, 110, "直属の上司 ≠ 最後に決める人", 1, C.mist));
}

// ================= F: 「やったことは、言葉にして」 — 上司が B'ye defter verir =================
const LIST = ["・障害の予兆を3件つぶした", "・引き継ぎ資料を整備", "・新人の質問に毎日対応", "・夜間アラートを先回り"];
function sceneAsk(c: Ctx, t: number) {
  const l = t - P12.at;
  const wIn = 1 - ease.out(prog(l, 56.1, 56.7));
  const k = ease.inOut(prog(l, 56.2, 64.6));
  const hand = ease.inOut(prog(l, 58.4, 59.4));
  c.save();
  dof(c, wIn * 16, () => {
    c.save();
    cam(c, t, lerp(1.06, 1.16, k), wIn * -1700 + lerp(-60, 60, k), lerp(10, -10, k), 0.5, 960, 600);
    envMeetingRoom(c, t, 5, l * 6);
    lightPool(c, 960, 600, 700, "rgba(255,210,150,", 0.16);
    drawPerson(c, 1340, 760, 1.2, { outfit: 4, tie: true, pose: "sit", rim: 0.8, rimSide: 1, facing: -0.6, eye: 1, gazeX: -0.8, armUp: 0.15 + 0.35 * hand * (1 - prog(l, 60.2, 60.8)), bob: breathe(t) * 0.6 });
    drawPerson(c, 580, 760, 1.2, { outfit: 2, pose: "sit", rim: 0.7, rimSide: -1, facing: 0.6, eye: 1, gazeX: 0.8, armUp: 0.2 + 0.1 * win(l, 61.0, 64.0, 0.3) * (0.5 + 0.5 * Math.sin(t * 14)), bob: breathe(t, 2) * 0.6 });
    meetingTable(c, 960, 790, 1300, 1);
    // defter: 上司'den B'ye kayar
    const nx = lerp(1220, 760, hand);
    c.save(); c.translate(nx, 772); c.rotate(lerp(0.1, -0.04, hand));
    c.fillStyle = "#2F3E52"; c.fillRect(-90, -12, 180, 12); c.fillStyle = C.paper; c.fillRect(-84, -16, 168, 6);
    c.restore();
    mug(c, t, 1120, 772, 0.8, 1);
    c.restore();
  });
  c.restore();
  // B'nin yazdığı liste (yakın inset — kâğıt)
  const la = ease.out(prog(l, 59.3, 59.9)) * (1 - prog(l, 63.9, 64.5));
  layer(c, la, () => {
    c.save(); c.translate(1500, 330); c.scale(0.85, 0.85); c.rotate(0.03);
    c.fillStyle = "rgba(0,0,0,0.45)"; rr(c, -264, -194, 540, 400, 8); c.fill();
    c.fillStyle = C.paper; rr(c, -270, -200, 540, 400, 8); c.fill();
    c.strokeStyle = "rgba(60,90,140,0.25)"; for (let i = 0; i < 7; i++) { c.beginPath(); c.moveTo(-250, -120 + i * 50); c.lineTo(250, -120 + i * 50); c.stroke(); }
    c.fillStyle = C.ink; c.font = font(700, 30, true); c.textAlign = "left"; c.fillText("やったこと", -240, -140);
    c.font = font(500, 28);
    LIST.forEach((s, i) => {
      const p = clamp(prog(l, 59.6 + i * 0.85, 60.4 + i * 0.85));
      if (p <= 0) return;
      c.fillText(s.slice(0, Math.max(1, Math.floor(p * s.length + 0.01))), -240, -80 + i * 56);
    });
    c.restore();
  });
  speechBubble(c, t, 960, 400, "言葉にして、伝えてほしい", prog(l, 60.64, 61.2) * (1 - prog(l, 63.6, 64.1)), { warm: 0.6, size: 38, tail: 1 });
  layer(c, ease.out(prog(l, 57.6, 58.2)) * (1 - prog(l, 63.6, 64.1)), () => boardLabel(c, 140, 110, "上と交渉する材料", 1, C.yellow));
}

// ================= G: 見ている人 ≠ 評価を決める人 — 二つの席 =================
function sceneSeats(c: Ctx, t: number) {
  const l = t - P12.at;
  const k = ease.inOut(prog(l, 64.2, 73.8));
  const split = ease.inOut(prog(l, 66.6, 67.6));
  const beam = ease.out(prog(l, 68.56, 69.4));
  c.save();
  cam(c, t, lerp(1.02, 1.1, k), lerp(60, -60, k), lerp(0, -20, k), 0.4, 960, 560);
  c.fillStyle = "#0C0F14"; c.fillRect(-600, -400, W + 1200, H + 800);
  // zemin + iki ayrı ışık havuzu
  const fg = c.createLinearGradient(0, 720, 0, H);
  fg.addColorStop(0, "#1C1F25"); fg.addColorStop(1, "#0E1013");
  c.fillStyle = fg; c.fillRect(-600, 720, W + 1200, 800);
  lightCone(c, 520, -100, Math.PI / 2, 0.3, 1000, 0.13);
  lightCone(c, 1460, -200, Math.PI / 2, 0.2, 900, 0.08, "190,205,235");
  // sol: 見る人 — 上司 koltukta, yanında Bさん çalışıyor
  armchair(c, 440, 860, 0.9, { col: "#4A3A2E", glow: 0.5 });
  drawPerson(c, 440, 820, 0.95, { outfit: 4, tie: true, pose: "sit", rim: 0.8, facing: 0.6, eye: 1, gazeX: 1, bob: breathe(t) * 0.5 });
  drawPerson(c, 760, 900, 0.85, { outfit: 2, pose: "desk", rim: 0.6, rimSide: -1, facing: -0.3, glow: beam * 0.9, bob: breathe(t, 2) * 0.5 });
  officeDesk(c, 800, 920, 0.8, 0.6, 0);
  gazeBeam(c, 465, 640, 760, 740, beam);
  // sağ: 決める人 — yüksek, uzak, cam arkasında
  dof(c, 3 + (1 - split) * 3, () => {
    c.fillStyle = "#1E232A"; c.fillRect(1240, 560, 460, 60);
    armchair(c, 1470, 560, 0.85, { col: "#22262C", tall: 1.25 });
    drawPerson(c, 1470, 520, 0.85, { outfit: 3, tie: true, pose: "sit", rim: 0.4, shade: 0.5, facing: -0.2 });
  });
  // cam bölme iner (同じではない)
  layer(c, split, () => {
    const y0 = lerp(-1100, 0, split);
    c.fillStyle = "rgba(150,180,210,0.08)"; c.fillRect(1100, y0 - 100, 40, H + 200);
    c.strokeStyle = "rgba(190,215,240,0.5)"; c.lineWidth = 3; c.strokeRect(1100, y0 - 100, 40, H + 200);
    c.fillStyle = "rgba(255,255,255,0.12)"; c.fillRect(1108, y0 - 100, 6, H + 200);
  });
  c.restore();
  layer(c, ease.out(prog(l, 64.44, 65.0)), () => { c.font = font(700, 50, true); c.textAlign = "center"; c.fillStyle = C.yellow; c.fillText("見ている人", 560, 180); });
  layer(c, ease.out(prog(l, 65.52, 66.1)), () => { c.font = font(700, 50, true); c.textAlign = "center"; c.fillStyle = C.text; c.fillText("評価を決める人", 1440, 180); });
  layer(c, ease.out(prog(l, 66.88, 67.4)), () => { c.font = font(800, 80, true); c.textAlign = "center"; c.fillStyle = C.mist; c.fillText("≠", 1000, 190); });
  check(c, 900, 560, prog(l, 71.46, 72.1), 1.3);
}

// ================= H: 見ること ≠ 数えること — göz ışığı sayaca ulaşmaz =================
function sceneCount(c: Ctx, t: number) {
  const l = t - P12.at;
  const k = ease.inOut(prog(l, 73.2, 78.9));
  const presses = [75.68, 76.2, 76.7];
  const pr = Math.max(...presses.map((p) => win(l, p - 0.02, p + 0.18, 0.08)));
  const wall = ease.out(prog(l, 76.84, 77.4));
  c.save();
  cam(c, t, lerp(1.08, 1.2, k), lerp(-30, 30, k), 0, 0.4, 960, 540);
  c.fillStyle = "#0B0E13"; c.fillRect(-600, -400, W + 1200, H + 800);
  dust(c, t, 40, 0.3, 61);
  // sol: göz + hafızadaki B (sarı)
  c.save(); c.translate(560, 520);
  const op = ease.out(prog(l, 74.2, 74.8));
  c.fillStyle = "#E8E6DE"; c.beginPath(); c.ellipse(0, 0, 150, 80 * op + 4, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = "#3A2A1C"; c.beginPath(); c.arc(0, 0, 54 * op, 0, Math.PI * 2); c.fill();
  c.fillStyle = "#0A0A0A"; c.beginPath(); c.arc(0, 0, 26 * op, 0, Math.PI * 2); c.fill();
  c.fillStyle = "rgba(255,255,255,0.8)"; c.beginPath(); c.arc(-16, -18, 9 * op, 0, Math.PI * 2); c.fill();
  c.restore();
  memoryCard(c, 560, 820, 0.8, { label: "Bさんの仕事", who: "B", glow: 0.9 * op });
  // ışın: sayaca doğru gider, cam duvarda durur
  const bk = ease.out(prog(l, 74.9, 75.6));
  const reach = lerp(720, 1080, bk);
  c.save(); c.globalCompositeOperation = "lighter";
  const gr = c.createLinearGradient(720, 0, reach, 0); gr.addColorStop(0, "rgba(242,207,58,0.35)"); gr.addColorStop(1, "rgba(242,207,58,0.08)");
  c.fillStyle = gr; c.beginPath(); c.moveTo(720, 500); c.lineTo(reach, 450); c.lineTo(reach, 590); c.lineTo(720, 540); c.fill();
  c.restore();
  // cam duvar (別のこと)
  layer(c, wall, () => {
    c.fillStyle = "rgba(150,180,210,0.1)"; c.fillRect(1080, lerp(-H, 0, wall), 30, H);
    c.strokeStyle = "rgba(200,220,245,0.6)"; c.lineWidth = 3; c.strokeRect(1080, lerp(-H, 0, wall), 30, H);
  });
  // sağ: sayaç 0000 — basılır ama sayı değişmez
  tallyCounter(c, 1440, 540, 1.3, 0, pr);
  c.restore();
  layer(c, ease.out(prog(l, 74.2, 74.8)), () => { c.font = font(700, 52, true); c.textAlign = "center"; c.fillStyle = C.yellow; c.fillText("見ること", 560, 170); });
  layer(c, ease.out(prog(l, 75.24, 75.8)), () => { c.font = font(700, 52, true); c.textAlign = "center"; c.fillStyle = C.text; c.fillText("数えること", 1440, 170); });
  layer(c, ease.out(prog(l, 77.1, 77.7)), () => { c.font = font(700, 40, true); c.textAlign = "center"; c.fillStyle = C.mist; c.fillText("別のこと", 1095, 960); });
}

// ================= I (12b): 二つの形 — iki satır, iki biçim =================
function sceneTwo(c: Ctx, t: number) {
  const l = t - P12b.at;
  const k = ease.inOut(prog(l, -0.4, 5.8));
  const r1 = ease.out(prog(l, 1.69, 2.3)), r2 = ease.out(prog(l, 2.1, 2.7));
  c.save();
  cam(c, t, lerp(1.06, 1.0, k), 0, lerp(-20, 10, k), 0.3, 960, 540);
  c.fillStyle = "#090B10"; c.fillRect(-600, -400, W + 1200, H + 800);
  // üst biçim: gölgede kalan figür (気づかれない)
  layer(c, r1, () => {
    c.fillStyle = "rgba(255,255,255,0.03)"; rr(c, 220, 170, 1480, 330, 16); c.fill();
    drawPerson(c, 420, 470, 0.85, { outfit: 2, pose: "desk", shade: 0.75, rim: 0.15, facing: 0.2 });
    c.font = font(700, 62, true); c.textAlign = "left"; c.fillStyle = C.mist; c.fillText("気づかれない", 700, 360);
  });
  // alt biçim: sarı ışıkta figür ama sayaç 0
  layer(c, r2, () => {
    c.fillStyle = "rgba(242,207,58,0.04)"; rr(c, 220, 560, 1480, 330, 16); c.fill();
    lightPool(c, 420, 760, 220, "rgba(242,207,58,", 0.3);
    drawPerson(c, 420, 860, 0.85, { outfit: 2, pose: "desk", rim: 0.6, glow: 0.8, facing: 0.2 });
    c.font = font(700, 62, true); c.textAlign = "left"; c.fillStyle = C.yellow; c.fillText("気づかれても、", 700, 740);
    c.fillStyle = C.text; c.fillText("数えられない", 1140, 740);
    tallyCounter(c, 1560, 820, 0.42, 0, 0);
  });
  c.restore();
  layer(c, ease.out(prog(l, 0.1, 0.8)), () => { c.font = font(600, 40, true); c.textAlign = "center"; c.fillStyle = C.text; c.fillText("見えない、二つの形", 960, 110); });
}

// ================= ÇİZİM =================
const SCENES: [number, number, (c: Ctx, t: number) => void, Lens][] = [
  [g(-0.8), g(10.0), sceneMeeting, LENS_ROOM],
  [g(9.4), g(21.6), sceneSheet, LENS_ROOM],
  [g(21.2), g(31.6), sceneVoices, LENS.night],
  [g(31.1), g(41.0), sceneLie, LENS_ROOM],
  [g(40.4), g(56.6), sceneChain, LENS_COLD],
  [g(56.0), g(64.6), sceneAsk, LENS_ROOM],
  [g(64.1), g(73.9), sceneSeats, LENS.night],
  [g(73.3), CARD_A + 0.6, sceneCount, LENS_COLD],
  [CARD_B - 0.4, END, sceneTwo, LENS.night],
];
const HARD = new Set<any>([sceneVoices, sceneAsk]); // whip-pan girişli

function draw(ctx: Ctx, t: number) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
  ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H);
  const active = SCENES.filter(([a, b]) => t >= a && t <= b);
  const L = active.length ? active[active.length - 1][3] : LENS.night;
  if (active.length) {
    lens(ctx, t, L, (c) => {
      for (const [a, , fn] of active) layer(c, HARD.has(fn) || a <= g(-0.8) ? 1 : ease.sine(prog(t, a, a + 0.6)), () => fn(c, t));
    });
  }
  whipStreaks(ctx, Math.sin(Math.PI * prog(t, g(21.15), g(21.95))), 1, 4);
  whipStreaks(ctx, Math.sin(Math.PI * prog(t, g(55.95), g(56.75))), -1, 6);
  sectionTitle(ctx, t, 0.0, 3.6, "06", "気づかれても、数えられない");
  screenCard(ctx, t, CARD_A, CARD_B + 0.2, { term: "気づかれない ／ 気づかれても、数えられない", size: 72 });
  drawSubtitles(ctx, parts, t);
  fadeBlack(ctx, 1 - prog(t, 0, 0.5));
  fadeBlack(ctx, prog(t, END - 1.6, END - 0.2));
}

// ================= SES EFEKTLERİ (eyleme bire bir) =================
const cues: Cue[] = [];
const cue = (t: number, type: string, gain = 1, p: Record<string, number> = {}) => cues.push({ t, type, gain, p });

cue(0.0, "room", 0.5, { d: END });
cue(0.35, "whoosh", 0.55, { d: 1.2 });
cue(g(0.4), "chair", 0.4);                                          // 上司 koltukta yerleşir
cue(g(4.36), "pop", 0.4); cue(g(5.66), "pop", 0.4);                 // sıcak balonlar
cue(g(4.5), "shimmer", 0.2, { f: 659 });
cue(g(10.0), "slide", 0.6, { d: 1.0 });                             // sheet masada kayar
cue(g(12.72), "hit", 0.5);                                          // 低かった: not düşer
cue(g(12.8), "pen", 0.35, { d: 0.4 });                              // kırmızı ok çizilir
cue(g(14.16), "pop", 0.3); cue(g(16.24), "pop", 0.3);
cue(g(18.5), "lowdrone", 0.3, { d: 2.4 });                          // あいまい: bulanıklaşır
cue(g(20.4), "folderclose", 0.7);                                   // 面談が終わる
cue(g(21.15), "whoosh", 0.8, { d: 0.8 });                           // whip-pan → ofis
cue(g(22.0), "murmur", 0.45, { d: 5.6 });                           // 働く人の声
for (let i = 0; i < 16; i++) cue(g(22.9 + (i < 6 ? i * 0.45 : 2.7 + (i - 6) * 0.22)), "pop", 0.16);
cue(g(25.5), "stamp", 0.6);                                         // 珍しくない
cue(g(27.7), "lowdrone", 0.3, { d: 3.6 });
cue(g(29.54), "thump", 0.4);                                        // ？
cue(g(32.9), "crack", 0.65);                                        // 嘘？: balon çatlar
cue(g(34.5), "mend", 0.55);                                         // 嘘ではなかった
cue(g(34.6), "checkmark", 0.4, { f: 784 });
cue(g(38.6), "riser", 0.3, { d: 2.2 });                             // kamera yukarı
for (let s = 41.0; s < 42.2; s += 0.4) cue(g(s), "step", 0.3);      // basamaklar
cue(g(42.6), "chair", 0.5);                                         // 最後に決める koltuk
cue(g(47.28), "pop", 0.3);
for (let i = 0; i < 3; i++) cue(g(49.6 + i * 0.18), "gate", 0.45);  // geçitler iner
cue(g(50.8), "paper", 0.4);
cue(g(52.34), "flutter", 0.6, { d: 2.0 });                          // 印象 düşer
cue(g(52.4), "stamp", 0.45);
for (let i = 1; i < 3; i++) cue(g(53.76 + (i - 0.5) * 1.22), "approve", 0.4, { f: 659 + i * 120 }); // 成果 geçer
cue(g(54.2), "stamp", 0.5);
cue(g(55.95), "whoosh", 0.8, { d: 0.8 });                           // whip-pan → 面談室
cue(g(58.4), "slide", 0.5, { d: 1.0 });                             // defter kayar
for (let i = 0; i < 4; i++) cue(g(59.6 + i * 0.85), "pen", 0.3, { d: 0.6 }); // liste yazılır
cue(g(60.64), "pop", 0.3);
cue(g(64.3), "chair", 0.35);
cue(g(65.6), "chair", 0.25);
cue(g(66.6), "glasswall", 0.6);                                     // 同じではない: cam iner
cue(g(68.56), "shimmer", 0.35, { f: 587 });                         // bakış ışını
cue(g(71.46), "checkmark", 0.4, { f: 880 });
cue(g(74.2), "blip", 0.3, { f: 520 });                              // göz açılır
for (const p of [75.68, 76.2, 76.7]) cue(g(p), "counter", 0.6);     // sayaç basılır, 0
cue(g(76.84), "glasswall", 0.55);                                   // 別のこと
cue(CARD_A, "whoosh", 0.4, { d: 1.2 });
cue(CARD_A + 0.5, "shimmer", 0.3, { f: 440 });
cue(CARD_B, "whoosh", 0.3, { d: 1.0 });
cue(gb(1.69), "cardrise", 0.35, { f: 440 }); cue(gb(2.1), "cardrise", 0.35, { f: 587 }); // iki biçim
cue(gb(2.9), "counter", 0.35);
cue(END - 1.7, "whoosh", 0.35, { d: 1.4 });

export const s06: Section = { id: "s06", duration: END, parts, cues, draw };
void lightPool; void lerp;
