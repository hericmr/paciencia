// Monta uma pasta `dist/` isolada com os assets web (index.html, src/, assets/)
// para o empacotamento do Tauri, que não pode apontar `frontendDist` direto
// para a raiz do repositório (contém node_modules/ e src-tauri/).
import { cpSync, rmSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(fileURLToPath(import.meta.url), "..", "..");
const distDir = path.join(root, "dist");

rmSync(distDir, { recursive: true, force: true });
mkdirSync(distDir);

for (const entry of ["index.html", "src", "assets"]) {
  cpSync(path.join(root, entry), path.join(distDir, entry), { recursive: true });
}

console.log(`dist/ pronta em ${distDir}`);
