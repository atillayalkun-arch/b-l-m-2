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
- [ ] s05 (atlandı, henüz kodlanmadı)
- [x] s06 kodlandı (render kullanıcıda)
- [x] s07–s10 kodlandı (render kullanıcıda)
- [ ] s11

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

## 15. Durum — s06 (2026-11-02)
- **Not:** s05 henüz kodlanmadı (sections/s05.ts yok); s06 ondan önce yapıldı. entry.ts SECTIONS: s01–s04, s06.
- s06 kodu tamam: `sections/s06.ts` (SectionTitle 0–3.6, ses 12 @3.4, ScreenCard 気づかれない ／ 気づかれても、数えられない 81.9–85.7, ses 12b @85.6, END 91.4 ≈ 1:31). Stills ile doğrulandı (25 kare). Render: `node engine/render_all.mjs s06 --gpu --jobs 4`.
- Sahne planı (ses12 yerel sn): 0–9.6 面談室 (jaluzi + gece şehri, beyaz tahta, saat), 上司 masada, B omuz üstü ön plan, rack focus; 「頑張ってるね」「頼りにしているよ」 sıcak sarı balonlar · 9.6–21.4 masa üstü: 人事評価 sayfası kayar, B+ → B− kırmızı ok @低かった, 「特に大きな成果は…」 gri balon, 「頑張ってるのは…」 @あいまい bulanıklaşır, dosya kapanır @終わる · whip-pan → 21.4–31.4 gece ofisi, 7 masa; 働く人の声 balonları hızlanarak çoğalır, 「珍しくない」 damgası, maskot + büyük 「？」 @問い · 31.4–40.6 boş 面談室: balon @嘘 çatlar, @嘘ではなかった onarılıp sarıya döner ✓, kamera yukarı tilt (流れ) · 40.6–56 hiyerarşi basamakları (直属の上司 → 部長 → 本部長 → 評価会議 koltuğu, spot), geçitler iner @通用, 「頑張っていた」印象 kartı 1. geçitte düşer @印象 (印象✕), 言葉にできる成果 kartı geçitlerden yeşil yanarak geçer (成果○) · whip-pan → 56–64.4 上司 B'ye defter kaydırır, 「やったこと」 listesi yazılır, 「言葉にして、伝えてほしい」 · 64.4–73.5 iki koltuk: 見ている人 (上司, sıcak, B'ye sarı bakış ışını) ≠ 評価を決める人 (uzak, yüksek), cam bölme iner @同じではない, ✓ @嘘ではありません · 73.5–78 göz (見ること) → sarı ışın cam duvarda durur; sayaç (数えること) 3 kez basılır ama 0000 kalır, @別のこと.
  Ses12b: 「見えない、二つの形」, iki satır: 気づかれない (gölgede figür) / 気づかれても、数えられない (sarı figür + 0 sayaç) → siyah.
