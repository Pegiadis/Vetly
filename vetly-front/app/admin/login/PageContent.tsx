'use client';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { ApiError } from '@/lib/api';
import { adminApi, getAdminToken, setAdminToken } from '@/lib/admin-api';

export default function AdminLoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionExpired = searchParams.get('expired') === 'true';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (getAdminToken()) router.replace('/admin');
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await adminApi.post<{ access_token: string }>('/login', { email, password });
      setAdminToken(response.access_token);
      router.replace('/admin');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Παρουσιάστηκε σφάλμα. Δοκιμάστε ξανά.');
      setLoading(false);
    }
  };

  const field = 'block h-10 w-full rounded-[10px] border border-ink-300 bg-white px-3 text-sm text-ink-900 placeholder:text-ink-400 focus:border-clinic-600 focus:outline-2 focus:outline-offset-1 focus:outline-clinic-200';

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-ink-50 px-4 py-10 text-ink-800">
      <div className="w-full max-w-sm">
        <Image src="/branding/vetly-logo-transparent.png" alt="Vetly" width={2109} height={746} sizes="120px" preload className="mx-auto h-auto w-[120px]" />

        <div className="mt-6 rounded-xl border border-ink-200 bg-white p-6">
          <h1 className="text-xl font-semibold tracking-tight text-ink-900">Διαχείριση Vetly</h1>
          <p className="mt-1 text-sm text-ink-500">Μόνο για την ομάδα του Vetly.</p>

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
              <input id="email" name="email" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} className={field} />
            </div>
            <div>
              <label htmlFor="password" className="mb-1.5 block text-xs font-medium text-ink-700">Κωδικός</label>
              <input id="password" name="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} className={field} />
            </div>
            <button type="submit" disabled={loading} className="flex h-10 w-full items-center justify-center rounded-[10px] bg-clinic-600 text-sm font-medium text-white transition-colors hover:bg-clinic-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clinic-600 disabled:opacity-70">
              {loading ? 'Σύνδεση…' : 'Είσοδος'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
