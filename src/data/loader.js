// @ts-check

/** @typedef {{ id: string, nome: string, eixo: string, palavras: string[], microtexto: string, confundeCom: string[] }} CategoryData */
/** @typedef {{ id: number, categoryIds: string[], cardsPerCategory: number, selectedWords: Record<string, string[]>, columns: number, moveLimit: number, hint: string|null }} LevelData */

/**
 * @param {string} categoriesUrl
 * @returns {Promise<CategoryData[]>}
 */
export async function loadCategories(categoriesUrl) {
  const response = await fetch(categoriesUrl);
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
  const response = await fetch(levelsUrl);
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
  }
}

/**
 * @param {LevelData[]} levels
 * @param {CategoryData[]} categories
 */
export function validateLevels(levels, categories) {
  if (!Array.isArray(levels) || levels.length === 0) {
    throw new Error("Níveis inválidos: nenhum nível encontrado");
  }
  const categoriesById = new Map(categories.map((c) => [c.id, c]));

  for (const level of levels) {
    if (!Array.isArray(level.categoryIds) || level.categoryIds.length !== 4) {
      throw new Error(`Nível ${level.id} inválido: precisa de exatamente 4 categoryIds`);
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
    if (level.moveLimit < level.cardsPerCategory * 4) {
      throw new Error(`Nível ${level.id} inválido: moveLimit menor que cardsPerCategory × 4 (impossível vencer)`);
    }
  }
}
