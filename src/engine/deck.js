// @ts-check
// Lógica pura de baralho: não depende de DOM, fetch, nem de título/texto das cartas
// (apenas id/theme/rank), conforme contracts/ui-contract.md.

/** @typedef {{ id: string, theme: "teorico-metodologico"|"etico-politico"|"tecnico-operativo"|"historico-formativo", rank: string }} EngineCard */

/**
 * Constrói o baralho de 52 cartas a partir dos dados de conteúdo, mantendo
 * apenas os campos estruturais que a engine precisa.
 * @param {{ theme: string, rank: string, id: string }[]} cardsData
 * @returns {EngineCard[]}
 */
export function buildDeck(cardsData) {
  return cardsData.map(({ id, theme, rank }) => ({
    id,
    theme: /** @type {EngineCard["theme"]} */ (theme),
    rank,
  }));
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
