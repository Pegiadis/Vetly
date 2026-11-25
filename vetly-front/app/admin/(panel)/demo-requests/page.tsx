'use client';

import Link from 'next/link';
import { Suspense, useState } from 'react';
import AdminSearch from '@/components/admin/AdminSearch';
import { useAdminList } from '@/components/admin/useAdminList';
import VetAccountDialog from '@/components/admin/VetAccountDialog';
import { ClinicButton, ClinicEmptyState, ClinicFilterTabs, ClinicLoading, ClinicPageHeader, ClinicPagination, ClinicPanel, ClinicSelect, ClinicStatusBadge, ClinicToolbar } from '@/components/vet/ClinicUI';
import { adminApi } from '@/lib/admin-api';
import type { DemoRequest, DemoStatus } from '@/types/admin';

const STATUSES = ['new', 'contacted', 'converted', 'closed'] as const;
const FILTERS = [
  { value: '', label: 'Όλα' },
  { value: 'new', label: 'Νέα' },
  { value: 'contacted', label: 'Σε επικοινωνία' },
  { value: 'converted', label: 'Έγιναν πελάτες' },
  { value: 'closed', label: 'Κλειστά' },
];
const STATUS_LABEL: Record<DemoStatus, [badge: string, text: string]> = {
  new: ['pending', 'Νέο'],
  contacted: ['confirmed', 'Σε επικοινωνία'],
  converted: ['completed', 'Έγινε πελάτης'],
  closed: ['cancelled', 'Κλειστό'],
};
const when = (value: string) => new Date(`${value}${/[zZ]|[+-]\d{2}:?\d{2}$/.test(value) ? '' : 'Z'}`)
  .toLocaleString('el-GR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

function DemoRequestsList() {
  const list = useAdminList<DemoRequest>('/demo-requests', STATUSES);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [creatingFor, setCreatingFor] = useState<DemoRequest | null>(null);
  const [created, setCreated] = useState<string | null>(null);

  const setStatus = async (request: DemoRequest, status: DemoStatus) => {
    setBusyId(request.id);
    setActionError(null);
    try {
      list.replaceItem(await adminApi.patch<DemoRequest>(`/demo-requests/${request.id}`, { status }));
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Η αλλαγή απέτυχε.');
    } finally {
      setBusyId(null);
    }
  };

  const { data } = list;
  return <div>
    {creatingFor && <VetAccountDialog demo={creatingFor} onClose={() => setCreatingFor(null)} onCreated={vet => {
      setCreatingFor(null);
      setCreated(`Ο λογαριασμός του ${vet.name} δημιουργήθηκε και στάλθηκε email στο ${vet.email} για να ορίσει κωδικό.`);
      void list.load();
    }} />}
    <ClinicPageHeader title="Αιτήματα demo" description="Ό,τι στέλνουν τα ιατρεία από τη φόρμα «Κλείστε demo». Μετά την παρουσίαση, δημιουργήστε από εδώ τον λογαριασμό τους." />
    {created && <p role="status" className="mb-3 rounded-[10px] bg-clinic-50 px-3 py-2 text-sm text-clinic-800">{created}</p>}
    {actionError && <p role="alert" className="mb-3 break-words rounded-[10px] bg-red-50 px-3 py-2 text-sm text-red-700">{actionError}</p>}
    <ClinicPanel className="overflow-hidden">
      <ClinicFilterTabs label="Κατάσταση" options={FILTERS} value={list.status} onChange={status => list.navigate({ status })} />
      <ClinicToolbar>
        <AdminSearch value={list.q} label="Αναζήτηση αιτήματος" placeholder="Όνομα, ιατρείο, email, τηλέφωνο ή πόλη" onSearch={q => list.navigate({ q })} />
        <span role="status" className="ml-auto text-xs text-ink-500">{data ? `${data.total} ${data.total === 1 ? 'αίτημα' : 'αιτήματα'}` : ''}</span>
      </ClinicToolbar>
      {list.error ? <div role="alert" className="space-y-3 p-5"><p className="break-words text-sm text-red-700">{list.error}</p><ClinicButton onClick={() => { void list.load(); }}>Δοκιμή ξανά</ClinicButton></div>
        : !data ? <ClinicLoading label="Φόρτωση αιτημάτων…" />
        : !data.items.length ? <ClinicEmptyState title={list.q ? 'Δεν βρέθηκε αίτημα' : 'Δεν υπάρχουν αιτήματα εδώ'} description={list.q ? undefined : 'Τα νέα αιτήματα από τη σελίδα «Για κτηνιάτρους» εμφανίζονται εδώ και έρχονται και με email.'} />
        : <ul className="divide-y divide-ink-100">{data.items.map(request => {
          const [badge, label] = STATUS_LABEL[request.status];
          return <li key={request.id} className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-start sm:justify-between sm:px-5">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold text-ink-900">{request.clinic_name}</h3><ClinicStatusBadge status={badge}>{label}</ClinicStatusBadge></div>
              <p className="mt-0.5 text-sm text-ink-700">{request.name} · {request.city}</p>
              <p className="mt-0.5 break-all text-sm"><a href={`mailto:${request.email}`} className="text-clinic-700 underline-offset-4 hover:underline">{request.email}</a> · <a href={`tel:${request.phone}`} className="text-clinic-700 underline-offset-4 hover:underline">{request.phone}</a></p>
              {request.message && <p className="mt-2 whitespace-pre-line break-words rounded-[10px] bg-ink-50 px-3 py-2 text-sm text-ink-700">{request.message}</p>}
              <p className="mt-2 text-xs text-ink-500">Στάλθηκε {when(request.created_at)}</p>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2 sm:flex-col sm:items-end">
              {request.vet_id
                ? <Link href={`/admin/vets?q=${encodeURIComponent(request.email)}`} className="inline-flex min-h-8 items-center rounded-[10px] px-3 text-[13px] font-medium text-clinic-700 hover:bg-black/[0.06]">Προβολή λογαριασμού</Link>
                : <ClinicButton variant="primary" onClick={() => { setCreated(null); setCreatingFor(request); }}>Δημιουργία λογαριασμού</ClinicButton>}
              {request.status !== 'converted' && <ClinicSelect aria-label={`Κατάσταση αιτήματος ${request.clinic_name}`} disabled={busyId === request.id} value={request.status} onChange={e => { void setStatus(request, e.target.value as DemoStatus); }} className="min-h-8 py-1 text-[13px]">
                <option value="new">Νέο</option>
                <option value="contacted">Σε επικοινωνία</option>
                <option value="closed">Κλειστό</option>
              </ClinicSelect>}
            </div>
          </li>;
        })}</ul>}
    </ClinicPanel>
    <ClinicPagination page={list.page} totalPages={list.totalPages} onPageChange={page => list.navigate({ page })} />
  </div>;
}

export default function AdminDemoRequestsPage() {
  return <Suspense fallback={<ClinicLoading />}><DemoRequestsList /></Suspense>;
}
