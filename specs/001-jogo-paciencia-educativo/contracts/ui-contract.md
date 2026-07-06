# Contract: Esquema de Dados de Cartas & Requisitos de UI/Acessibilidade

Este é o "contrato" externo do projeto: não há API de rede, mas há duas
interfaces estáveis que outras partes do sistema (e decks futuros) dependem.

## 1. Esquema de `src/data/cards.<deck>.json`

Este é o ponto de extensão para novos decks (Princípio III da constituição).
Qualquer novo deck (SUAS aprofundado, Seguridade Social, ECA) DEVE seguir este
esquema para ser carregável pela engine sem alterações de código.

```json
{
  "deckId": "servico-social-estreia",
  "deckName": "Serviço Social Brasileiro — Deck de Estreia",
  "suits": {
    "spades":   { "axis": "Dimensão teórico-metodológica" },
    "hearts":   { "axis": "Dimensão ético-política" },
    "diamonds": { "axis": "Dimensão técnico-operativa" },
    "clubs":    { "axis": "História e formação profissional" }
  },
  "cards": [
    {
      "id": "AS",
      "suit": "spades",
      "rank": "A",
      "title": "Movimento de Reconceituação",
      "body": "Processo latino-americano (a partir de 1965) de questionamento do Serviço Social tradicional...",
      "status": "rascunho"
    }
  ]
}
```

**Regras do contrato**:
- `cards` DEVE conter exatamente 52 entradas: 13 por naipe, ranks
  `A,2,3,4,5,6,7,8,9,10,J,Q,K`, sem duplicatas.
- `status` DEVE ser um de `"rascunho"`, `"revisado"`, `"publicado"`.
- `body` SHOULD ter no máximo 280 caracteres (limite de produção definido em
  `CONTEUDO_CARTAS.md`); a engine não trunca automaticamente — validação é
  responsabilidade do pipeline de conteúdo, não da engine de jogo.
- A engine (`src/engine/`) NUNCA deve importar ou depender do conteúdo de
  `title`/`body` diretamente — apenas `id`, `suit`, `rank`, `status`. Isso é o
  que garante o desacoplamento do Princípio III.

## 2. Esquema de `src/data/principles.json`

```json
{
  "principles": [
    { "order": 1, "summary": "Reconhecimento da liberdade como valor ético central...", "fullText": "..." }
  ]
}
```

- `principles` DEVE ter exatamente 11 entradas, `order` de 1 a 11 sem lacunas.

## 3. Contrato de UI/Acessibilidade (Princípio V da constituição)

Aplica-se a todos os componentes em `src/ui/`:

- Toda carta interativa (tableau, monte, descarte) DEVE ser alcançável via
  teclado (Tab/Enter/setas) além de mouse/touch, e expor `aria-label` com
  naipe e valor (ex.: "Ás de Espadas, virada para cima").
- O pop-up de conteúdo educativo (`reveal-popup.js`) DEVE:
  - receber foco automaticamente ao abrir;
  - ser dispensável via tecla `Esc` além de clique/toque fora;
  - devolver o foco ao elemento que disparou a revelação ao fechar.
- Contraste de cor de texto sobre fundo DEVE atender no mínimo WCAG AA (4.5:1
  para texto normal).
- Nenhuma informação de estado (carta virada, fundação completa, princípio
  desbloqueado) pode depender exclusivamente de cor — sempre acompanhada de
  texto, ícone ou padrão.
- Toda carta interativa DEVE responder tanto a arrastar (drag-and-drop) quanto
  a toque simples (tap) para mover automaticamente ao destino válido mais
  óbvio (FR-012), com área de toque mínima recomendada de 44×44px (referência
  WCAG 2.5.5) em telas sensíveis a toque.
- O layout DEVE ser responsivo a partir de ~360px de largura sem sobrepor ou
  cortar colunas do tableau (FR-013).
