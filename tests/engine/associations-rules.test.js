import { test } from "node:test";
import assert from "node:assert/strict";
import { canPlaceInCategory } from "../../src/engine/associations-rules.js";

const card = (categoryId, word) => ({ id: `${categoryId}:${word}`, categoryId, word });

test("canPlaceInCategory: aceita quando a carta é da categoria do slot", () => {
  assert.equal(canPlaceInCategory(card("CAT-13", "Netto"), "CAT-13"), true);
});

test("canPlaceInCategory: rejeita quando a carta é de outra categoria", () => {
  assert.equal(canPlaceInCategory(card("CAT-13", "Netto"), "CAT-06"), false);
});
