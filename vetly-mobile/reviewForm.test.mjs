import test from 'node:test';
import assert from 'node:assert/strict';
import { reviewableVisitIds, reviewPayload, reviewsByVet, starLabel } from './reviewForm.mjs';

test('a review needs 1 to 5 stars and a comment', () => {
  assert.throws(() => reviewPayload(0, 'Καλή'), /βαθμολογία/);
  assert.throws(() => reviewPayload(6, 'Καλή'), /βαθμολογία/);
  assert.throws(() => reviewPayload(4, '   '), /σχόλιο/);
  assert.deepEqual(reviewPayload(4, '  Πολύ προσεκτική.  '), { rating: 4, comment: 'Πολύ προσεκτική.' });
});

test('star labels use the right Greek number', () => {
  assert.equal(starLabel(1), '1 αστέρι · Κακή');
  assert.equal(starLabel(5), '5 αστέρια · Εξαιρετική');
});

test('reviews are looked up by vet', () => {
  const map = reviewsByVet([{ id: 'r1', vet_id: 'v1' }, { id: 'r2', vet_id: 'v2' }]);
  assert.equal(map.v2.id, 'r2');
  assert.equal(map.v3, undefined);
});

test('only the latest completed visit per vet offers a review', () => {
  const ids = reviewableVisitIds([
    { id: 'a', vet_id: 'v1', status: 'completed', scheduled_at: '2026-10-01T10:00:00' },
    { id: 'b', vet_id: 'v1', status: 'completed', scheduled_at: '2026-11-01T10:00:00' },
    { id: 'c', vet_id: 'v1', status: 'confirmed', scheduled_at: '2026-12-01T10:00:00' },
    { id: 'd', vet_id: 'v2', status: 'completed', scheduled_at: '2026-09-01T10:00:00' },
  ]);
  assert.deepEqual([...ids].sort(), ['b', 'd']);
});
