// @ts-check
// Pop-up pedagógico exibido ao completar uma categoria: nome real +
// micro-texto + foto (quando disponível). Acessível (foco, Esc, devolve foco).

/**
 * @param {{ id: string, nome: string, microtexto: string }} categoryData
 * @param {{ photoUrl: string, photoCredit: string } | null} photo
 * @param {HTMLElement|null} triggerElement
 */
export function showCategoryCompletePopup(categoryData, photo, triggerElement = null) {
  const existing = document.getElementById("category-modal-overlay");
  if (existing) existing.remove();

  const photoHtml = photo
    ? `<img class="modal-photo" src="${photo.photoUrl}" alt="Foto relacionada a ${categoryData.nome}" />
       <p class="modal-photo-credit">${photo.photoCredit}</p>`
    : "";

  const overlay = document.createElement("div");
  overlay.id = "category-modal-overlay";
  overlay.className = "modal-overlay";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-labelledby", "category-modal-title");

  overlay.innerHTML = `
    <div class="modal-container" tabIndex="-1">
      <button class="modal-close-btn" id="category-modal-close-btn" type="button" aria-label="Fechar">&times;</button>
      <div class="modal-subtitle">Categoria completa!</div>
      ${photoHtml}
      <h2 class="modal-title" id="category-modal-title">${categoryData.nome}</h2>
      <div class="modal-body">${categoryData.microtexto}</div>
      <button class="modal-action-btn" id="category-modal-action-btn" type="button">Continuar</button>
    </div>
  `;

  document.body.appendChild(overlay);

  setTimeout(() => {
    overlay.classList.add("open");
    document.getElementById("category-modal-close-btn")?.focus();
  }, 10);

  function close() {
    overlay.classList.remove("open");
    setTimeout(() => {
      overlay.remove();
      if (triggerElement && typeof triggerElement.focus === "function") {
        triggerElement.focus();
      }
    }, 200);
    document.removeEventListener("keydown", handleKeyDown);
  }

  /** @param {KeyboardEvent} e */
  function handleKeyDown(e) {
    if (e.key === "Escape") close();
  }

  document.addEventListener("keydown", handleKeyDown);
  document.getElementById("category-modal-close-btn")?.addEventListener("click", close);
  document.getElementById("category-modal-action-btn")?.addEventListener("click", close);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) close();
  });
}
