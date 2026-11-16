'use client';

interface ErrorFallbackProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/** In-page error state for route error boundaries inside a dashboard shell. */
export default function ErrorFallback({ error, reset }: ErrorFallbackProps) {
  return (
    <div className="flex min-h-[400px] items-center justify-center p-6">
      <div role="alert" className="w-full max-w-md rounded-xl border border-ink-200 bg-white p-6 text-center">
        <h2 className="text-lg font-semibold tracking-tight text-ink-900">Κάτι πήγε στραβά</h2>
        <p className="mt-2 text-sm leading-6 text-ink-600">
          Παρουσιάστηκε απρόσμενο σφάλμα σε αυτή τη σελίδα. Δοκιμάστε ξανά ή επιλέξτε άλλη ενότητα από το μενού.
        </p>
        {error?.digest && (
          <p className="mt-3 break-all font-mono text-xs text-ink-400">Κωδικός: {error.digest}</p>
        )}
        <button
          type="button"
          onClick={reset}
          className="mt-5 inline-flex min-h-8 items-center justify-center rounded-[10px] bg-clinic-600 px-4 py-1 text-[13px] font-medium text-white transition-colors hover:bg-clinic-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clinic-600"
        >
          Δοκιμή ξανά
        </button>
      </div>
    </div>
  );
}
