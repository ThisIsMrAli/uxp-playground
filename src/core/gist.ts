import { sanitizeProject } from './share';
import { importTree, ImportError } from './importer';
import type { Project } from './types';

/**
 * Loads a public GitHub gist (no token) through the public REST API.
 * A gist may contain a "playground.json" (exported by this app) or plain plugin files.
 * Gists are flat; "__" in a file name stands for a folder separator (icons__dark.png -> icons/dark.png).
 */
export async function loadGist(id: string, fetchImpl: typeof fetch = fetch.bind(globalThis)): Promise<Project> {
  const res = await fetchImpl('https://api.github.com/gists/' + encodeURIComponent(id), { headers: { Accept: 'application/vnd.github+json' } });
  if (res.status === 404) throw new Error('Gist not found. Check the id; secret gists work with their full id, deleted ones do not.');
  if (res.status === 403 || res.status === 429) throw new Error('GitHub API rate limit reached (60 requests per hour without sign-in). Try again later.');
  if (!res.ok) throw new Error('Gist request failed: HTTP ' + res.status);
  const data = await res.json();
  const files: Record<string, string> = {};
  for (const [name, f] of Object.entries<any>(data.files || {})) {
    if (!f) continue;
    let content: string | null = typeof f.content === 'string' ? f.content : null;
    // The API truncates file contents over ~1 MB; the raw URL has the full file.
    if ((f.truncated || content == null) && f.raw_url) {
      const r = await fetchImpl(f.raw_url);
      if (r.ok) content = await r.text();
    }
    if (content == null) continue;
    files[name.replace(/__/g, '/')] = content;
  }
  if (files['playground.json']) {
    try {
      const p = sanitizeProject(JSON.parse(files['playground.json']));
      if (p) return p;
    } catch {
      throw new Error('playground.json in this gist is not valid JSON.');
    }
  }
  if (!Object.keys(files).length) throw new Error('The gist has no files.');
  if (files['manifest.json'] == null) {
    const p = sanitizeProject({ name: data.description || 'Gist ' + id, files });
    if (!p) throw new Error('The gist has no usable files');
    return p;
  }
  try {
    const r = importTree(files, { name: data.description || undefined });
    return r.project;
  } catch (e) {
    if (e instanceof ImportError) {
      const p = sanitizeProject({ name: data.description || 'Gist ' + id, files });
      if (p) return p;
    }
    throw e;
  }
}
