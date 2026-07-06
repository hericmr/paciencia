// @ts-check
import { canMoveToFoundation, canMoveToTableau } from "../engine/rules.js";
import { showRevealPopup } from "./reveal-popup.js";

/**
 * @typedef {import("../engine/deck.js").EngineCard & { faceUp: boolean }} UICard
 * @typedef {Record<string, UICard[]>} Foundations
 * @typedef {{
 *   tableau: UICard[][],
 *   stock: UICard[],
 *   waste: UICard[],
 *   foundations: Foundations,
 *   themeSizes: Record<string, number>,
 *   status: string
 * }} GameState
 */

const rankNames = {
  "A": "Ás", "2": "Dois", "3": "Três", "4": "Quatro", "5": "Cinco", "6": "Seis",
  "7": "Sete", "8": "Oito", "9": "Nove", "10": "Dez", "J": "Valete", "Q": "Dama", "K": "Rei"
};

// Estado interno de seleção
/** @type {{ cardId: string, source: { type: "tableau"|"waste"|"foundation", colIndex?: number, theme?: string } } | null} */
let selected = null;

/**
 * Cria a notificação de novo princípio desbloqueado.
 * @param {number} order
 * @param {string} summary
 */
function showUnlockToast(order, summary) {
  const existing = document.getElementById("unlock-toast");
  if (existing) existing.remove();

  const toast = document.createElement("div");
  toast.id = "unlock-toast";
  toast.className = "notification-toast";
  toast.innerHTML = `
    <h4>Novo Princípio Desbloqueado!</h4>
    <p>Princípio ${order}: ${summary.substring(0, 50)}...</p>
  `;
  document.body.appendChild(toast);

  // Forçar reflow e mostrar
  setTimeout(() => toast.classList.add("show"), 50);

  // Esconder depois de 4 segundos
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 400);
  }, 4000);
}

/**
 * Renderiza o tabuleiro completo e configura os event listeners.
 * @param {HTMLElement} container Elemento raiz do tabuleiro
 * @param {GameState} gameState Estado atual do jogo
 * @param {Map<string, any>} cardsMap Dicionário de cartas com conteúdo educativo
 * @param {any} progressStore Store de progresso
 * @param {() => void} onStateChange Callback disparado após ações que mudam o estado
 * @param {Record<string, { axis: string, shortLabel: string }>} themesMeta Metadados dos 4 temas (axis/shortLabel)
 */
