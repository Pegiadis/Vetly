'use client';

import Link from 'next/link';
import ClinicAvatar from '@/components/vet/ClinicAvatar';
import { useEffect, useRef, useState } from 'react';
import { ClinicButton, ClinicEmptyState, ClinicInput, ClinicListRow, ClinicLoading, ClinicPageHeader, ClinicPagination, ClinicPanel } from '@/components/vet/ClinicUI';
import { api } from '@/lib/api';
import { downloadMedicalRecord, downloadVaccinationCertificate } from '@/hooks/useVetData';
import type { MedicalEvent, Patient, PatientWithOwner } from '@/hooks/useVetData';

const species: Record<string, string> = { Dog: 'Σκύλος', Cat: 'Γάτα', Other: 'Άλλο' };
const genders: Record<string, string> = { Male: 'Αρσενικό', Female: 'Θηλυκό' };
const dateLabel = (value: string) => new Date(value).toLocaleDateString('el-GR', { day: 'numeric', month: 'long', year: 'numeric' });

// Each request is scoped to its URL; late responses cannot replace a new selection.
function usePatientResource<T>(url: string) {
  const [state, setState] = useState<{ url: string; data?: T; error?: string }>({ url: '' });
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    api.get<T>(url).then(data => { if (active) setState({ url, data }); }).catch(err => { if (active) setState({ url, error: err instanceof Error ? err.message : 'Δεν ήταν δυνατή η φόρτωση.' }); });
    return () => { active = false; };
  }, [url, retry]);
  const current = state.url === url ? state : undefined;
  return { data: current?.data, error: current?.error, loading: !current, reload: () => { setState({ url: '' }); setRetry(value => value + 1); } };
}

function LoadError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return <div role="alert" className="space-y-3 p-5"><p className="break-words text-sm text-red-700">{message}</p><ClinicButton onClick={onRetry}>Δοκιμή ξανά</ClinicButton></div>;
}

// PDF downloads for one patient; only one runs at a time and a failure is shown next to the buttons.
function PatientDocuments({ patientId }: { patientId: string }) {
  const [busy, setBusy] = useState<'record' | 'vaccination' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const run = async (kind: 'record' | 'vaccination') => {
    if (busy) return;
    setBusy(kind);
    setError(null);
    try {
      await (kind === 'record' ? downloadMedicalRecord(patientId) : downloadVaccinationCertificate(patientId));
    } catch {
      setError('Δεν ήταν δυνατή η λήψη του εγγράφου. Δοκιμάστε ξανά.');
    } finally {
      setBusy(null);
    }
  };
  return <section><h4 className="text-xs font-semibold text-ink-500">Έγγραφα</h4>
    <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
      <ClinicButton disabled={busy !== null} onClick={() => run('record')}>{busy === 'record' ? 'Λήψη…' : 'Ιατρικός φάκελος (PDF)'}</ClinicButton>
      <ClinicButton disabled={busy !== null} onClick={() => run('vaccination')}>{busy === 'vaccination' ? 'Λήψη…' : 'Πιστοποιητικό εμβολιασμού (PDF)'}</ClinicButton>
    </div>
    {error && <p role="alert" className="mt-2 text-sm text-red-700">{error}</p>}
  </section>;
}

