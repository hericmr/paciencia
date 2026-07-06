// @ts-check
// Validação de movimentos de paciência Klondike. Lógica pura (sem DOM).
import { rankIndex } from "./deck.js";

/** @typedef {import("./deck.js").EngineCard} EngineCard */

const RED_SUITS = new Set(["hearts", "diamonds"]);

/** @param {string} suit */
export function isRed(suit) {
  return RED_SUITS.has(suit);
}

/**
 * Uma carta pode ir para uma fundação se for do mesmo naipe e a próxima
 * carta da sequência ascendente (A, 2, 3, ... K).
 * @param {EngineCard} card
 * @param {EngineCard[]} foundationCards cartas já empilhadas nessa fundação (em ordem)
 */
export function canMoveToFoundation(card, foundationCards) {
  if (foundationCards.length > 0 && foundationCards[0].suit !== card.suit) return false;
  return rankIndex(card.rank) === foundationCards.length + 1;
}

/**
 * Uma carta pode ir sobre outra no tableau se a carta de baixo (destino) for
 * uma cor diferente e um rank acima; ou se a coluna de destino está vazia e a
 * carta é um Rei.
 * @param {EngineCard} card carta (ou base da sequência) que está sendo movida
 * @param {EngineCard|null} targetTopCard carta no topo da coluna de destino, ou null se vazia
 */
export function canMoveToTableau(card, targetTopCard) {
  if (targetTopCard === null) {
    return card.rank === "K";
  }
  return isRed(targetTopCard.suit) !== isRed(card.suit) && rankIndex(targetTopCard.rank) === rankIndex(card.rank) + 1;
}

/**
 * Verifica se uma sequência de cartas (da base ao topo, isto é, da mais
 * antiga à mais recentemente revelada) forma um "run" válido para ser movida
 * em conjunto: cada carta seguinte é uma cor alternada e um rank abaixo.
 * @param {EngineCard[]} sequence
 */
export function isValidSequence(sequence) {
  for (let i = 0; i < sequence.length - 1; i++) {
    const current = sequence[i];
    const next = sequence[i + 1];
    if (isRed(current.suit) === isRed(next.suit)) return false;
    if (rankIndex(current.rank) !== rankIndex(next.rank) + 1) return false;
  }
  return true;
}
