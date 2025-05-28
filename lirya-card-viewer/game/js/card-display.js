// Sistema di visualizzazione delle carte con modificatori
class CardDisplay {
    constructor() {
        this.modifierColors = {
            positive: '#4CAF50',
            negative: '#F44336',
            neutral: '#FFC107'
        };
    }
    
    // Crea l'elemento HTML per una carta creatura con tutti i modificatori
    createCreatureCard(creature, location, abilitiesSystem) {
        console.log('[CardDisplay] Creating creature card:', {
            creature,
            location,
            hasAbilitiesSystem: !!abilitiesSystem
        });
        
        const card = creature.card || creature;
        const baseStats = {
            attack: card.stats?.attack || card.attack || 0,
            defense: card.stats?.defense || card.defense || 0,
            health: card.stats?.health || card.health || 1
        };
        
        const modifiedStats = abilitiesSystem.getModifiedStats(creature);
        
        const cardElement = document.createElement('div');
        cardElement.className = 'game-card creature-card';
        cardElement.dataset.playerId = location.playerId;
        cardElement.dataset.zone = location.zone;
        cardElement.dataset.position = location.position;
        
        // Aggiungi classi per lo stato
        if (creature.tapped) cardElement.classList.add('tapped');
        if (creature.summoningSickness) cardElement.classList.add('summoning-sickness');
        if (creature.hasStsealth) cardElement.classList.add('stealth');
        if (creature.isDamaged) cardElement.classList.add('damaged');
        
        try {
            // Usa CardRenderer per generare l'SVG come base
            console.log('[CardDisplay] Generating SVG for card:', card.name);
            
            // Prepara il percorso dell'immagine
            let imagePath = card.img || `${card.id}_${card.name.toLowerCase().replace(/\s+/g, '_').replace(/[^\w_]/g, '')}.png`;
            if (!imagePath.startsWith('../') && !imagePath.startsWith('/')) {
                imagePath = `../images/${imagePath}`;
            } else if (imagePath.startsWith('/images/')) {
                imagePath = `..${imagePath}`;
            }
            
            const cardWithImage = {
                ...card,
                img: imagePath,
                // Usa le stats modificate per il rendering
                attack: modifiedStats.attack,
                defense: modifiedStats.defense,
                health: modifiedStats.health
            };
            
            const svgContent = CardRenderer.generateCardSVG(cardWithImage);
            cardElement.innerHTML = svgContent;
            
            // Assicurati che l'SVG non interferisca con i click
            const svg = cardElement.querySelector('svg');
            if (svg) {
                svg.style.pointerEvents = 'none';
            }
            
        } catch (error) {
            console.error('[CardDisplay] Error generating SVG, falling back to simple rendering:', error);
            // Fallback al rendering semplice
            cardElement.innerHTML = `
                <div class="card-content">
                    <div class="card-name">${card.name}</div>
                    <div class="card-cost">${card.cost || 0}</div>
                    <div class="card-stats">${modifiedStats.attack}/${modifiedStats.defense}</div>
                </div>
            `;
        }
        
        // Aggiungi overlays per modificatori e equipaggiamenti
        const overlaysDiv = document.createElement('div');
        overlaysDiv.className = 'card-overlays';
        overlaysDiv.innerHTML = `
            ${this.createAbilityIcons(creature)}
            ${this.createEquipmentsDisplay(creature, abilitiesSystem)}
            ${this.createModifiersDisplay(modifiedStats, baseStats)}
        `;
        
        cardElement.appendChild(overlaysDiv);
        
        return cardElement;
    }
    
    // Crea icone per le abilità speciali
    createAbilityIcons(creature) {
        const icons = [];
        
        if (creature.hasHaste || creature.grantedAbilities?.some(a => a.ability === 'haste')) {
            icons.push('<span class="ability-icon haste" title="Haste">⚡</span>');
        }
        
        if (creature.hasStsealth || creature.grantedAbilities?.some(a => a.ability === 'stealth')) {
            icons.push('<span class="ability-icon stealth" title="Stealth">👁</span>');
        }
        
        if (creature.canAttackSecondLine || creature.grantedAbilities?.some(a => a.ability === 'reach' || a.ability === 'flying')) {
            icons.push('<span class="ability-icon reach" title="Può attaccare la seconda linea">🏹</span>');
        }
        
        if (creature.grantedAbilities?.some(a => a.ability === 'mobile')) {
            icons.push('<span class="ability-icon mobile" title="Movimento libero">🏃</span>');
        }
        
        return icons.length > 0 ? `<div class="ability-icons">${icons.join('')}</div>` : '';
    }
    
