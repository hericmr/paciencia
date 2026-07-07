// @ts-check
// Validação de movimento. `confundeCom` é metadado de curadoria de
// conteúdo, não é lido aqui (ver research.md, Decisão 6).

/** @typedef {import("./level.js").WordCard} WordCard */

/**
 * Uma carta pode entrar no slot de uma categoria se:
 * - for a carta-título da própria categoria (sempre aceita — é o que abre
 *   a categoria); ou
 * - for uma carta de palavra da própria categoria E a categoria já estiver
 *   aberta (carta-título já jogada).
 * @param {WordCard} card
 * @param {string} slotCategoryId
 * @param {Set<string>} openCategoryIds
 * @returns {boolean}
 */
export function canPlaceInCategory(card, slotCategoryId, openCategoryIds) {
  if (card.categoryId !== slotCategoryId) return false;
  if (card.isTitleCard) return true;
  return openCategoryIds.has(slotCategoryId);
}

/**
 * Mover a carta do topo de uma coluna para o topo de outra: sempre aceito,
 * sem regra de compatibilidade — serve só para desobstruir o caminho até
 * uma carta enterrada (confirmado com o mantenedor, ver research.md,
 * Decisão 8). Mantido como função (em vez de `true` inline) para deixar a
 * regra nomeada e documentada no ponto de chamada.
 * @returns {boolean}
 */
export function canMoveToTableauColumn() {
  return true;
}
