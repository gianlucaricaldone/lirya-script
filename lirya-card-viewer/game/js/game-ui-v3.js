// UI Manager per il gioco
class UIManager {
    constructor(engine) {
        this.engine = engine;
        this.selectedCard = null;
        this.selectedCreature = null;
        this.attackingCreatures = [];
        this.blockingAssignments = new Map();
        this.draggedElement = null;
        this.draggedCard = null;
    }
    
    // Inizializza l'UI
    init() {
        this.initEventListeners();
        this.initDropZones();
        console.log('UIManager v3 inizializzato');
    }
    
    // Inizializza gli event listener
    initEventListeners() {
        // Gestore per turno successivo
        const nextTurnBtn = document.getElementById('next-turn-btn');
        if (nextTurnBtn) {
            nextTurnBtn.addEventListener('click', () => {
                this.engine.endTurn();
            });
        }
        
        // Gestore per il concede
        const concedeBtn = document.getElementById('concede-btn');
        if (concedeBtn) {
            concedeBtn.addEventListener('click', () => {
                if (confirm('Sei sicuro di voler concedere?')) {
                    this.engine.concedeGame();
                }
            });
        }
        
        // Gestore per il modal cambio turno
        const confirmTurnBtn = document.getElementById('confirm-turn');
        if (confirmTurnBtn) {
            confirmTurnBtn.addEventListener('click', () => {
                this.hideTurnChangeModal();
            });
        }
    }
    
    // Metodo principale chiamato dal game engine (alias per renderGameState)
    updateBoard(state) {
        this.renderGameState(state);
    }
    
    // Renderizza l'intero stato di gioco
    renderGameState(state) {
        this.renderPlayerAreas(state);
        this.updateGameInfo(state);
        this.updatePhaseIndicator(state);
    }
    
    // Renderizza le aree dei giocatori
    renderPlayerAreas(state) {
        console.log('renderPlayerAreas chiamato, state:', state);
        
        // Supporta sia state.players che state.getPlayer()
        if (Array.isArray(state.players)) {
            console.log('Usando state.players array');
            state.players.forEach((player, index) => {
                this.renderPlayerHand(player, index);
                this.renderPlayerField(player, index);
                this.updatePlayerInfo(player, index);
            });
        } else if (state.getPlayer && typeof state.getPlayer === 'function') {
            console.log('Usando state.getPlayer function');
            // Compatibilità con la vecchia struttura state - HTML usa player1 e player2
            for (let i = 1; i <= 2; i++) {
                const player = state.getPlayer(i);
                console.log(`Player ${i}:`, player ? 'trovato' : 'NON TROVATO');
                if (player) {
                    this.renderPlayerHand(player, i);
                    this.renderPlayerField(player, i);
                    this.updatePlayerInfo(player, i);
                } else {
                    console.warn(`Player ${i} non trovato!`);
                }
            }
        } else {
            console.warn('Struttura state non riconosciuta:', state);
        }
    }
    
    // Renderizza la mano del giocatore
    renderPlayerHand(player, playerId) {
        const handEl = document.getElementById(`player${playerId}-hand`);
        if (!handEl) {
            console.warn(`Element player${playerId}-hand not found`);
            return;
        }
        handEl.innerHTML = '';
        
        player.hand.forEach((card, index) => {
            const cardEl = this.createCardElement(card, {
                playerId: playerId,
                zone: 'hand',
                position: index
            });
            
            // Mostra carte solo per il giocatore corrente
            const currentPlayer = this.engine.state?.currentPlayer ?? this.engine.state?.activePlayer ?? 0;
            if (playerId === currentPlayer) {
                cardEl.classList.add('player-card');
                this.addHandCardEventListeners(cardEl, card, playerId, index);
            } else {
                cardEl.classList.add('opponent-card');
                cardEl.innerHTML = '<div class="card-back"></div>';
            }
            
            handEl.appendChild(cardEl);
        });
    }
    
