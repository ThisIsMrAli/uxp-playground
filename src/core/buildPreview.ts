import { compileModule, isScript, type CompiledModule, usesReact } from './compile';
import { parseManifest } from './manifest';
import type { Project } from './types';

export interface RuntimeAssets {
  runtime: string;
  panelCss: string;
  shimCss: string;
  vendor: string | null;
}

export interface PreviewBuild {
  html: string;
  modules: Record<string, CompiledModule>;
  compileErrors: { file: string; message: string; line: number; column: number }[];
  entryHtml: string | null;
  needsReact: boolean;
}

const HOST_VERSION: Record<string, string> = { PS: '27.4.0', ID: '21.0.0', premierepro: '26.0.0' };

function jsonForScript(v: unknown): string {
  return JSON.stringify(v).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
}

function escapeAttr(s: string) {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

export function pickEntryHtml(p: Project, manifest: any): string | null {
  const main = manifest && typeof manifest.main === 'string' ? manifest.main : null;
  if (main && /\.html?$/i.test(main) && p.files[main] != null) return main;
  if (main && isScript(main)) return null;
  if (p.files['index.html'] != null) return 'index.html';
  return Object.keys(p.files).find((f) => /\.html?$/i.test(f)) ?? null;
}

function resolveRel(fromHtml: string, ref: string): string {
  const base = fromHtml.split('/').slice(0, -1);
  const parts = base.concat(ref.replace(/^\.\//, '').split('/'));
  const out: string[] = [];
  for (const p of parts) {
    if (p === '..') out.pop();
    else if (p && p !== '.') out.push(p);
  }
  return out.join('/');
}

/** Turns the project into one srcdoc HTML string for the sandboxed preview iframe. */
export function buildPreview(p: Project, assets: RuntimeAssets): PreviewBuild {
  const manifest = parseManifest(p.files['manifest.json']).value;
  const modules: Record<string, CompiledModule> = {};
  const compileErrors: PreviewBuild['compileErrors'] = [];
  let needsReact = false;
  for (const [path, code] of Object.entries(p.files)) {
    if (!isScript(path) && !/\.json$/i.test(path)) continue;
    if (path === 'manifest.json') continue;
    const c = compileModule(path, code);
    modules[path] = c;
    if (c.error) compileErrors.push({ file: path, message: c.error, line: c.errorLine ?? 1, column: c.errorColumn ?? 1 });
    if (usesReact(c.code)) needsReact = true;
  }

  const entryHtml = pickEntryHtml(p, manifest);
  let head = '';
  let body = '';
  if (entryHtml) {
    const doc = new DOMParser().parseFromString(p.files[entryHtml], 'text/html');
    doc.querySelectorAll('link[rel="stylesheet"][href]').forEach((link) => {
      const href = resolveRel(entryHtml, link.getAttribute('href') || '');
      const style = doc.createElement('style');
      style.setAttribute('data-pg-file', href);
      style.textContent = p.files[href] ?? `/* ${href} not found in project */`;
      link.replaceWith(style);
    });
    doc.querySelectorAll('script[src]').forEach((s) => {
      const src = resolveRel(entryHtml, s.getAttribute('src') || '');
      if (p.files[src] == null) return;
      const run = doc.createElement('script');
      run.textContent = `__pg.run(${JSON.stringify(src)});`;
      run.setAttribute('data-pg-src', src);
      s.replaceWith(run);
    });
    doc.querySelectorAll('title').forEach((t) => t.remove());
    head = doc.head.innerHTML;
    body = doc.body.innerHTML;
  } else if (manifest && typeof manifest.main === 'string' && modules[manifest.main]) {
    body = `<script>__pg.run(${JSON.stringify(manifest.main)});</script>`;
  }

  const boot = {
    manifest,
    target: { app: p.target.app, uxp: p.target.uxp, hostVersion: HOST_VERSION[p.target.app] },
    modules,
    sources: Object.fromEntries(Object.entries(p.files).filter(([k]) => !k.includes('/'))),
    shimCss: assets.shimCss,
    vendor: needsReact ? assets.vendor : null
  };

  const html = `<!DOCTYPE html>
<html data-theme="${escapeAttr(p.theme)}" data-host="${escapeAttr(p.target.app)}">
<head>
<meta charset="utf-8">
<style id="pg-panel-css">${assets.panelCss}</style>
<script>window.__PG_BOOT__ = ${jsonForScript(boot)};</script>
<script>${assets.runtime.replace(/<\/script/gi, '<\\/script')}</script>
${head}
</head>
<body>
${body}
</body>
</html>`;
  return { html, modules, compileErrors, entryHtml, needsReact };
}
