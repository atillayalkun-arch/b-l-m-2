// ★ 方針を受け止める上司 — şemsiye kompozisyonu. s03'te doğar, s10'da AYNI kamera/yerleşimle döner.
// Dünya koordinatları sabittir: s10 aynı fonksiyonu lift=1 (şemsiye kalkar) ile çağırır.
import { clamp, lerp, rnd, ease, prog } from "../engine/core";
import { lightPool } from "../design/style";
import { drawPerson } from "../characters/people";
import { umbrella, umbrellaSurface, policyArrow, mug, plant } from "../characters/props";
import { officeDesk } from "../design/env";
import { sparks } from "../design/fx";

type Ctx = CanvasRenderingContext2D;
export const UMB = { bossX: 980, bossY: 650, bossS: 1.02, ux: 1052, uy: 120, R: 560, shaft: 320 };
export const TEAM = [
  { x: 420, out: 0 }, { x: 760, out: 2 }, { x: 1210, out: 5 }, { x: 1540, out: 1 },
];

export interface UmbrellaShotOpts {
  rate: (s: number) => number;  // ok yoğunluğu 0..1 (yerel zaman s)
  lift?: number;                 // 0 şemsiye korur … 1 şemsiye yok (s10)
  bossAlpha?: number;            // 上司 görünürlüğü (s10'da ayrılır)
  bossOutfit?: number;
  bossTie?: boolean;
  bossArm?: number;              // şemsiye kolu kalkıklığı 0..1
  calm?: number;                 // ekip sakinliği 1 … 0 panik
  seed?: number;
  glow?: number;                 // şemsiye/上司 sarı fark edilme
  n?: number;
  open?: number;                 // şemsiye açıklığı 0..1
}

