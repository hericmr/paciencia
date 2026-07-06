// @ts-check
import { canPlaceInCategory } from "../engine/associations-rules.js";
import { checkLevelWin, checkLevelLoss } from "../engine/level-status.js";
import { showCategoryCompletePopup } from "./category-complete-popup.js";

/**
 * @typedef {import("../engine/level.js").WordCard} WordCard
 * @typedef {{
 *   tableau: WordCard[],
 *   slots: Record<string, WordCard[]>,
 *   movesRemaining: number,
 *   status: "em_andamento"|"vitoria"|"derrota"
 * }} LevelState
 */

/** @type {string|null} carta selecionada (id), para o fluxo clique+clique em telas de toque */
let selectedCardId = null;

/**
 * Renderiza o tableau + os 4 slots de categoria e liga a interação.
 * @param {HTMLElement} container
 * @param {LevelState} levelState
 * @param {import("../data/loader.js").LevelData} level
 * @param {Map<string, import("../data/loader.js").CategoryData>} categoriesMap
 * @param {Record<string, { photoUrl: string, photoCredit: string }>} authorPhotos
 * @param {any} progressStore
 * @param {(categoryId: string) => void} onLevelStatusChange callback após cada tentativa de movimento (checa vitória/derrota)
 * @param {() => void} onStateChange callback para re-renderizar
 */
export function renderLevelBoard(container, levelState, level, categoriesMap, authorPhotos, progressStore, onLevelStatusChange, onStateChange) {
  container.innerHTML = "";

  // --- Contador de movimentos ---
  const movesBar = document.createElement("div");
  movesBar.className = "moves-bar";
  movesBar.setAttribute("aria-live", "polite");
  movesBar.textContent = `Movimentos restantes: ${levelState.movesRemaining}`;
  container.appendChild(movesBar);

  // --- Slots de categoria ---
  const slotsRow = document.createElement("div");
  slotsRow.className = "category-slots-row";

  level.categoryIds.forEach((categoryId, index) => {
    const category = categoriesMap.get(categoryId);
    const cardsInSlot = levelState.slots[categoryId] ?? [];
    const isComplete = cardsInSlot.length === level.cardsPerCategory;

    const slotEl = document.createElement("div");
    slotEl.className = `category-slot ${isComplete ? "complete" : ""}`;
    slotEl.dataset.categoryId = categoryId;
    slotEl.tabIndex = 0;
    slotEl.setAttribute("role", "region");

    if (isComplete) {
      slotEl.setAttribute("aria-label", `${category?.nome ?? categoryId}. Categoria completa, ${cardsInSlot.length} de ${level.cardsPerCategory} cartas.`);
      slotEl.innerHTML = `
        <div class="category-slot-title">${category?.nome ?? categoryId}</div>
        <div class="category-slot-progress">${cardsInSlot.length} / ${level.cardsPerCategory} ✓</div>
      `;
    } else {
      slotEl.setAttribute("aria-label", `Categoria ${index + 1}, ainda não identificada. ${cardsInSlot.length} de ${level.cardsPerCategory} cartas corretas.`);
      slotEl.innerHTML = `
        <div class="category-slot-title">Categoria ${index + 1}</div>
        <div class="category-slot-progress">${cardsInSlot.length} / ${level.cardsPerCategory}</div>
      `;
    }

    slotEl.addEventListener("click", () => {
      if (selectedCardId) {
        attemptMove(selectedCardId, categoryId);
        selectedCardId = null;
      }
    });

    slotEl.addEventListener("dragover", (e) => {
      e.preventDefault();
      slotEl.classList.add("valid-target");
    });
    slotEl.addEventListener("dragleave", () => slotEl.classList.remove("valid-target"));
    slotEl.addEventListener("drop", (e) => {
      slotEl.classList.remove("valid-target");
      const cardId = e.dataTransfer?.getData("text/plain");
      if (cardId) attemptMove(cardId, categoryId);
    });

    slotsRow.appendChild(slotEl);
  });
  container.appendChild(slotsRow);

  // --- Tableau ---
  const tableauGrid = document.createElement("div");
  tableauGrid.className = "word-tableau";
  tableauGrid.style.setProperty("--columns", String(level.columns));

  levelState.tableau.forEach((card) => {
    const cardEl = document.createElement("div");
    cardEl.className = `word-card ${selectedCardId === card.id ? "selected" : ""}`;
    cardEl.dataset.id = card.id;
    cardEl.tabIndex = 0;
    cardEl.setAttribute("role", "button");
    cardEl.setAttribute("aria-label", `Carta: ${card.word}`);
    cardEl.setAttribute("draggable", "true");

    const photo = authorPhotos[card.word];
    const photoHtml = photo ? `<img class="card-photo-thumb" src="${photo.photoUrl}" alt="" />` : "";

    cardEl.innerHTML = `${photoHtml}<span class="word-card-text">${card.word}</span>`;

    cardEl.addEventListener("click", () => {
      selectedCardId = selectedCardId === card.id ? null : card.id;
      onStateChange();
    });

    cardEl.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        selectedCardId = selectedCardId === card.id ? null : card.id;
        onStateChange();
      }
    });

    cardEl.addEventListener("dragstart", (e) => {
      e.dataTransfer?.setData("text/plain", card.id);
    });

    tableauGrid.appendChild(cardEl);
  });
  container.appendChild(tableauGrid);

  /**
   * Tenta mover uma carta do tableau para o slot de uma categoria. Todo
   * movimento (aceito ou rejeitado) consome movesRemaining (FR-004).
   * @param {string} cardId
   * @param {string} targetCategoryId
   */
  function attemptMove(cardId, targetCategoryId) {
    const cardIndex = levelState.tableau.findIndex((c) => c.id === cardId);
    if (cardIndex === -1) return; // já foi movida, ignora
    const card = levelState.tableau[cardIndex];

    levelState.movesRemaining -= 1;

    if (canPlaceInCategory(card, targetCategoryId)) {
      levelState.tableau.splice(cardIndex, 1);
      if (!levelState.slots[targetCategoryId]) levelState.slots[targetCategoryId] = [];
      levelState.slots[targetCategoryId].push(card);

      const nowComplete = levelState.slots[targetCategoryId].length === level.cardsPerCategory;
      if (nowComplete) {
        const category = categoriesMap.get(targetCategoryId);
        progressStore.revealCategory(targetCategoryId);
        if (category) {
          const photo = authorPhotos[card.word] ?? null;
          showCategoryCompletePopup(category, photo);
        }
      }
    }

    onLevelStatusChange();
  }
}
