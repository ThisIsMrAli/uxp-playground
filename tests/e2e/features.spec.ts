import { expect, test, type Page } from '@playwright/test';
import { zipSync, strToU8 } from 'fflate';
import { mkdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fresh } from './helpers';

const SHOTS = process.env.HARDENING_SHOTS || resolve('test-results/screenshots');
mkdirSync(SHOTS, { recursive: true });
const shot = (page: Page, name: string) => page.screenshot({ path: resolve(SHOTS, name) });
const frame = (page: Page) => page.frameLocator('iframe[data-testid="preview-frame"]');
const ready = (page: Page) => expect(page.getByTestId('preview-col')).toHaveAttribute('data-state', 'ready');
const examples: { id: string; title: string }[] = JSON.parse(readFileSync(resolve('public/examples/index.json'), 'utf8')).examples;

const manifest = (id: string, name: string) =>
  JSON.stringify({ manifestVersion: 5, id, name, version: '1.0.0', main: 'index.html', host: { app: 'PS', minVersion: '24.0.0' }, entrypoints: [{ type: 'panel', id: 'p', label: { default: name } }] });

test('first run: welcome screen opens a real Adobe sample from the gallery', async ({ page }) => {
  await fresh(page, '', { welcome: true });
  await expect(page.getByTestId('welcome')).toBeVisible();
  await expect(page.getByTestId('welcome').getByTestId('gallery')).toBeVisible();
  await ready(page);
  await shot(page, 'after-01-welcome.png');
  await page.getByTestId('welcome').getByTestId('example-hello-world-panel').click();
  await expect(page.getByTestId('welcome')).toHaveCount(0);
  await expect(page.getByTestId('toast')).toContainText('Opened example: Hello World panel');
  await ready(page);
  await expect(page.getByTestId('preview-col')).toHaveAttribute('data-errors', '0');
  await page.getByTestId('share').click();
  await expect(page.getByTestId('origin-url')).toHaveValue(/#example=hello-world-panel$/);
  await page.keyboard.press('Escape');
  // Dismissed for good.
  await page.reload();
  await expect(page.getByTestId('editor')).toBeVisible();
  await expect(page.getByTestId('welcome')).toHaveCount(0);
});

for (const ex of examples) {
  test(`gallery example "${ex.id}" loads from its link and runs without runtime errors`, async ({ page }) => {
    await fresh(page, '#example=' + ex.id);
    await expect(page.getByTestId('toast')).toContainText(`Opened example: ${ex.title}`);
    await ready(page);
    await page.waitForTimeout(400);
    // ui-react-starter and typescript-webpack need their bundler for the full UI; they load with a banner instead of crashing.
    const errors = Number(await page.getByTestId('preview-col').getAttribute('data-errors'));
    expect(errors, ex.id).toBe(0);
  });
}

const hostStarters = [
  ['ID', 'indesign-pages', 'Mock Layout.indd · 3 pages'],
  ['premierepro', 'premiere-sequence', 'Mock Project.prproj · Sequence 01'],
  ['ame', 'media-encoder-queue', 'Queue stopped'],
  ['aftereffects', 'after-effects-project', '3 project items · Mock Composition']
];

for (const [host, id, summary] of hostStarters) {
  test(`host starter ${id} renders and reads sample data`, async ({ page }) => {
    await fresh(page, '#template=' + id);
    await expect(page.getByTestId('host')).toHaveValue(host);
    await frame(page).locator('#refresh').click();
    await expect(frame(page).locator('#summary')).toHaveText(summary);
    await expect(page.getByTestId('preview-col')).toHaveAttribute('data-errors', '0');
  });
}

test('host gallery, shared starter link and native export agree on the manifest host', async ({ page }) => {
  await fresh(page);
  await page.getByTestId('examples').click();
  const gallery = page.getByTestId('gallery-dialog');
  await gallery.getByRole('combobox', { name: 'Example host' }).selectOption('premierepro');
  await expect(gallery.getByTestId('template-premiere-sequence')).toBeVisible();
  await expect(gallery.getByTestId('example-hello-world-panel')).toHaveCount(0);
  await gallery.getByTestId('template-file-picker').click();
  await expect(page.getByTestId('host')).toHaveValue('premierepro');
  await page.getByTestId('share').click();
  await expect(page.getByTestId('origin-url')).toHaveValue(/#template=file-picker&host=premierepro$/);
  await page.keyboard.press('Escape');
  await page.getByTestId('host').selectOption('PS');
  await page.getByTestId('run-host').click();
  const guide = page.getByTestId('run-host-dialog');
  await expect(guide.getByText('Premiere Pro 25.6.0 or later')).toBeVisible();
  await expect(guide.getByText('Window → UXP Plugins')).toBeVisible();
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    guide.getByTestId('host-download-zip').click()
  ]);
  expect(download.suggestedFilename()).toBe('file-picker-1.0.0.zip');
  await page.evaluate(() => { location.hash = 'template=file-picker&host=ID'; });
  await expect(page.getByTestId('host')).toHaveValue('ID');
});

