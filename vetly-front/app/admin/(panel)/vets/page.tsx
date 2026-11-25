'use client';

import { Suspense, useState } from 'react';
import AdminSearch from '@/components/admin/AdminSearch';
import { useAdminList } from '@/components/admin/useAdminList';
import { useConfirm } from '@/components/ConfirmDialog';
import { ClinicButton, ClinicEmptyState, ClinicFilterTabs, ClinicLoading, ClinicPageHeader, ClinicPagination, ClinicPanel, ClinicStatusBadge, ClinicTable, ClinicTableCell, ClinicTableHead, ClinicToolbar } from '@/components/vet/ClinicUI';
import { adminApi } from '@/lib/admin-api';
import type { AdminVet, AdminVetStatus } from '@/types/admin';

const STATUSES = ['pending', 'approved', 'closed'] as const;
const FILTERS = [
  { value: '', label: 'Όλοι' },
  { value: 'pending', label: 'Σε αναμονή' },
  { value: 'approved', label: 'Εγκεκριμένοι' },
  { value: 'closed', label: 'Κλειστοί' },
];
const STATUS_LABEL: Record<AdminVetStatus, [badge: string, text: string]> = {
  pending: ['pending', 'Σε αναμονή'],
  approved: ['completed', 'Εγκεκριμένος'],
  closed: ['cancelled', 'Κλειστός'],
};
const dateLabel = (value: string) => new Date(value).toLocaleDateString('el-GR', { day: 'numeric', month: 'short', year: 'numeric' });

