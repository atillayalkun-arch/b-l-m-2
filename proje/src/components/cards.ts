// Seslendirilmemiş metin kartları. Hepsi (t, a, b) penceresiyle çalışır.
import { W, H, clamp, ease, prog, win } from "../engine/core";
import { C, font, rr } from "../design/style";
import { drawMascot } from "../characters/mascot";

/** Bölüm başlığı: tam ekran, konuşmasız */
export function sectionTitle(ctx: CanvasRenderingContext2D, t: number, a: number, b: number, num: string, title: string) {
  const v = win(t, a, b, 0.6);
  if (v <= 0) return;
  ctx.save();
  ctx.globalAlpha = v;
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, W, H);
  const g = ctx.createRadialGradient(W / 2, H / 2, 50, W / 2, H / 2, 900);
  g.addColorStop(0, "rgba(40,50,66,0.5)"); g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  const k = ease.out(prog(t, a + 0.2, a + 1.4));
  ctx.textAlign = "center";
  ctx.fillStyle = C.yellow;
  ctx.font = font(400, 30, true);
  ctx.letterSpacing = "12px";
  ctx.fillText(num, W / 2 + 6, H / 2 - 92);
  ctx.letterSpacing = "0px";
  // çizgi
  ctx.strokeStyle = "rgba(242,207,58,0.7)";
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(W / 2 - 160 * k, H / 2 - 62); ctx.lineTo(W / 2 + 160 * k, H / 2 - 62); ctx.stroke();
  // başlık: karakter karakter belirir
  ctx.font = font(600, 84, true);
  ctx.letterSpacing = "6px";
  const chars = [...title];
  const total = ctx.measureText(title).width;
  let x = W / 2 - total / 2;
  ctx.textAlign = "left";
  chars.forEach((c, i) => {
    const ck = ease.out(prog(t, a + 0.35 + i * 0.06, a + 0.95 + i * 0.06));
    ctx.fillStyle = `rgba(232,234,238,${ck})`;
    ctx.fillText(c, x, H / 2 + 40 + (1 - ck) * 14);
    x += ctx.measureText(c).width + 6;
  });
  ctx.restore();
}

/** [画面] kavram kartı */
export function screenCard(ctx: CanvasRenderingContext2D, t: number, a: number, b: number, o: { term: string; lines?: string[]; source?: string; size?: number }) {
  const v = win(t, a, b, 0.45);
  if (v <= 0) return;
  ctx.save();
  ctx.globalAlpha = v;
  ctx.fillStyle = "rgba(8,10,14,0.88)";
  ctx.fillRect(0, 0, W, H);
  const k = ease.out(prog(t, a + 0.15, a + 1.0));
  ctx.textAlign = "center";
  ctx.font = font(600, o.size ?? 104, true);
  ctx.letterSpacing = "8px";
  ctx.fillStyle = `rgba(236,238,242,${k})`;
  ctx.fillText(o.term, W / 2 + 4, H / 2 + 20 + (1 - k) * 18);
  const tw = ctx.measureText(o.term).width;
  ctx.letterSpacing = "0px";
  // sarı alt çizgi
  const u = ease.inOut(prog(t, a + 0.5, a + 1.3));
  ctx.fillStyle = C.yellow;
  ctx.fillRect(W / 2 - tw / 2, H / 2 + 52, tw * u, 4);
  if (o.lines) {
    ctx.font = font(400, 34);
    ctx.fillStyle = `rgba(200,206,215,${k})`;
    o.lines.forEach((l, i) => ctx.fillText(l, W / 2, H / 2 + 130 + i * 50));
  }
  if (o.source) {
    const s = prog(t, a + 0.8, a + 1.3);
    ctx.font = font(400, 26);
    ctx.fillStyle = `rgba(140,151,168,${s})`;
    ctx.fillText(`出典：${o.source}`, W / 2, H / 2 + (o.lines ? 250 : 150));
  }
  ctx.restore();
}

