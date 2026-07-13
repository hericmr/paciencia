// @ts-check
// Nome do jogador para o ranking: pedido uma única vez, depois reaproveitado
// via localStorage nas fases seguintes.

const STORAGE_KEY = "paciencia_ss.leaderboard.playerName";

/** @returns {string|null} */
function getSavedPlayerName() {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

/** @param {string} name */
function savePlayerName(name) {
  try {
    window.localStorage.setItem(STORAGE_KEY, name);
  } catch {
    // localStorage indisponível: o nome só dura a sessão atual.
  }
}

/**
 * Retorna o nome salvo ou pede ao jogador via modal (uma vez).
 * @returns {Promise<string>}
 */
export function ensurePlayerName() {
  const saved = getSavedPlayerName();
  if (saved) return Promise.resolve(saved);

  return new Promise((resolve) => {
    const overlay = document.createElement("div");
    overlay.id = "player-name-modal-overlay";
    overlay.className = "modal-overlay";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-labelledby", "player-name-modal-title");
    overlay.innerHTML = `
      <div class="modal-container" tabIndex="-1">
        <div class="modal-subtitle">Ranking</div>
        <h2 class="modal-title" id="player-name-modal-title">Como podemos te chamar?</h2>
        <div class="modal-body">Esse nome vai aparecer no ranking da fase. Só precisa informar uma vez.</div>
        <form id="player-name-form">
          <input
            id="player-name-input"
            class="leaderboard-name-input"
            type="text"
            maxlength="24"
            placeholder="Seu nome"
            autocomplete="off"
            required
          />
          <button class="modal-action-btn" type="submit">Confirmar</button>
        </form>
      </div>
    `;
    document.body.appendChild(overlay);

    setTimeout(() => {
      overlay.classList.add("open");
      /** @type {HTMLInputElement|null} */ (document.getElementById("player-name-input"))?.focus();
    }, 10);

    const form = document.getElementById("player-name-form");
    form?.addEventListener("submit", (e) => {
      e.preventDefault();
      const input = /** @type {HTMLInputElement|null} */ (document.getElementById("player-name-input"));
      const name = (input?.value ?? "").trim().slice(0, 24) || "Jogador";
      savePlayerName(name);
      overlay.classList.remove("open");
      setTimeout(() => overlay.remove(), 200);
      resolve(name);
    });
  });
}
