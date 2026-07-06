import { test } from "node:test";
import assert from "node:assert/strict";
import { checkWin, hasNoValidMoves } from "../../src/engine/win.js";

const card = (rank, theme, faceUp = true) => ({ id: `${rank}-${theme}`, theme, rank, faceUp });

function emptyFoundations() {
  return {
    "teorico-metodologico": [],
    "etico-politico": [],
    "tecnico-operativo": [],
    "historico-formativo": [],
  };
}

function fullFoundations() {
  const ranks = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
  const build = (theme) => ranks.map((r) => card(r, theme));
  return {
    "teorico-metodologico": build("teorico-metodologico"),
    "etico-politico": build("etico-politico"),
    "tecnico-operativo": build("tecnico-operativo"),
    "historico-formativo": build("historico-formativo"),
  };
}

test("checkWin: false enquanto alguma fundação está incompleta", () => {
  assert.equal(checkWin(emptyFoundations()), false);
});

test("checkWin: true quando as 4 fundações têm 13 cartas", () => {
  assert.equal(checkWin(fullFoundations()), true);
});

test("hasNoValidMoves: false se houver cartas no monte", () => {
  const state = {
    tableau: [[card("K", "teorico-metodologico")]],
    stock: [card("2", "etico-politico")],
    waste: [],
    foundations: emptyFoundations(),
  };
  assert.equal(hasNoValidMoves(state), false);
});

test("hasNoValidMoves: false se houver cartas no descarte", () => {
  const state = {
    tableau: [[card("K", "teorico-metodologico")]],
    stock: [],
    waste: [card("2", "etico-politico")],
    foundations: emptyFoundations(),
  };
  assert.equal(hasNoValidMoves(state), false);
});

test("hasNoValidMoves: false se houver qualquer carta face-up no tableau (sempre pode ir à própria fundação)", () => {
  const state = {
    tableau: [[card("A", "teorico-metodologico")], [card("K", "historico-formativo")]],
    stock: [],
    waste: [],
    foundations: emptyFoundations(),
  };
  assert.equal(hasNoValidMoves(state), false);
});

test("hasNoValidMoves: true quando não há monte, descarte, nem nenhuma carta face-up jogável", () => {
  const state = {
    tableau: [[card("K", "teorico-metodologico", false)], [card("K", "historico-formativo", false)]],
    stock: [],
    waste: [],
    foundations: emptyFoundations(),
  };
  assert.equal(hasNoValidMoves(state), true);
});
