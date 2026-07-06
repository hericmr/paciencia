// @ts-check
// Detecção de vitória e de estado sem jogadas possíveis. Lógica pura (sem DOM).
import { canMoveToFoundation, canMoveToTableau } from "./rules.js";

/** @typedef {import("./deck.js").EngineCard} EngineCard */
/** @typedef {Record<"teorico-metodologico"|"etico-politico"|"tecnico-operativo"|"historico-formativo", EngineCard[]>} Foundations */

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
 * compradas/recicladas). Como qualquer carta revelada sempre pode ir direto
 * para a fundação do seu próprio tema (ver research.md, Decisão 6), esse
 * estado só é atingido quando monte e descarte estão vazios e não sobra
 * nenhuma carta face-up jogável no tableau — na prática, uma situação rara.
 *
 * @param {{
 *   tableau: { id: string, faceUp: boolean, theme: string, rank: string }[][],
 *   stock: EngineCard[],
 *   waste: EngineCard[],
 *   foundations: Foundations
 * }} gameState
 * @returns {boolean} true se não há nenhuma jogada possível
 */
export function hasNoValidMoves(gameState) {
  const { tableau, stock, waste } = gameState;

  if (stock.length > 0 || waste.length > 0) return false;

  const tableauTops = tableau.map((column) => column[column.length - 1]).filter((c) => c && c.faceUp);

  for (const card of tableauTops) {
    if (canMoveToFoundation(card, card.theme)) return false;
    for (const column of tableau) {
      const targetTop = column[column.length - 1] ?? null;
      if (targetTop === card) continue;
      if (canMoveToTableau(card, targetTop)) return false;
    }
  }

  return true;
}
