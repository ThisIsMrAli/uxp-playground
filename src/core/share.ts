import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string';
import type { Project } from './types';
import { UXP_VERSIONS } from './versions';
import { fileSize, isBinaryContent } from './files';

const THEMES = ['darkest', 'dark', 'medium', 'light', 'lightest'];
const APPS = ['PS', 'ID', 'premierepro'];
/** Real plugins (Adobe's samples, GitHub plugins) have dozens to hundreds of files. */
export const MAX_FILES = 600;
/** Per-file cap in characters; binary files are stored as base64 data URLs. */
export const MAX_FILE_CHARS = 6_000_000;
/** Binary files above this size are left out of share links (they would make the URL huge). */
export const SHARE_BINARY_LIMIT = 4096;
/** Above this length some chat apps, bug trackers and browsers truncate or reject URLs. */
export const SHARE_URL_WARN = 8000;
export const SHARE_URL_MAX = 2_000_000;

/** Is this a safe project-relative file name? Allows spaces and unicode, rejects traversal and control chars. */
export function validFileName(name: string): boolean {
  if (!name || name.length > 260) return false;
  if (name.startsWith('/') || name.includes('\\') || /[\u0000-\u001f\u007f<>:"|?*]/.test(name)) return false;
  return name.split('/').every((seg) => seg !== '' && seg !== '.' && seg !== '..' && seg.trim() === seg);
}

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
    if (!validFileName(name)) continue;
    const v = files[name];
    // Truncating a data URL corrupts it; drop oversized binaries instead.
    if (v.length > MAX_FILE_CHARS) {
      if (isBinaryContent(v)) continue;
      clean[name] = v.slice(0, MAX_FILE_CHARS);
    } else clean[name] = v;
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
    active: typeof active === 'string' && clean[active] != null ? active : clean['manifest.json'] != null ? 'manifest.json' : Object.keys(clean)[0]
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

export interface ShareResult {
  url: string;
  /** Binary files left out because they are too big for a URL. */
  omitted: string[];
  length: number;
  /** 'ok' | 'long' (may be truncated by some apps) | 'too-long' (browsers may refuse it) */
  status: 'ok' | 'long' | 'too-long';
}

export function shareUrl(base: string, p: Project, extraParams?: Record<string, string>): string {
  return share(base, p, extraParams).url;
}

export function share(base: string, p: Project, extraParams?: Record<string, string>): ShareResult {
  const omitted: string[] = [];
  const files: Record<string, string> = {};
  for (const [k, v] of Object.entries(p.files)) {
    if (isBinaryContent(v) && fileSize(v) > SHARE_BINARY_LIMIT) omitted.push(k);
    else files[k] = v;
  }
  const u = new URL(base);
  u.hash = '';
  for (const [k, v] of Object.entries(extraParams || {})) u.searchParams.set(k, v);
  u.hash = 's=' + encodeProject({ ...p, files });
  const url = u.toString();
  return { url, omitted, length: url.length, status: url.length > SHARE_URL_MAX ? 'too-long' : url.length > SHARE_URL_WARN ? 'long' : 'ok' };
}

export type HashRoute =
  | { kind: 'state'; project: Project | null }
  | { kind: 'gist'; id: string; file?: string }
  | { kind: 'github'; spec: string }
  | { kind: 'example'; id: string }
  | { kind: 'template'; id: string };

export function readHash(hash: string): HashRoute | null {
  const h = hash.replace(/^#/, '');
  if (h.startsWith('s=')) return { kind: 'state', project: decodeProject(h.slice(2)) };
  if (h.startsWith('gist=')) {
    const id = h.slice(5).replace(/[^A-Za-z0-9]/g, '');
    return id ? { kind: 'gist', id } : null;
  }
  if (h.startsWith('github=')) {
    const spec = decodeURIComponent(h.slice(7)).trim();
    return spec ? { kind: 'github', spec } : null;
  }
  if (h.startsWith('example=')) {
    const id = h.slice(8).replace(/[^A-Za-z0-9_-]/g, '');
    return id ? { kind: 'example', id } : null;
  }
  if (h.startsWith('template=')) {
    const id = h.slice(9).replace(/[^A-Za-z0-9_-]/g, '');
    return id ? { kind: 'template', id } : null;
  }
  return null;
}
