"""Matematik tabanlı ses efekti sentezi (müzik değil).
Kullanım: python3 sfx.py cues.json out.wav
Seviye: efektler konuşmanın çok altında (tepe ≈ -20 dBFS); render tarafında ayrıca sidechain ile kısılır.
"""
import json, sys
import numpy as np
from scipy.signal import butter, sosfilt, fftconvolve
from scipy.io import wavfile

SR = 48000
LEVEL = 0.10  # gain=1 efektin tepe genliği
rng = np.random.default_rng(7)


def t_(d):
    return np.arange(int(d * SR)) / SR


def env(n, a, r, curve=4.0):
    """a: atak (sn), r: sönüm (sn) üstel"""
    t = np.arange(n) / SR
    e = np.minimum(1, t / max(a, 1e-4))
    return e * np.exp(-np.maximum(0, t - a) * curve / max(r, 1e-4))


def bp(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo, hi], btype="band", fs=SR, output="sos"), x)


def lp(x, f, order=2):
    return sosfilt(butter(order, f, btype="low", fs=SR, output="sos"), x)


def hp(x, f, order=2):
    return sosfilt(butter(order, f, btype="high", fs=SR, output="sos"), x)


def noise(n):
    return rng.standard_normal(n)


def norm(x):
    m = np.max(np.abs(x)) + 1e-9
    return x / m


# ---------- efektler ----------
def whoosh(p):
    d = p.get("d", 1.2)
    n = int(d * SR)
    t = t_(d)
    shape = np.sin(np.pi * t / d) ** 2
    x = noise(n)
    # zamanla kayan bant geçiren: iki bandın karışımı
    lo = bp(x, 300, 1200) * (1 - t / d)
    hi = bp(x, 900, 3500) * (t / d)
    return norm((lo + hi) * shape) * 0.7


def swish(p):
    d = 0.45
    n = int(d * SR); t = t_(d)
    shape = np.sin(np.pi * t / d) ** 3
    return norm(bp(noise(n), 1500, 6000) * shape) * 0.6


def pen(p):
    d = p.get("d", 0.8)
    n = int(d * SR); t = t_(d)
    strokes = 0.5 + 0.5 * np.sign(np.sin(2 * np.pi * 7 * t + 1.3 * np.sin(2 * np.pi * 2.1 * t)))
    grit = bp(noise(n), 2500, 7000) * (0.6 + 0.4 * rng.random(n))
    fade = np.minimum(1, t / 0.04) * np.minimum(1, (d - t) / 0.08)
    return norm(grit * lp(strokes, 60) * fade) * 0.55


def shimmer(p):
    f = p.get("f", 440)
    d = 2.6
    t = t_(d)
    x = np.zeros_like(t)
    for k, (m, a) in enumerate([(1, 1), (2, 0.35), (3.01, 0.18), (4.2, 0.08)]):
        x += a * np.sin(2 * np.pi * f * m * t + k) * (1 + 0.003 * np.sin(2 * np.pi * 5 * t))
    e = env(len(t), 0.25, d, 3.2)
    return norm(x * e) * 0.45


def tick(p):
    f = p.get("f", 1800)
    d = 0.06
    t = t_(d)
    x = np.sin(2 * np.pi * f * t) * env(len(t), 0.001, 0.03, 5) + 0.3 * hp(noise(len(t)), 3000) * env(len(t), 0.0005, 0.008, 5)
    return norm(x) * 0.5


def blip(p):
    f = p.get("f", 880)
    d = 0.22
    t = t_(d)
    x = np.sin(2 * np.pi * f * t) + 0.25 * np.sin(2 * np.pi * f * 2 * t)
    return norm(x * env(len(t), 0.004, 0.18, 5)) * 0.45


def step(p):
    d = 0.18
    t = t_(d)
    body = np.sin(2 * np.pi * (90 - 40 * t / d) * t) * env(len(t), 0.003, 0.12, 6)
    scuff = bp(noise(len(t)), 400, 1500) * env(len(t), 0.002, 0.05, 6) * 0.4
    return norm(body + scuff) * 0.6


def thump(p):
    d = 0.4
    t = t_(d)
    f = 70 * np.exp(-t * 6) + 45
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * env(len(t), 0.002, 0.3, 5)
    slap = lp(noise(len(t)), 900) * env(len(t), 0.001, 0.04, 6) * 0.5
    return norm(body + slap)


def hit(p):
    d = 2.2
    t = t_(d)
    f = 110 * np.exp(-t * 3) + 38
    sub = np.sin(2 * np.pi * np.cumsum(f) / SR) * env(len(t), 0.004, 1.6, 3.5)
    air = lp(noise(len(t)), 2500) * env(len(t), 0.002, 0.5, 5) * 0.25
    return norm(sub + air) * 0.85


def fall(p):
    d = 1.4
    t = t_(d)
    f = 520 * np.exp(-t * 1.6) + 120
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * env(len(t), 0.05, d, 2.5)
    return norm(x) * 0.35


def thunk(p):
    d = 0.5
    t = t_(d)
    body = np.sin(2 * np.pi * 150 * t) * env(len(t), 0.002, 0.25, 6)
    wood = bp(noise(len(t)), 300, 1200) * env(len(t), 0.001, 0.06, 6) * 0.7
    return norm(body + wood) * 0.7


def door(p):
    d = 0.9
    t = t_(d)
    creak = bp(noise(len(t)), 600, 1400) * np.sin(2 * np.pi * 9 * t) ** 2 * np.minimum(1, t / 0.2) * (t < 0.45)
    slam = np.zeros_like(t)
    i = int(0.42 * SR)
    m = len(t) - i
    tt = np.arange(m) / SR
    slam[i:] = np.sin(2 * np.pi * 80 * tt) * np.exp(-tt * 9) + lp(noise(m), 1200) * np.exp(-tt * 25) * 0.6
    return norm(creak * 0.25 + slam) * 0.8


def click(p):
    d = 0.08
    t = t_(d)
    x = hp(noise(len(t)), 2000) * env(len(t), 0.0005, 0.01, 6) + np.sin(2 * np.pi * 2400 * t) * env(len(t), 0.0005, 0.02, 6) * 0.5
    return norm(x) * 0.6