    // Renderizza il campo del giocatore
    renderPlayerField(player, playerId) {
        // Il campo è diviso in più zone: first-line, second-line, structures
        const firstLineEl = document.getElementById(`player${playerId}-first-line`);
        const secondLineEl = document.getElementById(`player${playerId}-second-line`);
        const structuresEl = document.getElementById(`player${playerId}-structures`);
        
        if (!firstLineEl || !secondLineEl || !structuresEl) {
            console.warn(`Field elements for player${playerId} not found`);
            return;
        }
        
        // Pulisci gli slot esistenti
        firstLineEl.querySelectorAll('.card-slot').forEach(slot => slot.innerHTML = '');
        secondLineEl.querySelectorAll('.card-slot').forEach(slot => slot.innerHTML = '');
        structuresEl.querySelectorAll('.card-slot').forEach(slot => slot.innerHTML = '');
        
        // Renderizza creature nella prima linea
        if (player.firstLine && Array.isArray(player.firstLine)) {
            const firstLineSlots = firstLineEl.querySelectorAll('.card-slot');
            player.firstLine.forEach((creature, position) => {
                if (creature && firstLineSlots[position]) {
                    // La creatura potrebbe essere direttamente la carta, non un wrapper
                    const card = creature.card || creature;
                    const cardEl = this.createCardElement(card, {
                        playerId: playerId,
                        zone: 'firstLine',
                        position: position
                    });
                    
                    // Aggiungi stato della creatura
                    if (creature.tapped) {
                        cardEl.classList.add('tapped');
                    }
                    if (creature.summoningSickness) {
                        cardEl.classList.add('summoning-sickness');
                    }
                    
                    this.addFieldCardEventListeners(cardEl, creature, playerId, position);
                    firstLineSlots[position].appendChild(cardEl);
                    
                    // Aggiorna salute se necessario
                    if (card.currentHealth !== undefined) {
                        this.updateCreatureHealth({...creature, card});
                    }
                }
            });
        }
        
        // Renderizza creature nella seconda linea
        if (player.secondLine && Array.isArray(player.secondLine)) {
            const secondLineSlots = secondLineEl.querySelectorAll('.card-slot');
            player.secondLine.forEach((creature, position) => {
                if (creature && secondLineSlots[position]) {
                    // La creatura potrebbe essere direttamente la carta, non un wrapper
                    const card = creature.card || creature;
                    const cardEl = this.createCardElement(card, {
                        playerId: playerId,
                        zone: 'secondLine',
                        position: position
                    });
                    
                    // Aggiungi stato della creatura
                    if (creature.tapped) {
                        cardEl.classList.add('tapped');
                    }
                    if (creature.summoningSickness) {
                        cardEl.classList.add('summoning-sickness');
                    }
                    
                    this.addFieldCardEventListeners(cardEl, creature, playerId, position);
                    secondLineSlots[position].appendChild(cardEl);
                    
                    // Aggiorna salute se necessario
                    if (card.currentHealth !== undefined) {
                        this.updateCreatureHealth({...creature, card});
                    }
                }
            });
        }
        
        // Renderizza strutture
        if (player.structures && Array.isArray(player.structures)) {
            const structureSlots = structuresEl.querySelectorAll('.card-slot');
            player.structures.forEach((structure, position) => {
                if (structure && structureSlots[position]) {
                    // La struttura potrebbe essere direttamente la carta, non un wrapper
                    const card = structure.card || structure;
                    const cardEl = this.createCardElement(card, {
                        playerId: playerId,
                        zone: 'structures',
                        position: position
                    });
                    
                    this.addFieldCardEventListeners(cardEl, structure, playerId, position);
                    structureSlots[position].appendChild(cardEl);
                }
            });
        }
    }
    
    // Crea elemento carta
    createCardElement(card, metadata) {
        const cardEl = document.createElement('div');
        cardEl.className = 'game-card';
        cardEl.draggable = true;
        
        // Aggiungi metadati
        Object.entries(metadata).forEach(([key, value]) => {
            cardEl.dataset[key] = value;
        });
        
        // Usa CardRenderer per generare l'SVG
        try {
            let imagePath = card.img || `${card.id}_${card.name.toLowerCase().replace(/\s+/g, '_').replace(/[^\w_]/g, '')}.png`;
            
            // Assicurati che il percorso sia corretto - se non inizia con ../ aggiungilo
            if (!imagePath.startsWith('../') && !imagePath.startsWith('/')) {
                imagePath = `../images/${imagePath}`;
            } else if (imagePath.startsWith('/images/')) {
                imagePath = `..${imagePath}`;
            }
            
            const fullImagePath = imagePath;
            
            const cardWithImage = {
                ...card,
                img: fullImagePath
            };
            
            const svgContent = CardRenderer.generateCardSVG(cardWithImage);
            cardEl.innerHTML = svgContent;
            
            // Imposta pointer-events dopo aver inserito l'SVG
            const svg = cardEl.querySelector('svg');
            if (svg) {
                svg.style.pointerEvents = 'none';
            }
        } catch (error) {
            console.error('Errore nel rendering della carta:', error);
            // Fallback rendering
            cardEl.innerHTML = `
                <div class="card-content">
                    <div class="card-name">${card.name}</div>
                    <div class="card-cost">${card.cost || 0}</div>
                    ${card.attack !== undefined ? `<div class="card-stats">${card.attack}/${card.defense}</div>` : ''}
                </div>
            `;
        }
        
        return cardEl;
    }
    
