// Sistema di gestione delle abilità - Versione 2.0
class AbilitiesSystemV2 {
    constructor(engine) {
        this.engine = engine;
        
        // Registri per tracciare modificatori attivi
        this.activeModifiers = new Map(); // cardId -> array di modificatori
        this.activeAuras = [];
        this.activatedAbilities = new Map(); // cardId -> array di abilità attivate
        this.equipments = new Map(); // creatureId -> array di equipaggiamenti
        
        // Contatori per limitare abilità "una volta per turno"
        this.abilityUsage = new Map();
        
        // Effetti temporanei che durano fino a fine turno
        this.temporaryEffects = [];
    }
    
    // Inizializza il sistema per una nuova partita
    init() {
        this.activeModifiers.clear();
        this.activeAuras = [];
        this.activatedAbilities.clear();
        this.equipments.clear();
        this.abilityUsage.clear();
        this.temporaryEffects = [];
    }
    
    // Processa tutte le abilità quando una carta entra in gioco
    onCardPlayed(card, location) {
        console.log(`[AbilitiesV2] Processando carta giocata: ${card.name}`, card.abilities);
        
        if (!card.abilities || card.abilities.length === 0) return;
        
        card.abilities.forEach(ability => {
            this.processAbility(ability, card, location);
        });
        
        // Ricalcola tutte le aure dopo aver giocato una carta
        this.recalculateAuras();
    }
    
    // Processa una singola abilità
    processAbility(ability, card, location) {
        console.log(`[AbilitiesV2] Processando abilità: ${ability.name} (${ability.type})`);
        
        switch (ability.type) {
            case 'triggered':
                if (ability.trigger === 'on_play') {
                    this.resolveEffects(ability.effects, card, location);
                }
                break;
                
            case 'passive':
                this.registerPassiveAbility(ability, card, location);
                break;
                
            case 'aura':
                this.registerAura(ability, card, location);
                break;
                
            case 'activated':
                this.registerActivatedAbility(ability, card, location);
                break;
        }
    }
    
    // Risolve un array di effetti
    resolveEffects(effects, source, sourceLocation) {
        if (!effects) return;
        
        effects.forEach(effect => {
            console.log(`[AbilitiesV2] Risolvendo effetto: ${effect.type}`);
            this.resolveEffect(effect, source, sourceLocation);
        });
    }
    
    // Risolve un singolo effetto
    resolveEffect(effect, source, sourceLocation) {
        switch (effect.type) {
            case 'stat_modifier':
                this.applyStatModifier(effect, source, sourceLocation);
                break;
                
            case 'damage':
                this.applyDamage(effect, source, sourceLocation);
                break;
                
            case 'heal':
                this.applyHeal(effect, source, sourceLocation);
                break;
                
            case 'draw_card':
                this.applyDrawCard(effect, sourceLocation);
                break;
                
            case 'gain_energy':
                this.applyGainEnergy(effect, sourceLocation);
                break;
                
            case 'ability_grant':
                this.grantAbility(effect, source, sourceLocation);
                break;
                
            case 'cost_reduction':
                this.applyCostReduction(effect, sourceLocation);
                break;
                
            case 'summon_token':
                this.summonToken(effect, sourceLocation);
                break;
                
            case 'silence':
                this.applySilence(effect, sourceLocation);
                break;
                
            default:
                console.warn(`[AbilitiesV2] Effetto non implementato: ${effect.type}`);
        }
    }
    
    // Applica modificatori alle statistiche
    applyStatModifier(effect, source, sourceLocation) {
        const targets = this.getTargets(effect.target, sourceLocation, effect.filter);
        
        targets.forEach(target => {
            const modifier = {
                source: source.name,
                sourceId: this.getCardId(source, sourceLocation),
                stat: effect.stat,
                value: effect.value,
                duration: effect.duration || 'permanent'
            };
            
            // Registra il modificatore
            const targetId = this.getCardId(target.card, target);
            if (!this.activeModifiers.has(targetId)) {
                this.activeModifiers.set(targetId, []);
            }
            this.activeModifiers.get(targetId).push(modifier);
            
            // Se temporaneo, aggiungi alla lista degli effetti temporanei
            if (modifier.duration === 'until_end_of_turn') {
                this.temporaryEffects.push({
                    type: 'modifier',
                    targetId,
                    modifier
                });
            }
            
            // Aggiorna visivamente la carta
            this.updateCardVisuals(target);
        });
    }
    