test('workbench: batchPlay inspector explains descriptors and generates code', async ({ page }) => {
  await fresh(page);
  await page.getByTestId('examples').click();
  await page.getByTestId('gallery-dialog').getByTestId('template-batchplay-rename').click();
  await ready(page);
  await frame(page).locator('#newName input').fill('Hero image');
  await frame(page).locator('#rename').click();
  await expect(frame(page).locator('#current')).toHaveText('Current layer: Hero image');
  await page.getByTestId('tab-host').click();
  const bpRow = page.getByTestId('panel-host').locator('.call-row', { hasText: 'set → the selected/active layer' }).first();
  await expect(bpRow).toBeVisible();
  await bpRow.click();
  await expect(page.getByTestId('batchplay-inspector')).toBeVisible();
  await shot(page, 'after-03-batchplay-inspector.png');
  await page.getByTestId('bp-rerun').click();
  await expect(page.getByTestId('panel-host').locator('.call-row', { hasText: 'batchPlay' })).not.toHaveCount(1);
});

test('dark and light app themes', async ({ page }) => {
  await fresh(page);
  await page.getByTestId('tab-problems').click();
  if ((await page.locator('html').getAttribute('data-app-theme')) !== 'dark') await page.getByTestId('app-theme').click();
  await expect(page.locator('html')).toHaveAttribute('data-app-theme', 'dark');
  await page.waitForTimeout(300);
  await shot(page, 'after-02-workbench-dark.png');
  await page.getByTestId('app-theme').click();
  await expect(page.locator('html')).toHaveAttribute('data-app-theme', 'light');
  await page.waitForTimeout(300);
  await shot(page, 'after-04-workbench-light.png');
});

test('command palette runs commands and opens files', async ({ page }) => {
  await fresh(page);
  await page.keyboard.press('Control+Shift+P');
  await expect(page.getByTestId('palette')).toBeVisible();
  await page.getByTestId('palette-input').fill('examples');
  await shot(page, 'after-05-command-palette.png');
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('gallery-dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await page.keyboard.press('Control+P');
  await page.getByTestId('palette-input').fill('styles');
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => (window as any).__pgEditor?.getModel()?.uri.path === '/styles.css');
});

