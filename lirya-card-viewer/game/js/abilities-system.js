// Sistema di gestione delle abilità
class AbilitiesSystem {
    constructor(engine) {
        this.engine = engine;
        
        // Registri per i diversi tipi di trigger
        this.triggers = {
            onEnterPlay: [],        // Quando entra in gioco
            onLeavePlay: [],        // Quando lascia il gioco
            onAttack: [],           // Quando attacca
            onDefend: [],           // Quando difende
            onDamageDealt: [],      // Quando infligge danno
            onDamageTaken: [],      // Quando subisce danno
            onTurnStart: [],        // Inizio turno
            onTurnEnd: [],          // Fine turno
            onSpellPlayed: [],      // Quando viene giocato un incantesimo
            onStructureBuilt: [],   // Quando viene costruita una struttura
            onCardDrawn: [],        // Quando viene pescata una carta
            onDeath: []             // Quando muore
        };
        
        // Abilità passive registrate
        this.passiveAbilities = [];
        
        // Aure attive
        this.auraAbilities = [];
        
        // Abilità attivabili
        this.activatedAbilities = new Map();
        
        // Contatori per abilità con limiti di utilizzo
        this.abilityUsageCounters = new Map();
    }
    
    // Registra una carta con le sue abilità
    registerCard(card, location) {
        if (!card.abilities || card.abilities.length === 0) {
            console.log(`[AbilitiesSystem] Nessuna abilità per ${card.name}`);
            return;
        }
        
        console.log(`[AbilitiesSystem] Registrando abilità per ${card.name}:`, card.abilities);
        
        card.abilities.forEach(ability => {
            const abilityType = this.categorizeAbility(ability);
            console.log(`[AbilitiesSystem] ${card.name} - Abilità: ${ability.name}, Tipo: ${abilityType.type}, Trigger: ${abilityType.trigger}`);
            
            switch (abilityType.type) {
                case 'passive':
                    this.registerPassiveAbility(card, ability, location);
                    break;
                case 'triggered':
                    this.registerTriggeredAbility(card, ability, location, abilityType.trigger);
                    break;
                case 'activated':
                    this.registerActivatedAbility(card, ability, location);
                    break;
                case 'aura':
                    this.registerAuraAbility(card, ability, location);
                    break;
            }
        });
    }
    
    // Rimuovi le abilità di una carta
    unregisterCard(card, location) {
        // Rimuovi dalle abilità passive
        this.passiveAbilities = this.passiveAbilities.filter(
            entry => !(entry.card === card && entry.location.playerId === location.playerId)
        );
        
        // Rimuovi dalle aure
        const hadAura = this.auraAbilities.some(
            entry => entry.card === card && entry.location.playerId === location.playerId
        );
        this.auraAbilities = this.auraAbilities.filter(
            entry => !(entry.card === card && entry.location.playerId === location.playerId)
        );
        
        // Rimuovi dai trigger
        Object.keys(this.triggers).forEach(trigger => {
            this.triggers[trigger] = this.triggers[trigger].filter(
                entry => !(entry.card === card && entry.location.playerId === location.playerId)
            );
        });
        
        // Rimuovi dalle abilità attivabili
        const cardKey = this.getCardKey(card, location);
        this.activatedAbilities.delete(cardKey);
        this.abilityUsageCounters.delete(cardKey);
        
        // Se aveva un'aura, ricalcola tutte le aure
        if (hadAura) {
            this.recalculateAllAuras();
        }
    }
    
