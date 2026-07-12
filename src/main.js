// @ts-check
import { loadCategories, loadLevels } from "./data/loader.js";
import { buildTitleCards, buildWordCards, dealTableau } from "./engine/level.js";
import { checkLevelWin, checkLevelLoss, hasAnyValidMove } from "./engine/level-status.js";
import { createProgressStore } from "./progress/store.js";
import { createSoundManager } from "./audio/sound-manager.js";
import { renderLevelBoard } from "./ui/level-board.js";
import { renderReviewMode } from "./ui/review-mode.js";
import { showWordInfoPopup } from "./ui/word-info-popup.js";
import { ensurePlayerName } from "./leaderboard/player-name.js";
import { submitPhaseTime, fetchPhaseRanking } from "./leaderboard/client.js";
import { buildRankingHtml } from "./leaderboard/ranking-view.js";

/** @type {Record<number, string>} rótulo de cada fase, usado no ranking */
const PHASE_NAMES = {
  1: "Fase 1",
  2: "Fase 2",
  3: "Fase 3",
  4: "Fase Especial: Marxismo",
};

// Elementos do DOM
const gameRoot = document.getElementById("game-root");
const reviewRoot = document.getElementById("review-root");
const newGameBtn = document.getElementById("new-game-btn");
const reviewModeBtn = document.getElementById("review-mode-btn");
const inspectBtn = document.getElementById("inspect-btn");
const muteBtn = document.getElementById("mute-btn");

// Dados e stores globais
/** @type {import("./data/loader.js").CategoryData[]} */
let categoriesData = [];
/** @type {import("./data/loader.js").LevelData[]} */
let levelsData = [];
/** @type {Map<string, import("./data/loader.js").CategoryData>} */
const categoriesMap = new Map();
/** @type {Record<string, { photoUrl: string, photoCredit: string }>} */
let authorPhotos = {};
const progressStore = createProgressStore();
const soundManager = createSoundManager({ storage: window.localStorage });
/** @type {import("./ui/level-board.js").LevelState | null} */
let levelState = null;
/** @type {import("./data/loader.js").LevelData | null} */
let currentLevel = null;
/** true só no primeiro render após um "Nova partida"/troca de nível — dispara a animação de virar as cartas */
let isFreshDeal = false;
let isInspectMode = false;
/** timestamp (Date.now()) de quando a fase atual começou, para o ranking */
let phaseStartedAt = 0;

