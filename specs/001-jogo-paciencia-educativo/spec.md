# Feature Specification: Jogo de Paciência Educativo — MVP Web

**Feature Branch**: `001-jogo-paciencia-educativo`

**Created**: 2026-07-06

**Status**: Draft

**Input**: User description: "jogo de paciencia educativo sobre servico social brasileiro, MVP web"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Jogar uma partida completa de paciência (Priority: P1)

Uma pessoa abre o jogo no navegador e joga uma partida de paciência (estilo Klondike:
tableau, monte, descarte, quatro fundações por naipe) usando o baralho temático de
52 cartas, sem precisar instalar nada ou criar conta.

**Why this priority**: é o motor do produto — sem uma partida de paciência
jogável e satisfatória, não há veículo para o conteúdo educativo. Precisa
funcionar de forma independente de qualquer conteúdo educativo estar "pronto".

**Independent Test**: abrir o jogo, embaralhar, mover cartas entre tableau e
fundações seguindo as regras clássicas, e conseguir vencer (todas as 52 cartas
nas 4 fundações, em ordem A→K por naipe) ou perder (sem jogadas válidas
restantes). Testável sem nenhum texto educativo implementado.

**Acceptance Scenarios**:

1. **Given** o jogo recém-carregado, **When** a pessoa clica em "Nova partida",
   **Then** o baralho de 52 cartas é embaralhado e distribuído no tableau, monte
   e fundações vazias, seguindo o layout clássico do Klondike.
2. **Given** uma partida em andamento, **When** a pessoa move uma carta para uma
   fundação onde ela é a próxima carta válida da sequência (A, 2, 3… do mesmo
   naipe), **Then** a carta é aceita na fundação e removida de sua posição
   anterior.
3. **Given** uma partida em andamento, **When** a pessoa tenta uma jogada
   inválida (ex.: carta fora de sequência ou naipe errado), **Then** a jogada é
   rejeitada e a carta retorna à posição original.
4. **Given** as 4 fundações completas (A→K em cada naipe), **When** a última
   carta é posicionada, **Then** o jogo exibe uma tela de vitória.

---

### User Story 2 - Descobrir o conteúdo educativo ao revelar uma carta (Priority: P2)

Ao virar/revelar uma carta pela primeira vez em qualquer partida, a pessoa vê um
pop-up discreto e dispensável com o título e o micro-texto educativo daquela
carta (conceito, autor/a ou marco histórico do Serviço Social).

**Why this priority**: é o diferencial pedagógico do jogo frente a uma paciência
comum; depende do motor de jogo (US1) já existir, mas é independente do modo
revisão (US4).

**Independent Test**: jogar uma partida, revelar uma carta ainda não vista, e
confirmar que o pop-up aparece com o texto correspondente àquela carta
específica (conferível contra `CONTEUDO_CARTAS.md`); revelar a mesma carta de
novo (em partida futura) não deve reexibir o pop-up.

**Acceptance Scenarios**:

1. **Given** uma carta nunca antes revelada em nenhuma partida, **When** ela é
   virada para cima pela primeira vez, **Then** um pop-up exibe o título e o
   micro-texto daquela carta, dispensável com um toque/clique.
2. **Given** uma carta já revelada em uma partida anterior, **When** ela é
   virada novamente em uma nova partida, **Then** nenhum pop-up é exibido.
3. **Given** um pop-up de conteúdo aberto, **When** a pessoa toca/clica fora
   dele ou em "fechar", **Then** o jogo retoma o fluxo normal sem perder o
   estado da partida.

---

### User Story 3 - Desbloquear os princípios do Código de Ética ao completar fundações (Priority: P3)

Cada fundação (naipe) completada desbloqueia, em ordem, o próximo princípio
ainda não visto entre os 11 princípios fundamentais do Código de Ética de 1993.

**Why this priority**: é a camada de progressão/recompensa de longo prazo que dá
sentido a jogar múltiplas partidas, mas depende de US1 (fundações) e não bloqueia
o lançamento do core loop.

**Independent Test**: completar uma fundação em uma partida e confirmar que o
próximo princípio da lista ordenada (1 a 11) é desbloqueado e fica acessível no
modo revisão, mesmo que a partida termine antes da vitória final.

**Acceptance Scenarios**:

1. **Given** nenhum princípio desbloqueado ainda, **When** a primeira fundação de
   qualquer naipe é completada em qualquer partida, **Then** o princípio nº 1 é
   marcado como desbloqueado permanentemente.
2. **Given** N fundações já completadas ao longo do histórico de partidas,
   **When** uma nova fundação é completada, **Then** o próximo princípio ainda
   não desbloqueado (N+1) é liberado — a ordem de desbloqueio é sempre 1→11,
   independente de qual naipe foi completado.
