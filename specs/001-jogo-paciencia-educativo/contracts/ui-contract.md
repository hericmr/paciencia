# Contract: Esquema de Dados de Cartas & Requisitos de UI/Acessibilidade

Este é o "contrato" externo do projeto: não há API de rede, mas há duas
interfaces estáveis que outras partes do sistema (e decks futuros) dependem.

> **Nota de revisão (2026)**: o campo `suit` (naipe) foi renomeado para
> `theme` (tema) e seus valores deixaram de ser naipes de baralho
> (`spades`/`hearts`/...) para serem os 4 eixos temáticos diretamente. Ver
> `data-model.md` e `research.md` (Decisão 6).

## 1. Esquema de `src/data/cards.<deck>.json`

Este é o ponto de extensão para novos decks (Princípio III da constituição).
Qualquer novo deck (SUAS aprofundado, Seguridade Social, ECA) DEVE seguir este
esquema para ser carregável pela engine sem alterações de código.

```json
{
  "deckId": "servico-social-estreia",
  "deckName": "Serviço Social Brasileiro — Deck de Estreia",
  "themes": {
    "teorico-metodologico": { "axis": "Dimensão teórico-metodológica", "shortLabel": "Teórico-metodológica" },
    "etico-politico":       { "axis": "Dimensão ético-política", "shortLabel": "Ético-política" },
    "tecnico-operativo":    { "axis": "Dimensão técnico-operativa", "shortLabel": "Técnico-operativa" },
    "historico-formativo":  { "axis": "História e formação profissional", "shortLabel": "História e formação" }
  },
  "cards": [
    {
      "id": "AS",
      "theme": "teorico-metodologico",
      "rank": "A",
      "title": "Movimento de Reconceituação",
      "body": "Processo latino-americano (a partir de 1965) de questionamento do Serviço Social tradicional...",
      "status": "rascunho",
      "photoUrl": null,
      "photoCredit": null
    }
  ]
}
```

**Regras do contrato**:
- `cards` DEVE conter exatamente 52 entradas: 13 por tema, ranks
  `A,2,3,4,5,6,7,8,9,10,J,Q,K`, sem duplicatas.
- `status` DEVE ser um de `"rascunho"`, `"revisado"`, `"publicado"`.
- `body` SHOULD ter no máximo 280 caracteres (limite de produção definido em
  `CONTEUDO_CARTAS.md`); a engine não trunca automaticamente — validação é
  responsabilidade do pipeline de conteúdo, não da engine de jogo.
- `photoUrl`/`photoCredit`: usados apenas em cartas de autor/a (`rank` em
  `J`, `Q`, `K`). Cartas de conceito/marco (`A`–`10`) DEVEM ter ambos como
  `null`. Nunca inserir uma URL sem verificar que a imagem existe e que sua
  licença permite o uso, preenchendo `photoCredit` com a atribuição exigida.
- A engine (`src/engine/`) NUNCA deve importar ou depender do conteúdo de
  `title`/`body`/`photoUrl` diretamente — apenas `id`, `theme`, `rank`. Isso é
  o que garante o desacoplamento do Princípio III. `status` é consultado pela
  camada de UI (para o placeholder de FR-011), não pela engine de regras.

## 2. Esquema de `src/data/principles.json`

```json
{
  "principles": [
    { "order": 1, "summary": "Reconhecimento da liberdade como valor ético central...", "fullText": "..." }
  ]
}
```

- `principles` DEVE ter exatamente 11 entradas, `order` de 1 a 11 sem lacunas.

## 3. Regras de movimento (substituem as regras de Klondike da v1)

- **Fundação**: uma carta pode ir para a fundação do seu próprio `theme` a
  qualquer momento, em qualquer ordem de rank.
- **Tableau**: uma carta só pode ser empilhada sobre outra do mesmo `theme`;
  uma coluna vazia aceita qualquer carta (sem restrição de rank).
- Não existe mais alternância de cor nem sequência A→K obrigatória em
  nenhum lugar do jogo.

## 4. Contrato de UI/Acessibilidade (Princípio V da constituição)

Aplica-se a todos os componentes em `src/ui/`:

- Toda carta interativa (tableau, monte, descarte) DEVE ser alcançável via
  teclado (Tab/Enter/setas) além de mouse/touch, e expor `aria-label` com
  tema e valor (ex.: "Ás — Dimensão teórico-metodológica, virada para cima").
- Cada tema DEVE ter uma cor de identificação própria e consistente (não mais
  a dicotomia vermelho/preto de naipes de baralho), usada em cartas,
  fundações e no modo revisão.
- O pop-up de conteúdo educativo (`reveal-popup.js`) DEVE:
  - receber foco automaticamente ao abrir;
  - ser dispensável via tecla `Esc` além de clique/toque fora;
  - devolver o foco ao elemento que disparou a revelação ao fechar;
  - exibir a foto (`photoUrl`) com `alt` descritivo e o `photoCredit` visível,
    quando presentes.
- Contraste de cor de texto sobre fundo DEVE atender no mínimo WCAG AA (4.5:1
  para texto normal), inclusive nas cores por tema.
- Nenhuma informação de estado (carta virada, fundação completa, princípio
  desbloqueado) pode depender exclusivamente de cor — sempre acompanhada de
  texto, ícone ou padrão.
- Toda carta interativa DEVE responder tanto a arrastar (drag-and-drop) quanto
  a toque simples (tap) para mover automaticamente ao destino válido mais
  óbvio (FR-012), com área de toque mínima recomendada de 44×44px (referência
  WCAG 2.5.5) em telas sensíveis a toque.
- O layout DEVE ser responsivo a partir de ~360px de largura sem sobrepor ou
  cortar colunas do tableau (FR-013).
