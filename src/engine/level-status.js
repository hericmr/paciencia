// @ts-check
// Detecção de vitória e derrota de um nível. Lógica pura (sem DOM).

/** @typedef {import("./level.js").WordCard} WordCard */
/** @typedef {import("./level.js").Level} Level */
/** @typedef {Record<string, WordCard[]>} Slots */

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
