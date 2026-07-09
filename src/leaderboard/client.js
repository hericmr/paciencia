// @ts-check
// Cliente do ranking (Google Apps Script como backend). Contrato da API:
// POST { player_name, phase_id, phase_name, time_ms } -> { success: true } | { error }
// GET  ?phase=<id>&limit=<n> -> [{ player_name, phase_id, phase_name, time_ms, created_at }, ...]
import { LEADERBOARD_API_URL } from "./config.js";

/**
 * @param {{ playerName: string, phaseId: number, phaseName: string, timeMs: number }} entry
 * @returns {Promise<boolean>} true se o envio deu certo
 */
export async function submitPhaseTime(entry) {
  try {
    const response = await fetch(LEADERBOARD_API_URL, {
      method: "POST",
      // text/plain evita o preflight de CORS que o Apps Script não trata bem.
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({
        player_name: entry.playerName,
        phase_id: entry.phaseId,
        phase_name: entry.phaseName,
        time_ms: entry.timeMs,
      }),
    });
    const data = await response.json();
    return !!data?.success;
  } catch (error) {
    console.error("Leaderboard: falha ao enviar tempo", error);
    return false;
  }
}

/**
 * @param {number} phaseId
 * @param {number} [limit]
 * @returns {Promise<Array<{ player_name: string, time_ms: number }>>}
 */
export async function fetchPhaseRanking(phaseId, limit = 10) {
  try {
    const url = `${LEADERBOARD_API_URL}?phase=${phaseId}&limit=${limit}`;
    const response = await fetch(url);
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Leaderboard: falha ao buscar ranking", error);
    return [];
  }
}
