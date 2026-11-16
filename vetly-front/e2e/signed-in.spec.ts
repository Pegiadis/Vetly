import { expect, test, type BrowserContext, type Page } from '@playwright/test';
import { blockEmailSendingApi, envPair, signInThroughForm } from './helpers';

/*
 * Read-only flows for real accounts. They run only when the credentials are
 * in the environment, only in the desktop project, and sign in once per role
 * to stay under the backend's login rate limit. Nothing here submits a
 * booking, invite, registration or reset request.
 */

const apiBase = process.env.E2E_API_URL ?? 'http://localhost:8000/api/v1';

const owner = envPair('OWNER');
const vet = envPair('VET');

test.describe('owner, signed in', () => {
  test.skip(!owner, 'set E2E_OWNER_EMAIL and E2E_OWNER_PASSWORD to run the signed-in owner flow');
  test.skip(({ isMobile }) => isMobile, 'signed-in flows run in the desktop project only');
  test.describe.configure({ mode: 'serial' });

  let context: BrowserContext;
  let page: Page;
  let emailCalls: string[];

  test.beforeAll(async ({ browser }, testInfo) => {
    // Skipped projects must not spend sign-in attempts: the API allows 10 per minute.
    if (testInfo.project.name === 'phone') return;
    if (!owner) return;
    context = await browser.newContext({ locale: 'el-GR' });
    page = await context.newPage();
    emailCalls = await blockEmailSendingApi(page);
    await signInThroughForm(page, '/owner/login', '/owner/dashboard', owner);
  });

  test.afterAll(async () => {
    await context?.close();
  });

  test('sees the home page', async () => {
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByText('Τα κατοικίδιά μου').first()).toBeVisible();
  });

  test('opens Κατοικίδια', async () => {
    await page.getByRole('navigation', { name: 'Μενού ιδιοκτήτη' }).getByRole('link', { name: 'Κατοικίδια' }).click();
    await expect(page).toHaveURL(/\/owner\/pets/);
    await expect(page.getByRole('heading', { name: 'Τα κατοικίδιά μου' })).toBeVisible();
  });

  test('opens Ραντεβού', async () => {
    await page.getByRole('navigation', { name: 'Μενού ιδιοκτήτη' }).getByRole('link', { name: 'Ραντεβού' }).click();
    await expect(page).toHaveURL(/\/owner\/appointments/);
    await expect(page.getByRole('heading', { name: 'Ραντεβού', exact: true })).toBeVisible();
  });

  test('the booking link from a vet profile preselects that vet', async () => {
    // There is no public list, so ask the API (as the signed-in owner) for a vet id.
    const token = await page.evaluate(() => localStorage.getItem('vetly_token_pet_owner'));
    expect(token, 'owner token in localStorage').toBeTruthy();
    const list = await page.request.get(`${apiBase}/public/vets?page_size=1`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(list.ok()).toBe(true);
    const first = (await list.json()).items?.[0] as { id: string; name: string } | undefined;
    test.skip(!first, 'no vet exists in this database to book with');

    // The public profile page is reachable by link without signing in.
    const profile = await page.request.get(`/vets/${first!.id}`);
    expect(profile.ok()).toBe(true);

    await page.goto(`/owner/book?vet=${first!.id}`);
    await expect(page.getByRole('heading', { name: 'Κράτηση ραντεβού' })).toBeVisible();
    await expect(page.locator('[role="alert"]:not(#__next-route-announcer__)')).toHaveCount(0);

    // The vet shows up on step 2, after a pet is chosen on step 1.
    const petButtons = page.locator('button[aria-pressed]');
    await page.getByRole('heading', { name: 'Κατοικίδια' }).first().waitFor();
    await expect(petButtons.first().or(page.getByText('Πρόσθεσε πρώτα το κατοικίδιό σου.'))).toBeVisible();
    test.skip((await petButtons.count()) === 0, 'this owner has no pet, so step 2 cannot be reached');
    await petButtons.first().click();
    await page.getByRole('button', { name: 'Συνέχεια' }).click();
    await expect(page.getByText(first!.name, { exact: false }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Άλλος κτηνίατρος' })).toBeVisible();
    // Stop here: the request is never submitted.
    expect(emailCalls).toEqual([]);
  });

  test('signing out returns to the login page', async () => {
    await page.goto('/owner/dashboard');
    await page.getByRole('button', { name: 'Αποσύνδεση' }).first().click();
    await expect(page).toHaveURL(/\/owner\/login|\/$/);
    await page.goto('/owner/dashboard');
    await expect(page).toHaveURL(/\/owner\/login/);
  });
});

test.describe('vet, signed in', () => {
  test.skip(!vet, 'set E2E_VET_EMAIL and E2E_VET_PASSWORD to run the signed-in vet flow');
  test.skip(({ isMobile }) => isMobile, 'signed-in flows run in the desktop project only');
  test.describe.configure({ mode: 'serial' });

  let context: BrowserContext;
  let page: Page;

  test.beforeAll(async ({ browser }, testInfo) => {
    // Skipped projects must not spend sign-in attempts: the API allows 10 per minute.
    if (testInfo.project.name === 'phone') return;
    if (!vet) return;
    context = await browser.newContext({ locale: 'el-GR' });
    page = await context.newPage();
    await blockEmailSendingApi(page);
    await signInThroughForm(page, '/vet/login', '/vet/dashboard', vet);
  });

  test.afterAll(async () => {
    await context?.close();
  });

  test("sees today's schedule", async () => {
    await expect(page.getByText(/Σήμερα στο κτηνιατρείο/)).toBeVisible();
  });

  test('opens Ασθενείς', async () => {
    await page.getByRole('link', { name: 'Ασθενείς', exact: true }).first().click();
    await expect(page).toHaveURL(/\/vet\/patients/);
    await expect(page.getByRole('heading', { name: 'Ασθενείς', exact: true })).toBeVisible();
  });

  test('opens Ρυθμίσεις and sees the Ασφάλεια section', async () => {
    await page.getByRole('link', { name: 'Ρυθμίσεις', exact: true }).first().click();
    await expect(page).toHaveURL(/\/vet\/settings/);
    await expect(page.getByRole('heading', { name: 'Ασφάλεια' })).toBeVisible();
  });

  test('signing out returns to the login page', async () => {
    await page.goto('/vet/dashboard');
    await page.getByRole('button', { name: 'Αποσύνδεση' }).first().click();
    await expect(page).toHaveURL(/\/vet\/login|\/$/);
    await page.goto('/vet/dashboard');
    await expect(page).toHaveURL(/\/vet\/login/);
  });
});