def riser(p):
    d = p.get("d", 2.4)
    t = t_(d)
    f = 80 * (1 + 2.5 * (t / d) ** 2)
    tone = np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.4 * np.sin(2 * np.pi * np.cumsum(f * 1.5) / SR)
    air = bp(noise(len(t)), 500, 3000) * (t / d) ** 2 * 0.4
    e = (t / d) ** 1.5 * np.minimum(1, (d - t) / 0.15)
    return norm((tone * 0.6 + air) * e) * 0.5


def room(p):
    """Oda tonu: çok düşük, yavaş dalgalanan koyu gürültü"""
    d = p.get("d", 60)
    n = int(d * SR)
    t = np.arange(n) / SR
    x = lp(noise(n), 220, 4) + 0.3 * bp(noise(n), 2000, 5000)
    x = x * (0.8 + 0.2 * np.sin(2 * np.pi * 0.07 * t))
    x = norm(x) * 0.09
    fade = np.minimum(1, t / 1.5) * np.minimum(1, (d - t) / 1.5)
    return x * fade



# ---------- s03 ----------
def alarm(p):
    """İki tonlu yangın alarmı (uzaktan, filtreli)"""
    d = p.get("d", 3.0); t = t_(d)
    f = np.where((t * 2.2) % 1 < 0.5, 960, 760)
    x = np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * 0.5 + np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.5
    x = bp(x, 500, 2500)
    e = np.minimum(1, t / 0.3) * np.minimum(1, (d - t) / 0.4)
    return norm(x * e) * 0.45


def crackle(p):
    """Alev çıtırtısı: düşük gürleme + rastgele çatırtılar"""
    d = p.get("d", 3.0); n = int(d * SR); t = t_(d)
    roar = lp(noise(n), 300, 2) * 0.6
    cr = np.zeros(n)
    for _ in range(int(d * 40)):
        i = rng.integers(0, max(1, n - 800)); L = rng.integers(80, 600)
        cr[i:i + L] += hp(noise(L), 1500) * np.exp(-np.arange(L) / (L / 5)) * rng.uniform(0.3, 1.0)
    e = np.minimum(1, t / 0.4) * np.minimum(1, (d - t) / 0.6)
    return norm((roar + cr) * e) * 0.6


def spray(p):
    d = p.get("d", 1.2); n = int(d * SR); t = t_(d)
    x = bp(noise(n), 1200, 9000)
    e = np.minimum(1, t / 0.05) * np.minimum(1, (d - t) / 0.25) * (0.85 + 0.15 * np.sin(2 * np.pi * 9 * t))
    return norm(x * e) * 0.7


def clap(p):
    """Alkış: çok sayıda kısa gürültü darbesi"""
    d = p.get("d", 2.0); n = int(d * SR); t = t_(d)
    x = np.zeros(n)
    for _ in range(int(d * 70)):
        i = rng.integers(0, max(1, n - 1200)); L = 900
        x[i:i + L] += bp(noise(L), 800, 5000) * np.exp(-np.arange(L) / 120) * rng.uniform(0.4, 1)
    e = np.minimum(1, t / 0.3) * np.minimum(1, (d - t) / 0.7)
    return norm(x * e) * 0.6


def shutter(p):
    d = 0.12; t = t_(d); n = len(t)
    x = hp(noise(n), 2500) * (env(n, 0.0005, 0.012, 6) + 0.7 * np.roll(env(n, 0.0005, 0.015, 6), int(0.05 * SR)))
    return norm(x) * 0.5


def paper(p):
    d = 0.35; n = int(d * SR); t = t_(d)
    x = bp(noise(n), 2000, 8000) * (0.5 + 0.5 * np.abs(np.sin(2 * np.pi * 23 * t))) * np.sin(np.pi * t / d) ** 2
    return norm(x) * 0.5


def umbrella(p):
    """Şemsiye açılışı: kumaş 'fump' + tel tıkırtısı"""
    d = 0.5; n = int(d * SR); t = t_(d)
    fump = lp(noise(n), 400) * env(n, 0.02, 0.15, 5)
    clickx = np.zeros(n); i = int(0.12 * SR); clickx[i:i + 400] = hp(noise(400), 3000) * np.exp(-np.arange(400) / 60)
    return norm(fump + clickx * 0.6) * 0.7


# ---------- s04 (eyleme özel) ----------
def pageflip(p):
    """Takvim sayfası: kağıt 'flap' + kısa hava"""
    d = 0.22; n = int(d * SR); t = t_(d)
    x = bp(noise(n), 1500, 7000) * env(n, 0.004, 0.12, 5) + lp(noise(n), 500) * env(n, 0.01, 0.08, 6) * 0.6
    return norm(x) * 0.5


def cardrise(p):
    """Anı kartı belirir: yumuşak cam tını + hava"""
    f = p.get("f", 660); d = 1.2; t = t_(d); n = len(t)
    x = np.sin(2 * np.pi * f * t) + 0.3 * np.sin(2 * np.pi * f * 2.01 * t) + 0.12 * np.sin(2 * np.pi * f * 3.98 * t)
    air = bp(noise(n), 2000, 8000) * env(n, 0.05, 0.3, 5) * 0.3
    return norm(x * env(n, 0.03, 1.0, 4) + air) * 0.4


def flare(p):
    """Alev parlaması: 'fwump' (alçak gürültü patlaması + yükselen hışırtı)"""
    d = 0.9; n = int(d * SR); t = t_(d)
    body = lp(noise(n), 250, 3) * env(n, 0.03, 0.5, 4)
    hiss = bp(noise(n), 1500, 6000) * env(n, 0.08, 0.6, 4) * 0.4
    return norm(body + hiss) * 0.75


def checkmark(p):
    """✓: kalem çizgisi + iki notalı onay"""
    f = p.get("f", 660); d = 0.45; t = t_(d); n = len(t)
    scr = bp(noise(n), 3000, 8000) * env(n, 0.005, 0.12, 6) * 0.4
    tone = np.where(t < 0.1, np.sin(2 * np.pi * f * t), np.sin(2 * np.pi * f * 1.5 * t)) * env(n, 0.005, 0.35, 4)
    return norm(scr + tone * 0.7) * 0.45