3. **Given** os 11 princípios já desbloqueados, **When** uma fundação adicional é
   completada, **Then** nenhum novo desbloqueio ocorre (não há efeito colateral
   nem erro).

---

### User Story 4 - Explorar o conteúdo no modo revisão (Priority: P4)

A pessoa acessa um modo revisão fora da partida, navega as cartas organizadas por
naipe como flashcards, vendo o conteúdo das cartas já reveladas e as ainda não
reveladas como "viradas" (ocultas), como incentivo a jogar mais partidas.

**Why this priority**: reforça o valor de estudo do jogo e a mecânica de
colecionismo, mas é dispensável para uma primeira demonstração do core loop.

**Independent Test**: com um subconjunto de cartas já revelado (via localStorage
de teste), abrir o modo revisão e confirmar que cartas reveladas mostram seu
conteúdo completo e cartas não reveladas aparecem viradas/bloqueadas, agrupadas
corretamente por naipe.

**Acceptance Scenarios**:

1. **Given** o modo revisão aberto, **When** a pessoa seleciona um naipe,
   **Then** vê as 13 cartas daquele naipe em ordem (A a K).
2. **Given** uma carta já revelada em alguma partida, **When** exibida no modo
   revisão, **Then** mostra título e micro-texto completos.
3. **Given** uma carta nunca revelada, **When** exibida no modo revisão,
   **Then** aparece visualmente "virada", sem revelar o texto.

---

### User Story 5 - Progresso persistente entre sessões (Priority: P5)

O progresso da pessoa (cartas já reveladas, princípios desbloqueados) é salvo
localmente no navegador e recuperado ao reabrir o jogo, sem exigir login.

**Why this priority**: sem isso, US2/US3/US4 perdem sentido entre sessões, mas o
core loop de uma única partida (US1) funciona sem persistência.

**Independent Test**: revelar cartas e completar uma fundação, fechar a aba,
reabrir o jogo, e confirmar que as cartas continuam marcadas como reveladas e os
princípios desbloqueados continuam visíveis no modo revisão.

**Acceptance Scenarios**:

1. **Given** progresso registrado nesta sessão, **When** a página é recarregada,
   **Then** o mesmo progresso (cartas reveladas, princípios desbloqueados)
   persiste.
2. **Given** um navegador sem suporte a armazenamento local ou com armazenamento
   bloqueado, **When** o jogo carrega, **Then** o core loop de uma partida (US1)
   continua funcionando, apenas sem persistir progresso entre sessões.

### Edge Cases

- O que acontece se o mesmo dispositivo/navegador for usado por múltiplas
  pessoas (progresso compartilhado por navegador, não há contas)? Assumido como
  aceitável para o MVP (ver Assumptions).
- Como o jogo se comporta se não houver jogadas válidas restantes, mas o baralho
  ainda não estiver vencido (partida travada)? Deve oferecer detecção de "sem
  jogadas possíveis" e permitir reiniciar.
- Carta com conteúdo marcado como `rascunho`/`revisado` no momento do build de
  produção: exibe placeholder genérico em vez do micro-texto real (FR-011),
  permanecendo jogável normalmente.
- Redimensionamento de tela/orientação (mobile retrato vs. desktop) não pode
  quebrar o layout do tableau.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE implementar as regras clássicas de paciência
  Klondike (tableau de 7 colunas, monte/estoque, descarte, 4 fundações por
  naipe) com o baralho temático de 52 cartas.
- **FR-002**: O sistema DEVE validar cada movimento de carta contra as regras de
  Klondike antes de aceitá-lo (sequência alternada de cor no tableau, sequência
  ascendente do mesmo naipe nas fundações).
- **FR-003**: O sistema DEVE detectar e sinalizar vitória (52 cartas nas
  fundações) e estado sem jogadas possíveis.
- **FR-004**: O sistema DEVE exibir um pop-up com título e micro-texto da carta
  na primeira vez que ela for revelada (virada para cima) em qualquer partida.
- **FR-005**: O sistema DEVE registrar permanentemente quais cartas já foram
  reveladas ao menos uma vez, para não repetir o pop-up nem esconder o conteúdo
  no modo revisão.
- **FR-006**: O sistema DEVE desbloquear, em ordem fixa de 1 a 11, o próximo
  princípio do Código de Ética ainda não desbloqueado a cada fundação completada
  (independente de qual naipe).
- **FR-007**: O sistema DEVE oferecer um modo revisão navegável por naipe,
  mostrando cartas reveladas com conteúdo completo e cartas não reveladas como
  bloqueadas/viradas.
- **FR-008**: O sistema DEVE persistir localmente (armazenamento do navegador)
  o conjunto de cartas reveladas e princípios desbloqueados, recuperando-os ao
  recarregar a página.
