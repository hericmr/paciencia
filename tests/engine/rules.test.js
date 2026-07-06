import { test } from "node:test";
import assert from "node:assert/strict";
import { canMoveToFoundation, canMoveToTableau, isSameThemeGroup } from "../../src/engine/rules.js";

const c = (rank, theme) => ({ id: `${rank}-${theme}`, theme, rank });

test("canMoveToFoundation: carta do mesmo tema da fundação é aceita, em qualquer rank", () => {
  assert.equal(canMoveToFoundation(c("A", "teorico-metodologico"), "teorico-metodologico"), true);
  assert.equal(canMoveToFoundation(c("K", "teorico-metodologico"), "teorico-metodologico"), true);
  assert.equal(canMoveToFoundation(c("7", "teorico-metodologico"), "teorico-metodologico"), true);
});

test("canMoveToFoundation: carta de tema diferente é rejeitada", () => {
  assert.equal(canMoveToFoundation(c("A", "etico-politico"), "teorico-metodologico"), false);
});

test("canMoveToTableau: qualquer carta entra em coluna vazia", () => {
  assert.equal(canMoveToTableau(c("K", "teorico-metodologico"), null), true);
  assert.equal(canMoveToTableau(c("2", "etico-politico"), null), true);
});

test("canMoveToTableau: mesmo tema é aceito, independente do rank", () => {
  assert.equal(canMoveToTableau(c("5", "tecnico-operativo"), c("9", "tecnico-operativo")), true);
});

test("canMoveToTableau: tema diferente é rejeitado", () => {
  assert.equal(canMoveToTableau(c("5", "tecnico-operativo"), c("6", "historico-formativo")), false);
});

test("isSameThemeGroup: sequência de um único tema é válida", () => {
  assert.equal(
    isSameThemeGroup([c("8", "teorico-metodologico"), c("3", "teorico-metodologico"), c("K", "teorico-metodologico")]),
    true
  );
});

test("isSameThemeGroup: temas mistos invalidam o grupo", () => {
  assert.equal(isSameThemeGroup([c("8", "teorico-metodologico"), c("3", "etico-politico")]), false);
});

test("isSameThemeGroup: grupo vazio ou de uma carta é sempre válido", () => {
  assert.equal(isSameThemeGroup([]), true);
  assert.equal(isSameThemeGroup([c("8", "teorico-metodologico")]), true);
});
