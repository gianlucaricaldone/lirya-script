// game-ui.js - Gestione dell'interfaccia utente
class GameUI {
    constructor(engine) {
        this.engine = engine;
        this.cardRenderer = null; // Verrà inizializzato dopo
        this.selectedCard = null;
        this.draggedCard = null;
        this.clickTimeout = null; // Per gestire doppi click
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
                        if (cardCopy.imagePath) {
                            // Se il percorso inizia con ./ rimuovilo
                            if (cardCopy.imagePath.startsWith('./')) {
                                cardCopy.imagePath = cardCopy.imagePath.substring(2);
                            }
                            // Se non inizia già con ../ aggiungilo
                            if (!cardCopy.imagePath.startsWith('../')) {
                                cardCopy.imagePath = '../' + cardCopy.imagePath;
                            }
                        }
                        
                        // Se la carta ha currentHealth, aggiorna i valori visualizzati
                        if (card.currentHealth !== undefined && card.type === 'Personaggio') {
                            // Salva i valori originali prima di modificarli
                            const originalHealth = cardCopy.stats?.health || cardCopy.health;
                            const originalDefense = cardCopy.stats?.defense || cardCopy.defense;
                            
                            // Calcola la vita massima
                            const maxHealth = originalHealth || originalDefense || 1;
                            
                            // Passa currentHealth al renderer
                            cardCopy.currentHealth = card.currentHealth;
                            
                            // Marca la carta come danneggiata se la vita corrente è inferiore alla massima
                            if (card.currentHealth < maxHealth) {
                                cardCopy.isDamaged = true;
                            }
                            
                            // NON sovrascrivere i valori massimi!
                            // Il card-renderer userà currentHealth per mostrare il valore attuale
                            // e i valori originali (health/defense) per determinare se è danneggiato
                        }
                        
                        // Aggiungi informazioni sulla posizione per il calcolo dei bonus
                        if (card.playerId !== undefined) {
                            cardCopy.playerId = card.playerId;
                            cardCopy.zone = card.zone;
                            cardCopy.position = card.position;
                        }
                        
                        // Calcola bonus condizionali dalle abilità
                        if (cardCopy.type === 'Personaggio' && this.engine && this.engine.abilities) {
                            const location = { playerId: card.playerId, zone: card.zone, position: card.position };
                            const bonuses = this.engine.abilities.calculateConditionalBonuses(cardCopy, location);
                            
                            // Applica i bonus temporanei
                            if (bonuses.attack !== 0 || bonuses.defense !== 0) {
                                cardCopy.temporaryBonuses = cardCopy.temporaryBonuses || {};
                                cardCopy.temporaryBonuses.attack = (cardCopy.temporaryBonuses.attack || 0) + bonuses.attack;
                                cardCopy.temporaryBonuses.defense = (cardCopy.temporaryBonuses.defense || 0) + bonuses.defense;
                            }
                            
                            // Copia anche i bonus delle aure se presenti sulla carta originale
                            if (card.auraBonuses) {
                                cardCopy.auraBonuses = { ...card.auraBonuses };
                            }
                        }
                        
                        // Debug prima di chiamare generateCardSVG
                        if (cardCopy.type === 'Personaggio' && cardCopy.isDamaged) {
                            console.log(`[GameUI] Chiamando generateCardSVG per ${cardCopy.name} danneggiato:`, {
                                currentHealth: cardCopy.currentHealth,
                                isDamaged: cardCopy.isDamaged,
                                stats: cardCopy.stats,
                                health: cardCopy.health,
                                defense: cardCopy.defense
                            });
                        }
                        
                        const svg = window.CardRenderer.generateCardSVG(cardCopy);
                        
                        // Non serve più correggere i percorsi nell'SVG
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
        
        // Aggiorna i pulsanti di azione
        this.updateActionButtons(state);
        
        // Nascondi carte dell'avversario se non è il suo turno
        this.hideOpponentCards(state.currentPlayer);
        
        // Mostra suggerimento per il primo turno
        if (state.turnNumber === 1 && !this.firstTurnMessageShown) {
            this.firstTurnMessageShown = true;
            this.showMessage("Click su una carta per selezionarla, poi click dove posizionarla!", 3000);
            
            // Spiega il combattimento manuale
            setTimeout(() => {
                this.showMessage("Doppio click su una carta per vedere i dettagli", 4000);
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
            const slotContent = cards[index];
            
            if (slotContent) {
                // Se è una creatura con wrapper, estrai la carta reale
                const card = slotContent.card || slotContent;
                
                // Se c'è un wrapper, passa anche currentHealth
                const cardData = slotContent.card ? {
                    ...card,
                    currentHealth: slotContent.currentHealth
                } : card;
                
                const cardElement = this.createCardElement(cardData, playerId, zoneName, index);
                
                // Aggiungi classi per stati speciali
                if (slotContent.tapped) {
                    cardElement.classList.add('tapped');
                }
                if (slotContent.summoningSickness) {
                    cardElement.classList.add('summoning-sickness');
                }
                
                slot.appendChild(cardElement);
            }
        });
    }

    // Crea elemento carta
    createCardElement(card, playerId, zone, position) {
        // Debug: verifica se la carta ha il flag isDamaged
        if (card.type === 'Personaggio' && card.currentHealth !== undefined) {
            console.log(`createCardElement per ${card.name}: currentHealth=${card.currentHealth}, isDamaged=${card.isDamaged}`);
        }
        
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
            // Passa i metadati di posizione alla carta
            const cardWithMeta = { ...card, playerId, zone, position };
            const svgString = this.cardRenderer.renderCard(cardWithMeta);
            
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
        // Nascondi le carte dell'avversario
        const opponentId = activePlayer === 1 ? 2 : 1;
        const opponentHand = document.getElementById(`player${opponentId}-hand`);
        
        if (opponentHand) {
            opponentHand.classList.add('hidden-cards');
        }
        
        // Mostra le carte del giocatore attivo
        const activeHand = document.getElementById(`player${activePlayer}-hand`);
        if (activeHand) {
            activeHand.classList.remove('hidden-cards');
        }
    }

    // Mostra cambio turno
    showTurnChange(playerName) {
        const modal = document.getElementById('turn-change-modal');
        const message = document.getElementById('turn-change-message');
        
        message.textContent = `Turno di ${playerName}`;
        modal.style.display = 'flex';
        
        // Auto-scroll al giocatore attivo
        const currentPlayer = this.engine.state.currentPlayer;
        const playerAreaId = currentPlayer === 1 ? 'player1-area' : 'player2-area';
        const playerArea = document.getElementById(playerAreaId);
        
        if (playerArea) {
            playerArea.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center',
                inline: 'nearest'
            });
        }
        
