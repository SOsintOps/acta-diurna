# Domande frequenti (FAQ)

Domande frequenti su Acta Diurna: il prodotto, i dati e la loro affidabilità, l'IA e la ricerca, l'archivio, i problemi più comuni.
Per il flusso di lavoro operativo c'è la [Guida Operativa all'Analisi](help.md).

## Indice

* [Cos'è Acta Diurna?](#cosè-acta-diurna)
* [Da dove provengono i dati?](#da-dove-provengono-i-dati)
* [Quanto sono affidabili le informazioni?](#quanto-sono-affidabili-le-informazioni)
* [Come esprimono i report la probabilità e l'affidabilità delle fonti?](#come-esprimono-i-report-la-probabilità-e-laffidabilità-delle-fonti)
* [Come viene migliorato l'algoritmo di ricerca?](#come-viene-migliorato-lalgoritmo-di-ricerca)
* [Come posso controllare o ripristinare una vecchia versione dei criteri di ricerca?](#come-posso-controllare-o-ripristinare-una-vecchia-versione-dei-criteri-di-ricerca)
* [Che differenza c'è tra AGGIORNA e APPROFONDIMENTO?](#che-differenza-cè-tra-aggiorna-e-approfondimento)
* [Che differenza c'è tra "Sovrascrivi" e "Integra" durante l'importazione?](#che-differenza-cè-tra-sovrascrivi-e-integra-durante-limportazione)
* [Cosa succede se importo un backup di una vecchia versione?](#cosa-succede-se-importo-un-backup-di-una-vecchia-versione)
* [Posso perdere i miei dati?](#posso-perdere-i-miei-dati)
* [Ho ricevuto un errore di "quota superata". Cosa faccio?](#ho-ricevuto-un-errore-di-quota-superata-cosa-faccio)
* [Perché una città non compariva sulla mappa?](#perché-una-città-non-compariva-sulla-mappa)
* [CERCA SULLA CORTE non risponde: colpa della VPN?](#cerca-sulla-corte-non-risponde-colpa-della-vpn)
* [Esistono altri progetti collegati ad Acta Diurna?](#esistono-altri-progetti-collegati-ad-acta-diurna)

## Il prodotto

### Cos'è Acta Diurna?

Acta Diurna è una dashboard avanzata di **OSINT (Open-Source Intelligence)**. Utilizza un'intelligenza artificiale (Anthropic Claude, oppure in alternativa Google Gemini) per analizzare in modo autonomo fonti giornalistiche pubbliche online (notizie, articoli, comunicati stampa) e identificare operazioni delle forze dell'ordine in Italia. L'obiettivo è estrarre, strutturare e presentare queste informazioni in un formato chiaro e immediatamente utilizzabile per l'analisi.

## Dati e affidabilità

### Da dove provengono i dati?

I dati provengono **esclusivamente da fonti aperte e pubblicamente accessibili sul web**. L'IA esegue ricerche mirate con la ricerca web del modello (Claude, o Google Search con Gemini) e analizza il contenuto degli articoli di cronaca per estrarre le informazioni. Wikipedia, i social network e i siti di video sono esclusi. Ogni singolo dato all'interno di un caso è tracciabile fino a una o più fonti giornalistiche verificabili.

### Quanto sono affidabili le informazioni?

L'affidabilità è una priorità assoluta. Acta Diurna implementa un robusto sistema di **verifica della provenienza**:

*   **Validazione delle Fonti:** ogni fonte (URL) proposta dall'IA viene confrontata con l'elenco delle pagine che il modello ha davvero consultato durante la ricerca. Le fonti che non compaiono in quell'elenco, "allucinate" o inesistenti, vengono scartate.
*   **Scarto dei Dati Non Verificabili:** se un caso generato dall'IA rimane senza nemmeno una fonte verificata, viene **automaticamente scartato** e non compare mai nell'interfaccia.
*   **Trasparenza:** ogni caso riporta sempre l'elenco esatto delle fonti da cui sono state estratte le informazioni, consentendo all'analista di verificare di persona.

Nonostante questi meccanismi di controllo, è **imperativo** che ogni informazione generata dall'IA venga **sempre verificata e validata da un analista umano** prima di essere considerata un dato di fatto o utilizzata in contesti operativi. Lo strumento è un potente acceleratore di analisi, ma non sostituisce il giudizio e la validazione finale dell'analista.

### Come esprimono i report la probabilità e l'affidabilità delle fonti?

Il report di approfondimento segue regole fisse di scrittura analitica, date al modello come istruzioni nel prompt:

*   **Probabilità.** I giudizi usano solo sette termini, tratti dalla prima riga della scala di probabilità della direttiva [ICD 203](https://www.dni.gov/files/documents/ICD/ICD-203.pdf) e resi con un glossario italiano fisso:

| Termine | Intervallo |
|---|---|
| quasi nessuna possibilità | 01-05% |
| molto improbabile | 05-20% |
| improbabile | 20-45% |
| probabilità pressoché pari | 45-55% |
| probabile | 55-80% |
| molto probabile | 80-95% |
| quasi certo | 95-99% |

*   **Fiducia.** Il livello di fiducia (*alta*, *moderata*, *bassa*) dice quanto è solida la base del giudizio e sta sempre in una frase separata dal termine di probabilità. I tre livelli sono una convenzione diffusa, non una definizione della direttiva.
*   **Fatti.** I fatti accertati si scrivono senza qualificatori, con il riferimento alla fonte. Le ipotesi di reato restano contestazioni dell'accusa. Espressioni come "potrebbe", "sembrerebbe" o "si ritiene" sono escluse, salvo una condizione esplicita.
*   **Valutazione delle fonti.** Ogni fonte riceve il voto del sistema 4x4 dell'UNODC ([*Criminal Intelligence: Manual for Analysts*](https://www.unodc.org/documents/organized-crime/Law-Enforcement/Criminal_Intelligence_for_Analysts.pdf)): una lettera per l'affidabilità della fonte (A, B, C, X) e un numero per la validità dell'informazione (1-4). La fonte è chi ha prodotto l'informazione, non il sito che la ospita: un comunicato di Questura, Carabinieri, Guardia di Finanza o Procura, o un provvedimento giudiziario, è fonte A (informazione 1 per i dati che l'ente attesta, 2 per la ricostruzione dell'accusa); un articolo di testata che riprende il comunicato è fonte B (informazione 2 o 3); una voce non attribuita e non corroborata è X4. Dieci articoli che riprendono lo stesso comunicato contano come una fonte sola.

Il metodo è descritto in dettaglio in [Intelligence Field Notes](https://github.com/SOsintOps/intelligence-field-notes), nelle pagine sul [linguaggio della probabilità](https://github.com/SOsintOps/intelligence-field-notes/blob/main/docs/estimative-language.md), sulla [valutazione delle fonti](https://github.com/SOsintOps/intelligence-field-notes/blob/main/docs/source-evaluation.md) e sulla [scrittura del report](https://github.com/SOsintOps/intelligence-field-notes/blob/main/docs/report-writing.md). Il modello può non rispettare le regole: la verifica resta compito dell'analista (vedi la [Guida Operativa](help.md)).

## L'IA e la ricerca

### Come viene migliorato l'algoritmo di ricerca?

Il modello di IA non viene addestrato e resta sempre lo stesso. A cambiare, in base alle tue scelte, è **il testo che riceve** a ogni rassegna. Questo succede in due modi: a ogni rassegna attraverso il *profilo*, e ogni 15 casi importanti attraverso la *revisione dei criteri*.

#### Che cosa conta come scelta

| Che cosa fai | Come lo legge il sistema |
|---|---|
| **SEGNALA URL** | interesse forte: è una notizia che la ricerca non aveva trovato |
| **IMPORTANTE** | interesse; conta anche per far partire la revisione dei criteri |
| **APPROFONDIMENTO** | interesse |
| Apri un caso e non fai altro | segnale debole di interesse: il caso diventa «letto» |
| **IRRILEVANTE → Non mi interessa** | il segnale più diretto di che cosa togliere: è un'operazione vera, ma il tipo di reato o l'impatto non ti interessano |
| **IRRILEVANTE → Fuori perimetro** | non è un'operazione già eseguita, per esempio un processo, una sentenza o un'indagine solo annunciata |
| **IRRILEVANTE → Duplicata / Troppo vecchia** | un errore della raccolta, non una questione di gusti |

Se apri un caso e scopri che non ti interessa, archivialo con **Non mi interessa**: altrimenti resta tra i «letti» e conta come interesse.

#### A ogni rassegna: il profilo

Insieme ai criteri d'interesse, la rassegna manda al modello alcuni casi d'esempio presi dal tuo archivio, divisi in gruppi:

*   i 5 segnalati da te più recenti;
*   5 importanti;
*   10 con il report;
*   20 letti negli ultimi tre mesi;
*   5 archiviati come irrilevanti, con il motivo.

Di ogni caso passano solo titolo, categorie e città. Il modello li usa per decidere che cosa cercare e quali notizie proporre. Il profilo non assegna punteggi e non cambia l'ordine del feed, che resta per data.

#### Ogni 15 casi importanti: la revisione dei criteri

1. Ogni IMPORTANTE fa salire un contatore; togliere il segno lo fa scendere.
2. A 15, Claude Opus riceve i criteri attuali e fino a 15 esempi per ciascun gruppo: importanti, con report, letti, irrilevanti con il motivo.
3. Confronta ciò che conta per te con ciò che hai scartato e **riscrive solo i criteri d'interesse**: tipi di reato, soglie, aree, schemi ricorrenti. Le regole di estrazione, il perimetro e il formato delle risposte non li può toccare.
4. Il testo viene controllato: se non sembra un elenco di criteri, per esempio perché contiene JSON o regole di formato, viene scartato.
5. La nuova versione entra in uso dalla rassegna successiva e il contatore torna a zero. Ogni versione resta in **GESTIONE PROMPT** (vedi [Come posso controllare o ripristinare una vecchia versione dei criteri di ricerca?](#come-posso-controllare-o-ripristinare-una-vecchia-versione-dei-criteri-di-ricerca)).

#### Limiti attuali

*   La nuova versione dei criteri entra in uso senza che tu la approvi; compare solo un avviso.
*   Nessuno misura se una versione porta più casi utili della precedente. Se non ti convince, rimetti in uso una versione vecchia da GESTIONE PROMPT.
*   I casi segnalati con SEGNALA URL entrano nel profilo della rassegna, ma non nella revisione dei criteri.
*   Il segnale è sottile: il modello vede solo titoli, categorie e città, non il contenuto dei casi.
*   Fino alla versione 0.5.1 i casi importanti e quelli con report non arrivavano mai al modello, per un difetto dell'archivio. Dalla 0.5.2 arrivano.

### Come posso controllare o ripristinare una vecchia versione dei criteri di ricerca?

Questa è una funzionalità avanzata per garantire massima trasparenza e controllo. Puoi gestire il profilo di ricerca dell'IA tramite il pulsante **"GESTIONE PROMPT"**.

Cliccandolo, si aprirà una finestra modale con:

*   **A sinistra**, la cronologia di tutte le versioni del prompt di ricerca che l'IA ha creato, con la versione attiva evidenziata.
*   **A destra**, il dettaglio della versione selezionata: il testo completo del prompt e le statistiche di feedback su cui si è basata la sua creazione.

Da qui puoi:

*   **Copiare** il testo di qualsiasi prompt per analizzarlo esternamente.
*   **Impostare come Attivo** una versione precedente se ritieni che fosse più efficace. Questa azione creerà una nuova versione basata su quella vecchia, mantenendo una cronologia pulita.

### Che differenza c'è tra AGGIORNA e APPROFONDIMENTO?

*   **AGGIORNA:** questa azione riesegue una ricerca mirata per il caso specifico, cercando di **completare o correggere** le informazioni già esistenti (es. trovare nomi mancanti, aggiornare il valore dei sequestri, aggiungere nuove fonti). È un'azione di arricchimento.
*   **APPROFONDIMENTO:** questa azione genera un **report di analisi completamente nuovo**. L'IA sintetizza tutte le informazioni disponibili in un documento strutturato: sintesi iniziale, giudizi chiave con termini di probabilità e livello di fiducia, fatti accertati con la valutazione di ogni fonte, analisi del modus operandi, lacune informative e tabella delle fonti (vedi [Come esprimono i report la probabilità e l'affidabilità delle fonti?](#come-esprimono-i-report-la-probabilità-e-laffidabilità-delle-fonti)). È un'azione di sintesi e analisi professionale.

## Archivio e backup

### Che differenza c'è tra "Sovrascrivi" e "Integra" durante l'importazione?

Quando importi un file di backup, ora hai due opzioni:

*   **Sovrascrivi Database**: questa è l'opzione più semplice. **Cancella completamente** tutti i dati attualmente presenti nel tuo browser e li sostituisce con i dati del file. È l'azione ideale se vuoi ripristinare un backup a uno stato esatto o clonare l'ambiente di lavoro di un collega.
*   **Integra con Database**: questa è una funzione più avanzata e potente. **Fonde** i dati del file di backup con quelli già presenti localmente, senza cancellare nulla. In caso di conflitti (es. due versioni dello stesso caso), il sistema manterrà sempre la versione più recente. Unisce anche l'apprendimento dell'IA (la cronologia dei prompt), creando un profilo di ricerca più ricco. È l'opzione ideale per la **collaborazione**, permettendo a più analisti di unire le loro scoperte.

### Cosa succede se importo un backup di una vecchia versione?

Non c'è da preoccuparsi. Il sistema è progettato per la **retrocompatibilità**. Quando carichi un file di backup, Acta Diurna rileva automaticamente se proviene da una versione precedente del software. In tal caso, esegue una **migrazione automatica dei dati**, aggiornando la loro struttura per renderla compatibile con l'ultima versione dell'applicazione. Nessuna informazione viene persa. Questo garantisce che i tuoi archivi rimangano sempre accessibili e utilizzabili, indipendentemente da quando sono stati creati.

### Posso perdere i miei dati?

I dati sono salvati localmente nel tuo browser tramite IndexedDB, una tecnologia robusta. Tuttavia, i dati del browser possono essere cancellati (es. pulizia della cronologia). Per questo motivo è **fondamentale utilizzare le funzioni di "ESPORTA DB"** per creare backup regolari del database in un file JSON. Questo file può essere ripristinato in qualsiasi momento con "IMPORTA DB".

## Problemi

### Ho ricevuto un errore di "quota superata". Cosa faccio?

Questo errore significa che il modello di IA attualmente in uso ha raggiunto il suo limite di richieste (solitamente giornaliero). Per risolvere il problema e continuare a lavorare, l'applicazione ti offre una soluzione diretta:

1.  Clicca sul pulsante **"CAMBIA AI"** nell'intestazione della dashboard.
2.  Si aprirà una finestra che mostra i modelli AI disponibili e testati per l'applicazione.
3.  Seleziona un modello diverso da quello attualmente in uso.

La tua selezione verrà salvata e utilizzata per tutte le future richieste, permettendoti di aggirare il blocco della quota e continuare le tue attività di analisi senza interruzioni.

Un blocco diverso è il **tetto di spesa giornaliero** di Acta Diurna (predefinito 1 $): raggiunto il tetto, nessuna chiamata a Claude parte fino al giorno dopo. Si alza o si abbassa in **IMPOSTAZIONI**, dove ci sono anche i consumi del giorno.

### Perché una città non compariva sulla mappa?

In passato, il sistema poteva omettere una città se il suo nome era scritto in modo errato o ambiguo nella fonte originale. Questo limite è stato superato. Acta Diurna ora utilizza un **sistema di geocodifica a due fasi**:

1.  **Memoria locale:** il sistema cerca prima le coordinate della città tra quelle già trovate in passato, senza nessuna chiamata all'IA.
2.  **Auto-Correzione Contestuale:** se la città non è in memoria, il sistema invia una richiesta all'IA, fornendole non solo il nome della città, ma anche il **contesto della notizia** (es. il titolo del caso). Questo permette all'IA di dedurre la località corretta anche in presenza di refusi o nomi di frazioni poco comuni (es. "Platì").

Questo processo non solo trova le coordinate, ma **corregge anche il nome della città** con quello ufficiale, garantendo la massima accuratezza e completezza dei dati geografici sulla mappa.

### CERCA SULLA CORTE non risponde: colpa della VPN?

Quasi sempre sì. Il server della Corte di Cassazione non risponde alle connessioni che arrivano dagli indirizzi di uscita delle VPN commerciali: la richiesta va in scadenza senza risposta, e lo stesso succede aprendo il sito nel browser. Non è un blocco per troppe richieste.

La soluzione è escludere dal tunnel della VPN (*split tunneling*) l'**indirizzo IP** del server, `81.126.56.168` (`www.italgiure.giustizia.it`). Il resto della navigazione resta protetto; solo le ricerche sulla Corte escono con l'indirizzo reale. La ricerca nell'**archivio locale** non passa dalla rete e funziona anche con la VPN accesa.

## Progetti collegati

### Esistono altri progetti collegati ad Acta Diurna?

Sì. Acta Diurna fa parte dei progetti open source di [SOsintOps](https://github.com/SOsintOps):

*   **[Iudex](https://github.com/SOsintOps/Iudex)**: applicazione locale per cercare e consultare le sentenze della Corte di Cassazione. Acta Diurna la può interrogare, se lo attivi in IMPOSTAZIONI, per cercare il nome di una persona o di una società di un caso; le entità dei due programmi, e di Praeco, usano lo stesso formato. Le tre applicazioni sono autonome: collaborano e si scambiano i dati, ma ognuna funziona da sola, senza le altre installate.
*   **[Intelligence Field Notes](https://github.com/SOsintOps/intelligence-field-notes)** (in inglese): la raccolta di riferimento su standard analitici, metodo OSINT, linguaggio della probabilità, valutazione delle fonti e scrittura del report. È la fonte delle regole usate nei report di Acta Diurna.
*   **[Elementary CTI](https://github.com/SOsintOps/elementary-CTI)**: aggregatore di threat intelligence sul ransomware, utile per seguire le vittime di attacchi ransomware in Italia quando un caso riguarda il crimine informatico.
*   **[Quaesitor](https://github.com/SOsintOps/quaesitor)**: grafo locale per indagini OSINT su persone, telefoni, account, società, veicoli e luoghi, con il metodo di analisi dei legami dell'UNODC. Serve per mettere in relazione le persone e le società che compaiono nei casi.
*   **[Aethelburg](https://github.com/SOsintOps/Aethelburg-project)**: piattaforma desktop per analizzare i dati del registro delle imprese britannico (Companies House) alla ricerca di società schermo e strutture societarie anomale. Utile quando un caso coinvolge società con sede nel Regno Unito.
*   **[Exploratores](https://github.com/SOsintOps/Exploratores)**: raccolta di strumenti OSINT nel browser per ricerche su persone, numeri di telefono, domini, immagini, società e piattaforme social, utile per gli approfondimenti manuali sulle entità di un caso.
*   **[Codex Machinae](https://github.com/SOsintOps/codex-machinae)** (in inglese): il playbook modulare per lo sviluppo di software con collaboratori LLM con cui viene gestito lo sviluppo di Acta Diurna.
*   **[Il Conclave](https://github.com/SOsintOps/il-conclave)**: una skill per Claude Code, in italiano, che sottopone una domanda o una decisione a procedure analitiche strutturate, tra cui l'analisi delle ipotesi concorrenti (ACH) e il premortem. Utile per mettere alla prova i giudizi di un report prima di usarli.
