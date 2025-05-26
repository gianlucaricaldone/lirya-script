// game-rules.js - Implementazione delle regole di gioco
class GameRules {
    constructor(engine) {
        this.engine = engine;
    }

    // Verifica se può pagare il costo di una carta
    canPayCost(playerId, card) {
        const player = this.engine.state.getPlayer(playerId);
        return player.energy >= card.cost;
    }

    // Determina la zona per un personaggio basandosi sulla classe
    getCharacterZone(card) {
        if (card.class === 'Guerriero') {
            return 'firstLine';
        } else if (['Mago', 'Ranger', 'Chierico'].includes(card.class)) {
            return 'secondLine';
        }
        // Default per personaggi senza classe specifica
        return 'firstLine';
    }

    // Ottieni bersagli validi per un incantesimo
    getSpellTargets(spell) {
        const targets = {
            needsTarget: false,
            validTargets: []
        };

        // Prima controlla se l'incantesimo ha abilities nel nuovo formato
        if (spell.abilities && spell.abilities.length > 0) {
            for (const ability of spell.abilities) {
                if (ability.effects && ability.effects.length > 0) {
                    for (const effect of ability.effects) {
                        if (effect.target && effect.target.includes('target_')) {
                            targets.needsTarget = true;
                            
                            switch (effect.target) {
                                case 'target_creature':
                                    // Qualsiasi creatura
                                    targets.validTargets = this.engine.state.getAllCreatures();
                                    break;
                                case 'target_enemy_creature':
                                    // Solo creature nemiche
                                    const opponent = this.engine.state.currentPlayer === 1 ? 2 : 1;
                                    targets.validTargets = this.engine.state.getAllCreatures(opponent);
                                    break;
                                case 'target_friendly_creature':
                                    // Solo proprie creature
                                    targets.validTargets = this.engine.state.getAllCreatures(this.engine.state.currentPlayer);
                                    break;
                                case 'target_player':
                                    // Qualsiasi giocatore
                                    targets.validTargets = [
                                        { type: 'player', playerId: 1 },
                                        { type: 'player', playerId: 2 }
                                    ];
                                    break;
                            }
                            
                            if (targets.validTargets.length > 0) {
                                return targets;
                            }
                        }
                    }
                }
            }
        }

        // Fallback: analizza la descrizione dell'incantesimo per compatibilità
        const desc = (spell.description || '').toLowerCase();
        
        if (desc.includes('bersaglio') || desc.includes('nemico') || desc.includes('avversario')) {
            targets.needsTarget = true;
            
            if (desc.includes('personaggio') || desc.includes('creatura')) {
                // Bersaglia personaggi
                if (desc.includes('nemico') || desc.includes('avversario')) {
                    // Solo personaggi nemici
                    const opponent = this.engine.state.currentPlayer === 1 ? 2 : 1;
                    targets.validTargets = this.engine.state.getAllCreatures(opponent);
                } else if (desc.includes('alleato') || desc.includes('tuo')) {
                    // Solo propri personaggi
                    targets.validTargets = this.engine.state.getAllCreatures(this.engine.state.currentPlayer);
                } else {
                    // Qualsiasi personaggio
                    targets.validTargets = this.engine.state.getAllCreatures();
                }
            } else if (desc.includes('struttura')) {
                // Bersaglia strutture
                targets.validTargets = this.getAllStructures();
            } else if (desc.includes('giocatore')) {
                // Bersaglia giocatori
                targets.validTargets = [
                    { type: 'player', playerId: 1 },
                    { type: 'player', playerId: 2 }
                ];
            }
        }

        return targets;
    }