function VetsList() {
  const list = useAdminList<AdminVet>('/vets', STATUSES);
  const { confirm, dialog } = useConfirm();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const act = async (vet: AdminVet, action: 'approve' | 'reject' | 'revoke') => {
    if (busyId) return;
    const prompts = {
      approve: { title: `Έγκριση: ${vet.name};`, description: `Άδεια ${vet.license_number} · ${vet.specialty} · ${vet.city}. Μετά την έγκριση μπορεί να συνδεθεί, το προφίλ του γίνεται ορατό και του στέλνουμε email.`, confirmLabel: 'Έγκριση', destructive: false },
      reject: { title: `Απόρριψη της αίτησης του ${vet.name};`, description: 'Η εγγραφή διαγράφεται. Το email και ο αριθμός άδειας μπορούν να χρησιμοποιηθούν ξανά σε νέα αίτηση.', confirmLabel: 'Απόρριψη' },
      revoke: { title: `Ανάκληση έγκρισης: ${vet.name};`, description: 'Αποσυνδέεται αμέσως και δεν μπορεί να συνδεθεί μέχρι να εγκριθεί ξανά. Τα δεδομένα του ιατρείου μένουν.', confirmLabel: 'Ανάκληση' },
    };
    if (!(await confirm(prompts[action]))) return;
    setBusyId(vet.id);
    setActionError(null);
    try {
      await adminApi.post(`/vets/${vet.id}/${action}`);
      await list.load();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Η ενέργεια απέτυχε. Δοκιμάστε ξανά.');
    } finally {
      setBusyId(null);
    }
  };

  const { data } = list;
  return <div>
    {dialog}
    <ClinicPageHeader title="Κτηνίατροι" description="Ελέγξτε την άδεια ασκήσεως επαγγέλματος πριν εγκρίνετε νέο ιατρείο. Μέχρι την έγκριση δεν μπορεί να συνδεθεί." />
    {actionError && <p role="alert" className="mb-3 break-words rounded-[10px] bg-red-50 px-3 py-2 text-sm text-red-700">{actionError}</p>}
    <ClinicPanel className="overflow-hidden">
      <ClinicFilterTabs label="Κατάσταση" options={FILTERS} value={list.status} onChange={status => list.navigate({ status })} />
      <ClinicToolbar>
        <AdminSearch value={list.q} label="Αναζήτηση κτηνιάτρου" placeholder="Όνομα, email, άδεια ή πόλη" onSearch={q => list.navigate({ q })} />
        <span role="status" className="ml-auto text-xs text-ink-500">{data ? `${data.total} ${data.total === 1 ? 'κτηνίατρος' : 'κτηνίατροι'}` : ''}</span>
      </ClinicToolbar>
      {list.error ? <div role="alert" className="space-y-3 p-5"><p className="break-words text-sm text-red-700">{list.error}</p><ClinicButton onClick={() => { void list.load(); }}>Δοκιμή ξανά</ClinicButton></div>
        : !data ? <ClinicLoading label="Φόρτωση κτηνιάτρων…" />
        : !data.items.length ? <ClinicEmptyState title={list.q ? 'Δεν βρέθηκε κτηνίατρος' : list.status === 'pending' ? 'Δεν υπάρχουν αιτήσεις σε αναμονή' : 'Δεν υπάρχουν κτηνίατροι εδώ'} description={list.status === 'pending' && !list.q ? 'Όταν εγγραφεί νέο ιατρείο, η αίτησή του θα εμφανιστεί εδώ.' : undefined} />
        : <div className="overflow-x-auto"><ClinicTable className="min-w-[980px]">
          <thead><tr><ClinicTableHead>Κτηνίατρος</ClinicTableHead><ClinicTableHead>Άδεια</ClinicTableHead><ClinicTableHead>Ειδικότητα · Πόλη</ClinicTableHead><ClinicTableHead>Τηλέφωνο</ClinicTableHead><ClinicTableHead>Εγγραφή</ClinicTableHead><ClinicTableHead>Κατάσταση</ClinicTableHead><ClinicTableHead className="text-right">Ραντεβού · Πελάτες</ClinicTableHead><ClinicTableHead className="text-right">Ενέργειες</ClinicTableHead></tr></thead>
          <tbody>{data.items.map(vet => {
            const [badge, label] = STATUS_LABEL[vet.status];
            const busy = busyId === vet.id;
            return <tr key={vet.id}>
              <ClinicTableCell><p className="font-semibold text-ink-900">{vet.name}</p><p className="break-all text-xs text-ink-500">{vet.email}</p></ClinicTableCell>
              <ClinicTableCell className="whitespace-nowrap tabular-nums">{vet.license_number}</ClinicTableCell>
              <ClinicTableCell>{vet.specialty} · {vet.city}</ClinicTableCell>
              <ClinicTableCell className="whitespace-nowrap">{vet.phone}</ClinicTableCell>
              <ClinicTableCell className="whitespace-nowrap">{dateLabel(vet.created_at)}</ClinicTableCell>
              <ClinicTableCell><div className="flex flex-col items-start gap-1"><ClinicStatusBadge status={badge}>{label}</ClinicStatusBadge>{!vet.email_verified && <span className="text-xs text-ink-500">Email χωρίς επιβεβαίωση</span>}</div></ClinicTableCell>
              <ClinicTableCell className="whitespace-nowrap text-right tabular-nums">{vet.appointments_count} · {vet.clients_count}</ClinicTableCell>
              <ClinicTableCell className="text-right"><div className="flex justify-end gap-2">
                {vet.status === 'pending' && <>
                  <ClinicButton variant="primary" disabled={!!busyId || !vet.email_verified} title={vet.email_verified ? undefined : 'Το email δεν έχει επιβεβαιωθεί'} onClick={() => act(vet, 'approve')}>{busy ? 'Περιμένετε…' : 'Έγκριση'}</ClinicButton>
                  <ClinicButton variant="danger" disabled={!!busyId} onClick={() => act(vet, 'reject')}>Απόρριψη</ClinicButton>
                </>}
                {vet.status === 'approved' && <>
                  {vet.slug && <a href={`/vets/${vet.slug}`} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-8 items-center rounded-[10px] px-3 text-[13px] font-medium text-ink-700 hover:bg-black/[0.06]">Προφίλ</a>}
                  <ClinicButton variant="danger" disabled={!!busyId} onClick={() => act(vet, 'revoke')}>{busy ? 'Περιμένετε…' : 'Ανάκληση'}</ClinicButton>
                </>}
              </div></ClinicTableCell>
            </tr>;
          })}</tbody>
        </ClinicTable></div>}
    </ClinicPanel>
    <ClinicPagination page={list.page} totalPages={list.totalPages} onPageChange={page => list.navigate({ page })} />
  </div>;
}

export default function AdminVetsPage() {
  return <Suspense fallback={<ClinicLoading />}><VetsList /></Suspense>;
}
