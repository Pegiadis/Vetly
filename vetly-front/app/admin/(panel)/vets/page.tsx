'use client';

import { Suspense, useState } from 'react';
import AdminSearch from '@/components/admin/AdminSearch';
import { useAdminList } from '@/components/admin/useAdminList';
import VetAccountDialog from '@/components/admin/VetAccountDialog';
import { useConfirm } from '@/components/ConfirmDialog';
import { ClinicButton, ClinicEmptyState, ClinicFilterTabs, ClinicLoading, ClinicPageHeader, ClinicPagination, ClinicPanel, ClinicStatusBadge, ClinicTable, ClinicTableCell, ClinicTableHead, ClinicToolbar } from '@/components/vet/ClinicUI';
import { adminApi } from '@/lib/admin-api';
import type { AdminVet, AdminVetStatus } from '@/types/admin';

const STATUSES = ['active', 'invited', 'suspended', 'closed'] as const;
const FILTERS = [
  { value: '', label: 'Όλοι' },
  { value: 'active', label: 'Ενεργοί' },
  { value: 'invited', label: 'Χωρίς κωδικό ακόμα' },
  { value: 'suspended', label: 'Ανενεργοί' },
  { value: 'closed', label: 'Κλειστοί' },
];
const STATUS_LABEL: Record<AdminVetStatus, [badge: string, text: string]> = {
  active: ['completed', 'Ενεργός'],
  invited: ['pending', 'Χωρίς κωδικό ακόμα'],
  suspended: ['cancelled', 'Ανενεργός'],
  closed: ['other', 'Κλειστός'],
};
const dateLabel = (value: string) => new Date(value).toLocaleDateString('el-GR', { day: 'numeric', month: 'short', year: 'numeric' });

