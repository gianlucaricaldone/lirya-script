// game-engine.js - Motore di gioco principale
class GameEngine {
    constructor() {
        this.state = new GameState();
        this.rules = new GameRules(this);
        this.ui = null; // Verrà inizializzato dopo
        this.ai = null; // Per il giocatore CPU
        this.isPaused = false;
        this.isProcessing = false;
    }

    // Inizializza il motore con UI
    init(ui) {
        this.ui = ui;
        this.setupEventListeners();
    }

    // Setup degli event listener
    setupEventListeners() {
        // Gestione del pulsante fine turno
        document.getElementById('end-turn').addEventListener('click', () => {
            if (!this.isProcessing) {
                this.endTurn();
            }
        });
    }

    // Inizia una nuova partita
    startGame(player1Deck, player2Deck, player2IsAI = false) {
        this.state.reset();
        
        // Setup giocatori
        this.setupPlayer(1, player1Deck);
        this.setupPlayer(2, player2Deck);
        
        if (player2IsAI) {
            this.state.players[2].isAI = true;
            this.ai = new GameAI(this, 2);
        }

        // Pesca carte iniziali
        this.initialDraw();
        
        // Inizia il primo turno
        this.startTurn();
        
        // Aggiorna UI
        this.ui.updateBoard(this.state);
    }

    // Setup di un giocatore
    setupPlayer(playerId, deckData) {
        const player = this.state.getPlayer(playerId);
        player.deckInfo = deckData;
        player.name = `Giocatore ${playerId}`; // Sempre "Giocatore 1" o "Giocatore 2"
        
        // Copia e mescola il mazzo
        player.deck = [...deckData.cards];
        this.state.shuffleDeck(playerId);
    }

    // Pesca iniziale e mulligan
    initialDraw() {
        // Pesca 5 carte per ogni giocatore
        this.state.drawCards(1, 5);
        this.state.drawCards(2, 5);
        
        // TODO: Implementare fase di mulligan
    }

    // Inizia un nuovo turno
    startTurn() {
        this.isProcessing = true;
        const player = this.state.getActivePlayer();
        
        // Fase di inizio turno
        this.state.currentPhase = 'start';
        
        // Incrementa energia massima
        this.state.increaseMaxEnergy(this.state.currentPlayer);
        
        // Pesca una carta (tranne primo turno del primo giocatore)
        if (!(this.state.turnNumber === 1 && this.state.currentPlayer === 1)) {
            this.state.drawCards(this.state.currentPlayer, 1);
        }
        
        // Applica effetti di inizio turno
        this.rules.triggerStartOfTurnEffects();
        
        // Passa alla fase principale
        this.state.currentPhase = 'main';
        this.isProcessing = false;
        
        // Aggiorna UI
        this.ui.updateBoard(this.state);
        this.ui.showTurnChange(player.name);
        
        // Se è il turno della CPU, fai giocare l'AI
        if (player.isAI && this.ai) {
            setTimeout(() => {
                this.ai.playTurn();
            }, 2000); // Delay per rendere più naturale
        }
    }

    // Gestisce il gioco di una carta dalla mano
    playCard(playerId, cardIndex) {
        if (this.isProcessing || this.state.currentPlayer !== playerId) return false;
        if (this.state.currentPhase !== 'main') return false;

        const player = this.state.getPlayer(playerId);
        const card = player.hand[cardIndex];
        
        if (!card) return false;

        // Verifica se può pagare il costo
        if (!this.rules.canPayCost(playerId, card)) {
            this.ui.showMessage("Energia insufficiente!");
            return false;
        }

        // Gestisci in base al tipo di carta
        switch (card.type) {
            case 'Personaggio':
                return this.playCharacter(playerId, cardIndex);
            case 'Incantesimo':
                return this.playSpell(playerId, cardIndex);
            case 'Struttura':
                return this.playStructure(playerId, cardIndex);
            case 'Equipaggiamento':
                return this.playEquipment(playerId, cardIndex);
            default:
                return false;
        }
    }

    // Gioca un personaggio
    playCharacter(playerId, cardIndex) {
        const card = this.state.getPlayer(playerId).hand[cardIndex];
        
        // Determina la linea basandosi sulla classe
        const targetZone = this.rules.getCharacterZone(card);
        
        // Trova uno slot libero
        const zone = this.state.getZone(playerId, targetZone);
        const freeSlot = zone.findIndex(slot => slot === null);
        
        if (freeSlot === -1) {
            this.ui.showMessage(`${targetZone === 'firstLine' ? 'Prima' : 'Seconda'} linea piena!`);
            return false;
        }

        // Paga il costo
        if (!this.state.spendEnergy(playerId, card.cost)) return false;

        // Rimuovi dalla mano e posiziona sul campo
        this.state.getPlayer(playerId).hand.splice(cardIndex, 1);
        zone[freeSlot] = card;

        // Applica effetti di entrata
        this.rules.triggerEnterPlayEffects(card, playerId);

        this.ui.updateBoard(this.state);
        return true;
    }

