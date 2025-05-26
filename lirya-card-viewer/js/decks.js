/**
 * Definizioni dei mazzi standard di Lirya
 */

const DECKS = {
    'fiamme-emberhold': {
        name: 'Fiamme di Emberhold',
        cards: [
            // Personaggi (25 carte)
            { name: 'Guardia della Fornace', quantity: 2 },
            { name: 'Recluta di Emberhold', quantity: 2 },
            { name: 'Apprendista della Fiamma', quantity: 2 },
            { name: 'Lanciere di Emberhold', quantity: 2 },
            { name: 'Iniziato del Fuoco', quantity: 2 },
            { name: 'Lama d\'Élite', quantity: 2 },
            { name: 'Comandante di Emberhold', quantity: 2 },
            { name: 'Kaira', quantity: 2 },
            { name: 'Forgiatore di Fiamme', quantity: 2 },
            { name: 'Guardiana della Fornace', quantity: 1 },
            { name: 'Vulkan', quantity: 1 },
            { name: 'Pyromastro', quantity: 1 },
            { name: 'Markov', quantity: 1 },
            { name: 'Ignius', quantity: 1 },
            { name: 'Magmar il Plasmatore', quantity: 1 },
            
            // Strutture (10 carte)
            { name: 'Salone dei Guerrieri', quantity: 1 },
            { name: 'Campo di Addestramento', quantity: 2 },
            { name: 'Arsenale di Guerra', quantity: 1 },
            { name: 'Altare del Fuoco', quantity: 2 },
            { name: 'Monte Kazan', quantity: 2 },
            { name: 'Deserto di Kharram', quantity: 1 },
            { name: 'Accademia Arcana', quantity: 1 },
            
            // Incantesimi (8 carte)
            { name: 'Palla di Fuoco', quantity: 2 },
            { name: 'Scudo di Fiamme', quantity: 2 },
            { name: 'Esplosione Minore', quantity: 2 },
            { name: 'Tempesta di Fiamme', quantity: 1 },
            { name: 'Eruzione Vulcanica', quantity: 1 },
            
            // Equipaggiamenti (7 carte)
            { name: 'Spada del Valoroso', quantity: 2 },
            { name: 'Ascia del Berserker', quantity: 2 },
            { name: 'Bastone Elementale', quantity: 2 },
            { name: 'Lama del Campione', quantity: 1 }
        ]
    },
    
    'maree-tidemire': {
        name: 'Maree di Tidemire',
        cards: [
            // Personaggi (25 carte)
            { name: 'Pattugliatore Costiero', quantity: 2 },
            { name: 'Marinaio di Tidemire', quantity: 2 },
            { name: 'Studioso delle Correnti', quantity: 2 },
            { name: 'Navigatore Fluviale', quantity: 2 },
            { name: 'Guerriero del Reef', quantity: 2 },
            { name: 'Evocatore d\'Acqua', quantity: 2 },
            { name: 'Invocatore d\'Acqua', quantity: 2 },
            { name: 'Sacerdote delle Onde', quantity: 2 },
            { name: 'Thorne', quantity: 2 },
            { name: 'Elissa', quantity: 2 },
            { name: 'Ondina', quantity: 1 },
            { name: 'Profondo Maremoto', quantity: 1 },
            { name: 'Arika', quantity: 1 },
            { name: 'Lyra', quantity: 1 },
            { name: 'Thalassa', quantity: 1 },
            
            // Strutture (10 carte)
            { name: 'Collegium delle Profondità', quantity: 1 },
            { name: 'Biblioteca Arcana', quantity: 2 },
            { name: 'Circolo di Evocazione', quantity: 1 },
            { name: 'Altare dell\'Acqua', quantity: 2 },
            { name: 'Mare di Navar', quantity: 2 },
            { name: 'Isole di Welwater', quantity: 1 },
            { name: 'Torre di Guardia', quantity: 1 },
            
            // Incantesimi (8 carte)
            { name: 'Dardo di Ghiaccio', quantity: 2 },
            { name: 'Corrente Risanatrice', quantity: 2 },
            { name: 'Nebbia', quantity: 1 },
            { name: 'Deviazione di Corrente', quantity: 2 },
            { name: 'Maremoto', quantity: 1 },
            
            // Equipaggiamenti (7 carte)
            { name: 'Scudo del Bastione', quantity: 2 },
            { name: 'Bastone Elementale', quantity: 2 },
            { name: 'Simbolo Sacro', quantity: 2 },
            { name: 'Anello della Fortuna', quantity: 1 }
        ]
    },
    
    'rocce-stonereach': {
        name: 'Rocce di Stonereach',
        cards: [
            // Personaggi (25 carte)
            { name: 'Sentinella di Roccia', quantity: 2 },
            { name: 'Minatore di Stonereach', quantity: 2 },
            { name: 'Apprendista Geomante', quantity: 2 },
            { name: 'Esploratore Montano', quantity: 2 },
            { name: 'Picconiere di Stonereach', quantity: 2 },
            { name: 'Apprendista della Pietra', quantity: 2 },
            { name: 'Custode della Pietra', quantity: 2 },
            { name: 'Kale', quantity: 2 },
            { name: 'Guardiano della Terra', quantity: 2 },
            { name: 'Geologo Mistico', quantity: 1 },
            { name: 'Custode della Montagna', quantity: 1 },
            { name: 'Thoran', quantity: 1 },
            { name: 'Gorlok il Saldo', quantity: 1 },
            { name: 'Skarn', quantity: 1 },
            { name: 'Barbaro delle Montagne', quantity: 1 },
            
            // Strutture (10 carte)
            { name: 'Gilda della Pietra', quantity: 1 },
            { name: 'Campo di Addestramento', quantity: 2 },
            { name: 'Monumento dell\'Eroe', quantity: 1 },
            { name: 'Altare della Terra', quantity: 2 },
            { name: 'Montagne di Grimspire', quantity: 1 },
            { name: 'Foresta di Eldenroot', quantity: 1 },
            { name: 'Fortezza', quantity: 1 },
            { name: 'Miniera di Cristalli', quantity: 1 },
            
            // Incantesimi (8 carte)
            { name: 'Dardo di Pietra', quantity: 2 },
            { name: 'Scudo di Pietra', quantity: 2 },
            { name: 'Rinforzo', quantity: 2 },
            { name: 'Frana', quantity: 1 },
            { name: 'Terremoto', quantity: 1 },
            
            // Equipaggiamenti (7 carte)
            { name: 'Armatura di Piastre', quantity: 1 },
            { name: 'Scudo del Bastione', quantity: 2 },
            { name: 'Talismano di Protezione', quantity: 2 },
            { name: 'Stivali del Viaggiatore', quantity: 2 }
        ]
    },
    
    'venti-mistral': {
        name: 'Venti di Mistral',
        cards: [
            // Personaggi (25 carte)
            { name: 'Sentinella del Cielo', quantity: 2 },
            { name: 'Messaggero di Mistral', quantity: 2 },
            { name: 'Manipolatore di Venti', quantity: 2 },
            { name: 'Esploratore delle Correnti', quantity: 2 },
            { name: 'Guerriero del Vento', quantity: 2 },
            { name: 'Evocatore di Brezze', quantity: 2 },
            { name: 'Oratore dei Venti', quantity: 2 },
            { name: 'Silvestra', quantity: 2 },
            { name: 'Varga', quantity: 2 },
            { name: 'Saggio dei Venti', quantity: 1 },
            { name: 'Pattugliatore Celeste', quantity: 1 },
            { name: 'Arcanista del Vento', quantity: 1 },
            { name: 'Predatore Celeste', quantity: 1 },
            { name: 'Aeolos', quantity: 1 },
            { name: 'Zephyria', quantity: 1 },
            { name: 'Sylphia Stormrider', quantity: 1 },
            
            // Strutture (10 carte)
            { name: 'Consorzio dei Venti', quantity: 1 },
            { name: 'Avamposto di Caccia', quantity: 2 },
            { name: 'Grove dell\'Esploratore', quantity: 1 },
            { name: 'Altare dell\'Aria', quantity: 2 },
            { name: 'Altipiani di Aeros', quantity: 2 },
            { name: 'Pianure di Savalon', quantity: 1 },
            { name: 'Valle di Murmur', quantity: 1 },
            
            // Incantesimi (8 carte)
            { name: 'Raffica di Vento', quantity: 2 },
            { name: 'Nebbia Velata', quantity: 2 },
            { name: 'Folata Impetuosa', quantity: 2 },
            { name: 'Tornado', quantity: 1 },
            { name: 'Tempesta di Fulmini', quantity: 1 },
            
            // Equipaggiamenti (7 carte)
            { name: 'Arco Lungo', quantity: 2 },
            { name: 'Mantello del Viaggiatore', quantity: 2 },
            { name: 'Pugnali Gemelli', quantity: 1 },
            { name: 'Bussola dell\'Esploratore', quantity: 1 },
            { name: 'Stivali del Viaggiatore', quantity: 1 }
        ]
    },
    
    'equilibrio-ancestrale': {
        name: 'Equilibrio Ancestrale',
        cards: [
            // Personaggi (20 carte)
            { name: 'Guardia della Fornace', quantity: 1 },
            { name: 'Pattugliatore Costiero', quantity: 1 },
            { name: 'Sentinella di Roccia', quantity: 1 },
            { name: 'Sentinella del Cielo', quantity: 1 },
            { name: 'Guardia del Santuario', quantity: 1 },
            { name: 'Guardia Notturna', quantity: 1 },
            { name: 'Apprendista della Fiamma', quantity: 1 },
            { name: 'Studioso delle Correnti', quantity: 1 },
            { name: 'Manipolatore di Venti', quantity: 1 },
            { name: 'Illusionista Novizio', quantity: 1 },
            { name: 'Guida Vulcanica', quantity: 1 },
            { name: 'Navigatore Fluviale', quantity: 1 },
            { name: 'Esploratore Montano', quantity: 1 },
            { name: 'Esploratore delle Correnti', quantity: 1 },
            { name: 'Cercatore di Verità', quantity: 1 },
            { name: 'Ricognitore delle Ombre', quantity: 1 },
            { name: 'Ritualista della Cenere', quantity: 1 },
            { name: 'Sacerdote delle Onde', quantity: 1 },
            { name: 'Custode della Pietra', quantity: 1 },
            { name: 'Iniziato Luminoso', quantity: 1 },
            
            // Strutture (15 carte)
            { name: 'Altare del Fuoco', quantity: 1 },
            { name: 'Altare dell\'Acqua', quantity: 1 },
            { name: 'Altare della Terra', quantity: 1 },
            { name: 'Altare dell\'Aria', quantity: 1 },
            { name: 'Altare della Luce', quantity: 1 },
            { name: 'Altare dell\'Ombra', quantity: 1 },
            { name: 'Accademia Arcana', quantity: 1 },
            { name: 'Torre di Guardia', quantity: 1 },
            { name: 'Avamposto di Frontiera', quantity: 1 },
            { name: 'Faro di Navigazione', quantity: 1 },
            { name: 'Emporio del Mercante', quantity: 1 },
            { name: 'Campo dei Mercenari', quantity: 1 },
            { name: 'Cerchio Rituale', quantity: 1 },
            { name: 'Oasi Nascosta', quantity: 1 },
            { name: 'Laboratorio Alchemico', quantity: 1 },
            
            // Incantesimi (10 carte)
            { name: 'Palla di Fuoco', quantity: 1 },
            { name: 'Dardo di Ghiaccio', quantity: 1 },
            { name: 'Dardo di Pietra', quantity: 1 },
            { name: 'Raffica di Vento', quantity: 1 },
            { name: 'Bagliore Curativo', quantity: 1 },
            { name: 'Tocco Vampirico', quantity: 1 },
            { name: 'Corrente Risanatrice', quantity: 1 },
            { name: 'Scudo di Pietra', quantity: 1 },
            { name: 'Nebbia Velata', quantity: 1 },
            { name: 'Trasmutazione', quantity: 1 },
            
            // Equipaggiamenti (5 carte)
            { name: 'Spada del Valoroso', quantity: 1 },
            { name: 'Bastone Elementale', quantity: 1 },
            { name: 'Arco Lungo', quantity: 1 },
            { name: 'Simbolo Sacro', quantity: 1 },
            { name: 'Anello della Fortuna', quantity: 1 }
        ]
    }
};