    // Risolvi l'effetto di un incantesimo
    resolveSpellEffect(spell, target) {
        console.log('[GameRules] resolveSpellEffect chiamato:', { spell, target });
        
        // Prima controlla se l'incantesimo ha abilities nel nuovo formato
        if (spell.abilities && spell.abilities.length > 0) {
            console.log('[GameRules] Incantesimo ha abilities:', spell.abilities);
            spell.abilities.forEach(ability => {
                if (ability.effects && ability.effects.length > 0) {
                    console.log('[GameRules] Applicando effetti:', ability.effects);
                    ability.effects.forEach(effect => {
                        this.applySpellEffect(effect, spell, target);
                    });
                }
            });
            return;
        }
        
        // Fallback: parsing del testo descrittivo per compatibilità
        const desc = spell.description.toLowerCase();
        
        // Danno diretto
        if (desc.includes('infligge') && desc.includes('dann')) {
            const damageMatch = desc.match(/infligge (\d+) dann/);
            if (damageMatch) {
                const damage = parseInt(damageMatch[1]);
                
                if (target && target.type === 'player') {
                    this.engine.state.dealDamage(target.playerId, damage);
                } else if (target && target.card) {
                    this.damageCreature(target, damage);
                }
            }
        }
        
        // Guarigione
        if (desc.includes('cura') || desc.includes('rigenera')) {
            const healMatch = desc.match(/cura (\d+)|rigenera (\d+)/);
            if (healMatch) {
                const heal = parseInt(healMatch[1] || healMatch[2]);
                
                if (target && target.type === 'player') {
                    this.engine.state.healPlayer(target.playerId, heal);
                } else if (target && target.card) {
                    this.healCreature(target, heal);
                }
            }
        }
        
        // Pesca carte
        if (desc.includes('pesca') && desc.includes('cart')) {
            const drawMatch = desc.match(/pesca (\d+) cart/);
            if (drawMatch) {
                const cards = parseInt(drawMatch[1]);
                this.engine.state.drawCards(this.engine.state.currentPlayer, cards);
            }
        }
        
        // Distruzione
        if (desc.includes('distruggi')) {
            if (target && target.card) {
                this.destroyCard(target);
            }
        }
    }
    
    // Danneggia una creatura
    damageCreature(target, damage) {
        console.log('[GameRules] damageCreature:', { target, damage });
        
        if (!target || !target.card) {
            console.error('[GameRules] Target non valido per damageCreature');
            return;
        }
        
        const card = target.card;
        
        // Inizializza currentHealth se non esiste
        if (card.currentHealth === undefined) {
            card.currentHealth = card.stats?.health || card.health || 
                              card.stats?.defense || card.defense || 1;
        }
        
        // Applica il danno
        card.currentHealth -= damage;
        console.log(`[GameRules] ${card.name} subisce ${damage} danni. Salute: ${card.currentHealth}`);
        
        // Controlla se la creatura muore
        if (card.currentHealth <= 0) {
            console.log(`[GameRules] ${card.name} è stata distrutta!`);
            this.engine.destroyCreature(target);
        }
        
        // Trigger eventi di danno
        if (this.engine.abilities) {
            this.engine.abilities.triggerEvent('onDamage', {
                target: target,
                damage: damage,
                source: this.engine.state.currentPlayer
            });
        }
    }
    
    // Cura una creatura
    healCreature(target, amount) {
        console.log('[GameRules] healCreature:', { target, amount });
        
        if (!target || !target.card) {
            console.error('[GameRules] Target non valido per healCreature');
            return;
        }
        
        const card = target.card;
        const maxHealth = card.stats?.health || card.health || 
                         card.stats?.defense || card.defense || 1;
        
        // Inizializza currentHealth se non esiste
        if (card.currentHealth === undefined) {
            card.currentHealth = maxHealth;
        }
        
        // Applica la cura
        card.currentHealth = Math.min(card.currentHealth + amount, maxHealth);
        console.log(`[GameRules] ${card.name} viene curata di ${amount}. Salute: ${card.currentHealth}/${maxHealth}`);
    }
    
