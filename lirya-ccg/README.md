# 🎮 Lirya CCG - Gioco di Carte Collezionabili Online

Un gioco di carte collezionabili ambientato nel mondo fantasy di Lirya, dove sei il sovrano di una delle città-stato in conflitto e devi costruire il tuo esercito per conquistare il continente.

## 🌟 Caratteristiche

### ⚔️ **Gameplay Strategico**
- **Sistema a zone**: Prima Linea (4 slot), Seconda Linea (4 slot), Strutture (3 slot)
- **6 elementi magici**: Fuoco, Acqua, Terra, Aria, Luce, Ombra
- **4 classi di personaggi**: Guerrieri, Maghi, Ranger, Chierici
- **Modalità 1vs1**: Due giocatori umani si sfidano sullo stesso dispositivo

### 🎯 **5 Mazzi Bilanciati**
1. **🔥 Fuoco Puro** - Aggressione rapida e danni elevati
2. **💧 Controllo Acquatico** - Controllo del campo e pescate extra
3. **🌍 Fortezza di Terra** - Difesa impenetrabile e resistenza
4. **✨ Luce Divina** - Supporto, guarigione e protezione
5. **🌑 Ombre Furtive** - Furtività, controllo e assassinio

### 🎨 **Interfaccia Moderna**
- Design responsivo per desktop e mobile
- Animazioni fluide e effetti visivi
- Log di gioco in tempo reale
- UI intuitiva e accessibile

## 🚀 Avvio Rapido

### **Metodo 1: Server Node.js (Consigliato)**
```bash
# Clona/scarica il progetto
cd lirya-ccg

# Installa dipendenze (opzionale)
npm install

# Avvia il server
npm start
# O direttamente:
node server.js
```

### **Metodo 2: Server Python**
```bash
# Python 3
python -m http.server 3000

# Python 2
python -SimpleHTTPServer 3000
```

### **Metodo 3: Live Server (VS Code)**
1. Installa l'estensione "Live Server" in VS Code
2. Apri la cartella del progetto
3. Click destro su `index.html` → "Open with Live Server"

### **Metodo 4: Apertura diretta**
Apri direttamente `index.html` nel browser (alcune funzionalità potrebbero essere limitate)

## 🎲 Come Giocare

### **Setup Partita**
1. **Selezione Mazzi**: Ogni giocatore sceglie uno dei 5 mazzi disponibili
2. **Inizio Partita**: Click su "🚀 Inizia Partita"

### **Struttura Turno**
1. **Fase Pesca**: Pesca 1 carta dal mazzo
2. **Fase Energia**: Guadagna +1 energia (max 10)
3. **Fase Principale**: Gioca carte, costruisci strutture
4. **Fase Attacco**: Attacca con le tue creature
5. **Fine Turno**: Passa il turno all'avversario

### **Controlli**
- **Click** su una carta per selezionarla
- **"Gioca Carta"** per metterla sul campo
- **"Fase Attacco"** per attaccare con le creature
- **"Fine Turno"** per passare all'avversario

### **Obiettivo**
Riduci i punti vita dell'avversario da 20 a 0 per vincere!

## 🗂️ Struttura del Progetto

```
lirya-ccg/
├── index.html              # Pagina principale
├── package.json            # Configurazione NPM
├── server.js              # Server Node.js locale
├── README.md              # Documentazione
├── css/
│   ├── styles.css         # Stili principali
│   ├── cards.css          # Stili delle carte
│   └── responsive.css     # Stili responsivi
└── js/
    ├── main.js            # File principale
    ├── data/
    │   └── decks.js       # Database dei mazzi
    └── game/
        ├── gameState.js   # Gestione stato
        ├── gameLogic.js   # Logica di gioco
        └── combat.js      # Sistema di combattimento
```

## 🔧 Personalizzazione

### **Aggiungere Nuovi Mazzi**
Modifica `js/data/decks.js`:
```javascript
const deckDatabase = {
    nuovo_mazzo: {
        name: "Nome Mazzo",
        strategy: "Strategia",
        elements: "🌟 Elemento",
        cards: [
            // Array di carte...
        ]
    }
};
```

