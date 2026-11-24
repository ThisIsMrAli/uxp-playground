/// <reference lib="webworker" />
import { Linter } from 'eslint-linter-browserify';
import globals from 'globals';
import { checkCss, checkManifest, parseManifest, type Diagnostic } from '../core/manifest';
import { ecmaVersionFor } from '../core/versions';
import { severityFromEslint, type LintRequest, type LintResponse } from './adapter';
import { provider as defaultProvider } from './provider';
import type { UxpLintProvider } from './adapter';

const linter = new Linter({ configType: 'flat' });

const BASE_RULES: Record<string, 'warn' | 'error' | 'off'> = {
  'no-undef': 'error',
  'no-unused-vars': 'warn',
  'no-unreachable': 'warn',
  'no-dupe-keys': 'error',
  'no-dupe-args': 'error',
  'no-const-assign': 'error',
  'no-redeclare': 'error',
  'no-self-assign': 'warn',
  'no-unsafe-finally': 'warn',
  'no-cond-assign': 'warn',
  'no-empty': 'warn',
  'no-func-assign': 'error',
  'use-isnan': 'error',
  'valid-typeof': 'error'
};

/** Rule ids from the playground's own manifest checks that the external plugin does not cover. */
const PLAYGROUND_ONLY = new Set(['manifest/json', 'manifest/main-missing', 'manifest/host-mismatch', 'manifest/min-version-gap']);

function kindOf(file: string): 'js' | 'css' | 'html' | 'manifest' | null {
  if (file === 'manifest.json') return 'manifest';
  if (/\.(js|jsx|mjs|cjs)$/i.test(file)) return 'js';
  if (/\.css$/i.test(file)) return 'css';
  if (/\.html?$/i.test(file)) return 'html';
  return null;
}

export function lintProject(req: LintRequest, provider: UxpLintProvider = defaultProvider): LintResponse {
  const t0 = performance.now();
  const diagnostics: Diagnostic[] = [];
  const manifestText = req.files['manifest.json'];
  const parsed = parseManifest(manifestText);
  const ctx = { files: req.files, target: req.target, manifest: parsed.value, manifestText };
  const covers = new Set(provider.covers);

  // Playground checks for whatever the provider does not cover.
  const own = checkManifest(manifestText, req.files, req.target);
  diagnostics.push(...(covers.has('manifest') ? own.filter((d) => PLAYGROUND_ONLY.has(d.ruleId)) : own));
  if (!covers.has('css')) for (const [file, text] of Object.entries(req.files)) if (kindOf(file) === 'css') diagnostics.push(...checkCss(file, text));

  let providerConfig: any[] = [];
  try {
    providerConfig = provider.buildConfig(ctx);
  } catch (e: any) {
    diagnostics.push({ file: 'manifest.json', line: 1, column: 1, severity: 'error', ruleId: 'lint-config', message: 'Lint provider failed to build its config: ' + (e?.message || e), source: 'eslint' });
  }

  for (const [file, code] of Object.entries(req.files)) {
    const kind = kindOf(file);
    if (!kind || (kind !== 'js' && !covers.has(kind))) continue;
    if (kind === 'manifest' && !parsed.ok) continue; // JSON syntax error already reported
    const isModule = /(^|\n)\s*(import|export)\s/.test(code);
    const config: any[] = [
      ...providerConfig,
      {
        files: ['**/*.{js,jsx,mjs,cjs}'],
        languageOptions: {
          ecmaVersion: ecmaVersionFor(req.target.uxp),
          sourceType: isModule ? 'module' : 'commonjs',
          parserOptions: { ecmaFeatures: { jsx: true } },
          globals: { ...globals.browser, require: 'readonly', module: 'writable', exports: 'writable', __dirname: 'readonly', __filename: 'readonly' }
        },
        rules: { ...BASE_RULES, ...(/\.jsx$/i.test(file) || /<\w/.test(code) ? { 'no-unused-vars': 'off' } : {}) }
      }
    ];
    try {
      const messages = linter.verify(code, config, { filename: file });
      for (const m of messages) {
        diagnostics.push({
          file,
          line: m.line || 1,
          column: m.column || 1,
          endLine: m.endLine,
          endColumn: m.endColumn,
          severity: severityFromEslint(m.severity),
          ruleId: m.ruleId || (m.fatal ? 'parse-error' : 'eslint'),
          message: m.message,
          source: kind === 'css' ? 'css' : kind === 'manifest' ? 'manifest' : 'eslint'
        });
      }
    } catch (e: any) {
      diagnostics.push({ file, line: 1, column: 1, severity: 'error', ruleId: 'lint-crash', message: 'Linter failed: ' + (e?.message || e), source: 'eslint' });
    }
  }
  return {
    id: req.id,
    diagnostics,
    engine: { name: 'ESLint', version: (Linter as any).version || 'unknown', plugin: provider.name, pluginVersion: provider.version, fallback: provider.fallback, covers: provider.covers },
    ms: Math.round(performance.now() - t0)
  };
}

if (typeof self !== 'undefined' && typeof (self as any).postMessage === 'function' && typeof window === 'undefined') {
  self.addEventListener('message', (e: MessageEvent<LintRequest>) => {
    (self as any).postMessage(lintProject(e.data));
  });
}
