import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { unzipSync, strFromU8 } from 'fflate';
import { TEMPLATES, templateById } from '../../src/core/templates';
import { decodeProject, encodeProject, readHash, sanitizeProject, shareUrl } from '../../src/core/share';
import { compileModule, needsCompile, rewriteRequires } from '../../src/core/compile';
import { checkCss, checkManifest, panelSize, parseManifest } from '../../src/core/manifest';
import { buildPluginZip } from '../../src/core/exportZip';
import { buildPreview } from '../../src/core/buildPreview';
import { cmpVersion, ecmaVersionFor, uxpForPhotoshop } from '../../src/core/versions';
import { loadGist } from '../../src/core/gist';
import { readFileSync } from 'node:fs';

const vendor = readFileSync(resolve('src/generated/react-bundle.js'), 'utf8');
const assets = {
  runtime: readFileSync(resolve('src/runtime/runtime.js'), 'utf8'),
  panelCss: readFileSync(resolve('src/runtime/panel.css'), 'utf8'),
  shimCss: readFileSync(resolve('src/runtime/shim.css'), 'utf8'),
  vendor
};

describe('share links', () => {
  it('round-trips every template through the URL hash', () => {
    for (const t of TEMPLATES) {
      const p = t.build();
      const url = shareUrl('https://example.test/play/', p);
      const h = readHash(new URL(url).hash);
      expect(h?.kind).toBe('state');
      expect((h as any).project).toEqual(p);
      expect(url.length).toBeLessThan(8000);
    }
  });
  it('rejects garbage and unsafe file names', () => {
    expect(decodeProject('not-valid')).toBeNull();
    const p = sanitizeProject({ files: { '../evil.js': 'x', '/abs.js': 'y', 'ok.js': 'z', 'bad|name.js': 'w', 'a\\b.js': 'v', 'my icons/dark mode.png': 'data:image/png;base64,AA==' } });
    // Spaces are allowed (real plugins ship files like "my icons/dark mode.png"); traversal and reserved characters are not.
    expect(Object.keys(p!.files)).toEqual(['ok.js', 'my icons/dark mode.png']);
    expect(sanitizeProject({ files: {} })).toBeNull();
    const enc = encodeProject({ ...templateById('hello').build(), theme: 'neon' as any });
    expect(decodeProject(enc)!.theme).toBe('dark');
  });
  it('parses gist hashes', () => {
    expect(readHash('#gist=abc123def')).toEqual({ kind: 'gist', id: 'abc123def' });
    expect(readHash('#other')).toBeNull();
  });
});

describe('compile', () => {
  it('compiles JSX and ES modules to CommonJS', () => {
    const c = compileModule('a.jsx', 'import React from "react"; export const A = () => <div>hi</div>;');
    expect(c.error).toBeUndefined();
    expect(c.code).toContain('require("react/jsx-runtime")');
    expect(c.code).not.toContain('<div>');
  });
  it('leaves plain CommonJS untouched', () => {
    const src = 'const { app } = require("photoshop");\nif (a < b) app.showAlert("x");';
    expect(needsCompile('index.js', src)).toBe(false);
    expect(compileModule('index.js', src).code).toBe(src);
  });
  it('reports syntax errors with a location', () => {
    const c = compileModule('bad.jsx', 'const x = <div>;\n');
    expect(c.error).toBeTruthy();
    expect(c.errorLine).toBeGreaterThanOrEqual(1);
  });
  it('rewrites React and source-extension requires for export', () => {
    const out = rewriteRequires('index.jsx', `var a = require('react'); var b = require("react-dom/client"); var c = require('./List.jsx'); var d = require('photoshop');`);
    expect(out).toContain(`require('./vendor/react.js')`);
    expect(out).toContain(`require("./vendor/react-dom-client.js")`);
    expect(out).toContain(`require('./List.js')`);
    expect(out).toContain(`require('photoshop')`);
    expect(rewriteRequires('src/x.js', `require('react')`)).toBe(`require('../vendor/react.js')`);
  });
});

