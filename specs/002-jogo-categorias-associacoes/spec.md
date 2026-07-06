# Feature Specification: Jogo de Categorias e Associações — MVP Nível 1

**Feature Branch**: `002-jogo-categorias-associacoes`

**Created**: 2026-07-06

**Status**: Draft

**Input**: User description: "jogo de categorias e associacoes estilo solitaire associations, substitui o klondike"

**Substitui**: a feature `001-jogo-paciencia-educativo` (Klondike temático) é
descontinuada. O código permanece no histórico do git (branch
`001-jogo-paciencia-educativo`), mas deixa de ser mantido. Ver
`research.md`, Decisão 1, para o racional.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Jogar um nível de categorias até vencer ou perder (Priority: P1)

Uma pessoa abre o jogo e vê um tableau com cartas de palavras/conceitos
soltas (não empilhadas, todas visíveis) e 4 slots de categoria vazios. Ela
arrasta cada carta para o slot da categoria a que acredita que ela pertence.
Cada movimento (certo ou errado) consome uma unidade do limite de
movimentos do nível. A pessoa vence se completar as 4 categorias antes de
esgotar os movimentos; perde se os movimentos acabarem antes disso.

**Why this priority**: é o motor do produto — sem essa mecânica de
classificação com risco (movimentos limitados), não há jogo. Precisa
funcionar de forma independente do conteúdo pedagógico estar polido.

**Independent Test**: carregar o Nível 1 (4 categorias × 3 cartas = 12
cartas), classificar todas corretamente e confirmar vitória; em uma segunda
partida, errar repetidamente até esgotar os movimentos e confirmar derrota.

**Acceptance Scenarios**:

1. **Given** o Nível 1 carregado, **When** a pessoa arrasta uma carta para o
   slot da categoria correta, **Then** a carta é aceita naquele slot, some do
   tableau, e o contador de movimentos restantes diminui em 1.
2. **Given** o Nível 1 em andamento, **When** a pessoa arrasta uma carta para
   o slot de uma categoria diferente da correta, **Then** a carta retorna ao
   tableau (jogada rejeitada), mas o contador de movimentos restantes ainda
   diminui em 1 (o erro tem custo).
3. **Given** uma categoria com todas as suas cartas corretamente
   classificadas, **When** a última carta daquela categoria é aceita,
   **Then** o slot é marcado como "completo".
4. **Given** as 4 categorias completas, **When** a última é fechada,
   **Then** o jogo exibe tela de vitória.
5. **Given** o contador de movimentos chega a 0, **When** ainda existe ao
   menos uma categoria incompleta, **Then** o jogo exibe tela de derrota.

---

### User Story 2 - Aprender ao completar uma categoria (Priority: P2)

Ao completar uma categoria (todas as suas cartas classificadas
corretamente), a pessoa vê um pop-up com o micro-texto pedagógico daquela
categoria — o conteúdo educativo central do jogo.

**Why this priority**: é o diferencial pedagógico; depende de US1 (só existe
"completar categoria" se o core loop existir), mas é independente de US3.

**Independent Test**: completar uma categoria e confirmar que o micro-texto
exibido corresponde exatamente ao da categoria completada (conferível contra
o pool de conteúdo em `src/data/categories.json`).

**Acceptance Scenarios**:

1. **Given** a última carta de uma categoria é aceita corretamente, **When**
   o slot fecha, **Then** um pop-up exibe o nome da categoria e seu
   micro-texto, dispensável com toque/clique/Esc.
2. **Given** o pop-up de micro-texto aberto, **When** a pessoa o fecha,
   **Then** o jogo retoma o fluxo normal sem perder o estado do nível.

---

### User Story 3 - Aprender com o erro ao perder o nível (Priority: P3)

Ao perder um nível (movimentos esgotados), a pessoa vê uma dica pedagógica
explicando a distinção entre as categorias que causou os erros, quando o
nível tiver uma configurada.

**Why this priority**: reforça o valor de estudo mesmo na derrota, mas o
jogo já é funcional e pedagogicamente útil sem isso (US1+US2 bastam para o
core loop).

**Independent Test**: perder o Nível 1 esgotando os movimentos e confirmar
que a tela de derrota exibe a `dica_pedagogica` configurada para aquele
nível (ou uma mensagem genérica, se o nível não tiver dica específica).

**Acceptance Scenarios**:

1. **Given** o nível perdido, **When** a tela de derrota aparece, **Then**
   exibe a dica pedagógica do nível (se configurada) e um botão para tentar
   novamente.
2. **Given** um nível sem `dica_pedagogica` configurada, **When** a pessoa
   perde, **Then** uma mensagem genérica de encorajamento é exibida (sem
   erro, sem tela em branco).

### Edge Cases

- Carta arrastada para fora de qualquer slot (solta no vazio do tableau):
  não conta como movimento, carta permanece onde estava.
