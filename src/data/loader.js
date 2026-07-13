// @ts-check

/** @typedef {{ id: string, nome: string, cartaTitulo: string, eixo: string, palavras: string[], microtexto: string, confundeCom: string[], explicacoesPalavras?: Record<string, string> }} CategoryData */
/** @typedef {{ id: number, categoryIds: string[], cardsPerCategory: number, selectedWords: Record<string, string[]>, totalCards: number, columns: number, moveLimit: number, profundidadeTitulos: "topo"|"meio"|"fundo"|"embaralhado", hint: string|null }} LevelData */

const VALID_DEPTHS = new Set(["topo", "meio", "fundo", "embaralhado"]);

/**
 * @param {string} categoriesUrl
 * @returns {Promise<CategoryData[]>}
 */
export async function loadCategories(categoriesUrl) {
  const response = await fetch(`${categoriesUrl}?t=${Date.now()}`);
  if (!response.ok) {
    throw new Error(`Falha ao carregar categorias de ${categoriesUrl}: HTTP ${response.status}`);
  }
  const data = await response.json();
  validateCategories(data.categories);
  return data.categories;
}

/**
 * @param {string} levelsUrl
 * @param {CategoryData[]} categories
 * @returns {Promise<LevelData[]>}
 */
export async function loadLevels(levelsUrl, categories) {
  const response = await fetch(`${levelsUrl}?t=${Date.now()}`);
  if (!response.ok) {
    throw new Error(`Falha ao carregar níveis de ${levelsUrl}: HTTP ${response.status}`);
  }
  const data = await response.json();
  validateLevels(data.levels, categories);
  return data.levels;
}

/**
 * @param {CategoryData[]} categories
 */
export function validateCategories(categories) {
  if (!Array.isArray(categories) || categories.length === 0) {
    throw new Error("Categorias inválidas: nenhuma categoria encontrada");
  }
  const seenIds = new Set();
  for (const category of categories) {
    if (seenIds.has(category.id)) {
      throw new Error(`Categorias inválidas: id duplicado "${category.id}"`);
    }
    seenIds.add(category.id);
    if (!Array.isArray(category.palavras) || category.palavras.length === 0) {
      throw new Error(`Categoria "${category.id}" sem palavras`);
    }
    if (new Set(category.palavras).size !== category.palavras.length) {
      throw new Error(`Categoria "${category.id}" tem palavras duplicadas`);
    }
    if (!category.microtexto || category.microtexto.length > 280) {
      throw new Error(`Categoria "${category.id}" com microtexto ausente ou maior que 280 caracteres`);
    }
    if (!category.cartaTitulo) {
      throw new Error(`Categoria "${category.id}" sem cartaTitulo`);
    }
    if (category.explicacoesPalavras) {
      for (const word of Object.keys(category.explicacoesPalavras)) {
        if (!category.palavras.includes(word)) {
          console.warn(`Categoria "${category.id}": explicacoesPalavras tem a chave "${word}", que não está em "palavras" (provável erro de digitação).`);
        }
      }
    }
  }
}

/**
 * @param {LevelData[]} levels
 * @param {CategoryData[]} categories
 */
function validateLevels(levels, categories) {
  if (!Array.isArray(levels) || levels.length === 0) {
    throw new Error("Níveis inválidos: nenhum nível encontrado");
  }
  const categoriesById = new Map(categories.map((c) => [c.id, c]));

  for (const level of levels) {
    if (!Array.isArray(level.categoryIds) || level.categoryIds.length < 4) {
      throw new Error(`Nível ${level.id} inválido: precisa de pelo menos 4 categoryIds`);
    }
    for (const categoryId of level.categoryIds) {
      const category = categoriesById.get(categoryId);
      if (!category) {
        throw new Error(`Nível ${level.id} inválido: categoria "${categoryId}" não existe`);
      }
      const words = level.selectedWords?.[categoryId];
      if (!Array.isArray(words) || words.length !== level.cardsPerCategory) {
        throw new Error(
          `Nível ${level.id} inválido: selectedWords["${categoryId}"] deveria ter ${level.cardsPerCategory} palavras`
        );
      }
      for (const word of words) {
        if (!category.palavras.includes(word)) {
          throw new Error(`Nível ${level.id} inválido: palavra "${word}" não pertence ao pool de "${categoryId}"`);
        }
      }
    }
    const numCategories = level.categoryIds.length;
    const expectedTotal = numCategories + level.cardsPerCategory * numCategories;
    if (level.totalCards !== expectedTotal) {
      throw new Error(`Nível ${level.id} inválido: totalCards deveria ser ${expectedTotal} (${numCategories} títulos + ${numCategories}×cardsPerCategory)`);
    }
    if (level.moveLimit < level.totalCards) {
      throw new Error(`Nível ${level.id} inválido: moveLimit menor que totalCards (impossível vencer sem nenhuma desobstrução)`);
    }
    if (!VALID_DEPTHS.has(level.profundidadeTitulos)) {
      throw new Error(`Nível ${level.id} inválido: profundidadeTitulos deve ser "topo", "meio", "fundo" ou "embaralhado"`);
    }
  }
}
