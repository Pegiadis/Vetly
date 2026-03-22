'use client';

export const dynamic = 'force-dynamic';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api, ApiError } from '@/lib/api';

function ForgotPasswordForm() {
  const searchParams = useSearchParams();
  const userType = searchParams.get('userType') === 'vet' ? 'vet' : 'pet_owner';
  const isTeal = userType === 'pet_owner';

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.post('/auth/forgot-password', {
        email,
        user_type: userType,
      });
      setSent(true);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Παρουσιάστηκε σφάλμα. Δοκιμάστε ξανά.');
      }
    } finally {
      setLoading(false);
    }
  };

  const loginHref = userType === 'vet' ? '/vet/login' : '/owner/login';
  const appName = userType === 'vet' ? 'Vetly Pro' : 'Vetly';

  return (
    <div className={`min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden ${isTeal ? 'bg-teal-50' : 'bg-indigo-50'}`}>
      <div className={`absolute top-[-10%] right-[-10%] w-[600px] h-[600px] ${isTeal ? 'bg-teal-600/10' : 'bg-indigo-600/10'} rounded-full filter blur-[80px]`} />

      <div className="max-w-md w-full space-y-6 bg-white p-8 rounded-3xl shadow-xl relative z-10 border border-slate-100">
        <div className="text-center">
          <div className={`mx-auto h-16 w-16 rounded-full flex items-center justify-center mb-4 ${isTeal ? 'bg-teal-100 text-teal-600' : 'bg-indigo-100 text-indigo-600'}`}>
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Ξεχάσατε τον κωδικό;
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Εισάγετε το email σας και θα σας στείλουμε σύνδεσμο επαναφοράς.
          </p>
        </div>

        {sent ? (
          <div className="text-center space-y-4">
            <div className="mx-auto h-16 w-16 rounded-full flex items-center justify-center bg-green-100 text-green-600">
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-slate-700 font-medium">Ελέγξτε το email σας</p>
            <p className="text-sm text-slate-500">
              Αν το email υπάρχει στο σύστημα, θα λάβετε σύνδεσμο επαναφοράς κωδικού.
            </p>
            <Link
              href={loginHref}
              className={`inline-block mt-4 py-3 px-6 text-sm font-bold rounded-xl text-white transition-all ${
                isTeal ? 'bg-teal-600 hover:bg-teal-700' : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              Επιστροφή στην Είσοδο
            </Link>
          </div>
        ) : (
          <>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="sr-only">Email</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`appearance-none rounded-xl relative block w-full px-4 py-3 border border-slate-300 placeholder-slate-500 text-slate-900 focus:outline-none focus:ring-2 focus:z-10 sm:text-sm transition-colors ${
                    isTeal ? 'focus:ring-teal-500 focus:border-teal-500' : 'focus:ring-indigo-500 focus:border-indigo-500'
                  }`}
                  placeholder="Email"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all disabled:opacity-70 ${
                  isTeal ? 'bg-teal-600 hover:bg-teal-700' : 'bg-indigo-900 hover:bg-indigo-800'
                }`}
              >
                {loading ? (
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : (
                  'Αποστολή Συνδέσμου'
                )}
              </button>
            </form>

            <div className="text-center">
              <Link
                href={loginHref}
                className={`text-sm font-medium transition-colors ${
                  isTeal ? 'text-teal-600 hover:text-teal-700' : 'text-indigo-600 hover:text-indigo-700'
                }`}
              >
                Επιστροφή στην Είσοδο
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin h-8 w-8 border-4 border-slate-300 border-t-teal-600 rounded-full" />
      </div>
    }>
      <ForgotPasswordForm />
    </Suspense>
  );
}
