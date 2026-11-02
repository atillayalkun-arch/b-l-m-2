// "Lens" katmanı: nesneler kendi renkleriyle çizilir, sonra sahneye kamera/lens uygulanır.
// Sıra: dünya → offscreen → (renk grade + bloom + kromatik sapma + vinyet + grain) → ekran.
import { W, H, rnd } from "../engine/core";
import { vignette, grain } from "./style";

export interface Lens {
  shadow?: string;     // gölge tonu (split-toning)
  high?: string;       // ışık tonu
  tone?: number;       // grade şiddeti
  bloom?: number;      // 0..1
  ca?: number;         // kromatik sapma piksel
  vig?: number;
  grain?: number;
  exposure?: number;   // 1 = nötr
  sat?: number;        // doygunluk
}

let off: HTMLCanvasElement, offCtx: CanvasRenderingContext2D, bl: HTMLCanvasElement, blCtx: CanvasRenderingContext2D;
function init() {
  off = document.createElement("canvas"); off.width = W; off.height = H;
  offCtx = off.getContext("2d")!;
  bl = document.createElement("canvas"); bl.width = W / 4; bl.height = H / 4;
  blCtx = bl.getContext("2d")!;
}

export const LENS = {
  night: { shadow: "rgba(18,52,66,0.32)", high: "rgba(255,170,90,0.10)", bloom: 0.55, ca: 0, vig: 0.72, grain: 0.06, exposure: 1.0, sat: 0.92 } as Lens,
  doc: { shadow: "rgba(20,44,60,0.26)", high: "rgba(255,200,140,0.06)", bloom: 0.35, ca: 0, vig: 0.6, grain: 0.05, exposure: 1.02, sat: 0.85 } as Lens,
  gym: { shadow: "rgba(16,48,58,0.30)", high: "rgba(255,190,120,0.10)", bloom: 0.5, ca: 0, vig: 0.68, grain: 0.06, exposure: 1.0, sat: 0.9 } as Lens,
};

/** Dünyayı offscreen'e çizer, lensi uygular, ctx'e basar */
export function lens(ctx: CanvasRenderingContext2D, t: number, L: Lens, world: (c: CanvasRenderingContext2D) => void) {
  if (!off) init();
  const c = offCtx;
  c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.filter = "none"; c.globalCompositeOperation = "source-over";
  c.fillStyle = "#000"; c.fillRect(0, 0, W, H);
  world(c);
  c.restore();

  // ana görüntü (pozlama + doygunluk)
  ctx.save();
  ctx.filter = `brightness(${L.exposure ?? 1}) saturate(${L.sat ?? 1}) contrast(1.06)`;
  ctx.drawImage(off, 0, 0);
  ctx.filter = "none";
  // kromatik sapma: kırmızı/mavi kenar kayması (merkezden uzaklaştıkça)
  const ca = L.ca ?? 0;
  if (ca > 0) {
    ctx.globalCompositeOperation = "screen";
    ctx.globalAlpha = 0.10;
    ctx.filter = "sepia(1) saturate(6) hue-rotate(-50deg)";
    ctx.drawImage(off, -ca * 2, -ca, W + ca * 4, H + ca * 2);
    ctx.filter = "sepia(1) saturate(6) hue-rotate(170deg)";
    ctx.drawImage(off, ca * 2, ca, W - ca * 4, H - ca * 2);
    ctx.filter = "none";
    ctx.globalAlpha = 1;
  }
  // bloom: parlak bölgeler taşar
  const b = L.bloom ?? 0;
  if (b > 0) {
    blCtx.filter = "brightness(0.75) contrast(3.2) blur(6px)";
    blCtx.clearRect(0, 0, bl.width, bl.height);
    blCtx.drawImage(off, 0, 0, bl.width, bl.height);
    blCtx.filter = "none";
    ctx.globalCompositeOperation = "screen";
    ctx.globalAlpha = b;
    ctx.filter = "blur(10px)";
    ctx.drawImage(bl, 0, 0, W, H);
    ctx.filter = "none";
    ctx.globalAlpha = 1;
  }
  // split toning
  ctx.globalCompositeOperation = "soft-light";
  ctx.fillStyle = L.shadow ?? "rgba(0,0,0,0)"; ctx.fillRect(0, 0, W, H);
  ctx.globalCompositeOperation = "overlay";
  ctx.fillStyle = L.high ?? "rgba(0,0,0,0)"; ctx.fillRect(0, 0, W, H);
  ctx.globalCompositeOperation = "source-over";
  ctx.restore();
  vignette(ctx, L.vig ?? 0.7);
  grain(ctx, t, L.grain ?? 0.05);
}

/** El kamerası titremesi (düşük frekanslı, deterministik) */
export function shake(t: number, amp = 1) {
  const n = (f: number, s: number) => Math.sin(t * f + s) * 0.6 + Math.sin(t * f * 2.13 + s * 3) * 0.3 + Math.sin(t * f * 4.7 + s * 7) * 0.1;
  return { x: n(0.9, 1) * 4 * amp, y: n(1.1, 2) * 3 * amp, r: n(0.7, 3) * 0.0022 * amp };
}

/** Kamera: zoom + kaydırma + titreme + yuvarlanma */
export function cam(c: CanvasRenderingContext2D, t: number, zoom: number, dx: number, dy: number, sh = 1, cx = W / 2, cy = H / 2) {
  const s = shake(t, sh);
  c.translate(cx + dx + s.x, cy + dy + s.y);
  c.rotate(s.r);
  c.scale(zoom, zoom);
  c.translate(-cx, -cy);
}

/** Alan derinliği: blur ile çizilen katman */
export function dof(c: CanvasRenderingContext2D, px: number, fn: () => void) {
  c.save();
  if (px > 0.3) c.filter = `blur(${px.toFixed(1)}px)`;
  fn();
  c.restore();
}

/** Bokeh ışıkları (şehir / arka plan) */
export function bokeh(c: CanvasRenderingContext2D, t: number, n: number, y0: number, y1: number, seed: number, a = 0.5) {
  for (let i = 0; i < n; i++) {
    const x = rnd(i, seed) * W * 1.2 - W * 0.1;
    const y = y0 + rnd(i, seed + 1) * (y1 - y0);
    const r = 6 + rnd(i, seed + 2) * 22;
    const warm = rnd(i, seed + 3) > 0.45;
    const tw = 0.7 + 0.3 * Math.sin(t * (0.3 + rnd(i, seed + 4)) + i);
    const g = c.createRadialGradient(x, y, 0, x, y, r);
    const col = warm ? "255,190,110" : "150,200,255";
    g.addColorStop(0, `rgba(${col},${a * tw})`); g.addColorStop(0.7, `rgba(${col},${a * tw * 0.4})`); g.addColorStop(1, `rgba(${col},0)`);
    c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill();
  }
}
