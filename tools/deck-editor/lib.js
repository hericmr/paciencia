// @ts-check
// Funções puras do Editor de Baralho — sem DOM, sem canvas, sem File System
// Access API, para serem testáveis com `node --test` (Princípio VI).
// Ver specs/003-editor-de-baralho/research.md, Decisões 1 e 3.

/** Lado maior alvo (em px) para toda imagem de carta processada pelo editor. */
export const CARD_IMAGE_MAX_DIMENSION = 256;

/** Teto de peso (em bytes) do WebP final de cada carta — ver spec.md, SC-002. */
export const CARD_IMAGE_MAX_BYTES = 50 * 1024;

/** Qualidades de `canvas.toBlob("image/webp", q)` tentadas em ordem até caber no teto. */
export const WEBP_QUALITY_STEPS = [0.8, 0.7, 0.6, 0.5, 0.4];

/**
 * Slug de uma palavra: sem acento, minúsculo, só `[a-z0-9-]`, sem hífen nas
 * pontas. Usado como parte do nome de arquivo da imagem da carta.
 * @param {string} word
 * @returns {string}
 */
export function slug(word) {
  return String(word)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Id de carta usado como nome de arquivo (`assets/cards/<cardId>.webp`).
 * Prefixado pelo id da categoria para nunca colidir entre categorias
 * diferentes que tenham uma palavra com o mesmo texto — ver research.md,
 * Decisão 3.
 * @param {string} categoryId
 * @param {string} word
 * @returns {string}
 */
export function cardId(categoryId, word) {
  return `${String(categoryId).toLowerCase()}__${slug(word)}`;
}

/**
 * Dimensões finais de uma imagem redimensionada para caber em
 * `maxSize` no lado maior, preservando proporção. Imagem já menor que
 * `maxSize` nos dois lados não é ampliada.
 * @param {number} width
 * @param {number} height
 * @param {number} [maxSize]
 * @returns {{ width: number, height: number }}
 */
export function computeResizeDimensions(width, height, maxSize = CARD_IMAGE_MAX_DIMENSION) {
  if (width <= maxSize && height <= maxSize) {
    return { width, height };
  }
  const scale = maxSize / Math.max(width, height);
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

/**
 * Valida os metadados de uma imagem de carta antes de salvar (FR-009).
 * `photoCredit` só é obrigatório quando a carta tem (ou vai passar a ter)
 * uma imagem — uma carta sem imagem pode ser salva só com texto/explicação.
 * `author`/`license`/`commonsFileUrl` só são obrigatórios quando
 * `isRealPersonPhoto` é true (e implica ter imagem).
 * @param {{ hasImage?: boolean, photoCredit?: string, isRealPersonPhoto?: boolean, author?: string, license?: string, commonsFileUrl?: string }} metadata
 * @returns {string[]} lista de erros (vazia se válido)
 */
export function validateImageMetadata(metadata) {
  const { hasImage, photoCredit, isRealPersonPhoto, author, license, commonsFileUrl } = metadata;
  const errors = [];

  if (hasImage && (!photoCredit || !photoCredit.trim())) {
    errors.push("Crédito da imagem (photoCredit) é obrigatório quando há imagem.");
  }

  if (isRealPersonPhoto) {
    if (!author || !author.trim()) errors.push("Autor é obrigatório para foto de pessoa real.");
    if (!license || !license.trim()) errors.push("Licença é obrigatória para foto de pessoa real.");
    if (!commonsFileUrl || !commonsFileUrl.trim()) errors.push("URL do Commons é obrigatória para foto de pessoa real.");
  }

  return errors;
}

/**
 * Serializa dados no mesmo formato já usado pelos arquivos JSON do jogo
 * (indentação de 2 espaços, sem quebra de linha final).
 * @param {unknown} data
 * @returns {string}
 */
export function stringifyJson(data) {
  return JSON.stringify(data, null, 2);
}