    // Applica danno
    applyDamage(effect, source, sourceLocation) {
        const targets = this.getTargets(effect.target, sourceLocation, effect.filter);
        
        targets.forEach(target => {
            if (target.type === 'player') {
                this.engine.state.dealDamage(target.playerId, effect.value);
                this.engine.ui.showDamageToPlayer(target.playerId, effect.value);
            } else {
                this.engine.rules.damageCreature(target, effect.value);
            }
        });
    }
    
    // Applica cura
    applyHeal(effect, source, sourceLocation) {
        const targets = this.getTargets(effect.target, sourceLocation, effect.filter);
        
        targets.forEach(target => {
            if (target.type === 'player') {
                const player = this.engine.state.getPlayer(target.playerId);
                player.life = Math.min(player.life + effect.value, player.maxLife || 20);
                this.engine.ui.updatePlayerInfo(player, target.playerId);
            } else {
                this.engine.rules.healCreature(target, effect.value);
            }
        });
    }
    
    // Pesca carte
    applyDrawCard(effect, sourceLocation) {
        const playerId = sourceLocation.playerId;
        this.engine.state.drawCards(playerId, effect.value || 1);
        this.engine.ui.updateBoard(this.engine.state);
    }
    
    // Guadagna energia
    applyGainEnergy(effect, sourceLocation) {
        const playerId = sourceLocation.playerId;
        this.engine.state.addEnergy(playerId, effect.value || 1);
        const player = this.engine.state.getPlayer(playerId);
        this.engine.ui.updatePlayerInfo(player, playerId);
    }
    
    // Concede abilità
    grantAbility(effect, source, sourceLocation) {
        const targets = this.getTargets(effect.target, sourceLocation, effect.filter);
        
        targets.forEach(target => {
            // Aggiungi l'abilità alla creatura
            if (!target.grantedAbilities) {
                target.grantedAbilities = [];
            }
            
            target.grantedAbilities.push({
                ability: effect.ability,
                source: source.name,
                duration: effect.duration || 'permanent'
            });
            
            // Applica l'effetto dell'abilità
            switch (effect.ability) {
                case 'haste':
                    if (target.summoningSickness) {
                        target.summoningSickness = false;
                    }
                    break;
                case 'stealth':
                    target.hasStsealth = true;
                    break;
                case 'flying':
                case 'reach':
                    target.canAttackSecondLine = true;
                    break;
            }
            
            this.updateCardVisuals(target);
        });
    }
    
    // Ottieni i bersagli per un effetto
    getTargets(targetType, sourceLocation, filter) {
        const targets = [];
        const playerId = sourceLocation.playerId;
        
        switch (targetType) {
            case 'self':
                targets.push(sourceLocation);
                break;
                
            case 'all_allies':
            case 'allied_creatures':
                const allies = this.engine.state.getAllCreatures(playerId);
                targets.push(...this.filterTargets(allies, filter));
                break;
                
            case 'all_enemies':
            case 'enemy_creatures':
                const enemyId = playerId === 1 ? 2 : 1;
                const enemies = this.engine.state.getAllCreatures(enemyId);
                targets.push(...this.filterTargets(enemies, filter));
                break;
                
            case 'target':
            case 'target_ally':
            case 'target_enemy':
                // Questo richiederà selezione manuale del bersaglio
                // Per ora lo saltiamo
                break;
        }
        
        return targets;
    }
    
    // Filtra i bersagli in base ai criteri
    filterTargets(targets, filter) {
        if (!filter) return targets;
        
        return targets.filter(target => {
            const card = target.card || target;
            
            if (filter.element && card.element !== filter.element) return false;
            if (filter.class && card.class !== filter.class) return false;
            if (filter.zone && target.zone !== filter.zone) return false;
            if (filter.exclude_self && target === filter.source) return false;
            
            return true;
        });
    }
    