def lowdrone(p):
    """Boşluk: alçak, soğuk uğultu"""
    d = p.get("d", 3.0); t = t_(d); n = len(t)
    x = np.sin(2 * np.pi * 55 * t) * 0.6 + np.sin(2 * np.pi * 82.4 * t + np.sin(2 * np.pi * 0.3 * t)) * 0.4 + lp(noise(n), 200) * 0.3
    e = np.minimum(1, t / (d * 0.3)) * np.minimum(1, (d - t) / (d * 0.4))
    return norm(x * e) * 0.5


def dissolve(p):
    """Kart dağılır: aşağı kayan granüler hışırtı"""
    d = p.get("d", 2.5); n = int(d * SR); t = t_(d)
    x = np.zeros(n)
    for _ in range(int(d * 90)):
        i = rng.integers(0, n - 500); L = 300
        x[i:i + L] += hp(noise(L), 2500) * np.exp(-np.arange(L) / 50) * rng.uniform(0.2, 1)
    x = lp(x, 9000 - 6000 * 0.5)
    return norm(x * np.sin(np.pi * t / d) * (1 - 0.6 * t / d)) * 0.45


def tapehiss(p):
    """Hoparlörden okuma: bant hışırtısı + 50 Hz uğultu"""
    d = p.get("d", 4.0); n = int(d * SR); t = t_(d)
    x = bp(noise(n), 3000, 9000) * 0.5 + np.sin(2 * np.pi * 50 * t) * 0.15
    e = np.minimum(1, t / 0.2) * np.minimum(1, (d - t) / 0.3)
    return norm(x * e) * 0.3


def flick(p):
    """Kağıt şeridi uçuşu: çok kısa 'fsst'"""
    d = 0.16; n = int(d * SR); t = t_(d)
    return norm(bp(noise(n), 2500, 9000) * np.sin(np.pi * t / d) ** 2) * 0.5


def pop(p):
    """Balon açılır: yumuşak 'pop' (inen frekans)"""
    d = 0.18; t = t_(d); n = len(t)
    f = 900 * np.exp(-t * 25) + 300
    return norm(np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.002, 0.1, 5)) * 0.5


def tally(p):
    """Sayaç tıkı: tahta + metal"""
    f = p.get("f", 1200); d = 0.07; t = t_(d); n = len(t)
    x = np.sin(2 * np.pi * f * t) * env(n, 0.001, 0.04, 6) + bp(noise(n), 800, 3000) * env(n, 0.0005, 0.01, 6) * 0.6
    return norm(x) * 0.5


def murmur(p):
    """Kalabalık mırıltısı: formantlı gürültü, konuşma ritmi"""
    d = p.get("d", 2.5); n = int(d * SR); t = t_(d)
    x = np.zeros(n)
    for k, (lo, hi, r) in enumerate([(300, 800, 3.1), (900, 1600, 4.3), (500, 1100, 5.2)]):
        x += bp(noise(n), lo, hi) * (0.5 + 0.5 * np.sin(2 * np.pi * r * t + k * 2) ** 2)
    e = np.minimum(1, t / 0.4) * np.minimum(1, (d - t) / 0.6)
    return norm(lp(x, 2500) * e) * 0.5


def rustle(p):
    """Eller kalkar: kumaş hışırtısı"""
    d = 0.6; n = int(d * SR); t = t_(d)
    return norm(bp(noise(n), 400, 3000) * (0.5 + 0.5 * np.abs(np.sin(2 * np.pi * 11 * t))) * np.sin(np.pi * t / d)) * 0.5


def scaleclank(p):
    """Terazi çöker: metal tıngırtı (inharmonik) + zincir şıngırtısı + gövde"""
    d = 2.0; t = t_(d); n = len(t)
    ring = sum(a * np.sin(2 * np.pi * f * t) * np.exp(-t * dc) for f, a, dc in [(620, 1, 2.2), (1710, 0.5, 3.5), (2930, 0.3, 5), (4110, 0.15, 7)])
    chain = np.zeros(n)
    for k in range(9):
        i = int((0.03 + k * 0.045 + rng.uniform(0, 0.02)) * SR); L = 900
        chain[i:i + L] += hp(noise(L), 3500) * np.exp(-np.arange(L) / 150) * (1 - k / 10)
    body = np.sin(2 * np.pi * 90 * t) * env(n, 0.002, 0.3, 6)
    return norm(ring * 0.6 + chain * 0.5 + body * 0.6) * 0.75


def stamp(p):
    """Mühür: lastik 'thock' + kağıt slap"""
    d = 0.35; t = t_(d); n = len(t)
    f = 160 * np.exp(-t * 20) + 70
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.001, 0.15, 6)
    slap = bp(noise(n), 1000, 5000) * env(n, 0.0005, 0.02, 6) * 0.8
    return norm(body + slap) * 0.8


def type_(p):
    """Daktilo/klavye tıkı"""
    d = 0.06; t = t_(d); n = len(t)
    x = hp(noise(n), 1800) * env(n, 0.0005, 0.012, 6) + np.sin(2 * np.pi * 300 * t) * env(n, 0.001, 0.02, 6) * 0.4
    return norm(x) * 0.5


def drawer(p):
    """Ahşap çekmece açılır: sürtünme rayı + sonunda tok vuruş"""
    d = p.get("d", 0.7); n = int(d * SR); t = t_(d)
    rough = bp(noise(n), 150, 900) * (0.6 + 0.4 * np.abs(np.sin(2 * np.pi * 37 * t)))
    slide = rough * np.minimum(1, t / 0.05) * (t < d - 0.12)
    stop = np.zeros(n); i = int((d - 0.12) * SR); m = n - i; tt = np.arange(m) / SR
    stop[i:] = np.sin(2 * np.pi * 120 * tt) * np.exp(-tt * 30) + bp(noise(m), 300, 1500) * np.exp(-tt * 50) * 0.7
    return norm(slide * 0.5 + stop) * 0.75


def drawerclose(p):
    d = 0.4; n = int(d * SR); t = t_(d)
    slide = bp(noise(n), 200, 800) * (t < 0.25) * np.minimum(1, t / 0.03)
    i = int(0.25 * SR); m = n - i; tt = np.arange(m) / SR
    thud = np.zeros(n); thud[i:] = np.sin(2 * np.pi * 95 * tt) * np.exp(-tt * 25)
    return norm(slide * 0.4 + thud) * 0.7


