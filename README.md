# Acta Diurna

[![CI](https://github.com/SOsintOps/acta-diurna/actions/workflows/ci.yml/badge.svg)](https://github.com/SOsintOps/acta-diurna/actions/workflows/ci.yml)
![Versione](https://img.shields.io/badge/version-0.5.2-blue.svg)
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
fornitore di IA scelto per l'analisi: Anthropic Claude, predefinito, oppure
Google Gemini.

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

- **Scelta del fornitore e del modello.** Il predefinito è Claude, che usa il
  modello più adatto per ogni fase: Haiku per la
  geocodifica, Sonnet per rassegna, analisi di un URL, aggiornamento e
  traduzione, Opus per il report di approfondimento e la revisione del profilo
  di ricerca. In alternativa Gemini, con un modello unico. Un errore di quota
  su un fornitore non blocca il lavoro.

- **Persone e società in un formato comune con Iudex.** Le entità dei casi
  (persone, società ed enti, ruoli, posizioni nel procedimento, legami
  persona–società) seguono lo stesso modello e gli stessi identificativi di
  [Iudex](https://github.com/SOsintOps/Iudex), così i dati si scambiano e si
  incrociano con le sentenze della Cassazione. Codice fiscale e partita IVA si
  salvano solo se scritti nell'articolo e validi; il sesso solo se dichiarato,
  mai dedotto dal nome. Si esportano in FollowTheMoney (`.ftm`, apribile in
  Aleph) e in un pacchetto JSONL. Acta Diurna, Iudex e Praeco sono tre applicazioni
  autonome: collaborano e si scambiano i dati, ma ognuna funziona da sola e nessuna
  richiede le altre.

- **Ricerca nelle sentenze con Iudex** (facoltativa, da attivare nelle impostazioni).
  Con Iudex acceso sullo stesso computer, ogni persona e società di un caso si cerca nelle
  sentenze della Cassazione: prima nell'archivio locale di Iudex, poi sulla Corte su
  richiesta. Le sentenze trovate si collegano al caso. Acta Diurna parla con Iudex dal suo
  server locale: il token di Iudex non passa mai dal browser.

- **Tetto di spesa.** Le chiamate a Claude si fermano al raggiungimento di un
  tetto giornaliero, modificabile nelle impostazioni insieme al riepilogo dei
  consumi.

- **Import/export e fusione.** L'intero archivio si esporta in JSON. In fase di
  importazione si può sovrascrivere l'archivio locale oppure *integrarlo*,
  fondendo casi, impostazioni e cronologia di apprendimento provenienti da più
  analisti. I backup di versioni precedenti vengono migrati automaticamente.

- **Documentazione integrata**, accessibile dal menu «?».

- **Tema scuro e tema chiaro**, commutabili dall'intestazione.

## Requisiti

- **Node.js 22.12** o successivo
- Una chiave API del fornitore scelto, da inserire dall'interfaccia al primo
  avvio:
  - **Anthropic Claude**, predefinito ([platform.claude.com](https://platform.claude.com/settings/keys)):
    a consumo, con la ricerca web abilitata per l'organizzazione;
  - **Google Gemini**, in alternativa ([aistudio.google.com/apikey](https://aistudio.google.com/apikey)).

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
database dell'applicazione su questo browser. Il pulsante **IMPOSTAZIONI**
nell'intestazione la reimposta in qualsiasi momento.

Le impostazioni raccolgono le chiavi di tutti i fornitori, ciascuna con il suo
stato; il fornitore in uso si cambia con **CAMBIA AI**. L'interfaccia mostra
soltanto se una chiave è presente, mai il suo valore.

Per una build di produzione:

```bash
npm run build     # genera dist/
npm run preview   # serve dist/ in locale per verifica
```

### La chiave a build time è facoltativa

Chi compila può fornire una chiave in `.env` (`ANTHROPIC_API_KEY`,
`GEMINI_API_KEY`), copiando `.env.example`. In quel
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

### Claude senza chiave: Workload Identity Federation

Al posto della chiave, Claude accetta la
[Workload Identity Federation](https://platform.claude.com/docs/en/manage-claude/workload-identity-federation):
il JWT di un identity provider già fidato (Entra ID, Okta, Google Cloud, AWS,
Kubernetes, GitHub Actions...) si scambia con un token Claude di breve durata.

1. Nella Claude Console crea un *service account*, un *federation issuer* per il
   tuo identity provider e una *federation rule* con scope `workspace:inference`.
2. In `.env` compila le variabili `ANTHROPIC_FEDERATION_RULE_ID`,
   `ANTHROPIC_ORGANIZATION_ID`, `ANTHROPIC_SERVICE_ACCOUNT_ID` e una tra
   `ANTHROPIC_IDENTITY_TOKEN_FILE` e `ANTHROPIC_IDENTITY_TOKEN` (vedi
   `.env.example`). Lascia vuota `ANTHROPIC_API_KEY`.
3. Avvia con `npm run dev` o `npm run preview`. In **IMPOSTAZIONI** la voce
   **FEDERAZIONE** passa ad **ATTIVA**.

Lo scambio lo fa il server di Vite: l'endpoint di Anthropic non accetta chiamate
dal browser, e così il JWT e gli identificativi restano sul server. Al browser
arriva solo il token breve, che l'applicazione rinnova da sola alla scadenza.
La federazione ha la precedenza sulla chiave salvata dall'interfaccia, non su
quella compilata da `.env`. Funziona solo con l'applicazione servita da Vite,
non con una build statica copiata su un altro server.

## Come funziona

```
        fonti giornalistiche italiane
                    │
                    ▼
   Claude o Gemini + ricerca web            ← scoperta e strutturazione
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
Leaflet · Anthropic Claude API · Google Gemini API

Tutte le dipendenze sono installate come pacchetti npm: l'applicazione non
carica codice da CDN esterni. L'unica risorsa remota a runtime è il servizio di
mappe (tile [OpenStreetMap](https://www.openstreetmap.org/copyright)),
inevitabile per una mappa geografica. I caratteri sono quelli di sistema.

## Documentazione

| Documento | Contenuto |
|---|---|
| [Requisiti e funzionamento](docs/FUNZIONAMENTO.md) | Che cosa fa Acta Diurna e come: requisiti, flusso, modelli, limiti |
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
