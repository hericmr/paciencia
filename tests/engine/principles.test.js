import { test } from "node:test";
import assert from "node:assert/strict";
import { computeUnlockedPrinciples } from "../../src/engine/principles.js";

test("computeUnlockedPrinciples: retorna prefixo contíguo contendo de 1 a min(11, N) princípios", () => {
  assert.deepEqual(computeUnlockedPrinciples(0), []);
  assert.deepEqual(computeUnlockedPrinciples(1), [1]);
  assert.deepEqual(computeUnlockedPrinciples(5), [1, 2, 3, 4, 5]);
  assert.deepEqual(computeUnlockedPrinciples(11), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
  // Limite de 11 princípios
  assert.deepEqual(computeUnlockedPrinciples(12), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
  assert.deepEqual(computeUnlockedPrinciples(20), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
});
