import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'MindWarp',
      formats: ['es', 'umd'],
      fileName: (format) => `mindwarp.${format}.js`,
    },
    outDir: 'dist',
    rollupOptions: {
      external: ['@huggingface/transformers'],
    },
  },
  worker: {
    format: 'es',
  },
});
