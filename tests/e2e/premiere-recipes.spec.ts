import { expect, test } from '@playwright/test';

test('Premiere marker export uses the selected fixture and writes the CSV to Console', async ({ page }) => {
  await page.goto('/#template=premiere-marker-csv');
  const frame = page.frameLocator('[data-testid="preview-frame"]');
  const mockData = page.getByRole('combobox', { name: 'Mock data' });
  await page.getByRole('button', { name: 'Recipe guide' }).click();
  await expect(page.getByTestId('recipe-guide')).toContainText('Expected result with the sample data');
  await page.keyboard.press('Escape');

  await frame.locator('#preview').click();
  await expect(frame.locator('#output')).toContainText('23.500,"Review cut"');
  await frame.locator('#save').click();
  await expect(frame.locator('#status')).toHaveText('Saved review-markers.csv.');
  await page.getByTestId('tab-console').click();
  await expect(page.getByTestId('panel-console')).toContainText('seconds,name,comments');

  await mockData.selectOption('empty-sequence');
  await expect(frame.locator('#status')).toHaveText('');
  await frame.locator('#preview').click();
  await expect(frame.locator('#status')).toHaveText('No sequence markers to export.');
  await mockData.selectOption('no-active-sequence');
  await expect(frame.locator('#status')).toHaveText('');
  await frame.locator('#preview').click();
  await expect(frame.locator('#status')).toHaveText('Open a sequence first.');
});

test('Premiere review notes and bin recipes apply edits to their mock project', async ({ page }) => {
  const frame = page.frameLocator('[data-testid="preview-frame"]');
  await page.goto('/#template=premiere-review-notes');
  await frame.locator('#preview').click();
  await expect(frame.locator('#output')).toContainText('3.000 s · Check lower third');
  await frame.locator('#apply').click();
  await expect(frame.locator('#status')).toHaveText('Added 2 sequence markers.');

  await page.goto('/#template=premiere-organize-bins');
  await expect(frame.locator('#apply')).toBeDisabled();
  await frame.locator('#preview').click();
  await expect(frame.locator('#output')).toContainText('Title still.png → Stills');
  await frame.locator('#apply').click();
  await expect(frame.locator('#status')).toHaveText('Moved 3 items.');
});
