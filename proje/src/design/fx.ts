// Parçacık / ışık efektleri: alev, duman, kıvılcım, söndürücü spreyi, alarm çakarı, whip-pan.
// Hepsi deterministik (t'ye bağlı), sahne dosyaları sadece çağırır.
import { W, H, rnd, clamp, lerp } from "../engine/core";

type Ctx = CanvasRenderingContext2D;
/** Çok frekanslı, yumuşak türbülans [-1,1] */
export const turb = (t: number, i: number, f = 1) =>
  Math.sin(t * 7.1 * f + i * 1.7) * 0.5 + Math.sin(t * 13.3 * f + i * 2.9) * 0.3 + Math.sin(t * 23.7 * f + i * 0.7) * 0.2;

/** Alev kümesi. (x,y) taban ortası, w genişlik, h boy, k şiddet 0..1 */
export function flame(c: Ctx, t: number, x: number, y: number, w: number, h: number, k: number, seed = 0) {
  if (k <= 0.01) return;
  c.save();
  // zemin ışığı
  const g0 = c.createRadialGradient(x, y - h * 0.3, 0, x, y - h * 0.3, h * 2.6);
  g0.addColorStop(0, `rgba(255,150,60,${0.35 * k})`); g0.addColorStop(0.4, `rgba(226,96,58,${0.12 * k})`); g0.addColorStop(1, "rgba(226,96,58,0)");
  c.fillStyle = g0; c.fillRect(x - h * 2.6, y - h * 3, h * 5.2, h * 4);
  c.globalCompositeOperation = "lighter";
  const layers = [
    { n: 7, sc: 1.0, col: ["rgba(200,50,20,", "rgba(226,96,58,"], a: 0.55 },
    { n: 6, sc: 0.78, col: ["rgba(240,120,40,", "rgba(255,170,60,"], a: 0.55 },
    { n: 5, sc: 0.5, col: ["rgba(255,200,90,", "rgba(255,240,190,"], a: 0.7 },
  ];
  layers.forEach((L, li) => {
    for (let i = 0; i < L.n; i++) {
      const u = (i / (L.n - 1) - 0.5) * 2; // -1..1
      const bx = x + u * w * 0.42 * L.sc;
      const hh = h * L.sc * k * (0.55 + 0.45 * (1 - Math.abs(u))) * (0.8 + 0.25 * turb(t, i + li * 10 + seed, 1.2));
      const ww = w * 0.22 * L.sc * (0.7 + 0.3 * k);
      const sway = turb(t * 0.8, i + seed + 30, 1) * ww * 0.9;
      const lick = turb(t, i + seed + 60, 1.6) * ww * 0.5;
      const gr = c.createLinearGradient(bx, y, bx, y - hh);
      gr.addColorStop(0, L.col[1] + L.a + ")"); gr.addColorStop(0.55, L.col[0] + L.a * 0.8 + ")"); gr.addColorStop(1, L.col[0] + "0)");
      c.fillStyle = gr;
      c.beginPath();
      c.moveTo(bx - ww, y);
      c.bezierCurveTo(bx - ww * 1.1, y - hh * 0.35, bx - ww * 0.3 + lick, y - hh * 0.6, bx + sway, y - hh);
      c.bezierCurveTo(bx + ww * 0.4 + lick, y - hh * 0.55, bx + ww * 1.1, y - hh * 0.3, bx + ww, y);
      c.closePath(); c.fill();
    }
  });
  // kopan alev dilimleri
  for (let i = 0; i < 6; i++) {
    const ph = (t * 1.6 + rnd(i, seed + 3)) % 1;
    const fx = x + (rnd(i, seed + 4) - 0.5) * w * 0.5 + turb(t, i, 0.7) * 8;
    const fy = y - h * k * (0.7 + ph * 0.9);
    const r = w * 0.05 * (1 - ph) * k;
    if (r <= 0.5) continue;
    c.fillStyle = `rgba(255,170,70,${0.6 * (1 - ph) * k})`;
    c.beginPath(); c.ellipse(fx, fy, r, r * 1.8, 0, 0, Math.PI * 2); c.fill();
  }
  c.restore();
}