- Categoria já completa: não aceita mais cartas (não há como uma 4ª carta
  chegar lá, já que `cartas_por_categoria` é o total exato daquela
  categoria no nível).
- Todos os movimentos esgotados exatamente no momento em que a última
  categoria é completada: é vitória, não derrota (checar vitória antes de
  checar derrota).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE carregar um nível a partir de dados
  estruturados (`src/data/levels.json` + `src/data/categories.json`):
  4 categorias, cada uma com um subconjunto fixo de palavras (curadas, não
  sorteadas em tempo de execução nesta versão).
- **FR-002**: O sistema DEVE embaralhar e distribuir todas as cartas do
  nível no tableau, todas viradas para cima (sem cartas ocultas — ao
  contrário do modelo Klondike anterior).
- **FR-003**: O sistema DEVE validar cada movimento de carta para um slot de
  categoria: aceita se `card.categoryId === slot.categoryId`, rejeita
  (carta retorna ao tableau) caso contrário.
- **FR-004**: O sistema DEVE decrementar o contador de movimentos restantes
  a cada tentativa de mover uma carta para um slot de categoria, seja aceita
  ou rejeitada.
- **FR-005**: O sistema DEVE detectar vitória (todas as categorias do nível
  completas) verificando-a antes de detectar derrota.
- **FR-006**: O sistema DEVE detectar derrota (movimentos esgotados com
  categoria(s) incompleta(s)) e exibir a `dica_pedagogica` do nível, ou uma
  mensagem genérica se não houver uma configurada.
- **FR-007**: O sistema DEVE exibir um pop-up com o micro-texto da categoria
  no momento em que ela é completada.
- **FR-008**: O sistema NÃO DEVE exigir criação de conta, login ou conexão
  de rede para jogar.
- **FR-009**: O sistema DEVE carregar os dados de categorias/níveis de
  arquivos separados do código da engine (Princípio III da constituição).
- **FR-010**: O sistema DEVE exibir cada slot de categoria com um rótulo
  genérico (ex.: "Categoria 1") e apenas uma contagem de progresso até que
  ela seja completada; o nome real da categoria só aparece junto com o
  micro-texto no momento da conclusão (ver `research.md`, Decisão 7).

### Key Entities

- **Category (Categoria)**: `id`, `nome`, `eixo`, `microtexto`,
  `confundeCom` (ids de outras categorias usadas como misdirection —
  informação de design de conteúdo, não validada pela engine).
- **Level (Nível)**: `id`, lista de 4 `categoryIds`, `cardsPerCategory`,
  `selectedWords` (palavras curadas por categoria para este nível
  específico), `columns`, `moveLimit`, `hint` opcional.
- **WordCard (Carta)**: `id` (categoria+palavra), `categoryId`, `word`.
  Author cards (`categoryId === "CAT-13"`) podem ter `photoUrl`/`photoCredit`
  (ver `contracts/ui-contract.md`).
- **LevelState (Estado de partida)**: tableau (cartas ainda não
  classificadas), slots de categoria (cartas já aceitas por categoria),
  `movesRemaining`, `status` (`em_andamento` \| `vitoria` \| `derrota`).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: uma pessoa consegue carregar o Nível 1 e completá-lo (vitória)
  classificando as 12 cartas corretamente, sem erro de regra.
- **SC-002**: uma pessoa consegue perder o Nível 1 deliberadamente (erros
  repetidos) e ver a tela de derrota com a dica pedagógica correspondente.
- **SC-003**: 100% dos micro-textos exibidos ao completar uma categoria
  correspondem exatamente ao conteúdo de `categories.json` daquela
  categoria.

## Assumptions

- Escopo desta feature é **apenas o Nível 1** (CAT-13, CAT-06, CAT-11,
  CAT-07; 3 cartas por categoria; limite de movimentos "folgado" definido
  como 24). Os demais níveis de exemplo do design (5, 12, 20, 30) e o
  restante do pool de 14 categorias ficam como dados de conteúdo já
  cadastrados (para reuso futuro), mas **não jogáveis** nesta versão — ver
  `data-model.md`.
- O mecanismo de desbloqueio progressivo dos 11 princípios do Código de
  Ética (presente na v1/Klondike) **não é retomado** nesta versão — o design
  fornecido pelo mantenedor não o menciona; o payoff pedagógico agora é o
  micro-texto por categoria. Se for desejado depois, os dados de
  `principles.json` continuam no repositório e podem ser reintegrados.
- Sem sorteio aleatório de palavras do pool por partida nesta versão — cada
  nível usa um subconjunto fixo e curado (`selectedWords`), não uma amostra
  aleatória do pool completo. Sorteio fica para uma versão futura (ver
  `research.md`).
- Mesmas suposições de plataforma da v1: navegador moderno, desktop e
  mobile, sem build step, sem backend.
