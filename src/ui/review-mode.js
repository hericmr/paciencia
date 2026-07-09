// @ts-check
// Modo Revisão: permite ao jogador estudar todas as 14 categorias e seus eixos,
// revelando o microtexto pedagógico e as palavras associadas apenas para as
// categorias já desbloqueadas na partida.
import { showWordInfoPopup } from "./word-info-popup.js";

/**
 * @typedef {{
 *   id: string,
 *   nome: string,
 *   eixo: string,
 *   palavras: string[],
 *   microtexto: string,
 *   confundeCom: string[],
 *   explicacoesPalavras?: Record<string, string>
 * }} CategoryData
 */

/** @type {string} Eixo atualmente selecionado para filtragem */
let activeAxis = "etica";

/**
 * Renderiza a tela de Modo Revisão.
 * @param {HTMLElement} container Elemento raiz do modo revisão
 * @param {CategoryData[]} categoriesData Lista de todas as 14 categorias
 * @param {any} progressStore Store de progresso
 * @param {() => void} onBack Callback para retornar ao jogo
 * @param {Record<string, { photoUrl: string, photoCredit: string }>} [authorPhotos] Fotos dos autores
 */
export function renderReviewMode(container, categoriesData, progressStore, onBack, authorPhotos = {}) {
  const axes = ["etica", "tecnica", "politica_social", "historia", "teoria", "sociojuridico", "questao_social"];
  const axisNames = {
    "etica": "Ética",
    "tecnica": "Técnico-Operativo",
    "politica_social": "Política Social",
    "historia": "História",
    "teoria": "Teórico-Metodológico",
    "sociojuridico": "Sociojurídico",
    "questao_social": "Questão Social"
  };

  if (!activeAxis || !axes.includes(activeAxis)) {
    activeAxis = axes[0];
  }

  // Limpar o container
  container.innerHTML = "";

  // 1. Cabeçalho do modo revisão
  const header = document.createElement("div");
  header.className = "review-header";
  header.innerHTML = `
    <h2 class="review-title">Modo Revisão</h2>
    <button id="review-back-btn" class="back-btn" type="button">Voltar ao Jogo</button>
  `;
  container.appendChild(header);

  // Evento do botão Voltar
  header.querySelector("#review-back-btn")?.addEventListener("click", onBack);

  // 2. Tabs de Navegação dos Eixos
  const tabsContainer = document.createElement("div");
  tabsContainer.className = "tabs";

  axes.forEach((axis) => {
    const tabBtn = document.createElement("button");
    tabBtn.className = `tab-btn axis-${axis} ${activeAxis === axis ? "active" : ""}`;
    tabBtn.type = "button";
    tabBtn.innerText = axisNames[axis];
    tabBtn.addEventListener("click", () => {
      activeAxis = axis;
      renderReviewMode(container, categoriesData, progressStore, onBack, authorPhotos);
    });
    tabsContainer.appendChild(tabBtn);
  });
  container.appendChild(tabsContainer);

  // 3. Grid de Categorias do Eixo Ativo
  const gridContainer = document.createElement("div");
  gridContainer.className = "review-grid";

  // Obter as categorias do eixo ativo
  const axisCategories = categoriesData.filter((c) => c.eixo === activeAxis);

  axisCategories.forEach((category) => {
    const isRevealed = progressStore.isRevealed(category.id);
    const cardEl = document.createElement("div");
    cardEl.className = `category-card axis-${category.eixo} ${isRevealed ? "unlocked" : "locked"}`;
    cardEl.setAttribute("role", "region");
    cardEl.setAttribute("aria-label", isRevealed ? `Categoria ${category.nome}, revelada` : `Categoria bloqueada`);

    if (isRevealed) {
      // Procurar fotos associadas às palavras desta categoria
      const photos = category.palavras
        .map(word => ({ word, photo: authorPhotos[word] }))
        .filter(item => !!item.photo);

      let galleryHtml = "";
      if (photos.length > 0) {
        const itemsHtml = photos.map(item => `
          <div class="gallery-item" title="${item.word} (Crédito: ${item.photo.photoCredit})">
            <img src="${item.photo.photoUrl}" alt="Foto de ${item.word}" />
            <span class="gallery-item-name">${item.word}</span>
          </div>
        `).join("");
        galleryHtml = `
          <div class="category-card-gallery-section">
            <div class="category-card-gallery-title">Autores(as) da categoria:</div>
            <div class="category-card-gallery">${itemsHtml}</div>
          </div>
        `;
      }

      cardEl.innerHTML = `
        <div class="category-card-header">
          <span class="category-card-id">${category.id}</span>
          <span class="category-card-axis-badge">${axisNames[category.eixo]}</span>
        </div>
        <h3 class="category-card-title">${category.nome}</h3>
        <p class="category-card-microtext">${category.microtexto}</p>
        <div class="category-card-words">
          <div class="category-card-words-title">Palavras associadas:</div>
          <div class="word-pills-container">
            ${category.palavras.map(w => `<button type="button" class="word-pill" data-word="${w}">${w}</button>`).join("")}
          </div>
        </div>
        ${galleryHtml}
      `;
    } else {
      // Categoria bloqueada / não revelada
      cardEl.innerHTML = `
        <div class="category-card-header">
          <span class="category-card-id">${category.id}</span>
          <span class="category-card-axis-badge locked">Bloqueada</span>
        </div>
        <h3 class="category-card-title">🔒 Categoria Bloqueada</h3>
        <p class="category-card-microtext locked">Jogue para revelar esta categoria e ver seu conteúdo de revisão pedagógica.</p>
        <div class="category-card-words">
          <div class="category-card-words-title">Palavras associadas (bloqueadas):</div>
          <div class="word-pills-container">
            ${Array(category.palavras.length).fill('<span class="word-pill locked">???</span>').join("")}
          </div>
        </div>
      `;
    }

    if (isRevealed) {
      cardEl.querySelectorAll(".word-pill[data-word]").forEach((pillEl) => {
        pillEl.addEventListener("click", () => {
          const word = pillEl.getAttribute("data-word") ?? "";
          const texto = category.explicacoesPalavras?.[word];
          showWordInfoPopup(word, category.nome, texto, authorPhotos[word] ?? null, /** @type {HTMLElement} */ (pillEl));
        });
      });
    }

    gridContainer.appendChild(cardEl);
  });

  container.appendChild(gridContainer);
}
