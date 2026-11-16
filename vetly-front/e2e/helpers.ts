import { expect, type Page } from '@playwright/test';

/** True when the page has no horizontal scrollbar. */
export async function hasNoHorizontalScroll(page: Page): Promise<boolean> {
  return page.evaluate(
    () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
  );
}

/**
 * Intercepts every registration request so it can never reach the backend
 * (a real registration sends a verification email). Returns the list of
 * intercepted URLs; a test must assert it is empty when it expects the form
 * to have been blocked client-side.
 */
export async function blockRegistrationApi(page: Page): Promise<string[]> {
  const calls: string[] = [];
  await page.route(/\/auth\/.*register/, async (route) => {
    calls.push(route.request().url());
    await route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({ detail: 'blocked by e2e test' }),
    });
  });
  return calls;
}

/** Fails fast when something tries to hit an email-sending endpoint. */
export async function blockEmailSendingApi(page: Page): Promise<string[]> {
  const calls: string[] = [];
  await page.route(/\/(forgot-password|resend-verification|invite|appointments)(\/|\?|$)/, async (route) => {
    if (route.request().method() === 'GET') {
      await route.fallback();
      return;
    }
    calls.push(`${route.request().method()} ${route.request().url()}`);
    await route.fulfill({ status: 500, contentType: 'application/json', body: '{"detail":"blocked by e2e test"}' });
  });
  return calls;
}

export function envPair(prefix: 'OWNER' | 'VET'): { email: string; password: string } | null {
  const email = process.env[`E2E_${prefix}_EMAIL`];
  const password = process.env[`E2E_${prefix}_PASSWORD`];
  return email && password ? { email, password } : null;
}

/** Signs in through the login form and waits for the dashboard. */
export async function signInThroughForm(
  page: Page,
  loginPath: '/owner/login' | '/vet/login',
  dashboardPath: '/owner/dashboard' | '/vet/dashboard',
  creds: { email: string; password: string },
): Promise<void> {
  await page.goto(loginPath);
  await page.getByLabel('Email').fill(creds.email);
  await page.getByLabel('Κωδικός', { exact: true }).fill(creds.password);
  await page.getByRole('button', { name: 'Είσοδος' }).click();
  await expect(page).toHaveURL(new RegExp(`${dashboardPath}$`));
}

/** The form's error banner, not Next's hidden route announcer (which also has role="alert"). */
export function formAlert(page: Page) {
  return page.locator('[role="alert"]:not(#__next-route-announcer__)');
}
