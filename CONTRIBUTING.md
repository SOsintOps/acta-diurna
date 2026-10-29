# Contribuire

Grazie dell'interesse. Acta Diurna è un prototipo (0.x) mantenuto da una sola
persona: le issue sono benvenute, le pull request vanno concordate prima in
una issue.

## Preparare l'ambiente

```bash
npm install
npm run dev        # http://localhost:5173
```

Serve una chiave API di Gemini o di Claude, da inserire dall'interfaccia.

## Prima di aprire una pull request

```bash
npm run typecheck
npm test
npm run build
```

La CI esegue gli stessi comandi.

## Regole del progetto

- **Nessuna risorsa remota nel frontend**: niente CDN né font esterni, tutto
  vendorizzato in `public/`. L'unica eccezione sono i tile della mappa.
- **Non cambiare** il nome del database in `src/db.ts` né la chiave di
  `localStorage` in `src/store/caseStore.ts`: renderebbe irraggiungibili gli
  archivi già raccolti.
- **Nessun segreto nel repository.** `.env` è escluso dal versionamento.
- Messaggi di commit in stile [Conventional Commits](https://www.conventionalcommits.org/)
  (`feat:`, `fix:`, `docs:`...), in italiano.
- Ogni cambiamento visibile all'utente va annotato in
  [`public/docs/versions.md`](public/docs/versions.md).

## Contenuti

L'applicazione elabora solo notizie già pubblicate. Non proporre funzioni che
accedano a fonti non pubbliche o che profilino persone oltre quanto riportato
dalla stampa.
