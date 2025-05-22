// js/game/combat.js - Sistema di combattimento

class CombatSystem {
    constructor() {
        this.combatQueue = [];
        this.combatEvents = [];
    }

    // === SISTEMA DI COMBATTIMENTO PRINCIPALE ===

    initiateCombat(attackerId, defenderId = null) {
        const attacker = this.findCreatureById(attackerId);
        if (!attacker) {
            console.error('Attaccante non trovato:', attackerId);
            return false;
        }

        const attackerPlayer = this.getPlayerByCreature(attacker);
        const defenderPlayer = attackerPlayer === 1 ? 2 : 1;
        const defender = defenderId ? this.findCreatureById(defenderId) : this.selectDefender(defenderPlayer);

        if (defender) {
            return this.resolveCombat(attacker, defender);
        } else {
            return this.directAttack(attacker, defenderPlayer);
        }
    }

    resolveCombat(attacker, defender) {
        const combatResult = {
            attacker: attacker,
            defender: defender,
            attackerDamage: 0,
            defenderDamage: 0,
            attackerSurvived: true,
            defenderSurvived: true,
            events: []
        };

        // Pre-combattimento: abilità che si attivano prima del combattimento
        this.triggerPreCombatAbilities(attacker, defender, combatResult);

        // Calcola danni
        const attackerDamage = this.calculateDamage(attacker, defender);
        const defenderDamage = this.calculateDamage(defender, attacker);

        combatResult.attackerDamage = defenderDamage;
        combatResult.defenderDamage = attackerDamage;

        // Log dell'attacco
        gameLogic.emit('logMessage', 
            `⚔️ ${attacker.name} (${attacker.att}/${attacker.def}) attacca ${defender.name} (${defender.att}/${defender.def})`
        );

        // Applica danni
        this.applyDamage(defender, attackerDamage, combatResult);
        
        // Contrattacco se il difensore sopravvive
        if (defender.currentHp > 0 && !this.hasAbility(defender, 'NoCounterattack')) {
            this.applyDamage(attacker, defenderDamage, combatResult);
        }

        // Post-combattimento: abilità che si attivano dopo il combattimento
        this.triggerPostCombatAbilities(attacker, defender, combatResult);

        // Controlla se le creature sopravvivono
        combatResult.attackerSurvived = attacker.currentHp > 0;
        combatResult.defenderSurvived = defender.currentHp > 0;

        // Distruggi creature morte
        if (!combatResult.attackerSurvived) {
            this.destroyCreature(attacker);
        }
        if (!combatResult.defenderSurvived) {
            this.destroyCreature(defender);
        }

        return combatResult;
    }

    directAttack(attacker, targetPlayerId) {
        const damage = this.calculateDirectDamage(attacker);
        const targetPlayer = gameState.players[targetPlayerId];

        gameLogic.emit('logMessage', 
            `⚔️ ${attacker.name} attacca direttamente per ${damage} danni`
        );

        // Applica danni al giocatore
        targetPlayer.health -= damage;

        // Trigger abilità di attacco diretto
        this.triggerDirectAttackAbilities(attacker, targetPlayerId, damage);

        return {
            attacker: attacker,
            targetPlayer: targetPlayerId,
            damage: damage,
            directAttack: true
        };
    }

    // === CALCOLO DANNI ===

    calculateDamage(attacker, defender) {
        let baseDamage = attacker.att || 0;
        
        // Modifica danni per abilità speciali
        baseDamage = this.applyAttackModifiers(attacker, defender, baseDamage);

        // Applica difesa
        const defense = defender.def || 0;
        const finalDamage = Math.max(0, baseDamage - defense);

        return finalDamage;
    }

    calculateDirectDamage(attacker) {
        let damage = attacker.att || 0;
        
        // Modifica per abilità di attacco diretto
        damage = this.applyDirectAttackModifiers(attacker, damage);

        return Math.max(1, damage);
    }

    applyAttackModifiers(attacker, defender, baseDamage) {
        let modifiedDamage = baseDamage;

        // Abilità elementali
        if (attacker.element && defender.element) {
            const elementalBonus = this.getElementalBonus(attacker.element, defender.element);
            modifiedDamage += elementalBonus;
        }

        // Abilità speciali dell'attaccante
        if (this.hasAbility(attacker, 'Piercing')) {
            // Ignora difesa
            modifiedDamage = baseDamage;
        }

        if (this.hasAbility(attacker, 'DoubleDamage')) {
            modifiedDamage *= 2;
        }

        if (this.hasAbility(attacker, 'BonusVsClass')) {
            const targetClass = this.getAbilityTarget(attacker, 'BonusVsClass');
            if (defender.class === targetClass) {
                modifiedDamage += 2;
            }
        }

        // Equipaggiamenti
        if (attacker.equipment) {
            attacker.equipment.forEach(eq => {
                if (eq.combatBonus) {
                    modifiedDamage += eq.combatBonus;
                }
            });
        }

        return modifiedDamage;
    }

    applyDirectAttackModifiers(attacker, baseDamage) {
        let modifiedDamage = baseDamage;

        // Abilità di attacco diretto
        if (this.hasAbility(attacker, 'DirectAttackBonus')) {
            modifiedDamage += 2;
        }

        return modifiedDamage;
    }