    // Categorizza il tipo di abilità basandosi sul nuovo formato o sul testo legacy
    categorizeAbility(ability) {
        // Se ha il nuovo formato con type e trigger, usali direttamente
        if (ability.type && ability.trigger) {
            // Mappa i trigger dal nuovo formato a quelli interni
            const triggerMap = {
                'on_play': 'onEnterPlay',
                'on_damage_taken': 'onDamageTaken',
                'on_attack': 'onAttack',
                'on_spell_played': 'onSpellPlayed',
                'on_structure_built': 'onStructureBuilt',
                'turn_start': 'onTurnStart',
                'turn_end': 'onTurnEnd',
                'always': 'passive', // Le abilità sempre attive sono passive
                'conditional': 'passive' // Le abilità condizionali sono passive
            };
            
            const mappedTrigger = triggerMap[ability.trigger] || ability.trigger;
            
            // Controlla anche se il trigger è già nel formato interno
            const finalTrigger = this.triggers[mappedTrigger] ? mappedTrigger : ability.trigger;
            
            if (ability.type === 'passive' || mappedTrigger === 'passive' || ability.trigger === 'always') {
                return { type: 'passive' };
            } else if (ability.type === 'activated') {
                return { type: 'activated' };
            } else if (ability.type === 'aura') {
                return { type: 'aura' };
            } else if (ability.type === 'triggered' || ability.type === 'spell') {
                return { type: 'triggered', trigger: finalTrigger };
            } else {
                // Se non è specificato ma ha un trigger, è un'abilità innescata
                return { type: 'triggered', trigger: finalTrigger };
            }
        }
        
        // Fallback al vecchio sistema basato su testo per compatibilità
        const effect = (ability.effect || ability.description || '').toLowerCase();
        
        // Trigger comuni
        if (effect.includes('quando entra in gioco')) {
            return { type: 'triggered', trigger: 'onEnterPlay' };
        }
        if (effect.includes('quando viene attaccato')) {
            return { type: 'triggered', trigger: 'onDamageTaken' };
        }
        if (effect.includes('quando attacca')) {
            return { type: 'triggered', trigger: 'onAttack' };
        }
        if (effect.includes('quando giochi un incantesimo')) {
            return { type: 'triggered', trigger: 'onSpellPlayed' };
        }
        if (effect.includes('quando evochi una struttura')) {
            return { type: 'triggered', trigger: 'onStructureBuilt' };
        }
        if (effect.includes('all\'inizio del tuo turno')) {
            return { type: 'triggered', trigger: 'onTurnStart' };
        }
        if (effect.includes('alla fine del turno')) {
            return { type: 'triggered', trigger: 'onTurnEnd' };
        }
        
        // Abilità attivate
        if (effect.includes('una volta per turno') || 
            effect.includes('puoi') || 
            effect.includes('paga')) {
            return { type: 'activated' };
        }
        
        // Default: abilità passiva
        return { type: 'passive' };
    }
    
    // Registra un'abilità passiva
    registerPassiveAbility(card, ability, location) {
        this.passiveAbilities.push({
            card,
            ability,
            location,
            apply: () => this.applyPassiveEffect(card, ability, location)
        });
        
        // Applica immediatamente l'effetto passivo
        this.applyPassiveEffect(card, ability, location);
    }
    
    // Registra un'abilità innescata
    registerTriggeredAbility(card, ability, location, trigger) {
        if (!this.triggers[trigger]) {
            console.warn(`Trigger sconosciuto: ${trigger}`);
            return;
        }
        
        this.triggers[trigger].push({
            card,
            ability,
            location,
            execute: (context) => this.executeTriggeredAbility(card, ability, location, context)
        });
    }
    
    // Registra un'abilità attivabile
    registerActivatedAbility(card, ability, location) {
        const cardKey = this.getCardKey(card, location);
        
        if (!this.activatedAbilities.has(cardKey)) {
            this.activatedAbilities.set(cardKey, []);
        }
        
        this.activatedAbilities.get(cardKey).push({
            ability,
            canActivate: () => this.canActivateAbility(card, ability, location),
            activate: () => this.activateAbility(card, ability, location)
        });
        
        // Inizializza il contatore di utilizzo se ha limiti
        const abilityText = ability.effect || ability.description || '';
        if (abilityText.includes('una volta per turno')) {
            if (!this.abilityUsageCounters.has(cardKey)) {
                this.abilityUsageCounters.set(cardKey, new Map());
            }
            this.abilityUsageCounters.get(cardKey).set(ability.name, 0);
        }
    }
    
