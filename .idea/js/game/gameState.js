// js/game/gameState.js - Gestione dello stato del gioco

class GameState {
    constructor() {
        this.reset();
    }

    reset() {
        this.currentPlayer = 1;
        this.phase = 'draw';
        this.turn = 1;
        this.selectedCard = null;
        this.selectedTarget = null;
        this.attackPhaseActive = false;
        this.gameStarted = false;
        this.gameEnded = false;
        this.winner = null;
        
        this.selectedDecks = {
            1: null,
            2: null
        };
        
        this.players = {
            1: this.createPlayer(),
            2: this.createPlayer()
        };
    }

    createPlayer() {
        return {
            health: 20,
            energy: 1,
            maxEnergy: 1,
            hand: [],
            deck: [],
            frontLine: [],
            backLine: [],
            structures: [],
            playedThisTurn: false
        };
    }

    // Getters per accesso rapido
    getCurrentPlayer() {
        return this.players[this.currentPlayer];
    }

    getOpponent() {
        const opponentId = this.currentPlayer === 1 ? 2 : 1;
        return this.players[opponentId];
    }

    getOpponentId() {
        return this.currentPlayer === 1 ? 2 : 1;
    }

    // Validazioni
    canPlayCard(card) {
        if (!card || this.phase !== 'main' || this.gameEnded) {
            return false;
        }

        const player = this.getCurrentPlayer();
        
        // Controlla energia
        if (card.cost > player.energy) {
            return false;
        }

        // Controlla spazio per personaggi
        if (card.type === 'Personaggio') {
            const targetZone = this.getTargetZone(card);
            if (targetZone.length >= 4) {
                return false;
            }
        }

        // Controlla spazio per strutture
        if (card.type === 'Struttura') {
            if (player.structures.length >= 3) {
                return false;
            }
        }

        return true;
    }

    getTargetZone(card) {
        const player = this.getCurrentPlayer();
        
        if (card.type === 'Personaggio') {
            // I Guerrieri vanno in prima linea per default
            if (card.class === 'Guerriero') {
                return player.frontLine;
            } else {
                return player.backLine;
            }
        } else if (card.type === 'Struttura') {
            return player.structures;
        }
        
        return null;
    }

    canAttack() {
        if (this.phase !== 'main' || this.gameEnded) {
            return false;
        }

        const player = this.getCurrentPlayer();
        return player.frontLine.length > 0 || player.backLine.length > 0;
    }

    // Gestione turni
    switchPlayer() {
        this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
        this.turn++;
        this.phase = 'draw';
        this.selectedCard = null;
        this.selectedTarget = null;
        this.attackPhaseActive = false;
        
        // Reset flag di giocata
        this.getCurrentPlayer().playedThisTurn = false;
    }

    // Gestione fasi
    setPhase(newPhase) {
        const validPhases = ['draw', 'energy', 'main', 'attack', 'end'];
        if (validPhases.includes(newPhase)) {
            this.phase = newPhase;
        }
    }

    // Controllo vittoria
    checkWinCondition() {
        if (this.players[1].health <= 0) {
            this.gameEnded = true;
            this.winner = 2;
            return 2;
        }
        
        if (this.players[2].health <= 0) {
            this.gameEnded = true;
            this.winner = 1;
            return 1;
        }

        // Controllo mazzo vuoto (opzionale)
        if (this.players[1].deck.length === 0 && this.players[1].hand.length === 0) {
            this.gameEnded = true;
            this.winner = 2;
            return 2;
        }
        
        if (this.players[2].deck.length === 0 && this.players[2].hand.length === 0) {
            this.gameEnded = true;
            this.winner = 1;
            return 1;
        }
        
        return null;
    }

    // Utility per debugging
    getGameStateSnapshot() {
        return {
            currentPlayer: this.currentPlayer,
            turn: this.turn,
            phase: this.phase,
            gameStarted: this.gameStarted,
            gameEnded: this.gameEnded,
            winner: this.winner,
            player1: {
                health: this.players[1].health,
                energy: this.players[1].energy,
                handSize: this.players[1].hand.length,
                deckSize: this.players[1].deck.length,
                boardSize: this.players[1].frontLine.length + this.players[1].backLine.length + this.players[1].structures.length
            },
            player2: {
                health: this.players[2].health,
                energy: this.players[2].energy,
                handSize: this.players[2].hand.length,
                deckSize: this.players[2].deck.length,
                boardSize: this.players[2].frontLine.length + this.players[2].backLine.length + this.players[2].structures.length
            }
        };
    }

    // Validazione stato
    isValidState() {
        // Controlli di base per validare lo stato del gioco
        if (this.currentPlayer !== 1 && this.currentPlayer !== 2) {
            return false;
        }

        if (this.players[1].health < 0 || this.players[2].health < 0) {
            return false;
        }

        if (this.players[1].energy < 0 || this.players[2].energy < 0) {
            return false;
        }

        // Controlla limiti zone
        if (this.players[1].frontLine.length > 4 || this.players[1].backLine.length > 4 || this.players[1].structures.length > 3) {
            return false;
        }

        if (this.players[2].frontLine.length > 4 || this.players[2].backLine.length > 4 || this.players[2].structures.length > 3) {
            return false;
        }

        return true;
    }
}

// Istanza globale dello stato del gioco
const gameState = new GameState();

// Esporta per l'uso in altri file
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GameState, gameState };
}