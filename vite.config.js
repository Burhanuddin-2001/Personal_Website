import { defineConfig } from 'vite';

// Relative base so the built site works from any static host or sub-path.
export default defineConfig({
  base: './',
  server: {
    open: true,
  },
  build: {
    outDir: 'dist',
    target: 'es2020',
    sourcemap: true,
  },
});