    // Gioca un incantesimo
    playSpell(playerId, cardIndex) {
        const card = this.state.getPlayer(playerId).hand[cardIndex];
        
        // Verifica se necessita di bersagli
        const targets = this.rules.getSpellTargets(card);
        if (targets.needsTarget && targets.validTargets.length === 0) {
            this.ui.showMessage("Nessun bersaglio valido!");
            return false;
        }

        // Se necessita di bersagli, entra in modalità targeting
        if (targets.needsTarget) {
            this.state.selectedCard = { playerId, cardIndex, card };
            this.state.targetingMode = true;
            this.state.validTargets = targets.validTargets;
            this.ui.showTargetingMode(targets.validTargets);
            return true; // L'incantesimo verrà risolto quando viene scelto il bersaglio
        }

        // Altrimenti risolvi immediatamente
        return this.resolveSpell(playerId, cardIndex, null);
    }

    // Risolve un incantesimo
    resolveSpell(playerId, cardIndex, target) {
        const player = this.state.getPlayer(playerId);
        const card = player.hand[cardIndex];

        // Paga il costo
        if (!this.state.spendEnergy(playerId, card.cost)) return false;

        // Rimuovi dalla mano
        player.hand.splice(cardIndex, 1);

        // Applica effetto
        this.rules.resolveSpellEffect(card, target);

        // Metti nel cimitero
        player.graveyard.push(card);

        this.ui.updateBoard(this.state);
        return true;
    }

    // Gioca una struttura
    playStructure(playerId, cardIndex) {
        const card = this.state.getPlayer(playerId).hand[cardIndex];
        
        // Trova uno slot libero
        const structures = this.state.getZone(playerId, 'structures');
        const freeSlot = structures.findIndex(slot => slot === null);
        
        if (freeSlot === -1) {
            this.ui.showMessage("Zone strutture piena!");
            return false;
        }

        // Paga il costo
        if (!this.state.spendEnergy(playerId, card.cost)) return false;

        // Rimuovi dalla mano e posiziona
        this.state.getPlayer(playerId).hand.splice(cardIndex, 1);
        structures[freeSlot] = card;

        // Applica effetti
        this.rules.triggerStructureEffects(card, playerId);

        this.ui.updateBoard(this.state);
        return true;
    }

    // Gioca un equipaggiamento
    playEquipment(playerId, cardIndex) {
        const card = this.state.getPlayer(playerId).hand[cardIndex];
        
        // Trova bersagli validi (proprie creature)
        const validTargets = this.state.getAllCreatures(playerId);
        
        if (validTargets.length === 0) {
            this.ui.showMessage("Nessuna creatura da equipaggiare!");
            return false;
        }

        // Entra in modalità targeting
        this.state.selectedCard = { playerId, cardIndex, card };
        this.state.targetingMode = true;
        this.state.validTargets = validTargets;
        this.ui.showTargetingMode(validTargets);
        return true;
    }

    // Gestisce la selezione di un bersaglio
    selectTarget(target) {
        if (!this.state.targetingMode || !this.state.selectedCard) return;

        const { playerId, cardIndex, card } = this.state.selectedCard;

        if (card.type === 'Incantesimo') {
            this.resolveSpell(playerId, cardIndex, target);
        } else if (card.type === 'Equipaggiamento') {
            this.equipCreature(playerId, cardIndex, target);
        }

        // Esci dalla modalità targeting
        this.state.targetingMode = false;
        this.state.selectedCard = null;
        this.state.validTargets = [];
        this.ui.hideTargetingMode();
    }

    // Equipaggia una creatura
    equipCreature(playerId, cardIndex, target) {
        const player = this.state.getPlayer(playerId);
        const equipment = player.hand[cardIndex];

        // Paga il costo
        if (!this.state.spendEnergy(playerId, equipment.cost)) return false;

        // Rimuovi dalla mano
        player.hand.splice(cardIndex, 1);

        // Applica bonus alla creatura
        this.rules.applyEquipment(equipment, target);

        this.ui.updateBoard(this.state);
        return true;
    }

