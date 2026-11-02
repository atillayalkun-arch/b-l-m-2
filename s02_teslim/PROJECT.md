# PROJECT.md — 「特になし」の裏側 (çalışma adı) · Animasyon Projesi DNA

## 1. Proje
- Japonca, yarı belgesel / yarı sinematik, 2D, sese senkron açıklayıcı video. Toplam 8+ dk.
- Konu: İşyerinde görünmeyen emek ve değerlendirmenin "gözle değil hafızayla" yapılması.
- Tez cümlesi (videonun omurgası): **評価は、目ではなく、記憶で行われる。**
- Ekrandaki tüm metinler **Japonca**. Senaryodaki "Türkçe:" satırları sadece çeviri referansı, videoda yer almaz.

## 2. Teknik yapı (sabit, değişmez)
- **Canvas 2D + TypeScript**, kendi motorumuz. Remotion YOK, SVG YOK.
- Her sahne deterministik çizim fonksiyonu: `draw(ctx, t)` (t = bölüm içi saniye).
- Render: headless Chromium kare kare yakalar → FFmpeg görüntü + ses → MP4.
- Çıktı: **1920×1080, 30 fps, H.264 (-preset veryfast), AAC ses**.
- Her bölüm **ayrı MP4**, kendi sesini içerir, **temiz bir karede başlar ve biter** (kullanıcı bölümleri timeline'da yan yana dizer; ayrı birleştirme oturumu yok).

### Klasör yapısı
```
/engine        → render döngüsü, zaman çizelgesi, kare yakalama, ffmpeg
/design        → palet, fontlar, easing, geçişler, kamera (pan/zoom/parallax)
/characters    → drawMascot, drawASan, drawBSan, drawBoss … (poz/ifade parametreli)
/components    → TitleCard, ScreenCard, SourceCard, StatReveal, Subtitle, Text (JP satır kırma)
/audio         → 1.mp3 … 22.mp3
/timing        → 1.json … 22.json + index.json
/sections      → s01.ts … s11.ts
PROJECT.md
```

## 3. Malzemeler
- **22 mp3**: `1.mp3 … 22.mp3`, her biri 0'dan başlar. Seslendirme, senaryonun her başlık / [画面] / [出典] notunda kesilerek parça parça yapıldı.
- **22 timing JSON** (stable-ts zorunlu hizalama + BudouX ifade gruplama):
```json
{ "id": 1, "audio": "1.mp3", "duration": 14.820, "text": "…",
  "phrases": [{ "text": "トラブルが", "start": 0.120, "end": 0.610 }],
  "chars":   [{ "c": "ト", "start": 0.120, "end": 0.190 }] }
```
- **Parça yerleşimi:** bölüm içinde `parçaBaşlangıcı + kelimeZamanı`. Parçalar arasındaki boşluklar (kart süreleri) kodda ayarlanır.
- **Maskot görseli:** kanalın maskotu. Temel oturumda yüklenecek; tüm bölümlerde aynı çizim fonksiyonu kullanılır.

## 4. Metin kartı tipleri
| Tip | Ne zaman | Davranış |
|---|---|---|
| **SectionTitle** | Bölüm başlığı | Konuşma durur, ~2–3 sn tam ekran kart |
| **ScreenCard** | `[画面]` notu | Konuşma durur veya biter; kavram adı / istatistik vurgusu, ~1,5–2,5 sn |
| **StatReveal** | Sayılar (27.7%, 58.6% / 32.3%) | Sayı sayaçla büyür, kaynak altta |
| **SourceCard** | `[出典]` / kaynak | Alt köşede lower-third, konuşma sürerken de kalabilir |
| **Subtitle** | Tüm konuşma | `phrases` zamanlarıyla ifade ifade |

## 5. Bölümler ve parça eşlemesi (KESİN — metin karşılaştırmasıyla doğrulandı)
| # | Bölüm | Ses | Süre |
|---|---|---|---|
| s01 | 冒頭 | 1,2,3 | 1:53 |
| s02 | 思い出されるのは誰か | 4,5 | 1:34 |
| s03 | 防がれた火事 | 6,7 | 1:28 |
| s04 | 思い出せるもの | 8,9 | 1:17 |
| s05 | 見てる人は見てる？ | 10,11 | 1:19 |
| s06 | 気づかれても、数えられない | 12,12b | 1:21 |
| s07 | 頼めば確実な人 | 13,14 | 0:50 |
| s08 | 問いが、自分に向かう | 15,16 | 1:29 |
| s09 | 評価する側に座る | 17,18 | 1:10 |
| s10 | もう一人の、見えていない人 | 19,20,21 | 1:30 |
| s11 | 何も起きなかった日 | 22 | 0:36 |
- 12b: 「見えないということには、二つの形があります。」 sonradan kaydedildi; 12b.json elle hizalandı. Tüm JSON'lar ve 12b.mp3 proje içinde.
- Kart yerleşimi ve görsel omurga: **PLAN.md**.

## 5b. Sabit kurallar
- **Altyazı:** tek `Subtitle` bileşeni, tüm bölümlerde aynı stil ve konum (alt orta, sabit bant). `phrases` ile cümle bazlı gösterim, okunan ifade hafif vurgulu, zıplama yok. Kart anlarında gizlenir. SourceCard sol altta, bandın üstünde.
- **Ses:** her bölüm MP4'ü kendi sesiyle (AAC) render edilir; parçalar kart boşluklarıyla birlikte zamanına yerleştirilir.

## 6. Karakterler ve tekrar eden motifler
- **Maskot**: anlatıcı/rehber; sorular, düşünce deneyleri ve geçişlerde görünür.
- **Aさん / Bさん**: aynı işi yapan iki çalışan (A her hafta rapor verir, B sessizce çalışır). s02'de tanıtılır, sonra referans olarak döner.
- **方針を受け止める上司**: üstten gelen değişiklikleri ekibine indirmeyen yönetici. s03'te tanıtılır, s10'da ayrıldığında "korunduklarını" fark ettiren sahneyle kapanır. İki sahne görsel olarak birbirine bağlı olmalı.
- **評価者**: s09'da "1 saat / 20 kişi" ile değerlendiren koltuğu (izleyicinin bakış açısı).
- **Çift (家事)**: s10'da, iki yüzdesi toplanınca %100'ü aşan grafik.
- **Motifler**: 月報「特になし」 (açılış ve kapanış, kitap ayracı gibi) · goril (genel, telif içermeyen kostüm figürü) · yangın söndürme vs. önleme · "iyi görünen koltuk" / bakış açısı · hafıza (anılardan seçilen kartlar).
- Tutarlılık kuralı: karakterler ve motifler sadece `/characters` ve `/components` fonksiyonlarıyla çizilir; bölüm dosyası yeniden çizmez.

## 7. Görsel dil (temel oturumda kesinleşecek)
- 2D, düz renk + hafif doku, sınırlı palet; belgesel kısımlar (deneyler, veriler) daha grafiksel, düşünce/duygu kısımları daha sinematik (ışık, derinlik, yavaş kamera).
- Japonca font: Noto Sans JP / Noto Serif JP (gömülü, yüklenmeden çizim yok).
- Kamera: yavaş push-in / pan, parallax katmanları; sert kesme sadece vurgu anlarında.

## 8. Oturum kuralları
- **Oturum sırası:** (1) Omurga planı → (2) s01 pilot: motor + design + karakterler + bileşenler + s01 → stil onayı → (3) Bölüm oturumları (her biri kendi detay planıyla): oturum başına 1–2 bölüm.
- **Her oturumun başında:** PROJECT.md'yi oku; yüklenen `proje.zip`'i aç.
- **Kontrol:** hedefli still kareler (geçişler, kartlar, karakter anları, senkron kritik kelimeler), bölüm başına ~6–10 kare. Video doğrudan izlenemez, kontrol kare üzerinden yapılır.
- **Her oturumun sonunda:** bölüm MP4 + güncel `proje.zip` + güncellenmiş PROJECT.md (bitmiş bölümler, son karede ne var, sonraki bölüm nereden başlar). Çalışma alanı oturumlar arası taşınmaz; zip indirilmeli.
- **Sonraki oturuma yüklenecekler:** `proje.zip`, PROJECT.md, ilgili bölümün mp3 + json dosyaları, sahne planının o bölüme ait kısmı.

## 9. İlerleme
- [x] Omurga planı (PLAN.md) — detay planı her bölüm oturumunda
- [x] s01 pilot render edildi (out/s01.mp4, 2:05) — STİL ONAYI BEKLİYOR
  - Render: `npm i` → `node engine/render.mjs s01` (sesli MP4) · `--stills 5,40` (kontrol kareleri)
  - Ses efektleri: engine/sfx.py (matematik sentez), bölüm dosyasındaki `cues` listesi; konuşma altında ~-23 LU, sidechain ile kısılır
  - s01 son karesi: siyah. s02 siyahtan SectionTitle ile açılır.
- [x] s02 kodlandı (render kullanıcıda)
- [x] Render hızlandırma: `render_all.mjs --gpu --jobs N` (bundle tek sefer derlenir, GPU tespiti, RAM`e göre otomatik iş sayısı). Varsayılan komut: `node engine/render_all.mjs sXX --gpu --jobs 4`
- [ ] s03 … s11

## 10. s01 pilot geri bildirimi (kullanıcı, 2026-11-02) — v2 ZORUNLU
Genel yön tamam, ama: sahneler çok basit, hareket durgun, kamera hareketi yok, nesneler çok basit, boş arka planlar sıkıcı, tüm nesneler aynı tonda.
v2 hedefi: profesyonel animasyon + belgesel karışımı. Yapılacaklar:
1. **Gerçek mekânlar:** her shot somut bir ortamda (ofis katı, spor salonu/koridor (goril), toplantı odası, gece masası detaylı). Ön/orta/arka plan katmanları (parallax), set objeleri (raf, pencere, şehir ışıkları, monitör, kablo, bitki, dosya yığınları).
2. **Renk: nesne rengi ≠ lens/grade.** Önce nesneler kendi yerel renkleriyle çizilir (ten, ahşap, kumaş, kağıt, metal farklı), sonra sahne başına "lens" katmanı: renk grade (gölge mavi/teal, ışık sıcak), bloom, kromatik sapma kenarda, alan derinliği (arka plan blur), vinyet, grain. → design/grade.ts (offscreen + filter).
3. **Kamera:** her shot'ta sürekli hareket (dolly-in, pan, orbit-hissi parallax, rack focus, hafif el kamerası titremesi), vurgu anlarında hızlı push / whip-pan geçişleri.
4. **Karakterler daha detaylı:** insanlarda giysi katmanları, saç, el, yüz gölgesi (yüz yine minimal), duruş çeşitliliği, ikincil hareket (nefes, kafa çevirme, yürüyüş döngüsü). Goril kostümü fermuarlı/kostüm hissi.
5. **Hareket yoğunluğu:** her 2–4 sn'de bir görsel olay; nesneler sahneye girer/çıkar, ışık değişir.
6. Ses, altyazı, kart sistemleri ve zamanlama AYNEN kalır.

## 11. Durum (2026-11-02) ve yeni iş akışı
- s01 v2 kodu tamam (gerçek mekânlar: gece odası, spor salonu, gece ofisi, koridor; lens: design/grade.ts; mekânlar: design/env.ts; detaylı insanlar: characters/people.ts). Kullanıcı onayı bekleniyor.
- **Render kullanıcının bilgisayarında** yapılır (bulut ortamı çok yavaş: 2 çekirdek, GPU yok). Model sadece `--stills` ile kontrol kareleri alır, tam render ALMAZ.
  Kullanıcı: `node engine/render_all.mjs sXX` → out/sXX.mp4 (bkz. RENDER_TR.md).
- Yeni bölüm oturumu: zip'i aç → `npm i` → PROJECT.md + PLAN.md oku → s01.ts'yi örnek al (aynı yapı: SCENES + lens + cues) → sections/sXX.ts yaz → entry.ts'deki SECTIONS'a ekle → stills ile kontrol → güncel zip ver.
- Sıradaki: s02 (ses 4, 5). s01 son karesi siyah; s02 siyahtan SectionTitle "02 思い出されるのは誰か" ile açılır.

## 12. Durum — s02 (2026-11-02)
- s02 kodu tamam: `sections/s02.ts` (ses 4 @6.0 sn, 顕著性効果 kartı 70.05–73.0, ses 5 @73.2, END 106.5 ≈ 1:47). Stills ile doğrulandı; render kullanıcıda: `node engine/render_all.mjs s02`.
- Sahneler: ofis (A rapor verir / B sessiz ✓) → 上司 masası, 一年後, kafada anı kartları hep A → pano: 目に入った回数 → deney odası (Taylor & Fiske, aydınlık/gölge yüz, 5票/1票) → terazi (顕著性効果) → 「よく見える席」 spot → anı kartları 評価シート'ye akar.
- Yeni ortak parçalar: `components/cards.ts` → `thoughtExperiment()`, `memoryCard()` (hafıza motifi, s04/s09'da tekrar) · `design/env.ts` → `envLab()`.
- Karakter kimlikleri: Aさん outfit 0 (mavi), Bさん outfit 2 (yeşil), 上司 outfit 4 + kravat.
- s02 son karesi: siyah (評価 dosyası kapanır → fade). s03 siyahtan SectionTitle "03 防がれた火事" ile açılır.
- Sıradaki: s03 (ses 6, 7).
