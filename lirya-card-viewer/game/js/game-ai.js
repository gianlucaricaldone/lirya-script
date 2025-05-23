// game-ai.js - Intelligenza artificiale per il giocatore CPU
class GameAI {
    constructor(engine, playerId) {
        this.engine = engine;
        this.playerId = playerId;
        this.difficulty = 'medium'; // easy, medium, hard
    }

    // Esegue il turno dell'AI
    playTurn() {
        setTimeout(() => {
            const state = this.engine.state;
            const player = state.getPlayer(this.playerId);
            
            // Valuta la situazione
            const gameState = this.evaluateGameState();
            
            // Decide strategia
            const strategy = this.decideStrategy(gameState);
            
            // Esegue azioni basate sulla strategia
            this.executeStrategy(strategy, player);
            
            // Fine turno - questo attiverà automaticamente la fase di combattimento
            setTimeout(() => {
                this.engine.endTurn();
            }, 1000);
        }, 1000);
    }
    
    // Gestisce la fase di combattimento per l'AI
    handleCombatPhase() {
        const myCreatures = this.engine.state.getAllCreatures(this.playerId);
        const opponentId = this.playerId === 1 ? 2 : 1;
        
        // Seleziona e dichiara attaccanti con i loro bersagli
        myCreatures.forEach((creature, index) => {
            setTimeout(() => {
                // Seleziona la creatura come attaccante
                this.engine.declareAttacker(creature.playerId, creature.zone, creature.position);
                
                // Aspetta un po' poi seleziona il bersaglio
                setTimeout(() => {
                    const target = this.chooseCombatTarget(creature, opponentId);
                    if (target) {
                        this.engine.selectAttackTarget(target);
                    }
                }, 500);
            }, index * 1000); // Delay tra ogni attaccante per rendere più visibile
        });
        
        // Conferma gli attacchi dopo aver dichiarato tutti
        setTimeout(() => {
            this.engine.confirmAttackers();
        }, (myCreatures.length + 1) * 1000);
    }
    
    // Sceglie il bersaglio per un attaccante
    chooseCombatTarget(attacker, opponentId) {
        const validTargets = this.engine.getValidTargetsForAttacker(
            attacker.card, 
            attacker.zone, 
            opponentId
        );
        
        if (validTargets.length === 0) return null;
        
        // Strategia: prioritizza creature pericolose, poi il giocatore
        const creatureTargets = validTargets.filter(t => t.type === 'creature');
        const playerTarget = validTargets.find(t => t.type === 'player');
        
        if (creatureTargets.length > 0) {
            // Attacca la creatura con più attacco
            creatureTargets.sort((a, b) => {
                const aAttack = a.card.stats?.attack || a.card.attack || 0;
                const bAttack = b.card.stats?.attack || b.card.attack || 0;
                return bAttack - aAttack;
            });
            return creatureTargets[0];
        }
        
        // Se non ci sono creature, attacca il giocatore
        return playerTarget;
    }

    // Valuta lo stato del gioco
    evaluateGameState() {
        const state = this.engine.state;
        const myPlayer = state.getPlayer(this.playerId);
        const opponent = state.getOpponent();
        
        return {
            myLife: myPlayer.life,
            opponentLife: opponent.life,
            myEnergy: myPlayer.energy,
            myHandSize: myPlayer.hand.length,
            myCreatures: state.countCards(this.playerId, 'firstLine') + state.countCards(this.playerId, 'secondLine'),
            opponentCreatures: state.countCards(opponent.id, 'firstLine') + state.countCards(opponent.id, 'secondLine'),
            myStructures: state.countCards(this.playerId, 'structures'),
            canWinThisTurn: this.checkLethal()
        };
    }

    // Decide la strategia da adottare
    decideStrategy(gameState) {
        // Se può vincere questo turno, attacca
        if (gameState.canWinThisTurn) {
            return 'aggressive';
        }
        
        // Se ha poca vita, difendi
        if (gameState.myLife < 7) {
            return 'defensive';
        }
        
        // Se l'avversario ha poca vita, attacca
        if (gameState.opponentLife < 10) {
            return 'aggressive';
        }
        
        // Se ha vantaggio di creature, controlla
        if (gameState.myCreatures > gameState.opponentCreatures + 1) {
            return 'control';
        }
        
        // Altrimenti bilanciato
        return 'balanced';
    }

    // Esegue la strategia scelta
    executeStrategy(strategy, player) {
        const playableCards = this.getPlayableCards(player);
        
        switch (strategy) {
            case 'aggressive':
                this.playAggressively(playableCards, player);
                break;
            case 'defensive':
                this.playDefensively(playableCards, player);
                break;
            case 'control':
                this.playControl(playableCards, player);
                break;
            default:
                this.playBalanced(playableCards, player);
        }
    }

    // Ottieni carte giocabili
    getPlayableCards(player) {
        return player.hand.map((card, index) => ({ card, index }))
            .filter(({ card }) => card.cost <= player.energy)
            .sort((a, b) => b.card.cost - a.card.cost); // Priorità a carte più costose
    }

    // Gioca aggressivamente
    playAggressively(playableCards, player) {
        // Priorità: creature d'attacco > incantesimi di danno > resto
        const attackCreatures = playableCards.filter(({ card }) => 
            card.type === 'Personaggio' && (card.attack || 0) > 2
        );
        
        const damageSpells = playableCards.filter(({ card }) => 
            card.type === 'Incantesimo' && card.description.toLowerCase().includes('dann')
        );
        
        // Gioca creature d'attacco
        for (const { index } of attackCreatures) {
            if (this.tryPlayCard(index)) {
                return this.continuePlay(player);
            }
        }
        
        // Gioca incantesimi di danno
        for (const { index } of damageSpells) {
            if (this.tryPlayCard(index)) {
                return this.continuePlay(player);
            }
        }
        
        // Gioca qualsiasi altra cosa
        this.playAnyCard(playableCards, player);
    }

