// @ts-check
// Validação de movimento: uma carta só entra no slot da sua própria
// categoria. `confundeCom` é metadado de curadoria de conteúdo, não é lido
// aqui (ver research.md, Decisão 6).

/** @typedef {import("./level.js").WordCard} WordCard */

/**
 * @param {WordCard} card
 * @param {string} slotCategoryId
 * @returns {boolean}
 */
export function canPlaceInCategory(card, slotCategoryId) {
  return card.categoryId === slotCategoryId;
}