    // Applica un singolo effetto di un incantesimo
    applySpellEffect(effect, spell, target) {
        console.log('[GameRules] applySpellEffect:', { effect, target });
        
        switch (effect.type) {
            case 'damage':
                const damage = effect.value || 0;
                console.log('[GameRules] Applicando danno:', damage, 'a', effect.target);
                
                if (effect.target === 'target_creature' && target && target.card) {
                    console.log('[GameRules] Danneggiando creatura:', target);
                    this.damageCreature(target, damage);
                } else if (effect.target === 'target_player' && target && target.type === 'player') {
                    console.log('[GameRules] Danneggiando giocatore:', target.playerId);
                    this.engine.state.dealDamage(target.playerId, damage);
                } else if (effect.target === 'all_enemy_creatures') {
                    const opponent = this.engine.state.currentPlayer === 1 ? 2 : 1;
                    const enemyCreatures = this.engine.state.getAllCreatures(opponent);
                    console.log('[GameRules] Danneggiando tutte le creature nemiche:', enemyCreatures.length);
                    enemyCreatures.forEach(creature => {
                        this.damageCreature(creature, damage);
                    });
                }
                break;
                
            case 'heal':
                const healing = effect.value || 0;
                if (effect.target === 'target_creature' && target && target.card) {
                    this.healCreature(target, healing);
                } else if (effect.target === 'target_player' && target && target.type === 'player') {
                    this.engine.state.healPlayer(target.playerId, healing);
                }
                break;
                
            case 'draw':
                const cards = effect.value || 1;
                const drawPlayer = effect.target === 'self' ? this.engine.state.currentPlayer : target?.playerId;
                if (drawPlayer) {
                    this.engine.state.drawCards(drawPlayer, cards);
                }
                break;
                
            case 'destroy':
                if (target && target.card) {
                    this.destroyCard(target);
                }
                break;
                
            case 'stat_modifier':
                if (target && target.card) {
                    if (effect.stat === 'attack' && effect.value) {
                        target.card.attack = (target.card.attack || 0) + effect.value;
                    }
                    if (effect.stat === 'defense' && effect.value) {
                        target.card.defense = (target.card.defense || 0) + effect.value;
                        target.card.currentHealth = (target.card.currentHealth || 0) + effect.value;
                    }
                }
                break;
        }
    }

