// @ts-check
// Persistência de progresso educativo (cartas reveladas, fundações completadas).
// Usa localStorage quando disponível; cai para um storage em memória caso
// contrário (bloqueado, indisponível), conforme research.md, Decisão 4.

export const STORAGE_KEY = "paciencia_ss.progress.v1";

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
 *   revealedCardIds: string[],
 *   foundationsCompletedCount: number
 * }} ProgressState
 */

/** @returns {ProgressState} */
function emptyState() {
  return { revealedCardIds: [], foundationsCompletedCount: 0 };
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
      revealedCardIds: Array.isArray(parsed.revealedCardIds) ? parsed.revealedCardIds : [],
      foundationsCompletedCount:
        typeof parsed.foundationsCompletedCount === "number" ? parsed.foundationsCompletedCount : 0,
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

  let state = readState(storage, key);
  const revealedSet = new Set(state.revealedCardIds);

  function persist() {
    state = { revealedCardIds: Array.from(revealedSet), foundationsCompletedCount: state.foundationsCompletedCount };
    writeState(storage, key, state);
  }

  return {
    /**
     * Marca uma carta como revelada. Retorna true se essa foi a primeira
     * revelação (deve exibir pop-up de conteúdo); false se já era conhecida.
     * @param {string} cardId
     * @returns {boolean}
     */
    revealCard(cardId) {
      if (revealedSet.has(cardId)) return false;
      revealedSet.add(cardId);
      persist();
      return true;
    },

    /** @param {string} cardId */
    isRevealed(cardId) {
      return revealedSet.has(cardId);
    },

    /** @returns {string[]} */
    getRevealedCardIds() {
      return Array.from(revealedSet);
    },

    /** Registra uma fundação completada. Retorna o novo total histórico. */
    incrementFoundationsCompleted() {
      state.foundationsCompletedCount += 1;
      persist();
      return state.foundationsCompletedCount;
    },

    /** @returns {number} */
    getFoundationsCompletedCount() {
      return state.foundationsCompletedCount;
    },
  };
}
