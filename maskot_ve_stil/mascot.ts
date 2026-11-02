// Maskot: limon dedektif. Ayaklar (0,0) noktasında, ölçek 1'de boy ≈ 560px.
import { C } from "./style";
import { clamp } from "./core";

export interface MascotPose {
  blink?: number;          // 0 açık (yarı kapalı doğal hali) .. 1 tamamen kapalı
  lookX?: number;          // -1..1 göz bebeği
  lookY?: number;
  mouth?: number;          // 0..1 konuşma
  armL?: number;           // radyan, 0 = aşağı sarkık, pozitif = dışa/yukarı
  armR?: number;
  prop?: "none" | "flashlight" | "magnifier";
  tilt?: number;           // gövde eğimi (radyan)
  rim?: number;            // arka kenar ışığı 0..1
  light?: number;          // genel aydınlık 0..1
  brow?: number;           // -1 çatık .. 1 kalkık
}

function arm(ctx: CanvasRenderingContext2D, side: number, ang: number, prop: string, light: number) {
  const sx = side * 118, sy = -268;
  const a = side * ang;
  // dirsek ve el
  const ex = sx + Math.sin(a) * 92 + side * 8, ey = sy + Math.cos(a) * 92;
  const a2 = a * 1.25;
  const hx = ex + Math.sin(a2) * 86, hy = ey + Math.cos(a2) * 86;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = "#0E1118";
  ctx.lineWidth = 40;
  ctx.beginPath(); ctx.moveTo(sx, sy); ctx.quadraticCurveTo(ex, ey, hx, hy); ctx.stroke();
  ctx.strokeStyle = C.coat2;
  ctx.lineWidth = 34;
  ctx.beginPath(); ctx.moveTo(sx, sy); ctx.quadraticCurveTo(ex, ey, hx - Math.sin(a2) * 18, hy - Math.cos(a2) * 18); ctx.stroke();
  // el
  ctx.fillStyle = shadeYellow(light * 0.92);
  ctx.beginPath(); ctx.ellipse(hx, hy, 17, 20, a2, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = "rgba(0,0,0,0.5)"; ctx.lineWidth = 2; ctx.stroke();
  if (prop === "flashlight") {
    ctx.save();
    ctx.translate(hx, hy);
    ctx.rotate(-a2 + Math.PI / 2 * side);
    ctx.fillStyle = "#2A2F38";
    ctx.fillRect(-8, -12, 52, 24);
    ctx.fillStyle = "#3A414D";
    ctx.fillRect(40, -16, 14, 32);
    ctx.fillStyle = "rgba(255,240,190,0.9)";
    ctx.fillRect(52, -13, 3, 26);
    ctx.restore();
  }
  if (prop === "magnifier") {
    ctx.save();
    ctx.translate(hx, hy);
    ctx.strokeStyle = "#3a3026"; ctx.lineWidth = 9;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(side * 30, -40); ctx.stroke();
    ctx.strokeStyle = "#9a8a6a"; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.arc(side * 52, -72, 34, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = "rgba(200,220,240,0.12)"; ctx.fill();
    ctx.restore();
  }
}

function shadeYellow(k: number) {
  // k: 0 karanlık .. 1 tam ışık
  const r = Math.round(70 + 172 * k), g = Math.round(58 + 149 * k), b = Math.round(20 + 38 * k);
  return `rgb(${r},${g},${b})`;
}

export function drawMascot(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, pose: MascotPose = {}) {
  const p = { blink: 0, lookX: 0, lookY: 0, mouth: 0, armL: 0.12, armR: 0.12, prop: "none", tilt: 0, rim: 0.8, light: 0.9, brow: 0, ...pose };
  const L = p.light;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.rotate(p.tilt);

  // zemin gölgesi
  ctx.fillStyle = "rgba(0,0,0,0.45)";
  ctx.beginPath(); ctx.ellipse(0, 4, 120, 16, 0, 0, Math.PI * 2); ctx.fill();

  // bacaklar + ayakkabı
  for (const sd of [-1, 1]) {
    ctx.fillStyle = shadeYellow(L * 0.7);
    ctx.beginPath();
    ctx.moveTo(sd * 30 - 13, -110); ctx.lineTo(sd * 34 - 11, -26); ctx.lineTo(sd * 34 + 13, -26); ctx.lineTo(sd * 30 + 15, -110);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#0D1015";
    ctx.beginPath(); ctx.ellipse(sd * 40, -12, 38, 15, 0, Math.PI, 0); ctx.lineTo(sd * 40 + 38, 0); ctx.lineTo(sd * 40 - 38, 0); ctx.closePath(); ctx.fill();
  }

  // arka kol (sol)
  arm(ctx, -1, p.armL, "none", L);

  // gövde (limon)
  const bodyPath = () => {
    ctx.beginPath();
    ctx.moveTo(0, -548);
    ctx.bezierCurveTo(70, -545, 150, -470, 152, -330);
    ctx.bezierCurveTo(154, -200, 110, -88, 0, -86);
    ctx.bezierCurveTo(-110, -88, -154, -200, -152, -330);
    ctx.bezierCurveTo(-150, -470, -70, -545, 0, -548);
    ctx.closePath();
  };
  bodyPath();
  const g = ctx.createRadialGradient(-55, -420, 20, 0, -320, 260);
  g.addColorStop(0, shadeYellow(L * 1.0));
  g.addColorStop(0.55, shadeYellow(L * 0.86));
  g.addColorStop(1, shadeYellow(L * 0.55));
  ctx.fillStyle = g;
  ctx.fill();

  // yüzey benekleri (az)
  ctx.save();
  bodyPath(); ctx.clip();
  ctx.fillStyle = `rgba(150,110,10,${0.18 * L})`;
  const dots = [[-110, -300], [-95, -250], [110, -380], [120, -330], [-60, -460], [85, -470]];
  for (const [dx, dy] of dots) { ctx.beginPath(); ctx.ellipse(dx, dy, 4, 6, 0.3, 0, Math.PI * 2); ctx.fill(); }

  // trençkot (gövdenin alt yarısı)
  ctx.fillStyle = C.coat;
  ctx.beginPath();
  ctx.moveTo(-170, -262);
  ctx.quadraticCurveTo(0, -248, 170, -262);
  ctx.lineTo(170, -60); ctx.lineTo(-170, -60); ctx.closePath();
  ctx.fill();
  // yaka (lapel V)
  ctx.fillStyle = C.coat2;
  ctx.beginPath();
  ctx.moveTo(-120, -262); ctx.lineTo(-18, -255); ctx.lineTo(-6, -170); ctx.lineTo(-60, -205); ctx.closePath(); ctx.fill();
  ctx.beginPath();
  ctx.moveTo(120, -262); ctx.lineTo(18, -255); ctx.lineTo(6, -170); ctx.lineTo(60, -205); ctx.closePath(); ctx.fill();
  // kemer
  ctx.fillStyle = "#151A23";
  ctx.fillRect(-170, -158, 340, 18);
  ctx.fillStyle = "#6B5A3E";
  ctx.fillRect(-14, -161, 28, 24);
  ctx.fillStyle = "#151A23";
  ctx.fillRect(-7, -155, 14, 12);
  // düğmeler
  ctx.fillStyle = "#0E1218";
  for (const by of [-215, -120]) { ctx.beginPath(); ctx.arc(-26, by, 5, 0, Math.PI * 2); ctx.arc(26, by, 5, 0, Math.PI * 2); ctx.fill(); }
  // gövde gölgesi (sağ taraf)
  const sh = ctx.createLinearGradient(-150, 0, 160, 0);
  sh.addColorStop(0, "rgba(0,0,0,0)");
  sh.addColorStop(0.6, "rgba(0,0,0,0.05)");
  sh.addColorStop(1, "rgba(0,0,0,0.38)");
  ctx.fillStyle = sh;
  ctx.fillRect(-160, -560, 330, 520);
  ctx.restore();

  // kontur + rim light
  bodyPath();
  ctx.strokeStyle = "rgba(10,10,12,0.85)";
  ctx.lineWidth = 4;
  ctx.stroke();
  if (p.rim > 0) {
    ctx.save();
    bodyPath(); ctx.clip();
    ctx.strokeStyle = `rgba(190,215,255,${0.55 * p.rim})`;
    ctx.lineWidth = 7;
    ctx.translate(-5, 3);
    ctx.beginPath();
    ctx.moveTo(40, -545);
    ctx.bezierCurveTo(110, -520, 152, -440, 152, -330);
    ctx.bezierCurveTo(154, -220, 125, -130, 70, -95);
    ctx.stroke();
    ctx.restore();
  }

  // ---- yüz ----
  const eyeY = -392;
  // kaşlar
  ctx.strokeStyle = "#141414";
  ctx.lineCap = "round";
  ctx.lineWidth = 9;
  const bL = -6 * p.brow;
  ctx.beginPath(); ctx.moveTo(-88, eyeY - 54 + bL); ctx.quadraticCurveTo(-55, eyeY - 66 + bL, -20, eyeY - 56 + bL * 0.5); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(88, eyeY - 54 + bL); ctx.quadraticCurveTo(55, eyeY - 66 + bL, 20, eyeY - 56 + bL * 0.5); ctx.stroke();

  // gözler (doğal hali yarı kapalı)
  const lid = clamp(0.45 + 0.55 * p.blink);
  for (const sd of [-1, 1]) {
    const ex = sd * 52;
    ctx.save();
    ctx.beginPath(); ctx.ellipse(ex, eyeY, 27, 20, 0, 0, Math.PI * 2);
    ctx.fillStyle = "#F4F1E6"; ctx.fill();
    ctx.clip();
    ctx.fillStyle = "#111";
    ctx.beginPath(); ctx.arc(ex + p.lookX * 10, eyeY + 5 + p.lookY * 4, 9.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.beginPath(); ctx.arc(ex + p.lookX * 10 + 3, eyeY + 2, 2.6, 0, Math.PI * 2); ctx.fill();
    // göz kapağı
    ctx.fillStyle = shadeYellow(L * 0.92);
    ctx.fillRect(ex - 30, eyeY - 24, 60, 48 * lid);
    ctx.restore();
    ctx.strokeStyle = "#141414"; ctx.lineWidth = 3.5;
    ctx.beginPath(); ctx.moveTo(ex - 28, eyeY - 22 + 44 * lid); ctx.lineTo(ex + 28, eyeY - 22 + 44 * lid); ctx.stroke();
  }
  // gözlük
  ctx.strokeStyle = "#2B2418";
  ctx.lineWidth = 4.5;
  for (const sd of [-1, 1]) { ctx.beginPath(); ctx.arc(sd * 52, eyeY + 2, 40, 0, Math.PI * 2); ctx.stroke(); }
  ctx.beginPath(); ctx.moveTo(-12, eyeY); ctx.quadraticCurveTo(0, eyeY - 8, 12, eyeY); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(92, eyeY - 4); ctx.lineTo(140, eyeY - 10); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-92, eyeY - 4); ctx.lineTo(-140, eyeY - 10); ctx.stroke();
  // camda yansıma
  ctx.strokeStyle = "rgba(220,235,255,0.35)"; ctx.lineWidth = 3;
  for (const sd of [-1, 1]) { ctx.beginPath(); ctx.arc(sd * 52, eyeY + 2, 33, -2.6, -1.9); ctx.stroke(); }

  // burun
  ctx.strokeStyle = "rgba(60,40,0,0.75)"; ctx.lineWidth = 3.5;
  ctx.beginPath(); ctx.moveTo(-4, eyeY + 18); ctx.quadraticCurveTo(-14, eyeY + 52, 2, eyeY + 56); ctx.quadraticCurveTo(14, eyeY + 58, 18, eyeY + 50); ctx.stroke();

  // ağız
  const my = -318;
  if (p.mouth > 0.05) {
    ctx.fillStyle = "#2A1A08";
    ctx.beginPath(); ctx.ellipse(4, my, 26, 4 + 13 * p.mouth, 0, 0, Math.PI * 2); ctx.fill();
  } else {
    ctx.strokeStyle = "#1A1408"; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(-36, my); ctx.quadraticCurveTo(4, my + 6, 42, my - 4); ctx.stroke();
  }

  // ---- şapka (deerstalker) ----
  const hg = ctx.createLinearGradient(-150, -600, 150, -470);
  hg.addColorStop(0, C.hat2); hg.addColorStop(1, C.hat);
  ctx.fillStyle = hg;
  ctx.beginPath();
  ctx.moveTo(-150, -468);
  ctx.bezierCurveTo(-140, -590, -50, -628, 10, -626);
  ctx.bezierCurveTo(90, -622, 150, -570, 152, -470);
  ctx.quadraticCurveTo(0, -500, -150, -468);
  ctx.fill();
  ctx.strokeStyle = "rgba(10,8,5,0.9)"; ctx.lineWidth = 4; ctx.stroke();
  // ön siperlik
  ctx.fillStyle = "#3A2E22";
  ctx.beginPath();
  ctx.moveTo(-160, -470); ctx.quadraticCurveTo(-60, -505, 40, -488); ctx.quadraticCurveTo(-40, -455, -175, -448); ctx.closePath();
  ctx.fill(); ctx.stroke();
  // dikiş çizgileri
  ctx.strokeStyle = "rgba(0,0,0,0.35)"; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(10, -624); ctx.quadraticCurveTo(-30, -560, -40, -488); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(10, -624); ctx.quadraticCurveTo(70, -560, 90, -486); ctx.stroke();
  // kulak bağı + düğme
  ctx.fillStyle = "#3A2E22";
  ctx.beginPath(); ctx.ellipse(-2, -632, 22, 10, -0.3, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(26, -632, 20, 9, 0.4, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#2a2018";
  ctx.beginPath(); ctx.arc(10, -630, 8, 0, Math.PI * 2); ctx.fill();
  // şapka rim
  ctx.strokeStyle = `rgba(190,215,255,${0.35 * p.rim})`; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(60, -615); ctx.quadraticCurveTo(140, -580, 150, -480); ctx.stroke();

  // ön kol (sağ)
  arm(ctx, 1, p.armR, p.prop, L);

  ctx.restore();
}
