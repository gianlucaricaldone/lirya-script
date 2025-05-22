// js/game/gameLogic.js - Logica principale del gioco

class GameLogic {
    constructor() {
        this.eventCallbacks = {};
    }

    // Sistema di eventi
    on(event, callback) {
        if (!this.eventCallbacks[event]) {
            this.eventCallbacks[event] = [];
        }
        this.eventCallbacks[event].push(callback);
    }

    emit(event, data) {
        if (this.eventCallbacks[event]) {
            this.eventCallbacks[event].forEach(callback => callback(data));
        }
    }

    // Inizializzazione gioco
    initializeGame(deck1Key, deck2Key) {
        try {
            // Reset stato
            gameState.reset();
            
            // Assegna mazzi
            gameState.selectedDecks[1] = deck1Key;
            gameState.selectedDecks[2] = deck2Key;
            
            // Crea mazzi mescolati
            gameState.players[1].deck = this.shuffleDeck([...deckDatabase[deck1Key].cards]);
            gameState.players[2].deck = this.shuffleDeck([...deckDatabase[deck2Key].cards]);
            
            // Pesca mano iniziale (5 carte)
            for (let i = 0; i < 5; i++) {
                this.drawCard(1);
                this.drawCard(2);
            }
            
            gameState.gameStarted = true;
            
            this.emit('gameStarted', {
                player1Deck: deckDatabase[deck1Key].name,
                player2Deck: deckDatabase[deck2Key].name
            });
            
            this.emit('logMessage', `🎮 Partita iniziata!`);
            this.emit('logMessage', `🎮 Giocatore 1: ${deckDatabase[deck1Key].name}`);
            this.emit('logMessage', `🎮 Giocatore 2: ${deckDatabase[deck2Key].name}`);
            
            // Inizia il primo turno
            this.startTurn();
            
            return true;
        } catch (error) {
            console.error('Errore nell\'inizializzazione del gioco:', error);
            this.emit('error', { message: 'Errore nell\'inizializzazione del gioco' });
            return false;
        }
    }

    shuffleDeck(deck) {
        const shuffled = [...deck];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled.map((card, index) => ({
            ...card,
            id: Date.now() + Math.random() + index,
            currentHp: card.hp || undefined
        }));
    }

    // Gestione turni
    startTurn() {
        if (gameState.gameEnded) return;
        
        const currentPlayerId = gameState.currentPlayer;
        
        // Fase di pesca
        gameState.setPhase('draw');
        this.emit('phaseChanged', { phase: 'draw' });
        
        const drawnCard = this.drawCard(currentPlayerId);
        if (drawnCard) {
            this.emit('logMessage', `🃏 Giocatore ${currentPlayerId} pesca: ${drawnCard.name}`);
        }

        // Fase energia
        gameState.setPhase('energy');
        const player = gameState.getCurrentPlayer();
        player.maxEnergy = Math.min(10, player.maxEnergy + 1);
        player.energy = player.maxEnergy;
        
        this.emit('logMessage', `⚡ Giocatore ${currentPlayerId} ha ${player.energy} energia`);

        // Fase principale
        gameState.setPhase('main');
        this.emit('phaseChanged', { phase: 'main' });
        
        this.emit('turnStarted', { player: currentPlayerId });
        this.emit('gameStateChanged');
    }

    drawCard(playerId) {
        const player = gameState.players[playerId];
        if (player.deck.length > 0) {
            const card = player.deck.pop();
            player.hand.push(card);
            this.emit('cardDrawn', { playerId, card });
            return card;
        }
        return null;
    }

    // Giocare carte
    playCard(card) {
        if (!gameState.canPlayCard(card)) {
            this.emit('invalidMove', { reason: 'Impossibile giocare questa carta' });
            return false;
        }

        const currentPlayerId = gameState.currentPlayer;
        const player = gameState.getCurrentPlayer();

        try {
            // Rimuovi carta dalla mano
            const handIndex = player.hand.findIndex(c => c.id === card.id);
            if (handIndex === -1) {
                throw new Error('Carta non trovata in mano');
            }

            player.hand.splice(handIndex, 1);
            player.energy -= card.cost;
            player.playedThisTurn = true;

            // Posiziona la carta in base al tipo
            this.placeCard(card, player);

            this.emit('cardPlayed', { playerId: currentPlayerId, card });
            this.emit('logMessage', `✅ Giocatore ${currentPlayerId} gioca ${card.name}`);
            
            gameState.selectedCard = null;
            this.emit('gameStateChanged');
            
            return true;
        } catch (error) {
            console.error('Errore nel giocare la carta:', error);
            this.emit('error', { message: 'Errore nel giocare la carta' });
            return false;
        }
    }

