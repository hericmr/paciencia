# Quickstart: Jogo de Categorias e Associações

Sem mudança em relação à v1 — continua sendo um site estático sem build.

```bash
# a partir da raiz do projeto
python3 -m http.server 8000
# abrir http://localhost:8000
```

## Rodar os testes

```bash
node --test tests/
```

## Editar conteúdo

- `src/data/categories.json`: pools de palavras, micro-textos, misdirection
  (`confundeCom`, metadado — não afeta a engine).
- `src/data/levels.json`: quais categorias/palavras compõem cada nível
  jogável, limite de movimentos, colunas, dica de derrota.
- Ao adicionar um novo nível jogável, garantir que `selectedWords` de cada
  categoria tenha exatamente `cardsPerCategory` itens presentes no
  `palavras` daquela categoria (ver `contracts/ui-contract.md`).

## Deploy

Mesma orientação da v1: qualquer host de arquivos estáticos serve.