    // Applica effetti passivi
    applyPassiveEffect(card, ability, location) {
        // Se l'abilità ha il nuovo formato con array di effects
        if (ability.effects && Array.isArray(ability.effects)) {
            ability.effects.forEach(effect => {
                this.applyEffect(card, effect, location, ability);
            });
        } else {
            // Fallback al vecchio sistema per compatibilità
            const effect = (ability.effect || ability.description || '').toLowerCase();
            
            // Resistenza al danno
            if (effect.includes('riduce di 1 tutti i danni')) {
                card.damageReduction = (card.damageReduction || 0) + 1;
            }
            
            // Immunità
            if (effect.includes('non può essere bersaglio')) {
                if (effect.includes('fuoco')) {
                    card.immunities = card.immunities || [];
                    card.immunities.push('Fuoco');
                }
            }
            
            // Movimento libero
            if (effect.includes('può cambiare linea senza costi')) {
                card.freeMoveEnabled = true;
            }
            
            // Attacco immediato
            if (effect.includes('può attaccare nello stesso turno')) {
                card.hasHaste = true;
            }
            
            // Costi aggiuntivi per bersagliare
            if (effect.includes('costano 1 energia in più')) {
                card.targetingCostIncrease = (card.targetingCostIncrease || 0) + 1;
            }
            
            // Bonus condizionali
            if (effect.includes('se è il tuo turno')) {
                // Questi vengono calcolati dinamicamente
                card.conditionalBonuses = card.conditionalBonuses || [];
                card.conditionalBonuses.push(ability);
            }
        }
        
        console.log(`Abilità passiva applicata: ${ability.name} su ${card.name}`);
    }
    
    // Registra un'abilità aura
    registerAuraAbility(card, ability, location) {
        this.auraAbilities.push({
            card,
            ability,
            location,
            apply: () => this.applyAuraEffect(card, ability, location)
        });
        
        // Applica immediatamente l'effetto dell'aura
        this.recalculateAllAuras();
    }
    
    // Applica effetti di un'aura
    applyAuraEffect(card, ability, location) {
        if (!ability.effects || !Array.isArray(ability.effects)) return;
        
        ability.effects.forEach(effect => {
            if (effect.type === 'stat_modifier' && effect.target === 'allied_creatures') {
                // Trova tutte le creature alleate che soddisfano il filtro
                const alliedCreatures = this.engine.state.getAllCreatures(location.playerId);
                
                alliedCreatures.forEach(target => {
                    // Verifica il filtro
                    if (effect.filter && effect.filter.class) {
                        const targetCard = target.card || target;
                        if (targetCard.class !== effect.filter.class) return;
                    }
                    
                    // Applica il bonus
                    const targetCard = target.card || target;
                    if (!targetCard.auraBonuses) {
                        targetCard.auraBonuses = { attack: 0, defense: 0, health: 0 };
                    }
                    
                    if (effect.stat === 'attack' || !effect.stat) {
                        targetCard.auraBonuses.attack += (effect.value || 1);
                    }
                    if (effect.stat === 'defense') {
                        targetCard.auraBonuses.defense += (effect.value || 0);
                    }
                });
            }
        });
    }
    
    // Ricalcola tutte le aure
    recalculateAllAuras() {
        // Resetta tutti i bonus delle aure
        for (let playerId = 1; playerId <= 2; playerId++) {
            const creatures = this.engine.state.getAllCreatures(playerId);
            creatures.forEach(creature => {
                const card = creature.card || creature;
                if (card.auraBonuses) {
                    card.auraBonuses = { attack: 0, defense: 0, health: 0 };
                }
            });
        }
        
        // Riapplica tutte le aure attive
        this.auraAbilities.forEach(aura => {
            aura.apply();
        });
        
        // Aggiorna la UI per mostrare i nuovi valori
        if (this.engine.ui) {
            this.engine.ui.updateBoard(this.engine.state);
        }
    }
    