    placeCard(card, player) {
        if (card.type === 'Personaggio') {
            // Controlla se c'è una zona forzata dal drag & drop
            let targetZone;
            if (card.forcedZone === 'frontLine') {
                targetZone = player.frontLine;
            } else if (card.forcedZone === 'backLine') {
                targetZone = player.backLine;
            } else {
                // Logica normale: Guerrieri in prima linea, altri in seconda
                targetZone = (card.class === 'Guerriero') ? player.frontLine : player.backLine;
            }
            
            card.currentHp = card.hp;
            targetZone.push(card);
            
        } else if (card.type === 'Struttura') {
            card.currentHp = card.hp;
            player.structures.push(card);
            this.emit('logMessage', `🏗️ Giocatore ${gameState.currentPlayer} costruisce ${card.name}`);
            
        } else if (card.type === 'Incantesimo') {
            this.castSpell(card, gameState.currentPlayer);
            this.emit('logMessage', `🔮 Giocatore ${gameState.currentPlayer} lancia ${card.name}`);
            
        } else if (card.type === 'Equipaggiamento') {
            this.equipItem(card, player);
            this.emit('logMessage', `⚔️ Giocatore ${gameState.currentPlayer} equipaggia ${card.name}`);
        }
    }

    castSpell(spell, casterId) {
        const opponent = gameState.getOpponent();
        const opponentId = gameState.getOpponentId();
        
        if (spell.damage) {
            if (spell.aoe) {
                // Danno ad area
                const targets = [...opponent.frontLine, ...opponent.backLine];
                targets.forEach(target => {
                    this.dealDamage(target, spell.aoe);
                    this.emit('logMessage', `💥 ${spell.name} infligge ${spell.aoe} danni a ${target.name}`);
                });
            } else {
                // Danno singolo
                const targets = [...opponent.frontLine, ...opponent.backLine];
                
                if (targets.length > 0) {
                    const target = targets[Math.floor(Math.random() * targets.length)];
                    this.dealDamage(target, spell.damage);
                    this.emit('logMessage', `💥 ${spell.name} infligge ${spell.damage} danni a ${target.name}`);
                } else {
                    // Danno diretto al giocatore
                    opponent.health -= spell.damage;
                    this.emit('logMessage', `💥 ${spell.name} infligge ${spell.damage} danni diretti al Giocatore ${opponentId}`);
                }
            }
        }
        
        if (spell.healing) {
            const caster = gameState.getCurrentPlayer();
            if (spell.aoe) {
                // Guarigione ad area
                const targets = [...caster.frontLine, ...caster.backLine];
                targets.forEach(target => {
                    target.currentHp = Math.min(target.hp, target.currentHp + spell.healing);
                });
                caster.health = Math.min(20, caster.health + spell.healing);
                this.emit('logMessage', `💚 ${spell.name} guarisce ${spell.healing} PV a tutti gli alleati`);
            } else {
                // Guarigione singola
                caster.health = Math.min(20, caster.health + spell.healing);
                this.emit('logMessage', `💚 ${spell.name} guarisce ${spell.healing} PV al Giocatore ${casterId}`);
            }
        }

        // Altri effetti degli incantesimi
        if (spell.control) {
            this.emit('logMessage', `🌊 ${spell.name} rallenta tutti i nemici`);
        }
        
        if (spell.stealth) {
            this.emit('logMessage', `👤 ${spell.name} nasconde un alleato`);
        }
    }

    equipItem(equipment, player) {
        // Per semplicità, equipaggia sul primo personaggio disponibile
        const allCharacters = [...player.frontLine, ...player.backLine];
        
        if (allCharacters.length > 0) {
            const target = allCharacters[0];
            
            if (!target.equipment) target.equipment = [];
            target.equipment.push(equipment);
            
            // Applica bonus
            if (equipment.attBonus) target.att += equipment.attBonus;
            if (equipment.defBonus) target.def += equipment.defBonus;
            if (equipment.hpBonus) {
                target.hp += equipment.hpBonus;
                target.currentHp += equipment.hpBonus;
            }
            if (equipment.defMalus) target.def = Math.max(0, target.def - equipment.defMalus);
            
            this.emit('logMessage', `⚔️ ${equipment.name} equipaggiato su ${target.name}`);
        }
    }

