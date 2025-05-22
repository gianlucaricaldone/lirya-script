// game-state.js - Gestione dello stato del gioco
class GameState {
    constructor() {
        this.reset();
    }

    reset() {
        this.currentPhase = 'setup'; // setup, main, combat_declare, combat_block, combat_damage, end
        this.currentPlayer = 1;
        this.turnNumber = 1;
        this.winner = null;
        
        // Stato dei giocatori
        this.players = {
            1: this.createPlayerState(1),
            2: this.createPlayerState(2)
        };
        
        // Storico delle azioni per undo/redo
        this.actionHistory = [];
        
        // Stack di effetti da risolvere
        this.effectStack = [];
        
        // Carte selezionate per interazioni
        this.selectedCard = null;
        this.targetingMode = false;
        this.validTargets = [];
        
        // Stato del combattimento
        this.combat = {
            attackers: [], // [{card, playerId, zone, position, target}]
            blockers: [], // [{card, playerId, zone, position, blocking}]
            declaredAttackers: false,
            declaredBlockers: false
        };
    }

    createPlayerState(playerId) {
        return {
            id: playerId,
            name: `Giocatore ${playerId}`,
            life: 20,
            energy: 0,
            maxEnergy: 0,
            deck: [],
            hand: [],
            firstLine: [null, null, null, null],
            secondLine: [null, null, null, null],
            structures: [null, null, null],
            graveyard: [],
            deckInfo: null, // Info sul mazzo scelto
            isAI: false
        };
    }

    // Getters per accesso rapido
    getActivePlayer() {
        return this.players[this.currentPlayer];
    }

    getOpponent() {
        return this.players[this.currentPlayer === 1 ? 2 : 1];
    }

    getPlayer(playerId) {
        return this.players[playerId];
    }

    // Gestione delle zone
    getZone(playerId, zoneName) {
        const player = this.players[playerId];
        switch(zoneName) {
            case 'hand': return player.hand;
            case 'firstLine': return player.firstLine;
            case 'secondLine': return player.secondLine;
            case 'structures': return player.structures;
            case 'graveyard': return player.graveyard;
            case 'deck': return player.deck;
            default: return null;
        }
    }

    // Posiziona una carta in una zona
    placeCard(playerId, card, zoneName, position = null) {
        const zone = this.getZone(playerId, zoneName);
        if (!zone) return false;

        if (Array.isArray(zone)) {
            if (position !== null && zone[position] === null) {
                zone[position] = card;
                return true;
            } else if (position === null) {
                // Trova il primo slot libero
                for (let i = 0; i < zone.length; i++) {
                    if (zone[i] === null) {
                        zone[i] = card;
                        return true;
                    }
                }
            }
        }
        return false;
    }

    // Rimuove una carta da una zona
    removeCard(playerId, zoneName, position) {
        const zone = this.getZone(playerId, zoneName);
        if (!zone || !zone[position]) return null;

        const card = zone[position];
        zone[position] = null;
        return card;
    }

    // Muove una carta tra zone
    moveCard(fromPlayerId, fromZone, fromPosition, toPlayerId, toZone, toPosition = null) {
        const card = this.removeCard(fromPlayerId, fromZone, fromPosition);
        if (!card) return false;

        const placed = this.placeCard(toPlayerId, card, toZone, toPosition);
        if (!placed) {
            // Ripristina la carta se non può essere posizionata
            this.placeCard(fromPlayerId, card, fromZone, fromPosition);
            return false;
        }
        return true;
    }

    // Pesca carte dal mazzo
    drawCards(playerId, count) {
        const player = this.players[playerId];
        const drawnCards = [];

        for (let i = 0; i < count; i++) {
            if (player.deck.length > 0 && player.hand.length < 10) {
                const card = player.deck.shift();
                player.hand.push(card);
                drawnCards.push(card);
            }
        }

        return drawnCards;
    }

    // Mescola il mazzo
    shuffleDeck(playerId) {
        const deck = this.players[playerId].deck;
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }
    }

    // Gestione energia
    addEnergy(playerId, amount) {
        const player = this.players[playerId];
        player.energy = Math.min(player.energy + amount, player.maxEnergy);
    }

    spendEnergy(playerId, amount) {
        const player = this.players[playerId];
        if (player.energy >= amount) {
            player.energy -= amount;
            return true;
        }
        return false;
    }

    increaseMaxEnergy(playerId) {
        const player = this.players[playerId];
        if (player.maxEnergy < 10) {
            player.maxEnergy++;
            player.energy = player.maxEnergy; // Ricarica completa a inizio turno
        }
    }

    // Gestione vita
    dealDamage(playerId, amount) {
        const player = this.players[playerId];
        player.life = Math.max(0, player.life - amount);
        
        if (player.life <= 0) {
            this.winner = playerId === 1 ? 2 : 1;
        }
    }

    healPlayer(playerId, amount) {
        const player = this.players[playerId];
        player.life = Math.min(20, player.life + amount);
    }

    // Cambia turno
    switchTurn() {
        this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
        if (this.currentPlayer === 1) {
            this.turnNumber++;
        }
    }

    // Verifica se il gioco è finito
    isGameOver() {
        return this.winner !== null;
    }

    // Conta carte in una zona
    countCards(playerId, zoneName) {
        const zone = this.getZone(playerId, zoneName);
        if (!zone) return 0;
        return zone.filter(card => card !== null).length;
    }

    // Ottieni tutte le creature in campo
    getAllCreatures(playerId = null) {
        const creatures = [];
        const playerIds = playerId ? [playerId] : [1, 2];

        for (const pid of playerIds) {
            const player = this.players[pid];
            
            // Prima linea
            player.firstLine.forEach((card, index) => {
                if (card && card.type === 'Personaggio') {
                    creatures.push({
                        card,
                        playerId: pid,
                        zone: 'firstLine',
                        position: index
                    });
                }
            });

            // Seconda linea
            player.secondLine.forEach((card, index) => {
                if (card && card.type === 'Personaggio') {
                    creatures.push({
                        card,
                        playerId: pid,
                        zone: 'secondLine',
                        position: index
                    });
                }
            });
        }

        return creatures;
    }

    // Serializza lo stato per salvataggio
    serialize() {
        return JSON.stringify({
            currentPhase: this.currentPhase,
            currentPlayer: this.currentPlayer,
            turnNumber: this.turnNumber,
            players: this.players,
            actionHistory: this.actionHistory
        });
    }

    // Deserializza lo stato da un salvataggio
    deserialize(data) {
        const state = JSON.parse(data);
        this.currentPhase = state.currentPhase;
        this.currentPlayer = state.currentPlayer;
        this.turnNumber = state.turnNumber;
        this.players = state.players;
        this.actionHistory = state.actionHistory || [];
    }
}

// Esporta per uso globale
window.GameState = GameState;