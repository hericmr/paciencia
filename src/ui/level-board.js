// @ts-check
import { canPlaceInCategory, canMoveToTableauColumn } from "../engine/associations-rules.js";
import { showCategoryCompletePopup } from "./category-complete-popup.js";

/**
 * @typedef {import("../engine/level.js").WordCard} WordCard
 * @typedef {import("../engine/level.js").TableauColumn} TableauColumn
 * @typedef {{
 *   tableauColumns: TableauColumn[],
 *   slots: Record<string, WordCard[]>,
 *   openCategoryIds: Set<string>,
 *   spotCategories: (string|null)[],
 *   stock: WordCard[],
 *   waste: WordCard[],
 *   movesRemaining: number,
 *   status: "em_andamento"|"vitoria"|"derrota"
 * }} LevelState
 */

/** @type {string|null} carta selecionada (id), para o fluxo clique+clique em telas de toque */
let selectedCardId = null;



/**
 * @param {TableauColumn} column
 * @returns {{ card: WordCard, faceUp: boolean } | null}
 */
function getTopEntry(column) {
  return column.cards[column.cards.length - 1] ?? null;
}

/**
 * @param {TableauColumn[]} columns
 * @param {string} cardId
 * @returns {number} índice da coluna cujo topo é essa carta, ou -1
 */
function findColumnIndexByTopCardId(columns, cardId) {
  return columns.findIndex((col) => getTopEntry(col)?.card.id === cardId);
}

/**
 * Renderiza os slots de categoria + o tableau empilhado por coluna, e liga a interação.
 * @param {HTMLElement} container
 * @param {LevelState} levelState
 * @param {import("../data/loader.js").LevelData} level
 * @param {Map<string, import("../data/loader.js").CategoryData>} categoriesMap
 * @param {Record<string, { photoUrl: string, photoCredit: string }>} authorPhotos
 * @param {any} progressStore
 * @param {() => void} onLevelStatusChange callback após cada tentativa de movimento (checa vitória/derrota)
 * @param {() => void} onStateChange callback para re-renderizar
 * @param {boolean} [playDealAnimation] true só no primeiro render de um nível novo
 * @param {{ play: (eventName: string) => void } | null} [soundManager]
 */
