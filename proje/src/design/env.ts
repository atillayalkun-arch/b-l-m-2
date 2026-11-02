// Mekânlar: gerçek ortamlar, yerel renklerle (ahşap, duvar, metal, kumaş). Lens sonradan uygulanır.
import { W, H, rnd, lerp } from "../engine/core";
import { rr, lightPool, lightCone } from "./style";
import { bokeh, dof } from "./grade";

const wood = (c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, base = "#5A3A22") => {
  c.fillStyle = base; c.fillRect(x, y, w, h);
  c.strokeStyle = "rgba(30,15,5,0.35)"; c.lineWidth = 1.5;
  for (let i = 0; i < 14; i++) {
    const yy = y + rnd(i, 3) * h;
    c.beginPath(); c.moveTo(x, yy); c.bezierCurveTo(x + w * 0.3, yy + 6, x + w * 0.6, yy - 6, x + w, yy + 3); c.stroke();
  }
};

/** Gece çalışma odası: pencere + şehir, raf, ahşap masa, monitör, kupa, bitki */
export function envNightRoom(c: CanvasRenderingContext2D, t: number, blurBg = 3) {
  // duvar
  const wg = c.createLinearGradient(0, 0, 0, 640);
  wg.addColorStop(0, "#1A1F28"); wg.addColorStop(1, "#262B33");
  c.fillStyle = wg; c.fillRect(-300, -200, W + 600, 900);
  dof(c, blurBg, () => {
    // pencere + şehir
    c.fillStyle = "#0A1220"; c.fillRect(1180, 40, 620, 420);
    const sky = c.createLinearGradient(0, 40, 0, 460);
    sky.addColorStop(0, "#0B1424"); sky.addColorStop(1, "#1C2A40");
    c.fillStyle = sky; c.fillRect(1190, 50, 600, 400);
    for (let i = 0; i < 18; i++) {
      const bx = 1190 + rnd(i, 40) * 560, bw = 30 + rnd(i, 41) * 60, bh = 80 + rnd(i, 42) * 260;
      c.fillStyle = "#0E1522"; c.fillRect(bx, 450 - bh, bw, bh);
      for (let k = 0; k < 10; k++) if (rnd(i * 20 + k, 43) > 0.55) { c.fillStyle = rnd(k, i) > 0.5 ? "rgba(255,200,120,0.75)" : "rgba(170,210,255,0.6)"; c.fillRect(bx + 4 + (k % 3) * (bw / 3), 455 - bh + 10 + Math.floor(k / 3) * 22, 6, 9); }
    }
    bokeh(c, t, 10, 120, 420, 50, 0.25);
    c.strokeStyle = "#2E3440"; c.lineWidth = 16; c.strokeRect(1190, 50, 600, 400);
    c.lineWidth = 8; c.beginPath(); c.moveTo(1490, 50); c.lineTo(1490, 450); c.stroke();
    // raf + kitaplar
    c.fillStyle = "#3B2A1C"; c.fillRect(120, 160, 520, 18); c.fillRect(120, 330, 520, 18);
    const bc = ["#6B2E2A", "#2F4A5E", "#8A7A52", "#3E5A3A", "#5C4A6E", "#A08A64", "#2A2E36"];
    for (const sy of [160, 330]) {
      let x = 135;
      for (let i = 0; i < 18 && x < 620; i++) {
        const bw = 16 + rnd(i, sy) * 16, bh = 90 + rnd(i, sy + 1) * 40;
        c.fillStyle = bc[Math.floor(rnd(i, sy + 2) * bc.length)];
        c.fillRect(x, sy - bh, bw, bh); x += bw + 2;
      }
    }
    // saksı bitki
    c.fillStyle = "#5E4636"; rr(c, 760, 520, 70, 80, 6); c.fill();
    for (let i = 0; i < 9; i++) {
      const a = -Math.PI / 2 + (i - 4) * 0.28 + Math.sin(t * 0.6 + i) * 0.03;
      c.strokeStyle = i % 2 ? "#2E5232" : "#3D6A3E"; c.lineWidth = 10; c.lineCap = "round";
      c.beginPath(); c.moveTo(795, 525); c.quadraticCurveTo(795 + Math.cos(a) * 60, 525 + Math.sin(a) * 90, 795 + Math.cos(a) * 110, 525 + Math.sin(a) * 120); c.stroke();
    }
  });
  // masa (ahşap)
  wood(c, -300, 600, W + 600, 600, "#4A2F1C");
  const sh = c.createLinearGradient(0, 600, 0, H);
  sh.addColorStop(0, "rgba(0,0,0,0)"); sh.addColorStop(1, "rgba(0,0,0,0.55)");
  c.fillStyle = sh; c.fillRect(-300, 600, W + 600, 600);
  c.fillStyle = "#2A1B10"; c.fillRect(-300, 596, W + 600, 8);
}

