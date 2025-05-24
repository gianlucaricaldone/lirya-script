# LIRYA - SPECIFICHE COMPLETE DI GIOCO PER SVILUPPATORI

## 1. PANORAMICA E OBIETTIVI

### 1.1 Descrizione del Gioco
Lirya è un gioco di carte collezionabili strategico per 2 giocatori ambientato in un mondo fantasy. I giocatori controllano eserciti di personaggi magici utilizzando un sistema a zone tattiche per ridurre i punti vita dell'avversario da 20 a 0.

### 1.2 Obiettivo di Vittoria
**Condizione Primaria**: Ridurre i punti vita dell'avversario a 0 o meno.
**Condizioni Secondarie**: 
- Se un giocatore non può pescare una carta quando richiesto, perde immediatamente
- Alcune carte speciali possono creare condizioni di vittoria alternative (implementazione futura)

### 1.3 Componenti di Gioco
- Mazzi di carte dei giocatori (40-60 carte ciascuno)
- Contatori punti vita (inizio: 20 per giocatore)
- Contatori energia (inizio: 1 per giocatore, massimo: 10)
- Zone di gioco definite
- Pile scarti separate per giocatore

---

## 2. TIPOLOGIE DI CARTE E PROPRIETÀ

### 2.1 Classificazioni Principali

#### Classi di Personaggio
Il sistema riconosce quattro classi distinte: Guerriero, Mago, Ranger, Chierico. Ogni classe determina le abilità disponibili e il posizionamento preferito nelle zone di combattimento.

#### Elementi
Esistono sei elementi nel gioco: Fuoco, Acqua, Terra, Aria, Luce, Ombra. Gli elementi servono come identificatori tematici per sinergie e requisiti, non creano vantaggi diretti in combattimento.

#### Rarità
Le carte sono classificate in cinque livelli di rarità: Comune, Non Comune, Rara, Ultra-Rara, Leggendaria. La rarità influenza la potenza della carta e i limiti di inclusione nel mazzo.

#### Tipi di Carta
Il gioco utilizza quattro tipi principali: Personaggio, Struttura, Incantesimo, Equipaggiamento. Ogni tipo ha regole specifiche di utilizzo e posizionamento.

### 2.2 Proprietà Base delle Carte
Ogni carta possiede un identificativo univoco, un nome, un tipo, una rarità, un costo in energia, e opzionalmente un elemento e una classe. Le carte includono testo descrittivo e riferimenti alle immagini associate.

### 2.3 Carte Personaggio
I personaggi sono caratterizzati da tre statistiche numeriche: Attacco (0-10), Difesa (0-10), e Punti Vita (1-15). Possiedono abilità speciali e possono essere equipaggiati. Ogni personaggio ha un posizionamento preferito ma alcune possono essere collocate in zone multiple.

Durante il gioco, i personaggi mantengono i punti vita correnti separati da quelli base, possono accumulare modificatori temporanei, equipaggiamenti applicati, e stati persistenti che influenzano le loro capacità.

### 2.4 Carte Struttura
Le strutture operano su un sistema a tre livelli. Iniziano al livello 1 quando costruite e possono essere potenziate pagando costi aggiuntivi fino al livello 3. Ogni livello fornisce effetti crescenti e maggiore resistenza.

Le strutture possiedono Punti Struttura che rappresentano la loro resistenza ai danni. Mantengono il livello corrente, i punti struttura attuali, e gli effetti attualmente attivi basati sul loro livello.

### 2.5 Carte Incantesimo
Gli incantesimi sono effetti istantanei che non rimangono sul campo dopo l'utilizzo. Definiscono il tipo di bersaglio ammesso, gli effetti da applicare, e eventuali requisiti speciali per il lancio.

### 2.6 Carte Equipaggiamento
Gli equipaggiamenti si attaccano permanentemente ai personaggi fornendo modificatori alle statistiche e abilità aggiuntive. Ogni equipaggiamento specifica i requisiti per essere utilizzato e occupa uno slot specifico del personaggio equipaggiato.

