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
 * Mover a carta do topo de uma coluna (ou descarte) para o topo de outra coluna:
 * aceito se a coluna destino estiver vazia ou se a carta do topo da coluna destino
 * pertencer à mesma categoria (CAT-XX).
 * @param {WordCard} card
 * @param {any} targetColumn
 * @returns {boolean}
 */
export function canMoveToTableauColumn(card, targetColumn) {
  if (!card) return false;
  if (!targetColumn || !targetColumn.cards || targetColumn.cards.length === 0) {
    return true;
  }
  const topEntry = targetColumn.cards[targetColumn.cards.length - 1];
  return card.categoryId === topEntry.card.categoryId;
}
