// @ts-check

/**
 * Retorna os números de ordem dos princípios desbloqueados com base
 * na quantidade de fundações completadas.
 * @param {number} foundationsCompletedCount
 * @returns {number[]}
 */
export function computeUnlockedPrinciples(foundationsCompletedCount) {
  const count = Math.min(11, Math.max(0, foundationsCompletedCount));
  const result = [];
  for (let i = 1; i <= count; i++) {
    result.push(i);
  }
  return result;
}
