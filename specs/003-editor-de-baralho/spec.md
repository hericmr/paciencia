# Feature Specification: Editor de Baralho (ferramenta do mantenedor)

**Feature Branch**: `003-editor-de-baralho`

**Created**: 2026-07-13

**Status**: Draft

> **Revisado (2026-07-13, 1ª rodada)**: após o primeiro teste manual, o
> mantenedor pediu que a página fosse "mais completa", mostrando as
> cartas já existentes e permitindo sua alteração — a aba "Cartas" (US1) e
> o editor de imagem por carta foram unificados num único editor por
> carta (palavra + explicação + imagem + crédito/licença), em vez de
> imagem e texto ficarem em telas separadas. Ver
> `contracts/editor-contract.md`, nota de revisão, e `tasks.md`, Phase 6.
>
> **Revisado (2026-07-13, 2ª rodada)**: feedback de que a tela inicial
> devia "mostrar todos os decks do jogo" para editar ou criar cartas — a
> grade de categorias virou um dashboard com estatísticas por categoria
> (palavras · cobertura de imagem) e ganhou criação de categoria nova
> pelo próprio editor. Ver `contracts/editor-contract.md`, 2ª nota de
> revisão, e `tasks.md`, Phase 7.
>
> **Revisado (2026-07-13, 3ª rodada)**: feedback de que abrir a pasta
> toda vez era desnecessário, já que é sempre a mesma pasta raiz do
> projeto. Navegadores não permitem pular a concessão inicial (segurança
> do File System Access API), mas o handle escolhido passou a ser
> lembrado via IndexedDB — nas próximas visitas o editor reconecta sem
> reabrir o seletor de pastas (às vezes sem nenhum clique). Ver
> `contracts/editor-contract.md`, 3ª nota, `research.md`, Decisão 7, e
> `tasks.md`, Phase 8.

**Input**: User description: "editor de baralho onde o maker do jogo pode
selecionar imagens pra as cartas, redimensionadas e exportadas em webP, e
editar os conteúdos alterando o json das cartas — via fluxo spec-kit"

## Contexto

Esta feature NÃO é para quem joga — é uma ferramenta interna para o
mantenedor/curador de conteúdo (a pessoa que hoje edita `categories.json` e
`author-photos.json` manualmente, e roda `scripts/download-author-photos.mjs`
para baixar fotos). Hoje esse processo tem fricção: editar JSON grande à mão,
redimensionar imagem em outro programa, converter para WebP manualmente,
lembrar de atualizar `photoCredit`. O editor substitui essa fricção por uma
UI visual local.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Trocar a imagem de uma carta (Priority: P1)

O mantenedor abre o editor, concede acesso à pasta do projeto, escolhe uma
categoria e vê a grade de palavras (cartas) daquela categoria — cada uma
com sua imagem atual (ou um placeholder, se não tiver). Clica numa carta,
solta/seleciona um arquivo de imagem do disco, vê um preview de como a
carta ficaria, preenche crédito (e licença/autor/URL do Commons se for foto
de pessoa real) e confirma. O editor redimensiona a imagem no navegador,
exporta como WebP, grava o arquivo em `assets/cards/` e atualiza
`src/data/author-photos.json` na pasta do projeto — sem precisar abrir
nenhum outro programa.

**Why this priority**: é o pedido mais concreto e o que hoje tem mais
fricção manual (redimensionar + converter + editar JSON à mão em 3
ferramentas diferentes).

**Independent Test**: com o editor aberto e a pasta do projeto concedida,
trocar a imagem de uma carta existente, salvar, depois abrir o jogo
(`npm run serve`) e confirmar visualmente que a carta mostra a nova
imagem — sem editar nenhum arquivo à mão entre os dois passos.

**Acceptance Scenarios**:

1. **Given** uma carta sem imagem, **When** o mantenedor solta um arquivo
   PNG/JPEG nela e confirma, **Then** o editor grava
   `assets/cards/<id-da-carta>.webp` (< 50 KB) e adiciona uma entrada em
   `author-photos.json` apontando para esse caminho.
2. **Given** uma carta que já tem imagem, **When** o mantenedor troca por
   outra, **Then** o arquivo WebP antigo é sobrescrito (mesmo nome
   derivado do id da carta) e `photoCredit` é atualizado.
3. **Given** uma imagem marcada como "foto de pessoa real", **When** o
   mantenedor tenta salvar sem preencher autor, licença e URL do Commons,
   **Then** o editor bloqueia o salvamento e aponta os campos faltantes.
4. **Given** uma imagem de origem muito grande (ex.: 4000×3000), **When**
   é processada, **Then** o resultado final é WebP, redimensionado (ver
   `research.md` para o tamanho-alvo) e abaixo de 50 KB.

---

### User Story 2 - Editar o conteúdo de uma categoria (Priority: P2)

O mantenedor seleciona uma categoria e edita nome, carta-título,
micro-texto (com contador de caracteres e limite de 280), a lista de
palavras do pool e as explicações por palavra. Ao salvar, o editor valida
os mesmos requisitos que o `loader.js` do jogo já aplica (nada de
micro-texto vazio ou longo demais, sem palavras duplicadas, carta-título
obrigatória) e grava `categories.json` formatado do mesmo jeito que o
arquivo já é hoje (2 espaços de indentação, sem reformatar o resto do
arquivo).

