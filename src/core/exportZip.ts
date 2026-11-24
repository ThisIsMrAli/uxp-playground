import { strToU8, zipSync, type Zippable } from 'fflate';
import { compileModule, isScript, needsCompile, outputPath, rewriteRequires, usesReact } from './compile';
import { parseManifest } from './manifest';
import type { Project } from './types';

export interface ExportResult {
  zip: Uint8Array;
  fileName: string;
  files: string[];
  warnings: string[];
}

const VENDOR_SHIMS: Record<string, string> = {
  'vendor/react.js': "module.exports = require('./react-bundle.js').React;\n",
  'vendor/react-dom.js': "module.exports = require('./react-bundle.js').ReactDOM;\n",
  'vendor/react-dom-client.js': "module.exports = require('./react-bundle.js').ReactDOMClient;\n",
  'vendor/react-jsx-runtime.js': "module.exports = require('./react-bundle.js').jsxRuntime;\n"
};

export function slug(s: string) {
  return (s || 'uxp-plugin').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'uxp-plugin';
}

/** Produces the files of an installable plugin folder (manifest.json at the root). */
export function exportFiles(p: Project, vendorBundle: string | null): { files: Record<string, string>; warnings: string[] } {
  const out: Record<string, string> = {};
  const warnings: string[] = [];
  let reactUsed = false;
  for (const [path, code] of Object.entries(p.files)) {
    if (isScript(path)) {
      let js = code;
      if (needsCompile(path, code)) {
        const c = compileModule(path, code);
        if (c.error) {
          warnings.push(`${path}: not exported because it does not compile (${c.error})`);
          continue;
        }
        js = c.code;
      }
      if (usesReact(js)) reactUsed = true;
      out[outputPath(path)] = rewriteRequires(path, js);
    } else if (/\.html?$/i.test(path)) {
      out[path] = code.replace(/(<script\b[^>]*\bsrc\s*=\s*["'])([^"']+)(["'])/gi, (_w, a: string, src: string, b: string) =>
        /^https?:/i.test(src) ? a + src + b : a + outputPath(src) + b
      );
    } else if (path === 'manifest.json') {
      const parsed = parseManifest(code);
      if (parsed.ok && typeof parsed.value.main === 'string' && isScript(parsed.value.main)) {
        parsed.value.main = outputPath(parsed.value.main);
        out[path] = JSON.stringify(parsed.value, null, 2) + '\n';
      } else {
        out[path] = code;
      }
    } else {
      out[path] = code;
    }
  }
  if (reactUsed) {
    if (!vendorBundle) warnings.push('React is used but the vendor bundle is not available; the plugin will not load.');
    else {
      out['vendor/react-bundle.js'] = vendorBundle;
      Object.assign(out, VENDOR_SHIMS);
    }
  }
  out['PLAYGROUND-README.txt'] = [
    `${p.name} — exported from UXP Playground`,
    '',
    'How to load it:',
    '1. Unzip this archive into a folder.',
    '2. Open the UXP Developer Tool (UDT), choose "Add Plugin" and select manifest.json in that folder.',
    '3. Start your host app, then choose Load in UDT.',
    '',
    'JSX/TypeScript/ES-module files were compiled to plain CommonJS .js files.',
    reactUsed ? 'React 19 is included as vendor/react-bundle.js (production build).' : '',
    'The playground preview was an approximation. Behaviour in the real host can differ.',
    ''
  ].filter((l, i, a) => l !== '' || a[i - 1] !== '').join('\n');
  return { files: out, warnings };
}

export function buildPluginZip(p: Project, vendorBundle: string | null): ExportResult {
  const { files, warnings } = exportFiles(p, vendorBundle);
  const tree: Zippable = {};
  for (const [path, text] of Object.entries(files)) tree[path] = [strToU8(text), { level: 6, mtime: new Date('2026-01-01T00:00:00Z') }];
  const zip = zipSync(tree);
  const m = parseManifest(p.files['manifest.json']).value;
  const fileName = `${slug(m.name || p.name)}-${m.version || '1.0.0'}.zip`;
  return { zip, fileName, files: Object.keys(files).sort(), warnings };
}
