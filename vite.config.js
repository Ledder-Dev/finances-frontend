import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { host: true },
  build: {
    rollupOptions: {
      // react-app.html: entrada WIP de la migración React (ADR 005) — se
      // retira en task 034 (cutover), cuando reemplaza a index.html.
      input: {
        main: resolve(__dirname, 'index.html'),
        react: resolve(__dirname, 'react-app.html'),
      },
    },
  },
  test: {
    environment: 'jsdom',
  },
});
