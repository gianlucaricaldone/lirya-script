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

    // Cache per i template SVG
    const svgTemplates = {
        Personaggio: null,
        Incantesimo: null,
        Struttura: null,
        Equipaggiamento: null
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

        // Nome della carta
        svg = svg.replace(/{{id}}/g, card.id || '');

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

        // Rarità
        switch (card.rarity) {
            case "Comune":
                svg = svg.replace(/{{rarita}}/g, 'C');
                break;
            case "Non Comune":
                svg = svg.replace(/{{rarita}}/g, 'NC');
                break;
            case "Rara":
                svg = svg.replace(/{{rarita}}/g, 'R');
                break;
            case "Ultra Rara":
                svg = svg.replace(/{{rarita}}/g, 'UR');
                break;
            case "Leggenda":
                svg = svg.replace(/{{rarita}}/g, 'L');
                break;
            default:
                svg = svg.replace(/{{rarita}}/g, '');
        }

        // Testo di ambientazione
        svg = svg.replace(/{{flavor_text}}/g, card.flavor_text || '');

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

        // Posizionamento
        svg = svg.replace(/{{posizionamento}}/g, card.placement || '');

        // Abilità
        if (card.abilities && card.abilities.length > 0) {
            // Se il template ha un segnaposto per le abilità multiple
            if (svg.includes('{{abilita_lista}}')) {
                let abilitiesHtml = '';
                card.abilities.forEach(ability => {
                    abilitiesHtml += `<tspan x="25" dy="1.2em" font-weight="bold">${ability.name}:</tspan>`;
                    // Usa description invece di effect per il nuovo formato
                    const abilityText = ability.description || ability.effect || '';
                    abilitiesHtml += `<tspan x="25" dy="1.2em">${abilityText}</tspan>`;
                    abilitiesHtml += `<tspan x="25" dy="0.6em"></tspan>`; // Spazio tra le abilità
                });
                svg = svg.replace(/{{abilita_lista}}/g, abilitiesHtml);
            } else {
                // Altrimenti sostituisci i singoli segnaposti
                const ability = card.abilities[0]; // Prendi la prima abilità
                svg = svg.replace(/{{abilita_nome}}/g, ability.name || '');
                // Usa description invece di effect per il nuovo formato
                const abilityText = ability.description || ability.effect || '';
                svg = svg.replace(/{{abilita_effetto}}/g, abilityText);
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
        generateCardSVG,
        generateCardDetails
    };
})();