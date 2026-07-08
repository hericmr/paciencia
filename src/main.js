// @ts-check
import { loadCategories, loadLevels } from "./data/loader.js";
import { buildTitleCards, buildWordCards, dealTableau } from "./engine/level.js";
import { checkLevelWin, checkLevelLoss, hasAnyValidMove } from "./engine/level-status.js";
import { createProgressStore } from "./progress/store.js";
import { createSoundManager } from "./audio/sound-manager.js";
import { renderLevelBoard } from "./ui/level-board.js";
import { renderReviewMode } from "./ui/review-mode.js";

// Elementos do DOM
const gameRoot = document.getElementById("game-root");
const reviewRoot = document.getElementById("review-root");
const newGameBtn = document.getElementById("new-game-btn");
const reviewModeBtn = document.getElementById("review-mode-btn");
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

    updateMuteButton();
    startAmbientMusicWithRetry();

    startLevel(levelsData[0].id);
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

function checkLevelStatus() {
  if (!levelState || !currentLevel) return;

  if (checkLevelWin(levelState.slots, currentLevel)) {
    levelState.status = "vitoria";
    progressStore.completeLevel(currentLevel.id);

    const nextLevel = levelsData.find((l) => l.id === currentLevel.id + 1);
    if (nextLevel) {
      showStatusOverlay(
        "Fase concluída!",
        `Parabéns! Você classificou todas as categorias da Fase ${currentLevel.id} com sucesso. Pronto para a próxima?`,
        `Ir para a Fase ${nextLevel.id}`,
        nextLevel.id
      );
    } else {
      showStatusOverlay(
        "Jogo Concluído!",
        "Espetacular! Você classificou com sucesso todas as categorias de todas as fases!",
        "Reiniciar Jogo",
        levelsData[0].id
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
 */
function showStatusOverlay(title, message, buttonText, targetLevelId = null, secondaryButtonText = null, secondaryTargetLevelId = null) {
  removeStatusOverlay();

  const overlay = document.createElement("div");
  overlay.id = "game-status-overlay";
  overlay.className = "game-status-overlay show";
  overlay.innerHTML = `
    <h2 class="game-status-title">${title}</h2>
    <p class="game-status-message">${message}</p>
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
