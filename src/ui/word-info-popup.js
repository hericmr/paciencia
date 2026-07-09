// @ts-check
// Pop-up "Saiba mais" para uma palavra/carta individual, usado no Modo
// Revisão. Reaproveita o mesmo estilo visual do popup de categoria completa.

/**
 * @param {string} word
 * @param {string} categoryNome
 * @param {string} [texto]
 * @param {{ photoUrl: string, photoCredit: string } | null} [photo]
 * @param {HTMLElement|null} [triggerElement]
 */
export function showWordInfoPopup(word, categoryNome, texto, photo = null, triggerElement = null) {
  const existing = document.getElementById("word-modal-overlay");
  if (existing) existing.remove();

  const photoHtml = photo
    ? `<img class="modal-photo" src="${photo.photoUrl}" alt="Foto relacionada a ${word}" />
       <p class="modal-photo-credit">${photo.photoCredit}</p>`
    : "";

  const bodyText = texto && texto.trim()
    ? texto
    : "Ainda não há uma explicação cadastrada para esta carta.";

  const overlay = document.createElement("div");
  overlay.id = "word-modal-overlay";
  overlay.className = "modal-overlay";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-labelledby", "word-modal-title");

  overlay.innerHTML = `
    <div class="modal-container" tabIndex="-1">
      <button class="modal-close-btn" id="word-modal-close-btn" type="button" aria-label="Fechar">&times;</button>
      <div class="modal-subtitle">${categoryNome}</div>
      ${photoHtml}
      <h2 class="modal-title" id="word-modal-title">${word}</h2>
      <div class="modal-body">${bodyText}</div>
      <button class="modal-action-btn" id="word-modal-action-btn" type="button">Fechar</button>
    </div>
  `;

  document.body.appendChild(overlay);

  setTimeout(() => {
    overlay.classList.add("open");
    document.getElementById("word-modal-close-btn")?.focus();
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
  document.getElementById("word-modal-close-btn")?.addEventListener("click", close);
  document.getElementById("word-modal-action-btn")?.addEventListener("click", close);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) close();
  });
}