    // Applica equipaggiamento a una creatura
    applyEquipment(equipment, target) {
        console.log('[GameRules] applyEquipment chiamato:', { equipment, target });
        console.log('[GameRules] Target structure:', {
            hasCard: !!target.card,
            cardType: target.card?.type,
            targetKeys: Object.keys(target)
        });
        
        if (!target.card || target.card.type !== 'Personaggio') {
            console.error('[GameRules] Target non valido per equipaggiamento', {
                hasCard: !!target.card,
                cardType: target.card?.type
            });
            return;
        }
        
        // La carta target è già nel formato corretto
        const targetCard = target.card;
        
        // Inizializza i valori base se non esistono
        if (targetCard.attack === undefined && targetCard.stats?.attack !== undefined) {
            targetCard.attack = targetCard.stats.attack;
        }
        if (targetCard.defense === undefined && targetCard.stats?.defense !== undefined) {
            targetCard.defense = targetCard.stats.defense;
        }
        
        console.log(`[GameRules] Equipaggiando ${targetCard.name} con ${equipment.name}`);
        
        // Registra l'equipaggiamento sulla creatura
        if (!targetCard.equipment) {
            targetCard.equipment = [];
        }
        targetCard.equipment.push(equipment);
        
        // Analizza le abilità dell'equipaggiamento per applicare i bonus
        if (equipment.abilities && equipment.abilities.length > 0) {
            console.log('[GameRules] Equipaggiamento ha abilità:', equipment.abilities);
            
            equipment.abilities.forEach(ability => {
                // Prima prova con gli effetti strutturati
                if (ability.effects && ability.effects.length > 0) {
                    console.log('[GameRules] Applicando effetti:', ability.effects);
                    
                    ability.effects.forEach(effect => {
                        if (effect.type === 'stat_modifier') {
                            if (effect.stat === 'attack' && effect.value) {
                                const oldAttack = targetCard.attack || 0;
                                targetCard.attack = oldAttack + effect.value;
                                console.log(`[GameRules] Attacco di ${targetCard.name}: ${oldAttack} -> ${targetCard.attack}`);
                            }
                            if (effect.stat === 'defense' && effect.value) {
                                const oldDefense = targetCard.defense || 0;
                                targetCard.defense = oldDefense + effect.value;
                                
                                // Aggiorna anche currentHealth se aumenta la difesa
                                if (targetCard.currentHealth !== undefined) {
                                    targetCard.currentHealth += effect.value;
                                }
                                console.log(`[GameRules] Difesa di ${targetCard.name}: ${oldDefense} -> ${targetCard.defense}`);
                            }
                        }
                    });
                } else if (ability.description) {
                    // Fallback: parsing della descrizione per compatibilità
                    const desc = ability.description.toLowerCase();
                    
                    // Cerca bonus ATT
                    const attMatch = desc.match(/\+(\d+)\s*att/i);
                    if (attMatch) {
                        const bonus = parseInt(attMatch[1]);
                        const oldAttack = targetCard.attack || 0;
                        targetCard.attack = oldAttack + bonus;
                        console.log(`[GameRules] Attacco (da descrizione) di ${targetCard.name}: ${oldAttack} -> ${targetCard.attack}`);
                    }
                    
                    // Cerca bonus DEF
                    const defMatch = desc.match(/\+(\d+)\s*def/i);
                    if (defMatch) {
                        const bonus = parseInt(defMatch[1]);
                        const oldDefense = targetCard.defense || 0;
                        targetCard.defense = oldDefense + bonus;
                        if (targetCard.currentHealth !== undefined) {
                            targetCard.currentHealth += bonus;
                        }
                        console.log(`[GameRules] Difesa (da descrizione) di ${targetCard.name}: ${oldDefense} -> ${targetCard.defense}`);
                    }
                }
            });
            
            // Aggiungi le abilità speciali alla creatura
            if (!targetCard.abilities) {
                targetCard.abilities = [];
            }
            targetCard.abilities.push(...equipment.abilities);
        }
        
        // Forza aggiornamento UI
        if (this.engine.ui) {
            console.log('[GameRules] Aggiornando UI dopo equipaggiamento');
            this.engine.ui.updateBoard(this.engine.state);
        }
        
        // Notifica il sistema delle abilità per registrare eventuali nuove abilità
        this.engine.abilities.registerCard(targetCard, target);
        
        this.engine.ui.showMessage(`${equipment.name} equipaggiato a ${targetCard.name}!`);
    }

    // Effetti di inizio turno
    triggerStartOfTurnEffects() {
        const activePlayer = this.engine.state.currentPlayer;
        
        // Attiva abilità delle strutture
        const structures = this.engine.state.getZone(activePlayer, 'structures');
        structures.forEach(structure => {
            if (structure && structure.abilities) {
                this.processAbilities(structure.abilities, 'startTurn', { playerId: activePlayer });
            }
        });
        
        // Attiva abilità dei personaggi
        const creatures = this.engine.state.getAllCreatures(activePlayer);
        creatures.forEach(creature => {
            if (creature.card.abilities) {
                this.processAbilities(creature.card.abilities, 'startTurn', creature);
            }
        });
    }

    // Effetti di fine turno
    triggerEndOfTurnEffects() {
        const activePlayer = this.engine.state.currentPlayer;
        
        // Processa effetti di fine turno
        const creatures = this.engine.state.getAllCreatures(activePlayer);
        creatures.forEach(creature => {
            if (creature.card.abilities) {
                this.processAbilities(creature.card.abilities, 'endTurn', creature);
            }
        });
    }

