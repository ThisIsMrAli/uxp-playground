/**
 * Turns a raw file tree (zip, folder, GitHub repo, gist) into a playground project.
 * Handles real-world layouts: a wrapping top-level folder, the plugin in a sub-folder (plugin/, dist/),
 * several manifests (monorepos), binary assets, and webpack/Vite projects whose panel script is a build output.
 */
import { decodeText, fileSize, isBinaryContent, isTextPath, resolveRelative, toDataUrl } from './files';
import { MAX_FILE_CHARS, MAX_FILES, sanitizeProject, validFileName } from './share';
import type { Project } from './types';
import { HOSTS } from './hosts';
import { SCRIPT_RE } from './compile';

export type RawFiles = Record<string, string | Uint8Array>;

export interface ImportOptions {
  name?: string;
  /** Pick this manifest folder ("" = root) when the tree has several. */
  root?: string;
  maxTotalBytes?: number;
  maxBinaryBytes?: number;
}

export interface SkippedFile {
  path: string;
  reason: string;
}

export interface ImportReport {
  root: string;
  manifestCandidates: string[];
  skipped: SkippedFile[];
  notes: string[];
  fileCount: number;
  totalBytes: number;
  /** A playground-generated file that points the panel at the source entry of a bundler project. */
  entryStub?: { file: string; entry: string };
}

export interface ImportResult {
  project: Project;
  report: ImportReport;
}

export class ImportError extends Error {
  candidates?: string[];
  constructor(message: string, candidates?: string[]) {
    super(message);
    this.candidates = candidates;
  }
}

export const IGNORED_DIRS = /(^|\/)(node_modules|\.git|\.github|\.vscode|\.idea|__MACOSX|\.yarn|coverage|\.cache|\.next|\.parcel-cache)(\/|$)/;
const IGNORED_FILES = /(^|\/)(\.DS_Store|Thumbs\.db|package-lock\.json|yarn\.lock|pnpm-lock\.yaml|npm-debug\.log)$/i;
export const STUB_MARKER = '// uxp-playground:entry-stub';

/** Strips a single wrapping folder (zips of "my-plugin/..." or GitHub archives "repo-main/..."). */
export function stripCommonFolder(paths: string[]): string {
  if (!paths.length) return '';
  const first = paths[0].split('/');
  if (first.length < 2) return '';
  const top = first[0] + '/';
  return paths.every((p) => p.startsWith(top)) ? top : '';
}

/** Looks like a UXP manifest (not a web-extension or PWA manifest)? */
export function isUxpManifest(text: string): boolean {
  try {
    const m = JSON.parse(text);
    return !!m && typeof m === 'object' && (m.host != null || Array.isArray(m.entrypoints)) && m.id != null;
  } catch {
    return false;
  }
}

/** Folders that contain a UXP manifest.json, shallowest first. */
export function manifestRoots(paths: string[], read?: (p: string) => string | null): string[] {
  const roots = paths
    .filter((p) => /(^|\/)manifest\.json$/.test(p) && !IGNORED_DIRS.test(p))
    .filter((p) => {
      if (!read) return true;
      const t = read(p);
      return t == null ? true : isUxpManifest(t);
    })
    .map((p) => p.slice(0, -'manifest.json'.length));
  // A built copy (dist/, build/) is a duplicate of the source plugin folder; list it last.
  const built = (r: string) => (/(^|\/)(dist|build|out)\/$/.test(r) ? 1 : 0);
  return roots.sort((a, b) => built(a) - built(b) || a.split('/').length - b.split('/').length || a.localeCompare(b));
}

function scriptRefs(html: string): string[] {
  const out: string[] = [];
  for (const m of html.matchAll(/<script\b[^>]*\bsrc\s*=\s*["']([^"']+)["']/gi)) out.push(m[1]);
  return out;
}

