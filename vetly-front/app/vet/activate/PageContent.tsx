'use client';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { api, ApiError } from '@/lib/api';

const MIN_LENGTH = 8;
const field = 'block h-10 w-full rounded-[10px] border border-ink-300 bg-white px-3 text-sm text-ink-900 placeholder:text-ink-400 focus:border-clinic-600 focus:outline-2 focus:outline-offset-1 focus:outline-clinic-200';

/** Where a vet lands from the invite email: the team created the account, the vet sets a password. */
export default function VetActivatePageContent() {
  const router = useRouter();
  const { login } = useAuth();
  const token = useSearchParams().get('token') ?? '';
  const [account, setAccount] = useState<{ name: string; email: string } | null>(null);
  const [linkError, setLinkError] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!token) {
      setLinkError('Ο σύνδεσμος δεν είναι πλήρης. Ανοίξτε τον ξανά από το email σας.');
      return;
    }
    api.post<{ name: string; email: string }>('/auth/vet/activation', { token })
      .then(setAccount)
      .catch(err => setLinkError(err instanceof ApiError ? err.message : 'Ο σύνδεσμος δεν είναι έγκυρος.'));
  }, [token]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < MIN_LENGTH) return setError(`Ο κωδικός πρέπει να έχει τουλάχιστον ${MIN_LENGTH} χαρακτήρες.`);
    if (password !== confirm) return setError('Οι κωδικοί δεν ταιριάζουν.');
    if (!acceptedTerms) return setError('Για να συνεχίσετε, αποδεχτείτε τους Όρους Χρήσης και την Πολιτική Απορρήτου.');
    setSaving(true);
    try {
      const response = await api.post<{ access_token: string }>('/auth/vet/activate', { token, password, accept_terms: true });
      await login(response.access_token, 'vet');
      router.replace('/vet/dashboard');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Παρουσιάστηκε σφάλμα. Δοκιμάστε ξανά.');
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-ink-50 px-4 py-10 text-ink-800">
      <div className="w-full max-w-sm">
        <Image src="/branding/vetly-logo-transparent.png" alt="Vetly" width={2109} height={746} sizes="120px" preload className="mx-auto h-auto w-[120px]" />
        <div className="mt-6 rounded-xl border border-ink-200 bg-white p-6">
          <h1 className="text-xl font-semibold tracking-tight text-ink-900">Ορισμός κωδικού</h1>
          {linkError ? <>
            <p role="alert" className="mt-4 rounded-[10px] bg-red-50 px-3 py-2.5 text-sm text-red-700">{linkError}</p>
            <p className="mt-4 text-sm text-ink-600">Αν έχετε ήδη ορίσει κωδικό, <Link href="/vet/login" className="font-medium text-clinic-700 underline-offset-4 hover:underline">συνδεθείτε</Link>.</p>
          </> : !account ? <p role="status" className="mt-4 text-sm text-ink-500">Έλεγχος συνδέσμου…</p> : <>
            <p className="mt-1 text-sm text-ink-500">Καλώς ήρθατε, {account.name}. Ορίστε κωδικό για τον λογαριασμό <span className="font-medium text-ink-700">{account.email}</span>.</p>
            {error && <p role="alert" className="mt-4 rounded-[10px] bg-red-50 px-3 py-2.5 text-sm text-red-700">{error}</p>}
            <form className="mt-5 space-y-4" onSubmit={submit} noValidate>
              <input type="email" name="username" autoComplete="username" value={account.email} readOnly hidden />
              <div>
                <label htmlFor="password" className="mb-1.5 block text-xs font-medium text-ink-700">Κωδικός</label>
                <input id="password" type="password" autoComplete="new-password" required minLength={MIN_LENGTH} value={password} onChange={e => setPassword(e.target.value)} className={field} />
                <p className="mt-1 text-xs text-ink-500">Τουλάχιστον {MIN_LENGTH} χαρακτήρες.</p>
              </div>
              <div>
                <label htmlFor="confirm" className="mb-1.5 block text-xs font-medium text-ink-700">Επανάληψη κωδικού</label>
                <input id="confirm" type="password" autoComplete="new-password" required value={confirm} onChange={e => setConfirm(e.target.value)} className={field} />
              </div>
              <label htmlFor="accept-terms" className="flex items-start gap-2 text-sm text-ink-700">
                <input id="accept-terms" type="checkbox" checked={acceptedTerms} onChange={e => { setAcceptedTerms(e.target.checked); setError(''); }} className="mt-0.5 h-4 w-4 shrink-0 rounded border-ink-300 accent-clinic-600" />
                <span>Αποδέχομαι τους <Link href="/terms" target="_blank" rel="noopener" className="font-medium text-clinic-700 underline-offset-4 hover:underline">Όρους Χρήσης</Link> και την <Link href="/privacy" target="_blank" rel="noopener" className="font-medium text-clinic-700 underline-offset-4 hover:underline">Πολιτική Απορρήτου</Link></span>
              </label>
              <button type="submit" disabled={saving} className="flex h-10 w-full items-center justify-center rounded-[10px] bg-clinic-600 text-sm font-medium text-white hover:bg-clinic-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clinic-600 disabled:opacity-70">{saving ? 'Αποθήκευση…' : 'Ορισμός κωδικού και είσοδος'}</button>
            </form>
          </>}
        </div>
      </div>
    </div>
  );
}