---

## 3. SISTEMA DI ABILITÀ E EFFETTI

### 3.1 Classificazione delle Abilità
Le abilità si dividono in quattro categorie funzionali:

**Abilità Passive**: Sempre attive finché la carta rimane in gioco, forniscono effetti continui senza richiedere attivazione.

**Abilità Attivate**: Richiedono un'azione specifica del giocatore per essere utilizzate, spesso con costi associati o limitazioni di utilizzo.

**Abilità Innescate**: Si attivano automaticamente quando si verificano condizioni specifiche durante il gioco.

**Abilità di Risposta**: Possono essere attivate in risposta ad azioni di altri giocatori, interrompendo il normale flusso del gioco.

### 3.2 Struttura delle Abilità
Ogni abilità possiede un nome identificativo, una descrizione testuale, e una serie di effetti meccanici. Le abilità innescate specificano i trigger che le attivano, mentre quelle attivate definiscono i costi di attivazione.

Le abilità possono avere limitazioni d'uso per turno o per partita. Il sistema traccia automaticamente gli utilizzi rimanenti e impedisce l'attivazione quando i limiti sono raggiunti.

### 3.3 Eventi Scatenanti
Il sistema riconosce numerosi eventi che possono innescare abilità: inizio e fine turno, entrata e uscita dal gioco, attacchi e difese, danni inflitti e subiti, evocazioni di personaggi, costruzioni di strutture, lancio di incantesimi, e cambiamenti di zona.

### 3.4 Categorie di Effetti
Gli effetti delle abilità coprono diverse aree:

**Danno e Guarigione**: Inflizione di danni diretti a personaggi, strutture o giocatori, e guarigione di punti vita.

**Modificatori Statistiche**: Alterazioni temporanee o permanenti di Attacco, Difesa, e Punti Vita.

**Movimento e Posizionamento**: Spostamento di personaggi tra zone, scambio di posizioni.

**Manipolazione Carte**: Pesca, scarto, ricerca nel mazzo, recupero dalla pila scarti, rimessa in gioco.

**Controllo**: Acquisizione temporanea del controllo di carte avversarie, distruzione di carte.

**Evocazione**: Creazione di token personaggio con statistiche definite.

**Informazioni**: Visualizzazione di carte nascoste, mani avversarie, prime carte del mazzo.

**Risorse**: Guadagno di energia, riduzione di costi di carte.

**Stati**: Applicazione o rimozione di condizioni persistenti, concessione di immunità.

**Strutture**: Potenziamento e riparazione di strutture esistenti.

---

## 4. ZONE DI GIOCO E REGOLE DI POSIZIONAMENTO

### 4.1 Configurazione del Campo
Ogni giocatore controlla sei zone distinte: Prima Linea (4 slot), Seconda Linea (4 slot), Zona Strutture (3 slot), Mano, Mazzo, e Pila Scarti.

Le prime tre zone costituiscono il campo di battaglia attivo dove le carte interagiscono direttamente. Le altre sono zone di gestione per le carte non attive.

### 4.2 Meccaniche di Posizionamento
**Prima Linea**: Zona preferita per Guerrieri e personaggi difensivi. Fornisce protezione alla seconda linea ma limita le opzioni di attacco ai soli personaggi nemici in prima linea, salvo abilità speciali.

**Seconda Linea**: Zona preferita per Maghi, Ranger e Chierici. Offre libertà di attacco contro qualsiasi zona nemica ma risulta vulnerabile se la prima linea viene eliminata.

**Zona Strutture**: Esclusiva per le strutture, non può essere attaccata direttamente salvo abilità speciali. Fornisce effetti di supporto continui.

### 4.3 Restrizioni di Classe
Ogni classe ha zone preferite determinate dal loro ruolo tattico:

**Guerrieri**: Possono essere collocati in entrambe le linee ma eccellono in prima linea per il loro ruolo difensivo.

**Maghi**: Principalmente in seconda linea per sfruttare la loro capacità di attacco a distanza, alcuni possono operare in prima linea.

