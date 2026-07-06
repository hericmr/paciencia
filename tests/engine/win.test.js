import { test } from "node:test";
import assert from "node:assert/strict";
import { checkWin, hasNoValidMoves } from "../../src/engine/win.js";

const card = (rank, suit, faceUp = true) => ({ id: `${rank}${suit[0]}`, suit, rank, faceUp });

function emptyFoundations() {
  return { spades: [], hearts: [], diamonds: [], clubs: [] };
}

function fullFoundations() {
  const ranks = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
  const build = (suit) => ranks.map((r) => card(r, suit));
  return { spades: build("spades"), hearts: build("hearts"), diamonds: build("diamonds"), clubs: build("clubs") };
}

test("checkWin: false enquanto alguma fundação está incompleta", () => {
  assert.equal(checkWin(emptyFoundations()), false);
});

test("checkWin: true quando as 4 fundações têm 13 cartas", () => {
  assert.equal(checkWin(fullFoundations()), true);
});

test("hasNoValidMoves: false se houver cartas no monte", () => {
  const state = {
    tableau: [[card("K", "spades")]],
    stock: [card("2", "hearts")],
    waste: [],
    foundations: emptyFoundations(),
  };
  assert.equal(hasNoValidMoves(state), false);
});

test("hasNoValidMoves: false se houver cartas no descarte", () => {
  const state = {
    tableau: [[card("K", "spades")]],
    stock: [],
    waste: [card("2", "hearts")],
    foundations: emptyFoundations(),
  };
  assert.equal(hasNoValidMoves(state), false);
});

test("hasNoValidMoves: false se uma carta do tableau puder ir para a fundação", () => {
  const state = {
    tableau: [[card("A", "spades")], [card("K", "clubs")]],
    stock: [],
    waste: [],
    foundations: emptyFoundations(),
  };
  assert.equal(hasNoValidMoves(state), false);
});

test("hasNoValidMoves: false se uma carta do tableau puder ir para outra coluna", () => {
  const state = {
    tableau: [[card("5", "hearts")], [card("6", "spades")]],
    stock: [],
    waste: [],
    foundations: emptyFoundations(),
  };
  assert.equal(hasNoValidMoves(state), false);
});

test("hasNoValidMoves: true quando não há monte, descarte, nem jogada de fundação/tableau", () => {
  const state = {
    tableau: [[card("K", "spades")], [card("K", "clubs")]],
    stock: [],
    waste: [],
    foundations: emptyFoundations(),
  };
  assert.equal(hasNoValidMoves(state), true);
});
