# Tasks: Editor de Baralho (ferramenta do mantenedor)

**Input**: Design documents from `/specs/003-editor-de-baralho/`

**Tests**: incluídos para as funções puras (Princípio VI) — slug/id de
carta, validação, cálculo de redimensionamento. Código de DOM/canvas/File
System Access API é verificado manualmente (ver `plan.md`, Testing).

## Phase 1: Base de dados reaproveitada

- [x] T001 Reverter a des-exportação de `validateCategories` em
      `src/data/loader.js` (mantendo `validateLevels` privada — não usada
      pelo editor, escopo confirmado como só `categories.json`)

## Phase 2: Funções puras do editor

- [x] T002 [P] `tests/tools/deck-editor.test.js`: `slug(word)` remove
      acentos, minusculiza, troca não-alfanuméricos por hífen, remove
      hífen nas pontas
- [x] T003 [P] `tests/tools/deck-editor.test.js`: `cardId(categoryId, word)`
      = `${categoryId.toLowerCase()}__${slug(word)}`
- [x] T004 [P] `tests/tools/deck-editor.test.js`: `computeResizeDimensions`
      mantém proporção e nunca excede 256px no lado maior; imagem já
      menor que 256px não é ampliada
- [x] T005 [P] `tests/tools/deck-editor.test.js`: `validateImageMetadata`
      exige `author`/`license`/`commonsFileUrl` só quando
      `isRealPersonPhoto` é `true`
- [x] T006 Implementar `tools/deck-editor/lib.js` (`slug`, `cardId`,
      `computeResizeDimensions`, `validateImageMetadata`,
      `stringifyJson` — wrapper de `JSON.stringify(dados, null, 2)`)

## Phase 3: Orquestração (File System Access API + canvas)

- [x] T007 Implementar `tools/deck-editor/index.html`: Tela 1 (abrir
      pasta), detecção de `showDirectoryPicker` ausente
- [x] T008 Implementar em `editor.js`: carregar `categories.json` +
      `author-photos.json` do handle de diretório, montar Tela 2 (grade
      de categorias)
- [x] T009 Implementar Tela 3 (categoria selecionada): aba "Cartas"
      (grade de palavras + thumbnail atual/placeholder)
- [x] T010 Implementar Tela 4 (editor de imagem): input file + drag and
      drop, preview via canvas, redimensionar (`computeResizeDimensions`)
      e exportar `canvas.toBlob("image/webp", 0.8)`
- [x] T011 Implementar gravação da imagem em
      `assets/cards/<cardId>.webp` e atualização de
      `author-photos.json` (photoUrl, photoCredit, e author/license/
      commonsFileUrl quando fornecidos) — validar teto de 50 KB, reduzindo
      qualidade em passos antes de desistir e avisar
- [x] T012 Implementar aba "Conteúdo" da Tela 3: formulário de `nome`,
      `cartaTitulo`, `microtexto` (contador 280), `palavras`,
      `confundeCom`, `explicacoesPalavras`
- [x] T013 Ligar o botão "Salvar categoria" a `validateCategories`
      (importada de `src/data/loader.js`) e à gravação de
      `categories.json` só se a validação passar
- [x] T014 Implementar `editor.css`: layout de grade, estados de
      validação (erro/ok), foco visível, região `aria-live` de erros

## Phase 4: Guardas de escopo e integração

- [x] T015 Confirmar que `scripts/prepare-desktop-dist.mjs` não referencia
      `tools/` (já não referencia — só copia `index.html`/`src/`/`assets/`)
- [x] T016 Confirmar que nenhum arquivo em `index.html`/`src/` linka para
      `tools/deck-editor/`
- [x] T017 Atualizar `README.md` com uma seção curta "Ferramenta de
      curadoria de conteúdo" apontando para `tools/deck-editor/`

## Phase 5: Verificação

- [x] T018 Rodar `npm test` (46 testes existentes + novos de
      `deck-editor.test.js`)
- [x] T019 Verificação manual: `npm run serve`, abrir
      `tools/deck-editor/`, conceder pasta do projeto, trocar a imagem de
      uma carta existente, salvar, abrir o jogo na mesma origem e
      confirmar a nova imagem
