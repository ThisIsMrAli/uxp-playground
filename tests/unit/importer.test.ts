import { describe, expect, it } from 'vitest';
import { importTree, ImportError, manifestRoots, STUB_MARKER, stripCommonFolder } from '../../src/core/importer';
import { importGithub, parseGithubSpec, specToString } from '../../src/core/github';
import { loadGist } from '../../src/core/gist';

const manifest = (extra: Record<string, unknown> = {}) =>
  JSON.stringify({ manifestVersion: 5, id: 'x.y', name: 'X', version: '1.0.0', main: 'index.html', host: { app: 'PS', minVersion: '24.0.0' }, entrypoints: [{ type: 'panel', id: 'p' }], ...extra });
const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);

describe('importTree', () => {
  it('strips the common top folder (GitHub "Download ZIP" layout) and skips node_modules and lock files', () => {
    const r = importTree({
      'repo-main/manifest.json': manifest(),
      'repo-main/index.html': '<script src="index.js"></script>',
      'repo-main/index.js': 'console.log(1)',
      'repo-main/node_modules/lodash/index.js': 'x',
      'repo-main/yarn.lock': 'x',
      'repo-main/icons/dark@1x.png': png
    });
    expect(Object.keys(r.project.files).sort()).toEqual(['icons/dark@1x.png', 'index.html', 'index.js', 'manifest.json']);
    expect(r.project.files['icons/dark@1x.png']).toMatch(/^data:image\/png;base64,/);
    expect(r.project.active).toBe('index.js');
  });

  it('asks which plugin to open when a repository has several, and imports the chosen one', () => {
    const raw = { 'a/manifest.json': manifest(), 'a/index.html': 'A', 'b/manifest.json': manifest({ id: 'b' }), 'b/index.html': 'B', 'README.md': '#' };
    let err: any;
    try {
      importTree(raw);
    } catch (e) {
      err = e;
    }
    expect(err).toBeInstanceOf(ImportError);
    expect(err.candidates).toEqual(['a/', 'b/']);
    expect(importTree(raw, { root: 'b' }).project.files['index.html']).toBe('B');
  });

  it('prefers source over dist/ build output and ignores manifests that are not UXP manifests', () => {
    const roots = manifestRoots(['dist/manifest.json', 'plugin/manifest.json', 'web/manifest.json'], (p) => (p.startsWith('web') ? '{"name":"pwa","icons":[]}' : manifest()));
    expect(roots).toEqual(['plugin/', 'dist/']);
    expect(stripCommonFolder(['x/a', 'x/b/c'])).toBe('x/');
  });

  it('runs bundler projects from source with a marked entry stub (Adobe ui-react-starter layout)', () => {
    const r = importTree({
      'plugin/manifest.json': manifest(),
      'plugin/index.html': '<html><head><script src="index.js"></script></head><body></body></html>',
      'src/index.jsx': 'import React from "react";',
      'src/panels/Demo.jsx': 'export const Demo = () => null;',
      'firebase.js': 'export const db = 1;',
      'webpack.config.js': 'module.exports = { entry: "./src/index.jsx" }',
      'package.json': '{"devDependencies":{"webpack":"5"}}'
    });
    const f = r.project.files;
    expect(f['index.js'].startsWith(STUB_MARKER)).toBe(true);
    expect(f['index.js']).toContain('require("./src/index.jsx")');
    expect(f['src/panels/Demo.jsx']).toBeDefined();
    expect(f['firebase.js']).toBeDefined(); // loose files next to the plugin folder (import "../../firebase")
    expect(r.report.entryStub).toEqual({ file: 'index.js', entry: 'src/index.jsx' });
    expect(r.project.active).toBe('src/index.jsx');
  });

  it('generates the panel HTML from src/index.html when the build writes it (HtmlWebpackPlugin layout)', () => {
    const r = importTree({
      'manifest.json': manifest({ main: 'dist/index.html' }),
      'src/index.html': '<html><body><div id="app"></div><script src="bundle.js"></script></body></html>',
      'src/index.js': 'document.getElementById("app").textContent = "hi"'
    });
    expect(r.project.files['dist/index.html']).toContain('<script src="../src/index.js"></script>');
    expect(r.project.files['dist/index.html']).not.toContain('bundle.js');
  });

  it('resolves script references relative to a nested panel before creating stubs', () => {
    const source = 'console.log("real panel")';
    const existing = importTree({
      'manifest.json': manifest({ main: 'panel/index.html' }),
      'panel/index.html': '<script src="./index.js?v=1"></script>',
      'panel/index.js': source,
      'src/index.js': 'console.log("source entry")'
    });
    expect(existing.report.entryStub).toBeUndefined();
    expect(existing.project.files['panel/index.js']).toBe(source);
    expect(existing.project.files['index.js']).toBeUndefined();

    const missing = importTree({
      'manifest.json': manifest({ main: 'panel/index.html' }),
      'panel/index.html': '<script src="./index.js"></script>',
      'src/index.js': 'console.log("source entry")'
    });
    expect(missing.report.entryStub).toEqual({ file: 'panel/index.js', entry: 'src/index.js' });
    expect(missing.project.files['panel/index.js']).toContain('require("../src/index.js")');
  });

  it('reports a clear error when there is no UXP manifest', () => {
    expect(() => importTree({ 'index.js': 'x' })).toThrow(/No UXP manifest\.json/);
  });

  it('enforces the binary size limit', () => {
    const big = new Uint8Array(4 * 1024 * 1024);
    const r = importTree({ 'manifest.json': manifest(), 'index.html': 'x', 'huge.psd': big });
    expect(r.project.files['huge.psd']).toBeUndefined();
    expect(r.report.skipped[0].reason).toMatch(/binary file over/);
  });

  it('reports oversized source files instead of silently truncating them', () => {
    const r = importTree({ 'manifest.json': manifest(), 'index.html': 'x', 'large.js': 'a'.repeat(6_000_001) });
    expect(r.project.files['large.js']).toBeUndefined();
    expect(r.report.skipped).toContainEqual({ path: 'large.js', reason: expect.stringContaining('character limit') });
  });
});