async function init() {
  try {
    categoriesData = await loadCategories("src/data/categories.json");
    categoriesData.forEach((c) => categoriesMap.set(c.id, c));

    levelsData = await loadLevels("src/data/levels.json", categoriesData);

    const photosResponse = await fetch(`src/data/author-photos.json?t=${Date.now()}`);
    authorPhotos = photosResponse.ok ? await photosResponse.json() : {};

    newGameBtn?.addEventListener("click", () => startLevel(currentLevel?.id ?? levelsData[0].id));
    reviewModeBtn?.addEventListener("click", () => switchToReviewMode());
    const levelSelect = document.getElementById("level-select");
    levelSelect?.addEventListener("change", (e) => {
      const selectedId = parseInt(e.target.value, 10);
      if (!isNaN(selectedId)) {
        startLevel(selectedId);
      }
    });
    muteBtn?.addEventListener("click", () => {
      soundManager.toggleMuted();
      updateMuteButton();
    });

    inspectBtn?.addEventListener("click", () => {
      isInspectMode = !isInspectMode;
      if (isInspectMode) {
        inspectBtn.setAttribute("aria-pressed", "true");
        inspectBtn.classList.add("active");
        document.body.classList.add("inspect-mode-active");
      } else {
        inspectBtn.setAttribute("aria-pressed", "false");
        inspectBtn.classList.remove("active");
        document.body.classList.remove("inspect-mode-active");
      }
    });

    // Intercepta cliques nas cartas para o modo inspeção antes do level-board processar o movimento
    gameRoot?.addEventListener("click", (e) => {
      if (!isInspectMode) return;
      const cardEl = /** @type {HTMLElement} */ (e.target).closest(".word-card");
      if (!cardEl) return;
      
      const id = cardEl.getAttribute("data-id");
      if (!id) return; // Cartas viradas para baixo não têm data-id

      e.stopPropagation();
      e.preventDefault();

      let categoryId, word, isTitle;
      if (id.startsWith("TITLE:")) {
        isTitle = true;
        categoryId = id.split(":")[1];
        word = "Carta Categoria";
      } else {
        isTitle = false;
        const firstColon = id.indexOf(":");
        categoryId = id.substring(0, firstColon);
        word = id.substring(firstColon + 1);
      }

      const category = categoriesMap.get(categoryId);
      if (category) {
        if (isTitle) {
          showWordInfoPopup(word, category.nome, category.microtexto, null, cardEl);
        } else {
          const texto = category.explicacoesPalavras?.[word];
          const photo = authorPhotos[word] ?? null;
          showWordInfoPopup(word, category.nome, texto, photo, cardEl);
        }
      }

      // Desliga o modo inspeção após 1 uso
      isInspectMode = false;
      inspectBtn?.setAttribute("aria-pressed", "false");
      inspectBtn?.classList.remove("active");
      document.body.classList.remove("inspect-mode-active");
    }, { capture: true });

    updateMuteButton();
    startAmbientMusicWithRetry();

    try {
      const mascotHtml = `
        <div class="mascot-container">
          <div class="speech-bubble">
            <h2>Fala, assistente social!</h2>
            <p>Prontes pra colocar o Serviço Social em jogo e revisar conteúdos? Confira o Top 10 da Fase ${levelsData[0].id}:</p>
          </div>
          <img src="assets/logo.webp" alt="Formiga Serviço Social" class="mascot-img">
        </div>
      `;
      const loadingHtml = `<div id="ranking-container" style="color: var(--color-gold); padding: 1rem 0;">Buscando os melhores tempos...</div>`;

      showStatusOverlay(
        "",
        "",
        "Bora pro Jogo! 🐜",
        levelsData[0].id,
        null,
        null,
        mascotHtml + loadingHtml
      );

      fetchPhaseRanking(levelsData[0].id, 10)
        .then((ranking) => {
          const container = document.getElementById("ranking-container");
          if (container) {
            container.outerHTML = buildRankingHtml(ranking, null, null);
          }
        })
        .catch((err) => {
          console.error("Ranking inicial indisponível", err);
          const container = document.getElementById("ranking-container");
          if (container) {
            container.innerHTML = "Ranking temporariamente indisponível.";
          }
        });
    } catch (err) {
      console.error("Ranking inicial indisponível", err);
      startLevel(levelsData[0].id);
    }
  } catch (error) {
    console.error("Erro ao inicializar o jogo:", error);
    if (gameRoot) {
      gameRoot.innerHTML = `<div style="padding: 2rem; text-align: center; color: var(--color-red);">
        <h2>Erro de Carregamento</h2>
        <p>Não foi possível iniciar o jogo. Verifique o console para mais detalhes.</p>
      </div>`;
    }
  }
}

/** @param {number} levelId */
function startLevel(levelId) {
  removeStatusOverlay();

  gameRoot?.removeAttribute("hidden");
  reviewRoot?.setAttribute("hidden", "true");
  reviewModeBtn?.classList.remove("active");

  const level = levelsData.find((l) => l.id === levelId) ?? levelsData[0];
  currentLevel = level;

  const levelSelect = document.getElementById("level-select");
  if (levelSelect) {
    levelSelect.value = String(level.id);
  }

  const titleCards = buildTitleCards(level, categoriesData);
  const wordCards = buildWordCards(level);
  let tableauColumns;
  let stock = [];
  let waste = [];

  const dealResult = dealTableau(titleCards, wordCards, level.columns, level.profundidadeTitulos);
  if (Array.isArray(dealResult)) {
    tableauColumns = dealResult;
  } else {
    tableauColumns = dealResult.columns;
    stock = dealResult.stock;
  }

  /** @type {Record<string, any[]>} */
  const slots = {};
  for (const categoryId of level.categoryIds) slots[categoryId] = [];

  levelState = {
    tableauColumns,
    slots,
    openCategoryIds: new Set(),
    spotCategories: [null, null, null, null],
    stock,
    waste,
    movesRemaining: level.moveLimit,
    status: "em_andamento",
  };

  phaseStartedAt = Date.now();
  isFreshDeal = true;
  updateUI();
}