/** Masa üstü objeler: monitör, kupa, kalem kutusu, lamba */
export function deskProps(c: CanvasRenderingContext2D, t: number) {
  // monitör (arka sol)
  c.fillStyle = "#15181D"; rr(c, 160, 380, 380, 230, 8); c.fill();
  const sg = c.createLinearGradient(170, 390, 530, 600);
  sg.addColorStop(0, "#1E3A55"); sg.addColorStop(1, "#0F1E30");
  c.fillStyle = sg; c.fillRect(172, 392, 356, 206);
  c.fillStyle = "rgba(150,200,240,0.35)";
  for (let i = 0; i < 7; i++) c.fillRect(196, 420 + i * 24, 120 + rnd(i, 60) * 180, 7);
  c.fillStyle = "#15181D"; c.fillRect(330, 610, 40, 30); c.fillRect(290, 636, 120, 10);
  lightPool(c, 350, 500, 380, "rgba(110,170,230,", 0.12);
  // kupa
  c.fillStyle = "#B8B2A6"; rr(c, 1500, 640, 70, 84, 8); c.fill();
  c.strokeStyle = "#B8B2A6"; c.lineWidth = 10; c.beginPath(); c.arc(1575, 680, 22, -1.2, 1.2); c.stroke();
  c.fillStyle = "#3A2614"; c.beginPath(); c.ellipse(1535, 644, 30, 7, 0, 0, Math.PI * 2); c.fill();
  // buhar
  c.strokeStyle = "rgba(220,220,220,0.12)"; c.lineWidth = 4;
  for (let k = 0; k < 2; k++) { c.beginPath(); for (let y = 0; y < 90; y += 6) c.lineTo(1525 + k * 18 + Math.sin(y * 0.08 + t * 1.5 + k) * 8, 630 - y); c.stroke(); }
  // kalem kutusu
  c.fillStyle = "#2B3A4A"; rr(c, 1640, 610, 70, 110, 6); c.fill();
  ["#C33", "#222", "#2A5BA0"].forEach((col, i) => { c.strokeStyle = col; c.lineWidth = 7; c.beginPath(); c.moveTo(1655 + i * 18, 612); c.lineTo(1650 + i * 22, 560 - i * 8); c.stroke(); });
  // masa lambası (sağ üst, ışık kaynağı)
  c.strokeStyle = "#3A3F47"; c.lineWidth = 12; c.lineCap = "round";
  c.beginPath(); c.moveTo(1420, 600); c.lineTo(1380, 380); c.lineTo(1240, 300); c.stroke();
  c.fillStyle = "#454B55"; c.beginPath(); c.moveTo(1190, 268); c.lineTo(1290, 290); c.lineTo(1250, 350); c.closePath(); c.fill();
  c.fillStyle = "rgba(255,230,170,0.95)"; c.beginPath(); c.ellipse(1236, 330, 26, 9, 0.5, 0, Math.PI * 2); c.fill();
  c.fillStyle = "#2A2E35"; c.beginPath(); c.ellipse(1420, 604, 60, 12, 0, 0, Math.PI * 2); c.fill();
  lightCone(c, 1236, 335, 2.05, 0.5, 900, 0.16, "255,214,150");
}