**Why this priority**: depende da US1 existir (mesma tela/mesmo acesso à
pasta), mas entrega valor sozinha — hoje a única forma de corrigir um
micro-texto é editando JSON à mão (como fizemos nas últimas duas tarefas
desta sessão).

**Independent Test**: editar o micro-texto de uma categoria pelo editor,
salvar, rodar `npm test` e confirmar que o loader aceita o arquivo sem
erro e que o jogo exibe o novo texto ao completar aquela categoria.

**Acceptance Scenarios**:

1. **Given** um micro-texto com 300 caracteres digitado, **When** o
   mantenedor tenta salvar, **Then** o editor recusa e mostra a contagem
   (300/280).
2. **Given** uma palavra duplicada adicionada ao pool da categoria,
   **When** o mantenedor tenta salvar, **Then** o editor recusa, apontando
   a duplicata.
3. **Given** uma edição válida, **When** o mantenedor salva, **Then**
   `categories.json` é reescrito preservando a mesma indentação (2
   espaços) e a mesma ordem de categorias já presente no arquivo.

---

### User Story 3 - Preservar proveniência/licença das imagens (Priority: P3)

Para cartas de autoras/es (fotos de pessoas reais), o editor exige e
preserva autor, licença e URL do arquivo no Wikimedia Commons (mesma
prática já usada em `scripts/author-photos-manifest.json`), gravando essa
proveniência junto da entrada em `author-photos.json`.

**Why this priority**: sem isso, o editor recriaria — de forma mais
fácil de ignorar — o problema que o Princípio I da constituição já trata
como inegociável (imagem sem checagem de licença). É menos urgente que
US1/US2 (o mantenedor pode revisar depois), mas não pode faltar antes do
editor ir para uso real.

**Independent Test**: marcar uma imagem como "foto de pessoa real", tentar
salvar vazio (deve bloquear), preencher os 3 campos e salvar; reabrir a
carta no editor e confirmar que os 3 campos voltam preenchidos.

**Acceptance Scenarios**:

1. **Given** o checkbox "foto de pessoa real" marcado, **When** autor,
   licença e URL do Commons estão vazios, **Then** o botão de salvar fica
   desabilitado (ou o salvamento é bloqueado com mensagem clara).
2. **Given** uma imagem apenas ilustrativa (conceito, não pessoa),
   **When** o mantenedor não marca o checkbox, **Then** os 3 campos
   continuam opcionais.

### Edge Cases

- Navegador sem suporte a File System Access API (Firefox, Safari): o
  editor detecta isso ao carregar e mostra uma mensagem explicando que só
  funciona em navegadores baseados em Chromium, sem quebrar silenciosamente.
- Mantenedor fecha a aba com edições não salvas: perda de dados é aceitável
  nesta v1 (sem rascunho automático) — ver Assumptions.
- Imagem solta não é um arquivo de imagem válido: o editor recusa antes de
  processar, sem gravar nada.
- Duas categorias diferentes têm uma palavra com o mesmo texto: como o id
  da carta usado no nome do arquivo inclui o id da categoria (ver
  `research.md`), não há colisão de arquivo.
- `author-photos.json` ainda não tem entrada para a palavra: o editor trata
  como "sem imagem ainda" (placeholder), não como erro.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O editor DEVE rodar como página estática separada
  (`tools/deck-editor/`), servida pelo mesmo `npm run serve`/`http.server`
  usado pelo jogo, sem build step e sem dependências de runtime novas.
- **FR-002**: O editor NÃO DEVE ser incluído no bundle Tauri
  (`scripts/prepare-desktop-dist.mjs` só copia `index.html`, `src/`,
  `assets/`) nem referenciado por link a partir de `index.html` ou de
  qualquer tela do jogo.
- **FR-003**: O editor DEVE pedir acesso à pasta raiz do projeto via File
  System Access API (`window.showDirectoryPicker`) antes de habilitar
  qualquer edição, e DEVE detectar e avisar claramente quando essa API não
  existe no navegador.
- **FR-004**: O editor DEVE carregar `src/data/categories.json` e
  `src/data/author-photos.json` da pasta concedida e exibir as categorias
  e suas palavras em uma grade visual navegável.
- **FR-005**: Ao selecionar uma carta (palavra) sem imagem, o editor DEVE
  aceitar um arquivo de imagem por seleção de arquivo OU por
  arrastar-e-soltar, e mostrar um preview de como a carta ficaria antes de
  confirmar.
- **FR-006**: O editor DEVE redimensionar a imagem via `<canvas>` para o
  tamanho-alvo definido em `research.md` (256px no lado maior, mantendo
  proporção) e exportar via `canvas.toBlob("image/webp", 0.8)`.
