/**
 * Modulo per la gestione della modale dei dettagli carta
 */
const ModalModule = (() => {
    // Elementi DOM
    let modal;
    let modalCard;
    let modalDetails;
    let closeButton;

    /**
     * Inizializza la modale
     */
    const init = () => {
        // Ottiene i riferimenti agli elementi DOM
        modal = document.getElementById('card-modal');
        modalCard = document.getElementById('modal-card');
        modalDetails = document.getElementById('modal-details');
        closeButton = modal.querySelector('.close');

        // Aggiunge gli event listener
        closeButton.addEventListener('click', closeModal);

        // Chiudi la modale cliccando fuori
        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });

        // Chiudi con ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.style.display === 'block') {
                closeModal();
            }
        });
    };

    /**
     * Apre la modale con i dettagli di una carta
     * @param {Object} card - Carta da visualizzare
     */
    const openModal = (card) => {
        // Imposta il contenuto SVG
        modalCard.innerHTML = CardRenderer.generateCardSVG(card);

        // Imposta i dettagli
        modalDetails.innerHTML = CardRenderer.generateCardDetails(card);

        // Mostra la modale
        modal.style.display = 'block';

        // Impedisci lo scroll della pagina
        document.body.style.overflow = 'hidden';
    };

    /**
     * Chiude la modale
     */
    const closeModal = () => {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    };

    // Espone le funzioni pubbliche
    return {
        init,
        openModal,
        closeModal
    };
})();