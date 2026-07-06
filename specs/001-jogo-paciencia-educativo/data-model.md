# Data Model: Jogo de Paciência Educativo — MVP Web

## Card (Carta)

Representa uma das 52 cartas do baralho temático. Vive em `src/data/cards.json`.

| Campo | Tipo | Descrição | Regras de validação |
|---|---|---|---|
| `id` | string | Identificador único, ex.: `"AS"`, `"10D"`, `"KH"`, `"QC"` (rank+naipe em notação A-Z-10-J-Q-K + S/H/D/C) | Único no arquivo; corresponde exatamente a uma combinação naipe×valor |
| `suit` | string enum | `"spades"` \| `"hearts"` \| `"diamonds"` \| `"clubs"` | Exatamente um dos 4 |
| `rank` | string enum | `"A"`,`"2"`..`"10"`,`"J"`,`"Q"`,`"K"` | Cada naipe tem exatamente 13 ranks, sem repetição |
| `title` | string | Título de exibição (ex.: "Movimento de Reconceituação") | Não vazio |
| `body` | string | Micro-texto educativo | ≤ 280 caracteres (limite de produção do documento de conteúdo) |
| `status` | string enum | `"rascunho"` \| `"revisado"` \| `"publicado"` | Controla exibição em build de produção (FR-011) |

Naipe → eixo temático (fixo para o deck de estreia):
- `spades` → dimensão teórico-metodológica
- `hearts` → dimensão ético-política
- `diamonds` → dimensão técnico-operativa
- `clubs` → história e formação profissional

## Suit (Naipe) / Foundation (Fundação)

Não é uma entidade persistida separadamente — é derivada em tempo de execução
a partir das cartas de um mesmo `suit`. Estado de jogo (efêmero, por partida):

| Campo | Tipo | Descrição |
|---|---|---|
| `suit` | string enum | Naipe da fundação |
| `cards` | array de `id` | Cartas já empilhadas, em ordem A→K |
| `isComplete` | boolean derivado | `cards.length === 13` |

## Principle (Princípio)

Um dos 11 princípios fundamentais do Código de Ética de 1993. Vive em
`src/data/principles.json`.

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
| `tableau` | array de 7 colunas, cada uma array de `{ id, faceUp }` | Layout clássico Klondike (1,2,3,4,5,6,7 cartas por coluna na distribuição inicial) |
| `stock` | array de `id` | Monte (cartas não distribuídas, viradas para baixo) |
| `waste` | array de `id` | Descarte (cartas viradas do monte) |
| `foundations` | 4× Foundation (ver acima) | Uma por naipe |
| `status` | string enum | `"em_andamento"` \| `"vitoria"` \| `"sem_jogadas"` |

**Transições de estado**:
- `em_andamento` → `vitoria`: quando as 4 fundações têm 13 cartas cada.
- `em_andamento` → `sem_jogadas`: quando nenhuma carta do tableau/waste pode
  mover para outra coluna ou fundação, e o monte já foi totalmente ciclado.
- Não há transição de volta — uma partida travada ou vencida exige "Nova
  partida" (novo `GameState` do zero).

## ProgressStore (Progresso do jogador)

Persistido em `localStorage` sob uma chave versionada (ex.:
`paciencia_ss.progress.v1`), com fallback em memória se indisponível (ver
`research.md`, Decisão 4).

| Campo | Tipo | Descrição |
|---|---|---|
| `revealedCardIds` | Set/array de `id` | Cartas já reveladas ao menos uma vez em qualquer partida |
| `unlockedPrincipleOrders` | array de integer | Subconjunto de `1..11` já desbloqueados, sempre um prefixo contíguo `[1..N]` |
| `foundationsCompletedCount` | integer | Total histórico de fundações completadas (determina `N` acima: `N = min(11, foundationsCompletedCount)`) |

**Regra de desbloqueio (FR-006)**: `unlockedPrincipleOrders` é sempre
recalculado como `[1..min(11, foundationsCompletedCount)]` — não há escolha de
qual princípio desbloquear, é estritamente sequencial.

## Relacionamentos

```text
Card (N) ──belongs to──> Suit (1, implícito via campo suit)
Suit (1) ──has one──> Foundation (estado de partida)
Foundation completion (evento) ──triggers──> Principle unlock (próximo da fila)
ProgressStore ──tracks──> Card.revealed (por id) e Principle.unlocked (por order)
GameState ──references──> Card by id (não duplica dados de conteúdo)
```
