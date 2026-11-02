// Hafıza motifi ortak parçaları (s04'te doğdu; s08/s09/s11'de tekrar kullanılabilir).
//  drawerCabinet() — ahşap "hafıza çekmecesi" dolabı (çekmece açılır, içinde kart sekmeleri)
//  nameChip()      — isim listesi kâğıt şeridi (有名人 = sarı yıldız + parlak kenar / 無名 = soluk)
//  balanceScale()  — pirinç terazi (kiriş eğimi + sallanan kefeler, içerik callback ile)
//  dustPuff()      — boş çekmeceden kalkan toz bulutu
import { clamp, ease, lerp, rnd } from "../engine/core";
import { C, font, rr, lightPool } from "../design/style";

type Ctx = CanvasRenderingContext2D;

function woodGrain(c: Ctx, x: number, y: number, w: number, h: number, base: string, seed: number) {
  c.fillStyle = base; c.fillRect(x, y, w, h);
  c.strokeStyle = "rgba(0,0,0,0.16)"; c.lineWidth = 1.2;
  for (let i = 0; i < Math.max(3, h / 9); i++) {
    const yy = y + 4 + rnd(i, seed) * (h - 8);
    c.beginPath(); c.moveTo(x, yy);
    c.bezierCurveTo(x + w * 0.3, yy + (rnd(i, seed + 1) - 0.5) * 8, x + w * 0.7, yy + (rnd(i, seed + 2) - 0.5) * 8, x + w, yy);
    c.stroke();
  }
}

export interface DrawerOpts {
  cols?: number; rows?: number;
  open?: (i: number) => number;          // çekmece başına 0..1 açıklık
  cards?: (i: number) => number;         // çekmecedeki kart sayısı (0 = boş)
  glow?: (i: number) => number;          // kart sekmelerinin sarı parlaması
  labels?: (i: number) => string;        // pirinç etiket yazısı
  riffle?: number;                       // kartların karıştırılma fazı (0 = durgun)
  t?: number;
}

/** Hafıza çekmecesi dolabı. (x,y) = dolabın alt orta noktası, ölçek 1'de 520×640 px. */
export function drawerCabinet(c: Ctx, x: number, y: number, s: number, o: DrawerOpts = {}) {
  const cols = o.cols ?? 3, rows = o.rows ?? 4, t = o.t ?? 0;
  const Wc = 520, Hc = 640, dw = (Wc - 40) / cols, dh = (Hc - 60) / rows;
  c.save(); c.translate(x, y); c.scale(s, s);
  // gölge
  c.fillStyle = "rgba(0,0,0,0.45)"; c.beginPath(); c.ellipse(0, 4, Wc * 0.62, 26, 0, 0, Math.PI * 2); c.fill();
  // gövde
  woodGrain(c, -Wc / 2, -Hc, Wc, Hc, "#4A3322", 11);
  c.fillStyle = "#5C412B"; c.fillRect(-Wc / 2 - 12, -Hc - 18, Wc + 24, 22);
  c.fillStyle = "#2A1C12"; c.fillRect(-Wc / 2, -Hc + 4, Wc, 6);
  c.fillStyle = "#24170E"; c.fillRect(-Wc / 2 + 6, -24, Wc - 12, 24);
  const order: number[] = [];
  for (let i = 0; i < cols * rows; i++) order.push(i);
  // önce kapalılar, sonra açıklar (açık çekmece önde)
  order.sort((a, b) => (o.open?.(a) ?? 0) - (o.open?.(b) ?? 0));
  for (const i of order) {
    const cx = -Wc / 2 + 20 + (i % cols) * dw, cy = -Hc + 30 + Math.floor(i / cols) * dh;
    const op = clamp(o.open?.(i) ?? 0);
    // çekmece boşluğu
    c.fillStyle = "#140D08"; c.fillRect(cx + 4, cy + 4, dw - 8, dh - 8);
    const pull = op * 1.0; // dışarı çıkış: aşağı ve büyüyerek (perspektif)
    const sc = 1 + 0.22 * pull, oy = 46 * pull;
    c.save(); c.translate(cx + dw / 2, cy + dh / 2 + oy); c.scale(sc, sc);
    if (op > 0.02) {
      // açık kutu: iç yüzey + kart sekmeleri
      c.fillStyle = "#2B1D13"; c.fillRect(-dw / 2 + 6, -dh / 2 - 40 * pull, dw - 12, 40 * pull + 8);
      const n = o.cards?.(i) ?? 0, gl = o.glow?.(i) ?? 0;
      for (let k = 0; k < n; k++) {
        const kx = -dw / 2 + 16 + (k / Math.max(1, n)) * (dw - 34);
        const rf = (o.riffle ?? 0) > 0 ? Math.max(0, Math.sin((o.riffle ?? 0) * 9 - k * 0.7)) * 26 : 0;
        const hgt = 30 * pull + rf;
        c.fillStyle = gl > 0 && rnd(k, i) < 0.5 ? `rgb(${lerp(217, 250, gl)},${lerp(212, 222, gl)},${lerp(199, 120, gl)})` : (k % 2 ? C.paper : C.paperDim);
        c.fillRect(kx, -dh / 2 - hgt + 4, 8, hgt + 6);
        if (k % 4 === 0) { c.fillStyle = "#8A7A5A"; c.fillRect(kx - 2, -dh / 2 - hgt, 12, 7); }
      }
      if (gl > 0) lightPool(c, 0, -dh / 2 - 10, dw * 0.7, "rgba(242,207,58,", 0.22 * gl);
    }
    // ön yüz
    woodGrain(c, -dw / 2 + 4, -dh / 2 + 4, dw - 8, dh - 8, op > 0.02 ? "#6A4A31" : "#5A3F29", 30 + i);
    c.strokeStyle = "rgba(0,0,0,0.5)"; c.lineWidth = 2; c.strokeRect(-dw / 2 + 4, -dh / 2 + 4, dw - 8, dh - 8);
    c.strokeStyle = "rgba(255,220,170,0.08)"; c.beginPath(); c.moveTo(-dw / 2 + 6, -dh / 2 + 6); c.lineTo(dw / 2 - 6, -dh / 2 + 6); c.stroke();
    // pirinç etiket çerçevesi + kulp
    c.fillStyle = "#B08A4A"; rr(c, -46, -dh / 2 + 18, 92, 34, 3); c.fill();
    c.fillStyle = "#E6DFCB"; c.fillRect(-40, -dh / 2 + 23, 80, 24);
    const lb = o.labels?.(i);
    if (lb) { c.fillStyle = C.ink; c.font = font(600, lb.length > 4 ? 13 : 16); c.textAlign = "center"; c.fillText(lb, 0, -dh / 2 + 41); }
    c.fillStyle = "#8F6E38"; rr(c, -30, dh / 2 - 44, 60, 14, 7); c.fill();
    c.fillStyle = "rgba(255,230,170,0.5)"; c.fillRect(-26, dh / 2 - 43, 52, 3);
    c.restore();
  }
  void t;
  c.restore();
}