    // Event listeners per carte in mano
    addHandCardEventListeners(cardEl, card, playerId, index) {
        // Click per selezionare
        cardEl.addEventListener('click', (e) => {
            e.stopPropagation();
            this.selectCard(card, playerId, index);
        });
        
        // Doppio click per ingrandire
        cardEl.addEventListener('dblclick', (e) => {
            e.stopPropagation();
            this.showCardDetail(card);
        });
        
        // Drag and drop
        cardEl.addEventListener('dragstart', (e) => {
            e.dataTransfer.effectAllowed = 'move';
            this.draggedElement = cardEl;
            this.draggedCard = { card, playerId, index };
            cardEl.classList.add('dragging');
        });
        
        cardEl.addEventListener('dragend', (e) => {
            cardEl.classList.remove('dragging');
            this.draggedElement = null;
            this.draggedCard = null;
        });
    }
    
    // Event listeners per carte sul campo
    addFieldCardEventListeners(cardEl, creature, playerId, position) {
        cardEl.addEventListener('click', (e) => {
            e.stopPropagation();
            
            console.log('Card clicked:', {
                phase: this.engine.state.phase,
                currentPhase: this.engine.state.currentPhase,
                subPhase: this.engine.state.subPhase,
                currentPlayer: this.engine.state.currentPlayer,
                playerId: playerId
            });
            
            // Se siamo in fase di selezione attaccanti
            if ((this.engine.state.phase === 'combat' || this.engine.state.currentPhase === 'combat_declare') && 
                playerId === this.engine.state.currentPlayer) {
                console.log('Toggling attacker');
                this.toggleAttacker(creature, cardEl);
            }
            // Se siamo in fase di selezione bloccanti
            else if ((this.engine.state.phase === 'combat' || this.engine.state.currentPhase === 'combat_block') && 
                     playerId !== this.engine.state.currentPlayer) {
                this.selectBlocker(creature, cardEl);
            }
        });
        
        // Doppio click per ingrandire
        cardEl.addEventListener('dblclick', (e) => {
            e.stopPropagation();
            const card = creature.card || creature;
            this.showCardDetail(card);
        });
    }
    
    // Seleziona una carta in mano
    selectCard(card, playerId, index) {
        // Deseleziona carta precedente
        document.querySelectorAll('.selected-card').forEach(el => {
            el.classList.remove('selected-card');
        });
        
        // Seleziona nuova carta
        const cardEl = document.querySelector(
            `[data-player-id="${playerId}"][data-zone="hand"][data-position="${index}"]`
        );
        if (cardEl) {
            cardEl.classList.add('selected-card');
            this.selectedCard = { card, playerId, index };
        }
    }
    
    // Gioca una carta dalla mano
    playCard(playerId, cardIndex, targetInfo = null) {
        this.engine.playCard(playerId, cardIndex, targetInfo);
        this.selectedCard = null;
        document.querySelectorAll('.selected-card').forEach(el => {
            el.classList.remove('selected-card');
        });
    }
    
    // Gestione drag and drop per il campo
    setupFieldDropZone(fieldEl, playerId) {
        if (!fieldEl) return;
        
        fieldEl.addEventListener('dragover', (e) => {
            if (this.draggedCard && this.draggedCard.playerId === playerId) {
                e.preventDefault();
                fieldEl.classList.add('drag-over');
            }
        });
        
        fieldEl.addEventListener('dragleave', (e) => {
            fieldEl.classList.remove('drag-over');
        });
        
        fieldEl.addEventListener('drop', (e) => {
            e.preventDefault();
            fieldEl.classList.remove('drag-over');
            
            if (this.draggedCard && this.draggedCard.playerId === playerId) {
                this.playCard(playerId, this.draggedCard.index);
            }
        });
    }
    
    // Inizializza drop zones
    initDropZones() {
        // Drop zones per gli slot del campo
        for (let i = 1; i <= 2; i++) {
            // Setup drop zones per first-line, second-line, structures
            const firstLineEl = document.getElementById(`player${i}-first-line`);
            const secondLineEl = document.getElementById(`player${i}-second-line`);
            const structuresEl = document.getElementById(`player${i}-structures`);
            
            if (firstLineEl) {
                this.setupLineDropZones(firstLineEl, i, 'first-line');
            }
            if (secondLineEl) {
                this.setupLineDropZones(secondLineEl, i, 'second-line');
            }
            if (structuresEl) {
                this.setupLineDropZones(structuresEl, i, 'structures');
            }
        }
    }
    
