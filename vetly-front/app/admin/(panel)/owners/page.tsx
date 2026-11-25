'use client';

import { Suspense, useState } from 'react';
import AdminSearch from '@/components/admin/AdminSearch';
import { useAdminList } from '@/components/admin/useAdminList';
import { useConfirm } from '@/components/ConfirmDialog';
import { ClinicButton, ClinicEmptyState, ClinicFilterTabs, ClinicLoading, ClinicPageHeader, ClinicPagination, ClinicPanel, ClinicStatusBadge, ClinicTable, ClinicTableCell, ClinicTableHead, ClinicToolbar } from '@/components/vet/ClinicUI';
import { adminApi } from '@/lib/admin-api';
import type { AdminOwner, AdminOwnerStatus } from '@/types/admin';

const STATUSES = ['active', 'unverified', 'suspended'] as const;
const FILTERS = [
  { value: '', label: 'Όλοι' },
  { value: 'active', label: 'Ενεργοί' },
  { value: 'unverified', label: 'Χωρίς επιβεβαίωση' },
  { value: 'suspended', label: 'Σε αναστολή' },
];
const STATUS_LABEL: Record<AdminOwnerStatus, [badge: string, text: string]> = {
  active: ['completed', 'Ενεργός'],
  unverified: ['pending', 'Χωρίς επιβεβαίωση'],
  suspended: ['cancelled', 'Σε αναστολή'],
};
const dateLabel = (value: string) => new Date(value).toLocaleDateString('el-GR', { day: 'numeric', month: 'short', year: 'numeric' });

function OwnersList() {
  const list = useAdminList<AdminOwner>('/owners', STATUSES);
  const { confirm, dialog } = useConfirm();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const act = async (owner: AdminOwner, action: 'suspend' | 'reactivate') => {
    if (busyId) return;
    const ok = await confirm(action === 'suspend'
      ? { title: `Αναστολή λογαριασμού: ${owner.name};`, description: 'Αποσυνδέεται αμέσως από web και εφαρμογή και δεν μπορεί να συνδεθεί. Τα κατοικίδια και τα ραντεβού του μένουν.', confirmLabel: 'Αναστολή' }
      : { title: `Επανενεργοποίηση: ${owner.name};`, description: 'Μπορεί να συνδεθεί ξανά με τον ίδιο κωδικό.', confirmLabel: 'Επανενεργοποίηση', destructive: false });
    if (!ok) return;
    setBusyId(owner.id);
    setActionError(null);
    try {
      list.replaceItem(await adminApi.post<AdminOwner>(`/owners/${owner.id}/${action}`));
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Η ενέργεια απέτυχε. Δοκιμάστε ξανά.');
    } finally {
      setBusyId(null);
    }
  };

  const { data } = list;
  return <div>
    {dialog}
    <ClinicPageHeader title="Κηδεμόνες" description="Λογαριασμοί κηδεμόνων. Τα κατοικίδια, το ιατρικό ιστορικό και τα μηνύματα δεν εμφανίζονται στη διαχείριση." />
    {actionError && <p role="alert" className="mb-3 break-words rounded-[10px] bg-red-50 px-3 py-2 text-sm text-red-700">{actionError}</p>}
    <ClinicPanel className="overflow-hidden">
      <ClinicFilterTabs label="Κατάσταση" options={FILTERS} value={list.status} onChange={status => list.navigate({ status })} />
      <ClinicToolbar>
        <AdminSearch value={list.q} label="Αναζήτηση κηδεμόνα" placeholder="Όνομα, email ή τηλέφωνο" onSearch={q => list.navigate({ q })} />
        <span role="status" className="ml-auto text-xs text-ink-500">{data ? `${data.total} ${data.total === 1 ? 'κηδεμόνας' : 'κηδεμόνες'}` : ''}</span>
      </ClinicToolbar>
      {list.error ? <div role="alert" className="space-y-3 p-5"><p className="break-words text-sm text-red-700">{list.error}</p><ClinicButton onClick={() => { void list.load(); }}>Δοκιμή ξανά</ClinicButton></div>
        : !data ? <ClinicLoading label="Φόρτωση κηδεμόνων…" />
        : !data.items.length ? <ClinicEmptyState title={list.q ? 'Δεν βρέθηκε κηδεμόνας' : 'Δεν υπάρχουν κηδεμόνες εδώ'} />
        : <div className="overflow-x-auto"><ClinicTable className="min-w-[860px]">
          <thead><tr><ClinicTableHead>Κηδεμόνας</ClinicTableHead><ClinicTableHead>Τηλέφωνο</ClinicTableHead><ClinicTableHead>Εγγραφή</ClinicTableHead><ClinicTableHead>Κατάσταση</ClinicTableHead><ClinicTableHead className="text-right">Κατοικίδια</ClinicTableHead><ClinicTableHead className="text-right">Ραντεβού</ClinicTableHead><ClinicTableHead className="text-right">Ενέργειες</ClinicTableHead></tr></thead>
          <tbody>{data.items.map(owner => {
            const [badge, label] = STATUS_LABEL[owner.status];
            const busy = busyId === owner.id;
            return <tr key={owner.id}>
              <ClinicTableCell><p className="font-semibold text-ink-900">{owner.name}</p><p className="break-all text-xs text-ink-500">{owner.email}</p></ClinicTableCell>
              <ClinicTableCell className="whitespace-nowrap">{owner.phone || '—'}</ClinicTableCell>
              <ClinicTableCell className="whitespace-nowrap">{dateLabel(owner.created_at)}</ClinicTableCell>
              <ClinicTableCell><ClinicStatusBadge status={badge}>{label}</ClinicStatusBadge></ClinicTableCell>
              <ClinicTableCell className="text-right tabular-nums">{owner.pets_count}</ClinicTableCell>
              <ClinicTableCell className="text-right tabular-nums">{owner.appointments_count}</ClinicTableCell>
              <ClinicTableCell className="text-right">{owner.status === 'suspended'
                ? <ClinicButton disabled={!!busyId} onClick={() => act(owner, 'reactivate')}>{busy ? 'Περιμένετε…' : 'Επανενεργοποίηση'}</ClinicButton>
                : <ClinicButton variant="danger" disabled={!!busyId} onClick={() => act(owner, 'suspend')}>{busy ? 'Περιμένετε…' : 'Αναστολή'}</ClinicButton>}</ClinicTableCell>
            </tr>;
          })}</tbody>
        </ClinicTable></div>}
    </ClinicPanel>
    <ClinicPagination page={list.page} totalPages={list.totalPages} onPageChange={page => list.navigate({ page })} />
  </div>;
}

export default function AdminOwnersPage() {
  return <Suspense fallback={<ClinicLoading />}><OwnersList /></Suspense>;
}
