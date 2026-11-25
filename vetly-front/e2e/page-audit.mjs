// Read-only sweep of every page for every role, on desktop and phone widths.
// It signs in through the API, opens each route and records what a tester would flag:
// console errors, failed or 4xx/5xx requests, error screens, redirects to login,
// horizontal scrolling, broken images and stray "undefined"/"NaN"/"Invalid Date" text.
//
//   node e2e/page-audit.mjs            (dev server on :3000, API on :8000)
//   AUDIT_VET_EMAIL / AUDIT_VET_PASSWORD, AUDIT_OWNER_*, AUDIT_ADMIN_* supply the accounts.
//
// Nothing is submitted: the script only navigates.
import { chromium } from '@playwright/test';
import { writeFileSync } from 'node:fs';

const BASE = process.env.AUDIT_BASE_URL ?? 'http://localhost:3000';
const API = process.env.AUDIT_API_URL ?? 'http://localhost:8000/api/v1';
const OUT = process.env.AUDIT_OUT ?? 'page-audit-report.json';

const VIEWPORTS = { desktop: { width: 1280, height: 800 }, phone: { width: 375, height: 812 } };
const SUSPICIOUS_TEXT = /\bundefined\b|\bNaN\b|Invalid Date|\[object Object\]|\bnull\b/;
const ERROR_SCREEN = /Κάτι πήγε στραβά|Παρουσιάστηκε σφάλμα|Application error|Unhandled Runtime Error|This page could not be found/;

