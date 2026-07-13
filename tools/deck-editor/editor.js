// @ts-check
// Orquestração do Editor de Baralho: File System Access API, DOM e canvas.
// Ver specs/003-editor-de-baralho/ (spec.md, plan.md, contracts/editor-contract.md).
import {
  cardId,
  computeResizeDimensions,
  validateImageMetadata,
  stringifyJson,
  CARD_IMAGE_MAX_BYTES,
  WEBP_QUALITY_STEPS,
} from "./lib.js";
import { validateCategories } from "../../src/data/loader.js";

const openFolderBtn = /** @type {HTMLButtonElement} */ (document.getElementById("open-folder-btn"));
const changeFolderBtn = document.getElementById("change-folder-btn");
const folderStatus = document.getElementById("folder-status");
const unsupportedWarning = document.getElementById("unsupported-warning");
const appRoot = document.getElementById("app-root");
const categoryGridEl = document.getElementById("category-grid");
const categoryDetailEl = document.getElementById("category-detail");
const tabCardsEl = document.getElementById("tab-cards");
const tabContentEl = document.getElementById("tab-content");
const globalStatusEl = document.getElementById("global-status");

const cardModal = document.getElementById("card-editor-modal");
const cardEditorCategoryEl = document.getElementById("card-editor-category");
const cardWordInput = /** @type {HTMLInputElement} */ (document.getElementById("card-word-input"));
const cardExplicacaoTextarea = /** @type {HTMLTextAreaElement} */ (document.getElementById("card-explicacao-textarea"));
const currentImagePreview = /** @type {HTMLImageElement} */ (document.getElementById("current-image-preview"));
const currentImagePlaceholder = document.getElementById("current-image-placeholder");
const resizeCanvas = /** @type {HTMLCanvasElement} */ (document.getElementById("resize-canvas"));
const newImageSizeEl = document.getElementById("new-image-size");
const dropZone = document.getElementById("drop-zone");
const fileInput = /** @type {HTMLInputElement} */ (document.getElementById("file-input"));
const photoCreditInput = /** @type {HTMLInputElement} */ (document.getElementById("photo-credit-input"));
const realPersonCheckbox = /** @type {HTMLInputElement} */ (document.getElementById("real-person-checkbox"));
const authorInput = /** @type {HTMLInputElement} */ (document.getElementById("author-input"));
const licenseInput = /** @type {HTMLInputElement} */ (document.getElementById("license-input"));
const commonsUrlInput = /** @type {HTMLInputElement} */ (document.getElementById("commons-url-input"));
const cardFormErrors = document.getElementById("card-form-errors");
const saveCardBtn = /** @type {HTMLButtonElement} */ (document.getElementById("save-card-btn"));
const cancelCardBtn = document.getElementById("cancel-card-btn");
const cardEditorForm = /** @type {HTMLFormElement} */ (document.getElementById("card-editor-form"));

const newCategoryBtn = document.getElementById("new-category-btn");
const newCategoryModal = document.getElementById("new-category-modal");
const newCategoryForm = /** @type {HTMLFormElement} */ (document.getElementById("new-category-form"));
const newCategoryIdInput = /** @type {HTMLInputElement} */ (document.getElementById("new-category-id"));
const newCategoryNomeInput = /** @type {HTMLInputElement} */ (document.getElementById("new-category-nome"));
const newCategoryEixoInput = /** @type {HTMLInputElement} */ (document.getElementById("new-category-eixo"));
const newCategoryErrors = document.getElementById("new-category-errors");
const cancelNewCategoryBtn = document.getElementById("cancel-new-category-btn");

/** @type {FileSystemDirectoryHandle | null} */
let projectDirHandle = null;
/** @type {any[]} */
let categoriesData = [];
/** @type {Record<string, { photoUrl: string, photoCredit: string, author?: string, license?: string, commonsFileUrl?: string }>} */
let authorPhotos = {};
/** @type {any[]} lido só para leitura, para o aviso de cruzamento com levels.json (FR-013: nunca editado aqui) */
let levelsData = [];
/** @type {any | null} */
let activeCategory = null;
/** @type {string | null} */
let activeWord = null;
/** @type {Blob | null} */
let pendingBlob = null;

