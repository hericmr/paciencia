# Data Model: Editor de Baralho (ferramenta do mantenedor)

## `src/data/author-photos.json` — schema aditivo

Schema atual (inalterado, continua o único obrigatório):

```ts
type AuthorPhotos = Record<string, {
  photoUrl: string;     // ex.: "assets/cards/cat-13__jose-paulo-netto.webp"
  photoCredit: string;  // texto de crédito exibido no popup de inspeção
}>;
```

Campos novos, opcionais, gravados pelo editor quando preenchidos:

```ts
type AuthorPhotos = Record<string, {
  photoUrl: string;
  photoCredit: string;
  author?: string;          // nome de quem tirou/publicou a foto
  license?: string;         // ex.: "CC BY-SA 4.0"
  commonsFileUrl?: string;  // URL da página do arquivo (não da imagem crua)
}>;
```

- Retro-compatível: entradas existentes sem esses 3 campos continuam
  válidas; nenhum código do jogo (`main.js`, `word-info-popup.js`,
  `level-board.js`) precisa mudar — eles só leem `photoUrl`/`photoCredit`.
- O editor exige os 3 campos juntos (todos ou nenhum) quando o mantenedor
  marca a imagem como "foto de pessoa real" (FR-009); para imagens
  ilustrativas de conceito, os 3 continuam ausentes/opcionais.
- Não há validação desses 3 campos no `loader.js` do jogo — são metadados
  de proveniência para o mantenedor, não dado consumido pela engine
  (Princípio III: engine nunca lê `license`/`author`/`commonsFileUrl`).

## `src/data/categories.json` — sem mudança de schema

O editor lê e grava a mesma estrutura já documentada em
`specs/002-jogo-categorias-associacoes/data-model.md` (não repetida aqui).
Único novo comportamento: `validateCategories` (já existente em
`loader.js`) passa a ser reaproveitada pelo editor antes de qualquer
gravação — ver `research.md`, Decisão 6.

## Conceito novo, só do editor: CardId

Não é persistido em nenhum JSON — existe só em memória/no nome do arquivo
gerado:

```ts
function cardId(categoryId: string, word: string): string {
  return `${categoryId.toLowerCase()}__${slug(word)}`;
}
```

Onde `slug(word)` normaliza (NFD), remove diacríticos, minusculiza, troca
qualquer sequência de caracteres não `[a-z0-9]` por um único hífen, e
remove hífens nas pontas. Ver `research.md`, Decisão 3.
