import { test } from "node:test";
import assert from "node:assert/strict";
import { buildDeck, shuffleDeck, rankIndex, RANK_ORDER } from "../../src/engine/deck.js";

const THEMES = ["teorico-metodologico", "etico-politico", "tecnico-operativo", "historico-formativo"];

function sampleCardsData() {
  const cards = [];
  for (const theme of THEMES) {
    for (const rank of RANK_ORDER) {
      cards.push({ id: `${rank}-${theme}`, theme, rank, title: "x", body: "x", status: "rascunho" });
    }
  }
  return cards;
}

test("buildDeck produz 52 cartas, 13 por tema, sem duplicatas", () => {
  const deck = buildDeck(sampleCardsData());
  assert.equal(deck.length, 52);
  for (const theme of THEMES) {
    assert.equal(deck.filter((c) => c.theme === theme).length, 13);
  }
  const ids = new Set(deck.map((c) => c.id));
  assert.equal(ids.size, 52);
});

test("buildDeck não carrega title/body (engine desacoplada do conteúdo)", () => {
  const deck = buildDeck(sampleCardsData());
  for (const card of deck) {
    assert.equal("title" in card, false);
    assert.equal("body" in card, false);
  }
});

test("shuffleDeck mantém as mesmas 52 cartas, apenas reordenadas", () => {
  const deck = buildDeck(sampleCardsData());
  const shuffled = shuffleDeck(deck, () => 0.5);
  assert.equal(shuffled.length, 52);
  const originalIds = new Set(deck.map((c) => c.id));
  const shuffledIds = new Set(shuffled.map((c) => c.id));
  assert.deepEqual(shuffledIds, originalIds);
});

test("shuffleDeck não muta o array original", () => {
  const deck = buildDeck(sampleCardsData());
  const originalOrder = deck.map((c) => c.id);
  shuffleDeck(deck, () => 0.999);
  assert.deepEqual(deck.map((c) => c.id), originalOrder);
});

test("rankIndex ordena A..K de 1 a 13", () => {
  assert.equal(rankIndex("A"), 1);
  assert.equal(rankIndex("10"), 10);
  assert.equal(rankIndex("K"), 13);
  assert.throws(() => rankIndex("Z"));
});
