# Implementation Plan: Editor de Baralho (ferramenta do mantenedor)

**Branch**: `003-editor-de-baralho` | **Date**: 2026-07-13 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/003-editor-de-baralho/spec.md`

## Summary

Ferramenta local, só para o mantenedor do jogo, que substitui o fluxo manual
de editar `categories.json`/`author-photos.json` num editor de texto e
redimensionar/converter imagens em outro programa. É uma página HTML+JS
separada (`tools/deck-editor/`), sem build step, que usa a File System
Access API para ler/gravar arquivos diretamente na pasta do projeto, canvas
para redimensionar e exportar imagens em WebP, e reaproveita a validação de
conteúdo já existente em `src/data/loader.js`.

## Technical Context

**Language/Version**: JavaScript (ES2022+), ES Modules nativos — mesma
decisão de v1/v2, sem bundler, sem TypeScript compilado.

**Primary Dependencies**: nenhuma dependência de runtime nova. Usa só APIs
nativas do navegador: File System Access API (`showDirectoryPicker`,
`FileSystemFileHandle.createWritable`), Canvas 2D (`drawImage`,
`toBlob("image/webp", 0.8)`), Drag and Drop API, `File`/`FileReader`.

**Storage**: arquivos do próprio projeto no disco local, via handle de
diretório concedido pelo navegador — não é um serviço novo, é o mesmo
`src/data/*.json` e `assets/` que o jogo já lê.

**Testing**: `node --test` para as funções puras extraídas (slug/id de
carta, cálculo de dimensão de redimensionamento, mensagens de validação) —
o código que depende de `<canvas>`/DOM/File System Access API é verificado
manualmente (mesmo padrão de `src/ui/` no resto do projeto: engine puro tem
teste automatizado, UI é validada rodando o app).

**Target Platform**: navegador desktop baseado em Chromium (Chrome, Edge,
Opera) — único alvo com File System Access API estável. Não roda em mobile
nem é necessário rodar (ferramenta do mantenedor, não do jogador).

**Project Type**: página estática adicional dentro do mesmo repositório
estático do jogo, isolada em `tools/`.

**Performance Goals**: N/A (ferramenta de uso ocasional, não em tempo real).

**Constraints**: sem build step; sem backend; sem dependência de rede (roda
100% local depois de carregada); WebP final de cada carta < 50 KB.

**Scale/Scope**: cobre todas as ~29 categorias já cadastradas em
`categories.json` (v1 e v2) e a lista de imagens em `author-photos.json` —
não é limitado ao Nível 1/2/3/4 jogáveis, porque o pool de conteúdo é maior
que o que está em níveis jogáveis (ver `plan.md` da feature 002, seção
Scale/Scope).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio | Avaliação |
|---|---|
| I. Rigor conceitual do conteúdo | ✅ O editor não relaxa a exigência de fonte/licença — US3 formaliza no editor a mesma exigência de proveniência que já existia manualmente em `scripts/author-photos-manifest.json`, agora obrigatória via UI para fotos de pessoa real. |
| II. Zero fricção de acesso | ✅ N/A para quem joga — o editor não faz parte do caminho de jogo (FR-002), e não introduz nenhuma dependência de rede/conta para o jogo em si. |
| III. Conteúdo e engine desacoplados | ✅ O editor só escreve arquivos de dados (`categories.json`, `author-photos.json`) e assets de imagem; nunca toca `src/engine/`. |
| IV. Simplicidade sobre generalidade prematura | ✅ Sem dependência nova (nem `sharp`, nem bundler, nem framework de UI); reaproveita `validateCategories` do loader em vez de duplicar regras; um único navegador-alvo em vez de dois caminhos (File System Access API + fallback de download) — ver `research.md`, Decisão 2, para o racional de não generalizar cedo demais para múltiplos navegadores. |
| V. Acessibilidade e linguagem inclusiva | ⚠️ Parcial: formulários usam `<label>`/`aria-label` e são operáveis por teclado (é uma ferramenta de trabalho, não o jogo em si, mas isso não isenta o mínimo de acessibilidade); sem suporte a leitor de tela para o preview visual de drag-and-drop de imagem — aceitável porque o editor tem um único usuário conhecido (o mantenedor), diferente do público do jogo. |
| VI. Testabilidade do essencial | ✅ Funções puras que decidem o que é gravado no disco (slug/id de carta, validação, cálculo de redimensionamento) ficam em módulo isolado e testável sem DOM (`tools/deck-editor/lib.js` + `tests/tools/deck-editor.test.js`). |

Nenhuma violação que exija justificativa formal em "Complexity Tracking"
além do já registrado na linha V acima (aceita como trade-off explícito,
não como violação).

## Project Structure

### Documentation (this feature)

```text
specs/003-editor-de-baralho/
├── plan.md              # Este arquivo
├── research.md          # Fase 0: decisões técnicas
├── data-model.md         # Fase 1: schema aditivo de author-photos.json
├── contracts/
│   └── editor-contract.md  # Fase 1: contrato de UI/fluxo do editor
└── tasks.md              # Gerado por /speckit-tasks
```

### Source Code (repository root)

```text
tools/
└── deck-editor/
    ├── index.html          # Página do editor (não linkada de index.html do jogo)
    ├── editor.js            # Orquestração: File System Access API, DOM, canvas
    ├── lib.js                # Funções puras: slug/id de carta, validação, resize
    └── editor.css            # Estilos próprios (não reaproveita src/styles/main.css)

src/data/
├── loader.js              # validateCategories volta a ser exportada (reaproveitada pelo editor)
└── author-photos.json     # Schema aditivo: author/license/commonsFileUrl opcionais por entrada

tests/
└── tools/
    └── deck-editor.test.js  # Testa lib.js (slug, validação, resize) sem DOM/canvas
```

**Structure Decision**: ferramenta isolada em `tools/`, fora de `src/`
(nunca entra no bundle Tauri, que só copia `index.html`/`src/`/`assets/` —
ver `scripts/prepare-desktop-dist.mjs`) e sem link a partir da UI do jogo.
Única mudança fora de `tools/` é reverter a des-exportação de
`validateCategories` em `loader.js` (feita numa limpeza anterior desta
sessão, quando a função não tinha nenhum uso externo) e o schema aditivo
(retro-compatível) de `author-photos.json`.

## Complexity Tracking

*Não aplicável — nenhuma violação da Constitution Check acima exige
justificativa além da já registrada na tabela (Princípio V, trade-off
aceito).*
