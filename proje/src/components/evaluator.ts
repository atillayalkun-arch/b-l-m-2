// s09 評価する側に座る — değerlendirici masası ortak parçaları
// hourglass(), faceCard(), calendarStrip(), eventBanner(), gazeBeam(), binderTab()
import { C, font, rr, lightPool } from "../design/style";
import { clamp, lerp, rnd, ease } from "../engine/core";
type Ctx = CanvasRenderingContext2D;

const OUT = ["#2F4A6B", "#B9A88A", "#5A6B4A", "#6E2F35", "#3D4A5A", "#8C8C88"];
const SKIN = ["#C99A7A", "#D8AE8E", "#B98666", "#D2A283", "#C48F6C", "#DDB497"];

/** Kum saati (持ち時間). k: akan kum oranı 0..1, flow: akış ipliği görünürlüğü */
export function hourglass(c: Ctx, t: number, x: number, y: number, s: number, k: number, flow = 1) {
  c.save(); c.translate(x, y); c.scale(s, s);
  c.fillStyle = "rgba(0,0,0,0.45)"; c.beginPath(); c.ellipse(0, 4, 90, 14, 0, 0, Math.PI * 2); c.fill();
  const wood = "#5A3E2A";
  c.fillStyle = wood; rr(c, -84, -16, 168, 20, 4); c.fill(); rr(c, -84, -300, 168, 20, 4); c.fill();
  c.fillStyle = "#3A281A"; c.fillRect(-74, -282, 10, 268); c.fillRect(64, -282, 10, 268);
  // cam
  const glass = (up: boolean) => { c.beginPath(); if (up) { c.moveTo(-56, -280); c.lineTo(56, -280); c.quadraticCurveTo(54, -190, 6, -150); c.lineTo(-6, -150); c.quadraticCurveTo(-54, -190, -56, -280); } else { c.moveTo(-6, -146); c.lineTo(6, -146); c.quadraticCurveTo(54, -110, 56, -16); c.lineTo(-56, -16); c.quadraticCurveTo(-54, -110, -6, -146); } c.closePath(); };
  const kk = clamp(k);
  // üst kum
  c.save(); glass(true); c.clip();
  c.fillStyle = "#D9B26A"; const top = lerp(-250, -152, ease.in(kk)); c.fillRect(-60, top, 120, -150 - top);
  c.restore();
  // alt kum (tümsek)
  c.save(); glass(false); c.clip();
  c.fillStyle = "#C99E58"; const hh = lerp(0, 100, ease.out(kk));
  c.beginPath(); c.moveTo(-60, -16); c.lineTo(-60, -16 - hh * 0.5); c.quadraticCurveTo(0, -16 - hh * 1.3, 60, -16 - hh * 0.5); c.lineTo(60, -16); c.fill();
  c.restore();
  if (flow > 0 && kk < 1) { c.strokeStyle = `rgba(217,178,106,${0.9 * flow})`; c.lineWidth = 2.5; c.setLineDash([6, 4]); c.lineDashOffset = -t * 120; c.beginPath(); c.moveTo(0, -150); c.lineTo(0, -16 - lerp(0, 100, ease.out(kk)) * 1.1); c.stroke(); c.setLineDash([]); }
  c.strokeStyle = "rgba(200,220,240,0.5)"; c.lineWidth = 3; glass(true); c.stroke(); glass(false); c.stroke();
  c.fillStyle = "rgba(255,255,255,0.12)"; c.fillRect(-46, -270, 6, 90); c.fillRect(-46, -110, 6, 80);
  c.restore();
}

/** Çalışan yüz kartı (評価シート fişi). blank: yüz silinir (思い出せない), glow: sarı hatırlanan, score: 0..5 puan noktası */
export function faceCard(c: Ctx, x: number, y: number, s: number, o: { outfit?: number; blank?: number; glow?: number; score?: number; alpha?: number; rot?: number; name?: string; q?: number } = {}) {
  const a = o.alpha ?? 1; if (a <= 0) return;
  const bl = clamp(o.blank ?? 0), gl = clamp(o.glow ?? 0), of = (o.outfit ?? 0) % 6;
  c.save(); c.globalAlpha *= clamp(a); c.translate(x, y); c.rotate(o.rot ?? 0); c.scale(s, s);
  if (gl > 0) lightPool(c, 0, 0, 200, "rgba(242,207,58,", 0.35 * gl);
  c.fillStyle = "rgba(0,0,0,0.45)"; rr(c, -76, -96, 160, 204, 6); c.fill();
  c.fillStyle = C.paper; rr(c, -80, -100, 160, 200, 6); c.fill();
  if (gl > 0) { c.strokeStyle = `rgba(242,207,58,${gl})`; c.lineWidth = 4; rr(c, -80, -100, 160, 200, 6); c.stroke(); }
  // foto alanı
  c.fillStyle = "#2A3038"; c.fillRect(-64, -86, 128, 110);
  c.save(); c.beginPath(); c.rect(-64, -86, 128, 110); c.clip();
  c.globalAlpha *= 1 - bl * 0.92;
  c.fillStyle = OUT[of]; c.beginPath(); c.ellipse(0, 26, 46, 36, 0, Math.PI, 0); c.fill();
  c.fillStyle = SKIN[of]; c.beginPath(); c.arc(0, -28, 22, 0, Math.PI * 2); c.fill();
  c.fillStyle = "#1A1410"; c.beginPath(); c.arc(0, -34, 22, Math.PI, 0); c.fill();
  c.restore();
  if (bl > 0) { // silinti izleri
    c.fillStyle = `rgba(140,151,168,${0.25 * bl})`; for (let i = 0; i < 5; i++) c.fillRect(-60 + rnd(i, 3) * 20, -70 + i * 20, 100 - rnd(i, 4) * 30, 8);
  }
  if ((o.q ?? 0) > 0) { c.globalAlpha *= clamp(o.q ?? 0); c.fillStyle = C.mist; c.font = font(800, 64, true); c.textAlign = "center"; c.fillText("？", 0, -8); c.globalAlpha /= Math.max(0.001, clamp(o.q ?? 0)); }
  // isim + çizgiler
  c.fillStyle = `rgba(26,29,36,${0.75 - 0.5 * bl})`; c.font = font(600, 20, true); c.textAlign = "left";
  c.fillText(o.name ?? "", -64, 52);
  c.strokeStyle = "rgba(26,29,36,0.25)"; c.lineWidth = 2; c.beginPath(); c.moveTo(-64, 66); c.lineTo(64, 66); c.stroke();
  const sc = o.score ?? 0;
  for (let i = 0; i < 5; i++) { const f = clamp(sc - i); c.fillStyle = f > 0 ? `rgba(26,29,36,${0.85 * f})` : "rgba(26,29,36,0.12)"; c.beginPath(); c.arc(-48 + i * 24, 84, 7, 0, Math.PI * 2); c.fill(); }
  c.restore();
}

