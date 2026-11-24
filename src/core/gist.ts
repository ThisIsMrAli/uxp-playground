import { sanitizeProject } from './share';
import type { Project } from './types';

/**
 * Loads a public GitHub gist (no token) through the public REST API.
 * A gist may contain a "playground.json" (exported by this app) or plain plugin files.
 */
export async function loadGist(id: string, fetchImpl: typeof fetch = fetch): Promise<Project> {
  const res = await fetchImpl('https://api.github.com/gists/' + encodeURIComponent(id), { headers: { Accept: 'application/vnd.github+json' } });
  if (!res.ok) throw new Error('Gist request failed: HTTP ' + res.status);
  const data = await res.json();
  const files: Record<string, string> = {};
  for (const [name, f] of Object.entries<any>(data.files || {})) {
    if (f && typeof f.content === 'string' && !f.truncated) files[name] = f.content;
  }
  if (files['playground.json']) {
    const p = sanitizeProject(JSON.parse(files['playground.json']));
    if (p) return p;
  }
  const p = sanitizeProject({ name: data.description || 'Gist ' + id, files });
  if (!p) throw new Error('The gist has no usable files');
  return p;
}
