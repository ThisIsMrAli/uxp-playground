/**
 * Imports a public GitHub repository (or a sub-folder) without a token:
 * 2 REST calls (repo + recursive git tree, 60/hour/IP unauthenticated) and raw.githubusercontent.com
 * downloads (CORS-enabled, not rate-limited like the API).
 */
import { IGNORED_DIRS, ImportError, importTree, manifestRoots, type ImportResult, type RawFiles } from './importer';
import { isTextPath } from './files';

export interface GithubSpec {
  owner: string;
  repo: string;
  ref?: string;
  path?: string;
}

/** Accepts "owner/repo", "owner/repo/path", "owner/repo@ref:path" and github.com URLs (tree/blob). */
export function parseGithubSpec(input: string): GithubSpec | null {
  let s = input.trim().replace(/\.git$/, '');
  const url = /^(?:https?:\/\/)?(?:www\.)?github\.com\/([^/\s]+)\/([^/\s#?]+)(?:\/(?:tree|blob)\/([^/\s]+)(?:\/([^\s#?]*))?)?/.exec(s);
  if (url) {
    const path = url[4] ? decodeURIComponent(url[4]).replace(/\/manifest\.json$/, '').replace(/\/$/, '') : undefined;
    return { owner: url[1], repo: url[2], ref: url[3], path: path || undefined };
  }
  s = s.replace(/^github:/, '');
  const at = /^([\w.-]+)\/([\w.-]+)(?:@([^:\s]+))?(?::(.+))?$/.exec(s);
  if (at) return { owner: at[1], repo: at[2], ref: at[3], path: at[4]?.replace(/^\/|\/$/g, '') || undefined };
  const plain = /^([\w.-]+)\/([\w.-]+)(?:\/(.+))?$/.exec(s);
  if (plain) return { owner: plain[1], repo: plain[2], path: plain[3]?.replace(/\/$/, '') || undefined };
  return null;
}

export function specToString(s: GithubSpec): string {
  return `${s.owner}/${s.repo}${s.ref ? '@' + s.ref : ''}${s.path ? ':' + s.path : ''}`;
}

async function api(fetchImpl: typeof fetch, url: string) {
  const res = await fetchImpl(url, { headers: { Accept: 'application/vnd.github+json' } });
  if (res.status === 403 || res.status === 429) {
    const reset = res.headers.get('x-ratelimit-reset');
    const when = reset ? ` Try again after ${new Date(Number(reset) * 1000).toLocaleTimeString()}.` : '';
    throw new Error('GitHub API rate limit reached (60 requests per hour without sign-in).' + when);
  }
  if (res.status === 404) throw new Error('Repository or branch not found. Private repositories cannot be imported.');
  if (!res.ok) throw new Error('GitHub request failed: HTTP ' + res.status);
  return res.json();
}

export interface GithubProgress {
  (done: number, total: number): void;
}

export async function importGithub(
  input: string | GithubSpec,
  opts: { fetchImpl?: typeof fetch; onProgress?: GithubProgress; root?: string; maxFiles?: number } = {}
): Promise<ImportResult & { spec: GithubSpec }> {
  const fetchImpl = opts.fetchImpl || fetch.bind(globalThis);
  const spec = typeof input === 'string' ? parseGithubSpec(input) : input;
  if (!spec) throw new Error('Use owner/repo, owner/repo/sub/folder or a github.com URL.');
  let ref = spec.ref;
  if (!ref) {
    const repo = await api(fetchImpl, `https://api.github.com/repos/${spec.owner}/${spec.repo}`);
    ref = repo.default_branch as string;
  }
  const tree = await api(fetchImpl, `https://api.github.com/repos/${spec.owner}/${spec.repo}/git/trees/${encodeURIComponent(ref!)}?recursive=1`);
  const blobs: { path: string; size: number }[] = (tree.tree || []).filter((t: any) => t.type === 'blob').map((t: any) => ({ path: t.path, size: t.size || 0 }));
  const base = spec.path ? spec.path.replace(/^\/|\/$/g, '') + '/' : '';
  const scoped = blobs.filter((b) => b.path.startsWith(base) && !IGNORED_DIRS.test(b.path));
  const rel = scoped.map((b) => b.path.slice(base.length));
  const roots = manifestRoots(rel);
  if (!roots.length) throw new ImportError(`No manifest.json found in ${specToString({ ...spec, ref })}${tree.truncated ? ' (the repository is too large to list completely)' : ''}.`);
  // Decide the plugin folder before downloading, so monorepos only download one plugin.
  let root = opts.root;
  if (root == null) {
    const distinct = roots.filter((r) => !/(^|\/)(dist|build|out)\/$/.test(r));
    const candidates = distinct.length ? distinct : roots;
    if (candidates.length > 1 && !candidates.includes('')) throw new ImportError(`Found ${candidates.length} plugins in this repository. Pick one.`, candidates);
    root = candidates.includes('') ? '' : candidates[0];
  }
  const rootPrefix = root ? root.replace(/\/?$/, '/') : '';
  const parent = rootPrefix ? rootPrefix.split('/').slice(0, -2).join('/') : '';
  const parentPrefix = parent ? parent + '/' : '';
  const wanted = rel.filter((p) => {
    if (p.startsWith(rootPrefix)) return true;
    if (!rootPrefix) return false;
    const r = p.slice(parentPrefix.length);
    // Same as importTree: the parent's src/, build configs and loose top-level scripts (e.g. firebase.js).
    return p.startsWith(parentPrefix) && (r.startsWith('src/') || /^(package\.json|tsconfig\.json|webpack\.config\.\w+|vite\.config\.\w+)$/.test(r) || (/^[^/]+\.(js|jsx|ts|tsx|mjs|cjs)$/.test(r) && !/\.config\.|^\./.test(r)));
  });
  const max = opts.maxFiles ?? 400;
  const sizes = new Map(scoped.map((b) => [b.path.slice(base.length), b.size]));
  const list = wanted.filter((p) => !/\.(psd|psb|mp4|mov|zip|ccx|dmg|exe)$/i.test(p) && (sizes.get(p) || 0) < 3 * 1024 * 1024).slice(0, max);
  const raw: RawFiles = {};
  let done = 0;
  const queue = list.slice();
  const worker = async () => {
    while (queue.length) {
      const p = queue.shift()!;
      const url = `https://raw.githubusercontent.com/${spec.owner}/${spec.repo}/${encodeURIComponent(ref!)}/${(base + p).split('/').map(encodeURIComponent).join('/')}`;
      const res = await fetchImpl(url);
      if (!res.ok) throw new Error(`Could not download ${p}: HTTP ${res.status}`);
      raw[p] = isTextPath(p) ? await res.text() : new Uint8Array(await res.arrayBuffer());
      opts.onProgress?.(++done, list.length);
    }
  };
  await Promise.all(Array.from({ length: Math.min(8, list.length || 1) }, worker));
  const result = importTree(raw, { root: root || '', name: undefined });
  if (wanted.length > list.length) result.report.skipped.push({ path: `${wanted.length - list.length} files`, reason: 'too large or over the file limit' });
  result.report.notes.unshift(`Imported from github.com/${spec.owner}/${spec.repo} (${ref}${spec.path ? ', ' + spec.path : ''}${root ? ', ' + root.replace(/\/$/, '') : ''}).`);
  return { ...result, spec: { ...spec, ref } };
}