/** Sayı açılımı: sayaç + halka */
export function statReveal(ctx: CanvasRenderingContext2D, t: number, a: number, b: number, o: { value: number; decimals?: number; suffix?: string; source?: string; caption?: string }) {
  const v = win(t, a, b, 0.45);
  if (v <= 0) return;
  ctx.save();
  ctx.globalAlpha = v;
  ctx.fillStyle = "rgba(8,10,14,0.9)";
  ctx.fillRect(0, 0, W, H);
  const k = ease.out(prog(t, a + 0.2, a + 1.6));
  const cx = W / 2, cy = H / 2 - 30, R = 230;
  ctx.strokeStyle = "rgba(140,151,168,0.15)";
  ctx.lineWidth = 10;
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = C.yellow;
  ctx.lineCap = "round";
  ctx.beginPath(); ctx.arc(cx, cy, R, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (o.value / 100) * k); ctx.stroke();
  // değer
  const val = (o.value * k).toFixed(o.decimals ?? 1);
  ctx.textAlign = "center";
  ctx.fillStyle = C.text;
  ctx.font = font(700, 150);
  ctx.fillText(val, cx - 30, cy + 52);
  const nw = ctx.measureText(val).width;
  ctx.font = font(500, 70);
  ctx.fillStyle = C.yellow;
  ctx.textAlign = "left";
  ctx.fillText(o.suffix ?? "%", cx - 30 + nw / 2 + 8, cy + 52);
  ctx.textAlign = "center";
  if (o.caption) {
    ctx.font = font(400, 32);
    ctx.fillStyle = `rgba(200,206,215,${prog(t, a + 0.6, a + 1.2)})`;
    ctx.fillText(o.caption, cx, cy + R + 80);
  }
  if (o.source) {
    ctx.font = font(400, 26);
    ctx.fillStyle = `rgba(140,151,168,${prog(t, a + 0.9, a + 1.4)})`;
    ctx.fillText(`出典：${o.source}`, cx, cy + R + (o.caption ? 135 : 90));
  }
  ctx.restore();
}

/** [出典] lower-third: sol alt, altyazı bandının üstünde */
export function sourceCard(ctx: CanvasRenderingContext2D, t: number, a: number, b: number, text: string) {
  const v = win(t, a, b, 0.4);
  if (v <= 0) return;
  ctx.save();
  ctx.globalAlpha = v;
  const x = 80 - (1 - v) * 20, y = H - 300;
  ctx.font = font(400, 26);
  const w = ctx.measureText(text).width + 120;
  ctx.fillStyle = "rgba(10,13,18,0.72)";
  rr(ctx, x, y, w, 52, 6); ctx.fill();
  ctx.fillStyle = C.yellow;
  ctx.fillRect(x, y, 4, 52);
  ctx.font = font(500, 20);
  ctx.fillStyle = C.yellow;
  ctx.fillText("出典", x + 22, y + 34);
  ctx.font = font(400, 26);
  ctx.fillStyle = "rgba(220,224,230,0.92)";
  ctx.fillText(text, x + 84, y + 35);
  ctx.restore();
}

/** 月報 kağıdı. write: 「特になし」 yazım ilerlemesi 0..1 */
export function geppoSheet(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, o: { write?: number; light?: number; through?: number } = {}) {
  const write = o.write ?? 0, L = o.light ?? 1, th = o.through ?? 0;
  ctx.save();
  ctx.translate(x, y); ctx.scale(s, s);
  const w = 560, h = 740;
  // gölge
  ctx.fillStyle = "rgba(0,0,0,0.5)";
  ctx.fillRect(-w / 2 + 14, -h / 2 + 18, w, h);
  // kağıt
  const g = ctx.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2);
  g.addColorStop(0, `rgba(222,216,202,${1 - th * 0.85})`);
  g.addColorStop(1, `rgba(176,170,156,${1 - th * 0.85})`);
  ctx.fillStyle = g;
  ctx.fillRect(-w / 2, -h / 2, w, h);
  ctx.globalAlpha *= L;
  ctx.fillStyle = C.ink;
  ctx.textAlign = "center";
  ctx.font = font(700, 46, true);
  ctx.letterSpacing = "18px";
  ctx.fillText("月報", 9, -h / 2 + 82);
  ctx.letterSpacing = "0px";
  ctx.textAlign = "left";
  ctx.font = font(400, 22);
  ctx.fillStyle = "rgba(26,29,36,0.75)";
  const rows = ["報告期間", "業務内容", "トラブル・課題", "特記事項"];
  const vals = ["2026年5月", "通常業務（定例・確認・調整）", "", ""];
  rows.forEach((r, i) => {
    const ry = -h / 2 + 170 + i * 130;
    ctx.fillStyle = "rgba(26,29,36,0.7)";
    ctx.fillText(r, -w / 2 + 40, ry);
    ctx.strokeStyle = "rgba(26,29,36,0.25)"; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(-w / 2 + 40, ry + 66); ctx.lineTo(w / 2 - 40, ry + 66); ctx.stroke();
    ctx.fillStyle = "rgba(26,29,36,0.85)";
    ctx.font = font(400, 26);
    ctx.fillText(vals[i], -w / 2 + 60, ry + 50);
    ctx.font = font(400, 22);
  });
  // 「特になし」 el yazısı (soldan sağa açılır)
  if (write > 0) {
    const ry = -h / 2 + 170 + 2 * 130 + 54;
    ctx.save();
    ctx.beginPath(); ctx.rect(-w / 2 + 50, ry - 60, 330 * write, 90); ctx.clip();
    ctx.font = font(500, 46, true);
    ctx.fillStyle = "#1B2A4A";
    ctx.translate(-w / 2 + 64, ry);
    ctx.rotate(-0.025);
    ctx.fillText("特になし", 0, 0);
    ctx.restore();
  }
  ctx.restore();
}

