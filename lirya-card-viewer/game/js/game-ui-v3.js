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
        
        // Bind dei metodi per mantenere il contesto
        this.handleZoneClick = this.handleZoneClick.bind(this);
        this.handleTargetClick = this.handleTargetClick.bind(this);
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
        
        // Click globale per deselezionare
        document.addEventListener('click', (e) => {
            // Debug per vedere cosa viene cliccato
            const gameCard = e.target.closest('.game-card');
            if (gameCard) {
                console.log('Global click intercepted on game-card:', {
                    element: gameCard,
                    classes: gameCard.className,
                    dataset: gameCard.dataset,
                    hasSelectedClass: gameCard.classList.contains('selected-card'),
                    computedBorder: window.getComputedStyle(gameCard).border
                });
            }
            
            // Debug per zone valide
            const validZone = e.target.closest('.valid-drop-zone');
            if (validZone) {
                console.log('Global click on valid-drop-zone:', {
                    element: validZone,
                    classes: validZone.className,
                    hasHandler: validZone.dataset.tempHandler
                });
            }
            
            // Se il click non è su una carta o zona valida, deseleziona
            // IMPORTANTE: Non fare nulla se il click è su una zona valida
            if (!e.target.closest('.game-card') && !e.target.closest('.valid-drop-zone')) {
                this.clearSelection();
            }
        });
    }
    
    // Metodo principale chiamato dal game engine (alias per renderGameState)
    updateBoard(state) {
        this.renderGameState(state);
        this.updateActionButtons(state);
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
        
        // Aggiorna l'evidenziazione del giocatore attivo
        this.updateActivePlayerHighlight();
        
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
                    
                    // Verifica che la carta esista e abbia le proprietà necessarie
                    if (!card || !card.name) {
                        console.error('[UI] Invalid card in firstLine position', position, 'creature:', creature);
                        return; // Skip this iteration in forEach
                    }
                    
                    // Se c'è un wrapper creatura, passa anche currentHealth alla carta
                    const cardWithHealth = creature.card ? {
                        ...card,
                        currentHealth: creature.currentHealth
                    } : card;
                    console.log('[UI] Rendering creature in firstLine:', creature, 'card:', card, 'hasWrapper:', !!creature.card);
                    const cardEl = this.createCardElement(cardWithHealth, {
                        playerId: playerId,
                        zone: 'firstLine',
                        position: position
                    }, creature);
                    
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
                    
                    // Verifica che la carta esista e abbia le proprietà necessarie
                    if (!card || !card.name) {
                        console.error('[UI] Invalid card in secondLine position', position, 'creature:', creature);
                        return; // Skip this iteration in forEach
                    }
                    
                    // Se c'è un wrapper creatura, passa anche currentHealth alla carta
                    const cardWithHealth = creature.card ? {
                        ...card,
                        currentHealth: creature.currentHealth
                    } : card;
                    const cardEl = this.createCardElement(cardWithHealth, {
                        playerId: playerId,
                        zone: 'secondLine',
                        position: position
                    }, creature);
                    
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
                    }, null, structure);  // Passa l'oggetto struttura
                    
                    this.addFieldCardEventListeners(cardEl, structure, playerId, position);
                    structureSlots[position].appendChild(cardEl);
                }
            });
        }
    }
    
    // Crea elemento carta (versione semplificata per compatibilità)
    createCardElement(card, metadata, creature = null, structure = null) {
        console.log('createCardElement called:', { card: card.name, metadata, hasCreature: !!creature, hasStructure: !!structure });
        
        // Se è una creatura sul campo e abbiamo l'oggetto creatura, usa il nuovo sistema
        if (creature && metadata.zone && (metadata.zone === 'firstLine' || metadata.zone === 'secondLine')) {
            console.log('Using CardDisplay for creature with creature object');
            if (this.engine.cardDisplay) {
                return this.engine.cardDisplay.createCreatureCard(creature, metadata, this.engine.abilities);
            }
        }
        
        // Se è una struttura e abbiamo l'oggetto struttura, usa il nuovo sistema
        if (structure && metadata.zone === 'structures' && this.engine.cardDisplay) {
            console.log('Using CardDisplay for structure with structure object');
            return this.engine.cardDisplay.createStructureCard(structure, metadata, this.engine.abilities);
        }
        
        // Fallback: prova a recuperare la struttura dalla posizione
        if (metadata.zone === 'structures' && this.engine.cardDisplay) {
            const structure = this.getStructureFromLocation(metadata);
            if (structure) {
                return this.engine.cardDisplay.createStructureCard(structure, metadata, this.engine.abilities);
            }
        }
        
        // Altrimenti usa il sistema standard per carte in mano
        const cardEl = document.createElement('div');
        cardEl.className = 'game-card';
        cardEl.draggable = false;
        
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
    
    // Ottieni creatura dalla posizione
    getCreatureFromLocation(location) {
        const player = this.engine.state.getPlayer(location.playerId);
        if (!player) return null;
        
        if (location.zone === 'firstLine') {
            return player.firstLine[location.position];
        } else if (location.zone === 'secondLine') {
            return player.secondLine[location.position];
        }
        return null;
    }
    
    // Ottieni struttura dalla posizione
    getStructureFromLocation(location) {
        const player = this.engine.state.getPlayer(location.playerId);
        if (!player) return null;
        
        if (location.zone === 'structures') {
            return player.structures[location.position];
        }
        return null;
    }
    
    // Aggiorna visualizzazione di una carta specifica
    updateCardDisplay(target) {
        const selector = `[data-player-id="${target.playerId}"][data-zone="${target.zone}"][data-position="${target.position}"]`;
        const oldElement = document.querySelector(selector);
        
        if (oldElement) {
            const newElement = this.createCardElement(target.card || target, {
                playerId: target.playerId,
                zone: target.zone,
                position: target.position
            });
            
            // Copia event listeners
            const parent = oldElement.parentNode;
            parent.replaceChild(newElement, oldElement);
            
            // Riapplica event listeners
            if (target.zone === 'firstLine' || target.zone === 'secondLine') {
                this.addFieldCardEventListeners(newElement, target, target.playerId, target.position);
            }
        }
    }
    
    // Event listeners per carte in mano
    addHandCardEventListeners(cardEl, card, playerId, index) {
        // Click per selezionare
        cardEl.addEventListener('click', (e) => {
            e.stopPropagation();
            console.log('Card clicked in hand:', { card: card.name, playerId, index });
            this.selectCard(card, playerId, index);
        });
        
        // Doppio click per ingrandire
        cardEl.addEventListener('dblclick', (e) => {
            e.stopPropagation();
            this.showCardDetail(card);
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
                console.log('Selecting attacker');
                this.selectAttacker(creature, cardEl);
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
        console.log('selectCard called:', { 
            card: card.name, 
            playerId, 
            playerIdType: typeof playerId,
            index,
            indexType: typeof index
        });
        
        // Deseleziona carta precedente
        document.querySelectorAll('.selected-card').forEach(el => {
            el.classList.remove('selected-card');
        });
        
        // Rimuovi zone evidenziate precedenti
        document.querySelectorAll('.valid-drop-zone').forEach(el => {
            el.classList.remove('valid-drop-zone');
        });
        
        // Rimuovi handler temporanei
        document.querySelectorAll('[data-temp-handler="true"]').forEach(el => {
            el.removeEventListener('click', this.handleZoneClick);
            delete el.dataset.tempHandler;
        });
        
        // Seleziona nuova carta
        const selector = `[data-player-id="${playerId}"][data-zone="hand"][data-position="${index}"]`;
        console.log('Looking for card with selector:', selector);
        const cardEl = document.querySelector(selector);
        console.log('Card element found:', cardEl);
        
        if (cardEl) {
            // Forza il refresh delle classi
            cardEl.offsetHeight; // Trigger reflow
            cardEl.classList.add('selected-card');
            this.selectedCard = { card, playerId, index };
            console.log('Selected card class added, current classes:', cardEl.className);
            console.log('Computed border style:', window.getComputedStyle(cardEl).border);
            
            // Evidenzia le zone valide per questa carta
            this.highlightValidZones(card, playerId);
        } else {
            console.error('Card element not found with selector:', selector);
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
    
    // Seleziona creatura come attaccante
    selectAttacker(creature, cardEl) {
        console.log('selectAttacker called:', creature);
        
        const zone = cardEl.dataset.zone;
        const position = parseInt(cardEl.dataset.position);
        const playerId = parseInt(cardEl.dataset.playerId);
        
        // Chiama declareAttacker del game engine
        const success = this.engine.declareAttacker(playerId, zone, position);
        
        if (success) {
            // Se c'è già un attaccante selezionato, deselezionalo
            if (this.selectedAttacker) {
                const prevEl = document.querySelector('.selected-attacker');
                if (prevEl) prevEl.classList.remove('selected-attacker');
            }
            
            // Seleziona il nuovo attaccante
            this.selectedAttacker = {
                creature,
                cardEl,
                zone,
                position,
                playerId
            };
            
            cardEl.classList.add('selected-attacker');
            
            // Mostra messaggio
            this.showMessage('Seleziona il bersaglio da attaccare', 'info');
            
            // Evidenzia i bersagli validi
            this.highlightValidTargets();
        }
    }
    
    // Evidenzia bersagli validi per l'attaccante selezionato
    highlightValidTargets() {
        if (!this.selectedAttacker) return;
        
        const opponentId = this.selectedAttacker.playerId === 1 ? 2 : 1;
        
        // Evidenzia il giocatore avversario
        const opponentArea = document.getElementById(`player${opponentId}-area`);
        if (opponentArea) {
            opponentArea.classList.add('valid-target');
            opponentArea.style.cursor = 'pointer';
            
            // Aggiungi handler temporaneo per il click
            opponentArea.dataset.tempHandler = 'true';
            opponentArea.addEventListener('click', this.handleTargetClick.bind(this));
        }
        
        // Evidenzia le creature avversarie nella prima linea
        const firstLineCreatures = document.querySelectorAll(
            `[data-player-id="${opponentId}"][data-zone="firstLine"]`
        );
        firstLineCreatures.forEach(el => {
            el.classList.add('valid-target');
            el.style.cursor = 'crosshair';
            // Aggiungi handler per il click
            el.addEventListener('click', this.handleTargetClick);
        });
        
        // Se l'attaccante può attaccare la seconda linea, evidenziala
        if (this.selectedAttacker.creature.canAttackSecondLine) {
            const secondLineCreatures = document.querySelectorAll(
                `[data-player-id="${opponentId}"][data-zone="secondLine"]`
            );
            secondLineCreatures.forEach(el => {
                el.classList.add('valid-target');
                el.style.cursor = 'crosshair';
                el.addEventListener('click', this.handleTargetClick);
            });
        }
    }
    
    // Gestisce il click su un bersaglio
    handleTargetClick(e) {
        e.stopPropagation();
        
        if (!this.selectedAttacker) return;
        
        const targetEl = e.currentTarget;
        
        // Se è l'area del giocatore
        if (targetEl.classList.contains('player-area')) {
            const targetPlayerId = parseInt(targetEl.id.match(/player(\d+)/)[1]);
            this.declareAttack(this.selectedAttacker, { type: 'player', playerId: targetPlayerId });
        }
        // Se è una creatura
        else if (targetEl.classList.contains('game-card')) {
            const targetData = {
                type: 'creature',
                playerId: parseInt(targetEl.dataset.playerId),
                zone: targetEl.dataset.zone,
                position: parseInt(targetEl.dataset.position)
            };
            this.declareAttack(this.selectedAttacker, targetData);
        }
    }
    
    // Dichiara un attacco
    declareAttack(attacker, target) {
        console.log('Declaring attack:', { attacker, target });
        
        // Chiama selectAttackTarget del game engine
        const success = this.engine.selectAttackTarget(target);
        
        if (success) {
            // Marca l'attaccante come "is-attacking"
            attacker.cardEl.classList.add('is-attacking');
            attacker.cardEl.classList.remove('selected-attacker');
            
            // Conta gli attacchi dal game engine
            const attackCount = this.engine.state.combat.attackers.length;
            this.showMessage(`${attackCount} attacco/i dichiarati`, 'info');
        } else {
            this.showMessage('Bersaglio non valido!', 'error');
        }
        
        // Rimuovi evidenziazione dei bersagli
        this.clearTargetHighlights();
        
        // Reset attaccante selezionato
        this.selectedAttacker = null;
    }
    
    // Rimuovi evidenziazione bersagli
    clearTargetHighlights() {
        document.querySelectorAll('.valid-target').forEach(el => {
            el.classList.remove('valid-target');
            el.style.cursor = '';
            
            // Rimuovi handler
            el.removeEventListener('click', this.handleTargetClick);
            
            if (el.dataset.tempHandler) {
                delete el.dataset.tempHandler;
            }
        });
    }
    
    // Conferma attaccanti
    confirmAttackers() {
        console.log('confirmAttackers called');
        
        // Se c'è un attaccante selezionato ma non ha scelto il bersaglio
        if (this.selectedAttacker) {
            this.showMessage('Seleziona un bersaglio per la creatura attaccante!', 'warning');
            return;
        }
        
        // Chiama direttamente confirmAttackers del game engine
        // Il game engine ha già registrato tutti gli attacchi via declareAttacker/selectAttackTarget
        this.engine.confirmAttackers();
        
        // Pulisci lo stato locale
        this.declaredAttacks = [];
        this.selectedAttacker = null;
        
        // Rimuovi pulsante e classi
        const confirmBtn = document.getElementById('confirm-attackers');
        if (confirmBtn) confirmBtn.remove();
        document.querySelectorAll('.can-attack').forEach(el => {
            el.classList.remove('can-attack');
        });
        document.querySelectorAll('.is-attacking').forEach(el => {
            el.classList.remove('is-attacking');
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
        
        // Auto-scroll al giocatore attivo
        const currentPlayer = this.engine.state.currentPlayer;
        const playerAreaId = currentPlayer === 1 ? 'player1-area' : 'player2-area';
        const playerArea = document.getElementById(playerAreaId);
        
        if (playerArea) {
            // Scroll fluido verso l'area del giocatore attivo
            playerArea.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center',
                inline: 'nearest'
            });
        }
        
        // Evidenzia il giocatore attivo
        this.updateActivePlayerHighlight();
    }
    
    hideTurnChangeModal() {
        const modal = document.getElementById('turn-change-modal');
        if (modal) {
            modal.style.display = 'none';
        }
        
        // Aggiorna i pulsanti dopo aver chiuso il modal
        if (this.engine && this.engine.state) {
            this.updateActionButtons(this.engine.state);
        }
    }
    
    // Aggiorna l'evidenziazione del giocatore attivo
    updateActivePlayerHighlight() {
        const player1Area = document.getElementById('player1-area');
        const player2Area = document.getElementById('player2-area');
        const currentPlayer = this.engine.state.currentPlayer;
        
        if (player1Area && player2Area) {
            // Rimuovi evidenziazione da entrambi
            player1Area.classList.remove('active-player');
            player2Area.classList.remove('active-player');
            
            // Aggiungi evidenziazione al giocatore corrente
            if (currentPlayer === 1) {
                player1Area.classList.add('active-player');
            } else {
                player2Area.classList.add('active-player');
            }
        }
    }
    
    // Aggiorna i pulsanti di azione in base allo stato del gioco
    updateActionButtons(state) {
        const attackButton = document.getElementById('attack-button');
        const endTurnButton = document.getElementById('end-turn');
        
        if (!attackButton || !endTurnButton) {
            console.log('Pulsanti non trovati:', { attackButton, endTurnButton });
            return;
        }
        
        // Verifica se il giocatore corrente ha creature che possono attaccare
        const currentPlayer = state.currentPlayer;
        
        // Verifica che il metodo getAllCreatures esista
        let creatures = [];
        if (state.getAllCreatures && typeof state.getAllCreatures === 'function') {
            creatures = state.getAllCreatures(currentPlayer);
        } else {
            // Fallback: conta manualmente le creature
            const player = state.getPlayer ? state.getPlayer(currentPlayer) : state.players[currentPlayer];
            if (player) {
                // Controlla prima linea
                if (player.firstLine) {
                    player.firstLine.forEach(card => {
                        if (card && card.type === 'Personaggio') {
                            creatures.push(card);
                        }
                    });
                }
                // Controlla seconda linea
                if (player.secondLine) {
                    player.secondLine.forEach(card => {
                        if (card && card.type === 'Personaggio') {
                            creatures.push(card);
                        }
                    });
                }
            }
        }
        
        const hasCreatures = creatures.length > 0;
        
        console.log('updateActionButtons:', {
            currentPlayer,
            currentPhase: state.currentPhase,
            creaturesCount: creatures.length,
            hasCreatures
        });
        
        // Mostra/nascondi il pulsante attacco in base alla fase e alla presenza di creature
        if (state.currentPhase === 'main' && hasCreatures) {
            attackButton.style.display = 'inline-block';
        } else {
            attackButton.style.display = 'none';
        }
        
        // Il pulsante Fine Turno è sempre visibile
        endTurnButton.style.display = 'inline-block';
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
    
    maintainCombatVisuals() {
        // Mantiene le visualizzazioni durante il combattimento
        console.log('maintainCombatVisuals chiamato');
        
        // Mostra frecce o linee di attacco se necessario
        if (this.engine.state.combat && this.engine.state.combat.attackers) {
            this.engine.state.combat.attackers.forEach(attacker => {
                // Trova l'elemento dell'attaccante
                const attackerEl = document.querySelector(
                    `[data-player-id="${attacker.playerId}"][data-zone="${attacker.zone}"][data-position="${attacker.position}"]`
                );
                
                if (attackerEl && attacker.target) {
                    // Aggiungi effetti visivi per mostrare l'attacco
                    attackerEl.classList.add('is-attacking-active');
                    
                    // TODO: Aggiungere frecce o linee verso il bersaglio
                }
            });
        }
    }
    
    showPauseMenu() {
        // TODO: Implementare se necessario
        console.log('showPauseMenu chiamato');
    }
    
    hidePauseMenu() {
        // TODO: Implementare se necessario
        console.log('hidePauseMenu chiamato');
    }
    
    // Aggiorna tutto il campo di gioco
    updateGameField() {
        // Semplicemente chiama updateBoard con lo stato corrente
        if (this.engine && this.engine.state) {
            this.updateBoard(this.engine.state);
        }
    }
    
    // Nasconde le carte dell'avversario
    hideOpponentCards(currentPlayerId) {
        const opponentId = currentPlayerId === 1 ? 2 : 1;
        
        // Seleziona tutte le carte nella mano dell'avversario
        const opponentHandCards = document.querySelectorAll(`#player${opponentId}-hand .game-card`);
        
        opponentHandCards.forEach(card => {
            // Aggiungi classe per nascondere il contenuto
            card.classList.add('hidden-card');
            
            // Sostituisci il contenuto con un dorso carta
            const svg = card.querySelector('svg');
            if (svg) {
                svg.style.opacity = '0';
            }
            
            // Aggiungi un overlay per il dorso
            if (!card.querySelector('.card-back')) {
                const cardBack = document.createElement('div');
                cardBack.className = 'card-back';
                cardBack.innerHTML = `
                    <div class="card-back-pattern">
                        <div class="card-back-logo">LIRYA</div>
                    </div>
                `;
                card.appendChild(cardBack);
            }
        });
    }
    
    // Mostra le carte di un giocatore (per quando è il suo turno)
    showPlayerCards(playerId) {
        const handCards = document.querySelectorAll(`#player${playerId}-hand .game-card`);
        
        handCards.forEach(card => {
            card.classList.remove('hidden-card');
            
            const svg = card.querySelector('svg');
            if (svg) {
                svg.style.opacity = '1';
            }
            
            const cardBack = card.querySelector('.card-back');
            if (cardBack) {
                cardBack.remove();
            }
        });
    }
    
    // Evidenzia le zone valide per una carta
    highlightValidZones(card, playerId) {
        if (!card) return;
        
        // Rimuovi evidenziazioni precedenti
        document.querySelectorAll('.valid-drop-zone').forEach(el => {
            el.classList.remove('valid-drop-zone');
        });
        
        // Solo il giocatore corrente può giocare carte
        if (playerId !== this.engine.state.currentPlayer) return;
        
        switch (card.type) {
            case 'Personaggio':
                // Determina la linea appropriata
                const targetLine = this.getTargetLineForCreature(card);
                const lineEl = document.querySelector(`#player${playerId}-${targetLine}`);
                if (lineEl) {
                    // Trova il container degli slot (.line-slots)
                    const slotsContainer = lineEl.querySelector('.line-slots');
                    if (slotsContainer) {
                        // Evidenzia gli slot vuoti
                        slotsContainer.querySelectorAll('.card-slot').forEach((slot, index) => {
                            const zone = targetLine === 'first-line' ? 'firstLine' : 'secondLine';
                            const occupied = this.engine.state.getPlayer(playerId)[zone][index];
                            if (!occupied) {
                                slot.classList.add('valid-drop-zone');
                                // Aggiungi click handler temporaneo
                                slot.dataset.tempHandler = 'true';
                                // Usa capture phase per assicurarsi che venga chiamato prima dell'handler globale
                                slot.addEventListener('click', this.handleZoneClick, true);
                            }
                        });
                    }
                }
                break;
                
            case 'Struttura':
                const structuresEl = document.querySelector(`#player${playerId}-structures`);
                if (structuresEl) {
                    // Trova il container degli slot (.structure-slots)
                    const slotsContainer = structuresEl.querySelector('.structure-slots');
                    if (slotsContainer) {
                        slotsContainer.querySelectorAll('.card-slot').forEach((slot, index) => {
                            const occupied = this.engine.state.getPlayer(playerId).structures[index];
                            if (!occupied) {
                                slot.classList.add('valid-drop-zone');
                                slot.dataset.tempHandler = 'true';
                                slot.addEventListener('click', this.handleZoneClick, true);
                            }
                        });
                    }
                }
                break;
                
            case 'Incantesimo':
            case 'Equipaggiamento':
                // Questi richiedono target, gestiti diversamente
                break;
        }
    }
    
    // Gestisce il click su una zona valida
    handleZoneClick(e) {
        e.stopPropagation();
        const slot = e.currentTarget;
        
        console.log('handleZoneClick called:', {
            slot,
            hasValidDropZone: slot.classList.contains('valid-drop-zone'),
            selectedCard: this.selectedCard
        });
        
        // Rimuovi il handler temporaneo
        if (slot.dataset.tempHandler) {
            delete slot.dataset.tempHandler;
            slot.removeEventListener('click', this.handleZoneClick, true);
        }
        
        if (!this.selectedCard || !slot.classList.contains('valid-drop-zone')) {
            console.log('Aborting: no selected card or not a valid drop zone');
            return;
        }
        
        const slotsContainer = slot.parentElement; // line-slots o structure-slots
        const zoneContainer = slotsContainer.parentElement; // element con ID
        const position = Array.from(slotsContainer.children).indexOf(slot);
        
        // Determina la zona dal container ID
        let zone;
        if (zoneContainer.id.includes('first-line')) {
            zone = 'firstLine';
        } else if (zoneContainer.id.includes('second-line')) {
            zone = 'secondLine';
        } else if (zoneContainer.id.includes('structures')) {
            zone = 'structures';
        }
        
        console.log('Zone click details:', {
            slotsContainerClass: slotsContainer.className,
            zoneContainerId: zoneContainer.id,
            zone,
            position,
            selectedCard: this.selectedCard
        });
        
        if (zone) {
            // Gioca la carta nella posizione selezionata
            const { playerId, index } = this.selectedCard;
            
            // Per ora usa il metodo standard che trova automaticamente uno slot
            // TODO: Modificare playCard per accettare una posizione specifica
            const result = this.engine.playCard(playerId, index);
            console.log('playCard result:', result);
            
            // Pulisci la selezione solo se la carta è stata giocata con successo
            if (result !== false) {
                this.clearSelection();
            }
        }
    }
    
    // Determina la linea target per una creatura
    getTargetLineForCreature(card) {
        // Logica per determinare prima o seconda linea in base alla classe
        const frontLineClasses = ['Guerriero', 'Ranger'];
        const backLineClasses = ['Mago', 'Chierico'];
        
        if (frontLineClasses.includes(card.class)) {
            return 'first-line';
        } else if (backLineClasses.includes(card.class)) {
            return 'second-line';
        }
        
        // Default basato su stats
        const attack = card.stats?.attack || card.attack || 0;
        const defense = card.stats?.defense || card.defense || 0;
        
        return attack > defense ? 'first-line' : 'second-line';
    }
    
    // Pulisce la selezione corrente
    clearSelection() {
        console.log('clearSelection called');
        this.selectedCard = null;
        
        // Rimuovi classi di selezione
        document.querySelectorAll('.selected-card').forEach(el => {
            el.classList.remove('selected-card');
        });
        
        // Rimuovi zone evidenziate e handler
        document.querySelectorAll('.valid-drop-zone').forEach(el => {
            el.classList.remove('valid-drop-zone');
            if (el.dataset.tempHandler) {
                console.log('Removing handler from slot:', el);
                delete el.dataset.tempHandler;
                el.removeEventListener('click', this.handleZoneClick, true);
            }
        });
    }
}

// Esporta la classe
window.UIManager = UIManager;