/** l: kompozisyonun yerel zamanı (ok fiziği buna göre) */
export function umbrellaShot(c: Ctx, t: number, l: number, o: UmbrellaShotOpts) {
  const lift = o.lift ?? 0, bossA = o.bossAlpha ?? 1, calm = o.calm ?? 1, seed = o.seed ?? 0, N = o.n ?? 150;
  const ux = UMB.ux, uy = UMB.uy - lift * 760, R = UMB.R;
  const covered = lift < 0.25 && (o.open ?? 1) > 0.6 && (o.bossAlpha ?? 1) > 0.5;
  // ok olayları
  type A = { x: number; y: number; ang: number; a: number; streak: number; hitT: number; s: number };
  const arrows: A[] = [];
  let hitAmt = 0;
  const sparksAt: { x: number; y: number; k: number }[] = [];
  for (let i = 0; i < N; i++) {
    const s = i * 0.1 + rnd(i, seed + 1) * 0.09 - 1.2;
    const tau = l - s;
    if (tau < 0 || tau > 4.5) continue;
    if (rnd(i, seed + 2) > o.rate(s)) continue;
    const x0 = covered ? ux + (rnd(i, seed + 3) - 0.5) * 2 * R * 0.9 : 360 + rnd(i, seed + 3) * 1380;
    const wob = (rnd(i, seed + 4) - 0.5) * 0.25;
    const V = 1500 + rnd(i, seed + 5) * 500;
    const yFree = -260 + V * tau;
    const xFree = x0 + wob * V * tau * 0.3;
    const under = Math.abs(xFree - ux) < R * 0.98;
    const surf = umbrellaSurface(ux, uy, R, xFree);
    if (covered && under && yFree >= surf) {
      const th = (surf + 260) / V; const d = tau - th;
      const sd = Math.sign(xFree - ux) || 1;
      const vx = sd * (380 + 420 * Math.abs(xFree - ux) / R), vy = -260 - rnd(i, 6) * 200;
      const x = xFree + vx * d, y = surf + vy * d + 1700 * d * d;
      const ang = Math.atan2(vy + 3400 * d, vx);
      if (d < 0.12) hitAmt = Math.max(hitAmt, 1 - d / 0.12);
      if (d < 0.25) sparksAt.push({ x: xFree, y: surf, k: 1 - d / 0.25 });
      arrows.push({ x, y, ang, a: clamp(1.2 - d * 1.1), streak: 0, hitT: d, s });
    } else {
      // engelsiz: masalara / zemine saplanır
      const ground = 800 + rnd(i, seed + 7) * 90;
      const y = Math.min(yFree, ground);
      const stuck = yFree >= ground;
      arrows.push({ x: xFree, y, ang: Math.PI / 2 + wob * 0.3, a: stuck ? clamp(1 - (tau - (ground + 260) / V - 3) * 0.8) : 1, streak: stuck ? 0 : 1, hitT: -1, s });
    }
  }
  // sığınak ışığı (şemsiye altı sıcak)
  const shelter = (1 - lift) * bossA;
  lightPool(c, 980, 820, 820, "rgba(255,206,140,", 0.16 * shelter * calm + 0.04);
  // 上司 (arka plan, ekip masalarının arkasında)
  const arm = o.bossArm ?? 1;
  const bob = -hitAmt * 6 * (1 - lift);
  if (bossA > 0.01) {
    drawPerson(c, UMB.bossX, UMB.bossY + bob * 0.4, UMB.bossS, { outfit: o.bossOutfit ?? 4, tie: o.bossTie ?? true, armUp: arm, rim: 1, rimSide: -1, facing: 0, alpha: bossA, glow: o.glow ?? 0, bob: Math.sin(t * 1.4) * 1.5 });
  }
  // şemsiye
  if (lift < 0.98 && bossA > 0.01) {
    c.save(); c.globalAlpha *= clamp((1 - lift) * 1.4) * bossA;
    umbrella(c, ux + lift * 260, uy + bob, R, { open: o.open ?? 1, tilt: -0.02 + lift * 0.5 + Math.sin(t * 1.3) * 0.006 - hitAmt * 0.012, hit: hitAmt, shaft: UMB.shaft, glow: o.glow ?? 0 });
    c.restore();
  }
  // oklar
  arrows.forEach((a) => policyArrow(c, a.x, a.y, 0.62, a.ang, a.a, "方針", a.streak));
  sparksAt.forEach((sp, i) => { sparks(c, t, sp.x, sp.y, sp.k * 0.5, 700 + i, 6, 80); });
  // ekip: masalarda, sakin (ya da panik)
  TEAM.forEach((m, i) => {
    const panic = 1 - calm;
    const jitter = panic * Math.sin(t * 9 + i * 2) * 4;
    drawPerson(c, m.x + jitter, 880, 0.8, { pose: "sit", outfit: m.out, rim: 0.7, rimSide: m.x < 960 ? 1 : -1, facing: lerp(m.x < 960 ? 0.3 : -0.3, (i % 2 ? 1 : -1), panic * 0.8), bob: Math.sin(t * 1.6 + i * 1.3) * 2 * calm - panic * 3 * Math.abs(Math.sin(t * 7 + i)), armUp: panic * 0.6 * (0.5 + 0.5 * Math.sin(t * 5 + i)), eye: 1, gazeX: panic > 0.3 ? (i % 2 ? 1 : -1) : 0 });
    officeDesk(c, m.x, 892, 0.78, 0.8 + 0.08 * Math.sin(t * 2 + i), i === 1 || i === 3 ? 1 : 0);
    if (i === 0) mug(c, t, m.x + 120, 870, 0.9, calm);
    if (i === 2) plant(c, t, m.x + 135, 872, 0.75);
    // panikte uçuşan kağıtlar
    if (panic > 0.05) for (let k = 0; k < 4; k++) {
      const ph = (t * 0.8 + rnd(k, i + 50)) % 1;
      c.save(); c.globalAlpha *= panic * (1 - ph);
      c.translate(m.x - 80 + k * 50 + ph * 60 * (k % 2 ? 1 : -1), 820 - ph * 160); c.rotate(ph * 4 + k);
      c.fillStyle = "#D8D1BE"; c.fillRect(-16, -11, 32, 22); c.restore();
    }
  });
  return { hit: hitAmt };
}

/** Yardımcı: belirli zamanlarda patlayan ok yağmuru oranı */
export const burstRate = (bursts: number[], base = 0.08, width = 1.4) => (s: number) => {
  let r = base;
  for (const b of bursts) r = Math.max(r, ease.sine(prog(s, b - 0.2, b + 0.3)) * (1 - prog(s, b + width * 0.6, b + width)));
  return r;
};
