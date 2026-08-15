
# Guida Operativa all'Analisi - Acta Diurna

Questo documento fornisce un flusso di lavoro strategico e metodologico per l'analista che utilizza Acta Diurna. L'obiettivo è massimizzare l'efficacia dello strumento aderendo a principi di rigore, oggettività e tracciabilità dell'analisi.

---

### Principio Fondamentale: Lo Strumento come Acceleratore, l'Analista come Garante

Acta Diurna è un potente **acceleratore di intelligence**, non un oracolo. Automatizza le fasi più dispendiose di tempo della raccolta e strutturazione preliminare delle informazioni (OSINT). Tuttavia, l'analista umano rimane il **responsabile finale e insostituibile della validazione, interpretazione, contestualizzazione e del giudizio analitico**.

L'IA fornisce i "mattoni" (i dati estratti); è l'analista che costruisce l'"edificio" (l'intelligence) e ne garantisce la solidità.

---

## Flusso di Lavoro Operativo Strategico

### Fase 1: Triage Iniziale e Valutazione delle Fonti

L'obiettivo di questa fase è scremare rapidamente le nuove informazioni, valutare la qualità delle fonti e fornire un primo, potente feedback all'IA.

1.  **Inizia dalla Scheda "NON LETTI"**: Questo è il tuo punto di partenza quotidiano. Contiene tutti i nuovi casi identificati dall'IA che non hai ancora esaminato.
2.  **Valutazione Rapida (30 secondi per caso)**: Per ogni caso, leggi il titolo e la località. Controlla l'icona "Importante" (stella) o lo stato "Archiviato". Questo ti dà un'idea immediata della potenziale rilevanza.
3.  **CRITICO: Valuta le Fonti PRIMA del Contenuto**: Seleziona un caso. La tua prima azione non è leggere il riepilogo dell'IA, ma **scorrere fino alla sezione "FONTI"**.
    -   **Verifica la Qualità della Fonte**: La fonte è un'agenzia di stampa autorevole (es. ANSA), un quotidiano nazionale, una testata locale nota o un blog sconosciuto? La credibilità della fonte è il primo e più importante indicatore della qualità dell'informazione. Acta Diurna scarta le fonti non verificabili, ma la valutazione della loro autorevolezza spetta a te.
    -   **Apri e Leggi la Fonte Originale**: Clicca su uno o due link. Confronta i fatti principali (nomi, luoghi, importi) dell'articolo originale con il riepilogo generato dall'IA nel pannello "CaseDetail". Questo passaggio è fondamentale per calibrare la tua fiducia nella precisione dell'estrazione dell'IA per quel determinato tipo di notizia.
4.  **Fornisci Feedback Immediato**: Basandoti su questa valutazione iniziale, compi un'azione decisa. Questo è il modo più efficace per addestrare l'IA.
    -   **Caso Chiaramente Irrilevante**: Rumore, notizia non pertinente, duplicato? Usa l'azione **"IRRILEVANTE"** (Archivia). Questo è un feedback negativo potente.
    -   **Caso Palesemente Importante**: Corrisponde a una priorità investigativa nota? Usa l'azione **"IMPORTANTE"**. Questo è un feedback positivo altrettanto potente. Ogni volta che marchi un caso come importante, incrementi un contatore che, una volta raggiunta una soglia (es. 15), attiverà il processo di apprendimento dell'IA.
    -   **Caso Interessante ma Incerto**: Se il caso merita analisi ma non sei ancora sicuro della sua importanza, procedi alla fase successiva. Selezionandolo, lo marchi automaticamente come "letto".

### Fase 2: Analisi Approfondita e Arricchimento del Caso

Una volta identificato un caso rilevante, approfondisci i dettagli forniti e arricchiscili.

