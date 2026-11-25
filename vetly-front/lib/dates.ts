/**
 * Record timestamps (created_at, updated_at) come from the API in UTC without a
 * zone suffix, and `new Date()` would read them as local time, two or three
 * hours off in Greece. Appointment times are clinic-local and must NOT go
 * through this.
 */
export function serverTime(value: string): Date {
  return new Date(/[zZ]|[+-]\d{2}:?\d{2}$/.test(value) ? value : `${value}Z`);
}

/**
 * A date picker shows its value in the browser's own format (an English browser shows
 * month/day/year). This spells the chosen day out in Greek so it cannot be misread.
 * `value` is the picker's yyyy-mm-dd string; an empty or invalid value gives ''.
 */
export function greekDay(value: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return '';
  const day = new Date(`${value}T12:00:00`);
  return Number.isNaN(day.getTime()) ? '' : day.toLocaleDateString('el-GR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}