    // Setup drop zones per una linea specifica
    setupLineDropZones(lineEl, playerId, lineType) {
        const slots = lineEl.querySelectorAll('.card-slot');
        slots.forEach((slot, index) => {
            this.setupSlotDropZone(slot, playerId, lineType, index);
        });
    }
    
    // Setup drop zone per un singolo slot
    setupSlotDropZone(slot, playerId, lineType, slotIndex) {
        slot.addEventListener('dragover', (e) => {
            if (this.draggedCard && this.draggedCard.playerId === playerId) {
                e.preventDefault();
                slot.classList.add('drag-over');
            }
        });
        
        slot.addEventListener('dragleave', (e) => {
            slot.classList.remove('drag-over');
        });
        
        slot.addEventListener('drop', (e) => {
            e.preventDefault();
            slot.classList.remove('drag-over');
            
            if (this.draggedCard && this.draggedCard.playerId === playerId) {
                console.log(`Carta droppata in ${lineType} slot ${slotIndex} per player ${playerId}`);
                this.playCard(playerId, this.draggedCard.index);
            }
        });
    }
    
    // Aggiorna informazioni giocatore
    updatePlayerInfo(player, playerId) {
        const lifeEl = document.getElementById(`player${playerId}-life`);
        const energyEl = document.getElementById(`player${playerId}-energy`);
        const maxEnergyEl = document.getElementById(`player${playerId}-max-energy`);
        const handEl = document.getElementById(`player${playerId}-hand-count`);
        const deckEl = document.getElementById(`player${playerId}-deck-count`);
        
        if (lifeEl) lifeEl.textContent = player.life;
        if (energyEl) energyEl.textContent = player.energy || player.currentMana || 0;
        if (maxEnergyEl) maxEnergyEl.textContent = player.maxEnergy || player.maxMana || 0;
        if (handEl) handEl.textContent = player.hand.length;
        if (deckEl) deckEl.textContent = player.deck.length;
        
        // Evidenzia giocatore attivo
        const playerArea = document.getElementById(`player${playerId}-area`);
        if (playerArea) {
            const currentPlayer = this.engine.state?.currentPlayer ?? this.engine.state?.activePlayer ?? 0;
            if (playerId === currentPlayer) {
                playerArea.classList.add('active-player');
            } else {
                playerArea.classList.remove('active-player');
            }
        }
    }
    
    // Aggiorna informazioni di gioco
    updateGameInfo(state) {
        const turnEl = document.getElementById('current-turn');
        const playerEl = document.getElementById('current-player');
        const phaseEl = document.getElementById('current-phase');
        
        const turn = state.turn ?? state.turnNumber ?? 1;
        const currentPlayer = state.currentPlayer ?? state.activePlayer ?? 0;
        const phase = state.phase ?? 'main1';
        
        if (turnEl) turnEl.textContent = turn;
        if (playerEl) playerEl.textContent = `Giocatore ${currentPlayer + 1}`;
        if (phaseEl) phaseEl.textContent = phase;
    }
    
    // Aggiorna indicatore di fase
    updatePhaseIndicator(state) {
        const phases = ['draw', 'main1', 'combat', 'main2', 'end'];
        phases.forEach(phase => {
            const phaseEl = document.getElementById(`${phase}-phase`);
            if (phaseEl) {
                if (phase === state.phase) {
                    phaseEl.classList.add('active');
                } else {
                    phaseEl.classList.remove('active');
                }
            }
        });
    }
    
    // === GESTIONE COMBATTIMENTO ===
    
