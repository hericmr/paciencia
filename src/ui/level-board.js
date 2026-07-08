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
 * @returns {{ colIndex: number, cardIndex: number }|null} localização da carta na coluna, ou null
 */
function findCardLocation(columns, cardId) {
  for (let colIdx = 0; colIdx < columns.length; colIdx++) {
    const column = columns[colIdx];
    const cardIdx = column.cards.findIndex((entry) => entry.card.id === cardId);
    if (cardIdx !== -1) {
      return { colIndex: colIdx, cardIndex: cardIdx };
    }
  }
  return null;
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

  // Estado do drag de toque (touch) para dispositivos móveis
  let touchActive = false;
  let touchCardId = null;
  let touchClone = null;
  let touchOffsetX = 0;
  let touchOffsetY = 0;
  let currentTargetEl = null;

  function initTouchDrag(cardEl, cardId, colIndex, isWaste = false) {
    cardEl.addEventListener("touchstart", (e) => {
      if (e.touches.length > 1) return;
      const touch = e.touches[0];
      
      touchActive = true;
      touchCardId = cardId;
      
      const rect = cardEl.getBoundingClientRect();
      touchOffsetX = touch.clientX - rect.left;
      touchOffsetY = touch.clientY - rect.top;
      
      // Criar clone flutuante
      touchClone = cardEl.cloneNode(true);
      touchClone.classList.add("dragging-clone");
      touchClone.style.position = "fixed";
      touchClone.style.width = `${rect.width}px`;
      touchClone.style.height = `${rect.height}px`;
      touchClone.style.left = `${rect.left}px`;
      touchClone.style.top = `${rect.top}px`;
      touchClone.style.zIndex = "9999";
      touchClone.style.pointerEvents = "none";
      touchClone.style.opacity = "0.9";
      touchClone.style.transform = "scale(1.05)";
      touchClone.style.boxShadow = "0 12px 24px rgba(0,0,0,0.5)";
      document.body.appendChild(touchClone);
      
      // Ocultar original
      if (!isWaste) {
        const loc = findCardLocation(levelState.tableauColumns, cardId);
        if (loc) {
          const colEl = container.querySelector(`[data-col="${loc.colIndex}"]`);
          if (colEl) {
            const column = levelState.tableauColumns[loc.colIndex];
            for (let i = loc.cardIndex; i < column.cards.length; i++) {
              const cid = column.cards[i].card.id;
              const el = colEl.querySelector(`[data-id="${cid}"]`);
              if (el) el.classList.add("dragging-placeholder");
            }
          }
        }
      } else {
        cardEl.classList.add("dragging-placeholder");
      }
      
      e.stopPropagation();
    }, { passive: true });

    cardEl.addEventListener("touchmove", (e) => {
      if (!touchActive || !touchClone) return;
      const touch = e.touches[0];
      
      // Posiciona clone
      touchClone.style.left = `${touch.clientX - touchOffsetX}px`;
      touchClone.style.top = `${touch.clientY - touchOffsetY}px`;
      
      // Encontra elemento sob o toque
      const el = document.elementFromPoint(touch.clientX, touch.clientY);
      if (el) {
        const targetCol = el.closest(".tableau-column");
        const targetSlot = el.closest(".category-slot");
        
        if (currentTargetEl) {
          currentTargetEl.classList.remove("valid-target");
        }
        
        if (targetCol) {
          currentTargetEl = targetCol;
          currentTargetEl.classList.add("valid-target");
        } else if (targetSlot) {
          currentTargetEl = targetSlot;
          currentTargetEl.classList.add("valid-target");
        } else {
          currentTargetEl = null;
        }
      }
      
      // Impede rolagem da tela durante o arrastar
      if (e.cancelable) {
        e.preventDefault();
      }
    }, { passive: false });

    cardEl.addEventListener("touchend", (e) => {
      if (!touchActive) return;
      touchActive = false;
      
      if (touchClone) {
        touchClone.remove();
        touchClone = null;
      }
      
      if (!isWaste) {
        const loc = findCardLocation(levelState.tableauColumns, touchCardId);
        if (loc) {
          const colEl = container.querySelector(`[data-col="${loc.colIndex}"]`);
          if (colEl) {
            const column = levelState.tableauColumns[loc.colIndex];
            for (let i = loc.cardIndex; i < column.cards.length; i++) {
              const cid = column.cards[i].card.id;
              const el = colEl.querySelector(`[data-id="${cid}"]`);
              if (el) el.classList.remove("dragging-placeholder");
            }
          }
        }
      } else {
        cardEl.classList.remove("dragging-placeholder");
      }
      
      if (currentTargetEl) {
        currentTargetEl.classList.remove("valid-target");
        
        if (currentTargetEl.classList.contains("tableau-column")) {
          const targetColIndex = parseInt(currentTargetEl.dataset.col, 10);
          if (!isNaN(targetColIndex)) {
            attemptMoveToColumn(touchCardId, targetColIndex);
          }
        } else if (currentTargetEl.classList.contains("category-slot")) {
          const targetSlotIndex = parseInt(currentTargetEl.dataset.spotIndex, 10);
          if (!isNaN(targetSlotIndex)) {
            attemptMoveToCategory(touchCardId, targetSlotIndex);
          }
        }
        currentTargetEl = null;
      }
      
      onStateChange();
    });
  }

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

  // Container posicionado para o efeito escadinha do Monte: 0 a 2 cartas
  // "fantasma" (decorativas, aria-hidden) ficam levemente deslocadas atrás
  // da carta interativa do topo, dando a impressão de uma pilha física em
  // vez de uma única carta achatada.
  const stockPileEl = document.createElement("div");
  stockPileEl.className = "stock-pile";

  const stockEl = document.createElement("div");
  stockEl.tabIndex = 0;
  stockEl.setAttribute("role", "button");
  if (levelState.stock.length > 0) {
    stockEl.className = "stock-slot has-cards word-card face-down";
    stockEl.setAttribute("aria-label", `Monte com ${levelState.stock.length} cartas. Clique para comprar.`);

    const ghostLayers = Math.min(2, levelState.stock.length - 1);
    for (let i = ghostLayers; i >= 1; i--) {
      const ghostEl = document.createElement("div");
      ghostEl.className = "stock-pile-ghost word-card face-down";
      ghostEl.setAttribute("aria-hidden", "true");
      ghostEl.style.setProperty("--layer-index", String(i));
      stockPileEl.appendChild(ghostEl);
    }
  } else {
    stockEl.className = "stock-slot empty";
    stockEl.setAttribute("aria-label", "Monte vazio. Clique para reciclar o descarte.");
    stockEl.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" class="slot-placeholder-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.72 2.78L21 8"/>
        <polyline points="15 8 21 8 21 2"/>
      </svg>
    `;
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
  stockPileEl.appendChild(stockEl);
  stockWrapper.appendChild(stockPileEl);
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
    initTouchDrag(cardEl, topWasteCard.id, -1, true);
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
        <div class="category-slot-title" style="visibility: hidden;">Categoria ${index + 1}</div>
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
      slotEl.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" class="slot-placeholder-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <!-- Corpo (Cabeça, Tórax, Abdômen) -->
          <circle cx="12" cy="6" r="2" />
          <circle cx="12" cy="11" r="2.5" />
          <ellipse cx="12" cy="17" rx="2.2" ry="3" />
          
          <!-- Antenas -->
          <path d="M11 4.5 Q9 2 7 3" />
          <path d="M13 4.5 Q15 2 17 3" />
          
          <!-- Pernas Dianteiras -->
          <path d="M10.5 10 C8 9 6 7 6 7" />
          <path d="M13.5 10 C16 9 18 7 18 7" />
          
          <!-- Pernas Médias -->
          <path d="M9.5 11 H5" />
          <path d="M14.5 11 H19" />
          
          <!-- Pernas Traseiras -->
          <path d="M10.5 12 C9 14 7 17 7 17" />
          <path d="M13.5 12 C15 14 17 17 17 17" />
        </svg>
      `;
    } else {
      slotEl.setAttribute("aria-label", `${category?.nome ?? categoryId}, aberta. ${cardsInSlot.length} de ${level.cardsPerCategory} cartas corretas.`);
      
      // Pilha física de cartas no slot (Título + cartas de palavras encaixadas)
      const allCardsInSlot = [
        { id: `TITLE:${categoryId}`, categoryId, word: category?.cartaTitulo ?? "", isTitleCard: true },
        ...cardsInSlot
      ];

      allCardsInSlot.forEach((card, cardIdx) => {
        const isTop = cardIdx === allCardsInSlot.length - 1;
        const wrapper = document.createElement("div");
        wrapper.className = "stack-card-wrapper";
        wrapper.style.setProperty('--card-index', String(cardIdx));

        const cardEl = buildStaticCard(card, authorPhotos);
        if (!isTop) {
          cardEl.classList.add("covered-under");
        }
        wrapper.appendChild(cardEl);
        slotEl.appendChild(wrapper);
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

    column.cards.forEach((entry, entryIndex) => {
      const wrapper = document.createElement("div");
      wrapper.className = "stack-card-wrapper";
      wrapper.style.setProperty('--card-index', String(entryIndex));

      if (entry.faceUp) {
        const cardEl = buildInteractiveCard(entry.card, authorPhotos, playDealAnimation, entryIndex, () => {
          if (selectedCardId && selectedCardId !== entry.card.id) {
            attemptMoveToColumn(selectedCardId, colIndex);
          } else {
            selectedCardId = selectedCardId === entry.card.id ? null : entry.card.id;
            onStateChange();
          }
        });
        cardEl.setAttribute("draggable", "true");
        cardEl.addEventListener("dragstart", (e) => {
          e.dataTransfer?.setData("text/plain", entry.card.id);
          // Oculta todas as cartas a partir deste índice para o drag do sub-stack
          setTimeout(() => {
            for (let i = entryIndex; i < column.cards.length; i++) {
              const cid = column.cards[i].card.id;
              const el = colEl.querySelector(`[data-id="${cid}"]`);
              if (el) el.classList.add("dragging-placeholder");
            }
          }, 0);
        });
        cardEl.addEventListener("dragend", () => {
          for (let i = entryIndex; i < column.cards.length; i++) {
            const cid = column.cards[i].card.id;
            const el = colEl.querySelector(`[data-id="${cid}"]`);
            if (el) el.classList.remove("dragging-placeholder");
          }
        });
        const isTop = entryIndex === column.cards.length - 1;
        if (!isTop) {
          cardEl.classList.add("covered-under");
        }
        initTouchDrag(cardEl, entry.card.id, colIndex, false);
        wrapper.appendChild(cardEl);
      } else {
        const backEl = document.createElement("div");
        backEl.className = "word-card face-down";
        backEl.setAttribute("aria-label", "Carta virada para baixo");
        wrapper.appendChild(backEl);
      }

      colEl.appendChild(wrapper);
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
    let cardIndex = -1;
    let subStack = [];

    const loc = findCardLocation(levelState.tableauColumns, cardId);
    if (loc) {
      source = "column";
      column = levelState.tableauColumns[loc.colIndex];
      cardIndex = loc.cardIndex;
      card = column.cards[cardIndex].card;
      subStack = column.cards.slice(cardIndex);
    } else {
      const topWasteCard = levelState.waste?.[levelState.waste.length - 1];
      if (topWasteCard && topWasteCard.id === cardId) {
        source = "waste";
        card = topWasteCard;
        subStack = [{ card, faceUp: true }];
      }
    }

    if (!card) return;

    // Inicialização defensiva de spotCategories se não existir
    if (!levelState.spotCategories) {
      levelState.spotCategories = [null, null, null, null];
    }

    const assignedCategoryId = levelState.spotCategories[spotIndex];

    if (card.isTitleCard) {
      // Se for uma carta-título (base da pilha):
      // Só aceita se o spot estiver fechado/vazio e essa categoria ainda não tiver sido aberta em outro spot
      if (assignedCategoryId === null) {
        const isAlreadyOpened = levelState.spotCategories.includes(card.categoryId);
        if (!isAlreadyOpened) {
          levelState.movesRemaining -= 1;
          selectedCardId = null;

          if (source === "column") {
            column.cards.splice(cardIndex);
            const newTop = getTopEntry(column);
            if (newTop) newTop.faceUp = true;
          } else if (source === "waste") {
            levelState.waste.pop();
          }

          levelState.spotCategories[spotIndex] = card.categoryId;
          levelState.openCategoryIds.add(card.categoryId);

          // E insere todas as cartas de palavra que vieram junto na pilha
          if (!levelState.slots[card.categoryId]) {
            levelState.slots[card.categoryId] = [];
          }
          subStack.forEach((entry) => {
            if (!entry.card.isTitleCard) {
              levelState.slots[card.categoryId].push(entry.card);
            }
          });

          const nowComplete = levelState.slots[card.categoryId].length === level.cardsPerCategory;
          if (nowComplete) {
            soundManager?.play("categoryComplete");
            const category = categoriesMap.get(card.categoryId);
            progressStore.revealCategory(card.categoryId);
            if (category) showCategoryCompletePopup(category, authorPhotos[card.word] ?? null);
            levelState.spotCategories[spotIndex] = null;
          } else {
            soundManager?.play("cardPlace");
          }
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
      // Se for uma carta de palavra (base da pilha):
      // Só aceita se o spot tiver sido aberto para aquela mesma categoria
      if (assignedCategoryId === card.categoryId && levelState.openCategoryIds.has(card.categoryId)) {
        levelState.movesRemaining -= 1;
        selectedCardId = null;

        if (source === "column") {
          column.cards.splice(cardIndex);
          const newTop = getTopEntry(column);
          if (newTop) newTop.faceUp = true;
        } else if (source === "waste") {
          levelState.waste.pop();
        }

        if (!levelState.slots[card.categoryId]) {
          levelState.slots[card.categoryId] = [];
        }
        subStack.forEach((entry) => {
          levelState.slots[card.categoryId].push(entry.card);
        });

        const nowComplete = levelState.slots[card.categoryId].length === level.cardsPerCategory;
        if (nowComplete) {
          soundManager?.play("categoryComplete");
          const category = categoriesMap.get(card.categoryId);
          progressStore.revealCategory(card.categoryId);
          if (category) showCategoryCompletePopup(category, authorPhotos[card.word] ?? null);
          levelState.spotCategories[spotIndex] = null;
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
    let column = null;
    let cardIndex = -1;
    let subStack = [];

    const loc = findCardLocation(levelState.tableauColumns, cardId);
    if (loc) {
      if (loc.colIndex === targetColIndex) return;
      source = "column";
      column = levelState.tableauColumns[loc.colIndex];
      cardIndex = loc.cardIndex;
      subStack = column.cards.slice(cardIndex);
    } else {
      const topWasteCard = levelState.waste?.[levelState.waste.length - 1];
      if (topWasteCard && topWasteCard.id === cardId) {
        source = "waste";
        subStack = [{ card: topWasteCard, faceUp: true }];
      }
    }

    if (subStack.length === 0) return;

    levelState.movesRemaining -= 1;
    selectedCardId = null;

    const targetColumn = levelState.tableauColumns[targetColIndex];
    const baseCard = subStack[0].card;

    if (canMoveToTableauColumn(baseCard, targetColumn)) {
      if (source === "column") {
        column.cards.splice(cardIndex); // remove subStack
        const newTop = getTopEntry(column);
        if (newTop) newTop.faceUp = true;
      } else if (source === "waste") {
        levelState.waste.pop();
      }

      targetColumn.cards.push(...subStack);
      soundManager?.play("cardPlace");
    } else {
      soundManager?.play("cardMove");
    }

    onStateChange();
    onLevelStatusChange();
  }
}
