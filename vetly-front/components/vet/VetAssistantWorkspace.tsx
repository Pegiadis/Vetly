'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { Patient } from '@/hooks/useVetData';
import { ClinicButton, ClinicInput, ClinicPanel, ClinicTextarea, ClinicLoading, ClinicPagination } from './ClinicUI';

type Context = {
  patient: Pick<Patient, 'id' | 'name' | 'type' | 'breed' | 'age' | 'weight' | 'gender'>;
  events: { id: string; date: string; title: string; notes: string | null; event_type: string }[];
  total_events: number;
};
type Draft = Context & { content: string; task: 'summary' | 'instructions' };
const date = (value: string) => new Date(`${value}T12:00:00`).toLocaleDateString('el-GR');

function PatientWorkspace({ patient }: { patient: Patient }) {
  const [context, setContext] = useState<Context | null>(null);
  const [contextError, setContextError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [notes, setNotes] = useState('');
  const [draft, setDraft] = useState<Draft | null>(null);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    let active = true;
    api.get<Context>(`/vet/chat/patients/${patient.id}/context`).then(data => { if (active) setContext(data); }).catch(() => { if (active) setContextError('Δεν φορτώθηκε ο φάκελος. Δοκιμάστε ξανά.'); });
    return () => { active = false; };
  }, [patient.id, attempt]);
  async function generate(task: Draft['task']) {
    if (busy || !context) return;
    if (text && !window.confirm('Να αντικατασταθεί το τρέχον προσχέδιο;')) return;
    setBusy(true); setError(''); setCopied(false);
    try {
      const result = await api.post<Draft>('/vet/chat/patient-draft', { pet_id: patient.id, task, notes: task === 'instructions' ? notes : '' });
      setDraft(result); setText(result.content);
    } catch (e) { setError(e instanceof Error ? e.message : 'Δεν δημιουργήθηκε το προσχέδιο.'); }
    finally { setBusy(false); }
  }
  const sources = draft || context;
  return <div className="min-w-0 space-y-4">
    <ClinicPanel className="px-5 py-4"><p className="text-xs text-ink-500">Επιλεγμένος ασθενής</p><h2 className="mt-1 text-lg font-semibold text-ink-900">{patient.name}</h2><p className="mt-1 text-xs text-ink-500">{patient.breed || patient.type} · {patient.age ?? '—'} ετών · {patient.weight ?? '—'} kg</p><p className="mt-2 text-xs text-ink-500">Χρησιμοποιούνται μόνο τα στοιχεία αυτού του ασθενή και έως 50 πρόσφατες καταχωρίσεις. Τα προσχέδια δεν αποθηκεύονται στον φάκελο.</p></ClinicPanel>
    {!context && !contextError && <ClinicLoading label="Φόρτωση φακέλου…" />}
    {contextError && <div role="alert" className="rounded-lg border border-red-200 bg-white p-4 text-sm text-red-700">{contextError}<ClinicButton className="ml-2" onClick={() => { setContextError(''); setAttempt(a => a + 1); }}>Επανάληψη</ClinicButton></div>}
    {context && <>
      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_260px]">
        <div className="min-w-0 space-y-4">
          <ClinicPanel className="overflow-hidden">
            <div className="border-b border-ink-200 p-4"><h3 className="text-sm font-semibold">Σύνοψη ιστορικού</h3><p className="mt-1 text-xs leading-5 text-ink-500">Χρονολόγιο και καταγεγραμμένα στοιχεία, με αναφορές στις πηγές τους.</p><ClinicButton className="mt-3" disabled={busy || !context.events.length} onClick={() => generate('summary')}>Δημιουργία σύνοψης</ClinicButton>{!context.events.length && <p className="mt-2 text-xs text-ink-500">Δεν υπάρχουν καταχωρίσεις ιστορικού για σύνοψη.</p>}</div>
            <form className="p-4" onSubmit={e => { e.preventDefault(); void generate('instructions'); }}><h3 className="text-sm font-semibold">Οδηγίες προς κηδεμόνα</h3><p className="mt-1 text-xs leading-5 text-ink-500">Μετατροπή των δικών σας οδηγιών σε κατανοητό προσχέδιο.</p><label htmlFor="vet-instructions" className="mb-1.5 mt-3 block text-xs font-medium">Τι θέλετε να επικοινωνήσετε;</label><ClinicTextarea id="vet-instructions" value={notes} onChange={e => setNotes(e.target.value)} maxLength={5000} rows={4} className="w-full" placeholder="Γράψτε τις οδηγίες και τον επανέλεγχο που έχετε ορίσει…" disabled={busy} /><div className="mt-3 flex items-center justify-between gap-2"><span className="text-xs text-ink-500">{notes.length}/5000</span><ClinicButton type="submit" variant="primary" disabled={busy || !notes.trim()}>Δημιουργία προσχεδίου</ClinicButton></div></form>
          </ClinicPanel>
          {busy && <p role="status" className="text-sm text-clinic-700">Ο βοηθός ετοιμάζει το προσχέδιο…</p>}
          {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          {draft && <ClinicPanel className="overflow-hidden"><div className="border-b border-ink-200 p-4"><h3 className="text-sm font-semibold">{draft.task === 'summary' ? 'Σύνοψη ιστορικού' : 'Προσχέδιο οδηγιών'} · Προς έλεγχο</h3><p className="mt-1 text-xs text-ink-500">Ελέγξτε και διορθώστε πριν χρησιμοποιήσετε το κείμενο.</p></div><div className="p-4"><label htmlFor="assistant-draft" className="sr-only">Επεξεργασία προσχεδίου</label><ClinicTextarea id="assistant-draft" className="w-full leading-6" rows={14} value={text} onChange={e => { setText(e.target.value); setCopied(false); }} /></div><div className="flex items-center justify-between gap-3 border-t border-ink-200 bg-ink-50 p-3"><p className="text-xs text-ink-500" role="status">{copied ? 'Αντιγράφηκε.' : 'Δεν έχει σταλεί στον κηδεμόνα.'}</p><ClinicButton disabled={!text.trim()} onClick={async () => { try { await navigator.clipboard.writeText(text); setCopied(true); } catch { setError('Δεν επιτράπηκε η αντιγραφή. Επιλέξτε και αντιγράψτε το κείμενο.'); } }}>Αντιγραφή</ClinicButton></div></ClinicPanel>}
        </div>
        <ClinicPanel className="min-w-0 overflow-hidden"><div className="border-b border-ink-200 p-4"><h3 className="text-sm font-semibold">{draft ? 'Πηγές του προσχεδίου' : 'Διαθέσιμο ιστορικό'}</h3><p className="mt-1 text-xs text-ink-500">{sources?.events.length} από {sources?.total_events} καταχωρίσεις</p></div><div className="max-h-[600px] divide-y divide-ink-100 overflow-auto">{sources?.events.map(event => <details key={event.id} className="p-3"><summary className="cursor-pointer text-xs leading-5"><span className="text-ink-500">{date(event.date)}</span><span className="block break-words font-medium text-ink-800">{event.title}</span></summary><p className="mt-2 whitespace-pre-wrap break-words text-xs leading-5 text-ink-500">{event.notes || 'Χωρίς επιπλέον σημειώσεις.'}</p></details>)}{!sources?.events.length && <p className="p-4 text-xs text-ink-500">Δεν υπάρχει καταγεγραμμένο ιστορικό.</p>}</div></ClinicPanel>
      </div>
    </>}
  </div>;
}

