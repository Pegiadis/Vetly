# Vetly Mobile

Owner login and real pet profiles using the web API. Native sessions use
SecureStore; browser preview uses sessionStorage.

PC preview: `npm run web -- --port 8081`, then http://localhost:8081.
The development server proxies API requests to localhost:8000.

Phones: `npm start`, then open in a compatible Expo Go or development build.
PC and phone must share a network. Metro proxies /api/v1 to localhost:8000.
Override EXPO_PUBLIC_API_URL to select another backend (include /api/v1).
Use HTTPS for distribution. Current SDK is Expo 58; current Expo Go may
require an SDK upgrade or a compatible development build.
iOS simulator requires macOS; physical iPhones can be used with Windows.
Store builds and publication are separate steps.

Validation: `npx expo export --platform all`.
Live authenticated verification requires an existing owner account.

Dependency setup: use Node 24.22.1 (`.nvmrc`), then `npm ci` and `npm test`.
See [dependency security status](DEPENDENCY_SECURITY.md) for the applied security
updates and the remaining upstream node-forge release blocker. `npm run
audit:security` retains the high/critical failure threshold.

## Mobile design

The live owner experience uses `mobileTheme.js` and Fi-inspired mobile layouts:
pet switcher, light gray canvas, white cards, Vetly teal navigation, mint
selection surfaces and teal/green health accents. All existing login, booking,
pet/photo editing, history, on-call contact and notification flows remain connected
to the API. The Health overview filters medications and reminders by selected pet;
the Home summary explicitly covers all pets.

References reviewed on Mobbin:
- Home: https://mobbin.com/screens/64c4ae66-ff01-43e1-b36f-964bb3c2cdfb
- Health: https://mobbin.com/screens/bc8e9958-2fad-40a6-a27a-a9524a2e8670
- Pet profile: https://mobbin.com/screens/3e394888-a822-4380-9415-fb57069ee32e

Verification: iOS/Android Metro bundles, 24 helper tests, and a 390px
preview of login, tabs, pet selection, editor, booking, history and on-call screens.

## Appointment changes

The appointments tab offers upcoming visits and a paginated All view, including
cancelled visits. Active future appointments can be moved using the existing web
API. Availability preserves the original duration and excludes only the selected
appointment; it is checked again immediately before submission. A moved visit
returns to pending and requires the vet's confirmation.

Cancellation requires an explicit confirmation screen and follows the backend's
two-hour Athens-time cutoff. Grouped bookings are changed per pet. The response
updates the home summary immediately and then reloads server data. Cancelled and
completed visits have no edit actions. No new backend routes or migrations are
needed.

Validation includes the mobile date/permission/slot helpers and backend appointment
tests, including a transactional move/cancel lifecycle with vet notifications and
unchanged sibling bookings. Email sending is stubbed in tests. The PC preview
checks forms and real availability; installed iOS/Android device validation is
still required before release.
Physical-device appearance and OS camera/call/maps behavior require device testing.