/** Yükselen duman. a genel opaklık */
export function smoke(c: Ctx, t: number, x: number, y: number, spread: number, rise: number, a: number, seed = 0, n = 18, col = "48,50,56") {
  if (a <= 0.01) return;
  c.save();
  for (let i = 0; i < n; i++) {
    const ph = (t * 0.22 + rnd(i, seed)) % 1;
    const px = x + (rnd(i, seed + 1) - 0.5) * spread * 0.4 + ph * spread * (rnd(i, seed + 2) - 0.3) + Math.sin(t * 0.6 + i) * 20 * ph;
    const py = y - ph * rise;
    const r = 30 + ph * spread * 0.55;
    const al = a * Math.sin(Math.PI * ph) * 0.35;
    const g = c.createRadialGradient(px, py, 0, px, py, r);
    g.addColorStop(0, `rgba(${col},${al})`); g.addColorStop(1, `rgba(${col},0)`);
    c.fillStyle = g; c.beginPath(); c.arc(px, py, r, 0, Math.PI * 2); c.fill();
  }
  c.restore();
}

/** Kıvılcımlar (lighter) */
export function sparks(c: Ctx, t: number, x: number, y: number, k: number, seed = 0, n = 26, rise = 320) {
  if (k <= 0.01) return;
  c.save(); c.globalCompositeOperation = "lighter"; c.lineCap = "round";
  for (let i = 0; i < n; i++) {
    const ph = (t * (0.5 + rnd(i, seed) * 0.6) + rnd(i, seed + 1)) % 1;
    const vx = (rnd(i, seed + 2) - 0.5) * 160;
    const px = x + vx * ph + Math.sin(t * 5 + i) * 6, py = y - ph * rise * (0.6 + rnd(i, seed + 3) * 0.6);
    const al = k * (1 - ph) * (0.6 + 0.4 * Math.sin(t * 30 + i));
    c.strokeStyle = `rgba(255,${190 + 50 * rnd(i, 9) | 0},120,${al})`; c.lineWidth = 2.2;
    c.beginPath(); c.moveTo(px, py); c.lineTo(px - vx * 0.03, py + 10); c.stroke();
  }
  c.restore();
}

/** Söndürücü spreyi: (x0,y0) ağızlık → (x1,y1) hedef, koni şeklinde beyaz toz */
export function spray(c: Ctx, t: number, x0: number, y0: number, x1: number, y1: number, k: number, seed = 0) {
  if (k <= 0.01) return;
  c.save();
  const dx = x1 - x0, dy = y1 - y0, len = Math.hypot(dx, dy), nx = -dy / len, ny = dx / len;
  // çekirdek jet
  const jg = c.createLinearGradient(x0, y0, x1, y1);
  jg.addColorStop(0, `rgba(240,244,250,${0.75 * k})`); jg.addColorStop(1, "rgba(240,244,250,0)");
  c.fillStyle = jg; c.beginPath(); c.moveTo(x0 + nx * 4, y0 + ny * 4); c.lineTo(x1 + nx * 70, y1 + ny * 70); c.lineTo(x1 - nx * 70, y1 - ny * 70); c.lineTo(x0 - nx * 4, y0 - ny * 4); c.closePath(); c.fill();
  for (let i = 0; i < 90; i++) {
    const ph = (t * 2.4 + rnd(i, seed)) % 1;
    const sp = (rnd(i, seed + 1) - 0.5) * 2;
    const px = x0 + dx * ph + nx * sp * ph * 90 + Math.sin(t * 9 + i) * 4;
    const py = y0 + dy * ph + ny * sp * ph * 90;
    const r = 3 + ph * 26 * rnd(i, seed + 2);
    c.fillStyle = `rgba(232,238,246,${k * 0.35 * (1 - ph * 0.7)})`;
    c.beginPath(); c.arc(px, py, r, 0, Math.PI * 2); c.fill();
  }
  // hedefte yayılan bulut
  smoke(c, t * 1.6, x1, y1 + 20, 260, 180, k * 1.6, seed + 40, 12, "220,226,234");
  c.restore();
}

/** Alarm çakarı yoğunluğu 0..1 (dönen tepe lambası hissi) */
export const strobe = (t: number, f = 1.6) => Math.pow(Math.max(0, Math.sin(t * Math.PI * 2 * f)), 3);

