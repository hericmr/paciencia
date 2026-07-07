# Data Model: Jogo de Categorias e Associações — MVP Nível 1

> **Nota de revisão**: ver `research.md`, Decisão 8 — categorias agora têm
> uma carta-título enterrada no tableau; o tableau voltou a ser empilhado
> por coluna (estilo Klondike), com apenas a carta do topo de cada coluna
> acessível.

## Category (Categoria)

Vive em `src/data/categories.json`. Cadastro completo das 14 categorias do
documento de design do mantenedor (mesmo as ainda não usadas em nenhum
nível jogável — servem de banco de conteúdo para níveis futuros).

| Campo | Tipo | Descrição | Regras de validação |
|---|---|---|---|
| `id` | string | Ex.: `"CAT-13"` | Único |
| `nome` | string | Nome exibido no slot depois de aberta | Não vazio |
| `cartaTitulo` | string | Texto exibido na carta-título enquanto ela está no tableau (antes de ser jogada). Usa o mesmo texto de `nome` (ver research.md, Decisão 8) | Não vazio |
| `eixo` | string enum | `etica` \| `tecnica` \| `historia` \| `teoria` \| `politica_social` | Um dos 5 |
| `palavras` | string[] | Pool completo de palavras candidatas (3–9 itens) | Sem duplicatas |
| `microtexto` | string | Exibido ao completar a categoria em qualquer nível | ≤ 280 caracteres, não vazio |
| `confundeCom` | string[] | Ids de outras categorias usadas como misdirection contra esta | Metadado de design; **não lido pela engine** (ver research.md, Decisão 6) |

## Level (Nível)

Vive em `src/data/levels.json`. Nesta feature, só o Nível 1 é jogável.

| Campo | Tipo | Descrição | Regras de validação |
|---|---|---|---|
| `id` | integer | Identificador do nível | Único |
| `categoryIds` | string[4] | Quais categorias compõem o nível | Exatamente 4; todos devem existir em `categories.json` |
| `cardsPerCategory` | integer | Quantas cartas de palavra de cada categoria entram no nível | 3–8 |
| `selectedWords` | `Record<categoryId, string[]>` | Palavras curadas para este nível, uma lista por categoria | Cada lista tem exatamente `cardsPerCategory` itens, todos presentes em `palavras` daquela categoria |
| `totalCards` | integer | `4 + (4 × cardsPerCategory)` — 4 cartas-título + as cartas de palavra | DEVE ser exatamente essa soma |
| `columns` | integer | Colunas do tableau | 4–6 |
| `moveLimit` | integer | Limite total de movimentos (abrir categoria + classificar palavra + desobstruir coluna, certos ou errados) | > 0; DEVE ser ≥ `totalCards` (mínimo teórico sem nenhum movimento de desobstrução) |
| `profundidadeTitulos` | string enum | `topo` \| `meio` \| `fundo` — onde as 4 cartas-título são inseridas nas colunas | Alavanca de dificuldade (ver research.md, Decisão 8) |
| `hint` | string \| null | Dica pedagógica exibida na derrota | Opcional |

## WordCard / TitleCard (Carta)

Geradas em tempo de execução por `src/engine/level.js` a partir de um
`Level` + `Category[]` — não são persistidas como estão nos JSON de dados.

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | string | `${categoryId}:${word}` para palavras; `TITLE:${categoryId}` para cartas-título |
| `categoryId` | string | Categoria correta desta carta |
| `word` | string | Texto exibido na carta (a palavra, ou `cartaTitulo` da categoria) |
| `isTitleCard` | boolean | `true` só para a carta-título de cada categoria |

Cartas cujo `word` corresponde a um nome com foto conhecida (ver
`author-photos.json`) exibem a foto na camada de apresentação — a engine não
carrega esse campo.

## TableauColumn (Coluna do tableau)

Gerada por `src/engine/level.js` (`dealTableau`). Uma pilha por coluna;
`totalCards` distribuídas em round-robin entre `columns` colunas, sem
monte/descarte (ver research.md, Decisão 8).

| Campo | Tipo | Descrição |
|---|---|---|
| `cards` | `{ card: WordCard, faceUp: boolean }[]` | Da base ao topo; só o último elemento (`faceUp: true`) é jogável |

**Regra de acesso**: só a última carta de cada coluna (`faceUp: true`) pode
ser movida. Ao remover a carta do topo, a carta abaixo dela vira
`faceUp: true` automaticamente.

## LevelState (Estado de partida)

Efêmero — existe apenas durante um nível em andamento.

> **Nota de revisão**: campos `spotCategories`/`stock`/`waste` adicionados
> pelas Decisões 11–14 (mais categorias que spots, Monte/Descarte,
> liberação de spot ao finalizar grupo). O restante desta seção ainda
> reflete o modelo anterior (4 categorias fixas, sem Monte/Descarte) onde
> não conflita com essas decisões.

