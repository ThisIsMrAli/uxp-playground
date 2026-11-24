#!/usr/bin/env node
/**
 * Snapshots curated plugins from Adobe's uxp-photoshop-plugin-samples into public/examples/ for the gallery.
 * Usage: node scripts/build-examples.mjs <path to a clone of AdobeDocs/uxp-photoshop-plugin-samples>
 * Each example keeps its LICENSE file (or the repository LICENSE) and records the source commit.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { extname, join, relative } from 'node:path';

const repo = process.argv[2];
if (!repo || !existsSync(join(repo, 'LICENSE'))) {
  console.error('usage: node scripts/build-examples.mjs <uxp-photoshop-plugin-samples clone>');
  process.exit(1);
}
const commit = execFileSync('git', ['-C', repo, 'rev-parse', 'HEAD']).toString().trim();
const OUT = join(import.meta.dirname, '..', 'public', 'examples');
mkdirSync(OUT, { recursive: true });

/** Curated: plugins that load without a bundler or a local server. Descriptions are from each sample's README and code. */
const EXAMPLES = [
  { dir: 'hello-world-panel-js-sample', title: 'Hello World panel', category: 'Basics', tags: ['panel', 'DOM', 'showAlert'], description: 'Lists the layer names of the active document in a panel and shows an alert. Adobe\'s smallest panel sample.' },
  { dir: 'vanilla-js-sample', title: 'Vanilla JS starter', category: 'Basics', tags: ['events', 'executeAsModal', 'DOM'], description: 'Tracks open documents with action.addNotificationListener and changes them inside core.executeAsModal.' },
  { dir: 'layer-creation-js-sample', title: 'Layer creation', category: 'Photoshop', tags: ['text layer', 'batchPlay', 'file picker'], description: 'Creates a text layer from a text field or from a file you pick.' },
  { dir: 'direct-action-js-sample', title: 'Menu command (no panel)', category: 'Commands', tags: ['command', 'headless', 'file system'], description: 'A plugin with only a menu command: writes the layer names of the active document to a file.' },
  { dir: 'invisible-plugin-sample', title: 'Invisible plugin', category: 'Commands', tags: ['headless', 'plugin.create'], description: 'No UI and no menu items: shows an alert from entrypoints.setup plugin.create().' },
  { dir: 'ui-kitchen-sink', title: 'Spectrum UI kitchen sink', category: 'UI', tags: ['Spectrum', 'sp-*', 'widgets'], description: 'Every Spectrum UXP widget on one panel: buttons, fields, pickers, sliders, menus, radios and more.' },
  { dir: 'secure-storage-sample', title: 'Secure storage', category: 'Storage', tags: ['secureStorage', 'uxp.storage'], description: 'Stores and reads a value with the secureStorage API.' },
  { dir: 'web-service-call-js-sample', title: 'Web service call', category: 'Network', tags: ['fetch', 'network permission', 'text layer'], description: 'Fetches a weather forecast from weather.gov and writes it to a text layer.' },
  { dir: 'ui-react-starter', title: 'React starter', category: 'Frameworks', tags: ['React', 'JSX', 'panels + command'], description: 'Two panels and a dialog command written in React. Runs from source here; the original builds with webpack.' },
  { dir: 'typescript-webpack-sample', title: 'TypeScript starter', category: 'Frameworks', tags: ['TypeScript', '@types/photoshop'], description: 'TypeScript with the @types/photoshop definitions. Runs from source here; the original builds with webpack.' }
];

const SKIP_DIR = /^(node_modules|\.git|dist|build|_imgs|server)$/;
const SKIP_FILE = /(^|\/)(yarn\.lock|package-lock\.json|\.DS_Store|watch\.sh|\.gitignore)$/;
const TEXT = new Set(['.js', '.jsx', '.ts', '.tsx', '.json', '.html', '.htm', '.css', '.md', '.txt', '.svg', '.mjs', '.cjs', '']);
const MIME = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.webp': 'image/webp' };
const MAX_BINARY = 256 * 1024;

function walk(dir, base = dir, out = {}) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const rel = relative(base, full).split('\\').join('/');
    if (statSync(full).isDirectory()) {
      if (!SKIP_DIR.test(name)) walk(full, base, out);
      continue;
    }
    if (SKIP_FILE.test(rel)) continue;
    const ext = extname(name).toLowerCase();
    if (TEXT.has(ext) || name === 'LICENSE') out[rel] = readFileSync(full, 'utf8');
    else if (MIME[ext] && statSync(full).size <= MAX_BINARY) out[rel] = `data:${MIME[ext]};base64,` + readFileSync(full).toString('base64');
  }
  return out;
}

const repoLicense = readFileSync(join(repo, 'LICENSE'), 'utf8');
const index = [];
for (const ex of EXAMPLES) {
  const dir = join(repo, ex.dir);
  if (!existsSync(dir)) throw new Error('missing sample ' + ex.dir);
  const files = walk(dir);
  const license = files.LICENSE ? (/Apache License/.test(files.LICENSE) ? 'Apache-2.0' : 'see LICENSE') : 'MIT';
  if (!files.LICENSE) files.LICENSE = repoLicense;
  const id = ex.dir.replace(/-(js-)?sample$/, '').replace(/-example$/, '');
  const url = `https://github.com/AdobeDocs/uxp-photoshop-plugin-samples/tree/${commit.slice(0, 7)}/${ex.dir}`;
  files['SOURCE.md'] = `# ${ex.title}\n\nFrom Adobe's [uxp-photoshop-plugin-samples](${url}) (\`${ex.dir}\`, commit ${commit.slice(0, 7)}), ${license} license; see LICENSE.\nnode_modules, lock files and build output are not included.\n`;
  writeFileSync(join(OUT, id + '.json'), JSON.stringify({ id, files }));
  index.push({ id, title: ex.title, description: ex.description, category: ex.category, tags: ex.tags, file: id + '.json', origin: { repo: 'AdobeDocs/uxp-photoshop-plugin-samples', path: ex.dir, commit, license, url } });
  console.log(id.padEnd(28), Object.keys(files).length, 'files', license);
}
writeFileSync(
  join(OUT, 'index.json'),
  JSON.stringify({ generated: new Date().toISOString().slice(0, 10), source: `Examples are Adobe's samples from github.com/AdobeDocs/uxp-photoshop-plugin-samples (commit ${commit.slice(0, 7)}), kept under their MIT/Apache-2.0 licenses.`, examples: index }, null, 1) + '\n'
);