    // Applica un singolo effetto dal nuovo formato
    applyEffect(card, effect, location, ability) {
        switch (effect.type) {
            case 'immunity':
                if (effect.condition && effect.condition.source_element) {
                    card.immunities = card.immunities || [];
                    card.immunities.push(effect.condition.source_element);
                }
                break;
                
            case 'ability_grant':
                switch (effect.ability) {
                    case 'free_line_change':
                        card.freeMoveEnabled = true;
                        break;
                    case 'haste':
                        card.hasHaste = true;
                        break;
                }
                break;
                
            case 'damage_reduction':
                card.damageReduction = (card.damageReduction || 0) + (effect.value || 1);
                break;
                
            case 'cost_modifier':
                if (effect.target === 'enemy_spells_targeting_self') {
                    card.targetingCostIncrease = (card.targetingCostIncrease || 0) + (effect.value || 1);
                }
                break;
                
            case 'stat_modifier':
                // Per bonus condizionali, salva l'abilità per calcolo dinamico
                if (effect.condition || ability.trigger === 'conditional') {
                    card.conditionalBonuses = card.conditionalBonuses || [];
                    card.conditionalBonuses.push(ability);
                } else {
                    // Applica bonus permanenti
                    console.log(`[AbilitiesSystem] Applicando bonus permanente a ${card.name}`);
                    if (effect.stat === 'attack') {
                        const oldValue = card.attack || 0;
                        card.attack = oldValue + (effect.value || 0);
                        console.log(`[AbilitiesSystem] Attacco di ${card.name}: ${oldValue} -> ${card.attack}`);
                    } else if (effect.stat === 'defense') {
                        const oldValue = card.defense || 0;
                        card.defense = oldValue + (effect.value || 0);
                        console.log(`[AbilitiesSystem] Difesa di ${card.name}: ${oldValue} -> ${card.defense}`);
                    }
                    
                    // Forza aggiornamento UI per bonus permanenti
                    if (this.engine.ui) {
                        console.log('[AbilitiesSystem] Aggiornando UI dopo bonus permanente');
                        this.engine.ui.updateBoard(this.engine.state);
                    }
                }
                break;
        }
    }
    
    // Esegue un'abilità innescata
    executeTriggeredAbility(card, ability, location, context) {
        // Se l'abilità ha il nuovo formato con effects array, eseguili
        if (ability.effects && Array.isArray(ability.effects)) {
            ability.effects.forEach(effect => {
                this.executeEffect(effect, card, location, context);
            });
            return;
        }
        
        // Altrimenti usa il sistema legacy basato su testo
        const effectText = ability.effect || ability.description || ability.effect_text || '';
        console.log(`Eseguendo abilità innescata: ${ability.name} di ${card.name}`);
        
        // Danno diretto quando entra in gioco
        if (effectText.includes('infligge') && effectText.includes('danno')) {
            const damageMatch = effectText.match(/infligge (\d+) dann/);
            if (damageMatch) {
                const damage = parseInt(damageMatch[1]);
                // Richiedi selezione del bersaglio
                // Per ora attacca il primo nemico disponibile
                const targets = this.findValidTargets(['character']);
                const enemyTargets = targets.filter(t => t.playerId !== location.playerId);
                if (enemyTargets.length > 0) {
                    console.log(`${card.name} infligge ${damage} danni a ${enemyTargets[0].card.name}`);
                    this.engine.rules.damageCreature(enemyTargets[0], damage);
                }
            }
        }
        
        // Guardare carte
        if (effectText.includes('guarda la prima carta')) {
            const topCard = this.engine.state.getPlayer(location.playerId).deck[0];
            if (topCard) {
                // Mostra preview della carta (per ora solo log)
                console.log(`Carta in cima al mazzo: ${topCard.name}`);
                
                if (effectText.includes('puoi metterla in fondo')) {
                        // Per ora mettiamo sempre in fondo (da implementare UI per scelta)
                    console.log(`Puoi mettere ${topCard.name} in fondo al mazzo`);
                }
            }
        }
        
        // Bonus temporanei
        if (effectText.includes('guadagna') && effectText.includes('fino alla fine del turno')) {
            const bonusMatch = effectText.match(/guadagna \+(\d+) (ATT|DIF)/);
            if (bonusMatch) {
                const amount = parseInt(bonusMatch[1]);
                const stat = bonusMatch[2] === 'ATT' ? 'attack' : 'defense';
                
                this.applyTemporaryBonus(card, stat, amount);
            }
        }
        
        // Pesca carte
        if (effectText.includes('pesca una carta')) {
            this.engine.state.drawCards(location.playerId, 1);
            console.log(`${card.name} fa pescare una carta`);
        }
        
        // Spostamento personaggi
        if (effectText.includes('spostare un personaggio')) {
            // Per ora non implementato
            console.log(`${card.name} può spostare un personaggio alleato`);
        }
        
        // Debuff attaccante
        if (effectText.includes('attaccante perde')) {
            const debuffMatch = effectText.match(/perde (\d+) (ATT|DIF)/);
            if (debuffMatch && context.attacker) {
                const amount = parseInt(debuffMatch[1]);
                const stat = debuffMatch[2] === 'ATT' ? 'attack' : 'defense';
                
                this.applyTemporaryBonus(context.attacker.card, stat, -amount);
            }
        }
    }
    
