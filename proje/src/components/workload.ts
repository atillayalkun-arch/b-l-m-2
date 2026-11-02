// İş yükü motifleri (s07): 報酬 kutusu, görev kartı, kart yığını, gelen/giden tepsi, ağırlık torbası.
// s08/s10/s11'de tekrar kullanılabilir.
import { C, font, rr } from "../design/style";
import { clamp, ease, lerp, rnd } from "../engine/core";
type Ctx = CanvasRenderingContext2D;

const TASKS = ["資料作成", "確認お願い", "急ぎ", "引き継ぎ", "レビュー", "至急対応", "集計", "調整", "議事録", "見積", "再提出", "問い合わせ"];
export const taskLabel = (i: number) => TASKS[Math.abs(i) % TASKS.length];

/** Görev kartı. grey: 0 = taze kâğıt, 1 = griye solmuş (当たり前) */
export function taskCard(c: Ctx, x: number, y: number, s: number, o: { label?: string; rot?: number; grey?: number; alpha?: number; glow?: number; urgent?: number } = {}) {
  const al = o.alpha ?? 1; if (al <= 0.003) return;
  const g = clamp(o.grey ?? 0), gl = o.glow ?? 0;
  c.save(); c.globalAlpha *= al; c.translate(x, y); c.rotate(o.rot ?? 0); c.scale(s, s);
  if (gl > 0) { const r = c.createRadialGradient(0, 0, 10, 0, 0, 160); r.addColorStop(0, `rgba(242,207,58,${0.35 * gl})`); r.addColorStop(1, "rgba(242,207,58,0)"); c.fillStyle = r; c.fillRect(-170, -170, 340, 340); }
  c.fillStyle = "rgba(0,0,0,0.4)"; rr(c, -72, -44, 150, 96, 5); c.fill();
  const pr = Math.round(lerp(220, 92, g)), pg = Math.round(lerp(214, 96, g)), pb = Math.round(lerp(198, 104, g));
  c.fillStyle = `rgb(${pr},${pg},${pb})`; rr(c, -75, -48, 150, 96, 5); c.fill();
  // üst şerit (renk → gri)
  const u = o.urgent ?? 0;
  c.fillStyle = g > 0.5 ? "rgba(70,76,86,0.9)" : u > 0.5 ? "#B5543A" : "#3E5F86"; c.fillRect(-75, -48, 150, 16);
  // klips
  c.fillStyle = "#8D949E"; c.fillRect(-12, -54, 24, 10);
  c.fillStyle = `rgba(26,29,36,${lerp(0.9, 0.45, g)})`;
  c.font = font(700, 20); c.textAlign = "center"; c.fillText(o.label ?? "", 0, -6);
  c.fillStyle = `rgba(26,29,36,${lerp(0.35, 0.18, g)})`;
  for (let i = 0; i < 3; i++) c.fillRect(-58, 10 + i * 11, 116 - i * 26, 4);
  c.restore();
}