/** Pano etiketi (belgesel mod küçük başlık) */
export function boardLabel(ctx: CanvasRenderingContext2D, x: number, y: number, text: string, a = 1, color: string = C.mist) {
  if (a <= 0) return;
  ctx.save();
  ctx.globalAlpha = a;
  ctx.font = font(500, 24);
  ctx.fillStyle = color;
  ctx.letterSpacing = "4px";
  ctx.fillText(text, x, y);
  ctx.restore();
  void clamp;
}

/** 思考実験 damgası: maskot dedektif pozunda, tam ekran, konuşmasız */
export function thoughtExperiment(ctx: CanvasRenderingContext2D, t: number, a: number, b: number) {
  const v = win(t, a, b, 0.45);
  if (v <= 0) return;
  ctx.save();
  ctx.globalAlpha = v;
  ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
  const g = ctx.createRadialGradient(W / 2 + 300, H / 2, 40, W / 2 + 300, H / 2, 800);
  g.addColorStop(0, "rgba(242,207,58,0.10)"); g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  // ince pano ızgarası
  ctx.strokeStyle = "rgba(140,151,168,0.06)"; ctx.lineWidth = 1;
  for (let x = 0; x < W; x += 60) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
  for (let y = 0; y < H; y += 60) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  // damga: büyükten oturarak gelir
  const k = ease.back(prog(t, a + 0.15, a + 0.7));
  const sc = 1.6 - 0.6 * k;
  ctx.save();
  ctx.translate(W / 2 - 230, H / 2 - 10); ctx.rotate(-0.08); ctx.scale(sc, sc);
  ctx.globalAlpha *= clamp(k * 1.3);
  ctx.strokeStyle = C.yellow; ctx.lineWidth = 6;
  rr(ctx, -270, -100, 540, 200, 14); ctx.stroke();
  ctx.lineWidth = 2; rr(ctx, -252, -82, 504, 164, 8); ctx.stroke();
  ctx.fillStyle = C.yellow; ctx.textAlign = "center";
  ctx.font = font(700, 104, true); ctx.letterSpacing = "18px";
  ctx.fillText("思考実験", 9, 36);
  ctx.letterSpacing = "0px";
  ctx.restore();
  // maskot
  const m = ease.out(prog(t, a + 0.3, a + 1.1));
  drawMascot(ctx, W / 2 + 470 + (1 - m) * 260, H / 2 + 420, 0.78, { prop: "magnifier", armR: 1.0, lookX: -0.8, lookY: -0.2, rim: 1, tilt: -0.05 + Math.sin(t * 1.2) * 0.015, brow: 0.4 });
  ctx.restore();
}

/** Anı kartı (hafıza motifi): içinde küçük bir sahne silüeti + etiket. glow 0..1 sarı = hatırlanan */
export function memoryCard(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, o: { label?: string; glow?: number; rot?: number; alpha?: number; who?: "A" | "B" | "none"; fade?: number } = {}) {
  const gl = o.glow ?? 0, al = o.alpha ?? 1, fd = o.fade ?? 0;
  if (al <= 0) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.translate(x, y); ctx.rotate(o.rot ?? 0); ctx.scale(s, s);
  if (gl > 0) {
    const g = ctx.createRadialGradient(0, 0, 20, 0, 0, 220);
    g.addColorStop(0, `rgba(242,207,58,${0.35 * gl})`); g.addColorStop(1, "rgba(242,207,58,0)");
    ctx.fillStyle = g; ctx.fillRect(-240, -240, 480, 480);
  }
  ctx.fillStyle = "rgba(0,0,0,0.45)"; rr(ctx, -112, -72, 232, 160, 8); ctx.fill();
  ctx.fillStyle = fd > 0 ? `rgb(${Math.round(217 - 90 * fd)},${Math.round(212 - 88 * fd)},${Math.round(199 - 80 * fd)})` : C.paper;
  rr(ctx, -120, -80, 240, 160, 8); ctx.fill();
  // "fotoğraf" alanı
  ctx.fillStyle = gl > 0.3 ? "#3A3420" : "#2A3038"; ctx.fillRect(-104, -66, 208, 104);
  if (o.who && o.who !== "none") {
    const col = o.who === "A" ? "#2F4A6B" : "#5A6B4A";
    ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(0, 30, 40, 34, 0, Math.PI, 0); ctx.fill();
    ctx.fillStyle = "#C99A7A"; ctx.beginPath(); ctx.arc(0, -18, 20, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#1A1410"; ctx.beginPath(); ctx.arc(0, -24, 20, Math.PI, 0); ctx.fill();
    if (gl > 0) { ctx.strokeStyle = `rgba(242,207,58,${0.9 * gl})`; ctx.lineWidth = 4; ctx.strokeRect(-104, -66, 208, 104); }
  }
  if (o.label) {
    ctx.fillStyle = C.ink; ctx.font = font(500, 22); ctx.textAlign = "center";
    ctx.fillText(o.label, 0, 66);
  }
  ctx.restore();
}