**Ranger**: Completamente flessibili, possono essere efficaci in entrambe le linee.

**Chierici**: Principalmente in seconda linea per massimizzare le capacità di supporto, alcuni speciali possono operare in prima linea.

### 4.4 Regole di Attacco per Zona
**Personaggi in Prima Linea:**
- Possono attaccare personaggi nemici in prima linea
- Se la prima linea nemica è vuota, possono attaccare la seconda linea
- Se entrambe le linee nemiche sono vuote, possono attaccare direttamente il giocatore avversario
- L'abilità "Assalto" permette eccezioni a queste restrizioni

**Personaggi in Seconda Linea:**
- Possono attaccare liberamente qualsiasi personaggio nemico (prima o seconda linea)
- Possono attaccare le strutture nemiche
- Possono attaccare direttamente il giocatore avversario SOLO se entrambe le linee nemiche sono vuote

Questa gerarchia di protezione garantisce che le linee anteriori proteggano quelle posteriori e il giocatore.

---

## 5. FLUSSO DEL TURNO DETTAGLIATO

### 5.1 Struttura delle Fasi
Ogni turno si divide in quattro fasi sequenziali: Inizio Turno, Fase Principale, Fase Combattimento, e Fine Turno. Ogni fase ha regole specifiche e azioni permesse.

### 5.2 Fase di Inizio Turno
Il giocatore attivo pesca automaticamente una carta dal proprio mazzo. Il fallimento nella pesca causa sconfitta immediata.

L'energia del giocatore aumenta di 1 punto, fino al massimo di 10. Questo rappresenta la crescente capacità di manifestare magie potenti.

Tutti gli utilizzi per turno delle abilità vengono ripristinati al valore massimo.

Si attivano automaticamente tutte le abilità con trigger "Inizio Turno" in ordine di entrata in gioco.

Le strutture che permettono pesca da mazzi speciali offrono questa opportunità prima di passare alla fase successiva.

### 5.3 Fase Principale
Il giocatore può eseguire azioni in qualsiasi ordine e quantità, limitato solo dall'energia disponibile:

**Evocazione Personaggi**: Posizionamento di personaggi dalla mano nelle zone appropriate, pagando il costo in energia.

**Costruzione Strutture**: Posizionamento di strutture nella zona dedicata, pagando il costo iniziale.

**Potenziamento Strutture**: Miglioramento di strutture esistenti ai livelli superiori, pagando costi aggiuntivi.

**Equipaggiamento**: Applicazione di equipaggiamenti dalla mano ai personaggi in gioco, rispettando i requisiti e i limiti di slot.

**Lancio Incantesimi**: Utilizzo di incantesimi per effetti immediati, consumando la carta dopo l'uso.

**Attivazione Abilità**: Utilizzo di abilità attivate dei personaggi e strutture, rispettando costi e limitazioni.

La fase continua fino a quando il giocatore decide di terminarla volontariamente.

### 5.4 Fase di Combattimento
La fase si articola in tre sottofasi obbligatorie:

**Dichiarazione Attacchi**: Il giocatore attivo seleziona quali personaggi attaccano e i loro bersagli. Solo personaggi che non hanno attaccato questo turno e non sono impediti da stati negativi possono attaccare. I personaggi evocati questo turno non possono attaccare salvo abilità speciali.

**Dichiarazione Difese**: Il giocatore avversario può assegnare personaggi difensori agli attacchi diretti contro di lui. Solo personaggi in prima linea possono normalmente difendere. La difesa redirige completamente l'attacco dal giocatore al difensore.

**Risoluzione Combattimenti**: Ogni combattimento si risolve calcolando i danni come Attacco meno Difesa (minimo 0), applicando i danni risultanti ai punti vita del bersaglio. I personaggi ridotti a 0 punti vita vengono eliminati. Le abilità di combattimento si attivano durante questa fase.

### 5.5 Fase di Fine Turno
Gli effetti di fine turno delle strutture si attivano in ordine di costruzione.

Tutte le abilità con trigger "Fine Turno" si attivano automaticamente.

