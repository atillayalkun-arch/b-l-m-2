# Kendi bilgisayarında render (Windows)

## Bir kerelik kurulum
1. **Node.js 20+** → https://nodejs.org (LTS)
2. **FFmpeg** → PowerShell: `winget install Gyan.FFmpeg` (sonra terminali kapatıp aç)
3. **Python 3** → https://python.org (kurulumda "Add to PATH" işaretle), sonra: `pip install numpy scipy`
4. **Fontlar** → Google Fonts'tan **Noto Sans JP** ve **Noto Serif JP** indir, tüm ağırlıkları "Tüm kullanıcılar için yükle".
5. Proje klasöründe (proje.zip'i açtığın yer):
   ```
   npm install
   npx playwright install chromium
   ```

## Bir kerelik GPU ayarı (laptop, NVIDIA)
- Ayarlar → Sistem → Ekran → Grafik → "Uygulama ekle" → `C:\Program Files\nodejs\node.exe` → Seçenekler → **Yüksek performans (NVIDIA)**.
- Render sırasında laptop **şarja takılı** olsun, tarayıcı/Discord vb. kapalı olsun (boş RAM ne kadar çoksa o kadar paralel iş).

## Render (önerilen)
```
node engine/render_all.mjs s02 --gpu --jobs 4
```
- `--gpu`: ekran kartıyla çizer. Başta "Kullanılan grafik birimi: … NVIDIA … → GPU aktif" yazmalı. "GPU KULLANILMIYOR" yazarsa GPU ayarını kontrol et; render yine de normal modda devam eder.
- `--jobs N`: aynı anda kaç parça. Her biri ~0,7–1 GB RAM. Boş RAM ~3 GB → 3, ~4–5 GB → 4, 6 GB+ → 5–6. Yazmazsan boş RAM'e göre otomatik seçilir.
- Görev Yöneticisi'nde bellek %90'ı geçiyorsa `--jobs` sayısını düşür.

## Render (eski/temel)
1. Ses dosyalarını `audio/` klasörüne koy (s01 için 1.mp3, 2.mp3, 3.mp3).
2. Proje klasöründe:
   ```
   node engine/render_all.mjs s01
   ```
3. Sonuç: `out/s01.mp4` (görüntü + seslendirme + efektler).

- Kesilirse aynı komutu tekrar çalıştır, kaldığı yerden devam eder.
- Tek kare kontrolü: `node engine/render.mjs s01 --stills 10,45.5` → `out/stills/`
