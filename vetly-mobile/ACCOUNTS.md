# Owner account flows

- Login, registration, verification resend and recovery use the existing owner auth API. Registration and recovery send `client: mobile`; verification/reset additionally send `user_type: pet_owner` so vet links cannot mutate vet accounts from this UI.
- Profile → Ρυθμίσεις λογαριασμού edits name, phone and address; the login email is read-only. Email preferences use the same backend flags as web.
- Password changes, logout-all and deletion require the current password. Deletion also requires typing ΔΙΑΓΡΑΦΗ. Pending/confirmed appointments block deletion under the existing backend rule. Independent clinic records are retained as explained in the UI.
- After a security action succeeds, local credentials are cleared immediately without attempting push unregistration with a revoked credential. Backend auth-version checks revoke old sessions and registered push delivery permissions.

## Email links

Deploy the web `/mobile-auth` page together with the backend/mobile changes. The configured backend `FRONTEND_URL` must be an HTTPS web host reachable from the phone. Mobile requests receive a fixed link to this page; it offers `vetly://verify-email` / `vetly://reset-password` and a browser fallback. No arbitrary redirect URL is accepted.

The `vetly` scheme requires a **new installed build**. Expo Go cannot claim it. In Expo Go, finish using the browser and return to login, or copy the email link into “Έχω σύνδεσμο από email” to complete inside the app. Set `EXPO_PUBLIC_WEB_URL` to the exact web origin when using a staging host (default https://vetly.gr). localhost:3000 is additionally accepted in development; a phone cannot reach the PC using localhost.

Incoming links never silently authenticate the recipient. Verification requires a tap; reset requires entering and confirming a new password. Successful flows return to login. The backend validates signatures/expiry and rejects consumed owner verification links and reset links whose auth version changed. Existing unused owner reset links without a version are valid only for version-zero accounts; otherwise request a new email.

## Validation

Node tests cover UTF-8 password limits, profile clearing, and link allowlisting. Backend transactional tests cover registration, resend, verification, reset, replay rejection, account-type mismatch, expiry and session revocation; the existing settings tests cover preferences and deletion guards. Tests stub email sending and roll back their data.

Real mailbox delivery and installed iOS/Android app opening still need a device check with reachable web/API hosts. Bundling does not prove those integrations.