function VetsList() {
  const list = useAdminList<AdminVet>('/vets', STATUSES);
  const { confirm, dialog } = useConfirm();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);
  const [creating, setCreating] = useState(false);

  const act = async (vet: AdminVet, action: 'suspend' | 'reactivate' | 'resend-invite') => {
    if (busyId) return;
    const prompts = {
      suspend: { title: `Απενεργοποίηση: ${vet.name};`, description: 'Αποσυνδέεται αμέσως, δεν μπορεί να συνδεθεί και το προφίλ του κρύβεται. Τα δεδομένα του ιατρείου μένουν.', confirmLabel: 'Απενεργοποίηση' },
      reactivate: { title: `Ενεργοποίηση: ${vet.name};`, description: 'Μπορεί να συνδεθεί ξανά και το προφίλ του γίνεται ορατό.', confirmLabel: 'Ενεργοποίηση', destructive: false },
      'resend-invite': { title: `Νέο email στον ${vet.name};`, description: `Στέλνουμε νέο σύνδεσμο ορισμού κωδικού στο ${vet.email}. Ο προηγούμενος σύνδεσμος παύει να ισχύει.`, confirmLabel: 'Αποστολή', destructive: false },
    };
    if (!(await confirm(prompts[action]))) return;
    setBusyId(vet.id);
    setNotice(null);
    try {
      list.replaceItem(await adminApi.post<AdminVet>(`/vets/${vet.id}/${action}`));
      if (action === 'resend-invite') setNotice({ kind: 'ok', text: `Στάλθηκε νέο email στο ${vet.email}.` });
    } catch (err) {
      setNotice({ kind: 'error', text: err instanceof Error ? err.message : 'Η ενέργεια απέτυχε. Δοκιμάστε ξανά.' });
    } finally {
      setBusyId(null);
    }
  };

  const { data } = list;
  return <div>
    {dialog}
    {creating && <VetAccountDialog onClose={() => setCreating(false)} onCreated={vet => {
      setCreating(false);
      setNotice({ kind: 'ok', text: `Ο λογαριασμός του ${vet.name} δημιουργήθηκε και στάλθηκε email στο ${vet.email} για να ορίσει κωδικό.` });
      void list.load();
    }} />}
    <ClinicPageHeader title="Κτηνίατροι" description="Οι λογαριασμοί δημιουργούνται από εδώ ή από ένα αίτημα demo. Το ιατρείο εμφανίζεται στους κηδεμόνες όταν ο κτηνίατρος ορίσει κωδικό και προσθέσει υπηρεσίες." actions={<ClinicButton variant="primary" onClick={() => { setNotice(null); setCreating(true); }}>Νέος κτηνίατρος</ClinicButton>} />
    {notice && <p role={notice.kind === 'error' ? 'alert' : 'status'} className={`mb-3 break-words rounded-[10px] px-3 py-2 text-sm ${notice.kind === 'error' ? 'bg-red-50 text-red-700' : 'bg-clinic-50 text-clinic-800'}`}>{notice.text}</p>}
    <ClinicPanel className="overflow-hidden">
      <ClinicFilterTabs label="Κατάσταση" options={FILTERS} value={list.status} onChange={status => list.navigate({ status })} />
      <ClinicToolbar>
        <AdminSearch value={list.q} label="Αναζήτηση κτηνιάτρου" placeholder="Όνομα, email, άδεια ή πόλη" onSearch={q => list.navigate({ q })} />
        <span role="status" className="ml-auto text-xs text-ink-500">{data ? `${data.total} ${data.total === 1 ? 'κτηνίατρος' : 'κτηνίατροι'}` : ''}</span>
      </ClinicToolbar>
      {list.error ? <div role="alert" className="space-y-3 p-5"><p className="break-words text-sm text-red-700">{list.error}</p><ClinicButton onClick={() => { void list.load(); }}>Δοκιμή ξανά</ClinicButton></div>
        : !data ? <ClinicLoading label="Φόρτωση κτηνιάτρων…" />
        : !data.items.length ? <ClinicEmptyState title={list.q ? 'Δεν βρέθηκε κτηνίατρος' : 'Δεν υπάρχουν κτηνίατροι εδώ'} />
        : <div className="overflow-x-auto"><ClinicTable className="min-w-[960px]">
          <thead><tr><ClinicTableHead className="min-w-[200px]">Κτηνίατρος</ClinicTableHead><ClinicTableHead>Άδεια</ClinicTableHead><ClinicTableHead>Ειδικότητα · Πόλη</ClinicTableHead><ClinicTableHead>Τηλέφωνο</ClinicTableHead><ClinicTableHead>Από</ClinicTableHead><ClinicTableHead>Κατάσταση</ClinicTableHead><ClinicTableHead className="text-right">Ραντεβού · Πελάτες</ClinicTableHead><ClinicTableHead className="text-right">Ενέργειες</ClinicTableHead></tr></thead>
          <tbody>{data.items.map(vet => {
            const [badge, label] = STATUS_LABEL[vet.status];
            const busy = busyId === vet.id;
            return <tr key={vet.id}>
              <ClinicTableCell><p className="font-semibold text-ink-900">{vet.name}</p><p className="break-all text-xs text-ink-500">{vet.email}</p></ClinicTableCell>
              <ClinicTableCell className="whitespace-nowrap tabular-nums">{vet.license_number}</ClinicTableCell>
              <ClinicTableCell>{vet.specialty} · {vet.city}</ClinicTableCell>
              <ClinicTableCell className="whitespace-nowrap">{vet.phone}</ClinicTableCell>
              <ClinicTableCell className="whitespace-nowrap">{dateLabel(vet.created_at)}</ClinicTableCell>
              <ClinicTableCell><ClinicStatusBadge status={badge}>{label}</ClinicStatusBadge></ClinicTableCell>
              <ClinicTableCell className="whitespace-nowrap text-right tabular-nums">{vet.appointments_count} · {vet.clients_count}</ClinicTableCell>
              <ClinicTableCell className="text-right"><div className="flex justify-end gap-2">
                {vet.status === 'active' && vet.slug && <a href={`/vets/${vet.slug}`} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-8 items-center rounded-[10px] px-3 text-[13px] font-medium text-ink-700 hover:bg-black/[0.06]">Προφίλ</a>}
                {vet.status === 'invited' && <ClinicButton disabled={!!busyId} onClick={() => act(vet, 'resend-invite')}>{busy ? 'Περιμένετε…' : 'Νέο email'}</ClinicButton>}
                {vet.status === 'active' && <ClinicButton variant="danger" disabled={!!busyId} onClick={() => act(vet, 'suspend')}>Απενεργοποίηση</ClinicButton>}
                {vet.status === 'suspended' && <ClinicButton disabled={!!busyId} onClick={() => act(vet, 'reactivate')}>{busy ? 'Περιμένετε…' : 'Ενεργοποίηση'}</ClinicButton>}
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