/** Spor salonu (goril deneyi): ahşap parke, çizgiler, tribün, pota, tavan lambaları */
export function envGym(c: CanvasRenderingContext2D, t: number, blurBg = 2.5) {
  const hz = 520; // ufuk
  // arka duvar
  const wg = c.createLinearGradient(0, 0, 0, hz);
  wg.addColorStop(0, "#1C2229"); wg.addColorStop(1, "#3A3F3C");
  c.fillStyle = wg; c.fillRect(-400, -300, W + 800, hz + 300);
  dof(c, blurBg, () => {
    // tribün basamakları
    for (let i = 0; i < 5; i++) { c.fillStyle = i % 2 ? "#2C3338" : "#323A40"; c.fillRect(-400, 260 + i * 46, W + 800, 46); }
    for (let i = 0; i < 40; i++) { const x = -300 + i * 70 + rnd(i, 70) * 20, y = 260 + Math.floor(rnd(i, 71) * 5) * 46; c.fillStyle = "rgba(20,24,28,0.8)"; c.beginPath(); c.ellipse(x, y + 10, 12, 14, 0, 0, Math.PI * 2); c.fill(); }
    // duvar paneli + saat
    c.fillStyle = "#4A5A4E"; c.fillRect(-400, 100, W + 800, 150);
    c.fillStyle = "#E8E2D0"; c.beginPath(); c.arc(960, 175, 42, 0, Math.PI * 2); c.fill();
    c.strokeStyle = "#222"; c.lineWidth = 4; c.beginPath(); c.moveTo(960, 175); c.lineTo(960 + Math.cos(t * 0.1) * 28, 175 + Math.sin(t * 0.1) * 28); c.moveTo(960, 175); c.lineTo(960, 150); c.stroke();
    // pota (sol)
    c.fillStyle = "#D8D4CA"; c.fillRect(150, 120, 170, 110);
    c.strokeStyle = "#C2462E"; c.lineWidth = 6; c.strokeRect(200, 160, 70, 50);
    c.beginPath(); c.ellipse(235, 238, 34, 8, 0, 0, Math.PI * 2); c.stroke();
    // çıkış tabelası
    c.fillStyle = "#1E7A3E"; c.fillRect(1640, 140, 110, 44);
    c.fillStyle = "#DFF"; c.font = "700 26px sans-serif"; c.fillText("EXIT", 1665, 172);
  });
  // tavan lambaları (bloom için parlak)
  for (let i = 0; i < 5; i++) {
    const x = 200 + i * 380;
    c.fillStyle = "rgba(255,240,210,0.95)"; c.fillRect(x - 70, -40, 140, 14);
    lightCone(c, x, -30, Math.PI / 2, 0.45, 800, 0.05, "255,236,200");
  }
  // parke (perspektif)
  const fg = c.createLinearGradient(0, hz, 0, H + 200);
  fg.addColorStop(0, "#6E4A2A"); fg.addColorStop(1, "#9A6A3A");
  c.fillStyle = fg; c.fillRect(-400, hz, W + 800, H);
  c.strokeStyle = "rgba(60,35,15,0.35)"; c.lineWidth = 2;
  for (let i = -20; i <= 20; i++) { c.beginPath(); c.moveTo(960 + i * 40, hz); c.lineTo(960 + i * 260, H + 200); c.stroke(); }
  // saha çizgileri
  c.strokeStyle = "rgba(240,235,220,0.65)"; c.lineWidth = 5;
  c.beginPath(); c.moveTo(-400, 640); c.lineTo(W + 400, 640); c.stroke();
  c.beginPath(); c.ellipse(960, 760, 330, 90, 0, 0, Math.PI * 2); c.stroke();
  c.strokeStyle = "rgba(190,60,40,0.55)"; c.beginPath(); c.moveTo(960, 640); c.lineTo(960, H + 200); c.stroke();
  // parlak yansıma
  lightPool(c, 960, 700, 800, "rgba(255,220,170,", 0.10);
}

