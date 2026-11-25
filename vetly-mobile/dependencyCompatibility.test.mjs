import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';

// Exercise the plist consumers Expo CLI uses for native builds; the XML parsers under
// them were updated for security fixes (see DEPENDENCY_SECURITY.md).
const require = createRequire(import.meta.url);
const expoRequire = createRequire(require.resolve('expo/package.json'));
const cliRequire = createRequire(expoRequire.resolve('@expo/cli/package.json'));

test('Expo CLI no longer depends on Zod, so the earlier scoped override is gone', () => {
  assert.throws(() => cliRequire.resolve('zod/package.json'));
  assert.equal(require('./package.json').overrides, undefined);
});

test('Updated XML parsers preserve Expo and Xcode plist round trips', () => {
  const sample = { CFBundleName: 'Vetly & pets', Enabled: true, Count: 2, Values: ['α', 'β'] };
  for (const name of ['@expo/plist', 'plist']) {
    const module = cliRequire(name);
    const plist = module.default ?? module;
    // Expo intentionally parses dictionaries with a null prototype.
    assert.deepEqual({ ...plist.parse(plist.build(sample)) }, sample);
  }
});