Gli effetti temporanei applicati "fino alla fine del turno" vengono rimossi.

Gli stati persistenti vengono aggiornati, decrementando la durata e rimuovendo quelli scaduti.

Si verifica se sono state raggiunte condizioni di vittoria.

Il controllo passa al giocatore avversario per il turno successivo.

---

## 6. SISTEMA DI COMBATTIMENTO

### 6.1 Requisiti per Attaccare
Un personaggio può attaccare quando possiede punti vita superiori a zero, non è affetto da stati che impediscono l'attacco (come Stordito), non ha già attaccato nel turno corrente, e ha completato almeno un turno completo in gioco oppure possiede abilità di attacco immediato.

### 6.2 Selezione dei Bersagli
La validità dei bersagli segue una gerarchia di protezione basata sulla zona dell'attaccante:

**Attaccanti in Prima Linea:**
- Priorità 1: Personaggi nemici in prima linea
- Priorità 2: Personaggi nemici in seconda linea (solo se prima linea nemica vuota)
- Priorità 3: Giocatore avversario (solo se entrambe le linee nemiche vuote)
- L'abilità "Assalto" bypassa queste restrizioni

**Attaccanti in Seconda Linea:**
- Possono scegliere liberamente tra tutti i personaggi nemici (prima o seconda linea)
- Possono attaccare strutture nemiche
- Possono attaccare il giocatore avversario solo se entrambe le linee nemiche sono vuote

### 6.3 Meccaniche di Difesa
La difesa è un'azione volontaria disponibile solo quando il giocatore stesso viene attaccato direttamente. Solo personaggi in prima linea possono normalmente intercettare attacchi. La difesa trasforma l'attacco da diretto contro il giocatore a diretto contro il personaggio difensore.

### 6.4 Calcolo dei Danni
Il danno base si calcola sottraendo la Difesa del bersaglio dall'Attacco dell'attaccante. Il risultato, se positivo, viene applicato ai punti vita correnti del bersaglio. 

Esistono varianti di danno: il danno perforante ignora parzialmente la difesa, il danno puro bypassa completamente la difesa, e il danno curativo guarisce invece di danneggiare.

### 6.5 Conseguenze del Combattimento
Quando i punti vita di un personaggio raggiungono zero, viene immediatamente eliminato e spostato nella pila scarti del proprietario. Gli equipaggiamenti applicati vengono scartati insieme al personaggio.

Le abilità innescate da danni inflitti, danni subiti, eliminazione di personaggi, e altri eventi di combattimento si attivano dopo la risoluzione di ogni singolo combattimento.

---

## 7. SISTEMA DI ENERGIA E COSTI

### 7.1 Meccaniche Energetiche
Ogni giocatore inizia con 1 punto energia e ne guadagna 1 aggiuntivo all'inizio di ogni turno, fino al massimo di 10. L'energia rappresenta la capacità magica crescente durante la partita.

L'energia spesa durante il turno non si rigenera automaticamente, rendendo la gestione delle risorse una componente strategica cruciale.

### 7.2 Determinazione dei Costi
Il costo base di ogni carta è fisso e stampato sulla carta stessa. Tuttavia, modificatori temporanei o permanenti possono alterare questo costo.

Le riduzioni di costo si applicano prima dell'addizione di incrementi. Il costo finale non può mai essere negativo, venendo automaticamente portato a zero in caso di riduzioni eccessive.

### 7.3 Validazione delle Azioni
Prima di eseguire qualsiasi azione che richiede energia, il sistema verifica che il giocatore possegga energia sufficiente e soddisfi eventuali requisiti aggiuntivi della carta.

Alcuni effetti permettono di "pagare con risorse alternative" o di "giocare gratuitamente", bypassando temporaneamente i requisiti energetici standard.

### 7.4 Azioni Senza Costo
Alcune azioni non richiedono energia: attivazione di abilità senza costo, dichiarazione di attacchi e difese, cambio di posizione per personaggi con mobilità gratuita, e passaggio di fase.

---