    // Fase di attacco
    startAttackPhase() {
        if (!gameState.canAttack()) {
            this.emit('invalidMove', { reason: 'Non puoi attaccare' });
            return false;
        }

        gameState.setPhase('attack');
        gameState.attackPhaseActive = true;
        
        const currentPlayerId = gameState.currentPlayer;
        const player = gameState.getCurrentPlayer();
        
        // Attacca con tutte le creature disponibili
        const attackers = [...player.frontLine, ...player.backLine];
        
        if (attackers.length === 0) {
            this.emit('logMessage', `⚔️ Giocatore ${currentPlayerId} non ha attaccanti`);
            gameState.setPhase('main');
            return false;
        }

        const opponent = gameState.getOpponent();
        const opponentId = gameState.getOpponentId();
        
        attackers.forEach(attacker => {
            this.processAttack(attacker, opponent, opponentId);
        });

        // Controlla condizioni di vittoria
        const winner = gameState.checkWinCondition();
        if (winner) {
            this.emit('gameEnded', { winner });
            this.emit('logMessage', `🏆 Giocatore ${winner} vince!`);
            return true;
        }
        
        gameState.setPhase('main');
        gameState.attackPhaseActive = false;
        this.emit('phaseChanged', { phase: 'main' });
        this.emit('gameStateChanged');
        
        return true;
    }

    processAttack(attacker, opponent, opponentId) {
        // Logica di attacco semplificata
        if (opponent.frontLine.length > 0) {
            // Attacca il primo difensore
            const defender = opponent.frontLine[0];
            this.resolveCombat(attacker, defender);
        } else {
            // Attacco diretto al giocatore
            const damage = Math.max(1, attacker.att);
            opponent.health -= damage;
            this.emit('logMessage', `⚔️ ${attacker.name} attacca direttamente per ${damage} danni`);
        }
    }

    resolveCombat(attacker, defender) {
        this.emit('logMessage', `⚔️ ${attacker.name} (${attacker.att}/${attacker.def}) attacca ${defender.name} (${defender.att}/${defender.def})`);
        
        // L'attaccante infligge danni
        this.dealDamage(defender, attacker.att);
        
        // Il difensore contrattacca se sopravvive
        if (defender.currentHp > 0) {
            this.dealDamage(attacker, defender.att);
        }
    }

    dealDamage(target, damage) {
        const actualDamage = Math.max(0, damage - (target.def || 0));
        target.currentHp -= actualDamage;
        
        if (target.currentHp <= 0) {
            this.destroyCard(target);
        }
    }

    destroyCard(card) {
        // Rimuovi la carta dal campo
        [1, 2].forEach(playerId => {
            const player = gameState.players[playerId];
            ['frontLine', 'backLine', 'structures'].forEach(zone => {
                const index = player[zone].findIndex(c => c.id === card.id);
                if (index !== -1) {
                    player[zone].splice(index, 1);
                    this.emit('logMessage', `💀 ${card.name} viene distrutto`);
                    this.emit('cardDestroyed', { card, playerId });
                }
            });
        });
    }

    // Fine turno
    endTurn() {
        if (gameState.gameEnded) return;
        
        const winner = gameState.checkWinCondition();
        if (winner) {
            this.emit('gameEnded', { winner });
            this.emit('logMessage', `🏆 Giocatore ${winner} vince!`);
            return;
        }
        
        this.emit('logMessage', `🔄 Fine turno Giocatore ${gameState.currentPlayer}`);
        
        // Cambia giocatore e inizia nuovo turno
        gameState.switchPlayer();
        this.emit('gameStateChanged');
        this.startTurn();
    }

    // Selezione carte
    selectCard(card) {
        if (gameState.gameEnded) return false;
        
        gameState.selectedCard = card;
        this.emit('cardSelected', { card });
        return true;
    }

    // Utility
    getGameInfo() {
        return {
            turn: gameState.turn,
            currentPlayer: gameState.currentPlayer,
            phase: gameState.phase,
            gameStarted: gameState.gameStarted,
            gameEnded: gameState.gameEnded,
            winner: gameState.winner
        };
    }
}

// Istanza globale della logica di gioco
const gameLogic = new GameLogic();

// Esporta per l'uso in altri file
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GameLogic, gameLogic };
}