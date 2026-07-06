# Research: Jogo de Categorias e Associações — MVP Nível 1

## Decisão 1: Substituir o Klondike de vez, não manter os dois

**Decision**: a feature 001 (Klondike temático) é descontinuada; a 002 é o
único jogo mantido daqui em diante. Código antigo permanece acessível via
`git log`/branch `001-jogo-paciencia-educativo`.

**Rationale**: confirmado explicitamente com o mantenedor. Manter dois jogos
em paralelo dobraria a superfície de manutenção (Princípio IV) sem benefício
claro — o novo modelo já supera o antigo em alinhamento pedagógico (o
Klondike tinha ficado "fácil demais" após a remoção de naipes/ordem, ver
`specs/001-jogo-paciencia-educativo/research.md`, Decisão 6, consequência
assumida).

## Decisão 2: Sem sorteio aleatório de palavras nesta versão

**Decision**: cada nível define `selectedWords` fixas por categoria
(subconjunto curado do pool), não uma amostra aleatória do pool completo a
cada partida.

**Rationale**: sortear aleatoriamente exigiria uma lógica de balanceamento
para evitar ambiguidade indesejada (duas categorias do mesmo nível
sorteando a mesma palavra-armadilha fora do par de misdirection
pretendido) — exatamente o problema que a "Regra de design" da seção 3 do
documento de conteúdo do mantenedor descreve. Resolver isso corretamente é
complexidade real, mas não comprovadamente necessária ainda (só há 1 nível
jogável). Curar manualmente por nível é mais simples e safe (Princípio IV);
sorteio com balanceamento fica documentado aqui como extensão futura.

## Decisão 3: Todo movimento consome o limite, mesmo o errado

**Decision**: tanto um movimento aceito (carta correta) quanto um rejeitado
(carta errada, que volta pro tableau) decrementam `movesRemaining`.

**Rationale**: é a leitura mais direta do termo "limite de movimentos" no
documento de design (em vez de, por exemplo, um limite só de erros/vidas).
Também é o que dá peso real à mecânica de misdirection: errar tem custo
concreto e imediato, reforçando "pensar antes de mover" — alinhado à "regra
pedagógica central" do documento (completar categoria = conhecimento;
errar = uma chance a menos). Se o mantenedor preferir separar "limite de
erros" de "limite de movimentos totais" depois, é uma mudança pequena e
isolada em `level-status.js`.

## Decisão 4: Todas as cartas visíveis desde o início (sem ocultação)

**Decision**: ao contrário do Klondike (cartas viradas para baixo,
reveladas aos poucos), no novo modelo todas as cartas do nível começam
viradas para cima no tableau.

**Rationale**: a mecânica de classificação por categoria depende de **ler**
todas as palavras disponíveis para decidir onde cada uma se encaixa — expor
gradualmente atrapalharia a decisão em vez de criar tensão de jogo (que
aqui vem do limite de movimentos, não da informação oculta). Consistente
com o gênero de referência citado pelo mantenedor (jogos de categorização
tipo NYT Connections / Solitaire Associations).

## Decisão 5: Layout de distribuição no tableau

**Decision**: as cartas do nível são embaralhadas e distribuídas em
`columns` colunas (do próprio nível, 4 para o Nível 1), sem noção de
monte/descarte — todas as cartas ficam acessíveis e podem ser arrastadas a
qualquer momento (nenhuma fica "embaixo" de outra bloqueando acesso).

**Rationale**: sem ocultação de carta (Decisão 4), não há razão para manter
stock/waste do Klondike — era um mecanismo de liberar cartas escondidas, que
deixou de existir. Colunas viram só um agrupamento visual (grade), não uma
pilha com regra de acesso.

## Decisão 6: `confundeCom` é metadado de design, não regra de engine

**Decision**: o campo `confundeCom` de cada categoria não é lido pela
engine de validação (`canPlaceInCategory` continua sendo uma simples
igualdade `card.categoryId === slot.categoryId`). A "armadilha" acontece
inteiramente na curadoria de conteúdo (quais palavras entram em quais
categorias de quais níveis), não em uma regra de código.

**Rationale**: mantém a engine desacoplada do conteúdo (Princípio III) — o
"misdirection" é uma propriedade emergente de que palavras humanas
escolheram parecer ambíguas, não algo que o código precisa entender ou
validar. Também é mais simples: não existe uma "categoria errada mas
aceitável", só certa/errada.

## Decisão 7: Nome da categoria só é revelado quando ela é completada

**Decision**: os 4 slots começam com rótulo genérico ("Categoria 1"..."4");
o `nome` real e o `microtexto` só aparecem juntos, no momento em que a
última carta correta daquela categoria é aceita. Antes disso, o slot só
mostra um contador de progresso (X de N cartas corretas).

**Rationale**: o esquema de dados do mantenedor já dizia "nome exibido no
slot quando descoberta" — a única ambiguidade era **quando** conta como
"descoberta" (primeira carta certa vs. todas). Optou-se pela versão mais
simples (só na conclusão), porque: (a) evita um estado intermediário extra
para especificar/testar ("parcialmente descoberta"); (b) concentra o
"momento de aprendizado" (nome + microtexto) em um único evento, reforçando
a "regra pedagógica central" do documento de design; (c) mantém o desafio de
inferir a categoria pelas palavras até o fim, em vez de entregá-la de graça
após o primeiro acerto.

**Alternatives considered**: revelar o nome (sem o microtexto) já na
primeira carta aceita naquele slot — rejeitado por ora como complexidade
extra sem necessidade comprovada (Princípio IV); pode ser revisitado se o
Nível 1 se mostrar frustrante demais nos testes manuais.
