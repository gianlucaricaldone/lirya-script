# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Lirya Card Viewer is a static web application for browsing, filtering, and printing collectible cards for the Lirya card game. It uses SVG templates for rendering cards dynamically and supports PDF generation for physical printing.

## Commands

**Development Server:**
```bash
python3 -m http.server 8000
```

**Update Card Data:**
```bash
cd data
./create_json.sh
```
This merges card data from external JSON files and copies SVG templates.

## Architecture

### Module Structure
- **app.js**: Main controller that initializes all modules and manages global state
- **card-renderer.js**: Handles SVG template rendering with dynamic data substitution
- **filter.js**: Implements filtering logic with event-driven updates
- **modal.js**: Controls card detail modal display
- **card-printer.js**: Generates PDFs using jsPDF and html2canvas

### Data Flow
1. Cards loaded from `data/cards.json` on startup
2. Filter changes trigger custom 'filtersChanged' events
3. App.js listens to filter events and updates card display
4. Cards rendered using SVG templates with placeholder substitution

### SVG Template System
Templates in `svg-templates/` use placeholders like `{name}`, `{cost}`, `{description}` that are replaced with actual card data. Different templates exist for:
- Carta Personaggio: `/svg-templates/card-character.svg`
- Carta Incantesimo: `/svg-templates/card-spell.svg`
- Carta Struttura: `/svg-templates/card-structure.svg`
- Carta Strumento: `/svg-templates/card-equipment.svg`

### Card Properties
Key card attributes: id, name, type, element, rarity, cost, attack, defense, description, abilities, class, image (PNG filename).

## Important Files

- **Game Rules**: `/documentation/lirya_complete_rules.md` - Complete game mechanics and rules
- **Card Data**: `/data/cards.json` - All card definitions
- **Custom Decks**: `/data/mazzi_custom.json` - Custom deck configurations

## External Dependencies
- jsPDF and html2canvas (loaded from CDN for PDF generation)
- No build tools or npm packages required

## Card Abilities JSON Structure

Le abilità delle carte devono seguire questa struttura JSON per essere utilizzabili nel gioco:

### Struttura Base
```json
{
  "abilities": [
    {
      "name": "Nome Abilità",
      "description": "Testo descrittivo per il giocatore",
      "type": "passive|activated|triggered|aura",
      "trigger": "always|on_play|on_death|on_damage_taken|start_of_turn|end_of_turn|on_attack|while_in_zone",
      "cost": {
        "energy": 2,
        "element": "Fuoco",
        "tap": true,
        "sacrifice": false
      },
      "condition": {
        // Condizioni opzionali per l'attivazione
      },
      "effects": [
        {
          "type": "damage|heal|stat_modifier|draw_card|immunity|summon|destroy",
          "target": "self|target|all_enemies|all_allies|random_enemy",
          "value": 3,
          "duration": "permanent|until_end_of_turn|turns:2"
        }
      ]
    }
  ]
}
```

### Tipi di Abilità

#### 1. **Passive** - Sempre attive
```json
{
  "name": "Forza del Titano",
  "description": "+2 ATT quando in Prima Linea",
  "type": "passive",
  "trigger": "while_in_zone",
  "condition": {
    "zone": "firstLine"
  },
  "effects": [
    {
      "type": "stat_modifier",
      "target": "self",
      "stat": "attack",
      "value": 2
    }
  ]
}
```

#### 2. **Activated** - Richiedono attivazione manuale
```json
{
  "name": "Palla di Fuoco",
  "description": "Paga 2 Fuoco: Infliggi 3 danni a un bersaglio",
  "type": "activated",
  "cost": {
    "energy": 2,
    "element": "Fuoco"
  },
  "effects": [
    {
      "type": "damage",
      "target": "single",
      "target_type": ["creature", "player"],
      "value": 3
    }
  ]
}
```

