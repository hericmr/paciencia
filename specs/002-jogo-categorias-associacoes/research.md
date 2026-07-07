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

## Decisão 8: Cartas-título enterradas no tableau (reintroduz empilhamento)

**Decision**: cada categoria ganha uma **carta-título** própria
(`cartaTitulo`, campo do dado de categoria) que é uma carta como qualquer
outra dentro do baralho do nível — não um slot pré-existente. Uma categoria
só aceita cartas de palavra depois que sua carta-título for encontrada e
jogada no slot correspondente. O tableau volta a ser empilhado por coluna,
como no Klondike original (feature 001): só a carta do topo de cada coluna
é visível/jogável; embaixo dela as cartas ficam viradas para baixo
(mostrando `assets/verso.png`) até serem descobertas. `profundidadeTitulos`
(`topo`\|`meio`\|`fundo`) controla a posição da carta-título dentro da
coluna em que ela foi inserida — quanto mais fundo, mais cartas precisam
ser retiradas de cima dela antes de aparecer.

Confirmado com o mantenedor: (1) tableau empilhado tipo Klondike; (2) uma
carta de palavra cuja categoria ainda não abriu pode ser movida para o topo
de **outra** coluna sem nenhuma regra de compatibilidade — serve só para
desobstruir o caminho até uma carta enterrada; (3) jogar uma carta-título
(abrindo a categoria) consome 1 movimento, exatamente como classificar uma
palavra (certo ou errado).

**Rationale**: aproxima o jogo de volta da mecânica de "desenterrar" que
dava tensão ao Klondike original, mas mantém a camada pedagógica de
categorias por cima — agora "vencer" exige tanto raciocínio de classificação
quanto gestão de espaço/movimentos para desenterrar as 4 cartas-título a
tempo.

**Decisões de implementação (não especificadas pelo mantenedor, escolhidas
para fechar o algoritmo)**:
- `cartaTitulo` de cada categoria usa o próprio `nome` da categoria como
  texto de exibição (é o que a pessoa vê ao desenterrar a carta, antes de
  jogá-la — funciona como a "resposta" que ela vai confirmar ao jogar).
- Sem monte/descarte: todas as `totalCards` (títulos + palavras) do nível
  são distribuídas diretamente entre as `columns` colunas (round-robin), sem
  pilha de reserva. O esquema do mantenedor não menciona monte, então optou-se
  pela opção mais simples (Princípio IV).
- Mapeamento de profundidade: dentro da coluna em que uma carta-título cai,
  `topo` a posiciona como uma das últimas cartas empilhadas (acessível cedo),
  `fundo` como uma das primeiras (bem enterrada), `meio` no meio da pilha.

**Alternatives considered**: manter o tableau "tudo solto" e usar
`profundidadeTitulos` só como peso de sorteio (cogitado na pergunta de
esclarecimento, não escolhido); dar à carta-título um texto próprio distinto
do `nome` (mais trabalho de conteúdo sem necessidade clara agora).

## Decisão 9: Feedback sonoro com o pacote Kenney Casino Audio (CC0)

**Decision**: o jogo ganha efeitos sonoros curtos para os eventos do
tableau, usando os arquivos `.ogg` já presentes em
`assets/kenney_casino-audio/Audio/` (pacote "Casino Audio" de Kenney
Vleugels, licença CC0 — ver `assets/kenney_casino-audio/License.txt`, sem
exigência de atribuição). Mapeamento:

| Evento | Som |
|---|---|
| Carta aceita num slot de categoria (palavra certa ou carta-título abrindo a categoria) | `card-place-{1..4}.ogg` (variante aleatória) |
| Carta rejeitada (volta ao topo da coluna) ou movida para desobstruir outra coluna | `card-slide-{1..8}.ogg` (variante aleatória) |
| Categoria completada (pop-up de micro-texto abre) | `cards-pack-open-{1..2}.ogg` |
| Distribuição inicial das cartas ao carregar/reiniciar um nível | `card-shuffle.ogg` (uma vez, junto com a animação de "virar" já existente) |

**Rationale**: reforça o feedback tátil de cada ação (acerto, erro,
conquista) sem depender de texto extra; o pacote já está no repositório,
é CC0 (Princípio IV — zero custo de licença/manutenção) e cobre exatamente
os eventos de "cartas" que o jogo tem.