def riffle(p):
    """Kart karıştırma: hızlı kağıt kenar tıkırtıları dizisi"""
    d = p.get("d", 1.0); n = int(d * SR); t = t_(d)
    x = np.zeros(n); k = 0.0
    while k < d - 0.03:
        i = int(k * SR); L = 500
        x[i:i + L] += bp(noise(L), 2000, 7000) * np.exp(-np.arange(L) / 70)
        k += 0.022 + 0.02 * rng.random()
    return norm(x * np.sin(np.pi * t / d) ** 0.5) * 0.5


def dustpuff(p):
    """Boş çekmeceden toz: yumuşak nefes 'pff'"""
    d = 0.9; n = int(d * SR); t = t_(d)
    return norm(lp(noise(n), 1200) * env(n, 0.04, 0.6, 4) + bp(noise(n), 3000, 7000) * env(n, 0.02, 0.3, 5) * 0.2) * 0.5


def inkdot(p):
    """Puan noktası: keçeli kalem 'tap' + küçük nota"""
    f = p.get("f", 600); d = 0.3; t = t_(d); n = len(t)
    x = bp(noise(n), 1500, 5000) * env(n, 0.001, 0.03, 6) * 0.6 + np.sin(2 * np.pi * f * t) * env(n, 0.003, 0.2, 5) * 0.5
    return norm(x) * 0.45


def bulbhum(p):
    """Çıplak ampul vızıltısı (100/200 Hz + hafif kıpırtı)"""
    d = p.get("d", 10); t = t_(d); n = len(t)
    x = (np.sin(2 * np.pi * 100 * t) + 0.5 * np.sin(2 * np.pi * 200 * t) + 0.2 * np.sin(2 * np.pi * 300 * t)) * (0.85 + 0.15 * np.sin(2 * np.pi * 0.4 * t))
    e = np.minimum(1, t / 1.0) * np.minimum(1, (d - t) / 1.0)
    return norm(x * e) * 0.12


def slide(p):
    """Kağıt masa üstünde kayar: sürtünme hışırtısı + sonda tok dokunuş"""
    d = p.get("d", 0.7); t = t_(d); n = len(t)
    x = bp(noise(n), 800, 4000) * np.sin(np.pi * np.minimum(1, t / d)) ** 1.5 * 0.6
    k = int((d - 0.08) * SR); tap = np.zeros(n); m = min(n - k, int(0.08 * SR))
    if m > 0: tap[k:k + m] = lp(noise(m), 600) * np.exp(-np.arange(m) / SR * 60)
    return norm(x + tap * 1.4) * 0.5


def folderclose(p):
    """Karton dosya kapanır: hava 'fup' + karton tokluğu"""
    d = 0.5; t = t_(d); n = len(t)
    x = lp(noise(n), 900) * env(n, 0.03, 0.12, 5) + np.sin(2 * np.pi * 120 * t) * env(n, 0.06, 0.1, 6) * 0.6
    return norm(x) * 0.6


def crack(p):
    """Balon çatlar: ince cam/kırılgan çıtırtı"""
    d = 0.6; t = t_(d); n = len(t)
    x = np.zeros(n)
    for i in range(7):
        k = int((0.01 + i * 0.04 + 0.01 * np.sin(i * 7)) * SR); m = int(0.03 * SR)
        x[k:k + m] += hp(noise(m), 3000) * np.exp(-np.arange(m) / SR * 160) * (1 - i / 9)
    x += np.sin(2 * np.pi * 3100 * t) * env(n, 0.001, 0.25, 6) * 0.15
    return norm(x) * 0.5


def mend(p):
    """Çatlak kapanır / söz doğrulanır: sıcak iki nota, yumuşak"""
    d = 1.0; t = t_(d); n = len(t)
    x = (np.sin(2 * np.pi * 392 * t) * env(n, 0.02, 0.6, 3) + np.sin(2 * np.pi * 587 * t) * np.roll(env(n, 0.02, 0.6, 3), int(0.12 * SR)) * 0.8)
    return norm(x) * 0.4


def flutter(p):
    """Kart düşer: kağıt çırpınması (hızlı genlik modülasyonu, inen)"""
    d = p.get("d", 1.0); t = t_(d); n = len(t)
    x = bp(noise(n), 1500, 6000) * (0.4 + 0.6 * np.abs(np.sin(2 * np.pi * (18 - 8 * t / d) * t))) * env(n, 0.05, d * 0.5, 3)
    return norm(x) * 0.4


def gate(p):
    """Geçit/elek: metal sürgü 'clack'"""
    d = 0.35; t = t_(d); n = len(t)
    x = bp(noise(n), 1800, 5000) * env(n, 0.001, 0.04, 6) + (np.sin(2 * np.pi * 820 * t) + 0.6 * np.sin(2 * np.pi * 1370 * t)) * env(n, 0.001, 0.2, 6) * 0.4
    return norm(x) * 0.5


def approve(p):
    """成果 geçer: hafif çan + kağıt"""
    f = p.get("f", 784); d = 0.9; t = t_(d); n = len(t)
    x = np.sin(2 * np.pi * f * t) * env(n, 0.003, 0.6, 4) + 0.4 * np.sin(2 * np.pi * f * 2.01 * t) * env(n, 0.003, 0.3, 5)
    return norm(x) * 0.35


def counter(p):
    """Mekanik sayaç basılır: yay 'kchk' (rakam dönmez)"""
    d = 0.25; t = t_(d); n = len(t)
    x = hp(noise(n), 2000) * env(n, 0.0005, 0.015, 6) + np.sin(2 * np.pi * 1900 * t) * env(n, 0.0005, 0.05, 6) * 0.5
    x += np.roll(hp(noise(n), 2500) * env(n, 0.0005, 0.01, 6), int(0.07 * SR)) * 0.6
    return norm(x) * 0.5


def chair(p):
    """Koltuk: deri gıcırtısı + amortisör"""
    d = 0.8; t = t_(d); n = len(t)
    x = bp(noise(n), 300, 1400) * (0.5 + 0.5 * np.sin(2 * np.pi * 6 * t)) * env(n, 0.1, 0.4, 3) + lp(noise(n), 200) * env(n, 0.01, 0.2, 5) * 0.6
    return norm(x) * 0.45


