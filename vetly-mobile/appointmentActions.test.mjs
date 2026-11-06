import test from 'node:test';
import assert from 'node:assert/strict';
import { appointmentPermissions, athensNow, bookingLimit, calendarMonth, reschedulePayload, shiftMonth, slotPath } from './appointmentActions.mjs';

test('cancellation follows the Athens two-hour boundary regardless of phone timezone', () => {
  const now = new Date('2026-10-26T08:00:00Z'); // 10:00 in Athens after DST ends
  assert.equal(athensNow(now), '2026-10-26T10:00:00');
  const base = { status: 'confirmed', scheduled_at: '2026-10-26T12:00:00' };
  assert.deepEqual(appointmentPermissions(base, now), { cancel: true, reschedule: true });
  assert.deepEqual(appointmentPermissions({ ...base, scheduled_at: '2026-10-26T11:59:59' }, now), { cancel: false, reschedule: true });
  assert.deepEqual(appointmentPermissions({ ...base, scheduled_at: '2026-10-26T10:00:00' }, now), { cancel: false, reschedule: false });
  for (const status of ['cancelled', 'completed', 'no_show']) assert.deepEqual(appointmentPermissions({ ...base, status }, now), { cancel: false, reschedule: false });
  assert.equal(athensNow(new Date('2026-07-01T08:00:00Z')), '2026-07-01T11:00:00');
});
test('rescheduling preserves duration and excludes only the selected appointment from slots', () => {
  assert.equal(slotPath({ id: 'a', vet_id: 'v', duration_minutes: 45 }, '2026-10-26'), '/vets/v/available-slots?date=2026-10-26&duration_minutes=45&exclude_appointment_id=a');
  const appointment = { scheduled_at: '2026-10-26T10:00:00' };
  assert.throws(() => reschedulePayload(appointment, '2026-10-26', '10:00', ['10:00']));
  assert.throws(() => reschedulePayload(appointment, '2026-10-26', '11:00', ['12:00']));
  assert.throws(() => reschedulePayload(appointment, null, null, []));
  assert.deepEqual(reschedulePayload(appointment, '2026-10-26', '11:00', ['11:00']), { scheduled_at: '2026-10-26T11:00:00' });
});
test('calendar handles leap days, Monday-first padding and year changes', () => {
  const leap = calendarMonth('2028-02');
  assert.equal(leap[0], null);
  assert.equal(leap.at(-1), '2028-02-29');
  assert.equal(calendarMonth('2026-06')[0], '2026-06-01');
  assert.equal(shiftMonth('2026-12', 1), '2027-01');
  assert.equal(shiftMonth('2026-01', -1), '2025-12');
  assert.equal(bookingLimit('2026-11-30'), '2027-02-28');
});