**Decisões de implementação**:
- `src/audio/sound-manager.js`: módulo isolado, mesma forma de factory de
  `src/progress/store.js` (`createSoundManager({ storage, AudioCtor, rng })`
  com injeção de dependências para ser testável sem áudio real nem DOM).
- Alternância entre variantes do mesmo evento é aleatória (`rng` injetável
  nos testes) só para evitar repetição perceptível; não afeta a lógica do
  jogo.
- **Mute é obrigatório e persistente** (Princípio V — acessibilidade):
  botão no cabeçalho (🔊/🔇), estado salvo em `localStorage`
  (`paciencia_ss.audio.muted`), começa **ativado com som** por padrão. Nenhuma
  informação do jogo é comunicada exclusivamente por som — áudio é reforço,
  nunca portador de informação obrigatória.
- Falha ao tocar (autoplay bloqueado pelo navegador, `Audio` indisponível em
  ambiente de teste) é silenciosamente ignorada — nunca lança erro visível
  ao jogador.

**Alternatives considered**: sintetizar sons via Web Audio API em vez de
arquivos — descartado, o pacote pronto já cobre os eventos com qualidade
melhor e zero código extra (Princípio IV); música de fundo contínua —
descartada por ora, fora do escopo pedido (só efeitos pontuais de
interação).

## Decisão 10: Slots de categoria no formato de carta (Paciência física)

**Decision**: Refatorar os slots de categoria para que tenham o mesmo formato e proporção das cartas do jogo (`aspect-ratio: 2.5 / 3.5`, max-width: `140px`). Quando a carta-título ou cartas de palavras forem colocadas no spot, elas são empilhadas fisicamente de forma absoluta no spot (com um deslocamento vertical de `8px`), imitando a pilha de fundação de um jogo de paciência real. Os títulos e o progresso das categorias passam a ser exibidos em um cabeçalho logo acima do spot.

**Rationale**: Alinha-se diretamente com o feedback do usuário de que os slots devem se comportar como os de um jogo de paciência física. Isso melhora a experiência de "encaixe" tátil das cartas e torna a visualização das cartas classificadas muito mais natural do que o uso de mini-cards de texto condensado.

## Decisão 11: Mais categorias no nível com limite fixo de 4 spots dinâmicos e cartas totalmente embaralhadas

**Decision**: 
1. **Embaralhamento total de cartas**: Permitir a opção `"embaralhado"` para a profundidade das cartas-título, o que faz com que as cartas-título e as cartas de palavras sejam misturadas juntas e distribuídas de forma 100% aleatória no tableau desde o início, podendo ficar enterradas a qualquer profundidade.
2. **Spots dinâmicos não pre-alocados**: Manter exatamente 4 spots/slots de categoria visíveis no topo da tela, mas desvinculá-los de categorias fixas no início do nível. Qualquer carta-título revelada pode ser solta em qualquer spot vazio, vinculando aquele spot à respectiva categoria de forma dinâmica.
3. **Mais categorias configuradas**: Incluir 7 categorias no nível de dados do Nível 1. Como há apenas 4 spots disponíveis, o jogador resolve 4 das 7 categorias presentes para alcançar a vitória.

**Rationale**: Alinha-se perfeitamente com os novos requisitos solicitados. A mistura completa de cartas simula a tensão e a necessidade de desobstrução de colunas de um Solitaire tradicional, e a presença de mais categorias com apenas 4 spots adiciona um elemento estratégico de escolha e distração (red herrings/pegadinhas), aumentando o desafio cognitivo e a rejogabilidade.

**Decision**: Reintroduzir as pilhas de Monte (Stock) e Descarte (Waste) no topo esquerdo do tabuleiro, alinhados horizontalmente em uma grade de 6 colunas junto com os 4 spots de categoria (que ocupam as 4 colunas da direita), e estruturar o tableau em **exatamente 4 colunas** com uma distribuição em cascata (cascata de Paciência).
1. No início do nível no modo `"embaralhado"`, distribuímos as cartas de forma crescente nas 4 colunas do tableau:
   - Coluna 0: 2 cartas (1 fechada, 1 aberta)
   - Coluna 1: 3 cartas (2 fechadas, 1 aberta)
   - Coluna 2: 4 cartas (3 fechadas, 1 aberta)
   - Coluna 3: 5 cartas (4 fechadas, 1 aberta)
   - Total no Tableau: 14 cartas.
