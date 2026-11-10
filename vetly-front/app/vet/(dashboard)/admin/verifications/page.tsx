'use client';

import { useCallback, useEffect, useState } from 'react';
import { ClinicButton, ClinicEmptyState, ClinicLoading, ClinicPageHeader, ClinicPanel, ClinicStatusBadge, ClinicTable, ClinicTableCell, ClinicTableHead } from '@/components/vet/ClinicUI';
import { approveVet, fetchPendingVets, rejectVet } from '@/hooks/useVetData';
import type { AdminVet } from '@/types/vet';

const dateLabel = (value: string) => new Date(value).toLocaleDateString('el-GR', { day: 'numeric', month: 'short', year: 'numeric' });
const statusOf = (err: unknown) => (err as { status?: number })?.status;
const messageOf = (err: unknown, fallback: string) => (err instanceof Error && err.message ? err.message : fallback);

export default function VetVerificationsPage() {
  const [vets, setVets] = useState<AdminVet[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      const data = await fetchPendingVets();
      setVets(data.items);
    } catch (err) {
      if (statusOf(err) === 403) setForbidden(true);
      else setLoadError(messageOf(err, 'Δεν ήταν δυνατή η φόρτωση των αιτήσεων.'));
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const run = async (vet: AdminVet, action: 'approve' | 'reject') => {
    if (busyId) return;
    setBusyId(vet.id);
    setActionError(null);
    try {
      if (action === 'approve') await approveVet(vet.id);
      else await rejectVet(vet.id);
      setVets(current => current?.filter(item => item.id !== vet.id) ?? null);
      setConfirmId(null);
    } catch (err) {
      setActionError(messageOf(err, 'Η ενέργεια απέτυχε. Δοκιμάστε ξανά.'));
    } finally {
      setBusyId(null);
    }
  };

  if (forbidden) {
    return <div><ClinicPageHeader title="Επαλήθευση κτηνιάτρων" /><ClinicPanel><ClinicEmptyState title="Δεν έχετε πρόσβαση σε αυτή τη σελίδα" description="Η έγκριση νέων κτηνιατρείων γίνεται μόνο από διαχειριστές της πλατφόρμας." /></ClinicPanel></div>;
  }

  return <div>
    <ClinicPageHeader title="Επαλήθευση κτηνιάτρων" description="Ελέγξτε τα επαγγελματικά στοιχεία πριν εγκρίνετε νέο κτηνιατρείο. Έως την έγκριση δεν μπορεί να συνδεθεί." />
    {actionError && <p role="alert" className="mb-3 break-words rounded-[10px] bg-red-50 px-3 py-2 text-sm text-red-700">{actionError}</p>}
    <ClinicPanel className="overflow-hidden">
      <div className="flex items-center justify-between border-b border-ink-200 px-4 py-3"><h2 className="text-sm font-semibold">Αιτήσεις σε αναμονή</h2><span role="status" className="text-xs text-ink-500">{vets ? `${vets.length} αιτήσεις` : ''}</span></div>
      {loadError ? <div role="alert" className="space-y-3 p-5"><p className="break-words text-sm text-red-700">{loadError}</p><ClinicButton onClick={() => { setVets(null); void load(); }}>Δοκιμή ξανά</ClinicButton></div>
        : !vets ? <ClinicLoading label="Φόρτωση αιτήσεων…" />
        : !vets.length ? <ClinicEmptyState title="Δεν υπάρχουν αιτήσεις σε αναμονή" description="Όταν εγγραφεί νέο κτηνιατρείο, η αίτησή του θα εμφανιστεί εδώ." />
        : <div className="overflow-x-auto"><ClinicTable className="min-w-[900px]">
          <thead><tr><ClinicTableHead>Κτηνίατρος</ClinicTableHead><ClinicTableHead>Άδεια</ClinicTableHead><ClinicTableHead>Ειδικότητα · Πόλη</ClinicTableHead><ClinicTableHead>Τηλέφωνο</ClinicTableHead><ClinicTableHead>Εγγραφή</ClinicTableHead><ClinicTableHead>Email</ClinicTableHead><ClinicTableHead className="text-right">Ενέργειες</ClinicTableHead></tr></thead>
          <tbody>{vets.map(vet => <tr key={vet.id}>
            <ClinicTableCell><p className="font-semibold text-ink-900">{vet.name}</p><p className="break-all text-xs text-ink-500">{vet.email}</p></ClinicTableCell>
            <ClinicTableCell className="whitespace-nowrap tabular-nums">{vet.license_number}</ClinicTableCell>
            <ClinicTableCell>{vet.specialty} · {vet.city}</ClinicTableCell>
            <ClinicTableCell className="whitespace-nowrap">{vet.phone}</ClinicTableCell>
            <ClinicTableCell className="whitespace-nowrap">{dateLabel(vet.created_at)}</ClinicTableCell>
            <ClinicTableCell><ClinicStatusBadge status={vet.email_verified ? 'completed' : 'pending'}>{vet.email_verified ? 'Επαληθευμένο' : 'Μη επαληθευμένο'}</ClinicStatusBadge></ClinicTableCell>
            <ClinicTableCell className="text-right">{confirmId === vet.id
              ? <div className="flex flex-wrap items-center justify-end gap-2"><span className="text-xs text-ink-600">Διαγραφή της αίτησης;</span><ClinicButton variant="danger" disabled={busyId === vet.id} onClick={() => run(vet, 'reject')}>{busyId === vet.id ? 'Διαγραφή…' : 'Ναι, απόρριψη'}</ClinicButton><ClinicButton disabled={busyId === vet.id} onClick={() => setConfirmId(null)}>Ακύρωση</ClinicButton></div>
              : <div className="flex justify-end gap-2"><ClinicButton variant="primary" disabled={!!busyId || !vet.email_verified} title={vet.email_verified ? undefined : 'Το email δεν έχει επαληθευτεί'} onClick={() => run(vet, 'approve')}>{busyId === vet.id ? 'Έγκριση…' : 'Έγκριση'}</ClinicButton><ClinicButton variant="danger" disabled={!!busyId} onClick={() => { setActionError(null); setConfirmId(vet.id); }}>Απόρριψη</ClinicButton></div>}</ClinicTableCell>
          </tr>)}</tbody>
        </ClinicTable></div>}
    </ClinicPanel>
  </div>;
}
