# Conteúdo das Cartas — Jogo de Categorias e Associações

> Espelha o estado atual de `src/data/categories.json` (fonte real, lida
> pelo jogo) em formato legível, para facilitar discutir e planejar
> mudanças de conteúdo. **Editar este `.md` não muda o jogo sozinho** —
> depois de decidir uma mudança aqui, ela precisa ser replicada em
> `src/data/categories.json` (e em `src/data/levels.json` se afetar as
> `selectedWords` do Nível 1). Ao pedir uma alteração, ela é aplicada nos
> dois lugares na mesma tarefa.

## Como uma categoria funciona

Cada categoria tem:
- `id` — estável, referenciado por `levels.json`. Não mudar depois de criado um nível.
- `nome` — nome real, mostrado só quando a categoria é completada.
- `cartaTitulo` — texto da carta-título (hoje sempre igual a `nome`; pode divergir se quiser um texto de carta diferente do nome de exibição).
- `eixo` — cor/agrupamento temático (ver tabela abaixo). Não afeta a lógica do jogo, só o modo revisão.
- `palavras` — pool completo de cartas dessa categoria (sem duplicatas). O Nível 1 usa só um subconjunto (`selectedWords`).
- `microtexto` — mostrado no pop-up ao completar a categoria. ≤ 280 caracteres.
- `confundeCom` — metadado de curadoria (categorias fáceis de confundir com esta). **Não é lido pela engine**, só documenta intenção de design.

## Eixos (cores no modo revisão)

| eixo | categorias |
|---|---|
| `etica` | CAT-01, CAT-02, CAT-03 |
| `tecnica` | CAT-04, CAT-05, CAT-06 |
| `politica_social` | CAT-07, CAT-08, CAT-09, CAT-10 |
| `historia` | CAT-11, CAT-13 |
| `teoria` | CAT-12, CAT-14 |
| `sociojuridico` | CAT-15, CAT-16, CAT-17, CAT-18, CAT-19, CAT-20, CAT-21, CAT-22 |
| `questao_social` | CAT-23, CAT-24 |

> **Diretriz de conteúdo (2026-07-07):** nenhuma carta pode ser ano solto
> ou data para decorar. Marcos históricos entram como marcos **nomeados**;
> anos, quando importam, ficam de apoio no microtexto.

---

## Eixo: Ético-político

### CAT-01 — Princípios do Código de Ética (1993)
**Palavras**: Liberdade, Democracia, Equidade, Justiça social, Pluralismo, Cidadania, Direitos humanos, Nova ordem societária, Eliminação de preconceitos, Qualidade dos serviços
**Microtexto**: Os 11 princípios fundamentais (Res. CFESS 273/93) têm a liberdade como valor ético central e apontam para uma sociedade sem dominação-exploração de classe, etnia e gênero.
**Confunde com**: CAT-09, CAT-10, CAT-17

### CAT-02 — Direitos do/a assistente social (Código, art. 2º)
**Palavras**: Livre exercício, Autonomia técnica, Inviolabilidade do local de trabalho, Sigilo profissional, Pronunciamento público, Aprimoramento profissional, Desagravo público
**Microtexto**: O Código garante condições para o exercício: autonomia, sigilo, inviolabilidade dos arquivos e direito de se pronunciar em matéria de sua especialidade.
**Confunde com**: CAT-03, CAT-16

### CAT-03 — Vedações ao/à assistente social
**Palavras**: Práticas discriminatórias, Abuso de autoridade, Depor como testemunha (situação sigilosa), Emprestar o nome a serviço irregular, Assédio, Intermediar honorários indevidos, Acatar ordem que fira a autonomia
**Microtexto**: O Código não só garante direitos: veda condutas que violem usuários/as ou a profissão. Discriminar, abusar da autoridade e quebrar sigilo em depoimento estão entre as proibições.
**Confunde com**: CAT-02

---

## Eixo: Técnico-operativo

### CAT-04 — Atribuições privativas (Lei 8.662/93, art. 5º)
**Palavras**: Magistério em Serviço Social, Direção de unidade de ensino de SS, Fiscalização do exercício profissional, Parecer sobre matéria de Serviço Social, Supervisão direta de estágio em SS, Coordenação de curso de SS, Perícia sobre matéria de SS
**Microtexto**: Privativas = SÓ assistente social pode (art. 5º). O truque para memorizar: quase todas contêm "de Serviço Social" no enunciado — dizem respeito à própria profissão.
**Confunde com**: CAT-05

