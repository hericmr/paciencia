// @ts-check

/** @typedef {{ id: string, suit: string, rank: string, title: string, body: string, status: string }} CardData */
/** @typedef {{ order: number, summary: string, fullText: string }} PrincipleData */

const SUITS = ["spades", "hearts", "diamonds", "clubs"];
const RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

/**
 * @param {string} deckUrl
 * @returns {Promise<{ deckId: string, deckName: string, suits: object, cards: CardData[] }>}
 */
export async function loadDeck(deckUrl) {
  const response = await fetch(deckUrl);
  if (!response.ok) {
    throw new Error(`Falha ao carregar deck de ${deckUrl}: HTTP ${response.status}`);
  }
  const data = await response.json();
  validateDeck(data);
  return data;
}

/**
 * @param {string} principlesUrl
 * @returns {Promise<PrincipleData[]>}
 */
export async function loadPrinciples(principlesUrl) {
  const response = await fetch(principlesUrl);
  if (!response.ok) {
    throw new Error(`Falha ao carregar princípios de ${principlesUrl}: HTTP ${response.status}`);
  }
  const data = await response.json();
  validatePrinciples(data.principles);
  return data.principles;
}

/**
 * @param {{ cards?: CardData[] }} data
 */
export function validateDeck(data) {
  if (!Array.isArray(data.cards) || data.cards.length !== 52) {
    throw new Error(`Deck inválido: esperado 52 cartas, recebido ${data.cards?.length ?? 0}`);
  }
  for (const suit of SUITS) {
    const cardsInSuit = data.cards.filter((c) => c.suit === suit);
    if (cardsInSuit.length !== 13) {
      throw new Error(`Deck inválido: naipe "${suit}" tem ${cardsInSuit.length} cartas, esperado 13`);
    }
    const ranksInSuit = new Set(cardsInSuit.map((c) => c.rank));
    for (const rank of RANKS) {
      if (!ranksInSuit.has(rank)) {
        throw new Error(`Deck inválido: naipe "${suit}" está sem a carta de valor "${rank}"`);
      }
    }
  }
}

/**
 * @param {PrincipleData[]} principles
 */
export function validatePrinciples(principles) {
  if (!Array.isArray(principles) || principles.length !== 11) {
    throw new Error(`Princípios inválidos: esperado 11, recebido ${principles?.length ?? 0}`);
  }
  const orders = principles.map((p) => p.order).sort((a, b) => a - b);
  for (let i = 0; i < 11; i++) {
    if (orders[i] !== i + 1) {
      throw new Error(`Princípios inválidos: ordem deveria ser 1..11 contígua, recebido [${orders.join(",")}]`);
    }
  }
}

export { SUITS, RANKS };