## 8. SISTEMA DI EQUIPAGGIAMENTI

### 8.1 Categorie di Slot
Gli equipaggiamenti si dividono in categorie che determinano dove possono essere applicati:

**Armi**: Massimo una per personaggio, influenzano principalmente l'attacco.

**Armature**: Massimo una per personaggio, influenzano principalmente la difesa.

**Accessori**: Massimo due per personaggio, effetti vari.

**Universali**: Massimo tre per personaggio di qualsiasi tipo, effetti flessibili.

### 8.2 Processo di Equipaggiamento
L'applicazione di un equipaggiamento richiede che il personaggio bersaglio soddisfi i requisiti specificati (classe, elemento, statistiche minime) e possegga slot liberi della categoria appropriata.

L'equipaggiamento viene rimosso dalla mano del giocatore e associato permanentemente al personaggio. I modificatori alle statistiche si applicano immediatamente e persistono finché il personaggio rimane in gioco.

### 8.3 Calcolo Statistiche Composite
Le statistiche finali di un personaggio derivano dalla somma delle statistiche base, dei bonus da equipaggiamenti, dei modificatori temporanei da abilità e incantesimi, e dei bonus da strutture che influenzano il personaggio.

I modificatori si applicano in ordine specifico: prima gli equipaggiamenti, poi gli effetti temporanei, infine i bonus delle strutture. Alcuni effetti possono specificare ordini di applicazione alternativi.

### 8.4 Rimozione degli Equipaggiamenti
Gli equipaggiamenti vengono automaticamente scartati quando il personaggio equipaggiato viene eliminato dal gioco. Alcuni effetti speciali permettono di trasferire equipaggiamenti tra personaggi o di recuperarli quando i personaggi vengono eliminati.

---

## 9. SISTEMA DI STRUTTURE

### 9.1 Meccaniche di Costruzione
Le strutture vengono costruite pagando il costo iniziale e occupando uno slot nella zona strutture. Iniziano sempre al livello 1 con i punti struttura massimi per quel livello.

### 9.2 Sistema di Potenziamento
Ogni struttura può essere potenziata fino al livello 3 pagando costi aggiuntivi specifici per ogni livello. Il potenziamento è istantaneo e attiva immediatamente gli effetti del nuovo livello.

I potenziamenti devono essere applicati in ordine sequenziale: non è possibile saltare dal livello 1 al livello 3 direttamente.

### 9.3 Effetti delle Strutture
Gli effetti si dividono in categorie funzionali:

**Bonus Statistiche**: Miglioramenti permanenti alle caratteristiche dei personaggi.

**Riduzione Costi**: Diminuzione del costo energetico di carte specifiche.

**Pesca Aggiuntiva**: Accesso a carte extra dal mazzo principale o da mazzi speciali.

**Guarigione Automatica**: Ripristino periodico di punti vita.

**Protezione Zonale**: Difese specifiche per zone del campo.

**Generazione Energia**: Punti energia aggiuntivi per turno.

### 9.4 Persistenza e Distruzione
Le strutture rimangono attive finché non vengono distrutte da attacchi diretti o effetti speciali. Quando una struttura viene distrutta, tutti i suoi effetti cessano immediatamente.

Alcune strutture possiedono abilità di auto-riparazione o protezione che le rendono più resistenti alla distruzione.

---

## 10. STATI PERSISTENTI E MODIFICATORI

### 10.1 Tipi di Stati
Gli stati persistenti rappresentano condizioni che influenzano i personaggi per periodi prolungati:

**Stordito**: Impedisce di attaccare per un numero specificato di turni.

**Avvelenato**: Infligge danni automatici all'inizio di ogni turno.

**Paralizzato**: Impedisce qualsiasi azione del personaggio.

**Stealth**: Rende il personaggio non attaccabile fino a quando non compie un attacco.

**Immunità**: Protezione completa da tipi specifici di danno o effetti.

**Maledetto**: Riduzione temporanea delle statistiche.

**Benedetto**: Miglioramento temporaneo delle statistiche.