### CAT-05 — Competências (Lei 8.662/93, art. 4º)
**Palavras**: Elaborar planos e programas, Orientação social a indivíduos e grupos, Estudos socioeconômicos, Encaminhar providências, Assessoria a movimentos sociais, Gestão de políticas sociais, Pesquisa sobre a realidade social
**Microtexto**: Competências = o assistente social faz, mas outras profissões também podem (art. 4º). Confundir art. 4º com art. 5º é a pegadinha mais clássica das bancas.
**Confunde com**: CAT-04

### CAT-06 — Instrumentos e técnicas
**Palavras**: Entrevista, Visita domiciliar, Estudo social, Relatório social, Reunião, Observação, Escuta qualificada, Diário de campo
**Microtexto**: Os instrumentos não são neutros: ganham direção pela instrumentalidade (Yolanda Guerra) — articulação das dimensões teórica, ética e técnica.
**Confunde com**: CAT-04, CAT-15

---

## Eixo: Política Social

### CAT-07 — Proteção Social Básica
**Palavras**: CRAS, PAIF, SCFV, Prevenção de riscos, Território de vulnerabilidade, Fortalecimento de vínculos, Cadastro Único
**Microtexto**: PSB (PNAS/2004): caráter PREVENTIVO, executada no CRAS via PAIF e SCFV, para famílias em situação de vulnerabilidade — antes da violação de direitos.
**Confunde com**: CAT-08

### CAT-08 — Proteção Social Especial
**Palavras**: CREAS, PAEFI, Abordagem social, Acolhimento institucional, Medidas socioeducativas, Família acolhedora, Direitos violados
**Microtexto**: PSE: atende situações de RISCO e direitos JÁ violados — média complexidade (CREAS/PAEFI) e alta complexidade (acolhimento). A régua é: violou o direito? É especial.
**Confunde com**: CAT-07, CAT-18

### CAT-09 — Seguridade Social (CF/88)
**Palavras**: Saúde, Previdência, Assistência social, Universalidade da cobertura, Seletividade e distributividade, Equidade no custeio, Caráter democrático da gestão
**Microtexto**: O tripé da CF/88 (art. 194): saúde (universal), previdência (contributiva) e assistência (a quem dela necessitar). Os objetivos do parágrafo único caem MUITO em prova.
**Confunde com**: CAT-01, CAT-10

### CAT-10 — Diretrizes e princípios do SUAS
**Palavras**: Descentralização político-administrativa, Participação popular, Primazia do Estado, Matricialidade sociofamiliar, Territorialização, Controle social, Comando único
**Microtexto**: PNAS/2004 e NOB/SUAS: gestão descentralizada com comando único por esfera, centralidade na família e no território, e controle social pelos conselhos.
**Confunde com**: CAT-09, CAT-01, CAT-23

---

## Eixo: Histórico-formativo

### CAT-11 — Marcos históricos da profissão
**Palavras**: Primeira escola de Serviço Social, Movimento de Reconceituação, Congresso da Virada, Currículo de 1982, Código de Ética vigente, Lei de Regulamentação, LOAS, Diretrizes Curriculares da ABEPSS
**Microtexto**: A Virada (III CBAS, 1979) é o divisor político da categoria. E 1993 é o ano-chave de apoio: Código de Ética, Lei de Regulamentação e LOAS nascem juntos — três pilares do projeto ético-político.
**Confunde com**: CAT-12

> ✅ **Revisado (2026-07-07):** anos soltos substituídos por marcos
> nomeados, conforme feedback. "Currículo de 1982" e "Código de Ética
> vigente" carregam a referência temporal dentro do nome, sem exigir
> decoreba de data isolada. Nenhuma carta do jogo pode ser um ano solto.

### CAT-13 — Autoras e autores da vertente crítica
**Palavras**: Iamamoto, Netto, Behring, Yazbek, Guerra, Faleiros, Martinelli, Barroco, Boschetti
**Microtexto**: A tradição marxista no Serviço Social: Iamamoto (trabalho e reprodução), Netto (renovação), Behring (política social), Guerra (instrumentalidade), Barroco (ética).
**Confunde com**: (nenhuma)
**Fotos verificadas**: Netto, Faleiros (ver `scripts/author-photos-manifest.json` e `specs/001-jogo-paciencia-educativo/CONTEUDO_CARTAS.md`)

