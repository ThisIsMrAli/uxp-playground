import { expect, type Page } from '@playwright/test';

export const readyRun = (page: Page) => page.getByTestId('preview-col').getAttribute('data-ready-run').then(Number);

/** Waits until the preview iframe has reloaded after `before` and finished booting. */
export async function settled(page: Page, before?: number) {
  await expect(page.getByTestId('preview-col')).toHaveAttribute('data-state', 'ready');
  if (before !== undefined) await expect.poll(() => readyRun(page)).toBeGreaterThan(before);
}

export async function fresh(page: Page, hash = '', opts: { welcome?: boolean } = {}) {
  await page.goto('/' + hash);
  await page.evaluate((w) => {
    localStorage.clear();
    if (!w) localStorage.setItem('uxp-playground:ui', JSON.stringify({ seenWelcome: true }));
  }, !!opts.welcome);
  await page.goto('/' + hash);
  if (opts.welcome) return;
  await expect(page.getByTestId('editor').locator('.monaco-editor')).toBeVisible();
  // Regression: a nested editor host once collapsed Monaco to 5px.
  expect((await page.getByTestId('editor').locator('.monaco-editor').boundingBox())!.height).toBeGreaterThan(100);
  await settled(page);
}

