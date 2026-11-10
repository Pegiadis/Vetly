import type { Metadata } from 'next';
import Link from 'next/link';
import { AssistantAvatar } from '@/components/AssistantAvatar';

export const metadata: Metadata = { title: 'Η σελίδα δεν βρέθηκε' };

const primary = 'inline-flex h-10 items-center justify-center rounded-[10px] bg-clinic-600 px-4 text-sm font-medium text-white hover:bg-clinic-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clinic-600';
const secondary = 'inline-flex h-10 items-center justify-center rounded-[10px] bg-black/[0.06] px-4 text-sm font-medium text-ink-900 hover:bg-black/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clinic-600';

export default function NotFound() {
  return <main className="grid min-h-screen place-items-center bg-ink-50 px-4 py-12 text-ink-800">
    <div className="w-full max-w-md rounded-xl border border-ink-200 bg-white p-6 text-center sm:p-8">
      <AssistantAvatar size={96} className="mx-auto" />
      <p className="mt-5 text-xs font-semibold text-clinic-700">Σφάλμα 404</p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink-900">Δεν βρήκαμε αυτή τη σελίδα</h1>
      <p className="mt-2 text-sm leading-6 text-ink-600">Ο σύνδεσμος μπορεί να είναι λάθος ή η σελίδα να έχει μετακινηθεί. Δοκιμάστε να ξεκινήσετε από την αρχική.</p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Link href="/" className={primary}>Αρχική σελίδα</Link>
        <Link href="/owner/login" className={secondary}>Σύνδεση</Link>
      </div>
    </div>
  </main>;
}
