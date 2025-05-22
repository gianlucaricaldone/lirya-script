// js/data/decks.js - Database dei mazzi

const deckDatabase = {
    fuoco_puro: {
        name: "Fuoco Puro",
        strategy: "Aggressione rapida",
        elements: "🔥 Fuoco",
        description: "Mazzo aggressivo che punta a vincere rapidamente con creature potenti e incantesimi di danno diretto.",
        cards: [
            // Personaggi costo 1 (4 carte)
            {name: "Guardia della Fornace", type: "Personaggio", class: "Guerriero", element: "Fuoco", cost: 1, att: 2, def: 1, hp: 2, rarity: "Comune"},
            {name: "Guardia della Fornace", type: "Personaggio", class: "Guerriero", element: "Fuoco", cost: 1, att: 2, def: 1, hp: 2, rarity: "Comune"},
            {name: "Apprendista della Fiamma", type: "Personaggio", class: "Mago", element: "Fuoco", cost: 1, att: 2, def: 1, hp: 2, rarity: "Comune"},
            {name: "Apprendista della Fiamma", type: "Personaggio", class: "Mago", element: "Fuoco", cost: 1, att: 2, def: 1, hp: 2, rarity: "Comune"},
            
            // Personaggi costo 2 (8 carte)
            {name: "Lanciere di Emberhold", type: "Personaggio", class: "Guerriero", element: "Fuoco", cost: 2, att: 3, def: 1, hp: 3, rarity: "Comune"},
            {name: "Lanciere di Emberhold", type: "Personaggio", class: "Guerriero", element: "Fuoco", cost: 2, att: 3, def: 1, hp: 3, rarity: "Comune"},
            {name: "Ritualista della Cenere", type: "Personaggio", class: "Chierico", element: "Fuoco", cost: 2, att: 2, def: 2, hp: 3, rarity: "Comune"},
            {name: "Ritualista della Cenere", type: "Personaggio", class: "Chierico", element: "Fuoco", cost: 2, att: 2, def: 2, hp: 3, rarity: "Comune"},
            {name: "Iniziato del Fuoco", type: "Personaggio", class: "Mago", element: "Fuoco", cost: 2, att: 3, def: 1, hp: 2, rarity: "Comune"},
            {name: "Iniziato del Fuoco", type: "Personaggio", class: "Mago", element: "Fuoco", cost: 2, att: 3, def: 1, hp: 2, rarity: "Comune"},
            {name: "Forgiatore di Fiamme", type: "Personaggio", class: "Guerriero", element: "Fuoco", cost: 3, att: 4, def: 2, hp: 4, rarity: "Non Comune"},
            {name: "Sciamano del Fuoco", type: "Personaggio", class: "Chierico", element: "Fuoco", cost: 3, att: 3, def: 2, hp: 4, rarity: "Non Comune"},
            
            // Personaggi costo 3-4 (6 carte)
            {name: "Kaira", type: "Personaggio", class: "Guerriero", element: "Fuoco", cost: 3, att: 4, def: 2, hp: 4, rarity: "Non Comune"},
            {name: "Lama d'Élite", type: "Personaggio", class: "Guerriero", element: "Fuoco", cost: 3, att: 4, def: 2, hp: 3, rarity: "Non Comune"},
            {name: "Vulkan", type: "Personaggio", class: "Guerriero", element: "Fuoco", cost: 4, att: 5, def: 3, hp: 4, rarity: "Rara"},
            {name: "Pyromastro", type: "Personaggio", class: "Mago", element: "Fuoco", cost: 5, att: 5, def: 2, hp: 4, rarity: "Rara"},
            
            // Personaggi costo alto (2 carte)
            {name: "Markov", type: "Personaggio", class: "Guerriero", element: "Fuoco", cost: 5, att: 5, def: 3, hp: 6, rarity: "Rara"},
            {name: "Ignius", type: "Personaggio", class: "Mago", element: "Fuoco", cost: 6, att: 6, def: 1, hp: 4, rarity: "Rara"},
            
            // Strutture (8 carte)
            {name: "Altare del Fuoco", type: "Struttura", element: "Fuoco", cost: 2, hp: 6, rarity: "Non Comune"},
            {name: "Altare del Fuoco", type: "Struttura", element: "Fuoco", cost: 2, hp: 6, rarity: "Non Comune"},
            {name: "Campo di Addestramento", type: "Struttura", cost: 2, hp: 5, rarity: "Comune"},
            {name: "Campo di Addestramento", type: "Struttura", cost: 2, hp: 5, rarity: "Comune"},
            {name: "Monte Kazan", type: "Struttura", element: "Fuoco", cost: 2, hp: 5, rarity: "Comune"},
            {name: "Arsenale di Guerra", type: "Struttura", cost: 3, hp: 6, rarity: "Non Comune"},
            {name: "Deserto di Kharram", type: "Struttura", element: "Fuoco", cost: 4, hp: 8, rarity: "Rara"},
            {name: "Salone dei Guerrieri", type: "Struttura", element: "Fuoco", cost: 3, hp: 7, rarity: "Rara"},
            
            // Incantesimi (6 carte)
            {name: "Palla di Fuoco", type: "Incantesimo", element: "Fuoco", cost: 3, damage: 4, rarity: "Comune"},
            {name: "Palla di Fuoco", type: "Incantesimo", element: "Fuoco", cost: 3, damage: 4, rarity: "Comune"},
            {name: "Scudo di Fiamme", type: "Incantesimo", element: "Fuoco", cost: 2, attBonus: 2, rarity: "Comune"},
            {name: "Scudo di Fiamme", type: "Incantesimo", element: "Fuoco", cost: 2, attBonus: 2, rarity: "Comune"},
            {name: "Esplosione Minore", type: "Incantesimo", element: "Fuoco", cost: 3, aoe: 2, rarity: "Non Comune"},
            {name: "Tempesta di Fiamme", type: "Incantesimo", element: "Fuoco", cost: 5, aoe: 3, rarity: "Rara"},
            
            // Equipaggiamenti (2 carte)
            {name: "Spada del Valoroso", type: "Equipaggiamento", cost: 2, attBonus: 2, rarity: "Comune"},
            {name: "Ascia del Berserker", type: "Equipaggiamento", cost: 2, attBonus: 3, defMalus: 1, rarity: "Non Comune"}
        ]
    },

    acqua_controllo: {
        name: "Controllo Acquatico",
        strategy: "Controllo e difesa",
        elements: "💧 Acqua",
        description: "Mazzo difensivo che controlla il gioco attraverso pescate extra, rimozioni e guarigioni.",
        cards: [
            // Personaggi costo 1 (4 carte)
            {name: "Pattugliatore Costiero", type: "Personaggio", class: "Guerriero", element: "Acqua", cost: 1, att: 1, def: 2, hp: 2, rarity: "Comune"},
            {name: "Pattugliatore Costiero", type: "Personaggio", class: "Guerriero", element: "Acqua", cost: 1, att: 1, def: 2, hp: 2, rarity: "Comune"},
            {name: "Studioso delle Correnti", type: "Personaggio", class: "Mago", element: "Acqua", cost: 1, att: 1, def: 1, hp: 3, rarity: "Comune"},
            {name: "Studioso delle Correnti", type: "Personaggio", class: "Mago", element: "Acqua", cost: 1, att: 1, def: 1, hp: 3, rarity: "Comune"},
            
            // Personaggi costo 2 (8 carte)
            {name: "Sacerdote delle Onde", type: "Personaggio", class: "Chierico", element: "Acqua", cost: 2, att: 1, def: 2, hp: 4, rarity: "Comune"},
            {name: "Sacerdote delle Onde", type: "Personaggio", class: "Chierico", element: "Acqua", cost: 2, att: 1, def: 2, hp: 4, rarity: "Comune"},
            {name: "Navigatore Fluviale", type: "Personaggio", class: "Ranger", element: "Acqua", cost: 2, att: 2, def: 2, hp: 3, rarity: "Comune"},
            {name: "Navigatore Fluviale", type: "Personaggio", class: "Ranger", element: "Acqua", cost: 2, att: 2, def: 2, hp: 3, rarity: "Comune"},
            {name: "Invocatore d'Acqua", type: "Personaggio", class: "Mago", element: "Acqua", cost: 2, att: 2, def: 1, hp: 3, rarity: "Comune"},
            {name: "Evocatore di Flussi", type: "Personaggio", class: "Mago", element: "Acqua", cost: 3, att: 3, def: 2, hp: 4, rarity: "Non Comune"},
            {name: "Sacerdotessa dell'Oceano", type: "Personaggio", class: "Chierico", element: "Acqua", cost: 2, att: 1, def: 2, hp: 4, rarity: "Non Comune"},
            {name: "Guardiano del Reef", type: "Personaggio", class: "Guerriero", element: "Acqua", cost: 3, att: 2, def: 4, hp: 5, rarity: "Non Comune"},
            
            // Personaggi costo 3-4 (6 carte)
            {name: "Thorne", type: "Personaggio", class: "Guerriero", element: "Acqua", cost: 4, att: 3, def: 4, hp: 5, rarity: "Non Comune"},
            {name: "Elissa", type: "Personaggio", class: "Mago", element: "Acqua", cost: 3, att: 3, def: 2, hp: 4, rarity: "Non Comune"},
            {name: "Lyra", type: "Personaggio", class: "Guerriero", element: "Acqua", cost: 4, att: 4, def: 4, hp: 5, rarity: "Rara"},
            {name: "Ondina", type: "Personaggio", class: "Mago", element: "Acqua", cost: 4, att: 4, def: 2, hp: 5, rarity: "Rara"},
            
            // Personaggi costo alto (2 carte)
            {name: "Profondo Maremoto", type: "Personaggio", class: "Guerriero", element: "Acqua", cost: 5, att: 3, def: 5, hp: 6, rarity: "Rara"},
            {name: "Arika", type: "Personaggio", class: "Chierico", element: "Acqua", cost: 5, att: 3, def: 3, hp: 6, rarity: "Rara"},
            
            // Strutture (10 carte)
            {name: "Altare dell'Acqua", type: "Struttura", element: "Acqua", cost: 2, hp: 6, rarity: "Non Comune"},
            {name: "Altare dell'Acqua", type: "Struttura", element: "Acqua", cost: 2, hp: 6, rarity: "Non Comune"},
            {name: "Biblioteca Arcana", type: "Struttura", cost: 2, hp: 5, rarity: "Comune"},
            {name: "Biblioteca Arcana", type: "Struttura", cost: 2, hp: 5, rarity: "Comune"},
            {name: "Mare di Navar", type: "Struttura", element: "Acqua", cost: 3, hp: 6, rarity: "Non Comune"},
            {name: "Isole di Welwater", type: "Struttura", element: "Acqua", cost: 4, hp: 8, rarity: "Rara"},
            {name: "Santuario di Guarigione", type: "Struttura", cost: 3, hp: 6, rarity: "Non Comune"},
            {name: "Osservatorio Stellare", type: "Struttura", cost: 4, hp: 7, rarity: "Rara"},
            {name: "Accademia Arcana", type: "Struttura", cost: 4, hp: 7, rarity: "Rara"},
            {name: "Collegium delle Profondità", type: "Struttura", element: "Acqua", cost: 3, hp: 7, rarity: "Rara"},
            
            // Incantesimi (5 carte)
            {name: "Corrente Risanatrice", type: "Incantesimo", element: "Acqua", cost: 2, healing: 3, rarity: "Comune"},
            {name: "Corrente Risanatrice", type: "Incantesimo", element: "Acqua", cost: 2, healing: 3, rarity: "Comune"},
            {name: "Dardo di Ghiaccio", type: "Incantesimo", element: "Acqua", cost: 2, damage: 2, rarity: "Comune"},
            {name: "Nebbia", type: "Incantesimo", element: "Acqua", cost: 3, control: true, rarity: "Non Comune"},
            {name: "Maremoto", type: "Incantesimo", element: "Acqua", cost: 5, aoe: 2, rarity: "Rara"},
            
            // Equipaggiamenti (1 carta)
            {name: "Bastone Elementale", type: "Equipaggiamento", cost: 2, attBonus: 1, rarity: "Comune"}
        ]
    },

    terra_fortezza: {
        name: "Fortezza di Terra",
        strategy: "Difesa e resistenza",
        elements: "🌍 Terra",
        description: "Mazzo difensivo che costruisce un muro impenetrabile e vince attraverso la resistenza.",
        cards: [
            // Personaggi costo 1 (4 carte)
            {name: "Sentinella di Roccia", type: "Personaggio", class: "Guerriero", element: "Terra", cost: 1, att: 1, def: 3, hp: 2, rarity: "Comune"},
            {name: "Sentinella di Roccia", type: "Personaggio", class: "Guerriero", element: "Terra", cost: 1, att: 1, def: 3, hp: 2, rarity: "Comune"},
            {name: "Apprendista Geomante", type: "Personaggio", class: "Mago", element: "Terra", cost: 1, att: 1, def: 2, hp: 2, rarity: "Comune"},
            {name: "Apprendista Geomante", type: "Personaggio", class: "Mago", element: "Terra", cost: 1, att: 1, def: 2, hp: 2, rarity: "Comune"},
            
            // Personaggi costo 2 (8 carte)
            {name: "Custode della Pietra", type: "Personaggio", class: "Chierico", element: "Terra", cost: 2, att: 1, def: 3, hp: 3, rarity: "Comune"},
            {name: "Custode della Pietra", type: "Personaggio", class: "Chierico", element: "Terra", cost: 2, att: 1, def: 3, hp: 3, rarity: "Comune"},
            {name: "Esploratore Montano", type: "Personaggio", class: "Ranger", element: "Terra", cost: 2, att: 2, def: 3, hp: 2, rarity: "Comune"},
            {name: "Esploratore Montano", type: "Personaggio", class: "Ranger", element: "Terra", cost: 2, att: 2, def: 3, hp: 2, rarity: "Comune"},
            {name: "Guardiano di Roccia", type: "Personaggio", class: "Guerriero", element: "Terra", cost: 2, att: 2, def: 3, hp: 4, rarity: "Non Comune"},
            {name: "Guardiano di Roccia", type: "Personaggio", class: "Guerriero", element: "Terra", cost: 2, att: 2, def: 3, hp: 4, rarity: "Non Comune"},
            {name: "Geomante", type: "Personaggio", class: "Mago", element: "Terra", cost: 3, att: 2, def: 3, hp: 4, rarity: "Non Comune"},
            {name: "Balista Vivente", type: "Personaggio", class: "Ranger", element: "Terra", cost: 3, att: 4, def: 1, hp: 3, rarity: "Non Comune"},
            
            // Personaggi costo 3-4 (6 carte)
            {name: "Druido Iniziato", type: "Personaggio", class: "Chierico", element: "Terra", cost: 3, att: 2, def: 3, hp: 4, rarity: "Non Comune"},
            {name: "Barbaro delle Montagne", type: "Personaggio", class: "Guerriero", element: "Terra", cost: 3, att: 4, def: 2, hp: 3, rarity: "Non Comune"},
            {name: "Geologo Mistico", type: "Personaggio", class: "Mago", element: "Terra", cost: 4, att: 3, def: 3, hp: 5, rarity: "Rara"},
            {name: "Custode della Montagna", type: "Personaggio", class: "Guerriero", element: "Terra", cost: 5, att: 3, def: 6, hp: 6, rarity: "Rara"},
            {name: "Thoran", type: "Personaggio", class: "Chierico", element: "Terra", cost: 5, att: 2, def: 5, hp: 7, rarity: "Rara"},
            
            // Personaggi costo alto (2 carte)
            {name: "Gorlok il Saldo", type: "Personaggio", class: "Guerriero", element: "Terra", cost: 6, att: 4, def: 6, hp: 7, rarity: "Rara"},
            {name: "Skarn", type: "Personaggio", class: "Guerriero", element: "Terra", cost: 7, att: 5, def: 6, hp: 8, rarity: "Ultra-Rara"},
            
            // Strutture (9 carte)
            {name: "Altare della Terra", type: "Struttura", element: "Terra", cost: 2, hp: 6, rarity: "Non Comune"},
            {name: "Altare della Terra", type: "Struttura", element: "Terra", cost: 2, hp: 6, rarity: "Non Comune"},
            {name: "Montagne di Grimspire", type: "Struttura", element: "Terra", cost: 4, hp: 8, rarity: "Rara"},
            {name: "Fortezza", type: "Struttura", cost: 4, hp: 8, rarity: "Rara"},
            {name: "Monumento dell'Eroe", type: "Struttura", cost: 4, hp: 7, rarity: "Rara"},
            {name: "Gilda della Pietra", type: "Struttura", element: "Terra", cost: 3, hp: 7, rarity: "Rara"},
            {name: "Campo di Addestramento", type: "Struttura", cost: 2, hp: 5, rarity: "Comune"},
            {name: "Avamposto di Frontiera", type: "Struttura", cost: 2, hp: 5, rarity: "Comune"},
            {name: "Miniera di Cristalli", type: "Struttura", element: "Terra", cost: 2, hp: 5, rarity: "Comune"},
            
            // Incantesimi (4 carte)
            {name: "Scudo di Pietra", type: "Incantesimo", element: "Terra", cost: 2, defBonus: 3, rarity: "Comune"},
            {name: "Scudo di Pietra", type: "Incantesimo", element: "Terra", cost: 2, defBonus: 3, rarity: "Comune"},
            {name: "Rinforzo", type: "Incantesimo", element: "Terra", cost: 3, attBonus: 1, defBonus: 1, hpBonus: 2, rarity: "Non Comune"},
            {name: "Terremoto", type: "Incantesimo", element: "Terra", cost: 6, structureDamage: true, rarity: "Rara"},
            
            // Equipaggiamenti (3 carte)
            {name: "Armatura di Piastre", type: "Equipaggiamento", cost: 4, defBonus: 3, rarity: "Rara"},
            {name: "Scudo del Bastione", type: "Equipaggiamento", cost: 3, defBonus: 2, hpBonus: 1, rarity: "Non Comune"},
            {name: "Simbolo Sacro", type: "Equipaggiamento", cost: 2, healingBonus: 1, rarity: "Comune"}
        ]
    },

    luce_supporto: {
        name: "Luce Divina",
        strategy: "Supporto e guarigione",
        elements: "✨ Luce",
        description: "Mazzo di supporto che mantiene in vita le proprie creature e punisce quelle nemiche.",
        cards: [
            // Personaggi costo 1 (4 carte)
            {name: "Iniziato Luminoso", type: "Personaggio", class: "Chierico", element: "Luce", cost: 1, att: 1, def: 1, hp: 3, rarity: "Comune"},
            {name: "Iniziato Luminoso", type: "Personaggio", class: "Chierico", element: "Luce", cost: 1, att: 1, def: 1, hp: 3, rarity: "Comune"},
            {name: "Iniziato di Dawnfield", type: "Personaggio", class: "Guerriero", element: "Luce", cost: 1, att: 1, def: 1, hp: 3, rarity: "Comune"},
            {name: "Iniziato di Dawnfield", type: "Personaggio", class: "Guerriero", element: "Luce", cost: 1, att: 1, def: 1, hp: 3, rarity: "Comune"},
            
            // Personaggi costo 2 (8 carte)
            {name: "Cercatore di Verità", type: "Personaggio", class: "Ranger", element: "Luce", cost: 2, att: 2, def: 2, hp: 3, rarity: "Comune"},
            {name: "Cercatore di Verità", type: "Personaggio", class: "Ranger", element: "Luce", cost: 2, att: 2, def: 2, hp: 3, rarity: "Comune"},
            {name: "Paladino Novizio", type: "Personaggio", class: "Guerriero", element: "Luce", cost: 2, att: 2, def: 3, hp: 3, rarity: "Comune"},
            {name: "Paladino Novizio", type: "Personaggio", class: "Guerriero", element: "Luce", cost: 2, att: 2, def: 3, hp: 3, rarity: "Comune"},
            {name: "Guaritore di Dawnfield", type: "Personaggio", class: "Chierico", element: "Luce", cost: 2, att: 1, def: 2, hp: 4, rarity: "Comune"},
            {name: "Soldato di Luce", type: "Personaggio", class: "Guerriero", element: "Luce", cost: 2, att: 2, def: 2, hp: 3, rarity: "Comune"},
            {name: "Illuminatore", type: "Personaggio", class: "Mago", element: "Luce", cost: 3, att: 3, def: 2, hp: 3, rarity: "Non Comune"},
            {name: "Sentinella dell'Alba", type: "Personaggio", class: "Ranger", element: "Luce", cost: 2, att: 2, def: 2, hp: 3, rarity: "Non Comune"},
            
            // Personaggi costo 3-4 (6 carte)
            {name: "Chierico di Battaglia", type: "Personaggio", class: "Chierico", element: "Luce", cost: 3, att: 2, def: 3, hp: 4, rarity: "Non Comune"},
            {name: "Chierico di Battaglia", type: "Personaggio", class: "Chierico", element: "Luce", cost: 3, att: 2, def: 3, hp: 4, rarity: "Non Comune"},
            {name: "Guaritore Radiante", type: "Personaggio", class: "Chierico", element: "Luce", cost: 4, att: 2, def: 3, hp: 6, rarity: "Rara"},
            {name: "Campione Luminoso", type: "Personaggio", class: "Guerriero", element: "Luce", cost: 5, att: 4, def: 4, hp: 5, rarity: "Rara"},
            {name: "Seraphina", type: "Personaggio", class: "Mago", element: "Luce", cost: 5, att: 4, def: 2, hp: 5, rarity: "Rara"},
            {name: "Lumina la Luminosa", type: "Personaggio", class: "Ranger", element: "Luce", cost: 5, att: 5, def: 2, hp: 5, rarity: "Rara"},
            
            // Personaggi costo alto (2 carte)
            {name: "Aurelian Truthseer", type: "Personaggio", class: "Chierico", element: "Luce", cost: 8, att: 4, def: 4, hp: 7, rarity: "Leggendaria"},
            {name: "Serafina Oracolo", type: "Personaggio", class: "Chierico", element: "Luce", cost: 7, att: 3, def: 4, hp: 6, rarity: "Ultra-Rara"},
            
            // Strutture (9 carte)
            {name: "Altare della Luce", type: "Struttura", element: "Luce", cost: 2, hp: 6, rarity: "Non Comune"},
            {name: "Altare della Luce", type: "Struttura", element: "Luce", cost: 2, hp: 6, rarity: "Non Comune"},
            {name: "Reliquiario Sacro", type: "Struttura", element: "Luce", cost: 4, hp: 7, rarity: "Rara"},
            {name: "Santuario di Guarigione", type: "Struttura", cost: 3, hp: 6, rarity: "Non Comune"},
            {name: "Altare di Preghiera", type: "Struttura", cost: 2, hp: 5, rarity: "Comune"},
            {name: "Prisma dell'Illuminazione", type: "Struttura", element: "Luce", cost: 3, hp: 7, rarity: "Rara"},
            {name: "Tempio Antico", type: "Struttura", element: "Luce", cost: 4, hp: 7, rarity: "Rara"},
            {name: "Torre di Guardia", type: "Struttura", cost: 3, hp: 6, rarity: "Non Comune"},
            {name: "Lago Specchio", type: "Struttura", element: "Luce", cost: 2, hp: 5, rarity: "Comune"},
            
            // Incantesimi (5 carte)
            {name: "Bagliore Curativo", type: "Incantesimo", element: "Luce", cost: 3, healing: 4, rarity: "Comune"},
            {name: "Bagliore Curativo", type: "Incantesimo", element: "Luce", cost: 3, healing: 4, rarity: "Comune"},
            {name: "Benedizione della Luce", type: "Incantesimo", element: "Luce", cost: 3, attBonus: 1, defBonus: 1, rarity: "Non Comune"},
            {name: "Nova Radiosa", type: "Incantesimo", element: "Luce", cost: 6, healing: 2, aoe: true, rarity: "Rara"},
            {name: "Giudizio Divino", type: "Incantesimo", element: "Luce", cost: 5, destroy: true, rarity: "Rara"},
            
            // Equipaggiamenti (2 carte)
            {name: "Reliquia Ancestrale", type: "Equipaggiamento", cost: 4, healingBonus: 3, rarity: "Rara"},
            {name: "Incensiere Benedetto", type: "Equipaggiamento", cost: 3, aura: 1, rarity: "Non Comune"}
        ]
    },

    ombra_furtivita: {
        name: "Ombre Furtive",
        strategy: "Furtività e controllo",
        elements: "🌑 Ombra",
        description: "Mazzo di controllo che elimina le minacce nemiche e colpisce con attacchi furtivi.",
        cards: [
            // Personaggi costo 1 (4 carte)
            {name: "Guardia Notturna", type: "Personaggio", class: "Guerriero", element: "Ombra", cost: 1, att: 2, def: 1, hp: 2, rarity: "Comune"},
            {name: "Guardia Notturna", type: "Personaggio", class: "Guerriero", element: "Ombra", cost: 1, att: 2, def: 1, hp: 2, rarity: "Comune"},
            {name: "Apprendista delle Ombre", type: "Personaggio", class: "Mago", element: "Ombra", cost: 1, att: 2, def: 1, hp: 2, rarity: "Comune"},
            {name: "Apprendista delle Ombre", type: "Personaggio", class: "Mago", element: "Ombra", cost: 1, att: 2, def: 1, hp: 2, rarity: "Comuni"},
            
            // Personaggi costo 2 (8 carte)
            {name: "Ricognitore delle Ombre", type: "Personaggio", class: "Ranger", element: "Ombra", cost: 2, att: 3, def: 1, hp: 3, rarity: "Comune"},
            {name: "Ricognitore delle Ombre", type: "Personaggio", class: "Ranger", element: "Ombra", cost: 2, att: 3, def: 1, hp: 3, rarity: "Comune"},
            {name: "Cultista del Mistero", type: "Personaggio", class: "Chierico", element: "Ombra", cost: 2, att: 2, def: 1, hp: 4, rarity: "Comune"},
            {name: "Cultista del Mistero", type: "Personaggio", class: "Chierico", element: "Ombra", cost: 2, att: 2, def: 1, hp: 4, rarity: "Comune"},
            {name: "Assassino del Velo", type: "Personaggio", class: "Guerriero", element: "Ombra", cost: 2, att: 3, def: 1, hp: 3, rarity: "Comune"},
            {name: "Sicario", type: "Personaggio", class: "Ranger", element: "Ombra", cost: 2, att: 3, def: 1, hp: 3, rarity: "Non Comune"},
            {name: "Adepto delle Ombre", type: "Personaggio", class: "Chierico", element: "Ombra", cost: 2, att: 2, def: 2, hp: 3, rarity: "Non Comune"},
            {name: "Cultista dell'Ombra", type: "Personaggio", class: "Chierico", element: "Ombra", cost: 2, att: 2, def: 2, hp: 3, rarity: "Non Comune"},
            
            // Personaggi costo 3-4 (6 carte)
            {name: "Tessitore d'Ombre", type: "Personaggio", class: "Mago", element: "Ombra", cost: 3, att: 4, def: 1, hp: 3, rarity: "Non Comune"},
            {name: "Sussurratore d'Ombre", type: "Personaggio", class: "Mago", element: "Ombra", cost: 4, att: 5, def: 1, hp: 4, rarity: "Rara"},
            {name: "Assassino Notturno", type: "Personaggio", class: "Ranger", element: "Ombra", cost: 4, att: 6, def: 1, hp: 4, rarity: "Rara"},
            {name: "Cacciatore del Crepuscolo", type: "Personaggio", class: "Ranger", element: "Ombra", cost: 2, att: 3, def: 1, hp: 3, rarity: "Non Comune"},
            {name: "Sussurratore di Segreti", type: "Personaggio", class: "Chierico", element: "Ombra", cost: 2, att: 2, def: 1, hp: 4, rarity: "Non Comune"},
            {name: "Velkar", type: "Personaggio", class: "Guerriero", element: "Ombra", cost: 5, att: 6, def: 2, hp: 5, rarity: "Rara"},
            
            // Personaggi costo alto (2 carte)
            {name: "Malachi l'Oscuro", type: "Personaggio", class: "Mago", element: "Ombra", cost: 6, att: 6, def: 1, hp: 5, rarity: "Rara"},
            {name: "Malachai Nightweaver", type: "Personaggio", class: "Mago", element: "Ombra", cost: 10, att: 9, def: 1, hp: 6, rarity: "Leggendaria"},
            
            // Strutture (8 carte)
            {name: "Altare dell'Ombra", type: "Struttura", element: "Ombra", cost: 2, hp: 6, rarity: "Non Comune"},
            {name: "Altare dell'Ombra", type: "Struttura", element: "Ombra", cost: 2, hp: 6, rarity: "Non Comune"},
            {name: "Paludi di Gloomwillow", type: "Struttura", element: "Ombra", cost: 3, hp: 6, rarity: "Non Comune"},
            {name: "Foresta Sussurrante", type: "Struttura", element: "Ombra", cost: 2, hp: 5, rarity: "Comune"},
            {name: "Rifugio Segreto", type: "Struttura", cost: 4, hp: 7, rarity: "Rara"},
            {name: "Congrega dell'Ombra", type: "Struttura", element: "Ombra", cost: 3, hp: 7, rarity: "Rara"},
            {name: "Valle di Murmur", type: "Struttura", cost: 3, hp: 6, rarity: "Non Comune"},
            {name: "Cerchio Rituale", type: "Struttura", element: "Ombra", cost: 3, hp: 6, rarity: "Non Comune"},
            
            // Incantesimi (6 carte)
            {name: "Tocco Vampirico", type: "Incantesimo", element: "Ombra", cost: 3, damage: 2, healing: 2, rarity: "Comune"},
            {name: "Tocco Vampirico", type: "Incantesimo", element: "Ombra", cost: 3, damage: 2, healing: 2, rarity: "Comune"},
            {name: "Velo Oscuro", type: "Incantesimo", element: "Ombra", cost: 2, stealth: true, rarity: "Comune"},
            {name: "Incubo", type: "Incantesimo", element: "Ombra", cost: 3, debuff: true, rarity: "Non Comune"},
            {name: "Mietitore d'Anime", type: "Incantesimo", element: "Ombra", cost: 5, destroy: true, rarity: "Rara"},
            {name: "Eclissi", type: "Incantesimo", element: "Ombra", cost: 7, massDebuff: true, rarity: "Rara"},
            
            // Equipaggiamenti (2 carte)
            {name: "Pugnali Gemelli", type: "Equipaggiamento", cost: 3, attBonus: 1, doubleAttack: true, rarity: "Non Comune"},
            {name: "Mantello del Viaggiatore", type: "Equipaggiamento", cost: 2, defBonus: 1, mobility: true, rarity: "Comune"}
        ]
    }
};

// Esporta il database per l'uso in altri file
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { deckDatabase };
}