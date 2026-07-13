import { test } from "node:test";
import assert from "node:assert/strict";
import {
  slug,
  cardId,
  computeResizeDimensions,
  validateImageMetadata,
  stringifyJson,
  CARD_IMAGE_MAX_DIMENSION,
} from "../../tools/deck-editor/lib.js";

test("slug: remove acentos, minusculiza e troca separadores por hífen", () => {
  assert.equal(slug("José Paulo Netto"), "jose-paulo-netto");
  assert.equal(slug("Maria Lúcia Martinelli"), "maria-lucia-martinelli");
});

test("slug: parênteses, barras e pontuação viram hífen, sem hífen nas pontas", () => {
  assert.equal(slug("Fiscalização do exercício profissional (CFESS/CRESS)"), "fiscalizacao-do-exercicio-profissional-cfess-cress");
  assert.equal(slug("  Início e Fim!!  "), "inicio-e-fim");
});

test("cardId: prefixa com o id da categoria em minúsculas", () => {
  assert.equal(cardId("CAT-13", "José Paulo Netto"), "cat-13__jose-paulo-netto");
});

test("cardId: mesma palavra em categorias diferentes não colide", () => {
  assert.notEqual(cardId("CAT-01", "Democracia"), cardId("CAT-09", "Democracia"));
});

test("computeResizeDimensions: mantém proporção e limita ao lado maior", () => {
  assert.deepEqual(computeResizeDimensions(1024, 512), { width: 256, height: 128 });
  assert.deepEqual(computeResizeDimensions(512, 1024), { width: 128, height: 256 });
});

test("computeResizeDimensions: imagem menor que o alvo não é ampliada", () => {
  assert.deepEqual(computeResizeDimensions(120, 80), { width: 120, height: 80 });
});

test("computeResizeDimensions: respeita um maxSize customizado", () => {
  assert.deepEqual(computeResizeDimensions(400, 400, 100), { width: 100, height: 100 });
});

test("computeResizeDimensions: usa o padrão de 256px quando maxSize é omitido", () => {
  const { width, height } = computeResizeDimensions(1000, 1000);
  assert.equal(Math.max(width, height), CARD_IMAGE_MAX_DIMENSION);
});

test("validateImageMetadata: sem imagem, não exige photoCredit (carta só de texto)", () => {
  const errors = validateImageMetadata({ hasImage: false, photoCredit: "" });
  assert.deepEqual(errors, []);
});

test("validateImageMetadata: com imagem, exige photoCredit", () => {
  const errors = validateImageMetadata({ hasImage: true, photoCredit: "" });
  assert.ok(errors.some((e) => e.includes("Crédito")));
});

test("validateImageMetadata: imagem ilustrativa não exige autor/licença/commons", () => {
  const errors = validateImageMetadata({ hasImage: true, photoCredit: "Ilustração do CRAS", isRealPersonPhoto: false });
  assert.deepEqual(errors, []);
});

test("validateImageMetadata: foto de pessoa real exige autor, licença e commonsFileUrl", () => {
  const errors = validateImageMetadata({ hasImage: true, photoCredit: "Foto de fulano", isRealPersonPhoto: true });
  assert.equal(errors.length, 3);
});

test("validateImageMetadata: foto de pessoa real com os 3 campos preenchidos passa", () => {
  const errors = validateImageMetadata({
    hasImage: true,
    photoCredit: "Foto de fulano, CC BY-SA 4.0",
    isRealPersonPhoto: true,
    author: "Fulano de Tal",
    license: "CC BY-SA 4.0",
    commonsFileUrl: "https://commons.wikimedia.org/wiki/File:Exemplo.jpg",
  });
  assert.deepEqual(errors, []);
});

test("stringifyJson: indentação de 2 espaços, sem quebra de linha final", () => {
  const out = stringifyJson({ a: 1, b: [1, 2] });
  assert.equal(out, '{\n  "a": 1,\n  "b": [\n    1,\n    2\n  ]\n}');
  assert.ok(!out.endsWith("\n"));
});
