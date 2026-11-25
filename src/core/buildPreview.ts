import { compileModule, isScript, type CompiledModule, usesReact } from './compile';
import { parseManifest } from './manifest';
import { HOSTS, hostInfo } from './hosts';
import { isBinaryContent, resolveRelative } from './files';
import type { PreviewScenario } from './scenarios';
import type { Project } from './types';

export interface RuntimeAssets {
  runtime: string;
  panelCss: string;
  shimCss: string;
  vendor: string | null;
  /** Constants and member tables from @types/photoshop (src/generated/ps-api.json). */
  psApi?: unknown;
}

export interface PreviewModule extends Omit<CompiledModule, 'kind'> {
  kind: CompiledModule['kind'] | 'css' | 'asset';
}

export interface PreviewBuild {
  html: string;
  modules: Record<string, PreviewModule>;
  compileErrors: { file: string; message: string; line: number; column: number }[];
  entryHtml: string | null;
  needsReact: boolean;
  /** manifest.main is a script: a headless plugin (commands only, no panel UI). */
  headless: boolean;
  /** Files referenced by the entry HTML that are not in the project. */
  missing: string[];
  /** Bare module names required by the code that the playground cannot provide. */
  unresolvedPackages: string[];
}

export const PLAYGROUND_BUILTINS: string[] = [...HOSTS.map(({ module }) => module), 'uxp', 'os', 'fs', 'react', 'react-dom', 'react-dom/client', 'react/jsx-runtime', 'react/jsx-dev-runtime'];
// Multi-host bundles can guard Adobe modules that have no public playground target.
export const HOST_MODULES: string[] = [...HOSTS.map(({ module }) => module), 'illustrator'];

function jsonForScript(v: unknown): string {
  return JSON.stringify(v).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
}

