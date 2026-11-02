// s10 ortak parçaları: ev (家事) mekânı, ev işi karoları, %100'ü aşan çubuklar, cevap kâğıdı.
import { W, H, clamp, lerp, rnd } from "../engine/core";
import { C, font, rr, lightPool, lightCone } from "../design/style";
import { dof, bokeh } from "../design/grade";

type Ctx = CanvasRenderingContext2D;

/** Gece evi: mutfak tezgâhı, buzdolabı, pencere (şehir), çamaşır ipi, sıcak tavan lambası. pan: parallax */
export function envHome(c: Ctx, t: number, blurBg = 3, pan = 0, lamp = 1) {
  c.fillStyle = "#17130F"; c.fillRect(-800, -600, W + 1600, H + 1200);
  dof(c, blurBg, () => {
    c.save(); c.translate(-pan * 0.4, 0);
    // duvar: sıcak bej sıva + süpürgelik
    const wg = c.createLinearGradient(0, 0, 0, 760); wg.addColorStop(0, "#2E2620"); wg.addColorStop(1, "#4A3C30");
    c.fillStyle = wg; c.fillRect(-800, -100, W + 1600, 860);
    // pencere + gece şehri
    c.fillStyle = "#0B1220"; c.fillRect(1240, 120, 520, 380);
    bokeh(c, t, 14, 300, 490, 77, 0.35);
    for (let i = 0; i < 9; i++) { c.fillStyle = "#121A28"; c.fillRect(1250 + i * 58, 330 - rnd(i, 3) * 120, 46, 200); for (let w = 0; w < 6; w++) if (rnd(i * 7 + w, 4) > 0.55) { c.fillStyle = "rgba(255,210,140,0.55)"; c.fillRect(1258 + i * 58 + (w % 2) * 18, 350 - rnd(i, 3) * 110 + Math.floor(w / 2) * 34, 10, 14); } }
    c.strokeStyle = "#5A4A3A"; c.lineWidth = 16; c.strokeRect(1240, 120, 520, 380); c.lineWidth = 8; c.beginPath(); c.moveTo(1500, 120); c.lineTo(1500, 500); c.stroke();
    // perde
    c.fillStyle = "#7A5A44"; for (let i = 0; i < 6; i++) { c.fillRect(1180 + i * 10 + Math.sin(t * 0.7 + i) * 2, 100, 12, 430); }
    // buzdolabı + magnet notlar
    c.fillStyle = "#C9C6BE"; rr(c, 60, 180, 260, 580, 14); c.fill();
    c.fillStyle = "rgba(0,0,0,0.15)"; c.fillRect(60, 400, 260, 6); c.fillStyle = "#8A8780"; c.fillRect(280, 260, 10, 100); c.fillRect(280, 440, 10, 120);
    ["#E2C24A", "#D27A5A", "#7AA6C2"].forEach((col, i) => { c.save(); c.translate(130 + i * 50, 250 + i * 30); c.rotate((i - 1) * 0.1); c.fillStyle = col; c.fillRect(-22, -26, 44, 52); c.restore(); });
    // üst dolaplar
    c.fillStyle = "#6A4E36"; for (let i = 0; i < 3; i++) { rr(c, 380 + i * 250, 140, 230, 200, 6); c.fill(); c.fillStyle = "#3A2A1C"; c.fillRect(380 + i * 250 + 200, 230, 8, 40); c.fillStyle = "#6A4E36"; }
    // çamaşır ipi + asılı giysiler
    c.strokeStyle = "rgba(200,190,170,0.5)"; c.lineWidth = 2; c.beginPath(); c.moveTo(1180, 560); c.quadraticCurveTo(1480, 600, 1800, 560); c.stroke();
    [["#5A6B8A", 1260], ["#C9B89A", 1400], ["#8A3A40", 1560], ["#E0DCD2", 1700]].forEach(([col, x], i) => {
      const sw = Math.sin(t * 1.2 + i) * 0.04; c.save(); c.translate(x as number, 578 + Math.sin(i) * 6); c.rotate(sw);
      c.fillStyle = col as string; rr(c, -40, 0, 80, 110, 6); c.fill(); c.fillStyle = "rgba(0,0,0,0.18)"; c.fillRect(-40, 0, 80, 10); c.restore();
    });
    c.restore();
  });
  // tezgâh (orta plan)
  c.save(); c.translate(-pan * 0.8, 0);
  c.fillStyle = "#3A2C20"; c.fillRect(340, 560, 820, 220);
  c.fillStyle = "#8A8378"; c.fillRect(330, 548, 840, 18);
  c.fillStyle = "#B8B4AA"; rr(c, 620, 552, 200, 14, 6); c.fill(); // evye
  c.fillStyle = "#9A9890"; c.fillRect(712, 500, 8, 52); c.fillRect(712, 500, 40, 8); // musluk
  // bulaşık yığını
  for (let i = 0; i < 5; i++) { c.fillStyle = i % 2 ? "#E6E2D8" : "#D2CEC4"; c.beginPath(); c.ellipse(500, 540 - i * 7, 70, 10, 0, 0, Math.PI * 2); c.fill(); }
  c.fillStyle = "#6A8AA0"; rr(c, 900, 500, 50, 50, 8); c.fill(); c.fillStyle = "#C2A050"; rr(c, 970, 510, 40, 40, 6); c.fill();
  c.restore();
  // zemin: ahşap parke
  const fg = c.createLinearGradient(0, 760, 0, H); fg.addColorStop(0, "#5A4030"); fg.addColorStop(1, "#24180F");
  c.fillStyle = fg; c.fillRect(-800, 760, W + 1600, 800);
  c.strokeStyle = "rgba(0,0,0,0.22)"; c.lineWidth = 2;
  for (let i = 0; i < 9; i++) { c.beginPath(); c.moveTo(-800, 780 + i * i * 5); c.lineTo(W + 800, 780 + i * i * 5); c.stroke(); }
  // tavan lambası
  c.fillStyle = "#2A2420"; c.fillRect(956, -100, 4, 190);
  c.fillStyle = "#D8B070"; c.beginPath(); c.moveTo(900, 140); c.lineTo(1016, 140); c.lineTo(990, 90); c.lineTo(926, 90); c.fill();
  lightCone(c, 958, 140, Math.PI / 2, 0.55, 760, 0.16 * lamp, "255,214,150");
  lightPool(c, 958, 820, 700, "rgba(255,210,150,", 0.2 * lamp);
}