    // Mostra gli equipaggiamenti
    createEquipmentsDisplay(creature, abilitiesSystem) {
        const creatureId = abilitiesSystem.getCardId(creature.card || creature, creature);
        const equipments = abilitiesSystem.equipments.get(creatureId) || [];
        
        if (equipments.length === 0) return '';
        
        const equipHtml = equipments.map(equip => `
            <div class="equipment-item">
                <span class="equipment-icon">⚔️</span>
                <span class="equipment-name">${equip.name}</span>
            </div>
        `).join('');
        
        return `<div class="equipments-list">${equipHtml}</div>`;
    }
    
    // Crea il testo delle abilità
    createAbilitiesText(abilities) {
        if (!abilities || abilities.length === 0) return '';
        
        const abilityHtml = abilities.map(ability => `
            <div class="ability-text">
                <strong>${ability.name}:</strong> ${ability.description}
            </div>
        `).join('');
        
        return `<div class="abilities-container">${abilityHtml}</div>`;
    }
    
    // Crea visualizzazione modificatore
    createStatModifier(diff) {
        if (diff === 0) return '';
        
        const sign = diff > 0 ? '+' : '';
        const className = diff > 0 ? 'modifier-positive' : 'modifier-negative';
        
        return `<span class="${className}">${sign}${diff}</span>`;
    }
    
    // Ottieni classe CSS per stat modificata
    getStatClass(modified, base) {
        if (modified > base) return 'stat-buffed';
        if (modified < base) return 'stat-debuffed';
        return '';
    }
    
    // Mostra effetti attivi
    createActiveEffects(creature, abilitiesSystem) {
        const effects = [];
        const creatureId = abilitiesSystem.getCardId(creature.card || creature, creature);
        const modifiers = abilitiesSystem.activeModifiers.get(creatureId) || [];
        
        // Raggruppa modificatori per fonte
        const modifiersBySource = {};
        modifiers.forEach(mod => {
            if (!modifiersBySource[mod.source]) {
                modifiersBySource[mod.source] = [];
            }
            modifiersBySource[mod.source].push(mod);
        });
        
        // Crea display per ogni fonte
        Object.entries(modifiersBySource).forEach(([source, mods]) => {
            const modText = mods.map(mod => {
                const sign = mod.value > 0 ? '+' : '';
                const stat = mod.stat === 'both' ? 'ATT/DIF' : mod.stat.toUpperCase();
                return `${sign}${mod.value} ${stat}`;
            }).join(', ');
            
            effects.push(`
                <div class="active-effect">
                    <span class="effect-source">${source}:</span>
                    <span class="effect-value">${modText}</span>
                </div>
            `);
        });
        
        if (effects.length === 0) return '';
        
        return `<div class="active-effects">${effects.join('')}</div>`;
    }
    
    // Crea display per i modificatori di stats
    createModifiersDisplay(modifiedStats, baseStats) {
        const modifiers = [];
        
        // Modificatore attacco
        const attackDiff = modifiedStats.attack - baseStats.attack;
        if (attackDiff !== 0) {
            const color = attackDiff > 0 ? '#4CAF50' : '#f44336';
            modifiers.push(`<span class="stat-modifier attack-mod" style="color: ${color}">${attackDiff > 0 ? '+' : ''}${attackDiff} ATT</span>`);
        }
        
        // Modificatore difesa
        const defenseDiff = modifiedStats.defense - baseStats.defense;
        if (defenseDiff !== 0) {
            const color = defenseDiff > 0 ? '#4CAF50' : '#f44336';
            modifiers.push(`<span class="stat-modifier defense-mod" style="color: ${color}">${defenseDiff > 0 ? '+' : ''}${defenseDiff} DIF</span>`);
        }
        
        // Modificatore salute
        const healthDiff = modifiedStats.health - baseStats.health;
        if (healthDiff !== 0) {
            const color = healthDiff > 0 ? '#4CAF50' : '#f44336';
            modifiers.push(`<span class="stat-modifier health-mod" style="color: ${color}">${healthDiff > 0 ? '+' : ''}${healthDiff} PV</span>`);
        }
        
        return modifiers.length > 0 ? `<div class="modifiers-display">${modifiers.join(' ')}</div>` : '';
    }
    
