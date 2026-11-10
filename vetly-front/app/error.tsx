'use client';

import Link from 'next/link';
import { AssistantAvatar } from '@/components/AssistantAvatar';

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <main className="grid min-h-screen place-items-center bg-ink-50 px-4 py-12 text-ink-800">
    <div role="alert" className="w-full max-w-md rounded-xl border border-ink-200 bg-white p-6 text-center sm:p-8">
      <AssistantAvatar size={96} animated={false} className="mx-auto" />
      <h1 className="mt-5 text-2xl font-semibold tracking-tight text-ink-900">Κάτι πήγε στραβά</h1>
      <p className="mt-2 text-sm leading-6 text-ink-600">Παρουσιάστηκε απρόσμενο σφάλμα. Δοκιμάστε ξανά ή επιστρέψτε στην αρχική σελίδα.</p>
      {error.digest && <p className="mt-3 break-all font-mono text-xs text-ink-400">Κωδικός: {error.digest}</p>}
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <button type="button" onClick={reset} className="inline-flex h-10 items-center justify-center rounded-[10px] bg-clinic-600 px-4 text-sm font-medium text-white hover:bg-clinic-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clinic-600">Δοκιμή ξανά</button>
        <Link href="/" className="inline-flex h-10 items-center justify-center rounded-[10px] bg-black/[0.06] px-4 text-sm font-medium text-ink-900 hover:bg-black/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clinic-600">Αρχική σελίδα</Link>
      </div>
    </div>
  </main>;
}
