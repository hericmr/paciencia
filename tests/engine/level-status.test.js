import { test } from "node:test";
import assert from "node:assert/strict";
import { checkLevelWin, checkLevelLoss } from "../../src/engine/level-status.js";

const LEVEL = {
  id: 1,
  categoryIds: ["CAT-A", "CAT-B"],
  cardsPerCategory: 2,
  selectedWords: { "CAT-A": ["Um", "Dois"], "CAT-B": ["Três", "Quatro"] },
};

const card = (categoryId, word) => ({ id: `${categoryId}:${word}`, categoryId, word });

test("checkLevelWin: false enquanto alguma categoria está incompleta", () => {
  const slots = { "CAT-A": [card("CAT-A", "Um")], "CAT-B": [] };
  assert.equal(checkLevelWin(slots, LEVEL), false);
});

test("checkLevelWin: true quando todas as categorias têm cardsPerCategory cartas", () => {
  const slots = {
    "CAT-A": [card("CAT-A", "Um"), card("CAT-A", "Dois")],
    "CAT-B": [card("CAT-B", "Três"), card("CAT-B", "Quatro")],
  };
  assert.equal(checkLevelWin(slots, LEVEL), true);
});

test("checkLevelLoss: false enquanto restam movimentos", () => {
  const slots = { "CAT-A": [], "CAT-B": [] };
  assert.equal(checkLevelLoss(5, slots, LEVEL), false);
});

test("checkLevelLoss: true quando movimentos esgotados e nível incompleto", () => {
  const slots = { "CAT-A": [card("CAT-A", "Um")], "CAT-B": [] };
  assert.equal(checkLevelLoss(0, slots, LEVEL), true);
});

test("checkLevelLoss: false quando movimentos chegam a 0 mas o nível já está completo (vitória tem prioridade)", () => {
  const slots = {
    "CAT-A": [card("CAT-A", "Um"), card("CAT-A", "Dois")],
    "CAT-B": [card("CAT-B", "Três"), card("CAT-B", "Quatro")],
  };
  assert.equal(checkLevelLoss(0, slots, LEVEL), false);
  assert.equal(checkLevelWin(slots, LEVEL), true);
});