function updateUI() {
  if (!gameRoot || !levelState || !currentLevel) return;

  if (isFreshDeal) soundManager.play("dealShuffle");

  const movesCounter = document.getElementById("moves-counter");
  if (movesCounter) {
    movesCounter.textContent = `Movimentos: ${levelState.movesRemaining}`;
    movesCounter.style.display = "inline-block";
    movesCounter.setAttribute("aria-live", "polite");
  }

  renderLevelBoard(
    gameRoot,
    levelState,
    currentLevel,
    categoriesMap,
    authorPhotos,
    progressStore,
    () => {
      updateUI();
      checkLevelStatus();
    },
    updateUI,
    isFreshDeal,
    soundManager
  );
  isFreshDeal = false;
}

/**
 * Tenta iniciar a música ambiente em loop. Navegadores bloqueiam autoplay
 * com som antes de um gesto do usuário — se a primeira tentativa (na carga
 * da página) for recusada, tenta de novo no primeiro clique/toque/tecla.
 */
function startAmbientMusicWithRetry() {
  soundManager.startAmbientMusic();
  const retry = () => {
    soundManager.startAmbientMusic();
    document.removeEventListener("click", retry);
    document.removeEventListener("keydown", retry);
    document.removeEventListener("touchstart", retry);
  };
  document.addEventListener("click", retry, { once: true });
  document.addEventListener("keydown", retry, { once: true });
  document.addEventListener("touchstart", retry, { once: true });
}

function updateMuteButton() {
  if (!muteBtn) return;
  const muted = soundManager.isMuted();
  muteBtn.textContent = muted ? "Som: Off" : "Som: On";
  muteBtn.setAttribute("aria-pressed", String(muted));
  muteBtn.setAttribute("aria-label", muted ? "Ativar som" : "Desativar som");
}

/**
 * Garante o nome do jogador, envia o tempo da fase recém-concluída pro
 * ranking e busca o Top 10 atualizado, já pronto em HTML. Nunca lança: se o
 * ranking estiver fora do ar, o jogo segue normalmente sem essa seção.
 * @param {number} phaseId
 * @param {number} timeMs
 * @returns {Promise<string>}
 */
async function submitAndBuildRankingHtml(phaseId, timeMs) {
  try {
    const playerName = await ensurePlayerName();
    await submitPhaseTime({
      playerName,
      phaseId,
      phaseName: PHASE_NAMES[phaseId] ?? `Fase ${phaseId}`,
      timeMs,
    });
    const ranking = await fetchPhaseRanking(phaseId, 10);
    return buildRankingHtml(ranking, playerName, timeMs);
  } catch (error) {
    console.error("Ranking indisponível:", error);
    return "";
  }
}

