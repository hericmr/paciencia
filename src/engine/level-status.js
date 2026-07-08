// @ts-check
// Detecção de vitória e derrota de um nível. Lógica pura (sem DOM).
import { canMoveToTableauColumn } from "./associations-rules.js";

/** @typedef {import("./level.js").WordCard} WordCard */
/** @typedef {import("./level.js").Level} Level */
/** @typedef {import("./level.js").TableauColumn} TableauColumn */
/** @typedef {Record<string, WordCard[]>} Slots */
/**
 * @typedef {{
 *   tableauColumns: TableauColumn[],
 *   stock: WordCard[],
 *   waste: WordCard[],
 *   spotCategories: (string|null)[],
 *   openCategoryIds: Set<string>
 * }} MoveCheckState
 */

/**
 * @param {Slots} slots
 * @param {Level} level
 * @returns {boolean}
 */
export function checkLevelWin(slots, level) {
  const targetCount = Math.min(4, level.categoryIds.length);
  const completedCount = level.categoryIds.filter((catId) => (slots[catId]?.length ?? 0) === level.cardsPerCategory).length;
  return completedCount >= targetCount;
}

/**
 * Derrota: movimentos esgotados E o nível ainda não está completo. A
 * vitória tem prioridade — se as duas condições calharem juntas (último
 * movimento completa a última categoria), é vitória, não derrota (ver
 * spec.md, Edge Cases).
 * @param {number} movesRemaining
 * @param {Slots} slots
 * @param {Level} level
 * @returns {boolean}
 */
export function checkLevelLoss(movesRemaining, slots, level) {
  return movesRemaining <= 0 && !checkLevelWin(slots, level);
}

/**
 * @param {WordCard} card
 * @param {(string|null)[]} spotCategories
 * @param {Set<string>} openCategoryIds
 * @returns {boolean} true se essa carta pode ser jogada em algum spot de categoria agora
 */
function canPlaceCardInAnySpot(card, spotCategories, openCategoryIds) {
  if (card.isTitleCard) {
    const isAlreadyOpened = spotCategories.includes(card.categoryId);
    return !isAlreadyOpened && spotCategories.some((c) => c === null);
  }
  return spotCategories.some((c) => c === card.categoryId) && openCategoryIds.has(card.categoryId);
}

/**
 * Deadlock: não há nenhuma jogada válida possível no estado atual — nem
 * comprar/reciclar (Monte/Descarte vazios), nem mover a carta do topo de
 * alguma coluna ou do Descarte para outra coluna, nem encaixá-la em um spot
 * de categoria. Usada para declarar Game Over mesmo com movimentos
 * sobrando, quando o embaralhamento deixou o jogador sem nenhuma ação.
 * @param {MoveCheckState} levelState
 * @returns {boolean}
 */
export function hasAnyValidMove(levelState) {
  const stock = levelState.stock ?? [];
  const waste = levelState.waste ?? [];
  const columns = levelState.tableauColumns ?? [];
  const spotCategories = levelState.spotCategories ?? [];
  const openCategoryIds = levelState.openCategoryIds ?? new Set();

  // Comprar do monte, ou reciclar o descarte de volta ao monte, é sempre
  // uma ação disponível enquanto houver cartas em algum dos dois — mesmo
  // que a carta exposta agora não sirva, o próximo ciclo pode expor uma
  // que sirva.
  if (stock.length > 0 || waste.length > 0) return true;

  // Sem monte/descarte, só resta jogar as cartas já expostas no topo de
  // cada coluna: para outra coluna (nunca a própria — isso não é jogada
  // real, é a carta ficar onde já está) ou para um spot de categoria.
  for (let sourceColIndex = 0; sourceColIndex < columns.length; sourceColIndex++) {
    const top = columns[sourceColIndex].cards[columns[sourceColIndex].cards.length - 1];
    if (!top || !top.faceUp) continue;

    for (let targetColIndex = 0; targetColIndex < columns.length; targetColIndex++) {
      if (targetColIndex === sourceColIndex) continue;
      if (canMoveToTableauColumn(top.card, columns[targetColIndex])) return true;
    }
    if (canPlaceCardInAnySpot(top.card, spotCategories, openCategoryIds)) return true;
  }

  return false;
}
