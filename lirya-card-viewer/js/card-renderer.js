/**
 * Modulo per il rendering delle carte
 */
const CardRenderer = (() => {
    // Costanti per il rendering delle carte
    const CARD_COLORS = {
        Fuoco: '#e74c3c',
        Acqua: '#3498db',
        Terra: '#8e44ad',
        Aria: '#2ecc71',
        Luce: '#f1c40f',
        Ombra: '#34495e'
    };

    // Colori di sfondo per le icone (versioni più chiare per contrasto)
    const ICON_BG_COLORS = {
        // Elementi - colori pastello/chiari
        element: {
            Fuoco: '#ffebee',      // Rosa molto chiaro
            Acqua: '#e3f2fd',      // Azzurro molto chiaro
            Terra: '#f3e5f5',      // Lavanda molto chiaro
            Aria: '#e8f5e9',       // Verde molto chiaro
            Luce: '#fffde7',       // Giallo molto chiaro
            Ombra: '#eceff1'       // Grigio molto chiaro
        },
        // Classi - colori chiari complementari
        class: {
            Guerriero: '#efebe9',  // Marrone molto chiaro
            Mago: '#e8eaf6',       // Indaco molto chiaro
            Chierico: '#fff8e1',   // Ambra molto chiaro
            Ranger: '#f1f8e9'      // Verde lime molto chiaro
        },
        // Tipi - colori neutri chiari
        type: {
            Personaggio: '#fce4ec', // Rosa chiaro
            Incantesimo: '#e1f5fe', // Ciano chiaro
            Struttura: '#fbe9e7',   // Arancione molto chiaro
            Equipaggiamento: '#f5f5f5' // Grigio molto chiaro
        }
    };

    // Cache per i template SVG
    const svgTemplates = {
        Personaggio: null,
        Incantesimo: null,
        Struttura: null,
        Equipaggiamento: null
    };

    // Cache per le icone SVG
    const svgIcons = {
        element: {},
        class: {},
        type: {},
        rarity: {}
    };

    // Aggiungi questa funzione all'inizio del modulo CardRenderer
    const fixImagePath = (path) => {
        if (!path) return null;
        
        // Se il percorso è già un data URL, restituiscilo com'è
        if (path.startsWith('data:')) return path;
        
        // Se è un URL completo con http/https, restituiscilo com'è
        if (path.startsWith('http://') || path.startsWith('https://')) return path;
        
        // NUOVO: Se il percorso inizia con ../images/ (contesto game), mantienilo così
        if (path.startsWith('../images/')) {
            return path;
        }
        
        // Gestisci i percorsi relativi che iniziano con ../
        if (path.startsWith('../')) {
            // Rimuovi il ../ e aggiungi il percorso base
            return path.replace('../', './');
        }
        
        // Se è un percorso relativo senza ../, assicurati che inizi con ./
        if (!path.startsWith('./')) {
            return './' + path;
        }
        
        return path;
    };

    /**
     * Funzione per dividere il testo in righe multiple per SVG
     * @param {string} text - Il testo da dividere
     * @param {number} maxCharsPerLine - Numero massimo di caratteri per riga
     * @return {Array} - Array di righe di testo
     */
    const wrapText = (text, maxCharsPerLine = 45) => {
        if (!text) return [];
        
        const words = text.split(' ');
        const lines = [];
        let currentLine = '';
        
        words.forEach(word => {
            if ((currentLine + ' ' + word).trim().length <= maxCharsPerLine) {
                currentLine = (currentLine + ' ' + word).trim();
            } else {
                if (currentLine) {
                    lines.push(currentLine);
                }
                currentLine = word;
            }
        });
        
        if (currentLine) {
            lines.push(currentLine);
        }
        
        return lines;
    };

    /**
     * Genera tspan elements per testo multilinea
     * @param {Array} lines - Array di righe di testo
     * @param {number} x - Coordinata x
     * @param {number} startY - Coordinata y iniziale
     * @param {number} lineHeight - Altezza tra le righe
     * @return {string} - HTML dei tspan elements
     */
    const generateTspans = (lines, x, startY, lineHeight = 25) => {
        if (!lines || lines.length === 0) return '';
        
        return lines.map((line, index) => {
            // Escape dei caratteri speciali HTML
            const escapedLine = line
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');
            
            if (index === 0) {
                return `<tspan x="${x}" y="${startY}">${escapedLine}</tspan>`;
            } else {
                return `<tspan x="${x}" dy="${lineHeight}">${escapedLine}</tspan>`;
            }
        }).join('');
    };

    /**
     * Carica tutte le icone SVG
     * @param {string} basePath - Percorso base per le icone
     * @return {Promise} - Promise che si risolve quando tutte le icone sono caricate
     */
    const loadIcons = async (basePath = './svg-templates/icon/') => {
        try {
            // Assicurati che il basePath finisca con /
            if (!basePath.endsWith('/')) {
                basePath += '/';
            }
            
            // Definisci le icone da caricare
            const iconMappings = {
                element: {
                    'Fuoco': 'fire-icon.svg',
                    'Acqua': 'water-icon.svg',
                    'Terra': 'earth-icon.svg',
                    'Aria': 'air-icon.svg',
                    'Luce': 'light-icon.svg',
                    'Ombra': 'shadow-icon.svg'
                },
                class: {
                    'Guerriero': 'warrior-icon.svg',
                    'Mago': 'mage-icon.svg',
                    'Chierico': 'cleric-icon.svg',
                    'Ranger': 'ranger-icon.svg'
                },
                type: {
                    'Personaggio': 'character-icon.svg',
                    'Incantesimo': 'spell-icon.svg',
                    'Struttura': 'structure-icon.svg',
                    'Equipaggiamento': 'equipment-icon.svg'
                },
                rarity: {
                    'Comune': 'common.svg',
                    'Non Comune': 'uncommon.svg',
                    'Rara': 'rare.svg',
                    'Ultra-Rara': 'ultra-rare.svg',     // Con trattino come nel JSON
                    'Ultra Rara': 'ultra-rare.svg',     // Senza trattino per compatibilità
                    'Leggendaria': 'legendary.svg'
                }
            };
            
            // Carica tutte le icone
            const promises = [];
            
            for (const [category, icons] of Object.entries(iconMappings)) {
                for (const [key, filename] of Object.entries(icons)) {
                    promises.push(
                        fetch(basePath + filename)
                            .then(res => res.text())
                            .then(svgContent => {
                                svgIcons[category][key] = svgContent;
                            })
                            .catch(err => {
                                console.warn(`Icona non trovata: ${filename}`, err);
                                svgIcons[category][key] = null;
                            })
                    );
                }
            }
            
            await Promise.all(promises);
            console.log('Icone SVG caricate con successo');
        } catch (error) {
            console.error('Errore nel caricamento delle icone SVG:', error);
        }
    };

    /**
     * Carica tutti i template SVG
     * @param {string} basePath - Percorso base per i template (opzionale)
     * @return {Promise} - Promise che si risolve quando tutti i template sono caricati
     */
    const loadTemplates = async (basePath = './svg-templates/') => {
        try {
            // Assicurati che il basePath finisca con /
            if (!basePath.endsWith('/')) {
                basePath += '/';
            }
            
            // Carica tutti i template in parallelo
            const templatePromises = [
                fetch(basePath + 'card-character.svg').then(res => res.text()),
                fetch(basePath + 'card-spell.svg').then(res => res.text()),
                fetch(basePath + 'card-structure.svg').then(res => res.text()),
                fetch(basePath + 'card-equipment.svg').then(res => res.text())
            ];

            const [personaggio, incantesimo, struttura, equipaggiamento] = await Promise.all(templatePromises);

            // Memorizza i template nella cache
            svgTemplates.Personaggio = personaggio;
            svgTemplates.Incantesimo = incantesimo;
            svgTemplates.Struttura = struttura;
            svgTemplates.Equipaggiamento = equipaggiamento;

            console.log('Template SVG caricati con successo da', basePath);
        } catch (error) {
            console.error('Errore nel caricamento dei template SVG:', error);
            throw error;
        }
    };

    /**
     * Estrae il colore dominante da un SVG
     * @param {string} svgContent - Contenuto dell'icona SVG
     * @return {string} - Colore in formato esadecimale
     */
    const extractDominantColor = (svgContent) => {
        if (!svgContent) return '#808080'; // Grigio di default
        
        // Cerca i colori fill nei path
        const fillMatches = svgContent.match(/fill\s*=\s*["']([^"']+)["']/gi);
        if (fillMatches && fillMatches.length > 0) {
            // Prendi il primo colore fill che non sia white, none o transparent
            for (let match of fillMatches) {
                const color = match.match(/fill\s*=\s*["']([^"']+)["']/i)[1];
                if (color && color !== 'white' && color !== '#fff' && color !== '#ffffff' && 
                    color !== 'none' && color !== 'transparent') {
                    return color;
                }
            }
        }
        
        // Se non trova fill, cerca stroke
        const strokeMatches = svgContent.match(/stroke\s*=\s*["']([^"']+)["']/gi);
        if (strokeMatches && strokeMatches.length > 0) {
            for (let match of strokeMatches) {
                const color = match.match(/stroke\s*=\s*["']([^"']+)["']/i)[1];
                if (color && color !== 'white' && color !== '#fff' && color !== '#ffffff' && 
                    color !== 'none' && color !== 'transparent') {
                    return color;
                }
            }
        }
        
        // Default per tipo di elemento
        return '#808080';
    };

    /**
     * Inserisce un'icona SVG in una posizione specifica
     * @param {string} svgContent - Contenuto dell'icona SVG
     * @param {number} x - Coordinata x
     * @param {number} y - Coordinata y
     * @param {number} size - Dimensione dell'icona
     * @param {string} bgColor - Colore di sfondo del cerchio (opzionale)
     * @return {string} - SVG group con l'icona trasformata
     */
    const insertIcon = (svgContent, x, y, size = 40, bgColor = null) => {
        if (!svgContent) return '';
        
        // Estrai tutto il contenuto interno del tag SVG (path, circle, rect, etc.)
        const contentMatch = svgContent.match(/<svg[^>]*>([\s\S]*?)<\/svg>/i);
        if (!contentMatch) return '';
        
        const innerContent = contentMatch[1];
        
        // Se non è specificato un colore di sfondo, estrailo dall'icona
        if (!bgColor) {
            bgColor = extractDominantColor(svgContent);
        }
        
        // Calcola la scala basata sulla dimensione desiderata (le icone sono 32x32)
        const scale = size / 32;
        const iconRadius = size / 2;
        
        // Crea un gruppo con cerchio di sfondo e icona
        return `<g>
            <circle cx="${x}" cy="${y}" r="${iconRadius}" fill="${bgColor}" stroke="#333" stroke-width="1"/>
            <g transform="translate(${x - size/2}, ${y - size/2})">
                <g transform="scale(${scale})">
                    ${innerContent}
                </g>
            </g>
        </g>`;
    };

    /**
     * Genera un SVG per una carta usando il template appropriato
     * @param {Object} card - Dati della carta
     * @return {string} - Markup SVG della carta
     */
    const generateCardSVG = (card) => {
        console.log(`[CardRenderer] generateCardSVG chiamato per ${card.name}, tipo: ${card.type}, currentHealth: ${card.currentHealth}, isDamaged: ${card.isDamaged}`);
        
        // Ottieni il template corretto in base al tipo di carta
        let template = svgTemplates[card.type];
        console.log(`[CardRenderer] Template per tipo ${card.type}:`, template ? 'trovato' : 'non trovato');

        // Se il template non è disponibile, mostra un placeholder
        if (!template) {
            console.log(`[CardRenderer] Usando placeholder per ${card.name}`);
            return generatePlaceholderSVG(card);
        }

        // Crea una copia del template da modificare
        let svg = template;
        
        // Se la carta è un personaggio e ha currentHealth, verifica se è danneggiata
        if (card.type === 'Personaggio' && card.currentHealth !== undefined) {
            const maxHealth = card.stats?.health || card.health || 
                            card.stats?.defense || card.defense || 1;
            // Sempre ricalcola se è danneggiata
            card.isDamaged = (card.currentHealth < maxHealth);
            
            if (card.isDamaged) {
                console.log(`[CardRenderer] ${card.name} è danneggiato: vita ${card.currentHealth}/${maxHealth}`);
            }
        }

        // Sostituisci i valori nel template

        // ID della carta con totale (es. 1/200)
        let totalCards = '?';
        // Prova prima window.allCards (app principale) poi allCards globale (gioco)
        if (window.allCards && window.allCards.length) {
            totalCards = window.allCards.length;
        } else if (typeof allCards !== 'undefined' && allCards.length) {
            totalCards = allCards.length;
        }
        const cardNumber = card.id ? `${card.id} / ${totalCards}` : '';
        svg = svg.replace(/{{id}}/g, cardNumber);

        // Nome della carta
        svg = svg.replace(/{{nome}}/g, card.name || '');

        // Tipo di carta (potrebbero esserci sottotipi)
        svg = svg.replace(/{{tipo}}/g, card.type || '');

        // Costo
        svg = svg.replace(/{{costo}}/g, card.cost || '0');

        // Immagine
        // svg = svg.replace(/{{immagine}}/g, card.img || '0');
        // MODIFICA: Gestione dell'immagine
        let imagePath = card.img || card.imagePath;
        
        // Se non c'è un percorso immagine, prova a generarlo basandosi sull'ID e nome
        if (!imagePath && card.id && card.name) {
            // Genera un nome file basato su ID e nome
            const fileName = card.name.toLowerCase()
                .replace(/\s+/g, '_')
                .replace(/[àáäâ]/g, 'a')
                .replace(/[èéëê]/g, 'e')
                .replace(/[ìíïî]/g, 'i')
                .replace(/[òóöô]/g, 'o')
                .replace(/[ùúüû]/g, 'u')
                .replace(/'/g, '_');
            imagePath = `../images/${card.id}_${fileName}.png`;
        }
        
        if (imagePath) {
            // Controlla se c'è una versione base64 disponibile (per PDF)
            const base64Image = window.imageCache && window.imageCache.get && window.imageCache.get(imagePath);
            
            if (base64Image) {
                // Usa l'immagine base64 se disponibile
                svg = svg.replace(/{{immagine}}/g, base64Image);
            } else {
                // Correggi il percorso dell'immagine per la visualizzazione normale
                const fixedPath = fixImagePath(imagePath);
                svg = svg.replace(/{{immagine}}/g, fixedPath);
            }
        } else {
            // Se non c'è un'immagine, lascia vuoto o usa un placeholder generico
            svg = svg.replace(/{{immagine}}/g, '');
        }


        // Set
        svg = svg.replace(/{{set}}/g, card.espansione || '');

        // Elemento e classe
        svg = svg.replace(/{{elemento}}/g, card.element || '');
        svg = svg.replace(/{{classe}}/g, card.class || '');

        // Rarità - rimuovi il vecchio placeholder testuale (se presente)
        svg = svg.replace(/{{rarita}}/g, '');

        // Testo di ambientazione
        if (card.flavor_text) {
            const flavorLines = wrapText(card.flavor_text, 55);
            
            // Determina la coordinata Y iniziale basata sul tipo di carta
            let flavorStartY = 958; // Default per strutture
            let lineHeight = 20;
            
            if (card.type === 'Personaggio') {
                flavorStartY = 880;
                lineHeight = 18;
            } else if (card.type === 'Incantesimo') {
                flavorStartY = 945;  // Aggiustato per il nuovo box più alto
                lineHeight = 18;
            } else if (card.type === 'Equipaggiamento') {
                flavorStartY = 945;  // Aggiustato per il nuovo box più alto
                lineHeight = 18;
            }
            
            const flavorTspans = generateTspans(flavorLines, 375, flavorStartY, lineHeight);
            svg = svg.replace(/{{flavor_text}}/g, flavorTspans);
        } else {
            svg = svg.replace(/{{flavor_text}}/g, '');
        }

        // Per le carte personaggio, sostituisci le statistiche
        if (card.type === 'Personaggio') {
            // Valori base originali dalle stats
            const originalAttack = card.stats?.attack !== undefined ? card.stats.attack : 0;
            const originalDefense = card.stats?.defense !== undefined ? card.stats.defense : 0;
            const originalHealth = card.stats?.health !== undefined ? card.stats.health : (card.stats?.defense || 0);
            
            // Valori attuali (potrebbero essere stati modificati da bonus permanenti)
            const currentAttack = card.attack !== undefined ? card.attack : originalAttack;
            const currentDefense = card.defense !== undefined ? card.defense : originalDefense;
            
            console.log(`[CardRenderer] Stats per ${card.name}:`, {
                originalAttack,
                originalDefense,
                currentAttack,
                currentDefense,
                temporaryBonuses: card.temporaryBonuses,
                auraBonuses: card.auraBonuses
            });
            
            // Calcola valori finali con bonus temporanei e aure
            let attackValue = currentAttack;
            let defenseValue = currentDefense;
            
            // Applica bonus temporanei
            if (card.temporaryBonuses) {
                attackValue += (card.temporaryBonuses.attack || 0);
                defenseValue += (card.temporaryBonuses.defense || 0);
            }
            
            // Applica bonus delle aure
            if (card.auraBonuses) {
                attackValue += (card.auraBonuses.attack || 0);
                defenseValue += (card.auraBonuses.defense || 0);
            }
            
            // Sostituisci attacco con colore appropriato
            let attackColor = null;
            if (attackValue > originalAttack) {
                attackColor = '#00ff00'; // Verde se sopra il base
            } else if (attackValue < originalAttack) {
                attackColor = '#ff4444'; // Rosso se sotto il base
            }
            
            if (attackColor) {
                svg = svg.replace(/{{attacco}}/g, `<tspan fill="${attackColor}">${attackValue}</tspan>`);
            } else {
                svg = svg.replace(/{{attacco}}/g, String(attackValue));
            }
            
            // Gestisci difesa e vita
            // Usa currentHealth se disponibile, altrimenti usa il valore massimo
            const healthValue = card.currentHealth !== undefined ? card.currentHealth : originalHealth;
            
            // Sostituisci difesa con colore appropriato
            let defenseColor = null;
            if (defenseValue > originalDefense) {
                defenseColor = '#00ff00'; // Verde se sopra il base
            } else if (defenseValue < originalDefense) {
                defenseColor = '#ff4444'; // Rosso se sotto il base
            }
            
            if (defenseColor) {
                svg = svg.replace(/{{difesa}}/g, `<tspan fill="${defenseColor}">${defenseValue}</tspan>`);
            } else {
                svg = svg.replace(/{{difesa}}/g, String(defenseValue));
            }
            
            // Sostituisci punti vita con colore appropriato
            let healthColor = null;
            if (healthValue > originalHealth) {
                healthColor = '#00ff00'; // Verde se sopra il base
            } else if (healthValue < originalHealth) {
                healthColor = '#ff4444'; // Rosso se sotto il base (danneggiato)
            }
            
            if (healthColor) {
                svg = svg.replace(/{{punti_vita}}/g, `<tspan fill="${healthColor}">${healthValue}</tspan>`);
            } else {
                svg = svg.replace(/{{punti_vita}}/g, String(healthValue));
            }
        }

        // Per le carte struttura, sostituisci i punti vita
        if (card.type === 'Struttura') {
            // Ottieni il valore health dalle stats della struttura
            const healthValue = card.stats?.health || 0;
            
            // Sostituisci il placeholder punti_vita con il valore
            svg = svg.replace(/{{punti_vita}}/g, String(healthValue));
        }

        // Posizionamento
        svg = svg.replace(/{{posizionamento}}/g, card.placement || '');

        // Abilità
        if (card.abilities && card.abilities.length > 0) {
            // Se il template ha un segnaposto per le abilità multiple
            if (svg.includes('{{abilita_lista}}')) {
                let abilitiesHtml = '';
                let currentY = 0;
                card.abilities.forEach((ability, index) => {
                    if (index > 0) currentY += 15; // Spazio tra abilità
                    
                    abilitiesHtml += `<tspan x="375" dy="${index === 0 ? '0' : '15'}" font-weight="bold" text-anchor="middle">${ability.name}:</tspan>`;
                    
                    // Usa description invece di effect per il nuovo formato
                    const abilityText = ability.description || ability.effect || '';
                    const wrappedLines = wrapText(abilityText, 50);
                    
                    wrappedLines.forEach((line, lineIndex) => {
                        abilitiesHtml += `<tspan x="375" dy="${lineIndex === 0 ? '25' : '22'}" text-anchor="middle">${line}</tspan>`;
                    });
                });
                svg = svg.replace(/{{abilita_lista}}/g, abilitiesHtml);
            } else {
                // Altrimenti sostituisci i singoli segnaposti
                const ability = card.abilities[0]; // Prendi la prima abilità
                
                // Per incantesimi ed equipaggiamenti, non mostrare "Abilità Senza Nome"
                const shouldShowName = ability.name && 
                                     ability.name !== 'Abilità Senza Nome' && 
                                     card.type !== 'Incantesimo' && 
                                     card.type !== 'Equipaggiamento';
                
                svg = svg.replace(/{{abilita_nome}}/g, shouldShowName ? ability.name : '');
                
                // Nascondi la linea separatrice se non c'è nome
                if (!shouldShowName && svg.includes('<rect x="150" y="790"')) {
                    svg = svg.replace(/<rect x="150" y="790"[^>]*>/g, '<!-- Linea nascosta -->');
                }
                
                // Usa description invece di effect per il nuovo formato
                const abilityText = ability.description || ability.effect || '';
                
                // Crea tspan multipli per il testo wrappato
                // Usa lunghezze diverse basate sul tipo di carta
                const maxChars = card.type === 'Personaggio' ? 45 : 50;
                const wrappedLines = wrapText(abilityText, maxChars);
                
                // Determina la coordinata Y iniziale basata sul tipo di carta
                let startY = 820; // Default per strutture
                if (card.type === 'Personaggio') {
                    startY = 700; // Più vicino al nome dell'abilità
                } else if (card.type === 'Incantesimo') {
                    // Se non c'è nome, inizia dove sarebbe il nome
                    startY = shouldShowName ? 820 : 780;
                } else if (card.type === 'Equipaggiamento') {
                    // Se non c'è nome, inizia dove sarebbe il nome
                    startY = shouldShowName ? 820 : 780;
                }
                
                const tspans = generateTspans(wrappedLines, 375, startY, 22);
                
                // Sostituisci il placeholder con i tspan multipli
                svg = svg.replace(/{{abilita_effetto}}/g, tspans);
            }
        } else {
            // Nessuna abilità
            svg = svg.replace(/{{abilita_nome}}/g, '');
            svg = svg.replace(/{{abilita_effetto}}/g, '');
            svg = svg.replace(/{{abilita_lista}}/g, '');
        }

        // Sostituisci eventuali segnaposti colore
        if (card.element && CARD_COLORS[card.element]) {
            svg = svg.replace(/{{colore_elemento}}/g, CARD_COLORS[card.element]);
        } else {
            svg = svg.replace(/{{colore_elemento}}/g, '#95a5a6'); // Colore grigio di default
        }
        
        // Sostituisci le icone
        // Icona elemento
        if (card.element && svgIcons.element[card.element]) {
            // Coordinate diverse per tipo di carta
            let elementY = card.type === 'Personaggio' ? 605 : 675;
            // Usa il colore di sfondo chiaro per l'elemento
            const elementBgColor = ICON_BG_COLORS.element[card.element] || '#f5f5f5';
            const elementIcon = insertIcon(svgIcons.element[card.element], 90, elementY, 40, elementBgColor);
            svg = svg.replace(/{{icon_element}}/g, elementIcon);
        } else if (card.element === 'Neutrale') {
            // Per elementi neutrali, mostra un cerchio grigio molto chiaro
            let elementY = card.type === 'Personaggio' ? 605 : 675;
            const neutralIcon = `<circle cx="90" cy="${elementY}" r="20" fill="#fafafa" stroke="#333" stroke-width="1"/>`;
            svg = svg.replace(/{{icon_element}}/g, neutralIcon);
        } else {
            svg = svg.replace(/{{icon_element}}/g, '');
        }
        
        // Icona classe (solo per personaggi ed equipaggiamenti)
        if (card.class && svgIcons.class[card.class]) {
            // Coordinate diverse per tipo di carta
            let classX = 150, classY = 605;
            if (card.type === 'Equipaggiamento') {
                classX = 90;  // Già a sinistra per gli equipaggiamenti
                classY = 675;
            } else if (card.type !== 'Personaggio') {
                classY = 675;
            }
            // Usa il colore di sfondo chiaro per la classe
            const classBgColor = ICON_BG_COLORS.class[card.class] || '#f5f5f5';
            const classIcon = insertIcon(svgIcons.class[card.class], classX, classY, 40, classBgColor);
            svg = svg.replace(/{{icon_class}}/g, classIcon);
        } else {
            svg = svg.replace(/{{icon_class}}/g, '');
        }
        
        // Icona tipo
        if (card.type && svgIcons.type[card.type]) {
            // Posizione diversa per ogni tipo di carta
            let typeX = 660, typeY = 605;
            if (card.type === 'Struttura' || card.type === 'Incantesimo') {
                typeX = 660;  // Spostata a destra dove prima c'era un'altra icona
                typeY = 675;
            } else if (card.type === 'Equipaggiamento') {
                typeX = 660;
                typeY = 675;
            }
            // Usa il colore di sfondo chiaro per il tipo
            const typeBgColor = ICON_BG_COLORS.type[card.type] || '#f5f5f5';
            const typeIcon = insertIcon(svgIcons.type[card.type], typeX, typeY, 40, typeBgColor);
            svg = svg.replace(/{{icon_type}}/g, typeIcon);
        } else {
            svg = svg.replace(/{{icon_type}}/g, '');
        }
        
        // Icona rarità
        if (card.rarity && svgIcons.rarity[card.rarity]) {
            // Posizione fissa in alto a destra per tutte le carte
            const rarityX = 660;
            const rarityY = 90;
            const raritySize = 50; // Dimensione maggiore per la rarità
            
            // Colori di sfondo per rarità
            const rarityBgColors = {
                'Comune': '#e0e0e0',      // Grigio chiaro
                'Non Comune': '#c0e0c0',   // Verde chiaro
                'Rara': '#c0d0f0',        // Blu chiaro
                'Ultra-Rara': '#4a148c',   // Viola scuro (con trattino)
                'Ultra Rara': '#4a148c',   // Viola scuro (senza trattino)
                'Leggendaria': '#f0e0c0'   // Oro chiaro
            };
            
            const rarityBgColor = rarityBgColors[card.rarity] || '#f5f5f5';
            const rarityIcon = insertIcon(svgIcons.rarity[card.rarity], rarityX, rarityY, raritySize, rarityBgColor);
            svg = svg.replace(/{{icon_rarity}}/g, rarityIcon);
        } else {
            svg = svg.replace(/{{icon_rarity}}/g, '');
        }
        
        // Rimuovi eventuali placeholder non sostituiti per evitare "undefined"
        svg = svg.replace(/{{[^}]+}}/g, '');

        return svg;
    };

    /**
     * Genera un SVG placeholder se il template non è disponibile
     * @param {Object} card - Dati della carta
     * @return {string} - Markup SVG placeholder
     */
    const generatePlaceholderSVG = (card) => {
        const width = 300;
        const height = 420;
        const backgroundColor = card.element ? CARD_COLORS[card.element] : '#95a5a6';

        return `
        <svg width="100%" height="100%" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
            <rect x="0" y="0" width="${width}" height="${height}" rx="15" ry="15" fill="#f5f5f5" stroke="#ddd" stroke-width="2"/>
            <rect x="0" y="0" width="${width}" height="50" rx="15" ry="15" fill="${backgroundColor}"/>
            <text x="${width/2}" y="30" font-family="Arial, sans-serif" font-size="16" fill="white" text-anchor="middle">
                ${card.name}
            </text>
            <text x="${width/2}" y="${height/2}" font-family="Arial, sans-serif" font-size="14" fill="#666" text-anchor="middle">
                ${card.type} - ${card.element || ''} ${card.class ? `(${card.class})` : ''}
            </text>
            <text x="${width/2}" y="${height/2 + 20}" font-family="Arial, sans-serif" font-size="12" fill="#666" text-anchor="middle">
                Template non disponibile
            </text>
        </svg>`;
    };

    /**
     * Genera un markup dettagliato della carta per la modale
     * @param {Object} card - Dati della carta
     * @return {string} - HTML della carta in formato dettagliato
     */
    const generateCardDetails = (card) => {
        let html = `
            <div class="detail-section">
                <h2>${card.name}</h2>
                <p>${card.type} - ${card.element || ''} ${card.class ? `(${card.class})` : ''}</p>
                <p>Rarità: ${card.rarity}</p>
                <p>Costo: ${card.cost}</p>
            </div>`;

        // Statistiche per personaggi
        if (card.type === 'Personaggio' && card.stats) {
            html += `
                <div class="detail-section">
                    <h3>Statistiche</h3>
                    <div class="detail-stats">
                        <div class="detail-stat">
                            <span class="detail-stat-value">${card.stats.attack}</span>
                            <span class="detail-stat-label">ATT</span>
                        </div>
                        <div class="detail-stat">
                            <span class="detail-stat-value">${card.stats.defense}</span>
                            <span class="detail-stat-label">DIF</span>
                        </div>
                        <div class="detail-stat">
                            <span class="detail-stat-value">${card.stats.health}</span>
                            <span class="detail-stat-label">PV</span>
                        </div>
                    </div>
                </div>`;
        }

        // Statistiche per strutture
        if (card.type === 'Struttura' && card.stats && card.stats.health) {
            html += `
                <div class="detail-section">
                    <h3>Statistiche</h3>
                    <div class="detail-stats">
                        <div class="detail-stat">
                            <span class="detail-stat-value">${card.stats.health}</span>
                            <span class="detail-stat-label">PV</span>
                        </div>
                    </div>
                </div>`;
        }

        // Abilità
        if (card.abilities && card.abilities.length) {
            html += `<div class="detail-section"><h3>Abilità</h3>`;

            card.abilities.forEach(ability => {
                // Usa description invece di effect per il nuovo formato
                const abilityText = ability.description || ability.effect || '';
                html += `
                    <div class="detail-ability">
                        <div class="detail-ability-name">${ability.name}</div>
                        <div class="detail-ability-effect">${abilityText}</div>
                    </div>`;
            });

            html += `</div>`;
        }

        // Testo di ambientazione
        if (card.flavor_text) {
            html += `
                <div class="detail-section">
                    <h3>Ambientazione</h3>
                    <p><em>${card.flavor_text}</em></p>
                </div>`;
        }

        // Posizionamento (se presente)
        if (card.placement) {
            html += `
                <div class="detail-section">
                    <p>Posizionamento: ${card.placement}</p>
                </div>`;
        }

        // Set
        if (card.set) {
            html += `
                <div class="detail-section">
                    <p>Set: ${card.set}</p>
                </div>`;
        }

        return html;
    };

    // Espone le funzioni pubbliche
    return {
        loadTemplates,
        loadIcons,
        generateCardSVG,
        generateCardDetails
    };
})();