// --- File System Access API: helpers de leitura/gravação ---

/**
 * @param {FileSystemDirectoryHandle} root
 * @param {string} relativePath ex.: "src/data/categories.json"
 * @param {{ create?: boolean }} [options]
 */
async function getNestedFileHandle(root, relativePath, { create = false } = {}) {
  const parts = relativePath.split("/");
  let dir = root;
  for (let i = 0; i < parts.length - 1; i++) {
    dir = await dir.getDirectoryHandle(parts[i], { create });
  }
  return dir.getFileHandle(parts[parts.length - 1], { create });
}

async function readJsonFile(root, relativePath) {
  const handle = await getNestedFileHandle(root, relativePath);
  const file = await handle.getFile();
  return JSON.parse(await file.text());
}

async function writeJsonFile(root, relativePath, data) {
  const handle = await getNestedFileHandle(root, relativePath, { create: true });
  const writable = await handle.createWritable();
  await writable.write(stringifyJson(data));
  await writable.close();
}

async function writeBinaryFile(root, relativePath, blob) {
  const handle = await getNestedFileHandle(root, relativePath, { create: true });
  const writable = await handle.createWritable();
  await writable.write(blob);
  await writable.close();
}

async function loadImagePreviewUrl(photoUrl) {
  try {
    const handle = await getNestedFileHandle(projectDirHandle, photoUrl);
    const file = await handle.getFile();
    return URL.createObjectURL(file);
  } catch {
    return null;
  }
}

/**
 * Aviso (não bloqueante) de que uma palavra renomeada/removida de uma
 * categoria ainda é referenciada em `selectedWords` de algum nível —
 * o editor nunca edita `levels.json` (FR-013), só alerta.
 * @param {string} categoryId
 * @param {string[]} changedWords
 * @returns {string | null}
 */
function warnIfWordUsedInLevels(categoryId, changedWords) {
  const changedSet = new Set(changedWords);
  const affectedLevelIds = [];
  for (const level of levelsData) {
    if (!level.categoryIds?.includes(categoryId)) continue;
    const selected = level.selectedWords?.[categoryId] ?? [];
    if (selected.some((w) => changedSet.has(w))) affectedLevelIds.push(level.id);
  }
  if (affectedLevelIds.length === 0) return null;
  return `"${[...changedSet].join(", ")}" ainda aparece em selectedWords do(s) Nível(is) ${affectedLevelIds.join(
    ", "
  )} (${categoryId}) — atualize levels.json manualmente.`;
}

// --- Status global ---

let statusTimeout = null;
function showGlobalStatus(message, kind = "ok", duration = 5000) {
  globalStatusEl.textContent = message;
  globalStatusEl.className = `global-status ${kind}`;
  clearTimeout(statusTimeout);
  statusTimeout = setTimeout(() => {
    globalStatusEl.textContent = "";
  }, duration);
}

// --- Pasta do projeto: lembrada entre sessões via IndexedDB ---
//
// A File System Access API não deixa uma página acessar pastas do disco
// sem concessão explícita do usuário (segurança do navegador) — não dá
// pra pular isso na primeira vez. Mas como este editor sempre aponta pra
// mesma pasta (a raiz do próprio projeto), guardamos o
// FileSystemDirectoryHandle no IndexedDB e, nas próximas visitas,
// tentamos reconectar sem reabrir o seletor de pastas: se a permissão
// ainda estiver concedida, reconecta sem nenhum clique; senão, um único
// clique em "Continuar com a pasta do projeto" reconfirma a permissão
// pro mesmo handle (sem navegar até a pasta de novo).

const HANDLE_DB_NAME = "deck-editor";
const HANDLE_STORE_NAME = "handles";
const HANDLE_KEY = "projectDir";

function openHandleDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(HANDLE_DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(HANDLE_STORE_NAME);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function saveStoredDirHandle(handle) {
  const db = await openHandleDb();
  await new Promise((resolve, reject) => {
    const tx = db.transaction(HANDLE_STORE_NAME, "readwrite");
    tx.objectStore(HANDLE_STORE_NAME).put(handle, HANDLE_KEY);
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

async function loadStoredDirHandle() {
  const db = await openHandleDb();
  const handle = await new Promise((resolve, reject) => {
    const tx = db.transaction(HANDLE_STORE_NAME, "readonly");
    const req = tx.objectStore(HANDLE_STORE_NAME).get(HANDLE_KEY);
    req.onsuccess = () => resolve(req.result ?? null);
    req.onerror = () => reject(req.error);
  });
  db.close();
  return handle;
}

async function clearStoredDirHandle() {
  const db = await openHandleDb();
  await new Promise((resolve, reject) => {
    const tx = db.transaction(HANDLE_STORE_NAME, "readwrite");
    tx.objectStore(HANDLE_STORE_NAME).delete(HANDLE_KEY);
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

if (!window.showDirectoryPicker) {
  unsupportedWarning.hidden = false;
  openFolderBtn.disabled = true;
} else {
  openFolderBtn.addEventListener("click", handleOpenFolderClick);
  changeFolderBtn.addEventListener("click", forgetProjectFolder);
  tryAutoReconnect();
}

/** Roda ao carregar a página: tenta reconectar na pasta lembrada, sem interação do usuário quando possível. */
async function tryAutoReconnect() {
  let stored;
  try {
    stored = await loadStoredDirHandle();
  } catch {
    stored = null;
  }
  if (!stored) return;

  const permission = await stored.queryPermission({ mode: "readwrite" });
  if (permission === "granted") {
    await loadProject(stored);
    return;
  }

  // Permissão precisa ser reconfirmada com 1 gesto do usuário, mas sem
  // reabrir o seletor — é o mesmo handle de antes.
  openFolderBtn.textContent = "Continuar com a pasta do projeto";
  openFolderBtn.dataset.mode = "reconnect";
}

async function handleOpenFolderClick() {
  if (openFolderBtn.dataset.mode === "reconnect") {
    try {
      const stored = await loadStoredDirHandle();
      const permission = await stored.requestPermission({ mode: "readwrite" });
      if (permission !== "granted") {
        showGlobalStatus("Permissão negada para a pasta lembrada — escolha a pasta novamente.", "error");
        await clearStoredDirHandle();
        resetOpenFolderButton();
        return;
      }
      await loadProject(stored);
    } catch (err) {
      showGlobalStatus(`Erro ao reconectar: ${err.message}`, "error");
    }
    return;
  }

  try {
    const handle = await window.showDirectoryPicker({ mode: "readwrite" });
    await saveStoredDirHandle(handle);
    await loadProject(handle);
  } catch (err) {
    if (err && err.name === "AbortError") return;
    showGlobalStatus(`Erro ao abrir a pasta: ${err.message}`, "error");
  }
}

function resetOpenFolderButton() {
  openFolderBtn.textContent = "Abrir pasta do projeto";
  openFolderBtn.hidden = false;
  delete openFolderBtn.dataset.mode;
}

async function forgetProjectFolder() {
  await clearStoredDirHandle();
  projectDirHandle = null;
  categoriesData = [];
  authorPhotos = {};
  levelsData = [];
  activeCategory = null;
  activeWord = null;
  appRoot.hidden = true;
  categoryDetailEl.hidden = true;
  changeFolderBtn.hidden = true;
  folderStatus.textContent = "";
  resetOpenFolderButton();
}

async function loadProject(handle) {
  try {
    projectDirHandle = handle;
    folderStatus.textContent = "Carregando...";

    const categoriesJson = await readJsonFile(projectDirHandle, "src/data/categories.json");
    categoriesData = categoriesJson.categories;

    try {
      authorPhotos = await readJsonFile(projectDirHandle, "src/data/author-photos.json");
    } catch {
      authorPhotos = {};
    }

    try {
      const levelsJson = await readJsonFile(projectDirHandle, "src/data/levels.json");
      levelsData = levelsJson.levels ?? [];
    } catch {
      levelsData = [];
    }

    folderStatus.textContent = `Pasta carregada: ${categoriesData.length} categorias.`;
    openFolderBtn.hidden = true;
    changeFolderBtn.hidden = false;
    appRoot.hidden = false;
    renderCategoryGrid();
  } catch (err) {
    showGlobalStatus(`Erro ao carregar a pasta: ${err.message}`, "error");
  }
}

// --- Grade de categorias (dashboard com todas as categorias/"decks") ---

/**
 * @param {any} category
 * @returns {{ total: number, withImage: number }}
 */
function categoryStats(category) {
  const words = category.palavras ?? [];
  const withImage = words.filter((w) => Boolean(authorPhotos[w]?.photoUrl)).length;
  return { total: words.length, withImage };
}

function renderCategoryGrid() {
  categoryGridEl.innerHTML = "";
  for (const category of categoriesData) {
    const { total, withImage } = categoryStats(category);

    const btn = document.createElement("button");
    btn.type = "button";
    if (activeCategory && activeCategory.id === category.id) btn.classList.add("active");

    const title = document.createElement("span");
    title.className = "category-tile-title";
    title.textContent = `${category.id} — ${category.nome || "(sem nome)"}`;

    const eixo = document.createElement("span");
    eixo.className = "category-tile-eixo";
    eixo.textContent = category.eixo || "sem eixo";

    const stats = document.createElement("span");
    stats.className = "category-tile-stats";
    stats.textContent = total === 0 ? "0 palavras" : `${total} palavras · ${withImage}/${total} com imagem`;

    btn.append(title, eixo, stats);
    btn.addEventListener("click", () => selectCategory(category));
    categoryGridEl.appendChild(btn);
  }
}

function selectCategory(category) {
  activeCategory = category;
  renderCategoryGrid();
  categoryDetailEl.hidden = false;
  renderCardsTab();
  renderContentTab();
  switchTab("cards");
}

// --- Criar nova categoria ("+ Nova categoria") ---

newCategoryBtn.addEventListener("click", () => {
  newCategoryForm.reset();
  newCategoryErrors.textContent = "";
  newCategoryModal.hidden = false;
  newCategoryIdInput.focus();
});

cancelNewCategoryBtn.addEventListener("click", () => {
  newCategoryModal.hidden = true;
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !newCategoryModal.hidden) newCategoryModal.hidden = true;
});

newCategoryForm.addEventListener("submit", (e) => {
  e.preventDefault();
  newCategoryErrors.textContent = "";

  const id = newCategoryIdInput.value.trim();
  const nome = newCategoryNomeInput.value.trim();
  const eixo = newCategoryEixoInput.value.trim();

  if (!id || !nome) {
    newCategoryErrors.textContent = "Id e nome são obrigatórios.";
    return;
  }
  if (categoriesData.some((c) => c.id === id)) {
    newCategoryErrors.textContent = `Já existe uma categoria com id "${id}".`;
    return;
  }

  // Criada só em memória — só vai para o disco quando "Salvar categoria"
  // (aba Conteúdo) validar com sucesso (exige microtexto, cartaTitulo e
  // ao menos 1 palavra, que ainda faltam aqui).
  const newCategory = {
    id,
    nome,
    eixo,
    palavras: [],
    microtexto: "",
    cartaTitulo: "",
    confundeCom: [],
    explicacoesPalavras: {},
  };
  categoriesData = [...categoriesData, newCategory];

  newCategoryModal.hidden = true;
  showGlobalStatus(
    `Categoria "${id}" criada localmente — preencha carta-título, micro-texto e ao menos 1 palavra na aba Conteúdo, depois "Salvar categoria" para gravar em categories.json.`,
    "ok",
    9000
  );
  selectCategory(newCategory);
  switchTab("content");
});

document.querySelectorAll(".tab-btn").forEach((btn) => {
  btn.addEventListener("click", () => switchTab(btn.getAttribute("data-tab")));
});

function switchTab(tab) {
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    const active = btn.getAttribute("data-tab") === tab;
    btn.classList.toggle("active", active);
    btn.setAttribute("aria-selected", String(active));
  });
  tabCardsEl.hidden = tab !== "cards";
  tabContentEl.hidden = tab !== "content";
}

// --- Aba "Cartas": grade de todas as palavras (cartas) já existentes ---

function renderCardsTab() {
  tabCardsEl.innerHTML = "";
  const grid = document.createElement("div");
  grid.className = "word-card-grid";

  for (const word of activeCategory.palavras ?? []) {
    const tile = document.createElement("button");
    tile.type = "button";
    tile.className = "word-card-tile";

    const entry = authorPhotos[word];
    if (entry?.photoUrl) {
      const img = document.createElement("img");
      img.alt = word;
      tile.appendChild(img);
      loadImagePreviewUrl(entry.photoUrl).then((url) => {
        if (url) img.src = url;
      });
    } else {
      const placeholder = document.createElement("span");
      placeholder.className = "thumb-placeholder";
      placeholder.textContent = "Sem imagem";
      tile.appendChild(placeholder);
    }

    const label = document.createElement("span");
    label.textContent = word;
    tile.appendChild(label);

    tile.addEventListener("click", () => openCardEditor(word));
    grid.appendChild(tile);
  }

  tabCardsEl.appendChild(grid);
}

// --- Editor de carta unificado (modal): palavra + explicação + imagem + crédito/licença ---

async function openCardEditor(word) {
  activeWord = word;
  pendingBlob = null;
  cardEditorCategoryEl.textContent = `${activeCategory.id} — ${activeCategory.nome}`;
  cardWordInput.value = word;
  cardExplicacaoTextarea.value = (activeCategory.explicacoesPalavras ?? {})[word] ?? "";

  const entry = authorPhotos[word] ?? {};
  photoCreditInput.value = entry.photoCredit ?? "";
  realPersonCheckbox.checked = false;
  authorInput.value = entry.author ?? "";
  licenseInput.value = entry.license ?? "";
  commonsUrlInput.value = entry.commonsFileUrl ?? "";
  updateProvenanceRequirement();

  currentImagePreview.hidden = true;
  currentImagePlaceholder.hidden = false;
  if (entry.photoUrl) {
    const url = await loadImagePreviewUrl(entry.photoUrl);
    if (url) {
      currentImagePreview.src = url;
      currentImagePreview.hidden = false;
      currentImagePlaceholder.hidden = true;
    }
  }

  clearCanvas();
  newImageSizeEl.textContent = "";
  fileInput.value = "";
  runCardFormValidation();

  cardModal.hidden = false;
  cardWordInput.focus();
}

function closeCardEditor() {
  cardModal.hidden = true;
  activeWord = null;
  pendingBlob = null;
}

cancelCardBtn.addEventListener("click", closeCardEditor);
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !cardModal.hidden) closeCardEditor();
});

realPersonCheckbox.addEventListener("change", () => {
  updateProvenanceRequirement();
  runCardFormValidation();
});

function updateProvenanceRequirement() {
  const required = realPersonCheckbox.checked;
  authorInput.required = required;
  licenseInput.required = required;
  commonsUrlInput.required = required;
}

function clearCanvas() {
  const ctx = resizeCanvas.getContext("2d");
  ctx.clearRect(0, 0, resizeCanvas.width, resizeCanvas.height);
}

dropZone.addEventListener("click", () => fileInput.click());
dropZone.addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    fileInput.click();
  }
});
dropZone.addEventListener("dragover", (e) => {
  e.preventDefault();
  dropZone.classList.add("drag-over");
});
dropZone.addEventListener("dragleave", () => dropZone.classList.remove("drag-over"));
dropZone.addEventListener("drop", (e) => {
  e.preventDefault();
  dropZone.classList.remove("drag-over");
  const file = e.dataTransfer?.files?.[0];
  if (file) processImageFile(file);
});
fileInput.addEventListener("change", () => {
  const file = fileInput.files?.[0];
  if (file) processImageFile(file);
});