1.  **Distingui tra Dati Estratti e Giudizio**: Leggi le sezioni "RIEPILOGO", "PERSONE" e "AZIENDE". Ricorda sempre che questi sono dati **estratti e strutturati** dall'IA, non un'interpretazione. Il "ruolo" di una persona è quello riportato testualmente nell'articolo.
2.  **Caccia alle Lacune (Gap Analysis)**: Cerca attivamente le informazioni mancanti o incomplete. Esempi:
    -   L'articolo parla di "dieci arresti", ma l'IA ha estratto solo tre nomi.
    -   Viene menzionato un "ingente sequestro", ma il valore numerico è `null`.
    -   Una società è menzionata, ma il suo ruolo nel presunto schema non è chiaro.
3.  **Azione di Arricchimento - "AGGIORNA"**: Se noti delle lacune o se sospetti che ci siano stati sviluppi recenti, usa il pulsante **"AGGIORNA"**. Questo non è un semplice "refresh". Invia una nuova richiesta all'IA con l'istruzione specifica di **concentrarsi sul completamento delle informazioni mancanti per quel caso**, ricercando anche nuove fonti.

### Fase 3: Sviluppo del Giudizio Analitico (Report di Approfondimento)

Questa è la fase dove i dati grezzi vengono trasformati in vera e propria intelligence.

1.  **Genera il Report di Approfondimento**: Per i casi più importanti, usa l'azione **"APPROFONDIMENTO"**. Questo non si limita a riassumere; chiede all'IA di agire come un analista senior, sintetizzando tutte le informazioni disponibili (anche quelle trovate durante il processo di reporting stesso) in un documento strutturato.
2.  **Analisi Critica del Report (Usa la sua struttura come guida)**:
    -   **`### 1. Riepilogo dei Fatti`**: Verifica che i fatti chiave siano stati riportati accuratamente e senza distorsioni.
    -   **`### 2. Analisi del Modus Operandi`**: L'analisi del modus operandi è coerente con la tua conoscenza del fenomeno criminale? L'IA ha colto le sfumature dello schema?
    -   **`### 3. Entità Coinvolte (Dettagli)`**: Confronta questo elenco con quello nel pannello dei dettagli. È più completo? Ci sono nuove entità emerse?
    -   **`### 4. Valutazione Analitica`**: **Questa è la sezione più importante del report.**
        -   **Livello di Confidenza**: L'IA fornisce un livello di confidenza (es. "Alto"). Sei d'accordo? La sua motivazione è solida (es. "basato sulla concordanza di più fonti primarie")?
        -   **Fatti vs. Ipotesi**: L'IA è stata istruita a distinguere i fatti ("Le fonti riportano che...") dalle ipotesi ("È probabile che..."). Verifica che questa distinzione sia stata mantenuta. Le sue ipotesi sono plausibili e supportate dai fatti presentati?
        -   **Lacune e Alternative**: Il report identifica le principali lacune informative? Le ipotesi alternative considerate sono ragionevoli? Ci sono altre alternative che l'IA non ha considerato?
    -   **`### 6. Fonti Utilizzate`**: Verifica che tutte le fonti citate siano pertinenti e formattate correttamente.
3.  **Sviluppa il Tuo Giudizio Indipendente**: Usa il report dell'IA come una "prima bozza di analisi" o una "seconda opinione informata". Integra le sue conclusioni con la tua esperienza, conoscenza e altre fonti di intelligence a tua disposizione. **Il giudizio finale è e deve essere il tuo**.
4.  **Aggiorna il Report**: Se emergono nuove informazioni significative *dopo* aver generato un report, puoi cliccare nuovamente "AGGIORNA REPORT" per far sì che l'IA rigeneri l'analisi includendo gli ultimi sviluppi.

---

## Gestione Avanzata e Best Practices

### Controlli Avanzati dell'IA