    // Verifica se un'abilità può essere attivata
    canActivateAbility(card, ability, location) {
        // Verifica che sia il turno del giocatore
        if (location.playerId !== this.engine.state.currentPlayer) {
            return false;
        }
        
        const abilityText = ability.effect || ability.description || '';
        
        // Verifica limiti di utilizzo
        if (abilityText.includes('una volta per turno')) {
            const cardKey = this.getCardKey(card, location);
            const usage = this.abilityUsageCounters.get(cardKey)?.get(ability.name) || 0;
            if (usage >= 1) {
                return false;
            }
        }
        
        // Verifica costi
        const costMatch = abilityText.match(/paga (\d+) energia/);
        if (costMatch) {
            const cost = parseInt(costMatch[1]);
            if (this.engine.state.getPlayer(location.playerId).energy < cost) {
                return false;
            }
        }
        
        return true;
    }
    
    // Attiva un'abilità
    activateAbility(card, ability, location) {
        if (!this.canActivateAbility(card, ability, location)) {
            console.log('Abilità non attivabile');
            return;
        }
        
        console.log(`Attivando abilità: ${ability.name} di ${card.name}`);
        
        const abilityText = ability.effect || ability.description || '';
        
        // Paga i costi
        const costMatch = abilityText.match(/paga (\d+) energia/);
        if (costMatch) {
            const cost = parseInt(costMatch[1]);
            this.engine.state.getPlayer(location.playerId).energy -= cost;
        }
        
        // Incrementa il contatore di utilizzo
        if (abilityText.includes('una volta per turno')) {
            const cardKey = this.getCardKey(card, location);
            const current = this.abilityUsageCounters.get(cardKey).get(ability.name) || 0;
            this.abilityUsageCounters.get(cardKey).set(ability.name, current + 1);
        }
        
        // Esegui l'effetto
        this.executeTriggeredAbility(card, ability, location, {});
    }
    
    // Attiva trigger per un evento
    triggerEvent(eventType, context = {}) {
        console.log(`[AbilitiesSystem] Triggering event: ${eventType}`, context);
        
        if (!this.triggers[eventType]) {
            console.log(`[AbilitiesSystem] Nessun trigger registrato per ${eventType}`);
            return;
        }
        
        const triggers = [...this.triggers[eventType]];
        console.log(`[AbilitiesSystem] Trovati ${triggers.length} trigger per ${eventType}`);
        
        triggers.forEach(trigger => {
            console.log(`[AbilitiesSystem] Verificando trigger per ${trigger.card.name}`);
            // Verifica se il trigger è applicabile al contesto
            if (this.isTriggerApplicable(trigger, context)) {
                try {
                    console.log(`[AbilitiesSystem] Eseguendo trigger per ${trigger.card.name}`);
                    trigger.execute(context);
                } catch (error) {
                    console.error(`Errore nell'esecuzione del trigger ${eventType}:`, error);
                }
            } else {
                console.log(`[AbilitiesSystem] Trigger non applicabile per ${trigger.card.name}`);
            }
        });
    }
    
    // Verifica se un trigger è applicabile
    isTriggerApplicable(trigger, context) {
        // Per onTurnStart, verifica che sia il turno del proprietario
        if (context.playerId !== undefined && 
            trigger.location.playerId !== context.playerId) {
            return false;
        }
        
        // Per eventi su specifiche carte, verifica che sia la carta giusta
        if (context.card && trigger.card !== context.card) {
            return false;
        }
        
        return true;
    }
    
