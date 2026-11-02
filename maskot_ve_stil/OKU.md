# Maskot + ton/stil kodu
- `mascot.ts` → `drawMascot(ctx, x, y, s, pose)`: (x,y) ayak tabanı, s ölçek. Poz: blink, lookX/lookY, mouth (konuşma 0..1), armL/armR, prop ("flashlight" | "magnifier"), tilt, rim, light, brow.
- `style.ts` → palet `C` (sarı = görülen/hatırlanan), fontlar, ışık havuzu/konisi, toz, grain, vinyet, fadeBlack, rr.
- `grade.ts` → "lens": `lens(ctx, t, L, world)` dünyayı offscreen çizip renk grade (gölge teal / ışık sıcak), bloom, kromatik sapma, vinyet, grain uygular. `cam()` kamera + el titremesi, `dof()` alan derinliği blur, `bokeh()`.
- `core.ts` → bağımlılıklar (W, H, clamp, rnd).

Örnek:
```ts
lens(ctx, t, LENS.night, (c) => { /* sahne */ drawMascot(c, 400, 1040, 0.85, { mouth: 0.5, prop: "flashlight", armR: 1.2, rim: 1 }); });
```
Fontlar: Noto Sans JP / Noto Serif JP yüklü olmalı.
