import { expect, test, type Page } from '@playwright/test';
import { unzipSync, strFromU8 } from 'fflate';
import { readFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const SHOTS = process.env.SCREENSHOT_DIR || resolve('test-results/screenshots');
mkdirSync(SHOTS, { recursive: true });
const shot = (page: Page, name: string) => page.screenshot({ path: resolve(SHOTS, name), fullPage: false });

const frame = (page: Page) => page.frameLocator('iframe[data-testid="preview-frame"]');

const readyRun = (page: Page) => page.getByTestId('preview-col').getAttribute('data-ready-run').then(Number);

/** Waits until the preview iframe has reloaded after `before` and finished booting. */
async function settled(page: Page, before?: number) {
  await expect(page.getByTestId('preview-col')).toHaveAttribute('data-state', 'ready');
  if (before !== undefined) await expect.poll(() => readyRun(page)).toBeGreaterThan(before);
}

async function fresh(page: Page, hash = '') {
  await page.goto('/' + hash);
  await page.evaluate(() => localStorage.clear());
  await page.goto('/' + hash);
  await expect(page.getByTestId('editor').locator('.monaco-editor')).toBeVisible();
  await settled(page);
}

async function loadTemplate(page: Page, id: string) {
  const before = await readyRun(page);
  await page.getByTestId('template').selectOption(id);
  await expect(page.getByTestId('toast')).toContainText('Loaded template');
  await settled(page, before);
}

/** Selects the first occurrence of `text` in the active editor model and types `replacement` with the keyboard. */
async function typeOver(page: Page, file: string, text: string, replacement: string) {
  await page.getByTestId(`file-${file}`).click();
  await page.waitForFunction((f) => (window as any).__pgEditor?.getModel()?.uri.path === '/' + f, file);
  await page.evaluate((t) => {
    const ed = (window as any).__pgEditor;
    const m = ed.getModel();
    const match = m.findMatches(t, false, false, true, null, false)[0];
    ed.setSelection(match.range);
    ed.focus();
  }, text);
  const before = await readyRun(page);
  await page.keyboard.type(replacement);
  await settled(page, before);
}

const modelText = (page: Page, file: string) =>
  page.evaluate((f) => (window as any).__pgMonaco.editor.getModel((window as any).__pgMonaco.Uri.parse('file:///' + f))?.getValue(), file);

test('loads the app with the hello template and an approximate preview', async ({ page }) => {
  await fresh(page);
  await expect(page).toHaveTitle('UXP Playground');
  await expect(page.getByTestId('fidelity-notice')).toContainText('Approximate preview');
  await expect(page.getByTestId('panel-title')).toHaveText('Hello');
  await expect(frame(page).locator('sp-heading')).toHaveText('Hello UXP');
  await expect(page.getByTestId('tab-console')).toContainText('Console (');
  await expect(page.getByTestId('command-sayHello')).toBeVisible();
  await shot(page, '01-hello-template.png');
});

test('typing in the editor updates the live preview', async ({ page }) => {
  await fresh(page);
  await typeOver(page, 'index.html', 'Hello UXP', 'Hi from the editor');
  await expect(frame(page).locator('sp-heading')).toHaveText('Hi from the editor');
  await typeOver(page, 'index.js', 'Hello, ', 'Welcome, ');
  await frame(page).locator('#name input').fill('Ali');
  await frame(page).locator('#greet').click();
  await expect(frame(page).locator('#out')).toHaveText('Welcome, Ali!');
  await expect(page.getByTestId('tab-console')).not.toContainText('(0)');
  await page.getByTestId('tab-console').click();
  await expect(page.getByTestId('panel-console')).toContainText('greeted Ali');
  await shot(page, '02-edit-live-preview.png');
});

test('host alert, commands and host-call log', async ({ page }) => {
  await fresh(page);
  await frame(page).locator('#alert').click();
  await expect(frame(page).locator('.pg-host-alert-msg')).toHaveText('Document: Untitled-1');
  await shot(page, '03-host-alert.png');
  await frame(page).locator('.pg-host-alert button').click();
  await page.getByTestId('command-sayHello').click();
  await expect(frame(page).locator('.pg-host-alert-msg')).toHaveText('Hello from a command!');
  await page.getByTestId('tab-host').click();
  await expect(page.getByTestId('panel-host')).toContainText('photoshop.app.showAlert("Hello from a command!")');
  await expect(page.getByTestId('panel-host')).toContainText('commands.sayHello.run()');
});

test('batchPlay template: modal scope, host calls and lint', async ({ page }) => {
  await fresh(page);
  await loadTemplate(page, 'batchplay-rename');
  await expect(frame(page).locator('#current')).toHaveText('Current layer: Layer 1');
  await frame(page).locator('#newName input').fill('Hero image');
  await frame(page).locator('#rename').click();
  await expect(frame(page).locator('#current')).toHaveText('Current layer: Hero image');
  await frame(page).locator('#unsafe').click();
  await page.getByTestId('tab-console').click();
  await expect(page.getByTestId('panel-console')).toContainText('Such events are only allowed from inside a modal scope');
  await page.getByTestId('tab-host').click();
  await expect(page.getByTestId('panel-host')).toContainText('photoshop.core.executeAsModal({"commandName":"Rename layer"})');
  await expect(page.getByTestId('panel-host')).toContainText('[modal: Rename layer]');
  await shot(page, '04-batchplay-host-calls.png');
  await page.getByTestId('tab-problems').click();
  await expect(page.getByTestId('panel-problems')).toContainText(/modal-scope/);
  await expect(page.getByTestId('lint-engine')).toContainText('ESLint');
  await shot(page, '05-batchplay-problems.png');
});

test('lint panel reacts to edits and shows editor markers', async ({ page }) => {
  await fresh(page);
  await typeOver(page, 'index.js', 'const { app } = require("photoshop");', 'const { app } = require("photoshop");\nundefinedFn();\nfetch("https://api.example.com/x");');
  await page.getByTestId('tab-problems').click();
  await expect(page.getByTestId('panel-problems')).toContainText("'undefinedFn' is not defined");
  await expect(page.getByTestId('panel-problems')).toContainText(/api\.example\.com|network\.domains/);
  await expect(page.locator('.monaco-editor .squiggly-error').first()).toBeVisible();
  await typeOver(page, 'styles.css', 'display: flex;', 'display: grid;');
  await expect(page.getByTestId('panel-problems')).toContainText(/grid/i);
  await shot(page, '06-lint-problems.png');
});

test('theme and size selectors restyle the panel', async ({ page }) => {
  await fresh(page);
  const r0 = await readyRun(page);
  await page.getByTestId('theme').selectOption('lightest');
  await settled(page, r0);
  await expect(frame(page).locator('html')).toHaveAttribute('data-theme', 'lightest');
  const bg = await frame(page).locator('body').evaluate((b) => getComputedStyle(b).backgroundColor);
  expect(bg).toBe('rgb(240, 240, 240)');
  await page.getByTestId('size').selectOption('230x300');
  await expect(page.getByTestId('preview-frame')).toHaveAttribute('style', /width: 230px; height: 300px/);
  await shot(page, '07-lightest-narrow.png');
  await page.getByTestId('theme').selectOption('darkest');
  await expect(frame(page).locator('html')).toHaveAttribute('data-theme', 'darkest');
});

test('share link round-trips the project', async ({ page, context }) => {
  await fresh(page);
  await typeOver(page, 'index.html', 'Hello UXP', 'Shared heading');
  await page.getByTestId('theme').selectOption('light');
  await page.getByTestId('share').click();
  const url = await page.getByTestId('share-url').inputValue();
  expect(url).toContain('#s=');
  const original = await modelText(page, 'index.html');
  await shot(page, '08-share-link.png');
  const other = await context.newPage();
  await other.goto(url);
  await expect(other.getByTestId('toast')).toContainText('Loaded from share link');
  await expect(other.frameLocator('iframe[data-testid="preview-frame"]').locator('sp-heading')).toHaveText('Shared heading');
  await expect(other.getByTestId('theme')).toHaveValue('light');
  expect(await modelText(other, 'index.html')).toBe(original);
});

test('download zip is an installable manifest v5 plugin', async ({ page }) => {
  await fresh(page);
  const [dl] = await Promise.all([page.waitForEvent('download'), page.getByTestId('download-zip').click()]);
  expect(dl.suggestedFilename()).toBe('hello-panel-1.0.0.zip');
  const path = resolve('test-results', dl.suggestedFilename());
  await dl.saveAs(path);
  const files = unzipSync(new Uint8Array(readFileSync(path)));
  const manifest = JSON.parse(strFromU8(files['manifest.json']));
  expect(manifest.manifestVersion).toBe(5);
  expect(manifest.host.app).toBe('PS');
  expect(Object.keys(files)).toEqual(expect.arrayContaining(['manifest.json', 'index.html', 'index.js', 'styles.css']));
  expect(strFromU8(files[manifest.main])).toContain('src="index.js"');
});

test('React template renders, updates and exports with vendored React', async ({ page }) => {
  await fresh(page);
  await loadTemplate(page, 'react');
  await expect(frame(page).locator('sp-detail')).toHaveText('Layers (3)');
  await frame(page).locator('sp-button').click();
  await expect(frame(page).locator('sp-detail')).toHaveText('Layers (4)');
  await expect(frame(page).locator('.item').first()).toHaveText('React layer 1');
  await shot(page, '09-react-template.png');
  const [dl] = await Promise.all([page.waitForEvent('download'), page.getByTestId('download-zip').click()]);
  const path = resolve('test-results', dl.suggestedFilename());
  await dl.saveAs(path);
  const files = unzipSync(new Uint8Array(readFileSync(path)));
  expect(Object.keys(files)).toEqual(expect.arrayContaining(['vendor/react-bundle.js', 'index.js', 'LayerList.js']));
  expect(strFromU8(files['index.js'])).not.toMatch(/<App|<div/);
});

test('file picker template reads a real file via the mocked localFileSystem', async ({ page }) => {
  await fresh(page);
  await loadTemplate(page, 'file-picker');
  const [chooser] = await Promise.all([page.waitForEvent('filechooser'), frame(page).locator('#open').click()]);
  await chooser.setFiles({ name: 'notes.txt', mimeType: 'text/plain', buffer: Buffer.from('Hello from a picked file') });
  await expect(frame(page).locator('#status')).toHaveText('Loaded notes.txt (24 chars)');
  await expect(frame(page).locator('#text textarea')).toHaveValue('Hello from a picked file');
  await frame(page).locator('#save').click();
  await expect(frame(page).locator('#status')).toHaveText('Saved notes.txt');
  await page.getByTestId('tab-host').click();
  await expect(page.getByTestId('panel-host')).toContainText('localFileSystem.getFileForOpening');
  await shot(page, '10-file-picker.png');
  // Remove the permission: the mock must refuse like a v5 manifest without localFileSystem.
  await typeOver(page, 'manifest.json', '"localFileSystem": "request"', '"clipboard": "read"');
  await frame(page).locator('#open').click();
  await expect(frame(page).locator('#status')).toContainText('Permission denied');
});

test('TypeScript intellisense from the Adobe typings', async ({ page }) => {
  await fresh(page);
  await page.getByTestId('file-index.js').click();
  await page.evaluate(() => {
    const ed = (window as any).__pgEditor;
    const m = ed.getModel();
    const line = m.getLineCount() + 1;
    m.applyEdits([{ range: { startLineNumber: line, startColumn: 1, endLineNumber: line, endColumn: 1 }, text: '\nrequire("photoshop").action.' }]);
    ed.setPosition({ lineNumber: m.getLineCount(), column: m.getLineMaxColumn(m.getLineCount()) });
    ed.focus();
  });
  await expect(async () => {
    await page.keyboard.press('Control+Space');
    await expect(page.locator('.suggest-widget .monaco-list-row', { hasText: 'batchPlay' }).first()).toBeVisible({ timeout: 3000 });
  }).toPass({ timeout: 30_000 });
  await shot(page, '11-intellisense.png');
});

test('add a file and require it from index.js', async ({ page }) => {
  await fresh(page);
  await page.getByTestId('add-file').click();
  await page.getByTestId('new-file-name').fill('lib/math.js');
  await page.getByTestId('new-file-name').press('Enter');
  await page.waitForFunction(() => (window as any).__pgEditor?.getModel()?.uri.path === '/lib/math.js');
  const r1 = await readyRun(page);
  await page.evaluate(() => (window as any).__pgEditor.getModel().setValue('exports.double = (n) => n * 2;\n'));
  await settled(page, r1);
  await typeOver(page, 'index.js', 'const text = `Hello, ${name}!`;', 'const text = `Hello, ${name}! x2=${require("./lib/math").double(21)}`;');
  await frame(page).locator('#greet').click();
  await expect(frame(page).locator('#out')).toHaveText('Hello, world! x2=42');
});