    // Calcola le statistiche totali di una creatura includendo i modificatori
    getModifiedStats(creature) {
        const baseStats = {
            attack: creature.card.stats?.attack || creature.card.attack || 0,
            defense: creature.card.stats?.defense || creature.card.defense || 0,
            health: creature.card.stats?.health || creature.card.health || 1
        };
        
        const modifiedStats = { ...baseStats };
        
        // Applica modificatori diretti
        const creatureId = this.getCardId(creature.card, creature);
        const modifiers = this.activeModifiers.get(creatureId) || [];
        
        modifiers.forEach(mod => {
            switch (mod.stat) {
                case 'attack':
                    modifiedStats.attack += mod.value;
                    break;
                case 'defense':
                    modifiedStats.defense += mod.value;
                    break;
                case 'health':
                    modifiedStats.health += mod.value;
                    break;
                case 'both': // per effetti +1/+1
                    modifiedStats.attack += mod.value;
                    modifiedStats.defense += mod.value;
                    break;
            }
        });
        
        // Applica modificatori da equipaggiamenti
        const equipments = this.equipments.get(creatureId) || [];
        equipments.forEach(equip => {
            if (equip.stats) {
                modifiedStats.attack += equip.stats.attack || 0;
                modifiedStats.defense += equip.stats.defense || 0;
            }
        });
        
        // Applica aure
        this.activeAuras.forEach(aura => {
            if (this.isAffectedByAura(creature, aura)) {
                aura.ability.effects?.forEach(effect => {
                    if (effect.type === 'stat_modifier') {
                        switch (effect.stat) {
                            case 'attack':
                                modifiedStats.attack += effect.value;
                                break;
                            case 'defense':
                                modifiedStats.defense += effect.value;
                                break;
                            case 'health':
                                modifiedStats.health += effect.value;
                                break;
                        }
                    }
                });
            }
        });
        
        // Assicura che le stats non vadano sotto 0
        modifiedStats.attack = Math.max(0, modifiedStats.attack);
        modifiedStats.defense = Math.max(0, modifiedStats.defense);
        modifiedStats.health = Math.max(1, modifiedStats.health);
        
        return modifiedStats;
    }
    
    // Aggiorna la visualizzazione di una carta
    updateCardVisuals(target) {
        this.engine.ui.updateCardDisplay(target);
    }
    
    // Registra un'abilità passiva
    registerPassiveAbility(ability, card, location) {
        // Le abilità passive sono sempre attive, non hanno bisogno di registrazione speciale
        // Gli effetti vengono applicati immediatamente quando appropriato
        console.log(`[AbilitiesV2] Abilità passiva registrata: ${ability.name}`);
        
        // Se l'abilità ha trigger specifici, li gestiamo
        if (ability.trigger === 'always' || ability.trigger === 'while_in_zone') {
            // Applica immediatamente gli effetti
            this.resolveEffects(ability.effects, card, location);
        }
    }
    
    // Registra un'abilità attivata
    registerActivatedAbility(ability, card, location) {
        // Le abilità attivate devono essere registrate per poter essere usate dal giocatore
        const cardId = this.getCardId(card, location);
        
        if (!this.activatedAbilities.has(cardId)) {
            this.activatedAbilities.set(cardId, []);
        }
        
        this.activatedAbilities.get(cardId).push({
            ability,
            card,
            location,
            used: false // Per abilità che possono essere usate solo una volta per turno
        });
        
        console.log(`[AbilitiesV2] Abilità attivata registrata: ${ability.name}`);
    }
    
    // Registra un'aura
    registerAura(ability, card, location) {
        this.activeAuras.push({
            ability,
            card,
            location,
            id: this.getCardId(card, location)
        });
    }
    
    // Ricalcola tutte le aure
    recalculateAuras() {
        // Prima rimuovi tutti gli effetti delle aure
        this.clearAuraEffects();
        
        // Poi riapplica tutte le aure attive
        this.activeAuras.forEach(aura => {
            if (this.isCardStillInPlay(aura.location)) {
                this.resolveEffects(aura.ability.effects, aura.card, aura.location);
            }
        });
        
        // Aggiorna tutte le carte visivamente
        this.engine.ui.updateGameField();
    }
    
    // Verifica se una carta è ancora in gioco
    isCardStillInPlay(location) {
        const zone = this.engine.state.getZone(location.playerId, location.zone);
        return zone && zone[location.position] !== null;
    }
    
