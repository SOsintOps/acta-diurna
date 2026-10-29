# Cronologia delle Versioni di Acta Diurna

Questo documento traccia le principali modifiche, funzionalità e miglioramenti introdotti in ogni versione di Acta Diurna.

---

### Versione 0.5.2
*Data: 2026-10-29*

**L'apprendimento usa davvero le tue scelte**

- I casi che segni **importanti** e quelli con il **report** arrivano finalmente al modello
  come esempi. Prima l'archivio li cercava con un indice che non vede i valori sì/no, e
  non li trovava mai: segnare un caso importante lo faceva perfino uscire dal profilo.
- Togliere il segno di importante annulla il voto per la revisione dei criteri.
- Nell'archiviazione c'è **«Non mi interessa»**, per un'operazione vera che però non ti
  interessa, separato da **«Fuori perimetro»**, per ciò che non è un'operazione già
  eseguita. Il modello riceve il motivo con il significato giusto: prima «non mi
  interessa» gli arrivava come «fuori perimetro».
- Le FAQ spiegano come viene migliorato l'algoritmo di ricerca (domanda 4), com'è
  davvero oggi. La finestra della documentazione non finisce più sotto la mappa.
- FAQ nel formato comune ai progetti SOsintOps (quello di Exploratores): indice delle
  domande, sezioni tematiche, una domanda per titolo. Nell'app i link dell'indice ora
  portano alla domanda. Corrette due risposte superate: le fonti si verificano sulle pagine
  consultate dal modello, non sui metadati di Google Search; c'è il tetto di spesa.

---

### Versione 0.5.1
*Data: 2026-10-29*

- **SEGNALA URL** crea solo il caso: il report di approfondimento, la chiamata più cara, non
  parte più da solo e si avvia con **APPROFONDIMENTO**.
- I **legami persona–società** restano: servono alla compatibilità con Iudex e Praeco.

---

### Versione 0.5.0
*Data: 2026-10-29*

**Ricerca di persone e società nelle sentenze, tramite Iudex**

Con [Iudex](https://github.com/SOsintOps/Iudex) acceso sullo stesso computer, accanto a ogni
persona e società di un caso compare il pulsante **IUDEX**.

- Il pulsante cerca il nome nelle sentenze della Cassazione: prima nell'archivio locale di
  Iudex, senza nessuna richiesta alla Corte, poi sulla Corte solo con **CERCA SULLA CORTE**.
- Una sentenza trovata si collega al caso con **COLLEGA** e compare tra le «Sentenze
  collegate». Entra anche nel pacchetto JSONL.
- È **facoltativa**: si attiva in **IMPOSTAZIONI → Ricerca in Iudex** ed è spenta di partenza.
- Non usa Claude. Ogni ricerca sulla Corte è una richiesta al server di Italgiure, una alla
  volta.
- Un risultato è un candidato da verificare: molti nomi nelle sentenze sono oscurati e lo
  stesso nome può appartenere a persone diverse.
- Serve Iudex con la ricerca locale (dalla versione successiva alla 0.8.1).

**Niente più aggiornamenti automatici**

I casi marcati come importanti non si aggiornano più da soli ogni 2 ore, e «importante» non
scade più dopo 7 giorni. Era una funzione ereditata da Police Chronicle, mai chiesta, e
ogni aggiornamento era una chiamata a Claude con ricerca web. Un caso si aggiorna con
**AGGIORNA**; «importante» resta un segnale per il profilo di ricerca.

---

### Versione 0.4.0
*Data: 2026-10-29*

**Persone e società compatibili con Iudex**

Le entità dei casi seguono ora il formato comune con Iudex e Praeco, per
scambiare i dati e incrociarli in futuro con le sentenze della Cassazione.

- **Persone**:
  - nome e cognome separati quando l'articolo li distingue con certezza;
  - data e luogo di nascita;
  - codice fiscale, solo se scritto nell'articolo e con il carattere di
    controllo giusto;
  - sesso, solo se l'articolo lo dichiara («nato», «nata», «l'indagata»), mai
    dedotto dal nome;
  - con la sola età, i due anni di nascita possibili.
- **Società ed enti**:
  - forma giuridica separata;
  - partita IVA, codice fiscale e REA, solo se scritti e validi;
  - sede, stato (sotto sequestro, fallita), attività e valore dei beni.
- **Ruolo e posizione nel procedimento** (indagato, arrestato, ai domiciliari)
  stanno sulla citazione della persona nel caso, come in Iudex.
- **Legami persona–società**: amministratore, socio, prestanome.
- **Identità stabile.** Ogni persona e società ha un identificativo calcolato
  come in Iudex e Praeco: la stessa persona, scritta «FIORE ANDREA» o «Andrea
  Fiore», è una sola.
