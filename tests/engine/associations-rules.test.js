import { test } from "node:test";
import assert from "node:assert/strict";
import { canPlaceInCategory, canMoveToTableauColumn } from "../../src/engine/associations-rules.js";

const wordCard = (categoryId, word) => ({ id: `${categoryId}:${word}`, categoryId, word, isTitleCard: false });
const titleCard = (categoryId, word) => ({ id: `TITLE:${categoryId}`, categoryId, word, isTitleCard: true });

test("canPlaceInCategory: carta-título sempre entra no slot da própria categoria", () => {
  assert.equal(canPlaceInCategory(titleCard("CAT-13", "Autores"), "CAT-13", new Set()), true);
});

test("canPlaceInCategory: carta-título rejeitada em categoria diferente", () => {
  assert.equal(canPlaceInCategory(titleCard("CAT-13", "Autores"), "CAT-06", new Set()), false);
});

test("canPlaceInCategory: carta de palavra rejeitada se a categoria ainda não abriu", () => {
  assert.equal(canPlaceInCategory(wordCard("CAT-13", "Netto"), "CAT-13", new Set()), false);
});

test("canPlaceInCategory: carta de palavra aceita se a categoria já está aberta", () => {
  const open = new Set(["CAT-13"]);
  assert.equal(canPlaceInCategory(wordCard("CAT-13", "Netto"), "CAT-13", open), true);
});

test("canPlaceInCategory: carta de palavra rejeitada em categoria de outro id, mesmo aberta", () => {
  const open = new Set(["CAT-13", "CAT-06"]);
  assert.equal(canPlaceInCategory(wordCard("CAT-13", "Netto"), "CAT-06", open), false);
});

test("canMoveToTableauColumn: sempre permitido (desobstrução sem regra de compatibilidade)", () => {
  assert.equal(canMoveToTableauColumn(), true);
});
