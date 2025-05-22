// js/ui/uiManager.js - Gestione dell'interfaccia utente

class UIManager {
    constructor() {
        this.logContainer = null;
        this.temporaryMessages = [];
        this.animationQueue = [];
        this.init();
    }

    init() {
        this.logContainer = document.getElementById('game-log-content');
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Event listeners per l'interazione con le carte
        document.addEventListener('click', (e) => {
            if (e.target.closest('.card')) {
                this.handleCardClick(e);
            }
        });

        // Gestione hover delle carte
        document.addEventListener('mouseover', (e) => {
            if (e.target.closest('.card')) {
                this.handleCardHover(e, true);
            }
        });

        document.addEventListener('mouseout', (e) => {
            if (e.target.closest('.card')) {
                this.handleCardHover(e, false);
            }
        });

        // Setup drag and drop
        this.setupDragAndDrop();
        
        // Setup log toggle
        this.setupLogToggle();
    }

    setupDragAndDrop() {
        // Drag start su carte in mano
        document.addEventListener('dragstart', (e) => {
            const cardElement = e.target.closest('.card');
            if (cardElement && this.isCardInCurrentPlayerHand(cardElement)) {
                cardElement.classList.add('dragging');
                e.dataTransfer.setData('text/plain', cardElement.dataset.cardId);
                e.dataTransfer.effectAllowed = 'move';
            }
        });

        // Drag end
        document.addEventListener('dragend', (e) => {
            const cardElement = e.target.closest('.card');
            if (cardElement) {
                cardElement.classList.remove('dragging');
                this.clearDropZones();
            }
        });

        // Setup drop zones
        document.querySelectorAll('.zone').forEach(zone => {
            zone.addEventListener('dragover', (e) => {
                e.preventDefault();
                const cardId = e.dataTransfer.getData('text/plain');
                const card = this.findCardById(cardId);
                
                if (this.canDropInZone(card, zone)) {
                    zone.classList.add('drag-over');
                    e.dataTransfer.dropEffect = 'move';
                } else {
                    zone.classList.add('drag-invalid');
                    e.dataTransfer.dropEffect = 'none';
                }
            });

            zone.addEventListener('dragleave', (e) => {
                // Solo rimuovi se stiamo uscendo veramente dalla zona
                if (!zone.contains(e.relatedTarget)) {
                    zone.classList.remove('drag-over', 'drag-invalid');
                }
            });

            zone.addEventListener('drop', (e) => {
                e.preventDefault();
                const cardId = e.dataTransfer.getData('text/plain');
                const card = this.findCardById(cardId);
                
                if (this.canDropInZone(card, zone)) {
                    this.handleCardDrop(card, zone);
                }
                
                this.clearDropZones();
            });
        });
    }

    setupLogToggle() {
        const gameLog = document.getElementById('game-log');
        if (gameLog) {
            const toggleButton = document.createElement('button');
            toggleButton.className = 'game-log-toggle';
            toggleButton.innerHTML = '−';
            toggleButton.onclick = () => this.toggleGameLog();
            gameLog.appendChild(toggleButton);
        }
    }

    toggleGameLog() {
        const gameLog = document.getElementById('game-log');
        if (gameLog) {
            gameLog.classList.toggle('minimized');
            const toggle = gameLog.querySelector('.game-log-toggle');
            if (toggle) {
                toggle.innerHTML = gameLog.classList.contains('minimized') ? '+' : '−';
            }
        }
    }

    // === AGGIORNAMENTI UI PRINCIPALI ===

    updateUI() {
        this.updatePlayerStats();
        this.updateHands();
        this.updateBattlefield();
        this.updateControls();
        this.updateTurnIndicator();
        this.updateZoneSlots();
    }

    updatePlayerStats() {
        ['1', '2'].forEach(playerNum => {
            const player = gameState.players[playerNum];
            
            // Aggiorna statistiche
            this.updateElement(`p${playerNum}-health`, player.health);
            this.updateElement(`p${playerNum}-energy`, player.energy);
            this.updateElement(`p${playerNum}-hand-count`, player.hand.length);
            this.updateElement(`p${playerNum}-deck-count`, player.deck.length);
        });
    }

    updateHands() {
        ['1', '2'].forEach(playerNum => {
            this.updateHand(parseInt(playerNum));
        });
    }

    updateHand(playerNum) {
        const handElement = document.getElementById(`p${playerNum}-hand`);
        if (!handElement) return;

        const player = gameState.players[playerNum];
        handElement.innerHTML = '';

        player.hand.forEach(card => {
            const cardElement = this.createCardElement(card, true);
            
            // Solo il giocatore corrente può selezionare le carte
            if (playerNum === gameState.currentPlayer) {
                cardElement.addEventListener('click', () => this.selectCard(cardElement, card));
                
                // Evidenzia carte giocabili
                if (gameState.canPlayCard(card)) {
                    cardElement.classList.add('can-play');
                }
            }
            
            handElement.appendChild(cardElement);
        });
    }