const CHORE_ICON: Record<string, (c: Ctx) => void> = {
  dish: (c) => { c.beginPath(); c.ellipse(0, 4, 20, 7, 0, 0, Math.PI * 2); c.fill(); c.beginPath(); c.ellipse(0, -6, 16, 5, 0, 0, Math.PI * 2); c.fill(); },
  wash: (c) => { rr(c, -18, -20, 36, 40, 5); c.fill(); c.fillStyle = "rgba(0,0,0,0.35)"; c.beginPath(); c.arc(0, 4, 11, 0, Math.PI * 2); c.fill(); },
  trash: (c) => { c.fillRect(-14, -12, 28, 30); c.fillRect(-18, -18, 36, 6); },
  cook: (c) => { c.beginPath(); c.arc(0, 2, 16, 0, Math.PI); c.fill(); c.fillRect(-24, 0, 48, 4); c.fillRect(16, -2, 18, 4); },
  bath: (c) => { rr(c, -22, -4, 44, 18, 8); c.fill(); c.fillRect(-18, -20, 4, 16); },
  shop: (c) => { c.beginPath(); c.moveTo(-18, -10); c.lineTo(18, -10); c.lineTo(14, 18); c.lineTo(-14, 18); c.fill(); c.strokeRect(-8, -20, 16, 12); },
  plan: (c) => { c.fillRect(-16, -18, 32, 36); c.fillStyle = "rgba(0,0,0,0.35)"; for (let i = 0; i < 3; i++) c.fillRect(-10, -10 + i * 10, 20, 3); },
  fold: (c) => { c.beginPath(); c.moveTo(-20, -6); c.lineTo(-8, -16); c.lineTo(8, -16); c.lineTo(20, -6); c.lineTo(14, 2); c.lineTo(14, 16); c.lineTo(-14, 16); c.lineTo(-14, 2); c.fill(); },
};
export const CHORES = [
  ["dish", "皿洗い"], ["wash", "洗濯"], ["trash", "ゴミ出し"], ["cook", "料理"],
  ["bath", "風呂掃除"], ["shop", "買い出し"], ["plan", "献立"], ["fold", "たたむ"],
] as const;

