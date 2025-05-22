// js/ui/cardRenderer.js - Rendering e animazioni delle carte

class CardRenderer {
    constructor() {
        this.animationQueue = [];
        this.isAnimating = false;
        this.cardTemplates = new Map();
        this.init();
    }

    init() {
        this.preloadCardTemplates();
        this.setupAnimationStyles();
    }

    // === TEMPLATE DELLE CARTE ===

    preloadCardTemplates() {
        // Pre-carica template per diversi tipi di carte
        this.cardTemplates.set('personaggio', this.createPersonaggioTemplate());
        this.cardTemplates.set('struttura', this.createStrutturaTemplate());
        this.cardTemplates.set('incantesimo', this.createIncantesimoTemplate());
        this.cardTemplates.set('equipaggiamento', this.createEquipaggiamentoTemplate());
    }

    createPersonaggioTemplate() {
        return (card) => {
            const currentHp = card.currentHp !== undefined ? card.currentHp : card.hp;
            const isWounded = currentHp < card.hp;
            
            return `
                <div class="card-header">
                    <div class="card-name ${isWounded ? 'wounded' : ''}">${card.name}</div>
                    <div class="card-cost">${card.cost || 0}</div>
                </div>
                <div class="card-stats">
                    <span class="stat-attack">⚔️${card.att}</span>
                    <span class="stat-defense">🛡️${card.def}</span>
                    <span class="stat-health ${isWounded ? 'wounded' : ''}">❤️${currentHp}/${card.hp}</span>
                </div>
                <div class="card-type">${card.type} - ${card.class}</div>
                ${card.equipment ? this.renderEquipmentIcons(card.equipment) : ''}
            `;
        };
    }

    createStrutturaTemplate() {
        return (card) => {
            const currentHp = card.currentHp !== undefined ? card.currentHp : card.hp;
            const isDamaged = currentHp < card.hp;
            
            return `
                <div class="card-header">
                    <div class="card-name">${card.name}</div>
                    <div class="card-cost">${card.cost || 0}</div>
                </div>
                <div class="card-stats">
                    <span class="stat-structure ${isDamaged ? 'damaged' : ''}">🏗️${currentHp}/${card.hp}</span>
                    ${card.level ? `<span class="structure-level">📶${card.level}</span>` : ''}
                </div>
                <div class="card-type">${card.type}</div>
            `;
        };
    }

    createIncantesimoTemplate() {
        return (card) => {
            let effectText = this.getSpellEffectText(card);
            
            return `
                <div class="card-header">
                    <div class="card-name spell-name">${card.name}</div>
                    <div class="card-cost">${card.cost || 0}</div>
                </div>
                ${effectText ? `<div class="card-stats">${effectText}</div>` : ''}
                <div class="card-type spell-type">${card.type}</div>
                <div class="spell-indicator">✨</div>
            `;
        };
    }

    createEquipaggiamentoTemplate() {
        return (card) => {
            let effectText = this.getEquipmentEffectText(card);
            
            return `
                <div class="card-header">
                    <div class="card-name equipment-name">${card.name}</div>
                    <div class="card-cost">${card.cost || 0}</div>
                </div>
                ${effectText ? `<div class="card-stats">${effectText}</div>` : ''}
                <div class="card-type equipment-type">${card.type}</div>
                <div class="equipment-indicator">⚔️</div>
            `;
        };
    }

    // === RENDERING PRINCIPALE ===

    renderCard(card, options = {}) {
        const {
            showDetails = true,
            interactive = true,
            size = 'normal',
            highlighted = false
        } = options;

        const cardElement = document.createElement('div');
        cardElement.className = this.getCardClasses(card, { size, highlighted });
        cardElement.dataset.cardId = card.id;

        if (!showDetails) {
            cardElement.innerHTML = this.renderCardBack();
            return cardElement;
        }

        // Usa template appropriato
        const template = this.cardTemplates.get(card.type.toLowerCase());
        if (template) {
            cardElement.innerHTML = template(card);
        } else {
            cardElement.innerHTML = this.renderGenericCard(card);
        }

        // Aggiungi tooltip se necessario
        if (interactive) {
            this.addCardTooltip(cardElement, card);
            this.addCardInteractions(cardElement, card);
        }

        return cardElement;
    }

    getCardClasses(card, options = {}) {
        const classes = ['card'];
        
        // Elemento
        if (card.element) {
            classes.push(`element-${card.element.toLowerCase()}`);
        } else {
            classes.push('element-neutral');
        }

        // Rarità
        if (card.rarity) {
            classes.push(`rarity-${card.rarity.toLowerCase().replace(' ', '-')}`);
        }

        // Tipo
        classes.push(`type-${card.type.toLowerCase()}`);

        // Stato
        if (card.currentHp !== undefined && card.currentHp < card.hp) {
            classes.push('damaged');
        }

        // Opzioni
        if (options.size !== 'normal') {
            classes.push(`size-${options.size}`);
        }

        if (options.highlighted) {
            classes.push('highlighted');
        }

        // Stati di gioco
        if (gameState.selectedCard && gameState.selectedCard.id === card.id) {
            classes.push('selected');
        }

        if (gameState.canPlayCard && gameState.canPlayCard(card)) {
            classes.push('can-play');
        }

        return classes.join(' ');
    }

