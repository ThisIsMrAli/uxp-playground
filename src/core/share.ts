import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string';
import type { Project } from './types';
import { UXP_VERSIONS } from './versions';

const THEMES = ['darkest', 'dark', 'medium', 'light', 'lightest'];
const APPS = ['PS', 'ID', 'premierepro'];
export const MAX_FILES = 40;
export const MAX_FILE_CHARS = 200_000;

export function encodeProject(p: Project): string {
  const payload = { v: 1, n: p.name, t: p.target, th: p.theme, s: p.size, f: p.files, a: p.active };
  return compressToEncodedURIComponent(JSON.stringify(payload));
}

/** Validates untrusted shared state; returns null when it is not a playground project. */
export function sanitizeProject(raw: any): Project | null {
  if (!raw || typeof raw !== 'object') return null;
  const files = raw.files ?? raw.f;
  if (!files || typeof files !== 'object' || Array.isArray(files)) return null;
  const clean: Record<string, string> = {};
  const names = Object.keys(files).slice(0, MAX_FILES);
  for (const name of names) {
    if (typeof files[name] !== 'string') continue;
    if (!/^[A-Za-z0-9_\-./]+$/.test(name) || name.includes('..') || name.startsWith('/')) continue;
    clean[name] = files[name].slice(0, MAX_FILE_CHARS);
  }
  if (!Object.keys(clean).length) return null;
  const t = raw.target ?? raw.t ?? {};
  const theme = raw.theme ?? raw.th;
  const size = raw.size ?? raw.s;
  const active = raw.active ?? raw.a;
  return {
    v: 1,
    name: typeof (raw.name ?? raw.n) === 'string' ? String(raw.name ?? raw.n).slice(0, 120) : 'Shared playground',
    target: { app: APPS.includes(t.app) ? t.app : 'PS', uxp: UXP_VERSIONS.includes(t.uxp) ? t.uxp : '9.2' },
    theme: THEMES.includes(theme) ? theme : 'dark',
    size: size && Number(size.width) > 0 && Number(size.height) > 0 ? { width: Math.min(2000, Number(size.width)), height: Math.min(2000, Number(size.height)) } : null,
    files: clean,
    active: typeof active === 'string' && clean[active] != null ? active : Object.keys(clean)[0]
  };
}

export function decodeProject(encoded: string): Project | null {
  try {
    const json = decompressFromEncodedURIComponent(encoded);
    if (!json) return null;
    return sanitizeProject(JSON.parse(json));
  } catch {
    return null;
  }
}

export function shareUrl(base: string, p: Project): string {
  const u = new URL(base);
  u.hash = 's=' + encodeProject(p);
  return u.toString();
}

export function readHash(hash: string): { kind: 'state'; project: Project | null } | { kind: 'gist'; id: string } | null {
  const h = hash.replace(/^#/, '');
  if (h.startsWith('s=')) return { kind: 'state', project: decodeProject(h.slice(2)) };
  if (h.startsWith('gist=')) {
    const id = h.slice(5).replace(/[^A-Za-z0-9]/g, '');
    return id ? { kind: 'gist', id } : null;
  }
  return null;
}
