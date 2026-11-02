// Bağımsız kullanım için motorun gerekli küçük kısmı (engine/core.ts'den)
export const W = 1920;
export const H = 1080;
export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
/** Deterministik hash tabanlı rastgele [0,1) */
export function rnd(i: number, s = 0): number {
  let x = Math.imul(i ^ 0x9e3779b9, 0x85ebca6b) ^ Math.imul(s + 0x27d4eb2f, 0xc2b2ae35);
  x ^= x >>> 15; x = Math.imul(x, 0x2c1b3c6d); x ^= x >>> 12; x = Math.imul(x, 0x297a2d39); x ^= x >>> 15;
  return (x >>> 0) / 4294967296;
}
