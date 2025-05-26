/**
 * Generatore PDF per le carte di Lirya
 * Questo script genera un PDF con le carte di Lirya disposte in una griglia 4x4
 */

const LiryaCardPrinter = (() => {
    // Cache per le immagini convertite in base64
    const imageCache = new Map();
    
    /**
     * Converte un'immagine in base64
     * @param {string} imageUrl - URL dell'immagine
     * @returns {Promise<string>} - Immagine in formato base64
     */
    const imageToBase64 = (imageUrl) => {
        return new Promise((resolve, reject) => {
            // Controlla se l'immagine è già in cache
            if (imageCache.has(imageUrl)) {
                resolve(imageCache.get(imageUrl));
                return;
            }
            
            const img = new Image();
            img.crossOrigin = 'anonymous'; // Per evitare problemi CORS
            
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                canvas.width = img.width;
                canvas.height = img.height;
                
                ctx.drawImage(img, 0, 0);
                
                try {
                    const base64 = canvas.toDataURL('image/png');
                    imageCache.set(imageUrl, base64);
                    resolve(base64);
                } catch (error) {
                    console.warn('Errore conversione immagine:', imageUrl, error);
                    resolve(''); // Restituisci stringa vuota se non riesce
                }
            };
            
            img.onerror = () => {
                console.warn('Immagine non trovata:', imageUrl);
                resolve(''); // Restituisci stringa vuota se l'immagine non esiste
            };
            
            // Gestisci percorsi relativi
            if (imageUrl.startsWith('../images/')) {
                img.src = imageUrl.replace('../images/', './images/');
            } else if (imageUrl.startsWith('./images/')) {
                img.src = imageUrl;
            } else {
                img.src = imageUrl;
            }
        });
    };
    
    /**
     * Pre-carica tutte le immagini delle carte
     * @param {Array} cards - Array delle carte
     * @param {Function} progressCallback - Callback per il progresso
     */
    const preloadImages = async (cards, progressCallback = null) => {
        const uniqueImages = new Set();
        
        // Raccogli tutte le immagini uniche dalle carte
        cards.forEach(card => {
            if (card.img) {
                uniqueImages.add(card.img);
            }
        });
        
        const imageUrls = Array.from(uniqueImages);
        const total = imageUrls.length;
        
        console.log(`Pre-caricamento di ${total} immagini...`);
        
        // Carica tutte le immagini in parallelo
        const promises = imageUrls.map(async (imageUrl, index) => {
            const base64 = await imageToBase64(imageUrl);
            if (progressCallback) {
                progressCallback(index + 1, total);
            }
            return base64;
        });
        
        await Promise.all(promises);
        console.log('Pre-caricamento immagini completato');
    };
    
    // Impostazioni per la generazione del PDF
    const settings = {
        cardsPerPage: 9,      // 9 carte per pagina (3x3)
        cardsPerRow: 3,       // 3 carte per riga
        cardWidth: 63,        // mm
        cardHeight: 88,       // mm (dimensione standard delle carte da gioco)
        pageMargin: 10,       // mm (margine aumentato per evitare tagli)
        cardSpacing: 5,       // mm (spaziatura aumentata)
        pageFormat: 'a4',
        pageOrientation: 'portrait',
    };

    /**
     * Genera il PDF con tutte le carte
     * @param {Array} cards - Array di oggetti carta
     * @param {string} filename - Nome del file PDF
     * @param {Function} progressCallback - Callback per aggiornare l'avanzamento (current, total)
     */
    const generatePDF = async (cards, filename = 'lirya-cards.pdf', progressCallback = null) => {
        try {
            // Assicuriamoci che i template SVG siano caricati
            await CardRenderer.loadTemplates();
            
            // Pre-carica tutte le immagini delle carte e convertile in base64
            if (progressCallback) progressCallback(0, 100, 'Pre-caricamento immagini...');
            await preloadImages(cards, (current, total) => {
                if (progressCallback) {
                    const percentage = Math.floor((current / total) * 30); // 30% per le immagini
                    progressCallback(percentage, 100, `Caricamento immagini ${current}/${total}...`);
                }
            });
            
            // Rendi disponibile la cache delle immagini globalmente
            window.imageCache = imageCache;
            
            // Inizializza il PDF
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF({
                orientation: settings.pageOrientation,
                unit: 'mm',
                format: settings.pageFormat
            });
            
            // Calcola il numero totale di pagine necessarie
            const totalPages = Math.ceil(cards.length / settings.cardsPerPage);
            
            // Pagina corrente
            let currentPage = 1;
            
            // Crea una div temporanea per il rendering delle carte
            const container = document.createElement('div');
            container.style.position = 'absolute';
            container.style.left = '-9999px';
            container.style.top = '-9999px';
            document.body.appendChild(container);
            
            console.log(`Generazione PDF con ${cards.length} carte su ${totalPages} pagine...`);
            
            // Loop per ogni pagina
            for (let page = 0; page < totalPages; page++) {
                // Aggiorna il progresso (30% + 60% per le pagine)
                if (progressCallback) {
                    const pageProgress = Math.floor(30 + (page / totalPages) * 60);
                    progressCallback(pageProgress, 100, `Generazione pagina ${page + 1}/${totalPages}...`);
                }
                // Se non è la prima pagina, aggiungi una nuova pagina
                if (page > 0) {
                    pdf.addPage();
                }
                
                // Crea il layout della pagina corrente
                const pageContainer = document.createElement('div');
                pageContainer.style.width = `${pdf.internal.pageSize.getWidth()}mm`;
                pageContainer.style.height = `${pdf.internal.pageSize.getHeight()}mm`;
                pageContainer.style.position = 'relative';
                pageContainer.style.backgroundColor = 'white';
                
                // Calcola quante carte inserire in questa pagina
                const startCardIndex = page * settings.cardsPerPage;
                const endCardIndex = Math.min(startCardIndex + settings.cardsPerPage, cards.length);
                
                // Loop per ogni carta nella pagina corrente
                for (let i = startCardIndex; i < endCardIndex; i++) {
                    const card = cards[i];
                    const cardIndex = i - startCardIndex;
                    
                    // Calcola la posizione della carta nella griglia
                    const row = Math.floor(cardIndex / settings.cardsPerRow);
                    const col = cardIndex % settings.cardsPerRow;
                    
                    // Calcola le coordinate x e y della carta
                    const x = settings.pageMargin + col * (settings.cardWidth + settings.cardSpacing);
                    const y = settings.pageMargin + row * (settings.cardHeight + settings.cardSpacing);
                    
                    // Crea l'elemento carta
                    const cardElement = document.createElement('div');
                    cardElement.style.position = 'absolute';
                    cardElement.style.width = `${settings.cardWidth}mm`;
                    cardElement.style.height = `${settings.cardHeight}mm`;
                    cardElement.style.left = `${x}mm`;
                    cardElement.style.top = `${y}mm`;
                    cardElement.style.overflow = 'hidden';
                    cardElement.style.backgroundColor = 'white';
                    cardElement.style.borderRadius = '3mm';
                    
                    // Genera l'SVG della carta
                    const cardSVG = CardRenderer.generateCardSVG(card);
                    cardElement.innerHTML = cardSVG;
                    
                    // Aggiungi la carta al container della pagina
                    pageContainer.appendChild(cardElement);
                }
                
                // Aggiungi il container della pagina al container temporaneo
                container.innerHTML = '';
                container.appendChild(pageContainer);
                
                // Converti il container in un'immagine e aggiungila al PDF
                const canvas = await html2canvas(pageContainer, {
                    scale: 2, // Aumenta la qualità del rendering
                    logging: false,
                    useCORS: true
                });
                
                // Aggiungi l'immagine al PDF
                const imgData = canvas.toDataURL('image/jpeg', 1.0);
                pdf.addImage(imgData, 'JPEG', 0, 0, 
                    pdf.internal.pageSize.getWidth(), 
                    pdf.internal.pageSize.getHeight());
                
                console.log(`Pagina ${currentPage}/${totalPages} generata.`);
                currentPage++;
            }
            
            // Rimuovi il container temporaneo
            document.body.removeChild(container);
            
            // Pulizia della cache delle immagini
            window.imageCache = null;
            
            // Aggiorna progresso finale
            if (progressCallback) {
                progressCallback(95, 100, 'Salvataggio PDF...');
            }
            
            // Salva il PDF
            pdf.save(filename);
            console.log(`PDF ${filename} generato con successo!`);
            
            // Progresso completato
            if (progressCallback) {
                progressCallback(100, 100, 'PDF generato con successo!');
            }
            
            return true;
        } catch (error) {
            console.error('Errore nella generazione del PDF:', error);
            throw error;
        }
    };
    
    /**
     * Carica le carte da un file JSON e genera il PDF
     * @param {string} jsonUrl - URL del file JSON con i dati delle carte
     * @param {string} filename - Nome del file PDF
     * @param {Function} progressCallback - Callback per aggiornare l'avanzamento
     */
    const generatePDFFromJSON = async (jsonUrl, filename = 'lirya-cards.pdf', progressCallback = null) => {
        try {
            // Carica il file JSON
            const response = await fetch(jsonUrl);
            const cards = await response.json();
            
            // Genera il PDF
            return generatePDF(cards, filename, progressCallback);
        } catch (error) {
            console.error('Errore nel caricamento del JSON:', error);
            throw error;
        }
    };
    
    /**
     * Genera un PDF con un set specifico di carte
     * @param {Array} cardIds - Array di ID carte da includere
     * @param {Array} allCards - Array di tutte le carte disponibili
     * @param {string} filename - Nome del file PDF
     * @param {Function} progressCallback - Callback per aggiornare l'avanzamento
     */
    const generatePDFWithSelectedCards = async (cardIds, allCards, filename = 'lirya-selected-cards.pdf', progressCallback = null) => {
        try {
            // Filtra le carte in base agli ID
            const selectedCards = allCards.filter(card => cardIds.includes(card.id));
            
            // Genera il PDF
            return generatePDF(selectedCards, filename, progressCallback);
        } catch (error) {
            console.error('Errore nella generazione del PDF con carte specifiche:', error);
            throw error;
        }
    };
    
    // Espone le funzioni pubbliche
    return {
        generatePDF,
        generatePDFFromJSON,
        generatePDFWithSelectedCards,
        
        // Espone le impostazioni per poterle modificare dall'esterno
        getSettings: () => ({ ...settings }),
        updateSettings: (newSettings) => {
            Object.assign(settings, newSettings);
        }
    };
})();