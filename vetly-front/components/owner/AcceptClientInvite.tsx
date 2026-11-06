'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';

export default function AcceptClientInvite({ token, email }: { token: string; email: string }) {
  const { login } = useAuth();
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  return <form className="mt-5 space-y-3" onSubmit={async event => {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setError('');
    try {
      const result = await api.post<{access_token: string}>('/auth/pet-owner/login', { email, password });
      await login(result.access_token, 'pet_owner');
      await api.post(`/invite/${token}/accept`, {});
      router.push('/owner/pets');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Η σύνδεση της καρτέλας δεν ολοκληρώθηκε.');
      setBusy(false);
    }
  }}>
    <p className="text-sm text-slate-600">Συνδεθείτε ως <strong>{email}</strong> για να προστεθούν τα κατοικίδια και το ιστορικό τους στον υπάρχοντα λογαριασμό σας.</p>
    <label className="block text-sm">Κωδικός λογαριασμού<input required autoComplete="current-password" type="password" value={password} disabled={busy} onChange={e => setPassword(e.target.value)} className="mt-1 block w-full rounded-xl border border-slate-300 p-3" /></label>
    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    <button disabled={busy} className="w-full rounded-xl bg-teal-600 p-3 font-bold text-white disabled:opacity-60">{busy ? 'Σύνδεση…' : 'Σύνδεση και αποδοχή πρόσκλησης'}</button>
    <a href="/forgot-password?userType=pet_owner" className="block text-sm text-teal-700">Ξέχασα τον κωδικό μου</a>
  </form>;
}