    // Mostra UI per dichiarare attaccanti
    showDeclareAttackersUI() {
        // Evidenzia creature che possono attaccare
        const currentPlayer = this.engine.state.currentPlayer;
        const player = this.engine.state.getPlayer(currentPlayer);
        
        // Controlla creature nella prima linea
        if (player.firstLine) {
            player.firstLine.forEach((creature, position) => {
                if (creature) {
                    // Per ora, tutte le creature non tapped possono attaccare
                    const canAttack = !creature.tapped && !creature.summoningSickness;
                    if (canAttack) {
                        const cardEl = document.querySelector(
                            `[data-player-id="${currentPlayer}"][data-zone="firstLine"][data-position="${position}"]`
                        );
                        if (cardEl) {
                            cardEl.classList.add('can-attack');
                        }
                    }
                }
            });
        }
        
        // Controlla creature nella seconda linea
        if (player.secondLine) {
            player.secondLine.forEach((creature, position) => {
                if (creature) {
                    // Per ora, tutte le creature non tapped possono attaccare
                    const canAttack = !creature.tapped && !creature.summoningSickness;
                    if (canAttack) {
                        const cardEl = document.querySelector(
                            `[data-player-id="${currentPlayer}"][data-zone="secondLine"][data-position="${position}"]`
                        );
                        if (cardEl) {
                            cardEl.classList.add('can-attack');
                        }
                    }
                }
            });
        }
        
        // Mostra pulsante conferma
        const existingBtn = document.getElementById('confirm-attackers');
        if (!existingBtn) {
            const confirmBtn = document.createElement('button');
            confirmBtn.id = 'confirm-attackers';
            confirmBtn.textContent = 'Conferma Attaccanti';
            confirmBtn.className = 'confirm-combat-btn';
            confirmBtn.style.position = 'fixed';
            confirmBtn.style.bottom = '20px';
            confirmBtn.style.left = '50%';
            confirmBtn.style.transform = 'translateX(-50%)';
            confirmBtn.style.zIndex = '1000';
            confirmBtn.style.padding = '10px 20px';
            confirmBtn.style.backgroundColor = '#3498db';
            confirmBtn.style.color = 'white';
            confirmBtn.style.border = 'none';
            confirmBtn.style.borderRadius = '5px';
            confirmBtn.style.cursor = 'pointer';
            confirmBtn.addEventListener('click', () => {
                this.confirmAttackers();
            });
            
            document.body.appendChild(confirmBtn);
        }
    }
    
    // Toggle creatura attaccante
    toggleAttacker(creature, cardEl) {
        const index = this.attackingCreatures.findIndex(c => 
            c.position === creature.position && c.playerId === creature.playerId
        );
        
        if (index >= 0) {
            // Rimuovi da attaccanti
            this.attackingCreatures.splice(index, 1);
            cardEl.classList.remove('is-attacking');
        } else {
            // Aggiungi ad attaccanti
            this.attackingCreatures.push(creature);
            cardEl.classList.add('is-attacking');
        }
    }
    
    // Conferma attaccanti
    confirmAttackers() {
        if (this.attackingCreatures.length === 0) {
            // Salta fase di combattimento se non ci sono attaccanti
            if (this.engine.skipCombat) {
                this.engine.skipCombat();
            } else {
                // Se skipCombat non esiste, passa alla fase successiva
                this.engine.endTurn();
            }
        } else {
            // Mostra UI per scegliere i bersagli
            this.showTargetSelectionUI();
        }
        
        // Rimuovi pulsante e classi
        const confirmBtn = document.getElementById('confirm-attackers');
        if (confirmBtn) confirmBtn.remove();
        document.querySelectorAll('.can-attack').forEach(el => {
            el.classList.remove('can-attack');
        });
    }
    
    // Mostra UI per selezione bersagli
    showTargetSelectionUI() {
        this.attackingCreatures.forEach(attacker => {
            const attackerEl = document.querySelector(
                `[data-player-id="${attacker.playerId}"][data-zone="field"][data-position="${attacker.position}"]`
            );
            
            if (attackerEl) {
                attackerEl.classList.add('selecting-target');
                
                // Evidenzia possibili bersagli
                this.highlightPossibleTargets(attacker);
                
                // Aggiungi listener per selezione bersaglio
                this.addTargetSelectionListeners(attacker);
            }
        });
    }
    
    // Evidenzia possibili bersagli
    highlightPossibleTargets(attacker) {
        const opponentId = 1 - attacker.playerId;
        
        // Evidenzia giocatore avversario
        const playerInfo = document.getElementById(`player${opponentId}-info`);
        playerInfo.classList.add('possible-target');
        
        // Evidenzia creature avversarie
        const opponentCreatures = this.engine.state.players[opponentId].field;
        opponentCreatures.forEach((creature, position) => {
            if (creature) {
                const cardEl = document.querySelector(
                    `[data-player-id="${opponentId}"][data-zone="field"][data-position="${position}"]`
                );
                if (cardEl) {
                    cardEl.classList.add('possible-target');
                }
            }
        });
    }
    