### **Modificare Carte Esistenti**
Ogni carta ha questa struttura:
```javascript
{
    name: "Nome Carta",
    type: "Personaggio|Struttura|Incantesimo|Equipaggiamento",
    class: "Guerriero|Mago|Ranger|Chierico",
    element: "Fuoco|Acqua|Terra|Aria|Luce|Ombra",
    cost: 3,        // Costo in energia
    att: 4,         // Attacco (solo personaggi)
    def: 2,         // Difesa (solo personaggi)
    hp: 5,          // Punti vita
    rarity: "Comune|Non Comune|Rara|Ultra-Rara|Leggendaria"
}
```

### **Modificare Stili**
- **Colori principali**: `css/styles.css`
- **Stili delle carte**: `css/cards.css`
- **Responsività mobile**: `css/responsive.css`

## 🎯 Strategie dei Mazzi

### **🔥 Fuoco Puro**
- **Pro**: Danni elevati, vittorie rapide, buone creature early-game
- **Contro**: Poca difesa, vulnerabile ai mazzi di controllo
- **Strategia**: Aggredisci rapidamente e mantieni la pressione

### **💧 Controllo Acquatico**
- **Pro**: Controllo del campo, card draw, buone rimozioni
- **Contro**: Lento nell'early game, vulnerabile all'aggressione
- **Strategia**: Sopravvivi all'early game e domina il late game

### **🌍 Fortezza di Terra**
- **Pro**: Difese impenetrabili, creature resistenti, stabilità
- **Contro**: Lento, pochi danni, vulnerabile agli incantesimi
- **Strategia**: Costruisci un muro e vinci per attrition

### **✨ Luce Divina**
- **Pro**: Guarigioni potenti, supporto eccellente, controllo nemici
- **Contro**: Pochi danni diretti, dipendente dalle sinergie
- **Strategia**: Mantieni in vita le tue creature e esaurisci l'avversario

### **🌑 Ombre Furtive**
- **Pro**: Rimozioni precise, danni furtivi, controllo mentale
- **Contro**: Creature fragili, strategia complessa
- **Strategia**: Elimina le minacce chiave e colpisci con precisione

## 🐛 Troubleshooting

### **Il gioco non si carica**
- Controlla che tutti i file siano nella posizione corretta
- Verifica la console del browser (F12) per errori JavaScript
- Prova a svuotare la cache del browser (Ctrl+F5)

### **Errori del server**
- Assicurati che la porta 3000 sia libera
- Prova una porta diversa: `PORT=3001 node server.js`
- Controlla i permessi dei file

### **Prestazioni lente**
- Chiudi altre schede del browser
- Disabilita estensioni non necessarie
- Prova un browser diverso (consigliato Chrome/Firefox)

## 🔄 Prossimi Aggiornamenti

### **v1.1 - Pianificato**
- [ ] Modalità IA vs Giocatore
- [ ] Deck builder personalizzato
- [ ] Salvataggio partite
- [ ] Statistiche dettagliate

### **v1.2 - Futuro**
- [ ] Modalità torneo
- [ ] Nuove classi (Druidi, Assassini, Paladini, Necromanti)
- [ ] Sistema di ranking
- [ ] Multiplayer online

## 🤝 Contribuire

Contributi sono benvenuti! Per favore:
1. Fai un fork del progetto
2. Crea un branch per la tua feature (`git checkout -b feature/nuova-feature`)
3. Committa le tue modifiche (`git commit -m 'Aggiunge nuova feature'`)
4. Pusha sul branch (`git push origin feature/nuova-feature`)
5. Apri una Pull Request

## 📄 Licenza

Questo progetto è rilasciato sotto licenza MIT. Vedi il file `LICENSE` per i dettagli.

## 👥 Credits

- **Game Design**: Ispirato ai classici TCG
- **Art Direction**: Temi fantasy e medievali
- **Programming**: Vanilla JavaScript ES6+
- **UI/UX**: Design moderno e responsivo

---

## 🎮 Buona Partita!

Divertiti a giocare a Lirya CCG! Per domande, suggerimenti, o segnalazioni di bug, apri una issue su GitHub.

**Che le carte siano sempre dalla tua parte! ⚔️🎯**