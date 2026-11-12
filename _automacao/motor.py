#!/usr/bin/env python3
"""Motor de criativos AAS — gera Reels (1080x1920 MP4) e carrosséis (1080x1350 JPG)
a partir de um roteiro JSON.

Uso:
  python3 motor.py reel roteiro.json saida.mp4
  python3 motor.py carrossel roteiro.json pasta_saida/

Roteiro de Reel: {"cenas": [ ... ]}  — tipos de cena:
  {"t":"texto","eyebrow":"...","linhas":["...","..."],"ouro":[indices],"dur":3.2}
  {"t":"portfolio","eyebrow":"PROJETOS EM DESTAQUE","projetos":["adao-rosa-monteiro",...],"por":1.4}
  {"t":"lista","eyebrow":"...","itens":["...","..."],"dur":4.6}
  {"t":"numero","eyebrow":"...","grande":"R$ 600","linhas":["...","..."],"dur":3.2}
  {"t":"passos","eyebrow":"...","itens":[["Descoberta","texto curto"],...],"dur":5}
  {"t":"mito","eyebrow":"MITO 1 DE 3","mito":"...","destaque":"R$ 600","verdade":["...","..."]}  (destaque opcional)
  {"t":"texto",...,"sub":"linha menor opcional abaixo"}
  {"t":"cta","linhas":["Sua marca merece","ser extraordinária."],"botao":"PEÇA SEU ORÇAMENTO","dur":3.4}
Roteiro de carrossel: {"slides": [ ...mesmos tipos, sem dur; "portfolio" usa 1 projeto: "projeto":"..." ]}
"""
import json, math, os, subprocess, sys, wave
from PIL import Image, ImageDraw, ImageFont, ImageFilter

AQUI = os.path.dirname(os.path.abspath(__file__))
SITE = os.path.dirname(AQUI) + '/'
GOLD = (212, 175, 112); GOLD2 = (236, 206, 150); CREAM = (243, 236, 224)
MUTED = (168, 160, 148); BG = (9, 9, 12)
SERIF = '/usr/share/fonts/truetype/crosextra/Caladea-Regular.ttf'
SERIF_I = '/usr/share/fonts/truetype/crosextra/Caladea-Italic.ttf'
BOLD = '/usr/share/fonts/opentype/inter/InterDisplay-Bold.otf'
SEMI = '/usr/share/fonts/opentype/inter/InterDisplay-SemiBold.otf'
MED = '/usr/share/fonts/opentype/inter/Inter-Medium.otf'
REG = '/usr/share/fonts/opentype/inter/Inter-Regular.otf'
SYM = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'

PROJETOS = {
    'adao-rosa-monteiro': ('MÚSICA · CONTRATAÇÃO DE SHOWS', 'Adão Rosa Monteiro'),
    'vanessa-oliveira': ('AUTOCONHECIMENTO · MARCA PESSOAL', 'Vanessa Oliveira'),
    'christian-gois': ('SAÚDE · PSICANÁLISE', 'Christian Gois'),
    'mesa-rosa': ('GASTRONOMIA · CATÁLOGO', 'Mesa Rosa'),
    'denise-resende': ('MARCA PESSOAL · DIGITAL', 'Denise Resende'),
    'brasa-burger': ('GASTRONOMIA · HAMBURGUERIA', 'Brasa Burger'),
}

_F = {}
def font(p, s):
    k = (p, int(s))
    if k not in _F: _F[k] = ImageFont.truetype(p, int(s))
    return _F[k]
def ease(t): t = max(0, min(1, t)); return 1 - (1 - t) ** 3
def clamp(t): return max(0, min(1, t))

def fundo(W, H, seed=0):
    bg = Image.new('RGB', (W, H), BG)
    g = Image.new('L', (W, H), 0); d = ImageDraw.Draw(g)
    if seed % 2 == 0:
        d.ellipse((-W * .3, H * .1, W * .85, H * .68), fill=70); d.ellipse((W * .4, H * .58, W * 1.4, H * 1.15), fill=45)
    else:
        d.ellipse((W * .2, -H * .2, W * 1.3, H * .5), fill=65); d.ellipse((-W * .4, H * .6, W * .7, H * 1.2), fill=40)
    g = g.filter(ImageFilter.GaussianBlur(W * .2))
    bg = Image.composite(Image.new('RGB', (W, H), (120, 88, 40)), bg, g)
    d = ImageDraw.Draw(bg)
    for i in range(3): d.line((-100 + i * 6, H * .78 + i * 3, W + 200, H * .47 + i * 3), fill=(60, 48, 30), width=1)
    return bg