    renderCardBack() {
        return `
            <div class="card-back">
                <div class="card-back-pattern">🂠</div>
                <div class="card-back-logo">Lirya</div>
            </div>
        `;
    }

    renderGenericCard(card) {
        return `
            <div class="card-header">
                <div class="card-name">${card.name}</div>
                <div class="card-cost">${card.cost || 0}</div>
            </div>
            <div class="card-type">${card.type}</div>
        `;
    }

    // === EFFETTI E ICONE ===

    getSpellEffectText(card) {
        const effects = [];
        
        if (card.damage) {
            effects.push(`<span class="effect-damage">💥${card.damage}</span>`);
        }
        
        if (card.healing) {
            effects.push(`<span class="effect-healing">💚${card.healing}</span>`);
        }
        
        if (card.aoe) {
            effects.push(`<span class="effect-aoe">🌊Area</span>`);
        }

        if (card.control) {
            effects.push(`<span class="effect-control">🎭Controllo</span>`);
        }

        if (card.stealth) {
            effects.push(`<span class="effect-stealth">👤Furtività</span>`);
        }

        return effects.length > 0 ? `<div class="spell-effects">${effects.join('')}</div>` : '';
    }

    getEquipmentEffectText(card) {
        const effects = [];
        
        if (card.attBonus) {
            effects.push(`<span class="bonus-attack">⚔️+${card.attBonus}</span>`);
        }
        
        if (card.defBonus) {
            effects.push(`<span class="bonus-defense">🛡️+${card.defBonus}</span>`);
        }
        
        if (card.hpBonus) {
            effects.push(`<span class="bonus-health">❤️+${card.hpBonus}</span>`);
        }

        if (card.defMalus) {
            effects.push(`<span class="malus-defense">🛡️-${card.defMalus}</span>`);
        }

        return effects.length > 0 ? `<div class="equipment-effects">${effects.join('')}</div>` : '';
    }

    renderEquipmentIcons(equipment) {
        const icons = equipment.map(eq => `<span class="equipment-icon" title="${eq.name}">⚔️</span>`);
        return `<div class="equipped-items">${icons.join('')}</div>`;
    }

    // === TOOLTIP ===

    addCardTooltip(cardElement, card) {
        const tooltip = document.createElement('div');
        tooltip.className = 'card-tooltip';
        tooltip.innerHTML = this.generateTooltipContent(card);
        
        cardElement.appendChild(tooltip);
    }

    generateTooltipContent(card) {
        let content = `<strong>${card.name}</strong><br>`;
        content += `${card.type}`;
        
        if (card.class) {
            content += ` - ${card.class}`;
        }
        
        if (card.element) {
            content += `<br>Elemento: ${card.element}`;
        }

        if (card.rarity) {
            content += `<br>Rarità: ${card.rarity}`;
        }

        // Descrizioni abilità (se disponibili)
        if (card.abilities && card.abilities.length > 0) {
            content += '<br><br><em>Abilità:</em>';
            card.abilities.forEach(ability => {
                content += `<br>• ${ability.name}: ${ability.effect}`;
            });
        }

        return content;
    }

    // === INTERAZIONI ===

    addCardInteractions(cardElement, card) {
        cardElement.addEventListener('mouseenter', () => {
            this.onCardHover(cardElement, card, true);
        });

        cardElement.addEventListener('mouseleave', () => {
            this.onCardHover(cardElement, card, false);
        });

        cardElement.addEventListener('click', () => {
            this.onCardClick(cardElement, card);
        });
    }

    onCardHover(cardElement, card, isEntering) {
        if (isEntering) {
            cardElement.style.zIndex = '100';
            cardElement.classList.add('hovered');
            
            // Mostra preview ingrandita per mobile
            if (window.innerWidth <= 768) {
                this.showMobilePreview(card);
            }
        } else {
            cardElement.style.zIndex = '';
            cardElement.classList.remove('hovered');
            this.hideMobilePreview();
        }
    }

    onCardClick(cardElement, card) {
        // Gestito dal UIManager
        if (typeof uiManager !== 'undefined') {
            uiManager.handleCardClick({ target: cardElement });
        }
    }

    showMobilePreview(card) {
        // Implementa preview per mobile se necessario
    }

    hideMobilePreview() {
        // Nasconde preview mobile
    }

