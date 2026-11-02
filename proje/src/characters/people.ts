// İnsan figürleri: yarı silüet, minimal yüz. Ayaklar (0,0), ölçek 1'de boy ≈ 300px.
import { C, rr } from "../design/style";
import { clamp } from "../engine/core";

export interface PersonOpts {
  body?: string;       // gövde rengi
  head?: string;
  rim?: number;        // kenar ışığı 0..1
  rimSide?: number;    // -1 sol, 1 sağ
  glow?: number;       // sarı "görülme" halesi 0..1
  alpha?: number;
  pose?: "stand" | "sit" | "desk";
  facing?: number;     // -1 sola, 0 öne, 1 sağa (yüz detayı yok, sadece kafa kayması)
  shirt?: "white" | "black" | "none";
  armUp?: number;      // 0..1 kollar (pas atma)
  bob?: number;        // dikey oynama
  eye?: number;        // 0 yok, 1 göz noktaları görünür
  gazeX?: number;
  outfit?: number;     // kıyafet paleti
  walk?: number;       // yürüyüş fazı (-1 = yok)
  shade?: number;      // karanlıkta kalma 0..1
  tie?: boolean;
}

const OUTFITS = [
  { shirt: "#2F4A6B", pants: "#1E232B", skin: "#C99A7A", hair: "#1A1410" },
  { shirt: "#B9A88A", pants: "#2A2D33", skin: "#D8AE8E", hair: "#2B1E14" },
  { shirt: "#5A6B4A", pants: "#23262B", skin: "#B98666", hair: "#120E0A" },
  { shirt: "#6E2F35", pants: "#1C1F25", skin: "#D2A283", hair: "#3A2A1A" },
  { shirt: "#3D4A5A", pants: "#14171C", skin: "#C48F6C", hair: "#0E0C0A" },
  { shirt: "#8C8C88", pants: "#262A30", skin: "#DDB497", hair: "#4A3420" },
];