    // Effetti quando una carta entra in gioco
    triggerEnterPlayEffects(card, playerId) {
        if (card.abilities) {
            this.processAbilities(card.abilities, 'enterPlay', { card, playerId });
        }
    }

    // Effetti delle strutture
    triggerStructureEffects(structure, playerId) {
        if (structure.abilities) {
            this.processAbilities(structure.abilities, 'continuous', { structure, playerId });
        }
    }

    // Processa le abilità
    processAbilities(abilities, trigger, context) {
        abilities.forEach(ability => {
            // Determina se l'abilità si attiva con questo trigger
            if (this.shouldTriggerAbility(ability, trigger)) {
                this.resolveAbility(ability, context);
            }
        });
    }

    // Verifica se un'abilità dovrebbe attivarsi
    shouldTriggerAbility(ability, trigger) {
        if (!ability) return false;
        const desc = (ability.description || ability.effect || '').toLowerCase();
        if (!desc) return false;
        
        switch (trigger) {
            case 'startTurn':
                return desc.includes('inizio del tuo turno') || desc.includes('all\'inizio del turno');
            case 'endTurn':
                return desc.includes('fine del turno') || desc.includes('alla fine del turno');
            case 'enterPlay':
                return desc.includes('quando entra in gioco') || desc.includes('quando viene evocato');
            case 'continuous':
                return desc.includes('finché') || desc.includes('tutti') || desc.includes('ottengono');
            default:
                return false;
        }
    }

    // Risolvi l'effetto di un'abilità
    resolveAbility(ability, context) {
        if (!ability) return;
        const desc = (ability.description || ability.effect || '').toLowerCase();
        if (!desc) return;
        
        // Guadagno energia
        if (desc.includes('guadagni') && desc.includes('energia')) {
            const energyMatch = desc.match(/guadagni (\d+) energia/);
            if (energyMatch) {
                const energy = parseInt(energyMatch[1]);
                this.engine.state.addEnergy(context.playerId || this.engine.state.currentPlayer, energy);
            }
        }
        
        // Pesca carte
        if (desc.includes('pesca') && desc.includes('cart')) {
            const drawMatch = desc.match(/pesca (\d+) cart/);
            if (drawMatch) {
                const cards = parseInt(drawMatch[1]);
                this.engine.state.drawCards(context.playerId || this.engine.state.currentPlayer, cards);
            }
        }
        
        // Buff globali
        if (desc.includes('tutti') && (desc.includes('+') || desc.includes('ottengono'))) {
            const buffMatch = desc.match(/\+(\d+)\/\+(\d+)/);
            if (buffMatch) {
                const atkBuff = parseInt(buffMatch[1]);
                const defBuff = parseInt(buffMatch[2]);
                this.applyGlobalBuff(context.playerId, atkBuff, defBuff);
            }
        }
    }

