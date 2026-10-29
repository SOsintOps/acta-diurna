
# Domande Frequenti (FAQ) - Acta Diurna

Questa guida è pensata per un analista che si avvicina per la prima volta a Acta Diurna e risponde alle domande più comuni sul suo funzionamento, le sue capacità e l'affidabilità dei dati. Per un flusso di lavoro operativo, consulta la nostra **[Guida Operativa all'Analisi (help.md)](help.md)**.

## Indice

* [1. Cos'è Acta Diurna?](#1-cosè-acta-diurna)
* [2. Da dove provengono i dati?](#2-da-dove-provengono-i-dati)
* [3. Quanto sono affidabili le informazioni?](#3-quanto-sono-affidabili-le-informazioni)
* [4. Come "impara" l'intelligenza artificiale?](#4-come-impara-lintelligenza-artificiale)
* [5. Che differenza c'è tra "AGGIORNA" e "APPROFONDIMENTO"?](#5-che-differenza-cè-tra-aggiorna-e-approfondimento)
* [6. Che differenza c'è tra "Sovrascrivi" e "Integra" durante l'importazione?](#6-che-differenza-cè-tra-sovrascrivi-e-integra-durante-limportazione)
* [7. Cosa succede se importo un backup di una vecchia versione?](#7-cosa-succede-se-importo-un-backup-di-una-vecchia-versione)
* [8. Posso perdere i miei dati?](#8-posso-perdere-i-miei-dati)
* [9. Ho ricevuto un errore di "quota superata". Cosa faccio?](#9-ho-ricevuto-un-errore-di-quota-superata-cosa-faccio)
* [10. Se l'IA impara, come posso controllare o ripristinare una vecchia "versione" delle sue istruzioni?](#10-se-lia-impara-come-posso-controllare-o-ripristinare-una-vecchia-versione-delle-sue-istruzioni)
* [11. Perché una città non compariva sulla mappa?](#11-perché-una-città-non-compariva-sulla-mappa)
* [12. Come esprimono i report la probabilità e l'affidabilità delle fonti?](#12-come-esprimono-i-report-la-probabilità-e-laffidabilità-delle-fonti)
* [13. Esistono altri progetti collegati ad Acta Diurna?](#13-esistono-altri-progetti-collegati-ad-acta-diurna)

---

### 1. Cos'è Acta Diurna?

Acta Diurna è una dashboard avanzata di **OSINT (Open-Source Intelligence)**. Utilizza un'intelligenza artificiale (Anthropic Claude, oppure in alternativa Google Gemini) per analizzare in modo autonomo fonti giornalistiche pubbliche online (notizie, articoli, comunicati stampa) e identificare operazioni delle forze dell'ordine in Italia. L'obiettivo è estrarre, strutturare e presentare queste informazioni in un formato chiaro e immediatamente utilizzabile per l'analisi.

### 2. Da dove provengono i dati?

I dati provengono **esclusivamente da fonti aperte e pubblicamente accessibili sul web**. L'IA esegue ricerche mirate utilizzando Google Search e analizza il contenuto degli articoli di cronaca per estrarre le informazioni. Ogni singolo dato all'interno di un caso è tracciabile fino a una o più fonti giornalistiche verificabili.

### 3. Quanto sono affidabili le informazioni?

L'affidabilità è una priorità assoluta. Acta Diurna implementa un robusto sistema di **verifica della provenienza**:

- **Validazione delle Fonti:** Ogni fonte (URL) proposta dall'IA viene confrontata con i metadati forniti da Google Search. Questo processo corregge link errati e scarta le fonti "allucinate" o inesistenti.
- **Scarto dei Dati Non Verificabili:** Se un caso generato dall'IA rimane senza nemmeno una fonte verificata, viene **automaticamente scartato** e non compare mai nell'interfaccia.
- **Trasparenza:** Ogni caso riporta sempre l'elenco esatto delle fonti da cui sono state estratte le informazioni, consentendo all'analista di verificare di persona.

Nonostante questi meccanismi di controllo, è **imperativo** che ogni informazione generata dall'IA venga **sempre verificata e validata da un analista umano** prima di essere considerata un dato di fatto o utilizzata in contesti operativi. Lo strumento è un potente acceleratore di analisi, ma non sostituisce il giudizio e la validazione finale dell'analista.

### 4. Come "impara" l'intelligenza artificiale?

Il sistema di apprendimento è progettato per adattare le priorità di ricerca dell'IA al fine di riflettere gli interessi investigativi dell'analista. Il processo si basa su un meccanismo di feedback e revisione automatica, articolato in quattro fasi:

**1. Raccolta del Feedback (Implicito ed Esplicito):**
L'IA raccoglie continuamente feedback dalle azioni dell'analista. Ogni azione ha un peso diverso:
- **Priorità Massima:** Un caso creato tramite **"SEGNALA URL"**. È il segnale più forte di ciò che è rilevante.
- **Priorità Alta:** Un caso marcato come **"Importante"**.
- **Priorità Media:** La richiesta di un **"Approfondimento"** su un caso.
- **Feedback Negativo:** L'archiviazione di un caso come **"Irrilevante"**.

**2. Innesco della Revisione del Profilo:**
Il processo di apprendimento non è continuo, ma viene attivato al raggiungimento di una soglia. Di default, quando l'analista ha marcato **15 nuovi casi come "Importanti"**, il sistema avvia automaticamente una revisione del suo profilo di ricerca. Questo assicura che il cambiamento sia basato su un campione significativo di feedback.

**3. Processo di Revisione Strategica:**
Quando la revisione viene attivata, succede questo:
- Il sistema raccoglie un campione ponderato di casi (importanti, medi, standard e irrilevanti).
- Invia questi esempi, insieme alle sue attuali istruzioni di ricerca (il "prompt"), a un'altra istanza dell'IA che agisce da "stratega".
- L'IA "stratega" analizza i pattern comuni nei casi ad alta priorità (es. tipi di reato, aree geografiche, parole chiave specifiche, modus operandi) e li confronta con quelli irrilevanti.
- Basandosi su questa analisi, **riscrive le istruzioni di ricerca originali**, rendendole più specifiche e mirate. Ad esempio, potrebbe aggiungere: "Dare priorità a frodi fiscali che utilizzano società sportive dilettantistiche (ASD) nel Nord Italia".

**4. Attivazione del Nuovo Profilo:**
Le istruzioni di ricerca appena ottimizzate diventano il nuovo **profilo di ricerca attivo** per tutte le future ricerche di notizie. Il vecchio profilo viene archiviato con un numero di versione per consentire la tracciabilità delle modifiche nel tempo. Per maggiori dettagli, vedi la domanda sulla **Gestione Prompt**.

### 5. Che differenza c'è tra "AGGIORNA" e "APPROFONDIMENTO"?

- **AGGIORNA:** Questa azione riesegue una ricerca mirata per il caso specifico, cercando di **completare o correggere** le informazioni già esistenti (es. trovare nomi mancanti, aggiornare il valore dei sequestri, aggiungere nuove fonti). È un'azione di arricchimento.
- **APPROFONDIMENTO:** Questa azione genera un **report di analisi completamente nuovo**. L'IA sintetizza tutte le informazioni disponibili in un documento strutturato: sintesi iniziale, giudizi chiave con termini di probabilità e livello di fiducia, fatti accertati con la valutazione di ogni fonte, analisi del modus operandi, lacune informative e tabella delle fonti (vedi la domanda 12). È un'azione di sintesi e analisi professionale.

### 6. Che differenza c'è tra "Sovrascrivi" e "Integra" durante l'importazione?

Quando importi un file di backup, ora hai due opzioni:
- **Sovrascrivi Database**: Questa è l'opzione più semplice. **Cancella completamente** tutti i dati attualmente presenti nel tuo browser e li sostituisce con i dati del file. È l'azione ideale se vuoi ripristinare un backup a uno stato esatto o clonare l'ambiente di lavoro di un collega.
- **Integra con Database**: Questa è una funzione più avanzata e potente. **Fonde** i dati del file di backup con quelli già presenti localmente, senza cancellare nulla. In caso di conflitti (es. due versioni dello stesso caso), il sistema manterrà sempre la versione più recente. Unisce anche l'apprendimento dell'IA (la cronologia dei prompt), creando un profilo di ricerca più ricco. È l'opzione ideale per la **collaborazione**, permettendo a più analisti di unire le loro scoperte.

### 7. Cosa succede se importo un backup di una vecchia versione?

Non c'è da preoccuparsi. Il sistema è progettato per la **retrocompatibilità**. Quando carichi un file di backup, Acta Diurna rileva automaticamente se proviene da una versione precedente del software. In tal caso, esegue una **migrazione automatica dei dati**, aggiornando la loro struttura per renderla compatibile con l'ultima versione dell'applicazione. Nessuna informazione viene persa. Questo garantisce che i tuoi archivi rimangano sempre accessibili e utilizzabili, indipendentemente da quando sono stati creati.

### 8. Posso perdere i miei dati?

I dati sono salvati localmente nel tuo browser tramite IndexedDB, una tecnologia robusta. Tuttavia, i dati del browser possono essere cancellati (es. pulizia della cronologia). Per questo motivo è **fondamentale utilizzare le funzioni di "ESPORTA DB"** per creare backup regolari del database in un file JSON. Questo file può essere ripristinato in qualsiasi momento con "IMPORTA DB".

### 9. Ho ricevuto un errore di "quota superata". Cosa faccio?

Questo errore significa che il modello di IA attualmente in uso ha raggiunto il suo limite di richieste (solitamente giornaliero). Per risolvere il problema e continuare a lavorare, l'applicazione ti offre una soluzione diretta:

1.  Clicca sul pulsante **"CAMBIA AI"** nell'intestazione della dashboard.
2.  Si aprirà una finestra che mostra i modelli AI disponibili e testati per l'applicazione.
3.  Seleziona un modello diverso da quello attualmente in uso.

La tua selezione verrà salvata e utilizzata per tutte le future richieste, permettendoti di aggirare il blocco della quota e continuare le tue attività di analisi senza interruzioni.

### 10. Se l'IA impara, come posso controllare o ripristinare una vecchia "versione" delle sue istruzioni?

Questa è una funzionalità avanzata per garantire massima trasparenza e controllo. Puoi gestire il profilo di ricerca dell'IA tramite il pulsante **"GESTIONE PROMPT"**.

Cliccandolo, si aprirà una finestra modale con:
-   **A sinistra**, la cronologia di tutte le versioni del prompt di ricerca che l'IA ha creato, con la versione attiva evidenziata.
-   **A destra**, il dettaglio della versione selezionata: il testo completo del prompt e le statistiche di feedback su cui si è basata la sua creazione.

Da qui puoi:
-   **Copiare** il testo di qualsiasi prompt per analizzarlo esternamente.
-   **Impostare come Attivo** una versione precedente se ritieni che fosse più efficace. Questa azione creerà una nuova versione basata su quella vecchia, mantenendo una cronologia pulita.

### 11. Perché una città non compariva sulla mappa?

In passato, il sistema poteva omettere una città se il suo nome era scritto in modo errato o ambiguo nella fonte originale. Questo limite è stato superato. Acta Diurna ora utilizza un **sistema di geocodifica avanzato a due fasi**:

1.  **Ricerca Iniziale:** Il sistema esegue una ricerca rapida per le coordinate della città.
2.  **Auto-Correzione Contestuale:** Se la prima ricerca fallisce, il sistema non si arrende. Invia una seconda richiesta all'IA, fornendole non solo il nome della città, ma anche il **contesto della notizia** (es. il titolo del caso). Questo permette all'IA di dedurre la località corretta anche in presenza di refusi o nomi di frazioni poco comuni (es. "Platì").

Questo processo non solo trova le coordinate, ma **corregge anche il nome della città** con quello ufficiale, garantendo la massima accuratezza e completezza dei dati geografici sulla mappa.

### 12. Come esprimono i report la probabilità e l'affidabilità delle fonti?

Il report di approfondimento segue regole fisse di scrittura analitica, date al modello come istruzioni nel prompt:

- **Probabilità.** I giudizi usano solo sette termini, tratti dalla prima riga della scala di probabilità della direttiva [ICD 203](https://www.dni.gov/files/documents/ICD/ICD-203.pdf) e resi con un glossario italiano fisso:

| Termine | Intervallo |
|---|---|
| quasi nessuna possibilità | 01-05% |
| molto improbabile | 05-20% |
| improbabile | 20-45% |
| probabilità pressoché pari | 45-55% |
| probabile | 55-80% |
| molto probabile | 80-95% |
| quasi certo | 95-99% |

- **Fiducia.** Il livello di fiducia (*alta*, *moderata*, *bassa*) dice quanto è solida la base del giudizio e sta sempre in una frase separata dal termine di probabilità. I tre livelli sono una convenzione diffusa, non una definizione della direttiva.
- **Fatti.** I fatti accertati si scrivono senza qualificatori, con il riferimento alla fonte. Le ipotesi di reato restano contestazioni dell'accusa. Espressioni come "potrebbe", "sembrerebbe" o "si ritiene" sono escluse, salvo una condizione esplicita.
- **Valutazione delle fonti.** Ogni fonte riceve il voto del sistema 4x4 dell'UNODC ([*Criminal Intelligence: Manual for Analysts*](https://www.unodc.org/documents/organized-crime/Law-Enforcement/Criminal_Intelligence_for_Analysts.pdf)): una lettera per l'affidabilità della fonte (A, B, C, X) e un numero per la validità dell'informazione (1-4). La fonte è chi ha prodotto l'informazione, non il sito che la ospita: un comunicato di Questura, Carabinieri, Guardia di Finanza o Procura, o un provvedimento giudiziario, è fonte A (informazione 1 per i dati che l'ente attesta, 2 per la ricostruzione dell'accusa); un articolo di testata che riprende il comunicato è fonte B (informazione 2 o 3); una voce non attribuita e non corroborata è X4. Dieci articoli che riprendono lo stesso comunicato contano come una fonte sola.

Il metodo è descritto in dettaglio in [Intelligence Field Notes](https://github.com/SOsintOps/intelligence-field-notes), nelle pagine sul [linguaggio della probabilità](https://github.com/SOsintOps/intelligence-field-notes/blob/main/docs/estimative-language.md), sulla [valutazione delle fonti](https://github.com/SOsintOps/intelligence-field-notes/blob/main/docs/source-evaluation.md) e sulla [scrittura del report](https://github.com/SOsintOps/intelligence-field-notes/blob/main/docs/report-writing.md). Il modello può non rispettare le regole: la verifica resta compito dell'analista (vedi la [Guida Operativa](help.md)).

### 13. Esistono altri progetti collegati ad Acta Diurna?

Sì. Acta Diurna fa parte dei progetti open source di [SOsintOps](https://github.com/SOsintOps):

- **[Intelligence Field Notes](https://github.com/SOsintOps/intelligence-field-notes)** (in inglese): la raccolta di riferimento su standard analitici, metodo OSINT, linguaggio della probabilità, valutazione delle fonti e scrittura del report. È la fonte delle regole usate nei report di Acta Diurna.
- **[Elementary CTI](https://github.com/SOsintOps/elementary-CTI)**: aggregatore di threat intelligence sul ransomware, utile per seguire le vittime di attacchi ransomware in Italia quando un caso riguarda il crimine informatico.
- **[Quaesitor](https://github.com/SOsintOps/quaesitor)**: grafo locale per indagini OSINT su persone, telefoni, account, società, veicoli e luoghi, con il metodo di analisi dei legami dell'UNODC. Serve per mettere in relazione le persone e le società che compaiono nei casi.
- **[Aethelburg](https://github.com/SOsintOps/Aethelburg-project)**: piattaforma desktop per analizzare i dati del registro delle imprese britannico (Companies House) alla ricerca di società schermo e strutture societarie anomale. Utile quando un caso coinvolge società con sede nel Regno Unito.
- **[Exploratores](https://github.com/SOsintOps/Exploratores)**: raccolta di strumenti OSINT nel browser per ricerche su persone, numeri di telefono, domini, immagini, società e piattaforme social, utile per gli approfondimenti manuali sulle entità di un caso.
- **[Codex Machinae](https://github.com/SOsintOps/codex-machinae)** (in inglese): il playbook modulare per lo sviluppo di software con collaboratori LLM con cui viene gestito lo sviluppo di Acta Diurna.
- **[Il Conclave](https://github.com/SOsintOps/il-conclave)**: una skill per Claude Code, in italiano, che sottopone una domanda o una decisione a procedure analitiche strutturate, tra cui l'analisi delle ipotesi concorrenti (ACH) e il premortem. Utile per mettere alla prova i giudizi di un report prima di usarli.
