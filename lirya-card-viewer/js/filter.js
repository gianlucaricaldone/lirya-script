/**
 * Modulo per la gestione dei filtri
 */
const FilterModule = (() => {
    // Elementi DOM
    let elementFilter;
    let classFilter;
    let typeFilter;
    let rarityFilter;
    let costFilter;
    let searchInput;
    let applyButton;
    let resetButton;

    /**
     * Inizializza i filtri
     */
    const init = () => {
        // Ottiene i riferimenti agli elementi DOM
        elementFilter = document.getElementById('element-filter');
        classFilter = document.getElementById('class-filter');
        typeFilter = document.getElementById('type-filter');
        rarityFilter = document.getElementById('rarity-filter');
        costFilter = document.getElementById('cost-filter');
        searchInput = document.getElementById('search');
        applyButton = document.getElementById('apply-filters');
        resetButton = document.getElementById('reset-filters');

        // Aggiunge gli event listener
        applyButton.addEventListener('click', () => {
            // Evento personalizzato per notificare quando i filtri cambiano
            const event = new CustomEvent('filtersChanged', {
                detail: getFilters()
            });
            document.dispatchEvent(event);
        });

        resetButton.addEventListener('click', resetFilters);

        // Consenti anche l'invio con Enter nel campo di ricerca
        searchInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') {
                applyButton.click();
            }
        });
    };

    /**
     * Ottiene i valori correnti dei filtri
     * @return {Object} - Valori dei filtri
     */
    const getFilters = () => {
        return {
            element: elementFilter.value,
            class: classFilter.value,
            type: typeFilter.value,
            rarity: rarityFilter.value,
            cost: costFilter.value ? parseInt(costFilter.value) : null,
            search: searchInput.value.toLowerCase()
        };
    };

    /**
     * Reimposta tutti i filtri ai valori predefiniti
     */
    const resetFilters = () => {
        elementFilter.value = '';
        classFilter.value = '';
        typeFilter.value = '';
        rarityFilter.value = '';
        costFilter.value = '';
        searchInput.value = '';

        // Applica i filtri reimpostati
        applyButton.click();
    };

    /**
     * Filtra un array di carte in base ai criteri correnti
     * @param {Array} cards - Array di carte da filtrare
     * @return {Array} - Carte filtrate
     */
    const filterCards = (cards) => {
        const filters = getFilters();

        return cards.filter(card => {
            // Filtro elemento
            if (filters.element && card.element !== filters.element) {
                return false;
            }

            // Filtro classe
            if (filters.class && card.class !== filters.class) {
                return false;
            }

            // Filtro tipo
            if (filters.type && card.type !== filters.type) {
                return false;
            }

            // Filtro rarità
            if (filters.rarity && card.rarity !== filters.rarity) {
                return false;
            }

            // Filtro costo
            if (filters.cost !== null && card.cost > filters.cost) {
                return false;
            }

            // Filtro ricerca testo
            if (filters.search) {
                const searchTerms = filters.search.split(' ');

                // Controlla se tutte le parole della ricerca sono contenute in almeno uno dei campi
                const matchesSearch = searchTerms.every(term => {
                    // Campi da controllare per la ricerca
                    const fieldsToSearch = [
                        card.name.toLowerCase(),
                        card.type.toLowerCase(),
                        card.element ? card.element.toLowerCase() : '',
                        card.class ? card.class.toLowerCase() : '',
                        card.rarity.toLowerCase(),
                        card.flavor_text ? card.flavor_text.toLowerCase() : ''
                    ];

                    // Aggiungi il testo delle abilità se presente
                    if (card.ability) {
                        card.ability.forEach(ability => {
                            fieldsToSearch.push(ability.name.toLowerCase());
                            fieldsToSearch.push(ability.effect.toLowerCase());
                        });
                    }

                    // Controlla se almeno un campo contiene il termine
                    return fieldsToSearch.some(field => field.includes(term));
                });

                if (!matchesSearch) {
                    return false;
                }
            }

            // Se supera tutti i filtri, mantieni la carta
            return true;
        });
    };

    // Espone le funzioni pubbliche
    return {
        init,
        getFilters,
        filterCards,
        resetFilters
    };
})();