/** İsim şeridi. famous 0..1: sarı yıldız + parlak kenar. dim: soluk/bulanık isim */
export function nameChip(c: Ctx, x: number, y: number, s: number, o: { name: string; famous?: number; alpha?: number; dim?: number; rot?: number } ) {
  const a = o.alpha ?? 1; if (a <= 0) return;
  const f = clamp(o.famous ?? 0), d = clamp(o.dim ?? 0);
  c.save(); c.globalAlpha *= clamp(a); c.translate(x, y); c.rotate(o.rot ?? 0); c.scale(s, s);
  if (f > 0) {
    const g = c.createRadialGradient(0, 0, 10, 0, 0, 170);
    g.addColorStop(0, `rgba(242,207,58,${0.28 * f})`); g.addColorStop(1, "rgba(242,207,58,0)");
    c.fillStyle = g; c.fillRect(-180, -90, 360, 180);
  }
  c.fillStyle = "rgba(0,0,0,0.4)"; rr(c, -106, -19, 220, 44, 5); c.fill();
  c.fillStyle = f > 0 ? `rgb(${lerp(217, 247, f)},${lerp(212, 236, f)},${lerp(199, 196, f)})` : `rgb(${lerp(217, 120, d)},${lerp(212, 122, d)},${lerp(199, 124, d)})`;
  rr(c, -110, -22, 220, 44, 5); c.fill();
  if (f > 0) { c.strokeStyle = `rgba(242,207,58,${0.9 * f})`; c.lineWidth = 3; rr(c, -110, -22, 220, 44, 5); c.stroke(); }
  // yıldız
  if (f > 0) {
    c.fillStyle = `rgba(201,154,18,${f})`; c.beginPath();
    for (let k = 0; k < 10; k++) { const r = k % 2 ? 6 : 14, an = -Math.PI / 2 + k * Math.PI / 5; c.lineTo(-84 + Math.cos(an) * r, Math.sin(an) * r); }
    c.closePath(); c.fill();
  } else {
    c.fillStyle = `rgba(90,96,106,${0.5 - 0.3 * d})`; c.beginPath(); c.arc(-84, 0, 7, 0, Math.PI * 2); c.fill();
  }
  c.fillStyle = f > 0 ? C.ink : `rgba(26,29,36,${1 - 0.6 * d})`;
  c.font = font(f > 0 ? 700 : 500, 24); c.textAlign = "left";
  if (d > 0.3) c.filter = `blur(${(d * 2.2).toFixed(1)}px)`;
  c.fillText(o.name, -62, 9);
  c.filter = "none";
  c.restore();
}