        // Evidenzia il giocatore attivo
        this.updateActivePlayerHighlight();
        
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
            player1Area.classList.remove('active-player');
            player2Area.classList.remove('active-player');
            
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
        
        if (!attackButton || !endTurnButton) return;
        
        // Verifica se il giocatore corrente ha creature
        const currentPlayer = state.currentPlayer;
        let creatures = [];
        
        if (state.getAllCreatures && typeof state.getAllCreatures === 'function') {
            creatures = state.getAllCreatures(currentPlayer);
        } else {
            // Fallback: conta manualmente le creature
            const player = state.getPlayer(currentPlayer);
            if (player) {
                if (player.firstLine) {
                    player.firstLine.forEach(card => {
                        if (card && card.type === 'Personaggio') {
                            creatures.push(card);
                        }
                    });
                }
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
        
        // Nel primo turno del primo giocatore non si può attaccare
        const isFirstTurn = state.turnNumber === 1 && state.currentPlayer === 1;
        
        // Mostra/nascondi il pulsante attacco
        if (state.currentPhase === 'main' && hasCreatures && !isFirstTurn) {
            attackButton.style.display = 'inline-block';
        } else {
            attackButton.style.display = 'none';
        }
        
        endTurnButton.style.display = 'inline-block';
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
        // Crea overlay per annullare selezione
        const cancelOverlay = document.createElement('div');
        cancelOverlay.id = 'targeting-cancel-overlay';
        cancelOverlay.innerHTML = `
            <div class="targeting-info">
                <h3>Seleziona un bersaglio</h3>
                <button class="cancel-targeting-btn">Annulla</button>
            </div>
        `;
        document.body.appendChild(cancelOverlay);
        
        // Gestisci click sul pulsante annulla
        cancelOverlay.querySelector('.cancel-targeting-btn').addEventListener('click', () => {
            this.cancelTargeting();
        });
        
        // Evidenzia bersagli validi
        validTargets.forEach(target => {
            const selector = `[data-player-id="${target.playerId}"][data-zone="${target.zone}"][data-position="${target.position}"]`;
            const element = document.querySelector(selector);
            if (element) {
                element.classList.add('valid-target');
                // Aggiungi indicatore visivo
                const indicator = document.createElement('div');
                indicator.className = 'target-indicator';
                indicator.innerHTML = '🎯';
                element.appendChild(indicator);
            }
        });
    }

    // Nascondi modalità targeting
    hideTargetingMode() {
        // Rimuovi overlay
        const overlay = document.getElementById('targeting-cancel-overlay');
        if (overlay) {
            overlay.remove();
        }
        
        // Rimuovi classi e indicatori dai bersagli
        document.querySelectorAll('.valid-target').forEach(el => {
            el.classList.remove('valid-target');
            const indicator = el.querySelector('.target-indicator');
            if (indicator) {
                indicator.remove();
            }
        });
    }
    
    // Annulla targeting
    cancelTargeting() {
        this.engine.state.targetingMode = false;
        this.engine.state.selectedCard = null;
        this.engine.state.validTargets = [];
        this.hideTargetingMode();
        this.showMessage("Selezione annullata");
    }
    
    // Seleziona una carta
    selectCard(playerId, zone, position) {
        console.log('[GameUI] selectCard chiamato:', { playerId, zone, position });
        
        // Deseleziona se clicchiamo sulla stessa carta
        if (this.selectedCard && 
            this.selectedCard.playerId === playerId && 
            this.selectedCard.zone === zone && 
            this.selectedCard.position === position) {
            console.log('[GameUI] Deselezionando carta già selezionata');
            this.clearSelection();
            return;
        }
        
        // Seleziona la nuova carta
        this.selectedCard = { playerId, zone, position };
        console.log('[GameUI] Carta selezionata:', this.selectedCard);
        
        // Evidenzia la carta selezionata
        this.updateCardSelection();
        
        // Mostra hint in base al tipo di carta
        const card = this.engine.state.getPlayer(playerId).hand[position];
        console.log('[GameUI] Tipo carta selezionata:', card.type);
        
        // Evidenzia le zone valide
        this.highlightValidZones(card);
        
        if (card.type === 'Personaggio') {
            this.showMessage("Clicca su uno slot vuoto per posizionare il personaggio");
        } else if (card.type === 'Struttura') {
            this.showMessage("Clicca su uno slot struttura vuoto");
        } else if (card.type === 'Incantesimo') {
            this.showMessage("Clicca per lanciare l'incantesimo");
        } else if (card.type === 'Equipaggiamento') {
            this.showMessage("Clicca su un personaggio per equipaggiarlo");
        }
    }
    
    // Pulisci selezione
    clearSelection() {
        console.log('[GameUI] clearSelection chiamato');
        console.trace(); // Mostra lo stack trace per capire chi chiama questo metodo
        this.selectedCard = null;
        this.updateCardSelection();
        this.clearHighlightedZones();
    }
    
    // Evidenzia le zone valide per il tipo di carta
    highlightValidZones(card) {
        // Prima rimuovi eventuali evidenziazioni precedenti
        this.clearHighlightedZones();
        
        if (card.type === 'Personaggio') {
            // Determina la zona target basandosi sulla classe
            const targetZone = this.engine.rules.getCharacterZone(card);
            
            // Evidenzia gli slot vuoti nella zona corretta
            const zoneSelector = targetZone === 'firstLine' ? '.first-line' : '.second-line';
            const playerZone = document.querySelector(`#player${this.engine.state.currentPlayer}-area ${zoneSelector}`);
            
            if (playerZone) {
                const slots = playerZone.querySelectorAll('.card-slot');
                slots.forEach(slot => {
                    if (!slot.querySelector('.game-card')) {
                        slot.classList.add('valid-zone');
                    }
                });
            }
        } else if (card.type === 'Struttura') {
            // Evidenzia gli slot struttura vuoti
            const structuresZone = document.querySelector(`#player${this.engine.state.currentPlayer}-structures`);
            if (structuresZone) {
                const slots = structuresZone.querySelectorAll('.card-slot');
                slots.forEach(slot => {
                    if (!slot.querySelector('.game-card')) {
                        slot.classList.add('valid-zone');
                    }
                });
            }
        } else if (card.type === 'Equipaggiamento') {
            // Evidenzia tutte le proprie creature
            const creatures = this.engine.state.getAllCreatures(this.engine.state.currentPlayer);
            creatures.forEach(creature => {
                const selector = `.game-card[data-player-id="${creature.playerId}"][data-zone="${creature.zone}"][data-position="${creature.position}"]`;
                const element = document.querySelector(selector);
                if (element) {
                    element.classList.add('valid-target-equipment');
                }
            });
        } else if (card.type === 'Incantesimo') {
            // Per gli incantesimi, evidenzia i bersagli validi se necessario
            const targets = this.engine.rules.getSpellTargets(card);
            if (targets.needsTarget) {
                targets.validTargets.forEach(target => {
                    if (target.type === 'player') {
                        const playerArea = document.getElementById(`player${target.playerId}-area`);
                        if (playerArea) {
                            playerArea.classList.add('valid-target-spell');
                        }
                    } else {
                        const selector = `.game-card[data-player-id="${target.playerId}"][data-zone="${target.zone}"][data-position="${target.position}"]`;
                        const element = document.querySelector(selector);
                        if (element) {
                            element.classList.add('valid-target-spell');
                        }
                    }
                });
            }
        }
    }
    
    // Rimuovi evidenziazioni delle zone
    clearHighlightedZones() {
        document.querySelectorAll('.valid-zone').forEach(el => el.classList.remove('valid-zone'));
        document.querySelectorAll('.valid-target-equipment').forEach(el => el.classList.remove('valid-target-equipment'));
        document.querySelectorAll('.valid-target-spell').forEach(el => el.classList.remove('valid-target-spell'));
    }
    
    // Aggiorna visualizzazione selezione carta
    updateCardSelection() {
        console.log('[GameUI] updateCardSelection chiamato, selectedCard:', this.selectedCard);
        
        // Rimuovi tutte le selezioni precedenti
        const previousSelected = document.querySelectorAll('.game-card.selected');
        console.log('[GameUI] Carte precedentemente selezionate:', previousSelected.length);
        previousSelected.forEach(card => {
            card.classList.remove('selected');
        });
        
        // Aggiungi selezione alla carta corrente
        if (this.selectedCard) {
            // Prova sia con data-player-id che con dataset selector
            const selector = `.game-card[data-player-id="${this.selectedCard.playerId}"][data-zone="${this.selectedCard.zone}"][data-position="${this.selectedCard.position}"]`;
            console.log('[GameUI] Cercando elemento con selector:', selector);
            const cardElement = document.querySelector(selector);
            
            // Se non trovato, prova un approccio alternativo
            if (!cardElement) {
                console.log('[GameUI] Tentativo alternativo di trovare la carta...');
                const allCards = document.querySelectorAll('.game-card');
                allCards.forEach(card => {
                    if (card.dataset.playerId == this.selectedCard.playerId &&
                        card.dataset.zone === this.selectedCard.zone &&
                        card.dataset.position == this.selectedCard.position) {
                        card.classList.add('selected');
                        console.log('[GameUI] Trovata e selezionata carta con approccio alternativo');
                    }
                });
            } else {
                cardElement.classList.add('selected');
                console.log('[GameUI] Aggiunta classe selected a:', cardElement);
            }
        }
    }


    // Setup click handlers
    setupClickHandlers() {
        // Doppio click per mostrare dettagli carta
        document.addEventListener('dblclick', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            const card = e.target.closest('.game-card');
            if (!card) return;
            
            const playerId = parseInt(card.dataset.playerId);
            const zone = card.dataset.zone;
            const position = parseInt(card.dataset.position);
            
            // Trova la carta reale
            let cardData = null;
            if (zone === 'hand') {
                cardData = this.engine.state.getPlayer(playerId).hand[position];
            } else if (zone === 'firstLine' || zone === 'secondLine') {
                const slotContent = this.engine.state.getPlayer(playerId)[zone][position];
                cardData = slotContent?.card || slotContent;
            } else if (zone === 'structures') {
                const slotContent = this.engine.state.getPlayer(playerId).structures[position];
                cardData = slotContent?.card || slotContent;
            }
            
            if (cardData && cardData.name) {
                this.showCardDetail(cardData);
            }
        });
        
        // Click su carte e slot - usa capture per intercettare prima
        document.addEventListener('click', (e) => {
            // Debounce per prevenire doppi click
            if (this.clickTimeout) {
                clearTimeout(this.clickTimeout);
            }
            
            this.clickTimeout = setTimeout(() => {
                this.handleCardClick(e);
            }, 50);
        }, true); // true = capture phase
        
        this.setupClickHandlersEnd();
    }
    
