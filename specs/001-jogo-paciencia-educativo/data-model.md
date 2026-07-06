# Data Model: Jogo de Paciência Educativo — MVP Web

> **Nota de revisão (2026)**: o jogo abandonou a mecânica clássica de naipes e
> ordem A→K do Klondike (ver `research.md`, Decisão 6) e, em seguida, a
> suposição de que todo tema tem exatamente 13 cartas e que há sempre 4 temas
> (ver Decisão 7). O campo antes chamado `suit` (naipe) chama-se `theme`
> (tema/eixo); cada tema pode ter um número diferente de cartas, calculado a
> partir dos dados, não mais fixo em código. As regras de movimento são por
> **igualdade de tema**, não por sequência de rank nem alternância de cor.

## Card (Carta)

Representa uma das 52 cartas do baralho temático. Vive em
`src/data/cards.servico-social-estreia.json`.

| Campo | Tipo | Descrição | Regras de validação |
|---|---|---|---|
| `id` | string | Identificador único e opaco (ex.: `"AS"`, `"10D"`, `"3AU"`) — não precisa ser lido pela engine além de checar unicidade | Único no arquivo |
| `theme` | string enum | `"teorico-metodologico"` \| `"etico-politico"` \| `"tecnico-operativo"` \| `"historico-formativo"` \| `"autores"` (deck de estreia; outros decks podem ter outro conjunto) | Um dos temas declarados em `themes` no mesmo arquivo |
| `rank` | string enum | Subconjunto de `"A"`,`"2"`..`"10"`,`"J"`,`"Q"`,`"K"`, usado só como chave de ordenação/unicidade dentro do tema | Sem repetição dentro do mesmo tema; **não precisa cobrir A..K inteiro** — um tema de 10 cartas usa só 10 desses valores. Sem efeito nas regras de movimento. |
| `title` | string | Título de exibição (nome da pessoa, no tema "autores"; nome do conceito/marco, nos demais) | Não vazio |
| `body` | string | Micro-texto educativo | ≤ 280 caracteres (limite de produção do documento de conteúdo) |
| `status` | string enum | `"rascunho"` \| `"revisado"` \| `"publicado"` | Controla exibição em build de produção (FR-011) |
| `photoUrl` | string \| null | Caminho local (`assets/authors/...`) de uma foto verificada manualmente no Wikimedia Commons | Só permitido em cartas do tema `"autores"`; `null` até ser pesquisada e confirmada (ver `contracts/ui-contract.md`) |
| `photoCredit` | string \| null | Atribuição exigida pela licença da imagem (autor/a da foto + licença, ex.: "Foto: Fulano, CC BY-SA 4.0") | Obrigatório sempre que `photoUrl` não for `null` |

Temas do deck de estreia (ver `themes` no arquivo de dados — cada um declara
seu próprio `axis`/`shortLabel`; o tamanho de cada tema é implícito na
quantidade de cartas que o referenciam, não um número fixo):
- `autores` → Autores e autoras do Serviço Social (12 cartas: nome + foto quando disponível)
- `teorico-metodologico` → Dimensão teórico-metodológica (10 cartas de conceito/marco)
- `etico-politico` → Dimensão ético-política (10 cartas)
- `tecnico-operativo` → Dimensão técnico-operativa (10 cartas)
- `historico-formativo` → História e formação profissional (10 cartas)

## Theme (Tema) / Foundation (Fundação)

Não é uma entidade persistida separadamente — é derivada em tempo de execução
a partir das cartas de um mesmo `theme`. Estado de jogo (efêmero, por partida):

| Campo | Tipo | Descrição |
|---|---|---|
| `theme` | string | Tema da fundação |
| `cards` | array de `id` | Cartas já colocadas nessa fundação, **em qualquer ordem** — o rank não importa |
| `isComplete` | boolean derivado | `cards.length === themeSizes[theme]`, onde `themeSizes` é calculado a partir do baralho carregado (`computeThemeSizes` em `deck.js`) — **não** um número fixo como 13 |

**Regra de movimento para fundação**: uma carta pode ir para a fundação do seu
próprio tema a qualquer momento, independentemente do rank e do que já está
na fundação (`card.theme === foundation.theme`). Não existe conceito de
"próxima carta da sequência".

## Tableau (regra de empilhamento)

