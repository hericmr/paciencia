# Contract: Fluxo de UI do Editor de Baralho

> **Revisado (2026-07-13, 1ª rodada)**: a Tela 4 deixou de ser só "editor
> de imagem" e virou um editor de carta unificado (palavra + explicação +
> imagem + crédito/licença num único modal) — feedback do mantenedor
> após o primeiro teste manual: a divisão anterior (imagem na aba Cartas,
> texto da palavra só na aba Conteúdo) obrigava alternar de tela para
> editar uma única carta. Ver seções 1 e 2 atualizadas abaixo.
>
> **Revisado (2026-07-13, 2ª rodada)**: a Tela 2 virou um dashboard (cada
> categoria mostra contagem de palavras e cobertura de imagem, não só um
> botão com o nome) e ganhou o botão "+ Nova categoria" (Tela 2b) —
> feedback de que a tela inicial devia "mostrar todos os decks do jogo"
> para o mantenedor ir editando ou criando cartas. "Deck" aqui = categoria
> (unidade que já existia); não foi criado um novo agrupamento por
> fase/eixo.
>
> **Revisado (2026-07-13, 3ª rodada)**: a Tela 1 deixou de exigir reabrir
> o seletor de pastas a cada visita — o handle é lembrado via IndexedDB e
> a reconexão é automática (ou 1 clique, quando a permissão precisa ser
> reconfirmada). Ver `research.md`, Decisão 7.

## 1. Telas

1. **Tela inicial** — na primeira visita, botão "Abrir pasta do projeto"
   (`showDirectoryPicker`). Nas visitas seguintes, o editor tenta
   reconectar sozinho à mesma pasta (handle salvo em IndexedDB): se a
   permissão ainda estiver concedida, carrega direto, sem nenhum clique;
   senão, o botão vira "Continuar com a pasta do projeto" (1 clique
   reconfirma a permissão, sem reabrir o seletor). Um botão secundário
   "Trocar pasta" (visível só depois de conectado) esquece o handle
   salvo e volta ao fluxo de escolher do zero. Se a API não existir no
   navegador, mostra mensagem de erro explicando o requisito (Chrome/Edge)
   e não avança.
2. **Dashboard de categorias** — grade com TODAS as categorias de
   `categories.json`, cada uma mostrando id, nome, eixo e um resumo
   (`N palavras · M/N com imagem`) — não só um botão com o nome. Um botão
   fixo "+ Nova categoria" abre a Tela 2b. Clicar numa categoria abre a
   Tela 3.
2b. **Nova categoria** (modal) — pede `id` (livre, mas sugerindo o padrão
   `CAT-NN`/`MRX-NN` já usado), `nome` e `eixo`. Cria a categoria só em
   memória (`palavras: []`, `microtexto: ""`, `cartaTitulo: ""`) e abre
   direto a Tela 3 na aba Conteúdo — nada é gravado em disco até
   "Salvar categoria" validar com sucesso (o que exige preencher
   carta-título, micro-texto e ao menos 1 palavra primeiro).
3. **Categoria selecionada** — duas abas/seções:
   - **Cartas**: grade de todas as `palavras` já existentes na
     categoria, cada uma como um cartão com thumbnail (imagem atual ou
     placeholder) + nome. Clicar em qualquer carta — com ou sem imagem —
     abre a Tela 4 (editor de carta unificado).
   - **Conteúdo**: formulário com `nome`, `cartaTitulo`, `microtexto`
     (textarea + contador `N/280`), lista de `palavras`
     (adicionar/remover/renomear em lote) e `confundeCom` (checkboxes dos
     demais ids). `explicacoesPalavras` **não** é editado aqui — mora na
     Tela 4, por palavra (ver nota de revisão acima). Botão "Salvar
     categoria" desabilitado enquanto `validateCategories` (reaproveitada
     de `loader.js`) rejeitar o estado atual; se uma palavra removida ou
     renomeada ainda aparecer em `selectedWords` de algum nível
     (`levels.json`, lido só para esse aviso — nunca editado), um alerta
     não bloqueante aparece após salvar.
4. **Editor de carta (modal unificado)** — por palavra (carta) da
   categoria, um único formulário com:
   - campo de texto da própria palavra (renomeável — reflete em
     `palavras` e na chave de `explicacoesPalavras`/`author-photos.json`
     ao salvar);
   - textarea da explicação daquela palavra (`explicacoesPalavras`);
   - preview da imagem atual (ou placeholder) + preview da nova imagem
     redimensionada (canvas) + área de drop/`<input type="file">`;
   - crédito (`photoCredit`, obrigatório só se a carta tiver ou passar a
     ter imagem) e proveniência (`author`, `license`, `commonsFileUrl`,
     opcionais) + checkbox "esta imagem é foto de uma pessoa real", que
     torna os 3 campos de proveniência obrigatórios.
   Botão "Salvar carta" desabilitado até a validação passar (palavra não
   vazia, sem duplicata na categoria, metadados de imagem válidos) — uma
   única ação de salvar grava `categories.json` (palavra + explicação) e
   `author-photos.json` (imagem + crédito) juntos.

## 2. Contrato de gravação em disco

Todas as gravações usam o `FileSystemDirectoryHandle` obtido na Tela 1:

- `categories.json`: reescrito por inteiro via
  `getFileHandle("src/data/categories.json").createWritable()`,
  conteúdo = `JSON.stringify(dados, null, 2)` (sem quebra de linha final,
  igual ao arquivo atual).
- `author-photos.json`: mesma mecânica, mesmo caminho
  (`src/data/author-photos.json`).
- Imagem: `getDirectoryHandle("assets", { create: false })` →
  `getDirectoryHandle("cards", { create: true })` →
  `getFileHandle("<cardId>.webp", { create: true }).createWritable()`,
  conteúdo = `Blob` retornado por `canvas.toBlob("image/webp", 0.8)`.
- Nenhuma gravação parcial: se qualquer validação falhar, nada é escrito
  (nem o JSON, nem a imagem) — tudo ou nada por ação de "Salvar".

## 3. Acessibilidade mínima (Princípio V, aplicado à ferramenta)

- Toda ação de clique (selecionar carta, salvar, abrir categoria) também
  responde a Enter/Espaço quando o elemento tem foco.
- Campos de formulário têm `<label>` associado (`for`/`id`) ou
  `aria-label`.
- Mensagens de erro de validação são anunciadas via
  `aria-live="polite"` numa região dedicada, não só por cor.
- Fora de escopo: suporte completo a leitor de tela para o preview visual
  de imagem (ver `plan.md`, Constitution Check, Princípio V — trade-off
  aceito para ferramenta de uso único).

## 4. O que o editor nunca faz

- Nunca grava em `src/engine/`, `src/ui/`, `src/audio/`, `src/leaderboard/`
  ou `levels.json` — este último é lido (só leitura, best-effort) apenas
  para o aviso de cruzamento descrito na Tela 3, nunca reescrito.
- Nunca faz requisição de rede (não sobe imagem para nenhum lugar, não
  chama nenhuma API externa).
- Nunca é referenciado a partir de `index.html` do jogo nem incluído em
  `scripts/prepare-desktop-dist.mjs`.