    // Aggiungi listener per selezione bersaglio
    addTargetSelectionListeners(attacker) {
        const opponentId = 1 - attacker.playerId;
        
        // Click su giocatore avversario
        const playerInfo = document.getElementById(`player${opponentId}-info`);
        const playerClickHandler = (e) => {
            e.stopPropagation();
            this.selectAttackTarget(attacker, { type: 'player', playerId: opponentId });
            playerInfo.removeEventListener('click', playerClickHandler);
        };
        playerInfo.addEventListener('click', playerClickHandler);
        
        // Click su creature avversarie
        const opponentCreatures = this.engine.state.players[opponentId].field;
        opponentCreatures.forEach((creature, position) => {
            if (creature) {
                const cardEl = document.querySelector(
                    `[data-player-id="${opponentId}"][data-zone="field"][data-position="${position}"]`
                );
                if (cardEl) {
                    const creatureClickHandler = (e) => {
                        e.stopPropagation();
                        this.selectAttackTarget(attacker, { 
                            type: 'creature', 
                            playerId: opponentId,
                            position: position 
                        });
                        cardEl.removeEventListener('click', creatureClickHandler);
                    };
                    cardEl.addEventListener('click', creatureClickHandler);
                }
            }
        });
    }
    
    // Seleziona bersaglio per attacco
    selectAttackTarget(attacker, target) {
        // Memorizza il bersaglio
        attacker.target = target;
        
        // Rimuovi evidenziazione
        document.querySelectorAll('.possible-target, .selecting-target').forEach(el => {
            el.classList.remove('possible-target', 'selecting-target');
        });
        
        // Controlla se tutti gli attaccanti hanno un bersaglio
        const allHaveTargets = this.attackingCreatures.every(a => a.target);
        if (allHaveTargets) {
            this.engine.declareAttackers(this.attackingCreatures);
            this.attackingCreatures = [];
        }
    }
    
    // Mostra UI per dichiarare bloccanti
    showDeclareBlockersUI(attackers) {
        // Evidenzia creature che possono bloccare
        const defendingPlayer = 1 - this.engine.state.currentPlayer;
        const defenders = this.engine.state.players[defendingPlayer].field;
        
        defenders.forEach((creature, position) => {
            if (creature && !creature.tapped) {
                const cardEl = document.querySelector(
                    `[data-player-id="${defendingPlayer}"][data-zone="field"][data-position="${position}"]`
                );
                if (cardEl) {
                    cardEl.classList.add('can-block');
                }
            }
        });
        
        // Evidenzia attaccanti
        attackers.forEach(attacker => {
            const cardEl = document.querySelector(
                `[data-player-id="${attacker.playerId}"][data-zone="field"][data-position="${attacker.position}"]`
            );
            if (cardEl) {
                cardEl.classList.add('is-attacking');
            }
        });
        
        // Mostra pulsante conferma
        const existingBtn = document.getElementById('confirm-blockers');
        if (!existingBtn) {
            const confirmBtn = document.createElement('button');
            confirmBtn.id = 'confirm-blockers';
            confirmBtn.textContent = 'Conferma Bloccanti';
            confirmBtn.className = 'confirm-combat-btn';
            confirmBtn.style.position = 'fixed';
            confirmBtn.style.bottom = '20px';
            confirmBtn.style.left = '50%';
            confirmBtn.style.transform = 'translateX(-50%)';
            confirmBtn.style.zIndex = '1000';
            confirmBtn.style.padding = '10px 20px';
            confirmBtn.style.backgroundColor = '#e74c3c';
            confirmBtn.style.color = 'white';
            confirmBtn.style.border = 'none';
            confirmBtn.style.borderRadius = '5px';
            confirmBtn.style.cursor = 'pointer';
            confirmBtn.addEventListener('click', () => {
                this.confirmBlockers();
            });
            
            document.body.appendChild(confirmBtn);
        }
    }
    
    // Seleziona bloccante
    selectBlocker(creature, cardEl) {
        if (this.selectedCreature) {
            // Assegna bloccante ad attaccante
            // TODO: Implementare selezione attaccante da bloccare
        } else {
            this.selectedCreature = creature;
            cardEl.classList.add('selected-blocker');
        }
    }
    
    // Conferma bloccanti
    confirmBlockers() {
        this.engine.declareBlockers(this.blockingAssignments);
        this.blockingAssignments.clear();
        this.hideCombatUI();
    }
    
    // Nascondi UI combattimento
    hideCombatUI() {
        // Rimuovi pulsanti
        const confirmAttackers = document.getElementById('confirm-attackers');
        if (confirmAttackers) confirmAttackers.remove();
        
        const confirmBlockers = document.getElementById('confirm-blockers');
        if (confirmBlockers) confirmBlockers.remove();
        
        // Rimuovi classi
        document.querySelectorAll('.can-attack, .can-block, .is-attacking, .is-blocking').forEach(el => {
            el.classList.remove('can-attack', 'can-block', 'is-attacking', 'is-blocking');
        });
        
        // Rimuovi eventuali frecce di attacco rimaste
        document.querySelectorAll('.attack-arrow').forEach(arrow => {
            arrow.remove();
        });
    }
    