/** Gece ofis katı: masa sıraları, monitörler, tavan ışıkları, pencere şehir */
export function envOffice(c: CanvasRenderingContext2D, t: number, blurBg = 3, pan = 0) {
  const wg = c.createLinearGradient(0, 0, 0, 600);
  wg.addColorStop(0, "#12161D"); wg.addColorStop(1, "#1D232C");
  c.fillStyle = wg; c.fillRect(-500, -300, W + 1000, 950);
  dof(c, blurBg, () => {
    // pencere bandı + şehir
    c.fillStyle = "#0B1220"; c.fillRect(-500, 120, W + 1000, 330);
    for (let i = 0; i < 40; i++) {
      const bx = -500 + rnd(i, 80) * (W + 1000) + pan * 0.3, bw = 40 + rnd(i, 81) * 90, bh = 100 + rnd(i, 82) * 230;
      c.fillStyle = "#0F1726"; c.fillRect(bx, 450 - bh, bw, bh);
      for (let k = 0; k < 12; k++) if (rnd(i * 30 + k, 83) > 0.6) { c.fillStyle = rnd(k, i + 1) > 0.5 ? "rgba(255,196,120,0.7)" : "rgba(160,205,255,0.55)"; c.fillRect(bx + 6 + (k % 3) * (bw / 3), 460 - bh + 10 + Math.floor(k / 3) * 24, 7, 10); }
    }
    bokeh(c, t, 16, 160, 430, 90, 0.22);
    for (let i = 0; i < 12; i++) { c.fillStyle = "#1A1F27"; c.fillRect(-500 + i * 220, 120, 14, 330); }
    // uzak masa sırası
    for (let i = 0; i < 10; i++) {
      const x = -200 + i * 250;
      c.fillStyle = "#262C35"; c.fillRect(x, 520, 200, 12);
      c.fillStyle = "#14171C"; c.fillRect(x + 60, 450, 90, 62);
      c.fillStyle = rnd(i, 84) > 0.5 ? "rgba(90,150,210,0.5)" : "rgba(40,50,60,0.6)"; c.fillRect(x + 66, 456, 78, 50);
    }
  });
  // tavan lambaları
  for (let i = 0; i < 6; i++) {
    const on = rnd(i, 85) > 0.35;
    c.fillStyle = on ? "rgba(235,240,255,0.85)" : "rgba(60,66,76,0.9)";
    c.fillRect(-100 + i * 380, -10, 200, 12);
  }
  // halı zemin
  const fg = c.createLinearGradient(0, 600, 0, H);
  fg.addColorStop(0, "#232A33"); fg.addColorStop(1, "#151A20");
  c.fillStyle = fg; c.fillRect(-500, 600, W + 1000, H);
  c.strokeStyle = "rgba(255,255,255,0.025)"; c.lineWidth = 1;
  for (let y = 610; y < H; y += 14) { c.beginPath(); c.moveTo(-500, y); c.lineTo(W + 500, y); c.stroke(); }
  void lerp;
}

/** Ofis masası (ön plan): ahşap üst, monitör, dosyalar */
export function officeDesk(c: CanvasRenderingContext2D, x: number, y: number, s: number, screen = 0.7, lamp = 0) {
  c.save(); c.translate(x, y); c.scale(s, s);
  wood(c, -200, -14, 400, 20, "#6A4A30");
  c.fillStyle = "#3A2A1C"; c.fillRect(-200, 6, 400, 8);
  c.fillStyle = "#1A1D22"; c.fillRect(-185, 14, 14, 120); c.fillRect(171, 14, 14, 120);
  // monitör (arkası kameraya dönük değil, yandan)
  c.fillStyle = "#121418"; rr(c, -120, -150, 150, 100, 6); c.fill();
  c.fillStyle = `rgba(90,160,220,${screen})`; c.fillRect(-112, -142, 134, 84);
  c.fillStyle = "#121418"; c.fillRect(-55, -50, 16, 36);
  lightPool(c, -45, -100, 200, "rgba(100,170,240,", 0.12 * screen);
  // dosya yığını
  ["#C9C2B0", "#B7AF9A", "#D8D1BE"].forEach((col, i) => { c.fillStyle = col; c.fillRect(70 + i * 2, -26 - i * 7, 90, 7); });
  if (lamp > 0) {
    c.strokeStyle = "#3A3F47"; c.lineWidth = 6;
    c.beginPath(); c.moveTo(165, -14); c.lineTo(150, -110); c.lineTo(100, -130); c.stroke();
    c.fillStyle = "#454B55"; c.beginPath(); c.moveTo(80, -145); c.lineTo(125, -136); c.lineTo(108, -110); c.closePath(); c.fill();
    lightPool(c, 100, -20, 220, "rgba(255,215,150,", 0.3 * lamp);
  }
  c.restore();
}

