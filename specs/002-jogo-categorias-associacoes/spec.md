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

Uma pessoa abre o jogo e vê colunas de cartas empilhadas (com cartas viradas para baixo, e apenas as do topo visíveis) e 4 slots de categoria vazios/trancados (spots). Entre as cartas no tabuleiro, estão misturadas e embaralhadas as cartas-título de todas as categorias do nível (ex: 7 categorias no Nível 1). A pessoa arrasta uma carta-título revelada para qualquer um dos 4 spots vazios para associá-lo àquela categoria e abri-lo. Em seguida, ela arrasta as cartas de palavra correspondentes para o spot aberto. Cada movimento (certo ou errado) consome uma unidade do limite de movimentos. Ela vence se preencher e completar todas as categorias do nível antes de esgotar os movimentos (liberando slots completos para abrir novas categorias).

**Why this priority**: é o motor do produto — sem essa mecânica de classificação com risco (movimentos limitados), não há jogo. Precisa funcionar de forma independente do conteúdo pedagógico estar polido.

**Independent Test**: carregar o Nível 1 (7 categorias configuradas, distribuídas em 4 colunas de forma embaralhada), abrir spots com cartas-título, classificar as palavras corretamente nestes spots até completar todas as 7 categorias (reciclando os spots à medida que são finalizados) e confirmar vitória; em uma segunda partida, errar movimentos até esgotar o limite e confirmar derrota.

**Acceptance Scenarios**:

1. **Given** o Nível 1 carregado, **When** a pessoa arrasta uma carta-título do topo de uma coluna para um dos 4 spots vazios, **Then** o spot é associado a essa categoria, a carta-título é depositada no fundo do spot, e o contador de movimentos diminui em 1.
2. **Given** um spot aberto para a Categoria A, **When** a pessoa arrasta uma carta de palavra da Categoria A para ele, **Then** a carta é aceita no spot (empilhada sobre a carta-título), some da coluna do tableau, e o contador diminui em 1.
3. **Given** um spot aberto para a Categoria A, **When** a pessoa arrasta uma carta de palavra da Categoria B para ele, **Then** a carta retorna ao topo da coluna (rejeição) e o contador NÃO diminui.
4. **Given** um spot com todas as suas cartas corretamente classificadas, **When** a última é aceita, **Then** o spot é marcado como "completo".
5. **Given** todas as categorias do nível completadas, **When** a última categoria é finalizada, **Then** o jogo exibe tela de vitória.
6. **Given** o contador de movimentos chega a 0, **When** ainda resta ao menos uma categoria incompleta, **Then** o jogo exibe tela de derrota.

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
- Spot finalizado: o registro de conclusão (para fins de vitória) persiste
  mesmo depois que o spot é reciclado para uma nova categoria — completar 4
  spots ao longo da partida vence, ainda que cada spot tenha passado por
  mais de uma categoria.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE carregar um nível a partir de dados estruturados (`src/data/levels.json` + `src/data/categories.json`): 4 ou mais categorias, cada uma com um subconjunto fixo de palavras.