- **FR-009**: O sistema NÃO DEVE exigir criação de conta, login ou conexão de
  rede para jogar uma partida e usar o modo revisão.
- **FR-010**: O sistema DEVE carregar os dados das cartas (textos, naipes,
  princípios) de um arquivo de dados separado do código da engine, conforme
  Princípio III da constituição do projeto.
- **FR-011**: Em builds de produção, o sistema DEVE substituir o micro-texto de
  qualquer carta cujo status seja `rascunho` ou `revisado` (ainda não
  `publicado`) por um texto placeholder genérico ("conteúdo em revisão"). A
  carta em si NUNCA é removida do baralho de 52 cartas nem do fluxo de jogo —
  apenas seu texto educativo é ocultado — para não quebrar as regras do
  Klondike (que exigem as 52 cartas). Builds de desenvolvimento exibem o texto
  real independentemente do status.
- **FR-012**: Em telas de toque, o sistema DEVE oferecer, além de arrastar
  (drag-and-drop), uma forma alternativa de mover carta por toque simples
  (tap): tocar em uma carta elegível tenta movê-la automaticamente para a
  fundação ou coluna de destino válida mais óbvia, seguindo as mesmas regras
  de validação de FR-002. Isso reduz a dependência de precisão de arrasto em
  telas pequenas.
- **FR-013**: O layout DEVE se adaptar responsivamente a telas a partir de
  ~360px de largura até desktop, sem sobreposição ou corte de colunas do
  tableau (ver SC-004), com áreas de toque de cartas grandes o suficiente para
  interação por dedo (não apenas cursor de precisão de mouse).

### Key Entities

- **Card (Carta)**: uma das 52 cartas do baralho temático. Atributos: naipe
  (espadas/copas/ouros/paus), valor (A–K), título, micro-texto, status de
  revisão de conteúdo (rascunho/revisado/publicado), flag "já revelada".
- **Suit (Naipe)**: agrupamento de 13 cartas correspondente a um eixo temático
  (teórico-metodológico, ético-político, técnico-operativo,
  histórico-formativo); tem uma Foundation associada.
- **Foundation (Fundação)**: pilha de destino de um naipe no jogo de paciência;
  estado: quantidade de cartas acumuladas (0–13) e se está completa.
- **Principle (Princípio)**: um dos 11 princípios fundamentais do Código de
  Ética de 1993; tem ordem fixa de desbloqueio e texto resumido + texto
  integral (modo revisão).
- **GameState (Estado de partida)**: configuração momentânea de uma partida em
  andamento — posições das cartas no tableau, monte, descarte e fundações; não
  persiste entre sessões (apenas o progresso educativo persiste).
- **ProgressStore (Progresso do jogador)**: dados persistidos localmente —
  conjunto de cartas já reveladas e princípios já desbloqueados.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: uma pessoa consegue iniciar e completar uma partida inteira de
  paciência (vitória ou derrota detectada corretamente) sem nenhum erro de
  regra, em qualquer navegador desktop moderno testado.
- **SC-002**: 100% das cartas reveladas pela primeira vez exibem o micro-texto
  correto correspondente (validável comparando com `CONTEUDO_CARTAS.md`).
- **SC-003**: o progresso educativo (cartas reveladas, princípios
  desbloqueados) sobrevive a um recarregamento de página em pelo menos 95% dos
  casos em navegadores modernos com armazenamento local habilitado.
- **SC-004**: o jogo carrega e é jogável em uma tela de celular comum (largura
  ~360px) sem quebra de layout do tableau.
- **SC-005**: uma pessoa sem nenhuma instrução consegue, em até 2 minutos,
  iniciar uma partida e revelar ao menos uma carta com pop-up educativo (teste
  informal de usabilidade).

## Assumptions

- Escopo v1 é single-player, sem contas, sem leaderboard, sem multiplayer.
- Compartilhamento de progresso entre dispositivos está fora de escopo do MVP
  (progresso vive no armazenamento local do navegador usado).
- "Navegador moderno" significa as últimas duas versões de Chrome, Firefox,
  Safari e Edge, em desktop e mobile.
- O conteúdo usado durante o desenvolvimento do MVP pode incluir cartas em
  status `rascunho`; a exclusão de conteúdo não revisado (FR-011) é aplicada
  apenas em builds de produção/lançamento público, não durante o
  desenvolvimento.
- Não há requisito de suporte offline via Service Worker no MVP (pode ser uma
  expansão futura).
- Apenas o baralho descrito em `CONTEUDO_CARTAS.md` (deck de estreia) está no
  escopo deste spec; os decks de expansão (SUAS aprofundado, Seguridade Social,
  ECA) são features futuras separadas.
