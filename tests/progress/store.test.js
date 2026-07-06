import { test } from "node:test";
import assert from "node:assert/strict";
import { createProgressStore, createMemoryStorage } from "../../src/progress/store.js";

test("store.revealCard: retorna true apenas na primeira vez que a carta é revelada", () => {
  const memoryStorage = createMemoryStorage();
  const store = createProgressStore({ storage: memoryStorage, key: "test_key" });

  assert.equal(store.isRevealed("AS"), false);
  assert.equal(store.revealCard("AS"), true);
  assert.equal(store.isRevealed("AS"), true);

  // Segunda revelação deve retornar false
  assert.equal(store.revealCard("AS"), false);
});

test("store.incrementFoundationsCompleted: incrementa e persiste o contador de fundações completadas", () => {
  const memoryStorage = createMemoryStorage();
  const store = createProgressStore({ storage: memoryStorage, key: "test_key" });

  assert.equal(store.getFoundationsCompletedCount(), 0);
  assert.equal(store.incrementFoundationsCompleted(), 1);
  assert.equal(store.getFoundationsCompletedCount(), 1);
  assert.equal(store.incrementFoundationsCompleted(), 2);
  assert.equal(store.getFoundationsCompletedCount(), 2);
});

test("store.getRevealedCardIds: retorna todas as cartas reveladas", () => {
  const memoryStorage = createMemoryStorage();
  const store = createProgressStore({ storage: memoryStorage, key: "test_key" });

  store.revealCard("AS");
  store.revealCard("10D");
  
  const revealed = store.getRevealedCardIds();
  assert.equal(revealed.length, 2);
  assert.ok(revealed.includes("AS"));
  assert.ok(revealed.includes("10D"));
});

test("store: carrega o progresso persistido anteriormente", () => {
  const memoryStorage = createMemoryStorage();
  
  // Criar primeira instância e salvar dados
  const store1 = createProgressStore({ storage: memoryStorage, key: "test_key" });
  store1.revealCard("KH");
  store1.incrementFoundationsCompleted();

  // Criar segunda instância compartilhando o mesmo storage
  const store2 = createProgressStore({ storage: memoryStorage, key: "test_key" });
  assert.equal(store2.isRevealed("KH"), true);
  assert.equal(store2.getFoundationsCompletedCount(), 1);
});
