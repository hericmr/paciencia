import { test } from "node:test";
import assert from "node:assert/strict";
import { canMoveToFoundation, canMoveToTableau, isValidSequence, isRed } from "../../src/engine/rules.js";

const c = (rank, suit) => ({ id: `${rank}${suit[0]}`, suit, rank });

test("isRed identifica naipes vermelhos e pretos", () => {
  assert.equal(isRed("hearts"), true);
  assert.equal(isRed("diamonds"), true);
  assert.equal(isRed("spades"), false);
  assert.equal(isRed("clubs"), false);
});

test("canMoveToFoundation: Ás entra em fundação vazia", () => {
  assert.equal(canMoveToFoundation(c("A", "spades"), []), true);
});

test("canMoveToFoundation: carta fora de sequência é rejeitada", () => {
  assert.equal(canMoveToFoundation(c("2", "spades"), []), false);
});

test("canMoveToFoundation: próxima carta da sequência do mesmo naipe é aceita", () => {
  assert.equal(canMoveToFoundation(c("2", "spades"), [c("A", "spades")]), true);
});

test("canMoveToFoundation: naipe errado é rejeitado", () => {
  assert.equal(canMoveToFoundation(c("2", "hearts"), [c("A", "spades")]), false);
});

test("canMoveToTableau: apenas Rei entra em coluna vazia", () => {
  assert.equal(canMoveToTableau(c("K", "spades"), null), true);
  assert.equal(canMoveToTableau(c("Q", "spades"), null), false);
});

test("canMoveToTableau: cor alternada e rank decrescente é aceito", () => {
  assert.equal(canMoveToTableau(c("5", "hearts"), c("6", "spades")), true);
});

test("canMoveToTableau: mesma cor é rejeitado", () => {
  assert.equal(canMoveToTableau(c("5", "spades"), c("6", "clubs")), false);
});

test("canMoveToTableau: rank não sequencial é rejeitado", () => {
  assert.equal(canMoveToTableau(c("5", "hearts"), c("8", "spades")), false);
});

test("isValidSequence: sequência alternada e descendente é válida", () => {
  assert.equal(isValidSequence([c("8", "spades"), c("7", "hearts"), c("6", "clubs")]), true);
});

test("isValidSequence: cores repetidas invalidam a sequência", () => {
  assert.equal(isValidSequence([c("8", "spades"), c("7", "clubs")]), false);
});

test("isValidSequence: sequência de uma carta é sempre válida", () => {
  assert.equal(isValidSequence([c("8", "spades")]), true);
});
