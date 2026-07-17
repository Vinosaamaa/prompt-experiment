import { defineConfig } from 'vite';

export default defineConfig({
  // Deployed under /bridge-horror-house/ on the lab site
  base: '/bridge-horror-house/',
  server: {
    host: true,
    port: 5180,
  },
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 2000,
  },
});
