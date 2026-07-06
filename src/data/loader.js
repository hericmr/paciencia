// @ts-check

/** @typedef {{ id: string, theme: string, rank: string, title: string, body: string, status: string, photoUrl: string|null, photoCredit: string|null }} CardData */
/** @typedef {{ order: number, summary: string, fullText: string }} PrincipleData */

const THEMES = ["teorico-metodologico", "etico-politico", "tecnico-operativo", "historico-formativo"];
const RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
const AUTHOR_RANKS = new Set(["J", "Q", "K"]);

/**
 * @param {string} deckUrl
 * @returns {Promise<{ deckId: string, deckName: string, themes: object, cards: CardData[] }>}
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
  for (const theme of THEMES) {
    const cardsInTheme = data.cards.filter((c) => c.theme === theme);
    if (cardsInTheme.length !== 13) {
      throw new Error(`Deck inválido: tema "${theme}" tem ${cardsInTheme.length} cartas, esperado 13`);
    }
    const ranksInTheme = new Set(cardsInTheme.map((c) => c.rank));
    for (const rank of RANKS) {
      if (!ranksInTheme.has(rank)) {
        throw new Error(`Deck inválido: tema "${theme}" está sem a carta de valor "${rank}"`);
      }
    }
    for (const card of cardsInTheme) {
      const isAuthorCard = AUTHOR_RANKS.has(card.rank);
      if (!isAuthorCard && (card.photoUrl || card.photoCredit)) {
        throw new Error(`Deck inválido: carta "${card.id}" não é de autor/a (J/Q/K) mas tem foto`);
      }
      if (card.photoUrl && !card.photoCredit) {
        throw new Error(`Deck inválido: carta "${card.id}" tem photoUrl sem photoCredit (atribuição obrigatória)`);
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

export { THEMES, RANKS, AUTHOR_RANKS };
