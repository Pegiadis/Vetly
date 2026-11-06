import test from 'node:test';
import assert from 'node:assert/strict';
import { passwordError, profilePayload, parseAccountLink } from './accountForm.mjs';

test('passwords respect matching, strength and bcrypt UTF-8 limits', () => {
  assert.equal(passwordError('Φροντίδα123', 'Φροντίδα123'), '');
  for (const value of ['short1', 'onlyletterslong', '12345678901', 'α'.repeat(36) + '1']) assert.ok(passwordError(value, value));
  assert.ok(passwordError('Goodpassword123', 'Different123'));
});
test('profile trims fields and supports explicitly clearing optional contact details', () => {
  assert.deepEqual(profilePayload({ name: '  Μαρία  ', phone: '  ', address: '' }), { name: 'Μαρία', phone: '', address: '' });
  assert.throws(() => profilePayload({ name: ' ', phone: '', address: '' }));
});
test('email links accept only trusted origins and fixed auth actions', () => {
  const origins = ['https://vetly.gr'];
  for (const link of ['vetly://reset-password?token=abc', 'https://vetly.gr/mobile-auth?action=reset-password&token=abc', 'https://vetly.gr/reset-password?token=abc']) {
    assert.deepEqual(parseAccountLink(link, origins), { action: 'reset-password', token: 'abc' });
  }
  assert.deepEqual(parseAccountLink('vetly://verify-email?token=xyz'), { action: 'verify-email', token: 'xyz' });
  for (const link of ['https://evil.test/reset-password?token=a', 'https://vetly.gr.evil.test/reset-password?token=a', 'https://user@vetly.gr/reset-password?token=a', 'vetly://delete-account?token=a', 'vetly://reset-password/extra?token=a', 'vetly://reset-password?token=a&token=b', 'vetly://verify-email', 'not a link']) assert.equal(parseAccountLink(link, origins), null);
});
