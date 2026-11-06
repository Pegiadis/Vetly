'use client';

import { api } from '@/lib/api';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ClinicButton, ClinicEmptyState, ClinicInput, ClinicListRow, ClinicLoading, ClinicPageHeader, ClinicPagination, ClinicPanel, ClinicStatusBadge, ClinicTextarea } from '@/components/vet/ClinicUI';
import { approveAppointment, rejectAppointment, useAllAppointments, usePatient, usePatientHistory, VetAppointment } from '@/hooks/useVetData';
import { useToast } from '@/components/Toast';

const formatDate = (value: string) => new Date(value).toLocaleDateString('el-GR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const formatTime = (value: string) => new Date(value).toLocaleTimeString('el-GR', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });

function PatientContext({ petId }: { petId: string }) {
  const { patient, loading, error } = usePatient(petId);
  const { events, loading: historyLoading, error: historyError } = usePatientHistory(petId);
  return <details className="border-t border-ink-200 pt-4">
    <summary className="cursor-pointer text-sm font-semibold text-ink-800">Στοιχεία ασθενούς & ιστορικό</summary>
    <div className="mt-4 space-y-4">
      {loading ? <p className="text-sm text-ink-500">Φόρτωση στοιχείων…</p> : error ? <p role="alert" className="text-sm text-red-700">Δεν ήταν δυνατή η φόρτωση των στοιχείων ασθενούς.</p> : patient && <>
        <p className="text-sm text-ink-600">{patient.breed}</p>
        <dl className="grid grid-cols-3 gap-2 text-sm">
          <div><dt className="text-xs text-ink-500">Ηλικία</dt><dd className="mt-1">{patient.age ?? '—'}</dd></div>
          <div><dt className="text-xs text-ink-500">Βάρος</dt><dd className="mt-1">{patient.weight != null ? `${patient.weight} kg` : '—'}</dd></div>
          <div><dt className="text-xs text-ink-500">Φύλο</dt><dd className="mt-1">{patient.gender === 'Male' ? 'Αρσενικό' : patient.gender === 'Female' ? 'Θηλυκό' : '—'}</dd></div>
        </dl>
        {patient.chip_number && <p className="break-all text-xs text-ink-500">Microchip: {patient.chip_number}</p>}
      </>}
      <h4 className="text-xs font-semibold text-ink-500">Ιστορικό επισκέψεων</h4>
      {historyLoading ? <p className="text-sm text-ink-500">Φόρτωση ιστορικού…</p> : historyError ? <p role="alert" className="text-sm text-red-700">Δεν ήταν δυνατή η φόρτωση του ιστορικού.</p> : events.length ? <ul className="divide-y divide-ink-200">{events.map(event => <li key={event.id} className="py-3 first:pt-0"><p className="break-words text-sm font-medium">{event.title}</p><p className="mt-1 text-xs text-ink-500">{formatDate(event.date)} · {event.event_type}</p>{event.notes && <p className="mt-2 whitespace-pre-wrap break-words text-sm text-ink-600">{event.notes}</p>}</li>)}</ul> : <p className="text-sm text-ink-500">Δεν υπάρχει καταχωρημένο ιστορικό.</p>}
    </div>
  </details>;
}

function RequestPanel({ appointment, busy, onClose, onDecide }: {
  appointment: VetAppointment;
  busy: boolean;
  onClose: () => void;
  onDecide: (action: 'approve' | 'reject', reason?: string) => Promise<void>;
}) {
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const reasonRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { ref.current?.focus({ preventScroll: true }); if (window.innerWidth < 1280) ref.current?.scrollIntoView({ block: 'start' }); }, []);
  useEffect(() => { if (rejecting) reasonRef.current?.focus(); }, [rejecting]);
  const submit = async (action: 'approve' | 'reject') => {
    setError('');
    try { await onDecide(action, reason.trim() || undefined); }
    catch (err) { setError(err instanceof Error ? err.message : 'Η ενέργεια δεν ολοκληρώθηκε. Δοκιμάστε ξανά.'); }
  };
  const group = !!appointment.group_id;
  return <div ref={ref} tabIndex={-1} role="region" aria-label="Έλεγχος αιτήματος" aria-busy={busy} className="min-w-0 scroll-mt-20 outline-none xl:sticky xl:top-20 xl:max-h-[calc(100dvh-6rem)] xl:overflow-y-auto">
    <ClinicPanel className="overflow-hidden">
      <div className="flex items-center justify-between border-b border-ink-200 px-5 py-3"><h2 className="text-sm font-semibold">Έλεγχος αιτήματος</h2><ClinicButton variant="ghost" aria-label="Κλείσιμο αιτήματος" disabled={busy} onClick={onClose}>×</ClinicButton></div>
      <div className="space-y-5 p-5">
        <div><ClinicStatusBadge status="pending">Αναμονή έγκρισης</ClinicStatusBadge><h3 className="mt-3 break-words text-2xl font-semibold tracking-tight">{appointment.pet?.name || 'Ασθενής'}</h3><p className="mt-1 break-words text-sm text-ink-500">{appointment.type}</p></div>
        <div className="rounded-lg border border-clinic-100 bg-clinic-50/50 p-4"><p className="text-xs font-medium text-clinic-800">Ζητούμενη επίσκεψη</p><p className="mt-2 text-sm font-semibold">{formatDate(appointment.scheduled_at)}</p><p className="mt-1 text-xl font-semibold tabular-nums">{formatTime(appointment.scheduled_at)} <span className="text-xs font-normal text-ink-500">· {appointment.duration_minutes} λεπτά</span></p></div>
        <section className="border-b border-ink-200 pb-4"><h4 className="text-xs font-semibold text-ink-500">Κηδεμόνας</h4><p className="mt-2 break-words text-sm font-medium">{appointment.pet_owner?.name || 'Δεν έχουν καταχωρηθεί στοιχεία.'}</p>{appointment.pet_owner?.phone && <a className="mt-2 inline-block text-sm text-clinic-700 underline underline-offset-4" href={`tel:${appointment.pet_owner.phone}`}>{appointment.pet_owner.phone}</a>}</section>
        <section><h4 className="text-xs font-semibold text-ink-500">Σημειώσεις αιτήματος</h4><p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-ink-600">{appointment.notes || 'Δεν υπάρχουν σημειώσεις.'}</p></section>
        {group && <p className="rounded-lg bg-clinic-50 p-3 text-xs leading-5 text-clinic-800">Ομαδική επίσκεψη: η έγκριση ή η απόρριψη αφορά όλα τα εκκρεμή αιτήματα της ίδιας ομάδας, ακόμη κι αν δεν εμφανίζονται σε αυτή τη σελίδα.</p>}
        <PatientContext key={appointment.pet_id} petId={appointment.pet_id} />
      </div>
      <div className="sticky bottom-0 border-t border-ink-200 bg-ink-50 p-4">
        {error && <p role="alert" className="mb-3 break-words text-sm text-red-700">{error}</p>}
        {rejecting ? <form onSubmit={e => { e.preventDefault(); void submit('reject'); }} className="space-y-3">
          <label htmlFor="request-rejection-reason" className="block text-sm font-semibold">Αιτία απόρριψης <span className="font-normal text-ink-500">(προαιρετική)</span></label>
          <ClinicTextarea ref={reasonRef} id="request-rejection-reason" rows={3} maxLength={1000} value={reason} disabled={busy} onChange={e => setReason(e.target.value)} placeholder="Σημειώστε τον λόγο απόρριψης…" className="w-full" />
          <p className="text-xs leading-5 text-ink-500">{group ? 'Τα εκκρεμή αιτήματα της ομάδας θα απορριφθούν.' : 'Το αίτημα θα απορριφθεί.'} Ο κηδεμόνας θα ειδοποιηθεί.</p>
          <div className="flex flex-wrap gap-2"><ClinicButton type="submit" variant="danger" disabled={busy}>{busy ? 'Αποθήκευση…' : 'Επιβεβαίωση απόρριψης'}</ClinicButton><ClinicButton type="button" disabled={busy} onClick={() => { setRejecting(false); setError(''); }}>Πίσω</ClinicButton></div>
        </form> : <><p className="mb-3 text-xs text-ink-500">Με την απόφασή σας θα ειδοποιηθεί ο κηδεμόνας.</p><div className="flex flex-wrap gap-2"><ClinicButton variant="primary" disabled={busy} onClick={() => void submit('approve')}>{busy ? 'Αποθήκευση…' : group ? 'Έγκριση ομάδας' : 'Έγκριση αιτήματος'}</ClinicButton><ClinicButton variant="danger" disabled={busy} onClick={() => { setRejecting(true); setError(''); }}>{group ? 'Απόρριψη ομάδας' : 'Απόρριψη'}</ClinicButton></div></>}
      </div>
    </ClinicPanel>
  </div>;
}

