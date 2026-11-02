// Yön / yol ayrımı motifleri (s08): pusula, ahşap tabela, domino (işin zinciri), hedef tahtası.
// s10/s11'de "yön" ve "etki zinciri" için tekrar kullanılabilir.
import { C, font, rr } from "../design/style";
import { clamp, ease, lerp } from "../engine/core";
type Ctx = CanvasRenderingContext2D;

/** Pirinç cep pusulası. needle: radyan (0 = yukarı). wrong: kırmızı uyarı 0..1, lit: sarı hale 0..1 */
export function compass(c: Ctx, t: number, x: number, y: number, s: number, needle: number, o: { wrong?: number; lit?: number; jitter?: number } = {}) {
  const wrong = o.wrong ?? 0, lit = o.lit ?? 0, j = (o.jitter ?? 0) * Math.sin(t * 23) * 0.06;
  c.save(); c.translate(x, y); c.scale(s, s);
  if (lit > 0) { const g = c.createRadialGradient(0, 0, 60, 0, 0, 260); g.addColorStop(0, `rgba(242,207,58,${0.35 * lit})`); g.addColorStop(1, "rgba(242,207,58,0)"); c.fillStyle = g; c.fillRect(-260, -260, 520, 520); }
  c.fillStyle = "rgba(0,0,0,0.5)"; c.beginPath(); c.ellipse(8, 16, 132, 128, 0, 0, Math.PI * 2); c.fill();
  const br = c.createLinearGradient(-130, -130, 130, 130); br.addColorStop(0, "#C9A35A"); br.addColorStop(0.5, "#7A5A26"); br.addColorStop(1, "#B98B3E");
  c.fillStyle = br; c.beginPath(); c.arc(0, 0, 130, 0, Math.PI * 2); c.fill();
  c.fillStyle = "#E9E2CF"; c.beginPath(); c.arc(0, 0, 108, 0, Math.PI * 2); c.fill();
  c.strokeStyle = "rgba(26,29,36,0.55)"; c.lineWidth = 2;
  for (let i = 0; i < 32; i++) { const a = i / 32 * Math.PI * 2, r0 = i % 8 === 0 ? 84 : 96; c.beginPath(); c.moveTo(Math.sin(a) * r0, -Math.cos(a) * r0); c.lineTo(Math.sin(a) * 104, -Math.cos(a) * 104); c.stroke(); }
  c.fillStyle = C.ink; c.font = font(700, 22, true); c.textAlign = "center";
  ["北", "東", "南", "西"].forEach((k, i) => { const a = i * Math.PI / 2; c.fillText(k, Math.sin(a) * 66, -Math.cos(a) * 66 + 8); });
  c.save(); c.rotate(needle + j);
  c.fillStyle = wrong > 0 ? `rgb(${lerp(190, 226, wrong)},${lerp(60, 96, wrong)},58)` : "#B8423A";
  c.beginPath(); c.moveTo(0, -92); c.lineTo(11, 0); c.lineTo(-11, 0); c.closePath(); c.fill();
  c.fillStyle = "#3A3F47"; c.beginPath(); c.moveTo(0, 92); c.lineTo(11, 0); c.lineTo(-11, 0); c.closePath(); c.fill();
  c.restore();
  c.fillStyle = "#7A5A26"; c.beginPath(); c.arc(0, 0, 9, 0, Math.PI * 2); c.fill();
  // cam yansıması
  c.fillStyle = "rgba(255,255,255,0.18)"; c.beginPath(); c.ellipse(-36, -46, 52, 22, -0.6, 0, Math.PI * 2); c.fill();
  c.restore();
}