    // === APPLICAZIONE DANNI ===

    applyDamage(target, damage, combatResult = null) {
        if (damage <= 0) return;

        const previousHp = target.currentHp;
        target.currentHp -= damage;

        if (combatResult) {
            combatResult.events.push({
                type: 'damage',
                target: target.name,
                amount: damage,
                newHp: target.currentHp
            });
        }

        // Trigger abilità quando subisce danni
        this.triggerOnDamageAbilities(target, damage);

        gameLogic.emit('logMessage', 
            `💥 ${target.name} subisce ${damage} danni (${previousHp} → ${target.currentHp})`
        );

        // Controllo morte
        if (target.currentHp <= 0) {
            this.triggerOnDeathAbilities(target);
        }
    }

    destroyCreature(creature) {
        gameLogic.destroyCard(creature);
    }

    // === SELEZIONE DIFENSORI ===

    selectDefender(defendingPlayerId) {
        const defendingPlayer = gameState.players[defendingPlayerId];
        
        // Priorità: prima linea, poi seconda linea
        if (defendingPlayer.frontLine.length > 0) {
            return this.selectBestDefender(defendingPlayer.frontLine);
        }
        
        if (defendingPlayer.backLine.length > 0) {
            return this.selectBestDefender(defendingPlayer.backLine);
        }

        return null; // Nessun difensore, attacco diretto
    }

    selectBestDefender(defenders) {
        // Strategia semplice: scegli il primo difensore
        // Puoi implementare logiche più complesse qui
        return defenders[0];
    }

    // === ABILITÀ SPECIALI ===

    triggerPreCombatAbilities(attacker, defender, combatResult) {
        // Abilità che si attivano prima del combattimento
        
        if (this.hasAbility(attacker, 'FirstStrike')) {
            combatResult.events.push({
                type: 'ability',
                creature: attacker.name,
                ability: 'Primo Colpo'
            });
            // Implementa logica primo colpo
        }

        if (this.hasAbility(defender, 'Thorns')) {
            const thornsDamage = 1;
            this.applyDamage(attacker, thornsDamage, combatResult);
            combatResult.events.push({
                type: 'ability',
                creature: defender.name,
                ability: 'Spine',
                damage: thornsDamage
            });
        }
    }

    triggerPostCombatAbilities(attacker, defender, combatResult) {
        // Abilità che si attivano dopo il combattimento
        
        if (this.hasAbility(attacker, 'Lifesteal') && combatResult.defenderDamage > 0) {
            const healing = Math.min(combatResult.defenderDamage, attacker.hp - attacker.currentHp);
            attacker.currentHp += healing;
            combatResult.events.push({
                type: 'ability',
                creature: attacker.name,
                ability: 'Rubavita',
                healing: healing
            });
        }

        if (this.hasAbility(attacker, 'GrowthOnKill') && !combatResult.defenderSurvived) {
            attacker.att += 1;
            attacker.hp += 1;
            attacker.currentHp += 1;
            combatResult.events.push({
                type: 'ability',
                creature: attacker.name,
                ability: 'Crescita',
                bonus: '+1/+1'
            });
        }
    }

    triggerOnDamageAbilities(creature, damage) {
        if (this.hasAbility(creature, 'Enrage')) {
            creature.att += 1;
            gameLogic.emit('logMessage', 
                `🔥 ${creature.name} si infuria e guadagna +1 ATT`
            );
        }

        if (this.hasAbility(creature, 'DefensivePosture') && damage > 0) {
            creature.def += 1;
            gameLogic.emit('logMessage', 
                `🛡️ ${creature.name} assume posizione difensiva e guadagna +1 DIF`
            );
        }
    }

    triggerOnDeathAbilities(creature) {
        if (this.hasAbility(creature, 'DeathRattle')) {
            const effect = this.getAbilityEffect(creature, 'DeathRattle');
            this.executeDeathRattleEffect(creature, effect);
        }

        if (this.hasAbility(creature, 'Revenge')) {
            // Infliggi danni a tutte le creature nemiche
            const enemyPlayerId = this.getPlayerByCreature(creature) === 1 ? 2 : 1;
            const enemyCreatures = [
                ...gameState.players[enemyPlayerId].frontLine,
                ...gameState.players[enemyPlayerId].backLine
            ];
            
            enemyCreatures.forEach(enemy => {
                this.applyDamage(enemy, 1);
            });
            
            gameLogic.emit('logMessage', 
                `💀 ${creature.name} si vendica infliggendo 1 danno a tutti i nemici`
            );
        }
    }

    triggerDirectAttackAbilities(attacker, targetPlayerId, damage) {
        if (this.hasAbility(attacker, 'DrainLife')) {
            const healing = Math.min(damage, attacker.hp - attacker.currentHp);
            attacker.currentHp += healing;
            gameLogic.emit('logMessage', 
                `💚 ${attacker.name} drena ${healing} PV`
            );
        }
    }