/** 12 aylık takvim şeridi (評価期間). weights[i]: o ayın olay kartının ağırlığı (0..1+), lit: son ay vurgusu */
export function calendarStrip(c: Ctx, x: number, y: number, w: number, o: { weights?: number[]; dim?: number[]; lit?: number } = {}) {
  const m = ["4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月", "1月", "2月", "3月"];
  const cw = w / 12;
  c.save(); c.translate(x, y);
  c.fillStyle = "#1E232B"; rr(c, -8, -8, w + 16, 76, 8); c.fill();
  for (let i = 0; i < 12; i++) {
    const d = clamp(o.dim?.[i] ?? 0);
    c.fillStyle = i >= 10 && (o.lit ?? 0) > 0 ? `rgba(242,207,58,${0.25 * (o.lit ?? 0)})` : "rgba(255,255,255,0.04)";
    c.fillRect(i * cw + 2, 0, cw - 4, 60);
    c.fillStyle = `rgba(232,234,238,${0.8 - 0.55 * d})`; c.font = font(600, 24, true); c.textAlign = "center"; c.fillText(m[i], i * cw + cw / 2, 40);
  }
  c.restore();
}

/** 社内イベント横断幕 */
export function eventBanner(c: Ctx, t: number, x: number, y: number, s: number, text: string, lit = 0) {
  c.save(); c.translate(x, y); c.scale(s, s);
  c.strokeStyle = "#3A3F47"; c.lineWidth = 3; c.beginPath(); c.moveTo(-460, -40); c.quadraticCurveTo(0, -10 + Math.sin(t) * 4, 460, -40); c.stroke();
  c.save(); c.rotate(Math.sin(t * 1.1) * 0.006);
  c.fillStyle = "#8A2A2E"; rr(c, -420, -30, 840, 110, 6); c.fill();
  c.fillStyle = "rgba(255,255,255,0.08)"; c.fillRect(-420, -30, 840, 8);
  c.fillStyle = lit > 0 ? `rgb(${lerp(240, 255, lit)},${lerp(230, 236, lit)},${lerp(220, 170, lit)})` : "#F0E8DC";
  c.font = font(800, 56, true); c.textAlign = "center"; c.fillText(text, 0, 46);
  c.restore();
  // fener ışıkları
  for (let i = 0; i < 9; i++) { const lx = -440 + i * 110, ly = -46 + Math.sin(i * 0.7) * 6; c.fillStyle = `rgba(255,${180 + (i % 3) * 20},120,${0.6 + 0.3 * Math.sin(t * 3 + i)})`; c.beginPath(); c.arc(lx, ly, 9, 0, Math.PI * 2); c.fill(); }
  c.restore();
}

/** Bakış ışını: yukarıdan aşağı (上から評価) yumuşak koni */
export function gazeBeam(c: Ctx, x0: number, y0: number, x1: number, y1: number, a: number, col = "200,212,235") {
  if (a <= 0) return;
  c.save();
  const g = c.createLinearGradient(x0, y0, x1, y1);
  g.addColorStop(0, `rgba(${col},${0.35 * a})`); g.addColorStop(1, `rgba(${col},${0.05 * a})`);
  c.fillStyle = g; c.beginPath(); c.moveTo(x0 - 12, y0); c.lineTo(x0 + 12, y0); c.lineTo(x1 + 160, y1); c.lineTo(x1 - 160, y1); c.closePath(); c.fill();
  c.restore();
}

/** Klasör sekmesi (評価者研修 binder) */
export function binderTab(c: Ctx, x: number, y: number, s: number, txt: string, k: number, lit = 0) {
  if (k <= 0) return;
  c.save(); c.translate(x + (1 - ease.out(clamp(k))) * -80, y); c.scale(s, s); c.globalAlpha *= clamp(k * 2);
  c.fillStyle = lit > 0 ? `rgb(${lerp(200, 242, lit)},${lerp(196, 207, lit)},${lerp(180, 58, lit)})` : "#C8C2B2";
  rr(c, 0, -30, 300, 60, 6); c.fill();
  c.fillStyle = C.ink; c.font = font(700, 32, true); c.textAlign = "left"; c.fillText(txt, 22, 11);
  c.restore();
}