async function processImageFile(file) {
  if (!file.type.startsWith("image/")) {
    cardFormErrors.textContent = "Selecione um arquivo de imagem.";
    return;
  }

  cardFormErrors.textContent = "Processando imagem...";
  saveCardBtn.disabled = true;

  const bitmap = await createImageBitmap(file);
  const { width, height } = computeResizeDimensions(bitmap.width, bitmap.height);

  resizeCanvas.width = width;
  resizeCanvas.height = height;
  const ctx = resizeCanvas.getContext("2d");
  ctx.clearRect(0, 0, width, height);
  ctx.drawImage(bitmap, 0, 0, width, height);

  const { blob, quality } = await encodeToWebpUnderLimit(resizeCanvas);
  pendingBlob = blob;
  newImageSizeEl.textContent = `${width}×${height}px, ${(blob.size / 1024).toFixed(1)} KB (qualidade ${quality})`;

  runCardFormValidation();

  if (blob.size > CARD_IMAGE_MAX_BYTES) {
    cardFormErrors.textContent = `Aviso: ${(blob.size / 1024).toFixed(1)} KB — acima do teto de 50 KB mesmo na menor qualidade tentada.`;
  }
}

function canvasToBlob(canvas, quality) {
  return new Promise((resolve) => canvas.toBlob(resolve, "image/webp", quality));
}