/** Koridor (kapılar): perspektif, zemin yansıması, tavan ışıkları */
export function envCorridor(c: CanvasRenderingContext2D, t: number) {
  const vx = W / 2, vy = 520;
  c.fillStyle = "#1A1E25"; c.fillRect(-300, -300, W + 600, H + 600);
  // duvarlar
  c.fillStyle = "#2A2F36";
  c.beginPath(); c.moveTo(-300, -300); c.lineTo(vx - 240, vy - 200); c.lineTo(vx - 240, vy + 120); c.lineTo(-300, H + 300); c.closePath(); c.fill();
  c.fillStyle = "#262A31";
  c.beginPath(); c.moveTo(W + 300, -300); c.lineTo(vx + 240, vy - 200); c.lineTo(vx + 240, vy + 120); c.lineTo(W + 300, H + 300); c.closePath(); c.fill();
  // uç duvar
  c.fillStyle = "#14171C"; c.fillRect(vx - 240, vy - 200, 480, 320);
  // zemin (cilalı)
  const fg = c.createLinearGradient(0, vy + 120, 0, H);
  fg.addColorStop(0, "#202530"); fg.addColorStop(1, "#353B45");
  c.fillStyle = fg;
  c.beginPath(); c.moveTo(vx - 240, vy + 120); c.lineTo(vx + 240, vy + 120); c.lineTo(W + 300, H + 300); c.lineTo(-300, H + 300); c.closePath(); c.fill();
  // tavan lambaları
  for (let i = 0; i < 6; i++) {
    const k = Math.pow(0.62, i);
    const y = lerp(vy - 200, -40, k);
    c.fillStyle = `rgba(235,240,250,${0.5 + 0.4 * k})`;
    c.fillRect(vx - 120 * k - 20, y, 240 * k + 40, 8 + 10 * k);
    lightPool(c, vx, lerp(vy + 120, H, k), 300 * k + 60, "rgba(220,230,250,", 0.08);
  }
  // süpürgelik çizgileri
  c.strokeStyle = "rgba(0,0,0,0.4)"; c.lineWidth = 4;
  c.beginPath(); c.moveTo(-300, H + 300); c.lineTo(vx - 240, vy + 120); c.moveTo(W + 300, H + 300); c.lineTo(vx + 240, vy + 120); c.stroke();
  void t;
}

/** Deney odası (Taylor & Fiske): beyaz tahta, jaluzi, yuvarlak halı, sandalyeler önden çizilir */
export function envLab(c: CanvasRenderingContext2D, t: number, blurBg = 3) {
  c.fillStyle = "#1A2028"; c.fillRect(-500, -300, W + 1000, 980);
  dof(c, blurBg, () => {
    // jaluzili pencere
    c.fillStyle = "#0E1622"; c.fillRect(1180, 110, 560, 380);
    for (let y = 120; y < 486; y += 18) { c.fillStyle = "rgba(170,190,215,0.18)"; c.fillRect(1186, y, 548, 9); }
    lightPool(c, 1460, 300, 420, "rgba(150,185,230,", 0.10);
    // beyaz tahta
    c.fillStyle = "#3A3F46"; c.fillRect(170, 150, 640, 340);
    c.fillStyle = "#C9CED3"; c.fillRect(184, 164, 612, 312);
    c.strokeStyle = "rgba(40,70,120,0.55)"; c.lineWidth = 4;
    c.beginPath(); c.arc(420, 320, 90, 0, Math.PI * 2); c.stroke();
    c.beginPath(); c.moveTo(560, 250); c.lineTo(740, 250); c.moveTo(560, 300); c.lineTo(700, 300); c.moveTo(560, 350); c.lineTo(720, 350); c.stroke();
    // raf + saksı
    c.fillStyle = "#3B2C20"; c.fillRect(880, 380, 220, 14);
    ["#7A5A3A", "#4A5A6A", "#8A3A30", "#C9C2B0"].forEach((col, i) => { c.fillStyle = col; c.fillRect(890 + i * 26, 300 + (i % 2) * 10, 20, 80 - (i % 2) * 10); });
    c.fillStyle = "#5A3A2A"; c.fillRect(1030, 340, 40, 40);
    c.fillStyle = "#3E5A38"; for (let i = 0; i < 6; i++) { c.beginPath(); c.ellipse(1050 + Math.cos(i) * 22, 320 - i * 6, 26, 9, i * 0.6 + Math.sin(t * 0.8 + i) * 0.05, 0, Math.PI * 2); c.fill(); }
  });
  // süpürgelik + zemin
  c.fillStyle = "#11151B"; c.fillRect(-500, 640, W + 1000, 16);
  const fg = c.createLinearGradient(0, 650, 0, H);
  fg.addColorStop(0, "#2A2622"); fg.addColorStop(1, "#18161A");
  c.fillStyle = fg; c.fillRect(-500, 656, W + 1000, H);
  c.strokeStyle = "rgba(255,240,220,0.03)"; c.lineWidth = 2;
  for (let i = -20; i < 40; i++) { c.beginPath(); c.moveTo(W / 2 + i * 90, 656); c.lineTo(W / 2 + i * 260, H + 200); c.stroke(); }
  c.fillStyle = "rgba(90,70,60,0.35)"; c.beginPath(); c.ellipse(W / 2, 860, 760, 170, 0, 0, Math.PI * 2); c.fill();
}

