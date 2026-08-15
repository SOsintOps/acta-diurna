# Roadmap e Idee Future (TODO)

Questo documento elenca le funzionalità e i miglioramenti pianificati o considerati per le future versioni di Police Chronicle. Non c'è una timeline definita per queste idee.

---

## Funzionalità Principali

-   **Monitoraggio di Entità Specifiche (Persone e Aziende)**
    -   **Descrizione:** Creare una sezione "Entità Monitorate" dove l'analista può aggiungere nomi di persone o aziende di interesse. Il sistema dovrebbe notificare proattivamente l'analista se queste entità compaiono in nuove notizie, anche se non legate a un'operazione di polizia di grande rilievo.
    -   **Obiettivo:** Passare da un monitoraggio basato su eventi a uno basato anche su entità, permettendo un tracciamento a lungo termine.

-   **Versione Multilingua**
    -   **Descrizione:** Estendere le capacità di analisi dell'IA per monitorare fonti giornalistiche in altre lingue (es. inglese, tedesco, spagnolo) alla ricerca di operazioni connesse all'Italia. L'interfaccia dovrebbe rimanere in italiano, ma i dati potrebbero provenire da fonti internazionali.
    -   **Obiettivo:** Ampliare il raggio della raccolta di intelligence per includere la criminalità transnazionale che coinvolge l'Italia.

-   **Analisi dei Collegamenti tra Casi**
    -   **Descrizione:** Implementare un'analisi automatica per identificare potenziali collegamenti tra casi diversi (es. stesse persone, stesse aziende, modus operandi simili). I collegamenti potrebbero essere visualizzati graficamente.
    -   **Obiettivo:** Aiutare l'analista a scoprire reti e pattern criminali che non sono evidenti analizzando i singoli casi.

## Miglioramenti Tecnici e di Usabilità

-   **Ottimizzazione delle Prestazioni per Grandi Database**
    -   **Descrizione:** Testare e ottimizzare le performance dell'applicazione quando il database locale supera diverse migliaia di casi, ad esempio introducendo la paginazione virtuale nel feed.
    -   **Obiettivo:** Garantire che l'applicazione rimanga veloce e reattiva anche dopo un uso prolungato.