async function encodeToWebpUnderLimit(canvas) {
  let lastBlob = null;
  let lastQuality = WEBP_QUALITY_STEPS[0];
  for (const quality of WEBP_QUALITY_STEPS) {
    const blob = await canvasToBlob(canvas, quality);
    lastBlob = blob;
    lastQuality = quality;
    if (blob.size <= CARD_IMAGE_MAX_BYTES) {
      return { blob, quality };
    }
  }
  return { blob: lastBlob, quality: lastQuality };
}

[cardWordInput, photoCreditInput, authorInput, licenseInput, commonsUrlInput].forEach((input) => {
  input.addEventListener("input", runCardFormValidation);
});

function runCardFormValidation() {
  const newWord = cardWordInput.value.trim();
  const errors = [];

  if (!newWord) {
    errors.push("A palavra não pode ficar vazia.");
  } else {
    const duplicate = (activeCategory.palavras ?? []).some((w) => w !== activeWord && w === newWord);
    if (duplicate) errors.push(`"${newWord}" já existe nesta categoria.`);
  }

  const hasImage = pendingBlob !== null || Boolean(authorPhotos[activeWord]?.photoUrl);
  const metadataErrors = validateImageMetadata({
    hasImage,
    photoCredit: photoCreditInput.value,
    isRealPersonPhoto: realPersonCheckbox.checked,
    author: authorInput.value,
    license: licenseInput.value,
    commonsFileUrl: commonsUrlInput.value,
  });

  const allErrors = [...errors, ...metadataErrors];
  saveCardBtn.disabled = allErrors.length > 0;
  cardFormErrors.textContent = allErrors.join(" ");
  return allErrors;
}

cardEditorForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const errors = runCardFormValidation();
  if (errors.length > 0) return;

  const oldWord = activeWord;
  const newWord = cardWordInput.value.trim();
  const explicacaoText = cardExplicacaoTextarea.value.trim();

  const newPalavras = (activeCategory.palavras ?? []).map((w) => (w === oldWord ? newWord : w));
  const newExplicacoes = { ...(activeCategory.explicacoesPalavras ?? {}) };
  if (oldWord !== newWord) delete newExplicacoes[oldWord];
  if (explicacaoText) {
    newExplicacoes[newWord] = explicacaoText;
  } else {
    delete newExplicacoes[newWord];
  }

  const updatedCategory = { ...activeCategory, palavras: newPalavras, explicacoesPalavras: newExplicacoes };
  const candidateCategories = categoriesData.map((c) => (c.id === activeCategory.id ? updatedCategory : c));

  try {
    validateCategories(candidateCategories);
  } catch (err) {
    cardFormErrors.textContent = err.message;
    return;
  }

  try {
    const id = cardId(activeCategory.id, newWord);
    let photoUrl = authorPhotos[oldWord]?.photoUrl;

    if (pendingBlob) {
      photoUrl = `assets/cards/${id}.webp`;
      await writeBinaryFile(projectDirHandle, photoUrl, pendingBlob);
    }

    if (oldWord !== newWord) delete authorPhotos[oldWord];

    if (photoUrl) {
      const entry = { photoUrl, photoCredit: photoCreditInput.value.trim() };
      if (authorInput.value.trim()) entry.author = authorInput.value.trim();
      if (licenseInput.value.trim()) entry.license = licenseInput.value.trim();
      if (commonsUrlInput.value.trim()) entry.commonsFileUrl = commonsUrlInput.value.trim();
      authorPhotos[newWord] = entry;
    }

    categoriesData = candidateCategories;
    activeCategory = updatedCategory;

    await writeJsonFile(projectDirHandle, "src/data/categories.json", { categories: categoriesData });
    await writeJsonFile(projectDirHandle, "src/data/author-photos.json", authorPhotos);

    const warning = oldWord !== newWord ? warnIfWordUsedInLevels(activeCategory.id, [oldWord]) : null;
    showGlobalStatus(
      warning ? `Carta "${newWord}" salva. ⚠️ ${warning}` : `Carta "${newWord}" salva.`,
      warning ? "error" : "ok",
      warning ? 12000 : 5000
    );

    closeCardEditor();
    renderCategoryGrid();
    renderCardsTab();
    renderContentTab();
  } catch (err) {
    cardFormErrors.textContent = `Erro ao salvar: ${err.message}`;
  }
});

