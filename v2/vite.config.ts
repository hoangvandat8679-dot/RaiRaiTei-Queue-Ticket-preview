import { defineConfig } from 'vite';

export default defineConfig({
  base: '/RaiRaiTei-Queue-Ticket-preview/',
  build: {
    outDir: 'dist',
    sourcemap: false,
    target: 'es2020',
    emptyOutDir: true,
  },
  server: {
    host: '0.0.0.0',
    hmr: false,
    port: Number(process.env.PORT) || 3000,
  },
  preview: {
    host: '0.0.0.0',
    port: Number(process.env.PORT) || 4173,
  },
});
