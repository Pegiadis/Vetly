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

export default function OwnerRegisterPage() {
  const router = useRouter();
  const { login, isAuthenticated, userType, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && isAuthenticated && userType === 'pet_owner') {
      router.replace('/owner/dashboard');
    }
  }, [isLoading, isAuthenticated, userType, router]);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Οι κωδικοί δεν ταιριάζουν.');
      return;
    }

    if (formData.password.length < 6) {
      setError('Ο κωδικός πρέπει να έχει τουλάχιστον 6 χαρακτήρες.');
      return;
    }

    setLoading(true);

    try {
      await api.post('/auth/pet-owner/register', {
        name: formData.name,
        email: formData.email,
        password: formData.password,
      });

      const tokenResponse = await api.post<TokenResponse>('/auth/pet-owner/login', {
        email: formData.email,
        password: formData.password,
      });

      await login(tokenResponse.access_token, 'pet_owner');
      router.push('/owner/dashboard');
    } catch (err) {
      if (err instanceof ApiError) {
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Εγγραφή στο Vetly
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Δημιουργήστε λογαριασμό για να διαχειριστείτε τα κατοικίδιά σας.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        {/* Registration Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="sr-only">Ονοματεπώνυμο</label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="appearance-none rounded-xl relative block w-full px-4 py-3 border border-slate-300 placeholder-slate-500 text-slate-900 focus:outline-none focus:ring-2 focus:z-10 sm:text-sm transition-colors focus:ring-teal-500 focus:border-teal-500"
                placeholder="Ονοματεπώνυμο"
              />
            </div>
            <div>
              <label htmlFor="email" className="sr-only">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
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
                autoComplete="new-password"
                required
                value={formData.password}
                onChange={handleChange}
                className="appearance-none rounded-xl relative block w-full px-4 py-3 border border-slate-300 placeholder-slate-500 text-slate-900 focus:outline-none focus:ring-2 focus:z-10 sm:text-sm transition-colors focus:ring-teal-500 focus:border-teal-500"
                placeholder="Κωδικός Πρόσβασης"
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="sr-only">Επιβεβαίωση Κωδικού</label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                className="appearance-none rounded-xl relative block w-full px-4 py-3 border border-slate-300 placeholder-slate-500 text-slate-900 focus:outline-none focus:ring-2 focus:z-10 sm:text-sm transition-colors focus:ring-teal-500 focus:border-teal-500"
                placeholder="Επιβεβαίωση Κωδικού"
              />
            </div>
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
                'Δημιουργία Λογαριασμού'
              )}
            </button>
          </div>
        </form>

        {/* Login Link */}
        <div className="text-center mt-4">
          <p className="text-sm text-slate-600">
            Έχετε ήδη λογαριασμό;{' '}
            <Link href="/owner/login" className="font-bold text-teal-600 hover:text-teal-500">
              Σύνδεση
            </Link>
          </p>

          {/* Vet Registration Link */}
          <div className="border-t border-slate-100 pt-4 mt-6">
            <Link
              href="/vet/register"
              className="text-xs font-medium text-slate-400 hover:text-indigo-600 flex items-center justify-center gap-1 mx-auto transition-colors"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Είστε Κτηνίατρος; Εγγραφή Επαγγελματία
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
