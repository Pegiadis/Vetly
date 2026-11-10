/**
 * API client utility
 */

import { getStoredToken } from '@/contexts/AuthContext';
import { sanitizeNextPath } from '@/lib/next-path';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

/**
 * `message` is always Greek and safe to show to the user. `detail` keeps what the
 * backend sent (an English string, or the validation array for 422) for code that
 * needs to branch on it. `status` is 0 when no response was received.
 */
class ApiError extends Error {
  constructor(public status: number, message: string, public detail: unknown = message) {
    super(message);
    this.name = 'ApiError';
  }
}

/** Known English `detail` strings from the backend, in Greek. */
const DETAIL_TRANSLATIONS: Record<string, string> = {
  'Invalid email or password': 'Το email ή ο κωδικός δεν είναι σωστά.',
  'Email not verified': 'Πρέπει πρώτα να επιβεβαιώσετε το email σας.',
  'Account not set up for password login': 'Ο λογαριασμός δεν έχει οριστεί για σύνδεση με κωδικό. Χρησιμοποιήστε την επαναφορά κωδικού.',
  'Invalid or expired verification token': 'Ο σύνδεσμος επιβεβαίωσης δεν είναι έγκυρος ή έχει λήξει. Ζητήστε νέο email.',
  'Email already registered': 'Αυτό το email χρησιμοποιείται ήδη.',
  'License number already registered': 'Αυτός ο αριθμός άδειας είναι ήδη καταχωρισμένος.',
  'Could not validate credentials': 'Η συνεδρία σας δεν είναι έγκυρη. Συνδεθείτε ξανά.',
  'Authentication required': 'Απαιτείται σύνδεση.',
  'Not authorized': 'Δεν έχετε πρόσβαση σε αυτή την ενέργεια.',
  'User not found': 'Ο χρήστης δεν βρέθηκε.',
  'Owner not found': 'Ο ιδιοκτήτης δεν βρέθηκε.',
  'Vet not found': 'Ο κτηνίατρος δεν βρέθηκε.',
  'Client not found': 'Ο πελάτης δεν βρέθηκε.',
  'Patient not found': 'Ο ασθενής δεν βρέθηκε.',
  'Pet not found': 'Το κατοικίδιο δεν βρέθηκε.',
  'Pet not found or does not belong to you': 'Το κατοικίδιο δεν βρέθηκε ή δεν ανήκει στον λογαριασμό σας.',
  'Appointment not found': 'Το ραντεβού δεν βρέθηκε.',
  'Service type not found': 'Η υπηρεσία δεν βρέθηκε.',
  'Reminder not found': 'Η υπενθύμιση δεν βρέθηκε.',
  'Reminder is already dismissed': 'Η υπενθύμιση έχει ήδη απορριφθεί.',
  'Notification not found': 'Η ειδοποίηση δεν βρέθηκε.',
  'Review not found': 'Η αξιολόγηση δεν βρέθηκε.',
  'Medication not found': 'Το φάρμακο δεν βρέθηκε.',
  'Conversation not found': 'Η συζήτηση δεν βρέθηκε.',
  'No reply exists to update': 'Δεν υπάρχει απάντηση για επεξεργασία.',
  'No reply exists to delete': 'Δεν υπάρχει απάντηση για διαγραφή.',
  'Invalid invite link': 'Ο σύνδεσμος πρόσκλησης δεν είναι έγκυρος.',
  'Invite link has expired': 'Ο σύνδεσμος πρόσκλησης έχει λήξει.',
  'Invite already used': 'Η πρόσκληση έχει ήδη χρησιμοποιηθεί.',
  'Client already has a Vetly account': 'Ο πελάτης έχει ήδη λογαριασμό στο Vetly.',
  'A client with this email already exists': 'Υπάρχει ήδη πελάτης με αυτό το email.',
  'Client has not been invited yet. Use the invite endpoint first.': 'Ο πελάτης δεν έχει προσκληθεί ακόμη. Στείλτε πρώτα πρόσκληση.',
  'Can only reject pending appointments': 'Μπορείτε να απορρίψετε μόνο ραντεβού που εκκρεμούν.',
  'Can only complete confirmed or pending appointments': 'Μπορείτε να ολοκληρώσετε μόνο επιβεβαιωμένα ή εκκρεμή ραντεβού.',
  'Can only approve pending appointments': 'Μπορείτε να εγκρίνετε μόνο ραντεβού που εκκρεμούν.',
  'AI assistant is temporarily unavailable. Please try again.': 'Ο βοηθός δεν είναι διαθέσιμος αυτή τη στιγμή. Δοκιμάστε ξανά σε λίγο.',
};

const NETWORK_ERROR_MESSAGE = 'Δεν ήταν δυνατή η σύνδεση με τον διακομιστή. Ελέγξτε τη σύνδεσή σας στο διαδίκτυο και δοκιμάστε ξανά.';

function fallbackMessage(status: number): string {
  switch (status) {
    case 400: return 'Το αίτημα δεν είναι έγκυρο. Ελέγξτε τα στοιχεία και δοκιμάστε ξανά.';
    case 401: return 'Απαιτείται σύνδεση. Συνδεθείτε ξανά.';
    case 403: return 'Δεν έχετε πρόσβαση σε αυτή την ενέργεια.';
    case 404: return 'Το στοιχείο που ζητήσατε δεν βρέθηκε.';
    case 409: return 'Η ενέργεια συγκρούεται με υπάρχοντα στοιχεία. Ανανεώστε τη σελίδα και δοκιμάστε ξανά.';
    case 413: return 'Το αρχείο είναι πολύ μεγάλο.';
    case 422: return 'Ελέγξτε τα στοιχεία που συμπληρώσατε και δοκιμάστε ξανά.';
    case 429: return 'Πάρα πολλές προσπάθειες. Δοκιμάστε ξανά σε λίγο.';
    default:
      return status >= 500
        ? 'Παρουσιάστηκε σφάλμα στον διακομιστή. Δοκιμάστε ξανά σε λίγο.'
        : 'Η ενέργεια δεν ολοκληρώθηκε. Δοκιμάστε ξανά.';
  }
}

