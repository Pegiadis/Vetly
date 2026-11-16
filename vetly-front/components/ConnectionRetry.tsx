'use client';

interface ConnectionRetryProps {
  onRetry: () => void;
  /** 'network' when the request never reached the server, 'unavailable' for a server error. */
  reason: 'network' | 'unavailable';
}

/** Full-page state shown when the session profile could not be loaded but the user is still signed in. */
export default function ConnectionRetry({ onRetry, reason }: ConnectionRetryProps) {
  return (
    <main className="grid min-h-screen place-items-center bg-ink-50 px-4 py-12 text-ink-800">
      <div role="alert" className="w-full max-w-md rounded-xl border border-ink-200 bg-white p-6 text-center sm:p-8">
        <h1 className="text-xl font-semibold tracking-tight text-ink-900">
          {reason === 'network' ? 'Δεν υπάρχει σύνδεση' : 'Η υπηρεσία δεν ανταποκρίνεται'}
        </h1>
        <p className="mt-2 text-sm leading-6 text-ink-600">
          {reason === 'network'
            ? 'Δεν ήταν δυνατή η σύνδεση με τον διακομιστή. Παραμένετε συνδεδεμένος και θα δοκιμάσουμε ξανά αυτόματα.'
            : 'Ο διακομιστής αντιμετωπίζει πρόβλημα αυτή τη στιγμή. Παραμένετε συνδεδεμένος και θα δοκιμάσουμε ξανά αυτόματα.'}
        </p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-6 inline-flex h-10 items-center justify-center rounded-[10px] bg-clinic-600 px-4 text-sm font-medium text-white hover:bg-clinic-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clinic-600"
        >
          Δοκιμή ξανά
        </button>
      </div>
    </main>
  );
}