- **FR-002**: O sistema DEVE embaralhar e distribuir todas as `totalCards` do nível em colunas empilhadas — só a carta do topo de cada coluna fica virada para cima e é jogável.
- **FR-003**: O sistema DEVE validar cada movimento de cartas entre colunas e slots: (a) carta-título → qualquer spot de categoria fechado: aceita, associa o spot àquela categoria e a abre; (b) carta de palavra → spot de categoria: aceita só se o spot estiver aberto e associado a essa categoria específica (apenas uma carta por vez); (c) carta ou sub-pilha de cartas abertas → topo de outra coluna do tableau: aceita se a coluna destino estiver vazia ou se a carta base da movimentação pertencer à mesma categoria da carta do topo da coluna destino. **IMPORTANTE**: Nenhuma carta ou sub-pilha pode ser empilhada por cima de uma carta-título (carta principal) nas colunas do tableau. Em qualquer caso de rejeição, as cartas permanecem na origem.
- **FR-004**: O sistema DEVE decrementar o contador de movimentos restantes a cada jogada bem-sucedida de mover uma carta (seja para um slot de categoria ou para outra coluna) ou a cada clique no Monte (comprar ou reciclar) que execute uma ação válida. Movimentos inválidos ou rejeitados NÃO DEVEM ser contabilizados/penalizados.
- **FR-011**: O sistema DEVE virar automaticamente para cima a carta que ficar no topo de uma coluna depois que a carta anterior sair dali.
- **FR-012**: O sistema NÃO DEVE aceitar cartas de palavra em uma categoria cuja carta-título ainda não foi jogada e associada a um spot.
- **FR-005**: O sistema DEVE detectar vitória (quando todas as categorias configuradas para o nível forem completadas) verificando-a antes de detectar derrota.
- **FR-006**: O sistema DEVE detectar derrota (movimentos esgotados com ao menos uma categoria incompleta) e exibir a `dica_pedagogica` do nível, ou uma mensagem genérica se não houver uma configurada.
- **FR-015**: O sistema DEVE possuir uma pilha de Monte (Stock) e uma de Descarte (Waste). O Monte armazena cartas viradas para baixo com efeito visual de escadinha (cartas fantasmas) e, ao ser clicado, consome 1 movimento e distribui uma carta para o Descarte, cuja carta do topo é jogável.
- **FR-016**: O sistema DEVE permitir a reciclagem do Descarte (re-empilhamento das cartas) de volta para o Monte quando o Monte estiver vazio, consumindo 1 movimento.
- **FR-007**: O sistema DEVE exibir um pop-up com o micro-texto da categoria no momento em que ela é completada.
- **FR-008**: O sistema NÃO DEVE exigir criação de conta, login ou conexão de rede para jogar.
- **FR-009**: O sistema DEVE carregar os dados de categorias/níveis de arquivos separados do código da engine (Princípio III da constituição).
- **FR-010**: O sistema DEVE exibir cada slot de categoria com um rótulo genérico (ex.: "Categoria 1") e um ícone de formiga estilizada (SVG) no slot de encaixe até que ela seja aberta pela carta-título. Ao abrir, o título da categoria é revelado no cabeçalho superior (etiqueta mostarda com letras verde-escuras) e o slot passa a exibir as cartas fisicamente empilhadas; o micro-texto correspondente só aparece no momento da conclusão.
- **FR-013**: O sistema DEVE tocar um efeito sonoro curto para: carta aceita num slot, carta rejeitada/movida entre colunas, categoria completada, fim de jogo (Game Over) e distribuição inicial das cartas. Nenhuma informação necessária para jogar pode depender só do som.
- **FR-014**: O sistema DEVE oferecer um controle de mudo acessível (alcançável por teclado, com `aria-pressed` refletindo o estado), com o estado persistido entre sessões. Controla tanto efeitos quanto a música de fundo.
- **FR-017**: O sistema DEVE fornecer suporte nativo a toque (touch events) em dispositivos móveis para arrastar e soltar cartas e pilhas, clonando o elemento em tempo de arraste sem latência de CSS e detectando áreas receptoras dinamicamente.
- **FR-018**: O sistema DEVE ocultar os emojis da barra de controles e mantê-la fixa no rodapé do dispositivo em telas de celular (largura de viewport menor que 600px), maximizando a área de jogo vertical e aproximando os botões dos polegares do usuário.
- **FR-019**: O sistema DEVE garantir o efeito escadinha (fanning) legível no tableau: cartas cobertas abaixo de outra na pilha devem ocultar suas fotos e alinhar seu texto ao topo para que a palavra permaneça visível nas abas de 26px (mobile) ou 36px (desktop).
- **FR-020**: Quando um spot de categoria atinge todas as suas `cardsPerCategory` cartas corretas (grupo finalizado), o sistema DEVE liberar aquele spot imediatamente após a jogada que o completou, sem exigir nenhuma ação adicional do jogador, tornando-o disponível para associar a uma nova carta-título. Nenhuma outra coluna, spot ou pilha do tabuleiro pode ser alterada por essa liberação.
- **FR-021**: O sistema DEVE detectar travamento total (deadlock, nenhuma jogada válida disponível no tableau, Monte ou Descarte) e declarar derrota imediatamente com o overlay correspondente.
- **FR-022**: O sistema DEVE carregar e reproduzir uma música ambiente em loop (`musica_ambiente.ogg`) assim que o jogador interagir com o site, com comportamento idempotente.
- **FR-023**: O sistema DEVE utilizar o formato WebP para todas as imagens e miniaturas dos autores para garantir máxima otimização de largura de banda e tempo de resposta.

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
