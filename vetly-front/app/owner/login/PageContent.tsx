'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { api, ApiError } from '@/lib/api';

interface TokenResponse {
  access_token: string;
  token_type: string;
}

export default function OwnerLoginPageContent() {
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
  const searchParams = useSearchParams();
  const sessionExpired = searchParams.get('expired') === 'true';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post<TokenResponse>('/auth/pet-owner/login', {
        email,
        password,
      });

      await login(response.access_token, 'pet_owner');
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

  const field = 'block h-10 w-full rounded-[10px] border bg-white px-3 text-sm text-ink-900 placeholder:text-ink-400 focus:border-clinic-600 focus:outline-2 focus:outline-offset-1 focus:outline-clinic-200 border-ink-300';

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-ink-50 px-4 py-10 text-ink-800">
      <div className="w-full max-w-sm">
        <Image src="/branding/vetly-logo-transparent.png" alt="Vetly" width={2109} height={746} sizes="120px" preload className="mx-auto h-auto w-[120px]" />

        <div className="mt-6 rounded-xl border border-ink-200 bg-white p-6">
          <h1 className="text-xl font-semibold tracking-tight text-ink-900">Καλώς ήρθατε</h1>
          <p className="mt-1 text-sm text-ink-500">Συνδεθείτε για τα κατοικίδιά σας και τα ραντεβού τους.</p>

          {sessionExpired && !error && (
            <div role="status" className="mt-4 rounded-[10px] bg-[#fff1e4] px-3 py-2.5 text-sm text-[#8a3f0c]">
              Η συνεδρία σας έληξε. Συνδεθείτε ξανά.
            </div>
          )}
          {error && (
            <div role="alert" className="mt-4 rounded-[10px] bg-red-50 px-3 py-2.5 text-sm text-red-700">
              {error}
            </div>
          )}

          <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="mb-1.5 block text-xs font-medium text-ink-700">Email</label>
              <input id="email" name="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={field} placeholder="onoma@email.gr" />
            </div>
            <div>
              <div className="mb-1.5 flex items-baseline justify-between gap-2">
                <label htmlFor="password" className="block text-xs font-medium text-ink-700">Κωδικός</label>
                <Link href="/forgot-password?userType=pet_owner" className="text-xs font-medium text-clinic-700 underline-offset-4 hover:underline">Ξεχάσατε τον κωδικό;</Link>
              </div>
              <input id="password" name="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} className={field} />
            </div>
            <button type="submit" disabled={loading} className="flex h-10 w-full items-center justify-center rounded-[10px] bg-clinic-600 text-sm font-medium text-white transition-colors hover:bg-clinic-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clinic-600 disabled:opacity-70">
              {loading ? (
                <svg className="h-5 w-5 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-label="Παρακαλώ περιμένετε">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : 'Είσοδος'}
            </button>
          </form>
        </div>

        <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-ink-200 bg-white px-4 py-3">
          <p className="text-sm text-ink-600">Πρώτη φορά στο Vetly;</p>
          <Link href="/register" className="inline-flex h-8 shrink-0 items-center rounded-[10px] bg-black/[0.06] px-3 text-[13px] font-medium text-ink-900 hover:bg-black/10">Δημιουργία λογαριασμού</Link>
        </div>

        <p className="mt-5 text-center text-xs text-ink-500">
          Είστε κτηνίατρος; <Link href="/vet/login" className="font-medium text-clinic-700 underline-offset-4 hover:underline">Είσοδος κτηνιατρείου</Link>
        </p>
      </div>
    </div>
  );
}