    // Applica bonus temporaneo
    applyTemporaryBonus(card, stat, amount) {
        console.log(`[AbilitiesSystem] Applicando bonus temporaneo: ${stat} ${amount > 0 ? '+' : ''}${amount} a ${card.name}`);
        
        card.temporaryBonuses = card.temporaryBonuses || {};
        card.temporaryBonuses[stat] = (card.temporaryBonuses[stat] || 0) + amount;
        
        // Registra per rimozione a fine turno
        this.engine.state.temporaryEffects.push({
            type: 'statBonus',
            card,
            stat,
            amount,
            until: 'endOfTurn'
        });
        
        // Forza aggiornamento UI
        if (this.engine.ui) {
            console.log('[AbilitiesSystem] Aggiornando UI dopo bonus temporaneo');
            this.engine.ui.updateBoard(this.engine.state);
        }
    }
    
    // Calcola bonus condizionali
    calculateConditionalBonuses(card, location) {
        if (!card.conditionalBonuses) return { attack: 0, defense: 0 };
        
        let bonuses = { attack: 0, defense: 0 };
        
        card.conditionalBonuses.forEach(ability => {
            const effectText = (ability.effect || ability.description || '').toLowerCase();
            
            // Se ha il nuovo formato con effects array
            if (ability.effects && Array.isArray(ability.effects)) {
                ability.effects.forEach(effect => {
                    if (effect.type === 'stat_modifier' && effect.condition) {
                        // Verifica la condizione
                        let conditionMet = false;
                        
                        if (effect.condition.type === 'hand_size_comparison') {
                            const myHand = this.engine.state.getPlayer(location.playerId).hand.length;
                            const oppHand = this.engine.state.getPlayer(3 - location.playerId).hand.length;
                            conditionMet = (effect.condition.operator === 'less' && myHand < oppHand);
                        } else if (effect.condition.type === 'count_enemy_structures') {
                            const enemyStructures = this.engine.state.getPlayer(3 - location.playerId).structures.filter(s => s).length;
                            bonuses[effect.stat] += (effect.value || 1) * enemyStructures;
                            return; // Skip il resto per questo effetto
                        } else if (effect.condition.type === 'zone_comparison') {
                            const myCount = this.engine.state.getPlayer(location.playerId)[effect.condition.zone].filter(c => c).length;
                            const oppCount = this.engine.state.getPlayer(3 - location.playerId)[effect.condition.zone].filter(c => c).length;
                            conditionMet = (effect.condition.operator === 'more' && myCount > oppCount);
                        }
                        
                        if (conditionMet) {
                            bonuses[effect.stat] += (effect.value || 0);
                        }
                    }
                });
            } else {
                // Fallback al vecchio sistema basato su testo
                // Bonus se l'avversario ha più carte
                if (effectText.includes('avversario ha più carte in mano')) {
                    const myHand = this.engine.state.getPlayer(location.playerId).hand.length;
                    const oppHand = this.engine.state.getPlayer(3 - location.playerId).hand.length;
                    
                    if (oppHand > myHand) {
                        const bonusMatch = effectText.match(/guadagna \+(\d+) att/i);
                        if (bonusMatch) {
                            bonuses.attack += parseInt(bonusMatch[1]);
                        }
                    }
                }
                
                // Bonus per strutture nemiche (Kaira)
                if (effectText.includes('per ogni struttura nemica')) {
                    const enemyStructures = this.engine.state.getPlayer(3 - location.playerId).structures.filter(s => s).length;
                    const bonusMatch = effectText.match(/\+(\d+) dann/);
                    if (bonusMatch) {
                        bonuses.attack += parseInt(bonusMatch[1]) * enemyStructures;
                    }
                }
                
                // Bonus se più personaggi in seconda linea (Thorne)
                if (effectText.includes('più personaggi in seconda linea')) {
                    const mySecondLine = this.engine.state.getPlayer(location.playerId).secondLine.filter(c => c).length;
                    const oppSecondLine = this.engine.state.getPlayer(3 - location.playerId).secondLine.filter(c => c).length;
                    
                    if (mySecondLine > oppSecondLine) {
                        const bonusMatch = effectText.match(/guadagna \+(\d+) att/i);
                        if (bonusMatch) {
                            bonuses.attack += parseInt(bonusMatch[1]);
                        }
                    }
                }
            }
        });
        
        return bonuses;
    }
    
