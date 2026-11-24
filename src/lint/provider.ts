/**
 * Selects the lint provider. Vite aliases `@pg/uxp-lint-provider` to either the external plugin bridge
 * (when ../uxp-eslint/dist/browser.js exists at build time) or the built-in fallback. See vite.config.ts.
 */
export { provider } from '@pg/uxp-lint-provider';
