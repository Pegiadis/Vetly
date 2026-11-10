/**
 * Return path handling for sign-in flows (`?next=/some/path`).
 *
 * Only same-site relative paths are accepted so the parameter can never be
 * used as an open redirect.
 */

const MAX_NEXT_LENGTH = 2048;
const PENDING_KEY = 'vetly_post_verify_next';
const PENDING_TTL_MS = 24 * 60 * 60 * 1000;

/** Returns the path when it is a safe same-site relative path, otherwise null. */
export function sanitizeNextPath(value: string | null | undefined): string | null {
  if (typeof value !== 'string' || value.length === 0 || value.length > MAX_NEXT_LENGTH) return null;
  if (value[0] !== '/') return null;
  // `//host` and `/\host` are protocol-relative to browsers.
  if (value[1] === '/' || value[1] === '\\') return null;
  if (value.includes('\\')) return null;
  // Control characters (including tab/newline, which browsers strip from URLs).
  if (/[\u0000-\u001f\u007f]/.test(value)) return null;
  // A scheme can only appear before the first slash/?/#, which is index 0 here,
  // but reject encoded slashes/backslashes in the first segment as well.
  if (/^\/(%2f|%5c)/i.test(value)) return null;
  return value;
}

/** Appends `next` to a path when it is valid, e.g. withNext('/register', next). */
export function withNext(path: string, next: string | null): string {
  if (!next) return path;
  const sep = path.includes('?') ? '&' : '?';
  return `${path}${sep}next=${encodeURIComponent(next)}`;
}

/**
 * Remembers where to go once the email is verified. Verification happens from
 * a link in an email, usually in a new tab of the same browser, so the value
 * lives in localStorage rather than in the URL.
 */
export function rememberPendingNext(next: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (next) {
      localStorage.setItem(PENDING_KEY, JSON.stringify({ path: next, exp: Date.now() + PENDING_TTL_MS }));
    }
  } catch {
    // storage unavailable: the user simply lands on the default page
  }
}

/** Reads and clears the remembered path. */
export function consumePendingNext(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(PENDING_KEY);
    localStorage.removeItem(PENDING_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { path?: string; exp?: number };
    if (typeof parsed.exp !== 'number' || parsed.exp < Date.now()) return null;
    return sanitizeNextPath(parsed.path);
  } catch {
    return null;
  }
}
