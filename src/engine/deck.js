// @ts-check
// Lógica pura de baralho: não depende de DOM, fetch, nem de título/texto das cartas
// (apenas id/theme/rank), conforme contracts/ui-contract.md.
//
// A engine não assume mais um número fixo de temas nem de cartas por tema
// (ver research.md, Decisão 7) — o tamanho de cada tema é sempre derivado
// dos dados via computeThemeSizes.

/** @typedef {{ id: string, theme: string, rank: string }} EngineCard */

/**
 * Constrói o baralho a partir dos dados de conteúdo, mantendo apenas os
 * campos estruturais que a engine precisa.
 * @param {{ theme: string, rank: string, id: string }[]} cardsData
 * @returns {EngineCard[]}
 */
export function buildDeck(cardsData) {
  return cardsData.map(({ id, theme, rank }) => ({ id, theme, rank }));
}

/**
 * Calcula quantas cartas cada tema tem no baralho carregado — usado para
 * saber quando uma fundação está completa (não é mais um número fixo como 13).
 * @param {EngineCard[]} deck
 * @returns {Record<string, number>}
 */
export function computeThemeSizes(deck) {
  /** @type {Record<string, number>} */
  const sizes = {};
  for (const card of deck) {
    sizes[card.theme] = (sizes[card.theme] ?? 0) + 1;
  }
  return sizes;
}

/**
 * Embaralha uma cópia do baralho (Fisher–Yates). Não muta o array recebido.
 * @param {EngineCard[]} deck
 * @param {() => number} [rng] gerador de números aleatórios em [0, 1); injetável para testes
 * @returns {EngineCard[]}
 */
export function shuffleDeck(deck, rng = Math.random) {
  const result = deck.slice();
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

const RANK_ORDER = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

/**
 * @param {string} rank
 * @returns {number} posição 1-indexada do rank na sequência A..K
 */
export function rankIndex(rank) {
  const idx = RANK_ORDER.indexOf(rank);
  if (idx === -1) throw new Error(`Rank desconhecido: "${rank}"`);
  return idx + 1;
}

export { RANK_ORDER };