    // Verifica se una creatura è affetta da un'aura
    isAffectedByAura(creature, aura) {
        const effects = aura.ability.effects || [];
        
        for (let effect of effects) {
            const targets = this.getTargets(effect.target, aura.location, effect.filter);
            if (targets.some(t => this.isSameCreature(t, creature))) {
                return true;
            }
        }
        
        return false;
    }
    
    // Verifica se due riferimenti puntano alla stessa creatura
    isSameCreature(a, b) {
        return a.playerId === b.playerId && 
               a.zone === b.zone && 
               a.position === b.position;
    }
    
    // Rimuovi effetti delle aure
    clearAuraEffects() {
        // Implementazione semplificata - in un sistema completo
        // dovremmo tracciare quali modificatori vengono dalle aure
        // Per ora facciamo un refresh completo
    }
    
    // Genera un ID univoco per una carta
    getCardId(card, location) {
        return `${location.playerId}-${location.zone}-${location.position}`;
    }
    
    // Gestisce l'inizio del turno
    onTurnStart(playerId) {
        // Reset contatori abilità "una volta per turno"
        this.abilityUsage.clear();
        
        // Attiva abilità triggered "start_of_turn"
        const allCards = this.getAllCardsInPlay();
        
        allCards.forEach(({ card, location }) => {
            if (location.playerId === playerId && card.abilities) {
                card.abilities.forEach(ability => {
                    if (ability.type === 'triggered' && ability.trigger === 'start_of_turn') {
                        this.resolveEffects(ability.effects, card, location);
                    }
                });
            }
        });
    }
    
    // Gestisce la fine del turno
    onTurnEnd(playerId) {
        // Rimuovi effetti temporanei
        this.temporaryEffects = this.temporaryEffects.filter(effect => {
            if (effect.type === 'modifier') {
                const modifiers = this.activeModifiers.get(effect.targetId);
                if (modifiers) {
                    const index = modifiers.indexOf(effect.modifier);
                    if (index > -1) {
                        modifiers.splice(index, 1);
                    }
                }
            }
            return false;
        });
        
        // Aggiorna visuali
        this.engine.ui.updateGameField();
    }
    
    // Ottieni tutte le carte in gioco
    getAllCardsInPlay() {
        const cards = [];
        
        [1, 2].forEach(playerId => {
            const player = this.engine.state.getPlayer(playerId);
            
            if (!player) return;
            
            // Creature in prima linea
            if (player.firstLine) {
                player.firstLine.forEach((creature, position) => {
                    if (creature) {
                        cards.push({
                            card: creature.card || creature,
                            location: { playerId, zone: 'firstLine', position }
                        });
                    }
                });
            }
            
            // Creature in seconda linea
            if (player.secondLine) {
                player.secondLine.forEach((creature, position) => {
                    if (creature) {
                        cards.push({
                            card: creature.card || creature,
                            location: { playerId, zone: 'secondLine', position }
                        });
                    }
                });
            }
            
            // Strutture
            if (player.structures) {
                player.structures.forEach((structure, position) => {
                    if (structure) {
                        cards.push({
                            card: structure,
                            location: { playerId, zone: 'structures', position }
                        });
                    }
                });
            }
        });
        
        return cards;
    }
    
    // Equipaggia una creatura
    equipCreature(equipment, targetCreature) {
        const creatureId = this.getCardId(targetCreature.card, targetCreature);
        
        if (!this.equipments.has(creatureId)) {
            this.equipments.set(creatureId, []);
        }
        
        this.equipments.get(creatureId).push(equipment);
        
        // Processa le abilità dell'equipaggiamento
        if (equipment.abilities) {
            equipment.abilities.forEach(ability => {
                this.processAbility(ability, equipment, targetCreature);
            });
        }
        
        // Aggiorna visivamente
        this.updateCardVisuals(targetCreature);
        
        return true;
    }
    
    // Rimuovi una carta dal gioco
    onCardRemoved(card, location) {
        const cardId = this.getCardId(card, location);
        
        // Rimuovi modificatori
        this.activeModifiers.delete(cardId);
        
        // Rimuovi aure
        this.activeAuras = this.activeAuras.filter(aura => aura.id !== cardId);
        
        // Rimuovi equipaggiamenti
        this.equipments.delete(cardId);
        
        // Ricalcola aure
        this.recalculateAuras();
    }
}

// Esporta per uso globale
window.AbilitiesSystemV2 = AbilitiesSystemV2;