function escapeAttr(s: string) {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

export function pickEntryHtml(p: Project, manifest: any): string | null {
  const main = manifest && typeof manifest.main === 'string' ? manifest.main.replace(/^\.\//, '') : null;
  if (main && /\.html?$/i.test(main) && p.files[main] != null) return main;
  if (main && isScript(main)) return null;
  if (p.files['index.html'] != null) return 'index.html';
  return Object.keys(p.files).find((f) => /\.html?$/i.test(f) && !f.includes('/')) ?? null;
}

/** Rewrites url(...) references in CSS to inline data URLs for binary project files. */
export function inlineCssUrls(cssFile: string, css: string, files: Record<string, string>): string {
  return css.replace(/url\(\s*(['"]?)([^'")]+)\1\s*\)/g, (whole, _q: string, ref: string) => {
    const p = resolveRelative(cssFile, ref.trim());
    if (!p || files[p] == null) return whole;
    const v = files[p];
    return isBinaryContent(v) ? `url("${v}")` : /\.svg$/i.test(p) ? `url("data:image/svg+xml;charset=utf-8,${encodeURIComponent(v)}")` : whole;
  });
}

function assetUrl(files: Record<string, string>, path: string): string | null {
  const v = files[path];
  if (v == null) return null;
  if (isBinaryContent(v)) return v;
  if (/\.svg$/i.test(path)) return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(v);
  return null;
}

/** Turns the project into one srcdoc HTML string for the sandboxed preview iframe. */
export function buildPreview(p: Project, assets: RuntimeAssets, scenario: PreviewScenario = 'sample'): PreviewBuild {
  const manifest = parseManifest(p.files['manifest.json']).value;
  const modules: Record<string, PreviewModule> = {};
  const compileErrors: PreviewBuild['compileErrors'] = [];
  const unresolved = new Set<string>();
  let needsReact = false;
  for (const [path, code] of Object.entries(p.files)) {
    if (path === 'manifest.json' || /\.d\.ts$/i.test(path)) continue;
    if (isBinaryContent(code)) {
      modules[path] = { kind: 'asset', code };
      continue;
    }
    if (/\.css$/i.test(path)) {
      modules[path] = { kind: 'css', code: inlineCssUrls(path, code, p.files) };
      continue;
    }
    if (/\.svg$/i.test(path)) {
      modules[path] = { kind: 'asset', code: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(code) };
      continue;
    }
    if (!isScript(path) && !/\.json$/i.test(path)) continue;
    const c = compileModule(path, code);
    modules[path] = c;
    if (c.error) compileErrors.push({ file: path, message: c.error.replace(/^Error transforming [^:]+: /, ''), line: c.errorLine ?? 1, column: c.errorColumn ?? 1 });
    if (usesReact(c.code)) needsReact = true;
    for (const m of c.code.matchAll(/\brequire\(\s*['"]([^'"./][^'"]*)['"]\s*\)/g)) {
      const name = m[1].replace(/^adobe:/, '');
      if (!PLAYGROUND_BUILTINS.includes(name) && !HOST_MODULES.includes(name) && !name.startsWith('plugin:')) unresolved.add(name.startsWith('@') ? name.split('/').slice(0, 2).join('/') : name.split('/')[0]);
    }
  }

  const missing: string[] = [];
  const entryHtml = pickEntryHtml(p, manifest);
  let head = '';
  let body = '';
  let htmlAttrs = '';
  let tail = '';
  let headless = false;
  if (entryHtml) {
    const doc = new DOMParser().parseFromString(p.files[entryHtml], 'text/html');
    doc.querySelectorAll('link[rel="stylesheet"][href]').forEach((link) => {
      const href = link.getAttribute('href') || '';
      const path = resolveRelative(entryHtml, href);
      if (!path) return; // remote stylesheet: leave it
      const style = doc.createElement('style');
      style.setAttribute('data-pg-file', path);
      if (p.files[path] == null) missing.push(path);
      style.textContent = p.files[path] != null ? inlineCssUrls(path, p.files[path], p.files) : `/* ${path} not found in project */`;
      link.replaceWith(style);
    });
    doc.querySelectorAll('style').forEach((s) => {
      if (!s.hasAttribute('data-pg-file') && s.textContent) s.textContent = inlineCssUrls(entryHtml, s.textContent, p.files);
    });
    doc.querySelectorAll('[src]').forEach((el) => {
      if (el.tagName === 'SCRIPT') return;
      const path = resolveRelative(entryHtml, el.getAttribute('src') || '');
      if (!path) return;
      const url = assetUrl(p.files, path);
      if (url) el.setAttribute('src', url);
      else if (p.files[path] == null) missing.push(path);
    });
    doc.querySelectorAll('[style*="url("]').forEach((el) => {
      el.setAttribute('style', inlineCssUrls(entryHtml, el.getAttribute('style') || '', p.files));
    });
    // UXP runs panel scripts after the document is parsed (Adobe's own samples put <script src> in <head>
    // and query body elements at top level), so scripts are moved to the end of <body> in document order.
    const scripts = Array.from(doc.querySelectorAll('script'));
    for (const s of scripts) {
      const srcAttr = s.getAttribute('src');
      s.remove();
      if (srcAttr == null) {
        tail += `<script data-pg-inline>${(s.textContent || '').replace(/<\/script/gi, '<\\/script')}</script>\n`;
        continue;
      }
      if (/^(https?:)?\/\//i.test(srcAttr)) {
        const type = s.getAttribute('type');
        tail += `<script src="${escapeAttr(srcAttr)}"${type ? ` type="${escapeAttr(type)}"` : ''}${s.hasAttribute('crossorigin') ? ' crossorigin' : ''}></script>\n`;
        continue;
      }
      const src = resolveRelative(entryHtml, srcAttr);
      if (!src || p.files[src] == null || !modules[src]) {
        missing.push(src || srcAttr);
        tail += `<script>__pg.missing(${JSON.stringify(entryHtml)}, ${JSON.stringify(src || srcAttr)});</script>\n`;
        continue;
      }
      tail += `<script data-pg-src="${escapeAttr(src)}">__pg.run(${JSON.stringify(src)});</script>\n`;
    }
    doc.querySelectorAll('title').forEach((t) => t.remove());
    head = doc.head.innerHTML;
    body = doc.body.innerHTML;
    const bodyAttrs = Array.from(doc.body.attributes).map((a) => `${a.name}="${escapeAttr(a.value)}"`).join(' ');
    htmlAttrs = bodyAttrs;
  } else if (manifest && typeof manifest.main === 'string' && modules[manifest.main.replace(/^\.\//, '')]) {
    headless = true;
    body = `<div class="pg-headless" role="note"><strong>Headless plugin</strong><span>manifest.json "main" is ${escapeAttr(manifest.main)}, so there is no panel UI. Run its commands from the toolbar above; output appears in the Console and Host calls tabs.</span></div>`;
    tail = `<script>__pg.run(${JSON.stringify(manifest.main.replace(/^\.\//, ''))});</script>`;
  } else if (manifest && typeof manifest.main === 'string') {
    missing.push(manifest.main);
    tail = `<script>__pg.missing("manifest.json", ${JSON.stringify(manifest.main)});</script>`;
  }

  const host = hostInfo(p.target.app);
  const boot = {
    manifest,
    scenario,
    target: { app: p.target.app, uxp: p.target.uxp, hostVersion: host?.previewVersion },
    modules,
    sources: Object.fromEntries(Object.entries(p.files).filter(([, v]) => v.length < 2_000_000)),
    shimCss: assets.shimCss,
    vendor: needsReact ? assets.vendor : null,
    psApi: assets.psApi ?? null,
    entryHtml
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
<body ${htmlAttrs}>
${body}
${tail}<script>__pg.loaded();</script>
</body>
</html>`;
  return { html, modules, compileErrors, entryHtml, headless, needsReact, missing: [...new Set(missing)], unresolvedPackages: [...unresolved].sort() };
}
