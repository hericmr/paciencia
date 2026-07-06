# Research: Jogo de Paciência Educativo — MVP Web

## Decisão 1: Sem framework de UI (React/Vue) nem bundler (Vite/Webpack)

**Decision**: JavaScript puro com ES Modules nativos, servido diretamente pelo
navegador via `<script type="module">`, sem passo de build para produção.

**Rationale**: o projeto é mantido por uma pessoa a longo prazo (anos). Um
framework/bundler traz risco de dependência ficar desatualizada, quebrar em
major upgrades, ou exigir conhecimento reaprendido após meses de pausa no
projeto. Um jogo de cartas single-player com ~10-15 telas/estados de UI não
precisa de gerenciamento de estado reativo complexo — DOM manipulado
diretamente é suficiente e mais simples de depurar. Ausência de build step
também significa que "rodar o jogo" e "editar o jogo" são a mesma ação (abrir
o arquivo em um servidor estático), o que reduz drasticamente o custo de
retomar o projeto após um hiato.

**Alternatives considered**:
- **Vite + vanilla JS/TS** (exemplo usado no próprio README do spec-kit):
  ótimo DX (hot reload), mas introduz uma cadeia de build (Node, npm,
  `vite.config`) que precisa continuar funcionando anos depois; rejeitado por
  não haver necessidade atual que justifique o custo (Princípio IV).
- **React/Preact**: adequado para UIs com muito estado compartilhado e
  componentes reutilizáveis complexos; overkill para um tabuleiro de paciência
  e um pop-up. Rejeitado pelo mesmo motivo.
- **Framework de jogos (Phaser, Kaboom.js)**: pensado para jogos com sprites,
  física, animação intensiva; um jogo de cartas 2D com DOM/CSS não precisa de
  um game loop de canvas. Rejeitado por complexidade desnecessária.

## Decisão 2: TypeScript via JSDoc, sem compilação

**Decision**: usar comentários `// @ts-check` no topo dos módulos e anotações
JSDoc (`@param`, `@returns`, `@typedef`) para obter checagem de tipos no editor
e via `tsc --noEmit` em desenvolvimento, sem gerar nenhum artefato compilado.

**Rationale**: dá parte do valor do TypeScript (pegar erros de tipo cedo,
autocomplete) sem adicionar um passo de build ao pipeline de produção. Se o
projeto crescer a ponto de justificar TypeScript "de verdade", migrar depois é
direto (JSDoc já documenta os tipos).

**Alternatives considered**: TypeScript compilado (`tsc` gerando `.js`) —
rejeitado por adicionar um build step para produção sem benefício adicional
relevante neste estágio.

## Decisão 3: Testes com o test runner nativo do Node.js

**Decision**: `node --test` + `node:assert/strict`, sem Jest/Vitest/Mocha.

**Rationale**: Node 20+ já está disponível no ambiente de desenvolvimento;
o runner nativo cobre tudo que a lógica pura do motor de jogo precisa
(asserções simples, testes síncronos). Zero dependências de teste significa
zero risco de quebra por upgrade de uma dependência de teste depois de anos
parado.

**Alternatives considered**: Vitest (integraria bem se houvesse Vite, mas não
há); Jest (mais pesado, pensado para projetos com transpilação). Ambos
rejeitados pela mesma lógica da Decisão 1.

## Decisão 4: Persistência via `localStorage` com fallback em memória

**Decision**: módulo `progress/store.js` encapsula leitura/escrita; se
`localStorage` não estiver disponível (bloqueado, modo privado sem suporte),
cai para um armazenamento em memória válido apenas durante a sessão — o jogo
continua jogável (US1), apenas sem persistência entre sessões (conforme
Assumption do spec).

**Rationale**: atende FR-008/FR-009 sem introduzir uma dependência de
backend ou de uma lib de storage. `localStorage` é suportado por todos os
navegadores-alvo.

**Alternatives considered**: IndexedDB — poder maior de armazenamento
irrelevante para o volume de dados aqui (um conjunto de IDs de cartas
reveladas + 11 flags de princípios); rejeitado por complexidade desnecessária.

## Decisão 5: Layout de Klondike padrão (não variantes como Spider/FreeCell)

**Decision**: implementar a variante clássica de paciência (Klondike: 7
colunas de tableau, monte com virada de 1 ou 3 cartas, 4 fundações),
consistente com a terminologia já usada em `CONTEUDO_CARTAS.md` ("Fundações
completadas").

**Rationale**: é a variante mais reconhecida popularmente como "paciência" no
Brasil, o que reduz a curva de aprendizado da mecânica de jogo em si — a
novidade do produto é o conteúdo, não a variante de regras.

**Alternatives considered**: Spider (2+ baralhos, mais complexo), FreeCell
(sem monte, mecânica diferente). Nenhum se alinha ao termo "fundações" já
usado na documentação de conteúdo; rejeitados.
