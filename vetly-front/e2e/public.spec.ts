import { expect, test } from '@playwright/test';
import { hasNoHorizontalScroll } from './helpers';

test.describe('home page', () => {
  test('renders the main call to action without horizontal scroll', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('ένα ραντεβού μακριά');
    const cta = page.locator('main').getByRole('link', { name: 'Δημιουργία λογαριασμού' }).first();
    await expect(cta).toBeVisible();
    await expect(cta).toHaveAttribute('href', '/register');
    expect(await hasNoHorizontalScroll(page)).toBe(true);
  });

  test('has no link to a vet list or search', async ({ page }) => {
    await page.goto('/');
    const hrefs = await page.locator('a[href]').evaluateAll((links) =>
      links.map((a) => (a as HTMLAnchorElement).getAttribute('href') ?? ''),
    );
    const directoryLike = hrefs.filter((href) => /^\/(vets|find-vet|search|directory)(\/|\?|#|$)/i.test(href));
    expect(directoryLike).toEqual([]);
    await expect(page.getByRole('searchbox')).toHaveCount(0);
  });

  test('navbar leads to the page for vets', async ({ page }) => {
    await page.goto('/');
    const menuButton = page.getByRole('button', { name: 'Άνοιγμα μενού' });
    if (await menuButton.isVisible()) await menuButton.click();
    await page
      .getByRole('navigation', { name: 'Κύρια πλοήγηση' })
      .getByRole('link', { name: 'Για κτηνιάτρους' })
      .click();
    await expect(page).toHaveURL(/\/for-vets$/);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Το ιατρείο σας');
  });
});

test.describe('for vets', () => {
  test('renders with the demo form and sign-in link and fits the viewport', async ({ page }) => {
    await page.goto('/for-vets');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.locator('main').getByRole('link', { name: 'Κλείστε demo' }).first()).toHaveAttribute('href', '#demo');
    await expect(page.getByLabel('Κτηνιατρείο')).toBeVisible();
    await expect(page.locator('main').getByRole('link', { name: 'Σύνδεση' }).first()).toHaveAttribute(
      'href',
      '/vet/login',
    );
    expect(await hasNoHorizontalScroll(page)).toBe(true);
  });
});

for (const path of ['/terms', '/privacy']) {
  test.describe(path, () => {
    test('shows the draft notice and is noindex', async ({ page, request }) => {
      await page.goto(path);
      await expect(page.getByRole('note')).toContainText('Προσχέδιο');
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      const robots = await page.locator('meta[name="robots"]').getAttribute('content');
      expect(robots).toMatch(/noindex/);
      const response = await request.get(path);
      expect(response.ok()).toBe(true);
    });

    test('fits the viewport', async ({ page }) => {
      await page.goto(path);
      expect(await hasNoHorizontalScroll(page)).toBe(true);
    });
  });
}

test.describe('missing pages', () => {
  test('an unknown URL shows the Greek 404', async ({ page }) => {
    const response = await page.goto('/this-page-does-not-exist');
    expect(response?.status()).toBe(404);
    await expect(page.getByRole('heading', { name: 'Δεν βρήκαμε αυτή τη σελίδα' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Αρχική σελίδα' })).toBeVisible();
  });

  test('there is no vet directory: /vets returns 404', async ({ page }) => {
    const response = await page.goto('/vets');
    expect(response?.status()).toBe(404);
    await expect(page.getByRole('heading', { name: 'Δεν βρήκαμε αυτή τη σελίδα' })).toBeVisible();
  });
});
