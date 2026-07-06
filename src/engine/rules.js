// @ts-check
// Validação de movimentos de paciência por tema. Lógica pura (sem DOM).
// Não há mais alternância de cor nem sequência A→K — ver research.md, Decisão 6.

/** @typedef {import("./deck.js").EngineCard} EngineCard */

/**
 * Uma carta pode ir para a fundação do seu próprio tema a qualquer momento,
 * em qualquer ordem de rank.
 * @param {EngineCard} card
 * @param {string} foundationTheme tema da fundação de destino
 */
export function canMoveToFoundation(card, foundationTheme) {
  return card.theme === foundationTheme;
}

/**
 * Uma carta pode ir sobre outra no tableau se forem do mesmo tema; uma
 * coluna vazia aceita qualquer carta.
 * @param {EngineCard} card carta (ou base da sequência) que está sendo movida
 * @param {EngineCard|null} targetTopCard carta no topo da coluna de destino, ou null se vazia
 */
export function canMoveToTableau(card, targetTopCard) {
  if (targetTopCard === null) return true;
  return card.theme === targetTopCard.theme;
}

/**
 * Verifica se uma sequência de cartas pertence toda ao mesmo tema — útil ao
 * mover um grupo de cartas empilhadas juntas no tableau de uma vez.
 * @param {EngineCard[]} sequence
 */
export function isSameThemeGroup(sequence) {
  if (sequence.length === 0) return true;
  const theme = sequence[0].theme;
  return sequence.every((card) => card.theme === theme);
}