    // Risolvi un attacco
    resolveAttack(attacker, targetPlayerId) {
        const attackPower = attacker.card.attack || 0;
        if (attackPower <= 0) return 0;

        // Prima linea attacca solo prima linea nemica (se presente), altrimenti seconda linea
        if (attacker.zone === 'firstLine') {
            const enemyFirstLine = this.engine.state.getZone(targetPlayerId, 'firstLine');
            const hasFirstLineDefenders = enemyFirstLine.some(card => card !== null);
            
            if (hasFirstLineDefenders) {
                // Trova un difensore casuale in prima linea
                const defenders = enemyFirstLine
                    .map((card, index) => ({ card, index }))
                    .filter(({ card }) => card !== null);
                
                if (defenders.length > 0) {
                    const defender = defenders[Math.floor(Math.random() * defenders.length)];
                    
                    // Mostra messaggio di combattimento
                    this.engine.ui.showMessage(
                        `${attacker.card.name} attacca ${defender.card.name}!`, 
                        2000
                    );
                    
                    return this.combatBetweenCreatures(attacker, {
                        card: defender.card,
                        playerId: targetPlayerId,
                        zone: 'firstLine',
                        position: defender.index
                    });
                }
            } else {
                // Prima linea vuota, controlla la seconda linea
                const enemySecondLine = this.engine.state.getZone(targetPlayerId, 'secondLine');
                const hasSecondLineDefenders = enemySecondLine.some(card => card !== null);
                
                if (hasSecondLineDefenders) {
                    // Trova un difensore casuale in seconda linea
                    const defenders = enemySecondLine
                        .map((card, index) => ({ card, index }))
                        .filter(({ card }) => card !== null);
                    
                    if (defenders.length > 0) {
                        const defender = defenders[Math.floor(Math.random() * defenders.length)];
                        
                        // Mostra messaggio di combattimento
                        this.engine.ui.showMessage(
                            `${attacker.card.name} attacca ${defender.card.name} in seconda linea!`, 
                            2000
                        );
                        
                        return this.combatBetweenCreatures(attacker, {
                            card: defender.card,
                            playerId: targetPlayerId,
                            zone: 'secondLine',
                            position: defender.index
                        });
                    }
                } else {
                    // Nessun difensore, attacca direttamente il giocatore
                    this.engine.ui.showMessage(
                        `${attacker.card.name} attacca direttamente il Giocatore ${targetPlayerId}!`, 
                        2000
                    );
                    this.engine.state.dealDamage(targetPlayerId, attackPower);
                    return attackPower;
                }
            }
        }
        
        // Seconda linea può attaccare ovunque
        if (attacker.zone === 'secondLine') {
            // Per ora attacca direttamente il giocatore
            this.engine.ui.showMessage(
                `${attacker.card.name} attacca il Giocatore ${targetPlayerId}!`, 
                2000
            );
            this.engine.state.dealDamage(targetPlayerId, attackPower);
            return attackPower;
        }
        
        return 0;
    }

    // Combattimento tra creature
    combatBetweenCreatures(attacker, defender) {
        const attackerPower = attacker.card.stats?.attack || attacker.card.attack || 0;
        const attackerHealth = attacker.card.stats?.health || attacker.card.health || 1;
        const defenderPower = defender.card.stats?.defense || defender.card.defense || 0;
        const defenderHealth = defender.card.stats?.health || defender.card.health || 1;
        
        // Inizializza currentHealth se non esiste
        if (attacker.card.currentHealth === undefined) {
            attacker.card.currentHealth = attackerHealth;
        }
        if (defender.card.currentHealth === undefined) {
            defender.card.currentHealth = defenderHealth;
        }
        
        console.log(`  COMBATTIMENTO: ${attacker.card.name} (ATT: ${attackerPower}, PV: ${attacker.card.currentHealth}) VS ${defender.card.name} (DIF: ${defenderPower}, PV: ${defender.card.currentHealth})`);
        
        // L'attaccante infligge danno al difensore (ATT - DIF)
        const damageToDefender = Math.max(0, attackerPower - defenderPower);
        
        // Applica il danno
        // Mostra sempre l'animazione di combattimento, anche se il danno è 0
        this.engine.ui.showCombatAnimation(attacker, defender, damageToDefender);
        
        if (damageToDefender > 0) {
            console.log(`  - ${attacker.card.name} infligge ${damageToDefender} danni a ${defender.card.name}`);
            this.damageCreature(defender, damageToDefender);
        } else {
            console.log(`  - ${attacker.card.name} non riesce a danneggiare ${defender.card.name} (danno bloccato dalla difesa)`);
        }
        
        // Log risultato
        console.log(`  - Risultato: ${attacker.card.name} (PV: ${attacker.card.currentHealth}), ${defender.card.name} (PV: ${defender.card.currentHealth})`);
        
        return damageToDefender;
    }

