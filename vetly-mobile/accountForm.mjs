export function passwordError(password, repeat) {
  if (password !== repeat) return 'Οι κωδικοί δεν ταιριάζουν.';
  // bcrypt accepts at most 72 UTF-8 bytes, including non-Latin passwords.
  const bytes = [...password].reduce((n, c) => n + (c.codePointAt(0) <= 0x7f ? 1 : c.codePointAt(0) <= 0x7ff ? 2 : c.codePointAt(0) <= 0xffff ? 3 : 4), 0);
  if (bytes > 72) return 'Ο κωδικός είναι πολύ μεγάλος. Χρησιμοποίησε λιγότερους χαρακτήρες.';
  if ([...password].length < 10 || !/\p{L}/u.test(password) || !/[0-9]/.test(password)) {
    return 'Χρησιμοποίησε τουλάχιστον 10 χαρακτήρες, με γράμματα και αριθμούς.';
  }
  return '';
}
export function profilePayload(form) {
  const name = form.name.trim();
  if (name.length < 2 || name.length > 255) throw new Error('Το ονοματεπώνυμο χρειάζεται 2 έως 255 χαρακτήρες.');
  if (form.phone.trim().length > 50 || form.address.trim().length > 500) throw new Error('Έλεγξε το μήκος του τηλεφώνου και της διεύθυνσης.');
  return { name, phone: form.phone.trim(), address: form.address.trim() };
}
export function validEmail(email) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()); }

// Only extract credentials from recognized Vetly routes; never follow arbitrary URLs.
// Token signature, expiry, purpose and account type are checked by the backend.
export function parseAccountLink(value, allowedOrigins = []) {
  try {
    const url = new URL(value.trim());
    let action;
    if (url.protocol === 'vetly:' && !url.username && !url.password) {
      action = url.hostname || url.pathname.replace(/^\//, '');
      if (url.hostname && url.pathname && url.pathname !== '/') return null;
    } else if (['https:', 'http:'].includes(url.protocol) && allowedOrigins.includes(url.origin) && !url.username && !url.password) {
      action = url.pathname === '/mobile-auth' ? url.searchParams.get('action') : url.pathname.replace(/^\//, '');
    } else return null;
    const token = url.searchParams.get('token');
    if (!['verify-email', 'reset-password'].includes(action) || !token || token.length > 4096 || url.searchParams.getAll('token').length !== 1) return null;
    return { action, token };
  } catch { return null; }
}

export function accountError(error) {
  const messages = {
    'Invalid email or password': 'Το email ή ο κωδικός δεν είναι σωστά.',
    'Email already registered': 'Αυτό το email χρησιμοποιείται ήδη. Συνδέσου ή επίλεξε ανάκτηση κωδικού.',
    'Email not verified': 'Επιβεβαίωσε πρώτα το email σου.',
    'Invalid or expired verification token': 'Ο σύνδεσμος επιβεβαίωσης είναι άκυρος ή έχει λήξει. Ζήτησε νέο email.',
  };
  return messages[error.message] || error.message || 'Δεν ολοκληρώθηκε η ενέργεια. Δοκίμασε ξανά.';
}
