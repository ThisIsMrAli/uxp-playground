import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Lint provider selection (build time):
 *  - The pinned browser bundle is used in local and deployment builds.
 *  - UXP_ESLINT_DIR can point at another built checkout for development.
 * Set UXP_LINT_PROVIDER=fallback to force the built-in rules.
 */
const eslintDir = process.env.UXP_ESLINT_DIR && resolve(process.env.UXP_ESLINT_DIR);
const externalEntry = eslintDir
  ? ['dist/uxp-lint.browser.mjs', 'dist/browser.js'].map((f) => resolve(eslintDir, f)).find((f) => existsSync(f))
  : resolve(import.meta.dirname, 'vendor/uxp-lint/uxp-lint.browser.mjs');
const hasExternal = process.env.UXP_LINT_PROVIDER !== 'fallback' && !!externalEntry;
const providerFile = hasExternal ? resolve(import.meta.dirname, 'src/lint/externalProvider.ts') : resolve(import.meta.dirname, 'src/lint/fallbackProvider.ts');

export default defineConfig({
  base: './',
  plugins: [react()],
  resolve: {
    alias: {
      '@pg/uxp-lint-provider': providerFile,
      '@pg/monaco': resolve(import.meta.dirname, 'src/generated/monaco-entry.js'),
      // Tests can exercise both providers even when the app is forced to use
      // the fallback; resolve the external provider whenever it is available.
      ...(externalEntry ? { 'eslint-plugin-uxp-lint/browser': externalEntry } : {})
    }
  },
  define: { __UXP_LINT_EXTERNAL__: JSON.stringify(hasExternal) },
  worker: { format: 'es' },
  build: { target: 'es2022', chunkSizeWarningLimit: 6000, sourcemap: false },
  server: { port: 5310, strictPort: false },
  preview: { port: 4310 },
  test: {
    environment: 'jsdom',
    include: ['tests/unit/**/*.test.ts']
  }
} as any);