describe('manifest checks', () => {
  it('templates have no manifest errors', () => {
    for (const t of TEMPLATES) {
      const p = t.build();
      const errs = checkManifest(p.files['manifest.json'], p.files, p.target).filter((d) => d.severity === 'error');
      expect(errs, t.id).toEqual([]);
    }
  });
  it('flags invalid JSON with a position', () => {
    const d = checkManifest('{\n  "id": "x",\n  oops\n}', {}, { app: 'PS', uxp: '9.2' });
    expect(d[0].ruleId).toBe('manifest/json');
    expect(d[0].line).toBe(3);
  });
  it('reports non-object JSON as a manifest error', () => {
    for (const source of ['null', '[]', '"plugin"']) {
      expect(parseManifest(source)).toMatchObject({ ok: false, value: {}, error: 'manifest.json must contain a JSON object' });
    }
  });
  it('flags missing fields, bad permission values and missing main', () => {
    const m = JSON.stringify({ manifestVersion: 5, id: 'x', name: 'n', version: '1.0.0', main: 'nope.html', host: { app: 'PS', minVersion: '24.4.0' }, entrypoints: [{ type: 'panel', id: 'p' }, { type: 'panel', id: 'p' }], requiredPermissions: { localFileSystem: 'yes', enableUserInfo: true } }, null, 2);
    const ids = checkManifest(m, {}, { app: 'PS', uxp: '9.2' }).map((d) => d.ruleId);
    expect(ids).toContain('manifest/main-missing');
    expect(ids).toContain('manifest/entrypoint-dup');
    expect(ids).toContain('manifest/fs-value');
    expect(ids).toContain('manifest/user-info-version');
    expect(ids).toContain('manifest/min-version-gap');
  });
  it('warns on CSS grid', () => {
    expect(checkCss('a.css', '.x {\n  display: grid;\n}')[0]).toMatchObject({ line: 2, ruleId: 'css/no-grid' });
    expect(checkCss('a.css', '.x { display: flex; }')).toEqual([]);
  });
  it('reads panel size from the manifest', () => {
    const p = templateById('hello').build();
    expect(panelSize(parseManifest(p.files['manifest.json']).value)).toEqual({ width: 300, height: 420 });
  });
});

describe('versions', () => {
  it('maps Photoshop versions to UXP using the changelog table', () => {
    expect(uxpForPhotoshop('24.4.0')).toBe('7.0');
    expect(uxpForPhotoshop('26.1')).toBe('8.1');
    expect(uxpForPhotoshop('27.7')).toBe('9.3');
    expect(uxpForPhotoshop('27.11')).toBe('9.4.1');
    expect(uxpForPhotoshop('23.0')).toBeNull();
    expect(cmpVersion('26.10', '26.9')).toBe(1);
    expect(ecmaVersionFor('7.4')).toBe(2022);
    expect(ecmaVersionFor('8.0')).toBe(2024);
  });
});

