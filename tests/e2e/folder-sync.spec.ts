import { expect, test, type Page } from '@playwright/test';
import { fresh } from './helpers';

// Substitute the origin-private filesystem for the OS picker so Chromium still exercises real file handles, permissions and IndexedDB.
async function mockPicker(page: Page) {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'showDirectoryPicker', {
      configurable: true,
      value: async () => (await navigator.storage.getDirectory()).getDirectoryHandle('Premiere review', { create: true })
    });
  });
}

async function fileText(page: Page, name: string) {
  return page.evaluate(async (name) => {
    const folder = await (await navigator.storage.getDirectory()).getDirectoryHandle('Premiere review');
    return (await (await folder.getFileHandle(name)).getFile()).text();
  }, name);
}

async function edit(page: Page, name: string, suffix: string) {
  await page.getByTestId('file-' + name).click();
  await page.evaluate((suffix) => {
    const model = (window as any).__pgEditor.getModel();
    model.setValue(model.getValue() + suffix);
  }, suffix);
}

test('folder sync exports, writes opted-in source edits, flags manifest changes and reconnects', async ({ page }) => {
  await mockPicker(page);
  await fresh(page, '#template=premiere-markers');
  const dialog = page.getByTestId('run-host-dialog');
  await page.getByTestId('run-host').click();
  await dialog.getByRole('button', { name: 'Choose folder and sync' }).click();
  await expect(dialog.getByRole('status')).toContainText(/Synced \d+ files to Premiere review/);
  expect(JSON.parse(await fileText(page, 'manifest.json')).host.app).toBe('premierepro');
  const optIn = dialog.getByRole('checkbox', { name: 'Sync after edits while this project is open' });
  await expect(optIn).not.toBeChecked();
  await optIn.check();
  await page.keyboard.press('Escape');

  await edit(page, 'index.js', '\n// Checked in the Adobe host\n');
  await expect.poll(() => fileText(page, 'index.js')).toContain('Checked in the Adobe host');
  await edit(page, 'manifest.json', '\n ');
  await expect.poll(() => fileText(page, 'manifest.json')).toMatch(/\n $/);
  await page.getByTestId('run-host').click();
  await expect(dialog.getByText('The manifest changed.', { exact: false })).toBeVisible();
  await dialog.getByRole('button', { name: 'Mark reloaded' }).click();
  await expect(dialog.getByText('The manifest changed.', { exact: false })).toHaveCount(0);

  await page.reload();
  await page.getByTestId('run-host').click();
  await dialog.getByRole('button', { name: 'Choose folder and sync' }).click();
  await expect(dialog.getByRole('status')).toContainText(/Synced \d+ files to Premiere review/);
  await expect(optIn).not.toBeChecked();
  await optIn.check();
  await page.keyboard.press('Escape');
  await page.evaluate(() => { location.hash = 'template=premiere-tracks'; });
  await expect(page.getByRole('textbox', { name: 'Project name' })).toHaveValue(/track overview/i);
  await page.getByTestId('run-host').click();
  await expect(dialog.getByRole('button', { name: 'Choose folder and sync' })).toBeVisible();
  expect(await fileText(page, 'index.js')).toContain('Checked in the Adobe host');
});

test('folder sync leaves occupied folders and external changes intact', async ({ page }) => {
  await mockPicker(page);
  await fresh(page, '#template=premiere-markers');
  await page.evaluate(async () => {
    const folder = await (await navigator.storage.getDirectory()).getDirectoryHandle('Premiere review', { create: true });
    const writer = await (await folder.getFileHandle('notes.txt', { create: true })).createWritable();
    await writer.write('User notes');
    await writer.close();
  });
  await page.getByTestId('run-host').click();
  const dialog = page.getByTestId('run-host-dialog');
  const choose = dialog.getByRole('button', { name: 'Choose folder and sync' });
  await choose.click();
  await expect(dialog.getByRole('alert')).toContainText('Choose an empty folder');
  expect(await fileText(page, 'notes.txt')).toBe('User notes');
  await page.evaluate(async () => {
    const folder = await (await navigator.storage.getDirectory()).getDirectoryHandle('Premiere review');
    await folder.removeEntry('notes.txt');
  });
  await choose.click();
  await expect(dialog.getByRole('status')).toContainText('Synced');
  await page.evaluate(async () => {
    const folder = await (await navigator.storage.getDirectory()).getDirectoryHandle('Premiere review');
    const writer = await (await folder.getFileHandle('index.js')).createWritable();
    await writer.write('// Edited by another editor');
    await writer.close();
  });
  await dialog.getByRole('button', { name: 'Sync now' }).click();
  await expect(dialog.getByRole('alert')).toContainText('index.js was changed outside the playground');
  expect(await fileText(page, 'index.js')).toBe('// Edited by another editor');
});