2. As **14 cartas restantes** (do total de 28 cartas das 7 categorias) são alocadas como monte de compras/circulação (Monte) viradas para baixo.
3. Clicar no Monte retira uma carta e a coloca no Descarte virada para cima.
4. Se o Monte esvaziar, clicar nele recicla a pilha de Descarte de volta para o Monte.
5. A carta do topo do Descarte é jogável, podendo ser arrastada ou selecionada para ser movida para qualquer uma das colunas do tableau ou spots de categoria corretos.

**Rationale**: Alinha-se perfeitamente com o feedback de que o jogo precisa de exatamente 4 colunas de tableau com uma quantidade crescente de cartas por baixo (pirâmide/cascata clássica da Paciência) para dar a dinâmica real e desafiadora de desenterrar cartas ocultas, mantendo um monte de circulação balanceado.

## Decisão 13: Regra de Empilhamento por Categorias no Tableau (Substitui Decisão 8)

**Decision**: Alterar a regra de desobstrução de colunas do tableau para restringir o empilhamento. Uma carta do topo de uma coluna ou descarte só pode ser empilhada sobre outra coluna do tableau se a coluna destino estiver vazia ou se a carta do topo da coluna destino pertencer à mesma categoria (`categoryId`).
- Se a coluna destino estiver vazia, qualquer carta é aceita.
- Se a coluna destino possuir cartas, a carta movida só é aceita se sua categoria corresponder exatamente à categoria da carta que está no topo da coluna destino.
- Movimentos aceitos em colunas agora tocam o efeito sonoro de sucesso (`cardPlace`), e movimentos rejeitados tocam o som de arraste/rejeição (`cardMove`).

**Rationale**: Alinha-se diretamente com o feedback do usuário de que o tableau deve permitir empilhar cartas de forma livre, porém estruturada por categoria, mimetizando a dinâmica e o desafio de ordenação do jogo de Paciência tradicional (onde empilha-se por naipes/cores alternadas). Isso aumenta o desafio tático de desobstrução, já que o jogador precisa planejar onde "estacionar" as cartas corretas para liberar as cartas fechadas sob elas.

## Decisão 14: Finalização de grupo libera o spot imediatamente

**Decision**: quando um spot de categoria atinge `cardsInSlot.length ===
cardsPerCategory` (grupo finalizado), o spot é liberado no mesmo instante,
sem exigir nenhuma ação extra do jogador: `levelState.spotCategories[spotIndex]
= null`. Na renderização seguinte, esse spot volta ao estado "fechado"
(🔒 Categoria N) e aceita normalmente a carta-título de qualquer categoria
ainda não aberta. As cartas já aceitas continuam intactas em
`levelState.slots[categoryId]` — só a **ocupação do spot** muda, não o
registro de conclusão (usado por `checkLevelWin`).

**Rationale**: com mais categorias no nível do que spots disponíveis
(Decisão 11: 7 categorias, 4 spots), travar um spot permanentemente na
categoria que o abriu primeiro desperdiçaria spots preciosos assim que
aquele grupo fechasse — o jogador ficaria sem como abrir as categorias
restantes. Reciclar o spot no instante da finalização mantém os 4 spots
sempre disponíveis para o conjunto de categorias ainda incompletas,
sem alterar nenhuma outra pilha do tabuleiro.

**Decisões de implementação**:
- A liberação acontece dentro do mesmo bloco que já dispara o som
  `categoryComplete` e o pop-up de micro-texto (`src/ui/level-board.js`,
  `attemptMoveToCategory`) — um único ponto de mutação, sem novo estado
  paralelo.
- `checkLevelWin`/`checkLevelLoss` (`src/engine/level-status.js`) não
  dependem de `spotCategories`, só de `levelState.slots`, então a
  contagem de categorias completas não é afetada pela reciclagem do spot.
- Não há como uma categoria já completa "voltar" a receber cartas: suas
  `cardsPerCategory` palavras já foram todas consumidas do tableau/monte
  no momento da conclusão, e sua carta-título já foi jogada uma única vez
  (não há segunda cópia no baralho).

**Alternatives considered**: manter o spot em estado "completo" permanente
e adicionar um botão explícito de "liberar spot" — rejeitado por exigir
ação extra do jogador sem ganho pedagógico, contrariando o requisito
explícito de atualização automática da interface.
