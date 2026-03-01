'use client';

interface ErrorFallbackProps {
  error: Error & { digest?: string };
  reset: () => void;
  colorScheme?: 'teal' | 'indigo';
}

export default function ErrorFallback({ error, reset, colorScheme = 'teal' }: ErrorFallbackProps) {
  const buttonClass =
    colorScheme === 'indigo'
      ? 'px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors'
      : 'px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors';

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
      <div className="text-center">
        <div className="text-6xl mb-4">⚠️</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Κάτι πήγε στραβά
        </h2>
        <p className="text-gray-600 mb-6">
          Παρουσιάστηκε ένα σφάλμα. Παρακαλώ δοκιμάστε ξανά.
        </p>
        {error?.digest && (
          <p className="text-xs text-gray-400 mb-4 font-mono">Κωδικός: {error.digest}</p>
        )}
        <button onClick={reset} className={buttonClass}>
          Δοκιμάστε ξανά
        </button>
      </div>
    </div>
  );
}