def glasswall(p):
    """Cam bölme iner: alçak cam tını + hava"""
    d = 1.4; t = t_(d); n = len(t)
    x = (np.sin(2 * np.pi * 1180 * t) + 0.6 * np.sin(2 * np.pi * 2730 * t) + 0.3 * np.sin(2 * np.pi * 4110 * t)) * env(n, 0.002, 0.9, 4) * 0.5 + lp(noise(n), 500) * env(n, 0.01, 0.15, 5)
    return norm(x) * 0.45


def murmurs(p):
    """Birçok ses: üst üste mırıltılar (働く人の声)"""
    return murmur(p)


# ---- s07: iş yükü efektleri (eyleme özel) ----
def laptop(p):
    """Dizüstü kapağı kapanır: menteşe sürtünmesi + plastik 'tak'"""
    d = 0.5; t = t_(d); n = len(t)
    x = bp(noise(n), 800, 3000) * env(n, 0.05, 0.12, 4) * 0.4
    x += np.roll(lp(noise(n), 900) * env(n, 0.001, 0.05, 6) + np.sin(2 * np.pi * 180 * t) * env(n, 0.001, 0.08, 6), int(0.22 * SR))
    return norm(x) * 0.45


def boxland(p):
    """Karton kutu masaya oturur: tok karton 'dof' + kısa sürtünme"""
    d = 0.6; t = t_(d); n = len(t)
    x = lp(noise(n), 400) * env(n, 0.002, 0.12, 5) + np.sin(2 * np.pi * 95 * t) * env(n, 0.002, 0.15, 5) * 0.8
    x += bp(noise(n), 1500, 4000) * env(n, 0.001, 0.05, 6) * 0.3
    return norm(x) * 0.55


def ribbon(p):
    """Saten kurdele çözülür: uzun kayan kumaş 'ffssht'"""
    d = 0.9; t = t_(d); n = len(t)
    sweep = 2500 + 3000 * t / d
    x = bp(noise(n), 2000, 8000) * env(n, 0.15, 0.4, 3) * (0.6 + 0.4 * np.sin(2 * np.pi * 9 * t))
    x += np.sin(2 * np.pi * np.cumsum(sweep) / SR) * env(n, 0.2, 0.3, 4) * 0.05
    return norm(x) * 0.35


def medalfade(p):
    """Hayalet madalya söner: metal tını, ters (söner) + pitch düşer"""
    d = 1.2; t = t_(d); n = len(t)
    f = 1320 * (1 - 0.25 * t / d)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.01, 0.5, 3) + 0.5 * np.sin(2 * np.pi * np.cumsum(f * 2.4) / SR) * env(n, 0.01, 0.3, 4)
    return norm(x) * 0.3


def lidpop(p):
    """Kutu kapağı fırlar: karton 'fop' + hava emişi"""
    d = 0.5; t = t_(d); n = len(t)
    x = lp(noise(n), 700) * env(n, 0.001, 0.06, 6) + np.sin(2 * np.pi * (260 - 160 * t / d) * t) * env(n, 0.001, 0.1, 6) * 0.7
    x += hp(noise(n), 3000) * env(n, 0.01, 0.15, 4) * 0.25
    return norm(x) * 0.5


def cardburst(p):
    """Kâğıt destesi fışkırır: çok sayıda hızlı kâğıt 'flap'"""
    d = 1.3; n = int(d * SR); x = np.zeros(n)
    for i in range(14):
        k = int((0.01 + i * 0.07 + np.random.rand() * 0.03) * SR); m = int(0.08 * SR)
        if k + m < n: x[k:k + m] += bp(noise(m), 1500, 6500) * env(m, 0.001, 0.03, 5) * (1 - i / 18)
    return norm(x) * 0.45


def carddeal(p):
    """Kart masaya düşer: kâğıt 'thwip' + yüzeye tok tap"""
    d = 0.22; t = t_(d); n = len(t)
    x = bp(noise(n), 2500, 7000) * env(n, 0.005, 0.04, 5) * 0.6
    x += np.roll(lp(noise(n), 1200) * env(n, 0.001, 0.02, 6), int(0.05 * SR))
    return norm(x) * 0.4


def meter(p):
    """Gösterge dolar: yükselen elektronik tik dizisi"""
    d = p.get("d", 1.5); n = int(d * SR); x = np.zeros(n)
    for i in range(12):
        k = int(i / 12 * d * 0.9 * SR); m = int(0.04 * SR); tt = np.arange(m) / SR
        if k + m < n: x[k:k + m] += np.sin(2 * np.pi * (600 + i * 70) * tt) * env(m, 0.001, 0.02, 6)
    return norm(x) * 0.3


def stackcreak(p):
    """Kâğıt yığını yükselir: kâğıt sürtünmesi + kalın kâğıt gıcırtısı"""
    d = p.get("d", 2.0); t = t_(d); n = len(t)
    x = bp(noise(n), 600, 3000) * env(n, 0.4, d * 0.5, 2) * (0.5 + 0.5 * np.sin(2 * np.pi * 3.5 * t) ** 2)
    x += bp(noise(n), 200, 600) * env(n, 0.3, d * 0.4, 2) * 0.5
    return norm(x) * 0.35


def sandbag(p):
    """Kum torbası omuza düşer: ağır kumaşlı 'thud' + kum hışırtısı"""
    d = 1.0; t = t_(d); n = len(t)
    x = lp(noise(n), 180) * env(n, 0.002, 0.18, 4) * 1.4 + np.sin(2 * np.pi * (70 - 30 * t) * t) * env(n, 0.002, 0.25, 4)
    x += bp(noise(n), 2500, 7000) * env(n, 0.03, 0.5, 3) * 0.15
    return norm(x) * 0.65


def lamp(p):
    """Masa lambası düğmesi: 'klik' + hafif vızıltı"""
    d = 0.8; t = t_(d); n = len(t)
    x = hp(noise(n), 2500) * env(n, 0.0005, 0.01, 6) + np.sin(2 * np.pi * 100 * t) * env(n, 0.05, 0.6, 2) * 0.08
    return norm(x) * 0.35


