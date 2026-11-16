/**
 * Record timestamps (created_at, updated_at) come from the API in UTC without a
 * zone suffix, and `new Date()` would read them as local time, two or three
 * hours off in Greece. Appointment times are clinic-local and must NOT go
 * through this.
 */
export function serverTime(value: string): Date {
  return new Date(/[zZ]|[+-]\d{2}:?\d{2}$/.test(value) ? value : `${value}Z`);
}