/** 家事カード (ev işi karosu). lit: içeriden görülen (sıcak), frag: dışarıdan parçalı (0..1 eksik), seen: dışarıdan görülen kısım */
export function choreTile(c: Ctx, x: number, y: number, s: number, i: number, o: { lit?: number; frag?: number; alpha?: number; rot?: number; label?: boolean; yellow?: number } = {}) {
  const a = o.alpha ?? 1; if (a <= 0.001) return;
  const [ic, lb] = CHORES[((i % CHORES.length) + CHORES.length) % CHORES.length];
  const lit = clamp(o.lit ?? 0), frag = clamp(o.frag ?? 0), yl = clamp(o.yellow ?? 0);
  c.save(); c.globalAlpha *= clamp(a); c.translate(x, y); c.rotate(o.rot ?? 0); c.scale(s, s);
  if (lit > 0) lightPool(c, 0, 0, 120, "rgba(255,206,140,", 0.22 * lit);
  if (yl > 0) lightPool(c, 0, 0, 130, "rgba(242,207,58,", 0.4 * yl);
  c.fillStyle = "rgba(0,0,0,0.4)"; rr(c, -56, -52, 116, 112, 10); c.fill();
  c.fillStyle = `rgb(${lerp(86, 222, lit)},${lerp(84, 210, lit)},${lerp(80, 186, lit)})`; rr(c, -58, -56, 116, 112, 10); c.fill();
  if (yl > 0) { c.strokeStyle = `rgba(242,207,58,${yl})`; c.lineWidth = 4; rr(c, -58, -56, 116, 112, 10); c.stroke(); }
  c.save(); c.translate(0, -12); c.fillStyle = lit > 0.5 ? "#5A3E2A" : "#2E2A26"; c.strokeStyle = c.fillStyle; c.lineWidth = 3; CHORE_ICON[ic](c); c.restore();
  if (o.label !== false) { c.fillStyle = lit > 0.5 ? C.ink : "rgba(26,29,36,0.6)"; c.font = font(700, 18, true); c.textAlign = "center"; c.fillText(lb, 0, 40); }
  // parçalı görünüm: karonun çoğu karanlıkta (kırık maske)
  if (frag > 0) {
    c.fillStyle = `rgba(10,12,16,${0.92 * frag})`;
    for (let k = 0; k < 6; k++) { if (rnd(i * 13 + k, 9) < 0.3) continue; const yy = -56 + k * 19; c.fillRect(-60, yy, 120, 19.5); }
  }
  c.restore();
}

