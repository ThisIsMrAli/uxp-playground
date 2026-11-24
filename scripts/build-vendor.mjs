// Builds src/generated/react-bundle.js: React + ReactDOM (production) as one CommonJS file.
// The same file runs in the preview iframe and is shipped in exported plugins (vendor/react-bundle.js).
import { build } from 'vite';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = resolve(root, 'src/generated');
mkdirSync(outDir, { recursive: true });
await build({
  configFile: false,
  logLevel: 'warn',
  define: { 'process.env.NODE_ENV': '"production"' },
  build: {
    outDir,
    emptyOutDir: false,
    minify: true,
    lib: { entry: resolve(root, 'scripts/vendor-entry.cjs'), formats: ['cjs'], fileName: () => 'react-bundle.js' },
    rollupOptions: { external: [] }
  }
});
const pkg = JSON.parse(readFileSync(resolve(root, 'node_modules/react/package.json'), 'utf8'));
const code = readFileSync(resolve(outDir, 'react-bundle.js'), 'utf8');
writeFileSync(resolve(outDir, 'react-bundle.js'), `/*! React ${pkg.version} and ReactDOM (MIT License, Copyright (c) Meta Platforms, Inc. and affiliates.) */\n` + code);
console.log('vendor: react-bundle.js', (code.length / 1024).toFixed(1), 'KiB, React', pkg.version);