- [x] T020 Atualizar `planning.md` com uma nova fase registrando esta
      ferramenta

## Phase 6: Unificar imagem + conteúdo por carta (feedback pós-teste manual)

- [x] T021 Atualizar `lib.js`/`validateImageMetadata`: `photoCredit` só é
      obrigatório quando a carta tem (ou vai passar a ter) imagem — antes
      era sempre obrigatório, o que bloquearia salvar uma carta só com
      texto/explicação
- [x] T022 Fundir a Tela 4 (antes só imagem) num editor de carta único:
      campo de palavra (renomeável), explicação, imagem, crédito e
      proveniência — um só "Salvar carta" grava `categories.json` e
      `author-photos.json` juntos
- [x] T023 Remover a lista de `explicacoesPalavras` da aba "Conteúdo"
      (agora edição por palavra vive só no editor de carta unificado);
      manter só palavras (adicionar/remover/renomear em lote) e
      `confundeCom`
- [x] T024 Ler `levels.json` (só leitura, best-effort) ao abrir a pasta e
      avisar (não bloquear) quando uma palavra removida/renomeada de uma
      categoria ainda aparecer em `selectedWords` de algum nível
- [x] T025 Atualizar testes de `validateImageMetadata` para o novo
      parâmetro `hasImage`; `npm test` continua passando
- [x] T026 Atualizar `contracts/editor-contract.md` e `spec.md` com nota
      de revisão explicando a mudança

## Phase 7: Dashboard de categorias + criação de categoria nova (2º feedback)

- [x] T027 Transformar a grade de categorias num dashboard: cada tile
      mostra id, nome, eixo e `N palavras · M/N com imagem`
      (`categoryStats`), em vez de só um botão com o nome
- [x] T028 Adicionar botão "+ Nova categoria" e modal de criação
      (id, nome, eixo) — categoria nova entra só em memória e abre direto
      na aba Conteúdo, sem gravar nada até "Salvar categoria" validar
- [x] T029 Corrigir bug de CSS encontrado pelo smoke test com Playwright:
      `.modal-overlay { display: flex }` tinha a mesma especificidade do
      `[hidden] { display: none }` do navegador e vencia por ordem de
      declaração — os dois modais (carta e nova categoria) ficavam
      clicáveis mesmo com `hidden`. Corrigido com
      `.modal-overlay[hidden] { display: none }`
- [x] T030 Smoke test com Playwright + Chrome headless cobrindo o fluxo
      completo de criar categoria (abrir modal → preencher → criar →
      tile aparece no dashboard → aba Conteúdo abre automaticamente)
- [x] T031 Atualizar `contracts/editor-contract.md` e `spec.md`
      (FR-015/FR-016) com a 2ª nota de revisão

## Phase 8: Lembrar a pasta do projeto entre sessões (3º feedback)

- [x] T032 Guardar o `FileSystemDirectoryHandle` no IndexedDB
      (`saveStoredDirHandle`/`loadStoredDirHandle`/`clearStoredDirHandle`)
      após o primeiro `showDirectoryPicker` bem-sucedido
- [x] T033 Ao carregar a página, tentar reconectar automaticamente
      (`tryAutoReconnect`): se a permissão ainda estiver concedida
      (`queryPermission`), carrega sem nenhum clique; se precisar
      reconfirmar, o botão vira "Continuar com a pasta do projeto"
      (1 clique, sem reabrir o seletor de pastas)
- [x] T034 Adicionar botão "Trocar pasta" (visível só depois de
      conectado) que esquece o handle salvo e volta ao fluxo de escolher
      pasta do zero
- [x] T035 Confirmar por smoke test (Playwright) que a tentativa de
      reconexão automática não gera erro de console quando não há
      handle salvo (primeira visita)

Fora do escopo automatizável: o teste de ponta a ponta do diálogo nativo
do sistema operacional (escolher a pasta a primeira vez) e da
reconexão real via IndexedDB com um handle de verdade — ambos exigem um
gesto de usuário real e um `FileSystemDirectoryHandle` genuíno (não
serializável por mock em teste headless); verificação manual continua
necessária (T019 do Phase 5, revisitado aqui).