- **Esportazione.** I pulsanti **ESPORTA FTM** ed **ESPORTA JSONL** salvano
  persone, società e casi in FollowTheMoney (si aprono in Aleph) e nel
  pacchetto di scambio delle tre app.
- Gli archivi esistenti si convertono da soli alla prima apertura.

**Istruzioni ai modelli riscritte per Claude**

- Le regole fisse stanno a parte e Claude le tiene in cache: costano un decimo
  dalla seconda chiamata.
- I reati si classificano solo nelle nove categorie dell'applicazione.
- Una fonte è accettata solo se il suo indirizzo è tra le pagine davvero
  consultate. Prima il confronto tra i titoli aveva attribuito a un caso la
  pagina di Wikipedia sul pool antimafia.
- Il report di approfondimento è testo semplice e non più un JSON. Le entità si
  estraggono dal report con una seconda chiamata breve.
- La revisione del profilo di ricerca riscrive solo i criteri d'interesse e non
  può più toccare le regole.

**Spesa sotto controllo**

- **Nessuna rassegna automatica all'apertura**: si avvia con «CERCA ORA».
- **Tetto di spesa giornaliero** (predefinito 1 $), modificabile nelle
  impostazioni. Raggiunto il tetto, nessuna chiamata parte fino al giorno dopo.
- **Rassegna più leggera**: al massimo 6 ricerche, siti non giornalistici
  esclusi, nel prompt solo i casi degli ultimi 60 giorni.

**Correzioni**

- La ricerca automatica ogni 4 ore non partiva mai: il timer ripartiva a ogni
  clic su un caso.
- Gli aggiornamenti automatici partivano 10 secondi dopo ogni clic.
- Rassegna, aggiornamenti e analisi di un URL non partono più insieme.
- Città senza doppioni nei casi nuovi.

---

### Versione 0.3.0
*Data: 2026-10-29*

**Claude diventa il fornitore predefinito, con un modello per fase**

L'analisi passa ad Anthropic Claude, che usa il modello più adatto a ciascuna
fase. Google Gemini resta selezionabile con **CAMBIA AI**, con un modello
unico. Al primo avvio dopo l'aggiornamento l'applicazione chiede la chiave API
di Claude:

| Fase | Modello |
|---|---|
| Rassegna, analisi di un URL, aggiornamento di un caso | Claude Sonnet 5.5 |
| Report di approfondimento, revisione del profilo di ricerca | Claude Opus 5.5 |
| Traduzione del report | Claude Sonnet 5.5 |
| Geocodifica delle località | Claude Haiku 5.5 |

Con Claude la ricerca e la lettura degli articoli usano gli strumenti web di
Anthropic, e la verifica della provenienza lavora sugli URL delle pagine
effettivamente consultate.

**Pagina delle impostazioni.** Il pulsante **CHIAVE API** diventa
**IMPOSTAZIONI**: raccoglie le chiavi di tutti i fornitori, ciascuna con il suo
stato, il campo per inserirla e la revoca, e indica quale fornitore è in uso.
Si può preparare la chiave di un fornitore prima di passarci.

**Claude senza chiave, con la federazione d'identità.** In alternativa alla
chiave, Claude accetta la Workload Identity Federation: il JWT di un identity
provider già fidato si scambia con un token di breve durata. Lo scambio lo fa il
server dell'applicazione (`npm run dev` o `npm run preview`), configurato da
`.env`; nel browser arriva solo il token breve. Le impostazioni mostrano se la
federazione è attiva. Istruzioni nel README.

**Torna la grafica di Police Chronicle 1.6.** Il ridisegno della 0.2.0 è stato
ritirato: tornano il tema scuro blu-grigio, gli angoli arrotondati, i caratteri
di sistema e il tema chiaro. Le finestre nuove (impostazioni, modello AI) sono
nello stesso stile.

**Consumi.** Le impostazioni mostrano quanto costano le chiamate a Claude: oggi,
ultimi 30 giorni e totale, divisi per fase. È una stima dal listino; il costo
effettivo è nella Console di Anthropic.

**Correzioni**

-   La mappa torna ad avere lo sfondo. Le tile di CARTO ora richiedono una
    chiave e mostravano «API KEY REQUIRED»; si usano quelle di OpenStreetMap,
    scurite nel tema scuro. In sviluppo, inoltre, lo sfondo non veniva mai
    aggiunto alla mappa ricreata.
-   Le finestre restano sopra la mappa.
-   La rassegna legge il JSON anche quando il modello aggiunge una frase dopo:
    prima la risposta veniva scartata come illeggibile.
-   La rassegna riceve la data di oggi: prima il modello giudicava gli «ultimi 3
    giorni» senza sapere che giorno fosse.