export function renderLevelBoard(container, levelState, level, categoriesMap, authorPhotos, progressStore, onLevelStatusChange, onStateChange, playDealAnimation = false, soundManager = null) {
  container.innerHTML = "";

  // --- Top Board Row (Stock, Waste, and Category Slots) ---
  const topBoardRow = document.createElement("div");
  topBoardRow.className = "top-board-row";

  // Inicialização defensiva de stock e waste se não existirem
  if (!levelState.stock) levelState.stock = [];
  if (!levelState.waste) levelState.waste = [];

  // 1. Stock Wrapper (Monte)
  const stockWrapper = document.createElement("div");
  stockWrapper.className = "category-slot-wrapper stock-wrapper";

  const stockHeader = document.createElement("div");
  stockHeader.className = "category-slot-header";
  stockHeader.innerHTML = `
    <div class="category-slot-title" style="visibility: hidden;">Monte</div>
    <div class="category-slot-progress" style="visibility: hidden;">Vazio</div>
  `;
  stockWrapper.appendChild(stockHeader);

  const stockEl = document.createElement("div");
  stockEl.tabIndex = 0;
  stockEl.setAttribute("role", "button");
  if (levelState.stock.length > 0) {
    stockEl.className = "stock-slot has-cards word-card face-down";
    stockEl.setAttribute("aria-label", `Monte com ${levelState.stock.length} cartas. Clique para comprar.`);
  } else {
    stockEl.className = "stock-slot empty";
    stockEl.setAttribute("aria-label", "Monte vazio. Clique para reciclar o descarte.");
    stockEl.innerHTML = `<div class="slot-placeholder-recycle">🔄</div>`;
  }
  stockEl.addEventListener("click", () => {
    drawFromStock();
  });
  stockEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      drawFromStock();
    }
  });
  stockWrapper.appendChild(stockEl);
  topBoardRow.appendChild(stockWrapper);

  // 2. Waste Wrapper (Descarte)
  const wasteWrapper = document.createElement("div");
  wasteWrapper.className = "category-slot-wrapper waste-wrapper";

  const wasteHeader = document.createElement("div");
  wasteHeader.className = "category-slot-header";
  wasteHeader.innerHTML = `
    <div class="category-slot-title" style="visibility: hidden;">Descarte</div>
    <div class="category-slot-progress" style="visibility: hidden;">Vazio</div>
  `;
  wasteWrapper.appendChild(wasteHeader);

  const wasteEl = document.createElement("div");
  wasteEl.className = "waste-slot";
  if (levelState.waste.length > 0) {
    const topWasteCard = levelState.waste[levelState.waste.length - 1];
    const cardEl = buildInteractiveCard(topWasteCard, authorPhotos, false, 0, () => {
      selectedCardId = selectedCardId === topWasteCard.id ? null : topWasteCard.id;
      onStateChange();
    });
    cardEl.setAttribute("draggable", "true");
    cardEl.addEventListener("dragstart", (e) => {
      e.dataTransfer?.setData("text/plain", topWasteCard.id);
      setTimeout(() => {
        cardEl.classList.add("dragging-placeholder");
      }, 0);
    });
    cardEl.addEventListener("dragend", () => {
      cardEl.classList.remove("dragging-placeholder");
    });
    wasteEl.appendChild(cardEl);
    wasteEl.setAttribute("aria-label", `Descarte. Carta do topo: ${topWasteCard.word}.`);
  } else {
    wasteEl.className = "waste-slot empty";
    wasteEl.setAttribute("aria-label", "Descarte vazio.");
  }
  wasteWrapper.appendChild(wasteEl);
  topBoardRow.appendChild(wasteWrapper);

  // 3. Category Slots (the 4 spots)
  // Inicialização defensiva de spotCategories se não existir
  if (!levelState.spotCategories) {
    levelState.spotCategories = [null, null, null, null];
    // Sincronizar com categorias já abertas se houver
    let idx = 0;
    levelState.openCategoryIds.forEach((catId) => {
      if (idx < 4) {
        levelState.spotCategories[idx] = catId;
        idx++;
      }
    });
  }

  for (let index = 0; index < 4; index++) {
    const categoryId = levelState.spotCategories[index];
    const category = categoryId ? categoriesMap.get(categoryId) : null;
    const isOpen = categoryId !== null;
    const cardsInSlot = categoryId ? (levelState.slots[categoryId] ?? []) : [];
    const isComplete = isOpen && cardsInSlot.length === level.cardsPerCategory;

    const slotWrapper = document.createElement("div");
    slotWrapper.className = "category-slot-wrapper";

    // Header de título e progresso
    const headerEl = document.createElement("div");
    headerEl.className = "category-slot-header";
    if (!isOpen) {
      headerEl.innerHTML = `
        <div class="category-slot-title" style="visibility: hidden;">🔒 Categoria ${index + 1}</div>
        <div class="category-slot-progress" style="visibility: hidden;">Fechada</div>
      `;
    } else {
      const progressText = isComplete ? `${cardsInSlot.length}/${level.cardsPerCategory} ✓` : `${cardsInSlot.length}/${level.cardsPerCategory}`;
      headerEl.innerHTML = `
        <div class="category-slot-title">${category?.nome ?? categoryId}</div>
        <div class="category-slot-progress ${isComplete ? "complete" : ""}">${progressText}</div>
      `;
    }
    slotWrapper.appendChild(headerEl);

    // Slot em si (área receptora de drop, com formato de carta)
    const slotEl = document.createElement("div");
    slotEl.className = `category-slot ${isOpen ? "open" : "closed"} ${isComplete ? "complete" : ""}`;
    slotEl.dataset.spotIndex = String(index);
    slotEl.tabIndex = 0;
    slotEl.setAttribute("role", "region");

    if (!isOpen) {
      slotEl.setAttribute("aria-label", `Categoria ${index + 1}, fechada. Encontre e jogue a carta-título dela no tableau.`);
      slotEl.innerHTML = `<div class="slot-placeholder-lock">🔒</div>`;
    } else {
      slotEl.setAttribute("aria-label", `${category?.nome ?? categoryId}, aberta. ${cardsInSlot.length} de ${level.cardsPerCategory} cartas corretas.`);
      
      // Pilha física de cartas no slot (Título + cartas de palavras encaixadas)
      const allCardsInSlot = [
        { id: `TITLE:${categoryId}`, categoryId, word: category?.cartaTitulo ?? "", isTitleCard: true },
        ...cardsInSlot
      ];

      let topOffset = 0;
      allCardsInSlot.forEach((card) => {
        const wrapper = document.createElement("div");
        wrapper.className = "stack-card-wrapper";
        wrapper.style.top = `${topOffset}px`;

        const cardEl = buildStaticCard(card, authorPhotos);
        wrapper.appendChild(cardEl);
        slotEl.appendChild(wrapper);

        topOffset += 8; // offset de empilhamento vertical
      });
    }

    slotEl.addEventListener("click", () => {
      if (selectedCardId !== null) attemptMoveToCategory(selectedCardId, index);
    });
    slotEl.addEventListener("keydown", (e) => {
      if ((e.key === "Enter" || e.key === " ") && selectedCardId !== null) {
        e.preventDefault();
        attemptMoveToCategory(selectedCardId, index);
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
      if (cardId) attemptMoveToCategory(cardId, index);
    });

    slotWrapper.appendChild(slotEl);
    topBoardRow.appendChild(slotWrapper);
  }

  container.appendChild(topBoardRow);

  // --- Tableau empilhado por coluna ---
  const columnsRow = document.createElement("div");
  columnsRow.className = "tableau-columns";

  levelState.tableauColumns.forEach((column, colIndex) => {
    const colEl = document.createElement("div");
    colEl.className = "tableau-column";
    colEl.dataset.col = String(colIndex);
    colEl.setAttribute("role", "region");
    colEl.setAttribute("aria-label", `Coluna ${colIndex + 1}, ${column.cards.length} cartas.`);

    let topOffset = 0;
    column.cards.forEach((entry, entryIndex) => {
      const isTop = entryIndex === column.cards.length - 1;
      const wrapper = document.createElement("div");
      wrapper.className = "stack-card-wrapper";
      wrapper.style.top = `${topOffset}px`;

      if (entry.faceUp && isTop) {
        const cardEl = buildInteractiveCard(entry.card, authorPhotos, playDealAnimation, entryIndex, () => {
          selectedCardId = selectedCardId === entry.card.id ? null : entry.card.id;
          onStateChange();
        });
        cardEl.setAttribute("draggable", "true");
        cardEl.addEventListener("dragstart", (e) => {
          e.dataTransfer?.setData("text/plain", entry.card.id);
          setTimeout(() => {
            cardEl.classList.add("dragging-placeholder");
          }, 0);
        });
        cardEl.addEventListener("dragend", () => {
          cardEl.classList.remove("dragging-placeholder");
        });
        wrapper.appendChild(cardEl);
      } else {
        const backEl = document.createElement("div");
        backEl.className = "word-card face-down";
        backEl.setAttribute("aria-label", "Carta virada para baixo");
        wrapper.appendChild(backEl);
      }

      colEl.appendChild(wrapper);
      topOffset += window.innerWidth < 600 ? 22 : 30;
    });

    // Aceitar drop/clique para "mover para desobstruir" — sempre permitido
    colEl.addEventListener("click", (e) => {
      if (e.target === colEl && selectedCardId) attemptMoveToColumn(selectedCardId, colIndex);
    });
    colEl.addEventListener("dragover", (e) => {
      e.preventDefault();
      colEl.classList.add("valid-target");
    });
    colEl.addEventListener("dragleave", () => colEl.classList.remove("valid-target"));
    colEl.addEventListener("drop", (e) => {
      colEl.classList.remove("valid-target");
      const cardId = e.dataTransfer?.getData("text/plain");
      if (cardId) attemptMoveToColumn(cardId, colIndex);
    });

    columnsRow.appendChild(colEl);
  });
  container.appendChild(columnsRow);

  function drawFromStock() {
    if (levelState.stock.length > 0) {
      const card = levelState.stock.pop();
      levelState.waste.push(card);
      soundManager?.play("cardMove");
    } else if (levelState.waste.length > 0) {
      // Recycle: reverse waste back into stock
      levelState.stock = levelState.waste.reverse();
      levelState.waste = [];
      soundManager?.play("cardPlace");
    }
    onStateChange();
  }

  /**
   * @param {WordCard} card
   * @param {Record<string, { photoUrl: string, photoCredit: string }>} photos
   * @param {boolean} deal
   * @param {number} dealIndex
   * @param {() => void} onClick
   */
  function buildInteractiveCard(card, photos, deal, dealIndex, onClick) {
    const cardEl = document.createElement("div");
    cardEl.className = `word-card ${card.isTitleCard ? "title-card" : ""} ${selectedCardId === card.id ? "selected" : ""} ${deal ? "dealing" : ""}`;
    cardEl.dataset.id = card.id;
    cardEl.tabIndex = 0;
    cardEl.setAttribute("role", "button");
    cardEl.setAttribute("aria-label", card.isTitleCard ? `Carta-título: ${card.word}` : `Carta: ${card.word}`);
    if (deal) cardEl.style.animationDelay = `${dealIndex * 40}ms`;

    const photo = photos[card.word];
    const photoHtml = photo ? `<img class="card-photo-thumb" src="${photo.photoUrl}" alt="" />` : "";
    cardEl.innerHTML = `${photoHtml}<span class="word-card-text">${card.word}</span>`;

    cardEl.addEventListener("click", (e) => {
      e.stopPropagation();
      onClick();
    });
    cardEl.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onClick();
      }
    });

    return cardEl;
  }

  /**
   * @param {WordCard} card
   * @param {Record<string, { photoUrl: string, photoCredit: string }>} photos
   */
  function buildStaticCard(card, photos) {
    const cardEl = document.createElement("div");
    cardEl.className = `word-card static-card ${card.isTitleCard ? "title-card" : ""}`;
    cardEl.dataset.id = card.id;

    const photo = photos[card.word];
    const photoHtml = photo ? `<img class="card-photo-thumb" src="${photo.photoUrl}" alt="" />` : "";
    cardEl.innerHTML = `${photoHtml}<span class="word-card-text">${card.word}</span>`;

    return cardEl;
  }

  /**
   * Tenta mover a carta do topo de uma coluna para o slot de uma
   * categoria associada a um determinado spot (index 0 a 3).
   * @param {string} cardId
   * @param {number} spotIndex
   */
  function attemptMoveToCategory(cardId, spotIndex) {
    let source = null;
    let card = null;
    let column = null;

    const colIndex = findColumnIndexByTopCardId(levelState.tableauColumns, cardId);
    if (colIndex !== -1) {
      source = "column";
      column = levelState.tableauColumns[colIndex];
      card = getTopEntry(column)?.card;
    } else {
      const topWasteCard = levelState.waste?.[levelState.waste.length - 1];
      if (topWasteCard && topWasteCard.id === cardId) {
        source = "waste";
        card = topWasteCard;
      }
    }

    if (!card) return;

    // Inicialização defensiva de spotCategories se não existir
    if (!levelState.spotCategories) {
      levelState.spotCategories = [null, null, null, null];
    }

    const assignedCategoryId = levelState.spotCategories[spotIndex];

    if (card.isTitleCard) {
      // Se for uma carta-título, só aceita se o spot estiver fechado/vazio
      // e essa categoria ainda não tiver sido aberta em outro spot
      if (assignedCategoryId === null) {
        const isAlreadyOpened = levelState.spotCategories.includes(card.categoryId);
        if (!isAlreadyOpened) {
          levelState.movesRemaining -= 1;
          selectedCardId = null;

          if (source === "column") {
            column.cards.pop();
            const newTop = getTopEntry(column);
            if (newTop) newTop.faceUp = true;
          } else if (source === "waste") {
            levelState.waste.pop();
          }

          levelState.spotCategories[spotIndex] = card.categoryId;
          levelState.openCategoryIds.add(card.categoryId);
          soundManager?.play("cardPlace");
        } else {
          // Já está aberta em outro lugar, rejeita e consome movimento
          levelState.movesRemaining -= 1;
          selectedCardId = null;
          soundManager?.play("cardMove");
        }
      } else {
        // Spot ocupado, rejeita e consome movimento
        levelState.movesRemaining -= 1;
        selectedCardId = null;
        soundManager?.play("cardMove");
      }
    } else {
      // Se for uma carta de palavra, só aceita se o spot tiver sido aberto para aquela mesma categoria
      if (assignedCategoryId === card.categoryId && levelState.openCategoryIds.has(card.categoryId)) {
        levelState.movesRemaining -= 1;
        selectedCardId = null;

        if (source === "column") {
          column.cards.pop();
          const newTop = getTopEntry(column);
          if (newTop) newTop.faceUp = true;
        } else if (source === "waste") {
          levelState.waste.pop();
        }

        if (!levelState.slots[card.categoryId]) levelState.slots[card.categoryId] = [];
        levelState.slots[card.categoryId].push(card);

        const nowComplete = levelState.slots[card.categoryId].length === level.cardsPerCategory;
        if (nowComplete) {
          soundManager?.play("categoryComplete");
          const category = categoriesMap.get(card.categoryId);
          progressStore.revealCategory(card.categoryId);
          if (category) showCategoryCompletePopup(category, authorPhotos[card.word] ?? null);
        } else {
          soundManager?.play("cardPlace");
        }
      } else {
        // Errada para esta categoria ou spot trancado, rejeita e consome movimento
        levelState.movesRemaining -= 1;
        selectedCardId = null;
        soundManager?.play("cardMove");
      }
    }

    onLevelStatusChange();
  }

  /**
   * Tenta mover a carta do topo de uma coluna para o topo de outra coluna
   * (desobstrução, sempre aceita — ver research.md, Decisão 8).
   * @param {string} cardId
   * @param {number} targetColIndex
   */
  function attemptMoveToColumn(cardId, targetColIndex) {
    let source = null;
    let card = null;
    let column = null;

    const sourceColIndex = findColumnIndexByTopCardId(levelState.tableauColumns, cardId);
    if (sourceColIndex !== -1) {
      if (sourceColIndex === targetColIndex) return;
      source = "column";
      column = levelState.tableauColumns[sourceColIndex];
      card = getTopEntry(column)?.card;
    } else {
      const topWasteCard = levelState.waste?.[levelState.waste.length - 1];
      if (topWasteCard && topWasteCard.id === cardId) {
        source = "waste";
        card = topWasteCard;
      }
    }

    if (!card) return;

    levelState.movesRemaining -= 1;
    selectedCardId = null;

    if (canMoveToTableauColumn()) {
      if (source === "column") {
        column.cards.pop();
        const newTop = getTopEntry(column);
        if (newTop) newTop.faceUp = true;
      } else if (source === "waste") {
        levelState.waste.pop();
      }

      levelState.tableauColumns[targetColIndex].cards.push({ card, faceUp: true });
      soundManager?.play("cardMove");
    }

    onLevelStatusChange();
  }
}