describe('GitHub import', () => {
  it('parses every supported form', () => {
    expect(parseGithubSpec('AdobeDocs/uxp-photoshop-plugin-samples')).toEqual({ owner: 'AdobeDocs', repo: 'uxp-photoshop-plugin-samples', path: undefined });
    expect(parseGithubSpec('a/b/sub/dir')).toEqual({ owner: 'a', repo: 'b', path: 'sub/dir' });
    expect(parseGithubSpec('a/b@dev:plugin')).toEqual({ owner: 'a', repo: 'b', ref: 'dev', path: 'plugin' });
    expect(parseGithubSpec('https://github.com/a/b/tree/main/x%20y/manifest.json')).toEqual({ owner: 'a', repo: 'b', ref: 'main', path: 'x y' });
    expect(parseGithubSpec('https://github.com/a/b.git')).toEqual({ owner: 'a', repo: 'b', ref: undefined, path: undefined });
    expect(parseGithubSpec('not a repo')).toBeNull();
    expect(specToString({ owner: 'a', repo: 'b', ref: 'main', path: 'p' })).toBe('a/b@main:p');
  });

  const files: Record<string, string> = {
    'samples/one/manifest.json': manifest(),
    'samples/one/index.html': '<script src="index.js"></script>',
    'samples/one/index.js': 'console.log("one")',
    'samples/two/manifest.json': manifest({ id: 'two' }),
    'samples/two/index.html': 'two'
  };
  const fake = (status = 200) => {
    const calls: string[] = [];
    const impl = (async (url: string) => {
      calls.push(url);
      const json = (v: any) => ({ ok: status === 200, status, headers: new Headers(), json: async () => v, text: async () => JSON.stringify(v) });
      if (url.endsWith('/repos/o/r')) return json({ default_branch: 'main' });
      if (url.includes('/git/trees/')) return json({ tree: Object.keys(files).map((p) => ({ path: p, type: 'blob', size: files[p].length })) });
      const m = /raw\.githubusercontent\.com\/o\/r\/main\/(.+)$/.exec(url);
      if (m) {
        const text = files[decodeURIComponent(m[1])];
        return { ok: text != null, status: text != null ? 200 : 404, text: async () => text, arrayBuffer: async () => new TextEncoder().encode(text).buffer };
      }
      return { ok: false, status: 404, headers: new Headers() };
    }) as unknown as typeof fetch;
    return { impl, calls };
  };

  it('lists the tree once, asks for a plugin in monorepos, then downloads only that plugin', async () => {
    const { impl, calls } = fake();
    await expect(importGithub('o/r', { fetchImpl: impl })).rejects.toMatchObject({ candidates: ['samples/one/', 'samples/two/'] });
    const before = calls.length;
    const r = await importGithub('o/r', { fetchImpl: impl, root: 'samples/one/' });
    const downloads = calls.slice(before).filter((u) => u.includes('raw.githubusercontent'));
    expect(downloads).toHaveLength(3);
    expect(Object.keys(r.project.files).sort()).toEqual(['index.html', 'index.js', 'manifest.json']);
    expect(r.spec.ref).toBe('main');
  });

  it('explains rate limits and missing repositories', async () => {
    await expect(importGithub('o/r', { fetchImpl: fake(403).impl })).rejects.toThrow(/rate limit/);
    await expect(importGithub('o/missing', { fetchImpl: fake().impl })).rejects.toThrow(/not found/);
  });
});

describe('gist import', () => {
  const gist = (filesObj: Record<string, any>, status = 200) =>
    (async (url: string) => {
      if (url.includes('/gists/')) return { ok: status === 200, status, json: async () => ({ description: 'My gist', files: filesObj }) };
      return { ok: true, status: 200, text: async () => 'FULL CONTENT' };
    }) as unknown as typeof fetch;

  it('maps "__" to folders and fetches truncated files from raw_url', async () => {
    const p = await loadGist('abc', gist({ 'manifest.json': { content: manifest() }, 'index.html': { content: 'x' }, 'lib__util.js': { content: 'u' }, 'big.js': { truncated: true, content: 'partial', raw_url: 'https://gist.githubusercontent.com/raw/big.js' } }));
    expect(p.files['lib/util.js']).toBe('u');
    expect(p.files['big.js']).toBe('FULL CONTENT');
  });

  it('opens a playground.json gist and reports 404s clearly', async () => {
    const saved = { v: 1, name: 'Saved', target: { app: 'PS', uxp: '9.2' }, theme: 'light', size: null, files: { 'manifest.json': manifest(), 'index.html': 'hi' }, active: 'index.html' };
    const p = await loadGist('abc', gist({ 'playground.json': { content: JSON.stringify(saved) } }));
    expect(p.name).toBe('Saved');
    expect(p.theme).toBe('light');
    await expect(loadGist('nope', gist({}, 404))).rejects.toThrow(/Gist not found/);
  });
});
