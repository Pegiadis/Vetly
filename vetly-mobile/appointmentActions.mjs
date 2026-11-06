// The API stores Athens wall time, independent of the phone's timezone.
export function athensNow(now = new Date()) {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Athens', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }).format(now).replace(' ', 'T');
}
export function appointmentPermissions(appointment, now = new Date()) {
  const remaining = Date.parse(`${appointment.scheduled_at.slice(0, 19)}Z`) - Date.parse(`${athensNow(now)}Z`);
  const active = ['pending', 'confirmed'].includes(appointment.status);
  return { reschedule: active && remaining > 0, cancel: active && remaining >= 2 * 60 * 60 * 1000 };
}
export function slotPath(appointment, day) {
  return `/vets/${encodeURIComponent(appointment.vet_id)}/available-slots?date=${day}&duration_minutes=${appointment.duration_minutes || 30}&exclude_appointment_id=${encodeURIComponent(appointment.id)}`;
}
export function reschedulePayload(appointment, day, time, slots) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day || '') || !/^\d{2}:\d{2}$/.test(time || '') || !slots.includes(time)) throw new Error('Επίλεξε διαθέσιμη ημέρα και ώρα.');
  const scheduled_at = `${day}T${time}:00`;
  if (scheduled_at === appointment.scheduled_at.slice(0, 19)) throw new Error('Επίλεξε διαφορετική ημέρα ή ώρα από την τρέχουσα.');
  return { scheduled_at };
}
export function calendarMonth(month) {
  const [year, number] = month.split('-').map(Number);
  const first = new Date(Date.UTC(year, number - 1, 1));
  const offset = (first.getUTCDay() + 6) % 7;
  const count = new Date(Date.UTC(year, number, 0)).getUTCDate();
  return [...Array(offset).fill(null), ...Array.from({ length: count }, (_, i) => `${month}-${String(i + 1).padStart(2, '0')}`)];
}
export function shiftMonth(month, delta) {
  const [year, number] = month.split('-').map(Number);
  return new Date(Date.UTC(year, number - 1 + delta, 1)).toISOString().slice(0, 7);
}
export function bookingLimit(today) {
  const month = shiftMonth(today.slice(0, 7), 3);
  const last = calendarMonth(month).filter(Boolean).at(-1);
  return `${month}-${today.slice(8) > last.slice(8) ? last.slice(8) : today.slice(8)}`;
}
export const appointmentStatuses = { pending: 'Αναμονή επιβεβαίωσης', confirmed: 'Επιβεβαιωμένο', completed: 'Ολοκληρώθηκε', cancelled: 'Ακυρώθηκε', no_show: 'Δεν πραγματοποιήθηκε' };
export const appointmentDate = value => `${value.slice(8, 10)}/${value.slice(5, 7)}/${value.slice(0, 4)} · ${value.slice(11, 16)}`;
