# Mobile dependency security — 2026-10-25

## Release status

**Dependency security is not yet clear for release.** The audit initially reported
8 affected packages (7 high, 1 critical). After the compatible updates it reports
4 high, 0 critical: one unresolved node-forge advisory, propagated through three
Expo packages. The audit is not suppressed or allowlisted.

## Applied changes

| Dependency | Before | After | Scope |
| --- | --- | --- | --- |
| expo | 58.0.17 | 58.0.19 | Same SDK, updated CLI 58.1.15 |
| shell-quote | 1.10.0 | 1.12.0 | Critical command quoting advisory |
| brace-expansion | 5.0.8 / 5.0.12 | 5.0.12 | Expansion resource exhaustion |
| @xmldom/xmldom | 0.8.13 / 0.9.10 | 0.8.15 / 0.9.12 | XML parser security fixes, same version lines |
| zod | 3.25.76 | 4.6.7 | Scoped override for @expo/cli 58.1.15 |

Expo font, file-system and location package requirements are aligned with the
updated SDK patch. Native React and React Native versions are unchanged.
Commit package.json and package-lock.json together; install with `npm ci`.

The Zod override crosses a major version deliberately, only for the reviewed CLI
version. `dependencyCompatibility.test.mjs` exercises Expo's actual plugin schemas,
typed/strict command schemas and text/media output parser, plus early rejection of
oversized constrained arrays. It also checks the updated plist consumers. Revisit
this override when updating Expo CLI. Optional `expo-mcp` is not installed; its
external server integration is not covered and must be checked before enabling it.

## Unresolved upstream advisory

- [GHSA-86w9-cpqp-85rv](https://github.com/advisories/GHSA-86w9-cpqp-85rv):
  node-forge RSA PKCS#1 v1.5 signature verification accepts extra nested
  DigestAlgorithm elements. The latest published node-forge, 1.4.0, is affected;
  there is no official patched release as of this review.
- Dependency paths: `expo → @expo/cli → node-forge` and
  `expo → @expo/cli → @expo/code-signing-certificates → node-forge`.
- These paths are Expo host tooling for development/signing, not application
  imports. That limits the identified reachability, but does not establish that
  the build/signing environment is safe or justify ignoring the advisory.
- The [proposed upstream fix](https://github.com/digitalbazaar/forge/pull/1152)
  is still unmerged. No custom cryptography patch or unofficial fork was installed.
- `npm audit fix --force` suggests Expo 44.0.6. Do not use it: it downgrades the
  app across SDK generations and is not a supported fix for this project.

Resolution: update node-forge (and its Expo consumers if needed) when an official
fixed release is available, then repeat the checks below. If release must precede
that fix, a separately reviewed mitigation and explicit risk decision are still
required. This change does not approve that exception.

## Reproducible checks

Use Node **24.22.1** (`.nvmrc` and all EAS profiles). The workstation's existing
Node 25 is outside the supported engines of the installed React Native/Metro;
the machine-wide installation is not changed by this work.

```sh
npm ci
npm test
npx expo install --check
npx expo-doctor
npm run audit:security
npx expo export --platform all --output-dir ../tmp/mobile-security-export
```

`audit:security` deliberately returns a failure while high/critical findings remain.
Do not replace it with an always-successful command or remove the remaining finding
from audit output. Bundles are JavaScript/assets validation; store-signed native
builds and installed-device smoke tests remain separate release checks.

## Verification results

- Clean `npm ci` under Node 24.22.1 succeeded with the project's updated lockfile.
- 30 tests passed: 24 existing mobile helper tests and 6 dependency compatibility
  tests. No application test failures remain.
- `expo install --check`: dependencies up to date; `expo-doctor`: 20/20 passed.
  The dynamic config now consumes Expo's supplied static config context; a
  before/after comparison confirmed the resolved public config is unchanged.
- Android and iOS Hermes bundles and the web export succeeded.
- Final `npm audit`: 4 high, 0 critical, all from the unresolved advisory above.
- The local preview server was restarted on port 8083 using Node 24.22.1; the
  authenticated home screen loaded pets and upcoming appointments successfully.