/** İki kişinin cevapladığı paylar: iki çubuk üst üste → %100 çizgisi. k: dolum, stack: üst üste binme, over: aşma vurgusu */
export function shareBars(c: Ctx, t: number, x: number, y: number, h: number, a: number, b: number, o: { ka?: number; kb?: number; stack?: number; over?: number; colA?: string; colB?: string } = {}) {
  const ka = clamp(o.ka ?? 1), kb = clamp(o.kb ?? 1), st = clamp(o.stack ?? 0), ov = clamp(o.over ?? 0);
  const colA = o.colA ?? "#C9A06A", colB = o.colB ?? "#6A8AA8";
  const bw = 150, gap = 140;
  const ha = h * a / 100 * ka, hb = h * b / 100 * kb;
  // %100 çizgisi
  const ly = y - h;
  c.save();
  c.strokeStyle = `rgba(232,234,238,${0.5 + 0.5 * ov})`; c.lineWidth = 3; c.setLineDash([16, 10]);
  c.beginPath(); c.moveTo(x - 360, ly); c.lineTo(x + 360, ly); c.stroke(); c.setLineDash([]);
  c.fillStyle = C.mist; c.font = font(700, 30); c.textAlign = "right"; c.fillText("100%", x - 372, ly + 10);
  // taban
  c.fillStyle = "rgba(232,234,238,0.3)"; c.fillRect(x - 360, y, 720, 3);
  // A çubuğu: solda → ortaya kayar
  const ax = lerp(x - gap - bw / 2, x - bw / 2, st), bx = lerp(x + gap - bw / 2, x - bw / 2, st);
  const by = lerp(y, y - ha, st);
  c.fillStyle = colA; c.fillRect(ax, y - ha, bw, ha);
  c.fillStyle = "rgba(255,255,255,0.12)"; c.fillRect(ax, y - ha, 14, ha);
  c.fillStyle = colB; c.fillRect(bx, by - hb, bw, hb);
  c.fillStyle = "rgba(255,255,255,0.12)"; c.fillRect(bx, by - hb, 14, hb);
  // aşan kısım: kırmızı-sarı vurgu
  const top = by - hb;
  if (st > 0.95 && top < ly) {
    c.fillStyle = `rgba(226,96,58,${0.35 + 0.3 * ov + 0.1 * Math.sin(t * 8) * ov})`; c.fillRect(bx - 6, top, bw + 12, ly - top);
    c.strokeStyle = `rgba(242,207,58,${ov})`; c.lineWidth = 4; c.strokeRect(bx - 6, top, bw + 12, ly - top);
  }
  // yüzde etiketleri
  c.font = font(800, 40); c.textAlign = "center"; c.fillStyle = C.text;
  if (ka > 0.05) c.fillText(`${Math.round(a * ka)}%`, ax + bw / 2, (st > 0.5 ? y - ha / 2 + 14 : y - ha - 16));
  if (kb > 0.05) c.fillText(`${Math.round(b * kb)}%`, bx + bw / 2, (st > 0.5 ? by - hb / 2 + 14 : by - hb - 16));
  c.restore();
}

/** Cevap kâğıdı: 「家事のうち、自分が担っている割合」 + yazılan yüzde (write 0..1) */
export function answerSlip(c: Ctx, x: number, y: number, s: number, o: { pct: number; write?: number; rot?: number; alpha?: number; ok?: number } = { pct: 0 }) {
  const a = o.alpha ?? 1; if (a <= 0.001) return;
  const w = clamp(o.write ?? 0);
  c.save(); c.globalAlpha *= clamp(a); c.translate(x, y); c.rotate(o.rot ?? 0); c.scale(s, s);
  c.fillStyle = "rgba(0,0,0,0.4)"; rr(c, -146, -96, 300, 200, 6); c.fill();
  c.fillStyle = C.paper; rr(c, -150, -100, 300, 200, 6); c.fill();
  c.fillStyle = "rgba(26,29,36,0.75)"; c.font = font(600, 20, true); c.textAlign = "left";
  c.fillText("家事のうち、自分が", -126, -60); c.fillText("担っている割合は？", -126, -32);
  c.strokeStyle = "rgba(26,29,36,0.35)"; c.lineWidth = 2; c.beginPath(); c.moveTo(-60, 60); c.lineTo(110, 60); c.stroke();
  if (w > 0) {
    c.save(); c.beginPath(); c.rect(-60, 0, 170 * w, 70); c.clip();
    c.fillStyle = "#2A3A6A"; c.font = font(700, 58); c.textAlign = "center"; c.fillText(`${o.pct}%`, 26, 54); c.restore();
  }
  const ok = clamp(o.ok ?? 0);
  if (ok > 0) { c.strokeStyle = `rgba(46,125,74,${ok})`; c.lineWidth = 6; c.beginPath(); c.moveTo(-120, 40); c.lineTo(-104, 58); c.lineTo(-76, 22); c.stroke(); }
  c.restore();
}