    // Crea carta struttura
    createStructureCard(structure, location, abilitiesSystem) {
        console.log('[CardDisplay] Creating structure card:', {
            structure,
            location,
            hasAbilitiesSystem: !!abilitiesSystem
        });
        
        const card = structure.card || structure;
        
        const cardElement = document.createElement('div');
        cardElement.className = 'game-card structure-card';
        cardElement.dataset.playerId = location.playerId;
        cardElement.dataset.zone = location.zone;
        cardElement.dataset.position = location.position;
        
        try {
            // Usa CardRenderer per generare l'SVG come base
            console.log('[CardDisplay] Generating SVG for structure:', card.name);
            
            // Prepara il percorso dell'immagine
            let imagePath = card.img || `${card.id}_${card.name.toLowerCase().replace(/\s+/g, '_').replace(/[^\w_]/g, '')}.png`;
            if (!imagePath.startsWith('../') && !imagePath.startsWith('/')) {
                imagePath = `../images/${imagePath}`;
            } else if (imagePath.startsWith('/images/')) {
                imagePath = `..${imagePath}`;
            }
            
            const cardWithImage = {
                ...card,
                img: imagePath
            };
            
            const svgContent = CardRenderer.generateCardSVG(cardWithImage);
            cardElement.innerHTML = svgContent;
            
            // Assicurati che l'SVG non interferisca con i click
            const svg = cardElement.querySelector('svg');
            if (svg) {
                svg.style.pointerEvents = 'none';
            }
            
            // Aggiungi overlay per la salute della struttura
            const healthOverlay = document.createElement('div');
            healthOverlay.className = 'structure-health-overlay';
            healthOverlay.innerHTML = `
                <span class="health-icon">🏛️</span>
                <span class="health-value">${structure.currentHealth || structure.stats?.structure_points || card.stats?.structure_points || 5}</span>
            `;
            cardElement.appendChild(healthOverlay);
            
        } catch (error) {
            console.error('[CardDisplay] Error generating structure SVG, falling back:', error);
            // Fallback al rendering semplice
            cardElement.innerHTML = `
                <div class="card-content">
                    <div class="card-name">${card.name}</div>
                    <div class="card-cost">${card.cost || 0}</div>
                    <div class="card-type">Struttura</div>
                </div>
            `;
        }
        
        return cardElement;
    }
    
    // Anima l'applicazione di un modificatore
    animateModifier(cardElement, value, stat) {
        const animation = document.createElement('div');
        animation.className = 'modifier-animation';
        animation.textContent = `${value > 0 ? '+' : ''}${value} ${stat}`;
        animation.style.color = value > 0 ? this.modifierColors.positive : this.modifierColors.negative;
        
        cardElement.appendChild(animation);
        
        // Rimuovi dopo l'animazione
        setTimeout(() => animation.remove(), 2000);
    }
    
    // Mostra animazione danno
    showDamageAnimation(cardElement, damage) {
        const animation = document.createElement('div');
        animation.className = 'damage-animation';
        animation.textContent = `-${damage}`;
        
        cardElement.appendChild(animation);
        
        // Aggiungi effetto shake
        cardElement.classList.add('shake');
        
        setTimeout(() => {
            animation.remove();
            cardElement.classList.remove('shake');
        }, 1000);
    }
    
    // Mostra animazione cura
    showHealAnimation(cardElement, amount) {
        const animation = document.createElement('div');
        animation.className = 'heal-animation';
        animation.textContent = `+${amount}`;
        
        cardElement.appendChild(animation);
        
        // Aggiungi effetto glow
        cardElement.classList.add('healing');
        
        setTimeout(() => {
            animation.remove();
            cardElement.classList.remove('healing');
        }, 1000);
    }
}

// Esporta per uso globale
window.CardDisplay = CardDisplay;