function findSourceEntry(files: Record<string, string>): string | null {
  for (const cfg of ['webpack.config.js', 'webpack.config.cjs', 'webpack.config.mjs', 'webpack.config.ts']) {
    const t = files[cfg];
    if (!t) continue;
    const m = /entry\s*:\s*(?:\{[^}]*?:\s*)?\[?\s*["'`](\.?\/?[^"'`]+)["'`]/.exec(t);
    if (m) {
      const p = m[1].replace(/^\.\//, '');
      if (files[p] != null) return p;
    }
  }
  for (const c of ['src/index.tsx', 'src/index.ts', 'src/index.jsx', 'src/index.js', 'src/main.tsx', 'src/main.ts', 'src/main.jsx', 'src/main.js']) if (files[c] != null) return c;
  return null;
}

/**
 * Converts a raw tree into a project. Throws ImportError (with candidates) when several plugins are present
 * and no root was chosen.
 */
export function importTree(raw: RawFiles, opts: ImportOptions = {}): ImportResult {
  const maxTotal = opts.maxTotalBytes ?? 40 * 1024 * 1024;
  const maxBinary = opts.maxBinaryBytes ?? 3 * 1024 * 1024;
  const skipped: SkippedFile[] = [];
  const notes: string[] = [];

  let paths = Object.keys(raw)
    .map((p) => p.replace(/\\/g, '/').replace(/^\.?\//, ''))
    .filter((p) => p && !p.endsWith('/'));
  const norm: RawFiles = {};
  for (const k of Object.keys(raw)) norm[k.replace(/\\/g, '/').replace(/^\.?\//, '')] = raw[k];
  const prefix = stripCommonFolder(paths);
  if (prefix) paths = paths.map((p) => p.slice(prefix.length));
  const get = (p: string) => norm[prefix + p];
  const readText = (p: string): string | null => {
    const v = get(p);
    if (v == null) return null;
    return typeof v === 'string' ? (isBinaryContent(v) ? null : v) : decodeText(v);
  };

  const roots = manifestRoots(paths, readText);
  if (!roots.length) throw new ImportError('No UXP manifest.json found. A UXP plugin needs a manifest.json with "id", "host" and "entrypoints".');
  let root: string;
  if (opts.root != null) {
    const want = opts.root.replace(/^\/+|\/+$/g, '');
    const full = want ? want + '/' : '';
    // The root is given in the caller's paths; the common top folder may already have been stripped.
    root = prefix && full.startsWith(prefix) ? full.slice(prefix.length) : full;
    if (!roots.includes(root)) throw new ImportError(`No manifest.json in "${opts.root}".`, roots);
  } else {
    const distinct = roots.filter((r) => !/(^|\/)(dist|build|out)\/$/.test(r));
    const candidates = distinct.length ? distinct : roots;
    if (candidates.length > 1 && !candidates.includes('')) throw new ImportError(`Found ${candidates.length} plugins in this folder. Pick one.`, candidates);
    root = candidates.includes('') ? '' : candidates[0];
  }
  if (roots.length > 1) notes.push(`${roots.length} manifest.json files found; using "${root || '/'}".`);

  const files: Record<string, string> = {};
  let total = 0;
  const take = (from: string, to: string) => {
    if (IGNORED_DIRS.test(from) || IGNORED_FILES.test(from)) return;
    if (/\.map$/i.test(from)) return skipped.push({ path: from, reason: 'source map' });
    if (!validFileName(to)) return skipped.push({ path: from, reason: 'unsupported file name' });
    if (files[to] != null) return;
    if (Object.keys(files).length >= MAX_FILES) return skipped.push({ path: from, reason: `more than ${MAX_FILES} files` });
    const v = get(from);
    if (v == null) return;
    let content: string;
    if (typeof v === 'string') content = v;
    else {
      const text = isTextPath(from) ? decodeText(v) : null;
      if (text != null) content = text;
      else {
        if (v.length > maxBinary) return skipped.push({ path: from, reason: `binary file over ${Math.round(maxBinary / 1024 / 1024)} MB` });
        content = toDataUrl(from, v);
      }
    }
    // sanitizeProject caps file length for shared state. Do not silently import
    // a truncated source file, which would make a working plugin fail to run.
    if (content.length > MAX_FILE_CHARS) return skipped.push({ path: from, reason: `file exceeds ${MAX_FILE_CHARS.toLocaleString()} character limit` });
    const size = fileSize(content);
    if (total + size > maxTotal) return skipped.push({ path: from, reason: 'project size limit reached' });
    total += size;
    files[to] = content;
  };

  for (const p of paths) if (p.startsWith(root)) take(p, p.slice(root.length));

  // Bundler projects keep the plugin folder (manifest, html, icons) apart from the sources (src/).
  const parent = root ? root.split('/').slice(0, -2).join('/') : '';
  const parentPrefix = parent ? parent + '/' : '';
  let bundler = false;
  if (root) {
    for (const meta of ['package.json', 'webpack.config.js', 'webpack.config.cjs', 'webpack.config.mjs', 'webpack.config.ts', 'tsconfig.json', 'vite.config.js', 'vite.config.ts']) {
      if (get(parentPrefix + meta) != null && files[meta] == null) take(parentPrefix + meta, meta);
    }
    // Loose source files next to the plugin folder (e.g. firebase.js imported as ../../firebase from src/).
    for (const p of paths) {
      if (!p.startsWith(parentPrefix)) continue;
      const rel = p.slice(parentPrefix.length);
      if (rel.includes('/') || !SCRIPT_RE.test(rel) || /\.config\.|^\.|^(gulpfile|gruntfile|jest|babel|postcss|tailwind)\b/i.test(rel) || files[rel] != null) continue;
      take(p, rel);
    }
    for (const p of paths) {
      if (!p.startsWith(parentPrefix + 'src/')) continue;
      const rel = p.slice(parentPrefix.length);
      if (files[rel] != null) continue;
      take(p, rel);
    }
  }
  const pkgText = files['package.json'];
  if (pkgText) {
    try {
      const pkg = JSON.parse(pkgText);
      const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
      bundler = ['webpack', 'vite', 'parcel', 'rollup', 'esbuild', '@babel/core', 'typescript'].some((d) => deps[d] != null) || /webpack|vite|parcel|rollup|esbuild|tsc/.test(JSON.stringify(pkg.scripts || {}));
    } catch {
      /* ignore */
    }
  }
  if (Object.keys(files).some((f) => /^(webpack|vite)\.config\./.test(f))) bundler = true;

  const manifestText = files['manifest.json'];
  let manifest: any = {};
  try {
    manifest = JSON.parse(manifestText);
  } catch {
    notes.push('manifest.json is not valid JSON.');
  }

  // Panel HTML that loads a script which only exists after a build (index.js from webpack).
  let entryStub: ImportReport['entryStub'];
  const mainHtml = typeof manifest.main === 'string' && /\.html?$/i.test(manifest.main) ? manifest.main : files['index.html'] != null ? 'index.html' : null;
  // Script URLs are relative to the HTML file, not the project root. Resolving
  // them here also removes query strings and excludes remote/data URLs.
  const missingScripts = mainHtml && files[mainHtml] != null
    ? scriptRefs(files[mainHtml]).map((s) => resolveRelative(mainHtml, s)).filter((s): s is string => s != null && files[s] == null)
    : [];
  const mainScriptMissing = typeof manifest.main === 'string' && SCRIPT_RE.test(manifest.main) && files[manifest.main] == null;
  const mainHtmlMissing = typeof manifest.main === 'string' && /\.html?$/i.test(manifest.main) && files[manifest.main] == null;
  if (mainHtmlMissing) {
    // HtmlWebpackPlugin-style projects: the panel HTML is generated from a template in src/.
    const entry = findSourceEntry(files);
    const tpl = ['src/index.html', 'src/index.htm', 'public/index.html'].find((t) => files[t] != null);
    if (entry && tpl) {
      const depth = manifest.main.split('/').length - 1;
      const up = depth ? '../'.repeat(depth) : '';
      let html = files[tpl].replace(/<script\b[^>]*\bsrc\s*=\s*["'][^"']*["'][^>]*>\s*<\/script>/gi, '');
      const tag = `<script src="${up}${entry}"></script>`;
      html = /<\/body>/i.test(html) ? html.replace(/<\/body>/i, `  ${tag}\n</body>`) : html + '\n' + tag + '\n';
      files[manifest.main] = `<!-- uxp-playground:entry-stub: generated from ${tpl}; the bundler normally writes this file -->\n` + html;
      entryStub = { file: manifest.main, entry };
      notes.push(`Bundler project: ${manifest.main} is generated by the build, so the playground made it from ${tpl} and runs ${entry}.`);
    }
  }
  if (!entryStub && (missingScripts.length || mainScriptMissing)) {
    const entry = findSourceEntry(files);
    const target = mainScriptMissing ? manifest.main : missingScripts[0];
    if (entry && target && SCRIPT_RE.test(target)) {
      const rel = (target.split('/').length > 1 ? '../'.repeat(target.split('/').length - 1) : './') + entry;
      files[target] = `${STUB_MARKER}\n// This project is normally built with a bundler, which writes ${target}.\n// UXP Playground added this file so the panel runs the source entry (${entry}) directly.\n// npm packages other than react/react-dom cannot be loaded without the bundler.\nrequire(${JSON.stringify(rel)});\n`;
      entryStub = { file: target, entry };
      notes.push(`Bundler project: ${target} is a build output, so the playground runs ${entry} instead.`);
    } else if (bundler) {
      notes.push(`Bundler project: ${missingScripts.concat(mainScriptMissing ? [manifest.main] : []).join(', ') || manifest.main} is produced by a build step that the playground cannot run.`);
    }
  }
  if (Object.keys(files).some((f) => /\.(vue|svelte)$/i.test(f))) notes.push('Vue/Svelte single-file components need the project bundler; the playground cannot compile them.');

  const declaredHosts = Array.isArray(manifest?.host) ? manifest.host : [manifest?.host];
  const host = declaredHosts.map((declared: any) => HOSTS.find(({ id }) => declared?.app === id)).find(Boolean);
  const project = sanitizeProject({
    name: opts.name || (typeof manifest.name === 'string' ? manifest.name : 'Imported plugin'),
    target: { app: host?.id ?? 'PS', uxp: host?.uxp ?? '9.2' },
    theme: 'dark',
    files,
    active: [entryStub?.entry, 'index.js', 'main.js', 'index.jsx', 'src/index.jsx', 'src/index.js', 'src/index.tsx', 'src/index.ts', mainHtml].find((f) => f && files[f] != null && !isBinaryContent(files[f])) || 'manifest.json'
  });
  if (!project) throw new ImportError('Nothing importable was found.');
  return {
    project,
    report: { root, manifestCandidates: roots, skipped, notes, fileCount: Object.keys(project.files).length, totalBytes: total, entryStub }
  };
}