async function login(path, email, password) {
  if (!email || !password) return null;
  const response = await fetch(`${API}${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
  if (!response.ok) throw new Error(`login ${path} failed: ${response.status}`);
  return (await response.json()).access_token;
}

async function apiGet(path, token) {
  const response = await fetch(`${API}${path}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
  return response.ok ? response.json() : null;
}

const tokens = {
  vet: await login('/auth/vet/login', process.env.AUDIT_VET_EMAIL, process.env.AUDIT_VET_PASSWORD),
  owner: await login('/auth/pet-owner/login', process.env.AUDIT_OWNER_EMAIL, process.env.AUDIT_OWNER_PASSWORD),
  admin: await login('/admin/login', process.env.AUDIT_ADMIN_EMAIL, process.env.AUDIT_ADMIN_PASSWORD),
};

// Ids for the dynamic routes.
const ownerAppointments = tokens.owner ? await apiGet('/owner/appointments?page=1&page_size=1', tokens.owner) : null;
const publicVets = tokens.owner ? await apiGet('/public/vets?page_size=1', tokens.owner) : null;
const appointmentId = ownerAppointments?.items?.[0]?.id;
const vetSlug = publicVets?.items?.[0]?.slug;

const ROLES = {
  public: {
    storage: {},
    routes: ['/', '/for-vets', '/pet-owners', '/register', '/owner/login', '/vet/login', '/admin/login', '/terms', '/privacy',
      '/forgot-password', '/reset-password', '/verify-email', '/verify-email/pending', '/mobile-auth', '/vet/activate', '/vet/register',
      ...(vetSlug ? [`/vets/${vetSlug}`] : []), '/this-page-does-not-exist'],
  },
  owner: {
    storage: { vetly_token_pet_owner: tokens.owner, vetly_user_type: 'pet_owner' },
    routes: ['/owner/dashboard', '/owner/pets', '/owner/appointments', ...(appointmentId ? [`/owner/appointments/${appointmentId}`] : []),
      '/owner/book', '/owner/chat', '/owner/medical', '/owner/medications', '/owner/notifications', '/owner/on-call', '/owner/reminders',
      '/owner/reviews', '/owner/settings', ...(vetSlug ? [`/vets/${vetSlug}`] : [])],
  },
  vet: {
    storage: { vetly_token_vet: tokens.vet, vetly_user_type: 'vet' },
    routes: ['/vet/dashboard', '/vet/schedule', '/vet/appointments', '/vet/pending', '/vet/clients', '/vet/patients', '/vet/reminders',
      '/vet/services', '/vet/reviews', '/vet/analytics', '/vet/notifications', '/vet/chat', '/vet/settings', '/vet/time-off'],
  },
  admin: {
    storage: { vetly_token_admin: tokens.admin },
    routes: ['/admin', '/admin/demo-requests', '/admin/vets', '/admin/owners'],
  },
};

// Requests that fail by design on the pages that test them.
const EXPECTED = [
  [/\/this-page-does-not-exist/, 404],
  [/\/auth\/vet\/activation$/, 400], // /vet/activate opened without a token
  [/\/_next\/static\/.*\.map$/, 404],
];
const isExpected = (url, status) => EXPECTED.some(([pattern, code]) => pattern.test(url) && code === status);

const browser = await chromium.launch();
const findings = [];
let pages = 0;

for (const [role, { storage, routes }] of Object.entries(ROLES)) {
  if (role !== 'public' && !Object.values(storage).every(Boolean)) {
    findings.push({ role, route: '-', viewport: '-', kind: 'skipped', detail: 'no credentials for this role' });
    continue;
  }
  for (const [viewportName, viewport] of Object.entries(VIEWPORTS)) {
    const context = await browser.newContext({ viewport, locale: 'el-GR', isMobile: viewportName === 'phone', hasTouch: viewportName === 'phone' });
    await context.addInitScript(values => { for (const [key, value] of Object.entries(values)) localStorage.setItem(key, value); }, storage);
    for (const route of routes) {
      const page = await context.newPage();
      const add = (kind, detail) => findings.push({ role, route, viewport: viewportName, kind, detail: String(detail).slice(0, 400) });
      // The browser logs the 404 of the deliberately missing page; that one is expected.
      const expectedConsole = route === '/this-page-does-not-exist' ? /status of 404/ : /$^/;
      page.on('console', message => { if (message.type() === 'error' && !/Download the React DevTools|favicon/.test(message.text()) && !expectedConsole.test(message.text())) add('console-error', message.text()); });
      page.on('pageerror', error => add('page-error', error.message));
      page.on('requestfailed', request => { const reason = request.failure()?.errorText ?? ''; if (!/ERR_ABORTED/.test(reason)) add('request-failed', `${request.method()} ${request.url()} ${reason}`); });
      page.on('response', response => { const status = response.status(); if (status >= 400 && !isExpected(response.url(), status)) add('http-error', `${status} ${response.request().method()} ${response.url()}`); });
      try {
        await page.goto(`${BASE}${route}`, { waitUntil: 'networkidle', timeout: 30000 });
        await page.waitForTimeout(700);
        const finalPath = new URL(page.url()).pathname;
        if (role !== 'public' && /\/login$/.test(finalPath)) add('redirected-to-login', page.url());
        const state = await page.evaluate(() => ({
          text: document.body.innerText,
          overflow: document.documentElement.scrollWidth - window.innerWidth,
          brokenImages: [...document.images].filter(img => img.complete && img.naturalWidth === 0 && img.src).map(img => img.src),
          h1: document.querySelectorAll('h1').length,
          title: document.title,
        }));
        if (state.overflow > 1) add('horizontal-scroll', `${state.overflow}px wider than the screen`);
        for (const src of state.brokenImages) add('broken-image', src);
        const suspicious = state.text.match(SUSPICIOUS_TEXT);
        if (suspicious) add('suspicious-text', `"${suspicious[0]}" near: ${state.text.slice(Math.max(0, suspicious.index - 60), suspicious.index + 60).replace(/\s+/g, ' ')}`);
        if (route !== '/this-page-does-not-exist' && ERROR_SCREEN.test(state.text)) add('error-screen', state.text.match(ERROR_SCREEN)[0]);
        if (state.h1 === 0) add('no-h1', state.title);
        if (state.text.trim().length < 40) add('blank-page', `${state.text.trim().length} characters of text`);
      } catch (error) {
        add('navigation-failed', error.message);
      }
      pages++;
      await page.close();
    }
    await context.close();
  }
}
await browser.close();

const byKind = {};
for (const finding of findings) byKind[finding.kind] = (byKind[finding.kind] ?? 0) + 1;
writeFileSync(OUT, JSON.stringify({ pages, byKind, findings }, null, 2));
console.log(`${pages} page loads, ${findings.length} findings`, byKind);
