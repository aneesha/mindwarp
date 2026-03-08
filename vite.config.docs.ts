import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: './',
  base: '/mindwarp/',
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  build: {
    outDir: 'docs',
    emptyOutDir: true,
  },
  worker: {
    format: 'es',
  },
});
