# Serviço Social — Jogo Educativo

Um jogo de cartas educativo, no estilo "Connections/Solitaire de Associações",
sobre o **Serviço Social Brasileiro**: conceitos, autores/as, marcos
históricos e os princípios do Código de Ética de 1993 (CFESS/CRESS).

Jogue direto no navegador, sem instalação e sem conta: arraste as cartas de
palavra para o slot da categoria correta. Cada movimento (certo ou errado)
consome parte do limite de movimentos da fase — complete as 4 categorias
antes de esgotá-los para vencer. Ao completar uma categoria, o jogo revela
seu micro-texto pedagógico.

## Como jogar localmente

Não há build step nem dependências de runtime — é HTML/CSS/JS puro com
módulos ES nativos. Basta servir os arquivos estaticamente (abrir o
`index.html` direto no navegador via `file://` não funciona por causa dos
módulos ES e do `fetch` dos dados JSON).

```bash
npm run serve
# ou: python3 -m http.server 8000
```

Depois acesse `http://localhost:8000`.

## Versão desktop (Linux)

Além da versão web, o jogo roda como app nativo Linux via
[Tauri](https://tauri.app) (`.deb` e `.AppImage`), com o mesmo código-fonte —
sem fork, sem duplicação.

```bash
npm run desktop:dev     # roda em modo desenvolvimento
npm run desktop:build   # gera .deb e .AppImage em src-tauri/target/release/bundle/
```

Para publicar uma release: dê bump na versão em `package.json`,
`src-tauri/Cargo.toml` e `src-tauri/tauri.conf.json`, depois crie e empurre
uma tag `vX.Y.Z`:

```bash
git tag v0.1.0
git push origin v0.1.0
```

O workflow `.github/workflows/release-desktop.yml` builda e publica os
binários como um rascunho de Release no GitHub — revise e publique
manualmente. Isso é independente do deploy da versão web (GitHub Pages, que
reage a push na `main`).

## Rodando os testes

```bash
npm test
```

Usa `node --test` e `node:assert/strict` — zero dependências externas.

## Estrutura do projeto

```text
index.html            # ponto de entrada
src/
  data/                # conteúdo do jogo (cartas, categorias, fases) em JSON
  engine/              # regras puras do jogo (sem DOM, testável isoladamente)
  ui/                   # renderização e interação (tabuleiro, popups)
  progress/             # persistência local (localStorage)
  leaderboard/          # ranking online (Google Sheets + Apps Script)
  audio/                 # efeitos sonoros
specs/                 # planos e specs de features (metodologia spec-driven)
tests/                 # testes automatizados
```

Conteúdo e engine são desacoplados por design: novos decks/fases podem ser
adicionados criando novos arquivos em `src/data/`, sem alterar a lógica do
jogo. Veja `.specify/memory/constitution.md` para os princípios que guiam o
projeto.

## Conteúdo

O rigor conceitual das cartas é tratado como requisito não-negociável: todo
micro-texto deve ser rastreável a uma fonte primária (legislação, resolução
do CFESS, obra original citada). O status de revisão de cada carta está em
`CONTEUDO_CARTAS.md`.

## Contribuindo

Contribuições de código e de conteúdo (novas categorias, revisão conceitual,
correções) são bem-vindas. Veja `CONTRIBUTING.md`.

## Licença

Este projeto é distribuído sob a licença MIT — veja o arquivo `LICENSE`.
