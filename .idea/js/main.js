// js/main.js - File principale di inizializzazione

// Import delle dipendenze (se necessario per moduli)
// const { gameLogic } = require('./game/gameLogic.js');
// const { uiManager } = require('./ui/uiManager.js');

// Variabili globali
let setupComplete = false;

// Inizializzazione principale
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎮 Lirya CCG - Inizializzazione...');
    
    try {
        initializeEventListeners();
        initializeGameEvents();
        initializeSetup();
        
        console.log('✅ Inizializzazione completata');
    } catch (error) {
        console.error('❌ Errore durante l\'inizializzazione:', error);
        showError('Errore durante l\'inizializzazione del gioco');
    }
});

// Setup degli event listeners per l'UI
function initializeEventListeners() {
    // Eventi globali della finestra
    window.addEventListener('resize', handleWindowResize);
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    // Event listeners per i controlli del gioco (definiti nell'HTML)
    document.getElementById('start-game').addEventListener('click', handleStartGame);
    document.getElementById('btn-play-card').addEventListener('click', handlePlayCard);
    document.getElementById('btn-attack').addEventListener('click', handleAttackPhase);
    document.getElementById('btn-end-turn').addEventListener('click', handleEndTurn);
}

// Setup degli eventi del motore di gioco
function initializeGameEvents() {
    // Eventi di gioco
    gameLogic.on('gameStarted', handleGameStarted);
    gameLogic.on('gameEnded', handleGameEnded);
    gameLogic.on('gameStateChanged', handleGameStateChanged);
    gameLogic.on('turnStarted', handleTurnStarted);
    gameLogic.on('phaseChanged', handlePhaseChanged);
    
    // Eventi delle carte
    gameLogic.on('cardPlayed', handleCardPlayed);
    gameLogic.on('cardDrawn', handleCardDrawn);
    gameLogic.on('cardSelected', handleCardSelected);
    gameLogic.on('cardDestroyed', handleCardDestroyed);
    
    // Eventi di log e errori
    gameLogic.on('logMessage', handleLogMessage);
    gameLogic.on('error', handleError);
    gameLogic.on('invalidMove', handleInvalidMove);
}

// Inizializzazione del setup
function initializeSetup() {
    createDeckSelection();
    showSetupScreen();
}

// === GESTORI EVENTI PRINCIPALI ===

function handleStartGame() {
    if (!gameState.selectedDecks[1] || !gameState.selectedDecks[2]) {
        showError('Seleziona un mazzo per entrambi i giocatori');
        return;
    }
    
    const success = gameLogic.initializeGame(
        gameState.selectedDecks[1], 
        gameState.selectedDecks[2]
    );
    
    if (success) {
        hideSetupScreen();
        showGameScreen();
        setupComplete = true;
    }
}

function handlePlayCard() {
    if (!gameState.selectedCard) {
        showError('Seleziona una carta da giocare');
        return;
    }
    
    gameLogic.playCard(gameState.selectedCard);
}

function handleAttackPhase() {
    gameLogic.startAttackPhase();
}

function handleEndTurn() {
    gameLogic.endTurn();
}

// === GESTORI EVENTI DI GIOCO ===

function handleGameStarted(data) {
    console.log('🎮 Partita iniziata:', data);
    uiManager.updatePlayerNames(data.player1Deck, data.player2Deck);
    uiManager.updateUI();
}

function handleGameEnded(data) {
    console.log('🏆 Partita terminata:', data);
    setTimeout(() => {
        alert(`🏆 Giocatore ${data.winner} vince la partita!`);
        askForNewGame();
    }, 1000);
}

function handleGameStateChanged() {
    uiManager.updateUI();
}

function handleTurnStarted(data) {
    console.log(`🔄 Turno ${gameState.turn} - Giocatore ${data.player}`);
    uiManager.updateTurnIndicator();
}

function handlePhaseChanged(data) {
    uiManager.updatePhaseIndicator(data.phase);
}

function handleCardPlayed(data) {
    console.log('🃏 Carta giocata:', data);
    // Animazione di giocata carta se necessaria
    if (typeof cardRenderer !== 'undefined') {
        cardRenderer.animateCardPlay(data.card);
    }
}

function handleCardDrawn(data) {
    console.log('📥 Carta pescata:', data);
    // Animazione di pesca carta se necessaria
    if (typeof cardRenderer !== 'undefined') {
        cardRenderer.animateCardDraw(data.card, data.playerId);
    }
}

function handleCardSelected(data) {
    console.log('👆 Carta selezionata:', data);
    uiManager.updateCardSelection(data.card);
}

function handleCardDestroyed(data) {
    console.log('💀 Carta distrutta:', data);
    // Animazione di distruzione se necessaria
    if (typeof cardRenderer !== 'undefined') {
        cardRenderer.animateCardDestroy(data.card);
    }
}

function handleLogMessage(message) {
    uiManager.addLogEntry(message);
}

function handleError(data) {
    console.error('❌ Errore di gioco:', data);
    showError(data.message || 'Errore sconosciuto');
}

