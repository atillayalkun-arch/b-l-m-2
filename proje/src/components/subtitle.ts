// Altyazı: TÜM bölümlerde aynı stil ve konum. Bölümler sadece drawSubtitles() çağırır.
import { Part, Phrase, W, H, clamp } from "../engine/core";
import { font } from "../design/style";

interface Unit { lines: Phrase[][]; start: number; end: number }

const MAX_LINE = 23;      // satır başına karakter
const MAX_LINES = 2;
const cache = new WeakMap<Part, Unit[]>();

function build(part: Part): Unit[] {
  const units: Unit[] = [];
  let cur: Phrase[][] = [[]];
  const len = (ps: Phrase[]) => ps.reduce((n, p) => n + p.text.length, 0);
  const flush = () => {
    const flat = cur.flat();
    if (!flat.length) return;
    units.push({ lines: cur.filter((l) => l.length), start: flat[0].start, end: flat[flat.length - 1].end });
    cur = [[]];
  };
  for (const ph of part.timing.phrases) {
    let line = cur[cur.length - 1];
    if (line.length && len(line) + ph.text.length > MAX_LINE) {
      if (cur.length >= MAX_LINES) { flush(); }
      else cur.push([]);
      line = cur[cur.length - 1];
    }
    line.push(ph);
    if (/[。？！]$/.test(ph.text)) flush();
  }
  flush();
  // zaman pencereleri
  for (let i = 0; i < units.length; i++) {
    const u = units[i];
    const next = units[i + 1];
    u.start = part.at + u.start - 0.1;
    const rawEnd = part.at + u.end + 0.6;
    u.end = next ? Math.min(rawEnd, part.at + next.start - 0.14) : rawEnd;
  }
  return units;
}

export function drawSubtitles(ctx: CanvasRenderingContext2D, parts: Part[], t: number) {
  let unit: Unit | null = null, part: Part | null = null;
  for (const p of parts) {
    if (!cache.has(p)) cache.set(p, build(p));
    for (const u of cache.get(p)!) if (t >= u.start && t <= u.end) { unit = u; part = p; }
  }
  // sabit bant (yumuşak alt gradyan) — konuşma bölgesinde görünür
  let band = 0;
  for (const p of parts) {
    const a = p.at - 0.3, b = p.at + p.timing.duration + 0.3;
    band = Math.max(band, Math.min(clamp((t - a) / 0.4), clamp((b - t) / 0.4)));
  }
  if (band > 0) {
    const g = ctx.createLinearGradient(0, H - 250, 0, H);
    g.addColorStop(0, "rgba(5,7,10,0)");
    g.addColorStop(1, `rgba(5,7,10,${0.62 * band})`);
    ctx.fillStyle = g;
    ctx.fillRect(0, H - 250, W, 250);
  }
  if (!unit || !part) return;
  const a = Math.min(clamp((t - unit.start) / 0.14), clamp((unit.end - t) / 0.14));
  const lt = t - part.at;
  ctx.save();
  ctx.font = font(500, 46);
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";
  const LH = 66;
  const baseY = H - 70 - (unit.lines.length - 1) * LH;
  unit.lines.forEach((line, li) => {
    const full = line.map((p) => p.text).join("");
    const wTot = ctx.measureText(full).width;
    let x = W / 2 - wTot / 2;
    const y = baseY + li * LH;
    for (const ph of line) {
      const spoken = lt >= ph.start - 0.02;
      const k = clamp((lt - ph.start + 0.02) / 0.18);
      const alpha = spoken ? 0.6 + 0.4 * k : 0.6;
      ctx.shadowColor = "rgba(0,0,0,0.85)";
      ctx.shadowBlur = 10;
      ctx.fillStyle = `rgba(240,242,245,${alpha * a})`;
      ctx.fillText(ph.text, x, y);
      x += ctx.measureText(ph.text).width;
    }
  });
  ctx.restore();
}