    updateBattlefield() {
        ['1', '2'].forEach(playerNum => {
            this.updatePlayerBattlefield(parseInt(playerNum));
        });
    }

    updatePlayerBattlefield(playerNum) {
        const player = gameState.players[playerNum];
        
        const zones = [
            { name: 'front-line', data: player.frontLine },
            { name: 'back-line', data: player.backLine },
            { name: 'structures', data: player.structures }
        ];

        zones.forEach(zone => {
            const zoneElement = document.getElementById(`p${playerNum}-${zone.name}`);
            if (!zoneElement) return;

            zoneElement.innerHTML = '';

            zone.data.forEach(card => {
                const cardElement = this.createCardElement(card, true);
                
                // Aggiungi classe per carte nemiche
                if (playerNum !== gameState.currentPlayer) {
                    cardElement.classList.add('enemy');
                }
                
                zoneElement.appendChild(cardElement);
            });
        });
    }

    updateZoneSlots() {
        ['1', '2'].forEach(playerNum => {
            const player = gameState.players[playerNum];
            
            // Aggiorna contatori slot
            this.updateZoneSlot(playerNum, 'front-line', player.frontLine.length, 4);
            this.updateZoneSlot(playerNum, 'back-line', player.backLine.length, 4);
            this.updateZoneSlot(playerNum, 'structures', player.structures.length, 3);
        });
    }

    updateZoneSlot(playerNum, zoneName, current, max) {
        const slotElement = document.querySelector(`#p${playerNum}-${zoneName}`);
        if (!slotElement) return;

        const zoneSlotElement = slotElement.parentElement.querySelector('.zone-slots');
        if (zoneSlotElement) {
            zoneSlotElement.textContent = `${current}/${max}`;
            
            // Cambia colore se zona piena
            if (current >= max) {
                zoneSlotElement.style.color = '#ff6666';
            } else {
                zoneSlotElement.style.color = '#999';
            }
        }
    }

    updateControls() {
        const isCurrentPlayerTurn = gameState.currentPlayer;
        const canPlay = gameState.selectedCard && gameState.canPlayCard(gameState.selectedCard);
        const canAttack = gameState.canAttack();

        // Aggiorna stato pulsanti
        this.updateButton('btn-play-card', canPlay && gameState.phase === 'main');
        this.updateButton('btn-attack', canAttack && gameState.phase === 'main');
        this.updateButton('btn-end-turn', gameState.phase === 'main');
    }

    updateButton(buttonId, enabled) {
        const button = document.getElementById(buttonId);
        if (button) {
            button.disabled = !enabled;
        }
    }

    updateTurnIndicator() {
        this.updateElement('current-player', `Turno di: Giocatore ${gameState.currentPlayer}`);
    }

    updatePhaseIndicator(phase) {
        const phaseNames = {
            'draw': 'Pesca',
            'energy': 'Energia', 
            'main': 'Principale',
            'attack': 'Attacco',
            'end': 'Fine Turno'
        };
        
        this.updateElement('current-phase', `Fase: ${phaseNames[phase] || phase}`);
    }

    updatePlayerNames(deck1Name, deck2Name) {
        this.updateElement('p1-name', `🎮 Giocatore 1 (${deck1Name})`);
        this.updateElement('p2-name', `👤 Giocatore 2 (${deck2Name})`);
    }

    // === GESTIONE CARTE ===

