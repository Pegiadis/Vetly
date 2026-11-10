'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { ClinicButton, ClinicInput } from '@/components/vet/ClinicUI';

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
    <p className="text-sm text-ink-600">Συνδέσου ως <strong>{email}</strong> για να προστεθούν τα κατοικίδια και το ιστορικό τους στον υπάρχοντα λογαριασμό σου.</p>
    <label className="block text-sm font-medium text-ink-700">Κωδικός λογαριασμού<ClinicInput required autoComplete="current-password" type="password" value={password} disabled={busy} onChange={e => setPassword(e.target.value)} className="mt-1.5 block h-10 w-full" /></label>
    {error && <p role="alert" className="rounded-[10px] bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
    <ClinicButton type="submit" variant="primary" disabled={busy} className="min-h-10 w-full">{busy ? 'Σύνδεση…' : 'Σύνδεση και αποδοχή πρόσκλησης'}</ClinicButton>
    <a href="/forgot-password?userType=pet_owner" className="block py-1 text-sm font-medium text-clinic-700 underline-offset-4 hover:underline">Ξέχασα τον κωδικό μου</a>
  </form>;
}
