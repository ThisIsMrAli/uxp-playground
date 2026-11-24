import { describe, expect, it } from 'vitest';
import { strFromU8 } from 'fflate';
import { buildPluginZip, exportFiles, readZip, validatePluginFiles } from '../../src/core/exportZip';
import { readHash, share, SHARE_URL_WARN, decodeProject } from '../../src/core/share';
import { templateById, TEMPLATES } from '../../src/core/templates';
import { batchPlayCode, describeDescriptor } from '../../src/core/batchplay';
import { fuzzyScore } from '../../src/ui/components/CommandPalette';
import type { Project } from '../../src/core/types';

const tinyPng = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

function project(files: Record<string, string>, extra: Partial<Project> = {}): Project {
  return { v: 1, name: 'Test', target: { app: 'PS', uxp: '9.2' }, theme: 'dark', size: null, files, active: 'manifest.json', ...extra };
}
const manifest = (extra: Record<string, unknown> = {}) =>
  JSON.stringify({ manifestVersion: 5, id: 'x', name: 'X', version: '1.2.3', main: 'index.html', host: { app: 'PS', minVersion: '24.0.0' }, entrypoints: [{ type: 'panel', id: 'p', icons: [{ path: 'icons/dark.png', scale: [1, 2] }] }], ...extra });

describe('plugin zip export', () => {
  it('produces a folder UDT accepts: binaries decoded, dev files dropped, CSS/image imports turned into modules', () => {
    const p = project({
      'manifest.json': manifest(),
      'index.html': '<link rel="stylesheet" href="styles.css"><script src="index.jsx"></script>',
      'index.jsx': 'import "./app.css"; import logo from "./logo.png"; document.body.innerHTML = `<img src="${logo}">`;',
      'app.css': 'body { color: red }',
      'styles.css': '',
      'logo.png': tinyPng,
      'icons/dark@1x.png': tinyPng,
      'icons/dark@2x.png': tinyPng,
      'package.json': '{}',
      'webpack.config.js': 'module.exports = {}',
      'types.d.ts': 'declare const x: 1;'
    });
    const r = buildPluginZip(p, null);
    expect(r.problems).toEqual([]);
    expect(r.fileName).toBe('x-1.2.3.zip');
    const z = readZip(r.zip);
    expect(Object.keys(z)).not.toContain('package.json');
    expect(Object.keys(z)).not.toContain('webpack.config.js');
    expect(Object.keys(z)).not.toContain('types.d.ts');
    expect(z['logo.png'][0]).toBe(0x89); // real PNG bytes, not a data URL
    expect(strFromU8(z['index.html'])).toContain('src="index.js"');
    const js = strFromU8(z['index.js']);
    expect(js).toMatch(/require\(['"]\.\/app\.css\.js['"]\)/);
    expect(js).toMatch(/require\(['"]\.\/logo\.png\.js['"]\)/);
    expect(strFromU8(z['app.css.js'])).toContain('body { color: red }');
  });

  it('keeps files with syntax errors (unchanged, with a warning) instead of silently dropping them', () => {
    const { files, warnings } = exportFiles(project({ 'manifest.json': manifest(), 'index.html': '<script src="a.jsx"></script>', 'a.jsx': 'const x = <div>;' }), null);
    expect(files['a.js']).toBe('const x = <div>;');
    expect(warnings[0]).toMatch(/a\.jsx has a syntax error/);
  });

  it('reports what UDT would reject', () => {
    const problems = validatePluginFiles({ 'manifest.json': manifest({ main: 'panel.html' }) });
    expect(problems).toContain('"main" file is missing: panel.html');
    expect(problems).toContain('icon is missing: icons/dark.png');
    expect(validatePluginFiles({ 'index.html': '' })).toEqual(['manifest.json is not at the root of the plugin folder']);
    // Adobe's invisible-plugin-sample has no entrypoints: that is valid.
    expect(validatePluginFiles({ 'manifest.json': JSON.stringify({ id: 'a', name: 'a', version: '1.0.0', host: [{ app: 'PS', minVersion: '23.0.0' }], main: 'index.js' }), 'index.js': '' })).toEqual([]);
  });

  it('exports every built-in template without problems', () => {
    for (const t of TEMPLATES) expect(buildPluginZip(t.build(), 'vendor').problems, t.id).toEqual([]);
  });
});

describe('share links', () => {
  it('reports length status and leaves large binaries out', () => {
    const base = 'https://example.test/play/';
    const small = share(base, templateById('hello').build());
    expect(small.status).toBe('ok');
    expect(small.length).toBeLessThan(SHARE_URL_WARN);
    const big = 'data:image/png;base64,' + 'A'.repeat(20000);
    const r = share(base, project({ 'manifest.json': manifest(), 'index.html': 'x', 'big.png': big, 'small.png': tinyPng }));
    expect(r.omitted).toEqual(['big.png']);
    const back = decodeProject(r.url.split('#s=')[1])!;
    expect(back.files['small.png']).toBe(tinyPng);
    expect(back.files['big.png']).toBeUndefined();
    const embed = share(base, templateById('hello').build(), { embed: '1', view: 'preview' });
    expect(new URL(embed.url).searchParams.get('embed')).toBe('1');
  });

  it('reads every hash route', () => {
    expect(readHash('#github=AdobeDocs%2Fuxp-photoshop-plugin-samples')).toEqual({ kind: 'github', spec: 'AdobeDocs/uxp-photoshop-plugin-samples' });
    expect(readHash('#example=hello-world-panel')).toEqual({ kind: 'example', id: 'hello-world-panel' });
    expect(readHash('#template=react')).toEqual({ kind: 'template', id: 'react' });
    expect(readHash('#gist=abc123')).toEqual({ kind: 'gist', id: 'abc123' });
    expect(readHash('#s=garbage')).toEqual({ kind: 'state', project: null });
    expect(readHash('#nothing')).toBeNull();
  });
});

describe('batchPlay inspector helpers', () => {
  it('describes descriptors in plain language', () => {
    expect(describeDescriptor({ _obj: 'set', _target: [{ _ref: 'layer', _enum: 'ordinal', _value: 'targetEnum' }], to: { _obj: 'layer', name: 'X' } })).toBe('set → the selected/active layer · set name');
    expect(describeDescriptor({ _obj: 'get', _target: [{ _property: 'title' }, { _ref: 'document', _id: 3 }] })).toBe('get → document id 3 · property "title"');
  });

  it('generates code that UXP can load: no top-level await, modal scope only when needed', () => {
    const set = batchPlayCode([{ _obj: 'set' }], {}, 'Rename');
    const get = batchPlayCode([{ _obj: 'get' }]);
    for (const code of [set, get]) expect(() => new Function('require', code)).not.toThrow();
    expect(set).toContain('core.executeAsModal');
    expect(set).toContain('"Rename"');
    expect(get).not.toContain('executeAsModal');
  });
});

describe('command palette', () => {
  it('ranks word starts and contiguous matches first', () => {
    const items = ['Download plugin .zip', 'Show console', 'Panel theme: darkest', 'Toggle file sidebar'];
    const ranked = items.map((t) => [t, fuzzyScore('dz', t)] as const).filter(([, s]) => s > 0).sort((a, b) => b[1] - a[1]);
    expect(ranked[0][0]).toBe('Download plugin .zip');
    expect(fuzzyScore('xyz', 'Show console')).toBe(0);
    expect(fuzzyScore('con', 'Show console')).toBeGreaterThan(fuzzyScore('con', 'Panel theme: darkest'));
  });
});
