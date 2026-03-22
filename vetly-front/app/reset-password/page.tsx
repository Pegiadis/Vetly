'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { api, ApiError } from '@/lib/api';
import PasswordStrengthIndicator from '@/components/PasswordStrengthIndicator';

interface ResetResponse {
  access_token: string;
  token_type: string;
  message: string;
}

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { login } = useAuth();
  const token = searchParams.get('token') || '';

  const [userType, setUserType] = useState<'vet' | 'pet_owner'>('pet_owner');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) return;
    try {
      const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      if (payload.type === 'vet' || payload.type === 'pet_owner') {
        setUserType(payload.type);
      }
    } catch {
      // ignore decode errors
    }
  }, [token]);

  const isTeal = userType === 'pet_owner';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Οι κωδικοί δεν ταιριάζουν.');
      return;
    }
    if (password.length < 6) {
      setError('Ο κωδικός πρέπει να έχει τουλάχιστον 6 χαρακτήρες.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.post<ResetResponse>('/auth/reset-password', {
        token,
        new_password: password,
      });

      setSuccess(true);

      let resolvedType: 'vet' | 'pet_owner' = userType;
      try {
        const payload = JSON.parse(atob(response.access_token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
        if (payload.type === 'vet' || payload.type === 'pet_owner') {
          resolvedType = payload.type;
        }
      } catch {
        // ignore
      }

      await login(response.access_token, resolvedType);
      const dashboard = resolvedType === 'vet' ? '/vet/dashboard' : '/owner/dashboard';
      router.push(dashboard);
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

  if (!token) {
    return (
      <div className={`min-h-screen flex items-center justify-center py-12 px-4 ${isTeal ? 'bg-teal-50' : 'bg-indigo-50'}`}>
        <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-xl border border-slate-100 text-center space-y-4">
          <div className="mx-auto h-16 w-16 rounded-full flex items-center justify-center bg-red-100 text-red-600">
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900">Μη έγκυρος σύνδεσμος</h2>
          <p className="text-sm text-slate-600">Ο σύνδεσμος επαναφοράς δεν είναι έγκυρος.</p>
          <Link
            href={`/forgot-password?userType=${userType}`}
            className={`inline-block py-3 px-6 text-sm font-bold rounded-xl text-white transition-all ${
              isTeal ? 'bg-teal-600 hover:bg-teal-700' : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            Νέο αίτημα επαναφοράς
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden ${isTeal ? 'bg-teal-50' : 'bg-indigo-50'}`}>
      <div className={`absolute top-[-10%] right-[-10%] w-[600px] h-[600px] ${isTeal ? 'bg-teal-600/10' : 'bg-indigo-600/10'} rounded-full filter blur-[80px]`} />

      <div className="max-w-md w-full space-y-6 bg-white p-8 rounded-3xl shadow-xl relative z-10 border border-slate-100">
        <div className="text-center">
          <div className={`mx-auto h-16 w-16 rounded-full flex items-center justify-center mb-4 ${isTeal ? 'bg-teal-100 text-teal-600' : 'bg-indigo-100 text-indigo-600'}`}>
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Νέος Κωδικός
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Εισάγετε τον νέο κωδικό πρόσβασης.
          </p>
        </div>

        {success ? (
          <div className="text-center space-y-4">
            <div className="mx-auto h-16 w-16 rounded-full flex items-center justify-center bg-green-100 text-green-600">
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-slate-700 font-medium">Ο κωδικός ενημερώθηκε!</p>
            <p className="text-sm text-slate-500">Ανακατεύθυνση στο dashboard...</p>
          </div>
        ) : (
          <>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                {error}
                {error.includes('ληγμένος') && (
                  <Link
                    href={`/forgot-password?userType=${userType}`}
                    className={`block mt-2 font-bold ${isTeal ? 'text-teal-600' : 'text-indigo-600'}`}
                  >
                    Νέο αίτημα επαναφοράς
                  </Link>
                )}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="password" className="sr-only">Νέος Κωδικός</label>
                <input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`appearance-none rounded-xl relative block w-full px-4 py-3 border border-slate-300 placeholder-slate-500 text-slate-900 focus:outline-none focus:ring-2 focus:z-10 sm:text-sm transition-colors ${
                    isTeal ? 'focus:ring-teal-500 focus:border-teal-500' : 'focus:ring-indigo-500 focus:border-indigo-500'
                  }`}
                  placeholder="Νέος Κωδικός"
                />
                <PasswordStrengthIndicator password={password} colorScheme={isTeal ? 'teal' : 'indigo'} />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="sr-only">Επιβεβαίωση Κωδικού</label>
                <input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`appearance-none rounded-xl relative block w-full px-4 py-3 border placeholder-slate-500 text-slate-900 focus:outline-none focus:ring-2 focus:z-10 sm:text-sm transition-colors ${
                    confirmPassword && password !== confirmPassword
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                      : `border-slate-300 ${isTeal ? 'focus:ring-teal-500 focus:border-teal-500' : 'focus:ring-indigo-500 focus:border-indigo-500'}`
                  }`}
                  placeholder="Επιβεβαίωση Κωδικού"
                />
                {confirmPassword && password !== confirmPassword && (
                  <p className="text-xs text-red-600 mt-1">Οι κωδικοί δεν ταιριάζουν.</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || password.length < 6 || password !== confirmPassword}
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
                  'Αλλαγή Κωδικού'
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin h-8 w-8 border-4 border-slate-300 border-t-teal-600 rounded-full" />
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