async function checkLevelStatus() {
  if (!levelState || !currentLevel) return;

  if (checkLevelWin(levelState.slots, currentLevel)) {
    levelState.status = "vitoria";
    progressStore.completeLevel(currentLevel.id);

    const finishedLevel = currentLevel;
    const timeMs = Date.now() - phaseStartedAt;
    const rankingHtml = await submitAndBuildRankingHtml(finishedLevel.id, timeMs);

    const nextLevel = levelsData.find((l) => l.id === finishedLevel.id + 1);
    let mascotHtml;
    if (nextLevel) {
      mascotHtml = `
        <div class="mascot-container">
          <div class="speech-bubble">
            <h2>Aí sim, você deitou! 🔥</h2>
            <p>Fase ${finishedLevel.id} concluída com estilo! O Serviço Social agradece. Bora amassar a próxima?</p>
          </div>
          <img src="assets/logo.webp" alt="Formiga Serviço Social" class="mascot-img">
        </div>
      `;
      showStatusOverlay(
        "",
        "",
        `Mandar ver na Fase ${nextLevel.id}`,
        nextLevel.id,
        null,
        null,
        mascotHtml + rankingHtml
      );
    } else {
      mascotHtml = `
        <div class="mascot-container">
          <div class="speech-bubble">
            <h2>ZEROU O GAME! 🏆</h2>
            <p>Absoluto cinema! Você destruiu em todas as categorias. Já pode até dar aula de Serviço Social!</p>
          </div>
          <img src="assets/logo.webp" alt="Formiga Serviço Social" class="mascot-img">
        </div>
      `;
      showStatusOverlay(
        "",
        "",
        "Jogar de novo",
        levelsData[0].id,
        null,
        null,
        mascotHtml + rankingHtml
      );
    }
    return;
  }

  const firstLevelId = levelsData[0].id;
  const offerBackToStart = currentLevel.id !== firstLevelId;

  if (checkLevelLoss(levelState.movesRemaining, levelState.slots, currentLevel)) {
    levelState.status = "derrota";
    soundManager.play("gameOver");
    const hint = currentLevel.hint || "Releia as palavras com calma antes de arrastar — cada movimento conta, certo ou errado.";
    showStatusOverlay(
      "Movimentos esgotados",
      hint,
      "Tentar novamente",
      currentLevel.id,
      offerBackToStart ? "Voltar à Fase 1" : null,
      firstLevelId
    );
    return;
  }

  // Game over por travamento: nenhuma jogada válida resta (nem comprar/
  // reciclar, nem mover carta para coluna ou spot), mesmo com movimentos
  // sobrando — o embaralhamento deixou o jogador sem nenhuma ação possível.
  if (!hasAnyValidMove(levelState)) {
    levelState.status = "derrota";
    showStatusOverlay(
      "Fim de jogo",
      "Não há mais nenhuma jogada válida possível neste embaralhamento — nem no Monte/Descarte, nem no tableau. Reinicie a fase para tentar de novo.",
      "Reiniciar Fase",
      currentLevel.id,
      offerBackToStart ? "Voltar à Fase 1" : null,
      firstLevelId
    );
  }
}

function switchToReviewMode() {
  gameRoot?.setAttribute("hidden", "true");
  reviewRoot?.removeAttribute("hidden");
  removeStatusOverlay();

  reviewModeBtn?.classList.add("active");

  const movesCounter = document.getElementById("moves-counter");
  if (movesCounter) movesCounter.style.display = "none";

  if (reviewRoot) {
    renderReviewMode(reviewRoot, categoriesData, progressStore, () => {
      gameRoot?.removeAttribute("hidden");
      reviewRoot?.setAttribute("hidden", "true");
      reviewModeBtn?.classList.remove("active");
      updateUI();
    }, authorPhotos);
  }
}

/**
 * @param {string} title
 * @param {string} message
 * @param {string} buttonText
 * @param {number|null} targetLevelId
 * @param {string|null} [secondaryButtonText] rótulo do botão secundário (ex.: "Voltar à Fase 1"); omitido se null
 * @param {number|null} [secondaryTargetLevelId] nível carregado ao clicar no botão secundário
 * @param {string} [extraHtml] HTML extra inserido entre a mensagem e os botões (ex.: ranking da fase)
 */
function showStatusOverlay(title, message, buttonText, targetLevelId = null, secondaryButtonText = null, secondaryTargetLevelId = null, extraHtml = "") {
  removeStatusOverlay();

  const overlay = document.createElement("div");
  overlay.id = "game-status-overlay";
  overlay.className = "game-status-overlay show";
  overlay.innerHTML = `
    ${title ? `<h2 class="game-status-title">${title}</h2>` : ""}
    ${message ? `<p class="game-status-message">${message}</p>` : ""}
    ${extraHtml}
    <div class="game-status-actions">
      <button id="overlay-action-btn" type="button">${buttonText}</button>
      ${secondaryButtonText ? `<button id="overlay-secondary-btn" type="button">${secondaryButtonText}</button>` : ""}
    </div>
  `;

  document.body.appendChild(overlay);

  document.getElementById("overlay-action-btn")?.addEventListener("click", () => {
    startLevel(targetLevelId ?? currentLevel?.id ?? levelsData[0].id);
  });
  if (secondaryButtonText) {
    document.getElementById("overlay-secondary-btn")?.addEventListener("click", () => {
      startLevel(secondaryTargetLevelId ?? levelsData[0].id);
    });
  }
}

function removeStatusOverlay() {
  document.getElementById("game-status-overlay")?.remove();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