    // Gioca difensivamente
    playDefensively(playableCards, player) {
        // Priorità: creature difensive > cure > strutture difensive
        const defenseCreatures = playableCards.filter(({ card }) => 
            card.type === 'Personaggio' && (card.defense || 0) > 2
        );
        
        const healingCards = playableCards.filter(({ card }) => 
            card.description.toLowerCase().includes('cura') || 
            card.description.toLowerCase().includes('rigenera')
        );
        
        const structures = playableCards.filter(({ card }) => 
            card.type === 'Struttura'
        );
        
        // Gioca creature difensive
        for (const { index } of defenseCreatures) {
            if (this.tryPlayCard(index)) {
                return this.continuePlay(player);
            }
        }
        
        // Gioca cure
        for (const { index } of healingCards) {
            if (this.tryPlayCard(index)) {
                return this.continuePlay(player);
            }
        }
        
        // Gioca strutture
        for (const { index } of structures) {
            if (this.tryPlayCard(index)) {
                return this.continuePlay(player);
            }
        }
        
        // Gioca qualsiasi altra cosa
        this.playAnyCard(playableCards, player);
    }

    // Gioca controllo
    playControl(playableCards, player) {
        // Priorità: rimozione > creature efficienti > draw
        const removalSpells = playableCards.filter(({ card }) => 
            card.type === 'Incantesimo' && 
            (card.description.toLowerCase().includes('distruggi') || 
             card.description.toLowerCase().includes('esilia'))
        );
        
        const efficientCreatures = playableCards.filter(({ card }) => 
            card.type === 'Personaggio' && 
            ((card.attack || 0) + (card.defense || 0)) / card.cost > 1.5
        );
        
        const drawCards = playableCards.filter(({ card }) => 
            card.description.toLowerCase().includes('pesca')
        );
        
        // Gioca rimozioni se necessario
        if (this.shouldPlayRemoval()) {
            for (const { index } of removalSpells) {
                if (this.tryPlayCard(index)) {
                    return this.continuePlay(player);
                }
            }
        }
        
        // Gioca creature efficienti
        for (const { index } of efficientCreatures) {
            if (this.tryPlayCard(index)) {
                return this.continuePlay(player);
            }
        }
        
        // Gioca draw
        for (const { index } of drawCards) {
            if (this.tryPlayCard(index)) {
                return this.continuePlay(player);
            }
        }
        
        // Gioca qualsiasi altra cosa
        this.playAnyCard(playableCards, player);
    }

    // Gioca bilanciato
    playBalanced(playableCards, player) {
        // Gioca le carte più efficienti in ordine di costo
        for (const { index } of playableCards) {
            if (this.tryPlayCard(index)) {
                return this.continuePlay(player);
            }
        }
    }

    // Gioca qualsiasi carta possibile
    playAnyCard(playableCards, player) {
        for (const { index } of playableCards) {
            if (this.tryPlayCard(index)) {
                return this.continuePlay(player);
            }
        }
    }

    // Tenta di giocare una carta
    tryPlayCard(cardIndex) {
        const success = this.engine.playCard(this.playerId, cardIndex);
        
        // Se la carta richiede un bersaglio, sceglilo
        if (this.engine.state.targetingMode) {
            const target = this.chooseTarget();
            if (target) {
                this.engine.selectTarget(target);
            }
        }
        
        return success;
    }

    // Sceglie un bersaglio
    chooseTarget() {
        const validTargets = this.engine.state.validTargets;
        if (validTargets.length === 0) return null;
        
        // Se ci sono bersagli nemici, prioritizza quelli
        const enemyTargets = validTargets.filter(t => t.playerId !== this.playerId);
        if (enemyTargets.length > 0) {
            // Scegli il bersaglio con più attacco
            return enemyTargets.sort((a, b) => 
                (b.card?.attack || 0) - (a.card?.attack || 0)
            )[0];
        }
        
        // Altrimenti scegli un bersaglio alleato (per buff/cure)
        const allyTargets = validTargets.filter(t => t.playerId === this.playerId);
        if (allyTargets.length > 0) {
            // Scegli la creatura più forte
            return allyTargets.sort((a, b) => 
                ((b.card?.attack || 0) + (b.card?.defense || 0)) - 
                ((a.card?.attack || 0) + (a.card?.defense || 0))
            )[0];
        }
        
        // Default: primo bersaglio disponibile
        return validTargets[0];
    }

    // Continua a giocare carte
    continuePlay(player) {
        // Attendi un po' poi continua
        setTimeout(() => {
            const newPlayableCards = this.getPlayableCards(player);
            if (newPlayableCards.length > 0 && player.energy > 0) {
                const strategy = this.decideStrategy(this.evaluateGameState());
                this.executeStrategy(strategy, player);
            }
        }, 1500);
    }

    // Verifica se può vincere questo turno
    checkLethal() {
        const opponent = this.engine.state.getOpponent();
        const myCreatures = this.engine.state.getAllCreatures(this.playerId);
        
        let totalDamage = 0;
        for (const creature of myCreatures) {
            totalDamage += creature.card.attack || 0;
        }
        
        return totalDamage >= opponent.life;
    }

    // Verifica se dovrebbe giocare rimozioni
    shouldPlayRemoval() {
        const opponentCreatures = this.engine.state.getAllCreatures(
            this.playerId === 1 ? 2 : 1
        );
        
        // Gioca rimozione se ci sono creature nemiche pericolose
        return opponentCreatures.some(c => (c.card.attack || 0) >= 4);
    }
}

// Esporta per uso globale
window.GameAI = GameAI;