def heartbeat(p):
    """İçe dönüş: boğuk kalp atışı (lub-dub), d sn boyunca"""
    d = p.get("d", 2.4); t = t_(d); n = len(t); x = np.zeros(n)
    for b in np.arange(0, d - 0.3, 0.8):
        for off, a in ((0, 1.0), (0.18, 0.7)):
            i = int((b + off) * SR); m = min(n - i, int(0.25 * SR))
            if m <= 0: continue
            tt = np.arange(m) / SR
            x[i:i + m] += np.sin(2 * np.pi * (55 - 20 * tt) * tt) * np.exp(-tt * 18) * a
    return norm(lp(x, 200)) * 0.6


def compass(p):
    """Pusula iğnesi döner: ince metal tıkırtılar + yay titreşimi, sonunda oturur"""
    d = p.get("d", 1.2); t = t_(d); n = len(t); x = np.zeros(n)
    ts = np.cumsum(np.linspace(0.03, 0.14, 14)); ts = ts[ts < d - 0.1]
    for k, tk in enumerate(ts):
        i = int(tk * SR); m = min(n - i, int(0.04 * SR))
        x[i:i + m] += hp(noise(m), 4000) * np.exp(-np.arange(m) / SR * 160) * (1 - k / 20)
    x += np.sin(2 * np.pi * 2400 * t) * np.exp(-np.maximum(t - ts[-1], 0) * 25) * (t > ts[-1]) * 0.25
    return norm(x) * 0.4


def typing(p):
    """Hızlanan klavye: tuş tıkları, aralık giderek kısalır"""
    d = p.get("d", 6.0); t = t_(d); n = len(t); x = np.zeros(n); tk = 0.0; k = 0
    while tk < d - 0.05:
        i = int(tk * SR); m = min(n - i, int(0.03 * SR))
        x[i:i + m] += bp(noise(m), 1500, 6000) * np.exp(-np.arange(m) / SR * 220) * (0.6 + 0.4 * np.random.rand())
        tk += max(0.05, 0.22 - tk * 0.03) * (0.7 + 0.6 * np.random.rand()); k += 1
    return norm(x) * 0.35


def wind(p):
    """Gece açık alan: alçak rüzgâr, yavaş dalgalanma"""
    d = p.get("d", 8.0); t = t_(d); n = len(t)
    x = bp(noise(n), 200, 900) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.25 * t)) * env(n, 1.0, d * 0.4, 1)
    return norm(x) * 0.3


def signcreak(p):
    """Ahşap tabela sallanır: menteşe/ahşap gıcırtısı"""
    d = 0.9; t = t_(d); n = len(t)
    f = 420 + 120 * np.sin(2 * np.pi * 3 * t)
    x = np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * bp(noise(n), 300, 2000) * 0.5
    x = bp(x, 300, 2500) * env(n, 0.08, 0.6, 2)
    return norm(x) * 0.4


def creak(p):
    """Ok sapar: gerilen ahşap/ip gıcırtısı (inen frekans)"""
    d = p.get("d", 1.0); t = t_(d); n = len(t)
    f = 600 - 260 * t / d
    x = bp(np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * noise(n) * 0.5 + np.sin(2 * np.pi * np.cumsum(f) / SR), 250, 1800) * env(n, 0.05, d * 0.8, 2)
    return norm(x) * 0.4


def domino(p):
    """Domino taşı düşer: tok ahşap 'tak' + kısa sekme"""
    d = 0.4; t = t_(d); n = len(t); x = np.zeros(n)
    for off, a in ((0, 1.0), (0.06, 0.35)):
        i = int(off * SR); m = n - i; tt = np.arange(m) / SR
        x[i:] += (bp(noise(m), 900, 3500) * np.exp(-tt * 70) + np.sin(2 * np.pi * 780 * tt) * np.exp(-tt * 45) * 0.6) * a
    return norm(x) * 0.5


def pin(p):
    """Raptiye mantar panoya: kısa 'tuk'"""
    d = 0.2; t = t_(d); n = len(t)
    x = bp(noise(n), 600, 2400) * env(n, 0.001, 0.03, 6) + np.sin(2 * np.pi * 320 * t) * env(n, 0.001, 0.05, 5) * 0.4
    return norm(x) * 0.3


def strike(p):
    """Kalemle üstünü çizme: hızlı, sert kağıt sürtünmesi"""
    d = 0.7; t = t_(d); n = len(t)
    x = bp(noise(n), 1800, 7000) * env(n, 0.02, 0.4, 2) * (0.7 + 0.3 * np.sin(2 * np.pi * 30 * t))
    return norm(x) * 0.45


def dawnbird(p):
    """Şafak: uzaktan iki kuş cıvıltısı + yumuşak hava"""
    d = p.get("d", 3.0); t = t_(d); n = len(t); x = bp(noise(n), 300, 1200) * env(n, 1.0, d, 1) * 0.15
    for b in (0.6, 1.0, 1.9):
        i = int(b * SR); m = min(n - i, int(0.15 * SR)); tt = np.arange(m) / SR
        x[i:i + m] += np.sin(2 * np.pi * (3200 + 1400 * np.sin(2 * np.pi * 18 * tt)) * tt) * np.exp(-tt * 20) * 0.3
    return norm(x) * 0.3


FX = dict(whoosh=whoosh, swish=swish, pen=pen, shimmer=shimmer, tick=tick, blip=blip, step=step, thump=thump,
          hit=hit, fall=fall, thunk=thunk, door=door, click=click, riser=riser, room=room,
          alarm=alarm, crackle=crackle, spray=spray, clap=clap, shutter=shutter, paper=paper, umbrella=umbrella,
          pageflip=pageflip, cardrise=cardrise, flare=flare, checkmark=checkmark, lowdrone=lowdrone, dissolve=dissolve,
          tapehiss=tapehiss, flick=flick, pop=pop, tally=tally, murmur=murmur, rustle=rustle, scaleclank=scaleclank,
          stamp=stamp, type=type_, drawer=drawer, drawerclose=drawerclose, riffle=riffle, dustpuff=dustpuff,
          inkdot=inkdot, bulbhum=bulbhum, slide=slide, folderclose=folderclose, crack=crack, mend=mend,
          flutter=flutter, gate=gate, approve=approve, counter=counter, chair=chair, glasswall=glasswall,
          laptop=laptop, boxland=boxland, ribbon=ribbon, medalfade=medalfade, lidpop=lidpop, cardburst=cardburst,
          carddeal=carddeal, meter=meter, stackcreak=stackcreak, sandbag=sandbag, lamp=lamp,
          heartbeat=heartbeat, compass=compass, typing=typing, wind=wind, signcreak=signcreak, creak=creak,
          domino=domino, pin=pin, strike=strike, dawnbird=dawnbird)