    // Inizia la fase di combattimento
    startCombatPhase() {
        if (this.state.currentPhase !== 'main') return;
        
        // Regola speciale: nessun attacco nel primo turno del primo giocatore
        const isFirstPlayerFirstTurn = this.state.turnNumber === 1 && this.state.currentPlayer === 1;
        
        if (isFirstPlayerFirstTurn) {
            this.ui.showMessage("Nessun attacco permesso nel primo turno!", 2000);
            // Salta direttamente alla fine del turno senza passare per il combattimento
            this.state.currentPhase = 'end';
            
            // Applica effetti di fine turno
            this.rules.triggerEndOfTurnEffects();
            
            // Cambia giocatore
            this.state.switchTurn();
            
            // Verifica condizioni di vittoria
            if (this.state.isGameOver()) {
                this.endGame();
                return;
            }
            
            // Inizia il nuovo turno
            this.startTurn();
            return;
        }
        
        // Resetta stato combattimento
        this.state.combat = {
            attackers: [],
            blockers: [],
            declaredAttackers: false,
            declaredBlockers: false
        };
        
        // Vai alla fase di dichiarazione attaccanti
        this.state.currentPhase = 'combat_declare';
        this.ui.showMessage("Fase di Combattimento - Seleziona le creature che attaccano!", 3000);
        this.ui.updateBoard(this.state);
        this.ui.showAttackerSelection();
    }
    
    // Dichiara una creatura come attaccante
    declareAttacker(playerId, zone, position) {
        if (this.state.currentPhase !== 'combat_declare') return false;
        if (playerId !== this.state.currentPlayer) return false;
        
        const creature = this.state.getZone(playerId, zone)[position];
        if (!creature || creature.type !== 'Personaggio') return false;
        
        // Verifica se già dichiarata
        const alreadyAttacking = this.state.combat.attackers.some(
            a => a.playerId === playerId && a.zone === zone && a.position === position
        );
        
        if (alreadyAttacking) {
            // Rimuovi dall'attacco
            this.state.combat.attackers = this.state.combat.attackers.filter(
                a => !(a.playerId === playerId && a.zone === zone && a.position === position)
            );
        } else {
            // Aggiungi agli attaccanti
            this.state.combat.attackers.push({
                card: creature,
                playerId,
                zone,
                position,
                target: null // Verrà impostato dopo
            });
        }
        
        this.ui.updateCombatVisuals();
        return true;
    }
    
    // Conferma gli attaccanti e passa alla fase blocchi
    confirmAttackers() {
        if (this.state.currentPhase !== 'combat_declare') return;
        
        this.state.combat.declaredAttackers = true;
        
        if (this.state.combat.attackers.length === 0) {
            // Nessun attaccante, salta il combattimento
            this.ui.showMessage("Nessun attaccante dichiarato", 2000);
            this.endCombatPhase();
            return;
        }
        
        // Passa alla fase di dichiarazione bloccanti
        this.state.currentPhase = 'combat_block';
        const defenderId = this.state.currentPlayer === 1 ? 2 : 1;
        this.ui.showMessage(`Giocatore ${defenderId} - Dichiara i bloccanti!`, 3000);
        this.ui.updateBoard(this.state);
        this.ui.showBlockerSelection();
    }
    
    // Dichiara un bloccante
    declareBlocker(playerId, zone, position, attackerIndex) {
        if (this.state.currentPhase !== 'combat_block') return false;
        const defenderId = this.state.currentPlayer === 1 ? 2 : 1;
        if (playerId !== defenderId) return false;
        
        const creature = this.state.getZone(playerId, zone)[position];
        if (!creature || creature.type !== 'Personaggio') return false;
        
        // Solo creature in prima linea possono bloccare
        if (zone !== 'firstLine') {
            this.ui.showMessage("Solo le creature in prima linea possono bloccare!", 2000);
            return false;
        }
        
        // Verifica se già bloccante
        const existingBlock = this.state.combat.blockers.findIndex(
            b => b.playerId === playerId && b.zone === zone && b.position === position
        );
        
        if (existingBlock !== -1) {
            // Rimuovi il blocco
            this.state.combat.blockers.splice(existingBlock, 1);
        } else {
            // Aggiungi come bloccante
            this.state.combat.blockers.push({
                card: creature,
                playerId,
                zone,
                position,
                blocking: attackerIndex
            });
        }
        
        this.ui.updateCombatVisuals();
        return true;
    }
    
    // Conferma i bloccanti e risolvi il danno
    confirmBlockers() {
        if (this.state.currentPhase !== 'combat_block') return;
        
        this.state.combat.declaredBlockers = true;
        this.state.currentPhase = 'combat_damage';
        
        this.ui.showMessage("Risoluzione del combattimento!", 2000);
        
        // Risolvi il danno dopo un breve delay
        setTimeout(() => {
            this.resolveCombatDamage();
            this.endCombatPhase();
        }, 1500);
    }
    
