<!--
Sync Impact Report
- Version change: (none) → 1.0.0
- Modified principles: n/a (initial ratification)
- Added sections: Core Principles (I–VI), Content Pipeline, Development Workflow, Governance
- Removed sections: none
- Templates requiring updates:
  - .specify/templates/plan-template.md ⚠ pending (review Constitution Check section against principles below when first plan is drafted)
  - .specify/templates/spec-template.md ⚠ pending (review scope/requirements alignment when first spec is drafted)
  - .specify/templates/tasks-template.md ⚠ pending (ensure task categories reflect content-pipeline and testing principles)
- Follow-up TODOs: none
-->

# Paciência SS Constitution

## Core Principles

### I. Rigor conceitual do conteúdo é inegociável
Todo micro-texto de carta (conceitos, autores/as, marcos históricos, princípios do
Código de Ética) DEVE ser rastreável a uma fonte primária — legislação, resolução do
CFESS, ou obra original citada — antes de ser publicado no jogo. Conteúdo marcado como
rascunho ou pendente de revisão (ver `CONTEUDO_CARTAS.md`) NÃO PODE ser promovido a
release sem essa validação. Erros conceituais em conteúdo educativo são bugs de
severidade máxima, não polimento cosmético.

**Rationale**: o valor do jogo é ser confiável como material de estudo; um erro
factual em uma carta é pior do que qualquer bug de interface.

### II. Zero fricção de acesso
O jogo DEVE rodar em um navegador comum (desktop e mobile) sem instalação, sem
criação de conta e sem exigir backend/servidor para a experiência de jogo single
player. Persistência de progresso (cartas reveladas, coleção) usa armazenamento
local do navegador. Qualquer funcionalidade que exija rede (ex.: sincronizar
progresso entre dispositivos) é estritamente opcional e aditiva, nunca um requisito
para jogar.

**Rationale**: o público é amplo e não-técnico (estudantes e profissionais de
Serviço Social); qualquer fricção de instalação ou cadastro derruba o alcance.

### III. Conteúdo e engine desacoplados
Os dados das cartas (naipes, títulos, micro-textos, princípios do Código de Ética)
DEVEM viver em arquivos de dados (JSON) separados do código da engine do jogo. A
engine consome esses dados por um formato estável e documentado, permitindo que
novos decks (SUAS aprofundado, Seguridade Social, ECA e legislações específicas)
sejam adicionados criando novos arquivos de dados, sem alterar a lógica do jogo.

**Rationale**: o roadmap already prevê expansões; misturar conteúdo com código
transformaria cada novo deck em um retrabalho de engine.

### IV. Simplicidade sobre generalidade prematura
Como projeto mantido por uma pessoa, o código DEVE evitar abstrações, frameworks
pesados ou infraestrutura (build systems complexos, microsserviços, ORMs) que não
sejam justificados pela necessidade atual e comprovada do jogo. Prefira HTML/CSS/JS
com o mínimo de dependências que ainda seja confortável de manter. Qualquer
dependência nova deve justificar seu custo de manutenção de longo prazo frente ao
ganho que traz.

**Rationale**: complexidade acumulada é o principal risco para a sobrevivência de
um projeto indie de longo prazo — não escassez de features.

### V. Acessibilidade e linguagem inclusiva
A interface DEVE ser operável por teclado e compatível com leitores de tela sempre
que razoável (foco visível, texto alternativo em cartas, contraste adequado). A
linguagem usada nos textos do jogo DEVE seguir as orientações de linguagem inclusiva
dos documentos do CFESS (ex.: "assistentes sociais", uso de "/a" ou linguagem neutra
conforme o padrão adotado pela categoria).

**Rationale**: um jogo sobre uma profissão cujo Código de Ética exige eliminação de
preconceitos (princípio 6) e não discriminação (princípio 11) deve praticar isso na
própria interface.

### VI. Testabilidade do essencial
A lógica de jogo que não depende de julgamento de conteúdo — embaralhar o baralho,
regras de vitória/derrota da paciência, condições de desbloqueio de fundações e dos
11 princípios do Código de Ética, persistência de progresso — DEVE ter testes
automatizados. Conteúdo visual, layout e microtextos podem ser validados
manualmente; regras de jogo não.

**Rationale**: regras de desbloqueio e progresso são o "motor" educativo do jogo;
regressões aqui quebram silenciosamente o propósito pedagógico sem serem óbvias no
visual.

## Pipeline de Conteúdo

Todo conteúdo de cartas segue três estados explícitos, registrados no próprio
arquivo de dados (campo `status`): `rascunho` → `revisado` → `publicado`. Apenas
cartas `publicado` podem aparecer em builds de produção. O arquivo
`CONTEUDO_CARTAS.md` na raiz do projeto é a fonte de verdade humana (legível,
editável por não-programadores); os arquivos JSON de dados do jogo são gerados ou
mantidos em sincronia manual com ele — qualquer divergência entre os dois é tratada
como bug de conteúdo.

## Fluxo de Desenvolvimento

Este projeto usa Spec-Driven Development (spec-kit): toda funcionalidade nova passa
por `/speckit-specify` → `/speckit-plan` → `/speckit-tasks` → `/speckit-implement`
antes de ser codificada diretamente. Mudanças pequenas de conteúdo (correção de
micro-texto, ajuste de tabela em `CONTEUDO_CARTAS.md`) não exigem esse ciclo
completo, mas mudanças de regra de jogo, estrutura de dados ou arquitetura exigem.

## Governance

Esta constituição tem precedência sobre qualquer prática ou preferência ad-hoc
durante o desenvolvimento. Emendas exigem: (1) registro do racional da mudança,
(2) atualização do número de versão conforme semver (MAJOR: remoção/redefinição
incompatível de princípio; MINOR: novo princípio ou expansão material de guidance;
PATCH: clarificação/redação), e (3) revisão dos templates dependentes
(`plan-template.md`, `spec-template.md`, `tasks-template.md`) quanto à consistência.
Toda especificação e plano gerados pelo spec-kit DEVEM justificar explicitamente
qualquer desvio dos princípios I–VI acima ("Complexity Tracking").

**Version**: 1.0.0 | **Ratified**: 2026-07-06 | **Last Amended**: 2026-07-06