# ---- s09 eyleme özel ----
def plateflip(p):
    """Metal levha döner: menteşe 'tik' + sac tını + tok oturma"""
    d = 0.7; t = t_(d); n = len(t)
    x = bp(noise(n), 2500, 7000) * np.exp(-t * 40) * 0.5
    x += np.sin(2 * np.pi * 1180 * t) * np.exp(-t * 9) * 0.35 + np.sin(2 * np.pi * 1730 * t) * np.exp(-t * 12) * 0.2
    i = int(0.32 * SR); tt = np.arange(n - i) / SR
    x[i:] += bp(noise(n - i), 300, 1500) * np.exp(-tt * 50) * 0.8
    return norm(x) * 0.45


def sand(p):
    """Kum saati akar: ince granüler hışırtı"""
    d = p.get("d", 3.0); t = t_(d); n = len(t)
    g = (np.random.rand(n) > 0.985).astype(float) * np.random.rand(n)
    x = bp(g + noise(n) * 0.05, 3000, 9000) * env(n, 0.3, d, 1)
    return norm(x) * 0.25


def sheetfan(p):
    """Kâğıt destesi yelpaze açılır: hızlanan kenar tıkırtıları + hava"""
    d = 1.1; t = t_(d); n = len(t); x = bp(noise(n), 800, 4000) * env(n, 0.05, 1.0, 2) * 0.25
    for k in range(20):
        i = int((0.05 + 0.9 * (k / 20) ** 0.8) * SR); m = min(n - i, int(0.03 * SR)); tt = np.arange(m) / SR
        x[i:i + m] += bp(noise(m), 1500, 6000) * np.exp(-tt * 180) * 0.7
    return norm(x) * 0.45


def erase(p):
    """Silgi sürtünmesi: kısa ritmik lastik 'shk-shk'"""
    d = 0.4; t = t_(d); n = len(t)
    x = bp(noise(n), 600, 3000) * (0.5 + 0.5 * np.sin(2 * np.pi * 14 * t)) ** 2 * env(n, 0.02, 0.35, 2)
    return norm(x) * 0.35


def mictap(p):
    """Mikrofona parmak vurma: boğuk 'tup tup' + hoparlör yankısı"""
    d = 1.4; t = t_(d); n = len(t); x = np.zeros(n)
    for b in (0.0, 0.35):
        i = int(b * SR); tt = np.arange(n - i) / SR
        x[i:] += np.sin(2 * np.pi * 90 * tt) * np.exp(-tt * 25) + bp(noise(n - i), 200, 2500) * np.exp(-tt * 40) * 0.4
    x = x + np.concatenate([np.zeros(int(0.12 * SR)), x[:-int(0.12 * SR)]]) * 0.35
    return norm(lp(x, 3000)) * 0.5


def glowhum(p):
    """Hale yayılır: sıcak, yükselen armonik tını (cam kâse)"""
    d = p.get("d", 3.0); t = t_(d); n = len(t)
    x = sum(np.sin(2 * np.pi * f0 * (1 + 0.02 * t / d) * t) * a for f0, a in ((523, 0.5), (784, 0.3), (1046, 0.2)))
    return norm(x * env(n, d * 0.4, d * 0.6, 1)) * 0.25


FX.update(plateflip=plateflip, sand=sand, sheetfan=sheetfan, erase=erase, mictap=mictap, glowhum=glowhum)


# ---- s10 eyleme özel ----
def dishclink(p):
    """Tabaklar evyede: seramik çınlamaları"""
    d = 1.0; t = t_(d); n = len(t); x = np.zeros(n)
    for k, (b, f0) in enumerate(((0.0, 2350), (0.18, 2900), (0.42, 2100))):
        i = int(b * SR); tt = np.arange(n - i) / SR
        x[i:] += (np.sin(2 * np.pi * f0 * tt) + 0.5 * np.sin(2 * np.pi * f0 * 1.51 * tt)) * np.exp(-tt * 18) + bp(noise(n - i), 2000, 8000) * np.exp(-tt * 120) * 0.6
    return norm(x) * 0.4


def tap(p):
    """Musluk suyu akar: bant geçiren su hışırtısı + damla ritmi"""
    d = p.get("d", 2.0); t = t_(d); n = len(t)
    x = bp(noise(n), 400, 3000) * (0.7 + 0.3 * np.sin(2 * np.pi * 7 * t) * np.sin(2 * np.pi * 3.1 * t))
    return norm(x * env(n, 0.15, d, 1)) * 0.22


def partition(p):
    """Paravan raydan iner: makara sürtünmesi + tok oturma"""
    d = 1.1; t = t_(d); n = len(t)
    x = bp(noise(n), 300, 1600) * (0.6 + 0.4 * np.sin(2 * np.pi * 40 * t)) * env(n, 0.05, 0.75, 2) * 0.5
    i = int(0.78 * SR); tt = np.arange(n - i) / SR
    x[i:] += np.sin(2 * np.pi * 70 * tt) * np.exp(-tt * 14) + bp(noise(n - i), 150, 900) * np.exp(-tt * 30) * 0.6
    return norm(x) * 0.5


def barfill(p):
    """Grafik çubuğu dolar: yükselen yumuşak tını"""
    d = p.get("d", 0.6); t = t_(d); n = len(t)
    f = 220 + 330 * t / d
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.03, d, 2)
    return norm(lp(x, 2500)) * 0.25


def overflow(p):
    """%100 aşılır: taşan sıvı 'şıpp' + uyarı tınısı (çatlamış cam)"""
    d = 1.2; t = t_(d); n = len(t)
    x = bp(noise(n), 500, 4000) * env(n, 0.02, 0.5, 2) * 0.5
    x += (np.sin(2 * np.pi * 740 * t) + np.sin(2 * np.pi * 784 * t)) * np.exp(-t * 3) * 0.35
    return norm(x) * 0.45


