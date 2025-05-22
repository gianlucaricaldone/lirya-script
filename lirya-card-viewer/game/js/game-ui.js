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
        // Carica il renderer se disponibile
        if (window.LiryaCardRenderer) {
            this.cardRenderer = window.LiryaCardRenderer;
        }
        this.setupDragAndDrop();
        this.setupClickHandlers();
    }

    // Aggiorna l'intero board
    updateBoard(state) {
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
                    
                    ${card.type == 'Personaggio' ? `
                        <!-- Classe e elemento -->
                        <div style="flex: 1; display: flex; align-items: center; justify-content: center; margin: 5px 0;">
                            <div style="font-size: 0.7em; text-align: center; line-height: 1.3; color: #ddd;">
                                ${card.class || ''}<br>
                                ${card.element || ''}
                            </div>
                        </div>
                        
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
                        <!-- Contenuto per non-personaggi -->
                        <div style="flex: 1; display: flex; align-items: center; justify-content: center; padding: 4px;">
                            <div style="font-size: 0.7em; text-align: center; color: #ddd;">
                                ${card.element || ''}
                            </div>
                        </div>
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
            if (!card) return;
            
            const playerId = parseInt(card.dataset.playerId);
            const zone = card.dataset.zone;
            const position = parseInt(card.dataset.position);
            
            // Gestione fasi di combattimento
            if (this.engine.state.currentPhase === 'combat_declare') {
                // Selezione attaccanti
                if (playerId === this.engine.state.currentPlayer && 
                    (zone === 'firstLine' || zone === 'secondLine')) {
                    this.engine.declareAttacker(playerId, zone, position);
                    return;
                }
            } else if (this.engine.state.currentPhase === 'combat_block') {
                // Selezione bloccanti
                const defenderId = this.engine.state.currentPlayer === 1 ? 2 : 1;
                if (playerId === defenderId && zone === 'firstLine') {
                    // TODO: Implementare selezione dell'attaccante da bloccare
                    // Per ora blocca il primo attaccante disponibile
                    this.engine.declareBlocker(playerId, zone, position, 0);
                    return;
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
        this.showMessage("Clicca sulle tue creature per dichiarare gli attaccanti", 3000);
        
        // Aggiungi pulsante conferma
        if (!document.getElementById('confirm-attackers')) {
            const button = document.createElement('button');
            button.id = 'confirm-attackers';
            button.className = 'combat-button';
            button.textContent = 'Conferma Attaccanti';
            button.onclick = () => this.engine.confirmAttackers();
            document.getElementById('turn-indicator').appendChild(button);
        }
        
        // Evidenzia creature che possono attaccare
        const activePlayer = this.engine.state.currentPlayer;
        document.querySelectorAll(`.player${activePlayer}-card`).forEach(card => {
            const zone = card.parentElement.dataset.zone;
            if (zone === 'firstLine' || zone === 'secondLine') {
                card.classList.add('can-attack');
            }
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
        document.querySelectorAll('.is-attacking, .is-blocking').forEach(el => {
            el.classList.remove('is-attacking', 'is-blocking');
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
        
        // Mostra bloccanti
        this.engine.state.combat.blockers.forEach(blocker => {
            const card = document.querySelector(
                `[data-player-id="${blocker.playerId}"][data-zone="${blocker.zone}"][data-position="${blocker.position}"]`
            );
            if (card) {
                card.classList.add('is-blocking');
            }
        });
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
    }
    
    // Mostra animazione di combattimento
    showCombatAnimation(attacker, defender, damage) {
        const attackerEl = document.querySelector(
            `[data-player-id="${attacker.playerId}"][data-zone="${attacker.zone}"][data-position="${attacker.position}"]`
        );
        const defenderEl = document.querySelector(
            `[data-player-id="${defender.playerId}"][data-zone="${defender.zone}"][data-position="${defender.position}"]`
        );
        
        if (!attackerEl || !defenderEl) return;
        
        // Animazione di attacco
        attackerEl.classList.add('combat-attacking');
        
        // Crea linea di attacco
        const line = document.createElement('div');
        line.className = 'attack-line';
        
        const attackerRect = attackerEl.getBoundingClientRect();
        const defenderRect = defenderEl.getBoundingClientRect();
        
        const startX = attackerRect.left + attackerRect.width / 2;
        const startY = attackerRect.top + attackerRect.height / 2;
        const endX = defenderRect.left + defenderRect.width / 2;
        const endY = defenderRect.top + defenderRect.height / 2;
        
        const angle = Math.atan2(endY - startY, endX - startX) * 180 / Math.PI;
        const distance = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
        
        line.style.position = 'fixed';
        line.style.left = startX + 'px';
        line.style.top = startY + 'px';
        line.style.width = distance + 'px';
        line.style.transform = `rotate(${angle}deg)`;
        line.style.transformOrigin = '0 50%';
        
        document.body.appendChild(line);
        
        // Rimuovi animazioni dopo un delay
        setTimeout(() => {
            attackerEl.classList.remove('combat-attacking');
            line.remove();
            
            // Scuoti il difensore
            defenderEl.classList.add('combat-hit');
            setTimeout(() => {
                defenderEl.classList.remove('combat-hit');
            }, 300);
        }, 500);
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