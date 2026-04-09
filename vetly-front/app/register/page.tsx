'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { api, ApiError } from '@/lib/api';
import PasswordStrengthIndicator from '@/components/PasswordStrengthIndicator';

export default function OwnerRegisterPage() {
  const router = useRouter();
  const { isAuthenticated, userType, isLoading } = useAuth();

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
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [emailTaken, setEmailTaken] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);

  const checkEmailAvailability = useCallback(async (email: string) => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;
    setCheckingEmail(true);
    try {
      const result = await api.get<{ available: boolean }>(`/auth/check-email?email=${encodeURIComponent(email)}&user_type=pet_owner`);
      setEmailTaken(!result.available);
    } catch {
      // Silently fail — server-side validation is the fallback
    } finally {
      setCheckingEmail(false);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setTouched(prev => ({ ...prev, [e.target.name]: true }));
    if (e.target.name === 'email') setEmailTaken(false);
    setError('');
  };

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    if (field === 'email') checkEmailAvailability(formData.email);
  };

  const fieldErrors: Record<string, string> = {};
  if (formData.name.length > 0 && formData.name.trim().length < 2) fieldErrors.name = 'Τουλάχιστον 2 χαρακτήρες.';
  if (emailTaken) fieldErrors.email = 'Αυτό το email χρησιμοποιείται ήδη.';
  if (formData.password.length > 0 && formData.password.length < 6) fieldErrors.password = 'Τουλάχιστον 6 χαρακτήρες.';
  if (formData.confirmPassword.length > 0 && formData.password !== formData.confirmPassword) fieldErrors.confirmPassword = 'Οι κωδικοί δεν ταιριάζουν.';

  const inputErr = (field: string) => touched[field] && fieldErrors[field] ? 'border-red-300 bg-red-50/30' : 'border-slate-300';
  const inputBase = "appearance-none rounded-xl relative block w-full px-4 py-3 border placeholder-slate-500 text-slate-900 focus:outline-none focus:ring-2 focus:z-10 sm:text-sm transition-colors focus:ring-teal-500 focus:border-teal-500";

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

    if (formData.name.trim().length < 2) {
      setError('Το όνομα πρέπει να έχει τουλάχιστον 2 χαρακτήρες.');
      return;
    }

    setLoading(true);

    try {
      await api.post<{ message: string; email: string }>('/auth/pet-owner/register', {
        name: formData.name,
        email: formData.email,
        password: formData.password,
      });

      router.push(`/verify-email/pending?email=${encodeURIComponent(formData.email)}&userType=pet_owner`);
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
          <img
            src="/images/1-tight.jpg"
            alt="Vetly"
            className="mx-auto h-14 w-auto object-contain mb-2"
          />
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Εγγραφή
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
                minLength={2}
                maxLength={255}
                value={formData.name}
                onChange={handleChange}
                onBlur={() => handleBlur('name')}
                className={`${inputBase} ${inputErr('name')}`}
                placeholder="Ονοματεπώνυμο"
              />
              {touched.name && fieldErrors.name && <p className="text-xs text-red-600 mt-1">{fieldErrors.name}</p>}
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
                onBlur={() => handleBlur('email')}
                className={`${inputBase} ${inputErr('email')}`}
                placeholder="Email"
              />
              {checkingEmail && <p className="text-xs text-slate-500 mt-1">Έλεγχος email...</p>}
              {touched.email && fieldErrors.email && <p className="text-xs text-red-600 mt-1">{fieldErrors.email}</p>}
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Κωδικός</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                maxLength={128}
                value={formData.password}
                onChange={handleChange}
                onBlur={() => handleBlur('password')}
                className={`${inputBase} ${inputErr('password')}`}
                placeholder="Κωδικός Πρόσβασης"
              />
              {touched.password && fieldErrors.password && <p className="text-xs text-red-600 mt-1">{fieldErrors.password}</p>}
              <PasswordStrengthIndicator password={formData.password} colorScheme="teal" />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="sr-only">Επιβεβαίωση Κωδικού</label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                maxLength={128}
                value={formData.confirmPassword}
                onChange={handleChange}
                onBlur={() => handleBlur('confirmPassword')}
                className={`${inputBase} ${inputErr('confirmPassword')}`}
                placeholder="Επιβεβαίωση Κωδικού"
              />
              {touched.confirmPassword && fieldErrors.confirmPassword && <p className="text-xs text-red-600 mt-1">{fieldErrors.confirmPassword}</p>}
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