export function renderBoard(container, gameState, cardsMap, progressStore, onStateChange, themesMeta = {}) {
  container.innerHTML = "";

  // Renderizar estrutura de linhas
  const topRow = document.createElement("div");
  topRow.className = "board-top-row";

  const leftGroup = document.createElement("div");
  leftGroup.className = "board-left-group";

  const rightGroup = document.createElement("div");
  rightGroup.className = "board-right-group";

  topRow.appendChild(leftGroup);
  topRow.appendChild(rightGroup);
  container.appendChild(topRow);

  const tableauRow = document.createElement("div");
  tableauRow.className = "tableau-row";
  container.appendChild(tableauRow);

  // --- 1. STOCK (MONTE) ---
  const stockSlot = document.createElement("div");
  stockSlot.className = "pile-slot stock-pile";
  stockSlot.id = "stock-pile";
  stockSlot.tabIndex = 0;
  stockSlot.setAttribute("role", "button");
  stockSlot.setAttribute("aria-label", `Monte, ${gameState.stock.length} cartas restantes. Clique para comprar.`);

  if (gameState.stock.length > 0) {
    const cardEl = document.createElement("div");
    cardEl.className = "card-element face-down";
    stockSlot.appendChild(cardEl);
  }

  // Evento do Stock
  stockSlot.addEventListener("click", () => {
    if (gameState.stock.length > 0) {
      // Comprar carta
      const card = gameState.stock.pop();
      if (card) {
        card.faceUp = true;
        gameState.waste.push(card);

        // Verificar se é a primeira vez que a revelamos
        const isNew = progressStore.revealCard(card.id);
        if (isNew) {
          const cardData = cardsMap.get(card.id);
          if (cardData) {
            showRevealPopup(cardData, stockSlot, themesMeta);
          }
        }
      }
    } else if (gameState.waste.length > 0) {
      // Reciclar descarte de volta ao monte
      gameState.stock = gameState.waste.reverse().map((c) => {
        c.faceUp = false;
        return c;
      });
      gameState.waste = [];
    }
    selected = null;
    onStateChange();
  });

  leftGroup.appendChild(stockSlot);

  // --- 2. WASTE (DESCARTE) ---
  const wasteSlot = document.createElement("div");
  wasteSlot.className = "pile-slot waste-pile";
  wasteSlot.id = "waste-pile";

  if (gameState.waste.length > 0) {
    const topCard = gameState.waste[gameState.waste.length - 1];
    const isSelected = selected && selected.cardId === topCard.id;
    const cardEl = createCardElement(topCard, isSelected, cardsMap, themesMeta, () => {
      // Ao clicar na própria carta do descarte, selecionamos
      selected = { cardId: topCard.id, source: { type: "waste" } };
      onStateChange();
    });

    // Suporte a double tap / double click para auto-mover
    cardEl.addEventListener("dblclick", (e) => {
      e.stopPropagation();
      attemptAutoMove(topCard, { type: "waste" }, gameState, progressStore, themesMeta, onStateChange);
    });

    // Configurar Drag & Drop
    cardEl.setAttribute("draggable", "true");
    cardEl.addEventListener("dragstart", (e) => {
      e.dataTransfer?.setData("application/json", JSON.stringify({
        cardId: topCard.id,
        source: { type: "waste" }
      }));
    });

    wasteSlot.appendChild(cardEl);
  }
  leftGroup.appendChild(wasteSlot);

  // --- 3. FOUNDATIONS (FUNDAÇÕES) ---
  const themes = Object.keys(themesMeta);
  themes.forEach((theme) => {
    const foundSlot = document.createElement("div");
    foundSlot.className = "pile-slot foundation-pile";
    foundSlot.dataset.theme = theme;
    foundSlot.id = `foundation-${theme}`;
    foundSlot.tabIndex = 0;
    foundSlot.setAttribute("role", "region");

    const count = gameState.foundations[theme].length;
    const themeSize = gameState.themeSizes[theme];
    const themeLabel = themesMeta[theme]?.shortLabel || theme;
    foundSlot.setAttribute("aria-label", `Fundação de ${themeLabel}. ${count} de ${themeSize} cartas.`);

    if (count > 0) {
      const topCard = gameState.foundations[theme][count - 1];
      const cardEl = createCardElement(topCard, false, cardsMap, themesMeta, () => {
        // Raramente precisamos mover da fundação, mas podemos selecionar se necessário
        selected = { cardId: topCard.id, source: { type: "foundation", theme } };
        onStateChange();
      });
      foundSlot.appendChild(cardEl);
    }

    // Aceitar clique para mover à fundação
    foundSlot.addEventListener("click", () => {
      if (selected) {
        const movingCard = findCardById(selected.cardId, gameState);
        if (movingCard) {
          const targetFoundation = gameState.foundations[theme];
          if (canMoveToFoundation(movingCard, theme)) {
            // Realizar movimento
            executeMove(selected.cardId, selected.source, { type: "foundation", theme }, gameState);

            // Verificar se completou a fundação
            if (targetFoundation.length === gameState.themeSizes[theme]) {
              const newTotal = progressStore.incrementFoundationsCompleted();
              // Mostrar toast do princípio desbloqueado se estiver na faixa 1..11
              if (newTotal <= 11) {
                // Carregar resumo do princípio
                const principles = window.currentPrinciples || [];
                const p = principles.find((x) => x.order === newTotal);
                if (p) {
                  showUnlockToast(newTotal, p.summary);
                }
              }
            }

            selected = null;
            onStateChange();
          }
        }
      }
    });

    // Drag over e Drop
    foundSlot.addEventListener("dragover", (e) => {
      e.preventDefault();
      foundSlot.classList.add("valid-target");
    });

    foundSlot.addEventListener("dragleave", () => {
      foundSlot.classList.remove("valid-target");
    });

    foundSlot.addEventListener("drop", (e) => {
      foundSlot.classList.remove("valid-target");
      const rawData = e.dataTransfer?.getData("application/json");
      if (rawData) {
        const { cardId, source } = JSON.parse(rawData);
        const movingCard = findCardById(cardId, gameState);
        if (movingCard) {
          const targetFoundation = gameState.foundations[theme];
          if (canMoveToFoundation(movingCard, theme)) {
            executeMove(cardId, source, { type: "foundation", theme }, gameState);
            if (targetFoundation.length === gameState.themeSizes[theme]) {
              const newTotal = progressStore.incrementFoundationsCompleted();
              if (newTotal <= 11) {
                const principles = window.currentPrinciples || [];
                const p = principles.find((x) => x.order === newTotal);
                if (p) showUnlockToast(newTotal, p.summary);
              }
            }
            selected = null;
            onStateChange();
          }
        }
      }
    });

    rightGroup.appendChild(foundSlot);
  });

  // --- 4. TABLEAU (COLUNAS) ---
  for (let i = 0; i < 7; i++) {
    const colSlot = document.createElement("div");
    colSlot.className = "pile-slot tableau-column";
    colSlot.id = `tableau-${i}`;
    colSlot.dataset.col = String(i);
    colSlot.tabIndex = 0;
    colSlot.setAttribute("role", "region");

    const colCards = gameState.tableau[i];
    colSlot.setAttribute("aria-label", `Coluna ${i + 1} do Tableau. Contém ${colCards.length} cartas.`);

    let topOffset = 0;

    colCards.forEach((card, cardIdx) => {
      const isSelected = selected && selected.cardId === card.id;
      const cardWrapper = document.createElement("div");
      cardWrapper.className = "card-wrapper";
      cardWrapper.style.top = `${topOffset}px`;

      const cardEl = createCardElement(card, isSelected, cardsMap, themesMeta, () => {
        if (!card.faceUp) {
          // Virar carta se for a do topo
          if (cardIdx === colCards.length - 1) {
            card.faceUp = true;
            const isNew = progressStore.revealCard(card.id);
            if (isNew) {
              const cardData = cardsMap.get(card.id);
              if (cardData) {
                showRevealPopup(cardData, cardEl, themesMeta);
              }
            }
            selected = null;
            onStateChange();
          }
        } else {
          // Selecionar carta e a sequência abaixo dela
          selected = { cardId: card.id, source: { type: "tableau", colIndex: i, cardIndex: cardIdx } };
          onStateChange();
        }
      });

      // Se a carta já estiver selecionada e clicar nela de novo, tenta auto-mover
      if (isSelected) {
        cardEl.addEventListener("click", (e) => {
          e.stopPropagation();
          attemptAutoMove(card, { type: "tableau", colIndex: i, cardIndex: cardIdx }, gameState, progressStore, themesMeta, onStateChange);
        });
      }

      // Configurar double click para auto-mover
      if (card.faceUp) {
        cardEl.addEventListener("dblclick", (e) => {
          e.stopPropagation();
          attemptAutoMove(card, { type: "tableau", colIndex: i, cardIndex: cardIdx }, gameState, progressStore, themesMeta, onStateChange);
        });

        // Configurar Drag & Drop
        cardEl.setAttribute("draggable", "true");
        cardEl.addEventListener("dragstart", (e) => {
          e.dataTransfer?.setData("application/json", JSON.stringify({
            cardId: card.id,
            source: { type: "tableau", colIndex: i, cardIndex: cardIdx }
          }));
        });
      }

      cardWrapper.appendChild(cardEl);
      colSlot.appendChild(cardWrapper);

      // Calcular offset para a próxima carta
      if (card.faceUp) {
        topOffset += window.innerWidth < 600 ? 18 : 26;
      } else {
        topOffset += window.innerWidth < 600 ? 8 : 12;
      }
    });

    // Aceitar drop / clique em coluna vazia ou em carta da coluna
    colSlot.addEventListener("click", (e) => {
      // Se clicou na própria coluna (geralmente vazia)
      if (e.target === colSlot && selected) {
        handleMoveToTableauColumn(i, gameState, onStateChange);
      }
    });

    // Permitir arrastar sobre a coluna inteira
    colSlot.addEventListener("dragover", (e) => {
      e.preventDefault();
      colSlot.classList.add("valid-target");
    });

    colSlot.addEventListener("dragleave", () => {
      colSlot.classList.remove("valid-target");
    });

    colSlot.addEventListener("drop", (e) => {
      colSlot.classList.remove("valid-target");
      const rawData = e.dataTransfer?.getData("application/json");
      if (rawData) {
        const { cardId, source } = JSON.parse(rawData);
        const movingCard = findCardById(cardId, gameState);
        if (movingCard) {
          const targetTop = colCards[colCards.length - 1] ?? null;
          if (canMoveToTableau(movingCard, targetTop)) {
            executeMove(cardId, source, { type: "tableau", colIndex: i }, gameState);
            selected = null;
            onStateChange();
          }
        }
      }
    });

    tableauRow.appendChild(colSlot);
  }
}