class Tela:
    def __init__(self, base): self.img = base.copy().convert('RGBA'); self.W, self.H = base.size
    def layer(self):
        L = Image.new('RGBA', (self.W, self.H), (0, 0, 0, 0)); return L, ImageDraw.Draw(L)
    def put(self, L): self.img.alpha_composite(L)
    def centro(self, y, txt, f, cor, a=1.0, dy=0):
        if a <= 0: return
        L, d = self.layer(); w = d.textlength(txt, font=f)
        d.text(((self.W - w) / 2, y + dy), txt, font=f, fill=cor + (int(255 * a),)); self.put(L)
    def eyebrow(self, y, txt, a, cor=GOLD, size=26):
        if a <= 0 or not txt: return
        L, d = self.layer(); f = font(SEMI, size); sp = size * .27
        ws = [d.textlength(c, font=f) for c in txt.upper()]; tot = sum(ws) + sp * (len(ws) - 1)
        x = (self.W - tot) / 2
        for c, w in zip(txt.upper(), ws): d.text((x, y), c, font=f, fill=cor + (int(255 * a),)); x += w + sp
        self.put(L)

def quebrar(d, txt, f, maxw):
    out, cur = [], ''
    for w in txt.split():
        t = (cur + ' ' + w).strip()
        if d.textlength(t, font=f) <= maxw: cur = t
        else:
            if cur: out.append(cur)
            cur = w
    if cur: out.append(cur)
    return out

def linhas_ajustadas(linhas, ouro, maxw, size, minsize):
    """Ajusta tamanho e quebra para caber na largura."""
    tmp = ImageDraw.Draw(Image.new('RGB', (10, 10)))
    s = size
    while True:
        f = font(SERIF, s); res = []
        for i, ln in enumerate(linhas):
            for q in quebrar(tmp, ln, f, maxw): res.append((q, i in ouro))
        if len(res) <= max(len(linhas), 6) or s <= minsize: return res, f, s
        s -= 6

_PH = {}
def celular(nome, PW=560, PH=1000):
    if (nome, PW) in _PH: return _PH[(nome, PW)]
    src = SITE + nome + '-mobile.webp'
    sc = Image.open(src).convert('RGB').resize((PW - 36, PH - 36), Image.LANCZOS)
    ph = Image.new('RGBA', (PW, PH), (0, 0, 0, 0)); d = ImageDraw.Draw(ph)
    d.rounded_rectangle((0, 0, PW - 1, PH - 1), int(PW * .114), fill=(14, 13, 12, 255), outline=GOLD + (255,), width=3)
    m = Image.new('L', sc.size, 0); ImageDraw.Draw(m).rounded_rectangle((0, 0, sc.size[0] - 1, sc.size[1] - 1), int(PW * .086), fill=255)
    ph.paste(sc, (18, 18), m)
    d.rounded_rectangle((PW / 2 - 70, 30, PW / 2 + 70, 52), 11, fill=(10, 10, 10, 255))
    sh = Image.new('RGBA', (PW + 160, PH + 160), (0, 0, 0, 0))
    ImageDraw.Draw(sh).rounded_rectangle((80, 100, PW + 80, PH + 80), 64, fill=(0, 0, 0, 200))
    sh = sh.filter(ImageFilter.GaussianBlur(40)); sh.alpha_composite(ph, (80, 80))
    _PH[(nome, PW)] = sh; return sh

# ---------------- desenho de cenas (u = progresso 0..1 da cena, fo = fade-out) ----------------
def cena_texto(T, c, s, dur, fo, cy):
    W = T.W; size = c.get('size', 108)
    res, f, sz = linhas_ajustadas(c['linhas'], set(c.get('ouro', [])), W - 160, size, 64)
    lh = sz * 1.18; total = len(res) * lh
    y0 = cy - total / 2 + 30
    T.eyebrow(y0 - 110, c.get('eyebrow', ''), ease(s / .5) * fo)
    for k, (ln, g) in enumerate(res):
        a = ease((s - .25 - k * .28) / .55) * fo
        T.centro(y0 + k * lh, ln, f, GOLD2 if g else CREAM, a, dy=(1 - a if fo == 1 else 0) * 36)
    if c.get('sub'):
        T.centro(y0 + total + 50, c['sub'], font(MED, c.get('size_sub', 38)), MUTED, ease((s - .9) / .5) * fo)

