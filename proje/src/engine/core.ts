// Motor çekirdeği: tipler, zaman yardımcıları, deterministik rastgelelik.
export const W = 1920;
export const H = 1080;
export const FPS = 30;

export interface Phrase { text: string; start: number; end: number }
export interface CharT { c: string; start: number; end: number }
export interface Timing { id: number | string; audio: string; duration: number; text: string; phrases: Phrase[]; chars: CharT[] }

/** Bölüm içine yerleştirilmiş ses parçası */
export interface Part { timing: Timing; at: number }

/** Ses efekti işareti — sfx.py tarafından sentezlenir */
export interface Cue { t: number; type: string; gain?: number; p?: Record<string, number> }

export interface Section {
  id: string;
  duration: number;
  parts: Part[];
  cues: Cue[];
  draw(ctx: CanvasRenderingContext2D, t: number): void;
}

export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
/** t'nin [a,b] aralığındaki 0..1 ilerlemesi */
export const prog = (t: number, a: number, b: number) => clamp((t - a) / (b - a));
/** a'da açılıp b'de kapanan yumuşak pencere (fade süresi f) */
export const win = (t: number, a: number, b: number, f = 0.4) =>
  Math.min(prog(t, a, a + f), 1 - prog(t, b - f, b));

// Easing
export const ease = {
  inOut: (k: number) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2),
  out: (k: number) => 1 - Math.pow(1 - k, 3),
  in: (k: number) => k * k * k,
  sine: (k: number) => 0.5 - 0.5 * Math.cos(Math.PI * k),
  back: (k: number) => { const c = 1.4; return 1 + (c + 1) * Math.pow(k - 1, 3) + c * Math.pow(k - 1, 2); },
};

/** Deterministik hash tabanlı rastgele [0,1) */
export function rnd(i: number, s = 0): number {
  let x = Math.imul(i ^ 0x9e3779b9, 0x85ebca6b) ^ Math.imul(s + 0x27d4eb2f, 0xc2b2ae35);
  x ^= x >>> 15; x = Math.imul(x, 0x2c1b3c6d); x ^= x >>> 12; x = Math.imul(x, 0x297a2d39); x ^= x >>> 15;
  return (x >>> 0) / 4294967296;
}

/** Bir parçanın içindeki yerel zamana göre global zaman */
export const at = (p: Part, local: number) => p.at + local;

/** Konuşma ağız açıklığı (maskot için): o an bir karakter okunuyor mu */
export function speaking(parts: Part[], t: number): number {
  for (const p of parts) {
    const lt = t - p.at;
    if (lt < 0 || lt > p.timing.duration) continue;
    for (const c of p.timing.chars) {
      if (lt >= c.start && lt <= c.end + 0.04 && !"、。「」".includes(c.c)) {
        const k = (lt - c.start) / Math.max(0.06, c.end - c.start);
        return 0.35 + 0.65 * Math.sin(Math.PI * clamp(k));
      }
    }
  }
  return 0;
}
