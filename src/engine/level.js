// @ts-check
// Construção do baralho e do tableau empilhado de um nível. Lógica pura
// (sem DOM); a engine só enxerga categoryId/word/isTitleCard — nunca
// nome/microtexto/hint (Princípio III). Ver research.md, Decisão 8.

/** @typedef {{ id: string, categoryId: string, word: string, isTitleCard: boolean }} WordCard */
/** @typedef {import("../data/loader.js").LevelData} Level */
/** @typedef {import("../data/loader.js").CategoryData} Category */
/** @typedef {{ cards: { card: WordCard, faceUp: boolean }[] }} TableauColumn */

/**
 * Uma carta-título por categoria do nível — precisa ser desenterrada e
 * jogada antes que a categoria aceite cartas de palavra.
 * @param {Level} level
 * @param {Category[]} categories
 * @returns {WordCard[]}
 */
export function buildTitleCards(level, categories) {
  const categoriesById = new Map(categories.map((c) => [c.id, c]));
  return level.categoryIds.map((categoryId) => {
    const category = categoriesById.get(categoryId);
    if (!category) throw new Error(`Categoria "${categoryId}" não encontrada`);
    return { id: `TITLE:${categoryId}`, categoryId, word: category.cartaTitulo, isTitleCard: true };
  });
}

/**
 * Gera as cartas de palavra a partir de `level.selectedWords` (curadas, não
 * sorteadas do pool completo — ver research.md, Decisão 2).
 * @param {Level} level
 * @returns {WordCard[]}
 */
export function buildWordCards(level) {
  /** @type {WordCard[]} */
  const cards = [];
  for (const categoryId of level.categoryIds) {
    const words = level.selectedWords[categoryId] ?? [];
    for (const word of words) {
      cards.push({ id: `${categoryId}:${word}`, categoryId, word, isTitleCard: false });
    }
  }
  return cards;
}

/**
 * Embaralha uma cópia das cartas (Fisher–Yates). Não muta o array recebido.
 * @param {WordCard[]} cards
 * @param {() => number} [rng] gerador de números aleatórios em [0, 1); injetável para testes
 * @returns {WordCard[]}
 */
export function shuffleCards(cards, rng = Math.random) {
  const result = cards.slice();
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Posição de inserção de uma carta-título dentro de uma coluna, de acordo
 * com a profundidade configurada. Índice 0 = base da coluna (mais
 * enterrada); índice === length = topo (jogável imediatamente).
 * @param {"topo"|"meio"|"fundo"} depth
 * @param {number} currentLength
 * @returns {number}
 */
export function depthToInsertIndex(depth, currentLength) {
  if (depth === "topo") return currentLength;
  if (depth === "fundo") return 0;
  return Math.floor(currentLength / 2);
}

/**
 * Distribui as cartas-título e de palavra em colunas empilhadas. As
 * cartas de palavra são embaralhadas e distribuídas round-robin entre as
 * colunas; as cartas-título são inseridas em seguida, uma por coluna
 * (título[i] vai para a coluna `i % columns`), na profundidade indicada.
 * Sem monte/descarte — tudo fica nas colunas (ver research.md, Decisão 8).
 * @param {WordCard[]} titleCards
 * @param {WordCard[]} wordCards
 * @param {number} columns
 * @param {"topo"|"meio"|"fundo"|"embaralhado"} depth
 * @param {() => number} [rng]
 * @returns {TableauColumn[]}
 */
export function dealTableau(titleCards, wordCards, columns, depth, rng = Math.random) {
  if (depth === "embaralhado") {
    const allCards = [...titleCards, ...wordCards];
    const shuffledAll = shuffleCards(allCards, rng);

    /** @type {WordCard[][]} */
    const columnArrays = Array.from({ length: columns }, () => []);
    let cardIdx = 0;

    for (let col = 0; col < columns; col++) {
      const numCardsInCol = col + 2; // Col 0 gets 2 cards, Col 1 gets 3 cards, Col 2 gets 4 cards, etc.
      for (let j = 0; j < numCardsInCol; j++) {
        if (cardIdx < shuffledAll.length) {
          columnArrays[col].push(shuffledAll[cardIdx]);
          cardIdx++;
        }
      }
    }

    const stock = shuffledAll.slice(cardIdx);

    return {
      columns: columnArrays.map((cards) => ({
        cards: cards.map((card, idx) => ({ card, faceUp: idx === cards.length - 1 })),
      })),
      stock,
    };
  }

  const shuffledWords = shuffleCards(wordCards, rng);

  /** @type {WordCard[][]} */
  const columnArrays = Array.from({ length: columns }, () => []);
  shuffledWords.forEach((card, i) => {
    columnArrays[i % columns].push(card);
  });

  titleCards.forEach((titleCard, i) => {
    const col = columnArrays[i % columns];
    const insertIndex = depthToInsertIndex(depth, col.length);
    col.splice(insertIndex, 0, titleCard);
  });

  return columnArrays.map((cards) => ({
    cards: cards.map((card, idx) => ({ card, faceUp: idx === cards.length - 1 })),
  }));
}
