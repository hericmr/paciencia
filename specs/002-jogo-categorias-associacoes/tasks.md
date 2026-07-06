# Tasks: Jogo de Categorias e Associações — MVP Nível 1

**Input**: Design documents from `/specs/002-jogo-categorias-associacoes/`

**Tests**: incluídos — Princípio VI exige testes para a lógica pura
(`src/engine/`).

## Phase 1: Remover o Klondike, preparar o terreno

- [ ] T001 Remover `src/engine/deck.js`, `src/engine/rules.js`,
      `src/engine/win.js`, `src/engine/principles.js`, `src/ui/board.js`,
      `src/ui/reveal-popup.js` (Klondike-específicos — preservados no
      histórico do git via branch `001-jogo-paciencia-educativo`)
- [ ] T002 Remover `tests/engine/{deck,rules,win,principles}.test.js` e
      `tests/progress/store.test.js` (recriado em T0xx se a API mudar)
- [ ] T003 [P] Popular `src/data/categories.json` com as 14 categorias do
      documento de design (pools completos, microtexto, confundeCom)
- [ ] T004 [P] Popular `src/data/levels.json` com o Nível 1 (CAT-13,
      CAT-06, CAT-11, CAT-07; 3 cartas cada; `selectedWords` curadas;
      `columns: 4`; `moveLimit: 24`; `hint: null`)

## Phase 2: Engine

- [ ] T005 [P] `tests/engine/level.test.js`: `buildLevelCards` gera
      `cardsPerCategory × 4` cartas com ids únicos e `categoryId` corretos;
      `shuffleCards` mantém o mesmo conjunto
- [ ] T006 [P] `tests/engine/associations-rules.test.js`:
      `canPlaceInCategory` aceita só quando `card.categoryId === slotCategoryId`
- [ ] T007 [P] `tests/engine/level-status.test.js`: `checkLevelWin` (todas
      as categorias com `cardsPerCategory` cartas), `checkLevelLoss`
      (`movesRemaining === 0` com categoria incompleta), vitória tem
      prioridade sobre derrota quando ambas as condições calhariam juntas
- [ ] T008 Implementar `src/engine/level.js` (`buildLevelCards`,
      `shuffleCards`, reaproveita Fisher–Yates de forma equivalente ao
      `deck.js` antigo)
- [ ] T009 Implementar `src/engine/associations-rules.js`
      (`canPlaceInCategory`)
- [ ] T010 Implementar `src/engine/level-status.js` (`checkLevelWin`,
      `checkLevelLoss`)

## Phase 3: Dados e loader

- [ ] T011 Reescrever `src/data/loader.js`: `loadCategories`,
      `loadLevels`, validação (4 categoryIds por nível, todos existentes;
      `selectedWords` com `cardsPerCategory` itens válidos; `moveLimit ≥
      cardsPerCategory × 4`)

## Phase 4: UI — User Story 1 (core loop) 🎯 MVP

- [ ] T012 Implementar `src/ui/level-board.js`: renderiza tableau (cartas
      soltas, todas face-up, em `columns` colunas) + 4 slots de categoria
      com rótulo genérico e contador de progresso
- [ ] T013 Implementar drag-and-drop de carta → slot, chamando
      `canPlaceInCategory`; rejeição devolve a carta ao tableau;
      todo movimento decrementa `movesRemaining` (FR-004)
- [ ] T014 Implementar contador de movimentos visível +
      `aria-live="polite"` (contrato de UI)
- [ ] T015 Adaptar `src/styles/main.css`: remover regras Klondike-específicas
      (tableau de colunas empilhadas, fundações por tema, `.is-red`
      remanescente etc.), adicionar estilos de slot de categoria e grade de
      tableau sem empilhamento
- [ ] T016 Reescrever `src/main.js`: carrega categories+levels, monta
      `LevelState` do Nível 1, liga board + engine, telas de vitória/derrota

## Phase 5: UI — User Story 2 (micro-texto ao completar)

- [ ] T017 Implementar `src/ui/category-complete-popup.js` (adaptado de
      `reveal-popup.js`): mostra nome real + microtexto + foto (se
      aplicável) ao completar uma categoria; acessível (foco, Esc)
- [ ] T018 Ligar `level-board.js` ao popup quando uma categoria fecha

## Phase 6: UI — User Story 3 (dica na derrota)

- [ ] T019 Tela de derrota em `main.js` exibindo `level.hint` (ou mensagem
      genérica se `null`) + botão "Tentar novamente"

## Phase 7: Progresso e modo revisão (menor prioridade)

- [ ] T020 Adaptar `src/progress/store.js`: `revealedCategoryIds` /
      `completedLevelIds` (renomear API de `revealCard`/`foundationsCompleted`)
- [ ] T021 Adaptar `src/ui/review-mode.js`: navega categorias (todas as 14,
      não só as do Nível 1), mostra microtexto das já vistas

## Phase 8: Polish

- [ ] T022 [P] Acessibilidade: revisar contra `contracts/ui-contract.md`
      (teclado, aria-label, contraste)
- [ ] T023 [P] Responsividade mobile (grade de 4 colunas em ~360px)
- [ ] T024 Rodar `quickstart.md` + `node --test tests/` + partida manual
      completa (vitória e derrota) no navegador (Playwright ou manual)
- [ ] T025 Atualizar `README`/`CLAUDE.md` apontando para
      `specs/002-jogo-categorias-associacoes/plan.md`

## Notes

- Manter o mesmo princípio da v1: `src/engine/` nunca importa
  `nome`/`microtexto`/`hint`, só `categoryId`/`id`.
- `confundeCom` é só metadado de conteúdo — não vira código de validação
  (research.md, Decisão 6).
- Escopo é só o Nível 1; níveis 5/12/20/30 do documento de design ficam
  cadastrados como dados de `categories.json` reutilizáveis, mas sem
  entrada correspondente em `levels.json` ainda.