    // Infliggi danno a una creatura
    damageCreature(creature, damage) {
        // Inizializza currentHealth se non esiste
        if (creature.card.currentHealth === undefined) {
            const maxHealth = creature.card.stats?.health || creature.card.health || 
                            creature.card.stats?.defense || creature.card.defense || 1;
            creature.card.currentHealth = maxHealth;
        }
        
        // Applica riduzione danni da abilità passive
        if (creature.card.damageReduction && damage > 0) {
            damage = Math.max(0, damage - creature.card.damageReduction);
            console.log(`Danno ridotto di ${creature.card.damageReduction} per ${creature.card.name}`);
        }
        
        creature.card.currentHealth -= damage;
        
        // Imposta il flag isDamaged se la creatura ha perso vita
        const maxHealth = creature.card.stats?.health || creature.card.health || 
                        creature.card.stats?.defense || creature.card.defense || 1;
        if (creature.card.currentHealth < maxHealth) {
            creature.card.isDamaged = true;
        }
        
        // Attiva abilità "quando subisce danno"
        if (damage > 0) {
            this.engine.abilities.triggerEvent('onDamageTaken', { 
                card: creature.card, 
                location: creature,
                damage,
                attacker: creature.attacker // Se disponibile dal contesto
            });
        }
        
        // Mostra il danno sulla carta
        this.engine.ui.showDamageOnCard(creature, damage);
        
        // Aggiorna l'interfaccia per mostrare i nuovi PV
        setTimeout(() => {
            this.engine.ui.updateGameField();
        }, 100);
        
        if (creature.card.currentHealth <= 0) {
            // Ritarda la distruzione per permettere l'animazione
            setTimeout(() => {
                this.destroyCard(creature);
            }, 1000);
        }
    }

    // Cura una creatura
    healCreature(creature, amount) {
        if (!creature.card.currentHealth) {
            creature.card.currentHealth = creature.card.health || creature.card.defense || 1;
        }
        
        const maxHealth = creature.card.health || creature.card.defense || 1;
        creature.card.currentHealth = Math.min(creature.card.currentHealth + amount, maxHealth);
        
        // Resetta il flag isDamaged se la creatura è completamente guarita
        if (creature.card.currentHealth >= maxHealth) {
            creature.card.isDamaged = false;
        }
    }

    // Distruggi una carta
    destroyCard(target) {
        const { playerId, zone, position } = target;
        const card = this.engine.state.removeCard(playerId, zone, position);
        
        // Rimuovi le abilità registrate
        if (card && this.engine.abilities) {
            this.engine.abilities.unregisterCard(card, target);
            
            // Attiva abilità "quando muore"
            this.engine.abilities.triggerEvent('onDeath', { card, location: target });
        }
        
        if (card) {
            // Metti nel cimitero
            this.engine.state.getPlayer(playerId).graveyard.push(card);
            
            // Attiva effetti di morte
            if (card.abilities) {
                this.processAbilities(card.abilities, 'onDeath', target);
            }
        }
    }

    // Applica buff globale
    applyGlobalBuff(playerId, atkBuff, defBuff) {
        const creatures = this.engine.state.getAllCreatures(playerId);
        creatures.forEach(creature => {
            if (creature.card.attack !== undefined) {
                creature.card.attack += atkBuff;
            }
            if (creature.card.defense !== undefined) {
                creature.card.defense += defBuff;
            }
        });
    }

    // Ottieni tutte le strutture
    getAllStructures() {
        const structures = [];
        
        [1, 2].forEach(playerId => {
            const playerStructures = this.engine.state.getZone(playerId, 'structures');
            playerStructures.forEach((structure, index) => {
                if (structure) {
                    structures.push({
                        card: structure,
                        playerId,
                        zone: 'structures',
                        position: index
                    });
                }
            });
        });
        
        return structures;
    }
}

// Esporta per uso globale
window.GameRules = GameRules;