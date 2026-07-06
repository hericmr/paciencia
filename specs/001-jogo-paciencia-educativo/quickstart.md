# Quickstart: Jogo de Paciência Educativo

## Rodar o jogo localmente

Não há passo de build. Qualquer servidor de arquivos estáticos serve o jogo,
pois módulos ES exigem `http://` (não abrem via `file://` por CORS).

```bash
# a partir da raiz do projeto
python3 -m http.server 8000
# abrir http://localhost:8000 no navegador
```

(Qualquer alternativa equivalente serve: `npx serve`, extensão "Live Server"
do editor, etc. — não é uma dependência do projeto, apenas conveniência local.)

## Rodar os testes

```bash
node --test tests/
```

Sem `npm install` necessário — os testes usam apenas o test runner nativo do
Node.js (`node --test`) e `node:assert/strict`.

## Checagem de tipos (opcional, em desenvolvimento)

Se o TypeScript estiver disponível globalmente ou via `npx`:

```bash
npx tsc --noEmit --checkJs --allowJs src/**/*.js
```

Isso valida as anotações JSDoc (`@param`, `@returns`) sem gerar nenhum
artefato — puramente uma checagem de desenvolvimento.

## Estrutura para editar conteúdo

- Fonte humana de conteúdo: `CONTEUDO_CARTAS.md` (raiz do projeto).
- Fonte consumida pelo jogo: `src/data/cards.servico-social-estreia.json`
  (ver esquema em `contracts/ui-contract.md`).
- Ao editar um micro-texto, atualizar os dois lugares e o `status` da carta
  (`rascunho` → `revisado` → `publicado`) conforme o Princípio I da
  constituição do projeto.

## Deploy

Como é um site puramente estático, qualquer host de arquivos estáticos serve
(GitHub Pages, Netlify, Cloudflare Pages, etc.) — basta publicar a raiz do
projeto (ou os arquivos `index.html` + `src/`). Nenhuma variável de ambiente
ou configuração de servidor é necessária.