function PatientPanel({ patientId, onClose }: { patientId: string; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [tab, setTab] = useState<'details' | 'history'>('details');
  const { data: patient, error, loading, reload } = usePatientResource<PatientWithOwner>(`/vet/patients/${patientId}`);
  useEffect(() => { ref.current?.focus({ preventScroll: true }); if (window.innerWidth < 1280) ref.current?.scrollIntoView({ block: 'start' }); }, []);
  return <div ref={ref} role="region" aria-label="Φάκελος ασθενούς" tabIndex={-1} className="scroll-mt-20 outline-none xl:max-h-[calc(100dvh-6rem)] xl:overflow-y-auto">
    <ClinicPanel className="overflow-hidden">
      <div className="flex items-center justify-between border-b border-ink-200 px-5 py-3"><h2 className="text-sm font-semibold">Φάκελος ασθενούς</h2><ClinicButton variant="ghost" aria-label="Κλείσιμο φακέλου" onClick={onClose}>×</ClinicButton></div>
      {loading ? <ClinicLoading label="Φόρτωση ασθενούς…" /> : error ? <LoadError message={error} onRetry={reload} /> : patient && <>
        <div className="p-5"><div className="mb-3"><ClinicAvatar large name={patient.name} imageUrl={patient.image_url} /></div><p className="text-xs font-medium text-clinic-700">{species[patient.type] || patient.type}</p><h3 className="mt-2 break-words text-2xl font-semibold tracking-tight">{patient.name}</h3><p className="mt-1 break-words text-sm text-ink-500">{patient.breed || 'Δεν έχει καταχωρηθεί φυλή'}</p></div>
        <div role="group" aria-label="Περιεχόμενο φακέλου" className="flex gap-1 border-y border-ink-200 px-4 py-2">{([{value:'details',label:'Στοιχεία'},{value:'history',label:'Ιστορικό'}] as const).map(item => <button key={item.value} type="button" aria-pressed={tab === item.value} onClick={() => setTab(item.value)} className={`rounded-md px-3 py-2 text-sm font-medium focus-visible:outline-2 focus-visible:outline-clinic-600 ${tab === item.value ? 'bg-clinic-50 text-clinic-800' : 'text-ink-500 hover:bg-ink-50'}`}>{item.label}</button>)}</div>
        {tab === 'details' ? <div className="space-y-5 p-5">
          <section><h4 className="text-xs font-semibold text-ink-500">Στοιχεία ασθενούς</h4><dl className="mt-3 divide-y divide-ink-200 text-sm">{[
            ['Είδος', species[patient.type] || patient.type || '—'], ['Φυλή', patient.breed || '—'], ['Ηλικία', patient.age != null ? `${patient.age} ετών` : '—'], ['Βάρος', patient.weight != null ? `${patient.weight} kg` : '—'], ['Φύλο', genders[patient.gender || ''] || patient.gender || '—'], ['Microchip', patient.chip_number || 'Δεν έχει καταχωρηθεί'],
          ].map(([label,value]) => <div key={label} className="grid grid-cols-[85px_minmax(0,1fr)] gap-3 py-2.5"><dt className="text-ink-500">{label}</dt><dd className="break-words text-ink-800">{value}</dd></div>)}</dl></section>
          <section className="rounded-lg border border-clinic-100 bg-clinic-50/50 p-4"><h4 className="text-xs font-semibold text-clinic-800">Κηδεμόνας</h4>{patient.owner ? <><p className="mt-2 break-words text-sm font-semibold">{patient.owner.name}</p>{patient.owner.phone && <a className="mt-2 block break-words text-sm text-clinic-700 underline underline-offset-4" href={`tel:${patient.owner.phone}`}>{patient.owner.phone}</a>}{patient.owner.email && <a className="mt-2 block break-all text-sm text-clinic-700 underline underline-offset-4" href={`mailto:${patient.owner.email}`}>{patient.owner.email}</a>}</> : <p className="mt-2 text-sm text-ink-500">Δεν υπάρχουν διαθέσιμα στοιχεία κηδεμόνα.</p>}</section>
          <PatientDocuments patientId={patientId} />
          <ClinicButton className="w-full" onClick={() => setTab('history')}>Προβολή ιατρικού ιστορικού</ClinicButton>
        </div> : <PatientHistory key={patientId} patientId={patientId} />}
      </>}
    </ClinicPanel>
  </div>;
}

function PatientHistory({ patientId }: { patientId: string }) {
  const [page, setPage] = useState(1);
  const ref = useRef<HTMLDivElement>(null);
  const { data, error, loading, reload } = usePatientResource<{items: MedicalEvent[]; total: number}>(`/vet/patients/${patientId}/history?page=${page}&page_size=10`);
  return <div ref={ref} className="scroll-mt-20 p-5"><div className="mb-4 flex flex-wrap items-center justify-between gap-2"><h4 className="text-sm font-semibold">Ιατρικό ιστορικό</h4>{data && <span className="text-xs text-ink-500">{data.total} καταχωρίσεις</span>}</div>
    {loading ? <ClinicLoading label="Φόρτωση ιστορικού…" /> : error ? <LoadError message={error} onRetry={reload} /> : !data?.items.length ? <ClinicEmptyState title="Δεν υπάρχει καταχωρημένο ιστορικό" description="Οι καταχωρίσεις του ασθενούς θα εμφανίζονται εδώ." /> : <><ol className="space-y-4">{data.items.map(event => <li key={event.id} className="border-l-2 border-clinic-200 pl-4"><p className="text-xs text-ink-500">{dateLabel(event.date)}</p><h5 className="mt-1 break-words text-sm font-semibold">{event.title}</h5><p className="mt-1 break-words text-xs text-clinic-700">{event.event_type}</p>{event.notes && <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-ink-600">{event.notes}</p>}</li>)}</ol><ClinicPagination page={page} totalPages={Math.ceil(data.total / 10)} onPageChange={value => { setPage(value); ref.current?.scrollIntoView({block:'start'}); }} /></>}
  </div>;
}

export default function VetPatientsPage() {
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const trigger = useRef<HTMLButtonElement | null>(null);
  useEffect(() => { if (query.trim() === search) return; const timer = setTimeout(() => { setSearch(query.trim()); setPage(1); }, 300); return () => clearTimeout(timer); }, [query, search]);
  const params = new URLSearchParams({page:String(page),page_size:'10',...(search ? {search} : {})});
  const { data, error, loading, reload } = usePatientResource<{items:Patient[];total:number}>(`/vet/patients?${params}`);
  const close = () => { setSelectedId(null); requestAnimationFrame(() => trigger.current?.focus()); };
  return <div>
    <ClinicPageHeader title="Ασθενείς" description="Στοιχεία και ιατρικό ιστορικό ασθενών με ραντεβού στο κτηνιατρείο." actions={<Link href="/vet/clients" className="rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm font-medium text-ink-700 hover:bg-ink-50">Διαχείριση κηδεμόνων</Link>} />
    <div className={`grid items-start gap-4 ${selectedId ? 'xl:grid-cols-[minmax(0,1fr)_400px]' : ''}`}>
      <div className="order-2 min-w-0 xl:order-1">
        <ClinicPanel className="overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink-200 px-4 py-3"><h2 className="text-sm font-semibold">Μητρώο ασθενών</h2><span role="status" className="text-xs text-ink-500">{loading ? 'Φόρτωση…' : data ? `${data.total} ασθενείς${search ? ' στα αποτελέσματα' : ''}` : ''}</span></div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-200 p-3"><ClinicInput type="search" aria-label="Αναζήτηση ασθενούς" placeholder="Αναζήτηση με όνομα ασθενούς…" value={query} maxLength={100} onChange={e => { setQuery(e.target.value); setSelectedId(null); }} className="w-full sm:w-80 sm:max-w-full" /><span className="text-xs text-ink-500">Αλφαβητική σειρά</span></div>
          {loading || query.trim() !== search ? <ClinicLoading label="Φόρτωση ασθενών…" /> : error ? <LoadError message={error} onRetry={reload} /> : !data?.items.length ? <ClinicEmptyState title={search ? 'Δεν βρέθηκαν ασθενείς' : 'Δεν υπάρχουν ακόμη ασθενείς'} description={search ? 'Δοκιμάστε ένα διαφορετικό όνομα.' : 'Εδώ εμφανίζονται οι ασθενείς που έχουν ραντεβού στο κτηνιατρείο.'}>{search && <ClinicButton onClick={() => setQuery('')}>Καθαρισμός αναζήτησης</ClinicButton>}</ClinicEmptyState> : <><div aria-hidden="true" className="hidden gap-x-3 border-b border-ink-200 bg-ink-50 px-5 py-2 text-xs font-medium text-ink-500 md:grid md:grid-cols-[minmax(0,1.2fr)_minmax(0,1.2fr)_minmax(0,1fr)_72px_72px]"><span>Ασθενής</span><span>Είδος · Φυλή</span><span>Κηδεμόνας</span><span className="text-right">Ηλικία</span><span className="text-right">Βάρος</span></div>{data.items.map(patient => <ClinicListRow key={patient.id} className={selectedId === patient.id ? 'py-2! bg-clinic-50/60! shadow-[inset_3px_0_0_var(--color-clinic-600)]' : 'py-2!'}>
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1.2fr)_minmax(0,1fr)_72px_72px]">
              <div className="flex min-w-0 items-center gap-2.5"><ClinicAvatar name={patient.name} imageUrl={patient.image_url} /><button type="button" aria-label={`Στοιχεία ασθενούς: ${patient.name}`} aria-expanded={selectedId === patient.id} className="min-w-0 truncate text-left text-sm font-semibold text-ink-900 underline-offset-4 hover:text-clinic-700 hover:underline focus-visible:outline-2 focus-visible:outline-clinic-600" onClick={e => { trigger.current = e.currentTarget; setSelectedId(patient.id); }}>{patient.name}</button></div><p className="col-span-2 min-w-0 truncate pl-[46px] text-sm text-ink-600 md:col-span-1 md:pl-0">{species[patient.type] || patient.type}{patient.breed ? ` · ${patient.breed}` : ''}</p><p className="col-span-2 min-w-0 truncate pl-[46px] text-xs text-ink-500 md:col-span-1 md:pl-0 md:text-sm md:text-ink-600"><span className="md:hidden">Κηδεμόνας: </span>{patient.owner?.name || '—'}</p>
              <p className="col-start-2 row-start-1 text-right text-xs tabular-nums text-ink-500 md:col-start-auto md:row-start-auto md:text-sm md:text-ink-600">{patient.age != null ? `${patient.age} ετών` : '—'}</p><p className="hidden text-right text-sm tabular-nums text-ink-600 md:block">{patient.weight != null ? `${patient.weight} kg` : '—'}</p>
            </div>
          </ClinicListRow>)}</>}
        </ClinicPanel>
        {data && !loading && <ClinicPagination page={page} totalPages={Math.ceil(data.total/10)} onPageChange={value => { setPage(value); setSelectedId(null); }} />}
      </div>
      {selectedId && <div className="order-1 min-w-0 xl:order-2 xl:sticky xl:top-20"><PatientPanel key={selectedId} patientId={selectedId} onClose={close} /></div>}
    </div>
  </div>;
}
