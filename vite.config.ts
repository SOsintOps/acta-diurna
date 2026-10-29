import path from 'path';
import { createRequire } from 'module';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { claudeFederation } from './server/claudeFederation';
import { iudexPonte } from './server/iudex';

// Unica fonte di verita' per la versione: package.json.
const { version } = createRequire(import.meta.url)('./package.json');

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    // La federazione d'identita' di Claude vive sul server di Vite (dev e
    // preview): vedi server/claudeFederation.ts.
    // Ponte con Iudex per la ricerca di persone e societa' nelle sentenze: vedi
    // server/iudex.ts. Il browser non puo' chiamare Iudex direttamente.
    plugins: [react(), claudeFederation(env), iudexPonte(env)],
    define: {
      // Chiave a build-time FACOLTATIVA: quando c'e' fa da override e vince su
      // quella inserita dall'admin, quando manca l'applicazione parte lo stesso
      // e chiede la chiave dall'interfaccia. Vedi src/services/apiKey.ts.
      // Attenzione: se la fornisci, finisce in chiaro nel bundle.
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.ANTHROPIC_API_KEY': JSON.stringify(env.ANTHROPIC_API_KEY),
      'process.env.APP_VERSION': JSON.stringify(version),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
  };
});