def cena_lista(T, c, s, dur, fo, cy):
    W = T.W; itens = c['itens']; n = len(itens); gap = 150 if T.H > 1500 else 120
    y0 = cy - n * gap / 2
    T.eyebrow(y0 - 120, c.get('eyebrow', ''), ease(s / .4) * fo)
    for k, it in enumerate(itens):
        a = ease((s - .3 - k * .4) / .45) * fo
        if a <= 0: continue
        L, d = T.layer(); y = y0 + k * gap; x0 = 130 + (1 - a) * 40
        f = font(MED, 52 if len(it) < 30 else 44)
        d.line((x0, y + gap - 32, W - 130, y + gap - 32), fill=(255, 255, 255, int(28 * a)), width=2)
        d.text((x0, y + 22), '✦', font=font(SYM, 40), fill=GOLD + (int(255 * a),))
        d.text((x0 + 76, y + 16), it, font=f, fill=CREAM + (int(255 * a),)); T.put(L)

def cena_numero(T, c, s, dur, fo, cy):
    T.eyebrow(cy - 330, c.get('eyebrow', ''), ease(s / .4) * fo)
    a = ease((s - .2) / .6) * fo
    T.centro(cy - 240, c['grande'], font(SERIF, c.get('size', 230)), GOLD, a, dy=(1 - a) * 30)
    for k, ln in enumerate(c.get('linhas', [])):
        T.centro(cy + 60 + k * 90, ln, font(SERIF, 72), CREAM if k == 0 else MUTED, ease((s - .6 - k * .25) / .5) * fo)

def cena_passos(T, c, s, dur, fo, cy):
    W = T.W; itens = c['itens']; n = len(itens); gap = 230 if T.H > 1500 else 200
    y0 = cy - n * gap / 2
    T.eyebrow(y0 - 110, c.get('eyebrow', ''), ease(s / .4) * fo)
    for k, (tit, desc) in enumerate(itens):
        a = ease((s - .3 - k * .45) / .45) * fo
        if a <= 0: continue
        L, d = T.layer(); y = y0 + k * gap
        d.text((130, y), f'{k + 1:02d}', font=font(SERIF, 96), fill=GOLD + (int(255 * a),))
        d.text((300, y + 8), tit, font=font(SEMI, 54), fill=CREAM + (int(255 * a),))
        for j, q in enumerate(quebrar(d, desc, font(REG, 36), W - 430)[:2]):
            d.text((300, y + 82 + j * 46), q, font=font(REG, 36), fill=MUTED + (int(255 * a),))
        T.put(L)

def cena_cta(T, c, s, dur, fo, cy):
    W = T.W
    a = ease(s / .5) * fo
    T.centro(cy - 520, 'AAS.', font(BOLD, 170), GOLD, a)
    T.eyebrow(cy - 310, 'TECNOLOGIA & EDITORIAL', a)
    ls = c.get('linhas', ['Sua marca merece', 'ser extraordinária.'])
    for k, ln in enumerate(ls):
        T.centro(cy - 170 + k * 100, ln, font(SERIF, 86), GOLD2 if k == len(ls) - 1 else CREAM, ease((s - .4) / .5) * fo)
    a3 = ease((s - .9) / .5) * fo
    if a3 > 0:
        L, d = T.layer(); txt = c.get('botao', 'PEÇA SEU ORÇAMENTO'); f = font(SEMI, 40)
        bw = max(640, d.textlength(txt, font=f) + 120); bh = 120; bx = (W - bw) / 2; by = cy + 90
        d.rounded_rectangle((bx, by, bx + bw, by + bh), 6, fill=GOLD + (int(255 * a3),))
        tw = d.textlength(txt, font=f); d.text(((W - tw) / 2, by + 36), txt, font=f, fill=(22, 17, 10, int(255 * a3)))
        T.put(L)
        T.centro(cy + 250, c.get('rodape', 'Link na bio  ·  aastecnologiaeditorial.com.br'), font(REG, 34), MUTED, a3)

