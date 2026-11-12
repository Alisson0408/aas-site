"""Gera os criativos de apresentação do perfil: carrosséis 'Conheça a AAS' e 'Portfólio',
capas de Destaques e Stories para cada Destaque."""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from motor import *

OUT = sys.argv[1]
FOTO = sys.argv[2]
os.makedirs(OUT, exist_ok=True)

def rodape(T, i, n, W, H):
    L, d = T.layer()
    d.text((60, H - 70), 'AAS.', font=font(BOLD, 34), fill=GOLD + (230,))
    pg = f'{i}/{n}'; d.text((W - 60 - d.textlength(pg, font=font(MED, 28)), H - 64), pg, font=font(MED, 28), fill=MUTED + (220,))
    if i < n:
        t = 'arraste  →'; d.text((W - 150 - d.textlength(t, font=font(MED, 28)), H - 64), t, font=font(MED, 28), fill=GOLD + (200,))
    T.put(L)

def foto_circular(diam):
    im = Image.open(FOTO).convert('RGBA'); s = min(im.size)
    im = im.crop(((im.width - s) // 2, (im.height - s) // 2, (im.width + s) // 2, (im.height + s) // 2)).resize((diam, diam), Image.LANCZOS)
    m = Image.new('L', (diam, diam), 0); ImageDraw.Draw(m).ellipse((0, 0, diam - 1, diam - 1), fill=255)
    im.putalpha(m); return im

# ---------- Carrossel 1: Conheça a AAS ----------
def conheca():
    W, H = 1080, 1350; d = os.path.join(OUT, 'conheca'); os.makedirs(d, exist_ok=True); n = 6; arqs = []
    for i in range(1, n + 1):
        T = Tela(fundo(W, H, i))
        if i == 1:
            T.centro(330, 'AAS.', font(BOLD, 200), GOLD); T.eyebrow(580, 'TECNOLOGIA & EDITORIAL', 1, size=28)
            T.centro(700, 'Prazer, somos', font(SERIF, 96), CREAM); T.centro(810, 'a AAS.', font(SERIF, 96), GOLD2)
            T.centro(960, 'Sites e páginas de vendas com visual premium', font(REG, 36), MUTED)
        elif i == 2:
            f = foto_circular(420); T.img.alpha_composite(f, ((W - 420) // 2, 170))
            L, dd = T.layer(); dd.ellipse(((W - 420) // 2 - 8, 162, (W + 420) // 2 + 8, 598), outline=GOLD + (255,), width=3); T.put(L)
            T.eyebrow(660, 'QUEM FAZ', 1)
            T.centro(720, 'Alisson', font(SERIF, 96), CREAM)
            T.centro(850, 'Mais de 5 anos na área de tecnologia,', font(REG, 38), MUTED)
            T.centro(905, 'criando presenças digitais com identidade', font(REG, 38), MUTED)
            T.centro(960, 'para marcas, artistas e negócios.', font(REG, 38), MUTED)
        elif i == 3:
            CENAS['lista'](T, {'eyebrow': 'O QUE FAZEMOS', 'itens': ['Página de vendas', 'Site institucional', 'Manutenção e evolução', 'Projetos personalizados']}, 99, 99, 1, H / 2)
        elif i == 4:
            CENAS['lista'](T, {'eyebrow': 'O QUE VEM INCLUSO', 'itens': ['Pronto em 7 dias', 'Domínio e hospedagem', '4 rodadas de ajustes', 'Garantia de 90 dias']}, 99, 99, 1, H / 2)
        elif i == 5:
            T.eyebrow(300, 'INVESTIMENTO', 1)
            rows = [('Página de vendas', 'a partir de R$ 600'), ('Site institucional', 'a partir de R$ 700'), ('Manutenção mensal', 'R$ 250 a 350')]
            for k, (a, b) in enumerate(rows):
                y = 420 + k * 190; L, dd = T.layer()
                dd.line((130, y + 150, W - 130, y + 150), fill=(255, 255, 255, 30), width=2)
                dd.text((130, y + 20), a, font=font(SERIF, 64), fill=CREAM + (255,))
                dd.text((130, y + 100), b, font=font(SEMI, 38), fill=GOLD + (255,)); T.put(L)
            T.centro(1030, 'Pix ou cartão de crédito', font(REG, 34), MUTED)
        else:
            CENAS['cta'](T, {'linhas': ['Sua marca merece', 'ser extraordinária.']}, 99, 99, 1, H / 2 + 40)
        rodape(T, i, n, W, H)
        a = os.path.join(d, f'{i:02d}.jpg'); T.img.convert('RGB').save(a, quality=92); arqs.append(a)
    return arqs

# ---------- Carrossel 2: Portfólio ----------
def portfolio():
    W, H = 1080, 1350; d = os.path.join(OUT, 'portfolio'); os.makedirs(d, exist_ok=True)
    projs = list(PROJETOS.keys()); n = len(projs) + 2; arqs = []
    for i in range(1, n + 1):
        T = Tela(fundo(W, H, i))
        if i == 1:
            CENAS['texto'](T, {'eyebrow': 'PORTFÓLIO AAS', 'linhas': ['6 marcas,', '6 nichos,', 'uma assinatura.'], 'ouro': [2], 'size': 112}, 99, 99, 1, H / 2)
        elif i == n:
            CENAS['cta'](T, {'linhas': ['A próxima pode', 'ser a sua marca.']}, 99, 99, 1, H / 2 + 40)
        else:
            nome = projs[i - 2]; ph = celular(nome, 440, 786)
            T.eyebrow(90, 'PORTFÓLIO AAS', 1); T.img.alpha_composite(ph, (int((W - ph.size[0]) / 2), 130))
            cat, tit = PROJETOS[nome]; T.eyebrow(1060, cat, 1); T.centro(1100, tit, font(SERIF, 70), CREAM)
        rodape(T, i, n, W, H)
        a = os.path.join(d, f'{i:02d}.jpg'); T.img.convert('RGB').save(a, quality=92); arqs.append(a)
    return arqs

# ---------- Destaques: capas ----------
def icone(d, nome, cx, cy, r, cor, w=10):
    if nome == 'portfolio':
        s = r * .42; g = r * .1
        for a in (-1, 1):
            for b in (-1, 1):
                x = cx + (a * (s / 2 + g / 2)) - s / 2; y = cy + (b * (s / 2 + g / 2)) - s / 2
                d.rounded_rectangle((x, y, x + s, y + s), 8, outline=cor, width=w)
    elif nome == 'servicos':
        s = r * .62; d.polygon([(cx, cy - s), (cx + s * .8, cy - s * .2), (cx, cy + s), (cx - s * .8, cy - s * .2)], outline=cor, width=w)
        d.line((cx - s * .8, cy - s * .2, cx + s * .8, cy - s * .2), fill=cor, width=w)
    elif nome == 'metodo':
        for k in range(3):
            y = cy - r * .38 + k * r * .38
            d.ellipse((cx - r * .55 - 14, y - 14, cx - r * .55 + 14, y + 14), fill=cor)
            d.line((cx - r * .35, y, cx + r * .55, y), fill=cor, width=w)
    elif nome == 'garantia':
        s = r * .6
        d.line([(cx, cy - s), (cx + s * .8, cy - s * .65), (cx + s * .75, cy + s * .1), (cx, cy + s), (cx - s * .75, cy + s * .1), (cx - s * .8, cy - s * .65), (cx, cy - s)], fill=cor, width=w, joint='curve')
        d.line([(cx - s * .35, cy), (cx - s * .05, cy + s * .3), (cx + s * .4, cy - s * .3)], fill=cor, width=w, joint='curve')
    elif nome == 'contato':
        s = r * .6
        d.rounded_rectangle((cx - s, cy - s * .7, cx + s, cy + s * .45), 34, outline=cor, width=w)
        d.line([(cx - s * .45, cy + s * .45), (cx - s * .6, cy + s * .85), (cx - s * .05, cy + s * .45)], fill=cor, width=w, joint='curve')
        for k in (-1, 0, 1): d.ellipse((cx + k * s * .45 - 12, cy - s * .12 - 12, cx + k * s * .45 + 12, cy - s * .12 + 12), fill=cor)

DESTAQUES = [('portfolio', 'Portfólio'), ('servicos', 'Serviços'), ('metodo', 'Como funciona'), ('garantia', 'Garantia'), ('contato', 'Contato')]

def capas():
    d0 = os.path.join(OUT, 'destaques-capas'); os.makedirs(d0, exist_ok=True); arqs = []
    for k, (ic, nome) in enumerate(DESTAQUES):
        W, H = 1080, 1920; T = Tela(Image.new('RGB', (W, H), (12, 11, 10)))
        L, d = T.layer(); cx, cy, r = W / 2, H / 2, 300
        g = Image.new('L', (W, H), 0); ImageDraw.Draw(g).ellipse((cx - r - 80, cy - r - 80, cx + r + 80, cy + r + 80), fill=90)
        g = g.filter(ImageFilter.GaussianBlur(90)); T.img = Image.composite(Image.new('RGBA', (W, H), (120, 88, 40, 255)), T.img, g)
        d.ellipse((cx - r, cy - r, cx + r, cy + r), fill=(16, 14, 11, 255), outline=GOLD + (255,), width=6)
        icone(d, ic, cx, cy, r, GOLD + (255,)); T.put(L)
        T.eyebrow(cy + r + 90, nome, 1, size=34)
        a = os.path.join(d0, f'{k + 1}-{ic}.jpg'); T.img.convert('RGB').save(a, quality=92); arqs.append(a)
    return arqs

# ---------- Destaques: Stories ----------
def stories():
    W, H = 1080, 1920; base = os.path.join(OUT, 'destaques-stories'); arqs = []
    def salvar(pasta, nome, T):
        p = os.path.join(base, pasta); os.makedirs(p, exist_ok=True); a = os.path.join(p, nome); T.img.convert('RGB').save(a, quality=92); arqs.append(a)
    def topo(T, txt):
        L, d = T.layer(); d.text((80, 150), 'AAS.', font=font(BOLD, 44), fill=GOLD + (255,)); T.put(L); T.eyebrow(230, txt, 1)
    # Portfólio: um story por projeto
    for k, nome in enumerate(PROJETOS):
        T = Tela(fundo(W, H, k)); topo(T, 'PORTFÓLIO')
        ph = celular(nome, 520, 928); T.img.alpha_composite(ph, (int((W - ph.size[0]) / 2), 330))
        cat, tit = PROJETOS[nome]; T.eyebrow(1440, cat, 1); T.centro(1490, tit, font(SERIF, 80), CREAM)
        T.centro(1640, 'Quer um assim? Link na bio', font(REG, 36), MUTED)
        salvar('1-portfolio', f'{k + 1:02d}-{nome}.jpg', T)
    # Serviços
    for k, (tit, preco, desc) in enumerate([('Página de vendas', 'a partir de R$ 600', 'Para vender um produto, serviço ou evento, com chamadas para o WhatsApp.'),
                                            ('Site institucional', 'a partir de R$ 700', 'A vitrine completa da sua marca: quem você é, o que faz e como contratar.'),
                                            ('Manutenção mensal', 'R$ 250 a 350 por mês', 'Atualizações, ajustes e acompanhamento para o site sempre em dia.')]):
        T = Tela(fundo(W, H, k)); topo(T, 'SERVIÇOS')
        T.centro(700, tit, font(SERIF, 104), CREAM); T.centro(850, preco, font(SEMI, 52), GOLD)
        L, d = T.layer()
        for j, q in enumerate(quebrar(d, desc, font(REG, 42), W - 240)): d.text(((W - d.textlength(q, font=font(REG, 42))) / 2, 1000 + j * 60), q, font=font(REG, 42), fill=MUTED + (255,))
        T.put(L); T.centro(1500, 'Domínio e hospedagem inclusos · 7 dias', font(MED, 36), GOLD2)
        salvar('2-servicos', f'{k + 1:02d}.jpg', T)
    # Como funciona
    T = Tela(fundo(W, H, 0)); topo(T, 'COMO FUNCIONA')
    CENAS['passos'](T, {'itens': [['Descoberta', 'Entendemos seu negócio, público e objetivo.'], ['Criação', 'Desenhamos o site com a identidade da sua marca.'],
                                  ['Refinamento', 'Até 4 rodadas de ajustes com você.'], ['Publicação', 'Site no ar em 7 dias, com domínio próprio.']]}, 99, 99, 1, H / 2 + 60)
    salvar('3-como-funciona', '01.jpg', T)
    T = Tela(fundo(W, H, 1)); topo(T, 'COMO FUNCIONA')
    CENAS['lista'](T, {'eyebrow': 'PAGAMENTO', 'itens': ['Pix', 'Cartão de crédito', 'Pela plataforma Kiwify']}, 99, 99, 1, H / 2)
    salvar('3-como-funciona', '02.jpg', T)
    # Garantia
    T = Tela(fundo(W, H, 0)); topo(T, 'GARANTIA')
    T.centro(520, '90', font(SERIF, 300), GOLD); T.centro(860, 'dias de garantia', font(SERIF, 80), CREAM)
    CENAS['lista'](T, {'itens': ['Falhas de funcionamento', 'Bugs no código entregue', 'Links quebrados', 'Desvios do escopo combinado']}, 99, 99, 1, 1330)
    salvar('4-garantia', '01.jpg', T)
    # Contato
    T = Tela(fundo(W, H, 1)); topo(T, 'CONTATO')
    CENAS['cta'](T, {'linhas': ['Vamos criar algo', 'extraordinário?'], 'botao': 'WHATSAPP (19) 98952-2187', 'rodape': 'aastecnologiaeditorial.com.br'}, 99, 99, 1, H / 2 + 80)
    salvar('5-contato', '01.jpg', T)
    return arqs

if __name__ == '__main__':
    for f in (conheca, portfolio, capas, stories): print(f.__name__, len(f()))
