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
- [x] s03 kodlandı (render kullanıcıda)
- [x] s04 kodlandı (render kullanıcıda)
- [ ] s05 … s11

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

## 13. Durum — s03 (2026-11-02)
- s03 kodu tamam: `sections/s03.ts` (ses 6 @3.2, ses 7 @23.6, END 96.8 ≈ 1:37). Stills ile doğrulandı. Render: `node engine/render_all.mjs s03`.
- Sahneler: gece ofis yangını (alev/duman/kıvılcım, söndürücü spreyi, alarm çakarı, alkış + flaş, 英雄) → whip-pan → karanlık köşe: aynı çöp kutusu/priz düzenli, B tipi figür, 火事0件 → masa üstü dergi (Repenning & Sterman 2001, JP çeviri şeridi + fosforlu kalem, 手柄0 damgası) → pano: 消火 (anlık sıçrama, 評価✓) vs 予防 (hayalet yangınlar söner, 「何も起きない」), madalya / 後回し → mantar pano: 3 görev kartı, sonra iz bırakmadan silinir → ★ şemsiye: 方針 okları şemsiyeye çarpar, altında sakin ekip → 上層部 iki ekran (すぐ動く✓ 頼もしい / 反応が遅い…？) → şemsiyeye dönüş, sarı hale, push-in → siyah.
- Yeni ortak parçalar: `design/fx.ts` (flame, smoke, sparks, spray, alarmLight, flashPop, whipStreaks, confetti) · `characters/props.ts` (extinguisher, wasteBin, powerStrip, umbrella, policyArrow, medal, mug, plant, wallClock) · `components/umbrella.ts` → `umbrellaShot()`: ★ s10 AYNI fonksiyonu `lift: 0→1`, `bossAlpha: 1→0` ile çağırır (oklar ekibe yağar, `calm` düşer). Dünya koordinatları `UMB`/`TEAM` sabit.
- sfx.py yeni efektler: alarm, crackle, spray, clap, shutter, paper, umbrella.
- render.mjs: Python seçimi → `PYTHON` env > Windows `py -3` > python > python3; venv / hermes Python'ları atlanır, numpy+scipy kontrol edilir.
- s03 son karesi: siyah. s04 siyahtan SectionTitle "04 思い出せるもの" ile açılır. Sıradaki: s04 (ses 8, 9).

## 14. Durum — s04 (2026-11-02)
- s04 kodu tamam: `sections/s04.ts` (SectionTitle 0–3.6, ses 8 @3.4, ScreenCard 利用可能性ヒューリスティック 45.8–49.35 + 出典 Tversky & Kahneman (1973), ses 9 @49.4, END 86.8 ≈ 1:27). Stills ile doğrulandı. Render: `node engine/render_all.mjs s04 --gpu --jobs 4`.
- Sahne planı (ses8 yerel sn): 0–6.3 arşiv odası, maskot izleyiciye döner, takvim 6 ay çevrilir (半年), 「助かった」 anı kartları yükselir · 6.3–12 masa yakın planı, 3 olay kartı (alev parlar @起きて 8.0, ✓ @解決 9.54), rack focus · whip-pan → 12–16.4 「何も起きなかった日」 boş kart solar ve parçalanır, maskot büyüteçle · whip-pan → 16.2–24.6 deney odası: okuyucu + mikrofon, isim şeritleri dinleyicilere uçar, 男性／女性, 「どちらが多かった？」 · 24.6–34 pano: 19 有名人 (sarı yıldız) vs 20 無名 (soluk), sayaçlar, rack focus · 34–45.8 terazi: eller kalkar, oy kâğıtları sol kefeye uçar, terazi YANLIŞ tarafa çöker @多かった; 19 < 20 + 「一人少ない」 damgası @実際には.
  Ses9: 0–11.2 parlak kart yankıları çoğalır (数が多い), frekans barı, 「多い！」 damgası, terim yazılır · whip-pan → 11.2–19 上司 hafıza çekmecesini açar/karıştırır, hep A kartları; 「あの人は」 B kartı + soru balonu · 18.6–24 「防がれた問題」 çekmecesi: boş, toz, fener taraması · 23.6–31.6 zaman ipi: 半年前 静かに防がれた事故 (soluk, bulanık) → rack focus → 先週 派手な火事 (alev, flaş @鮮明) · 31–END 評価シート: A'ya 5 puan noktası @点を, B 「例なし」 → siyah.
- Yeni ortak parçalar: `components/memory.ts` → `drawerCabinet()` (hafıza çekmecesi; açılma/kart sayısı/parlama/karıştırma), `nameChip()` (isim şeridi, famous/dim), `balanceScale()` (pirinç terazi, kefe içeriği callback), `dustPuff()`. s08/s09/s11'de tekrar kullanılabilir.
- sfx.py yeni EYLEME ÖZEL efektler: pageflip, cardrise, flare, checkmark, lowdrone, dissolve, tapehiss, flick, pop, tally, murmur, rustle, scaleclank, stamp, type, drawer, drawerclose, riffle, dustpuff, inkdot, bulbhum. Kural: her görsel tetikleyicinin (çekmece, damga, terazi, kart, alev) kendi fiziksel sesine uygun efekti olmalı; genel whoosh/shimmer sadece geçişlerde.
- s04 son karesi: siyah (評価シート → fade). s05 siyahtan SectionTitle "05 見てる人は見てる？" ile açılır. Sıradaki: s05 (ses 10, 11).
