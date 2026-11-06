# Mobile notifications

The bell reads the existing owner inbox and supports read/unread state and navigation.
The local test notification works in Expo Go. Remote registration deliberately requires
an installed Vetly build, a physical device and an EAS project ID; Expo Go is not the
acceptance environment for background push delivery.

## Install and configure

- Apply backend migration: `python -m alembic upgrade head`.
- Run the dedicated worker: `python -m scripts.reminder_worker` (every 60 seconds).
- Set `PUSH_NOTIFICATIONS_ENABLED=true` after push credentials are configured.
- Optionally set `EXPO_ACCESS_TOKEN` when Expo enhanced push security is enabled.
- In mobile, set `EXPO_PUBLIC_EAS_PROJECT_ID` to the actual EAS project UUID.
- Set `VETLY_IOS_BUNDLE_ID` and `VETLY_ANDROID_PACKAGE` to the registered app identifiers.
- Use a reachable HTTPS `EXPO_PUBLIC_API_URL` for installed builds; include `/api/v1`.
- Configure APNs credentials for the Apple Developer account and FCM v1 for Android
  in EAS. `GOOGLE_SERVICES_JSON` supplies the Android Firebase configuration file.
- Create an internal preview build with `eas build --profile preview --platform ios`
  (and android). The development profile additionally needs expo-dev-client installed.
- On the phone, open the bell and explicitly enable notifications.

The server defaults to push disabled. Registration reports this clearly; it does not
claim a token means notifications are delivered. No cloud builds or credentials are
created by these source changes.

## Delivery behavior

The worker sends confirmations and existing due reminders from the owner inbox.
Vaccine dates come from the existing reminder records; this feature does not infer
new vaccination intervals. Medication reminders follow stored daily/weekly/once
schedules in Europe/Athens, inclusive start/end dates, and active/non-deleted pets.
A worker outage exceeding 15 minutes does not replay missed medication doses.

Medication notices deduplicate by medication/date/time. Delivery records deduplicate
by notification/device and retry transport failures with bounded backoff. A crash
between Expo acceptance and the database commit can still result in a repeated push;
there is no exactly-once guarantee from Expo. Receipts are checked after 15 minutes.
DeviceNotRegistered disables the installation. No device tokens are logged.

Only notices newer than registration (and less than 24 hours old) are queued.
Medication pushes expire after 15 minutes. Device registrations expire after 30 days
without app use and are refreshed when the signed-in application opens. Revoking all
sessions/password changes invalidates devices through owner auth_version. Explicit
logout unregisters before clearing the session, and network failure keeps the user
signed in so they can retry. An already expired session may still receive generic
pushes until invalidation/re-registration/expiry; no medical detail is put on the lock
screen, and notification taps are checked against the signed-in owner ID.

Push permission and reliable delivery depend on the OS, connectivity and provider.
No real push was sent in automated tests. Validate confirmation, dose time, vaccine
reminder, background/cold start, logout, denial and revoked permission on both phones.