export function drawPerson(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, o: PersonOpts = {}) {
  const p = { body: "", head: "", rim: 0.6, rimSide: 1, glow: 0, alpha: 1, pose: "stand", facing: 0, shirt: "none", armUp: 0, bob: 0, eye: 0, gazeX: 0, outfit: 0, walk: -1, shade: 0, tie: false, ...o } as any;
  if (p.alpha <= 0) return;
  const of = OUTFITS[((p.outfit % OUTFITS.length) + OUTFITS.length) % OUTFITS.length];
  const shirt = p.shirt === "white" ? "#E4E4DE" : p.shirt === "black" ? "#1A1C20" : (p.body || of.shirt);
  const skin = p.head || of.skin;
  ctx.save();
  ctx.globalAlpha *= p.alpha;
  ctx.translate(x, y + p.bob);
  ctx.scale(s, s);
  if (p.shade > 0) ctx.filter = `brightness(${(1 - p.shade).toFixed(2)})`; // karanlıkta kalan figür
  if (p.glow > 0) {
    const g = ctx.createRadialGradient(0, -150, 10, 0, -150, 240);
    g.addColorStop(0, `rgba(242,207,58,${0.4 * p.glow})`); g.addColorStop(1, "rgba(242,207,58,0)");
    ctx.fillStyle = g; ctx.fillRect(-250, -420, 500, 500);
  }
  const sit = p.pose !== "stand";
  const hy = sit ? -168 : -250;
  const shY = hy + 64;
  ctx.fillStyle = "rgba(0,0,0,0.45)";
  ctx.beginPath(); ctx.ellipse(0, 3, 62, 10, 0, 0, Math.PI * 2); ctx.fill();
  // bacaklar + ayakkabı (yürüyüş döngüsü)
  if (!sit) {
    const w = p.walk >= 0 ? Math.sin(p.walk * Math.PI * 2) : 0;
    for (const sd of [-1, 1]) {
      const sw = sd * w * 18;
      ctx.fillStyle = of.pants;
      ctx.beginPath(); ctx.moveTo(sd * 6 - 14 + 0, -104); ctx.lineTo(sd * 18 - 12 + sw, -8); ctx.lineTo(sd * 18 + 12 + sw, -8); ctx.lineTo(sd * 6 + 16, -104); ctx.closePath(); ctx.fill();
      ctx.fillStyle = "#0F1013";
      rr(ctx, sd * 18 - 15 + sw + sd * 4, -12, 32, 13, 6); ctx.fill();
    }
  } else {
    ctx.fillStyle = of.pants; rr(ctx, -40, -40, 80, 30, 10); ctx.fill();
  }
  // arka kol
  const arm = (sd: number) => {
    const up = p.armUp, sw = p.walk >= 0 ? -sd * Math.sin(p.walk * Math.PI * 2) * 14 : 0;
    const ex = sd * (54 + 10 * up) + sw, ey = shY + 52 - 40 * up;
    const hx = sd * (46 + 24 * up) + sw * 1.4, hy2 = shY + 104 - 124 * up;
    ctx.strokeStyle = shirt; ctx.lineCap = "round"; ctx.lineWidth = 21;
    ctx.beginPath(); ctx.moveTo(sd * 40, shY); ctx.quadraticCurveTo(ex, ey, hx, hy2); ctx.stroke();
    ctx.fillStyle = skin; ctx.beginPath(); ctx.arc(hx, hy2 + 6, 10, 0, Math.PI * 2); ctx.fill();
  };
  arm(-1);
  // gövde (gömlek) + kumaş gölgesi
  ctx.fillStyle = shirt;
  ctx.beginPath();
  ctx.moveTo(-47, shY - 6); ctx.quadraticCurveTo(0, shY - 22, 47, shY - 6);
  ctx.lineTo(sit ? 50 : 42, sit ? -30 : -96); ctx.quadraticCurveTo(0, sit ? -22 : -88, sit ? -50 : -42, sit ? -30 : -96);
  ctx.closePath(); ctx.fill();
  const fold = ctx.createLinearGradient(-47, 0, 47, 0);
  fold.addColorStop(0, "rgba(0,0,0,0.25)"); fold.addColorStop(0.45, "rgba(0,0,0,0)"); fold.addColorStop(1, "rgba(0,0,0,0.35)");
  ctx.fillStyle = fold; ctx.fill();
  // yaka
  ctx.fillStyle = "rgba(255,255,255,0.18)";
  ctx.beginPath(); ctx.moveTo(-14, shY - 14); ctx.lineTo(0, shY + 6); ctx.lineTo(14, shY - 14); ctx.closePath(); ctx.fill();
  if (p.tie) { ctx.fillStyle = "#5A1F24"; ctx.beginPath(); ctx.moveTo(-5, shY - 8); ctx.lineTo(5, shY - 8); ctx.lineTo(8, shY + 60); ctx.lineTo(0, shY + 72); ctx.lineTo(-8, shY + 60); ctx.closePath(); ctx.fill(); }
  // boyun + kafa
  ctx.fillStyle = skin; ctx.fillRect(-10, hy + 28, 20, 24);
  const hx = p.facing * 7;
  ctx.beginPath(); ctx.ellipse(hx, hy, 31, 37, 0, 0, Math.PI * 2); ctx.fill();
  // yüz gölgesi (ışık yönü)
  const fs = ctx.createLinearGradient(hx - 31, 0, hx + 31, 0);
  fs.addColorStop(0, p.rimSide > 0 ? "rgba(0,0,0,0.45)" : "rgba(0,0,0,0)"); fs.addColorStop(1, p.rimSide > 0 ? "rgba(0,0,0,0)" : "rgba(0,0,0,0.45)");
  ctx.fillStyle = fs; ctx.beginPath(); ctx.ellipse(hx, hy, 31, 37, 0, 0, Math.PI * 2); ctx.fill();
  // kulak
  ctx.fillStyle = skin; ctx.beginPath(); ctx.ellipse(hx - 31 + p.facing * 4, hy + 4, 6, 9, 0, 0, Math.PI * 2); ctx.ellipse(hx + 31 + p.facing * 4, hy + 4, 6, 9, 0, 0, Math.PI * 2); ctx.fill();
  // saç
  ctx.fillStyle = of.hair;
  ctx.beginPath(); ctx.ellipse(hx - p.facing * 3, hy - 14, 34, 27, 0, Math.PI * 0.95, Math.PI * 2.05); ctx.fill();
  ctx.beginPath(); ctx.ellipse(hx - 22 - p.facing * 6, hy - 6, 10, 18, 0.3, 0, Math.PI * 2); ctx.fill();
  if (p.eye > 0) {
    ctx.fillStyle = `rgba(20,16,14,${0.85 * p.eye})`;
    for (const sd of [-1, 1]) { ctx.beginPath(); ctx.ellipse(hx + sd * 11 + p.gazeX * 5, hy + 4, 3, 3.6, 0, 0, Math.PI * 2); ctx.fill(); }
  }
  arm(1);
  // rim light
  if (p.rim > 0) {
    ctx.strokeStyle = `rgba(190,215,255,${0.6 * p.rim})`; ctx.lineWidth = 3;
    const sd = p.rimSide;
    ctx.beginPath();
    if (sd > 0) ctx.arc(hx, hy, 33, -1.3, 0.6); else ctx.arc(hx, hy, 33, Math.PI - 0.6, Math.PI + 1.3);
    ctx.stroke();
    ctx.beginPath(); ctx.moveTo(sd * 47, shY - 4); ctx.lineTo(sd * (sit ? 50 : 42), sit ? -34 : -100); ctx.stroke();
  }
  ctx.restore();
}

