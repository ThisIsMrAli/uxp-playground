/**
 * File helpers. Project files are strings; binary files (icons, images, fonts, wasm) are stored as
 * base64 data URLs ("data:image/png;base64,...") so a project stays one plain JSON object.
 */

const MIME: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  svg: 'image/svg+xml',
  ico: 'image/x-icon',
  bmp: 'image/bmp',
  woff: 'font/woff',
  woff2: 'font/woff2',
  ttf: 'font/ttf',
  otf: 'font/otf',
  wasm: 'application/wasm',
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  mp4: 'video/mp4',
  pdf: 'application/pdf',
  zip: 'application/zip',
  psd: 'image/vnd.adobe.photoshop',
  icc: 'application/vnd.iccprofile'
};

const TEXT_EXT = /\.(js|jsx|ts|tsx|mjs|cjs|json|html?|css|scss|less|md|txt|svg|xml|vue|svelte|yml|yaml|map|d\.ts|csv|gitignore|npmrc|editorconfig|eslintrc|prettierrc|babelrc|lock)$/i;

export function extOf(path: string): string {
  const m = /\.([A-Za-z0-9]+)$/.exec(path);
  return m ? m[1].toLowerCase() : '';
}

export function mimeFor(path: string): string {
  return MIME[extOf(path)] || 'application/octet-stream';
}

/** Should this path be treated as a text file when importing? */
export function isTextPath(path: string): boolean {
  const base = path.split('/').pop() || path;
  if (!base.includes('.')) return true; // LICENSE, README, Makefile
  return TEXT_EXT.test(base);
}

export function isBinaryContent(content: string): boolean {
  return content.startsWith('data:') && /^data:[^,]*;base64,/.test(content.slice(0, 200));
}

export function isImagePath(path: string): boolean {
  return /\.(png|jpe?g|gif|webp|svg|ico|bmp)$/i.test(path);
}

export function bytesToBase64(bytes: Uint8Array): string {
  let s = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) s += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunk)));
  return btoa(s);
}

export function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export function toDataUrl(path: string, bytes: Uint8Array): string {
  return `data:${mimeFor(path)};base64,${bytesToBase64(bytes)}`;
}

/** Bytes of a project file: decodes data URLs, UTF-8 encodes text. */
export function fileBytes(content: string): Uint8Array {
  if (isBinaryContent(content)) return base64ToBytes(content.slice(content.indexOf(',') + 1));
  return new TextEncoder().encode(content);
}

/** Approximate size in bytes of a stored file. */
export function fileSize(content: string): number {
  if (isBinaryContent(content)) {
    const b64 = content.slice(content.indexOf(',') + 1);
    return Math.floor((b64.length * 3) / 4);
  }
  return content.length;
}

export function humanSize(n: number): string {
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return (n / 1024).toFixed(n < 10240 ? 1 : 0) + ' KB';
  return (n / 1024 / 1024).toFixed(1) + ' MB';
}

/** Decodes bytes as UTF-8; returns null when the bytes are clearly not text. */
export function decodeText(bytes: Uint8Array): string | null {
  const sample = bytes.subarray(0, Math.min(bytes.length, 4096));
  let nul = 0;
  for (const b of sample) if (b === 0) nul++;
  if (nul > 0) return null;
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    return null;
  }
}

/** Normalises a relative path ("./a/../b.js" -> "b.js"); returns null for paths that escape the root. */
export function normalizePath(p: string): string | null {
  const parts = p.replace(/\\/g, '/').split('/');
  const out: string[] = [];
  for (const part of parts) {
    if (!part || part === '.') continue;
    if (part === '..') {
      if (!out.length) return null;
      out.pop();
    } else out.push(part);
  }
  return out.length ? out.join('/') : null;
}

/** Resolves `ref` relative to the folder of `from` (both project-relative). */
export function resolveRelative(from: string, ref: string): string | null {
  if (/^(https?:|data:|blob:|\/\/)/i.test(ref)) return null;
  const clean = ref.replace(/^plugin:\/*/, '').split(/[?#]/)[0];
  if (ref.startsWith('/') || ref.startsWith('plugin:')) return normalizePath(clean);
  const base = from.split('/').slice(0, -1).join('/');
  return normalizePath((base ? base + '/' : '') + clean);
}