- **FR-007**: O editor DEVE gravar o WebP resultante em
  `assets/cards/<id-da-carta>.webp`, onde `<id-da-carta>` é derivado do id
  da categoria e da palavra (ver `research.md`, esquema de slug) — DEVE
  rejeitar o salvamento se o arquivo final ultrapassar 50 KB, reduzindo a
  qualidade automaticamente (até um piso razoável) antes de desistir e
  avisar o mantenedor.
- **FR-008**: O editor DEVE atualizar (criar ou sobrescrever) a entrada da
  palavra em `author-photos.json` com `photoUrl` (caminho gerado) e
  `photoCredit` (texto informado).
- **FR-009**: O editor DEVE oferecer campos opcionais de `author`,
  `license` e `commonsFileUrl` por imagem, e um checkbox "esta imagem é
  foto de uma pessoa real" que, quando marcado, torna os 3 campos
  obrigatórios para salvar.
- **FR-010**: O editor DEVE permitir editar, por categoria: `nome`,
  `cartaTitulo`, `microtexto` (com contador de caracteres, limite 280),
  `palavras` (adicionar/remover/reordenar), `confundeCom` (seleção entre
  os demais ids de categoria) e `explicacoesPalavras` (texto por palavra).
- **FR-011**: O editor DEVE validar o formulário de categoria com as
  mesmas regras que `src/data/loader.js` (`validateCategories`) já aplica
  ao carregar o jogo — reaproveitando essa função diretamente (importada),
  não reimplementada, para as duas nunca divergirem.
- **FR-012**: O editor DEVE exportar `categories.json` e
  `author-photos.json` com a mesma formatação já usada nos arquivos atuais
  (indentação de 2 espaços, `JSON.stringify(dados, null, 2)`), preservando
  os dados não editados na sessão.
- **FR-013**: O editor NÃO DEVE permitir editar `levels.json` (seleção de
  palavras por nível) nem a lógica de jogo (`src/engine/`) — fora de
  escopo desta feature.
- **FR-014**: O editor DEVE ler o estado atual dos arquivos do disco a
  cada carregamento (sem cache implícito entre sessões) para nunca
  sobrescrever uma edição feita fora do editor sem o mantenedor ver os
  dados atuais primeiro.
- **FR-015**: A tela inicial (após abrir a pasta) DEVE mostrar todas as
  categorias já cadastradas como um dashboard — id, nome, eixo e um
  resumo de cobertura (quantas palavras têm imagem) — não apenas uma
  lista de nomes.
- **FR-016**: O editor DEVE permitir criar uma categoria nova (id, nome,
  eixo) diretamente pela UI, sem editar `categories.json` à mão. A
  categoria criada só é persistida em disco quando "Salvar categoria"
  (FR-011) validar com sucesso — o que exige, no mínimo, carta-título,
  micro-texto e uma palavra, preenchidos depois da criação.

### Key Entities

- **CardImageEntry** (dentro de `author-photos.json`, chave = palavra):
  `photoUrl`, `photoCredit`, e opcionalmente `author`, `license`,
  `commonsFileUrl` (novos campos aditivos — ver `data-model.md`).
- **Category** (`categories.json`, já existente): sem mudança de schema,
  só editada via UI em vez de à mão.
- **CardId** (conceito novo, só do editor): `${categoryId}__${slug(word)}`
  — usado como nome de arquivo em `assets/cards/`, nunca persistido como
  campo novo em `categories.json` (ver `research.md`).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: o mantenedor troca a imagem de uma carta e, sem editar nada
  manualmente, vê a nova imagem ao jogar a fase correspondente.
- **SC-002**: 100% dos arquivos WebP gerados pelo editor pesam menos de
  50 KB.
- **SC-003**: `categories.json` exportado pelo editor é aceito por
  `loadCategories`/`validateCategories` sem nenhuma edição manual
  posterior.
- **SC-004**: nenhuma carta de autor/a é salva pelo editor sem autor,
  licença e URL do Commons preenchidos.
- **SC-005**: `npm test` continua passando (46 testes existentes + novos
  testes das funções puras do editor).

## Assumptions

- Único navegador suportado nesta v1: Chromium (Chrome/Edge/Opera desktop)
  — é o único com File System Access API estável. Firefox/Safari mostram
  aviso e não funcionam; não há fallback de download nesta versão (ver
  `research.md` para o racional de não implementar os dois modos).
- Sem autosave/rascunho: fechar a aba com edições não salvas perde essas
  edições — aceitável porque o público é uma única pessoa (o mantenedor),
  rodando localmente, não uma ferramenta multiusuário.
- Escopo de conteúdo editável é só `categories.json` +
  `author-photos.json`. `levels.json` (curadoria de quais palavras cada
  nível usa) continua edição manual — não é gargalo hoje (mudou 2 vezes
  nesta sessão, ambas rápidas à mão).
- Imagens já existentes em `assets/authors/*.webp` não são migradas para
  `assets/cards/` por esta feature — o editor só passa a gravar novas
  imagens (ou re-selecionadas pelo mantenedor) no novo caminho. Migração
  do acervo existente fica fora de escopo (ver `research.md`).
- `assets/cards/` é criado pelo próprio editor na primeira gravação (via
  `getDirectoryHandle(..., { create: true })`), não precisa existir de
  antemão no repositório.