    createCardElement(card, showDetails = true) {
        const cardElement = document.createElement('div');
        cardElement.className = `card element-${(card.element || 'neutral').toLowerCase()}`;
        cardElement.dataset.cardId = card.id;

        if (card.rarity) {
            cardElement.classList.add(card.rarity.toLowerCase().replace(' ', '-'));
        }

        if (!showDetails) {
            cardElement.innerHTML = '<div class="card-back">🂠</div>';
            return cardElement;
        }

        let statsHtml = '';
        if (card.type === 'Personaggio') {
            const currentHp = card.currentHp !== undefined ? card.currentHp : card.hp;
            statsHtml = `
                <div class="card-stats">
                    <span>⚔️${card.att}</span>
                    <span>🛡️${card.def}</span>
                    <span>❤️${currentHp}/${card.hp}</span>
                </div>
            `;
        } else if (card.type === 'Struttura') {
            const currentHp = card.currentHp !== undefined ? card.currentHp : card.hp;
            statsHtml = `<div class="card-stats"><span>🏗️${currentHp}/${card.hp}</span></div>`;
        } else if (card.type === 'Incantesimo') {
            let effectText = '';
            if (card.damage) effectText += `💥${card.damage} `;
            if (card.healing) effectText += `💚${card.healing} `;
            if (card.aoe) effectText += `🌊${card.aoe} `;
            if (effectText) {
                statsHtml = `<div class="card-stats"><span>${effectText}</span></div>`;
            }
        } else if (card.type === 'Equipaggiamento') {
            let effectText = '';
            if (card.attBonus) effectText += `⚔️+${card.attBonus} `;
            if (card.defBonus) effectText += `🛡️+${card.defBonus} `;
            if (card.hpBonus) effectText += `❤️+${card.hpBonus} `;
            if (effectText) {
                statsHtml = `<div class="card-stats"><span>${effectText}</span></div>`;
            }
        }

        cardElement.innerHTML = `
            <div class="card-header">
                <div class="card-name">${card.name}</div>
                <div class="card-cost">${card.cost || 0}</div>
            </div>
            ${statsHtml}
            <div class="card-type">${card.type}${card.class ? ' - ' + card.class : ''}</div>
        `;

        return cardElement;
    }

    selectCard(cardElement, card) {
        // Rimuovi selezione precedente
        document.querySelectorAll('.card.selected').forEach(el => 
            el.classList.remove('selected')
        );

        // Seleziona nuova carta
        cardElement.classList.add('selected');
        gameLogic.selectCard(card);
    }

    updateCardSelection(card) {
        // Aggiorna visualmente la selezione
        document.querySelectorAll('.card.selected').forEach(el => 
            el.classList.remove('selected')
        );

        const cardElements = document.querySelectorAll(`[data-card-id="${card.id}"]`);
        cardElements.forEach(el => el.classList.add('selected'));
    }

    // === GESTIONE EVENTI CARTE ===

    handleCardClick(event) {
        const cardElement = event.target.closest('.card');
        if (!cardElement) return;

        const cardId = cardElement.dataset.cardId;
        if (!cardId) return;

        // Trova la carta corrispondente
        const card = this.findCardById(cardId);
        if (card && gameState.currentPlayer) {
            // Solo le carte in mano del giocatore corrente possono essere selezionate
            const playerHand = gameState.getCurrentPlayer().hand;
            if (playerHand.some(c => c.id === card.id)) {
                this.selectCard(cardElement, card);
            }
        }
    }

    handleCardHover(event, isEntering) {
        const cardElement = event.target.closest('.card');
        if (!cardElement) return;

        if (isEntering) {
            cardElement.style.zIndex = '100';
        } else {
            cardElement.style.zIndex = '';
        }
    }

    findCardById(cardId) {
        // Cerca in tutte le zone di entrambi i giocatori
        for (let playerId of [1, 2]) {
            const player = gameState.players[playerId];
            const allCards = [
                ...player.hand,
                ...player.frontLine,
                ...player.backLine,
                ...player.structures
            ];
            
            const found = allCards.find(card => card.id == cardId);
            if (found) return found;
        }
        return null;
    }

    // === LOG DI GIOCO ===

    addLogEntry(message) {
        if (!this.logContainer) return;

        const logEntry = document.createElement('div');
        logEntry.className = 'log-entry fade-in';
        logEntry.textContent = `[Turno ${gameState.turn}] ${message}`;

        this.logContainer.appendChild(logEntry);
        this.logContainer.scrollTop = this.logContainer.scrollHeight;

        // Rimuovi vecchie entry se troppe
        const entries = this.logContainer.children;
        if (entries.length > 50) {
            entries[0].remove();
        }
    }

    clearLog() {
        if (this.logContainer) {
            this.logContainer.innerHTML = '';
        }
    }

    // === MESSAGGI TEMPORANEI ===

