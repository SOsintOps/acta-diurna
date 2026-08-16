import path from 'path';
import { createRequire } from 'module';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// Unica fonte di verita' per la versione: package.json.
const { version } = createRequire(import.meta.url)('./package.json');

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react()],
    define: {
      // Chiave a build-time FACOLTATIVA: quando c'e' fa da override e vince su
      // quella inserita dall'admin, quando manca l'applicazione parte lo stesso
      // e chiede la chiave dall'interfaccia. Vedi src/services/apiKey.ts.
      // Attenzione: se la fornisci, finisce in chiaro nel bundle.
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.APP_VERSION': JSON.stringify(version),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
  };
});
