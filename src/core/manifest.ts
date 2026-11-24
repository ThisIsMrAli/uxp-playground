import { cmpVersion, uxpForPhotoshop } from './versions';
import type { Target } from './types';

export interface Diagnostic {
  file: string;
  line: number; // 1-based
  column: number; // 1-based
  endLine?: number;
  endColumn?: number;
  severity: 'error' | 'warning' | 'info';
  ruleId: string;
  message: string;
  source: 'manifest' | 'css' | 'eslint' | 'compile';
  /** Rule documentation (meta.docs.url of the ESLint rule). */
  docsUrl?: string;
}

export interface ParsedManifest {
  ok: boolean;
  value: any;
  error?: string;
  errorLine?: number;
  errorColumn?: number;
}

export function parseManifest(text: string | undefined): ParsedManifest {
  if (text == null) return { ok: false, value: {}, error: 'manifest.json is missing' };
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch (e: any) {
    const msg = String(e && e.message ? e.message : e);
    let line = 1;
    let column = 1;
    const m = /position (\d+)/.exec(msg);
    if (m) {
      const pos = Number(m[1]);
      const before = text.slice(0, pos).split('\n');
      line = before.length;
      column = before[before.length - 1].length + 1;
    }
    const lm = /line (\d+) column (\d+)/.exec(msg);
    if (lm) {
      line = Number(lm[1]);
      column = Number(lm[2]);
    }
    return { ok: false, value: {}, error: msg, errorLine: line, errorColumn: column };
  }
}

/** The host entry for `app` (or the first one). Manifest v4 allows an array of hosts. */
export function primaryHost(m: any, app?: string): { app?: string; minVersion?: string; data?: any } {
  const h = m && m.host;
  if (Array.isArray(h)) return (app && h.find((x: any) => x && x.app === app)) || h.find((x: any) => x && ['PS', 'ID', 'premierepro'].includes(x.app)) || h[0] || {};
  return h || {};
}

export function firstPanel(m: any): any | null {
  const eps = Array.isArray(m && m.entrypoints) ? m.entrypoints : [];
  return eps.find((e: any) => e && e.type === 'panel') || null;
}

export function panelSize(m: any): { width: number; height: number } {
  const p = firstPanel(m);
  const s = (p && (p.preferredDockedSize || p.preferredFloatingSize || p.minimumSize)) || {};
  const w = Number(s.width) || 300;
  const h = Number(s.height) || 400;
  return { width: Math.min(Math.max(w, 120), 2000), height: Math.min(Math.max(h, 120), 2000) };
}

function locate(text: string, key: string): { line: number; column: number } {
  const idx = text.indexOf('"' + key + '"');
  if (idx < 0) return { line: 1, column: 1 };
  const before = text.slice(0, idx).split('\n');
  return { line: before.length, column: before[before.length - 1].length + 1 };
}

const KNOWN_PERMISSIONS = ['network', 'clipboard', 'localFileSystem', 'launchProcess', 'ipc', 'webview', 'allowCodeGenerationFromStrings', 'enableUserInfo'];

/**
 * Manifest v5 checks based on Adobe's "UXP Manifest v5" guide
 * (https://developer.adobe.com/photoshop/uxp/2022/guides/uxp_guide/uxp-misc/manifest-v5/).
 */
