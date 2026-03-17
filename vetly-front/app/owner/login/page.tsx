'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { api, ApiError } from '@/lib/api';

interface TokenResponse {
  access_token: string;
  token_type: string;
}

export default function OwnerLoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, userType, isLoading } = useAuth();
  const [email, setEmail] = useState('');

  useEffect(() => {
    if (!isLoading && isAuthenticated && userType === 'pet_owner') {
      router.replace('/owner/dashboard');
    }
  }, [isLoading, isAuthenticated, userType, router]);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post<TokenResponse>('/auth/pet-owner/login', {
        email,
        password,
      });

      await login(response.access_token, 'pet_owner', rememberMe);
      router.push('/owner/dashboard');
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 403) {
          router.push(`/verify-email/pending?email=${encodeURIComponent(email)}&userType=pet_owner`);
          return;
        }
        setError(err.message);
      } else {
        setError('Παρουσιάστηκε σφάλμα. Δοκιμάστε ξανά.');
      }
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-teal-50 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-teal-600/10 rounded-full filter blur-[80px]" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-indigo-600/5 rounded-full filter blur-[80px]" />

      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-3xl shadow-xl relative z-10 border border-slate-100">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 rounded-full flex items-center justify-center mb-4 bg-teal-100 text-teal-600">
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Vetly
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Διαχειριστείτε τα κατοικίδιά σας με ευκολία.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        {/* Login Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
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
                className="appearance-none rounded-xl relative block w-full px-4 py-3 border border-slate-300 placeholder-slate-500 text-slate-900 focus:outline-none focus:ring-2 focus:z-10 sm:text-sm transition-colors focus:ring-teal-500 focus:border-teal-500"
                placeholder="Email"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Κωδικός</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none rounded-xl relative block w-full px-4 py-3 border border-slate-300 placeholder-slate-500 text-slate-900 focus:outline-none focus:ring-2 focus:z-10 sm:text-sm transition-colors focus:ring-teal-500 focus:border-teal-500"
                placeholder="Κωδικός Πρόσβασης"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 border-slate-300 rounded text-teal-600 focus:ring-teal-500"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-900">
                Απομνημόνευση
              </label>
            </div>
            <Link
              href="/forgot-password?userType=pet_owner"
              className="text-sm font-medium text-teal-600 hover:text-teal-500"
            >
              Ξεχάσατε τον κωδικό;
            </Link>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all disabled:opacity-70 bg-teal-600 hover:bg-teal-700"
            >
              {loading ? (
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                'Είσοδος'
              )}
            </button>
          </div>
        </form>

        {/* Registration Link */}
        <div className="text-center mt-4">
          <div className="bg-teal-50 p-6 rounded-2xl border border-teal-100">
            <h3 className="text-lg font-bold text-slate-800 mb-2">Νέος Χρήστης;</h3>
            <p className="text-sm text-slate-600 mb-4">
              Δημιουργήστε λογαριασμό για να διαχειριστείτε τα κατοικίδιά σας.
            </p>
            <Link
              href="/register"
              className="w-full inline-flex items-center justify-center gap-2 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold shadow-lg shadow-teal-200 transition-all"
            >
              Εγγραφή
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          {/* Vet Login Link */}
          <div className="border-t border-slate-100 pt-4 mt-6">
            <Link
              href="/vet/login"
              className="text-xs font-medium text-slate-400 hover:text-indigo-600 flex items-center justify-center gap-1 mx-auto transition-colors"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Είστε Κτηνίατρος; Είσοδος Επαγγελματία
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
