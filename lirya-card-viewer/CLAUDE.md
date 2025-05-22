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


Per le regole e le meccaniche del gioco fai riferimento al file /Users/gianlucaricaldone/Progetti/Drive/LIRYA/script/lirya-card-viewer/documentation/lirya_complete_rules.md

Le carte di Lirya sono nel file /Users/gianlucaricaldone/Progetti/Drive/LIRYA/script/lirya-card-viewer/data/cards.json

I template sono dei file svg che vengono popolati per generare le varie carte con i valori contenuti in cards.json

I file svg corrispondenti alle tipologie di carte sono i seguenti:
- Carta Personaggio: /Users/gianlucaricaldone/Progetti/Drive/LIRYA/script/lirya-card-viewer/svg-templates/card-character.svg
- Carta Incantesimo: /Users/gianlucaricaldone/Progetti/Drive/LIRYA/script/lirya-card-viewer/svg-templates/card-spell.svg
- Carta Struttura: /Users/gianlucaricaldone/Progetti/Drive/LIRYA/script/lirya-card-viewer/svg-templates/card-structure.svg
- Carta Strumento: /Users/gianlucaricaldone/Progetti/Drive/LIRYA/script/lirya-card-viewer/svg-templates/card-equipment.svg