    executeDeathRattleEffect(creature, effect) {
        // Implementa diversi effetti death rattle
        switch (effect.type) {
            case 'damage':
                const targets = this.getDeathRattleTargets(creature, effect.target);
                targets.forEach(target => {
                    this.applyDamage(target, effect.amount);
                });
                break;
                
            case 'summon':
                this.summonCreature(creature, effect.summon);
                break;
                
            case 'draw':
                const owner = this.getPlayerByCreature(creature);
                for (let i = 0; i < effect.amount; i++) {
                    gameLogic.drawCard(owner);
                }
                break;
        }
    }

    // === BONUS ELEMENTALI ===

    getElementalBonus(attackerElement, defenderElement) {
        // Sistema semplificato senza vantaggi/svantaggi fissi
        // Gli elementi forniscono bonus tematici invece che rock-paper-scissors
        return 0;
    }

    // === UTILITY ===

    hasAbility(creature, abilityName) {
        if (!creature.abilities) return false;
        return creature.abilities.some(ability => ability.name === abilityName);
    }

    getAbilityEffect(creature, abilityName) {
        if (!creature.abilities) return null;
        const ability = creature.abilities.find(ability => ability.name === abilityName);
        return ability ? ability.effect : null;
    }

    getAbilityTarget(creature, abilityName) {
        if (!creature.abilities) return null;
        const ability = creature.abilities.find(ability => ability.name === abilityName);
        return ability ? ability.target : null;
    }

    findCreatureById(creatureId) {
        for (let playerId of [1, 2]) {
            const player = gameState.players[playerId];
            const allCreatures = [...player.frontLine, ...player.backLine];
            
            const found = allCreatures.find(creature => creature.id === creatureId);
            if (found) return found;
        }
        return null;
    }

    getPlayerByCreature(creature) {
        for (let playerId of [1, 2]) {
            const player = gameState.players[playerId];
            const allCreatures = [...player.frontLine, ...player.backLine, ...player.structures];
            
            if (allCreatures.some(c => c.id === creature.id)) {
                return playerId;
            }
        }
        return null;
    }

    getDeathRattleTargets(creature, targetType) {
        const ownerPlayerId = this.getPlayerByCreature(creature);
        const enemyPlayerId = ownerPlayerId === 1 ? 2 : 1;
        
        switch (targetType) {
            case 'allEnemies':
                return [
                    ...gameState.players[enemyPlayerId].frontLine,
                    ...gameState.players[enemyPlayerId].backLine
                ];
            case 'randomEnemy':
                const enemies = [
                    ...gameState.players[enemyPlayerId].frontLine,
                    ...gameState.players[enemyPlayerId].backLine
                ];
                return enemies.length > 0 ? [enemies[Math.floor(Math.random() * enemies.length)]] : [];
            case 'allAllies':
                return [
                    ...gameState.players[ownerPlayerId].frontLine,
                    ...gameState.players[ownerPlayerId].backLine
                ];
            default:
                return [];
        }
    }

    summonCreature(sourceCreature, summonData) {
        const ownerPlayerId = this.getPlayerByCreature(sourceCreature);
        const player = gameState.players[ownerPlayerId];
        
        // Crea la creatura evocata
        const summonedCreature = {
            id: Date.now() + Math.random(),
            name: summonData.name,
            type: 'Personaggio',
            att: summonData.att,
            def: summonData.def,
            hp: summonData.hp,
            currentHp: summonData.hp,
            element: summonData.element || sourceCreature.element,
            class: summonData.class || 'Token'
        };

        // Trova spazio per evocare
        const targetZone = summonData.zone === 'front' ? player.frontLine : player.backLine;
        if (targetZone.length < 4) {
            targetZone.push(summonedCreature);
            gameLogic.emit('logMessage', 
                `✨ ${sourceCreature.name} evoca ${summonedCreature.name}`
            );
        }
    }

    // === COMBATTIMENTO MULTIPLO ===

    resolveMultipleCombats(combats) {
        const results = [];
        
        combats.forEach(combat => {
            const result = this.resolveCombat(combat.attacker, combat.defender);
            results.push(result);
        });

        return results;
    }

    // === DEBUG E STATISTICHE ===

    getCombatStats() {
        return {
            totalCombats: this.combatEvents.length,
            averageDamage: this.calculateAverageDamage(),
            survivalRate: this.calculateSurvivalRate()
        };
    }

    calculateAverageDamage() {
        if (this.combatEvents.length === 0) return 0;
        
        const totalDamage = this.combatEvents.reduce((sum, combat) => 
            sum + combat.attackerDamage + combat.defenderDamage, 0
        );
        
        return totalDamage / (this.combatEvents.length * 2);
    }

    calculateSurvivalRate() {
        if (this.combatEvents.length === 0) return 0;
        
        const survivors = this.combatEvents.reduce((sum, combat) => 
            sum + (combat.attackerSurvived ? 1 : 0) + (combat.defenderSurvived ? 1 : 0), 0
        );
        
        return survivors / (this.combatEvents.length * 2);
    }
}

// Istanza globale del sistema di combattimento
const combatSystem = new CombatSystem();

// Esporta per l'uso in altri file
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CombatSystem, combatSystem };
}