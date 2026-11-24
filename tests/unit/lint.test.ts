import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { lintProject } from '../../src/lint/worker';
import { provider as fallback } from '../../src/lint/fallbackProvider';
import type { UxpLintProvider } from '../../src/lint/adapter';
import { TEMPLATES, templateById } from '../../src/core/templates';

const externalBuilt = existsSync(resolve(process.env.UXP_ESLINT_DIR || '../uxp-eslint', 'dist/browser.js'));
const providers: [string, () => Promise<UxpLintProvider>][] = [['fallback', async () => fallback]];
if (externalBuilt) providers.push(['eslint-plugin-uxp-lint', async () => (await import('../../src/lint/externalProvider')).provider]);

for (const [label, load] of providers) {
  describe(`lint worker (${label})`, () => {
    const lint = async (files: Record<string, string>, uxp = '9.2') => lintProject({ id: 1, files, target: { app: 'PS', uxp } }, await load()).diagnostics;
    const modalRule = label === 'fallback' ? 'uxp/modal-scope' : 'uxp-lint/photoshop-modal-scope';
    const permRule = label === 'fallback' ? 'uxp/manifest-permissions' : 'uxp-lint/manifest-permissions';

    it('reports no errors for the templates', async () => {
      for (const t of TEMPLATES) {
        const errors = (await lint(t.build().files)).filter((d) => d.severity === 'error' && !(t.id === 'batchplay-rename' && d.ruleId === modalRule));
        expect(errors, t.id + JSON.stringify(errors)).toEqual([]);
      }
    });
    it('flags batchPlay outside executeAsModal but not read-only gets', async () => {
      const p = templateById('batchplay-rename').build();
      const d = (await lint(p.files)).filter((x) => x.ruleId === modalRule);
      expect(d.length, JSON.stringify(d)).toBeGreaterThanOrEqual(1);
      expect(d.every((x) => x.file === 'index.js')).toBe(true);
      const lines = p.files['index.js'].split('\n');
      expect(d.some((x) => lines.slice(x.line - 1, (x.endLine ?? x.line) + 3).join('\n').includes('Oops')), JSON.stringify(d)).toBe(true);
      expect(d.some((x) => p.files['index.js'].split('\n')[x.line - 1].includes('"get"'))).toBe(false);
    });
    it('flags missing manifest permissions', async () => {
      const p = templateById('file-picker').build();
      const m = JSON.parse(p.files['manifest.json']);
      m.requiredPermissions = {};
      p.files['manifest.json'] = JSON.stringify(m, null, 2);
      p.files['index.js'] += '\nfetch("https://api.example.com/v1");\nrequire("uxp").shell.openExternal("https://adobe.com");\n';
      const d = (await lint(p.files)).filter((x) => x.ruleId === permRule);
      const lines = d.map((x) => p.files['index.js'].split('\n')[x.line - 1]);
      expect(lines.some((l) => l.includes('getFileForOpening')), JSON.stringify(d)).toBe(true);
      expect(lines.some((l) => l.includes('api.example.com'))).toBe(true);
      expect(lines.some((l) => l.includes('openExternal'))).toBe(true);
    });
    it('runs core ESLint rules and parses JSX', async () => {
      const d = await lint({ ...templateById('react').build().files, 'extra.jsx': 'export const A = () => <div>{undefinedThing}</div>;' });
      expect(d.some((x) => x.file === 'extra.jsx' && x.ruleId === 'no-undef')).toBe(true);
    });
    it('uses the ECMAScript level of the selected UXP version', async () => {
      const files = { ...templateById('hello').build().files, 'x.js': 'const re = /a/v; console.log(re);' };
      expect((await lint(files, '7.4')).some((x) => x.file === 'x.js' && x.ruleId === 'parse-error')).toBe(true);
      expect((await lint(files, '9.2')).some((x) => x.file === 'x.js' && x.ruleId === 'parse-error')).toBe(false);
    });
    it('checks CSS for unsupported grid layout', async () => {
      const files = { ...templateById('hello').build().files, 'styles.css': '.a {\n  display: grid;\n}' };
      const d = (await lint(files)).filter((x) => x.file === 'styles.css');
      expect(d.length, JSON.stringify(d)).toBeGreaterThanOrEqual(1);
      expect(d[0].line).toBe(2);
    });
    it('keeps the playground manifest checks', async () => {
      const files = { ...templateById('hello').build().files, 'manifest.json': '{ "id": ' };
      expect((await lint(files)).some((x) => x.ruleId === 'manifest/json')).toBe(true);
    });
  });
}