describe('export zip', () => {
  it('creates a loadable plugin folder for each template', () => {
    for (const t of TEMPLATES) {
      const p = t.build();
      const r = buildPluginZip(p, vendor);
      expect(r.warnings, t.id).toEqual([]);
      const files = unzipSync(r.zip);
      const manifest = JSON.parse(strFromU8(files['manifest.json']));
      expect(manifest.manifestVersion).toBe(5);
      expect(manifest.host.app).toBe(p.target.app);
      expect(r.problems, t.id).toEqual([]);
      expect(files[manifest.main]).toBeTruthy();
      for (const [name, data] of Object.entries(files)) {
        if (!name.endsWith('.js') || name.startsWith('vendor/')) continue;
        const code = strFromU8(data);
        // No JSX or ESM syntax may remain.
        expect(() => new Function('require', 'module', 'exports', code), `${t.id}/${name}`).not.toThrow();
      }
    }
  });
  it('ships React and rewrites script tags for the React template', () => {
    const r = buildPluginZip(templateById('react').build(), vendor);
    const files = unzipSync(r.zip);
    expect(Object.keys(files)).toEqual(expect.arrayContaining(['vendor/react-bundle.js', 'vendor/react.js', 'vendor/react-dom-client.js', 'vendor/react-jsx-runtime.js', 'index.js', 'LayerList.js']));
    expect(files['index.jsx']).toBeUndefined();
    expect(strFromU8(files['index.html'])).toContain('src="index.js"');
    expect(strFromU8(files['index.js'])).toMatch(/require\(['"]\.\/vendor\/react-dom-client\.js['"]\)/);
    expect(strFromU8(files['index.js'])).toMatch(/require\(['"]\.\/LayerList\.js['"]\)/);
    expect(r.fileName).toBe('react-panel-1.0.0.zip');
  });
  it('the exported React plugin runs under a plain CommonJS loader', async () => {
    const r = buildPluginZip(templateById('react').build(), vendor);
    const files = unzipSync(r.zip);
    const cache: Record<string, any> = {};
    const req = (from: string) => (spec: string): any => {
      if (spec === 'photoshop') return { app: { activeDocument: { layers: [{ name: 'Background' }], createLayer: async () => ({}) } }, core: { executeAsModal: async (f: any) => f() } };
      const base = from.split('/').slice(0, -1);
      const parts = base.concat(spec.split('/'));
      const out: string[] = [];
      for (const s of parts) s === '..' ? out.pop() : s && s !== '.' && out.push(s);
      const path = out.join('/');
      if (cache[path]) return cache[path].exports;
      const m = { exports: {} as any };
      cache[path] = m;
      new Function('module', 'exports', 'require', strFromU8(files[path]))(m, m.exports, req(path));
      return m.exports;
    };
    document.body.innerHTML = '<div id="root"></div>';
    req('')('./index.js');
    await new Promise((res) => setTimeout(res, 50));
    expect(document.getElementById('root')!.textContent).toContain('React panel');
    expect(document.getElementById('root')!.textContent).toContain('Background');
  });
});

describe('preview build', () => {
  it('inlines styles, replaces scripts and embeds boot data', () => {
    const b = buildPreview(templateById('hello').build(), assets);
    expect(b.entryHtml).toBe('index.html');
    expect(b.html).toContain('data-pg-file="styles.css"');
    expect(b.html).toContain('__pg.run("index.js")');
    expect(b.html).not.toContain('<link');
    expect(b.needsReact).toBe(false);
    expect(b.html).toContain('data-theme="dark"');
  });
  it('includes the React vendor only when needed and escapes </script>', () => {
    const p = templateById('react').build();
    p.files['index.jsx'] += '\n// </script><script>alert(1)</script>\n';
    const b = buildPreview(p, assets);
    expect(b.needsReact).toBe(true);
    const bootLine = b.html.split('\n').find((l) => l.startsWith('<script>window.__PG_BOOT__'))!;
    expect(bootLine.match(/<\/script>/g)!.length).toBe(1);
  });
  it('reports compile errors', () => {
    const p = templateById('react').build();
    p.files['index.jsx'] = 'const x = <div>;';
    expect(buildPreview(p, assets).compileErrors[0].file).toBe('index.jsx');
  });
});

describe('gist import', () => {
  it('maps public gist files to a project', async () => {
    const fake = (async () => ({ ok: true, json: async () => ({ description: 'Demo', files: { 'manifest.json': { content: '{}' }, 'index.js': { content: 'x' } } }) })) as any;
    const p = await loadGist('abc', fake);
    expect(p.name).toBe('Demo');
    expect(Object.keys(p.files).sort()).toEqual(['index.js', 'manifest.json']);
  });
  it('prefers playground.json', async () => {
    const pj = JSON.stringify(templateById('react').build());
    const fake = (async () => ({ ok: true, json: async () => ({ files: { 'playground.json': { content: pj } } }) })) as any;
    expect((await loadGist('abc', fake)).name).toBe('React panel');
  });
});
