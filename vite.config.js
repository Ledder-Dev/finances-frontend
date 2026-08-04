import { defineConfig } from 'vite';

export default defineConfig({
  base: '/finances-frontend/',
  server: { host: true },
  test: {
    environment: 'jsdom',
  },
});