/** Dikey kart yığını, taban (x,y). n kesirli olabilir (son kart iner). */
export function cardStack(c: Ctx, t: number, x: number, y: number, s: number, n: number, o: { grey?: number; sway?: number; seed?: number; alpha?: number; glowTop?: number } = {}) {
  const seed = o.seed ?? 0, sw = o.sway ?? 0;
  const full = Math.floor(n), frac = n - full;
  for (let i = 0; i < full + (frac > 0 ? 1 : 0); i++) {
    const h = i * 13 * s;
    const sway = sw * Math.sin(t * 1.4 + i * 0.07) * (i / 40) * 26;
    let yy = y - h, a = 1;
    if (i === full) { yy -= (1 - ease.out(frac)) * 120 * s; a = clamp(frac * 3); }
    // tek tek kâğıt kenarları (yan görünüş)
    c.save(); c.globalAlpha *= a * (o.alpha ?? 1);
    const g = clamp((o.grey ?? 0) + (rnd(i, seed) - 0.5) * 0.2);
    const v = Math.round(lerp(188, 92, g));
    c.translate(x + sway + (rnd(i, seed + 1) - 0.5) * 14 * s, yy); c.rotate((rnd(i, seed + 2) - 0.5) * 0.06);
    c.fillStyle = `rgb(${v},${v - 4},${v - 14})`; c.fillRect(-80 * s, -12 * s, 160 * s, 11 * s);
    c.fillStyle = "rgba(0,0,0,0.28)"; c.fillRect(-80 * s, -2 * s, 160 * s, 2 * s);
    c.fillStyle = g > 0.5 ? "rgba(70,76,86,0.8)" : i % 5 === 0 ? "#B5543A" : "#3E5F86"; c.fillRect(-80 * s, -12 * s, 10 * s, 11 * s);
    c.restore();
  }
  if ((o.glowTop ?? 0) > 0) {
    const top = y - n * 13 * s;
    const r = c.createRadialGradient(x, top, 10, x, top, 200 * s); r.addColorStop(0, `rgba(242,207,58,${0.3 * (o.glowTop ?? 0)})`); r.addColorStop(1, "rgba(242,207,58,0)");
    c.fillStyle = r; c.fillRect(x - 220 * s, top - 220 * s, 440 * s, 440 * s);
  }
}

/** 報酬 hediye kutusu. ribbon 1 = bağlı → 0 çözülmüş; open 0..1 kapak kalkar */
export function rewardBox(c: Ctx, t: number, x: number, y: number, s: number, o: { open?: number; ribbon?: number; glow?: number; label?: string; inner?: number } = {}) {
  const op = clamp(o.open ?? 0), rb = clamp(o.ribbon ?? 1), gl = o.glow ?? 0;
  c.save(); c.translate(x, y); c.scale(s, s);
  if (gl > 0) { const r = c.createRadialGradient(0, -90, 20, 0, -90, 360); r.addColorStop(0, `rgba(242,207,58,${0.28 * gl})`); r.addColorStop(1, "rgba(242,207,58,0)"); c.fillStyle = r; c.fillRect(-380, -460, 760, 760); }
  // gölge
  c.fillStyle = "rgba(0,0,0,0.45)"; c.beginPath(); c.ellipse(0, 6, 190, 22, 0, 0, Math.PI * 2); c.fill();
  // gövde
  const bg = c.createLinearGradient(-160, 0, 160, 0); bg.addColorStop(0, "#1F2E44"); bg.addColorStop(0.5, "#2C4262"); bg.addColorStop(1, "#18243A");
  c.fillStyle = bg; c.fillRect(-160, -180, 320, 180);
  c.fillStyle = "rgba(255,255,255,0.05)"; c.fillRect(-160, -180, 320, 10);
  // iç ışık (açılınca)
  if (op > 0 && (o.inner ?? 0) > 0) { c.save(); c.globalCompositeOperation = "lighter"; const r = c.createRadialGradient(0, -180, 10, 0, -180, 260); r.addColorStop(0, `rgba(230,236,255,${0.35 * op * (o.inner ?? 0)})`); r.addColorStop(1, "rgba(230,236,255,0)"); c.fillStyle = r; c.fillRect(-300, -460, 600, 300); c.restore(); }
  // dikey kurdele (gövde)
  c.fillStyle = "#C9A23A"; c.globalAlpha *= 1; c.fillRect(-18, -180, 36, 180 * lerp(0.15, 1, rb));
  c.fillStyle = "#C9A23A"; c.fillRect(-160, -104, 320 * lerp(0.1, 1, rb), 30);
  // kapak
  c.save();
  c.translate(lerp(0, 120, ease.out(op)), lerp(-180, -420, ease.out(op))); c.rotate(lerp(0, 0.5, ease.out(op)));
  c.fillStyle = "#33496B"; c.fillRect(-176, -46, 352, 46);
  c.fillStyle = "rgba(255,255,255,0.08)"; c.fillRect(-176, -46, 352, 6);
  c.fillStyle = "#C9A23A"; c.fillRect(-18, -46, 36, 46);
  // fiyonk: bağlıyken iki halka, çözülünce sarkan şeritler
  c.strokeStyle = "#E0B948"; c.lineWidth = 12; c.lineCap = "round";
  if (rb > 0.02) {
    c.globalAlpha *= rb;
    c.beginPath(); c.ellipse(-44, -66, 44 * rb, 24, -0.3, 0, Math.PI * 2); c.stroke();
    c.beginPath(); c.ellipse(44, -66, 44 * rb, 24, 0.3, 0, Math.PI * 2); c.stroke();
    c.fillStyle = "#E0B948"; c.beginPath(); c.arc(0, -56, 14, 0, Math.PI * 2); c.fill();
    c.globalAlpha /= rb;
  }
  if (rb < 0.98) {
    c.globalAlpha *= 1 - rb; const sw = Math.sin(t * 3) * 10;
    c.beginPath(); c.moveTo(0, -46); c.quadraticCurveTo(-60 + sw, 20, -40 + sw, 90); c.stroke();
    c.beginPath(); c.moveTo(0, -46); c.quadraticCurveTo(70 - sw, 10, 90 - sw, 70); c.stroke();
  }
  c.restore();
  // etiket kartı
  if (o.label) {
    c.save(); c.translate(110, -40); c.rotate(0.12);
    c.fillStyle = C.paper; rr(c, -62, -26, 124, 52, 6); c.fill();
    c.fillStyle = C.ink; c.font = font(700, 28, true); c.textAlign = "center"; c.fillText(o.label, 0, 10);
    c.restore();
  }
  c.restore();
}