/** Pirinç terazi. (x,y) = kiriş pivotu. tilt>0 → sol kefe aşağı. drawL/drawR kefe içeriği (kefe merkezinde). */
export function balanceScale(c: Ctx, t: number, x: number, y: number, s: number, tilt: number, o: { drawL?: () => void; drawR?: () => void; glowL?: number; glowR?: number; swing?: number } = {}) {
  c.save(); c.translate(x, y); c.scale(s, s);
  // ayak
  const brass = c.createLinearGradient(-30, 0, 30, 0);
  brass.addColorStop(0, "#6E5428"); brass.addColorStop(0.5, "#D2AE62"); brass.addColorStop(1, "#6E5428");
  c.fillStyle = brass; c.fillRect(-12, 0, 24, 470);
  c.fillStyle = "#5A4320"; rr(c, -150, 460, 300, 30, 8); c.fill();
  c.fillStyle = "#7E6230"; rr(c, -110, 448, 220, 18, 6); c.fill();
  c.fillStyle = "rgba(0,0,0,0.5)"; c.beginPath(); c.ellipse(0, 498, 200, 18, 0, 0, Math.PI * 2); c.fill();
  // gösterge yayı
  c.strokeStyle = "rgba(210,174,98,0.6)"; c.lineWidth = 3; c.beginPath(); c.arc(0, 0, 90, Math.PI * 0.62, Math.PI * 0.38, true); c.stroke();
  for (let k = -4; k <= 4; k++) { const an = Math.PI / 2 + k * 0.1; c.beginPath(); c.moveTo(Math.cos(an) * 84, Math.sin(an) * 84); c.lineTo(Math.cos(an) * 96, Math.sin(an) * 96); c.stroke(); }
  c.save(); c.rotate(-tilt); c.strokeStyle = C.yellow; c.lineWidth = 4; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, 100); c.stroke(); c.restore();
  // kiriş
  c.save(); c.rotate(-tilt);
  c.fillStyle = brass; rr(c, -480, -9, 960, 18, 9); c.fill();
  c.fillStyle = "#E8C878"; c.beginPath(); c.arc(0, 0, 22, 0, Math.PI * 2); c.fill();
  c.fillStyle = "#6E5428"; c.beginPath(); c.arc(0, 0, 8, 0, Math.PI * 2); c.fill();
  for (const sd of [-1, 1]) {
    c.save(); c.translate(sd * 460, 0); c.rotate(tilt + (o.swing ?? 0) * Math.sin(t * 2.4 + sd) * 0.04);
    c.strokeStyle = "rgba(210,174,98,0.85)"; c.lineWidth = 2.5;
    c.beginPath(); c.moveTo(0, 0); c.lineTo(-140, 230); c.moveTo(0, 0); c.lineTo(140, 230); c.moveTo(0, 0); c.lineTo(0, 226); c.stroke();
    const gl = sd < 0 ? o.glowL ?? 0 : o.glowR ?? 0;
    if (gl > 0) lightPool(c, 0, 170, 260, "rgba(242,207,58,", 0.35 * gl);
    c.save(); c.translate(0, 170); (sd < 0 ? o.drawL : o.drawR)?.(); c.restore();
    const pg = c.createLinearGradient(-160, 0, 160, 0);
    pg.addColorStop(0, "#5E4520"); pg.addColorStop(0.45, "#CFA95C"); pg.addColorStop(1, "#5E4520");
    c.fillStyle = pg; c.beginPath(); c.ellipse(0, 236, 170, 26, 0, 0, Math.PI); c.fill();
    c.fillStyle = "#8A6A34"; c.beginPath(); c.ellipse(0, 236, 170, 12, 0, 0, Math.PI * 2); c.fill();
    c.restore();
  }
  c.restore();
  c.restore();
}

/** Toz bulutu (boş çekmece) */
export function dustPuff(c: Ctx, t: number, t0: number, x: number, y: number, k = 1, seed = 0) {
  const l = t - t0; if (l < 0 || l > 3) return;
  for (let i = 0; i < 26; i++) {
    const a = rnd(i, seed) * Math.PI - Math.PI, sp = 40 + rnd(i, seed + 1) * 160;
    const e = ease.out(clamp(l / 2.6));
    const px = x + Math.cos(a) * sp * e * 1.4, py = y + Math.sin(a) * sp * e * 0.7 - l * 18;
    const al = (1 - clamp(l / 3)) * 0.35 * k;
    c.fillStyle = `rgba(190,182,166,${al})`;
    c.beginPath(); c.arc(px, py, 6 + rnd(i, seed + 2) * 18 + l * 10, 0, Math.PI * 2); c.fill();
  }
}
