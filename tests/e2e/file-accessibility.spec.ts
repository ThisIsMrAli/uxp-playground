import { expect, test } from '@playwright/test';
import { fresh } from './helpers';

test('file browser exposes ordinary keyboard controls and preserves localized manifest names', async ({ page }) => {
  await fresh(page);
  await page.evaluate(() => {
    const api = (window as any).uxpPlayground;
    const project = api.getProject();
    const manifest = JSON.parse(project.files['manifest.json']);
    manifest.name = { default: 'English', fr: 'Français' };
    api.importFiles({ ...project.files, 'manifest.json': JSON.stringify(manifest), 'nested/helper.js': '// helper' });
  });
  const folder = page.getByRole('button', { name: 'Folder nested' });
  await expect(folder).toHaveAttribute('aria-expanded', 'true');
  await expect(page.getByRole('button', { name: 'nested/helper.js' })).toBeVisible();
  await folder.focus();
  await page.keyboard.press('Enter');
  await expect(folder).toHaveAttribute('aria-expanded', 'false');
  await expect(page.getByRole('button', { name: 'nested/helper.js' })).toHaveCount(0);
  await page.getByTestId('tab-manifest').click();
  await page.getByTestId('manifest-panel').getByLabel('name', { exact: true }).fill('Updated');
  const name = await page.evaluate(() => JSON.parse((window as any).uxpPlayground.getProject().files['manifest.json']).name);
  expect(name).toEqual({ default: 'Updated', fr: 'Français' });
});
