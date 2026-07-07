# Contract: Esquema de Dados e Requisitos de UI/Acessibilidade

> **Nota de revisão**: ver `research.md`, Decisão 8 — tableau volta a ser
> empilhado por coluna; categorias têm carta-título a ser desenterrada.

## 1. Esquema de `src/data/categories.json`

```json
{
  "categories": [
    {
      "id": "CAT-13",
      "nome": "Autoras e autores da vertente crítica",
      "cartaTitulo": "Autoras e autores da vertente crítica",
      "eixo": "teoria",
      "palavras": ["Iamamoto", "Netto", "Behring", "Yazbek", "Guerra", "Faleiros", "Martinelli", "Barroco", "Boschetti"],
      "microtexto": "A tradição marxista no Serviço Social: Iamamoto (trabalho e reprodução), Netto (renovação), Behring (política social), Guerra (instrumentalidade), Barroco (ética).",
      "confundeCom": []
    }
  ]
}
```

**Regras**: `id` único; `palavras` sem duplicatas; `microtexto` ≤ 280
caracteres; `cartaTitulo` não vazio; `confundeCom` referencia ids
existentes (mas não é validado nem lido pela engine — é metadado de
curadoria).

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
      "totalCards": 16,
      "columns": 4,
      "moveLimit": 32,
      "profundidadeTitulos": "topo",
      "hint": null
    }
  ]
}
```

**Regras**: `categoryIds` tem exatamente 4 entradas, todas existentes em
`categories.json`; cada lista em `selectedWords` tem exatamente
`cardsPerCategory` itens, todos presentes no `palavras` da categoria
correspondente; `totalCards === 4 + cardsPerCategory × 4`; `moveLimit ≥
totalCards`; `profundidadeTitulos` é `"topo"`, `"meio"` ou `"fundo"`.

## 3. Fotos de autores (cartas da categoria "CAT-13")

Cartas cujo `word` corresponde a um sobrenome de autor/a com foto já
verificada (ver `specs/001-jogo-paciencia-educativo/CONTEUDO_CARTAS.md` e
`scripts/author-photos-manifest.json`) exibem a foto na carta e no pop-up de
categoria completa. Resolução do vínculo palavra↔foto é feita na camada de
apresentação (`src/ui/level-board.js`), não no esquema de dados de
categorias. Palavras sem foto correspondente exibem só o texto.

## 4. Regras de movimento

- **Tableau empilhado**: só a última carta de cada coluna (topo, virada para cima) é jogável. As demais ficam viradas para baixo (mostrando `assets/verso.png`), inacessíveis até a carta acima sair. As cartas-título e de palavra podem começar completamente embaralhadas e misturadas (se configurado como `"embaralhado"` em profundidade).
- **Carta-título → qualquer spot de categoria fechado/vazio**: aceita; associa o spot àquela categoria e a abre. Se o spot estiver ocupado ou a categoria já estiver aberta em outro spot, é rejeitada.
- **Carta de palavra → spot de categoria**: aceita só se o spot estiver aberto e associado a essa categoria específica; caso contrário, é rejeitada (a carta retorna ao topo da coluna de origem).
- **Empilhamento e movimentação no tableau (Área de Mão)**:
  - O jogador pode mover e reorganizar livremente as cartas abertas de sua área de jogo. Duas ou mais cartas podem ser empilhadas apenas quando pertencem à mesma categoria.
  - Cada nova carta adicionada é colocada sobre as anteriores, permanecendo virada para o jogador. As cartas ficam parcialmente sobrepostas (em cascata), com a carta superior representando a última carta adicionada.
  - A pilha mantém a ordem em que as cartas foram inseridas, sendo a carta do topo a última adicionada.
  - Toda a sub-pilha de cartas abertas pode ser movida de uma vez como um único conjunto para outra coluna do tableau, ou o jogador pode mover as cartas individualmente.
  - O movimento (de uma carta ou de uma sub-pilha) só é aceito se a coluna destino estiver vazia ou se a carta do topo da coluna destino pertencer à mesma categoria (CAT-XX). Caso contrário, é rejeitado.
- **Monte (Stock)**: Pilha de cartas viradas para baixo. Ao ser clicado, retira a carta do topo e a adiciona à pilha de Descarte. Se estiver vazio, clicar nele recicla todas as cartas da pilha de Descarte de volta para o Monte.
- **Descarte (Waste)**: Pilha de cartas viradas para cima. Apenas a carta do topo é visível e jogável, podendo ser selecionada ou arrastada para qualquer coluna do tableau (desobstrução) ou spots de categoria.
- Todo movimento acima — aceito ou rejeitado — decrementa `movesRemaining` em 1.
- Ao sair a carta do topo de uma coluna, a carta abaixo dela vira automaticamente para cima.

## 5. Contrato de UI/Acessibilidade (Princípio V da constituição)

- Toda carta acessível (topo de coluna) DEVE ser alcançável via teclado
  (Tab/Enter/setas), além de mouse/touch/drag, e expor `aria-label` com o
  texto (palavra ou carta-título). Cartas viradas para baixo expõem
  `aria-label="Carta virada para baixo"`, sem revelar o conteúdo, e não são
  focáveis/jogáveis.
- Cada slot de categoria possui um cabeçalho superior (com o título da categoria e o progresso) e uma área de encaixe no formato de carta (aspect-ratio 2.5:3.5):
  - **Fechado**: cabeçalho exibe "🔒 Categoria N" e "Fechada"; o slot de encaixe exibe um contorno pontilhado com um cadeado (🔒) de fundo.
  - **Aberto em progresso**: cabeçalho exibe o nome real da categoria e o progresso (ex: "1/3"); o slot de encaixe exibe a pilha física de cartas (a carta-título na base e as palavras corretas empilhadas com deslocamento vertical de 8px).
  - **Completo**: cabeçalho exibe o nome real da categoria e o progresso completo ("3/3 ✓"); o slot de encaixe contém toda a pilha física de cartas.
- O contador de movimentos restantes DEVE ser visível e anunciado a
  leitores de tela quando mudar (`aria-live="polite"`).
- O pop-up de categoria completa DEVE: focar automaticamente ao abrir; ser
  dispensável via `Esc` além de clique/toque fora; devolver o foco ao
  fechar; exibir foto quando disponível (ver seção 3), com `alt` descritivo
  e `photoCredit` visível.
- Tela de derrota DEVE anunciar a dica pedagógica de forma acessível (não
  só visual) e oferecer um botão claro de "tentar novamente".
- Toda carta jogável DEVE responder tanto a arrastar (drag-and-drop) quanto
  a toque simples (seleção + toque no destino) como alternativa em telas
  pequenas, com área de toque ≥ 44×44px.
- Layout responsivo a partir de ~360px de largura, sem cortar as colunas do
  tableau nem os 4 slots de categoria.

## 6. Feedback sonoro (ver research.md, Decisão 9)

| Evento | Som (`assets/kenney_casino-audio/Audio/`) |
|---|---|
| Carta aceita num slot (palavra certa ou carta-título) | `card-place-{1..4}.ogg` |
| Carta rejeitada ou movida entre colunas | `card-slide-{1..8}.ogg` |
| Categoria completada | `cards-pack-open-{1..2}.ogg` |
| Distribuição inicial do nível | `card-shuffle.ogg` |

- Botão de mudo no cabeçalho (🔊/🔇), alcançável por teclado, com
  `aria-pressed` refletindo o estado e estado persistido em `localStorage`.
- Áudio é reforço, nunca portador de informação obrigatória — o jogo
  permanece 100% jogável com o som desligado.
- Falha ao reproduzir (autoplay bloqueado, ambiente sem suporte a `Audio`)
  é silenciosa — nunca gera erro visível.