/** Masa başında çalışan figür (yan görünüm değil, önden masa) */
export function drawDesk(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, lamp = 0.8) {
  ctx.save();
  ctx.translate(x, y); ctx.scale(s, s);
  ctx.fillStyle = "#1A2029";
  ctx.fillRect(-170, -12, 340, 16);
  ctx.fillStyle = "#12161D";
  ctx.fillRect(-160, 4, 14, 110); ctx.fillRect(146, 4, 14, 110);
  if (lamp > 0) {
    ctx.strokeStyle = "#2B323D"; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(130, -12); ctx.lineTo(115, -100); ctx.lineTo(70, -120); ctx.stroke();
    ctx.fillStyle = "#2B323D";
    ctx.beginPath(); ctx.moveTo(52, -132); ctx.lineTo(92, -126); ctx.lineTo(80, -100); ctx.closePath(); ctx.fill();
    const g = ctx.createRadialGradient(60, -12, 5, 60, -12, 170);
    g.addColorStop(0, `rgba(255,220,150,${0.28 * lamp})`);
    g.addColorStop(1, "rgba(255,220,150,0)");
    ctx.fillStyle = g; ctx.fillRect(-120, -180, 360, 200);
  }
  ctx.restore();
}

export interface GorillaOpts { walk?: number; beat?: number; alpha?: number; rim?: number; dim?: number }

/** Goril kostümlü figür (genel, telifsiz silüet). Ayaklar (0,0), boy ≈ 320px */
export function drawGorilla(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, o: GorillaOpts = {}) {
  const p = { walk: 0, beat: 0, alpha: 1, rim: 0.7, dim: 0, ...o };
  ctx.save();
  ctx.globalAlpha *= p.alpha;
  ctx.translate(x, y); ctx.scale(s, s);
  const sw = Math.sin(p.walk * Math.PI * 2);
  const base = p.dim > 0 ? "#2E2A28" : "#24201D";
  ctx.fillStyle = "rgba(0,0,0,0.45)";
  ctx.beginPath(); ctx.ellipse(0, 3, 90, 12, 0, 0, Math.PI * 2); ctx.fill();
  // bacaklar
  ctx.fillStyle = base;
  rr(ctx, -52 + sw * 10, -110, 42, 110, 18); ctx.fill();
  rr(ctx, 10 - sw * 10, -110, 42, 110, 18); ctx.fill();
  // gövde (kambur)
  ctx.beginPath();
  ctx.moveTo(-80, -90);
  ctx.bezierCurveTo(-110, -200, -70, -280, 0, -282);
  ctx.bezierCurveTo(70, -280, 110, -200, 80, -90);
  ctx.quadraticCurveTo(0, -70, -80, -90);
  ctx.fill();
  // göğüs
  ctx.fillStyle = "#332B26";
  ctx.beginPath(); ctx.ellipse(0, -185, 46, 52, 0, 0, Math.PI * 2); ctx.fill();
  // kollar: göğüs vurma pozu ile sarkık kollar arasında
  const b = p.beat;
  ctx.strokeStyle = base; ctx.lineWidth = 34; ctx.lineCap = "round";
  for (const sd of [-1, 1]) {
    const hit = b * (0.6 + 0.4 * Math.abs(Math.sin((b * 6 + (sd > 0 ? 0 : 0.5)) * Math.PI)));
    const hx = sd * (95 - 70 * hit) + (1 - b) * sd * sw * -8, hy = -60 - 130 * hit;
    ctx.beginPath(); ctx.moveTo(sd * 70, -240); ctx.quadraticCurveTo(sd * (115 - 30 * hit), -160 - 40 * hit, hx, hy); ctx.stroke();
  }
  // kürk dokusu
  ctx.strokeStyle = "rgba(70,60,52,0.35)"; ctx.lineWidth = 2;
  for (let i = 0; i < 70; i++) { const fx = (Math.sin(i * 12.9) * 0.5) * 150, fy = -100 - ((i * 37) % 170); ctx.beginPath(); ctx.moveTo(fx, fy); ctx.lineTo(fx + 4, fy + 9); ctx.stroke(); }
  // kafa
  ctx.fillStyle = base;
  ctx.beginPath(); ctx.ellipse(0, -300, 44, 46, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#30333A";
  ctx.beginPath(); ctx.ellipse(0, -288, 28, 24, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#101114";
  ctx.fillRect(-26, -322, 52, 9);
  ctx.fillStyle = "rgba(200,200,200,0.7)";
  ctx.beginPath(); ctx.arc(-12, -308, 3, 0, Math.PI * 2); ctx.arc(12, -308, 3, 0, Math.PI * 2); ctx.fill();
  // rim
  if (p.rim > 0) {
    ctx.strokeStyle = `rgba(185,210,250,${0.45 * p.rim})`; ctx.lineWidth = 3.5;
    ctx.beginPath(); ctx.arc(0, -300, 46, -1.4, 0.4); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, -282); ctx.bezierCurveTo(70, -280, 110, -200, 80, -90); ctx.stroke();
  }
  ctx.restore();
}

/** Basit top */
export function drawBall(ctx: CanvasRenderingContext2D, x: number, y: number, r = 11, a = 1) {
  ctx.fillStyle = `rgba(214,120,60,${a})`;
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = `rgba(0,0,0,${0.5 * a})`; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(x - r, y); ctx.lineTo(x + r, y); ctx.stroke();
  ctx.fillStyle = `rgba(255,255,255,${0.25 * a})`;
  ctx.beginPath(); ctx.arc(x - r * 0.35, y - r * 0.35, r * 0.3, 0, Math.PI * 2); ctx.fill();
  void clamp;
}
