// game.js - File principale per l'inizializzazione del gioco

// Variabile globale per le carte
let allCards = [];

document.addEventListener('DOMContentLoaded', async function() {
    // Prima carica i template e le icone
    try {
        console.log('Caricamento template SVG...');
        await CardRenderer.loadTemplates('../svg-templates/');
        console.log('Template SVG caricati');
        
        console.log('Caricamento icone SVG...');
        await CardRenderer.loadIcons('../svg-templates/icon/');
        console.log('Icone SVG caricate');
    } catch (error) {
        console.error('Errore nel caricamento dei template/icone:', error);
        alert('Errore nel caricamento delle risorse grafiche. Ricarica la pagina.');
        return;
    }
    
    // Carica i dati delle carte
    try {
        const response = await fetch('../data/cards.json');
        allCards = await response.json();
        console.log('Carte caricate:', allCards.length);
        console.log('Prime 5 carte:', allCards.slice(0, 5).map(c => c.name));
    } catch (error) {
        console.error('Errore nel caricamento delle carte:', error);
        alert('Errore nel caricamento delle carte. Ricarica la pagina.');
        return;
    }

    // Definizione dei mazzi standard
    const standardDecks = {
        'flames': {
            name: 'Fiamme di Emberhold',
            element: 'Fuoco',
            description: 'Mazzo aggressivo basato su danno diretto e guerrieri forti',
            cards: [
                'Guardia della Fornace', 'Guardia della Fornace',
                'Recluta di Emberhold', 'Recluta di Emberhold',
                'Apprendista della Fiamma', 'Apprendista della Fiamma',
                'Lanciere di Emberhold', 'Lanciere di Emberhold',
                'Iniziato del Fuoco', 'Iniziato del Fuoco',
                'Kaira', 'Kaira',
                'Forgiatore di Fiamme', 'Forgiatore di Fiamme',
                'Guardiano della Fornace',
                'Campo di Addestramento', 'Campo di Addestramento',
                'Altare del Fuoco', 'Altare del Fuoco',
                'Monte Kazan', 'Monte Kazan',
                'Palla di Fuoco', 'Palla di Fuoco',
                'Scudo di Fiamme', 'Scudo di Fiamme',
                'Spada del Valoroso', 'Spada del Valoroso',
                'Bastone Elementale', 'Bastone Elementale',
                // Aggiungi altre carte fino a 40-50
                'Guardia della Fornace', 'Apprendista della Fiamma',
                'Lanciere di Emberhold', 'Iniziato del Fuoco',
                'Palla di Fuoco', 'Scudo di Fiamme',
                'Spada del Valoroso', 'Campo di Addestramento',
                'Altare del Fuoco', 'Monte Kazan'
            ]
        },
        'tides': {
            name: 'Maree di Tidemire',
            element: 'Acqua',
            description: 'Mazzo di controllo con guarigione e manipolazione carte',
            cards: [
                'Pattugliatore Costiero', 'Pattugliatore Costiero',
                'Marinaio di Tidemire', 'Marinaio di Tidemire',
                'Studioso delle Correnti', 'Studioso delle Correnti',
                'Navigatore Fluviale', 'Navigatore Fluviale',
                'Guerriero del Reef', 'Guerriero del Reef',
                'Evocatore d\'Acqua', 'Evocatore d\'Acqua',
                'Sacerdote delle Onde', 'Sacerdote delle Onde',
                'Thorne', 'Thorne',
                'Elissa', 'Elissa',
                'Biblioteca Arcana', 'Biblioteca Arcana',
                'Altare dell\'Acqua', 'Altare dell\'Acqua',
                'Dardo di Ghiaccio', 'Dardo di Ghiaccio',
                'Corrente Risanatrice', 'Corrente Risanatrice',
                'Bastone Elementale', 'Bastone Elementale',
                'Simbolo Sacro', 'Simbolo Sacro',
                // Aggiungi altre carte
                'Pattugliatore Costiero', 'Marinaio di Tidemire',
                'Studioso delle Correnti', 'Guerriero del Reef',
                'Dardo di Ghiaccio', 'Corrente Risanatrice',
                'Biblioteca Arcana', 'Altare dell\'Acqua',
                'Bastone Elementale', 'Simbolo Sacro'
            ]
        },
        'rocks': {
            name: 'Rocce di Stonereach',
            element: 'Terra',
            description: 'Mazzo difensivo con creature resistenti e strutture',
            cards: [
                'Sentinella di Roccia', 'Sentinella di Roccia',
                'Minatore di Stonereach', 'Minatore di Stonereach',
                'Apprendista Geomante', 'Apprendista Geomante',
                'Esploratore Montano', 'Esploratore Montano',
                'Picconiere di Stonereach', 'Picconiere di Stonereach',
                'Apprendista della Pietra', 'Apprendista della Pietra',
                'Custode della Pietra', 'Custode della Pietra',
                'Kale', 'Kale',
                'Campo di Addestramento', 'Campo di Addestramento',
                'Altare della Terra', 'Altare della Terra',
                'Miniera di Cristalli',
                'Dardo di Pietra', 'Dardo di Pietra',
                'Scudo di Pietra', 'Scudo di Pietra',
                'Stivali del Viaggiatore', 'Stivali del Viaggiatore',
                // Aggiungi altre carte
                'Sentinella di Roccia', 'Minatore di Stonereach',
                'Picconiere di Stonereach', 'Custode della Pietra',
                'Dardo di Pietra', 'Scudo di Pietra',
                'Campo di Addestramento', 'Altare della Terra',
                'Stivali del Viaggiatore', 'Miniera di Cristalli'
            ]
        },
        'winds': {
            name: 'Venti di Mistral',
            element: 'Aria',
            description: 'Mazzo veloce con mobilità e attacchi flessibili',
            cards: [
                'Sentinella del Cielo', 'Sentinella del Cielo',
                'Messaggero di Mistral', 'Messaggero di Mistral',
                'Manipolatore di Venti', 'Manipolatore di Venti',
                'Esploratore delle Correnti', 'Esploratore delle Correnti',
                'Guerriero del Vento', 'Guerriero del Vento',
                'Evocatore di Brezze', 'Evocatore di Brezze',
                'Oratore dei Venti', 'Oratore dei Venti',
                'Silvestra', 'Silvestra',
                'Varga', 'Varga',
                'Avamposto di Caccia', 'Avamposto di Caccia',
                'Altare dell\'Aria', 'Altare dell\'Aria',
                'Raffica di Vento', 'Raffica di Vento',
                'Nebbia Velata', 'Nebbia Velata',
                'Arco Lungo', 'Arco Lungo',
                // Aggiungi altre carte
                'Sentinella del Cielo', 'Messaggero di Mistral',
                'Guerriero del Vento', 'Evocatore di Brezze',
                'Raffica di Vento', 'Nebbia Velata',
                'Avamposto di Caccia', 'Altare dell\'Aria',
                'Arco Lungo', 'Stivali del Viaggiatore'
            ]
        },
        'balance': {
            name: 'Equilibrio Ancestrale',
            element: 'Multi-elemento',
            description: 'Mazzo bilanciato con carte di tutti gli elementi',
            cards: [
                'Guardia della Fornace', 'Pattugliatore Costiero',
                'Sentinella di Roccia', 'Sentinella del Cielo',
                'Guardia del Santuario', 'Guardia Notturna',
                'Apprendista della Fiamma', 'Studioso delle Correnti',
                'Manipolatore di Venti', 'Illusionista Novizio',
                'Guida Vulcanica', 'Navigatore Fluviale',
                'Esploratore Montano', 'Esploratore delle Correnti',
                'Cercatore di Verità', 'Ricognitore delle Ombre',
                'Altare del Fuoco', 'Altare dell\'Acqua',
                'Altare della Terra', 'Altare dell\'Aria',
                'Altare della Luce', 'Altare dell\'Ombra',
                'Palla di Fuoco', 'Dardo di Ghiaccio',
                'Dardo di Pietra', 'Raffica di Vento',
                'Bagliore Curativo', 'Tocco Vampirico',
                'Spada del Valoroso', 'Bastone Elementale',
                'Arco Lungo', 'Simbolo Sacro',
                'Anello della Fortuna', 'Corrente Risanatrice',
                'Scudo di Pietra', 'Nebbia Velata',
                'Campo di Addestramento', 'Biblioteca Arcana'
            ]
        }
    };

    // Inizializza il motore di gioco
    const engine = new GameEngine();
    const ui = new UIManager(engine);
    engine.init(ui);
    
    // Inizializza l'UI subito - CardRenderer dovrebbe essere già disponibile
    ui.init();
    console.log('UI inizializzata');

    // Gestione menu principale
    const screens = {
        mainMenu: document.getElementById('main-menu'),
        deckSelection: document.getElementById('deck-selection'),
        gameBoard: document.getElementById('game-board')
    };

    // Funzione per cambiare schermata
    function showScreen(screenName) {
        console.log('showScreen chiamata con:', screenName);
        console.log('Screens disponibili:', Object.keys(screens));
        console.log('Screen target esiste?', !!screens[screenName]);
        
        Object.keys(screens).forEach(key => {
            if (screens[key]) {
                screens[key].classList.remove('active');
                console.log(`Rimossa classe active da ${key}`);
            }
        });
        
        if (screens[screenName]) {
            screens[screenName].classList.add('active');
            console.log(`Aggiunta classe active a ${screenName}`);
            console.log('Classi elemento:', screens[screenName].classList.toString());
        } else {
            console.error(`Screen ${screenName} non trovato!`);
        }
    }

    // Event listeners menu principale
    document.getElementById('play-local').addEventListener('click', () => {
        showScreen('deckSelection');
        setupDeckSelection(false);
    });

    document.getElementById('play-cpu').addEventListener('click', () => {
        showScreen('deckSelection');
        setupDeckSelection(true);
    });

    document.getElementById('deck-builder').addEventListener('click', () => {
        alert('Creazione mazzi in arrivo! Per ora usa i mazzi standard.');
    });

    document.getElementById('back-to-menu').addEventListener('click', () => {
        showScreen('mainMenu');
    });

    // Setup selezione mazzi
    let selectedDecks = { player1: null, player2: null };
    let isVsCPU = false;

    function setupDeckSelection(vsCPU) {
        isVsCPU = vsCPU;
        selectedDecks = { player1: null, player2: null };
        
        // Aggiorna titoli
        document.getElementById('player2-title').textContent = vsCPU ? 'CPU' : 'Giocatore 2';
        
        // Popola opzioni mazzi
        const player1Decks = document.getElementById('player1-decks');
        const player2Decks = document.getElementById('player2-decks');
        
        player1Decks.innerHTML = '';
        player2Decks.innerHTML = '';
        
        Object.entries(standardDecks).forEach(([key, deck]) => {
            // Opzione per giocatore 1
            const option1 = createDeckOption(deck, key, 1);
            player1Decks.appendChild(option1);
            
            // Opzione per giocatore 2
            const option2 = createDeckOption(deck, key, 2);
            player2Decks.appendChild(option2);
        });
        
        updateStartButton();
    }

    function createDeckOption(deck, key, playerId) {
        const div = document.createElement('div');
        div.className = 'deck-option';
        div.innerHTML = `
            <h4>${deck.name}</h4>
            <p>${deck.element} - ${deck.description}</p>
        `;
        
        div.addEventListener('click', () => {
            // Rimuovi selezione precedente
            document.querySelectorAll(`#player${playerId}-decks .deck-option`).forEach(opt => {
                opt.classList.remove('selected');
            });
            
            // Seleziona questo mazzo
            div.classList.add('selected');
            selectedDecks[`player${playerId}`] = key;
            updateStartButton();
        });
        
        return div;
    }

    function updateStartButton() {
        const startButton = document.getElementById('start-game');
        startButton.disabled = !selectedDecks.player1 || !selectedDecks.player2;
    }

    // Inizia partita
    document.getElementById('start-game').addEventListener('click', async () => {
        console.log('Start game cliccato');
        if (!selectedDecks.player1 || !selectedDecks.player2) return;
        
        console.log('CardRenderer disponibile?', !!window.CardRenderer);
        console.log('loadTemplates disponibile?', !!(window.CardRenderer && window.CardRenderer.loadTemplates));
        
        // Assicurati che i template siano caricati prima di iniziare
        if (window.CardRenderer && window.CardRenderer.loadTemplates) {
            try {
                console.log('Caricamento template SVG prima di iniziare la partita...');
                // Usa il percorso corretto per il gioco
                await window.CardRenderer.loadTemplates('../svg-templates/');
                console.log('Template SVG caricati con successo');
                
                // Reinizializza l'UI per usare il renderer caricato
                ui.init();
                console.log('UI reinizializzata con template caricati');
            } catch (error) {
                console.error('Errore nel caricamento dei template:', error);
            }
        } else {
            console.log('CardRenderer non disponibile per caricare i template');
        }
        
        // Prepara i mazzi con le carte reali
        const deck1 = prepareDeck(standardDecks[selectedDecks.player1]);
        const deck2 = prepareDeck(standardDecks[selectedDecks.player2]);
        
        console.log('Deck 1 preparato:', deck1.cards.length, 'carte');
        console.log('Deck 2 preparato:', deck2.cards.length, 'carte');
        
        // Verifica che i mazzi abbiano abbastanza carte
        if (deck1.cards.length < 20 || deck2.cards.length < 20) {
            console.error('Mazzi troppo piccoli per iniziare la partita');
            alert('Errore: mazzi troppo piccoli. Alcuni carte mancano dal database.');
            return;
        }
        
        // Mostra il campo di gioco
        console.log('Mostrando schermata di gioco...');
        showScreen('gameBoard');
        
        // Inizia la partita
        console.log('Iniziando partita...');
        engine.startGame(deck1, deck2, isVsCPU);
        console.log('Partita iniziata!');
    });

    // Prepara un mazzo con le carte reali
    function prepareDeck(deckTemplate) {
        const deck = {
            name: deckTemplate.name,
            cards: []
        };
        
        // Converti i nomi delle carte in oggetti carta reali
        deckTemplate.cards.forEach(cardName => {
            const card = allCards.find(c => c.name === cardName);
            if (card) {
                // Clona la carta per evitare riferimenti condivisi
                deck.cards.push(JSON.parse(JSON.stringify(card)));
            } else {
                console.warn(`Carta non trovata: ${cardName}`);
            }
        });
        
        return deck;
    }

    // Gestione pausa
    document.getElementById('pause-game').addEventListener('click', () => {
        engine.pauseGame();
    });

    // Inizializza con il menu principale
    showScreen('mainMenu');
});

// Crea temporaneamente DeckBuilder vuoto per evitare errori
window.DeckBuilder = class DeckBuilder {
    constructor() {
        console.log('DeckBuilder non ancora implementato');
    }
};