-   L'identificativo del caso lo assegna sempre il contatore locale. Prima
    prevaleva quello proposto dal modello, che poteva ripetersi tra due rassegne.

---

### Versione 0.2.1
*Data: 2026-10-13*

**Il report di approfondimento parla una lingua precisa**

Il prompt del report di approfondimento è stato riscritto secondo il metodo di
[Intelligence Field Notes](https://github.com/SOsintOps/intelligence-field-notes)
sulla scrittura del report. La risposta viene prima: il report si apre con una
**Sintesi (bottom line)** di 3-5 frasi che risponde alla domanda, seguita da
**Giudizi chiave**, **Fatti accertati**, **Analisi** (modus operandi, ipotesi
alternative, assunzioni chiave), **Lacune e prossimi passi**, una tabella delle
**Fonti** e una nota su **Metodo e limiti**. Entità, dati geografici e verifiche
con i sistemi interni passano in allegato.

**Probabilità con un glossario fisso.** I giudizi usano solo i sette termini
della prima riga della scala della direttiva
[ICD 203](https://www.dni.gov/files/documents/ICD/ICD-203.pdf), resi in italiano
sempre nello stesso modo: *quasi nessuna possibilità*, *molto improbabile*,
*improbabile*, *probabilità pressoché pari*, *probabile*, *molto probabile*,
*quasi certo*. Il livello di fiducia (*alta*, *moderata*, *bassa*) si dichiara in
una frase separata. I fatti si scrivono senza qualificatori; "potrebbe",
"sembrerebbe" e "si ritiene" sono esclusi salvo una condizione esplicita, e il
condizionale giornalistico lascia il posto all'attribuzione esplicita. Le
ipotesi di reato restano contestazioni dell'accusa.

**Ogni fonte ha il suo voto.** I fatti riportano il voto 4x4 dell'UNODC della
fonte, adattato alla stampa: comunicato di forze dell'ordine o Procura e
provvedimento giudiziario come fonte A, articolo che li riprende come fonte B,
voce non attribuita come X4. Più articoli che riprendono lo stesso comunicato
contano come una fonte sola.

**Documentazione**

-   La [Guida Operativa](help.md) descrive la nuova struttura del report; il vecchio
    esempio "È probabile che..." ora usa il glossario, con l'intervallo e il
    livello di fiducia in una frase separata.
-   Le [FAQ](FAQ.md) hanno un indice e due domande nuove: come i report esprimono
    probabilità e affidabilità delle fonti, e quali progetti SOsintOps sono
    collegati ad Acta Diurna.
-   Il README descrive ciò che il prompt chiede davvero al modello, al posto di
    un generico allineamento allo standard ICD 203.

**Difetti corretti**

-   Il disclaimer del report e quello dei casi esportati in RTF dicevano ancora
    **POLICE CHRONICLE**. Ora dicono ACTA DIURNA.

---

### Versione 0.2.0
*Data: 2026-08-16*

**Si apre, e ha una faccia sua**

Due cose bloccavano il progetto: l'applicazione non partiva, e la grafica non
era quella voluta. Questa versione risolve entrambe.

**L'applicazione si avvia senza chiave.** Prima `geminiService.ts` sollevava un
errore al caricamento del modulo se mancava la variabile d'ambiente `API_KEY`,
cioè **prima che React montasse**: senza una chiave valida a build time non
c'era modo di vedere nulla, e nessun modo di inserirla dall'interfaccia. Ora il
client si costruisce alla prima chiamata al modello. L'applicazione parte
sempre, l'archivio resta consultabile, e se la chiave manca compare la finestra
per inserirla.

**La chiave la inserisce l'admin.** Viene salvata nella tabella `settings` del
database dell'applicazione, non compilata nel bundle. L'interfaccia mostra
soltanto se una chiave è presente, mai il suo valore. Una chiave fornita in
`.env` continua a funzionare come **override** e vince su quella salvata, ma non
è più obbligatoria. Il pulsante **CHIAVE API** nell'intestazione la reimposta o
la revoca in qualsiasi momento.

**Interfaccia in direzione Samaritan.** L'intera applicazione è stata ridisegnata
sul linguaggio visivo dell'intelligenza artificiale di *Person of Interest*:

-   Filo di 2px, spigolo vivo. **Nessun angolo arrotondato in tutta
    l'applicazione**, nessuna ombra morbida, nessuna sfocatura.
-   Il bagliore è del colore stesso, con scostamento zero: l'interfaccia emette
    luce invece di riceverla.
-   Il rosso torna a essere il colore della minaccia. I comandi secondari sono
    arancioni.
-   I titoli dei pannelli sbordano dal riquadro invece di starci dentro.
-   Il maiuscolo è della cornice e delle etichette. Il corpo del testo resta
    leggibile: nomi e riassunti dei casi non vengono forzati in maiuscolo.
-   I casi sulla mappa sono **quadrati** con alone, non pallini. L'unico
    elemento tondo rimasto è la spia di registrazione.
-   Il commutatore in alto a destra non accende un tema chiaro: è l'inversione
    da `#060606` a `#f9f9f9`, lenta due secondi.

**Carattere Nova Mono**, vendorizzato in `public/fonts/` con la sua licenza SIL
OFL. Nessun carattere caricato da servizi remoti. Il carattere della serie,
FF Magda Clean Mono, è commerciale e non redistribuibile in un repository MIT.

**I colori stanno in un punto solo.** Erano in ternari sul tema sparsi in venti
componenti. Ora sono variabili CSS in `src/index.css`: cambiare la direzione
visiva significa cambiare cinque righe.

**Difetti corretti**

-   **Le finestre finivano sotto la mappa.** Avevano `z-index: 50`, ma Leaflet
    arriva a 1000 con i suoi pannelli e controlli. La finestra della chiave
    compariva e diventava subito inaccessibile. Colpiva tutte le finestre.
-   **La documentazione in-app non si apriva.** `DocsModal` chiedeva
    `/docs/help.md`, ma i file stavano fuori da `public/`: la richiesta
    rispondeva 200 restituendo l'HTML dell'applicazione, che finiva nel lettore
    markdown. I documenti sono stati spostati in `public/docs/`. È la regressione
    introdotta dal passaggio a Vite.
-   Testo dei pulsanti fuori centro: `letter-spacing` aggiunge spazio anche dopo
    l'ultima lettera. Compensato con un rientro pari alla spaziatura.
-   I pulsanti dell'intestazione si sovrapponevano quando lo spazio mancava: ora
    la barra va a capo.
-   L'intestazione diceva ancora **POLICE CHRONICLE**. Ora dice Acta Diurna.

---

### Versione 0.1.0
*Data: 2026-08-15*

**🏛️ Rinascita come Acta Diurna: rebrand, repository pubblico e risanamento**

Il progetto cambia nome, si separa in due repository e riparte da una
numerazione onesta. *Acta Diurna* era la gazzetta quotidiana affissa nel Foro
romano, il primo bollettino di notizie pubbliche della storia. Il nome
precedente, *Police Chronicle*, suggeriva uno strumento delle forze
dell'ordine: questa è invece un'applicazione civile che legge esclusivamente
fonti giornalistiche aperte.

**Perché si riparte da 0.1.0.** La versione 1.6.0 non è mai stata realmente
eseguita da nessuno. Un difetto in `index.html` faceva partire il codice
precedente, e il codice della 1.6 conteneva un import verso un pacchetto npm
inesistente. La numerazione 0.x dichiara ciò che il software è davvero: un
prototipo funzionale non ancora validato sul campo. Le versioni da 1.0.0 a
1.6.0 elencate qui sotto restano come cronologia dello sviluppo precedente.

-   **Repository separati**: il codice dell'applicazione e la documentazione
    utente vivono in un repository pubblico; materiale di lavoro, appunti e
    backup del database restano in un repository privato.
-   **Un solo albero sorgente**: le copie duplicate e divergenti dei sorgenti,
    residuo di una riorganizzazione mai completata, sono state eliminate.
-   **Un solo punto di ingresso**: `index.html` montava due applicazioni React
    sullo stesso elemento, e la seconda sovrascriveva la prima. È il motivo per
    cui nessuna delle funzionalità dalla 1.4.4 in poi risultava attiva.
-   **Build reale con Vite**: il progetto si compila e si avvia con
    `npm install` e `npm run dev`. La procedura descritta in precedenza non
    poteva funzionare, perché nessun browser esegue direttamente file TypeScript.
-   **Nessuna risorsa remota**: React, Dexie, Zustand, Leaflet, Tailwind e le
    altre dipendenze non arrivano più da CDN esterni ma sono installate come
    pacchetti npm. Anche il GeoJSON dei confini regionali, prima scaricato da
    GitHub a ogni avvio, è ora servito dall'applicazione.
-   **Correzioni di stabilità**: sei funzioni di interrogazione dell'IA
    potevano terminare senza restituire alcun valore; la creazione manuale di
    un caso da URL poteva produrre un caso incompleto quando l'IA ometteva dei
    campi.
-   **Licenza MIT effettiva**: il file `LICENSE` era vuoto, quindi il codice era
    di fatto privo di licenza. Ora contiene il testo completo.

I database esistenti restano pienamente compatibili: il nome tecnico
dell'archivio locale non è stato modificato, quindi i casi già raccolti e le
impostazioni salvate sopravvivono al rebrand.

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