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

function fullFoundations(themeSizes) {
  const build = (theme, size) =>
    Array.from({ length: size }, (_, i) => card(String(i + 1), theme));
  const foundations = {};
  for (const theme of Object.keys(themeSizes)) {
    foundations[theme] = build(theme, themeSizes[theme]);
  }
  return foundations;
}

const UNIFORM_SIZES = {
  "teorico-metodologico": 13,
  "etico-politico": 13,
  "tecnico-operativo": 13,
  "historico-formativo": 13,
};

test("checkWin: false enquanto alguma fundação está incompleta", () => {
  assert.equal(checkWin(emptyFoundations(), UNIFORM_SIZES), false);
});

test("checkWin: true quando cada fundação tem exatamente o tamanho do seu tema", () => {
  assert.equal(checkWin(fullFoundations(UNIFORM_SIZES), UNIFORM_SIZES), true);
});

test("checkWin: funciona com temas de tamanhos diferentes (ex.: 'autores' com 12, outros com 10)", () => {
  const mixedSizes = {
    autores: 12,
    "teorico-metodologico": 10,
    "etico-politico": 10,
    "tecnico-operativo": 10,
    "historico-formativo": 10,
  };
  assert.equal(checkWin(fullFoundations(mixedSizes), mixedSizes), true);

  const almostFull = fullFoundations(mixedSizes);
  almostFull.autores.pop();
  assert.equal(checkWin(almostFull, mixedSizes), false);
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
