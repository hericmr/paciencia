// @ts-check
// Detecção de vitória e de estado sem jogadas possíveis. Lógica pura (sem DOM).
import { canMoveToFoundation, canMoveToTableau } from "./rules.js";

/** @typedef {import("./deck.js").EngineCard} EngineCard */
/** @typedef {Record<"spades"|"hearts"|"diamonds"|"clubs", EngineCard[]>} Foundations */

/**
 * @param {Foundations} foundations
 * @returns {boolean}
 */
export function checkWin(foundations) {
  return Object.values(foundations).every((cards) => cards.length === 13);
}

/**
 * Heurística de "sem jogadas possíveis": considera que sempre há uma jogada
 * disponível enquanto houver cartas no monte OU no descarte (podem ser
 * compradas/recicladas), já que essa é a ação sempre disponível em Klondike.
 * Só é considerado travado quando monte e descarte estão vazios e nenhuma
 * carta visível (topos do tableau + descarte) pode mover para uma fundação
 * ou para outra coluna do tableau.
 *
 * @param {{
 *   tableau: { id: string, faceUp: boolean, suit: string, rank: string }[][],
 *   stock: EngineCard[],
 *   waste: EngineCard[],
 *   foundations: Foundations
 * }} gameState
 * @returns {boolean} true se não há nenhuma jogada possível
 */
export function hasNoValidMoves(gameState) {
  const { tableau, stock, waste, foundations } = gameState;

  if (stock.length > 0 || waste.length > 0) return false;

  const tableauTops = tableau.map((column) => column[column.length - 1]).filter((c) => c && c.faceUp);

  for (const card of tableauTops) {
    if (canMoveToFoundation(card, foundations[/** @type {keyof Foundations} */ (card.suit)])) return false;
    for (const column of tableau) {
      const targetTop = column[column.length - 1] ?? null;
      if (targetTop === card) continue;
      if (canMoveToTableau(card, targetTop)) return false;
    }
  }

  return true;
}
