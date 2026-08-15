# Cronologia delle Versioni di Police Chronicle

Questo documento traccia le principali modifiche, funzionalità e miglioramenti introdotti in ogni versione di Police Chronicle.

---

### Versione 1.6.0
*Data: Corrente*

**✨ Funzionalità Principali: Controllo Avanzato dell'IA, Intelligence Collaborativa e Miglioramenti UI/UX**

Questa versione introduce un set di funzionalità avanzate focalizzate sul dare all'analista un controllo senza precedenti sul comportamento dell'IA, abilitando al contempo flussi di lavoro collaborativi.

-   **Gestione Avanzata dell'IA**:
    -   **Selezione del Modello AI**: Introdotta una nuova finestra modale ("CAMBIA AI") che permette all'utente di selezionare il modello Gemini da utilizzare. Questa funzionalità migliora la resilienza dell'applicazione, consentendo di aggirare errori di quota su un modello specifico semplicemente passandone a un altro.
    -   **Gestione della Cronologia dei Prompt**: Implementata una schermata di "GESTIONE PROMPT" che offre agli analisti un controllo totale sul processo di apprendimento dell'IA. L'utente può visualizzare l'intera cronologia delle versioni del prompt di ricerca, confrontare il testo completo di diverse versioni e ripristinare una versione precedente come prompt attivo.

-   **Feedback Utente Granulare**:
    -   **Motivi di Archiviazione**: Quando si archivia un caso come "irrilevante", ora è possibile specificare un motivo (`Duplicato`, `Troppo Vecchio`, `Non Rilevante`). Questo fornisce un feedback negativo molto più dettagliato, aiutando l'IA ad affinare più rapidamente i suoi criteri di esclusione.

-   **Intelligence Collaborativa e Importazione Avanzata**:
    -   **Integrazione Database**: La funzionalità "IMPORTA DB" è stata potenziata. All'importazione di un file di backup, l'utente può ora scegliere di **"Integrare"** i dati, fondendo il database importato con quello locale.
    -   **Logica di Fusione Intelligente**: L'integrazione unisce in modo intelligente i casi (mantenendo la versione più recente in caso di conflitto), le impostazioni e, soprattutto, le cronologie di apprendimento dell'IA, creando un profilo di ricerca consolidato e più robusto.
    -   **Migrazione Automatica dei Dati**: Il sistema è ora in grado di importare backup da versioni precedenti del software, aggiornando automaticamente la struttura dei dati per garantire la piena compatibilità.

-   **Miglioramenti all'Interfaccia e all'Usabilità**:
    -   **Documentazione Integrata**: Aggiunto un menu di aiuto ("?") nell'header che consente di accedere direttamente alla Guida Operativa, alle FAQ, alla Cronologia delle Versioni e alla Roadmap direttamente dall'applicazione.
    -   **Avviso su Fonti Non Verificate**: I casi le cui fonti non hanno superato la validazione automatica ora mostrano un'icona di avviso sia nel feed che nel dettaglio, aumentando la consapevolezza dell'analista sulla potenziale qualità inferiore dei dati.
    -   **UI Affinata**: Miglioramenti generali all'interfaccia, inclusa una schermata di caricamento più fluida e una migliore formattazione dei dettagli del caso e dei report esportati.

---

### Versione 1.5.1
*Data: 2024-07-31*

**✨ Miglioramenti UI/UX e Affinamenti**
- **Schermata di Caricamento Migliorata**: L'animazione di caricamento iniziale è stata resa più fluida e visivamente accattivante con un effetto di "fade-in" progressivo.
- **Formattazione Report Migliorata**:
    - Nel dettaglio del caso, le liste di persone e aziende ora utilizzano elenchi numerati per una maggiore leggibilità e un aspetto più professionale.
    - La funzione di esportazione in formato RTF è stata migliorata per gestire correttamente gli elenchi numerati e vari tipi di virgolette, garantendo che i documenti esportati siano più puliti e professionali.
- **Miglioramenti alla Stabilità**: Correzioni minori e miglioramenti alla stabilità generale del codice, inclusa una gestione più robusta dell'importazione di backup da versioni precedenti.

---

### Versione 1.5.0
*Data: 2024-07-30*

**✨ Funzionalità Principali: Intelligence Collaborativa e Fusione dei Database**
- **Integrazione Database**: La funzionalità "IMPORTA DB" è stata potenziata. All'importazione di un file di backup, l'utente può ora scegliere tra:
    1.  **Sovrascrivi**: Il comportamento precedente, che rimpiazza completamente il database locale.
    2.  **Integra**: Una nuova potente opzione che fonde il database importato con quello locale.
- **Logica di Fusione Intelligente**:
    -   **Casi**: I nuovi casi vengono aggiunti. In caso di conflitti (stesso ID), viene conservata la versione con la data di `lastUpdateTimestamp` più recente.
    -   **Apprendimento dell'IA (Cronologia Prompt)**: Le cronologie dei prompt vengono unite, deduplicate e riordinate cronologicamente, consolidando l'esperienza di più analisti in un unico profilo di ricerca più robusto.
    -   **Contatori e Cache**: I contatori dei casi e le cache delle coordinate vengono fusi in modo sicuro per mantenere la coerenza dei dati.
- **Migrazione Automatica dei Dati**: Il sistema ora è in grado di importare backup da versioni precedenti del software, aggiornando automaticamente la struttura dei dati per garantire la piena compatibilità senza perdita di informazioni.
- **Obiettivo Strategico**: Queste funzionalità abilitano un modello di **intelligence collaborativa**, permettendo a team o analisti di condividere e consolidare le loro scoperte e l'apprendimento dell'IA, migliorando esponenzialmente le capacità di ricerca del sistema nel suo complesso.
- **Aggiornamenti alla Documentazione**: Aggiornati i file di aiuto (`help.md`, `FAQ.md`) per spiegare il nuovo processo di importazione e la migrazione.

