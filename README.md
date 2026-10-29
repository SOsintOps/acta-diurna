# Acta Diurna

[![CI](https://github.com/SOsintOps/acta-diurna/actions/workflows/ci.yml/badge.svg)](https://github.com/SOsintOps/acta-diurna/actions/workflows/ci.yml)
![Versione](https://img.shields.io/badge/version-0.3.0-blue.svg)
![Licenza](https://img.shields.io/badge/license-MIT-green.svg)

**Dashboard OSINT per monitorare e analizzare le notizie sulle operazioni delle forze dell'ordine in Italia.**

> *Acta Diurna* erano gli avvisi quotidiani affissi nel Foro romano: il primo
> bollettino di notizie pubbliche della storia.

---

## Cos'è

Acta Diurna è uno strumento di **Open-Source Intelligence** che legge la stampa
italiana per individuare operazioni delle forze dell'ordine già effettuate, le
struttura in casi consultabili, le colloca su una mappa e ne produce report di
analisi.

**È un'applicazione civile.** Non ha alcun legame con le forze dell'ordine né
con enti pubblici, non accede ad archivi riservati e non svolge alcuna
sorveglianza: elabora esclusivamente notizie già pubblicate da testate
giornalistiche accessibili a chiunque. È pensata per analisti, giornalisti e
ricercatori.

L'applicazione gira interamente nel browser. I dati restano sul computer di chi
la usa, in IndexedDB, e non vengono trasmessi ad alcun server se non al
fornitore di IA scelto per l'analisi: Google Gemini oppure Anthropic Claude.

## Funzionalità

- **Scoperta automatica dei casi.** Un agente con ricerca web (Gemini con
  grounding di Google Search, oppure Claude con gli strumenti di ricerca e
  lettura web) setaccia le fonti giornalistiche italiane, filtra il rumore e
  propone solo i casi rilevanti.

- **Verifica della provenienza.** Ogni fonte citata dall'IA viene confrontata
  con le pagine che il modello ha davvero consultato: URL e titoli vengono corretti e
  le fonti inventate scartate. I casi le cui fonti non superano la verifica
  restano visibili ma contrassegnati da un avviso.

- **Gestione dei casi.** Feed filtrabile e ricercabile, con stati *Non letto*,
  *Importante* e *Archiviato*.

- **Mappa interattiva.** I casi selezionati evidenziano le regioni coinvolte e
  localizzano le città interessate.

- **Report di approfondimento strutturati.** Il prompt chiede al modello una
  sintesi iniziale che risponde alla domanda, giudizi chiave espressi con i sette
  termini di probabilità della prima riga della scala della direttiva
  [ICD 203](https://www.dni.gov/files/documents/ICD/ICD-203.pdf) (in un glossario
  italiano fisso) e un livello di fiducia dichiarato a parte, fatti accertati con
  il voto 4x4 UNODC di ogni fonte, analisi del *modus operandi*, lacune e
  tabella delle fonti. Il metodo è quello di
  [Intelligence Field Notes](https://github.com/SOsintOps/intelligence-field-notes)
  ([linguaggio della probabilità](https://github.com/SOsintOps/intelligence-field-notes/blob/main/docs/estimative-language.md),
  [valutazione delle fonti](https://github.com/SOsintOps/intelligence-field-notes/blob/main/docs/source-evaluation.md),
  [scrittura del report](https://github.com/SOsintOps/intelligence-field-notes/blob/main/docs/report-writing.md)).
  Sono istruzioni date al modello, non controlli automatici: il rispetto delle
  regole va verificato dall'analista. Traducibili in inglese professionale.

- **Apprendimento dal feedback.** Marcare un caso come importante, o archiviarlo
  indicandone il motivo, alimenta la revisione periodica del profilo di ricerca
  dell'IA. La cronologia dei prompt è ispezionabile, confrontabile e
  ripristinabile.

- **Scelta del fornitore e del modello.** Si sceglie tra Gemini, con un modello
  unico, e Claude, che usa il modello più adatto per ogni fase: Haiku per la
  geocodifica, Sonnet per rassegna, analisi di un URL, aggiornamento e
  traduzione, Opus per il report di approfondimento e la revisione del profilo
  di ricerca. Un errore di quota su un fornitore non blocca il lavoro.

- **Import/export e fusione.** L'intero archivio si esporta in JSON. In fase di
  importazione si può sovrascrivere l'archivio locale oppure *integrarlo*,
  fondendo casi, impostazioni e cronologia di apprendimento provenienti da più
  analisti. I backup di versioni precedenti vengono migrati automaticamente.

- **Documentazione integrata**, accessibile dal menu «?».

- **Interfaccia in direzione Samaritan.** Filo di 2px, spigolo vivo, nessun
  angolo arrotondato e nessuna ombra morbida: il bagliore è del colore stesso,
  perché l'interfaccia emette luce invece di riceverla. Il rosso è riservato
  alla minaccia. Il commutatore in alto a destra non accende un tema chiaro: è
  l'inversione da nero quasi puro a bianco quasi puro, lenta due secondi.

## Requisiti

- **Node.js 20** o successivo
- Una chiave API del fornitore scelto, da inserire dall'interfaccia al primo
  avvio:
  - **Google Gemini** ([aistudio.google.com/apikey](https://aistudio.google.com/apikey)):
    il piano gratuito è sufficiente per provare l'applicazione;
  - **Anthropic Claude** ([platform.claude.com](https://platform.claude.com/settings/keys)):
    a consumo, con la ricerca web abilitata per l'organizzazione.

  Senza chiave l'applicazione parte lo stesso e l'archivio resta consultabile,
  ma non può analizzare nulla.
- Un browser recente con supporto a IndexedDB

## Installazione

```bash
git clone https://github.com/SOsintOps/acta-diurna.git
cd acta-diurna
npm install
```

Avvia in sviluppo:

```bash
npm run dev
```

L'applicazione sarà disponibile su `http://localhost:5173`. Al primo avvio
chiede la chiave API: si incolla nella finestra che compare, e viene salvata nel
database dell'applicazione su questo browser. Il pulsante **CHIAVE API**
nell'intestazione la reimposta in qualsiasi momento.

Ogni fornitore ha la sua chiave: la finestra mostra quella del fornitore scelto
in **MODELLO AI**. L'interfaccia mostra soltanto se una chiave è presente, mai
il suo valore.

Per una build di produzione:

```bash
npm run build     # genera dist/
npm run preview   # serve dist/ in locale per verifica
```

### La chiave a build time è facoltativa

Chi compila può fornire una chiave in `.env` (`GEMINI_API_KEY`,
`ANTHROPIC_API_KEY`), copiando `.env.example`. In quel
caso la chiave fa da **override**: vince su quella inserita dall'interfaccia, e
l'interfaccia non permette di cambiarla.

> **Attenzione.** Una chiave fornita in `.env` viene compilata **in chiaro
> dentro il bundle JavaScript**, quindi è leggibile da chiunque acceda a una
> build pubblicata online. Una build fatta così non va distribuita né esposta in
> rete. Il file `.env` è escluso dal versionamento e non va mai committato.

La chiave inserita dall'interfaccia resta nel database del browser. È molto
meglio del bundle, ma non è protetta da chi ha accesso al profilo del browser.
Con Claude il browser chiama direttamente l'API di Anthropic: è un'altra ragione
per usare l'applicazione solo in locale, senza esporla in rete.

## Come funziona

```
        fonti giornalistiche italiane
                    │
                    ▼
   Gemini o Claude + ricerca web            ← scoperta e strutturazione
                    │
                    ▼
        verifica della provenienza          ← scarta le fonti non verificabili
                    │
                    ▼
          IndexedDB (Dexie.js)              ← archivio locale, nel browser
                    │
          ┌─────────┼─────────┐
          ▼         ▼         ▼
        feed      mappa     report
                    │
                    ▼
        feedback dell'analista              ← rivede il profilo di ricerca
```

## Tecnologie

React 19 · TypeScript · Vite · Tailwind CSS · Zustand · Dexie.js (IndexedDB) ·
Leaflet · Google Gemini API · Anthropic Claude API

Tutte le dipendenze sono installate come pacchetti npm: l'applicazione non
carica codice da CDN esterni. L'unica risorsa remota a runtime è il servizio di
mappe (tile OpenStreetMap/CARTO), inevitabile per una mappa geografica.

Il carattere è **Nova Mono** (Wojciech Kalinowski, SIL OFL 1.1), vendorizzato in
`public/fonts/` con la licenza accanto. Non viene caricato da Google Fonts né da
altri servizi remoti.

I valori dell'interfaccia derivano da due ricostruzioni pubbliche, entrambe MIT:
[poi-web-ui](https://github.com/Phreshhh/poi-web-ui) di Krisztián Kis e
[Samaritan](https://github.com/goncalomb/Samaritan) di Gonçalo Baltazar.

## Documentazione

| Documento | Contenuto |
|---|---|
| [Guida operativa](public/docs/help.md) | Metodo di lavoro per l'analista |
| [FAQ](public/docs/FAQ.md) | Funzionamento, capacità e limiti |
| [Cronologia versioni](public/docs/versions.md) | Cosa è cambiato e quando |
| [Roadmap](public/docs/todo.md) | Funzionalità previste |
| [Sicurezza](SECURITY.md) | Modello di sicurezza e segnalazione delle vulnerabilità |
| [Contribuire](CONTRIBUTING.md) | Ambiente, verifiche, regole del progetto |

## Limiti noti

- **La scoperta dei casi dipende interamente dalla ricerca web del fornitore di
  IA.** Non esiste una pipeline di raccolta autonoma: senza quel servizio
  l'applicazione può solo analizzare contenuti forniti a mano.
- **L'IA può sbagliare.** La verifica della provenienza elimina le fonti
  inventate, ma non garantisce che l'interpretazione dei fatti sia corretta.
  La validazione resta responsabilità dell'analista.
- **Nessun test automatico**, al momento. La CI verifica tipi e build.
- **Prototipo.** La numerazione 0.x è deliberata: il software non è ancora stato
  validato da un uso prolungato sul campo.

## Licenza

[MIT](LICENSE) — © 2025-2026 Samaritan project & Sitticus