    // Risolvi il danno da combattimento
    resolveCombatDamage() {
        const defenderId = this.state.currentPlayer === 1 ? 2 : 1;
        
        console.log(`=== RISOLUZIONE COMBATTIMENTO ===`);
        console.log(`Attaccante: Giocatore ${this.state.currentPlayer}, Difensore: Giocatore ${defenderId}`);
        
        // Controlla se il difensore ha creature in campo
        const defenderCreatures = this.state.getAllCreatures(defenderId);
        const hasDefenders = defenderCreatures.length > 0;
        
        // Per ogni attaccante
        this.state.combat.attackers.forEach((attacker, index) => {
            const attackPower = attacker.card.stats?.attack || attacker.card.attack || 0;
            console.log(`\n${attacker.card.name} (ATT: ${attackPower}) sta attaccando...`);
            
            // Trova bloccanti per questo attaccante
            const blockers = this.state.combat.blockers.filter(b => b.blocking === index);
            
            if (blockers.length > 0) {
                // Combattimento tra creature
                blockers.forEach(blocker => {
                    console.log(`- Bloccato da ${blocker.card.name}`);
                    this.rules.combatBetweenCreatures(attacker, blocker);
                });
            } else {
                // Attacco non bloccato
                if (!hasDefenders) {
                    // Nessuna creatura in campo - danno diretto al giocatore
                    console.log(`- Nessuna creatura nemica in campo, attacco diretto!`);
                    this.state.dealDamage(defenderId, attackPower);
                    this.ui.showMessage(`${attacker.card.name} infligge ${attackPower} danni al Giocatore ${defenderId}!`, 2000);
                    this.ui.showDamageToPlayer(defenderId, attackPower);
                } else if (attacker.zone === 'firstLine') {
                    // Prima linea - controlla se c'è prima linea nemica
                    const enemyFirstLine = this.state.getZone(defenderId, 'firstLine');
                    const hasFirstLineDefenders = enemyFirstLine.some(card => card !== null);
                    
                    if (!hasFirstLineDefenders) {
                        console.log(`- Prima linea nemica vuota, attacco diretto!`);
                        this.state.dealDamage(defenderId, attackPower);
                        this.ui.showMessage(`${attacker.card.name} infligge ${attackPower} danni al Giocatore ${defenderId}!`, 2000);
                        this.ui.showDamageToPlayer(defenderId, attackPower);
                    } else {
                        console.log(`- Non può attaccare: prima linea nemica presente ma non bloccato`);
                    }
                } else if (attacker.zone === 'secondLine') {
                    // Seconda linea - attacca sempre direttamente se non bloccato
                    console.log(`- Attacco dalla seconda linea non bloccato!`);
                    this.state.dealDamage(defenderId, attackPower);
                    this.ui.showMessage(`${attacker.card.name} infligge ${attackPower} danni al Giocatore ${defenderId}!`, 2000);
                    this.ui.showDamageToPlayer(defenderId, attackPower);
                }
            }
        });
        
        console.log(`\n=== FINE COMBATTIMENTO ===`);
        console.log(`Vita Giocatore 1: ${this.state.getPlayer(1).life}`);
        console.log(`Vita Giocatore 2: ${this.state.getPlayer(2).life}`);
    }
    
    // Termina la fase di combattimento
    endCombatPhase() {
        this.state.combat = {
            attackers: [],
            blockers: [],
            declaredAttackers: false,
            declaredBlockers: false
        };
        
        this.state.currentPhase = 'end';
        this.ui.hideCombatUI();
        this.ui.updateBoard(this.state);
        
        // Continua con la fine del turno
        setTimeout(() => {
            this.endTurn();
        }, 1000);
    }

    // Fine turno
    endTurn() {
        if (this.isProcessing) return;
        
        // Se siamo in fase principale, inizia il combattimento
        if (this.state.currentPhase === 'main') {
            this.startCombatPhase();
            return;
        }
        
        // Applica effetti di fine turno
        this.rules.triggerEndOfTurnEffects();
        
        // Cambia giocatore
        this.state.switchTurn();
        
        // Verifica condizioni di vittoria
        if (this.state.isGameOver()) {
            this.endGame();
            return;
        }
        
        // Inizia il nuovo turno
        this.startTurn();
    }

    // Fine partita
    endGame() {
        const winner = this.state.winner;
        this.ui.showGameOver(winner, this.state.players[winner].name);
    }

    // Salva la partita
    saveGame() {
        const saveData = this.state.serialize();
        localStorage.setItem('lirya_save', saveData);
        this.ui.showMessage("Partita salvata!");
    }

    // Carica la partita
    loadGame() {
        const saveData = localStorage.getItem('lirya_save');
        if (saveData) {
            this.state.deserialize(saveData);
            this.ui.updateBoard(this.state);
            this.ui.showMessage("Partita caricata!");
            return true;
        }
        return false;
    }

    // Mette in pausa la partita
    pauseGame() {
        this.isPaused = !this.isPaused;
        if (this.isPaused) {
            this.ui.showPauseMenu();
        } else {
            this.ui.hidePauseMenu();
        }
    }
}

// Esporta per uso globale
window.GameEngine = GameEngine;