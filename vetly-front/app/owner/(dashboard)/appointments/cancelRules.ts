// The backend refuses owner cancellations and time changes less than this many hours before the appointment.
export const CANCEL_CUTOFF_HOURS = 2;

// Wall-clock "now" in Athens as a YYYY-MM-DDTHH:MM:SS string, comparable to appointment timestamps.
function athensNow(): string {
  return new Date().toLocaleString('sv-SE', { timeZone: 'Europe/Athens' }).replace(' ', 'T');
}

const asUtcMs = (wallClock: string) => Date.parse(`${wallClock.slice(0, 19)}Z`);

/** True when the appointment (Athens wall-clock string) starts in under the cancellation cutoff. */
export function isInsideCancelCutoff(scheduledAt: string): boolean {
  return asUtcMs(scheduledAt) - asUtcMs(athensNow()) < CANCEL_CUTOFF_HOURS * 3600_000;
}