Uma carta só pode ser colocada sobre outra no tableau se ambas forem do
**mesmo tema**, ou se a coluna de destino estiver vazia (qualquer carta pode
iniciar uma coluna vazia — não há mais restrição de "só Rei"). Não há
alternância de cor nem sequência decrescente de rank. A distribuição inicial
do tableau (1..7 cartas por coluna, resto no monte) depende só do **total**
de cartas do baralho, não do tamanho de cada tema — por isso continua igual
mesmo com temas de tamanhos diferentes, desde que o total (52 no deck de
estreia) não mude.

## Principle (Princípio)

Um dos 11 princípios fundamentais do Código de Ética de 1993. Vive em
`src/data/principles.json`. Sem alteração nesta revisão.

| Campo | Tipo | Descrição | Regras de validação |
|---|---|---|---|
| `order` | integer | Posição de desbloqueio, 1 a 11 | Único, sequencial, sem lacunas |
| `summary` | string | Texto resumido para exibição no jogo | Não vazio |
| `fullText` | string | Redação integral para o modo revisão | Não vazio; TODO marcar revisão contra Res. CFESS 273/93 (ver `CONTEUDO_CARTAS.md`) |

## GameState (Estado de partida)

Efêmero — existe apenas durante uma partida em andamento, nunca persistido em
`localStorage` (apenas o progresso educativo persiste, ver ProgressStore).

| Campo | Tipo | Descrição |
|---|---|---|
| `tableau` | array de 7 colunas, cada uma array de `{ id, faceUp }` | Distribuição inicial clássica (1,2,3,4,5,6,7 cartas por coluna), mas empilhamento por tema, não por naipe/rank |
| `stock` | array de `id` | Monte (cartas não distribuídas, viradas para baixo) |
| `waste` | array de `id` | Descarte (cartas viradas do monte) |
| `foundations` | N× Foundation (ver acima), uma por tema existente no deck carregado (5 no deck de estreia) | Chaves = temas declarados em `themes` |
| `themeSizes` | `Record<theme, integer>` calculado uma vez no início da partida | Usado para saber quando cada fundação está completa (ver Foundation acima) |
| `status` | string enum | `"em_andamento"` \| `"vitoria"` \| `"sem_jogadas"` |

**Transições de estado**:
- `em_andamento` → `vitoria`: quando todas as fundações têm `cards.length === themeSizes[theme]`.
- `em_andamento` → `sem_jogadas`: quando monte e descarte estão vazios e
  nenhuma carta visível pode mover para fundação ou tableau. Na prática, como
  qualquer carta revelada sempre pode ir para sua própria fundação, esse
  estado só ocorre quando não sobra nenhuma carta face-up jogável — ver nota
  em `research.md`, Decisão 6.
- Não há transição de volta — uma partida travada ou vencida exige "Nova
  partida" (novo `GameState` do zero).

## ProgressStore (Progresso do jogador)

Sem alteração nesta revisão — persistido em `localStorage` sob uma chave
versionada (ex.: `paciencia_ss.progress.v1`), com fallback em memória se
indisponível (ver `research.md`, Decisão 4).

| Campo | Tipo | Descrição |
|---|---|---|
| `revealedCardIds` | Set/array de `id` | Cartas já reveladas ao menos uma vez em qualquer partida |
| `unlockedPrincipleOrders` | array de integer | Subconjunto de `1..11` já desbloqueados, sempre um prefixo contíguo `[1..N]` |
| `foundationsCompletedCount` | integer | Total histórico de fundações completadas (determina `N` acima: `N = min(11, foundationsCompletedCount)`) |

**Regra de desbloqueio (FR-006)**: `unlockedPrincipleOrders` é sempre
recalculado como `[1..min(11, foundationsCompletedCount)]` — não há escolha de
qual princípio desbloquear, é estritamente sequencial. Não afetado pela
remoção da ordem A→K nas fundações nem pela variação de tamanho dos temas.

## Relacionamentos

```text
Card (N) ──belongs to──> Theme (1, via campo theme)
Theme (1) ──has one──> Foundation (estado de partida), tamanho = themeSizes[theme]
Foundation completion (evento) ──triggers──> Principle unlock (próximo da fila)
ProgressStore ──tracks──> Card.revealed (por id) e Principle.unlocked (por order)
GameState ──references──> Card by id (não duplica dados de conteúdo)
```