def cena_mito(T, c, s, dur, fo, cy):
    """Mito x verdade: mito riscado no alto, verdade com destaque dourado embaixo (bloco centrado em cy)."""
    W = T.W; a = ease(s / .5) * fo; a2 = ease((s - .5) / .5) * fo
    tmp = ImageDraw.Draw(Image.new('RGB', (10, 10)))
    fm = font(SERIF_I, c.get('size_mito', 80)); fv = font(MED, c.get('size_verdade', 42))
    fd = font(SERIF, c.get('size', 150)) if c.get('destaque') else None
    lm = quebrar(tmp, c['mito'], fm, W - 200)
    lv = [quebrar(tmp, ln, fv, W - 220) for ln in c.get('verdade', [])]
    h = 80 + len(lm) * fm.size * 1.2 + 100 + 60 + (fd.size * 1.3 if fd else 0) + sum(len(x) * fv.size * 1.4 + 14 for x in lv)
    top = cy - h / 2 + 10
    T.eyebrow(top, c.get('eyebrow', 'MITO'), a)
    L, d = T.layer(); y = top + 80
    for q in lm:
        w = d.textlength(q, font=fm); x = (W - w) / 2
        d.text((x, y), q, font=fm, fill=MUTED + (int(235 * a),))
        d.line((x - 10, y + fm.size * .62, x + w + 10, y + fm.size * .62), fill=GOLD + (int(230 * a),), width=5)
        y += fm.size * 1.2
    d.line((W / 2 - 60, y + 50, W / 2 + 60, y + 50), fill=GOLD + (int(160 * a),), width=2)
    T.put(L); y += 100
    T.eyebrow(y, c.get('rotulo', 'VERDADE'), a2, cor=GOLD2); y += 60
    if fd: T.centro(y, c["destaque"], fd, GOLD, a2); y += fd.size * 1.3
    L, d = T.layer()
    for grupo in lv:
        for q in grupo:
            w = d.textlength(q, font=fv); d.text(((W - w) / 2, y), q, font=fv, fill=CREAM + (int(255 * a2),)); y += fv.size * 1.4
        y += 14
    T.put(L)

CENAS = {'texto': cena_texto, 'lista': cena_lista, 'numero': cena_numero, 'passos': cena_passos, 'cta': cena_cta, 'mito': cena_mito}

# ---------------- REEL ----------------
def reel(rot, saida):
    W, H, FPS = 1080, 1920, 30
    cenas = rot['cenas']; tl = []; t = 0
    for c in cenas:
        d = c.get('por', 1.4) * len(c['projetos']) + .6 if c['t'] == 'portfolio' else c.get('dur', 3.4)
        tl.append((t, d, c)); t += d
    DUR = t; N = int(DUR * FPS)
    bases = [fundo(W, H, 0), fundo(W, H, 1)]
    tmp = saida + '.silent.mp4'
    p = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-',
                          '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-pix_fmt', 'yuv420p', tmp], stdin=subprocess.PIPE)
    for i in range(N):
        tt = i / FPS
        idx = max(j for j, (t0, d, c) in enumerate(tl) if t0 <= tt)
        t0, d, c = tl[idx]; s = tt - t0
        T = Tela(bases[idx % 2])
        fo = 1 - ease((s - (d - .4)) / .4) if idx < len(tl) - 1 else 1
        if c['t'] == 'portfolio':
            T.eyebrow(170, c.get('eyebrow', 'PROJETOS EM DESTAQUE'), ease(s / .5) * fo)
            seg = c.get('por', 1.4); projs = c['projetos']
            k = min(len(projs) - 1, int(s / seg)); u = (s - k * seg) / seg; last = k == len(projs) - 1
            ph = celular(projs[k])
            xin = (1 - ease(u / .25)) * 700; xout = 0 if last else ease((u - .85) / .15) * -700
            sc = 1 + .04 * min(u, 1.4)
            p2 = ph.resize((int(ph.size[0] * sc), int(ph.size[1] * sc)), Image.BILINEAR)
            if fo < 1: p2.putalpha(p2.getchannel('A').point(lambda v: int(v * fo)))
            T.img.alpha_composite(p2, (int((W - p2.size[0]) / 2 + xin + xout), 300))
            la = ease((u - .15) / .2) * (1 if last else 1 - ease((u - .85) / .15)) * fo
            cat, nome = PROJETOS[projs[k]]
            T.eyebrow(1500, cat, la); T.centro(1545, nome, font(SERIF, 76), CREAM, la)
        else:
            CENAS[c['t']](T, c, s, d, fo, H / 2)
        out = T.img.convert('RGB')
        if tt < .15 or tt > DUR - .3:
            kf = clamp(tt / .15) if tt < .15 else clamp((DUR - tt) / .3)
            out = Image.blend(Image.new('RGB', (W, H), BG), out, kf)
        p.stdin.write(out.tobytes())
    p.stdin.close(); p.wait()
    trilha(DUR, saida + '.wav', rot.get('trilha', 0))
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', tmp, '-i', saida + '.wav', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '160k',
                    '-shortest', '-movflags', '+faststart', saida], check=True)
    os.remove(tmp); os.remove(saida + '.wav')
    return DUR