    // Resetta i contatori per turno
    resetTurnCounters() {
        this.abilityUsageCounters.forEach(cardCounters => {
            cardCounters.forEach((count, abilityName) => {
                cardCounters.set(abilityName, 0);
            });
        });
    }
    
    // Ottieni le abilità attivabili per una carta
    getActivatableAbilities(card, location) {
        const cardKey = this.getCardKey(card, location);
        const abilities = this.activatedAbilities.get(cardKey) || [];
        
        return abilities.filter(a => a.canActivate());
    }
    
    // Esegue un effetto specifico dal nuovo formato
    executeEffect(effect, card, location, context) {
        switch (effect.type) {
            case 'damage':
                this.executeDamageEffect(effect, card, location, context);
                break;
                
            case 'draw_cards':
                const playerId = effect.target === 'self' ? location.playerId : (3 - location.playerId);
                this.engine.state.drawCards(playerId, effect.value || 1);
                console.log(`${card.name} fa pescare ${effect.value || 1} carte`);
                break;
                
            case 'gain_energy':
                const energyPlayerId = effect.target === 'self' ? location.playerId : (3 - location.playerId);
                this.engine.state.getPlayer(energyPlayerId).energy += (effect.value || 1);
                console.log(`${card.name} fa guadagnare ${effect.value || 1} energia`);
                break;
                
            case 'heal':
                this.executeHealEffect(effect, card, location, context);
                break;
                
            case 'stat_modifier':
                this.executeStatModifierEffect(effect, card, location, context);
                break;
                
            case 'move_card':
                this.executeMoveCardEffect(effect, card, location, context);
                break;
                
            case 'look_at_cards':
                this.executeLookAtCardsEffect(effect, card, location, context);
                break;
                
            case 'destroy':
                this.executeDestroyEffect(effect, card, location, context);
                break;
                
            case 'return_to_hand':
                this.executeReturnToHandEffect(effect, card, location, context);
                break;
                
            default:
                console.warn(`Tipo di effetto non implementato: ${effect.type}`);
        }
    }
    
    // Esegue effetto di danno
    executeDamageEffect(effect, card, location, context) {
        const damage = effect.value || 1;
        
        if (effect.target === 'all_enemies') {
            // Danno a tutti i nemici
            const enemyPlayerId = 3 - location.playerId;
            const enemies = this.engine.state.getAllCreatures(enemyPlayerId);
            enemies.forEach(enemy => {
                this.engine.rules.damageCreature(enemy, damage);
            });
        } else if (effect.target === 'target') {
            // Richiede selezione del bersaglio
            const validTargets = this.findValidTargets(['character']);
            const enemyTargets = validTargets.filter(t => t.playerId !== location.playerId);
            if (enemyTargets.length > 0) {
                // Per ora attacca il primo nemico disponibile
                console.log(`${card.name} infligge ${damage} danni a ${enemyTargets[0].card.name}`);
                this.engine.rules.damageCreature(enemyTargets[0], damage);
            }
        } else if (effect.target === 'random_enemy') {
            // Danno a un nemico casuale
            const enemyPlayerId = 3 - location.playerId;
            const enemies = this.engine.state.getAllCreatures(enemyPlayerId);
            if (enemies.length > 0) {
                const randomEnemy = enemies[Math.floor(Math.random() * enemies.length)];
                this.engine.rules.damageCreature(randomEnemy, damage);
            }
        }
    }
    
    // Esegue effetto di cura
    executeHealEffect(effect, card, location, context) {
        const heal = effect.value || 1;
        
        if (effect.target === 'self') {
            // Cura se stesso
            const creature = this.engine.state.getCreatureAt(location.playerId, location.zone, location.position);
            if (creature && creature.currentHealth !== undefined) {
                const maxHealth = creature.card.stats?.health || creature.card.health || 
                                 creature.card.stats?.defense || creature.card.defense || 1;
                creature.currentHealth = Math.min(creature.currentHealth + heal, maxHealth);
                console.log(`${card.name} si cura di ${heal} punti vita`);
            }
        } else if (effect.target === 'all_allies') {
            // Cura tutti gli alleati
            const allies = this.engine.state.getAllCreatures(location.playerId);
            allies.forEach(ally => {
                if (ally.currentHealth !== undefined) {
                    const maxHealth = ally.card.stats?.health || ally.card.health || 
                                     ally.card.stats?.defense || ally.card.defense || 1;
                    ally.currentHealth = Math.min(ally.currentHealth + heal, maxHealth);
                }
            });
        }
    }
    