-   **"CAMBIA AI"**: Usa questa funzione se ricevi ripetutamente errori di quota. Ti permette di passare a un modello di backup per continuare a lavorare senza interruzioni. È una misura di resilienza operativa.
-   **"GESTIONE PROMPT"**: Questo è il tuo "pannello di controllo" per il cervello dell'IA. Usalo in questi scenari:
    -   **Controllo di Qualità**: Se noti che la qualità dei casi generati sta diminuendo (es. più rumore, meno pertinenza), ispeziona il prompt attivo per vedere se le istruzioni si sono "annacquate".
    -   **Correzione di Rotta**: Se l'IA si sta specializzando troppo su un argomento a causa del tuo feedback passato e ora vuoi ampliare di nuovo la ricerca, puoi ripristinare una versione precedente e più generica del prompt.
    -   **Trasparenza**: Per capire *perché* l'IA sta dando priorità a certi tipi di notizie, puoi vedere su quale set di feedback si basa ogni versione del prompt.

### Gestione dei Dati

-   **"ESPORTA DB"**: **Prendi l'abitudine di esportare il database regolarmente (es. settimanalmente)**. Questo crea un backup JSON completo di tutti i tuoi casi e impostazioni, proteggendoti dalla perdita di dati accidentale.
-   **"IMPORTA DB"**: Usa questa funzione per caricare un file di backup (`.json`). All'avvio dell'importazione, ti verranno presentate due opzioni:
    -   **Sovrascrivi Database**: Sostituisce completamente il database locale con i dati del file. Utile per ripristinare un backup o clonare un ambiente. **Questa azione è irreversibile.**
    -   **Integra con Database**: Fonde il database importato con quello esistente. Questa è una potente funzionalità di **intelligence collaborativa**:
        -   Aggiunge nuovi casi e aggiorna quelli esistenti se la versione importata è più recente.
        -   Unisce la cronologia di apprendimento dell'IA, permettendo al sistema di beneficiare dell'esperienza di più analisti.
        -   Usa questa opzione per consolidare i dati provenienti da diverse istanze di Acta Diurna.
-   **"SVUOTA DB"**: Questa è un'azione drastica e irreversibile. Usala solo se:
    1.  Vuoi iniziare un progetto di analisi completamente nuovo da zero.
    2.  Il database è diventato corrotto o inutilizzabile.
    3.  Devi consegnare il sistema a un altro utente completamente "pulito".

### Sicurezza dei Dati e Retrocompatibilità

-   **Migrazione Automatica dei Dati**: Acta Diurna è progettato per durare nel tempo. Quando importi un file di backup proveniente da una versione precedente del software, il sistema esegue automaticamente una **migrazione dei dati**. Questo processo aggiorna in modo trasparente la struttura dei vecchi dati per renderla compatibile con la versione più recente dell'applicazione.
-   **Cosa significa?** Significa che puoi importare un backup vecchio di mesi o anni e il sistema si occuperà di aggiungere i campi mancanti e modernizzare la struttura dei dati, garantendo che nessuna informazione venga persa e che non si verifichino errori a causa di schemi obsoleti. **I tuoi archivi storici sono al sicuro e sempre utilizzabili.**

---

## Scenari Comuni e Troubleshooting

-   **"L'IA non trova nessun nuovo caso dopo un 'CHECK NEWS NOW'."**
    -   **Causa:** Questo è un risultato normale e atteso. Significa che, nel suo range di ricerca (ultimi 3 giorni), non sono state trovate nuove notizie che corrispondono ai criteri di rilevanza del suo prompt attivo.
    -   **Azione:** Nessuna. Riprova più tardi.

-   **"Un caso mi sembra un duplicato di un altro."**
    -   **Causa:** L'IA ha un filtro anti-duplicazione, ma a volte notizie leggermente diverse sulla stessa operazione possono superarlo.
    -   **Azione:** Identifica il caso meno completo o accurato e marcalo come **"IRRILEVANTE"**. Questo aiuta l'IA a riconoscere meglio i duplicati in futuro.

-   **"L'IA sembra ignorare un tipo di notizia che per me è importante."**
    -   **Causa:** Il suo profilo di ricerca non è ancora stato sintonizzato sulle tue priorità.
    -   **Azione:** Cerca manualmente uno o due esempi di quel tipo di notizia e inseriscili usando **"SEGNALA URL"**. Poi, marcali come **"IMPORTANTE"**. Questo è il modo più rapido ed efficace per insegnare all'IA un nuovo criterio di interesse.
