import test from 'node:test';
import assert from 'node:assert/strict';
import { errorMessage } from './apiErrors.mjs';

test('known English details become Greek', () => {
  assert.equal(errorMessage(401, 'Invalid email or password'), 'Το email ή ο κωδικός δεν είναι σωστά.');
});

test('Greek details from the backend are kept', () => {
  assert.equal(errorMessage(400, 'Η ώρα δεν είναι διαθέσιμη.'), 'Η ώρα δεν είναι διαθέσιμη.');
});

test('unknown English details never reach the user', () => {
  assert.equal(errorMessage(500, 'Internal Server Error'), 'Κάτι πήγε στραβά στον server. Δοκίμασε ξανά σε λίγο.');
  assert.equal(errorMessage(404, 'Something not found'), 'Δεν βρέθηκε αυτό που ζήτησες.');
});

test('validation errors use the Greek validator text or a Greek fallback', () => {
  assert.equal(errorMessage(422, [{ msg: 'Value error, Το βάρος πρέπει να είναι θετικό.' }]), 'Το βάρος πρέπει να είναι θετικό.');
  assert.equal(errorMessage(422, [{ msg: 'Field required' }]), 'Έλεγξε τα στοιχεία που συμπλήρωσες και δοκίμασε ξανά.');
});
