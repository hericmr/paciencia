# Contract: Esquema de Dados e Requisitos de UI/Acessibilidade

## 1. Esquema de `src/data/categories.json`

```json
{
  "categories": [
    {
      "id": "CAT-13",
      "nome": "Autoras e autores da vertente crítica",
      "eixo": "teoria",
      "palavras": ["Iamamoto", "Netto", "Behring", "Yazbek", "Guerra", "Faleiros", "Martinelli", "Barroco", "Boschetti"],
      "microtexto": "A tradição marxista no Serviço Social: Iamamoto (trabalho e reprodução), Netto (renovação), Behring (política social), Guerra (instrumentalidade), Barroco (ética).",
      "confundeCom": []
    }
  ]
}
```

**Regras**: `id` único; `palavras` sem duplicatas; `microtexto` ≤ 280
caracteres; `confundeCom` referencia ids existentes (mas não é validado
nem lido pela engine — é metadado de curadoria).

## 2. Esquema de `src/data/levels.json`

```json
{
  "levels": [
    {
      "id": 1,
      "categoryIds": ["CAT-13", "CAT-06", "CAT-11", "CAT-07"],
      "cardsPerCategory": 3,
      "selectedWords": {
        "CAT-13": ["Iamamoto", "Netto", "Guerra"],
        "CAT-06": ["Entrevista", "Visita domiciliar", "Estudo social"],
        "CAT-11": ["1936", "1979", "1993"],
        "CAT-07": ["CRAS", "PAIF", "SCFV"]
      },
      "columns": 4,
      "moveLimit": 24,
      "hint": null
    }
  ]
}
```

**Regras**: `categoryIds` tem exatamente 4 entradas, todas existentes em
`categories.json`; cada lista em `selectedWords` tem exatamente
`cardsPerCategory` itens, todos presentes no `palavras` da categoria
correspondente; `moveLimit ≥ cardsPerCategory × 4`.

## 3. Fotos de autores (cartas da categoria "CAT-13")

Cartas cujo `word` corresponde a um sobrenome de autor/a com foto já
verificada (ver `specs/001-jogo-paciencia-educativo/CONTEUDO_CARTAS.md` e
`scripts/author-photos-manifest.json`) exibem a foto na carta e no pop-up de
categoria completa. Resolução do vínculo palavra↔foto é feita na camada de
apresentação (`src/ui/level-board.js`), não no esquema de dados de
categorias — evita duplicar `photoUrl`/`photoCredit` em dois lugares.
Palavras sem foto correspondente exibem só o texto.

## 4. Regras de movimento

- **Slot de categoria**: aceita uma carta se `card.categoryId ===
  slot.categoryId`; rejeita (carta volta ao tableau) caso contrário.
- Todo movimento — aceito ou rejeitado — decrementa `movesRemaining` em 1
  (ver research.md, Decisão 3).
- Uma categoria já completa (`slots[categoryId].length ===
  cardsPerCategory`) não recebe mais cartas.

## 5. Contrato de UI/Acessibilidade (Princípio V da constituição)

- Toda carta DEVE ser alcançável via teclado (Tab/Enter/setas), além de
  mouse/touch/drag, e expor `aria-label` com o texto da palavra (as cartas
  não têm "verso" nesta versão — todas já estão viradas para cima).
- Cada slot de categoria começa com um rótulo genérico ("Categoria 1",
  "Categoria 2"...) e só exibe o `nome` real depois de **completo** (todas
  as `cardsPerCategory` cartas corretas) — mantém o desafio de não revelar a
  resposta antes da hora (ver research.md, Decisão 7). Antes disso, o
  `aria-label` anuncia só a contagem (ex.: "Categoria 2, ainda não
  identificada. 2 de 3 cartas corretas.").
- O contador de movimentos restantes DEVE ser visível e anunciado a
  leitores de tela quando mudar (`aria-live="polite"`).
- O pop-up de categoria completa DEVE: focar automaticamente ao abrir; ser
  dispensável via `Esc` além de clique/toque fora; devolver o foco ao
  fechar; exibir foto quando disponível (ver seção 3), com `alt` descritivo
  e `photoCredit` visível.
- Tela de derrota DEVE anunciar a dica pedagógica de forma acessível (não
  só visual) e oferecer um botão claro de "tentar novamente".
- Toda carta DEVE responder tanto a arrastar (drag-and-drop) quanto a toque
  simples (tap-then-tap-no-slot ou seleção + toque no slot) como alternativa
  em telas pequenas, com área de toque ≥ 44×44px.
- Layout responsivo a partir de ~360px de largura, sem cortar as 4 colunas
  do tableau nem os 4 slots de categoria.
