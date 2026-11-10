'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

const primary =
  'inline-flex min-h-8 items-center justify-center rounded-[10px] bg-clinic-600 px-4 text-[13px] font-medium text-white hover:bg-clinic-700';
const secondary =
  'inline-flex min-h-8 items-center justify-center rounded-[10px] bg-black/[0.06] px-4 text-[13px] font-medium text-ink-900 hover:bg-black/10';

/**
 * Booking call to action for the public vet profile. The booking page is
 * reached with the vet's id; visitors who are not signed in go through
 * sign-in or registration first and come back to the same booking link.
 */
export default function BookCta({ vetId }: { vetId: string }) {
  const { userType, isLoading } = useAuth();
  const bookPath = `/owner/book?vet=${encodeURIComponent(vetId)}`;
  const next = encodeURIComponent(bookPath);

  if (isLoading) {
    return (
      <span aria-hidden="true" className="inline-flex min-h-8 items-center rounded-[10px] bg-black/[0.06] px-4 text-[13px] text-transparent">
        Κλείσε ραντεβού
      </span>
    );
  }

  if (userType === 'pet_owner') {
    return (
      <Link href={bookPath} className={primary}>
        Κλείσε ραντεβού
      </Link>
    );
  }

  if (userType === 'vet') {
    return (
      <div className="min-w-0">
        <button type="button" disabled className="inline-flex min-h-8 cursor-not-allowed items-center justify-center rounded-[10px] bg-black/[0.06] px-4 text-[13px] font-medium text-ink-400">
          Κλείσε ραντεβού
        </button>
        <p className="mt-1 text-xs text-ink-500">Οι κρατήσεις γίνονται από λογαριασμούς ιδιοκτητών.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Link href={`/owner/login?next=${next}`} className={primary}>
        Κλείσε ραντεβού
      </Link>
      <Link href={`/register?next=${next}`} className={secondary}>
        Δημιουργία λογαριασμού
      </Link>
    </div>
  );
}