def lampclick(p):
    """Küçük lamba yanar: düğme tık + kısa sıcak tını"""
    d = 0.4; t = t_(d); n = len(t)
    x = bp(noise(n), 2500, 8000) * np.exp(-t * 300) + np.sin(2 * np.pi * 660 * t) * np.exp(-t * 14) * 0.3
    return norm(x) * 0.35


def doorcreak(p):
    """Ahşap kapı aralanır: gıcırtı (kayan frekans, pürüzlü)"""
    d = 1.0; t = t_(d); n = len(t)
    f = 380 + 160 * np.sin(np.pi * t / d)
    sq = np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * (np.random.rand(n) > 0.3)
    return norm(bp(sq, 300, 2500) * env(n, 0.1, d, 1)) * 0.35


def nameplate(p):
    """Metal isim plakası masaya konur: pirinç 'tink' + ahşap tok"""
    d = 0.8; t = t_(d); n = len(t)
    x = np.sin(2 * np.pi * 1520 * t) * np.exp(-t * 10) * 0.4 + np.sin(2 * np.pi * 2380 * t) * np.exp(-t * 14) * 0.2
    x += np.sin(2 * np.pi * 110 * t) * np.exp(-t * 30) + bp(noise(n), 200, 1200) * np.exp(-t * 60) * 0.5
    return norm(x) * 0.5


def arrowthud(p):
    """Oklar saplanır: kısa hava + tok 'thk' darbeleri (n adet)"""
    k = int(p.get("n", 3)); d = 0.3 + 0.18 * k; t = t_(d); n = len(t); x = np.zeros(n)
    for m in range(k):
        i = int((m * 0.18 + np.random.rand() * 0.05) * SR); tt = np.arange(n - i) / SR
        x[i:] += bp(noise(n - i), 1500, 6000) * np.exp(-tt * 60) * 0.3 + np.sin(2 * np.pi * (140 + 30 * m) * tt) * np.exp(-tt * 35)
    return norm(x) * 0.45


def umbrellafold(p):
    """Şemsiye kapanır: kumaş toplanır + tel kilit 'çıt'"""
    d = 0.9; t = t_(d); n = len(t)
    x = bp(noise(n), 400, 3000) * env(n, 0.2, 0.4, 2) * 0.6
    i = int(0.62 * SR); tt = np.arange(n - i) / SR
    x[i:] += bp(noise(n - i), 3000, 9000) * np.exp(-tt * 200) + np.sin(2 * np.pi * 1900 * tt) * np.exp(-tt * 40) * 0.3
    return norm(x) * 0.45


def steps(p):
    """Uzaklaşan ayak sesleri (gittikçe kısılır)"""
    d = p.get("d", 2.0); t = t_(d); n = len(t); x = np.zeros(n)
    m = 0
    while m * 0.45 < d - 0.2:
        i = int(m * 0.45 * SR); tt = np.arange(n - i) / SR
        x[i:] += (np.sin(2 * np.pi * 95 * tt) * np.exp(-tt * 40) + bp(noise(n - i), 500, 3000) * np.exp(-tt * 70) * 0.3) * (1 - m * 0.45 / d) ** 1.5
        m += 1
    return norm(lp(x, 2500)) * 0.4


def shelfcreak(p):
    """Ağır raf esner, el tutar: düşük ahşap gıcırtı + dosyalar oturur"""
    d = 1.0; t = t_(d); n = len(t)
    f = 150 + 40 * t
    x = bp(np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * (np.random.rand(n) > 0.4), 150, 900) * env(n, 0.1, 0.6, 2) * 0.6
    i = int(0.6 * SR); tt = np.arange(n - i) / SR
    x[i:] += bp(noise(n - i), 300, 2000) * np.exp(-tt * 40) * 0.5
    return norm(x) * 0.4


def monitoroff(p):
    """Monitör söner: yüksek frekans 'tiu' iniş + statik çıtırtı"""
    d = 0.7; t = t_(d); n = len(t)
    f = 9000 * np.exp(-t * 6) + 200
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 6) * 0.25 + bp(noise(n), 3000, 9000) * np.exp(-t * 25) * 0.4
    return norm(x) * 0.35


FX.update(dishclink=dishclink, tap=tap, partition=partition, barfill=barfill, overflow=overflow, lampclick=lampclick,
          doorcreak=doorcreak, nameplate=nameplate, arrowthud=arrowthud, umbrellafold=umbrellafold, steps=steps,
          shelfcreak=shelfcreak, monitoroff=monitoroff, murmurs=murmurs)


def main():
    cfg = json.load(open(sys.argv[1]))
    D = cfg["duration"]
    n = int((D + 3) * SR)
    L = np.zeros(n); R = np.zeros(n)
    dry_room = np.zeros(n)
    for c in cfg["cues"]:
        fn = FX.get(c["type"])
        if not fn:
            print("bilinmeyen efekt:", c["type"]); continue
        x = fn(c.get("p") or {}) * c.get("gain", 1) * LEVEL
        i = int(c["t"] * SR)
        x = x[: max(0, n - i)]
        if c["type"] == "room":
            dry_room[i:i + len(x)] += x
            continue
        pan = np.sin(c["t"] * 1.7) * 0.25  # hafif stereo çeşitlilik
        L[i:i + len(x)] += x * (1 - pan)
        R[i:i + len(x)] += x * (1 + pan)
    # kısa oda yankısı
    ir_t = np.arange(int(0.9 * SR)) / SR
    irL = noise(len(ir_t)) * np.exp(-ir_t * 6); irR = noise(len(ir_t)) * np.exp(-ir_t * 6)
    irL /= np.sqrt(np.sum(irL ** 2)); irR /= np.sqrt(np.sum(irR ** 2))
    L = L + 0.22 * fftconvolve(L, irL)[:n]
    R = R + 0.22 * fftconvolve(R, irR)[:n]
    L += dry_room; R += dry_room
    out = np.stack([L, R], 1)[: int(D * SR)]
    peak = np.max(np.abs(out))
    if peak > 0.3:
        out *= 0.3 / peak
    wavfile.write(sys.argv[2], SR, (out * 32767).astype(np.int16))
    print(f"sfx ok: {len(cfg['cues'])} efekt, tepe {20*np.log10(np.max(np.abs(out))+1e-9):.1f} dBFS")


main()
