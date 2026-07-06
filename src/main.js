// @ts-check
import { loadDeck, loadPrinciples } from "./data/loader.js";
import { buildDeck, shuffleDeck } from "./engine/deck.js";
import { checkWin, hasNoValidMoves } from "./engine/win.js";
import { createProgressStore } from "./progress/store.js";
import { renderBoard } from "./ui/board.js";
import { renderReviewMode } from "./ui/review-mode.js";

// Elementos do DOM
const gameRoot = document.getElementById("game-root");
const reviewRoot = document.getElementById("review-root");
const newGameBtn = document.getElementById("new-game-btn");
const reviewModeBtn = document.getElementById("review-mode-btn");

// Dados e stores globais
/** @type {any[]} */
let cardsData = [];
/** @type {any[]} */
let principlesData = [];
/** @type {Record<string, { axis: string, shortLabel: string }>} */
let themesMeta = {};
/** @type {Map<string, any>} */
const cardsMap = new Map();
let progressStore = createProgressStore();
let gameState = null;

// Inicialização da aplicação
async function init() {
  try {
    // 1. Carregar dados das cartas e dos princípios
    const deckResult = await loadDeck("src/data/cards.servico-social-estreia.json");
    cardsData = deckResult.cards;
    themesMeta = deckResult.themes;

    // Mapear cartas por ID para consulta rápida na UI
    cardsData.forEach((c) => cardsMap.set(c.id, c));

    principlesData = await loadPrinciples("src/data/principles.json");
    
    // Expor princípios globalmente para uso no toast do board.js
    // @ts-ignore
    window.currentPrinciples = principlesData;

    // 2. Adicionar listeners nos controles principais
    newGameBtn?.addEventListener("click", () => {
      startNewGame();
    });

    reviewModeBtn?.addEventListener("click", () => {
      switchToReviewMode();
    });

    // 3. Iniciar a primeira partida automaticamente ao carregar
    startNewGame();
  } catch (error) {
    console.error("Erro ao inicializar o jogo:", error);
    if (gameRoot) {
      gameRoot.innerHTML = `<div style="padding: 2rem; text-align: center; color: var(--color-red);">
        <h2>Erro de Carregamento</h2>
        <p>Não foi possível iniciar o jogo. Verifique o console para mais detalhes.</p>
      </div>`;
    }
  }
}

// Inicia uma nova partida
function startNewGame() {
  // Fechar qualquer overlay de status anterior
  removeStatusOverlay();

  // Mudar visibilidade de telas
  gameRoot?.removeAttribute("hidden");
  reviewRoot?.setAttribute("hidden", "true");
  
  // Atualizar visual do botão ativo
  reviewModeBtn?.classList.remove("active");

  const engineDeck = buildDeck(cardsData);
  const shuffled = shuffleDeck(engineDeck);
  
  // Converter deck para estrutura de UI com propriedade faceUp
  const uiDeck = shuffled.map((c) => ({ ...c, faceUp: false }));
  
  // Distribuir cartas no tableau (1 a 7 cartas por coluna)
  const tableau = [];
  let cardIdx = 0;
  for (let i = 0; i < 7; i++) {
    const column = [];
    for (let j = 0; j < i + 1; j++) {
      const card = uiDeck[cardIdx++];
      if (j === i) {
        card.faceUp = true;
        // Marcar cartas iniciais abertas como reveladas no progresso
        progressStore.revealCard(card.id);
      }
      column.push(card);
    }
    tableau.push(column);
  }

  const stock = uiDeck.slice(cardIdx);
  const waste = [];
  const foundations = {
    "teorico-metodologico": [],
    "etico-politico": [],
    "tecnico-operativo": [],
    "historico-formativo": [],
  };

  gameState = {
    tableau,
    stock,
    waste,
    foundations,
    status: "em_andamento"
  };

  updateUI();
}

// Atualiza a renderização do tabuleiro e valida condições de fim de jogo
function updateUI() {
  if (!gameRoot || !gameState) return;

  // Renderizar o tabuleiro
  renderBoard(gameRoot, gameState, cardsMap, progressStore, () => {
    // Callback executado a cada mudança de estado
    checkGameStatus();
    updateUI();
  }, themesMeta);
}

// Verifica vitória ou derrota (sem jogadas possíveis)
function checkGameStatus() {
  if (!gameState) return;

  // 1. Verificar Vitória
  if (checkWin(gameState.foundations)) {
    gameState.status = "vitoria";
    showStatusOverlay(
      "Vitória!",
      "Você organizou todas as fundações temáticas do Serviço Social Brasileiro! Todos os 11 princípios éticos fundamentais estão agora acessíveis no modo de revisão.",
      "Jogar Novamente"
    );
    return;
  }

  // 2. Verificar Derrota (Sem jogadas possíveis)
  if (hasNoValidMoves(gameState)) {
    gameState.status = "sem_jogadas";
    showStatusOverlay(
      "Partida Travada",
      "Não existem mais movimentos válidos possíveis nesta partida. O monte e o descarte foram esgotados.",
      "Tentar Novamente"
    );
  }
}

// Transiciona para o modo revisão
function switchToReviewMode() {
  gameRoot?.setAttribute("hidden", "true");
  reviewRoot?.removeAttribute("hidden");
  removeStatusOverlay();

  reviewModeBtn?.classList.add("active");

  if (reviewRoot) {
    renderReviewMode(reviewRoot, cardsData, principlesData, progressStore, () => {
      // Callback de retorno ao jogo
      gameRoot?.removeAttribute("hidden");
      reviewRoot?.setAttribute("hidden", "true");
      reviewModeBtn?.classList.remove("active");
      updateUI();
    }, themesMeta);
  }
}

// Exibe modal de fim de jogo (Vitória ou Derrota)
/**
 * @param {string} title
 * @param {string} message
 * @param {string} buttonText
 */
function showStatusOverlay(title, message, buttonText) {
  removeStatusOverlay();

  const overlay = document.createElement("div");
  overlay.id = "game-status-overlay";
  overlay.className = "game-status-overlay show";
  overlay.innerHTML = `
    <h2 class="game-status-title">${title}</h2>
    <p class="game-status-message">${message}</p>
    <button id="overlay-action-btn" type="button">${buttonText}</button>
  `;

  // Inserir antes do gameRoot ou diretamente no main para centralizar
  gameRoot?.appendChild(overlay);

  document.getElementById("overlay-action-btn")?.addEventListener("click", () => {
    startNewGame();
  });
}

// Remove o modal de fim de jogo
function removeStatusOverlay() {
  const overlay = document.getElementById("game-status-overlay");
  overlay?.remove();
}

// Inicializar aplicativo
document.addEventListener("DOMContentLoaded", init);
// Garantir execução se o DOM já estiver pronto
if (document.readyState === "interactive" || document.readyState === "complete") {
  init();
}
