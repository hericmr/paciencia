# Implementation Plan: Jogo de Paciência Educativo — MVP Web

**Branch**: `001-jogo-paciencia-educativo` | **Date**: 2026-07-06 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-jogo-paciencia-educativo/spec.md`

## Summary

Jogo de paciência (Klondike) jogável no navegador, usando um baralho temático de
52 cartas sobre Serviço Social Brasileiro. Ao revelar cartas e completar
fundações, a pessoa desbloqueia micro-conteúdo educativo e, em ordem, os 11
princípios do Código de Ética de 1993. Abordagem técnica: aplicação web
estática, sem build step para produção, sem backend — JavaScript puro (ES
Modules) consumindo dados de cartas em JSON, com progresso salvo em
`localStorage`.

## Technical Context

**Language/Version**: JavaScript (ES2022+), ES Modules nativos do navegador —
sem TypeScript/transpilação. `// @ts-check` + JSDoc opcional para checagem de
tipos em tempo de desenvolvimento (via `tsc --noEmit`, não gera artefato).

**Primary Dependencies**: nenhuma dependência de runtime. Node.js (LTS ≥ 20,
já disponível no ambiente) é usado apenas como ferramenta de desenvolvimento
para rodar testes — não é necessário para servir ou jogar o jogo.

**Storage**: `localStorage` do navegador (cartas reveladas, princípios
desbloqueados). Nenhum banco de dados ou servidor.

**Testing**: test runner nativo do Node.js (`node --test` + `node:assert/strict`),
zero dependências de teste. Cobre a lógica pura do motor de jogo (embaralhar,
validar movimentos, detectar vitória/derrota, ordem de desbloqueio de
princípios).

**Target Platform**: navegadores modernos (últimas 2 versões de Chrome,
Firefox, Safari, Edge), desktop e mobile web. Distribuição como site estático
(ex.: GitHub Pages) — qualquer servidor de arquivos estáticos serve o jogo.

**Project Type**: aplicação web estática de página única (frontend puro, sem
backend).

**Performance Goals**: interações (mover carta, virar carta) devem responder
dentro de um frame de animação (~16 ms, percebido como instantâneo);
carregamento inicial abaixo de 1s em banda larga típica, já que não há bundle
para baixar além de HTML/CSS/JS/JSON pequenos.

**Constraints**: deve funcionar servido por qualquer servidor de arquivos
estáticos, sem passo de build/instalação para rodar (`index.html` + módulos
JS direto); sem suporte offline obrigatório no MVP (Service Worker fica para
expansão futura).

**Scale/Scope**: um único deck (52 cartas + 11 princípios) no MVP; arquitetura
de dados já preparada para múltiplos decks futuros (ver `data-model.md`), mas
apenas um é carregado nesta feature.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio | Avaliação |
|---|---|
| I. Rigor conceitual do conteúdo | ✅ Conforme — `status` por carta (rascunho/revisado/publicado) é parte do modelo de dados (FR-010, FR-011); nenhum texto entra sem esse campo. |
| II. Zero fricção de acesso | ✅ Conforme — site estático, sem conta, sem build para jogar, `localStorage` opcional (degrada graciosamente, FR-009/US5). |
| III. Conteúdo e engine desacoplados | ✅ Conforme — cartas e princípios vivem em `src/data/*.json`; engine em `src/engine/` não conhece texto específico, apenas naipe/valor/status. |
| IV. Simplicidade sobre generalidade prematura | ✅ Conforme — zero dependências de runtime, zero bundler; rejeitada a opção de framework (React/Vite) por não ser justificada nesta escala (ver `research.md`). |
| V. Acessibilidade e linguagem inclusiva | ✅ Conforme — contratos de UI (`contracts/ui-contract.md`) exigem foco visível, `aria-label` em cartas e pop-ups, e os micro-textos seguem linguagem inclusiva do CFESS. |
| VI. Testabilidade do essencial | ✅ Conforme — `src/engine/` é puro (sem DOM), testável via `node --test`; UI/render não são testados automaticamente (conforme o princípio). |

Nenhuma violação — seção "Complexity Tracking" não se aplica.

## Project Structure

### Documentation (this feature)

```text
specs/001-jogo-paciencia-educativo/
├── plan.md              # Este arquivo
├── research.md          # Fase 0: decisões técnicas e alternativas descartadas
├── data-model.md        # Fase 1: entidades e esquema de dados das cartas
├── quickstart.md        # Fase 1: como rodar o jogo e os testes localmente
├── contracts/
│   └── ui-contract.md   # Fase 1: contrato de UI/acessibilidade e esquema JSON de dados
└── tasks.md             # Gerado por /speckit-tasks (fase seguinte)
```

### Source Code (repository root)

```text
index.html                 # Ponto de entrada único da aplicação
src/
├── main.js                 # Bootstraps a UI e liga engine + progress + data
├── engine/                 # Lógica pura de jogo (sem DOM), testável isoladamente
│   ├── deck.js              # Construção e embaralhamento do baralho
│   ├── rules.js             # Validação de movimentos Klondike
│   ├── win.js               # Detecção de vitória / sem-jogadas-possíveis
│   └── principles.js        # Ordem de desbloqueio dos 11 princípios
├── data/
│   ├── cards.<naipe>.json   # Dados das 52 cartas (um arquivo por deck/expansão futura)
│   └── principles.json      # Os 11 princípios do Código de Ética
├── progress/
│   └── store.js             # Leitura/escrita de progresso em localStorage (com fallback in-memory)
├── ui/
│   ├── board.js              # Renderização do tableau/monte/fundações e drag-drop
│   ├── reveal-popup.js       # Pop-up de conteúdo educativo ao revelar carta
│   └── review-mode.js        # Modo revisão (flashcards por naipe)
└── styles/
    └── main.css

tests/
└── engine/
    ├── deck.test.js
    ├── rules.test.js
    ├── win.test.js
    └── principles.test.js
```

**Structure Decision**: projeto único de frontend estático (sem backend, sem
monorepo). A separação `engine/` (puro, testável) vs. `ui/` (DOM, não testado
automaticamente) implementa diretamente o Princípio VI da constituição. `data/`
isolado implementa o Princípio III e é o ponto de extensão para decks futuros
(SUAS, Seguridade Social, ECA) mencionados no roadmap de `CONTEUDO_CARTAS.md`.

## Complexity Tracking

*Não aplicável — nenhuma violação da Constitution Check acima.*
