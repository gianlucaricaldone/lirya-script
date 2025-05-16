/**
 * Applicazione principale
 */
document.addEventListener('DOMContentLoaded', () => {
    // Elementi DOM
    const cardsContainer = document.getElementById('cards-container');
    const cardCountElement = document.getElementById('card-count');
    const loadingIndicator = document.createElement('div');
    loadingIndicator.className = 'loading-indicator';
    loadingIndicator.textContent = 'Caricamento...';

    // Dati delle carte
    let allCards = [];

    /**
     * Inizializza l'applicazione
     */
    const init = async () => {
        // Mostra l'indicatore di caricamento
        document.body.appendChild(loadingIndicator);

        try {
            // Carica i template SVG
            await CardRenderer.loadTemplates();

            // Carica le carte
            await loadCards();

            // Inizializza i moduli
            FilterModule.init();
            ModalModule.init();

            // Ascolta gli eventi di filtro
            document.addEventListener('filtersChanged', handleFiltersChanged);

            // Applica i filtri iniziali
            const event = new CustomEvent('filtersChanged', {
                detail: FilterModule.getFilters()
            });
            document.dispatchEvent(event);

        } catch (error) {
            console.error('Errore durante l\'inizializzazione:', error);
            cardsContainer.innerHTML = `
                <div class="error-message">
                    Si è verificato un errore durante l'inizializzazione. Ricarica la pagina.
                </div>`;
        } finally {
            // Rimuovi l'indicatore di caricamento
            document.body.removeChild(loadingIndicator);
        }
    };

    /**
     * Carica il file JSON delle carte
     */
    const loadCards = async () => {
        try {
            const response = await fetch('./data/cards.json');

            if (!response.ok) {
                throw new Error('Errore nel caricamento dei dati');
            }

            allCards = await response.json();

            // Se le carte sono in un formato annidato, estrai l'array
            if (allCards.cards) {
                allCards = allCards.cards;
            }

            console.log(`Caricate ${allCards.length} carte`);

        } catch (error) {
            console.error('Errore nel caricamento delle carte:', error);
            throw error;
        }
    };

    /**
     * Visualizza le carte filtrate
     * @param {Array} cards - Carte da visualizzare
     */
    const displayCards = (cards) => {
        // Aggiorna il conteggio
        cardCountElement.textContent = `Visualizzazione di ${cards.length} carte`;

        // Svuota il contenitore
        cardsContainer.innerHTML = '';

        // Aggiungi le carte
        cards.forEach(card => {
            const cardElement = document.createElement('div');
            cardElement.className = `card class-${card.class || 'Neutrale'} rarity-${card.rarity.replace(' ', '-')}`;

            // Crea l'HTML della carta
            cardElement.innerHTML = `
                <div class="card-svg">
                    ${CardRenderer.generateCardSVG(card)}
                </div>
                <div class="card-info">
                    <div class="card-name">${card.name}</div>
                    <div class="card-type">
                        <span>${card.type}</span>
                        <span class="element-${card.element || 'Neutrale'}">${card.element || ''}</span>
                    </div>
                </div>`;

            // Aggiungi l'event listener per la modale
            cardElement.addEventListener('click', () => {
                ModalModule.openModal(card);
            });

            // Aggiungi la carta al contenitore
            cardsContainer.appendChild(cardElement);
        });
    };

    /**
     * Gestisce il cambiamento dei filtri
     * @param {Event} event - Evento personalizzato filtersChanged
     */
    const handleFiltersChanged = (event) => {
        // Filtra le carte
        const filteredCards = FilterModule.filterCards(allCards);

        // Aggiorna la visualizzazione
        displayCards(filteredCards);
    };

    // Avvia l'inizializzazione
    init();
});