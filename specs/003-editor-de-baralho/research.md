# Research: Editor de Baralho (ferramenta do mantenedor)

## Decisão 1: Tamanho-alvo de 256px no lado maior

**Decision**: toda imagem processada pelo editor é redimensionada (mantendo
proporção) para no máximo 256px no lado maior antes de exportar como WebP
com qualidade 0.8.

**Rationale**: o jogo hoje exibe fotos de carta como miniatura pequena
(`.card-photo-thumb` no tableau) e um pouco maior no popup de inspeção
(`word-info-popup.js`) — nunca em tela cheia. As imagens já existentes em
`assets/authors/` variam de 225×225 a 463×320px e pesam 6–16 KB cada
(exceção: `barroco.webp`, maior por ter sido gerada a partir de uma foto de
alta resolução sem redimensionamento prévio — exatamente o tipo de
inconsistência que este editor existe para evitar). 256px no lado maior
cobre com folga (2×) o maior caso de exibição atual mesmo em tela retina,
e junto com qualidade 0.8 do WebP fica confortavelmente abaixo do teto de
50 KB definido no critério de aceite (SC-002), sem exigir lógica adicional
de crop/enquadramento.

**Alternatives considered**: manter o tamanho original da imagem de origem
(rejeitado — sem controle de peso final, pode facilmente passar de 50 KB
com fotos de celular modernas); usar um tamanho fixo (ex.: sempre
256×256, cortando) — rejeitado porque força crop automático que pode
cortar rostos de forma ruim sem curadoria humana; redimensionar mantendo
proporção sem cortar é mais simples e seguro (Princípio IV).

## Decisão 2: Só File System Access API, sem fallback de download

**Decision**: o editor exige `window.showDirectoryPicker` (Chromium) e não
implementa um segundo caminho de "baixar arquivo + instrução de mover
manualmente" para navegadores sem suporte.

**Rationale**: o público desta ferramenta é uma única pessoa conhecida (o
mantenedor), não usuários finais — não há requisito de compatibilidade
ampla de navegador como existe para o jogo (Princípio II é sobre quem
joga, não sobre quem cura conteúdo). Manter os dois caminhos dobraria a
superfície de código (um fluxo de gravação direta + um fluxo de
download/merge manual) para um ganho que só se materializa se o
mantenedor decidir trocar de Chrome para Firefox como navegador de
trabalho — não comprovadamente necessário agora (Princípio IV). Se isso
mudar, o fallback de download fica documentado aqui como extensão futura
natural (a lógica de canvas/WebP é idêntica; só muda o destino do arquivo
gerado).

**Alternatives considered**: fallback de download com merge manual do
JSON — rejeitado por complexidade dobrada sem necessidade comprovada;
extensão de navegador ou app Electron dedicado — rejeitado por trazer
dependência de build/empacotamento nova, contra o Princípio IV.

## Decisão 3: Esquema de id de carta = `${categoryId}__${slug(word)}`

**Decision**: o "id da carta" usado como nome de arquivo
(`assets/cards/<id>.webp`) é derivado de `categoryId` + um slug da palavra
(minúsculas, sem acento, espaços/parênteses/barras viram hífen), unidos por
`__`. Exemplo: categoria `CAT-13`, palavra "José Paulo Netto" →
`cat-13__jose-paulo-netto.webp`.

**Rationale**: `categories.json` não tem hoje um campo de id por palavra
(só `id` por categoria) — a palavra em si é a chave usada em
`explicacoesPalavras` e em `author-photos.json`. Usar só `slug(word)` como
nome de arquivo (como o acervo legado em `assets/authors/` já faz, ex.:
`loas.webp`, `cad_unico.webp`) arrisca colisão se duas categorias
diferentes tiverem uma palavra com o mesmo texto — a regra de curadoria em
`CONTEUDO_CARTAS.md` só proíbe repetição *dentro do mesmo nível*, não
globalmente entre todas as ~29 categorias do pool. Prefixar com o
`categoryId` elimina essa classe de bug com custo mínimo de legibilidade.

**Alternatives considered**: adicionar um campo `id` por palavra em
`categories.json` — rejeitado por exigir migração de dado em um arquivo já
em produção sem necessidade funcional (a engine nunca precisa desse id,
só o editor); manter o esquema legado sem prefixo — rejeitado pelo risco
de colisão silenciosa acima.

## Decisão 4: `assets/cards/` é um diretório novo, sem migrar `assets/authors/`

