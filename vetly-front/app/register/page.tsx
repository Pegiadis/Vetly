'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setTouched(prev => ({ ...prev, [e.target.name]: true }));
    if (e.target.name === 'email') setEmailTaken(false);
    setError('');
  };

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const fieldErrors: Record<string, string> = {};
  if (formData.name.length > 0 && formData.name.trim().length < 2) fieldErrors.name = 'Τουλάχιστον 2 χαρακτήρες.';
  if (emailTaken) fieldErrors.email = 'Αυτό το email χρησιμοποιείται ήδη.';
  if (formData.password.length > 0 && formData.password.length < 6) fieldErrors.password = 'Τουλάχιστον 6 χαρακτήρες.';
  if (formData.confirmPassword.length > 0 && formData.password !== formData.confirmPassword) fieldErrors.confirmPassword = 'Οι κωδικοί δεν ταιριάζουν.';

  const inputErr = (field: string) => touched[field] && fieldErrors[field] ? 'border-red-300 bg-red-50/30' : 'border-ink-300';
  const inputBase = "block h-10 w-full rounded-[10px] border bg-white px-3 text-sm text-ink-900 placeholder:text-ink-400 focus:border-clinic-600 focus:outline-2 focus:outline-offset-1 focus:outline-clinic-200";

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
      if (err instanceof ApiError && err.message === 'Email already registered') {
        setEmailTaken(true);
      } else if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Παρουσιάστηκε σφάλμα. Δοκιμάστε ξανά.');
      }
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-ink-50 px-4 py-10 text-ink-800">
      <div className="w-full max-w-sm">
        <Image src="/branding/vetly-logo-transparent.png" alt="Vetly" width={2109} height={746} sizes="120px" preload className="mx-auto h-auto w-[120px]" />

        <div className="mt-6 rounded-xl border border-ink-200 bg-white p-6">
          <h1 className="text-xl font-semibold tracking-tight text-ink-900">Δημιουργία λογαριασμού</h1>
          <p className="mt-1 text-sm text-ink-500">Για ιδιοκτήτες κατοικιδίων. Χρειάζεται ένα λεπτό.</p>

          {error && (
            <div role="alert" className="mt-4 rounded-[10px] bg-red-50 px-3 py-2.5 text-sm text-red-700">
              {error}
            </div>
          )}

          <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="name" className="mb-1.5 block text-xs font-medium text-ink-700">Ονοματεπώνυμο</label>
              <input id="name" name="name" type="text" autoComplete="name" required minLength={2} maxLength={255} value={formData.name} onChange={handleChange} onBlur={() => handleBlur('name')} className={`${inputBase} ${inputErr('name')}`} />
              {touched.name && fieldErrors.name && <p className="mt-1 text-xs text-red-600">{fieldErrors.name}</p>}
            </div>
            <div>
              <label htmlFor="email" className="mb-1.5 block text-xs font-medium text-ink-700">Email</label>
              <input id="email" name="email" type="email" autoComplete="email" required value={formData.email} onChange={handleChange} onBlur={() => handleBlur('email')} className={`${inputBase} ${inputErr('email')}`} />
              {touched.email && fieldErrors.email && <p className="mt-1 text-xs text-red-600">{fieldErrors.email}</p>}
            </div>
            <div>
              <label htmlFor="password" className="mb-1.5 block text-xs font-medium text-ink-700">Κωδικός</label>
              <input id="password" name="password" type="password" autoComplete="new-password" required minLength={6} maxLength={128} value={formData.password} onChange={handleChange} onBlur={() => handleBlur('password')} className={`${inputBase} ${inputErr('password')}`} />
              <PasswordStrengthIndicator password={formData.password} colorScheme="teal" />
              {touched.password && fieldErrors.password && <p className="mt-1 text-xs text-red-600">{fieldErrors.password}</p>}
            </div>
            <div>
              <label htmlFor="confirmPassword" className="mb-1.5 block text-xs font-medium text-ink-700">Επιβεβαίωση κωδικού</label>
              <input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" required minLength={6} maxLength={128} value={formData.confirmPassword} onChange={handleChange} onBlur={() => handleBlur('confirmPassword')} className={`${inputBase} ${inputErr('confirmPassword')}`} />
              {touched.confirmPassword && fieldErrors.confirmPassword && <p className="mt-1 text-xs text-red-600">{fieldErrors.confirmPassword}</p>}
            </div>
            <button type="submit" disabled={loading} className="flex h-10 w-full items-center justify-center rounded-[10px] bg-clinic-600 text-sm font-medium text-white transition-colors hover:bg-clinic-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clinic-600 disabled:opacity-70">
              {loading ? (
                <svg className="h-5 w-5 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-label="Παρακαλώ περιμένετε">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : 'Δημιουργία λογαριασμού'}
            </button>
          </form>
        </div>

        <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-ink-200 bg-white px-4 py-3">
          <p className="text-sm text-ink-600">Έχετε ήδη λογαριασμό;</p>
          <Link href="/owner/login" className="inline-flex h-8 shrink-0 items-center rounded-[10px] bg-black/[0.06] px-3 text-[13px] font-medium text-ink-900 hover:bg-black/10">Σύνδεση</Link>
        </div>

        <p className="mt-5 text-center text-xs text-ink-500">
          Είστε κτηνίατρος; <Link href="/vet/register" className="font-medium text-clinic-700 underline-offset-4 hover:underline">Εγγραφή ιατρείου</Link>
        </p>
      </div>
    </div>
  );
}
