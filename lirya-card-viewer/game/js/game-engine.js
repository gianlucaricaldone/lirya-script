// game-engine.js - Motore di gioco principale
class GameEngine {
    constructor() {
        this.state = new GameState();
        this.rules = new GameRules(this);
        this.abilities = new AbilitiesSystemV2(this);
        this.cardDisplay = new CardDisplay();
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
        
        // Gestione del pulsante attacco
        document.getElementById('attack-button').addEventListener('click', () => {
            if (!this.isProcessing) {
                this.startAttackPhase();
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
        
        // Nascondi le carte dell'avversario all'inizio
        this.ui.hideOpponentCards(1);
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
        
        // Attiva il nuovo sistema di abilità per l'inizio turno
        this.abilities.onTurnStart(this.state.currentPlayer);
        
        // Passa alla fase principale
        this.state.currentPhase = 'main';
        this.isProcessing = false;
        
        // Aggiorna UI
        this.ui.updateBoard(this.state);
        this.ui.showTurnChange(player.name);
        
        // Gestisci visibilità carte
        this.ui.showPlayerCards(this.state.currentPlayer);
        this.ui.hideOpponentCards(this.state.currentPlayer);
        
        // Se è il turno della CPU, fai giocare l'AI
        if (player.isAI && this.ai) {
            setTimeout(() => {
                this.ai.playTurn();
            }, 2000); // Delay per rendere più naturale
        }
    }

    // Gestisce il gioco di una carta dalla mano
    playCard(playerId, cardIndex) {
        console.log(`PlayCard chiamato: playerId=${playerId}, cardIndex=${cardIndex}`);
        
        if (this.isProcessing || this.state.currentPlayer !== playerId) {
            console.log(`Non può giocare: isProcessing=${this.isProcessing}, currentPlayer=${this.state.currentPlayer}`);
            return false;
        }
        if (this.state.currentPhase !== 'main') {
            console.log(`Non in fase main: ${this.state.currentPhase}`);
            return false;
        }

        const player = this.state.getPlayer(playerId);
        const card = player.hand[cardIndex];
        
        if (!card) {
            console.log('Carta non trovata nella posizione', cardIndex);
            return false;
        }
        
        console.log(`Giocando: ${card.name} (${card.type})`);

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
        
        // Crea l'oggetto creatura con le proprietà necessarie
        const creature = {
            card: card,
            tapped: false,
            summoningSickness: true, // Non può attaccare nel turno in cui viene evocata
            currentHealth: card.stats?.health || card.health || 1
        };
        
        // Se la carta ha haste, rimuovi summoning sickness
        if (card.hasHaste) {
            creature.summoningSickness = false;
        }
        
        zone[freeSlot] = creature;

        // Registra le abilità della carta
        const location = {
            playerId,
            zone: targetZone,
            position: freeSlot
        };
        
        // Usa il nuovo sistema di abilità
        this.abilities.onCardPlayed(card, location);

        // Applica effetti di entrata (retrocompatibilità)
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
        
        // Attiva abilità "quando giochi un incantesimo"
        this.abilities.triggerEvent('onSpellPlayed', { 
            card, 
            playerId,
            element: card.element 
        });

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

        // Usa il nuovo sistema per equipaggiare
        this.abilities.equipCreature(equipment, target);
        
        // Aggiungi l'equipaggiamento alla lista della creatura
        if (!target.equipments) {
            target.equipments = [];
        }
        target.equipments.push(equipment);

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
            declaredBlockers: false,
            attackingCreature: null, // Creatura attualmente selezionata per attaccare
            validTargets: [] // Bersagli validi per l'attaccante corrente
        };
        
        // Vai alla fase di dichiarazione attaccanti
        this.state.currentPhase = 'combat_declare';
        this.ui.showMessage("Fase di Combattimento - Seleziona le creature che attaccano e i loro bersagli!", 3000);
        this.ui.updateBoard(this.state);
        this.ui.showAttackerSelection();
        
        // Se è il turno della CPU, gestisci automaticamente il combattimento
        const player = this.state.getActivePlayer();
        if (player.isAI && this.ai) {
            setTimeout(() => {
                this.ai.handleCombatPhase();
            }, 1500);
        }
    }
    
    // Dichiara una creatura come attaccante
    declareAttacker(playerId, zone, position) {
        console.log(`declareAttacker chiamato: phase=${this.state.currentPhase}, playerId=${playerId}, currentPlayer=${this.state.currentPlayer}`);
        
        if (this.state.currentPhase !== 'combat_declare') {
            console.log('Non in fase combat_declare');
            return false;
        }
        if (playerId !== this.state.currentPlayer) {
            console.log('Non è il turno del giocatore');
            return false;
        }
        
        const creatureSlot = this.state.getZone(playerId, zone)[position];
        const creature = creatureSlot?.card || creatureSlot;
        
        if (!creature || creature.type !== 'Personaggio') {
            console.log('Non è una creatura valida:', creature);
            return false;
        }
        
        // Controlla se questa creatura è già stata dichiarata come attaccante
        const alreadyAttacking = this.state.combat.attackers.some(attacker => 
            attacker.playerId === playerId && 
            attacker.zone === zone && 
            attacker.position === position
        );
        
        if (alreadyAttacking) {
            this.ui.showMessage("Questa creatura sta già attaccando!", 2000);
            return false;
        }
        
        // Se c'è già una creatura selezionata per attaccare, controlla se è la stessa
        if (this.state.combat.attackingCreature) {
            const current = this.state.combat.attackingCreature;
            if (current.playerId === playerId && current.zone === zone && current.position === position) {
                // Deseleziona la creatura
                this.state.combat.attackingCreature = null;
                this.state.combat.validTargets = [];
                this.ui.hideTargetSelection();
                return true;
            }
        }
        
        // Seleziona questa creatura come attaccante
        this.state.combat.attackingCreature = {
            card: creature,
            playerId,
            zone,
            position
        };
        
        // Determina i bersagli validi per questa creatura
        const defenderId = playerId === 1 ? 2 : 1;
        const validTargets = this.getValidTargetsForAttacker(creature, zone, defenderId);
        
        this.state.combat.validTargets = validTargets;
        this.ui.showTargetSelection(this.state.combat.attackingCreature, validTargets);
        
        return true;
    }
    
    // Ottieni i bersagli validi per un attaccante
    getValidTargetsForAttacker(attacker, attackerZone, defenderId) {
        const targets = [];
        
        // Ottieni le linee nemiche
        const enemyFirstLine = this.state.getZone(defenderId, 'firstLine')
            .map((creature, position) => ({ creature, position }))
            .filter(({ creature }) => creature !== null);
            
        const enemySecondLine = this.state.getZone(defenderId, 'secondLine')
            .map((creature, position) => ({ creature, position }))
            .filter(({ creature }) => creature !== null);
            
        // Ottieni le strutture nemiche
        const enemyStructures = this.state.getZone(defenderId, 'structures')
            .map((structure, position) => ({ structure, position }))
            .filter(({ structure }) => structure !== null);
        
        if (attackerZone === 'firstLine') {
            // PRIMA LINEA può attaccare:
            
            // 1. Sempre la prima linea nemica se c'è
            enemyFirstLine.forEach(({ creature, position }) => {
                targets.push({
                    type: 'creature',
                    creature,
                    card: creature.card || creature,
                    playerId: defenderId,
                    zone: 'firstLine',
                    position
                });
            });
            
            // 2. La seconda linea SOLO se la prima linea è vuota
            if (enemyFirstLine.length === 0) {
                enemySecondLine.forEach(({ creature, position }) => {
                    targets.push({
                        type: 'creature',
                        creature,
                        card: creature.card || creature,
                        playerId: defenderId,
                        zone: 'secondLine',
                        position
                    });
                });
            }
            
            // 3. Le strutture SOLO se entrambe le linee sono vuote
            if (enemyFirstLine.length === 0 && enemySecondLine.length === 0) {
                enemyStructures.forEach(({ structure, position }) => {
                    targets.push({
                        type: 'structure',
                        structure,
                        card: structure,
                        playerId: defenderId,
                        zone: 'structures',
                        position
                    });
                });
                
                // 4. Il giocatore SOLO se non ci sono creature né strutture
                if (enemyStructures.length === 0) {
                    targets.push({
                        type: 'player',
                        playerId: defenderId
                    });
                }
            }
            
        } else if (attackerZone === 'secondLine') {
            // SECONDA LINEA può attaccare:
            
            // 1. Qualsiasi creatura nemica (prima o seconda linea)
            enemyFirstLine.forEach(({ creature, position }) => {
                targets.push({
                    type: 'creature',
                    creature,
                    card: creature.card || creature,
                    playerId: defenderId,
                    zone: 'firstLine',
                    position
                });
            });
            
            enemySecondLine.forEach(({ creature, position }) => {
                targets.push({
                    type: 'creature',
                    creature,
                    card: creature.card || creature,
                    playerId: defenderId,
                    zone: 'secondLine',
                    position
                });
            });
            
            // 2. Le strutture (la seconda linea può sempre attaccare le strutture)
            enemyStructures.forEach(({ structure, position }) => {
                targets.push({
                    type: 'structure',
                    structure,
                    card: structure,
                    playerId: defenderId,
                    zone: 'structures',
                    position
                });
            });
            
            // 3. Il giocatore SOLO se non ci sono creature
            if (enemyFirstLine.length === 0 && enemySecondLine.length === 0) {
                targets.push({
                    type: 'player',
                    playerId: defenderId
                });
            }
        }
        
        return targets;
    }
    
    // Seleziona il bersaglio per l'attaccante corrente
    selectAttackTarget(target) {
        if (!this.state.combat.attackingCreature) return false;
        
        // Verifica che il bersaglio sia valido
        const isValid = this.state.combat.validTargets.some(t => {
            if (t.type !== target.type) return false;
            if (t.type === 'player') {
                return t.playerId === target.playerId;
            } else {
                return t.playerId === target.playerId && 
                       t.zone === target.zone && 
                       t.position === target.position;
            }
        });
        
        if (!isValid) return false;
        
        // Aggiungi l'attaccante con il suo bersaglio
        this.state.combat.attackers.push({
            ...this.state.combat.attackingCreature,
            target: target
        });
        
        // Resetta lo stato di selezione
        this.state.combat.attackingCreature = null;
        this.state.combat.validTargets = [];
        this.ui.hideTargetSelection();
        this.ui.updateCombatVisuals();
        
        return true;
    }
    
    // Conferma gli attaccanti e risolvi il combattimento
    confirmAttackers() {
        if (this.state.currentPhase !== 'combat_declare') return;
        
        // Se c'è una creatura selezionata ma non ha ancora scelto il bersaglio
        if (this.state.combat.attackingCreature) {
            this.ui.showMessage("Seleziona un bersaglio per la creatura attaccante!", 2000);
            return;
        }
        
        this.state.combat.declaredAttackers = true;
        
        if (this.state.combat.attackers.length === 0) {
            // Nessun attaccante, salta il combattimento
            this.ui.showMessage("Nessun attaccante dichiarato", 2000);
            this.endCombatPhase();
            return;
        }
        
        // Vai direttamente alla risoluzione del danno
        this.state.currentPhase = 'combat_damage';
        this.ui.showMessage("Risoluzione del combattimento!", 2000);
        
        // Mantieni le frecce visibili durante la risoluzione
        this.ui.maintainCombatVisuals();
        
        // Risolvi il danno dopo un breve delay
        setTimeout(() => {
            this.resolveCombatDamage();
            // Aspetta un po' prima di terminare per vedere gli effetti
            setTimeout(() => {
                this.endCombatPhase();
            }, 1500);
        }, 1000);
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
        
        // Per ogni attaccante con il suo bersaglio specificato
        this.state.combat.attackers.forEach((attacker) => {
            const attackPower = attacker.card.stats?.attack || attacker.card.attack || 0;
            console.log(`\n${attacker.card.name} (ATT: ${attackPower}) sta attaccando...`);
            
            if (!attacker.target) {
                console.log(`- Errore: nessun bersaglio specificato`);
                return;
            }
            
            if (attacker.target.type === 'player') {
                // Attacco diretto al giocatore
                console.log(`- Attacco diretto al Giocatore ${attacker.target.playerId}!`);
                this.state.dealDamage(attacker.target.playerId, attackPower);
                this.ui.showMessage(`${attacker.card.name} infligge ${attackPower} danni al Giocatore ${attacker.target.playerId}!`, 2000);
                this.ui.showDamageToPlayer(attacker.target.playerId, attackPower);
            } else if (attacker.target.type === 'creature') {
                // Combattimento tra creature
                // Ottieni la creatura difensore completa dalla zona
                const defenderZone = this.state.getZone(attacker.target.playerId, attacker.target.zone);
                const defenderCreature = defenderZone[attacker.target.position];
                
                const defender = {
                    card: defenderCreature.card || defenderCreature,
                    playerId: attacker.target.playerId,
                    zone: attacker.target.zone,
                    position: attacker.target.position,
                    currentHealth: defenderCreature.currentHealth
                };
                console.log(`- Attacca ${defender.card.name}`);
                this.rules.combatBetweenCreatures(attacker, defender);
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

    // Distrugge una creatura
    destroyCreature(target) {
        console.log('[GameEngine] destroyCreature:', target);
        
        if (!target || !target.card) {
            console.error('[GameEngine] Target non valido per destroyCreature');
            return;
        }
        
        const { playerId, zone, position } = target;
        
        // Trova la zona corretta
        let zoneArray;
        if (zone === 'firstLine') {
            zoneArray = this.state.getPlayer(playerId).firstLine;
        } else if (zone === 'secondLine') {
            zoneArray = this.state.getPlayer(playerId).secondLine;
        } else {
            console.error('[GameEngine] Zona non valida:', zone);
            return;
        }
        
        // Rimuovi la carta dalla zona
        const removedCard = zoneArray[position];
        if (removedCard) {
            const card = removedCard.card || removedCard;
            
            // Notifica il sistema di abilità
            this.abilities.onCardRemoved(card, target);
            
            zoneArray[position] = null;
            
            // Aggiungi al cimitero
            this.state.getPlayer(playerId).graveyard.push(card);
            
            // Aggiorna UI
            this.ui.updateBoard(this.state);
        }
    }
    
    // Fine turno
    endTurn() {
        if (this.isProcessing) return;
        
        // Il pulsante Fine Turno ora termina sempre il turno
        // senza passare per la fase di combattimento
        
        // Notifica il sistema di abilità della fine del turno
        this.abilities.onTurnEnd(this.state.currentPlayer);
        
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
    
    // Nuovo metodo per iniziare la fase di attacco
    startAttackPhase() {
        if (this.isProcessing) return;
        
        // Verifica che ci siano creature per attaccare
        const creatures = this.state.getAllCreatures(this.state.currentPlayer);
        if (creatures.length === 0) {
            this.ui.showMessage("Non hai creature per attaccare!");
            return;
        }
        
        // Inizia la fase di combattimento
        this.startCombatPhase();
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