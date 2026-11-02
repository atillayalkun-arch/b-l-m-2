// Değerlendirme akışı ortak parçaları (s06'da doğdu; s09 "評価する側に座る" için tekrar kullanılabilir).
//  speechBubble()  — sözcük balonu (warm = sarı/sıcak söz, fuzzy = belirsiz/titrek, crack = çatlak)
//  evalSheet()     — 評価シート (önceki yıl / bu yıl derecesi, ok)
//  chainLevel()    — hiyerarşi basamağı: masa + koltuk + kapı (gate) + rütbe etiketi
//  armchair()      — koltuk motifi (見る人 / 決める人)
//  tallyCounter()  — mekanik sayaç (数える)
import { clamp, ease, lerp } from "../engine/core";
import { C, font, rr, lightPool } from "../design/style";

type Ctx = CanvasRenderingContext2D;

export function speechBubble(c: Ctx, t: number, x: number, y: number, txt: string, k: number, o: { warm?: number; fuzzy?: number; crack?: number; size?: number; tail?: number; grey?: number } = {}) {
  if (k <= 0) return;
  const size = o.size ?? 40, warm = o.warm ?? 0, fz = o.fuzzy ?? 0, cr = o.crack ?? 0, tail = o.tail ?? -1, grey = o.grey ?? 0;
  const sc = lerp(0.55, 1, ease.back(clamp(k)));
  c.save();
  c.translate(x + Math.sin(t * 9) * 3 * fz, y + Math.sin(t * 1.4) * 4 + Math.cos(t * 7.3) * 2 * fz);
  c.scale(sc, sc); c.globalAlpha *= clamp(k * 1.5) * (1 - 0.35 * fz);
  if (fz > 0) c.filter = `blur(${(fz * 2.6).toFixed(1)}px)`;
  c.font = font(600, size);
  const w = c.measureText(txt).width + size * 1.6, h = size * 2.0;
  if (warm > 0) { const g = c.createRadialGradient(0, 0, 10, 0, 0, w * 0.75); g.addColorStop(0, `rgba(242,207,58,${0.28 * warm})`); g.addColorStop(1, "rgba(242,207,58,0)"); c.fillStyle = g; c.fillRect(-w, -w, w * 2, w * 2); }
  c.fillStyle = warm > 0.5 ? "rgba(44,36,12,0.93)" : grey > 0 ? "rgba(36,38,42,0.9)" : "rgba(18,22,30,0.92)";
  rr(c, -w / 2, -h / 2, w, h, h / 2); c.fill();
  c.beginPath(); c.moveTo(tail * 20, h / 2 - 4); c.lineTo(tail * 46, h / 2 + 30); c.lineTo(tail * -12, h / 2 - 4); c.fill();
  c.strokeStyle = warm > 0.5 ? "rgba(242,207,58,0.85)" : "rgba(140,151,168,0.55)"; c.lineWidth = 2.5; rr(c, -w / 2, -h / 2, w, h, h / 2); c.stroke();
  c.fillStyle = warm > 0.5 ? C.yellow : grey > 0 ? C.mist : C.text; c.textAlign = "center"; c.fillText(txt, 0, size * 0.34);
  if (cr > 0) {
    c.strokeStyle = `rgba(230,236,245,${0.9 * clamp(cr * 2)})`; c.lineWidth = 3;
    const pts = [[-w * 0.05, -h / 2], [w * 0.04, -h * 0.15], [-w * 0.06, h * 0.08], [w * 0.05, h / 2]];
    c.beginPath(); c.moveTo(pts[0][0], pts[0][1]);
    const n = Math.max(1, Math.ceil(cr * 3));
    for (let i = 1; i <= n && i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]);
    c.stroke();
    c.beginPath(); c.moveTo(w * 0.04, -h * 0.15); c.lineTo(w * 0.04 + 40 * cr, -h * 0.3); c.stroke();
  }
  c.restore();
}

export function evalSheet(c: Ctx, x: number, y: number, s: number, o: { prev?: string; cur?: string; drop?: number; rot?: number; close?: number } = {}) {
  c.save(); c.translate(x, y); c.rotate(o.rot ?? 0); c.scale(s, s);
  const cl = clamp(o.close ?? 0);
  // dosya kapağı (arkada)
  c.fillStyle = "#3E5A7A"; rr(c, -250, -320, 500, 640, 10); c.fill();
  c.fillStyle = "rgba(0,0,0,0.4)"; rr(c, -236, -306, 500, 640, 8); c.fill();
  c.fillStyle = C.paper; rr(c, -240, -310, 480, 620, 6); c.fill();
  c.fillStyle = C.ink; c.font = font(700, 40, true); c.textAlign = "left"; c.fillText("人事評価", -200, -240);
  c.strokeStyle = "rgba(26,29,36,0.35)"; c.lineWidth = 2;
  for (let r = 0; r < 6; r++) { c.beginPath(); c.moveTo(-200, -200 + r * 48); c.lineTo(200, -200 + r * 48); c.stroke(); }
  c.font = font(500, 26); c.fillStyle = "rgba(26,29,36,0.7)";
  c.fillText("前年度", -200, 140); c.fillText("今年度", 30, 140);
  c.font = font(800, 92, true); c.textAlign = "center";
  c.fillStyle = C.ink; c.fillText(o.prev ?? "B+", -110, 250);
  const d = clamp(o.drop ?? 0);
  if (d > 0) {
    c.save(); c.globalAlpha *= d; c.fillStyle = "#9A3A30"; c.fillText(o.cur ?? "B−", 120, 250 + (1 - ease.out(d)) * -40); c.restore();
    c.strokeStyle = "#9A3A30"; c.lineWidth = 6; c.lineCap = "round";
    c.beginPath(); c.moveTo(-40, 170); c.lineTo(lerp(-40, 30, ease.out(d)), lerp(170, 220, ease.out(d))); c.stroke();
  }
  // kapak kapanır
  if (cl > 0) {
    c.save(); c.scale(1, 1); c.fillStyle = "#4A6A8C";
    const hh = 640 * ease.inOut(cl); rr(c, -250, -320, 500, hh, 10); c.fill();
    c.fillStyle = "rgba(255,255,255,0.08)"; c.fillRect(-250, -320 + hh - 6, 500, 6);
    c.restore();
  }
  c.restore();
}

