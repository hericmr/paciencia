import { test } from "node:test";
import assert from "node:assert/strict";
import { checkLevelWin, checkLevelLoss, hasAnyValidMove } from "../../src/engine/level-status.js";

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

const titleCard = (categoryId) => ({ id: `TITLE:${categoryId}`, categoryId, word: categoryId, isTitleCard: true });
const col = (entries) => ({ cards: entries });
const faceUp = (c) => ({ card: c, faceUp: true });

const baseMoveState = (overrides = {}) => ({
  tableauColumns: [],
  stock: [],
  waste: [],
  spotCategories: [null, null, null, null],
  openCategoryIds: new Set(),
  ...overrides,
});

test("hasAnyValidMove: true quando há cartas no monte, mesmo com tableau travado", () => {
  const state = baseMoveState({
    stock: [card("CAT-A", "Um")],
    tableauColumns: [col([faceUp(card("CAT-A", "Dois"))]), col([faceUp(card("CAT-B", "Três"))])],
  });
  assert.equal(hasAnyValidMove(state), true);
});

test("hasAnyValidMove: true quando há cartas no descarte, mesmo com monte vazio", () => {
  const state = baseMoveState({
    waste: [card("CAT-A", "Um")],
    tableauColumns: [col([faceUp(card("CAT-A", "Dois"))]), col([faceUp(card("CAT-B", "Três"))])],
  });
  assert.equal(hasAnyValidMove(state), true);
});

test("hasAnyValidMove: true quando duas colunas têm cartas do topo da mesma categoria", () => {
  const state = baseMoveState({
    tableauColumns: [col([faceUp(card("CAT-A", "Um"))]), col([faceUp(card("CAT-A", "Dois"))])],
  });
  assert.equal(hasAnyValidMove(state), true);
});

test("hasAnyValidMove: true quando existe coluna vazia para receber qualquer carta", () => {
  const state = baseMoveState({
    tableauColumns: [col([faceUp(card("CAT-A", "Um"))]), col([])],
  });
  assert.equal(hasAnyValidMove(state), true);
});

test("hasAnyValidMove: true quando uma carta-título pode abrir um spot vazio", () => {
  const state = baseMoveState({
    tableauColumns: [col([faceUp(titleCard("CAT-A"))]), col([faceUp(card("CAT-B", "Um"))])],
    spotCategories: ["CAT-B", null, null, null],
  });
  assert.equal(hasAnyValidMove(state), true);
});

test("hasAnyValidMove: true quando uma carta de palavra pode encaixar num spot já aberto da mesma categoria", () => {
  const state = baseMoveState({
    tableauColumns: [col([faceUp(card("CAT-A", "Dois"))]), col([faceUp(card("CAT-B", "Um"))])],
    spotCategories: ["CAT-A", "CAT-B", null, null],
    openCategoryIds: new Set(["CAT-A", "CAT-B"]),
  });
  assert.equal(hasAnyValidMove(state), true);
});

test("hasAnyValidMove: false em travamento total (sem monte/descarte, colunas cheias de categorias diferentes, nenhum spot aceita)", () => {
  const state = baseMoveState({
    tableauColumns: [col([faceUp(card("CAT-A", "Um"))]), col([faceUp(card("CAT-B", "Dois"))])],
    // Ambos os spots já ocupados por categorias diferentes das cartas expostas,
    // e nenhuma delas é carta-título — não há como encaixar em spot nem coluna.
    spotCategories: ["CAT-C", "CAT-D", null, null],
    openCategoryIds: new Set(["CAT-C", "CAT-D"]),
  });
  assert.equal(hasAnyValidMove(state), false);
});
