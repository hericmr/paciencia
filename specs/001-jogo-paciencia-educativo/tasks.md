# Tasks: Jogo de Paciência Educativo — MVP Web

**Input**: Design documents from `/specs/001-jogo-paciencia-educativo/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/ui-contract.md

**Tests**: incluídos — a constituição do projeto (Princípio VI) exige testes
automatizados para a lógica de jogo pura (`src/engine/`, `src/progress/`).
UI/render não são testados automaticamente.

**Organization**: tarefas agrupadas por user story (US1–US5, ver spec.md),
permitindo implementar e validar cada uma de forma independente.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: pode rodar em paralelo (arquivos diferentes, sem dependência)
- **[Story]**: a qual user story a tarefa pertence

## Path Conventions

Projeto único (frontend estático), conforme `plan.md`: `src/`, `tests/`, `index.html`
na raiz do repositório.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: estrutura inicial do projeto e dados do baralho de estreia

- [x] T001 Criar estrutura de diretórios conforme `plan.md`: `src/engine/`,
      `src/data/`, `src/progress/`, `src/ui/`, `src/styles/`, `tests/engine/`,
      `tests/progress/`
- [x] T002 [P] Criar `package.json` mínimo (`"type": "module"`, sem
      dependências) só para nomear o projeto e documentar `scripts.test`
      (`node --test tests/`)
- [x] T003 [P] Popular `src/data/cards.servico-social-estreia.json` com as 52
      cartas transcritas de `CONTEUDO_CARTAS.md`, cada uma com
      `status: "rascunho"` (conforme FR-010/FR-011 e o esquema em
      `contracts/ui-contract.md`)
- [x] T004 [P] Popular `src/data/principles.json` com os 11 princípios
      transcritos de `CONTEUDO_CARTAS.md` (campos `order`, `summary`,
      `fullText`) — nota: texto integral (`fullText`) do princípio 11 tem
      ressalva pendente de conferência final (ver T034)
- [x] T005 [P] Criar `index.html` base carregando `src/main.js` como módulo
      ES e `src/styles/main.css`

**Checkpoint**: dados e esqueleto do projeto prontos; nenhuma user story
depende de mais nada além disso para começar.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: infraestrutura mínima que TODAS as user stories usam

**⚠️ CRITICAL**: nenhuma user story pode começar antes desta fase terminar

- [x] T006 Implementar carregamento de dados em `src/data/loader.js`
      (`fetch` + parse de `cards.servico-social-estreia.json` e
      `principles.json`, validando contra o esquema de `contracts/ui-contract.md`)
      — implementado e com validação (`validateDeck`/`validatePrinciples`);
      ainda SEM teste automatizado dedicado (`loader.test.js` não existe)
- [x] T007 [P] Implementar `src/engine/deck.js`: construção do baralho de 52
      cartas a partir dos dados carregados + embaralhamento (Fisher–Yates)
- [x] T008 [P] Implementar `src/progress/store.js`: leitura/escrita em
      `localStorage` sob a chave `paciencia_ss.progress.v1`, com fallback em
      memória se indisponível (Decisão 4 de `research.md`) — implementado
      com API `revealCard`/`isRevealed`/`incrementFoundationsCompleted`;
      ainda SEM teste automatizado dedicado (ver T018/T028)

**Checkpoint**: fundação pronta — as user stories podem começar.

---

## Phase 3: User Story 1 - Jogar uma partida completa de paciência (Priority: P1) 🎯 MVP

**Goal**: motor de jogo Klondike completo e jogável na tela, sem depender de
nenhum conteúdo educativo.

**Independent Test**: abrir o jogo, jogar uma partida do início à vitória ou
derrota, sem nenhum texto educativo implementado (ver spec.md, US1).

### Tests for User Story 1 ⚠️

> Escrever estes testes PRIMEIRO; devem falhar antes da implementação.

- [x] T009 [P] [US1] `tests/engine/deck.test.js`: embaralhar produz 52 cartas
      únicas, 13 por naipe, sem duplicatas — 5 testes, todos passando
      (`node --test tests/`)
- [x] T010 [P] [US1] `tests/engine/rules.test.js`: valida movimentos
      corretos/incorretos no tableau (alternância de cor, sequência
      descendente) e nas fundações (mesmo naipe, sequência ascendente A→K)
      — 11 testes, todos passando
- [x] T011 [P] [US1] `tests/engine/win.test.js`: detecta vitória (4 fundações
      completas) e estado sem-jogadas-possíveis — 8 testes, todos passando

### Implementation for User Story 1

- [x] T012 [US1] Implementar `src/engine/rules.js` (validação de movimentos;
      depende de T007)
- [x] T013 [US1] Implementar `src/engine/win.js` (detecção de
      vitória/travamento; depende de T012) — heurística documentada no
      próprio arquivo: só considera "sem jogadas" quando monte E descarte
      estão vazios (ver comentário em win.js)
- [ ] T014 [US1] Implementar `src/ui/board.js`: renderização inicial do
      tableau/monte/descarte/fundações e distribuição das cartas — **PRÓXIMO
      PASSO, ainda não iniciado**
- [ ] T015 [US1] Implementar interação de mover carta em `src/ui/board.js`
      (mouse drag-and-drop; toque é tratado em T032/FR-012) chamando
      `rules.js` para validar cada jogada
- [ ] T016 [US1] Implementar `src/styles/main.css`: layout responsivo básico
      do tableau (FR-013), sem quebra a partir de ~360px de largura — arquivo
      ainda não existe (referenciado por `index.html`, mas 404 até ser criado)
- [ ] T017 [US1] Implementar `src/main.js`: botão "Nova partida", liga
      `deck.js` + `rules.js` + `win.js` + `board.js`, exibe tela de
      vitória/derrota (FR-003) — arquivo ainda não existe (referenciado por
      `index.html`, mas 404 até ser criado)

**Checkpoint**: US1 completa e jogável de forma independente.

---

## Phase 4: User Story 2 - Descobrir o conteúdo educativo ao revelar uma carta (Priority: P2)

**Goal**: pop-up de conteúdo educativo na primeira revelação de cada carta.

**Independent Test**: revelar uma carta nunca vista e conferir que o pop-up
mostra o texto correto; revelar de novo em partida futura não repete o pop-up.

### Tests for User Story 2 ⚠️

- [ ] T018 [P] [US2] `tests/progress/store.test.js`: `isFirstReveal(cardId)`
      retorna `true` uma única vez por carta e `false` depois; funciona com
      fallback em memória quando `localStorage` está indisponível

### Implementation for User Story 2

- [ ] T019 [US2] Estender `src/progress/store.js` com
      `markRevealed(cardId)` / `isFirstReveal(cardId)` (depende de T008)
- [ ] T020 [US2] Implementar `src/ui/reveal-popup.js`: pop-up acessível
      (foco automático ao abrir, `Esc` fecha, devolve foco ao fechar,
      `aria-label`), aplicando o placeholder de FR-011 quando
      `status !== "publicado"` em build de produção
- [ ] T021 [US2] Ligar o evento de virar carta em `src/ui/board.js` a
      `progress/store.isFirstReveal` + `reveal-popup.js` (depende de T014,
      T019, T020)

**Checkpoint**: US1 + US2 funcionam juntas de forma independente.

---

## Phase 5: User Story 3 - Desbloquear princípios do Código de Ética (Priority: P3)

**Goal**: cada fundação completada desbloqueia o próximo princípio (ordem
fixa 1→11), independente do naipe.

**Independent Test**: completar uma fundação e conferir que o princípio nº 1
é desbloqueado; repetir e conferir avanço sequencial (ver spec.md, US3).

### Tests for User Story 3 ⚠️

- [ ] T022 [P] [US3] `tests/engine/principles.test.js`: função pura
      `computeUnlockedPrinciples(foundationsCompletedCount)` retorna sempre
      um prefixo contíguo `[1..min(11, N)]`, sem duplicar nem pular

### Implementation for User Story 3

- [ ] T023 [US3] Implementar `src/engine/principles.js` (função pura acima)
- [ ] T024 [US3] Estender `src/progress/store.js` com
      `foundationsCompletedCount` e recomputar princípios desbloqueados a
      cada incremento (depende de T008, T023)
- [ ] T025 [US3] Ligar evento de fundação completa em `src/ui/board.js` a
      `progress/store` + notificação visual simples de novo princípio
      desbloqueado (depende de T013, T024)

**Checkpoint**: US1+US2+US3 funcionam juntas de forma independente.

---

## Phase 6: User Story 4 - Modo revisão (flashcards por naipe) (Priority: P4)

**Goal**: navegação fora da partida pelas 52 cartas agrupadas por naipe,
mostrando reveladas com conteúdo e não-reveladas como viradas.

**Independent Test**: com um subconjunto de cartas marcado como revelado,
abrir o modo revisão e conferir agrupamento e bloqueio corretos (ver spec.md, US4).

### Implementation for User Story 4

- [ ] T026 [US4] Implementar `src/ui/review-mode.js`: navegação por naipe,
      renderizando cada carta como revelada (conteúdo completo) ou virada
      (bloqueada), consultando `progress/store` (depende de T006, T019)
- [ ] T027 [US4] Adicionar ponto de entrada em `src/main.js` para abrir o
      modo revisão a partir da tela principal (depende de T017, T026)

**Checkpoint**: US1–US4 funcionam juntas de forma independente.

---

## Phase 7: User Story 5 - Progresso persistente entre sessões (Priority: P5)

**Goal**: cartas reveladas e princípios desbloqueados sobrevivem a recarregar
a página.

**Independent Test**: revelar cartas e completar uma fundação, recarregar a
página, conferir que o progresso persiste (ver spec.md, US5).

### Tests for User Story 5 ⚠️

- [ ] T028 [P] [US5] `tests/progress/store.test.js`: uma nova instância do
      store, criada após "recarregar" (reconstrução do módulo), recupera o
      mesmo estado gravado anteriormente em `localStorage`

### Implementation for User Story 5

- [ ] T029 [US5] Revisar `src/progress/store.js` para garantir
      serialização/hidratação completa sob a chave versionada
      `paciencia_ss.progress.v1` na inicialização (depende de T008, T019, T024)

**Checkpoint**: todas as 5 user stories funcionam de forma independente.

---

## Phase 8: Polish & Cross-Cutting Concerns

- [ ] T030 [P] Implementar toque simples (tap-to-move) como alternativa ao
      drag-and-drop em `src/ui/board.js` (FR-012)
- [ ] T031 [P] Passe de acessibilidade em todo `src/ui/`: navegação por
      teclado, `aria-label` em cartas, contraste AA, nenhuma informação só
      por cor (conforme `contracts/ui-contract.md`)
- [ ] T032 [P] Passe de responsividade/mobile: validar em ~360px de largura
      sem quebra de layout, áreas de toque ≥44×44px (FR-013)
- [ ] T033 Rodar `quickstart.md` do início ao fim: servir localmente,
      `node --test tests/`, partida manual completa
- [ ] T034 [P] Revisar conteúdo transcrito (T003/T004) contra
      `CONTEUDO_CARTAS.md` linha a linha, incluindo os pendentes já
      sinalizados lá (redação dos 11 princípios contra Res. CFESS 273/93,
      artigos citados)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sem dependências, pode começar imediatamente
- **Foundational (Phase 2)**: depende do Setup — bloqueia todas as user stories
- **User Stories (Phase 3–7)**: todas dependem da Fase 2 completa
  - Podem prosseguir em paralelo ou em ordem de prioridade (P1→P2→P3→P4→P5)
- **Polish (Phase 8)**: depende das user stories desejadas estarem completas

### User Story Dependencies

- **US1 (P1)**: sem dependência de outras stories
- **US2 (P2)**: usa `board.js` de US1 (evento de virar carta) e `store.js`
  da Fase 2, mas é testável isoladamente com um mock de revelação
- **US3 (P3)**: usa `board.js`/`win.js` de US1 (evento de fundação completa),
  testável isoladamente via `computeUnlockedPrinciples` puro
- **US4 (P4)**: usa `progress/store.js` (US2/Fase 2) para saber o que exibir,
  mas a lógica de agrupamento por naipe é independente
- **US5 (P5)**: reforça/valida o que já foi implementado incrementalmente em
  `store.js` nas fases 2, 4 e 5

### Parallel Opportunities

- T002–T005 (Setup) em paralelo
- T007–T008 (Foundational) em paralelo
- T009–T011 (testes de US1) em paralelo entre si
- T030–T032 (Polish) em paralelo entre si

---

## Implementation Strategy

### MVP First (User Story 1 apenas)

1. Completar Phase 1 (Setup) e Phase 2 (Foundational)
2. Completar Phase 3 (US1)
3. **PARAR e VALIDAR**: jogar uma partida completa manualmente
4. Esse é o primeiro incremento demonstrável (paciência jogável, sem
   conteúdo educativo ainda)

### Entrega Incremental

1. Setup + Foundational → base pronta
2. US1 → validar → demo (motor de jogo funcionando)
3. US2 → validar → demo (conteúdo educativo aparece)
4. US3 → validar → demo (progressão de princípios)
5. US4 → validar → demo (modo revisão)
6. US5 → validar → demo (persistência entre sessões)
7. Phase 8 (Polish) → acessibilidade, mobile, revisão de conteúdo

## Notes

- [P] = arquivos diferentes, sem dependência entre si
- Escrever os testes de cada user story e confirmar que falham antes de
  implementar
- Fazer commit após cada tarefa ou grupo lógico de tarefas
- Parar em cada checkpoint para validar a story isoladamente antes de seguir