export function checkManifest(text: string | undefined, files: Record<string, string>, target: Target): Diagnostic[] {
  const out: Diagnostic[] = [];
  const add = (key: string, severity: Diagnostic['severity'], ruleId: string, message: string) => {
    const loc = text ? locate(text, key) : { line: 1, column: 1 };
    out.push({ file: 'manifest.json', ...loc, severity, ruleId, message, source: 'manifest' });
  };
  const parsed = parseManifest(text);
  if (!parsed.ok) {
    out.push({ file: 'manifest.json', line: parsed.errorLine ?? 1, column: parsed.errorColumn ?? 1, severity: 'error', ruleId: 'manifest/json', message: 'manifest.json is not valid JSON: ' + parsed.error, source: 'manifest' });
    return out;
  }
  const m = parsed.value;
  if (m.manifestVersion !== 5) add('manifestVersion', 'warning', 'manifest/version', 'Use "manifestVersion": 5 for the v5 permissions model (PS 23.3+/UXP 6.0+).');
  for (const k of ['id', 'name', 'version', 'main', 'host']) {
    if (m[k] == null || m[k] === '') add(k, 'error', 'manifest/required', `Missing required field "${k}".`);
  }
  if (m.entrypoints == null) add('id', 'info', 'manifest/no-entrypoints', 'No "entrypoints": this is an invisible plugin (no panel or menu command). Add a panel or command entrypoint to give it UI.');
  if (m.version != null && !/^\d+(\.\d+){0,2}$/.test(String(m.version))) add('version', 'error', 'manifest/semver', 'version must look like x.y.z.');
  if (typeof m.main === 'string' && files[m.main.replace(/^\.\//, '')] == null) add('main', 'error', 'manifest/main-missing', `"main" points to "${m.main}", which is not a file in this project.`);
  const host = primaryHost(m, target.app);
  if (m.host) {
    if (!host.app) add('host', 'error', 'manifest/host-app', 'host.app is required (e.g. "PS").');
    else if (!['PS', 'ID', 'premierepro', 'ame'].includes(host.app)) add('app', 'warning', 'manifest/host-app-value', `host.app "${host.app}" is not one of the documented values "PS", "ID", "premierepro", "ame".`);
    else if (host.app !== target.app) add('app', 'warning', 'manifest/host-mismatch', `host.app is "${host.app}" but the playground target is ${target.app}.`);
    if (!host.minVersion) add('host', 'warning', 'manifest/min-version', 'host.minVersion is recommended.');
  }
  if (host.app === 'PS' && host.minVersion) {
    if (cmpVersion(host.minVersion, '23.3.0') < 0 && m.manifestVersion === 5) add('minVersion', 'warning', 'manifest/v5-min-version', 'Full manifest v5 needs Photoshop 23.3.0 or later.');
    const uxpAtMin = uxpForPhotoshop(host.minVersion);
    if (uxpAtMin && cmpVersion(target.uxp, uxpAtMin) > 0) {
      add('minVersion', 'info', 'manifest/min-version-gap', `You are previewing UXP ${target.uxp}, but host.minVersion ${host.minVersion} ships with UXP ${uxpAtMin} (per Adobe's Photoshop changelog). Test on the oldest version you claim to support.`);
    }
  }
  const eps = Array.isArray(m.entrypoints) ? m.entrypoints : [];
  if (m.entrypoints != null && !Array.isArray(m.entrypoints)) add('entrypoints', 'error', 'manifest/entrypoints', 'entrypoints must be an array.');
  const seen = new Set<string>();
  eps.forEach((e: any) => {
    if (!e || (e.type !== 'panel' && e.type !== 'command')) add('entrypoints', 'error', 'manifest/entrypoint-type', 'Each entrypoint needs "type": "panel" or "command".');
    if (!e?.id) add('entrypoints', 'error', 'manifest/entrypoint-id', 'Each entrypoint needs an "id".');
    else if (seen.has(e.id)) add(e.id, 'error', 'manifest/entrypoint-dup', `Duplicate entrypoint id "${e.id}".`);
    else seen.add(e.id);
    if (e && !e.label) add(e.id || 'entrypoints', 'warning', 'manifest/entrypoint-label', `Entrypoint "${e.id}" has no label.`);
  });
  const perms = m.requiredPermissions || {};
  Object.keys(perms).forEach((k) => {
    if (!KNOWN_PERMISSIONS.includes(k)) add(k, 'warning', 'manifest/unknown-permission', `Unknown permission "${k}".`);
  });
  if (perms.localFileSystem && !['request', 'plugin', 'fullAccess'].includes(perms.localFileSystem)) add('localFileSystem', 'error', 'manifest/fs-value', 'localFileSystem must be "request", "plugin" or "fullAccess".');
  if (perms.clipboard && !['read', 'readAndWrite'].includes(perms.clipboard)) add('clipboard', 'error', 'manifest/clipboard-value', 'clipboard must be "read" or "readAndWrite".');
  if (perms.network && perms.network.domains !== 'all' && !Array.isArray(perms.network.domains)) add('network', 'error', 'manifest/network-domains', 'network.domains must be an array of origins or "all".');
  if (perms.enableUserInfo && host.app === 'PS' && host.minVersion && cmpVersion(host.minVersion, '25.1') < 0) add('enableUserInfo', 'warning', 'manifest/user-info-version', 'enableUserInfo needs Photoshop 25.1 (UXP 7.3) or later.');
  if (perms.webview && cmpVersion(target.uxp, '6.0') < 0) add('webview', 'warning', 'manifest/webview-version', 'WebViews need UXP 6.0 or later.');
  return out;
}

/** CSS checks with documented UXP limits (Adobe "CSS styling" recipe: "CSS Grid Layout is not available"). */
export function checkCss(file: string, css: string): Diagnostic[] {
  const out: Diagnostic[] = [];
  const lines = css.split('\n');
  lines.forEach((ln, i) => {
    const g = /display\s*:\s*(inline-)?grid\b/.exec(ln);
    if (g) out.push({ file, line: i + 1, column: g.index + 1, endColumn: g.index + g[0].length + 1, severity: 'warning', ruleId: 'css/no-grid', message: 'UXP does not support CSS Grid Layout. Use flexbox.', source: 'css' });
    const v = /@(import|tailwind)\b/.exec(ln);
    if (v && v[1] === 'tailwind') out.push({ file, line: i + 1, column: v.index + 1, severity: 'warning', ruleId: 'css/preprocessor', message: 'UXP only understands standard CSS; compile preprocessors before packaging.', source: 'css' });
  });
  return out;
}
