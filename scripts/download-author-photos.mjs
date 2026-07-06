// @ts-check
// Baixa as fotos de autores/as listadas em author-photos-manifest.json para
// assets/authors/ e atualiza photoUrl/photoCredit em cards.*.json.
//
// Uso: node scripts/download-author-photos.mjs
//
// Cada entrada do manifesto deve ter sido verificada manualmente (arquivo
// existe no Wikimedia Commons/Wikipédia, licença permite uso e atribuição
// preenchida) — este script NUNCA inventa URLs, apenas baixa e aplica o que
// já está no manifesto. Ver contracts/ui-contract.md.

import { get } from "node:https";
import { createWriteStream, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const MANIFEST_PATH = join(__dirname, "author-photos-manifest.json");
const CARDS_PATH = join(ROOT, "src/data/cards.servico-social-estreia.json");
const AUTHORS_DIR = join(ROOT, "assets/authors");

/**
 * Baixa uma URL para um caminho local, seguindo redirecionamentos.
 * @param {string} url
 * @param {string} destPath
 * @returns {Promise<void>}
 */
function download(url, destPath) {
  return new Promise((resolve, reject) => {
    get(url, { headers: { "User-Agent": "PacienciaSS/0.1 (educational card game project; contact: heric.moura@unifesp.br)" } }, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        res.resume();
        download(res.headers.location, destPath).then(resolve, reject);
        return;
      }
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode} ao baixar ${url}`));
        return;
      }
      const file = createWriteStream(destPath);
      res.pipe(file);
      file.on("finish", () => file.close(() => resolve()));
      file.on("error", reject);
    }).on("error", reject);
  });
}

async function main() {
  const manifest = JSON.parse(readFileSync(MANIFEST_PATH, "utf8"));
  const cardsData = JSON.parse(readFileSync(CARDS_PATH, "utf8"));

  mkdirSync(AUTHORS_DIR, { recursive: true });

  for (const entry of manifest.photos) {
    const ext = entry.imageUrl.split(".").pop().split("?")[0];
    const filename = `${entry.slug}.${ext}`;
    const destPath = join(AUTHORS_DIR, filename);
    const relativePath = `assets/authors/${filename}`;

    console.log(`Baixando ${entry.person} (${entry.cardId}) de ${entry.imageUrl} ...`);
    await download(entry.imageUrl, destPath);

    const card = cardsData.cards.find((c) => c.id === entry.cardId);
    if (!card) {
      console.warn(`  AVISO: carta ${entry.cardId} não encontrada em cards.servico-social-estreia.json`);
      continue;
    }
    card.photoUrl = relativePath;
    card.photoCredit = entry.credit;
    console.log(`  OK: ${relativePath}`);
  }

  writeFileSync(CARDS_PATH, JSON.stringify(cardsData, null, 2) + "\n");
  console.log("cards.servico-social-estreia.json atualizado.");
}

main().catch((err) => {
  console.error("Falha ao baixar fotos:", err.message);
  process.exit(1);
});
