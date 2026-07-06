// @ts-check

/** @typedef {{ id: string, theme: string, rank: string, title: string, body: string, status: string, photoUrl: string|null, photoCredit: string|null }} CardData */
/** @typedef {{ order: number, summary: string, fullText: string }} PrincipleData */

const AUTHORS_THEME = "autores";

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
 * Valida um deck sem assumir número fixo de temas nem de cartas por tema
 * (ver research.md, Decisão 7). Cada tema declarado em `themes` deve ter ao
 * menos 1 carta e nenhum rank duplicado dentro dele; fotos só são permitidas
 * no tema "autores".
 * @param {{ themes?: Record<string, unknown>, cards?: CardData[] }} data
 */
export function validateDeck(data) {
  if (!data.themes || typeof data.themes !== "object" || Object.keys(data.themes).length === 0) {
    throw new Error("Deck inválido: nenhum tema declarado em 'themes'");
  }
  if (!Array.isArray(data.cards) || data.cards.length === 0) {
    throw new Error("Deck inválido: nenhuma carta em 'cards'");
  }

  const declaredThemes = new Set(Object.keys(data.themes));
  const seenIds = new Set();

  for (const card of data.cards) {
    if (seenIds.has(card.id)) {
      throw new Error(`Deck inválido: id de carta duplicado "${card.id}"`);
    }
    seenIds.add(card.id);

    if (!declaredThemes.has(card.theme)) {
      throw new Error(`Deck inválido: carta "${card.id}" referencia tema não declarado "${card.theme}"`);
    }

    const isAuthorCard = card.theme === AUTHORS_THEME;
    if (!isAuthorCard && (card.photoUrl || card.photoCredit)) {
      throw new Error(`Deck inválido: carta "${card.id}" não é do tema "${AUTHORS_THEME}" mas tem foto`);
    }
    if (card.photoUrl && !card.photoCredit) {
      throw new Error(`Deck inválido: carta "${card.id}" tem photoUrl sem photoCredit (atribuição obrigatória)`);
    }
  }

  for (const theme of declaredThemes) {
    const cardsInTheme = data.cards.filter((c) => c.theme === theme);
    if (cardsInTheme.length === 0) {
      throw new Error(`Deck inválido: tema "${theme}" está declarado mas não tem nenhuma carta`);
    }
    const ranksInTheme = cardsInTheme.map((c) => c.rank);
    if (new Set(ranksInTheme).size !== ranksInTheme.length) {
      throw new Error(`Deck inválido: tema "${theme}" tem ranks duplicados entre suas cartas`);
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

export { AUTHORS_THEME };