/** 面談室 (s06): jaluzili pencere + gece şehri, beyaz tahta, duvar saati yeri, ahşap masa, bitki, cam bölme */
export function envMeetingRoom(c: CanvasRenderingContext2D, t: number, blurBg = 3, pan = 0) {
  const wg = c.createLinearGradient(0, -200, 0, 720);
  wg.addColorStop(0, "#151A21"); wg.addColorStop(1, "#232A33");
  c.fillStyle = wg; c.fillRect(-600, -400, W + 1200, 1130);
  dof(c, blurBg, () => {
    // pencere (sağ yarı) + şehir + jaluzi
    const wx = 980 + pan * 0.35;
    c.fillStyle = "#0A1120"; c.fillRect(wx, 70, 860, 470);
    for (let i = 0; i < 26; i++) {
      const bx = wx + rnd(i, 61) * 860, bw = 30 + rnd(i, 62) * 70, bh = 90 + rnd(i, 63) * 260;
      c.fillStyle = "#101828"; c.fillRect(bx, 540 - bh, bw, bh);
      for (let k = 0; k < 10; k++) if (rnd(i * 20 + k, 64) > 0.55) { c.fillStyle = rnd(k, i + 7) > 0.5 ? "rgba(255,196,120,0.7)" : "rgba(160,205,255,0.5)"; c.fillRect(bx + 5 + (k % 3) * (bw / 3), 550 - bh + 8 + Math.floor(k / 3) * 22, 6, 9); }
    }
    bokeh(c, t, 12, 120, 520, 71, 0.2);
    for (let y = 80; y < 540; y += 22) { c.fillStyle = "rgba(196,190,176,0.22)"; c.fillRect(wx, y, 860, 8 + Math.sin(t * 0.6 + y) * 0.6); }
    c.fillStyle = "#2C333D"; c.fillRect(wx - 14, 60, 888, 14); c.fillRect(wx - 14, 536, 888, 14); c.fillRect(wx + 423, 60, 14, 490);
    // beyaz tahta (sol)
    const bx = 120 + pan * 0.25;
    c.fillStyle = "#3A4048"; c.fillRect(bx - 10, 110, 640, 380);
    c.fillStyle = "#D8DAD6"; c.fillRect(bx, 120, 620, 360);
    c.strokeStyle = "rgba(40,80,140,0.45)"; c.lineWidth = 4;
    c.beginPath(); c.moveTo(bx + 60, 220); c.lineTo(bx + 300, 220); c.moveTo(bx + 60, 290); c.lineTo(bx + 420, 290); c.moveTo(bx + 60, 360); c.lineTo(bx + 240, 360); c.stroke();
    c.strokeStyle = "rgba(180,60,50,0.45)"; c.beginPath(); c.arc(bx + 480, 300, 60, 0, Math.PI * 2); c.stroke();
    c.fillStyle = "#2A2F36"; c.fillRect(bx, 480, 620, 12);
    ["#2050A0", "#B03A30", "#202020"].forEach((col, i) => { c.fillStyle = col; c.fillRect(bx + 40 + i * 50, 472, 36, 8); });
  });
  // zemin (halı)
  const fg = c.createLinearGradient(0, 700, 0, H + 200);
  fg.addColorStop(0, "#2A2F36"); fg.addColorStop(1, "#14171B");
  c.fillStyle = fg; c.fillRect(-600, 700, W + 1200, 800);
  c.strokeStyle = "rgba(255,255,255,0.025)"; c.lineWidth = 1;
  for (let y = 710; y < H + 200; y += 12) { c.beginPath(); c.moveTo(-600, y); c.lineTo(W + 600, y); c.stroke(); }
  c.fillStyle = "#1A1E24"; c.fillRect(-600, 696, W + 1200, 10);
}

/** 面談 masası (ön plan, ahşap üst + ön yüz) */
export function meetingTable(c: CanvasRenderingContext2D, x: number, y: number, w: number, s = 1) {
  c.save(); c.translate(x, y); c.scale(s, s);
  wood(c, -w / 2, -18, w, 30, "#6E4C32");
  c.fillStyle = "rgba(255,230,190,0.08)"; c.fillRect(-w / 2, -18, w, 4);
  c.fillStyle = "#3A281A"; c.fillRect(-w / 2, 12, w, 70);
  c.fillStyle = "#24180F"; c.fillRect(-w / 2 + 30, 82, 24, 260); c.fillRect(w / 2 - 54, 82, 24, 260);
  c.restore();
}
