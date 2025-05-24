// game-ui.js - Gestione dell'interfaccia utente
class GameUI {
    constructor(engine) {
        this.engine = engine;
        this.cardRenderer = null; // Verrà inizializzato dopo
        this.selectedCard = null;
        this.draggedCard = null;
    }

    // Inizializza l'UI
    init() {
        // Usa direttamente CardRenderer invece di LiryaCardRenderer
        if (window.CardRenderer) {
            this.cardRenderer = {
                renderCard: (card) => {
                    try {
                        // Crea una copia della carta per non modificare l'originale
                        const cardCopy = { ...card };
                        
                        // Fix del percorso immagine per il contesto del gioco
                        if (cardCopy.imagePath && cardCopy.imagePath.includes('/images/')) {
                            // Mantieni il percorso con ../ per il gioco
                            if (!cardCopy.imagePath.startsWith('../')) {
                                cardCopy.imagePath = '../' + cardCopy.imagePath;
                            }
                        }
                        
                        let svg = window.CardRenderer.generateCardSVG(cardCopy);
                        
                        // Correggi i percorsi delle immagini nell'SVG generato
                        svg = svg.replace(/\.\/images\//g, '../images/');
                        
                        // Fix per immagini specchiate - rimuovi qualsiasi transform negativo
                        svg = svg.replace(/transform="[^"]*scale\(-1[^"]*\)"/g, '');
                        // Assicurati che le immagini non siano specchiate
                        svg = svg.replace(/<image /g, '<image transform="scale(1,1)" ');
                        
                        return svg;
                    } catch (error) {
                        console.error('Errore nel rendering della carta:', card.name, error);
                        return null;
                    }
                }
            };
            console.log('CardRenderer configurato in GameUI');
        } else if (window.LiryaCardRenderer) {
            this.cardRenderer = window.LiryaCardRenderer;
            console.log('LiryaCardRenderer configurato in GameUI');
        }
        this.setupDragAndDrop();
        this.setupClickHandlers();
    }

    // Aggiorna l'intero board
    updateBoard(state) {
        // Prima di aggiornare, rimuovi eventuali frecce rimaste
        document.querySelectorAll('.attack-line').forEach(line => line.remove());
        
        // Aggiorna info giocatori
        this.updatePlayerInfo(1, state.getPlayer(1));
        this.updatePlayerInfo(2, state.getPlayer(2));
        
        // Aggiorna mani
        this.updateHand(1, state.getPlayer(1));
        this.updateHand(2, state.getPlayer(2));
        
        // Aggiorna campo di gioco
        this.updateField(1, state.getPlayer(1));
        this.updateField(2, state.getPlayer(2));
        
        // Aggiorna indicatore turno
        this.updateTurnIndicator(state);
        
        // Nascondi carte dell'avversario se non è il suo turno
        this.hideOpponentCards(state.currentPlayer);
        
        // Mostra suggerimento per il primo turno
        if (state.turnNumber === 1 && !this.firstTurnMessageShown) {
            this.firstTurnMessageShown = true;
            this.showMessage("Doppio click o trascina le carte per giocarle!", 3000);
            
            // Spiega il combattimento manuale
            setTimeout(() => {
                this.showMessage("Combattimento MANUALE: dichiara attaccanti, poi l'avversario dichiara i bloccanti!", 5000);
            }, 3500);
        }
    }

    // Aggiorna info giocatore
    updatePlayerInfo(playerId, player) {
        document.getElementById(`player${playerId}-life`).textContent = player.life;
        document.getElementById(`player${playerId}-energy`).textContent = player.energy;
        document.getElementById(`player${playerId}-max-energy`).textContent = player.maxEnergy;
        document.getElementById(`player${playerId}-deck-count`).textContent = player.deck.length;
        document.getElementById(`player${playerId}-hand-count`).textContent = player.hand.length;
    }

    // Aggiorna la mano del giocatore
    updateHand(playerId, player) {
        const handElement = document.getElementById(`player${playerId}-hand`);
        handElement.innerHTML = '';
        
        player.hand.forEach((card, index) => {
            const cardElement = this.createCardElement(card, playerId, 'hand', index);
            handElement.appendChild(cardElement);
        });
    }

    // Aggiorna il campo di gioco
    updateField(playerId, player) {
        // Prima linea
        this.updateZone(`player${playerId}-first-line`, player.firstLine, playerId, 'firstLine');
        
        // Seconda linea
        this.updateZone(`player${playerId}-second-line`, player.secondLine, playerId, 'secondLine');
        
        // Strutture
        this.updateZone(`player${playerId}-structures`, player.structures, playerId, 'structures');
    }

    // Aggiorna una zona specifica
    updateZone(zoneId, cards, playerId, zoneName) {
        const zoneElement = document.getElementById(zoneId);
        const slotsContainer = zoneElement.querySelector('.line-slots, .structure-slots');
        
        if (!slotsContainer) return;
        
        const slots = slotsContainer.querySelectorAll('.card-slot');
        
        slots.forEach((slot, index) => {
            slot.innerHTML = '';
            const card = cards[index];
            
            if (card) {
                const cardElement = this.createCardElement(card, playerId, zoneName, index);
                slot.appendChild(cardElement);
            }
        });
    }

    // Crea elemento carta
    createCardElement(card, playerId, zone, position) {
        const cardDiv = document.createElement('div');
        cardDiv.className = 'game-card';
        cardDiv.dataset.playerId = playerId;
        cardDiv.dataset.zone = zone;
        cardDiv.dataset.position = position;
        
        // Rendi draggable le carte in mano del giocatore attivo
        if (zone === 'hand' && playerId === this.engine.state.currentPlayer) {
            cardDiv.draggable = true;
        }
        
        // Usa il renderer esistente per creare l'SVG se disponibile
        if (this.cardRenderer && this.cardRenderer.renderCard) {
            const svgString = this.cardRenderer.renderCard(card);
            
            // Crea un wrapper per l'SVG con le stats
            cardDiv.innerHTML = `
                <div style="width: 100%; height: 100%; position: relative;">
                    ${svgString}
                </div>
            `;
        } else {
            // Fallback: mostra una carta semplice con tutte le info
            const bgColor = this.getCardBackground(card);
            cardDiv.innerHTML = `
                <div style="width: 100%; height: 100%; background: ${bgColor}; 
                            border-radius: 8px; border: 2px solid #333;
                            display: flex; flex-direction: column; position: relative;
                            padding: 8px; color: white; box-shadow: 0 2px 4px rgba(0,0,0,0.5);">
                    <!-- Top bar con nome e costo -->
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 4px;">
                        <div style="background: rgba(0,0,0,0.7); padding: 6px; border-radius: 4px; flex: 1; margin-right: 4px;">
                            <div style="font-size: 0.8em; font-weight: bold; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">
                                ${card.name || 'Carta'}
                            </div>
                        </div>
                        <div style="background: rgba(0,0,0,0.8); padding: 4px 8px; 
                                    border-radius: 4px; font-size: 1.1em; font-weight: bold; min-width: 40px; text-align: center;">⚡${card.cost || 0}</div>
                    </div>
                    
                    <!-- Tipo carta -->
                    <div style="font-size: 0.6em; text-align: center; color: #ddd;">${card.class || card.type || ''}</div>
                    
                    <!-- Abilità/Effetti -->
                    ${card.abilities && card.abilities.length > 0 ? `
                        <div style="flex: 1; padding: 4px; overflow: hidden;">
                            <div style="font-size: 0.55em; line-height: 1.2; color: #fff; 
                                        max-height: 60px; overflow-y: auto;">
                                ${card.abilities.map(a => `
                                    <div style="margin-bottom: 2px;">
                                        <span style="font-weight: bold;">${a.name}:</span> ${a.effect}
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : `
                        <div style="flex: 1; display: flex; align-items: center; justify-content: center; margin: 5px 0;">
                            <div style="font-size: 0.7em; text-align: center; line-height: 1.3; color: #ddd;">
                                ${card.class || ''}<br>
                                ${card.element || ''}
                            </div>
                        </div>
                    `}
                    
                    ${card.type == 'Personaggio' ? `
                        <!-- Stats bar per personaggi (in basso) -->
                        <div style="display: flex; justify-content: space-around; gap: 3px; margin-top: auto;">
                            <div style="background: rgba(255,0,0,0.8); padding: 3px 6px; 
                                        border-radius: 4px; font-weight: bold; font-size: 0.9em; flex: 1; text-align: center;">⚔️${card.stats?.attack || card.attack || 0}</div>
                            <div style="background: rgba(0,100,255,0.8); padding: 3px 6px; 
                                        border-radius: 4px; font-weight: bold; font-size: 0.9em; flex: 1; text-align: center;">🛡️${card.stats?.defense || card.defense || 0}</div>
                            ${(card.stats?.health || card.health) ? `<div style="background: rgba(0,200,0,0.8); padding: 3px 6px; 
                                        border-radius: 4px; font-weight: bold; font-size: 0.9em; flex: 1; text-align: center;">❤️${card.stats?.health || card.health}</div>` : ''}
                        </div>
                    ` : `
                        <!-- Per non-personaggi mostra solo elemento se non ci sono abilità -->
                        ${!card.abilities || card.abilities.length === 0 ? `
                            <div style="flex: 1; display: flex; align-items: center; justify-content: center; padding: 4px;">
                                <div style="font-size: 0.7em; text-align: center; color: #ddd;">
                                    ${card.element || ''}
                                </div>
                            </div>
                        ` : ''}
                    `}
                </div>
            `;
        }
        
        // Aggiungi classe per il proprietario
        cardDiv.classList.add(`player${playerId}-card`);
        
        // Non aggiungiamo più overlay - le stats sono già nel div principale
        
        return cardDiv;
    }

    // Funzione rimossa - ora le stats sono integrate direttamente nel div della carta

    // Ottieni colore di sfondo basato sull'elemento
    getCardBackground(card) {
        const elementColors = {
            'Fuoco': 'linear-gradient(135deg, #ff6b6b, #ee5a24)',
            'Acqua': 'linear-gradient(135deg, #4ecdc4, #44a3aa)',
            'Terra': 'linear-gradient(135deg, #8b7355, #6b5537)',
            'Aria': 'linear-gradient(135deg, #a8e6cf, #7fcdcd)',
            'Luce': 'linear-gradient(135deg, #ffd93d, #ffed4e)',
            'Ombra': 'linear-gradient(135deg, #6c5ce7, #574b90)'
        };
        return elementColors[card.element] || 'linear-gradient(135deg, #667eea, #764ba2)';
    }

    // Aggiorna indicatore turno
    updateTurnIndicator(state) {
        const player = state.getActivePlayer();
        document.getElementById('active-player-name').textContent = `Turno di ${player.name}`;
        document.getElementById('turn-phase').textContent = `Fase: ${this.getPhaseText(state.currentPhase)}`;
        
        // Evidenzia area del giocatore attivo
        document.querySelectorAll('.player-area').forEach(area => {
            area.classList.remove('active-player');
        });
        document.getElementById(`player${state.currentPlayer}-area`).classList.add('active-player');
    }

    // Ottieni testo della fase
    getPhaseText(phase) {
        const phases = {
            'setup': 'Setup',
            'start': 'Inizio',
            'main': 'Principale',
            'combat_declare': 'Combattimento - Dichiara Attaccanti',
            'combat_block': 'Combattimento - Dichiara Bloccanti',
            'combat_damage': 'Combattimento - Risoluzione Danni',
            'end': 'Fine'
        };
        return phases[phase] || phase;
    }

    // Nascondi carte dell'avversario
    hideOpponentCards(activePlayer) {
        const opponentId = activePlayer === 1 ? 2 : 1;
        const opponentHand = document.getElementById(`player${opponentId}-hand`);
        
        if (opponentHand) {
            opponentHand.classList.toggle('hidden-cards', true);
        }
    }

    // Mostra cambio turno
    showTurnChange(playerName) {
        const modal = document.getElementById('turn-change-modal');
        const message = document.getElementById('turn-change-message');
        
        message.textContent = `Turno di ${playerName}`;
        modal.style.display = 'flex';
        
        // Auto-chiudi dopo 2 secondi se è CPU
        const player = this.engine.state.getActivePlayer();
        if (player.isAI) {
            setTimeout(() => {
                this.hideTurnChangeModal();
            }, 1500);
        }
    }

    // Nascondi modal cambio turno
    hideTurnChangeModal() {
        document.getElementById('turn-change-modal').style.display = 'none';
    }

    // Mostra messaggio
    showMessage(text, duration = 2000) {
        // Crea elemento messaggio se non esiste
        let messageEl = document.getElementById('game-message');
        if (!messageEl) {
            messageEl = document.createElement('div');
            messageEl.id = 'game-message';
            messageEl.className = 'game-message';
            document.body.appendChild(messageEl);
        }
        
        messageEl.textContent = text;
        messageEl.classList.add('show');
        
        setTimeout(() => {
            messageEl.classList.remove('show');
        }, duration);
    }

    // Mostra modalità targeting
    showTargetingMode(validTargets) {
        this.showMessage("Seleziona un bersaglio");
        
        // Evidenzia bersagli validi
        validTargets.forEach(target => {
            const selector = `[data-player-id="${target.playerId}"][data-zone="${target.zone}"][data-position="${target.position}"]`;
            const element = document.querySelector(selector);
            if (element) {
                element.classList.add('valid-target');
            }
        });
    }

    // Nascondi modalità targeting
    hideTargetingMode() {
        document.querySelectorAll('.valid-target').forEach(el => {
            el.classList.remove('valid-target');
        });
    }

    // Setup drag and drop
    setupDragAndDrop() {
        // Abilita drag per carte in mano
        document.addEventListener('dragstart', (e) => {
            const card = e.target.closest('.game-card');
            if (!card || card.dataset.zone !== 'hand') return;
            
            const playerId = parseInt(card.dataset.playerId);
            if (playerId !== this.engine.state.currentPlayer) return;
            
            this.draggedCard = {
                playerId: playerId,
                zone: card.dataset.zone,
                position: parseInt(card.dataset.position)
            };
            
            e.dataTransfer.effectAllowed = 'move';
            card.classList.add('dragging');
        });
        
        document.addEventListener('dragend', (e) => {
            const card = e.target.closest('.game-card');
            if (card) {
                card.classList.remove('dragging');
            }
            this.draggedCard = null;
        });
        
        // Gestisci drop su slot
        document.addEventListener('dragover', (e) => {
            const slot = e.target.closest('.card-slot');
            if (slot && !slot.querySelector('.game-card')) {
                e.preventDefault();
                slot.classList.add('drag-over');
            }
        });
        
        document.addEventListener('dragleave', (e) => {
            const slot = e.target.closest('.card-slot');
            if (slot) {
                slot.classList.remove('drag-over');
            }
        });
        
        document.addEventListener('drop', (e) => {
            const slot = e.target.closest('.card-slot');
            if (!slot || !this.draggedCard) return;
            
            e.preventDefault();
            slot.classList.remove('drag-over');
            
            // Determina dove è stato droppato
            const zone = slot.closest('.first-line, .second-line, .structures-zone');
            if (!zone) return;
            
            // Tenta di giocare la carta
            this.engine.playCard(this.draggedCard.playerId, this.draggedCard.position);
        });
    }

    // Setup click handlers
    setupClickHandlers() {
        // Doppio click per giocare carte dalla mano
        document.addEventListener('dblclick', (e) => {
            const card = e.target.closest('.game-card');
            if (!card) return;
            
            const playerId = parseInt(card.dataset.playerId);
            const zone = card.dataset.zone;
            const position = parseInt(card.dataset.position);
            
            // Solo carte in mano del giocatore attivo
            if (zone === 'hand' && playerId === this.engine.state.currentPlayer) {
                this.engine.playCard(playerId, position);
            }
        });
        
        // Click su carte
        document.addEventListener('click', (e) => {
            const card = e.target.closest('.game-card');
            const playerArea = e.target.closest('.player-area');
            
            // Se c'è un attaccante selezionato e clicchiamo su un'area giocatore valida
            if (this.engine.state.currentPhase === 'combat_declare' && 
                this.engine.state.combat.attackingCreature && 
                playerArea && !card) {
                const playerId = parseInt(playerArea.id.match(/player(\d+)-area/)[1]);
                if (playerArea.classList.contains('valid-target-player')) {
                    const target = {
                        type: 'player',
                        playerId: playerId
                    };
                    this.engine.selectAttackTarget(target);
                    return;
                }
            }
            
            if (!card) return;
            
            const playerId = parseInt(card.dataset.playerId);
            const zone = card.dataset.zone;
            const position = parseInt(card.dataset.position);
            
            // Gestione fasi di combattimento
            if (this.engine.state.currentPhase === 'combat_declare') {
                console.log('Click durante combat_declare', {
                    hasAttackingCreature: !!this.engine.state.combat.attackingCreature,
                    playerId,
                    zone,
                    position
                });
                
                // Se c'è un attaccante selezionato, gestisci la selezione del bersaglio
                if (this.engine.state.combat.attackingCreature) {
                    // Controlla se è un bersaglio valido
                    let target = null;
                    
                    // Verifica se è una creatura
                    if (zone === 'firstLine' || zone === 'secondLine') {
                        target = {
                            type: 'creature',
                            card: this.engine.state.getZone(playerId, zone)[position],
                            playerId,
                            zone,
                            position
                        };
                    }
                    
                    if (target && target.card) {
                        console.log('Selezionando bersaglio:', target);
                        this.engine.selectAttackTarget(target);
                        return;
                    }
                } else {
                    // Selezione attaccanti
                    if (playerId === this.engine.state.currentPlayer && 
                        (zone === 'firstLine' || zone === 'secondLine')) {
                        console.log('Dichiarando attaccante:', playerId, zone, position);
                        this.engine.declareAttacker(playerId, zone, position);
                        return;
                    }
                }
            }
            
            // Se in modalità targeting
            if (this.engine.state.targetingMode) {
                const target = {
                    playerId: playerId,
                    zone: zone,
                    position: position
                };
                
                // Verifica se è un bersaglio valido
                const isValid = this.engine.state.validTargets.some(t => 
                    t.playerId === target.playerId && 
                    t.zone === target.zone && 
                    t.position === target.position
                );
                
                if (isValid) {
                    this.engine.selectTarget(target);
                }
                return;
            }
            
            // Mostra dettagli carta
            this.showCardDetail(card);
        });
        
        // Modal cambio turno
        document.getElementById('confirm-turn').addEventListener('click', () => {
            this.hideTurnChangeModal();
        });
        
        // Chiudi modal dettagli
        document.querySelector('#card-detail-modal .close').addEventListener('click', () => {
            document.getElementById('card-detail-modal').style.display = 'none';
        });
    }

    // Mostra dettagli carta
    showCardDetail(cardElement) {
        const playerId = parseInt(cardElement.dataset.playerId);
        const zone = cardElement.dataset.zone;
        const position = parseInt(cardElement.dataset.position);
        
        const player = this.engine.state.getPlayer(playerId);
        let card = null;
        
        if (zone === 'hand') {
            card = player.hand[position];
        } else {
            const zoneArray = this.engine.state.getZone(playerId, zone);
            card = zoneArray[position];
        }
        
        if (!card) return;
        
        const modal = document.getElementById('card-detail-modal');
        const modalCard = document.getElementById('modal-card-detail');
        
        if (this.cardRenderer && this.cardRenderer.renderCard) {
            modalCard.innerHTML = this.cardRenderer.renderCard(card);
        } else {
            // Fallback per dettagli carta
            modalCard.innerHTML = `
                <div style="padding: 20px; color: white;">
                    <h3>${card.name}</h3>
                    <p>Tipo: ${card.type}</p>
                    <p>Costo: ${card.cost}</p>
                    ${card.type == 'Personaggio' ? `
                        <p>Attacco: ${card.stats?.attack || card.attack || 0}</p>
                        <p>Difesa: ${card.stats?.defense || card.defense || 0}</p>
                        ${(card.stats?.health || card.health) ? `<p>Vita: ${card.stats?.health || card.health}</p>` : ''}
                        ${card.class ? `<p>Classe: ${card.class}</p>` : ''}
                    ` : ''}
                    ${card.element ? `<p>Elemento: ${card.element}</p>` : ''}
                    ${card.description ? `<p>Descrizione: ${card.description}</p>` : ''}
                    ${card.abilities && card.abilities.length > 0 ? `
                        <p>Abilità:</p>
                        <ul>
                            ${card.abilities.map(a => `<li><strong>${a.name || 'Abilità'}</strong>: ${a.effect || a.description || ''}</li>`).join('')}
                        </ul>
                    ` : ''}
                </div>
            `;
        }
        modal.style.display = 'flex';
    }

    // Anima attacco
    animateAttack(attacker, damage) {
        const selector = `[data-player-id="${attacker.playerId}"][data-zone="${attacker.zone}"][data-position="${attacker.position}"]`;
        const attackerElement = document.querySelector(selector);
        
        if (attackerElement) {
            attackerElement.classList.add('attacking');
            
            // Mostra danno
            const damageIndicator = document.createElement('div');
            damageIndicator.className = 'damage-indicator';
            damageIndicator.textContent = `-${damage}`;
            attackerElement.appendChild(damageIndicator);
            
            setTimeout(() => {
                attackerElement.classList.remove('attacking');
                damageIndicator.remove();
            }, 1000);
        }
    }

    // Mostra game over
    showGameOver(winnerId, winnerName) {
        const message = `${winnerName} ha vinto la partita!`;
        
        // Crea modal game over
        const modal = document.createElement('div');
        modal.className = 'modal game-over-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h2>Partita Terminata!</h2>
                <p>${message}</p>
                <button onclick="window.location.reload()">Nuova Partita</button>
                <button onclick="window.location.href='../index.html'">Torna al Menu</button>
            </div>
        `;
        
        document.body.appendChild(modal);
        modal.style.display = 'flex';
    }

    // Mostra menu pausa
    showPauseMenu() {
        // Implementa menu pausa
        this.showMessage("Gioco in pausa");
    }

    // Nascondi menu pausa
    hidePauseMenu() {
        this.showMessage("Gioco ripreso");
    }
    
    // Mostra selezione attaccanti
    showAttackerSelection() {
        this.showMessage("Clicca sulle tue creature per selezionarle, poi clicca sul bersaglio", 3000);
        
        // Aggiungi pulsante conferma
        if (!document.getElementById('confirm-attackers')) {
            const button = document.createElement('button');
            button.id = 'confirm-attackers';
            button.className = 'combat-button';
            button.textContent = 'Conferma Attacchi';
            button.onclick = () => this.engine.confirmAttackers();
            document.getElementById('turn-indicator').appendChild(button);
        }
        
        // Evidenzia creature che possono attaccare
        const activePlayer = this.engine.state.currentPlayer;
        document.querySelectorAll(`.player${activePlayer}-card`).forEach(card => {
            const zone = card.dataset.zone;
            if (zone === 'firstLine' || zone === 'secondLine') {
                card.classList.add('can-attack');
            }
        });
    }
    
    // Mostra selezione bersagli per un attaccante
    showTargetSelection(attacker, validTargets) {
        // Evidenzia l'attaccante selezionato
        const attackerEl = document.querySelector(
            `[data-player-id="${attacker.playerId}"][data-zone="${attacker.zone}"][data-position="${attacker.position}"]`
        );
        if (attackerEl) {
            attackerEl.classList.add('selected-attacker');
        }
        
        // Evidenzia i bersagli validi
        validTargets.forEach(target => {
            if (target.type === 'player') {
                // Evidenzia l'area del giocatore bersaglio
                const playerArea = document.getElementById(`player${target.playerId}-area`);
                if (playerArea) {
                    playerArea.classList.add('valid-target-player');
                }
            } else if (target.type === 'creature') {
                // Evidenzia la creatura bersaglio
                const targetEl = document.querySelector(
                    `[data-player-id="${target.playerId}"][data-zone="${target.zone}"][data-position="${target.position}"]`
                );
                if (targetEl) {
                    targetEl.classList.add('valid-target');
                }
            }
        });
        
        this.showMessage(`Seleziona un bersaglio per ${attacker.card.name}`, 2000);
    }
    
    // Nascondi selezione bersagli
    hideTargetSelection() {
        // Rimuovi evidenziazione attaccante
        document.querySelectorAll('.selected-attacker').forEach(el => {
            el.classList.remove('selected-attacker');
        });
        
        // Rimuovi evidenziazione bersagli
        document.querySelectorAll('.valid-target, .valid-target-player').forEach(el => {
            el.classList.remove('valid-target', 'valid-target-player');
        });
    }
    
    // Mostra selezione bloccanti
    showBlockerSelection() {
        const defenderId = this.engine.state.currentPlayer === 1 ? 2 : 1;
        this.showMessage(`Giocatore ${defenderId} - Clicca sulle tue creature in prima linea per bloccare`, 3000);
        
        // Aggiungi pulsante conferma
        if (!document.getElementById('confirm-blockers')) {
            const button = document.createElement('button');
            button.id = 'confirm-blockers';
            button.className = 'combat-button';
            button.textContent = 'Conferma Bloccanti';
            button.onclick = () => this.engine.confirmBlockers();
            document.getElementById('turn-indicator').appendChild(button);
        }
        
        // Evidenzia creature che possono bloccare
        document.querySelectorAll(`.player${defenderId}-card`).forEach(card => {
            const zone = card.parentElement.dataset.zone;
            if (zone === 'firstLine') {
                card.classList.add('can-block');
            }
        });
        
        // Mostra attaccanti
        this.engine.state.combat.attackers.forEach(attacker => {
            const card = document.querySelector(
                `[data-player-id="${attacker.playerId}"][data-zone="${attacker.zone}"][data-position="${attacker.position}"]`
            );
            if (card) {
                card.classList.add('is-attacking');
            }
        });
    }
    
    // Aggiorna visualizzazione combattimento
    updateCombatVisuals() {
        // Rimuovi classi precedenti
        document.querySelectorAll('.is-attacking, .is-blocking, .attack-arrow').forEach(el => {
            if (el.classList.contains('attack-arrow')) {
                el.remove();
            } else {
                el.classList.remove('is-attacking', 'is-blocking');
            }
        });
        
        // Mostra attaccanti e le loro frecce verso i bersagli
        this.engine.state.combat.attackers.forEach(attacker => {
            const attackerEl = document.querySelector(
                `[data-player-id="${attacker.playerId}"][data-zone="${attacker.zone}"][data-position="${attacker.position}"]`
            );
            if (attackerEl) {
                attackerEl.classList.add('is-attacking');
                
                // Crea freccia verso il bersaglio se specificato
                if (attacker.target) {
                    this.createAttackArrow(attackerEl, attacker.target);
                }
            }
        });
    }
    
    // Crea una freccia di attacco verso il bersaglio
    createAttackArrow(attackerEl, target) {
        let targetEl = null;
        
        if (target.type === 'player') {
            targetEl = document.getElementById(`player${target.playerId}-info`);
        } else if (target.type === 'creature') {
            targetEl = document.querySelector(
                `[data-player-id="${target.playerId}"][data-zone="${target.zone}"][data-position="${target.position}"]`
            );
        }
        
        if (!targetEl) return;
        
        // Crea elemento freccia
        const arrow = document.createElement('div');
        arrow.className = 'attack-arrow';
        
        const attackerRect = attackerEl.getBoundingClientRect();
        const targetRect = targetEl.getBoundingClientRect();
        
        const startX = attackerRect.left + attackerRect.width / 2;
        const startY = attackerRect.top + attackerRect.height / 2;
        const endX = targetRect.left + targetRect.width / 2;
        const endY = targetRect.top + targetRect.height / 2;
        
        const angle = Math.atan2(endY - startY, endX - startX) * 180 / Math.PI;
        const distance = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
        
        arrow.style.position = 'fixed';
        arrow.style.left = startX + 'px';
        arrow.style.top = startY + 'px';
        arrow.style.width = distance + 'px';
        arrow.style.height = '3px';
        arrow.style.background = 'red';
        arrow.style.transformOrigin = '0 50%';
        arrow.style.transform = `rotate(${angle}deg)`;
        arrow.style.pointerEvents = 'none';
        arrow.style.zIndex = '1000';
        arrow.style.opacity = '0.7';
        
        // Aggiungi punta di freccia
        const arrowHead = document.createElement('div');
        arrowHead.style.position = 'absolute';
        arrowHead.style.right = '-10px';
        arrowHead.style.top = '-4px';
        arrowHead.style.width = '0';
        arrowHead.style.height = '0';
        arrowHead.style.borderLeft = '10px solid red';
        arrowHead.style.borderTop = '5px solid transparent';
        arrowHead.style.borderBottom = '5px solid transparent';
        arrow.appendChild(arrowHead);
        
        document.body.appendChild(arrow);
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
        document.querySelectorAll('.attack-line').forEach(line => {
            line.remove();
        });
    }
    
    // Mostra animazione di combattimento
    showCombatAnimation(attacker, defender, damage) {
        console.log('showCombatAnimation chiamata con danno:', damage);
        
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
        
        // Aggiorna vita nel display
        this.updatePlayerInfo(playerId, this.engine.state.getPlayer(playerId));
    }
}

// Esporta per uso globale
window.GameUI = GameUI;