    // Mostra animazione di combattimento
    showCombatAnimation(attacker, defender, damage) {
        console.log('showCombatAnimation v3 - nessuna freccia, solo animazione danno:', damage);
        
        const attackerEl = document.querySelector(
            `[data-player-id="${attacker.playerId}"][data-zone="${attacker.zone}"][data-position="${attacker.position}"]`
        );
        const defenderEl = document.querySelector(
            `[data-player-id="${defender.playerId}"][data-zone="${defender.zone}"][data-position="${defender.position}"]`
        );
        
        if (!attackerEl || !defenderEl) {
            console.log('Elementi non trovati');
            return;
        }
        
        // Animazione di attacco
        attackerEl.classList.add('combat-attacking');
        
        // Animazione più semplice: flash rosso sul difensore
        setTimeout(() => {
            attackerEl.classList.remove('combat-attacking');
            
            // Scuoti e flash il difensore
            defenderEl.classList.add('combat-hit');
            
            // Mostra danno
            const damageEl = document.createElement('div');
            damageEl.className = 'floating-damage';
            damageEl.textContent = `-${damage}`;
            damageEl.style.position = 'absolute';
            damageEl.style.top = '50%';
            damageEl.style.left = '50%';
            damageEl.style.transform = 'translate(-50%, -50%)';
            damageEl.style.zIndex = '1001';
            
            defenderEl.style.position = 'relative';
            defenderEl.appendChild(damageEl);
            
            setTimeout(() => {
                defenderEl.classList.remove('combat-hit');
                if (damageEl.parentNode) {
                    damageEl.remove();
                }
            }, 1500);
        }, 300);
    }
    
    // Mostra danno sulla carta
    showDamageOnCard(creature, damage) {
        const cardEl = document.querySelector(
            `[data-player-id="${creature.playerId}"][data-zone="${creature.zone}"][data-position="${creature.position}"]`
        );
        
        if (!cardEl) return;
        
        // Crea indicatore di danno
        const damageEl = document.createElement('div');
        damageEl.className = 'floating-damage';
        damageEl.textContent = `-${damage}`;
        damageEl.style.position = 'absolute';
        damageEl.style.top = '50%';
        damageEl.style.left = '50%';
        damageEl.style.transform = 'translate(-50%, -50%)';
        
        cardEl.appendChild(damageEl);
        
        // Rimuovi dopo l'animazione
        setTimeout(() => {
            damageEl.remove();
        }, 1500);
        
        // Aggiorna visivamente la salute se è una creatura
        if (creature.card.currentHealth !== undefined) {
            this.updateCreatureHealth(creature);
        }
    }
    
    // Aggiorna la salute visiva di una creatura
    updateCreatureHealth(creature) {
        const cardEl = document.querySelector(
            `[data-player-id="${creature.playerId}"][data-zone="${creature.zone}"][data-position="${creature.position}"]`
        );
        
        if (!cardEl) return;
        
        // Trova o crea l'indicatore di salute
        let healthIndicator = cardEl.querySelector('.current-health');
        if (!healthIndicator) {
            healthIndicator = document.createElement('div');
            healthIndicator.className = 'current-health';
            cardEl.appendChild(healthIndicator);
        }
        
        const maxHealth = creature.card.stats?.health || creature.card.health || 
                         creature.card.stats?.defense || creature.card.defense || 1;
        const currentHealth = creature.card.currentHealth;
        
        // Mostra solo se la salute è diversa dal massimo
        if (currentHealth < maxHealth && currentHealth > 0) {
            healthIndicator.textContent = currentHealth;
            healthIndicator.style.display = 'block';
            
            // Colora in base alla salute
            if (currentHealth <= maxHealth / 3) {
                healthIndicator.style.backgroundColor = '#ff4444';
            } else if (currentHealth <= maxHealth * 2 / 3) {
                healthIndicator.style.backgroundColor = '#ffaa44';
            } else {
                healthIndicator.style.backgroundColor = '#44ff44';
            }
        } else {
            healthIndicator.style.display = 'none';
        }
    }
    
