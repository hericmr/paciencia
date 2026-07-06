import { test } from "node:test";
import assert from "node:assert/strict";
import { createProgressStore, createMemoryStorage } from "../../src/progress/store.js";

test("store.revealCategory: retorna true apenas na primeira vez que a categoria é revelada", () => {
  const store = createProgressStore({ storage: createMemoryStorage() });
  assert.equal(store.revealCategory("CAT-13"), true);
  assert.equal(store.revealCategory("CAT-13"), false);
  assert.equal(store.isRevealed("CAT-13"), true);
  assert.equal(store.isRevealed("CAT-06"), false);
});

test("store.getRevealedCategoryIds: retorna todas as categorias reveladas", () => {
  const store = createProgressStore({ storage: createMemoryStorage() });
  store.revealCategory("CAT-13");
  store.revealCategory("CAT-06");
  assert.deepEqual(store.getRevealedCategoryIds().sort(), ["CAT-06", "CAT-13"]);
});

test("store.completeLevel: retorna true apenas na primeira vez que o nível é completado", () => {
  const store = createProgressStore({ storage: createMemoryStorage() });
  assert.equal(store.completeLevel(1), true);
  assert.equal(store.completeLevel(1), false);
  assert.deepEqual(store.getCompletedLevelIds(), [1]);
});

test("store: carrega o progresso persistido anteriormente", () => {
  const storage = createMemoryStorage();
  const first = createProgressStore({ storage });
  first.revealCategory("CAT-13");
  first.completeLevel(1);

  const second = createProgressStore({ storage });
  assert.equal(second.isRevealed("CAT-13"), true);
  assert.deepEqual(second.getCompletedLevelIds(), [1]);
});
