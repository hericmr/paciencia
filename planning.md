# Planejamento: Serviço Social (Open-Source Linux Game)

Este documento descreve as etapas necessárias para transformar o jogo web atual em um aplicativo nativo para Linux com código aberto (Open-Source).

## Fase 1: Oficialização Open-Source (Comunidade e Direitos)
- [x] **Definir e Adicionar Licença:**
  - Escolhido MIT (permissiva).
  - Criado o arquivo `LICENSE` na raiz do projeto.
- [x] **Documentação Inicial:**
  - Criado `README.md` explicando o jogo, regras e como rodar.
  - Criado `CONTRIBUTING.md` com regras de contribuição de código e conteúdo.

## Fase 2: Conversão Web para Desktop (Tauri)
- [x] **Preparar Ambiente:**
  - Rust (via rustup) e dependências do sistema instaladas (`build-essential`,
    `libgtk-3-dev`, `libwebkit2gtk-4.1-dev`, etc).
- [x] **Inicializar o Tauri:**
  - Tauri inicializado em `src-tauri/`.
  - `tauri.conf.json` configurado (nome, versão, ícones, janela em fullscreen,
    tamanho mínimo).
- [x] **Ajustes de Código:**
  - Web app continua na raiz sem build step; `scripts/prepare-desktop-dist.mjs`
    monta uma pasta `dist/` isolada (index.html + src/ + assets/) só para o
    empacotamento do Tauri, já que `frontendDist` não pode apontar pra raiz
    do repo (contém `node_modules/`, `src-tauri/`).
  - Assets/sons/imagens confirmados funcionando no build de produção.

## Fase 3: Otimizações Nativas
- [x] **Experiência de Jogo (Janela):**
  - Janela abre em fullscreen (`app.windows[0].fullscreen: true`).
  - Fix de tela branca/preta do WebKitGTK em GPU Intel + Wayland: força
    `LIBGL_ALWAYS_SOFTWARE=1` no binário (`src-tauri/src/lib.rs`), respeitando
    override manual do usuário.
  - Ícone do app (mascote formiga, `assets/logo_fundo.webP`) gerado em 9
    resoluções (16 a 512px) com filtro Lanczos + leve unsharp para não perder
    nitidez nos tamanhos pequenos.
  - `.desktop` customizado (`src-tauri/paciencia-ss.desktop.hbs`) com nome de
    exibição "Serviço Social" e categoria `Game;Education;` — aparece na
    seção de Jogos do menu de aplicativos.
  - Pendente: desativar `user-select`/menu de contexto padrão do WebView.

## Fase 4: Empacotamento e Distribuição (Linux)
- [x] **Gerar Executáveis:**
  - `npm run desktop:build` gera `.deb` e `.AppImage` em
    `src-tauri/target/release/bundle/`.
  - `.deb` testado via `pkexec dpkg -i` — instala, aparece no menu de jogos
    com ícone e nome corretos.
  - `.deb` compatível com a política Debian (`Package: paciencia-ss`, seção
    `games`).
- [ ] **Publicação Avançada:**
  - Workflow `.github/workflows/release-desktop.yml` criado: builda e publica
    `.deb`/`.AppImage` como GitHub Release (rascunho) sempre que uma tag
    `v*` é empurrada. Desacoplado do GitHub Pages (que só reage a push na
    `main`) — ainda não testado (precisa da primeira tag).
  - Flathub/Snap Store: não iniciado.

## Fase 5: Editor de Baralho (ferramenta do mantenedor)
- [x] **Spec-kit completo:** `specs/003-editor-de-baralho/` (spec.md,
  plan.md, research.md, data-model.md, contracts/editor-contract.md,
  tasks.md) — feature planejada e implementada seguindo o fluxo
  spec → plan → tasks do projeto.
- [x] **Editor visual local:** `tools/deck-editor/` (HTML+JS puro, sem
  build step, fora do bundle Tauri e sem link na tela do jogo). Usa File
  System Access API (só Chrome/Edge) para ler/gravar
  `src/data/categories.json` e `src/data/author-photos.json` direto na
  pasta do projeto.
- [x] **Gestão de imagens:** seleção/drag-and-drop de imagem por carta,
  redimensionamento via `<canvas>` (256px no lado maior — ver
  `research.md`, Decisão 1) e exportação em WebP (`< 50 KB`, com redução
  progressiva de qualidade se necessário). Novas imagens vão em
  `assets/cards/<categoryId>__<slug-da-palavra>.webp`.
- [x] **Proveniência obrigatória:** autor, licença e URL do Wikimedia
  Commons exigidos quando a imagem é marcada como foto de pessoa real
  (campos aditivos em `author-photos.json`, retro-compatíveis).
- [x] **Edição de conteúdo:** formulário por categoria (nome, carta-título,
  micro-texto com contador de 280 caracteres, palavras, confundeCom,
  explicações por palavra), validado reaproveitando
  `validateCategories` de `src/data/loader.js` (re-exportada para esse
  fim) — nunca duplicando a regra.
- [x] **Testes:** `tests/tools/deck-editor.test.js` cobre as funções puras
  (slug/id de carta, redimensionamento, validação de metadados) — 60
  testes passando no total (`npm test`).
- [x] **Editor de carta unificado (feedback pós-teste manual):** palavra
  (renomeável), explicação, imagem e crédito/licença editados juntos num
  só modal por carta, em vez de imagem e texto em telas separadas.
- [x] **Dashboard de categorias + criação de categoria nova (2º
  feedback):** a tela inicial mostra todas as categorias com contagem de
  palavras e cobertura de imagem; botão "+ Nova categoria" cria uma
  categoria vazia (só em memória até "Salvar categoria" validar).
- [x] **Pasta lembrada entre sessões (3º feedback):** o handle da pasta
  do projeto é salvo no IndexedDB do navegador — reconecta sozinho (ou
  com 1 clique) nas próximas visitas, sem reabrir o seletor de pastas.
- [ ] **Migração do acervo legado:** `assets/authors/*.webp` (imagens já
  existentes) continuam fora do novo diretório `assets/cards/` —
  consolidação fica para uma tarefa futura, fora do escopo desta feature
  (ver `research.md`, Decisão 4).
