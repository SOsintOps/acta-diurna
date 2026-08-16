# Acta Diurna

![Versione](https://img.shields.io/badge/version-0.2.0-blue.svg)
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
la usa, in IndexedDB, e non vengono trasmessi ad alcun server se non a Google
Gemini per l'analisi.

## Funzionalità

- **Scoperta automatica dei casi.** Un agente basato su Gemini con grounding di
  Google Search setaccia le fonti giornalistiche italiane, filtra il rumore e
  propone solo i casi rilevanti.

- **Verifica della provenienza.** Ogni fonte citata dall'IA viene confrontata
  con i metadati di grounding di Google Search: URL e titoli vengono corretti e
  le fonti inventate scartate. I casi le cui fonti non superano la verifica
  restano visibili ma contrassegnati da un avviso.

- **Gestione dei casi.** Feed filtrabile e ricercabile, con stati *Non letto*,
  *Importante* e *Archiviato*.

- **Mappa interattiva.** I casi selezionati evidenziano le regioni coinvolte e
  localizzano le città interessate.

- **Report allineati allo standard ICD 203.** Sintesi del *modus operandi*,
  entità coinvolte e valutazione strategica, con livelli di confidenza espliciti,
  distinzione fra fatti e ipotesi e identificazione delle lacune informative.
  Traducibili in inglese professionale.

- **Apprendimento dal feedback.** Marcare un caso come importante, o archiviarlo
  indicandone il motivo, alimenta la revisione periodica del profilo di ricerca
  dell'IA. La cronologia dei prompt è ispezionabile, confrontabile e
  ripristinabile.

- **Scelta del modello.** Il modello Gemini è selezionabile, così un errore di
  quota su un modello non blocca il lavoro.

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
- Una **chiave API di Google Gemini** ([aistudio.google.com/apikey](https://aistudio.google.com/apikey)),
  da inserire dall'interfaccia al primo avvio. Il piano gratuito è sufficiente
  per provare l'applicazione. Senza chiave l'applicazione parte lo stesso e
  l'archivio resta consultabile, ma non può analizzare nulla.
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

L'interfaccia mostra soltanto se una chiave è presente, mai il suo valore.

Per una build di produzione:

```bash
npm run build     # genera dist/
npm run preview   # serve dist/ in locale per verifica
```

### La chiave a build time è facoltativa

Chi compila può fornire una chiave in `.env`, copiando `.env.example`. In quel
caso la chiave fa da **override**: vince su quella inserita dall'interfaccia, e
l'interfaccia non permette di cambiarla.

> **Attenzione.** Una chiave fornita in `.env` viene compilata **in chiaro
> dentro il bundle JavaScript**, quindi è leggibile da chiunque acceda a una
> build pubblicata online. Una build fatta così non va distribuita né esposta in
> rete. Il file `.env` è escluso dal versionamento e non va mai committato.

La chiave inserita dall'interfaccia resta nel database del browser. È molto
meglio del bundle, ma non è protetta da chi ha accesso al profilo del browser.

## Come funziona

```
        fonti giornalistiche italiane
                    │
                    ▼
      Gemini + grounding Google Search      ← scoperta e strutturazione
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
Leaflet · Google Gemini API

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

## Limiti noti

- **La scoperta dei casi dipende interamente dal grounding di Google Search di
  Gemini.** Non esiste una pipeline di raccolta autonoma: senza quel servizio
  l'applicazione può solo analizzare contenuti forniti a mano.
- **L'IA può sbagliare.** La verifica della provenienza elimina le fonti
  inventate, ma non garantisce che l'interpretazione dei fatti sia corretta.
  La validazione resta responsabilità dell'analista.
- **Nessun test automatico**, al momento.
- **Prototipo.** La numerazione 0.x è deliberata: il software non è ancora stato
  validato da un uso prolungato sul campo.

## Licenza

[MIT](LICENSE) — © 2025-2026 Samaritan project & Sitticus
