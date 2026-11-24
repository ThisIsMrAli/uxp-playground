import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Lint provider selection (build time):
 *  - UXP_ESLINT_DIR (or ../uxp-eslint) with dist/uxp-lint.browser.mjs (or dist/browser.js) -> src/lint/externalProvider.ts (eslint-plugin-uxp-lint)
 *  - otherwise                                               -> src/lint/fallbackProvider.ts
 * Set UXP_LINT_PROVIDER=fallback to force the built-in rules.
 */
const eslintDir = resolve(process.env.UXP_ESLINT_DIR || resolve(import.meta.dirname, '../uxp-eslint'));
// Prefer the self-contained browser bundle (dist/uxp-lint.browser.mjs); dist/browser.js re-exports the Node build.
const externalEntry = ['dist/uxp-lint.browser.mjs', 'dist/browser.js'].map((f) => resolve(eslintDir, f)).find((f) => existsSync(f));
const hasExternal = process.env.UXP_LINT_PROVIDER !== 'fallback' && !!externalEntry;
const providerFile = hasExternal ? resolve(import.meta.dirname, 'src/lint/externalProvider.ts') : resolve(import.meta.dirname, 'src/lint/fallbackProvider.ts');

export default defineConfig({
  base: './',
  plugins: [react()],
  resolve: {
    alias: {
      '@pg/uxp-lint-provider': providerFile,
      '@pg/monaco': resolve(import.meta.dirname, 'src/generated/monaco-entry.js'),
      ...(hasExternal ? { 'eslint-plugin-uxp-lint/browser': externalEntry } : {})
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
