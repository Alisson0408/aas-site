# Rotina diária de Instagram da AAS

Este é o manual que a tarefa agendada segue todos os dias. O dono (Alisson) autorizou
a criação **e a publicação** automáticas, sem aprovação prévia, no Instagram da AAS.

## Conta
- Instagram: @aastecnologiaeditorial.com.br — platformAccountId `29530053906681574` (conector vidIQ)
- Site: https://aastecnologiaeditorial.com.br (este repositório, GitHub Pages)
- WhatsApp: (19) 98952-2187

## O que publicar por dia (fuso America/Sao_Paulo)
- **Todo dia:** 1 Reel (15–25 s).
- **Terça, quinta e sábado:** também 1 carrossel (5 a 7 slides).
- Nunca mais de 1 Reel e 1 carrossel no mesmo dia.

## Fatos da oferta (use só estes; não invente números, clientes ou depoimentos)
- Página de vendas a partir de **R$ 600**; site institucional a partir de **R$ 700**; manutenção **R$ 250–350/mês**.
- Entrega em **1 semana (7 dias)**; **domínio e hospedagem inclusos**; **4 rodadas de alterações** antes da entrega.
- Pagamento: **Pix e cartão de crédito (Kiwify)**.
- **Garantia de 90 dias**: falhas de funcionamento, bugs no código entregue, links quebrados ou desvios do escopo combinado.
- Método em 4 etapas: Descoberta, Criação, Refinamento, Publicação.
- Alisson tem **mais de 5 anos na área de tecnologia**.
- Portfólio real (chaves do motor): adao-rosa-monteiro, vanessa-oliveira, christian-gois, mesa-rosa, denise-resende, brasa-burger.
- Slogan: "Sua marca merece ser extraordinária."
- Nunca prometa resultados financeiros, nunca crie escassez falsa (vagas/prazo inventados), nunca use depoimentos que não existam.

## Pilares de tema (gire; não repita o mesmo tema dos últimos 10 posts em historico.json)
1. Portfólio (mostrar 3–6 sites com o nicho de cada um)
2. Preço transparente / quanto custa um site
3. O que vem incluso (domínio, hospedagem, 7 dias, 4 ajustes)
4. Garantia de 90 dias
5. Método AAS em 4 etapas
6. Erros comuns: depender só do Instagram / link de WhatsApp na bio sem site
7. Site x página de vendas: qual escolher
8. Sinais de que sua marca precisa de um site
9. Mitos ("site é caro", "demora meses", "preciso entender de tecnologia")
10. Nicho específico: site para artistas / psicólogos e terapeutas / gastronomia / marca pessoal
11. Por que um site passa confiança (pesquisa no Google, profissionalismo)
12. Bastidores: como um site é criado em 7 dias

## Passo a passo
1. `git -C <repo> pull`. Leia `_automacao/historico.json` e escolha o tema (pilar + ângulo novo).
2. Escreva o roteiro JSON (formatos em `_automacao/motor.py`, docstring do topo). Regras:
   - Reel: gancho forte na 1ª cena (pergunta ou dor), 4–6 cenas, termine com cena `cta`.
     Use `"trilha": N` variando 0, 1, 2. Total 15–25 s.
   - Carrossel: slide 1 = capa com promessa; último = `cta`; 5–7 slides.
   - Português do Brasil, frases curtas, tom premium, sem emojis no criativo.
3. Gere: `python3 _automacao/motor.py reel roteiro.json midia/reel-AAAA-MM-DD.mp4`
   e (ter/qui/sáb) `python3 _automacao/motor.py carrossel roteiro-c.json midia/carrossel-AAAA-MM-DD/`.
   Confira visualmente 3–5 quadros/slides (texto cortado, sobreposto ou ilegível → ajuste e gere de novo).
4. Commit e push dos arquivos de `midia/` para `main`. Espere o deploy do Pages concluir
   (`gh run list -R Alisson0408/aas-site -L 1`) — o arquivo fica em
   `https://aastecnologiaeditorial.com.br/midia/<arquivo>`.
5. Publique pelo vidIQ:
   - Reel: `vidiq_video_upload` com a URL pública → `vidiq_instagram_publish_reel`
     (platformAccountId acima, legenda pronta). Continue com o containerId até `PUBLISHED`.
   - Carrossel: `vidiq_upload_image` para cada slide (URL pública) → `vidiq_social_post_draft_create`
     com as imagens em ordem e a legenda → `vidiq_social_post_publish` com o revision devolvido.
6. Legenda: 1ª linha = gancho; 3–6 linhas de valor; chamada "Peça seu orçamento pelo link na bio."
   ou "Chame no WhatsApp: (19) 98952-2187."; 5–8 hashtags em português do nicho
   (#criacaodesites #sitesprofissionais #paginadevendas #webdesign #presencadigital + do tema).
7. Acrescente ao `historico.json`: data, formato, pilar, título/gancho, permalink. Commit e push.
8. Se a conexão do Instagram falhar ou expirar, não tente outro caminho: registre o erro no
   histórico e avise o dono na mensagem final que é preciso reconectar o Instagram no vidIQ.
9. Mensagem final ao dono: o que foi publicado hoje (gancho + link).

## Padrão de excelência (pedido do dono: cada post melhor que o anterior)
Antes de criar:
- Leia os últimos 5 itens do `historico.json`, incluindo o campo `aprendizado`.
- Consulte o desempenho dos posts recentes com `vidiq_instagram_owner_insights`
  (alcance, retenção, salvamentos, compartilhamentos, visitas ao perfil). Identifique o que
  funcionou melhor (gancho, tema, formato, duração) e aplique hoje; evite o que performou pior.
Ao criar, o post de hoje precisa superar o anterior em pelo menos um ponto concreto
(gancho mais forte, ritmo melhor, ideia mais clara, prova mais visual, CTA mais direto)
sem repetir estrutura nem frases. Varie as combinações de cena e a ordem.
Checklist obrigatório antes de publicar (refaça se algum item falhar):
1. O gancho prende em menos de 2 segundos e fala de uma dor ou desejo real do cliente.
2. Uma única ideia central, fácil de entender sem som.
3. Nenhum texto cortado, sobreposto, pequeno demais ou com erro de português.
4. Visual premium consistente (preto, dourado, serifas), nada genérico.
5. Chamada final clara para o link da bio ou WhatsApp.
6. Só fatos reais da seção "Fatos da oferta".
7. Legenda revisada, com gancho na 1ª linha e hashtags pertinentes.
Depois de publicar, registre no histórico o campo `aprendizado`: o que foi melhorado hoje e
o que testar amanhã. Se notar uma melhoria duradoura no motor (nova cena, melhor tipografia,
animação mais fluida), pode evoluir `motor.py`, desde que teste antes e não quebre os formatos.

## Restrições
- Não altere páginas do site (index.html, style.css etc.). Só `midia/` e `_automacao/`.
- Não publique em outra conta além da indicada.
- Não publique Stories (não suportado).