**Decision**: o editor grava toda imagem nova em `assets/cards/`
(conforme pedido explicitamente), deixando o acervo existente em
`assets/authors/*.webp` como está — sem renomear ou mover nada.

**Rationale**: migrar ~40 arquivos existentes e reescrever todas as
`photoUrl` correspondentes em `author-photos.json` é um trabalho de
migração de dados com risco de regressão (qualquer path errado quebra uma
carta em produção) e zero valor funcional novo — não faz parte do pedido
original nem é pré-requisito para o editor funcionar (ele lê/edita
`photoUrl` como uma string opaca, não assume o diretório). Fica como
tarefa de curadoria manual futura, se o mantenedor decidir consolidar os
dois diretórios.

## Decisão 5: Metadados de licença vivem dentro de `author-photos.json`, não em arquivo à parte

**Decision**: os campos novos `author`, `license` e `commonsFileUrl` são
adicionados como chaves opcionais direto em cada entrada de
`author-photos.json` (o arquivo que o próprio jogo já carrega), em vez de
criar um arquivo de proveniência separado (como
`scripts/author-photos-manifest.json` faz para o fluxo de download de
fotos de autor da v1).

**Rationale**: `main.js` já carrega `author-photos.json` com
`fetch(...).then(r => r.ok ? r.json() : {})` sem validação de schema —
campos desconhecidos são ignorados com segurança pelo código existente
(`word-info-popup.js`/`level-board.js` só leem `photoUrl`/`photoCredit`).
Um arquivo a mais para o editor gerenciar seria uma segunda fonte de
verdade para sincronizar manualmente (o problema que o
`author-photos-manifest.json` da v1 já tem, e que a v2 nunca herdou) —
contra o Princípio IV. Ver `data-model.md` para o schema completo.

**Alternatives considered**: reaproveitar o formato de
`author-photos-manifest.json` (com `cardId`, pensado para a v1) —
rejeitado por já não caber no modelo de dados da v2 (não existe mais
`cardId`, só `word`); arquivo de proveniência novo e genérico — rejeitado
por duplicar dado que já cabe, sem custo, dentro do arquivo existente.

## Decisão 6: Validação reaproveitada de `loader.js`, não duplicada

**Decision**: `validateCategories` (removida de `export` numa limpeza
anterior desta sessão, por não ter uso externo naquele momento) volta a
ser exportada por `src/data/loader.js`, e o editor a importa diretamente
(`import { validateCategories } from "../../src/data/loader.js"`) em vez
de reimplementar as mesmas regras em `tools/deck-editor/lib.js`.

**Rationale**: ter duas implementações da mesma regra (uma no jogo, uma no
editor) é exatamente o tipo de duplicação que diverge silenciosamente com
o tempo — o próprio motivo (FR-011) de reaproveitar em vez de duplicar.
`validateCategories` já roda em Node (sem DOM), então importar de dentro
de um módulo ES carregado por uma página HTML funciona sem adaptação.

## Decisão 7: Handle de diretório lembrado via IndexedDB, sem backend

**Decision**: depois do primeiro `showDirectoryPicker()` bem-sucedido, o
`FileSystemDirectoryHandle` é salvo no IndexedDB do navegador. Ao
carregar a página, o editor tenta reconectar sozinho: se a permissão
ainda estiver concedida (`handle.queryPermission()`), carrega sem
nenhuma interação; se precisar reconfirmar, um único clique
(`handle.requestPermission()`) reconecta ao mesmo handle, sem reabrir o
seletor de pastas.

**Rationale**: o mantenedor apontou que reabrir/navegar até a pasta toda
vez era desnecessário, já que o editor sempre aponta pra mesma pasta (a
raiz do projeto). Navegadores não permitem que uma página acesse
arquivos locais sem alguma concessão do usuário — não há forma de pular
isso 100% na primeira vez sem um componente rodando fora do sandbox do
navegador. `FileSystemHandle` é explicitamente serializável por
IndexedDB (é uma das poucas exceções da spec de structured-clone) —
persistir e revalidar permissão é o padrão documentado para esse caso de
uso, sem precisar de backend nem dependência nova (Princípio IV mantido).

**Alternatives considered**: mini-servidor Node local rodando ao lado do
`http.server` (leria/gravaria arquivos direto por HTTP, sem seletor de
pasta nenhum) — rejeitado por contrariar a Decisão 2 (só File System
Access API, sem backend) sem necessidade comprovada: o problema relatado
era repetição de clique/navegação, não a existência da concessão em si,
e IndexedDB resolve isso sem mudar a arquitetura.