---

### Versione 1.4.4
*Data: 2024-07-29*

**✨ Funzionalità Principali: Pieno Controllo sull'IA e Resilienza**
- **Selezione del Modello AI**: Introdotta una nuova finestra modale ("CAMBIA AI") che permette all'utente di selezionare il modello Gemini da utilizzare. Questa funzionalità migliora la resilienza dell'applicazione, consentendo di aggirare errori di quota su un modello specifico semplicemente passandone a un altro.
- **Gestione della Cronologia dei Prompt**: Implementata una schermata di "GESTIONE PROMPT" che offre agli analisti un controllo senza precedenti sul processo di apprendimento dell'IA. L'utente può:
    - Visualizzare l'intera cronologia delle versioni del prompt di ricerca.
    - Confrontare il testo completo di diverse versioni.
    - Ripristinare una versione precedente come prompt attivo, creando una nuova versione basata su quella scelta.
- **Miglioramenti UI/UX**:
    - Aggiunti i pulsanti "CAMBIA AI" e "GESTIONE PROMPT" all'header della dashboard per un accesso rapido.
    - Lo stato del modello AI selezionato viene salvato in modo persistente.
- **Aggiornamenti alla Documentazione**: Aggiornati i file `FAQ.md`, `help.md` e `README.md` per riflettere le nuove funzionalità di controllo dell'IA.

---

### Versione 1.4.0
**✨ Funzionalità Principali: Reporting Avanzato e Miglioramenti di Usabilità**
- **Reporting Avanzato allineato a Standard Professionali**: Il prompt di "Approfondimento" è stato completamente rivisto per aderire a standard professionali di intelligence. I report ora includono:
    - Livelli di confidenza espliciti.
    - Una chiara distinzione tra fatti e ipotesi analitiche.
    - L'identificazione delle lacune informative.
- **Traduzione dei Report**: Aggiunta la funzionalità per tradurre i report di approfondimento in inglese professionale per la condivisione internazionale.
- **Geocodifica Contestuale**: Migliorata drasticamente l'affidabilità della geocodifica. Se un nome di città non viene trovato, il sistema ritenta utilizzando il titolo del caso come contesto, risolvendo problemi con nomi di frazioni o refusi.
- **Feed dei Casi Migliorato**: La lista dei casi ora include schede per filtrare rapidamente tra `Non Letti`, `Importanti`, `Irrilevanti` e `Tutti`, oltre a una barra di ricerca e un filtro per data.
- **Stato "Letto/Non Letto"**: I casi vengono ora tracciati come `isRead`, e passano automaticamente allo stato "letto" alla prima selezione.

---

### Versione 1.3.0
**✨ Funzionalità Principali: Affidabilità e Geocodifica**
- **Verifica della Provenienza**: Introdotto un meccanismo critico (`processProvenance`) che convalida ogni fonte generata dall'IA confrontandola con i metadati di Google Search. Le fonti non verificabili ("allucinate") vengono scartate, e i casi senza alcuna fonte valida vengono eliminati, aumentando enormemente l'affidabilità dei dati.
- **Cache per le Coordinate**: Implementata una cache in-memory e su IndexedDB per le coordinate delle città, riducendo le chiamate API e velocizzando il caricamento della mappa.
- **Tracciamento Metodo di Origine**: Aggiunto il campo `sourceMethod` per distinguere tra casi `AutoDiscovered` (trovati dall'IA) e `AnalystReported` (inseriti manualmente), un dato cruciale per il sistema di apprendimento.

---

### Versione 1.2.0
**✨ Funzionalità Principali: Intervento Manuale e Portabilità dei Dati**
- **Segnalazione URL**: Aggiunta la funzione "SEGNALA URL" per consentire all'analista di creare manualmente un caso a partire da un link specifico.
- **Import/Export del Database**: Implementate le funzionalità per esportare l'intero database (casi e impostazioni) in un file JSON e per reimportarlo, garantendo backup e portabilità.
- **Monitoraggio 24H**: Aggiunto un interruttore per estendere il monitoraggio automatico delle notizie al di fuori della finestra oraria predefinita.

---

### Versione 1.1.0
**✨ Funzionalità Principali: Analisi Avanzata e Feedback dell'Analista**
- **Generazione di Report ("Approfondimento")**: Prima implementazione della funzionalità per generare report di analisi dettagliati sui casi.
- **Aggiornamento dei Casi**: Aggiunta la funzione "AGGIORNA" per arricchire un caso esistente con nuove informazioni.
- **Sistema di Feedback**: Introdotti i meccanismi per marcare un caso come "Importante" o "Irrilevante", ponendo le basi per il sistema di apprendimento dell'IA.

---

### Versione 1.0.0
**✨ Funzionalità Principali: Rilascio Iniziale**
- **Dashboard Principale**: Struttura di base con mappa interattiva (Leaflet.js), feed dei casi e pannello di dettaglio.
- **Generazione Automatica di Casi**: L'IA, basata su Gemini, monitora le fonti giornalistiche per creare automaticamente i casi.
- **Persistenza dei Dati**: Utilizzo di Dexie.js (IndexedDB) per l'archiviazione locale dei dati.
- **Tema Chiaro/Scuro**: Interfaccia con doppio tema per il comfort visivo dell'analista.