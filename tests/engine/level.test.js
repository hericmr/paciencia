import { test } from "node:test";
import assert from "node:assert/strict";
import { buildLevelCards, shuffleCards } from "../../src/engine/level.js";

const SAMPLE_LEVEL = {
  id: 1,
  categoryIds: ["CAT-A", "CAT-B"],
  cardsPerCategory: 2,
  selectedWords: {
    "CAT-A": ["Um", "Dois"],
    "CAT-B": ["Três", "Quatro"],
  },
};

test("buildLevelCards gera cardsPerCategory × nº de categorias cartas", () => {
  const cards = buildLevelCards(SAMPLE_LEVEL);
  assert.equal(cards.length, 4);
});

test("buildLevelCards atribui categoryId correto a cada carta", () => {
  const cards = buildLevelCards(SAMPLE_LEVEL);
  const catA = cards.filter((c) => c.categoryId === "CAT-A");
  const catB = cards.filter((c) => c.categoryId === "CAT-B");
  assert.equal(catA.length, 2);
  assert.equal(catB.length, 2);
  assert.deepEqual(catA.map((c) => c.word).sort(), ["Dois", "Um"]);
});

test("buildLevelCards gera ids únicos", () => {
  const cards = buildLevelCards(SAMPLE_LEVEL);
  const ids = new Set(cards.map((c) => c.id));
  assert.equal(ids.size, cards.length);
});

test("shuffleCards mantém o mesmo conjunto de cartas, só reordena", () => {
  const cards = buildLevelCards(SAMPLE_LEVEL);
  const shuffled = shuffleCards(cards, () => 0.5);
  assert.equal(shuffled.length, cards.length);
  assert.deepEqual(
    new Set(shuffled.map((c) => c.id)),
    new Set(cards.map((c) => c.id))
  );
});

test("shuffleCards não muta o array original", () => {
  const cards = buildLevelCards(SAMPLE_LEVEL);
  const originalOrder = cards.map((c) => c.id);
  shuffleCards(cards, () => 0.999);
  assert.deepEqual(cards.map((c) => c.id), originalOrder);
});