/** Gelen/giden tepsiler: inN / outN kart sayısı */
export function inOutTray(c: Ctx, t: number, x: number, y: number, s: number, inN: number, outN: number, o: { outGrey?: number } = {}) {
  c.save(); c.translate(x, y); c.scale(s, s);
  for (const [dx, lb] of [[-120, "IN"], [120, "OUT"]] as [number, string][]) {
    c.fillStyle = "#2A2F37"; c.fillRect(dx - 100, -18, 200, 18);
    c.fillStyle = "#3A404A"; c.fillRect(dx - 104, -24, 208, 6);
    c.fillStyle = "rgba(200,206,214,0.5)"; c.font = font(700, 14); c.textAlign = "center"; c.fillText(lb, dx, -2);
  }
  cardStack(c, t, -120, -26, 1.1, inN, { seed: 3, sway: 0.2 });
  cardStack(c, t, 120, -26, 1.1, outN, { seed: 7, grey: o.outGrey ?? 0 });
  c.restore();
}

/** Kum torbası benzeri ağırlık (重荷). drop 0..1 iniş */
export function burdenSack(c: Ctx, x: number, y: number, s: number, label = "重荷", alpha = 1) {
  if (alpha <= 0) return;
  c.save(); c.globalAlpha *= alpha; c.translate(x, y); c.scale(s, s);
  const g = c.createLinearGradient(-120, 0, 120, 0); g.addColorStop(0, "#3A342C"); g.addColorStop(0.5, "#5A5044"); g.addColorStop(1, "#2C2720");
  c.fillStyle = g; c.beginPath();
  c.moveTo(-40, -150); c.quadraticCurveTo(-130, -110, -130, -30); c.quadraticCurveTo(-130, 30, 0, 30); c.quadraticCurveTo(130, 30, 130, -30); c.quadraticCurveTo(130, -110, 40, -150); c.closePath(); c.fill();
  c.fillStyle = "#2A251F"; c.fillRect(-46, -168, 92, 22);
  c.strokeStyle = "rgba(0,0,0,0.3)"; c.lineWidth = 3;
  for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(-100 + i * 18, -110 + i * 10); c.quadraticCurveTo(-20, -60 + i * 22, 90 - i * 10, -100 + i * 26); c.stroke(); }
  c.fillStyle = "rgba(232,234,238,0.75)"; c.font = font(800, 54, true); c.textAlign = "center"; c.fillText(label, 0, -38);
  c.restore();
}
