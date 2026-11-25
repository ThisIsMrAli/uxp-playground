import { expect, test } from '@playwright/test';
import { fresh } from './helpers';

test('welcome keeps keyboard focus inside and restores it when reopened', async ({ page }) => {
  await fresh(page, '', { welcome: true });
  const welcome = page.getByTestId('welcome');
  await expect(page.getByTestId('welcome-start')).toBeFocused();
  await welcome.getByRole('button', { name: 'Close welcome' }).focus();
  await page.keyboard.press('Shift+Tab');
  await expect(welcome).toContainText('Examples');
  expect(await page.evaluate(() => !!document.querySelector('[data-testid="welcome"]')?.contains(document.activeElement))).toBe(true);
  await page.keyboard.press('Escape');
  const trigger = page.getByRole('button', { name: 'UXP Playground welcome' });
  await trigger.click();
  await page.keyboard.press('Escape');
  await expect(trigger).toBeFocused();
});

test('palette traps Tab and restores focus, including after a no-results search', async ({ page }) => {
  await fresh(page);
  const trigger = page.getByTestId('palette-button');
  await trigger.click();
  const input = page.getByTestId('palette-input');
  await expect(input).toBeFocused();
  await input.fill('a query with no matching commands 123456');
  await page.keyboard.press('ArrowDown');
  await input.fill('examples');
  await expect(input).toHaveAttribute('aria-activedescendant', /.+/);
  await page.keyboard.press('Tab');
  await expect(input).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(trigger).toBeFocused();
});

test('dialog focuses its field and restores its trigger', async ({ page }) => {
  await fresh(page);
  const trigger = page.getByTestId('import');
  await trigger.click();
  await expect(page.getByTestId('github-input')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(trigger).toBeFocused();
});
