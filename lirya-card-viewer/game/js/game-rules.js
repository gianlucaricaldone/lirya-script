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

        // Analizza la descrizione dell'incantesimo per determinare i bersagli
        const desc = spell.description.toLowerCase();
        
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

    // Applica equipaggiamento a una creatura
    applyEquipment(equipment, target) {
        if (!target.card || target.card.type !== 'Personaggio') return;
        
        // Applica modificatori base
        if (equipment.attack) {
            target.card.attack = (target.card.attack || 0) + equipment.attack;
        }
        if (equipment.defense) {
            target.card.defense = (target.card.defense || 0) + equipment.defense;
        }
        
        // Registra l'equipaggiamento sulla creatura
        if (!target.card.equipment) {
            target.card.equipment = [];
        }
        target.card.equipment.push(equipment);
        
        // Applica abilità speciali dell'equipaggiamento
        if (equipment.abilities) {
            if (!target.card.abilities) {
                target.card.abilities = [];
            }
            target.card.abilities.push(...equipment.abilities);
        }
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
        if (damageToDefender > 0) {
            console.log(`  - ${attacker.card.name} infligge ${damageToDefender} danni a ${defender.card.name}`);
            this.damageCreature(defender, damageToDefender);
            this.engine.ui.showCombatAnimation(attacker, defender, damageToDefender);
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
        
        creature.card.currentHealth -= damage;
        
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
    }

    // Distruggi una carta
    destroyCard(target) {
        const { playerId, zone, position } = target;
        const card = this.engine.state.removeCard(playerId, zone, position);
        
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