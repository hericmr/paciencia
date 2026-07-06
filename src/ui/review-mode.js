// @ts-check
import { showRevealPopup } from "./reveal-popup.js";

const THEMES = ["teorico-metodologico", "etico-politico", "tecnico-operativo", "historico-formativo"];
const rankNames = {
  "A": "Ás", "2": "Dois", "3": "Três", "4": "Quatro", "5": "Cinco", "6": "Seis",
  "7": "Sete", "8": "Oito", "9": "Nove", "10": "Dez", "J": "Valete", "Q": "Dama", "K": "Rei"
};
const RANK_ORDER = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

/** @type {string} */
let activeTheme = "teorico-metodologico";

/**
 * Renderiza a tela de Modo Revisão.
 * @param {HTMLElement} container Elemento raiz do modo revisão
 * @param {any[]} cardsData Lista de dados de cartas carregados do JSON
 * @param {any[]} principlesData Lista de princípios carregados do JSON
 * @param {any} progressStore Store de progresso
 * @param {() => void} onBack Callback para retornar ao jogo
 * @param {Record<string, { axis: string, shortLabel: string }>} themesMeta Metadados dos 4 temas
 */
export function renderReviewMode(container, cardsData, principlesData, progressStore, onBack, themesMeta = {}) {
  // Limpar container
  container.innerHTML = "";

  // 1. Cabeçalho do modo revisão
  const header = document.createElement("div");
  header.className = "review-header";
  header.innerHTML = `
    <h2 class="review-title">Modo Revisão</h2>
    <button id="review-back-btn" type="button">Voltar ao Jogo</button>
  `;
  container.appendChild(header);

  // Evento do botão Voltar
  header.querySelector("#review-back-btn")?.addEventListener("click", onBack);

  // 2. Tabs de Navegação dos Temas
  const tabsContainer = document.createElement("div");
  tabsContainer.className = "tabs";

  THEMES.forEach((theme) => {
    const tabBtn = document.createElement("button");
    tabBtn.className = `tab-btn theme-${theme} ${activeTheme === theme ? "active" : ""}`;
    tabBtn.type = "button";
    tabBtn.innerText = themesMeta[theme]?.shortLabel || theme;
    tabBtn.addEventListener("click", () => {
      activeTheme = theme;
      // Re-renderizar o modo revisão
      renderReviewMode(container, cardsData, principlesData, progressStore, onBack, themesMeta);
    });
    tabsContainer.appendChild(tabBtn);
  });
  container.appendChild(tabsContainer);

  // 3. Grid de Cartas do Tema Ativo
  const gridContainer = document.createElement("div");
  gridContainer.className = "review-grid";

  // Obter as cartas do tema ativo ordenadas por rank (A..K)
  const themeCards = RANK_ORDER.map((rank) => {
    return cardsData.find((c) => c.theme === activeTheme && c.rank === rank);
  }).filter(Boolean);

  themeCards.forEach((cardData) => {
    const isRevealed = progressStore.isRevealed(cardData.id);

    const cardItem = document.createElement("div");
    cardItem.className = "review-card-item";

    const cardWrapper = document.createElement("div");
    cardWrapper.className = "card-wrapper";

    const cardEl = document.createElement("div");
    cardEl.className = `card-element ${isRevealed ? "" : "face-down"} ${isRevealed ? `theme-${cardData.theme}` : ""}`;
    cardEl.tabIndex = 0;

    const labelTheme = themesMeta[cardData.theme]?.shortLabel || cardData.theme;
    const labelRank = rankNames[cardData.rank] || cardData.rank;
    cardEl.setAttribute("aria-label", isRevealed ? `${labelRank} — ${labelTheme}, revelada` : `Carta bloqueada (${labelRank} — ${labelTheme})`);

    if (isRevealed) {
      const photoThumb = cardData.photoUrl
        ? `<img class="card-photo-thumb" src="${cardData.photoUrl}" alt="" />`
        : "";
      cardEl.innerHTML = `
        <div class="card-header">
          <span class="card-value">${cardData.rank}</span>
          <span class="card-theme-dot" aria-hidden="true"></span>
        </div>
        ${photoThumb}
        <div class="card-body">
          <span class="card-title">${cardData.title}</span>
        </div>
        <button class="card-info-btn" type="button" aria-label="Ver informações sobre ${cardData.title}">ⓘ</button>
      `;

      // Evento de clique para mostrar pop-up com detalhes da carta revelada
      cardEl.addEventListener("click", () => {
        showRevealPopup(cardData, cardEl, themesMeta);
      });

      cardEl.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          showRevealPopup(cardData, cardEl, themesMeta);
        }
      });
    } else {
      // Carta bloqueada / não revelada
      cardEl.setAttribute("title", "Jogue mais partidas para revelar esta carta.");
    }

    cardWrapper.appendChild(cardEl);
    cardItem.appendChild(cardWrapper);

    const cardLabel = document.createElement("span");
    cardLabel.className = "review-card-label";
    cardLabel.innerText = `${cardData.rank}`;
    cardItem.appendChild(cardLabel);

    gridContainer.appendChild(cardItem);
  });
  container.appendChild(gridContainer);

  // 4. Seção dos Princípios Éticos (US3 / US4)
  const principlesSection = document.createElement("div");
  principlesSection.className = "principles-section";

  const completedCount = progressStore.getFoundationsCompletedCount();
  const unlockedCount = Math.min(11, completedCount);

  principlesSection.innerHTML = `
    <h3 class="principles-title">
      <span>Princípios Fundamentais (Código de Ética de 1993)</span>
      <span class="principles-counter">${unlockedCount} de 11 Desbloqueados (${completedCount} fundações concluídas no histórico)</span>
    </h3>
    <div class="principles-list" id="principles-list"></div>
  `;
  container.appendChild(principlesSection);

  const principlesList = principlesSection.querySelector("#principles-list");
  if (principlesList) {
    principlesData.forEach((p) => {
      const isUnlocked = p.order <= unlockedCount;
      const principleEl = document.createElement("div");
      principleEl.className = `principle-item ${isUnlocked ? "" : "locked"}`;
      principleEl.setAttribute("role", "listitem");

      if (isUnlocked) {
        const displayFullText = p.fullText;
        // O Código de Ética de 1993 é conteúdo oficial já publicado
        // legislativamente; o placeholder de FR-011 aplica-se apenas às
        // cartas do baralho (rascunho/revisado), não aos princípios.

        principleEl.innerHTML = `
          <div class="principle-badge">${p.order}</div>
          <div class="principle-content">
            <div class="principle-summary">${p.summary}</div>
            <div class="principle-full-text">${displayFullText}</div>
          </div>
        `;
      } else {
        principleEl.innerHTML = `
          <div class="principle-badge">?</div>
          <div class="principle-content">
            <div class="principle-summary">Princípio Bloqueado</div>
            <div class="principle-full-text">Complete mais fundações (eixos temáticos) em suas partidas para liberar este princípio do Código de Ética.</div>
          </div>
        `;
      }
      principlesList.appendChild(principleEl);
    });
  }
}
