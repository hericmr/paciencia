# Implementation Plan: Jogo de Categorias e Associações — MVP Nível 1

**Branch**: `002-jogo-categorias-associacoes` | **Date**: 2026-07-06 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-jogo-categorias-associacoes/spec.md`

## Summary

Substitui o jogo de paciência Klondike (feature 001) por um jogo de
classificação por categorias (estilo "Solitaire Associations"/Connections):
cartas de palavras soltas, visíveis desde o início, que a pessoa arrasta
para 1 de 4 slots de categoria. Cada movimento (certo ou errado) consome um
limite de movimentos do nível; vence completando as 4 categorias antes de
esgotar os movimentos. Ao completar uma categoria, revela seu micro-texto
pedagógico. MVP cobre só o Nível 1.

## Technical Context

**Language/Version**: JavaScript (ES2022+), ES Modules nativos — sem
bundler, sem TypeScript compilado (mesma decisão da v1, ver
`specs/001-jogo-paciencia-educativo/research.md`, Decisão 1).

**Primary Dependencies**: nenhuma dependência de runtime. Node.js só para
testes (`node --test`).

**Storage**: `localStorage` (progresso: categorias já vistas/microtextos
lidos, níveis completados), com fallback em memória — reaproveita
`src/progress/store.js` da v1 quase sem mudança.

**Testing**: `node --test` + `node:assert/strict`, zero dependências.

**Target Platform**: navegadores modernos, desktop e mobile web, site
estático.

**Project Type**: aplicação web estática de página única (sem mudança da
v1).

**Performance Goals**: mesmas da v1 — interação percebida como instantânea,
carregamento < 1s em banda larga típica.

**Constraints**: sem build step; sem backend.

**Scale/Scope**: 1 nível jogável (12 cartas, 4 categorias) nesta feature;
14 categorias de conteúdo e mais 4 níveis de exemplo ficam cadastrados como
dados para features futuras, não jogáveis ainda.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio | Avaliação |
|---|---|
| I. Rigor conceitual do conteúdo | ✅ Micro-textos e pegadinhas (`confundeCom`) vêm do documento fornecido pelo mantenedor; pendências de checagem de artigos de lei ficam listadas em `data-model.md` como TODOs, mesmo padrão da v1. |
| II. Zero fricção de acesso | ✅ Site estático, sem conta, sem build. |
| III. Conteúdo e engine desacoplados | ✅ `categories.json`/`levels.json` são dados puros; a engine (`src/engine/`) só enxerga `categoryId`/`word`/contadores, nunca `microtexto`/`hint`. |
| IV. Simplicidade sobre generalidade prematura | ✅ Sem sorteio aleatório de palavras nem níveis extras nesta versão — implementa só o que o Nível 1 precisa; níveis 5/12/20/30 ficam como dados sem código extra que os use ainda. |
| V. Acessibilidade e linguagem inclusiva | ✅ Mesmo contrato de UI da v1 (teclado, aria-label, contraste), adaptado a "slot de categoria" em vez de "fundação". |
| VI. Testabilidade do essencial | ✅ Lógica pura (`src/engine/`): validação de movimento, contagem de movimentos, vitória/derrota — testável sem DOM. |

Nenhuma violação — "Complexity Tracking" não se aplica.

## Project Structure

### Documentation (this feature)

```text
specs/002-jogo-categorias-associacoes/
├── plan.md              # Este arquivo
├── research.md          # Fase 0: decisões técnicas
├── data-model.md        # Fase 1: entidades e esquema de dados
├── quickstart.md        # Fase 1: como rodar localmente
├── contracts/
│   └── ui-contract.md   # Fase 1: contrato de UI/acessibilidade e esquema JSON
└── tasks.md             # Gerado por /speckit-tasks
```

### Source Code (repository root)

```text
index.html                      # Ponto de entrada (reaproveitado da v1)
src/
├── main.js                      # Reescrito para o novo game loop
├── engine/
│   ├── level.js                  # Constrói o LevelState a partir de Level+Category (substitui deck.js)
│   ├── associations-rules.js     # canPlaceInCategory (substitui rules.js)
│   └── level-status.js           # checkLevelWin/checkLevelLoss (substitui win.js)
├── data/
│   ├── categories.json            # 14 categorias (pools completos, microtexto, confundeCom)
│   ├── levels.json                # Nível 1 (jogável) — outros níveis ficam para depois
│   └── loader.js                  # Reescrito: carrega categories.json + levels.json
├── progress/
│   └── store.js                   # Reaproveitado quase sem mudança
├── audio/
│   └── sound-manager.js           # Feedback sonoro (ver research.md, Decisão 9)
├── ui/
│   ├── level-board.js             # Substitui board.js: tableau + slots de categoria
│   ├── category-complete-popup.js # Substitui reveal-popup.js
│   └── review-mode.js             # Adaptado: navega categorias em vez de temas
└── styles/
    └── main.css                    # Adaptado: slots de categoria em vez de fundações/tableau Klondike

tests/
└── engine/
    ├── level.test.js
    ├── associations-rules.test.js
    └── level-status.test.js
```

**Structure Decision**: mesma decisão de projeto único estático da v1.
Arquivos Klondike-específicos (`deck.js` rank/shuffle-de-52, `rules.js`
alternância de cor, `win.js` fundação-por-tema, `board.js` tableau de 7
colunas com cartas ocultas) são removidos — não fazem sentido no novo
modelo (sem ocultação de carta, sem noção de "empilhar"). `progress/store.js`
é o único módulo relevante que atravessa as duas versões quase sem mudança.

## Complexity Tracking

*Não aplicável — nenhuma violação da Constitution Check acima.*