test('share dialog: link meter and embed snippet', async ({ page }) => {
  await fresh(page);
  await page.getByTestId('share').click();
  await expect(page.getByTestId('share-dialog')).toBeVisible();
  await expect(page.getByTestId('share-status')).toBeVisible();
  await expect(page.getByTestId('share-url')).toHaveValue(/#s=/);
  await expect(page.getByTestId('embed-code')).toHaveValue(/<iframe[^>]+embed=1/);
  await shot(page, 'after-06-share-embed.png');
});

test('embed mode for docs pages: read-only, preview + editor, open in playground', async ({ page }) => {
  await page.setViewportSize({ width: 1100, height: 520 });
  await page.goto('/?embed=1&readonly=1&theme=light#example=hello-world-panel');
  await expect(page.getByTestId('embed')).toBeVisible();
  // The starter never runs while the linked example loads.
  await expect(page.getByTestId('panel-title')).toHaveText('Hello World Sample');
  await ready(page);
  await expect(frame(page).locator('body')).not.toContainText('Hello UXP');
  await expect(page.getByTestId('editor').locator('.view-line').first()).toBeVisible();
  await expect(page.getByTestId('open-in-playground')).toHaveAttribute('href', /#s=/);
  await expect(frame(page).locator('body')).toBeVisible();
  // Embeds never write to the reader's storage.
  expect(await page.evaluate(() => localStorage.getItem('uxp-playground:last'))).toBeNull();
  await shot(page, 'after-07-embed.png');
  const p2 = await page.context().newPage();
  await p2.setViewportSize({ width: 600, height: 420 });
  await p2.goto('/?embed=1&view=preview#template=hello');
  await expect(p2.getByTestId('embed')).toBeVisible();
  await expect(p2.getByTestId('editor')).toHaveCount(0);
});

test('postMessage API: a docs page can load and run a project in the embed', async ({ page, baseURL }) => {
  await page.route('http://127.0.0.1:4310/host-page.html', (r) => r.fulfill({ contentType: 'text/html', body: `<!doctype html><body>
    <script>
      window.got = [];
      window.addEventListener('message', (e) => window.got.push(e.data));
    </script>
    <iframe id="pg" src="${baseURL}?embed=1#template=hello" width="1000" height="500"></iframe></body>` }));
  await page.goto('/host-page.html');
  await expect.poll(() => page.evaluate(() => (window as any).got.some((m: any) => m?.type === 'uxp-playground:ready'))).toBe(true);
  await page.evaluate((m) => {
    (window as any).got = [];
    (document.getElementById('pg') as HTMLIFrameElement).contentWindow!.postMessage({ type: 'uxp-playground:load', name: 'Posted', files: { 'manifest.json': m, 'index.html': '<h1 id="t">Posted</h1>' } }, '*');
  }, manifest('posted', 'Posted'));
  await expect.poll(() => page.evaluate(() => (window as any).got.find((m: any) => m?.type === 'uxp-playground:ran')), { timeout: 20_000 }).toBeTruthy();
  await expect(page.frameLocator('#pg').frameLocator('iframe[data-testid="preview-frame"]').locator('#t')).toHaveText('Posted');
});

test('import: GitHub monorepo asks which plugin, then downloads only that one', async ({ page }) => {
  const files: Record<string, string> = {
    'plugins/one/manifest.json': manifest('one', 'One'),
    'plugins/one/index.html': '<sp-heading id="h">Plugin one</sp-heading>',
    'plugins/two/manifest.json': manifest('two', 'Two'),
    'plugins/two/index.html': '<sp-heading id="h">Plugin two</sp-heading>'
  };
  const fetched: string[] = [];
  await page.route('https://api.github.com/**', (r) => {
    const u = r.request().url();
    if (u.endsWith('/repos/acme/mono')) return r.fulfill({ json: { default_branch: 'main' } });
    if (u.includes('/git/trees/')) return r.fulfill({ json: { truncated: false, tree: Object.keys(files).map((path) => ({ path, type: 'blob', size: files[path].length })) } });
    return r.fulfill({ status: 404, json: { message: 'Not Found' } });
  });
  await page.route('https://raw.githubusercontent.com/**', (r) => {
    const path = decodeURIComponent(new URL(r.request().url()).pathname.split('/').slice(4).join('/'));
    fetched.push(path);
    return r.fulfill({ body: files[path] ?? '', status: files[path] != null ? 200 : 404 });
  });
  await fresh(page);
  await page.getByTestId('import').click();
  await page.getByTestId('import-tab-github').click();
  await page.getByTestId('github-input').fill('https://github.com/acme/mono');
  await page.getByTestId('github-import').click();
  await expect(page.getByTestId('import-candidates')).toContainText('plugins/two');
  await shot(page, 'after-08-github-import.png');
  await page.getByTestId('import-candidates').getByText('plugins/two').click();
  await expect(page.getByTestId('toast')).toContainText('from GitHub');
  await expect(frame(page).locator('#h')).toHaveText('Plugin two');
  expect(fetched.every((f) => f.startsWith('plugins/two/'))).toBe(true);
});

test('import: zip with the plugin in a subfolder, and a clear error for a non-plugin zip', async ({ page }) => {
  await fresh(page);
  const zip = zipSync({ 'my-plugin/manifest.json': strToU8(manifest('z', 'Zipped')), 'my-plugin/index.html': strToU8('<p id="z">from zip</p>') });
  await page.getByTestId('import').click();
  await page.getByTestId('import-tab-zip').click();
  await page.getByTestId('zip-file').setInputFiles({ name: 'my-plugin.zip', mimeType: 'application/zip', buffer: Buffer.from(zip) });
  await expect(frame(page).locator('#z')).toHaveText('from zip');
  await page.getByTestId('import').click();
  await page.getByTestId('import-tab-zip').click();
  await page.getByTestId('zip-file').setInputFiles({ name: 'notes.zip', mimeType: 'application/zip', buffer: Buffer.from(zipSync({ 'readme.txt': strToU8('hi') })) });
  await expect(page.getByTestId('import-error')).toContainText(/manifest\.json/);
});

test('responsive: phone layout switches between code, preview and output', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await fresh(page);
  await page.locator('.mobile-tabs').getByRole('button', { name: /Preview/ }).click();
  await ready(page);
  await expect(frame(page).locator('sp-heading')).toHaveText('Hello UXP');
  await shot(page, 'after-09-mobile-preview.png');
  await page.locator('.mobile-tabs').getByRole('button', { name: /Code/ }).click();
  await expect(page.getByTestId('editor')).toBeVisible();
});

test('the first paint does not load Monaco or the TypeScript worker', async ({ page }) => {
  const scripts: string[] = [];
  page.on('request', (r) => r.resourceType() === 'script' && scripts.push(r.url()));
  await page.goto('/?embed=1&view=preview#template=hello');
  await ready(page);
  expect(scripts.some((s) => /ts\.worker|editor\.api/.test(s))).toBe(false);
});