def trilha(dur, path, var=0):
    import numpy as np
    sr = 44100; t = np.arange(int(sr * dur)) / sr
    progs = [[[220, 261.63, 329.63], [174.61, 220, 261.63], [261.63, 329.63, 392], [196, 246.94, 293.66]],
             [[261.63, 329.63, 392], [220, 261.63, 329.63], [174.61, 220, 261.63], [196, 246.94, 293.66]],
             [[293.66, 349.23, 440], [233.08, 293.66, 349.23], [261.63, 329.63, 392], [220, 277.18, 329.63]]]
    chords = progs[var % 3]; seg = dur / 4; out = np.zeros_like(t)
    for i, ch in enumerate(chords):
        s = int(i * seg * sr); e = int(min(dur, (i + 1) * seg + 1.2) * sr); tt = t[s:e] - i * seg
        env = np.minimum(1, tt / 1.2) * np.minimum(1, np.maximum(0, (seg + 1.2 - tt) / 1.2))
        for f in ch:
            for det in (-.6, .6): out[s:e] += .06 * env * np.sin(2 * np.pi * (f + det) * tt)
            out[s:e] += .02 * env * np.sin(2 * np.pi * f * 2 * tt)
    for k in range(int(dur / .75)):
        st = k * .75; ch = chords[min(3, int(st / seg))]; f = ch[k % 3] * 2
        s = int(st * sr); e = min(len(t), s + int(1.6 * sr)); tt = t[s:e] - st
        out[s:e] += .05 * np.exp(-tt * 3.2) * np.sin(2 * np.pi * f * tt) * (1 if k % 2 == 0 else .6)
    out *= np.minimum(1, t / 1.5) * np.minimum(1, (dur - t) / 2.0); out = out / np.max(np.abs(out)) * .7
    stv = np.stack([out, np.roll(out, int(.012 * sr))], 1)
    with wave.open(path, 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(sr); w.writeframes((stv * 32767).astype('<i2').tobytes())

# ---------------- CARROSSEL ----------------
def carrossel(rot, pasta):
    W, H = 1080, 1350; os.makedirs(pasta, exist_ok=True); arqs = []
    slides = rot['slides']; n = len(slides)
    for i, c in enumerate(slides):
        T = Tela(fundo(W, H, i))
        if c['t'] == 'portfolio':
            nome = c['projeto']; ph = celular(nome, 440, 786)
            T.eyebrow(90, c.get('eyebrow', 'PORTFÓLIO AAS'), 1)
            T.img.alpha_composite(ph, (int((W - ph.size[0]) / 2), 130))
            cat, tit = PROJETOS[nome]; T.eyebrow(1060, cat, 1); T.centro(1100, tit, font(SERIF, 70), CREAM)
            if c.get('legenda'): T.centro(1195, c['legenda'], font(REG, 32), MUTED)
        else:
            CENAS[c['t']](T, c, 99, 99, 1, H / 2 + (40 if c['t'] == 'cta' else 0))
        L, d = T.layer()
        d.text((60, H - 70), 'AAS.', font=font(BOLD, 34), fill=GOLD + (230,))
        pg = f'{i + 1}/{n}'; d.text((W - 60 - d.textlength(pg, font=font(MED, 28)), H - 64), pg, font=font(MED, 28), fill=MUTED + (220,))
        if i < n - 1:
            d.text((W - 60 - d.textlength('arraste  →', font=font(MED, 28)) - 90, H - 64), 'arraste  →', font=font(MED, 28), fill=GOLD + (200,))
        T.put(L)
        arq = os.path.join(pasta, f'slide-{i + 1:02d}.jpg'); T.img.convert('RGB').save(arq, quality=92); arqs.append(arq)
    return arqs

if __name__ == '__main__':
    modo, rp, saida = sys.argv[1], sys.argv[2], sys.argv[3]
    rot = json.load(open(rp, encoding='utf-8'))
    if modo == 'reel': print('reel', reel(rot, saida), 's')
    else: print('\n'.join(carrossel(rot, saida)))