export default function VetAssistantWorkspace() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<Patient | null>(null);
  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      api.get<{ items: Patient[]; total: number }>(`/vet/patients?page=${page}&page_size=10&search=${encodeURIComponent(search)}`).then(data => { if (active) { setPatients(data.items); setTotal(data.total); setError(''); } }).catch(() => { if (active) setError('Δεν φορτώθηκαν οι ασθενείς. Δοκιμάστε άλλη αναζήτηση ή ανανεώστε τη σελίδα.'); }).finally(() => { if (active) setLoading(false); });
    }, 250);
    return () => { active = false; clearTimeout(timer); };
  }, [search, page]);
  return <div className="grid items-start gap-4 lg:grid-cols-[240px_minmax(0,1fr)]">
    <aside className="min-w-0"><ClinicPanel className="overflow-hidden"><div className="border-b border-ink-200 p-3"><h2 className="mb-3 text-sm font-semibold">Επιλογή ασθενή</h2><ClinicInput aria-label="Αναζήτηση ασθενή" placeholder="Όνομα κατοικιδίου…" className="w-full" value={search} onChange={e => { setSearch(e.target.value); setPage(1); setLoading(true); }} /></div><div className="max-h-60 overflow-auto lg:max-h-[520px]">{loading ? <ClinicLoading /> : error ? <p role="alert" className="p-3 text-xs text-red-700">{error}</p> : patients.length ? patients.map(patient => <button key={patient.id} type="button" aria-pressed={selected?.id === patient.id} onClick={() => { if (!selected || selected.id === patient.id || window.confirm('Αλλαγή ασθενή; Το προσωρινό προσχέδιο θα καθαριστεί.')) setSelected(patient); }} className={`block w-full border-b border-ink-100 px-3 py-3 text-left last:border-0 ${selected?.id === patient.id ? 'bg-clinic-50' : 'hover:bg-ink-50'}`}><span className="block text-sm font-semibold text-ink-900">{patient.name}</span><span className="mt-1 block text-xs text-ink-500">{patient.owner?.name || patient.breed || patient.type}</span></button>) : <p className="p-4 text-xs text-ink-500">Δεν βρέθηκαν ασθενείς.</p>}</div></ClinicPanel><ClinicPagination page={page} totalPages={Math.ceil(total / 10)} onPageChange={value => { setPage(value); setLoading(true); }} /><p className="mt-3 text-xs leading-5 text-ink-500">Εμφανίζονται οι ασθενείς που είναι προσβάσιμοι από τον φάκελο του ιατρείου σας.</p></aside>
    {selected ? <PatientWorkspace key={selected.id} patient={selected} /> : <ClinicPanel className="p-6 sm:p-10"><span className="rounded-md bg-clinic-100 px-2 py-1 text-xs text-clinic-700">Βοηθός κτηνιατρείου</span><h2 className="mt-4 text-xl font-semibold text-ink-900">Ο φάκελος, σε χρήσιμη μορφή.</h2><p className="mt-2 max-w-lg text-sm leading-6 text-ink-500">Επιλέξτε ασθενή για να συνοψίσετε το ιστορικό του ή να ετοιμάσετε οδηγίες προς τον κηδεμόνα.</p><div className="mt-6 grid gap-4 sm:grid-cols-2"><div className="border-t border-ink-200 pt-4"><h3 className="text-sm font-semibold">01 · Σύνοψη ιστορικού</h3><p className="mt-2 text-xs leading-5 text-ink-500">Χρονολόγιο, καταγραφές και ελλείψεις με ορατές πηγές.</p></div><div className="border-t border-ink-200 pt-4"><h3 className="text-sm font-semibold">02 · Προσχέδιο οδηγιών</h3><p className="mt-2 text-xs leading-5 text-ink-500">Οι δικές σας οδηγίες σε απλή γλώσσα, έτοιμες για έλεγχο και αντιγραφή.</p></div></div></ClinicPanel>}
  </div>;
}
