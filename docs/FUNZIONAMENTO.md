# Acta Diurna — requisiti e funzionamento

Questo documento descrive che cosa fa Acta Diurna e come lo fa, nella versione **0.5.0**.
È la descrizione del prodotto com'è nel codice: ogni requisito qui sotto è implementato,
salvo quelli elencati in fondo, in [Limiti noti](#10-limiti-noti).

- Per l'uso quotidiano: la [Guida operativa](../public/docs/help.md) e le [FAQ](../public/docs/FAQ.md).
- Per le modifiche versione per versione: la [cronologia](../public/docs/versions.md).

## Indice

1. [Scopo e perimetro](#1-scopo-e-perimetro)
2. [Architettura](#2-architettura)
3. [Flusso di lavoro](#3-flusso-di-lavoro)
4. [Rassegna delle notizie](#4-rassegna-delle-notizie)
5. [Casi ed entità](#5-casi-ed-entità)
6. [Lavoro dell'analista](#6-lavoro-dellanalista)
7. [Approfondimento e apprendimento](#7-approfondimento-e-apprendimento)
8. [Ricerca nelle sentenze con Iudex](#8-ricerca-nelle-sentenze-con-iudex)
9. [Esportazione, costi, sicurezza](#9-esportazione-costi-sicurezza)
10. [Limiti noti](#10-limiti-noti)

---

## 1. Scopo e perimetro

Acta Diurna legge la stampa italiana, individua le operazioni delle forze dell'ordine già
eseguite e le trasforma in **casi** strutturati, consultabili su una mappa e approfondibili
con un report di analisi. È un'applicazione **civile**: lavora solo su notizie già pubblicate
e non ha legami con forze dell'ordine o enti pubblici.

| Requisito | Descrizione |
|---|---|
| R1.1 | Un caso è un'**operazione già eseguita** in Italia da Polizia di Stato, Carabinieri o Guardia di Finanza, o disposta da una Procura: arresti, misure cautelari, perquisizioni, sequestri, confische. |
| R1.2 | Restano fuori i processi, le sentenze e le indagini annunciate senza un'operazione. |
| R1.3 | Ogni caso ha una o più di **nove categorie**, la principale per prima: `ORGANIZED_CRIME`, `FINANCIAL_CRIME`, `ASSET_SEIZURE`, `FRAUD`, `CORRUPTION`, `DRUG_TRAFFICKING`, `CYBER_CRIME`, `EXTORTION`, `OTHER`. Un valore fuori elenco si scarta e, senza categorie valide, il caso è `OTHER`. |
| R1.4 | Le ipotesi di reato sono riportate come **contestazioni dell'accusa**, non come fatti accertati (presunzione di innocenza). |

## 2. Architettura

```
                ┌──────────────── browser (http://localhost:5173) ────────────────┐
                │  interfaccia React · archivio IndexedDB · registro dei consumi  │
                └───────┬──────────────────────────────┬──────────────────────────┘
                        │ API Claude (o Gemini)         │ ponte locale
                        ▼                               ▼
              Anthropic: Sonnet, Opus, Haiku    server di Vite ──► Iudex (127.0.0.1)
              con ricerca e lettura web                              │
                                                                     ▼
                                                         Cassazione (Italgiure)
```

| Requisito | Descrizione |
|---|---|
| R2.1 | L'applicazione gira **in locale**, servita da Vite (`npm run dev` o `npm run preview`). I dati restano nel database del browser (IndexedDB) e non vanno su nessun server, salvo le richieste ai fornitori di IA e, se attivata, a Iudex. |
| R2.2 | Fornitore predefinito **Anthropic Claude**, con un modello per fase (tabella sotto). In alternativa **Google Gemini**, con un modello unico. Il fornitore si sceglie con **CAMBIA AI**. |
| R2.3 | L'interfaccia non carica risorse remote: niente CDN né caratteri esterni. L'unica eccezione sono le tile della mappa (OpenStreetMap). |
| R2.4 | Con Claude, le istruzioni fisse di ogni fase stanno nel *system prompt* e vanno in cache. Dalla seconda chiamata quella parte costa circa un decimo. |

**Modelli per fase (Claude):**

| Fase | Modello | Ragionamento | Ricerche web | Quando parte |
|---|---|---|---|---|
| Rassegna | Sonnet 5.5 | medio | al massimo 6 | CERCA ORA, o ogni 4 ore |
| Analisi di un URL | Sonnet 5.5 | medio | al massimo 3 | SEGNALA URL |
| Aggiornamento di un caso | Sonnet 5.5 | medio | al massimo 5 | AGGIORNA |
| Report di approfondimento | Opus 5.5 | alto | al massimo 10 | APPROFONDIMENTO, SEGNALA URL |
| Entità dal report | Sonnet 5.5 | basso | — | dopo ogni report |
| Revisione dei criteri | Opus 5.5 | alto | — | ogni 15 casi importanti |
| Traduzione | Sonnet 5.5 | basso | — | sul report, su richiesta |
| Geocodifica | Haiku 5.5 | basso | — | comune non in cache |

## 3. Flusso di lavoro

```
 avvio ─► rassegna ─► casi in archivio ─► lavoro dell'analista ─► approfondimento ─► uscite
            ▲              │                    │                     │
            │              └─ entità ───────────┼─► ricerca in Iudex  │
            └──── apprendimento (criteri) ◄─────┘   (facoltativa)     │
                                                         export FTM / JSONL / DB / RTF
```

**All'avvio:**

| Requisito | Descrizione |
|---|---|
| R3.1 | Le entità dei casi in archivio nel formato precedente passano da sole al formato comune (§5). |
| R3.2 | Se manca la chiave del fornitore in uso, si apre **IMPOSTAZIONI**. L'archivio resta consultabile anche senza chiave. |
| R3.3 | **Nessuna rassegna parte da sola all'apertura**, nemmeno a database vuoto: la prima si avvia con **CERCA ORA**. |

## 4. Rassegna delle notizie

| Requisito | Descrizione |
|---|---|
| R4.1 | **Avvio.** La rassegna parte con **CERCA ORA**, oppure da sola ogni 4 ore tra le 9 e le 18. Con l'interruttore **24H** acceso parte a ogni ora; il timer gira solo con la scheda aperta. |
| R4.2 | **Ingressi** della richiesta al modello: data odierna; criteri d'interesse dell'analista (il prompt attivo, in GESTIONE PROMPT); profilo appreso dalle sue scelte; casi degli ultimi **60 giorni**, per non ripeterli. |
| R4.3 | **Finestra.** Contano le notizie pubblicate negli ultimi 3 giorni, con la data scritta nell'articolo. Una notizia di più di 7 giorni resta fuori anche se ripresa oggi. |
| R4.4 | **Fonti escluse** dalla ricerca: siti non giornalistici, cioè Wikipedia, social network e siti video. |
| R4.5 | **Verifica delle fonti.** Una fonte vale solo se il suo indirizzo è tra le pagine che il modello ha davvero consultato. Il confronto ignora `www`, la barra finale e i parametri di tracciamento. Un caso senza fonti verificate si scarta. Con Gemini, che restituisce rinvii invece degli indirizzi, il confronto avviene sui titoli. |
| R4.6 | **Luoghi.** Le città del caso perdono i doppioni e vengono geocodificate: prima con la cache locale dei comuni, poi con il modello. Un caso senza nessuna località con coordinate si scarta. |
| R4.7 | **Identificativo** `AAAAMMGG-CAT-NNN` (es. `20261029-ORG-002`), assegnato dal contatore locale e mai dal modello. Per i casi da URL è `AAAAMMGG-CAT-MANUAL-NNN`. |
| R4.8 | I casi validi entrano in archivio come **non letti**. |
| R4.9 | Risposta del modello: un array JSON di casi. Il codice lo trova anche se il modello aggiunge testo prima o dopo; una risposta senza JSON vale come «nessun caso nuovo». |

## 5. Casi ed entità

Le persone e le società seguono il **formato comune con
[Iudex](https://github.com/SOsintOps/Iudex)** e Praeco: stessi campi e stessi identificativi.
Così i dati si scambiano tra le tre applicazioni e si incrociano con le sentenze della
Cassazione.

| Requisito | Descrizione |
|---|---|
| R5.1 | **Persona**: `nome`, `cognome` (separati, con `ordine_certo`, solo se l'articolo li distingue con certezza), `nome_come_scritto`, `sesso` e `sesso_fonte`, `data_nascita`, `luogo_nascita`, `cf`. In più l'`eta` e, quando c'è solo l'età, gli `anni_nascita_stimati`: i due anni possibili, calcolati sulla data dell'operazione. |
| R5.2 | **Sesso** solo se l'articolo lo dichiara: «nato» o «nata», oppure una qualifica come «l'indagata». Si ricava anche dal codice fiscale. **Mai dal nome proprio.** |
| R5.3 | **Codice fiscale** solo se scritto nell'articolo e con il carattere di controllo giusto, omocodia ammessa. **Mai calcolato.** |
| R5.4 | **Data di nascita** solo se completa e valida (`AAAA-MM-GG`); le date parziali si scartano. |
| R5.5 | **Società o ente**: `ragione_sociale` senza la forma giuridica, `forma`, `tipo` (`societa`, `ente_pubblico`, `organizzazione`), `cf`, `piva` e `rea` solo se scritti e validi, `paese`, `sede`, `stato` (sotto sequestro, fallita...). In più `attivita`, `settore`, `valore_beni`. |
| R5.6 | **Citazione**: il ruolo (che cosa fa la persona) e la posizione nel procedimento (indagato, arrestato, ai domiciliari...) stanno sulla presenza dell'entità nel caso, non sull'entità. |
| R5.7 | **Legami persona–società** (amministratore, socio, titolare, dipendente, prestanome), con il tipo (`amministrazione`, `proprieta`, `dipendenza`, `rappresentanza`, `appartenenza`) e la qualifica «di fatto». |
| R5.8 | **Identità (uid)**: la stessa entità ha lo stesso uid in ogni caso e in ogni applicazione. Si calcola, nell'ordine, dal codice fiscale; da nome, data e luogo di nascita; altrimenti dal nome legato al singolo caso, senza fusione con altri. Per le società: CF, poi P.IVA, poi REA, poi ragione sociale con forma e paese. Così «FIORE ANDREA» e «Andrea Fiore», con la stessa data di nascita, sono una persona sola. |
| R5.9 | **Unione senza perdite**: le entità che arrivano da un aggiornamento o da un report si uniscono a quelle del caso per uid. Un dato già noto non si cancella, uno nuovo si aggiunge. |

## 6. Lavoro dell'analista

| Requisito | Descrizione |
|---|---|
| R6.1 | **Feed** con le schede *Non letti*, *Importanti*, *Irrilevanti* e *Tutti*. Una ricerca libera copre identificativo, titolo, luoghi, categorie, nome dell'operazione, nomi di persone e società, P.IVA e CF; c'è anche un filtro per data. |
| R6.2 | **Mappa**: la regione del caso è evidenziata; la città principale è un triangolo rosso grande, le altre località triangoli piccoli. |
| R6.3 | **Dettaglio**: riepilogo, date, forze coinvolte, località, persone (con ruolo, posizione, nascita, CF), società, legami, fonti e sentenze collegate da Iudex. |
| R6.4 | **IMPORTANTE**: segnale per il profilo di ricerca. Non scade e non fa partire aggiornamenti. |
| R6.5 | **IRRILEVANTE**: archivia il caso con il motivo (duplicato, troppo vecchio, fuori perimetro), che entra nel profilo come esempio da evitare. |
| R6.6 | **AGGIORNA**: cerca sul web sviluppi e dati mancanti del caso, prima di tutto persone e società. Le fonti e le entità nuove si aggiungono a quelle esistenti. Parte solo su richiesta. |
| R6.7 | **SEGNALA URL**: l'analista incolla l'indirizzo di un articolo; il modello lo legge e ne fa un caso «manuale», segnato importante. Subito dopo parte il report di approfondimento. Un articolo fuori perimetro o già in archivio viene rifiutato con un messaggio. |
| R6.8 | **Un solo lavoro con il modello alla volta**: rassegna, aggiornamento e analisi di un URL non partono insieme. |

## 7. Approfondimento e apprendimento

| Requisito | Descrizione |
|---|---|
| R7.1 | **APPROFONDIMENTO**: report in Markdown scritto con ricerca web sulle fonti originali. |
| R7.2 | **Linguaggio della probabilità**: solo i sette termini della scala della direttiva ICD 203, con l'intervallo alla prima occorrenza. Il livello di fiducia va in una frase separata. |
| R7.3 | **Valutazione delle fonti** con il sistema 4x4 dell'UNODC: affidabilità A, B, C, X e validità 1-4. La fonte è chi ha prodotto l'informazione, non il sito che la ospita; la corroborazione conta solo se indipendente. |
| R7.4 | **Struttura del report**: Sintesi; Giudizi chiave; Fatti accertati; Analisi (modus operandi, ipotesi alternative, assunzioni chiave); Lacune e prossimi passi; Fonti in tabella; Metodo e limiti. Poi tre allegati: entità, dati geografici, verifiche con sistemi interni. In chiusura un'avvertenza fissa. |
| R7.5 | Dopo il report, una seconda chiamata breve ne estrae persone, società e legami a schema, che si uniscono al caso (R5.9). |
| R7.6 | **Traduzione** del report in inglese professionale. Conserva il Markdown e rende i termini di probabilità e le qualifiche processuali con i termini inglesi corretti. |
| R7.7 | **ESPORTA NOTIZIA**: scheda del caso in RTF. |
| R7.8 | **Apprendimento**: ogni 15 casi marcati importanti, il modello rivede i **criteri d'interesse** in base alle scelte dell'analista. Riscrive solo i criteri, mai le regole di estrazione o la forma dell'uscita. Una revisione che non sembra un elenco di criteri si rifiuta. |
| R7.9 | **Cronologia dei criteri** in GESTIONE PROMPT: ogni versione si confronta e si ripristina. |

## 8. Ricerca nelle sentenze con Iudex

| Requisito | Descrizione |
|---|---|
| R8.1 | **Facoltativa**: si attiva in **IMPOSTAZIONI → Ricerca in Iudex**, spenta di partenza. Spenta, non parte nessuna chiamata a Iudex. |
| R8.2 | Serve [Iudex](https://github.com/SOsintOps/Iudex) acceso sullo stesso computer, con la ricerca locale. Acta Diurna lo trova da solo sulle porte 8765-8784 di 127.0.0.1. |
| R8.3 | Il pulsante **IUDEX** accanto a una persona o società cerca il nome nel testo delle sentenze. Si parte dall'**archivio locale di Iudex**, senza nessuna richiesta alla Corte; la ricerca sulla **Cassazione** parte solo con **CERCA SULLA CORTE**, una per clic. |
| R8.4 | **Frase di ricerca**, modificabile: per le persone le due forme del nome («Carlo Bianchi» e «Bianchi Carlo») più il CF se noto; per le società la ragione sociale senza forma più P.IVA o CF se noti. |
| R8.5 | **COLLEGA** registra la sentenza nel caso come *riscontro*: entità, id della sentenza, ECLI, dove è stata trovata, frase, data. |
| R8.6 | Un riscontro è un **candidato da verificare**: molti nomi nelle sentenze sono oscurati e lo stesso nome può appartenere a persone diverse. Nessun risultato non prova nulla. |
| R8.7 | **Token di Iudex**: lo legge e lo usa solo il server locale di Acta Diurna, mai il browser. Il ponte rifiuta le richieste da altre origini e manda alla Corte una ricerca alla volta. |
| R8.8 | La ricerca in Iudex **non usa Claude**. Ogni ricerca sulla Corte è una richiesta al server di Italgiure. |

## 9. Esportazione, costi, sicurezza

**Esportazione e scambio:**

| Requisito | Descrizione |
|---|---|
| R9.1 | **ESPORTA DB / IMPORTA DB**: archivio completo in JSON. All'importazione l'archivio locale si sovrascrive o si integra, fondendo i casi di più analisti. I backup delle versioni precedenti si migrano da soli. |
| R9.2 | **ESPORTA FTM**: persone, società, casi (come `Event`), citazioni e legami in FollowTheMoney NDJSON, apribile in Aleph. L'id di persone e società è il loro uid. |
| R9.3 | **ESPORTA JSONL**: pacchetto di scambio con Iudex e Praeco. Prima riga `{"record":"pacchetto","app":"acta-diurna","formato":1}`, poi un record per caso, persona, società, citazione, legame e riscontro. |

**Costi:**

| Requisito | Descrizione |
|---|---|
| R9.4 | **Tetto di spesa giornaliero** per Claude, predefinito 1 $, modificabile in IMPOSTAZIONI. Raggiunto il tetto, nessuna chiamata parte fino al giorno dopo, e un messaggio lo dice. |
| R9.5 | **Consumi**: per ogni chiamata si registrano token, ricerche web e costo stimato dal listino. Le impostazioni mostrano oggi, 30 giorni e totale, divisi per fase. Il costo effettivo è nella Console di Anthropic. |

**Sicurezza:**

| Requisito | Descrizione |
|---|---|
| R9.6 | **Chiavi API** una per fornitore, inserite in IMPOSTAZIONI e salvate nel database del browser. Si mostra solo se ci sono, mai il valore. Una chiave in `.env` vince su quella salvata, ma finisce in chiaro nel bundle: una build così non va distribuita. |
| R9.7 | **Workload Identity Federation** di Claude, facoltativa, al posto della chiave: il server di Vite scambia il JWT dell'identity provider e il browser riceve solo un token breve (vedi il README). |
| R9.8 | Il browser chiama direttamente le API del fornitore, quindi **l'applicazione va usata solo in locale** e non esposta in rete. Gli archivi contengono dati personali di persone citate in articoli pubblicati: le esportazioni vanno custodite come tali. |

## 10. Limiti noti

- **Rassegna dalla ricerca web.** La copertura è quella che il modello trova in 6 ricerche e
  non si misura. Una raccolta da feed RSS è allo studio.
- **Timer della rassegna.** Ogni 4 ore e solo con la scheda aperta: non ci sono composizioni
  a orari fissi né il recupero di quelle saltate.
- **Profilo di ricerca incompleto.** Gli esempi «importanti» e «con report» del profilo
  arrivano vuoti: l'archivio cerca quei casi con un indice che non vede i valori booleani.
  Il profilo si basa quindi solo sui casi letti e sugli irrilevanti.
- **Apprendimento.** Riscrive i criteri d'interesse; non riordina la rassegna in base alle
  preferenze dell'analista.
- **Qualità.** Mancano il conteggio dei falsi positivi e il registro dei casi mancati.
- **Sezione «Audio».** È ancora nel dettaglio del caso, ma la sintesi vocale non fa più
  parte del prodotto.
- **Nessun backend.** Un solo utente per browser; più analisti si scambiano gli archivi con
  esporta e importa.
