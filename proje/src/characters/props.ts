// Sahne objeleri (yerel renkli, katmanlı geometri). s03'te doğar; s10 (şemsiye) ve sonrası tekrar kullanır.
import { C, font, rr, lightPool } from "../design/style";
import { clamp, lerp, rnd } from "../engine/core";

type Ctx = CanvasRenderingContext2D;

/** Yangın söndürücü. (x,y) tutma noktası (sap), ang hortum ağzı yönü (radyan), dönüş: ağızlık dünya koordinatı */
export function extinguisher(c: Ctx, x: number, y: number, s: number, ang = 0, side = 1): { nx: number; ny: number } {
  c.save(); c.translate(x, y); c.scale(s * side, s);
  // gövde (tüp)
  const bx = -8, by = 20, bw = 46, bh = 120;
  const g = c.createLinearGradient(bx - bw / 2, 0, bx + bw / 2, 0);
  g.addColorStop(0, "#5E1410"); g.addColorStop(0.3, "#C4281E"); g.addColorStop(0.45, "#F06A55"); g.addColorStop(0.6, "#B8231A"); g.addColorStop(1, "#4A0E0B");
  c.fillStyle = g; rr(c, bx - bw / 2, by, bw, bh, 18); c.fill();
  c.fillStyle = "rgba(0,0,0,0.35)"; c.fillRect(bx - bw / 2, by + bh - 22, bw, 6);
  // etiket
  c.fillStyle = "#E9E3D2"; c.fillRect(bx - bw / 2 + 6, by + 40, bw - 12, 34);
  c.fillStyle = "#B8231A"; c.fillRect(bx - bw / 2 + 6, by + 46, bw - 12, 5);
  c.fillStyle = "#2A2D33"; for (let i = 0; i < 3; i++) c.fillRect(bx - 14, by + 56 + i * 5, 28, 2);
  // boyun + valf + manometre
  c.fillStyle = "#2A2D33"; c.fillRect(bx - 10, by - 14, 20, 16);
  c.fillStyle = "#C9CED6"; c.beginPath(); c.arc(bx + 16, by - 6, 8, 0, Math.PI * 2); c.fill();
  c.strokeStyle = "#B8231A"; c.lineWidth = 1.5; c.beginPath(); c.moveTo(bx + 16, by - 6); c.lineTo(bx + 20, by - 10); c.stroke();
  // kol (sap)
  c.fillStyle = "#1A1C20"; c.save(); c.translate(bx, by - 14); c.rotate(-0.15); rr(c, -6, -10, 44, 8, 3); c.fill(); c.restore();
  rr(c, bx - 4, by - 26, 36, 8, 3); c.fill();
  // hortum
  const hx0 = bx - 8, hy0 = by - 8;
  const L = 70;
  const nx = hx0 + Math.cos(ang) * L + 30, ny = hy0 + Math.sin(ang) * L;
  c.strokeStyle = "#141518"; c.lineWidth = 7; c.lineCap = "round";
  c.beginPath(); c.moveTo(hx0, hy0); c.bezierCurveTo(hx0 - 30, hy0 + 60, nx - Math.cos(ang) * 60, ny - Math.sin(ang) * 20 + 30, nx, ny); c.stroke();
  c.fillStyle = "#0E0F11"; c.save(); c.translate(nx, ny); c.rotate(ang); rr(c, -4, -7, 26, 14, 4); c.fill(); c.restore();
  // parlama
  c.fillStyle = "rgba(255,255,255,0.18)"; rr(c, bx - 12, by + 10, 6, bh - 30, 3); c.fill();
  c.restore();
  const ex = x + side * s * (nx + Math.cos(ang) * 22), ey = y + s * (ny + Math.sin(ang) * 22);
  return { nx: ex, ny: ey };
}