function handleInvalidMove(data) {
    console.warn('⚠️ Mossa non valida:', data);
    showWarning(data.reason || 'Mossa non valida');
}

// === SETUP E SELEZIONE MAZZI ===

function createDeckSelection() {
    const deckNames = Object.keys(deckDatabase);
    
    [1, 2].forEach(playerNum => {
        const container = document.getElementById(`player${playerNum}-decks`);
        if (!container) return;
        
        container.innerHTML = '';
        
        deckNames.forEach(deckKey => {
            const deck = deckDatabase[deckKey];
            const deckCard = document.createElement('div');
            deckCard.className = 'deck-card';
            deckCard.onclick = () => selectDeck(playerNum, deckKey, deckCard);
            
            deckCard.innerHTML = `
                <div class="deck-name">${deck.name}</div>
                <div class="deck-strategy">${deck.strategy}</div>
                <div class="deck-elements">${deck.elements}</div>
            `;
            
            container.appendChild(deckCard);
        });
    });
}

function selectDeck(player, deckKey, element) {
    // Rimuovi selezione precedente per questo giocatore
    const container = document.getElementById(`player${player}-decks`);
    container.querySelectorAll('.deck-card').forEach(el => 
        el.classList.remove('selected')
    );
    
    // Seleziona nuovo mazzo
    element.classList.add('selected');
    gameState.selectedDecks[player] = deckKey;
    
    // Mostra indicatore ready
    const readyIndicator = document.getElementById(`p${player}-ready`);
    if (readyIndicator) {
        readyIndicator.style.display = 'block';
    }
    
    // Controlla se entrambi i giocatori hanno scelto
    updateStartButton();
}

function updateStartButton() {
    const startButton = document.getElementById('start-game');
    if (startButton) {
        startButton.disabled = !gameState.selectedDecks[1] || !gameState.selectedDecks[2];
    }
}

// === GESTIONE SCHERMATA ===

function showSetupScreen() {
    const setupScreen = document.getElementById('setup-screen');
    const gameContainer = document.getElementById('game-container');
    const gameLog = document.getElementById('game-log');
    
    if (setupScreen) setupScreen.classList.remove('hidden');
    if (gameContainer) gameContainer.classList.add('hidden');
    if (gameLog) gameLog.classList.add('hidden');
}

function hideSetupScreen() {
    const setupScreen = document.getElementById('setup-screen');
    if (setupScreen) setupScreen.classList.add('hidden');
}

function showGameScreen() {
    const gameContainer = document.getElementById('game-container');
    const gameLog = document.getElementById('game-log');
    
    if (gameContainer) gameContainer.classList.remove('hidden');
    if (gameLog) gameLog.classList.remove('hidden');
}

// === GESTIONE EVENTI FINESTRA ===

function handleWindowResize() {
    // Adatta l'UI alle dimensioni della finestra
    if (setupComplete && typeof uiManager !== 'undefined') {
        uiManager.handleResize();
    }
}

function handleBeforeUnload(event) {
    if (gameState.gameStarted && !gameState.gameEnded) {
        event.preventDefault();
        event.returnValue = 'Sei sicuro di voler lasciare la partita?';
        return event.returnValue;
    }
}

// === UTILITY E FEEDBACK ===

function showError(message) {
    console.error('❌', message);
    // Implementa notifica visiva dell'errore
    alert('❌ Errore: ' + message);
}

function showWarning(message) {
    console.warn('⚠️', message);
    // Implementa notifica visiva del warning
    if (typeof uiManager !== 'undefined') {
        uiManager.showTemporaryMessage(message, 'warning');
    }
}

function showSuccess(message) {
    console.log('✅', message);
    // Implementa notifica visiva del successo
    if (typeof uiManager !== 'undefined') {
        uiManager.showTemporaryMessage(message, 'success');
    }
}

function askForNewGame() {
    setTimeout(() => {
        if (confirm('Vuoi iniziare una nuova partita?')) {
            resetGame();
        }
    }, 2000);
}

function resetGame() {
    // Reset completo del gioco
    gameState.reset();
    showSetupScreen();
    setupComplete = false;
    
    // Pulisci selezioni precedenti
    document.querySelectorAll('.deck-card.selected').forEach(el => 
        el.classList.remove('selected')
    );
    document.querySelectorAll('.ready-indicator').forEach(el => 
        el.style.display = 'none'
    );
    
    updateStartButton();
    
    console.log('🔄 Gioco resettato');
}

// === FUNZIONI GLOBALI (per compatibilità con HTML) ===

// Queste funzioni sono chiamate direttamente dall'HTML
window.startGame = handleStartGame;
window.playSelectedCard = handlePlayCard;
window.startAttackPhase = handleAttackPhase;
window.endTurn = handleEndTurn;
window.selectDeck = selectDeck;

// Esporta funzioni principali per debug/testing
window.gameDebug = {
    gameState,
    gameLogic,
    resetGame,
    showError,
    showWarning,
    showSuccess
};

console.log('📝 main.js caricato');