# Contribuindo

Obrigado pelo interesse em contribuir com o jogo! Este projeto é mantido por
uma pessoa e busca ficar simples de manter — leia
`.specify/memory/constitution.md` antes de propor mudanças estruturais,
especialmente os princípios de simplicidade e de desacoplamento entre
conteúdo e engine.

## Como rodar o projeto

Veja a seção "Como jogar localmente" do `README.md`. Não há build step: é
HTML/CSS/JS puro com módulos ES nativos.

## Contribuindo com código

- Sem dependências de runtime novas sem justificativa forte — prefira
  resolver com JS puro.
- Lógica de jogo (`src/engine/`) deve continuar pura e testável sem DOM.
  Adicione/atualize testes em `tests/` para qualquer mudança de regra.
- Rode `npm test` antes de abrir um PR.
- Não misture dados de conteúdo (textos, categorias, cartas) com código de
  engine — dados novos vão em `src/data/*.json`.

## Contribuindo com conteúdo (cartas, categorias, fases)

- Todo micro-texto de carta deve ser rastreável a uma fonte primária:
  legislação, resolução do CFESS, ou obra original citada. Marque conteúdo
  ainda não verificado como rascunho/pendente — não declare como definitivo
  sem essa checagem.
- Consulte `CONTEUDO_CARTAS.md` para ver o status de revisão do conteúdo
  existente antes de propor novo conteúdo ou correções.
- Novas categorias/fases são arquivos de dados em `src/data/` (`categories.json`,
  `levels.json`, `cards.*.json`) — a engine não precisa mudar para consumi-los.

## Ranking online

O modo de ranking (`src/leaderboard/`) envia resultados para uma planilha do
Google Sheets via Apps Script controlada pelo mantenedor do projeto
(`src/leaderboard/config.js`). Ao testar localmente, partidas registradas em
"Modo revisão" vão para o ranking real — evite poluir o leaderboard de
produção com dados de teste. Para desenvolvimento de features do ranking,
considere apontar `LEADERBOARD_API_URL` para uma implantação própria do
Apps Script.

## Abrindo issues e PRs

- Descreva o problema/proposta e, se for conteúdo, cite a fonte.
- PRs pequenos e focados são mais fáceis de revisar do que mudanças amplas.
- Se a mudança for maior (nova fase, nova mecânica), abra uma issue para
  discutir o escopo antes de implementar.
