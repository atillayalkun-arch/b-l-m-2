// Görsel dil: "Karanlık gözlem odası". Tüm bölümler bu değerleri kullanır.
import { W, H, rnd, clamp } from "./core";

export const C = {
  bg: "#0B0E14",
  bg2: "#121722",
  steel: "#1E2836",
  steel2: "#2B3748",
  grey: "#5B6678",
  mist: "#8C97A8",
  paper: "#D9D4C7",
  paperDim: "#A9A497",
  ink: "#1A1D24",
  text: "#E8EAEE",
  textDim: "rgba(232,234,238,0.55)",
  yellow: "#F2CF3A",     // sarı = görülen / hatırlanan
  yellowDeep: "#C99A12",
  yellowGlow: "rgba(242,207,58,",
  alarm: "#E2603A",      // sadece yangın/alarm
  coat: "#1F2633",
  coat2: "#2A3343",
  hat: "#4A3B2C",
  hat2: "#5E4A36",
};

export const F = {
  sans: '"Noto Sans CJK JP", "Noto Sans JP", sans-serif',
  serif: '"Noto Serif CJK JP", "Noto Serif JP", serif',
};
export const font = (w: number, px: number, serif = false) => `${w} ${px}px ${serif ? F.serif : F.sans}`;

export const rgba = (hex: string, a: number) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
};

/** Zemin: hafif mavimsi koyu gradyan */
export function background(ctx: CanvasRenderingContext2D, tone = 0) {
  const g = ctx.createRadialGradient(W / 2, H * 0.45, 100, W / 2, H / 2, W * 0.75);
  g.addColorStop(0, tone ? "#151B27" : "#111620");
  g.addColorStop(1, C.bg);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

/** Vinyet */
export function vignette(ctx: CanvasRenderingContext2D, strength = 0.75) {
  const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, W * 0.72);
  g.addColorStop(0, "rgba(0,0,0,0)");
  g.addColorStop(1, `rgba(0,0,0,${strength})`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

/** Tek ışık kaynağı: yumuşak ışık havuzu */
export function lightPool(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color = "rgba(255,226,160,", a = 0.22) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, color + a + ")");
  g.addColorStop(0.5, color + a * 0.35 + ")");
  g.addColorStop(1, color + "0)");
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
}

/** Konik ışık (lamba / el feneri) */
export function lightCone(ctx: CanvasRenderingContext2D, x: number, y: number, ang: number, spread: number, len: number, a = 0.18, color = "255,226,160") {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  const g = ctx.createLinearGradient(0, 0, len, 0);
  g.addColorStop(0, `rgba(${color},${a})`);
  g.addColorStop(1, `rgba(${color},0)`);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(len, -Math.tan(spread) * len);
  ctx.lineTo(len, Math.tan(spread) * len);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/** Yavaş süzülen toz partikülleri */
export function dust(ctx: CanvasRenderingContext2D, t: number, n = 60, a = 0.35, seed = 1) {
  ctx.save();
  for (let i = 0; i < n; i++) {
    const sx = rnd(i, seed) * W, sy = rnd(i, seed + 7) * H;
    const sp = 4 + rnd(i, seed + 3) * 10;
    const x = (sx + Math.sin(t * 0.2 + i) * 30 + t * sp * 0.6) % W;
    const y = (sy - t * sp + H * 10) % H;
    const r = 0.8 + rnd(i, seed + 5) * 1.8;
    const tw = 0.5 + 0.5 * Math.sin(t * (0.5 + rnd(i, seed + 9)) + i);
    ctx.fillStyle = `rgba(230,225,210,${a * tw * (0.3 + rnd(i, seed + 11) * 0.7)})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// Film grain: önceden üretilmiş 6 doku, kare kare döner
let grainTiles: HTMLCanvasElement[] | null = null;
function makeGrain() {
  grainTiles = [];
  for (let k = 0; k < 6; k++) {
    const c = document.createElement("canvas");
    c.width = 256; c.height = 256;
    const g = c.getContext("2d")!;
    const im = g.createImageData(256, 256);
    for (let i = 0; i < 256 * 256; i++) {
      const v = Math.floor(rnd(i, k * 131 + 17) * 255);
      im.data[i * 4] = im.data[i * 4 + 1] = im.data[i * 4 + 2] = v;
      im.data[i * 4 + 3] = 255;
    }
    g.putImageData(im, 0, 0);
    grainTiles.push(c);
  }
}
export function grain(ctx: CanvasRenderingContext2D, t: number, a = 0.045) {
  if (!grainTiles) makeGrain();
  const tile = grainTiles![Math.floor(t * 24) % 6];
  ctx.save();
  ctx.globalAlpha = a;
  ctx.globalCompositeOperation = "overlay";
  const p = ctx.createPattern(tile, "repeat")!;
  ctx.fillStyle = p;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
}

/** Kamera: merkez etrafında ölçek + kaydırma */
export function camera(ctx: CanvasRenderingContext2D, zoom: number, dx = 0, dy = 0, cx = W / 2, cy = H / 2) {
  ctx.translate(cx + dx, cy + dy);
  ctx.scale(zoom, zoom);
  ctx.translate(-cx, -cy);
}

/** Tam ekran siyah (bölüm başı/sonu temiz kare) */
export function fadeBlack(ctx: CanvasRenderingContext2D, a: number) {
  if (a <= 0) return;
  ctx.fillStyle = `rgba(0,0,0,${clamp(a)})`;
  ctx.fillRect(0, 0, W, H);
}

/** Soruşturma panosu ızgarası (belgesel mod) */
export function boardGrid(ctx: CanvasRenderingContext2D, a = 1) {
  ctx.save();
  ctx.globalAlpha = a;
  ctx.strokeStyle = "rgba(140,151,168,0.07)";
  ctx.lineWidth = 1;
  for (let x = 0; x <= W; x += 60) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
  for (let y = 0; y <= H; y += 60) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  ctx.restore();
}

/** Yuvarlatılmış dikdörtgen yolu */
export function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
