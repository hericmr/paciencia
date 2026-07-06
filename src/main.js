// @ts-check
import { loadCategories, loadLevels } from "./data/loader.js";
import { buildLevelCards, shuffleCards } from "./engine/level.js";
import { checkLevelWin, checkLevelLoss } from "./engine/level-status.js";
import { createProgressStore } from "./progress/store.js";
import { renderLevelBoard } from "./ui/level-board.js";
import { renderReviewMode } from "./ui/review-mode.js";

// Elementos do DOM
const gameRoot = document.getElementById("game-root");
const reviewRoot = document.getElementById("review-root");
const newGameBtn = document.getElementById("new-game-btn");
const reviewModeBtn = document.getElementById("review-mode-btn");

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
/** @type {import("./ui/level-board.js").LevelState | null} */
let levelState = null;
/** @type {import("./data/loader.js").LevelData | null} */
let currentLevel = null;

async function init() {
  try {
    categoriesData = await loadCategories("src/data/categories.json");
    categoriesData.forEach((c) => categoriesMap.set(c.id, c));

    levelsData = await loadLevels("src/data/levels.json", categoriesData);

    const photosResponse = await fetch("src/data/author-photos.json");
    authorPhotos = photosResponse.ok ? await photosResponse.json() : {};

    newGameBtn?.addEventListener("click", () => startLevel(currentLevel?.id ?? levelsData[0].id));
    reviewModeBtn?.addEventListener("click", () => switchToReviewMode());

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

  const cards = buildLevelCards(level);
  const tableau = shuffleCards(cards);

  /** @type {Record<string, any[]>} */
  const slots = {};
  for (const categoryId of level.categoryIds) slots[categoryId] = [];

  levelState = {
    tableau,
    slots,
    movesRemaining: level.moveLimit,
    status: "em_andamento",
  };

  updateUI();
}

function updateUI() {
  if (!gameRoot || !levelState || !currentLevel) return;

  renderLevelBoard(
    gameRoot,
    levelState,
    currentLevel,
    categoriesMap,
    authorPhotos,
    progressStore,
    () => {
      checkLevelStatus();
      updateUI();
    },
    updateUI
  );
}

function checkLevelStatus() {
  if (!levelState || !currentLevel) return;

  if (checkLevelWin(levelState.slots, currentLevel)) {
    levelState.status = "vitoria";
    progressStore.completeLevel(currentLevel.id);
    showStatusOverlay(
      "Nível completo!",
      "Você classificou todas as categorias corretamente. Explore o Modo Revisão para rever os micro-textos.",
      "Jogar novamente"
    );
    return;
  }

  if (checkLevelLoss(levelState.movesRemaining, levelState.slots, currentLevel)) {
    levelState.status = "derrota";
    const hint = currentLevel.hint || "Releia as palavras com calma antes de arrastar — cada movimento conta, certo ou errado.";
    showStatusOverlay("Movimentos esgotados", hint, "Tentar novamente");
  }
}

function switchToReviewMode() {
  gameRoot?.setAttribute("hidden", "true");
  reviewRoot?.removeAttribute("hidden");
  removeStatusOverlay();

  reviewModeBtn?.classList.add("active");

  if (reviewRoot) {
    renderReviewMode(reviewRoot, categoriesData, progressStore, () => {
      gameRoot?.removeAttribute("hidden");
      reviewRoot?.setAttribute("hidden", "true");
      reviewModeBtn?.classList.remove("active");
      updateUI();
    });
  }
}

/**
 * @param {string} title
 * @param {string} message
 * @param {string} buttonText
 */
function showStatusOverlay(title, message, buttonText) {
  removeStatusOverlay();

  const overlay = document.createElement("div");
  overlay.id = "game-status-overlay";
  overlay.className = "game-status-overlay show";
  overlay.innerHTML = `
    <h2 class="game-status-title">${title}</h2>
    <p class="game-status-message">${message}</p>
    <button id="overlay-action-btn" type="button">${buttonText}</button>
  `;

  gameRoot?.appendChild(overlay);

  document.getElementById("overlay-action-btn")?.addEventListener("click", () => {
    startLevel(currentLevel?.id ?? levelsData[0].id);
  });
}

function removeStatusOverlay() {
  document.getElementById("game-status-overlay")?.remove();
}

document.addEventListener("DOMContentLoaded", init);
if (document.readyState === "interactive" || document.readyState === "complete") {
  init();
}
