import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * RITMO Padel — Vite Config
 *
 * GitHub Pages serves project sites at https://<user>.github.io/<repo>/.
 * Therefore we need a base of "/<repo>/" for built assets to resolve.
 *
 * The GitHub Actions workflow sets BASE_PATH automatically (= "/repo-name/").
 * For local development & preview, the default "/" is used.
 */
export default defineConfig({
  plugins: [react()],
  base: process.env.BASE_PATH || '/',
  build: {
    outDir: 'dist',
    sourcemap: false,
    target: 'es2020',
  },
});