/**
 * Cria o elemento HTML de uma carta.
 * @param {UICard} card
 * @param {boolean} isSelected
 * @param {Map<string, any>} cardsMap
 * @param {Record<string, { axis: string, shortLabel: string }>} themesMeta
 * @param {() => void} onClick
 * @returns {HTMLElement}
 */
function createCardElement(card, isSelected, cardsMap, themesMeta, onClick) {
  const cardEl = document.createElement("div");
  cardEl.className = `card-element ${card.faceUp ? "" : "face-down"} theme-${card.theme} ${isSelected ? "selected" : ""}`;
  cardEl.dataset.id = card.id;
  cardEl.tabIndex = 0;

  const labelTheme = themesMeta[card.theme]?.shortLabel || card.theme;
  const labelRank = rankNames[card.rank] || card.rank;
  cardEl.setAttribute("aria-label", card.faceUp ? `${labelRank} — ${labelTheme}, virada para cima` : "Carta virada para baixo");

  if (card.faceUp) {
    const cardData = cardsMap.get(card.id);
    const cardTitle = cardData ? cardData.title : `${card.rank}`;
    const photoThumb = cardData?.photoUrl
      ? `<img class="card-photo-thumb" src="${cardData.photoUrl}" alt="" />`
      : "";

    cardEl.innerHTML = `
      <div class="card-header">
        <span class="card-value">${card.rank}</span>
        <span class="card-theme-dot" aria-hidden="true"></span>
      </div>
      ${photoThumb}
      <div class="card-body">
        <span class="card-title">${cardTitle}</span>
      </div>
      <button class="card-info-btn" type="button" aria-label="Ver informações sobre ${cardTitle}">ⓘ</button>
    `;

    // Parar propagação no botão de informações e abrir modal
    const infoBtn = cardEl.querySelector(".card-info-btn");
    infoBtn?.addEventListener("click", (e) => {
      e.stopPropagation();
      if (cardData) {
        showRevealPopup(cardData, cardEl, themesMeta);
      }
    });
  }

  cardEl.addEventListener("click", (e) => {
    e.stopPropagation();
    onClick();
  });

  // Teclado para acessibilidade (Enter ou Espaço ativam o clique)
  cardEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick();
    }
  });

  return cardEl;
}

