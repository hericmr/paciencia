import { test } from "node:test";
import assert from "node:assert/strict";
import { buildTitleCards, buildWordCards, shuffleCards, depthToInsertIndex, dealTableau } from "../../src/engine/level.js";

const SAMPLE_LEVEL = {
  id: 1,
  categoryIds: ["CAT-A", "CAT-B"],
  cardsPerCategory: 2,
  selectedWords: {
    "CAT-A": ["Um", "Dois"],
    "CAT-B": ["Três", "Quatro"],
  },
  totalCards: 6,
  columns: 2,
  moveLimit: 10,
  profundidadeTitulos: "topo",
  hint: null,
};

const SAMPLE_CATEGORIES = [
  { id: "CAT-A", nome: "Categoria A", cartaTitulo: "Categoria A", eixo: "teoria", palavras: ["Um", "Dois"], microtexto: "x", confundeCom: [] },
  { id: "CAT-B", nome: "Categoria B", cartaTitulo: "Categoria B", eixo: "teoria", palavras: ["Três", "Quatro"], microtexto: "x", confundeCom: [] },
];

test("buildWordCards gera cardsPerCategory × nº de categorias cartas de palavra", () => {
  const cards = buildWordCards(SAMPLE_LEVEL);
  assert.equal(cards.length, 4);
  assert.equal(cards.every((c) => c.isTitleCard === false), true);
});

test("buildTitleCards gera uma carta-título por categoria, com o texto de cartaTitulo", () => {
  const titles = buildTitleCards(SAMPLE_LEVEL, SAMPLE_CATEGORIES);
  assert.equal(titles.length, 2);
  assert.equal(titles.every((c) => c.isTitleCard === true), true);
  assert.deepEqual(titles.map((c) => c.word).sort(), ["Categoria A", "Categoria B"]);
});

test("buildWordCards/buildTitleCards geram ids únicos entre si", () => {
  const words = buildWordCards(SAMPLE_LEVEL);
  const titles = buildTitleCards(SAMPLE_LEVEL, SAMPLE_CATEGORIES);
  const ids = new Set([...words, ...titles].map((c) => c.id));
  assert.equal(ids.size, words.length + titles.length);
});

test("shuffleCards mantém o mesmo conjunto de cartas, só reordena", () => {
  const cards = buildWordCards(SAMPLE_LEVEL);
  const shuffled = shuffleCards(cards, () => 0.5);
  assert.deepEqual(new Set(shuffled.map((c) => c.id)), new Set(cards.map((c) => c.id)));
});

test("shuffleCards não muta o array original", () => {
  const cards = buildWordCards(SAMPLE_LEVEL);
  const originalOrder = cards.map((c) => c.id);
  shuffleCards(cards, () => 0.999);
  assert.deepEqual(cards.map((c) => c.id), originalOrder);
});

test("depthToInsertIndex: topo insere no fim (topo da pilha), fundo no início, meio no meio", () => {
  assert.equal(depthToInsertIndex("topo", 4), 4);
  assert.equal(depthToInsertIndex("fundo", 4), 0);
  assert.equal(depthToInsertIndex("meio", 4), 2);
});

test("dealTableau distribui todas as cartas (títulos + palavras) nas colunas, sem perder nenhuma", () => {
  const titles = buildTitleCards(SAMPLE_LEVEL, SAMPLE_CATEGORIES);
  const words = buildWordCards(SAMPLE_LEVEL);
  const columns = dealTableau(titles, words, SAMPLE_LEVEL.columns, "topo", () => 0.5);

  assert.equal(columns.length, SAMPLE_LEVEL.columns);
  const allDealtIds = columns.flatMap((col) => col.cards.map((c) => c.card.id));
  assert.equal(allDealtIds.length, titles.length + words.length);
  const originalIds = new Set([...titles, ...words].map((c) => c.id));
  assert.deepEqual(new Set(allDealtIds), originalIds);
});

test("dealTableau: só a última carta de cada coluna começa faceUp", () => {
  const titles = buildTitleCards(SAMPLE_LEVEL, SAMPLE_CATEGORIES);
  const words = buildWordCards(SAMPLE_LEVEL);
  const columns = dealTableau(titles, words, SAMPLE_LEVEL.columns, "meio", () => 0.5);

  for (const column of columns) {
    column.cards.forEach((entry, idx) => {
      const shouldBeFaceUp = idx === column.cards.length - 1;
      assert.equal(entry.faceUp, shouldBeFaceUp, `coluna com carta no índice ${idx} de ${column.cards.length}`);
    });
  }
});

test("dealTableau com profundidade 'topo': carta-título fica na posição mais acessível (topo) da sua coluna", () => {
  const titles = buildTitleCards(SAMPLE_LEVEL, SAMPLE_CATEGORIES);
  const words = buildWordCards(SAMPLE_LEVEL);
  const columns = dealTableau(titles, words, SAMPLE_LEVEL.columns, "topo", () => 0.5);

  // Com profundidade "topo", cada carta-título deve estar na última posição da coluna a que foi atribuída
  columns.forEach((column) => {
    const lastCard = column.cards[column.cards.length - 1];
    const hasTitleInColumn = column.cards.some((c) => c.card.isTitleCard);
    if (hasTitleInColumn) {
      assert.equal(lastCard.card.isTitleCard, true);
    }
  });
});

test("dealTableau com profundidade 'embaralhado': cartas de título podem estar em qualquer posição", () => {
  const titles = buildTitleCards(SAMPLE_LEVEL, SAMPLE_CATEGORIES);
  const words = buildWordCards(SAMPLE_LEVEL);
  // dealTableau em profundidade 'embaralhado' retorna { columns, stock }
  const { columns, stock } = dealTableau(titles, words, SAMPLE_LEVEL.columns, "embaralhado", () => 0.1);

  const allDealtIds = [
    ...columns.flatMap((col) => col.cards.map((c) => c.card.id)),
    ...stock.map((c) => c.id)
  ];
  assert.equal(allDealtIds.length, titles.length + words.length);
  const originalIds = new Set([...titles, ...words].map((c) => c.id));
  assert.deepEqual(new Set(allDealtIds), originalIds);
});