/** Ahşap yön tabelası. dir: 1 sağ, -1 sol. lit: sarı, tilt: radyan (sallanma) */
export function signpost(c: Ctx, x: number, y: number, s: number, txt: string, dir: number, o: { lit?: number; tilt?: number; alpha?: number; dim?: number } = {}) {
  const lit = o.lit ?? 0, dim = o.dim ?? 0;
  c.save(); c.translate(x, y); c.scale(s, s); c.globalAlpha *= clamp(o.alpha ?? 1); c.rotate(o.tilt ?? 0);
  c.font = font(700, 40, true);
  const w = c.measureText(txt).width + 110;
  c.fillStyle = "rgba(0,0,0,0.4)"; c.fillRect(dir > 0 ? 8 : -w + 8, -34, w - 30, 84);
  // levha
  const g = c.createLinearGradient(0, -44, 0, 44); g.addColorStop(0, lit ? "#8A6A3C" : "#5A4430"); g.addColorStop(1, "#3A2A1C");
  c.fillStyle = g; c.beginPath();
  if (dir > 0) { c.moveTo(0, -42); c.lineTo(w - 40, -42); c.lineTo(w, 0); c.lineTo(w - 40, 42); c.lineTo(0, 42); }
  else { c.moveTo(0, -42); c.lineTo(-w + 40, -42); c.lineTo(-w, 0); c.lineTo(-w + 40, 42); c.lineTo(0, 42); }
  c.closePath(); c.fill();
  c.strokeStyle = "rgba(0,0,0,0.25)"; c.lineWidth = 2; for (let i = -2; i <= 2; i++) { c.beginPath(); c.moveTo(dir > 0 ? 6 : -6, i * 16); c.lineTo(dir * (w - 50), i * 16 + 3); c.stroke(); }
  if (lit > 0) { c.save(); c.globalAlpha *= lit; c.strokeStyle = C.yellow; c.lineWidth = 4; c.stroke(); c.restore(); }
  c.fillStyle = lit > 0.5 ? C.yellow : `rgba(232,234,238,${1 - dim * 0.6})`; c.textAlign = "center";
  c.fillText(txt, dir * (w / 2 - 14), 14);
  c.fillStyle = "#2A2F37"; c.beginPath(); c.arc(dir * 18, 0, 5, 0, Math.PI * 2); c.fill();
  c.restore();
}

/** Ahşap direk (tabelaların taşıyıcısı) */
export function post(c: Ctx, x: number, y: number, h: number) {
  const g = c.createLinearGradient(x - 14, 0, x + 14, 0); g.addColorStop(0, "#3A2A1C"); g.addColorStop(0.5, "#5A4430"); g.addColorStop(1, "#2A1E14");
  c.fillStyle = g; c.fillRect(x - 14, y - h, 28, h);
  c.fillStyle = "rgba(0,0,0,0.45)"; c.beginPath(); c.ellipse(x + 30, y, 70, 12, 0, 0, Math.PI * 2); c.fill();
}

/** Domino taşı (yan görünüş). fall: 0 dik .. 1 yatmış (sağa). label altta. */
export function domino(c: Ctx, x: number, y: number, s: number, fall: number, o: { label?: string; lit?: number; grey?: number; alpha?: number; dir?: number } = {}) {
  const lit = o.lit ?? 0, grey = o.grey ?? 0, dir = o.dir ?? 1;
  c.save(); c.translate(x, y); c.scale(s, s); c.globalAlpha *= clamp(o.alpha ?? 1);
  c.fillStyle = "rgba(0,0,0,0.4)"; c.beginPath(); c.ellipse(dir * 40 * fall, 2, 40 + 60 * fall, 8, 0, 0, Math.PI * 2); c.fill();
  c.save(); c.translate(dir * 18, 0); c.rotate(dir * ease.in(clamp(fall)) * 1.2); c.translate(-dir * 18, 0);
  c.fillStyle = grey > 0.5 ? "#6B7280" : "#E7E1D2"; rr(c, -18, -150, 36, 150, 5); c.fill();
  c.fillStyle = "rgba(0,0,0,0.18)"; c.fillRect(8, -150, 10, 150);
  c.fillStyle = C.ink; c.fillRect(-14, -78, 28, 3);
  for (const [px, py] of [[0, -118], [-7, -40], [7, -24]]) { c.beginPath(); c.arc(px, py, 4, 0, Math.PI * 2); c.fill(); }
  if (lit > 0) { c.strokeStyle = `rgba(242,207,58,${lit})`; c.lineWidth = 4; rr(c, -18, -150, 36, 150, 5); c.stroke(); }
  c.restore();
  if (o.label) { c.font = font(600, 22, true); c.textAlign = "center"; c.fillStyle = lit > 0.5 ? C.yellow : C.mist; c.fillText(o.label, 0, 40); }
  c.restore();
}

/** Hedef tahtası (会社が求めるもの) */
export function target(c: Ctx, x: number, y: number, s: number, lit = 0) {
  c.save(); c.translate(x, y); c.scale(s, s);
  const rings = ["#D9D4C7", "#5B6678", "#D9D4C7", "#5B6678", lit > 0.5 ? C.yellow : "#A9A497"];
  rings.forEach((col, i) => { c.fillStyle = col; c.beginPath(); c.arc(0, 0, 110 - i * 22, 0, Math.PI * 2); c.fill(); });
  c.restore();
}