/**
 * Trata o movimento de um card/sequência selecionado para uma coluna do tableau.
 * @param {number} colIndex
 * @param {GameState} gameState
 * @param {() => void} onStateChange
 */
function handleMoveToTableauColumn(colIndex, gameState, onStateChange) {
  if (!selected) return;
  const movingCard = findCardById(selected.cardId, gameState);
  if (!movingCard) return;

  const targetCol = gameState.tableau[colIndex];
  const targetTop = targetCol[targetCol.length - 1] ?? null;

  if (canMoveToTableau(movingCard, targetTop)) {
    executeMove(selected.cardId, selected.source, { type: "tableau", colIndex }, gameState);
    selected = null;
    onStateChange();
  }
}

/**
 * Tenta mover uma carta automaticamente para o local mais adequado (fundações e depois tableau).
 * @param {UICard} card
 * @param {any} source
 * @param {GameState} gameState
 * @param {any} progressStore
 * @param {Record<string, { axis: string, shortLabel: string }>} themesMeta
 * @param {() => void} onStateChange
 */
function attemptAutoMove(card, source, gameState, progressStore, themesMeta, onStateChange) {
  // 1. Tentar mover para Fundação
  for (const theme of Object.keys(themesMeta)) {
    const targetFoundation = gameState.foundations[theme];
    if (canMoveToFoundation(card, theme)) {
      executeMove(card.id, source, { type: "foundation", theme }, gameState);
      if (targetFoundation.length === gameState.themeSizes[theme]) {
        const newTotal = progressStore.incrementFoundationsCompleted();
        if (newTotal <= 11) {
          const principles = window.currentPrinciples || [];
          const p = principles.find((x) => x.order === newTotal);
          if (p) showUnlockToast(newTotal, p.summary);
        }
      }
      selected = null;
      onStateChange();
      return;
    }
  }

  // 2. Tentar mover para Tableau
  for (let i = 0; i < 7; i++) {
    // Evitar mover para a própria coluna original se já estivesse lá e estivesse no topo de uma sequência
    if (source.type === "tableau" && source.colIndex === i) continue;

    const targetCol = gameState.tableau[i];
    const targetTop = targetCol[targetCol.length - 1] ?? null;
    if (canMoveToTableau(card, targetTop)) {
      executeMove(card.id, source, { type: "tableau", colIndex: i }, gameState);
      selected = null;
      onStateChange();
      return;
    }
  }
}

