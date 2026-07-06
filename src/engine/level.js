// @ts-check
// Construção das cartas de um nível. Lógica pura (sem DOM), não depende de
// microtexto/nome/hint — só de categoryId/word (contracts/ui-contract.md).

/** @typedef {{ id: string, categoryId: string, word: string }} WordCard */
/** @typedef {{ id: number, categoryIds: string[], cardsPerCategory: number, selectedWords: Record<string, string[]> }} Level */

/**
 * Gera as cartas de um nível a partir das palavras já curadas em
 * `level.selectedWords` — não sorteia do pool completo da categoria
 * (ver research.md, Decisão 2).
 * @param {Level} level
 * @returns {WordCard[]}
 */
export function buildLevelCards(level) {
  /** @type {WordCard[]} */
  const cards = [];
  for (const categoryId of level.categoryIds) {
    const words = level.selectedWords[categoryId] ?? [];
    for (const word of words) {
      cards.push({ id: `${categoryId}:${word}`, categoryId, word });
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
