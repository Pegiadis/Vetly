import { expect, test, type Page } from '@playwright/test';
import { blockRegistrationApi, formAlert, hasNoHorizontalScroll } from './helpers';

const NO_SUCH_ACCOUNT = { email: 'e2e-no-such-account@example.com', password: 'wrong-password-123' };

// Vets do not register themselves: they ask for a demo and the team creates the account.
const roles = [
  { name: 'owner', login: '/owner/login', register: '/register', dashboard: '/owner/dashboard' },
  { name: 'vet', login: '/vet/login', register: null, dashboard: '/vet/dashboard' },
] as const;

/** Fills every registration field except the consent checkbox. */
async function fillRegistration(page: Page, password: string) {
  await page.locator('input[name="name"]').fill('E2E Test');
  await page.locator('input[name="email"]').fill('e2e-never-sent@example.com');
  await page.locator('input[name="password"]').fill(password);
  await page.locator('input[name="confirmPassword"]').fill(password);
}

for (const role of roles) {
  test.describe(`${role.name} login`, () => {
    test('renders and fits the viewport', async ({ page }) => {
      await page.goto(role.login);
      await expect(page.getByLabel('Email')).toBeVisible();
      await expect(page.getByLabel('Κωδικός', { exact: true })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Είσοδος' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Ξεχάσατε τον κωδικό;' })).toBeVisible();
      expect(await hasNoHorizontalScroll(page)).toBe(true);
    });

    if (role.register) test('keeps ?next= in the link to register', async ({ page }) => {
      const next = '/owner/book?vet=abc';
      await page.goto(`${role.login}?next=${encodeURIComponent(next)}`);
      const link = page.getByRole('link', { name: /Δημιουργία λογαριασμού|Εγγραφή/ }).first();
      await expect(link).toHaveAttribute('href', `${role.register}?next=${encodeURIComponent(next)}`);
    });

    if (role.register) test('drops an unsafe ?next= from the link to register', async ({ page }) => {
      await page.goto(`${role.login}?next=${encodeURIComponent('//evil.example')}`);
      const link = page.getByRole('link', { name: /Δημιουργία λογαριασμού|Εγγραφή/ }).first();
      await expect(link).toHaveAttribute('href', role.register);
    });

    test('shows a Greek error for wrong credentials', async ({ page }, testInfo) => {
      // The backend allows 10 logins per minute per address: one attempt, desktop only.
      test.skip(testInfo.project.name !== 'desktop', 'one failed login per run to stay under the login rate limit');
      await page.goto(role.login);
      await page.getByLabel('Email').fill(NO_SUCH_ACCOUNT.email);
      await page.getByLabel('Κωδικός', { exact: true }).fill(NO_SUCH_ACCOUNT.password);
      await page.getByRole('button', { name: 'Είσοδος' }).click();
      const alert = formAlert(page);
      await expect(alert).toBeVisible();
      await expect(alert).toContainText(/[Α-Ωα-ω]/);
      await expect(alert).not.toContainText('Δεν ήταν δυνατή η σύνδεση με τον διακομιστή'); // that text means the API was unreachable
      await expect(page).toHaveURL(new RegExp(`${role.login}$`));
    });
  });

  if (role.register) test.describe(`${role.name} registration form`, () => {
    test('blocks submit until the consent checkbox is ticked', async ({ page }) => {
      const calls = await blockRegistrationApi(page);
      await page.goto(role.register!);
      await fillRegistration(page, 'valid-password-1');
      await expect(page.locator('input[name="acceptTerms"]')).not.toBeChecked();
      await page.getByRole('button', { name: 'Δημιουργία λογαριασμού' }).click();
      await expect(formAlert(page)).toContainText('Όρους Χρήσης');
      expect(calls).toEqual([]);
    });

    test('blocks submit while the password is shorter than 8 characters', async ({ page }) => {
      const calls = await blockRegistrationApi(page);
      await page.goto(role.register!);
      await fillRegistration(page, 'short7!');
      await expect(page.getByText('Τουλάχιστον 8 χαρακτήρες.')).toBeVisible();
      await page.getByRole('button', { name: 'Δημιουργία λογαριασμού' }).click();
      // The browser's own minLength validation or the form's check stops it; either way no request.
      await expect(page).toHaveURL(new RegExp(`${role.register}$`));
      expect(calls).toEqual([]);
    });

    test('links to the terms and privacy pages', async ({ page }) => {
      await page.goto(role.register!);
      await expect(page.getByRole('link', { name: 'Όρους Χρήσης' })).toHaveAttribute('href', '/terms');
      await expect(page.getByRole('link', { name: 'Πολιτική Απορρήτου' })).toHaveAttribute('href', '/privacy');
    });
  });

  test(`anonymous visitors to the ${role.name} dashboard are sent to the login page`, async ({ page }) => {
    await page.goto(role.dashboard);
    await expect(page).toHaveURL(new RegExp(`${role.login}`));
    await expect(page.getByRole('button', { name: 'Είσοδος' })).toBeVisible();
  });
}

test('vet login points new clinics to the demo form', async ({ page }) => {
  await page.goto('/vet/login');
  await expect(page.getByRole('link', { name: 'Κλείστε demo' })).toHaveAttribute('href', '/for-vets#demo');
});

test('the old vet registration page sends visitors to the demo form', async ({ page }) => {
  await page.goto('/vet/register');
  await expect(page).toHaveURL(/\/for-vets#demo$/);
  await expect(page.getByRole('button', { name: 'Κλείστε demo' })).toBeVisible();
});

test('anonymous visitors to other protected pages are sent to the right login', async ({ page }) => {
  await page.goto('/owner/appointments');
  await expect(page).toHaveURL(/\/owner\/login/);
  await page.goto('/vet/patients');
  await expect(page).toHaveURL(/\/vet\/login/);
});