- Yeni ortak parçalar: `design/env.ts` → `envMeetingRoom()`, `meetingTable()` · `components/evaluation.ts` → `speechBubble()` (warm/fuzzy/crack/grey), `evalSheet()`, `armchair()` (koltuk motifi — s09'da izleyicinin koltuğu için kullan), `chainLevel()`, `tallyCounter()`.
- sfx.py yeni EYLEME ÖZEL efektler: slide (kâğıt masada kayar), folderclose, crack (balon çatlar), mend, flutter (kart düşer), gate (geçit), approve (成果 geçer), counter (mekanik sayaç), chair (deri koltuk), glasswall (cam bölme).
- s06 son karesi: siyah (iki biçim satırı → fade). s07 siyahtan SectionTitle "07 頼めば確実な人" ile açılır. Sıradaki: s05 (ses 10, 11) veya s07 (ses 13, 14).

## 16. Durum — s07 (2026-11-02)
- s07 kodu tamam: `sections/s07.ts` (SectionTitle 0–3.6, ses 13 @3.4, SourceCard Koval, vanDellen, Fitzsimons & Ranby (2015) g(12.4)–g(30.4), ses 14 @39.2, END 54.6). Stills ile doğrulandı (22 kare). Render: `node engine/render_all.mjs s07 --gpu --jobs 4`.
- (Not: s05 kullanıcı tarafında tamamlandı; bu zip'te sections/s05.ts yoksa entry.ts'ye s05 eklenmeli.)
- Sahne planı (ses13 yerel sn): 0–9.6 B'nin gece masası (pencere/şehir + boş masalar parallax, masa lambası): dizüstü kapanır, kurdeleli 「報酬」 kutusu kayıp oturur @届きます, kurdele çözülür @ただし, hayalet madalya üstü çizilip söner @評価ではありません, kapak fırlar + görev kartları fışkırır @次の仕事 · whip-pan → 9.6–12.6 ofis: meslektaşlar B'ye döner, 「あの人に頼めば確実だから」, kartlar masalardan B'ye kayar · 12–23.9 gözlem odası: dergi (fosforlu kalem) → rack focus → B; 自分を律する力 metresi @律する, 「きちんと」 etiketi, 5 kişilik halka @周り, beklenti kartları uçar @期待され, 「任される」 damgası · 23.4–30.9 周りの見積もり (düşünce balonu, 3 kart 「このくらいでしょ」) < 実際の苦労 (dev yığın), rack focus @実際より, 「小さく見積もる」 · 30.4–END13 B yakın: omuzda kart yığını, 重荷 torbası düşer @重荷, omuz çöker, toz.
  Ses14: 0–4.2 tepeden ofis planı: 14 masadan kart akıntıları B'nin masasına (集まっていく) · 3.6–8 gece masası: IN→OUT sessiz işleme, hızlanır (静かに) · 7.4–END arka biten iş yığınları griye solar @当たり前 (gri damga), @記憶に toza dönüşür → siyah.
- Yeni ortak parçalar: `components/workload.ts` → `taskCard()` (grey=当たり前 solması), `cardStack()` (yan görünüş yığın, kesirli n), `rewardBox()` (報酬 kutusu: ribbon/open), `inOutTray()`, `burdenSack()` (重荷), `taskLabel()`. s08/s10/s11'de iş yükü için kullan.
- sfx.py yeni EYLEME ÖZEL efektler: laptop, boxland, ribbon, medalfade, lidpop, cardburst, carddeal (kart masaya düşer), meter, stackcreak (yığın yükselir), sandbag (重荷), lamp.
- s07 son karesi: siyah (toz → fade). s08 siyahtan SectionTitle "08 問いが、自分に向かう" ile açılır. Sıradaki: s08 (ses 15, 16).

## 17. Durum — s08 (2026-11-02)
- s08 kodu tamam: `sections/s08.ts` (SectionTitle 0–3.6, ses 15 @3.4, ScreenCard その仕事がなくなったら、誰が、いつ困るか 62.75–66.55, ses 16 @66.6, END 97.6 ≈ 1:38). Stills ile doğrulandı (25 kare). Render: `node engine/render_all.mjs s08 --gpu --jobs 4`.
- Sahne planı (ses15 yerel sn): 0–5.6 ofis: 上司 yeni gelene (outfit 1) 「よくやった！」, alkış + konfeti + sarı hale @褒められ; ön planda B, rack focus B'ye · 5.2–12.4 B'nin gece masası (s07 mekânı, camda yansıma): 「？」 @ふと, düşünce balonuna 「自分は、何のために頑張っているんだろう」 yazılır · 12–17.6 soru oku pencereye (外 ✕) → @内側 kıvrılıp göğse döner, iris kararır · 17.2–29.4 iç oda (aynalı karanlık duvarlar, tepe ışığı): 努力が足りない damgası @足りない, basamaklarda あの人たち + 能力↑/努力↑/要領◎ etiketleri, B küçülür + 不器用 etiketi, pusula iğnesi yanlışa döner, 方向を間違えている · 28.8–38.6 masa: hızlanan IN→OUT, yığınlar büyür, もっと頑張る damgası, @静かなまま ses dalgası düzleşir, her şey griye · whip-pan → 38.3–47.4 gece yol ayrımı: tabelalar 見る側の記憶 (anı kartları, @できません eğilir) / 努力の向き (sarı yanar, pusula) · 46.8–53.4 hedef (会社が求めているもの) vs B'nin oku, @ずれている açı yayı 「ずれ」 · 52.8–kart: 記憶/向き kapıları, 「？」 gidip gelir, @問い sarı soru kartı.
  Ses16: 0–4.6 「Bの仕事」 kartı çekilir → domino zinciri (チーム/隣の課/顧客/上司/締切) düşer, 必要とされている ✓ · 4.2–9.4 mantar pano: 仕事はある (kartlar) vs boş çerçeve → @記憶に 「記憶に残る形」 sarı · whip-pan → 9.1–16.8 報告メモ defteri: 「何も起きなかった」 yazılır, üstü çizilir; 「何を起こさずに済んだか」 yazılır + fosforlu sarı @言葉に, somut örnekler, söndürülmüş hayalet alev · 16.4–21.9 kart çekilir, dominolar düşmez (……), pusula iğnesi @向きを hedefe döner, hedef sarı · 21.4–END gece masası: 「力が足りない」 mührü B'nin üstünde asılı kalır, inmez, @もったいない toza dönüşür; pencerede şafak, B başını kaldırır → yumuşak siyah.
- Yeni ortak parçalar: `components/direction.ts` → `compass()` (pirinç pusula, wrong/lit/jitter), `signpost()` + `post()` (ahşap yön tabelası), `domino()` (etki zinciri, lit/grey), `target()` (会社が求めるもの). s10/s11'de "yön" ve "誰が困るか" zinciri için kullan.
- s08 içi yardımcılar: `writeText()` (el yazısı gibi açılan metin), `nightDesk(..., {dawn, reflect})` (s07 masasının şafak + cam yansımalı sürümü).
- sfx.py yeni EYLEME ÖZEL efektler: heartbeat (içe dönüş), compass (iğne tıkırtısı), typing (hızlanan klavye), wind (yol ayrımı), signcreak (tabela), creak (ok sapar), domino, pin (raptiye), strike (üstünü çizme), dawnbird (şafak).
- entry.ts SECTIONS: s01–s04, s06, s07, s08 (s05 hâlâ zip'te yok; kullanıcı tarafında eklenmeli). Font probe'a s08 karakterleri eklendi.
- s08 son karesi: şafaklı gece masası → siyah. s09 siyahtan SectionTitle ile açılır. Sıradaki: s09 (PLAN.md'deki ses numaraları: 17, 18).

## 18. Durum — s09 (2026-11-02)
- s09 kodu tamam: `sections/s09.ts` (SectionTitle 0–3.6, ses 17 @3.4, ses 18 @9.0, END 75.0 ≈ 1:15; ScreenCard yok). Stills ile doğrulandı (~35 kare). Render: `node engine/render_all.mjs s09 --gpu --jobs 4`.
- Sahne planı: ses17 — gözlem odası (tek yönlü cam): B koltukta ışık altında, @実験 ışık yanar, @座る boş değerlendirici koltuğu bize döner, @逆 levha 評価される側→評価する側 döner. Ses18 (yerel sn): 0–7 değerlendirici masası (dosya rafları, yeşil banker lambası, izleyici koltuğu ön planda, rack focus): kum saati @一時間 akar, dosya yığını düşer, @二十人 20 sayfa yelpaze · 7–12.6 20 yüz kartı, @半分 10'u silinir → ？ · 12–18.6 kalem arar, ipucu kartları (思い出せる/説明しやすい sarı, 目立たない貢献 söner), @決まって kilit · 18–24.5 hatırlanan 3 kart öne (sarı), diğerleri küçülür; yazılır, @点 puan noktaları · whip-pan → 24–29 評価者研修 klasörü, sekmeler (期末誤差/ハロー効果/中心化/寛大化) · 29–34.4 12 aylık takvim, son aylar büyür + sarı, ilk aylar söner, 期末誤差 damgası · 34–39.8 A (outfit 0) rozeti → hale tüm gövdeye, değerlendirme satırları ◎◎◎◎, ハロー効果 · 39.6–47 忘年会 salonu: 幹事 (outfit 3) mikrofon, isim kartı, konfeti, 今期評価 B→A ↑ · whip-pan → 47–51.6 上司 (outfit 4) masada, kamera yukarı: 部長 katı, bakış ışını iner · 51–57.8 「売上+12%」 kartı ✓✓🛡 öne çekilir, B'nin 「障害の予兆つぶし」 kartı itilip solar · 57.5–END gözlem odasına dönüş: camda A sarı/B gri hayaleti, @この席 koltuk, @誰もが hayalet oturanlar üst üste, kalem A kartına gider, lamba söner → siyah.
- Yeni ortak parçalar: `components/evaluator.ts` → `hourglass()` (持ち時間), `faceCard()` (blank/q/glow/score — 20人 kartları), `calendarStrip()` (評価期間 12 ay), `eventBanner()`, `gazeBeam()` (上から評価), `binderTab()`. s10/s11'de değerlendirme masası ve yüz kartları için kullan.
- sfx.py yeni EYLEME ÖZEL efektler: plateflip (levha döner), sand (kum saati), sheetfan (20 sayfa yelpaze), erase (yüz silinir), mictap (幹事 mikrofon), glowhum (hale yayılır).
- entry.ts SECTIONS: s01–s04, s06–s09 (s05 hâlâ zip'te yok). Font probe'a s09 karakterleri eklendi.
- s09 son karesi: karanlık gözlem odası, koltuk + A/B kartları → lamba söner → siyah. s10 siyahtan SectionTitle "10 もう一人の、見えていない人" ile açılır. Sıradaki: s10 (ses 19, 20, 21).

## 19. Durum — s10 (2026-11-02)
- s10 kodu tamam: `sections/s10.ts` (SectionTitle 0–3.6, ses 19 @3.4, ScreenCard 家事の割合 9.25–11.75, ses 20 @11.6, ScreenCard 自己中心性バイアス + 出典 Ross & Sicoly (1979) 24.3–27.7, ses 21 @27.5, END 101.0 ≈ 1:41). Stills ile doğrulandı (~20 kare). Render: `node engine/render_all.mjs s10 --gpu --jobs 4`.
- Sahne planı: ses19 — karanlık ofis (s01 ipucu kompozisyonu), maskot feneri, @もう一人 silüet (outfit 4), sarı ？, push-in. Ses20 — gece evi (mutfak, buzdolabı, çamaşır ipi): çift (outfit 1 / outfit 3), @家事 8 ev işi karosu, @別々に paravan iner, cevap kâğıtları 60% / 55% · pano: çubuklar dolar, @足すと üst üste, @超えて %100 aşılır → 115% damgası. Ses21 (yerel sn): 0–3.4 「嘘」 çizilir, iki cevap ✓ · 3.2–11 bölünmüş ekran: 内側から 8 karo yanar / 外側 aralık kapı, parçalı karolar, sayaç 2/8 · 10.8–15.9 iki ışık havuzu, 自己中心性バイアス damgası · 15.6–21 gözlem odası: değerlendirici koltuğuna 同僚/隣の席/部下 koltukları eklenir, bakışlar B'yi ıskalar · 20.7–26 meslektaş (outfit 5) B'ye bakar, gri balon 「もっと上手く…」 · whip-pan → 25.8–33.4 aynı kişi 課長 (plaka düşer), ekibin görünmeyen işleri sarı karo olur, balon çatlar @自分のほう · whip-pan → 33–58.7 ★ s03 şemsiye: hatırlama (sarı 上司) → @離れた 上司 kapalı şemsiyeyle çıkar → oklar ekibe yağar, panik → @守られていた ekip yukarı bakar, @防がれていた sarı hayalet şemsiye + 上司 · 58.5–66.8 karanlık ofis: silüet → yan masada B rafı tutar, @支えている sarı · 66.4–END monitör söner, yansımada izleyici + yanındaki sarı kişi, @私たち自身 → lamba söner → siyah.
- Yeni ortak parçalar: `components/household.ts` → `envHome()` (gece evi), `choreTile()` (家事 karosu; lit/frag/yellow), `shareBars()` (%100 çizgisini aşan iki çubuk), `answerSlip()` (cevap kâğıdı). s11'de ev sahnesi için `envHome` kullanılabilir.
- sfx.py yeni EYLEME ÖZEL efektler: dishclink, tap (musluk), partition (paravan), barfill, overflow, lampclick, doorcreak, nameplate, arrowthud, umbrellafold, steps (uzaklaşan), shelfcreak, monitoroff. (`murmurs` FX'e kayıtlı değildi, eklendi.)
- entry.ts SECTIONS: s01–s04, s06–s10. Font probe'a s10 karakterleri eklendi.
- s10 son karesi: siyah (monitör yansıması → lamba söner). s11 siyahtan SectionTitle "11 何も起きなかった日" ile açılır. Sıradaki: s11 (ses 22) — ayrıca s05 (ses 10, 11) hâlâ eksik.