/** Metal çöp kutusu (yangın kaynağı). (x,y) taban ortası */
export function wasteBin(c: Ctx, x: number, y: number, s: number, char = 0) {
  c.save(); c.translate(x, y); c.scale(s, s);
  c.fillStyle = "rgba(0,0,0,0.5)"; c.beginPath(); c.ellipse(0, 2, 62, 12, 0, 0, Math.PI * 2); c.fill();
  const g = c.createLinearGradient(-50, 0, 50, 0);
  g.addColorStop(0, "#2C3036"); g.addColorStop(0.35, "#6B727C"); g.addColorStop(0.55, "#8C939C"); g.addColorStop(1, "#24272C");
  c.fillStyle = g; c.beginPath(); c.moveTo(-46, -120); c.lineTo(46, -120); c.lineTo(38, 0); c.lineTo(-38, 0); c.closePath(); c.fill();
  // delikli doku
  c.fillStyle = "rgba(10,10,12,0.5)";
  for (let r = 0; r < 6; r++) for (let k = 0; k < 7; k++) { const yy = -108 + r * 18, w = lerp(40, 34, (r + 1) / 7); c.beginPath(); c.arc(-w + k * (w * 2 / 6), yy, 3, 0, Math.PI * 2); c.fill(); }
  // ağız
  c.fillStyle = "#3A3F46"; c.beginPath(); c.ellipse(0, -120, 46, 9, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = "#121315"; c.beginPath(); c.ellipse(0, -119, 40, 6, 0, 0, Math.PI * 2); c.fill();
  // kağıtlar (taşan)
  [[-18, -128, -0.4], [10, -132, 0.3], [24, -126, 0.7]].forEach(([px, py, r]) => { c.save(); c.translate(px, py); c.rotate(r); c.fillStyle = char > 0.5 ? "#2A2522" : "#D8D1BE"; c.fillRect(-14, -10, 28, 18); c.restore(); });
  // is lekesi
  if (char > 0) { c.fillStyle = `rgba(10,8,6,${0.6 * char})`; c.beginPath(); c.ellipse(0, -100, 44, 40, 0, Math.PI, 0); c.fill(); }
  c.restore();
}

/** Uzatma priz + kablolar. tidy: 0 dağınık → 1 düzenli/etiketli */
export function powerStrip(c: Ctx, x: number, y: number, s: number, tidy: number, t: number, hot = 0) {
  c.save(); c.translate(x, y); c.scale(s, s);
  // kablolar
  const cols = ["#1B1C1F", "#2A2C30", "#E4E2DA", "#1B1C1F", "#3A3D44"];
  cols.forEach((col, i) => {
    c.strokeStyle = col; c.lineWidth = 6; c.lineCap = "round";
    const sx = -70 + i * 34, mess = (1 - tidy);
    c.beginPath(); c.moveTo(sx, -6);
    c.bezierCurveTo(sx + mess * (rnd(i, 1) - 0.5) * 220, -60 - mess * 50, sx - 60 + i * 30 + mess * (rnd(i, 2) - 0.5) * 300, -100 + mess * 40, lerp(-160 + i * 40 + mess * (rnd(i, 3) - 0.5) * 200, -100 + i * 16, tidy), -200);
    c.stroke();
  });
  // kablo bağı
  if (tidy > 0.5) { c.fillStyle = `rgba(242,207,58,${(tidy - 0.5) * 2})`; rr(c, -40, -150, 80, 10, 4); c.fill(); rr(c, -30, -110, 60, 9, 4); c.fill(); }
  // priz gövdesi
  const g = c.createLinearGradient(0, -20, 0, 6);
  g.addColorStop(0, "#EDEBE4"); g.addColorStop(1, "#A9A69C");
  c.fillStyle = g; rr(c, -100, -18, 200, 26, 8); c.fill();
  for (let i = 0; i < 5; i++) { c.fillStyle = "#2A2C30"; rr(c, -84 + i * 34, -12, 22, 14, 3); c.fill(); }
  c.fillStyle = hot > 0 ? `rgba(255,${90 - 40 * hot | 0},40,${0.5 + 0.5 * Math.sin(t * 20) * hot})` : "rgba(120,220,140,0.9)"; c.beginPath(); c.arc(88, -5, 4, 0, Math.PI * 2); c.fill();
  // etiketler
  if (tidy > 0.3) for (let i = 0; i < 5; i++) { c.globalAlpha = clamp((tidy - 0.3 - i * 0.08) * 4); c.fillStyle = "#F4EEDC"; c.fillRect(-82 + i * 34, -40, 18, 12); c.globalAlpha = 1; }
  c.restore();
}

/** Şemsiye (yandan, açık). (x,y) kubbe tepe noktası; R yarı genişlik; hit: darbe titremesi; open 0..1 */
export function umbrella(c: Ctx, x: number, y: number, R: number, o: { open?: number; tilt?: number; hit?: number; shaft?: number; glow?: number } = {}) {
  const open = o.open ?? 1, tilt = o.tilt ?? 0, hit = o.hit ?? 0, shaft = o.shaft ?? R * 0.95;
  c.save(); c.translate(x, y); c.rotate(tilt);
  const r = R * lerp(0.25, 1, open), hgt = R * 0.34 * lerp(1.6, 1, open);
  const dent = hit * 10;
  // gölge altı
  const ribs = 8;
  const pts: [number, number][] = [];
  for (let i = 0; i <= ribs; i++) { const u = i / ribs * 2 - 1; pts.push([u * r, hgt * (0.55 + 0.45 * Math.abs(u) ** 1.6) + Math.abs(u) * 4 + (i % 2 ? dent : 0)]); }
  // sap
  c.strokeStyle = "#2B2620"; c.lineWidth = R * 0.022; c.lineCap = "round";
  c.beginPath(); c.moveTo(0, -10); c.lineTo(0, shaft); c.stroke();
  c.strokeStyle = "#6A4A30"; c.lineWidth = 9;
  c.beginPath(); c.moveTo(0, shaft - 50); c.lineTo(0, shaft + 20); c.arc(-14, shaft + 20, 14, 0, Math.PI * 0.95); c.stroke();
  // iç teller
  c.strokeStyle = "rgba(180,185,195,0.6)"; c.lineWidth = 2;
  for (let i = 1; i < ribs; i++) { c.beginPath(); c.moveTo(0, shaft * 0.32); c.lineTo(pts[i][0] * 0.55, pts[i][1] * 0.75); c.stroke(); }
  // kubbe panelleri
  for (let i = 0; i < ribs; i++) {
    const [x0, y0] = pts[i], [x1, y1] = pts[i + 1];
    const mx = (x0 + x1) / 2;
    const g = c.createLinearGradient(0, -hgt * 0.4, 0, Math.max(y0, y1));
    const lit = i % 2 ? 0 : 1;
    g.addColorStop(0, lit ? "#3E4A5C" : "#2E3746"); g.addColorStop(1, lit ? "#1F2733" : "#161C25");
    c.fillStyle = g;
    c.beginPath(); c.moveTo(0, -hgt * 0.42);
    c.quadraticCurveTo(x0 * 0.6, -hgt * 0.38 + y0 * 0.1, x0, y0);
    c.quadraticCurveTo(mx, Math.min(y0, y1) - hgt * 0.12, x1, y1);
    c.quadraticCurveTo(x1 * 0.6, -hgt * 0.38 + y1 * 0.1, 0, -hgt * 0.42);
    c.closePath(); c.fill();
  }
  // kenar ışığı (üst kenar)
  c.strokeStyle = `rgba(190,215,255,${0.45})`; c.lineWidth = 3;
  c.beginPath(); c.moveTo(pts[0][0], pts[0][1]);
  c.bezierCurveTo(-r * 0.75, -hgt * 0.5, r * 0.75, -hgt * 0.5, pts[ribs][0], pts[ribs][1]); c.stroke();
  if (o.glow) { c.strokeStyle = `rgba(242,207,58,${0.7 * o.glow})`; c.lineWidth = 4; c.stroke(); }
  // tel uçları
  c.fillStyle = "#C9CED6"; pts.forEach(([px, py]) => { c.beginPath(); c.arc(px, py, 3.5, 0, Math.PI * 2); c.fill(); });
  // tepe
  c.fillStyle = "#C9CED6"; c.fillRect(-3, -hgt * 0.42 - 22, 6, 22);
  c.restore();
}
/** Kubbe yüzeyinin y'si (dünya), şemsiye tepesi (x,y), R */
export const umbrellaSurface = (x: number, y: number, R: number, px: number) => {
  const u = clamp((px - x) / R, -1, 1);
  return y - R * 0.34 * 0.42 + (R * 0.34 * 0.97) * Math.pow(Math.abs(u), 1.8);
};

/** 方針 oku: çelik ok + kağıt etiket. (x,y) uç, ang yön (π/2 = aşağı) */
export function policyArrow(c: Ctx, x: number, y: number, s: number, ang = Math.PI / 2, a = 1, label = "方針", streak = 0) {
  if (a <= 0.01) return;
  c.save(); c.globalAlpha *= a; c.translate(x, y); c.rotate(ang - Math.PI / 2); c.scale(s, s);
  if (streak > 0) { const g = c.createLinearGradient(0, -260, 0, -60); g.addColorStop(0, "rgba(200,215,235,0)"); g.addColorStop(1, `rgba(200,215,235,${0.35 * streak})`); c.fillStyle = g; c.fillRect(-3, -260, 6, 200); }
  // gövde
  c.fillStyle = "#59606B"; c.fillRect(-4, -120, 8, 100);
  c.fillStyle = "rgba(255,255,255,0.35)"; c.fillRect(-4, -120, 2, 100);
  // uç
  c.fillStyle = "#8A929E"; c.beginPath(); c.moveTo(0, 0); c.lineTo(-14, -30); c.lineTo(14, -30); c.closePath(); c.fill();
  c.fillStyle = "#C9CED6"; c.beginPath(); c.moveTo(0, 0); c.lineTo(-3, -28); c.lineTo(5, -26); c.closePath(); c.fill();
  // tüy
  c.fillStyle = "#3A404A"; c.beginPath(); c.moveTo(-4, -120); c.lineTo(-16, -140); c.lineTo(-16, -112); c.lineTo(-4, -100); c.closePath(); c.fill();
  c.beginPath(); c.moveTo(4, -120); c.lineTo(16, -140); c.lineTo(16, -112); c.lineTo(4, -100); c.closePath(); c.fill();
  // kağıt etiket
  c.save(); c.translate(6, -84); c.rotate(0.12);
  c.fillStyle = "#E9E3D2"; c.fillRect(0, -16, 46, 34);
  c.fillStyle = "rgba(0,0,0,0.15)"; c.fillRect(0, 14, 46, 4);
  c.font = font(700, 15); c.fillStyle = "#9A2A22"; c.textAlign = "center"; c.fillText(label, 23, 7);
  c.strokeStyle = "rgba(154,42,34,0.7)"; c.lineWidth = 1.5; c.strokeRect(4, -12, 38, 26);
  c.restore();
  c.restore();
}

/** Kupa / madalya */
export function medal(c: Ctx, x: number, y: number, s: number, shine = 0) {
  c.save(); c.translate(x, y); c.scale(s, s);
  c.fillStyle = "#8A2A22"; c.beginPath(); c.moveTo(-26, -90); c.lineTo(-6, -20); c.lineTo(6, -20); c.lineTo(-6, -90); c.closePath(); c.fill();
  c.fillStyle = "#2F4A6B"; c.beginPath(); c.moveTo(26, -90); c.lineTo(6, -20); c.lineTo(-6, -20); c.lineTo(6, -90); c.closePath(); c.fill();
  const g = c.createRadialGradient(-12, -12, 4, 0, 0, 48);
  g.addColorStop(0, "#FFF2B0"); g.addColorStop(0.5, "#F2CF3A"); g.addColorStop(1, "#9A7A10");
  c.fillStyle = g; c.beginPath(); c.arc(0, 10, 44, 0, Math.PI * 2); c.fill();
  c.strokeStyle = "#C99A12"; c.lineWidth = 4; c.beginPath(); c.arc(0, 10, 34, 0, Math.PI * 2); c.stroke();
  c.fillStyle = "#C99A12"; c.beginPath();
  for (let i = 0; i < 10; i++) { const r = i % 2 ? 9 : 20, a = -Math.PI / 2 + i * Math.PI / 5; c.lineTo(Math.cos(a) * r, 10 + Math.sin(a) * r); }
  c.closePath(); c.fill();
  if (shine > 0) { c.globalCompositeOperation = "lighter"; c.fillStyle = `rgba(255,255,230,${0.5 * shine})`; c.beginPath(); c.ellipse(-14, -6, 8, 18, -0.6, 0, Math.PI * 2); c.fill(); }
  c.restore();
}

/** Kahve kupası + buhar */
export function mug(c: Ctx, t: number, x: number, y: number, s: number, steam = 1) {
  c.save(); c.translate(x, y); c.scale(s, s);
  c.fillStyle = "#E7E2D6"; rr(c, -18, -40, 36, 40, 6); c.fill();
  c.strokeStyle = "#E7E2D6"; c.lineWidth = 6; c.beginPath(); c.arc(20, -22, 10, -1.2, 1.2); c.stroke();
  c.fillStyle = "rgba(0,0,0,0.2)"; c.fillRect(6, -40, 12, 40);
  c.fillStyle = "#3A2418"; c.beginPath(); c.ellipse(0, -38, 15, 4, 0, 0, Math.PI * 2); c.fill();
  for (let i = 0; i < 3; i++) {
    const ph = (t * 0.4 + i / 3) % 1;
    c.strokeStyle = `rgba(230,232,238,${0.25 * steam * Math.sin(Math.PI * ph)})`; c.lineWidth = 3;
    c.beginPath(); c.moveTo(-6 + i * 6, -46 - ph * 20);
    c.bezierCurveTo(-14 + i * 6, -60 - ph * 40, 4 + i * 6, -70 - ph * 50, -4 + i * 6, -90 - ph * 60); c.stroke();
  }
  c.restore();
}

/** Masa saksı bitkisi */
export function plant(c: Ctx, t: number, x: number, y: number, s: number) {
  c.save(); c.translate(x, y); c.scale(s, s);
  c.fillStyle = "#7A4B32"; c.beginPath(); c.moveTo(-24, -40); c.lineTo(24, -40); c.lineTo(18, 0); c.lineTo(-18, 0); c.closePath(); c.fill();
  c.fillStyle = "rgba(0,0,0,0.25)"; c.fillRect(-24, -40, 48, 6);
  for (let i = 0; i < 7; i++) {
    const a = -Math.PI / 2 + (i - 3) * 0.32 + Math.sin(t * 0.8 + i) * 0.03;
    const L = 60 + rnd(i, 4) * 40;
    c.fillStyle = i % 2 ? "#3F6B3A" : "#4E7F45";
    c.save(); c.translate(0, -40); c.rotate(a + Math.PI / 2);
    c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(14, -L * 0.5, 0, -L); c.quadraticCurveTo(-14, -L * 0.5, 0, 0); c.fill();
    c.restore();
  }
  c.restore();
}

/** Duvar saati */
export function wallClock(c: Ctx, x: number, y: number, r: number, h: number) {
  c.save(); c.translate(x, y);
  c.fillStyle = "#2A2F36"; c.beginPath(); c.arc(0, 0, r + 6, 0, Math.PI * 2); c.fill();
  c.fillStyle = "#E6E2D8"; c.beginPath(); c.arc(0, 0, r, 0, Math.PI * 2); c.fill();
  c.strokeStyle = "#2A2F36"; c.lineWidth = 2;
  for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; c.beginPath(); c.moveTo(Math.cos(a) * r * 0.82, Math.sin(a) * r * 0.82); c.lineTo(Math.cos(a) * r * 0.94, Math.sin(a) * r * 0.94); c.stroke(); }
  const ah = (h / 12) * Math.PI * 2 - Math.PI / 2, am = (h % 1) * Math.PI * 2 - Math.PI / 2;
  c.lineCap = "round"; c.lineWidth = 4; c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(ah) * r * 0.5, Math.sin(ah) * r * 0.5); c.stroke();
  c.lineWidth = 2.5; c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(am) * r * 0.78, Math.sin(am) * r * 0.78); c.stroke();
  c.restore();
  void lightPool; void C;
}
