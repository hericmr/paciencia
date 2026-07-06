// @ts-check
// Pop-up educativo para exibir o conteúdo da carta ao ser revelada.
// Atende aos requisitos de acessibilidade (foco, Esc, aria-label) e FR-011.

/**
 * Mostra o pop-up com as informações educativas de uma carta.
 * @param {{ id: string, title: string, body: string, theme: string, status: string, photoUrl?: string|null, photoCredit?: string|null }} cardData
 * @param {HTMLElement|null} triggerElement O elemento que disparou a abertura, para restaurar o foco
 * @param {Record<string, { axis: string, shortLabel: string }>} themesMeta metadados dos temas, carregados de cards.*.json
 */
export function showRevealPopup(cardData, triggerElement = null, themesMeta = {}) {
  // Remover modal existente se houver
  const existing = document.getElementById("reveal-modal-overlay");
  if (existing) {
    existing.remove();
  }

  // Determinar se é produção
  const isDevelopment = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
  const isProduction = !isDevelopment;

  let displayBody = cardData.body;
  if (isProduction && cardData.status !== "publicado") {
    displayBody = "Conteúdo em revisão.";
  }

  const themeText = themesMeta[cardData.theme]?.axis || cardData.theme;

  const photoHtml = cardData.photoUrl
    ? `<img class="modal-photo" src="${cardData.photoUrl}" alt="Foto de ${cardData.title}" />
       <p class="modal-photo-credit">${cardData.photoCredit ?? ""}</p>`
    : "";

  const overlay = document.createElement("div");
  overlay.id = "reveal-modal-overlay";
  overlay.className = "modal-overlay";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-labelledby", "modal-title");

  overlay.innerHTML = `
    <div class="modal-container" tabIndex="-1">
      <button class="modal-close-btn" id="modal-close-btn" type="button" aria-label="Fechar">&times;</button>
      <div class="modal-subtitle">${themeText}</div>
      ${photoHtml}
      <h2 class="modal-title" id="modal-title">${cardData.title}</h2>
      <div class="modal-body">${displayBody}</div>
      <button class="modal-action-btn" id="modal-action-btn" type="button">Fechar e continuar</button>
    </div>
  `;

  document.body.appendChild(overlay);

  // Trigger reflow to start transition
  setTimeout(() => {
    overlay.classList.add("open");
    // Foco automático
    const closeBtn = document.getElementById("modal-close-btn");
    if (closeBtn) closeBtn.focus();
  }, 10);

  function close() {
    overlay.classList.remove("open");
    setTimeout(() => {
      overlay.remove();
      if (triggerElement && typeof triggerElement.focus === "function") {
        triggerElement.focus();
      }
    }, 200); // tempo da transição
    document.removeEventListener("keydown", handleKeyDown);
  }

  /** @param {KeyboardEvent} e */
  function handleKeyDown(e) {
    if (e.key === "Escape") {
      close();
    }
  }

  document.addEventListener("keydown", handleKeyDown);
  document.getElementById("modal-close-btn")?.addEventListener("click", close);
  document.getElementById("modal-action-btn")?.addEventListener("click", close);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) {
      close();
    }
  });
}