export default function VetPendingPage() {
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<'asc' | 'desc'>('asc');
  const [selected, setSelected] = useState<VetAppointment | null>(null);
  const [busy, setBusy] = useState(false);
  const actionLock = useRef(false);
  const [linkError,setLinkError] = useState('');
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('appointmentId');
    if(!id)return;
    let active=true;
    api.get<VetAppointment>(`/vet/appointments/${encodeURIComponent(id)}`).then(appointment=>{
      if(!active)return;
      if(appointment.status==='pending')setSelected(appointment);
      else window.location.replace(`/vet/appointments?appointmentId=${encodeURIComponent(appointment.id)}`);
    }).catch(()=>{if(active)setLinkError('Το αίτημα δεν είναι διαθέσιμο ή δεν έχετε πρόσβαση.');});
    return()=>{active=false};
  }, []);

  const trigger = useRef<HTMLButtonElement | null>(null);
  const toast = useToast();
  const { appointments, total, totalPages, loading, error, refetch } = useAllAppointments(page, 10, { status: 'pending', search, sort });
  useEffect(() => {
    if (query.trim() === search) return;
    const timer = setTimeout(() => { setSearch(query.trim()); setPage(1); }, 300);
    return () => clearTimeout(timer);
  }, [query, search]);
  const days = useMemo(() => {
    const result = new Map<string, VetAppointment[]>();
    for (const appointment of appointments) {
      const day = new Date(appointment.scheduled_at).toLocaleDateString('en-CA');
      result.set(day, [...(result.get(day) || []), appointment]);
    }
    return Array.from(result.entries());
  }, [appointments]);
  const close = () => { setSelected(null); requestAnimationFrame(() => trigger.current?.focus()); };
  const decide = async (action: 'approve' | 'reject', reason?: string) => {
    if (!selected || actionLock.current) return;
    actionLock.current = true;
    setBusy(true);
    try {
      // Both endpoints already cascade to pending group members: submit once.
      if (action === 'approve') await approveAppointment(selected.id);
      else await rejectAppointment(selected.id, reason);
      const removedOnPage = appointments.filter(a => a.id === selected.id || (selected.group_id && a.group_id === selected.group_id)).length;
      close();
      window.dispatchEvent(new Event('vetly:pending-updated'));
      toast.success(action === 'approve' ? 'Το αίτημα εγκρίθηκε.' : 'Το αίτημα απορρίφθηκε.');
      if (page > 1 && removedOnPage === appointments.length) setPage(page - 1);
      else await refetch();
    } finally { actionLock.current = false; setBusy(false); }
  };
  return <div>
    {linkError && <p role="alert" className="mb-4 text-sm text-red-700">{linkError}</p>}
    <ClinicPageHeader title="Αιτήματα Ραντεβού" description="Ελέγξτε την επίσκεψη και το ιστορικό του ασθενούς πριν απαντήσετε." />
    <div className={`grid items-start gap-4 ${selected ? 'xl:grid-cols-[minmax(0,1fr)_380px]' : ''}`}>
      <div className="order-2 min-w-0 xl:order-1">
        <ClinicPanel className="overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink-200 px-4 py-3"><h2 className="text-sm font-semibold">Προς έγκριση</h2><span role="status" className="text-xs text-ink-500">{loading ? 'Φόρτωση…' : `${total} εκκρεμή ραντεβού${search ? ' στα αποτελέσματα' : ''}`}</span></div>
          <div className="flex flex-wrap items-center gap-2 border-b border-ink-200 p-3"><ClinicInput type="search" aria-label="Αναζήτηση αιτημάτων" maxLength={100} placeholder="Αναζήτηση ασθενή ή κηδεμόνα…" value={query} disabled={busy} onChange={e => { setQuery(e.target.value); setSelected(null); }} className="w-full sm:w-80 sm:max-w-full" /><ClinicButton variant="ghost" disabled={busy} className="sm:ml-auto" onClick={() => { setSort(sort === 'asc' ? 'desc' : 'asc'); setPage(1); setSelected(null); }}>{sort === 'asc' ? '↑ Νωρίτερες επισκέψεις' : '↓ Αργότερες επισκέψεις'}</ClinicButton></div>
          {loading || query.trim() !== search ? <ClinicLoading label="Φόρτωση αιτημάτων…" /> : error ? <div role="alert" className="p-6 text-center"><p className="mb-3 text-sm text-red-700">{error}</p><ClinicButton onClick={() => void refetch()}>Δοκιμή ξανά</ClinicButton></div> : !appointments.length ? <ClinicEmptyState title={search ? 'Δεν βρέθηκαν αιτήματα' : 'Δεν υπάρχουν εκκρεμή αιτήματα'} description={search ? 'Δοκιμάστε άλλο όνομα ασθενή ή κηδεμόνα.' : 'Τα νέα αιτήματα ραντεβού θα εμφανιστούν εδώ.'}>{search && <ClinicButton onClick={() => setQuery('')}>Καθαρισμός αναζήτησης</ClinicButton>}</ClinicEmptyState> : days.map(([day, items]) => <section key={day} aria-label={formatDate(items[0].scheduled_at)}>
            <div className="flex items-center justify-between gap-2 border-y border-ink-200 bg-ink-50 px-4 py-2.5"><h3 className="text-xs font-semibold text-ink-700">{formatDate(items[0].scheduled_at)}</h3><span className="shrink-0 text-xs text-ink-500">{items.length} στη σελίδα</span></div>
            {items.map(appointment => <ClinicListRow key={appointment.id} className={selected?.id === appointment.id ? 'bg-clinic-50/60! shadow-[inset_3px_0_0_var(--color-clinic-600)]' : ''}>
              <div className="grid grid-cols-[52px_minmax(0,1fr)] gap-x-3 gap-y-3 sm:grid-cols-[52px_minmax(0,1fr)_auto]">
                <div><p className="text-base font-semibold tabular-nums">{formatTime(appointment.scheduled_at)}</p><p className="mt-1 text-xs text-ink-500">{appointment.duration_minutes}′</p></div>
                <div className="min-w-0"><p className="break-words text-sm font-semibold">{appointment.pet?.name || 'Ασθενής'}</p><p className="mt-1 break-words text-xs text-ink-500">{appointment.pet_owner?.name || 'Χωρίς στοιχεία κηδεμόνα'}</p><p className="mt-1 break-words text-sm text-ink-600">{appointment.type}</p><div className="mt-2 flex flex-wrap items-center gap-2"><ClinicStatusBadge status="pending">Αναμονή</ClinicStatusBadge>{appointment.group_id && <span className="text-xs text-clinic-700">Ομαδική επίσκεψη</span>}</div></div>
                <div className="col-start-2 sm:col-start-3"><ClinicButton disabled={busy} aria-label={`Έλεγχος αιτήματος: ${appointment.pet?.name || 'Ασθενής'}, ${formatTime(appointment.scheduled_at)}`} aria-pressed={selected?.id === appointment.id} onClick={e => { trigger.current = e.currentTarget; setSelected(appointment); }}>Έλεγχος αιτήματος</ClinicButton></div>
              </div>
            </ClinicListRow>)}
          </section>)}
        </ClinicPanel>
        {!loading && <div inert={busy}><ClinicPagination page={page} totalPages={totalPages} onPageChange={value => { setPage(value); setSelected(null); }} /></div>}
      </div>
      {selected && <div className="order-1 min-w-0 xl:order-2 xl:sticky xl:top-20"><RequestPanel key={selected.id} appointment={selected} busy={busy} onClose={close} onDecide={decide} /></div>}
    </div>
  </div>;
}