export function armchair(c: Ctx, x: number, y: number, s: number, o: { col?: string; glow?: number; tall?: number } = {}) {
  const col = o.col ?? "#3A2E2A", tall = o.tall ?? 1;
  c.save(); c.translate(x, y); c.scale(s, s);
  if ((o.glow ?? 0) > 0) lightPool(c, 0, -150, 280, "rgba(242,207,58,", 0.25 * (o.glow ?? 0));
  c.fillStyle = "rgba(0,0,0,0.45)"; c.beginPath(); c.ellipse(0, 6, 110, 16, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = "#16181C"; c.fillRect(-6, -70, 12, 70); c.fillRect(-70, -6, 140, 8);
  c.fillStyle = col; rr(c, -80, -330 * tall, 160, 280 * tall, 30); c.fill();
  c.fillStyle = "rgba(255,255,255,0.06)"; rr(c, -66, -316 * tall, 30, 250 * tall, 14); c.fill();
  c.fillStyle = col; rr(c, -96, -110, 192, 50, 16); c.fill();
  c.fillStyle = "rgba(0,0,0,0.3)"; rr(c, -96, -72, 192, 12, 6); c.fill();
  c.fillStyle = col; rr(c, -112, -170, 26, 90, 10); c.fill(); rr(c, 86, -170, 26, 90, 10); c.fill();
  c.restore();
}

/** Hiyerarşi basamağı: platform + masa + kişi yeri + "gate" (geçit) */
export function chainLevel(c: Ctx, x: number, y: number, s: number, o: { label: string; lit?: number; gate?: number; w?: number } ) {
  const w = o.w ?? 380, lit = o.lit ?? 0;
  c.save(); c.translate(x, y); c.scale(s, s);
  // platform (beton + metal kenar)
  c.fillStyle = "#2A2F37"; c.fillRect(-w / 2, 0, w, 40);
  c.fillStyle = "#3A414B"; c.fillRect(-w / 2, 0, w, 6);
  c.fillStyle = "#1A1D22"; c.fillRect(-w / 2, 40, w, 420);
  if (lit > 0) { lightPool(c, 0, -60, 260, "rgba(255,214,150,", 0.28 * lit); }
  // masa
  c.fillStyle = "#5A3E2A"; c.fillRect(-120, -80, 240, 14); c.fillStyle = "#2E2016"; c.fillRect(-110, -66, 220, 66);
  // geçit çerçevesi (kişinin üstünde bir kapı/elek)
  const g = o.gate ?? 0;
  if (g > 0) {
    c.save(); c.globalAlpha *= g;
    c.strokeStyle = "rgba(160,175,195,0.55)"; c.lineWidth = 6;
    c.strokeRect(w / 2 - 30, -300, 60, 300);
    c.fillStyle = "rgba(120,140,170,0.12)"; c.fillRect(w / 2 - 30, -300, 60, 300);
    for (let i = 0; i < 6; i++) { c.fillStyle = "rgba(160,175,195,0.35)"; c.fillRect(w / 2 - 30, -290 + i * 50, 60, 3); }
    c.restore();
  }
  c.font = font(700, 30, true); c.fillStyle = lit > 0.5 ? C.text : C.mist; c.textAlign = "center"; c.fillText(o.label, 0, 90);
  c.restore();
}

export function tallyCounter(c: Ctx, x: number, y: number, s: number, value: number, press = 0) {
  c.save(); c.translate(x, y); c.scale(s, s);
  // gövde (krom)
  const g = c.createLinearGradient(-110, -110, 110, 110);
  g.addColorStop(0, "#C8CCD2"); g.addColorStop(0.5, "#7C838E"); g.addColorStop(1, "#4A5059");
  c.fillStyle = g; c.beginPath(); c.arc(0, 0, 120, 0, Math.PI * 2); c.fill();
  c.fillStyle = "#2A2E35"; c.beginPath(); c.arc(0, 0, 100, 0, Math.PI * 2); c.fill();
  // basma düğmesi
  c.fillStyle = "#A9AFB8"; rr(c, -28, -170 + press * 22, 56, 50, 8); c.fill();
  c.fillStyle = "#6A707A"; c.fillRect(-12, -124 + press * 10, 24, 10);
  // halka
  c.strokeStyle = "#8A9099"; c.lineWidth = 12; c.beginPath(); c.arc(130, 60, 34, 0, Math.PI * 2); c.stroke();
  // pencere + rakamlar
  c.fillStyle = "#0E1014"; rr(c, -80, -30, 160, 60, 6); c.fill();
  const str = String(Math.max(0, Math.floor(value))).padStart(4, "0");
  c.font = font(700, 44); c.textAlign = "center";
  for (let i = 0; i < 4; i++) { c.fillStyle = "#E8E6DE"; c.fillRect(-74 + i * 38, -24, 34, 48); c.fillStyle = "#111"; c.fillText(str[i], -57 + i * 38, 16); }
  c.restore();
}