    // === ANIMAZIONI ===

    animateCardPlay(card) {
        const cardElements = document.querySelectorAll(`[data-card-id="${card.id}"]`);
        
        cardElements.forEach(el => {
            el.classList.add('card-play-animation');
            
            // Rimuovi classe dopo animazione
            setTimeout(() => {
                el.classList.remove('card-play-animation');
            }, 600);
        });
    }

    animateCardDraw(card, playerId) {
        this.addToAnimationQueue(() => {
            const handElement = document.getElementById(`p${playerId}-hand`);
            if (handElement) {
                const lastCard = handElement.lastElementChild;
                if (lastCard) {
                    lastCard.classList.add('card-draw-animation');
                    lastCard.style.transform = 'translateX(-100px) scale(0.8)';
                    lastCard.style.opacity = '0';
                    
                    setTimeout(() => {
                        lastCard.style.transform = '';
                        lastCard.style.opacity = '';
                        lastCard.classList.remove('card-draw-animation');
                    }, 500);
                }
            }
        });
    }

    animateCardDestroy(card) {
        const cardElements = document.querySelectorAll(`[data-card-id="${card.id}"]`);
        
        cardElements.forEach(el => {
            el.classList.add('card-destroy-animation');
            el.style.animation = 'cardDestroy 0.8s ease-out forwards';
            
            setTimeout(() => {
                if (el.parentNode) {
                    el.parentNode.removeChild(el);
                }
            }, 800);
        });
    }

    animateCardMove(card, fromZone, toZone) {
        // Animazione per movimento carte tra zone
        const cardElement = document.querySelector(`[data-card-id="${card.id}"]`);
        if (cardElement) {
            cardElement.classList.add('card-move-animation');
            
            setTimeout(() => {
                cardElement.classList.remove('card-move-animation');
            }, 400);
        }
    }

    // === GESTIONE CODA ANIMAZIONI ===

    addToAnimationQueue(animationFunction) {
        this.animationQueue.push(animationFunction);
        if (!this.isAnimating) {
            this.processAnimationQueue();
        }
    }

    processAnimationQueue() {
        if (this.animationQueue.length === 0) {
            this.isAnimating = false;
            return;
        }

        this.isAnimating = true;
        const nextAnimation = this.animationQueue.shift();
        nextAnimation();

        // Processa la prossima animazione dopo un delay
        setTimeout(() => {
            this.processAnimationQueue();
        }, 200);
    }

    // === SETUP STILI ANIMAZIONI ===

    setupAnimationStyles() {
        const styleSheet = document.createElement('style');
        styleSheet.textContent = `
            @keyframes cardPlay {
                0% { transform: scale(1); }
                50% { transform: scale(1.1); }
                100% { transform: scale(1); }
            }

            @keyframes cardDraw {
                0% { 
                    transform: translateX(-100px) scale(0.8);
                    opacity: 0;
                }
                100% { 
                    transform: translateX(0) scale(1);
                    opacity: 1;
                }
            }

            @keyframes cardDestroy {
                0% { 
                    transform: scale(1) rotate(0deg);
                    opacity: 1;
                }
                50% { 
                    transform: scale(1.1) rotate(5deg);
                    opacity: 0.7;
                }
                100% { 
                    transform: scale(0) rotate(15deg);
                    opacity: 0;
                }
            }

            @keyframes cardMove {
                0% { transform: translateY(0); }
                50% { transform: translateY(-10px); }
                100% { transform: translateY(0); }
            }

            .card-play-animation {
                animation: cardPlay 0.6s ease-out;
            }

            .card-draw-animation {
                animation: cardDraw 0.5s ease-out;
            }

            .card-destroy-animation {
                pointer-events: none;
            }

            .card-move-animation {
                animation: cardMove 0.4s ease-out;
            }

            .card.hovered {
                transform: translateY(-5px) scale(1.05);
                box-shadow: 0 8px 25px rgba(0,0,0,0.4);
            }

            .wounded {
                color: #ff6666 !important;
            }

            .damaged .stat-health,
            .damaged .stat-structure {
                color: #ff6666;
                font-weight: bold;
            }
        `;
        
        document.head.appendChild(styleSheet);
    }

    // === UTILITY ===

    refreshCard(cardId) {
        const cardElements = document.querySelectorAll(`[data-card-id="${cardId}"]`);
        const card = this.findCardById(cardId);
        
        if (card) {
            cardElements.forEach(el => {
                const newElement = this.renderCard(card);
                el.parentNode.replaceChild(newElement, el);
            });
        }
    }

    findCardById(cardId) {
        // Cerca in tutte le zone
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
}

// Istanza globale del Card Renderer
const cardRenderer = new CardRenderer();

// Esporta per l'uso in altri file
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CardRenderer, cardRenderer };
}