/**
 * Ottiene tutte le carte di un mazzo con le rispettive quantità
 * @param {string} deckId - ID del mazzo
 * @param {Array} allCards - Array di tutte le carte disponibili
 * @returns {Array} Array di carte del mazzo con quantità
 */
function getDeckCards(deckId, allCards) {
    if (!DECKS[deckId]) {
        console.error('Mazzo non trovato:', deckId);
        return [];
    }
    
    const deck = DECKS[deckId];
    const deckCards = [];
    
    // Per ogni carta nel mazzo, trova la carta corrispondente nel database
    deck.cards.forEach(deckCard => {
        const foundCard = allCards.find(card => 
            card.name.toLowerCase() === deckCard.name.toLowerCase()
        );
        
        if (foundCard) {
            // Aggiungi la carta per ogni copia nel mazzo
            for (let i = 0; i < deckCard.quantity; i++) {
                deckCards.push({ ...foundCard, deckQuantity: deckCard.quantity });
            }
        } else {
            console.warn('Carta non trovata nel database:', deckCard.name);
        }
    });
    
    return deckCards;
}

/**
 * Filtra le carte in base al mazzo selezionato
 * @param {Array} cards - Array di tutte le carte
 * @param {string} deckId - ID del mazzo
 * @returns {Array} Array di carte filtrate per il mazzo
 */
function filterCardsByDeck(cards, deckId) {
    if (!deckId || deckId === '') {
        return cards;
    }
    
    const deckCards = getDeckCards(deckId, cards);
    return deckCards;
}

/**
 * Ottiene informazioni statistiche su un mazzo
 * @param {string} deckId - ID del mazzo
 * @returns {Object} Oggetto con statistiche del mazzo
 */
function getDeckStats(deckId) {
    if (!DECKS[deckId]) {
        return null;
    }
    
    const deck = DECKS[deckId];
    const stats = {
        name: deck.name,
        totalCards: 0,
        cardTypes: {
            'Personaggio': 0,
            'Struttura': 0,
            'Incantesimo': 0,
            'Equipaggiamento': 0
        }
    };
    
    deck.cards.forEach(card => {
        stats.totalCards += card.quantity;
    });
    
    return stats;
}

// Esporta per uso globale
window.DECKS = DECKS;
window.getDeckCards = getDeckCards;
window.filterCardsByDeck = filterCardsByDeck;
window.getDeckStats = getDeckStats;