| Campo | Tipo | Descrição |
|---|---|---|
| `tableauColumns` | `TableauColumn[]` | Estado atual das colunas (sempre 4, cascata crescente — Decisão 12) |
| `slots` | `Record<categoryId, WordCard[]>` | Cartas de palavra já aceitas corretamente, por categoria. Nunca é limpo, mesmo depois que o spot que a abriu é reciclado — é o registro definitivo de conclusão, usado por `checkLevelWin` |
| `spotCategories` | `(categoryId\|null)[4]` | Qual categoria ocupa cada um dos 4 spots físicos, ou `null` se o spot está livre/fechado. Setado ao jogar uma carta-título num spot vazio; voltar a `null` quando aquele grupo finaliza (Decisão 14) |
| `openCategoryIds` | `Set<categoryId>` | Categorias cuja carta-título já foi jogada em algum momento — nunca removido (uma categoria não reabre depois de completada, pois não há segunda carta-título) |
| `stock` | `WordCard[]` | Monte: cartas restantes viradas para baixo, fora do tableau (Decisão 12) |
| `waste` | `WordCard[]` | Descarte: cartas compradas do Monte, só a do topo é jogável (Decisão 12) |
| `movesRemaining` | integer | Decrementado a cada tentativa de mover uma carta do topo de uma coluna/descarte (para um spot de categoria ou para outra coluna) |
| `status` | string enum | `"em_andamento"` \| `"vitoria"` \| `"derrota"` |

**Regras de movimento** (ver `contracts/ui-contract.md` para o esquema
completo):
- Carta-título → spot vazio (`spotCategories[i] === null`): aceita se essa
  categoria ainda não estiver associada a outro spot; associa o spot a ela
  (`spotCategories[i] = categoryId`, `openCategoryIds.add(categoryId)`).
- Carta de palavra → spot de categoria: aceita só se `spotCategories[i] ===
  card.categoryId`; caso contrário rejeitada.
- Carta ou sub-pilha do topo de uma coluna/descarte → topo de **outra**
  coluna: aceita se a coluna destino estiver vazia ou se sua carta do topo
  for da mesma categoria (Decisão 13); caso contrário rejeitada.
- Todo movimento acima — aceito ou rejeitado — decrementa `movesRemaining`.
- **Grupo finalizado** (`slots[categoryId].length === cardsPerCategory`):
  no mesmo movimento que o completa, `spotCategories[i] = null` — o spot
  volta a "fechado" e aceita uma nova carta-título imediatamente, sem ação
  extra do jogador (Decisão 14). `slots[categoryId]` não é alterado.

**Transições de estado**:
- `em_andamento` → `vitoria`: quando pelo menos 4 categorias do nível têm
  `slots[categoryId].length === cardsPerCategory` — checado **antes** da
  checagem de derrota. Com a reciclagem de spots (Decisão 14), essas 4
  podem ter ocupado o mesmo spot em momentos diferentes da partida.
- `em_andamento` → `derrota`: quando `movesRemaining === 0` e menos de 4
  categorias completas.
- Sem transição de volta — perder/vencer exige recarregar o nível.

## SoundManager (Feedback sonoro)

Módulo de apresentação (`src/audio/sound-manager.js`), sem estado de jogo —
só decide qual arquivo tocar e se o áudio está mudo. Ver
`contracts/ui-contract.md` §6 e `research.md`, Decisão 9.

| Campo/Método | Tipo | Descrição |
|---|---|---|
| `play(eventName)` | função | Toca uma variante aleatória do som mapeado para `eventName`; não faz nada se mudo ou se o evento não existir |
| `isMuted()` | função | Retorna o estado atual de mudo |
| `setMuted(value)` / `toggleMuted()` | função | Altera o estado de mudo e persiste em `localStorage` |

`eventName` ∈ `"cardPlace"` \| `"cardMove"` \| `"categoryComplete"` \|
`"dealShuffle"`. Não lido pela engine (`src/engine/`) — chamado só pela
camada de UI (`level-board.js`, `main.js`) em reação a movimentos já
resolvidos.

## ProgressStore (Progresso do jogador)

Sem alteração desta revisão — `revealedCategoryIds` / `completedLevelIds`
(ver commit anterior).

## Relacionamentos

```text
Category (1) ──has one──> TitleCard (via cartaTitulo)
Category (1) ──contributes words to──> Level.selectedWords (N)
Level (1) ──generates──> TitleCard×4 + WordCard×(cardsPerCategory×4), em tempo de execução
TitleCard played ──opens──> Category slot (aceita WordCards dali em diante)
LevelState.slots completion ──triggers──> Category.microtexto reveal
ProgressStore ──tracks──> Category.revealed (por id) e Level.completed (por id)
```

## Pendências de conteúdo herdadas do documento de design

- [ ] Conferir listas dos arts. 4º e 5º da Lei 8.662/93 palavra por palavra (CAT-04/CAT-05)
- [ ] Conferir tipificação dos serviços (Res. CNAS 109/2009) para CAT-07/CAT-08
- [ ] Conferir art. 194 da CF/88 para CAT-09
- [ ] Validar pools e misdirections com docente da área
- [ ] Balancear: nenhuma palavra deve pertencer legitimamente a 2 categorias presentes no mesmo nível (exceto níveis-desafio futuros)