#### 3. **Triggered** - Si attivano automaticamente su eventi
```json
{
  "name": "Vendetta",
  "description": "Quando subisce danno, infligge 1 danno all'attaccante",
  "type": "triggered",
  "trigger": "on_damage_taken",
  "effects": [
    {
      "type": "damage",
      "target": "damage_source",
      "value": 1
    }
  ]
}
```

#### 4. **Aura** - Effetti globali continui
```json
{
  "name": "Ispirazione del Comandante",
  "description": "Le altre tue creature hanno +1/+1",
  "type": "aura",
  "trigger": "always",
  "effects": [
    {
      "type": "stat_modifier",
      "target": "allied_creatures",
      "filter": {
        "exclude_self": true
      },
      "stat": "attack",
      "value": 1
    },
    {
      "type": "stat_modifier",
      "target": "allied_creatures",
      "filter": {
        "exclude_self": true
      },
      "stat": "defense",
      "value": 1
    }
  ]
}
```

### Trigger Disponibili
- `always`: Sempre attivo
- `on_play`: Quando la carta entra in gioco
- `on_death`: Quando la carta muore
- `on_damage_taken`: Quando subisce danno
- `start_of_turn`: All'inizio del turno
- `end_of_turn`: Alla fine del turno
- `on_attack`: Quando attacca
- `on_block`: Quando blocca
- `while_in_zone`: Mentre si trova in una zona specifica

### Tipi di Effetti
- `damage`: Infligge danni
- `heal`: Cura punti vita
- `stat_modifier`: Modifica ATT/DIF/PV
- `draw_card`: Pesca carte
- `immunity`: Immunità a certi effetti
- `summon`: Evoca creature
- `destroy`: Distrugge permanenti
- `ability_grant`: Concede abilità (es: haste, flying)
- `damage_reduction`: Riduce i danni subiti

### Target Disponibili
- `self`: La carta stessa
- `target`: Bersaglio singolo scelto
- `all_enemies`: Tutti i nemici
- `all_allies`: Tutti gli alleati
- `allied_creatures`: Tutte le creature alleate
- `enemy_creatures`: Tutte le creature nemiche
- `random_enemy`: Nemico casuale
- `damage_source`: Chi ha causato il danno

### Esempi di Conversione

**PRIMA (formato attuale):**
```json
{
  "abilities": [
    {
      "name": "Resistenza al Calore",
      "effect": "Non può essere bersaglio di incantesimi Fuoco."
    }
  ]
}
```

**DOPO (formato migliorato):**
```json
{
  "abilities": [
    {
      "name": "Resistenza al Calore",
      "description": "Non può essere bersaglio di incantesimi Fuoco",
      "type": "passive",
      "trigger": "always",
      "effects": [
        {
          "type": "immunity",
          "target": "self",
          "condition": {
            "source_type": "spell",
            "source_element": "Fuoco"
          }
        }
      ]
    }
  ]
}
```

## Note Importanti

Per le regole e le meccaniche del gioco fai riferimento al file /Users/gianlucaricaldone/Progetti/Drive/LIRYA/script/lirya-card-viewer/documentation/lirya_complete_rules.md

Le carte di Lirya sono nel file /Users/gianlucaricaldone/Progetti/Drive/LIRYA/script/lirya-card-viewer/data/cards.json

I template sono dei file svg che vengono popolati per generare le varie carte con i valori contenuti in cards.json

I file svg corrispondenti alle tipologie di carte sono i seguenti:
- Carta Personaggio: /Users/gianlucaricaldone/Progetti/Drive/LIRYA/script/lirya-card-viewer/svg-templates/card-character.svg
- Carta Incantesimo: /Users/gianlucaricaldone/Progetti/Drive/LIRYA/script/lirya-card-viewer/svg-templates/card-spell.svg
- Carta Struttura: /Users/gianlucaricaldone/Progetti/Drive/LIRYA/script/lirya-card-viewer/svg-templates/card-structure.svg
- Carta Strumento: /Users/gianlucaricaldone/Progetti/Drive/LIRYA/script/lirya-card-viewer/svg-templates/card-equipment.svg