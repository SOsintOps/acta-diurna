# Sicurezza

## Segnalare una vulnerabilità

Non aprire una issue pubblica. Usa la segnalazione privata di GitHub:
**Security → Report a vulnerability** in questo repository. Riceverai una
risposta appena possibile.

## Modello di sicurezza, in breve

Acta Diurna è un'applicazione che gira **solo nel browser**, senza backend.

- **Le chiavi API stanno nel browser.** Quella inserita dall'interfaccia vive
  nel database IndexedDB del profilo; quella fornita in `.env` viene compilata
  in chiaro nel bundle. Con Claude, il browser chiama direttamente l'API di
  Anthropic.
- **Per questo l'applicazione va usata in locale** (`npm run dev` o
  `npm run preview`) e **non va pubblicata né esposta in rete**. Una build fatta
  con una chiave in `.env` non va distribuita.
- **Gli archivi contengono dati personali**: nomi di persone indagate, tratti
  da articoli già pubblicati, e valutazioni analitiche non validate. Le
  esportazioni JSON vanno custodite come tali.

Sono comportamenti noti, non vulnerabilità da segnalare. È previsto un backend
che custodisca le chiavi lato server.

## Versioni supportate

Solo l'ultima versione su `main`.
