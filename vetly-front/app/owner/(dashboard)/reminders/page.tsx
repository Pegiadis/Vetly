'use client';
import { useRef, useState } from 'react';
import Link from 'next/link';
import { useOwnerReminders, dismissReminder, type OwnerReminder } from '@/hooks/useOwnerData';
import ClinicDrawer from '@/components/vet/ClinicDrawer';
import ClinicAvatar from '@/components/vet/ClinicAvatar';
import { ClinicButton, ClinicInput, ClinicSelect, ClinicLoading, ClinicPagination } from '@/components/vet/ClinicUI';
import { useToast } from '@/components/Toast';
const types: Record<string,string> = { vaccination:'Εμβολιασμός',checkup:'Έλεγχος',medication:'Φαρμακευτική αγωγή',custom:'Γενικό' };
const date = (value: string) => new Date(value).toLocaleDateString('el-GR',{day:'numeric',month:'short',year:'numeric'});
function overdue(r: OwnerReminder) { const today = new Date();today.setHours(0,0,0,0);return !r.is_dismissed && new Date(r.due_date) < today; }
function status(r: OwnerReminder) { return r.is_dismissed ? 'Απορρίφθηκε' : overdue(r) ? 'Πέρασε η ημερομηνία' : 'Προσεχής'; }
export default function OwnerRemindersPage() {
  const [page,setPage] = useState(1);
  const {reminders,total,totalPages,loading,error,refetch} = useOwnerReminders(page,10);
  const [filter,setFilter] = useState('all');
  const [query,setQuery] = useState('');
  const [selected,setSelected] = useState<OwnerReminder|null>(null);
  const [confirm,setConfirm] = useState(false);
  const [busy,setBusy] = useState(false);
  const [actionError,setActionError] = useState('');
  const pending = useRef(false);
  const toast = useToast();
  const visible = reminders.filter(r => (filter === 'all' || (filter === 'active' ? !r.is_dismissed : filter === 'overdue' ? overdue(r) : r.is_dismissed)) && `${r.title} ${r.pet_name || ''} ${r.vet_name || ''}`.toLocaleLowerCase('el').includes(query.toLocaleLowerCase('el')));
  async function dismiss() {
    if (!selected || pending.current) return;
    pending.current = true;setBusy(true);setActionError('');
    try {await dismissReminder(selected.id);setSelected({...selected,is_dismissed:true});setConfirm(false);void refetch();toast.success('Η υπενθύμιση απορρίφθηκε.');}
    catch {setActionError('Δεν ολοκληρώθηκε η απόρριψη. Δοκιμάστε ξανά.');}
    finally {pending.current=false;setBusy(false);}
  }
  return <div className="mx-auto max-w-[1280px]">
    <header className="mb-5"><h1 className="text-xl font-semibold text-ink-900">Υπενθυμίσεις</h1><p className="mt-1 text-sm text-ink-500">Προγραμματισμένη φροντίδα και επόμενες ενέργειες για τα κατοικίδιά σας.</p></header>
    <section className="overflow-hidden rounded-xl border border-ink-200 bg-white shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink-200 px-4 py-3"><h2 className="text-sm font-semibold text-ink-900">Το πλάνο φροντίδας σας</h2><span className="text-xs text-ink-500">{loading ? 'Φόρτωση…' : `${total} καταχωρίσεις συνολικά`}</span></div>
      <div className="grid gap-3 border-b border-ink-200 p-4 sm:grid-cols-2"><ClinicSelect aria-label="Κατάσταση υπενθυμίσεων στη σελίδα" value={filter} onChange={e=>setFilter(e.target.value)}><option value="all">Όλες στη σελίδα</option><option value="active">Ενεργές</option><option value="overdue">Πέρασε η ημερομηνία</option><option value="dismissed">Απορριφθείσες</option></ClinicSelect><ClinicInput aria-label="Αναζήτηση υπενθυμίσεων" placeholder="Αναζήτηση στη σελίδα…" value={query} onChange={e=>setQuery(e.target.value)} /></div>
      <div className="hidden grid-cols-[1.6fr_1fr_140px_170px] gap-4 border-b border-ink-200 bg-ink-50 px-5 py-2 text-xs text-ink-500 lg:grid"><span>Υπενθύμιση</span><span>Κατοικίδιο</span><span>Ημερομηνία</span><span>Κατάσταση</span></div>
      {loading ? <ClinicLoading /> : error ? <div role="alert" className="p-5 text-sm text-red-700">{error}<ClinicButton className="ml-2" onClick={refetch}>Επανάληψη</ClinicButton></div> : visible.length ? visible.map(r=><button key={r.id} onClick={()=>{setSelected(r);setConfirm(false);setActionError('');}} className="grid w-full gap-3 border-b border-ink-100 px-4 py-4 text-left hover:bg-ink-50 focus-visible:outline-clinic-600 sm:px-5 lg:grid-cols-[1.6fr_1fr_140px_170px] lg:items-center lg:gap-4">
        <span className="min-w-0"><span className="block break-words text-sm font-semibold text-ink-900">{r.title}</span><span className="mt-1 block text-xs text-ink-500">{types[r.type] || r.type}{r.vet_name ? ` · ${r.vet_name}` : ''}</span></span>
        <span className="flex min-w-0 items-center gap-2"><ClinicAvatar name={r.pet_name || 'Κατοικίδιο'} imageUrl={r.pet_image_url}/><span className="truncate text-sm text-ink-700">{r.pet_name || 'Κατοικίδιο'}</span></span>
        <time className="text-xs text-ink-600">{date(r.due_date)}</time><span className="flex items-center justify-between gap-2"><span className={`w-fit rounded-md px-2 py-1 text-xs ${r.is_dismissed ? 'bg-ink-100 text-ink-500' : overdue(r) ? 'bg-amber-50 text-amber-800' : 'bg-clinic-100 text-clinic-800'}`}>{status(r)}</span><span aria-hidden="true" className="text-ink-400">↗</span></span>
      </button>) : <div className="px-5 py-12 text-center"><h3 className="text-sm font-semibold text-ink-900">{reminders.length ? 'Δεν βρέθηκαν αποτελέσματα στη σελίδα' : 'Δεν υπάρχουν υπενθυμίσεις'}</h3><p className="mt-2 text-sm text-ink-500">{reminders.length ? 'Δοκιμάστε άλλη αναζήτηση ή φίλτρο.' : 'Οι υπενθυμίσεις του κτηνιάτρου θα εμφανίζονται εδώ.'}</p></div>}
      <div className="px-4"><ClinicPagination page={page} totalPages={totalPages} onPageChange={p=>{setPage(p);setQuery('');}} /></div>
    </section>
    {selected && <ClinicDrawer label="Λεπτομέρειες υπενθύμισης" busy={busy} onClose={()=>setSelected(null)}><div className="space-y-5 p-5">
      <div className="flex justify-end"><ClinicButton disabled={busy} onClick={()=>setSelected(null)}>Κλείσιμο ×</ClinicButton></div>
      <header><p className="text-xs font-medium text-clinic-700">{types[selected.type] || selected.type}</p><h2 className="mt-2 break-words text-lg font-semibold text-ink-900">{selected.title}</h2></header>
      <div className="flex items-center gap-3 rounded-xl border border-ink-200 p-4"><ClinicAvatar large name={selected.pet_name || 'Κατοικίδιο'} imageUrl={selected.pet_image_url}/><div className="min-w-0"><p className="break-words text-sm font-semibold">{selected.pet_name || 'Κατοικίδιο'}</p><p className="mt-1 text-xs text-ink-500">Από: {selected.vet_name || 'Κτηνίατρο'}</p></div></div>
      <dl className="grid gap-3 text-sm"><div><dt className="text-ink-500">Προγραμματισμένη ημερομηνία</dt><dd className="mt-1 font-medium">{date(selected.due_date)}</dd></div><div><dt className="text-ink-500">Κατάσταση</dt><dd>{status(selected)}</dd></div></dl>
      <section className="border-t border-ink-200 pt-4"><h3 className="text-sm font-semibold">Μήνυμα κτηνιάτρου</h3><p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-ink-600">{selected.message || 'Δεν έχει προστεθεί επιπλέον μήνυμα.'}</p></section>
      {actionError && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{actionError}</p>}
      {!selected.is_dismissed && (confirm ? <section className="rounded-xl border border-red-200 p-4"><h3 className="text-sm font-semibold">Απόρριψη υπενθύμισης;</h3><p className="mt-2 text-sm text-ink-600">Ο κτηνίατρος θα ειδοποιηθεί για την απόρριψη.</p><div className="mt-4 flex flex-wrap gap-2"><ClinicButton disabled={busy} onClick={()=>{setConfirm(false);setActionError('');}}>Πίσω</ClinicButton><ClinicButton variant="danger" disabled={busy} onClick={dismiss}>{busy ? 'Απόρριψη…' : 'Επιβεβαίωση απόρριψης'}</ClinicButton></div></section> : <div className="flex flex-wrap gap-2 border-t border-ink-200 pt-4"><Link href="/owner/book" className="rounded-lg bg-clinic-600 px-3 py-2 text-sm font-medium text-white">Κράτηση ραντεβού</Link><ClinicButton variant="danger" onClick={()=>setConfirm(true)}>Απόρριψη</ClinicButton></div>)}
    </div></ClinicDrawer>}
  </div>;
}
