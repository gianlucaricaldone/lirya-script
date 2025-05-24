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
        
        // Abilità attivabili
        this.activatedAbilities = new Map();
        
        // Contatori per abilità con limiti di utilizzo
        this.abilityUsageCounters = new Map();
    }
    
    // Registra una carta con le sue abilità
    registerCard(card, location) {
        if (!card.abilities || card.abilities.length === 0) return;
        
        card.abilities.forEach(ability => {
            const abilityType = this.categorizeAbility(ability);
            
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
            }
        });
    }
    
    // Rimuovi le abilità di una carta
    unregisterCard(card, location) {
        // Rimuovi dalle abilità passive
        this.passiveAbilities = this.passiveAbilities.filter(
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
    }
    
    // Categorizza il tipo di abilità basandosi sul testo
    categorizeAbility(ability) {
        const effect = ability.effect.toLowerCase();
        
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
        if (ability.effect.includes('una volta per turno')) {
            if (!this.abilityUsageCounters.has(cardKey)) {
                this.abilityUsageCounters.set(cardKey, new Map());
            }
            this.abilityUsageCounters.get(cardKey).set(ability.name, 0);
        }
    }
    
    // Applica effetti passivi
    applyPassiveEffect(card, ability, location) {
        const effect = ability.effect.toLowerCase();
        
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
        
        console.log(`Abilità passiva applicata: ${ability.name} su ${card.name}`);
    }
    
    // Esegue un'abilità innescata
    executeTriggeredAbility(card, ability, location, context) {
        const effect = ability.effect;
        console.log(`Eseguendo abilità innescata: ${ability.name} di ${card.name}`);
        
        // Danno diretto quando entra in gioco
        if (effect.includes('infligge') && effect.includes('danno')) {
            const damageMatch = effect.match(/infligge (\d+) dann/);
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
        if (effect.includes('guarda la prima carta')) {
            const topCard = this.engine.state.getPlayer(location.playerId).deck[0];
            if (topCard) {
                // Mostra preview della carta (per ora solo log)
                console.log(`Carta in cima al mazzo: ${topCard.name}`);
                
                if (effect.includes('puoi metterla in fondo')) {
                        // Per ora mettiamo sempre in fondo (da implementare UI per scelta)
                    console.log(`Puoi mettere ${topCard.name} in fondo al mazzo`);
                }
            }
        }
        
        // Bonus temporanei
        if (effect.includes('guadagna') && effect.includes('fino alla fine del turno')) {
            const bonusMatch = effect.match(/guadagna \+(\d+) (ATT|DIF)/);
            if (bonusMatch) {
                const amount = parseInt(bonusMatch[1]);
                const stat = bonusMatch[2] === 'ATT' ? 'attack' : 'defense';
                
                this.applyTemporaryBonus(card, stat, amount);
            }
        }
        
        // Pesca carte
        if (effect.includes('pesca una carta')) {
            this.engine.state.drawCards(location.playerId, 1);
            console.log(`${card.name} fa pescare una carta`);
        }
        
        // Spostamento personaggi
        if (effect.includes('spostare un personaggio')) {
            // Per ora non implementato
            console.log(`${card.name} può spostare un personaggio alleato`);
        }
        
        // Debuff attaccante
        if (effect.includes('attaccante perde')) {
            const debuffMatch = effect.match(/perde (\d+) (ATT|DIF)/);
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
        
        // Verifica limiti di utilizzo
        if (ability.effect.includes('una volta per turno')) {
            const cardKey = this.getCardKey(card, location);
            const usage = this.abilityUsageCounters.get(cardKey)?.get(ability.name) || 0;
            if (usage >= 1) {
                return false;
            }
        }
        
        // Verifica costi
        const costMatch = ability.effect.match(/paga (\d+) energia/);
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
        
        // Paga i costi
        const costMatch = ability.effect.match(/paga (\d+) energia/);
        if (costMatch) {
            const cost = parseInt(costMatch[1]);
            this.engine.state.getPlayer(location.playerId).energy -= cost;
        }
        
        // Incrementa il contatore di utilizzo
        if (ability.effect.includes('una volta per turno')) {
            const cardKey = this.getCardKey(card, location);
            const current = this.abilityUsageCounters.get(cardKey).get(ability.name) || 0;
            this.abilityUsageCounters.get(cardKey).set(ability.name, current + 1);
        }
        
        // Esegui l'effetto
        this.executeTriggeredAbility(card, ability, location, {});
    }
    
    // Attiva trigger per un evento
    triggerEvent(eventType, context = {}) {
        if (!this.triggers[eventType]) return;
        
        const triggers = [...this.triggers[eventType]];
        triggers.forEach(trigger => {
            // Verifica se il trigger è applicabile al contesto
            if (this.isTriggerApplicable(trigger, context)) {
                try {
                    trigger.execute(context);
                } catch (error) {
                    console.error(`Errore nell'esecuzione del trigger ${eventType}:`, error);
                }
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
    }
    
    // Calcola bonus condizionali
    calculateConditionalBonuses(card, location) {
        if (!card.conditionalBonuses) return { attack: 0, defense: 0 };
        
        let bonuses = { attack: 0, defense: 0 };
        
        card.conditionalBonuses.forEach(ability => {
            const effect = ability.effect.toLowerCase();
            
            // Bonus se l'avversario ha più carte
            if (effect.includes('avversario ha più carte in mano')) {
                const myHand = this.engine.state.getPlayer(location.playerId).hand.length;
                const oppHand = this.engine.state.getPlayer(3 - location.playerId).hand.length;
                
                if (oppHand > myHand) {
                    const bonusMatch = effect.match(/guadagna \+(\d+) ATT/);
                    if (bonusMatch) {
                        bonuses.attack += parseInt(bonusMatch[1]);
                    }
                }
            }
            
            // Bonus per strutture nemiche (Kaira)
            if (effect.includes('per ogni struttura nemica')) {
                const enemyStructures = this.engine.state.getPlayer(3 - location.playerId).structures.filter(s => s).length;
                const bonusMatch = effect.match(/\+(\d+) dann/);
                if (bonusMatch) {
                    bonuses.attack += parseInt(bonusMatch[1]) * enemyStructures;
                }
            }
            
            // Bonus se più personaggi in seconda linea (Thorne)
            if (effect.includes('più personaggi in seconda linea')) {
                const mySecondLine = this.engine.state.getPlayer(location.playerId).secondLine.filter(c => c).length;
                const oppSecondLine = this.engine.state.getPlayer(3 - location.playerId).secondLine.filter(c => c).length;
                
                if (mySecondLine > oppSecondLine) {
                    const bonusMatch = effect.match(/guadagna \+(\d+) ATT/);
                    if (bonusMatch) {
                        bonuses.attack += parseInt(bonusMatch[1]);
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