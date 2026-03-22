'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';

export default function VerifyEmailPendingPage() {
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
    <div className={`min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden ${isTeal ? 'bg-teal-50' : 'bg-indigo-50'}`}>
      <div className={`absolute top-[-10%] right-[-10%] w-[600px] h-[600px] ${isTeal ? 'bg-teal-600/10' : 'bg-indigo-600/10'} rounded-full filter blur-[80px]`} />
      <div className={`absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] ${isTeal ? 'bg-indigo-600/5' : 'bg-teal-600/5'} rounded-full filter blur-[80px]`} />

      <div className="max-w-md w-full space-y-6 bg-white p-8 rounded-3xl shadow-xl relative z-10 border border-slate-100 text-center">
        <div className={`mx-auto h-20 w-20 rounded-full flex items-center justify-center ${isTeal ? 'bg-teal-100 text-teal-600' : 'bg-indigo-100 text-indigo-600'}`}>
          <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>

        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Ελέγξτε το email σας
          </h2>
          <p className="mt-3 text-sm text-slate-600 leading-relaxed">
            Σας στείλαμε ένα email στο{' '}
            <span className="font-semibold text-slate-800">{email}</span>.
            Πατήστε τον σύνδεσμο για να επιβεβαιώσετε τον λογαριασμό σας.
          </p>
        </div>

        {resent && (
          <div className={`${isTeal ? 'bg-teal-50 border-teal-200 text-teal-700' : 'bg-indigo-50 border-indigo-200 text-indigo-700'} border px-4 py-3 rounded-xl text-sm`}>
            Νέο email επιβεβαίωσης εστάλη!
          </div>
        )}

        <button
          onClick={handleResend}
          disabled={cooldown > 0 || resending}
          className={`w-full py-3 px-4 border-2 text-sm font-bold rounded-xl transition-all disabled:opacity-50 ${
            isTeal
              ? 'border-teal-600 text-teal-600 hover:bg-teal-50'
              : 'border-indigo-600 text-indigo-600 hover:bg-indigo-50'
          }`}
        >
          {resending ? 'Αποστολή...' : cooldown > 0 ? `Αποστολή ξανά (${cooldown}s)` : 'Αποστολή ξανά'}
        </button>

        <Link
          href={loginPath}
          className="block text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors"
        >
          Επιστροφή στη σύνδεση
        </Link>
      </div>
    </div>
  );
}
