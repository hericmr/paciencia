# Data Model: Jogo de Categorias e Associações — MVP Nível 1

## Category (Categoria)

Vive em `src/data/categories.json`. Cadastro completo das 14 categorias do
documento de design do mantenedor (mesmo as ainda não usadas em nenhum
nível jogável — servem de banco de conteúdo para níveis futuros).

| Campo | Tipo | Descrição | Regras de validação |
|---|---|---|---|
| `id` | string | Ex.: `"CAT-13"` | Único |
| `nome` | string | Nome exibido no slot ao ser descoberta | Não vazio |
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
| `cardsPerCategory` | integer | Quantas cartas de cada categoria entram no nível | 3–8 (documento de design) |
| `selectedWords` | `Record<categoryId, string[]>` | Palavras curadas para este nível, uma lista por categoria | Cada lista tem exatamente `cardsPerCategory` itens, todos presentes em `palavras` daquela categoria |
| `columns` | integer | Colunas do tableau | 4–6 |
| `moveLimit` | integer | Limite total de movimentos (certos + errados) | > 0; DEVE ser ≥ `cardsPerCategory × 4` (senão o nível seria impossível de vencer mesmo sem erros) |
| `hint` | string \| null | Dica pedagógica exibida na derrota | Opcional |

## WordCard (Carta)

Gerada em tempo de execução por `src/engine/level.js` a partir de um
`Level` + `Category[]] — não é persistida como está no JSON de dados.

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | string | `${categoryId}:${word}` (ex.: `"CAT-13:Netto"`) |
| `categoryId` | string | Categoria correta desta carta |
| `word` | string | Texto exibido na carta |

Cartas do tema "autores" (`categoryId === "CAT-13"`) podem ter
`photoUrl`/`photoCredit` resolvidos via `title`↔`word` na camada de
apresentação (ver `contracts/ui-contract.md`) — a engine não carrega esses
campos.

## LevelState (Estado de partida)

Efêmero — existe apenas durante um nível em andamento.

| Campo | Tipo | Descrição |
|---|---|---|
| `tableau` | `WordCard[]` | Cartas ainda não classificadas (ou classificadas incorretamente e devolvidas) |
| `slots` | `Record<categoryId, WordCard[]>` | Cartas já aceitas corretamente, por categoria |
| `movesRemaining` | integer | Decrementado a cada tentativa de mover para um slot (Decisão 3) |
| `status` | string enum | `"em_andamento"` \| `"vitoria"` \| `"derrota"` |

**Transições de estado**:
- `em_andamento` → `vitoria`: quando `slots[categoryId].length === cardsPerCategory` para as 4 categorias do nível — checado **antes** da checagem de derrota (spec.md, Edge Cases).
- `em_andamento` → `derrota`: quando `movesRemaining === 0` e alguma categoria ainda está incompleta.
- Sem transição de volta — perder/vencer exige recarregar o nível.

## ProgressStore (Progresso do jogador)

Reaproveita `src/progress/store.js` da v1 quase sem mudança de forma —
generaliza "carta revelada" para "categoria com microtexto já visto":

| Campo | Tipo | Descrição |
|---|---|---|
| `revealedCategoryIds` | Set/array de `id` | Categorias cujo microtexto já foi mostrado ao menos uma vez (em qualquer nível) |
| `completedLevelIds` | array de integer | Níveis já vencidos ao menos uma vez |

O antigo `foundationsCompletedCount`/desbloqueio dos 11 princípios do
Código de Ética **não é retomado** nesta versão (ver spec.md, Assumptions).

## Relacionamentos

```text
Category (1) ──contributes words to──> Level.selectedWords (N)
Level (1) ──generates──> WordCard (cardsPerCategory × 4, em tempo de execução)
WordCard (N) ──belongs to──> Category (1, via categoryId)
LevelState.slots completion ──triggers──> Category.microtexto reveal
ProgressStore ──tracks──> Category.revealed (por id) e Level.completed (por id)
```

## Pendências de conteúdo herdadas do documento de design

- [ ] Conferir listas dos arts. 4º e 5º da Lei 8.662/93 palavra por palavra (CAT-04/CAT-05)
- [ ] Conferir tipificação dos serviços (Res. CNAS 109/2009) para CAT-07/CAT-08
- [ ] Conferir art. 194 da CF/88 para CAT-09
- [ ] Validar pools e misdirections com docente da área
- [ ] Balancear: nenhuma palavra deve pertencer legitimamente a 2 categorias presentes no mesmo nível (exceto níveis-desafio futuros)