/** Kırmızı alarm ışığı ekran kaplaması (dünya içinde, dönen huzme) */
export function alarmLight(c: Ctx, t: number, x: number, y: number, k: number) {
  if (k <= 0.01) return;
  const ang = t * 5.2;
  c.save(); c.globalCompositeOperation = "lighter";
  for (const off of [0, Math.PI]) {
    const a = ang + off;
    const g = c.createRadialGradient(x, y, 0, x, y, 1100);
    g.addColorStop(0, `rgba(255,70,40,${0.32 * k})`); g.addColorStop(1, "rgba(255,70,40,0)");
    c.fillStyle = g; c.beginPath(); c.moveTo(x, y); c.arc(x, y, 1100, a - 0.28, a + 0.28); c.closePath(); c.fill();
  }
  // lamba gövdesi
  c.fillStyle = `rgba(255,90,60,${0.6 + 0.4 * strobe(t)})`; c.beginPath(); c.arc(x, y, 14, Math.PI, 0); c.fill();
  c.restore();
  c.fillStyle = "#2A2D33"; c.fillRect(x - 20, y, 40, 8);
}

/** Kamera flaşı patlaması (yıldız + hale), k 0..1 sönüm */
export function flashPop(c: Ctx, x: number, y: number, k: number) {
  if (k <= 0.01) return;
  c.save(); c.globalCompositeOperation = "lighter";
  const g = c.createRadialGradient(x, y, 0, x, y, 70 * k + 10);
  g.addColorStop(0, `rgba(255,255,250,${0.75 * k})`); g.addColorStop(0.3, `rgba(255,240,210,${0.2 * k})`); g.addColorStop(1, "rgba(255,240,210,0)");
  c.fillStyle = g; c.beginPath(); c.arc(x, y, 80, 0, Math.PI * 2); c.fill();
  c.strokeStyle = `rgba(255,255,255,${0.4 * k})`; c.lineWidth = 2;
  for (let i = 0; i < 4; i++) { const a = i * Math.PI / 4 + 0.3; c.beginPath(); c.moveTo(x - Math.cos(a) * 40 * k, y - Math.sin(a) * 40 * k); c.lineTo(x + Math.cos(a) * 40 * k, y + Math.sin(a) * 40 * k); c.stroke(); }
  c.restore();
}

/** Whip-pan: k 0..1..0 hareket bulanıklığı; sahneyi yatay kaydırıp ışık çizgileri bırakır */
export function whipStreaks(c: Ctx, k: number, dir = 1, seed = 0) {
  if (k <= 0.01) return;
  c.save(); c.globalCompositeOperation = "lighter";
  for (let i = 0; i < 40; i++) {
    const y = rnd(i, seed) * H, len = 300 + rnd(i, seed + 1) * 900, x = rnd(i, seed + 2) * W;
    const g = c.createLinearGradient(x, 0, x + len * dir, 0);
    const warm = rnd(i, seed + 3) > 0.5;
    g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(0.5, warm ? `rgba(255,200,140,${0.12 * k})` : `rgba(150,190,240,${0.12 * k})`); g.addColorStop(1, "rgba(0,0,0,0)");
    c.fillStyle = g; c.fillRect(Math.min(x, x + len * dir), y, len, 2 + rnd(i, seed + 4) * 6);
  }
  c.restore();
}

/** Konfeti/kağıt parçacıkları (alkış anı) */
export function confetti(c: Ctx, t: number, t0: number, x: number, y: number, k: number, seed = 0) {
  const l = t - t0; if (l < 0 || k <= 0) return;
  c.save();
  for (let i = 0; i < 40; i++) {
    const vx = (rnd(i, seed) - 0.5) * 900, vy = -500 - rnd(i, seed + 1) * 500;
    const px = x + vx * l * 0.6, py = y + vy * l + 700 * l * l;
    const rot = l * (4 + rnd(i, seed + 2) * 8);
    c.save(); c.translate(px, py); c.rotate(rot); c.scale(1, Math.cos(rot * 1.3));
    c.globalAlpha *= k * clamp(1.6 - l * 0.7);
    c.fillStyle = ["#F2CF3A", "#E8EAEE", "#D9D4C7", "#F2CF3A"][i % 4]; c.fillRect(-6, -3, 12, 6);
    c.restore();
  }
  c.restore();
  void lerp;
}