---

## Eixo: Teórico-metodológico

### CAT-12 — Renovação e suas vertentes (Netto)
**Palavras**: Modernizadora, Araxá, Teresópolis, Reatualização do conservadorismo, Fenomenologia, Intenção de ruptura, Método BH
**Microtexto**: Netto sistematiza três vertentes da renovação: modernizadora (Araxá/Teresópolis), reatualização do conservadorismo e intenção de ruptura — que se torna hegemônica nos anos 1980.
**Confunde com**: CAT-11, CAT-14

### CAT-14 — Categorias do método crítico
**Palavras**: Totalidade, Mediação, Historicidade, Contradição, Práxis, Questão social, Reprodução das relações sociais
**Microtexto**: Ler a realidade como totalidade histórica e contraditória, mediando o singular e o universal: é o que distingue a intervenção crítica do atendimento pontual.
**Confunde com**: CAT-12

---

## Eixo: Sociojurídico

### CAT-15 — Documentos: laudo e parecer
**Palavras**: Laudo social, Parecer social, Perícia social, Quesitos, Opinião técnica conclusiva, Registro fundamentado, Materialização do estudo social
**Microtexto**: Estudo social é o processo; laudo é o documento da perícia e responde quesitos do juízo; parecer é opinião técnica sucinta e conclusiva. Confundir os três é pegadinha garantida no sociojurídico.
**Confunde com**: CAT-06

### CAT-16 — Campo sociojurídico
**Palavras**: Poder Judiciário, Ministério Público, Defensoria Pública, Sistema penitenciário, Perícia judicial, Interdisciplinaridade, Autonomia frente à requisição
**Microtexto**: O sociojurídico articula as instituições de justiça e execução penal. O desafio ético: responder requisições sem virar "olhos e ouvidos do juiz" — o trabalho interdisciplinar não dilui a competência de cada profissão.
**Confunde com**: CAT-02

### CAT-17 — Direitos Humanos
**Palavras**: Declaração Universal dos Direitos Humanos, Universalidade, Indivisibilidade, Interdependência, Dignidade humana, Pactos internacionais, Dimensões de direitos
**Microtexto**: DH são universais, indivisíveis e interdependentes. Para o Serviço Social não são abstração: o Código de 1993 assume sua defesa intransigente e a recusa do arbítrio e do autoritarismo.
**Confunde com**: CAT-01

### CAT-18 — SGD e medidas de proteção (ECA)
**Palavras**: Conselho Tutelar, Medidas protetivas (art. 101), Acolhimento familiar, Prioridade absoluta, Proteção integral, Promoção–defesa–controle, Excepcionalidade do afastamento
**Microtexto**: O SGD (Res. CONANDA 113) opera em três eixos: promoção, defesa e controle. Medidas protetivas (art. 101) respondem a direito ameaçado ou violado — não confundir com as socioeducativas do art. 112.
**Confunde com**: CAT-19, CAT-08

### CAT-19 — Adolescente e ato infracional
**Palavras**: Medidas socioeducativas (art. 112), SINASE, Advertência, Liberdade assistida, Prestação de serviços à comunidade, Semiliberdade, Internação
**Microtexto**: Socioeducativas respondem ao ato infracional; protetivas, à violação de direitos. Internação: excepcional, breve, máximo 3 anos. O SINASE (Lei 12.594/12) organiza a execução.
**Confunde com**: CAT-18

### CAT-20 — Violências contra criança e adolescente
**Palavras**: Violência física, Violência psicológica, Abuso sexual, Exploração sexual, Negligência, Escuta especializada, Depoimento especial
**Microtexto**: A Lei 13.431/17 tipifica as violências e cria escuta especializada e depoimento especial para evitar a revitimização. Abuso ≠ exploração sexual: a segunda envolve troca ou mercantilização.
**Confunde com**: CAT-18, CAT-21

### CAT-21 — Violência doméstica contra a mulher (Lei Maria da Penha)
**Palavras**: Violência patrimonial, Violência moral, Medidas protetivas de urgência, Juizado de Violência Doméstica, Relação íntima de afeto, Independe de coabitação, Atendimento multidisciplinar
**Microtexto**: A Maria da Penha (Lei 11.340/06) reconhece 5 formas de violência: física, psicológica, sexual, patrimonial e moral. As duas últimas são as que as bancas mais cobram — e as mais esquecidas.
**Confunde com**: CAT-20, CAT-22