**Rigenerazione**: Guarigione automatica periodica.

**Vulnerabile**: Incremento dei danni subiti.

**Fortificato**: Riduzione dei danni subiti.

### 10.2 Gestione della Durata
Ogni stato possiede una durata specifica che può essere espressa in turni, permanente fino a rimozione, o legata a condizioni specifiche.

Gli stati con durata limitata decrementano automaticamente all'inizio di ogni turno e vengono rimossi quando raggiungono zero.

### 10.3 Interazioni tra Stati
Stati dello stesso tipo generalmente non si accumulano, sostituendosi con l'applicazione più recente. Stati di tipo opposto (benedetto/maledetto) si annullano reciprocamente.

Alcuni stati possiedono immunità incorporate: un personaggio benedetto potrebbe essere immune alle maledizioni, o un personaggio con immunità al veleno non può essere avvelenato.

### 10.4 Rimozione degli Stati
Gli stati possono essere rimossi tramite effetti specifici di purificazione, scadenza naturale, eliminazione del personaggio, o condizioni speciali definite dallo stato stesso.

Alcuni stati sono marcati come "non rimuovibili" e persistono fino alla fine della partita o all'eliminazione del personaggio.

---

## 11. SISTEMA DI PRIORITÀ E TIMING

### 11.1 Struttura dello Stack
Il gioco utilizza un sistema di stack per gestire azioni e risposte multiple. Le azioni vengono aggiunte al stack nell'ordine di dichiarazione e risolte in ordine inverso (ultima entrata, prima uscita).

### 11.2 Finestre di Risposta
Dopo ogni azione significativa, entrambi i giocatori ricevono l'opportunità di rispondere con abilità di risposta appropriata. Il giocatore non attivo riceve priorità per le risposte, seguito dal giocatore attivo.

### 11.3 Risoluzione Sequenziale
Ogni azione nello stack deve essere completamente risolta prima di procedere alla successiva. Durante la risoluzione, possono innescarsi abilità aggiuntive che vengono aggiunte al stack.

### 11.4 Abilità di Risposta
Certe abilità sono designate come "risposte" e possono essere attivate durante le finestre appropriate per interrompere o modificare azioni in corso. Esempi includono controincantesimi, evasioni, e protezioni.

### 11.5 Eventi Simultanei
Quando più eventi si verificano simultaneamente, il giocatore attivo determina l'ordine di risoluzione per i propri effetti, seguito dal giocatore non attivo per i suoi.

---

## 12. REGOLE DI COSTRUZIONE MAZZO

### 12.1 Requisiti Dimensionali
Ogni mazzo deve contenere tra 40 e 60 carte. Non esistono requisiti minimi per tipologie di carte specifiche, permettendo strategie specializzate.

### 12.2 Limitazioni per Carta
Massimo 2 copie di qualsiasi carta specifica possono essere incluse nel mazzo, indipendentemente dalla rarità, ad eccezione delle carte Leggendarie che sono limitate a 1 copia ciascuna.

### 12.3 Restrizioni sulle Leggendarie
Il numero massimo di carte Leggendarie totali in un mazzo è 3, indipendentemente dal fatto che siano copie della stessa carta o carte diverse.

### 12.4 Linee Guida per la Distribuzione
Sebbene non obbligatorie, le distribuzioni raccomandate suggeriscono: 50% personaggi, 20% strutture, 15% incantesimi, 15% equipaggiamenti. Queste proporzioni bilanciano versatilità tattica e consistenza strategica.

### 12.5 Validazione del Mazzo
Prima dell'inizio di ogni partita, il sistema verifica automaticamente che il mazzo soddisfi tutti i requisiti. Mazzi non conformi non possono essere utilizzati in partite ufficiali.

---

## 13. ALGORITMI DI GESTIONE CARTE

### 13.1 Operazioni Base del Mazzo
**Mescolamento**: Randomizzazione completa dell'ordine delle carte utilizzando algoritmi crittograficamente sicuri per garantire equità.

**Pesca**: Rimozione della prima carta del mazzo e trasferimento nella mano del giocatore.