    // Mostra danno al giocatore
    showDamageToPlayer(playerId, damage) {
        const playerArea = document.getElementById(`player${playerId}-area`);
        if (!playerArea) return;
        
        // Crea indicatore di danno grande
        const damageEl = document.createElement('div');
        damageEl.className = 'player-damage';
        damageEl.textContent = `-${damage}`;
        damageEl.style.position = 'absolute';
        damageEl.style.top = '50%';
        damageEl.style.left = '50%';
        damageEl.style.transform = 'translate(-50%, -50%)';
        
        playerArea.appendChild(damageEl);
        
        // Flash rosso sull'area del giocatore
        playerArea.classList.add('damage-flash');
        
        // Rimuovi dopo l'animazione
        setTimeout(() => {
            damageEl.remove();
            playerArea.classList.remove('damage-flash');
        }, 1500);
    }
    
    // Mostra messaggio di gioco
    showMessage(message, type = 'info') {
        const messageEl = document.createElement('div');
        messageEl.className = `game-message ${type}`;
        messageEl.textContent = message;
        messageEl.style.position = 'fixed';
        messageEl.style.top = '20px';
        messageEl.style.left = '50%';
        messageEl.style.transform = 'translateX(-50%)';
        messageEl.style.background = type === 'error' ? '#e74c3c' : '#3498db';
        messageEl.style.color = 'white';
        messageEl.style.padding = '10px 20px';
        messageEl.style.borderRadius = '5px';
        messageEl.style.zIndex = '9999';
        
        // Aggiungi al body se message-area non esiste
        const messageArea = document.getElementById('message-area');
        if (messageArea) {
            messageArea.appendChild(messageEl);
        } else {
            document.body.appendChild(messageEl);
        }
        
        // Rimuovi dopo qualche secondo
        setTimeout(() => {
            messageEl.remove();
        }, 3000);
    }
    
    // Mostra modal di fine gioco
    showGameOver(winner, winnerName) {
        const modal = document.createElement('div');
        modal.className = 'game-over-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h2>Partita Terminata!</h2>
                <p>Vincitore: ${winnerName || `Giocatore ${winner + 1}`}</p>
                <button onclick="location.reload()">Nuova Partita</button>
            </div>
        `;
        
        document.body.appendChild(modal);
    }
    
    // Mostra dettaglio carta
    showCardDetail(card) {
        const modal = document.getElementById('card-detail-modal');
        const modalContent = document.getElementById('modal-card-detail');
        
        if (modal && modalContent) {
            // Genera l'SVG della carta
            try {
                const svgContent = CardRenderer.generateCardSVG(card);
                modalContent.innerHTML = svgContent;
                modal.style.display = 'block';
                
                // Aggiungi listener per chiudere il modal
                const closeBtn = modal.querySelector('.close');
                if (closeBtn) {
                    closeBtn.onclick = () => {
                        modal.style.display = 'none';
                    };
                }
                
                // Chiudi cliccando fuori dal modal
                modal.onclick = (e) => {
                    if (e.target === modal) {
                        modal.style.display = 'none';
                    }
                };
            } catch (error) {
                console.error('Errore nel mostrare dettaglio carta:', error);
            }
        }
    }
    
    // === METODI MANCANTI PER COMPATIBILITA' CON GAME ENGINE ===
    
    showTurnChange(playerName) {
        const modal = document.getElementById('turn-change-modal');
        const message = document.getElementById('turn-change-message');
        if (modal && message) {
            message.textContent = `Turno di ${playerName}`;
            modal.style.display = 'block';
        }
    }
    
    hideTurnChangeModal() {
        const modal = document.getElementById('turn-change-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    }
    
    showAttackerSelection() {
        this.showDeclareAttackersUI();
    }
    
    showTargetingMode(validTargets) {
        // TODO: Implementare se necessario
        console.log('showTargetingMode chiamato con:', validTargets);
    }
    
    hideTargetingMode() {
        // TODO: Implementare se necessario
        console.log('hideTargetingMode chiamato');
    }
    
    showTargetSelection(attacker, validTargets) {
        // TODO: Implementare se necessario
        console.log('showTargetSelection chiamato per:', attacker, 'targets:', validTargets);
    }
    
    hideTargetSelection() {
        // TODO: Implementare se necessario
        console.log('hideTargetSelection chiamato');
    }
    
    updateCombatVisuals() {
        // TODO: Implementare se necessario
        console.log('updateCombatVisuals chiamato');
    }
    
    showPauseMenu() {
        // TODO: Implementare se necessario
        console.log('showPauseMenu chiamato');
    }
    
    hidePauseMenu() {
        // TODO: Implementare se necessario
        console.log('hidePauseMenu chiamato');
    }
}

// Esporta la classe
window.UIManager = UIManager;