    // Esegue modificatore di statistiche
    executeStatModifierEffect(effect, card, location, context) {
        const value = effect.value || 1;
        const duration = effect.duration || 'permanent';
        
        if (effect.target === 'self') {
            if (duration === 'end_of_turn') {
                this.applyTemporaryBonus(card, effect.stat, value);
            } else {
                // Bonus permanente
                if (effect.stat === 'attack') {
                    card.attack = (card.attack || 0) + value;
                } else if (effect.stat === 'defense') {
                    card.defense = (card.defense || 0) + value;
                }
            }
        } else if (effect.target === 'target' && context.target) {
            // Applica al bersaglio
            const targetCard = context.target.card;
            if (duration === 'end_of_turn') {
                this.applyTemporaryBonus(targetCard, effect.stat, value);
            } else {
                if (effect.stat === 'attack') {
                    targetCard.attack = (targetCard.attack || 0) + value;
                } else if (effect.stat === 'defense') {
                    targetCard.defense = (targetCard.defense || 0) + value;
                }
            }
        }
    }
    
    // Altri metodi di esecuzione effetti...
    executeMoveCardEffect(effect, card, location, context) {
        console.log(`Effetto spostamento carta non ancora implementato`);
    }
    
    executeLookAtCardsEffect(effect, card, location, context) {
        if (effect.source === 'deck_top') {
            const topCard = this.engine.state.getPlayer(location.playerId).deck[0];
            if (topCard) {
                console.log(`Carta in cima al mazzo: ${topCard.name}`);
                // TODO: Implementare UI per mostrare la carta e scegliere se metterla in fondo
            }
        }
    }
    
    executeDestroyEffect(effect, card, location, context) {
        console.log(`Effetto distruzione non ancora implementato`);
    }
    
    executeReturnToHandEffect(effect, card, location, context) {
        console.log(`Effetto ritorno in mano non ancora implementato`);
    }
    
    // Chiave univoca per carta
    getCardKey(card, location) {
        return `${location.playerId}-${location.zone}-${location.position}`;
    }
    
    // Metodi helper per la UI
    requestTarget(message, types, callback) {
        // Per ora, usa un placeholder - questo dovrebbe essere implementato nella UI
        console.log(`Richiesta target: ${message}`);
        // TODO: Implementare la selezione del target nella UI
        
        // Per test, seleziona il primo bersaglio valido
        const validTargets = this.findValidTargets(types);
        if (validTargets.length > 0) {
            callback(validTargets[0]);
        }
    }
    
    findValidTargets(types) {
        const targets = [];
        
        // Cerca personaggi
        if (types.includes('character')) {
            for (let playerId = 1; playerId <= 2; playerId++) {
                const player = this.engine.state.getPlayer(playerId);
                
                ['firstLine', 'secondLine'].forEach(zone => {
                    player[zone].forEach((card, position) => {
                        if (card && card.type === 'Personaggio') {
                            targets.push({
                                card,
                                playerId,
                                zone,
                                position,
                                location: { playerId, zone, position }
                            });
                        }
                    });
                });
            }
        }
        
        // Filtra per alleati se richiesto
        if (types.includes('ally')) {
            return targets.filter(t => t.playerId === this.engine.state.currentPlayer);
        }
        
        return targets;
    }
    
    showChoice(message, choices, callback) {
        // Per ora, usa un placeholder
        console.log(`Scelta: ${message} - Opzioni: ${choices.join(', ')}`);
        // TODO: Implementare nella UI
        
        // Per test, scegli sempre la prima opzione
        callback(choices[0]);
    }
}

// Esporta il sistema
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AbilitiesSystem;
}