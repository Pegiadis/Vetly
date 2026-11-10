'use client';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';

export default function VerifyEmailPendingPageContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  const userType = searchParams.get('userType') || 'pet_owner';
  const isTeal = userType === 'pet_owner';

  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleResend = async () => {
    if (cooldown > 0 || resending) return;
    setResending(true);
    try {
      await api.post('/auth/resend-verification', { email, user_type: userType });
      setResent(true);
      setCooldown(60);
    } catch {
      // fail silently
    } finally {
      setResending(false);
    }
  };

  const loginPath = userType === 'vet' ? '/vet/login' : '/owner/login';

  return (
    <div className={`min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-ink-50`}>

      <div className="max-w-sm w-full space-y-5 bg-white p-6 rounded-xl relative z-10 border border-ink-200 text-center">
        <div className={`mx-auto h-20 w-20 rounded-full flex items-center justify-center ${isTeal ? 'bg-teal-100 text-teal-600' : 'bg-clinic-100 text-clinic-700'}`}>
          <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>

        <div>
          <h2 className="text-2xl font-semibold text-ink-900 tracking-tight">
            Ελέγξτε το email σας
          </h2>
          <p className="mt-3 text-sm text-ink-600 leading-relaxed">
            Αν το email{' '}
            {email && <span className="font-semibold text-ink-800">{email}</span>}{' '}
            δεν έχει ήδη λογαριασμό, σας στείλαμε σύνδεσμο επιβεβαίωσης. Πατήστε τον για να ολοκληρώσετε την εγγραφή.
          </p>
          <p className="mt-2 text-sm text-ink-600 leading-relaxed">
            Αν έχετε ήδη λογαριασμό, συνδεθείτε ή επαναφέρετε τον κωδικό σας.
          </p>
        </div>

        {resent && (
          <div className={`${isTeal ? 'bg-teal-50 border-teal-200 text-teal-700' : 'bg-clinic-50 border-clinic-200 text-clinic-800'} border px-3 py-2.5 rounded-[10px] text-sm`}>
            Νέο email επιβεβαίωσης εστάλη!
          </div>
        )}

        <button
          onClick={handleResend}
          disabled={cooldown > 0 || resending}
          className={`w-full px-3 py-2.5 border-2 text-sm font-medium rounded-[10px] transition-all disabled:opacity-50 ${
            isTeal
              ? 'border-teal-600 text-teal-600 hover:bg-teal-50'
              : 'border-clinic-600 text-clinic-700 hover:bg-clinic-50'
          }`}
        >
          {resending ? 'Αποστολή...' : cooldown > 0 ? `Αποστολή ξανά (${cooldown}s)` : 'Αποστολή ξανά'}
        </button>

        <Link
          href={loginPath}
          className="block text-sm font-medium text-ink-500 hover:text-ink-700 transition-colors"
        >
          Επιστροφή στη σύνδεση
        </Link>
      </div>
    </div>
  );
}