    // Gestisce il click sulle carte
    handleCardClick(e) {
        const card = e.target.closest('.game-card');
        const slot = e.target.closest('.card-slot');
        const playerArea = e.target.closest('.player-area');
            
            // Prima gestiamo il click sulle carte dalla mano
            if (card) {
                const playerId = parseInt(card.dataset.playerId);
                const zone = card.dataset.zone;
                const position = parseInt(card.dataset.position);
                
                // Se è una carta dalla mano del giocatore corrente durante la fase main
                if (zone === 'hand' && playerId === this.engine.state.currentPlayer && 
                    this.engine.state.currentPhase === 'main' && !this.engine.state.targetingMode) {
                    console.log('[GameUI] Selezionando carta dalla mano:', { playerId, zone, position });
                    this.selectCard(playerId, zone, position);
                    return;
                }
            }
            
            // Se siamo in modalità targeting per incantesimi/equipaggiamenti
            if (this.engine.state.targetingMode) {
                // Click su carta bersaglio
                if (card) {
                    const playerId = parseInt(card.dataset.playerId);
                    const zone = card.dataset.zone;
                    const position = parseInt(card.dataset.position);
                    
                    // Ottieni la carta dal campo
                    const fieldCard = this.engine.state.getZone(playerId, zone)[position];
                    
                    // Estrai la carta vera dal wrapper creature se necessario
                    const actualCard = fieldCard?.card || fieldCard;
                    
                    const target = {
                        playerId: playerId,
                        zone: zone,
                        position: position,
                        card: actualCard
                    };
                    
                    // Verifica se è un bersaglio valido
                    const validTarget = this.engine.state.validTargets.find(t => 
                        t.playerId === target.playerId && 
                        t.zone === target.zone && 
                        t.position === target.position
                    );
                    
                    console.log('[GameUI] Targeting click:', {
                        clickedTarget: target,
                        validTarget: validTarget,
                        allValidTargets: this.engine.state.validTargets
                    });
                    
                    if (validTarget) {
                        // Usa il validTarget invece del target costruito localmente
                        this.engine.selectTarget(validTarget);
                    }
                }
                // Click su giocatore (per incantesimi che bersagliano giocatori)
                else if (playerArea && !card) {
                    const playerId = parseInt(playerArea.id.match(/player(\d+)-area/)[1]);
                    const playerTarget = this.engine.state.validTargets.find(t => 
                        t.type === 'player' && t.playerId === playerId
                    );
                    
                    if (playerTarget) {
                        this.engine.selectTarget(playerTarget);
                    }
                }
                return;
            }
            
            // Se c'è una carta selezionata dalla mano, gestisci il posizionamento
            if (this.selectedCard && this.selectedCard.zone === 'hand') {
                // Click su slot vuoto per posizionare personaggi/strutture
                if (slot && !slot.querySelector('.game-card')) {
                    const zone = slot.closest('.first-line, .second-line, .structures-zone');
                    if (zone) {
                        this.engine.playCard(this.selectedCard.playerId, this.selectedCard.position);
                        this.clearSelection();
                        return;
                    }
                }
                // Click su carta esistente per equipaggiamenti o incantesimi mirati
                else if (card) {
                    const selectedCardData = this.engine.state.getPlayer(this.selectedCard.playerId).hand[this.selectedCard.position];
                    if (selectedCardData.type === 'Incantesimo' || selectedCardData.type === 'Equipaggiamento') {
                        // L'engine gestirà il targeting
                        this.engine.playCard(this.selectedCard.playerId, this.selectedCard.position);
                        this.clearSelection();
                        return;
                    }
                }
                // Click fuori per deselezionare solo se non c'è nessuna carta o slot
                if (!card && !slot && !playerArea) {
                    this.clearSelection();
                }
                return;
            }
            
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
                    // Non permettere di attaccare se stessi o carte dello stesso giocatore
                    if (playerId === this.engine.state.currentPlayer) {
                        return;
                    }
                    
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
                    // Verifica se è una struttura
                    else if (zone === 'structures') {
                        target = {
                            type: 'structure',
                            card: this.engine.state.getZone(playerId, zone)[position],
                            playerId,
                            zone,
                            position
                        };
                    }
                    
                    if (target && target.card) {
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
            
            
            // Se in modalità targeting (per compatibilità con codice esistente)
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
    }
        
    // Continua setup dei click handlers dopo handleCardClick
    setupClickHandlersEnd() {
        // Modal cambio turno
        document.getElementById('confirm-turn').addEventListener('click', () => {
            this.hideTurnChangeModal();
        });
        
        // Chiudi modal dettagli
        const closeModal = () => {
            document.getElementById('card-detail-modal').style.display = 'none';
        };
        
        document.querySelector('#card-detail-modal .close').addEventListener('click', closeModal);
        
        // Chiudi cliccando fuori dalla carta
        document.getElementById('card-detail-modal').addEventListener('click', (e) => {
            if (e.target.id === 'card-detail-modal' || e.target.classList.contains('modal-content')) {
                closeModal();
            }
        });
        
        // Chiudi con ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && document.getElementById('card-detail-modal').style.display !== 'none') {
                closeModal();
            }
        });
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
            const position = parseInt(card.dataset.position);
            
            if (zone === 'firstLine' || zone === 'secondLine') {
                // Controlla se questa creatura sta già attaccando
                const isAttacking = this.engine.state.combat.attackers.some(attacker => 
                    attacker.playerId === activePlayer && 
                    attacker.zone === zone && 
                    attacker.position === position
                );
                
                if (!isAttacking) {
                    card.classList.add('can-attack');
                }
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
        
        // Crea SVG per la freccia
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.classList.add('attack-arrow');
        svg.style.position = 'fixed';  // Cambiato da absolute a fixed
        svg.style.top = '0';
        svg.style.left = '0';
        svg.style.width = '100vw';
        svg.style.height = '100vh';
        svg.style.pointerEvents = 'none';
        svg.style.zIndex = '500';
        
        // Funzione per aggiornare la posizione della freccia
        const updateArrow = () => {
            const attackerRect = attackerEl.getBoundingClientRect();
            const targetRect = targetEl.getBoundingClientRect();
            
            // Usa posizioni relative al viewport (non più al game board)
            const startX = attackerRect.left + attackerRect.width / 2;
            const startY = attackerRect.top + attackerRect.height / 2;
            const endX = targetRect.left + targetRect.width / 2;
            const endY = targetRect.top + targetRect.height / 2;
            
            // Pulisci SVG precedente
            svg.innerHTML = '';
            
            // Crea il percorso della freccia
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', `M ${startX} ${startY} L ${endX} ${endY}`);
            path.setAttribute('stroke', '#ff0000');
            path.setAttribute('stroke-width', '4');
            path.setAttribute('fill', 'none');
            path.setAttribute('marker-end', 'url(#arrowhead)');
            
            // Crea la punta della freccia
            const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
            const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
            marker.setAttribute('id', 'arrowhead');
            marker.setAttribute('markerWidth', '10');
            marker.setAttribute('markerHeight', '10');
            marker.setAttribute('refX', '9');
            marker.setAttribute('refY', '3');
            marker.setAttribute('orient', 'auto');
            
            const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
            polygon.setAttribute('points', '0 0, 10 3, 0 6');
            polygon.setAttribute('fill', '#ff0000');
            
            marker.appendChild(polygon);
            defs.appendChild(marker);
            svg.appendChild(defs);
            svg.appendChild(path);
        };
        
        // Aggiorna la freccia inizialmente
        updateArrow();
        
        // Aggiungi al body invece che al game board per position fixed
        document.body.appendChild(svg);
        
        // Aggiorna la freccia quando la pagina scrolla
        const scrollHandler = () => updateArrow();
        window.addEventListener('scroll', scrollHandler);
        document.querySelector('.game-field').addEventListener('scroll', scrollHandler);
        
        // Salva handler per rimozione quando non serve più
        svg.scrollHandler = scrollHandler;
        svg.updateArrow = updateArrow;
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
        const attackerEl = document.querySelector(
            `[data-player-id="${attacker.playerId}"][data-zone="${attacker.zone}"][data-position="${attacker.position}"]`
        );
        const defenderEl = document.querySelector(
            `[data-player-id="${defender.playerId}"][data-zone="${defender.zone}"][data-position="${defender.position}"]`
        );
        
        if (!attackerEl || !defenderEl) return;
        
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
    
    // Nascondi UI di combattimento
    hideCombatUI() {
        // Rimuovi pulsanti di combattimento
        const confirmAttackers = document.getElementById('confirm-attackers');
        const confirmBlockers = document.getElementById('confirm-blockers');
        
        if (confirmAttackers) confirmAttackers.remove();
        if (confirmBlockers) confirmBlockers.remove();
        
        // Rimuovi tutte le classi di combattimento
        document.querySelectorAll('.can-attack, .can-block, .is-attacking, .is-blocking, .selected-attacker, .valid-target, .valid-target-player').forEach(el => {
            el.classList.remove('can-attack', 'can-block', 'is-attacking', 'is-blocking', 'selected-attacker', 'valid-target', 'valid-target-player');
        });
        
        // Rimuovi frecce di attacco
        document.querySelectorAll('.attack-arrow, .attack-line').forEach(el => {
            // Rimuovi event listener se presenti
            if (el.scrollHandler) {
                window.removeEventListener('scroll', el.scrollHandler);
                const gameField = document.querySelector('.game-field');
                if (gameField) {
                    gameField.removeEventListener('scroll', el.scrollHandler);
                }
            }
            el.remove();
        });
    }
    
    // Mantieni le visualizzazioni di combattimento attive
    maintainCombatVisuals() {
        // Non rimuovere le frecce e mantieni le visualizzazioni degli attaccanti
        // Questo metodo viene chiamato quando confermiamo gli attaccanti
        // per mantenere le frecce visibili durante la risoluzione del danno
    }
    
    // Aggiorna solo il campo di gioco (per aggiornamenti rapidi dopo il danno)
    updateGameField() {
        // Aggiorna il campo di entrambi i giocatori
        this.updateField(1, this.engine.state.getPlayer(1));
        this.updateField(2, this.engine.state.getPlayer(2));
    }
    
    // Mostra dettagli carta
    showCardDetail(card) {
        const modal = document.getElementById('card-detail-modal');
        const modalCardDetail = document.getElementById('modal-card-detail');
        
        if (!modal || !modalCardDetail || !card) return;
        
        try {
            // Genera solo l'SVG della carta
            const svgContent = window.CardRenderer.generateCardSVG(card);
            
            // Inserisci l'SVG nel contenitore esistente
            modalCardDetail.innerHTML = svgContent;
            
            // Mostra il modal
            modal.style.display = 'flex';
        } catch (error) {
            console.error('Errore nel mostrare dettagli carta:', error);
            modal.style.display = 'none';
        }
    }
    
    // Mostra messaggio
    showMessage(message, duration = 3000) {
        const messageContainer = document.getElementById('game-messages');
        if (!messageContainer) return;
        
        const messageEl = document.createElement('div');
        messageEl.className = 'game-message';
        messageEl.textContent = message;
        
        messageContainer.appendChild(messageEl);
        
        // Rimuovi dopo il tempo specificato
        setTimeout(() => {
            messageEl.remove();
        }, duration);
    }
}

// Esporta per uso globale
window.GameUI = GameUI;