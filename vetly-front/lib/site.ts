/** Canonical public URL of the site, without a trailing slash. Override with NEXT_PUBLIC_SITE_URL at build time. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://vetly.gr').replace(/\/+$/, '');
