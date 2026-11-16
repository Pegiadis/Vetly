# End-to-end tests (Playwright)

Smoke tests for the public pages, the login/register pages and, when you give it accounts, the signed-in flows. Everything is read-only.

## Run locally

Start the frontend (`npm run dev`, :3000) and the backend (:8000) yourself, then from `vetly-front/`:

```bash
npx playwright install chromium   # once
npm run test:e2e                  # all specs, desktop + 375x812 phone
npx playwright test public        # one file
npx playwright test --project=phone
```

Locally Playwright does not start servers. With `CI=true` it runs `npm run start` itself (build first).

## Environment variables

| Variable | Purpose |
|---|---|
| `PLAYWRIGHT_BASE_URL` | Frontend URL, default `http://localhost:3000` |
| `E2E_API_URL` | API base for the one spec that looks up a vet id, default `http://localhost:8000/api/v1` |
| `E2E_OWNER_EMAIL`, `E2E_OWNER_PASSWORD` | Enable the signed-in owner flow in `signed-in.spec.ts` |
| `E2E_VET_EMAIL`, `E2E_VET_PASSWORD` | Enable the signed-in vet flow |

Without the account variables the signed-in specs are skipped with a message. Never put credentials in a committed file; export them in your shell. The signed-in specs run in the desktop project only and sign in once per role, because the backend allows 10 logins per minute per address.

## Rules

- Tests never submit a form that sends email: registration, forgot-password, resend verification, client invite, booking request. Registration specs intercept the register API with `page.route` and fail if it is called; signed-in specs stop before the final booking step.
- The only write the suite performs is a failed login with a made-up address, which sends nothing.
- There is no public vet directory. `public.spec.ts` checks that the home page links to none and that `/vets` is a 404; do not weaken that.
- The suite only needs the local database to exist; it creates no data.

## CI

`.github/workflows/ci.yml` runs `public` and `auth-pages` in the `e2e` job (no secrets) and uploads the Playwright report as an artifact when it fails.