    showTemporaryMessage(message, type = 'info', duration = 3000) {
        const messageElement = document.createElement('div');
        messageElement.className = `temporary-message ${type}`;
        messageElement.textContent = message;
        messageElement.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: ${type === 'error' ? '#f44336' : type === 'warning' ? '#ff9800' : '#4CAF50'};
            color: white;
            padding: 15px 25px;
            border-radius: 8px;
            font-weight: bold;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            animation: fadeIn 0.3s ease-out;
        `;

        document.body.appendChild(messageElement);

        setTimeout(() => {
            messageElement.style.animation = 'fadeOut 0.3s ease-out';
            setTimeout(() => {
                if (messageElement.parentNode) {
                    messageElement.parentNode.removeChild(messageElement);
                }
            }, 300);
        }, duration);
    }

    // === ANIMAZIONI ===

    animateCardPlay(card) {
        // Trova l'elemento della carta e aggiungi animazione
        const cardElements = document.querySelectorAll(`[data-card-id="${card.id}"]`);
        cardElements.forEach(el => {
            el.classList.add('card-play-animation');
            setTimeout(() => el.classList.remove('card-play-animation'), 300);
        });
    }

    animateCardDraw(card, playerId) {
        // Animazione per carta pescata
        setTimeout(() => {
            const handElement = document.getElementById(`p${playerId}-hand`);
            if (handElement) {
                const lastCard = handElement.lastElementChild;
                if (lastCard) {
                    lastCard.classList.add('card-draw-animation');
                    setTimeout(() => lastCard.classList.remove('card-draw-animation'), 500);
                }
            }
        }, 100);
    }

    animateCardDestroy(card) {
        // Animazione per carta distrutta
        const cardElements = document.querySelectorAll(`[data-card-id="${card.id}"]`);
        cardElements.forEach(el => {
            el.style.animation = 'fadeOut 0.5s ease-out';
            setTimeout(() => {
                if (el.parentNode) {
                    el.parentNode.removeChild(el);
                }
            }, 500);
        });
    }

    // === DRAG AND DROP ===

    isCardInCurrentPlayerHand(cardElement) {
        const cardId = cardElement.dataset.cardId;
        const currentPlayerHand = gameState.getCurrentPlayer().hand;
        return currentPlayerHand.some(card => card.id == cardId);
    }

    canDropInZone(card, zoneElement) {
        if (!card || gameState.currentPlayer !== gameState.currentPlayer) return false;
        
        // Identifica la zona dal suo ID
        const zoneId = zoneElement.id;
        const playerId = zoneId.includes('p1-') ? 1 : 2;
        
        // Solo il giocatore corrente può droppare nelle sue zone
        if (playerId !== gameState.currentPlayer) return false;
        
        if (zoneId.includes('front-line')) {
            return this.canPlayInFrontLine(card);
        } else if (zoneId.includes('back-line')) {
            return this.canPlayInBackLine(card);
        } else if (zoneId.includes('structures')) {
            return card.type === 'Struttura' && gameState.getCurrentPlayer().structures.length < 3;
        }
        
        return false;
    }

    canPlayInFrontLine(card) {
        if (card.type !== 'Personaggio') return false;
        const frontLine = gameState.getCurrentPlayer().frontLine;
        return frontLine.length < 4 && gameState.canPlayCard(card);
    }

    canPlayInBackLine(card) {
        if (card.type !== 'Personaggio') return false;
        const backLine = gameState.getCurrentPlayer().backLine;
        return backLine.length < 4 && gameState.canPlayCard(card);
    }

    handleCardDrop(card, zoneElement) {
        // Forza il posizionamento nella zona specifica
        const zoneId = zoneElement.id;
        
        if (zoneId.includes('front-line')) {
            card.forcedZone = 'frontLine';
        } else if (zoneId.includes('back-line')) {
            card.forcedZone = 'backLine';
        } else if (zoneId.includes('structures')) {
            card.forcedZone = 'structures';
        }
        
        // Seleziona la carta e giocala
        gameLogic.selectCard(card);
        gameLogic.playCard(card);
        
        // Rimuovi il flag della zona forzata
        delete card.forcedZone;
    }

    clearDropZones() {
        document.querySelectorAll('.zone').forEach(zone => {
            zone.classList.remove('drag-over', 'drag-invalid');
        });
    }

    hideElement(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.classList.add('hidden');
        }
    }

    showElement(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.classList.remove('hidden');
        }
    }

    toggleElement(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.classList.toggle('hidden');
        }
    }

    // === UTILITY ===

    updateElement(elementId, content) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = content;
        }
    }

    hideElement(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.classList.add('hidden');
        }
    }

    showElement(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.classList.remove('hidden');
        }
    }

    toggleElement(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.classList.toggle('hidden');
        }
    }
    
    // === GESTIONE RESPONSIVE ===

    handleResize() {
        // Adatta l'UI alle nuove dimensioni
        const isMobile = window.innerWidth <= 768;
        
        if (isMobile) {
            // Nascondi log su mobile
            this.hideElement('game-log');
        } else {
            // Mostra log su desktop
            this.showElement('game-log');
        }

        // Aggiorna layout delle carte se necessario
        this.updateUI();
    }

    // === DEBUG ===

    getUIState() {
        return {
            logEntries: this.logContainer ? this.logContainer.children.length : 0,
            temporaryMessages: this.temporaryMessages.length,
            selectedCard: gameState.selectedCard ? gameState.selectedCard.name : null,
            currentPlayer: gameState.currentPlayer,
            phase: gameState.phase
        };
    }
}

// Istanza globale del UI Manager
const uiManager = new UIManager();

// Esporta per l'uso in altri file
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { UIManager, uiManager };
}