const GREEK_TEXT = /[Ͱ-Ͽἀ-῿]/;

interface ValidationItem {
  loc?: unknown[];
  msg?: string;
  type?: string;
  ctx?: { min_length?: number; max_length?: number };
}

const FIELD_LABELS: Record<string, string> = {
  password: 'κωδικός',
  new_password: 'κωδικός',
  email: 'email',
  name: 'όνομα',
  phone: 'τηλέφωνο',
  address: 'διεύθυνση',
  city: 'πόλη',
};

/** Greek message for one pydantic validation item, or null when nothing specific applies. */
function validationItemMessage(item: ValidationItem): string | null {
  const field = String(item.loc?.[item.loc.length - 1] ?? '');
  const label = FIELD_LABELS[field];
  const type = item.type ?? '';
  if (type === 'string_too_short' && item.ctx?.min_length) {
    const min = item.ctx.min_length;
    if (label === 'κωδικός') return `Ο κωδικός πρέπει να έχει τουλάχιστον ${min} χαρακτήρες.`;
    return `${label ? `Το πεδίο «${label}»` : 'Ένα πεδίο'} πρέπει να έχει τουλάχιστον ${min} χαρακτήρες.`;
  }
  if (type === 'string_too_long' && item.ctx?.max_length) {
    return `${label ? `Το πεδίο «${label}»` : 'Ένα πεδίο'} μπορεί να έχει έως ${item.ctx.max_length} χαρακτήρες.`;
  }
  if (field === 'email' && type.startsWith('value_error')) return 'Η διεύθυνση email δεν είναι έγκυρη.';
  if (type === 'missing') return `${label ? `Το πεδίο «${label}»` : 'Ένα υποχρεωτικό πεδίο'} είναι υποχρεωτικό.`;
  // Backend validators raise ValueError with Greek text; pydantic prefixes it with "Value error, ".
  if (item.msg && GREEK_TEXT.test(item.msg)) return item.msg.replace(/^Value error,\s*/, '');
  return null;
}

/** Turns whatever the backend sent as `detail` into a Greek message. */
function translateDetail(status: number, detail: unknown): string {
  if (typeof detail === 'string') {
    if (DETAIL_TRANSLATIONS[detail]) return DETAIL_TRANSLATIONS[detail];
    // Messages the backend already writes in Greek are shown as they are.
    if (GREEK_TEXT.test(detail)) return detail;
    return fallbackMessage(status);
  }
  if (Array.isArray(detail)) {
    for (const item of detail) {
      if (item && typeof item === 'object') {
        const message = validationItemMessage(item as ValidationItem);
        if (message) return message;
      }
    }
  }
  return fallbackMessage(status);
}

function getAuthHeaders(): Record<string, string> {
  const token = getStoredToken();
  if (token) {
    return { 'Authorization': `Bearer ${token}` };
  }
  return {};
}

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
        ...options?.headers,
      },
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') throw err;
    throw new ApiError(0, NETWORK_ERROR_MESSAGE, 'Network error');
  }

  if (!response.ok) {
    if (response.status === 401) {
      if (typeof window !== 'undefined') {
        const path = window.location.pathname;
        const isAuthPage = path.includes('/login') || path.includes('/register') || path.includes('/verify') || path.includes('/reset') || path.includes('/forgot');
        if (!isAuthPage) {
          localStorage.removeItem('vetly_token_vet');
          localStorage.removeItem('vetly_token_pet_owner');
          localStorage.removeItem('vetly_user_type');
          const isVet = path === '/vet' || path.startsWith('/vet/');
          const back = sanitizeNextPath(`${path}${window.location.search}`);
          const next = back ? `&next=${encodeURIComponent(back)}` : '';
          window.location.href = `${isVet ? '/vet/login' : '/owner/login'}?expired=true${next}`;
        }
      }
    }
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    const detail: unknown = error?.detail ?? 'Request failed';
    throw new ApiError(response.status, translateDetail(response.status, detail), detail);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

export const api = {
  get: <T>(endpoint: string) => fetchApi<T>(endpoint, { cache: 'no-store' }),

  post: <T>(endpoint: string, data: unknown) =>
    fetchApi<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  put: <T>(endpoint: string, data: unknown) =>
    fetchApi<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  patch: <T>(endpoint: string, data: unknown) =>
    fetchApi<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: <T>(endpoint: string) =>
    fetchApi<T>(endpoint, {
      method: 'DELETE',
    }),

  upload: async <T>(endpoint: string, file: File): Promise<T> => {
    const url = `${API_BASE_URL}${endpoint}`;
    const formData = new FormData();
    formData.append('file', file);

    let response: Response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
        },
        body: formData,
      });
    } catch {
      throw new ApiError(0, NETWORK_ERROR_MESSAGE, 'Network error');
    }
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Upload failed' }));
      const detail: unknown = error?.detail ?? 'Upload failed';
      throw new ApiError(response.status, translateDetail(response.status, detail), detail);
    }
    return response.json();
  },
};

export { ApiError };

export function getImageUrl(path: string | null | undefined): string | undefined {
  if (!path) return undefined;
  const base = API_BASE_URL.replace('/api/v1', '');
  return `${base}${path}`;
}
