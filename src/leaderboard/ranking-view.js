// @ts-check
// Monta o bloco de ranking exibido no overlay de "Fase concluída!".

/** @param {unknown} value */
function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (ch) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch] ?? ch
  ));
}

/** @param {number} ms */
export function formatTime(ms) {
  const totalSeconds = Math.max(0, Math.round(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

/**
 * @param {Array<{ player_name: string, time_ms: number }>} ranking
 * @param {string} playerName
 * @param {number} timeMs
 */
export function buildRankingHtml(ranking, playerName, timeMs) {
  const rows = ranking.length
    ? ranking
        .map((entry, idx) => {
          const isYou = entry.player_name === playerName;
          return `
            <li class="ranking-row${isYou ? " ranking-row--you" : ""}">
              <span class="ranking-pos">${idx + 1}º</span>
              <span class="ranking-name">${escapeHtml(entry.player_name)}</span>
              <span class="ranking-time">${formatTime(Number(entry.time_ms))}</span>
            </li>`;
        })
        .join("")
    : `<li class="ranking-row ranking-row--empty">Nenhum tempo registrado ainda para esta fase.</li>`;

  return `
    <div class="overlay-ranking">
      <div class="overlay-ranking-title">Ranking — melhores tempos desta fase</div>
      <ol class="ranking-list">${rows}</ol>
      <div class="overlay-ranking-you">Seu tempo nesta corrida: <strong>${formatTime(timeMs)}</strong></div>
    </div>
  `;
}
