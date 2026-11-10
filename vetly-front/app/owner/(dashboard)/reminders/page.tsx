'use client';
import { useRef, useState } from 'react';
import Link from 'next/link';
import { useOwnerReminders, dismissReminder, type OwnerReminder } from '@/hooks/useOwnerData';
import ClinicDrawer from '@/components/vet/ClinicDrawer';
import ClinicAvatar from '@/components/vet/ClinicAvatar';
import { ClinicButton, ClinicInput, ClinicSelect, ClinicLoading, ClinicPagination, ClinicPanel, ClinicPageHeader, ClinicStatusBadge, ClinicEmptyState } from '@/components/vet/ClinicUI';
import { useToast } from '@/components/Toast';
import { ErrorBlock, InlineAlert, DrawerHeader, Fact, athensNow, formatDay, linkPrimary } from '@/components/owner/OwnerUI';

const types: Record<string, string> = { vaccination: 'Εμβολιασμός', checkup: 'Έλεγχος', medication: 'Φαρμακευτική αγωγή', custom: 'Γενικό' };
const rowGrid = 'lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_140px_190px]';
// Due dates are calendar days; they are compared with today's date in Athens.
const date = (value: string) => formatDay(value, { day: 'numeric', month: 'short', year: 'numeric' });
function overdue(r: OwnerReminder) { return !r.is_dismissed && r.due_date.slice(0, 10) < athensNow().slice(0, 10); }
function status(r: OwnerReminder) { return r.is_dismissed ? 'Απορρίφθηκε' : overdue(r) ? 'Πέρασε η ημερομηνία' : 'Προσεχής'; }
function StatusBadge({ reminder }: { reminder: OwnerReminder }) {
  return <ClinicStatusBadge status={reminder.is_dismissed ? 'neutral' : overdue(reminder) ? 'pending' : 'completed'}>{status(reminder)}</ClinicStatusBadge>;
}
export default function OwnerRemindersPage() {
  const [page, setPage] = useState(1);
  const { reminders, total, totalPages, loading, error, refetch } = useOwnerReminders(page, 10);
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<OwnerReminder | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState('');
  const pending = useRef(false);
  const toast = useToast();
  const visible = reminders.filter(r => (filter === 'all' || (filter === 'active' ? !r.is_dismissed : filter === 'overdue' ? overdue(r) : r.is_dismissed)) && `${r.title} ${r.pet_name || ''} ${r.vet_name || ''}`.toLocaleLowerCase('el').includes(query.toLocaleLowerCase('el')));
  async function dismiss() {
    if (!selected || pending.current) return;
    pending.current = true; setBusy(true); setActionError('');
    try { await dismissReminder(selected.id); setSelected({ ...selected, is_dismissed: true }); setConfirm(false); void refetch(); toast.success('Η υπενθύμιση απορρίφθηκε.'); }
    catch { setActionError('Δεν ολοκληρώθηκε η απόρριψη. Δοκίμασε ξανά.'); }
    finally { pending.current = false; setBusy(false); }
  }
  return <div className="space-y-4 text-ink-800">
    <ClinicPageHeader title="Υπενθυμίσεις" description="Προγραμματισμένη φροντίδα και επόμενες ενέργειες για τα κατοικίδιά σου." />
    <ClinicPanel className="overflow-hidden">
      <div className="grid gap-3 border-b border-ink-200 p-4 sm:grid-cols-2"><ClinicSelect aria-label="Κατάσταση υπενθυμίσεων στη σελίδα" className="h-10" value={filter} onChange={e => setFilter(e.target.value)}><option value="all">Όλες στη σελίδα</option><option value="active">Ενεργές</option><option value="overdue">Πέρασε η ημερομηνία</option><option value="dismissed">Απορριφθείσες</option></ClinicSelect><ClinicInput aria-label="Αναζήτηση υπενθυμίσεων" type="search" className="h-10" placeholder="Αναζήτηση στη σελίδα…" value={query} onChange={e => setQuery(e.target.value)} /></div>
      <div className={`hidden gap-4 border-b border-ink-200 bg-ink-50 px-5 py-2 text-xs font-medium text-ink-500 lg:grid ${rowGrid}`}><span>Υπενθύμιση</span><span>Κατοικίδιο</span><span>Ημερομηνία</span><span>Κατάσταση</span></div>
      {loading ? <ClinicLoading /> : error ? <ErrorBlock onRetry={refetch} /> : visible.length ? visible.map(r => <button key={r.id} onClick={() => { setSelected(r); setConfirm(false); setActionError(''); }} className={`grid w-full gap-2 border-b border-ink-100 px-4 py-3.5 text-left hover:bg-ink-50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-clinic-600 sm:px-5 lg:items-center lg:gap-4 ${rowGrid}`}>
        <span className="min-w-0"><span className="block break-words text-sm font-semibold text-ink-900">{r.title}</span><span className="mt-0.5 block text-xs text-ink-500">{types[r.type] || r.type}{r.vet_name ? ` · ${r.vet_name}` : ''}</span></span>
        <span className="flex min-w-0 items-center gap-2"><ClinicAvatar name={r.pet_name || 'Κατοικίδιο'} imageUrl={r.pet_image_url} /><span className="truncate text-sm text-ink-700">{r.pet_name || 'Κατοικίδιο'}</span></span>
        <time className="text-xs text-ink-600">{date(r.due_date)}</time><span className="flex items-center justify-between gap-2"><StatusBadge reminder={r} /><span aria-hidden="true" className="text-ink-400">→</span></span>
      </button>) : <ClinicEmptyState title={reminders.length ? 'Δεν βρέθηκαν αποτελέσματα στη σελίδα' : 'Δεν υπάρχουν υπενθυμίσεις'} description={reminders.length ? 'Δοκίμασε άλλη αναζήτηση ή φίλτρο.' : 'Οι υπενθυμίσεις του κτηνιάτρου θα εμφανίζονται εδώ.'} />}
      <div className="px-4"><ClinicPagination page={page} totalPages={totalPages} onPageChange={p => { setPage(p); setQuery(''); }} /></div>
      {!loading && !error && total > 0 && <p className="px-4 pb-3 pt-1 text-xs text-ink-500">{total} υπενθυμίσεις συνολικά</p>}
    </ClinicPanel>
    {selected && <ClinicDrawer label="Λεπτομέρειες υπενθύμισης" busy={busy} onClose={() => setSelected(null)}><div className="space-y-5 p-5">
      <DrawerHeader title={selected.title} subtitle={types[selected.type] || selected.type} disabled={busy} onClose={() => setSelected(null)} />
      <div className="flex items-center gap-3 rounded-xl border border-ink-200 p-3"><ClinicAvatar large name={selected.pet_name || 'Κατοικίδιο'} imageUrl={selected.pet_image_url} /><div className="min-w-0"><p className="break-words text-sm font-semibold">{selected.pet_name || 'Κατοικίδιο'}</p><p className="mt-1 text-xs text-ink-500">Από: {selected.vet_name || 'Κτηνίατρο'}</p></div></div>
      <dl className="grid grid-cols-2 gap-4"><Fact label="Προγραμματισμένη ημερομηνία">{date(selected.due_date)}</Fact><Fact label="Κατάσταση"><StatusBadge reminder={selected} /></Fact></dl>
      <section className="border-t border-ink-200 pt-4"><h3 className="text-sm font-semibold">Μήνυμα κτηνιάτρου</h3><p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-ink-600">{selected.message || 'Δεν έχει προστεθεί επιπλέον μήνυμα.'}</p></section>
      {actionError && <InlineAlert>{actionError}</InlineAlert>}
      {!selected.is_dismissed && (confirm ? <section className="rounded-xl border border-red-200 p-4"><h3 className="text-sm font-semibold">Απόρριψη υπενθύμισης;</h3><p className="mt-2 text-sm text-ink-600">Ο κτηνίατρος θα ειδοποιηθεί για την απόρριψη.</p><div className="mt-4 grid grid-cols-2 gap-2"><ClinicButton className="min-h-10" disabled={busy} onClick={() => { setConfirm(false); setActionError(''); }}>Πίσω</ClinicButton><ClinicButton variant="danger" className="min-h-10" disabled={busy} onClick={dismiss}>{busy ? 'Απόρριψη…' : 'Επιβεβαίωση απόρριψης'}</ClinicButton></div></section> : <div className="grid grid-cols-2 gap-2 border-t border-ink-200 pt-4"><Link href="/owner/book" className={linkPrimary}>Κράτηση ραντεβού</Link><ClinicButton variant="danger" className="min-h-10" onClick={() => setConfirm(true)}>Απόρριψη</ClinicButton></div>)}
    </div></ClinicDrawer>}
  </div>;
}