/**
 * Encontra um card pelo ID no estado atual do jogo.
 * @param {string} id
 * @param {GameState} gameState
 * @returns {UICard|null}
 */
function findCardById(id, gameState) {
  // Procurar no descarte
  let found = gameState.waste.find((c) => c.id === id);
  if (found) return found;

  // Procurar no tableau
  for (const col of gameState.tableau) {
    found = col.find((c) => c.id === id);
    if (found) return found;
  }

  // Procurar nas fundações
  for (const theme in gameState.foundations) {
    found = gameState.foundations[theme].find((c) => c.id === id);
    if (found) return found;
  }

  return null;
}

/**
 * Move o card selecionado (e sequências no tableau) de uma origem a um destino.
 * @param {string} cardId
 * @param {any} srcInfo
 * @param {any} destInfo
 * @param {GameState} gameState
 */
function executeMove(cardId, srcInfo, destInfo, gameState) {
  /** @type {UICard[]} */
  let movingCards = [];

  // 1. Extrair os cards do local de origem
  if (srcInfo.type === "waste") {
    const card = gameState.waste.pop();
    if (card) movingCards.push(card);
  } else if (srcInfo.type === "foundation") {
    const card = gameState.foundations[srcInfo.theme].pop();
    if (card) movingCards.push(card);
  } else if (srcInfo.type === "tableau") {
    const col = gameState.tableau[srcInfo.colIndex];
    movingCards = col.slice(srcInfo.cardIndex);
    // Remover da coluna
    gameState.tableau[srcInfo.colIndex] = col.slice(0, srcInfo.cardIndex);
  }

  // 2. Colocar os cards no local de destino
  if (destInfo.type === "foundation") {
    gameState.foundations[destInfo.theme].push(...movingCards);
  } else if (destInfo.type === "tableau") {
    gameState.tableau[destInfo.colIndex].push(...movingCards);
  }
}