**Ricerca**: Scansione del mazzo per carte che soddisfano criteri specifici, mantenendo l'ordine del resto.

### 13.2 Manipolazione Avanzata
**Riordinamento Selettivo**: Alcune abilità permettono di riorganizzare le prime carte del mazzo in ordini specifici.

**Inserimento Mirato**: Posizionamento di carte in posizioni specifiche del mazzo (cima, fondo, posizioni numeriche).

**Filtraggio**: Separazione temporanea di carte per tipo, classe, elemento, o altri criteri per elaborazioni speciali.

### 13.3 Gestione della Pila Scarti
Le carte scartate mantengono l'ordine di scarto. Alcune abilità permettono di esaminare, recuperare, o riorganizzare la pila scarti. La pila scarti è generalmente visibile a entrambi i giocatori.

### 13.4 Mazzi Speciali
Strutture specifiche garantiscono accesso a mazzi separati contenenti carte specializzate. Questi mazzi operano con regole simili al mazzo principale ma sono accessibili solo tramite effetti specifici.

---

## 14. SISTEMA DI EVENTI E NOTIFICHE

### 14.1 Classificazione degli Eventi
Il sistema traccia numerosi tipi di eventi: gioco di carte, evocazioni, attacchi, danni, eliminazioni, attivazioni di abilità, cambi di fase, e termine partita. Ogni evento trasporta informazioni contestuali rilevanti.

### 14.2 Propagazione degli Eventi
Gli eventi si propagano attraverso un sistema di osservatori che permette a abilità, strutture, e componenti di sistema di reagire appropriatamente agli sviluppi del gioco.

### 14.3 Ordine di Notifica
Le notifiche seguono un ordine gerarchico: prima gli effetti obbligatori, poi quelli opzionali, infine gli effetti ritardati. All'interno di ogni categoria, il giocatore attivo determina l'ordine.

### 14.4 Memorizzazione Eventi
Una cronologia completa degli eventi viene mantenuta per supportare funzionalità di replay, analisi post-partita, e risoluzione di dispute.

---

## 15. VALIDAZIONI E CONTROLLI DI INTEGRITÀ

### 15.1 Validazioni Pre-Azione
Prima di ogni azione, il sistema verifica: disponibilità di energia sufficiente, soddisfacimento dei requisiti della carta, disponibilità di slot appropriati, validità dei bersagli selezionati, e assenza di impedimenti da stati negativi.

### 15.2 Controlli di Stato
Verifiche periodiche assicurano che: i limiti delle zone siano rispettati, l'energia non sia negativa o oltre il massimo, i punti vita siano coerenti con lo stato della partita, e le condizioni di vittoria siano correttamente rilevate.

### 15.3 Validazione Tempo Reale
Durante il gioco, controlli continui monitorano la coerenza dello stato: corrispondenza tra statistiche base e modificatori, validità delle associazioni equipaggiamento-personaggio, correttezza dei contatori di utilizzi abilità.

### 15.4 Rilevamento Anomalie
Il sistema identifica e segnala situazioni anomale: loop infiniti di abilità, stati contradittori simultanei, violazioni delle regole fondamentali, manipolazioni non autorizzate dei dati di gioco.

---

## 16. INTERFACCIA E COMUNICAZIONE

### 16.1 Comandi del Giocatore
Il sistema riconosce comandi per: evocazione personaggi, costruzione strutture, lancio incantesimi, dichiarazione attacchi e difese, attivazione abilità, passaggio di fase, e resa.

### 16.2 Stato per Visualizzazione
L'interfaccia riceve aggiornamenti continui su: giocatore attivo, fase corrente, numero turno, stato di entrambi i giocatori, contenuto delle zone visibili, azioni disponibili, e messaggi di stato.

### 16.3 Informazioni dei Giocatori
Per ogni giocatore vengono tracciati: punti vita correnti, energia disponibile, numero carte in mano e mazzo, contenuto delle zone di gioco, statistiche correnti dei personaggi, stati attivi, equipaggiamenti applicati.