### CAT-22 — Pessoa idosa (Estatuto)
**Palavras**: 60 anos ou mais, Prioridade especial (80+), Notificação compulsória, Obrigação alimentar solidária, ILPI, Medidas de proteção (art. 43), Envelhecimento como direito personalíssimo
**Microtexto**: Estatuto da Pessoa Idosa (Lei 10.741/03): 60+, com prioridade especial aos 80+. Violência contra idoso tem notificação compulsória, e a obrigação alimentar é solidária — o idoso escolhe de quem cobrar.
**Confunde com**: CAT-18, CAT-21

---

## Eixo: Questão Social

### CAT-23 — Famílias
**Palavras**: Pluralidade de arranjos, Família monoparental, Homoparentalidade, Famílias reconstituídas, Redes de apoio, Familismo, Sobrecarga feminina do cuidado
**Microtexto**: Não existe "a família": existem famílias. A crítica ao familismo: políticas que transferem à família (leia-se: às mulheres) a proteção social que caberia ao Estado.
**Confunde com**: CAT-10, CAT-24

### CAT-24 — Gênero, raça e diversidade
**Palavras**: Divisão sexual do trabalho, Interseccionalidade, Racismo estrutural, Patriarcado, Identidade de gênero, Relações intergeracionais, Etarismo
**Microtexto**: Classe não explica tudo sozinha: gênero, raça e geração estruturam a desigualdade. Interseccionalidade lê essas opressões articuladas — não somadas uma a uma.
**Confunde com**: CAT-23

---

## Nível 1 (único nível jogável hoje)

Usa 4 das 24 categorias, 3 palavras curadas de cada (não o pool inteiro):

| Categoria | Palavras selecionadas |
|---|---|
| CAT-13 — Autoras e autores da vertente crítica | Iamamoto, Netto, Guerra |
| CAT-06 — Instrumentos e técnicas | Entrevista, Visita domiciliar, Estudo social |
| CAT-11 — Marcos históricos da profissão | Congresso da Virada, LOAS, Lei de Regulamentação |
| CAT-07 — Proteção Social Básica | CRAS, PAIF, SCFV |

`columns: 4`, `moveLimit: 32`, `profundidadeTitulos: "topo"`, `hint: null`.

> ⚠️ A troca das palavras da CAT-11 **exige atualizar `selectedWords` em
> `levels.json`** junto com `categories.json` — os anos soltos (1936,
> 1979, 1993) deixam de existir no pool.

## Níveis futuros (rascunho de curadoria)

Pares de confusão que rendem bons níveis:

| Nível candidato | Categorias | Tensão pedagógica |
|---|---|---|
| Sociojurídico I | CAT-18 + CAT-19 + CAT-15 + CAT-16 | protetiva × socioeducativa; documento × campo |
| Documentos e instrumentos | CAT-06 + CAT-15 + CAT-04 + CAT-05 | processo × produto; privativa × competência |
| Violências e proteções | CAT-20 + CAT-21 + CAT-22 + CAT-08 | medidas protetivas de leis diferentes |
| Ética e direitos | CAT-01 + CAT-02 + CAT-03 + CAT-17 | princípio × direito × vedação × DH |

## Regras ao editar

- `id` novo: seguir o padrão `CAT-NN` (dois dígitos, sequencial).
- `palavras`: sem duplicatas dentro da mesma categoria.
- **Palavra idêntica não pode aparecer em duas categorias que possam
  compor o mesmo nível** (ex.: "Estudo social" fica só na CAT-06; a
  CAT-15 usa "Materialização do estudo social").
- **Nenhuma carta pode ser um ano/data solta.** Referência temporal só
  dentro de um marco nomeado (ex.: "Currículo de 1982") ou no microtexto.
- `microtexto`: até 280 caracteres.
- Se mudar `palavras` de uma categoria já usada em algum nível, conferir
  que `selectedWords` em `levels.json` continua só com palavras que
  existem no pool atualizado.
- `confundeCom` é só para orientar curadoria futura (ex.: escolher
  distratores na hora de montar um nível) — não precisa ser simétrico nem
  validado.
