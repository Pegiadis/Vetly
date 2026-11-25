// Turns what the backend sent as `detail` into a Greek message the app can show.
// Mirrors vetly-front/lib/api.ts so web and app say the same thing.

const TRANSLATIONS = {
  'Invalid email or password': 'Το email ή ο κωδικός δεν είναι σωστά.',
  'Email not verified': 'Επιβεβαίωσε πρώτα το email σου.',
  'Account not set up for password login': 'Ο λογαριασμός δεν έχει κωδικό ακόμα. Χρησιμοποίησε το «Ξέχασα τον κωδικό μου».',
  'Invalid or expired verification token': 'Ο σύνδεσμος επιβεβαίωσης είναι άκυρος ή έχει λήξει. Ζήτησε νέο email.',
  'Email already registered': 'Αυτό το email χρησιμοποιείται ήδη. Συνδέσου ή επίλεξε ανάκτηση κωδικού.',
  'Could not validate credentials': 'Η σύνδεσή σου έληξε. Συνδέσου ξανά.',
  'Authentication required': 'Χρειάζεται σύνδεση.',
  'Not authorized': 'Δεν έχεις πρόσβαση σε αυτή την ενέργεια.',
  'Owner not found': 'Ο λογαριασμός δεν βρέθηκε.',
  'Vet not found': 'Ο κτηνίατρος δεν βρέθηκε.',
  'Pet not found': 'Το κατοικίδιο δεν βρέθηκε.',
  'Pet not found or does not belong to you': 'Το κατοικίδιο δεν βρέθηκε.',
  'Appointment not found': 'Το ραντεβού δεν βρέθηκε.',
  'Service type not found': 'Η υπηρεσία δεν βρέθηκε.',
  'Reminder not found': 'Η υπενθύμιση δεν βρέθηκε.',
  'Notification not found': 'Η ειδοποίηση δεν βρέθηκε.',
  'Review not found': 'Η αξιολόγηση δεν βρέθηκε.',
  'Conversation not found': 'Η συζήτηση δεν βρέθηκε.',
  'AI assistant is temporarily unavailable. Please try again.': 'Ο βοηθός δεν είναι διαθέσιμος αυτή τη στιγμή. Δοκίμασε ξανά σε λίγο.',
};

const GREEK = /[Ͱ-Ͽἀ-῿]/;

export function fallbackMessage(status) {
  if (status === 401) return 'Η σύνδεσή σου έληξε. Συνδέσου ξανά.';
  if (status === 403) return 'Δεν έχεις πρόσβαση σε αυτή την ενέργεια.';
  if (status === 404) return 'Δεν βρέθηκε αυτό που ζήτησες.';
  if (status === 409) return 'Κάτι άλλαξε στο μεταξύ. Ανανέωσε και δοκίμασε ξανά.';
  if (status === 413) return 'Το αρχείο είναι πολύ μεγάλο.';
  if (status === 422) return 'Έλεγξε τα στοιχεία που συμπλήρωσες και δοκίμασε ξανά.';
  if (status === 429) return 'Πάρα πολλές προσπάθειες. Δοκίμασε ξανά σε λίγο.';
  if (status >= 500) return 'Κάτι πήγε στραβά στον server. Δοκίμασε ξανά σε λίγο.';
  return 'Δεν ολοκληρώθηκε η ενέργεια. Δοκίμασε ξανά.';
}

export function errorMessage(status, detail) {
  if (typeof detail === 'string') {
    if (TRANSLATIONS[detail]) return TRANSLATIONS[detail];
    if (GREEK.test(detail)) return detail;
  }
  if (Array.isArray(detail)) {
    // Pydantic validation: backend validators write Greek text, prefixed with "Value error, ".
    const greek = detail.map(item => item?.msg).find(msg => typeof msg === 'string' && GREEK.test(msg));
    if (greek) return greek.replace(/^Value error,\s*/, '');
  }
  return fallbackMessage(status);
}