### 16.4 Interattività
L'interfaccia fornisce feedback immediato su: validità delle azioni proposte, costi delle azioni, bersagli disponibili, effetti previsti delle abilità, timer per decisioni con tempo limitato.

---

## 17. PERSISTENZA E RIPRISTINO

### 17.1 Stato Serializzabile
Il sistema può salvare lo stato completo della partita includendo: configurazione iniziale, stato corrente di tutte le zone, cronologia completa delle azioni, seed per la generazione di numeri casuali, timestamp di eventi significativi.

### 17.2 Controllo Versioni
Il sistema di salvataggio include gestione delle versioni per mantenere compatibilità con aggiornamenti futuri del software. Migrazioni automatiche convertono salvataggi di versioni precedenti.

### 17.3 Integrità dei Dati
Checksum e verifiche di integrità proteggono i dati salvati da corruzione accidentale o manipolazione intenzionale. Backup automatici prevengono perdite di dati critici.

### 17.4 Ripristino Parziale
Il sistema supporta il ripristino a punti specifici della partita, permettendo analisi dettagliate e correzione di errori senza ricominciare dall'inizio.

---

## 18. SISTEMA DI REPLAY E ANALISI

### 18.1 Registrazione Completa
Ogni azione viene registrata con timestamp precisi, stato del gioco precedente e successivo, parametri dell'azione, e informazioni sui numeri casuali utilizzati.

### 18.2 Riproduzione Fedele
Il sistema può ricostruire esattamente qualsiasi punto della partita ripetendo la sequenza di azioni dalla registrazione. Questo garantisce analisi accurate e risoluzione di dispute.

### 18.3 Navigazione Temporale
Gli strumenti di replay permettono movimento avanti e indietro nella cronologia della partita, salto a eventi specifici, e riproduzione a velocità variabile.

### 18.4 Analisi Statistiche
Il sistema può estrarre statistiche dettagliate dalle partite registrate: frequenza d'uso delle carte, efficacia delle strategie, punti di svolta critica, performance dei giocatori.

---

## 19. CONSIDERAZIONI IMPLEMENTATIVE

### 19.1 Architettura Modulare
Il sistema deve essere progettato con componenti intercambiabili per facilitare aggiornamenti, espansioni, e personalizzazioni. Interfacce ben definite separano logica di gioco, gestione dati, e presentazione.

### 19.2 Scalabilità
La struttura deve supportare espansioni future: nuove classi di personaggi, elementi aggiuntivi, meccaniche innovative, modalità di gioco alternative, senza richiedere riscritture significative.

### 19.3 Performance
Ottimizzazioni critiche includono: cache per calcoli frequenti, indicizzazione efficiente delle carte, algoritmi di ricerca ottimizzati, gestione memoria per partite lunghe.

### 19.4 Sicurezza
Protezioni contro manipolazioni includono: validazione rigorosa degli input, crittografia per comunicazioni di rete, audit trail completi, meccanismi anti-cheat.

---

## 20. ESTENSIBILITÀ FUTURA

### 20.1 Sistema di Plugin
L'architettura deve supportare plugin per: nuove abilità, effetti personalizzati, modalità di gioco alternative, integrazioni con sistemi esterni.

### 20.2 Modalità Alternative
Il framework deve facilitare l'implementazione di: formati draft, tornei strutturati, gioco cooperativo, varianti casual, campagne single-player.

### 20.3 Internazionalizzazione
Il sistema deve essere preparato per: localizzazione in multiple lingue, adattamenti culturali, regolamentazioni regionali, differenze nei sistemi di numerazione.

### 20.4 Integrazione Tecnologica
Considerazioni per future integrazioni: intelligenza artificiale per avversari, realtà aumentata per visualizzazione, blockchain per autenticità carte, cloud computing per elaborazioni complesse.

---

Questa specifica fornisce una base teorica completa per implementare Lirya senza ambiguità meccaniche, concentrandosi sui concetti e le regole piuttosto che su dettagli implementativi specifici.