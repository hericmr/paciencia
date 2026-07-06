// @ts-check
// Persistência de progresso educativo (categorias com microtexto já visto,
// níveis já completados). Usa localStorage quando disponível; cai para um
// storage em memória caso contrário (bloqueado, indisponível), conforme
// specs/001-jogo-paciencia-educativo/research.md, Decisão 4.

export const STORAGE_KEY = "paciencia_ss.progress.v2";

/** @typedef {{ getItem(key: string): string|null, setItem(key: string, value: string): void }} StorageLike */

/**
 * Storage em memória, usado como fallback quando localStorage não está disponível.
 * @returns {StorageLike}
 */
export function createMemoryStorage() {
  const map = new Map();
  return {
    getItem: (key) => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => {
      map.set(key, value);
    },
  };
}

/**
 * Detecta se o localStorage do navegador está disponível e utilizável.
 * @returns {StorageLike}
 */
export function detectStorage() {
  try {
    const testKey = "__paciencia_ss_test__";
    window.localStorage.setItem(testKey, "1");
    window.localStorage.removeItem(testKey);
    return window.localStorage;
  } catch {
    return createMemoryStorage();
  }
}

/**
 * @typedef {{
 *   revealedCategoryIds: string[],
 *   completedLevelIds: number[]
 * }} ProgressState
 */

/** @returns {ProgressState} */
function emptyState() {
  return { revealedCategoryIds: [], completedLevelIds: [] };
}

/**
 * @param {StorageLike} storage
 * @param {string} key
 * @returns {ProgressState}
 */
function readState(storage, key) {
  const raw = storage.getItem(key);
  if (!raw) return emptyState();
  try {
    const parsed = JSON.parse(raw);
    return {
      revealedCategoryIds: Array.isArray(parsed.revealedCategoryIds) ? parsed.revealedCategoryIds : [],
      completedLevelIds: Array.isArray(parsed.completedLevelIds) ? parsed.completedLevelIds : [],
    };
  } catch {
    return emptyState();
  }
}

/**
 * @param {StorageLike} storage
 * @param {string} key
 * @param {ProgressState} state
 */
function writeState(storage, key, state) {
  storage.setItem(key, JSON.stringify(state));
}

/**
 * Cria uma instância do store de progresso.
 * @param {{ storage?: StorageLike, key?: string }} [options]
 */
export function createProgressStore(options = {}) {
  const storage = options.storage ?? detectStorage();
  const key = options.key ?? STORAGE_KEY;

  const initial = readState(storage, key);
  const revealedSet = new Set(initial.revealedCategoryIds);
  const completedLevelsSet = new Set(initial.completedLevelIds);

  function persist() {
    writeState(storage, key, {
      revealedCategoryIds: Array.from(revealedSet),
      completedLevelIds: Array.from(completedLevelsSet),
    });
  }

  return {
    /**
     * Marca uma categoria como revelada (microtexto já visto). Retorna true
     * se essa foi a primeira vez (deve exibir o pop-up); false se já era
     * conhecida.
     * @param {string} categoryId
     * @returns {boolean}
     */
    revealCategory(categoryId) {
      if (revealedSet.has(categoryId)) return false;
      revealedSet.add(categoryId);
      persist();
      return true;
    },

    /** @param {string} categoryId */
    isRevealed(categoryId) {
      return revealedSet.has(categoryId);
    },

    /** @returns {string[]} */
    getRevealedCategoryIds() {
      return Array.from(revealedSet);
    },

    /**
     * Marca um nível como completado. Retorna true se era a primeira vez.
     * @param {number} levelId
     * @returns {boolean}
     */
    completeLevel(levelId) {
      if (completedLevelsSet.has(levelId)) return false;
      completedLevelsSet.add(levelId);
      persist();
      return true;
    },

    /** @returns {number[]} */
    getCompletedLevelIds() {
      return Array.from(completedLevelsSet);
    },
  };
}