// --- Aba "Conteúdo": campos da categoria (fora do escopo de palavra individual) ---

function fieldGroup(labelText, value) {
  const wrapper = document.createElement("div");
  const label = document.createElement("label");
  label.textContent = labelText;
  const input = document.createElement("input");
  input.type = "text";
  input.value = value ?? "";
  wrapper.append(label, input);
  return { wrapper, input };
}

function renderContentTab() {
  tabContentEl.innerHTML = "";
  const form = document.createElement("form");
  form.className = "content-form";

  const nomeGroup = fieldGroup("Nome da categoria", activeCategory.nome);
  const tituloGroup = fieldGroup("Carta-título", activeCategory.cartaTitulo);

  const microtextoGroup = document.createElement("div");
  const microtextoLabel = document.createElement("label");
  microtextoLabel.textContent = "Micro-texto";
  const microtextoTextarea = document.createElement("textarea");
  microtextoTextarea.rows = 4;
  microtextoTextarea.value = activeCategory.microtexto ?? "";
  const counter = document.createElement("div");
  counter.className = "char-counter";
  function updateCounter() {
    const len = microtextoTextarea.value.length;
    counter.textContent = `${len}/280`;
    counter.classList.toggle("over", len > 280);
  }
  microtextoTextarea.addEventListener("input", updateCounter);
  updateCounter();
  microtextoGroup.append(microtextoLabel, microtextoTextarea, counter);

  const palavrasGroup = document.createElement("div");
  const palavrasLabel = document.createElement("label");
  palavrasLabel.textContent = "Palavras do pool (renomear/remover aqui move a explicação junto; para editar imagem e explicação de uma palavra específica, use a aba Cartas)";
  const wordList = document.createElement("div");
  wordList.className = "word-list";

  function addWordRow(value = "") {
    const row = document.createElement("div");
    row.className = "word-row";
    row.dataset.originalWord = value;
    const input = document.createElement("input");
    input.type = "text";
    input.value = value;
    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.textContent = "Remover";
    removeBtn.addEventListener("click", () => row.remove());
    row.append(input, removeBtn);
    wordList.appendChild(row);
  }
  (activeCategory.palavras ?? []).forEach((w) => addWordRow(w));

  const addWordBtn = document.createElement("button");
  addWordBtn.type = "button";
  addWordBtn.textContent = "+ Adicionar palavra";
  addWordBtn.addEventListener("click", () => addWordRow());

  palavrasGroup.append(palavrasLabel, wordList, addWordBtn);

  const confundeGroup = document.createElement("div");
  const confundeLabel = document.createElement("label");
  confundeLabel.textContent = "Confunde com";
  const confundeOptions = document.createElement("div");
  confundeOptions.className = "confunde-com-options";
  const currentConfunde = new Set(activeCategory.confundeCom ?? []);
  for (const other of categoriesData) {
    if (other.id === activeCategory.id) continue;
    const optLabel = document.createElement("label");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = other.id;
    checkbox.checked = currentConfunde.has(other.id);
    optLabel.append(checkbox, document.createTextNode(` ${other.id}`));
    confundeOptions.appendChild(optLabel);
  }
  confundeGroup.append(confundeLabel, confundeOptions);

  const errorsEl = document.createElement("div");
  errorsEl.className = "form-errors";
  errorsEl.setAttribute("aria-live", "polite");

  const saveBtn = document.createElement("button");
  saveBtn.type = "submit";
  saveBtn.textContent = "Salvar categoria";

  form.append(nomeGroup.wrapper, tituloGroup.wrapper, microtextoGroup, palavrasGroup, confundeGroup, errorsEl, saveBtn);

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorsEl.textContent = "";

    const wordRows = [...wordList.children]
      .map((row) => ({
        word: /** @type {HTMLInputElement} */ (row.querySelector("input")).value.trim(),
        originalWord: row.dataset.originalWord,
      }))
      .filter((r) => r.word);
    const words = wordRows.map((r) => r.word);

    // Carrega explicações a partir do estado atual (não há textarea nesta
    // aba — a explicação de cada palavra é editada na aba "Cartas"), só
    // acompanhando renomeações e removendo entradas de palavras que saíram
    // do pool.
    const newExplicacoes = { ...(activeCategory.explicacoesPalavras ?? {}) };
    for (const { word, originalWord } of wordRows) {
      if (originalWord && originalWord !== word && Object.prototype.hasOwnProperty.call(newExplicacoes, originalWord)) {
        newExplicacoes[word] = newExplicacoes[originalWord];
        delete newExplicacoes[originalWord];
      }
    }
    for (const key of Object.keys(newExplicacoes)) {
      if (!words.includes(key)) delete newExplicacoes[key];
    }

    const newConfunde = [...confundeOptions.querySelectorAll("input:checked")].map((i) => i.value);

    const updatedCategory = {
      ...activeCategory,
      nome: nomeGroup.input.value.trim(),
      cartaTitulo: tituloGroup.input.value.trim(),
      microtexto: microtextoTextarea.value.trim(),
      palavras: words,
      confundeCom: newConfunde,
      explicacoesPalavras: newExplicacoes,
    };

    const candidateCategories = categoriesData.map((c) => (c.id === activeCategory.id ? updatedCategory : c));

    try {
      validateCategories(candidateCategories);
    } catch (err) {
      errorsEl.textContent = err.message;
      return;
    }

    const removedOrRenamedWords = (activeCategory.palavras ?? []).filter((w) => !words.includes(w));

    categoriesData = candidateCategories;
    activeCategory = updatedCategory;

    try {
      await writeJsonFile(projectDirHandle, "src/data/categories.json", { categories: categoriesData });

      const warning =
        removedOrRenamedWords.length > 0 ? warnIfWordUsedInLevels(activeCategory.id, removedOrRenamedWords) : null;
      showGlobalStatus(
        warning ? `Categoria ${activeCategory.id} salva. ⚠️ ${warning}` : `Categoria ${activeCategory.id} salva.`,
        warning ? "error" : "ok",
        warning ? 12000 : 5000
      );

      renderCategoryGrid();
      renderContentTab();
      renderCardsTab();
    } catch (err) {
      errorsEl.textContent = `Erro ao salvar: ${err.message}`;
    }
  });

  tabContentEl.appendChild(form);
}
